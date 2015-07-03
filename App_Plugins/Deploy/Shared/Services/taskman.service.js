angular.module("umbraco.services").factory("taskManService", function ($timeout, $rootScope, deployService) {


	var service = {
		events: $({}),

		currentTask : undefined,
		latestTask : undefined,

		currentTaskState: undefined,

		setCurrentTaskState : function(){

		},

		getTaskState : function(task){
			if(!task || task == "null"){
				return "null";
			}
		},

		taskHasChanged : function(task){

		},
		monitorTaskmanager : function(){
		    var check = function(){
		        timer = $timeout(function(){

		            deployService.taskStatus().success(function(response){
		            	
		            	//if response id is not equal to current task or current state    

		                if(response !== "null" && !_.isEqual(response, service.latestTask) ){
			                service.events.trigger("task-update", response);

			                if(!service.currentTask || service.currentTask.id !== response.id){
			                	service.events.trigger("task-new", response);
			                }

			                service.currentTask = response;

			                //the task is out of the current tasks queue
			                if(response.complete){
			                	service.latestTask = response;
			                	service.currentTask = undefined;

			                    //it is out current task list because its either done or has an error
			                    if (response.error) {
			                    	service.events.trigger("task-error", response);
			                    }else{
			                    	service.events.trigger("task-complete", response);
			                    }
			                }		            	
			        	}

			        	check();

		            }).error(function(err){
		                service.events.trigger("error", err);
		                service.currentTask = undefined;
		                check();
		            });

		        }, 2000);
		    };

		    check();
		}

	};

	return service;

}).run(function(taskManService){
	taskManService.monitorTaskmanager();
});