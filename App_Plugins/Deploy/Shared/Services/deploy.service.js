angular.module("umbraco.services").factory("deployService", function ($http) {

	var baseUrl = "/umbraco/backoffice/api/Deploy/";
	var localBaseUrl = "/umbraco/api/LocalRestore/";

    return {

        //deployment services
        addToManifest : function(model){
            return $http.post(baseUrl + "AddToManifest", model);
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
        	return $http.get(baseUrl + "DeployQueue");
        },

        clearQueue: function () {
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

        itemProviderName : function(guid){

        	//Data types
            var collection = {
            	"e0472592-e73b-11df-9492-0800200c9a66" : {name: "Data types", supportCompare : true},
            	"d8e6ad86-e73a-11df-9492-0800200c9a66" : {name: "Dictionary items"},
            	"d8e6ad83-e73a-11df-9492-0800200c9a66" : {name: "Documents"},
            	"d8e6ad84-e73a-11df-9492-0800200c9a66" : {name: "Document types", supportCompare : true},
            	"e0472595-e73b-11df-9492-0800200c9a66" : {name: "Domains"},
            	"2ab3b250-e28d-11df-85ca-0800200c9a66" : {name: "Files"},
            	"d8e6ad80-e73a-11df-9492-0800200c9a66" : {name: "Folders"},
            	"d8e6ad81-e73a-11df-9492-0800200c9a66" : {name: "Languages"},
            	"2ab40e30-e292-11df-85ca-0800200c9a66" : {name: "Macros"},
            	"d8e6ad87-e73a-11df-9492-0800200c9a66" : {name: "Media items"},
            	"d8e6ad88-e73a-11df-9492-0800200c9a66" : {name: "Media types", supportCompare : true},
                "4715aa16-fa35-426f-bb67-674043557875" : {name: "Member Groups"},
                "9bbce930-5deb-4775-bbc6-4e4e94dfa0db" : {name: "Member types"},
                "e0472594-e73b-11df-9492-0800200c9a66" : {name: "Content data"},
                "e047259a-e73b-11df-9492-0800200c9a66" : {name: "Media data"},
                "e0472596-e73b-11df-9492-0800200c9a66" : {name: "Stylesheets"},
                "e0472590-e73b-11df-9492-0800200c9a66" : {name: "Tags"},
                "e0472599-e73b-11df-9492-0800200c9a66" : {name: "Tags"},
                "25867200-e67e-11df-9492-0800200c9a66" : {name: "Templates"}
            };

        return collection[guid];

        }

    };
});
