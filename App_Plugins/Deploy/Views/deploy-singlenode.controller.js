angular.module("umbraco").controller("Concorde.DeploySingleNodeController", function ($scope, deployService, navigationService, taskManService, $q, $timeout) {

    var vm = this;
    vm.error = {};
    vm.deploystep = "singlenode";

    //Handles errors and shows in the UI
    function handleError(err) {

        if (err && err.data) {
            //need to set it to .data because this handles the error
            //bubbling up from $http and from the taskman event
            err = err.data;
        }

        if (err) {
            if (err.ExceptionMessage) {
                vm.error.message = err.Message;
                vm.error.exceptionMessage = err.ExceptionMessage;
                vm.error.type = err.ExceptionType;
                vm.error.stackTrace = err.StackTrace;
                vm.deploystep = "exception";
            }
            else {
                vm.deploystep = "errors";
                vm.errors = err.errors;
            }
        }
    }

    //handle task manager updates
    var onTaskUpDate = function (event, task) {
        vm.currentTask = task;
        if (vm.deploystep === "empty-queue" || vm.deploystep === "done") {
            vm.deploystep = "working";
        }
    };

    var onTaskComplete = function (event, task) {
        vm.currentTask = task;

        //when a task completes, the UI might do different things...

        //we are done packaging and now needs to show the user the packaged items
        if (task.name === "Umbraco.Courier.Core.Tasks.PackagingTask") {
            vm.showPackagedItems();
        }

        //we are done extracting / deploying to a target, we will just show the down page
        if (task.name === "Umbraco.Courier.Core.Tasks.ExtractionTask") {
            vm.deploystep = "done";
        }

        //we just completed a restore, should we show anything? - we cant tell the difference between
        //nonodes restore and dialog restore since its the same task
        if (task.name === "Concorde.CacheHandler.Tasks.InitialExtractionTask") {
            vm.deploystep = "restored";
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
    taskManService.events.on("error", function (evt, msg) {
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

    //add item to the manifest to be deployed
    vm.queue = function (deployModel, pck) {
        deployModel.package = pck;

        deployService.addToManifest(deployModel).success(function (response) {
            //we will get an initial task back
            vm.currentTask = response;
            vm.deploystep = "pre-collect";

        }).error(handleError);

    };

    //package the collected items in the manifest
    vm.package = function () {

        //tell the service there is a subscriber
        if (!subscribed) {
            taskManService.subscribe();
            subscribed = true;
        }

        deployService.package().success(function (response) {
            vm.deploystep = "pre-collect";
            vm.currentTask = response;
        }).error(handleError);
    };

    //show the items packaged by courier
    vm.showPackagedItems = function () {
        //if the task is completed
        //load the deployment
        deployService.getDeployment().success(function (response) {

            //iterate through all the returned data for better view
            var notallowed = [];
            angular.forEach(response.notAllowed, function (value, key) {
                var provider = deployService.itemProviderName(key);
                provider.items = value;
                notallowed.push(provider);
                response.notAllowed = notallowed;
            });

            vm.manifest = response;

            if (Object.keys(vm.manifest.notAllowed).length > 0) {
                vm.deploystep = "problems";
            } else {
                if (Object.keys(vm.manifest.deployment).length === 0) {
                    deployService.clearQueue();
                    vm.deploystep = "empty";
                } else {
                    vm.deploystep = "collect";
                }
            }
        }).error(handleError);
    };

    //deploy the packaged revision to the remote host
    $scope.deploy = function () {
        vm.deploystep = "deploy";
        deployService.deployQueue().success(function (response) {
            //we get a task back
            vm.currentTask = response;
        }).error(handleError);
    };

    //clear the collected changes to start over
    $scope.clear = function () {
        navigationService.hideDialog();        
    };

   //package the collected items in the manifest
    $scope.package = function () {

        //tell the service there is a subscriber
        if (!subscribed) {
            taskManService.subscribe();
            subscribed = true;
        }

    	deployService.package().success( function(response){
            vm.deploystep = "pre-collect";
            vm.currentTask = response;
    	}).error(handleError);
    };

    

    $scope.providerName = function (guid) {
        return deployService.itemProviderName(guid);
    };

    //first get the environment data
    //fetch environment meta data
    deployService.environment().then(function (response) {

        vm.environment = response.data;
        vm.ui = getUiObject(vm.environment);

        //on init, check if a task is running already
        if (taskManService.currentTask && !taskManService.currentTask.complete) {
            vm.currentTask = taskManService.currentTask;
            vm.deploystep = "working";
        } else {
            //set a reference to the inherited currentNode (from parent scope yuck)
            vm.currentNode = $scope.currentNode;

            //if no tasks are running
            //if there is no current node, it means we are in dashboard mode
            if (vm.currentNode) {
                //Deployment model
                vm.deployment = {
                    rootId: $scope.currentNode.id,
                    includeDescendants: false,
                    "package": false
                };

                //if we are deploying media, set the media provider
                if (vm.currentNode.section === "media") {
                    vm.deployment.provider = "d8e6ad87-e73a-11df-9492-0800200c9a66";
                }

                vm.nodeName = vm.currentNode.name;
                vm.hasChildren = vm.currentNode.hasChildren;
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