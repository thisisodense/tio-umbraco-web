angular.module("umbraco.services", []);
angular.module("umbraco.nonodes", ["umbraco.services"])
	.controller("Umbraco.NoNodes.Controller", function($scope, $q, $timeout, deployService){

		//generic logging for errors
	    function handleError(err){
	        //TODO: we need to handle the error correctly here... 

	        if (err && err.data) {
	            //need to set it to .data because this handles the error
	            //bubbling up from $http and from the taskman event
	            err = err.data;
	        }

	        if (err) {
	            var msg = {
	                message: err.Message,
	                exception: err.ExceptionMessage,
	                type: err.ExceptionType,
	                stack: err.StackTrace
	            }
	            $scope.currentTask.exception = msg;
	        }
	        else {
	            $scope.currentTask.exception = err;
	        }
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
		            }, handleError);
	    	})
	    	.error(function (err) {

				$scope.authErrorLogin = login;	    		
	    		$scope.authError = true;
	    		$scope.submitting = false;

	    		handleError(err);
	    	});
	    };

        $scope.skipRestore = function() {
            $scope.step = "doneSkippedRestore";
            $scope.ready = true;
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
	            }, handleError);

	    	}).error(handleError);
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