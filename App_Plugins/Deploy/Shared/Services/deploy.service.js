angular.module("umbraco.services").factory("deployService", function ($http, $injector) {

	var baseUrl = "/umbraco/backoffice/api/Deploy/";
	var localBaseUrl = "/umbraco/api/LocalRestore/";
    
    var itemProviders = {
	    "4362c4fb-8e23-4cdb-a611-786f48ea5ae7": { name: "Access entries" },
	    "e0472592-e73b-11df-9492-0800200c9a66": { name: "Data types", supportCompare: true },
	    "d8e6ad86-e73a-11df-9492-0800200c9a66": { name: "Dictionary items" },
	    "d8e6ad83-e73a-11df-9492-0800200c9a66": { name: "Documents"},
	    "d8e6ad84-e73a-11df-9492-0800200c9a66": { name: "Document types", supportCompare: true },
	    "e0472595-e73b-11df-9492-0800200c9a66": { name: "Domains" },
	    "2ab3b250-e28d-11df-85ca-0800200c9a66": { name: "Files" },
	    "d8e6ad80-e73a-11df-9492-0800200c9a66": { name: "Folders" },
	    "d8e6ad81-e73a-11df-9492-0800200c9a66": { name: "Languages" },
	    "2ab40e30-e292-11df-85ca-0800200c9a66": { name: "Macros" },
	    "d8e6ad87-e73a-11df-9492-0800200c9a66": { name: "Media items" },
	    "d8e6ad88-e73a-11df-9492-0800200c9a66": { name: "Media types", supportCompare: true },
	    "4715aa16-fa35-426f-bb67-674043557875": { name: "Member Groups" },
	    "9bbce930-5deb-4775-bbc6-4e4e94dfa0db": { name: "Member types" },
	    "e0472594-e73b-11df-9492-0800200c9a66": { name: "Content data" },
	    "e047259a-e73b-11df-9492-0800200c9a66": { name: "Media data" },
	    "e0472596-e73b-11df-9492-0800200c9a66": { name: "Stylesheets" },
	    "e0472590-e73b-11df-9492-0800200c9a66": { name: "Tags" },
	    "e0472599-e73b-11df-9492-0800200c9a66": { name: "Tags" },
	    "25867200-e67e-11df-9492-0800200c9a66": { name: "Templates" }
	};

    var getItemProviders = function() {
        $http.get(baseUrl + "GetItemProviders")
            .success(function(providers) {
                angular.forEach(providers,
                    function(provider) {
                        if (itemProviders[provider.id] === undefined) {
                            itemProviders[provider.id] = { name: provider.name };
                        }
                    });
            });
    };

    // this ensures that if we are already logged in, the ItemProviders are updated from backend.
    // the script file can be loaded while you are not logged in, so to avoid 401's we need to do this check
    if ($injector.has("userService")) {
        var userService = $injector.get("userService");
        userService.isAuthenticated()
        .then(function () {
            getItemProviders();
        });
    }
    
    // we want to ensure these are updated on authenticating, since it seems the service is not always
    // reloaded upon login if it has already been loaded earlier
    if ($injector.has("eventsService")) {
        var eventsService = $injector.get("eventsService");
        eventsService.on("app.authenticated",
        function () {
            getItemProviders();
        });
    }
    
    var service = {
        //eventing so dialogs can track changes
        events: $({}),

        //deployment services
        addToManifest : function(model){
            var retval = $http.post(baseUrl + "AddToManifest", model);
            retval.then(function(){
                service.events.trigger("change");
                service.events.trigger("add", model);    
            });
            
            return retval;
        },

        "package": function () {
			return $http.post(baseUrl + "Package");
        },

        getDeployment: function () {
        	return $http.get(baseUrl + "GetDeployment");
        },

        getManifest: function () {
            return $http.get(baseUrl + "GetManifest");
        },

        deployQueue: function () {
            service.events.trigger("change");
            service.events.trigger("deploy");
        	return $http.get(baseUrl + "DeployQueue");
        },

        clearQueue: function () {
            service.events.trigger("change");
            service.events.trigger("clear");
            return $http.get(baseUrl + "ClearQueue");
        },

        //pull item from remote site and returns array of differences
        compareItemToRemote: function (item, environment) {
            if (!environment) {
                environment = "";
            }

            return $http.get(baseUrl + "CompareItemToRemote?id=" + item.Id + "_" + item.ProviderId + "&environment=" + environment);
        },

        //restore services

        //Pull and restore in one go, this can only run from within backoffice
        pullAndRestoreRemoteContent : function(environment){

            if(!environment){
                environment = "";
            }
            return $http.get(baseUrl + "PullAndRestoreRemoteContent?environment=" + environment);
        },

        //Restore content from existing files on disk
        restoreContentFromDisk: function () {
            return $http.get(baseUrl + "RestoreWebSite");
        },

        pullRemoteContent : function(login, password){
            return $http.post(baseUrl + "PullRemoteContent");
        },

        //this require a local request to authenticate
        pullRemoteContentToLocal: function (login, password) {
            return $http.post(localBaseUrl + "PullRemoteContent", { login: login, password: password });
        },

        //this require a local request to authenticate
        restoreWebSiteToLocal : function(){
            return $http.get(localBaseUrl + "RestoreWebSite");
        },

        //share services
        taskStatus : function(sessionId){
            if(sessionId){
        	   return $http.get(baseUrl + "TaskStatus?id=" + sessionId);
            }else{
               return $http.get(baseUrl + "CurrentTaskStatus");
            }
        },


        environment : function(){
            return $http.get(baseUrl + "Environment");
        },


        taskManagerStatus: function (sessionId) {
            return $http.get(baseUrl + "TaskManagerStatus");
        },

        itemProviderName : function(guid) {
            return itemProviders[guid];
        }
    };
    
    return service;

});
