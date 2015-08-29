angular.module("umbraco.services", []);
angular.module("umbraco.nonodes", ["umbraco.services"])
	.controller("Umbraco.NoNodes.Controller", function($scope, $q, $timeout, deployService){

		//generic logging for errors
	    function _err(){
	    	//we need to handle the error here... 
	    }

		$scope.remoteContent = function(login, password){

			$scope.submitting = true;

	    	deployService.pullRemoteContentToLocal(login, password).success(function(response){
					$scope.authError = false;
					$scope.step = "remoteContent";

		            //we get a task back
		            $scope.currentTask = response;

		            //keep monitoring till its done
		            $scope.monitorCurrentTask().then(function(){ 
		                $scope.step = "restoreData";
		                $scope.restoreData();
		            }, _err);
	    	})
	    	.error( function(err){
				$scope.authErrorLogin = login;	    		
	    		$scope.authError = true;
	    		$scope.submitting = false;
	    	});
	    };


	    $scope.restoreData = function(){
			
	    	$scope.step = "restoreWebsite";
	    	$scope.ready = false;

	    	deployService.restoreWebSiteToLocal().success(function(response){
	    		
	            //we get a task back
	            $scope.currentTask = response;

	            //keep monitoring till its done
	            $scope.monitorCurrentTask().then(function(){ 
	                $scope.step = "done";
	                $scope.ready = true;
	            }, _err);

	    	}).error(_err);
	    };


	    //util method to monitor task progression
	    $scope.monitorCurrentTask = function () {
	        var deferred = $q.defer();
	        var check = function () {
	            $timeout(function () {
	                deployService.taskStatus($scope.currentTask.id).success(function (response) {

	                    $scope.currentTask = response;

	                    //the task is out of the current tasks queue
	                    if (response.complete) {

	                        //it is out of the current task list because its either done or has an error
	                        if (response.error) {
	                            deferred.reject(response);
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

	});