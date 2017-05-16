angular.module("umbraco").controller("Concorde.DeployDialogController", function ($scope, deployService, $q, $timeout) {

    var vm = this;
    vm.step = null;
    vm.environment = {};
    vm.user = {};
    vm.currentNode = null;
    vm.currentTask = null;
    vm.onQueued = onQueued;
    
    function loadUmbracoCloudData() {
        return deployService.environment().then(function (response) {

            vm.environment = response.data;
            vm.user = {
                isDebug: vm.environment.debug === true,
                isLocalEnvironment: vm.environment.localEnvironment === true,
                userType: vm.environment.userType,
                settingsSection: false,
                developerSection: false
            };

            vm.user.developerSection = vm.environment.userAllowedSections.indexOf("developer") >= 0;
            vm.user.settingsSection = vm.environment.userAllowedSections.indexOf("settings") >= 0;
            vm.user.isDeveloper = (vm.user.developerSection || vm.user.settingsSection);
        });
    }

    //call back after items are queued
    function onQueued(response) {
        vm.step = "queued";
        //the response will contain the task with the custom queueId which we then need to use to listen for changes for this queue
        vm.currentTask = response;
    };

    if ($scope.dialogOptions.currentNode) {

        vm.currentNode = $scope.dialogOptions.currentNode;

        //handle the dialog, load in UC data, add the current item to the queue

        loadUmbracoCloudData()
            .then(function() {
                vm.currentNode = $scope.dialogOptions.currentNode;
            });
    }
});