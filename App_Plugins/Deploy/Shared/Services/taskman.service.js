angular.module("umbraco.services").factory("taskManService",
	function ($timeout, $rootScope, deployService) {

	    var subscribers = [];

	    function listen(listener, continueOnUpdate, continueOnNull) {	        

	        listener.active = true;

            var check = function (interval) {
                //only continue if listener is active
                if (listener.active === true) {
                    $timeout(function () {
                        
                        //only perform the http request if the user is logged in
                        deployService.taskStatus(listener.taskId).then(function (response) {

                            response = response.data;

                            if (response !== "null" && listener.active) {
                                
                                if (response.complete) {
                                    unlisten(listener);
                                    listener.onComplete(response);
                                }
                                else if (response.error) {
                                    unlisten(listener);
                                    //NOTE: Pretty sure this will never happen - errors are handled with proper error handling
                                    listener.onError(response);
                                }
                                else {
                                    listener.onUpdate(response);

                                    if (continueOnUpdate === true) {
                                        //keep checking
                                        check(interval);
                                    }
                                    else {
                                        unlisten(listener);
                                    }
                                    
                                }
                            }
                            else if (continueOnNull === true && listener.active === true) {
                                //keep checking
                                check(interval);
                            }

                        }, function (err) {
                            listener.onError(err);
                            unlisten(listener);
                        });

                    }, interval);
                }
            };

	        //activate the service to start the monitor loop
            check(2000);
        }

        function unlisten(listener) {
            if (!listener) {
                throw "listener parameter is empty";
            }
            
            listener.active = false;

            var index = _.indexOf(subscribers, listener);
            if (index >= 0) {
                subscribers.splice(index, 1);
            }
	       
        }

	    var service = {
	        
            /**
             *  Stops the polling and removes the subscriber count - used to shutdown (i.e. user logs off)
             * @returns {} 
             */
            stop: function() {
                _.each(subscribers, function(s) {
                        unlisten(s);
                    });
            },

            /**
             * Waits until a new task is added
             * @returns {} 
             */
            wait: function() {
                var listener = {
                    taskId: undefined,
                    active: false,
                    start: function () {
                        listen(listener, false, true);
                    },
                    //these should be set the by user using this method
                    onComplete: function (args) {
                    },
                    onUpdate: function (args) {
                    },
                    onError: function (args) {
                    }
                };

                subscribers.push(listener);

                return listener;
            },

            /**
             * Subscribe to a specific taskid, returns an objects with callbacks to listen to activity
             * @param {} taskId 
             * @returns {} 
             */
	        subscribe: function (taskId) {
                if (!taskId) {
                    throw "taskId parameter is empty";
                }

                var listener = {
                    taskId: taskId,
                    active: false,
                    start: function() {
                        listen(listener, true, false);
                    },
                    //these should be set the by user using this method
                    onComplete:function(args) {                        
                    },
                    onUpdate: function (args) {                        
                    },
                    onError: function (args) {                        
                    }
                };

                subscribers.push(listener);
                
                return listener;
	        },

            /**
             *  Stops all polling for the listener
             * @param {} listener 
             * @returns {} 
             */
	        unsubscribe: function (listener) {
	            unlisten(listener);
	        }
	    };

	    return service;

	}).run(function (taskManService, eventsService, userService) {

	    //happens on logout / timeout
	    eventsService.on("app.notAuthenticated", function () {
	        taskManService.stop();
	    });
	});