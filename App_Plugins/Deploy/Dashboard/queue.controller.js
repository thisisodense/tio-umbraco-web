angular.module("umbraco").controller("Concorde.QueueDashboardController", function ($scope, deployService, $q, $timeout) {

    function _err(error) {

    };

    //load env
    deployService.environment().then(function(response){
        $scope.environment = response.data;    
    });

    //if there is a deploy running, set it in working mode
    deployService.taskManagerStatus().success(function (tasks) {
        if (tasks.length > 0) {
            $scope.step = "working";
            $scope.currentTask = tasks[0];

            //monitor till done
            $scope.monitorCurrentTask().then(function (response) {
                //if its packaging, it should continue with deployning
                if (response.name === "Umbraco.Courier.Core.Tasks.PackagingTask") {
                    $scope.deploy();
                } else {
                    //it might be deploying then it should just say done
                    $scope.step = "done";
                }
            });
        } else {

            //get the current manifest the editor is adding items to
            deployService.getManifest().success(function (response) {
                $scope.manifest = response;

                if(response.Providers.length === 0){
                    //$scope.clear();
                }

            });
        }
    });

    $scope.package = function(deployModel){ 
        $scope.step = "pre-collect";
        
        deployService.package().success( function(response){

            //we will get an initial task back we can track progress on
            $scope.currentTask = response;
            $scope.monitorCurrentTask().then(function(){
                
                //if the task is completed
                //load the deployment
                deployService.getDeployment().success( function(response){

                    $scope.manifest = response;

                    if(Object.keys($scope.manifest.notAllowed).length > 0){
                        $scope.step = "problems";
                    }else{
                        if(Object.keys($scope.manifest.deployment).length == 0){
                             $scope.step = "empty";
                          }else{
                            $scope.step = "collect";
                        }
                    }

                }).error(_err);

            }, _err);

        }).error(_err);
    };

    

    $scope.deploy = function () {
        $scope.step = "deploy";
        deployService.deployQueue().success(function (response) {

            //we get a task back
            $scope.currentTask = response;

            $scope.monitorCurrentTask().then(function () {
                $scope.step = "done";
            }, _err);

        }).error(_err);
    };

    $scope.clear = function () {
        deployService.clearQueue().success(function () {
            $scope.step = "empty";
            $scope.manifest = undefined;
        }).error(_err);
    };

    $scope.monitorCurrentTask = function () {
        var deferred = $q.defer();
        var check = function () {
            $timeout(function () {
                deployService.taskStatus($scope.currentTask.id).success(function (response) {
                    $scope.currentTask = response;

                    //the task is out of the current tasks queue
                    if (response.complete) {
                        //it is out current task list because its either done or has an error
                        if (response.error) {
                            $scope.step = "error";
                            deferred.reject(response.currentActivity);
                        } else {
                            deferred.resolve(response);
                        }
                    } else {
                        //if not complete, keep checking
                        check();
                    }
                }).error(function (err) {
                    deferred.reject(err);
                });
            }, 1000);
        };

        check();
        return deferred.promise;
    };

    $scope.providerName = function(guid){
        return deployService.itemProviderName(guid);
    };


});