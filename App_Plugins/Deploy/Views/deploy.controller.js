angular.module("umbraco").controller("Concorde.DeployDialogController", function ($scope, deployService, taskManService, $q, $timeout) {

    $scope.error = {};

    //Handles errors and shows in the UI
    function handleError(err) {

        if (err && err.data) {
            //need to set it to .data because this handles the error
            //bubbling up from $http and from the taskman event
            err = err.data;
        }

        if (err) {
            if (err.ExceptionMessage) {
                $scope.error.message = err.Message;
                $scope.error.exceptionMessage = err.ExceptionMessage;
                $scope.error.type = err.ExceptionType;
                $scope.error.stackTrace = err.StackTrace;
                $scope.step = "exception";
            }
            else {
                $scope.step = "errors";
                $scope.errors = err.errors;
            }
        }

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

    //tell the service there is a subscriber
    taskManService.subscribe();
    var subscribed = true;

    //when a task updates
    taskManService.events.on("task-update", onTaskUpDate);

    //when a task completes, move to done, or move to showing what has been packaged
    taskManService.events.on("task-complete", onTaskComplete);

    //when an error occurs in polling - this will be a critical error
    taskManService.events.on("error", function(evt, msg) {
        handleError(msg);

        //there's an error, we cannot continue or we'll overwrite the UI message that the user must see
        // if an error occurs, this is critical, we cannot swallow/hide issues.
        taskManService.unsubscribe();
        subscribed = false;
    });


    $scope.$on(
        "$destroy",
        function (event) {
            taskManService.events.off("task-update", onTaskUpDate);
            taskManService.events.off("task-complete", onTaskComplete);
            taskManService.unsubscribe();
            subscribed = false;
        }
    );


    $scope.reloadQueue = function () {

        //tell the service there is a subscriber
        if (!subscribed) {
            taskManService.subscribe();
            subscribed = true;
        }

        //get the current manifest the editor is adding items to
        deployService.getManifest().success(function (response) {
            $scope.manifest = response;

            if(response.Providers.length === 0){
                $scope.clear();
            }else{
                $scope.step = "current-queue";
            }
        }).error(handleError);
    };


    //add item to the manifest to be deployed
    $scope.queue = function (deployModel, pck) {
        deployModel.package = pck;

        deployService.addToManifest(deployModel).success(function (response) {
            //we will get an initial task back
            $scope.currentTask = response;
            $scope.step = "pre-collect";
        }).error(handleError);

    };

    //package the collected items in the manifest
    $scope.package = function () {

        //tell the service there is a subscriber
        if (!subscribed) {
            taskManService.subscribe();
            subscribed = true;
        }

    	deployService.package().success( function(response){
            $scope.step = "pre-collect";
            $scope.currentTask = response;
    	}).error(handleError);
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
                if(Object.keys($scope.manifest.deployment).length === 0){
                     deployService.clearQueue();
                     $scope.step = "empty";
                  }else{
                    $scope.step = "collect";
                }
            }
        }).error(handleError);
    };

    //deploy the packaged revision to the remote host
    $scope.deploy = function(){
    	$scope.step = "deploy";
    	deployService.deployQueue().success(function(response){
            //we get a task back
            $scope.currentTask = response;
    	}).error(handleError);
    };

    //clear the collected changes to start over
    $scope.clear = function () {
        deployService.clearQueue().success(function () {
            $scope.step = "empty-queue";
            $scope.manifest = undefined;
        }).error(handleError);
    };


    $scope.providerName = function(guid){
        return deployService.itemProviderName(guid);
    }

    //first get the environment data
    //fetch environment meta data
    deployService.environment().then(function (response) {

        $scope.environment = response.data;

        $scope.ui = getUiObject($scope.environment);

        //on init, check if a task is running already
        if (taskManService.currentTask && !taskManService.currentTask.complete) {
            $scope.currentTask = taskManService.currentTask;
            $scope.step = "working";
        }
        else {

            //if no tasks are running
            //if there is no current node, it means we are in dashboard mode
            if ($scope.currentNode) {
                //Deployment model
                $scope.deployment = {
                    rootId: $scope.currentNode.id,
                    includeDescendants: false,
                    "package": false
                };

                //if we are deploying media, set the media provider
                if ($scope.currentNode.section === "media") {
                    $scope.deployment.provider = "d8e6ad87-e73a-11df-9492-0800200c9a66";
                }

                $scope.nodeName = $scope.currentNode.name;
                $scope.hasChildren = $scope.currentNode.hasChildren;

            }
            else {
                $scope.onDashboard = true;
                $scope.reloadQueue();
            }
        }

    }, handleError);

    function getUiObject(environment) {
      var ui = {
        isDebug: environment.debug === true,
        isLocalEnvironment: environment.localEnvironment === true,
        userType: environment.userType,
        settingsSection: false,
        developerSection: false,
      };
      for (i = 0; i < environment.userAllowedSections.length; i++) {
        var allowedSection = environment.userAllowedSections[i];
        if (allowedSection === 'developer') {
          ui.developerSection = true;
        } else if (allowedSection === 'settings') {
          ui.settingsSection = true;
        }
      }
      return ui;
    }

});
