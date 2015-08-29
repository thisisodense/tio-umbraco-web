angular.module("umbraco").controller("Concorde.DeployDialogController", function ($scope, deployService, taskManService, $q, $timeout) {
    
    //fetch environment meta data
    deployService.environment().then(function(response){
        $scope.environment = response.data;    
    });

    //generic logging for errors
    function _err(err){
        $scope.currentError = err;
    }

    //handle task manager updates
    var onTaskUpDate = function(event, task){
        $scope.currentTask = task;
        if($scope.step === "empty-queue" || $scope.step === "done"){
          $scope.step = "working";  
        }
    };

    var onTaskComplete = function(event, task){
        $scope.currentTask = task;

        //when a task completes, the UI might do different things...

        //we are done packaging and now needs to show the user the packaged items
        if (task.name === "Umbraco.Courier.Core.Tasks.PackagingTask") {
            $scope.showPackagedItems();
        }

        //we are done extracting / deploying to a target, we will just show the down page
        if (task.name === "Umbraco.Courier.Core.Tasks.ExtractionTask") {
            $scope.step = "done";
        }

        //we just completed a restore, should we show anything? - we cant tell the difference between
        //nonodes restore and dialog restore since its the same task
        if (task.name === "Concorde.CacheHandler.Tasks.InitialExtractionTask") {
            $scope.step = "restored";
        }

    };

    //when a task updates
    taskManService.events.on("task-update", onTaskUpDate);

    //when a task completes, move to done, or move to showing what has been packaged
    taskManService.events.on("task-complete", onTaskComplete);

    $scope.$on(
        "$destroy",
        function (event) {
            taskManService.events.off("task-update", onTaskUpDate);
            taskManService.events.off("task-complete", onTaskComplete);
        }
    );


    $scope.reloadQueue = function(){
        //get the current manifest the editor is adding items to
            deployService.getManifest().success(function (response) {
                $scope.manifest = response;

                if(response.Providers.length === 0){
                    $scope.clear();
                }else{
                    $scope.step = "current-queue";
                }
            });
    };


    //add item to the manifest to be deployed
    $scope.queue = function (deployModel, package) {
        deployModel.package = package;

        deployService.addToManifest(deployModel).success(function (response) {
            //we will get an initial task back
            $scope.currentTask = response;
            $scope.step = "pre-collect";
        });

    };




    //package the collected items in the manifest
    $scope.package = function(){	
    	deployService.package().success( function(response){
            $scope.step = "pre-collect";
            $scope.currentTask = response;
    	}).error(_err);
    };

    //show the items packaged by courier
    $scope.showPackagedItems = function(){
        //if the task is completed
        //load the deployment
        deployService.getDeployment().success( function(response){

            $scope.manifest = response;

            if(Object.keys($scope.manifest.notAllowed).length > 0){
                $scope.step = "problems";
            }else{
                if(Object.keys($scope.manifest.deployment).length == 0){
                     deployService.clearQueue();
                     $scope.step = "empty";
                  }else{
                    $scope.step = "collect";
                }
            }
        }).error(_err);
    };

    //deploy the packaged revision to the remote host
    $scope.deploy = function(){
    	$scope.step = "deploy";
    	deployService.deployQueue().success(function(response){
            //we get a task back
            $scope.currentTask = response;
    	}).error(_err);
    };

    //clear the collected changes to start over
    $scope.clear = function () {
        deployService.clearQueue().success(function () {
            $scope.step = "empty-queue";
            $scope.manifest = undefined;
        }).error(_err);
    };


    $scope.providerName = function(guid){
        return deployService.itemProviderName(guid);
    }

    //on init, check if a task is running already
    if(taskManService.currentTask && !taskManService.currentTask.complete){
        $scope.currentTask = taskManService.currentTask;
        $scope.step = "working";
    }else{

        //if no tasks are running
        //if there is no current node, it means we are in dashboard mode
        if($scope.currentNode){
            //Deployment model
            $scope.deployment = {
                rootId: $scope.currentNode.id, 
                includeDescendants: false,
                package: false
           };

           //if we are deploying media, set the media provider
           if($scope.currentNode.section === "media"){
               $scope.deployment.provider = "d8e6ad87-e73a-11df-9492-0800200c9a66";
           }    

           $scope.nodeName = $scope.currentNode.name;
           $scope.hasChildren = $scope.currentNode.hasChildren;

        }else{
            $scope.onDashboard = true;
            $scope.reloadQueue();
        } 
    }



});