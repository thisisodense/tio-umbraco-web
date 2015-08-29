angular.module("umbraco").controller("Concorde.RestoreDialogController", function ($scope, deployService, taskManService,  $q, $timeout) {
    
    var alternativeTarget = undefined;

    //fetch environment meta data
    deployService.environment().then(function(response){
        $scope.environment = response.data;
    });
    
    //handle task manager updates
    var onTaskUpDate = function(event, task){
        $scope.currentTask = task;  
    };

    //handle task completion
    var onTaskComplete = function(event, task){
        $scope.currentTask = task;
        $scope.step = "restored";
    };	

    //when a task updates
    taskManService.events.on("task-update", onTaskUpDate);

    //when a task completes, move to done
    taskManService.events.on("task-complete", onTaskComplete);

    $scope.$on(
        "$destroy",
        function (event) {
            taskManService.events.off("task-update", onTaskUpDate);
            taskManService.events.off("task-complete", onTaskComplete);
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
    	deployService.pullAndRestoreRemoteContent(alternativeTarget);
    	$scope.step = "restoring";
    };

});