angular.module("umbraco.services").factory("taskManService",
	function ($timeout, $rootScope, deployService) {

	    var service = {
	        events: $({}),

	        currentTask: undefined,
	        latestTask: undefined,
	        active: false,
	        subscribers: 0,
            
	        subscribe: function () {
	            service.subscribers++;

	            //turn on the monitoring on first subscription
	            if (service.active === false) {
	                service.monitorTaskmanager();
	            }
	        },

	        unsubscribe: function () {

	            service.subscribers--;
	            
	            //this will turn of all polling
	            if (service.subscribers <= 0) {
	                service.active = false;
	                service.subscribers = 0;
	            }
	        },

	        monitorTaskmanager: function () {

	            var check = function () {
	                $timeout(function () {

	                    //only perform the http request if the user is logged in
	                    deployService.taskStatus().success(function (response) {

	                        if (response === "null" && service.currentTask !== undefined && service.currentTask !== null) {
                                //TODO: This shouldn't happen... but it seems to keep happening. In c# this would be because there
                                // is no more processed tasks in the collection but that shouldn't be the case.
                                // In this case, we're going to need to show the error screen with a custom error

                                service.events.trigger("error", {
                                    message: "An error occurred",
                                    exceptionMessage: "Could not capture the latest deployment status. In most cases your data will have been deployed.",
                                    type: "",
                                    stackTrace: ""
                                });
                                service.currentTask = undefined;
                            }
                            else {
                                //if response id is not equal to current task or current state

                                if (response !== "null" && !_.isEqual(response, service.latestTask)) {
                                    service.events.trigger("task-update", response);

                                    if (!service.currentTask || service.currentTask.id !== response.id) {
                                        service.events.trigger("task-new", response);
                                    }

                                    service.currentTask = response;

                                    //the task is out of the current tasks queue
                                    if (response.complete) {
                                        service.latestTask = response;
                                        service.currentTask = undefined;

                                        //it is our current task list because its done
                                        //NOTE: If a task had an error it would be handed by the error hander since
                                        // the request would return an error status.
                                        service.events.trigger("task-complete", response);
                                    }
                                    else if(response.error) {
                                        service.events.trigger("error", response);
                                    }
                                }

                                //keep checking if active
                                if (service.active === true) {
                                    check();
                                }
                            }


	                    }).error(function (err) {

	                        service.events.trigger("error", err);
	                        service.currentTask = undefined;
	                    });

	                }, 2000);
	            };

	            //only start the loop if it is not already active
	            if (service.active === false) {
	                //activate the service to start the monitor loop
	                service.active = true;
	                check(2000);
	            }
	        }
	    };

	    return service;

	}).run(function (taskManService, eventsService, userService) {

	    //happens on logout / timeout
	    eventsService.on("app.notAuthenticated", function () {
	        taskManService.subscribers = 0;
	    });
	});
