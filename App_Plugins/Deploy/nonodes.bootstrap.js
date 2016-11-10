angular.module("umbraco.services", []);
angular.module("umbraco.nonodes", ["umbraco.services"])
	.controller("Umbraco.NoNodes.Controller", function($scope, $q, $timeout, deployService){

		//handling of errors during restore
	    function handleException(err) {
            if (err.status === 500) {
                //this is a ysod/unhandled exception
                $scope.currentTask.exception = {
                    currentActivity: err.data.Message,
                    description: err.data.ExceptionMessage,
                    exception: err.data.StackTrace
                }
            }
            else {
                $scope.currentTask.exception = err.data;
            }
	    }

        $scope.showTrace = function(obj) {
            obj.traceVisible = true;
        }

		$scope.remoteContent = function(login, password){

			$scope.submitting = true;

		    deployService.pullRemoteContentToLocal(login, password).then(function (response) {
					$scope.authError = false;
					$scope.step = "remoteContent";

		            //we get a task back
		            $scope.currentTask = response.data;

		            //keep monitoring till its done
		            $scope.monitorCurrentTask().then(function(){ 
		                $scope.step = "restoreData";
		                $scope.restoreData();
		            }, handleException);
	    	}, function(err) {

                //could not auth
				$scope.authErrorLogin = login;	    		
	    		$scope.authError = true;
	    		$scope.submitting = false;
	    	});
	    };

        $scope.skipRestore = function() {
            $scope.step = "doneSkippedRestore";
            $scope.ready = true;
        };

	    $scope.restoreData = function(){
			
	    	$scope.step = "restoreWebsite";
	    	$scope.ready = false;

	    	deployService.restoreWebSiteToLocal().then(function(response){
	    		
	            //we get a task back
	            $scope.currentTask = response.data;

	            //keep monitoring till its done
	            $scope.monitorCurrentTask().then(function(){ 
	                $scope.step = "done";
	                $scope.ready = true;
	            }, handleException);

	    	});
	    };


	    //util method to monitor task progression
	    $scope.monitorCurrentTask = function () {
	        var deferred = $q.defer();
	        var check = function () {
	            $timeout(function () {
	                deployService.taskStatus($scope.currentTask.id).then(function (response) {

	                    //"null" is returned when the server returns a null task status
	                    // we don't want to overwrite our current status with that.
	                    // It will become null if the current task id is lost in the remote tracking
                        // task list. In this case
                        if (response.data !== "null") {
                            $scope.currentTask = response.data;
                        }
                        //the task is out of the current tasks queue
                        if (response.data.complete) {

                            //it is out of the current task list because its either done or has an error
                            if (response.data.error) {
                                deferred.reject(response);
                            }
                            else {
                                deferred.resolve(response);
                            }

                        }
                        else {
                            //if not complete, keep checking
                            check();
                        }
                        
	                    
	                }, function(err) {
	                    deferred.reject(err);
	                });
	            }, 1000);
	        };

	        check();
	        return deferred.promise;
	    };

	});