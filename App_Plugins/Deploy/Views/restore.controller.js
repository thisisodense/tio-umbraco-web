angular.module("umbraco").controller("Concorde.RestoreDialogController", function ($scope, deployService, taskManService,  $q, $timeout) {

    $scope.error = {};

    //Handles errors and shows in the UI
    function handleError(err) {
        $scope.step = "error";

        if (err && err.data) {
            //need to set it to .data because this handles the error
            //bubbling up from $http and from the taskman event
            err = err.data;
        }

        if (err) {
            $scope.error.message = err.Message;
            $scope.error.exceptionMessage = err.ExceptionMessage;
            $scope.error.type = err.ExceptionType;
            $scope.error.stackTrace = err.StackTrace;
        }
    }

    var alternativeTarget = undefined;

    //fetch environment meta data
    deployService.environment().then(function(response){
        $scope.environment = response.data;

        //if there is no destination - but are available envs - pick the first one
        if($scope.environment.destination === "" && $scope.environment.available.length > 0){
            $scope.changeDestination($scope.environment.available[0]);
        }

    }, handleError);

    //handle task manager updates
    var onTaskUpDate = function(event, task){
        $scope.currentTask = task;
    };

    //handle task completion
    var onTaskComplete = function(event, task){
        $scope.currentTask = task;
        $scope.step = "restored";
    };

    //tell the service there is a subscriber
    taskManService.subscribe();

    //when a task updates
    taskManService.events.on("task-update", onTaskUpDate);

    //when a task completes, move to done
    taskManService.events.on("task-complete", onTaskComplete);

    //when an error occurs in polling - this will be a critical error
    taskManService.events.on("error", function (evt, msg) {
        handleError(msg);
    });

    $scope.$on(
        "$destroy",
        function (event) {
            taskManService.events.off("task-update", onTaskUpDate);
            taskManService.events.off("task-complete", onTaskComplete);
            taskManService.unsubscribe();
        }
    );

    //on init, check if a task is running already
    if(taskManService.currentTask){
    	$scope.currentTask = taskManService.currentTask;

    	//if its one of our custom tasks, its part of the restore
    	if($scope.currentTask.name.indexOf("Concorde") >= 0){
    		$scope.step = "restoring";
    	}else{
    		$scope.step = "working";
    	}
    }

    $scope.changeDestination = function(env){
        $scope.environment.destination = env.name;
        alternativeTarget = env.name;
    };

    $scope.restore = function(){
        deployService.pullAndRestoreRemoteContent(alternativeTarget).error(handleError);
    	$scope.step = "restoring";
    };

});
