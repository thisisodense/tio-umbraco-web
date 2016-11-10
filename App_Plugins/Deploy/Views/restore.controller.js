angular.module("umbraco").controller("Concorde.RestoreDialogController", function ($scope, deployService, taskManService, $q, $timeout) {

    $scope.error = {};
    var currentListener = null;    
    var alternativeTarget = null;

    /**
    * Subscribes to the task manager for the given queueId
    * @returns {} 
    */
    function subscribe(queueId) {
        if (currentListener) {
            throw "There is already a subscriber";
        }
        currentListener = taskManService.subscribe(queueId);
        configureListener(currentListener);
    }

    /**
    * Unsubscribes from the task manager
    * @returns {} 
    */
    function unsubscribe() {
        if (currentListener) {
            taskManService.unsubscribe(currentListener);
            currentListener = null;
        }
    }

    /**
    * Sets up the listener callbacks and starts listening
    * @param {} listener 
    * @returns {} 
    */
    function configureListener(listener) {
        listener.onComplete = onTaskComplete;
        listener.onUpdate = onTaskUpDate;
        listener.onError = handleError;

        //start it!
        listener.start();
    }

    //Handles errors and shows in the UI
    function handleError(err) {

        if (err.status === 500) {
            //this is a ysod/unhandled exception
            $scope.error = {
                message: err.data.Message,
                exceptionMessage: err.data.ExceptionMessage,
                stackTrace: err.data.StackTrace
            }
            $scope.step = "exception";
        }
        else {
            $scope.step = "errors";
            $scope.error = err.data;
        }
    }

    function init() {

        //fetch environment meta data
        deployService.environment().then(function (response) {
            $scope.environment = response.data;

            if ($scope.environment.destination === "" && $scope.environment.available.length > 0) {

                //if there is no destination - but are available envs - pick the first one

                $scope.changeDestination($scope.environment.available[0]);
            }
            else if ($scope.environment.available.length === 0) {

                // if theres no environments to deploy to, we show a message in stead

                $scope.step = "noenvironments";
            }

            //first check if there is a current task executing
            deployService.taskStatus(null)
                .then(function (taskResponse) {

                    if (taskResponse && taskResponse.data && taskResponse.data !== "null" && taskResponse.data.complete !== true) {
                        $scope.currentTask = taskResponse.data;

                        $scope.step = "working";
                        subscribe(taskResponse.data.id);
                    }
                    else {
                        if (!$scope.environment.allowRestoreDialog) {
                            $scope.step = "noenvironments";
                        }
                        else if ($scope.environment.pendingRestoreAvailable === true) {
                            $scope.step = "pendingrestore";
                        }
                    }
                                    
                });

        }, handleError);
    }

    //handle task manager updates
    function onTaskUpDate(task) {
        $scope.currentTask = task;
    };

    //handle task completion
    function onTaskComplete(task) {
        $scope.currentTask = task;
        $scope.step = "restored";
    };   

    $scope.changeDestination = function (env) {
        $scope.environment.destination = env.name;
        alternativeTarget = env.name;
    };

    $scope.restore = function () {
        deployService.pullAndRestoreRemoteContent(alternativeTarget).then(function(response) {

            $scope.currentTask = response.data;
            $scope.step = "restoring";

            subscribe(response.data.id);

        }, handleError);
        
    };

    $scope.skipPendingRestore = function () {
        $scope.step = "";
    };

    $scope.restoreContentFromDisk = function () {
        deployService.restoreContentFromDisk().then(function(response) {
        
            $scope.currentTask = response.data;
            $scope.step = "restoring";

            subscribe(response.data.id);

        }, handleError);
        
    };

    $scope.$on(
        "$destroy",
        function (event) {
            unsubscribe();
        }
    );

    init();
});