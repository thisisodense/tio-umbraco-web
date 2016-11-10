angular.module("umbraco.directives")
    .directive('flowDeploy', function (deployService, taskManService) {
        return {
            transclude: true,
            restrict: 'E',
            replace: true,
            templateUrl: '/app_plugins/deploy/views/flow-deploy.html',
            scope: {
                currentTask: "=",
                environment: "=",
                user: "=",
                onOk: "&?",
                isDialog: "=?"
            },
            link: function (scope, element, attrs) {

                //This is used to know if this current directive is the one performing the deployment, otherwise
                // if events are triggered we will know it's another instance performing the actual deployment and we're just listening in.
                var deploying = false;                
                var currentListener = null;

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

                    deploying = false;

                    if (err.status === 500) {
                        //this is a ysod/unhandled exception
                        scope.error = {
                            message: err.data.Message,
                            exceptionMessage: err.data.ExceptionMessage,
                            stackTrace: err.data.StackTrace
                        }
                        scope.deploystep = "exception";
                    }
                    else {
                        scope.deploystep = "errors";
                        scope.error = err.data ? err.data : err;
                    }

                    //TODO: Should we clear the queue here?
                }

                /**
                 * Clear the collected changes to start over
                 * @returns {} 
                 */
                function clearQueue() {
                    return deployService.clearQueue().then(function () {
                        reset();
                    }, handleError);
                }

                /**
                 * Resets variables to defaults
                 * @returns {} 
                 */
                function reset() {
                    scope.deploystep = "";
                    scope.manifest = null;
                    scope.deploymentInfo = null;
                    scope.editorChanges = 0;
                }

                function reloadQueue()
                {
                    //get the current manifest the editor is adding items to
                    deployService.getManifest().then(function (response) {
                        if (response.data && response.data !== "null") {
                            scope.manifest = response.data;
                            scope.editorChanges = 0;
                            _.each(scope.manifest.providers,
                                function(provider) {
                                    if (provider.IncludeAll === true) {
                                        scope.editorChanges++;
                                    }
                                    scope.editorChanges += provider.Items.length;
                                    provider.name = deployService.itemProviderName(provider.Id).name;
                                });

                            if (response.data.providers.length === 0) {
                                clearQueue();
                            }
                            else {
                                scope.deploystep = "current-queue";
                                wait();
                            }
                        }
                        else {
                            scope.deploystep = "";
                            wait();
                        }
                    }, handleError);
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
                 * Subscribes to the task manager to wait to see if a task has started (based on another user or dialog)
                 *  as long as there isn't already a subscriber.
                 * @returns {} 
                 */
                function wait() {

                    if (!currentListener || currentListener.active === false) {
                        currentListener = taskManService.wait();
                        configureListener(currentListener);
                    }
                }

                /**
                 * Initialize the directive
                 * @returns {} 
                 */
                function init() {

                    if (scope.currentTask) {
                        //if an explicit task has been passed in then we just want to monitor it and we need to set deploying to true
                        // since that is the point of passing in an explicit currentTask
                        deploying = true;
                        if (scope.currentTask.complete) {
                            //we're going to assume it's a packaging task, in which case we'll do what we'd normally do when the packaging
                            // task is completed.
                            onTaskComplete(scope.currentTask);
                        }
                        else {
                            scope.deploystep = "working";
                            subscribe(scope.currentTask.id);
                        }
                    }
                    else {
                        //first check if there is a current task executing
                        deployService.taskStatus(null)
                            .then(function (response) {
                                //if there is a currently executing task passed in show the working step
                                if (response && response.data && response.data !== "null" && response.data.complete !== true) {
                                    scope.deploystep = "working";
                                    subscribe(response.data.id);
                                }
                                else {
                                    reloadQueue();
                                }
                            });
                    }
                }

                /**
                 * handle task manager updates
                 * @param {} task 
                 * @returns {} 
                 */
                function onTaskUpDate(task) {
                    scope.currentTask = task;

                    if (scope.deploystep !== "working" && task.complete !== true) {
                        scope.deploystep = "working";

                        //subscribe if we don't have a listener, this will occur if the task starts in another tab/window/dialog, etc...
                        // if the currentListener is just 'waiting' this means it will not be assigned a taskId, so we need to check
                        // for that too
                        if (!currentListener || !currentListener.taskId) {
                            //ensure we've unsubscribed first - normally this would be a 'wait' 
                            unsubscribe();
                            //subscribe to the task being updated
                            subscribe(task.id);
                        }
                    }
                    
                };

                /**
                 * handle task manager complete
                 * @param {} task 
                 * @returns {} 
                 */
                function onTaskComplete(task) {
                    scope.currentTask = task;
                    
                    // if we are 'waiting' so we need to keep doing just that and keep polling
                    if (currentListener && !currentListener.taskId) {
                        wait();
                    }
                    else {
                        //when a task completes, the UI might do different things...

                        switch (task.name) {
                            case "Umbraco.Courier.Core.Tasks.PackagingTask":

                                //we are done packaging and now needs to show the user the packaged items
                                // only proceed to execute the showPackagedItems if this directive is the one that actually started the deployment, otherwise
                                // this directive instance is just listening.

                                //if this task is the one were listening for
                                if (scope.currentTask.id === currentListener.taskId) {
                                    if (deploying === true) {
                                        deploying = false;
                                        showPackagedItems(scope.currentTask.id);
                                    }
                                    else if (scope.deploystep === "working") {
                                        //This will occur if this directive is just listening to changes. At this point the 'working' view will be shown but that
                                        // isn't really helpful for this listener anymore. We could go back to the main screen, but then it will probably jump back to 
                                        // in progress when the other directive instance presses the continue button. But i guess that's the only thing we can do.

                                        //show 'done' i guess
                                        scope.deploystep = "done";
                                        //keep polling
                                        wait();
                                    }
                                }

                                break;
                            case "Umbraco.Courier.Core.Tasks.ExtractionTask":

                                //we are done extracting / deploying to a target, we will just show the done page

                                scope.deploystep = "done";
                                deploying = false;

                                break;
                            case "Concorde.CacheHandler.Tasks.InitialExtractionTask":
                                //we just completed a restore, should we show anything? - we cant tell the difference between
                                //nonodes restore and dialog restore since its the same task

                                scope.deploystep = "restored";
                                deploying = false;

                                break;
                        }
                    }
                };

                /**
                 * show the items packaged by courier
                 * @returns {} 
                 */
                function showPackagedItems(queueId) {

                    //load the deployment
                    deployService.getDeployment(queueId).then(function (response) {

                        scope.deploymentInfo = response.data;

                        //iterate through all the returned data for better view
                        var notallowed = [];
                        angular.forEach(response.data.notAllowed, function (value, key) {
                            var provider = deployService.itemProviderName(key);
                            provider.items = value;
                            notallowed.push(provider);
                            response.data.notAllowed = notallowed;
                        });

                        if (Object.keys(response.data.notAllowed).length > 0) {
                            scope.deploystep = "problems";
                            scope.notAllowed = notallowed;
                        }
                        else {
                            if (Object.keys(response.data.deployment).length === 0) {
                                //nothing to deploy, clear the queue
                                deployService.clearQueue(queueId);
                                scope.deploystep = "empty";
                            }
                            else {
                                scope.deploystep = "collect";
                            }
                        }
                    }, handleError);
                    
                };

                //when a change is added
                deployService.events.on("add", reloadQueue);

                //tracks any exceptions/errors
                scope.error = {};
                scope.deploystep = "";
                //tracks the syncing issues between environments (i.e. schema items that are not up to date)
                scope.deploymentInfo = null;
                scope.manifest = null;

                if (!scope.editorChanges) {
                    scope.editorChanges = 0;
                }

                scope.ok = function() {
                    //if a callback is defined, use it, otherwise reset (default action)
                    if (angular.isDefined(attrs.onOk)) {
                        scope.onOk({});
                    }
                    else {
                        reset();
                    }
                }

                scope.clear = clearQueue;
               
                /**
                 * deploy the packaged revision to the remote host
                 * @returns {} 
                 */
                scope.deploy = function (queueId) {
                    scope.deploystep = "deploy";

                    //unsubscribe, we need to resubscribe later with the correct task id
                    unsubscribe();

                    deployService.deployQueue(queueId).then(function (response) {
                        deploying = true;

                        //we get a task back - this task will have a new Id!
                        scope.currentTask = response.data;
                        subscribe(response.data.id);

                    }, handleError);
                }

                //reload the queue
                scope.reloadQueue = reloadQueue;

                /**
                 * package the collected items in the manifest
                 * @returns {} 
                 */
                scope.package = function (queueId) {
                    
                    //unsubscribe, we need to resubscribe later with the correct task id
                    unsubscribe();

                    deployService.package(queueId).then(function (response) {
                        scope.deploystep = "pre-collect";
                        deploying = true;

                        ////store the task we've started
                        //managedTaskId = response.data.id;
                        scope.currentTask = response.data;
                        subscribe(response.data.id);

                    }, handleError);
                };

                

                scope.$on(
                    "$destroy",
                    function (event) {
                        deployService.events.off("add", reloadQueue);
                        unsubscribe();
                    }
                );

                init();

            }
        };
    });