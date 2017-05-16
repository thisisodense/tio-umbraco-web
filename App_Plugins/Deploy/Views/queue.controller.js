angular.module("umbraco").controller("Concorde.QueueDialogController", function ($scope, deployService, $q, $timeout) {

    //fetch environment meta data
    deployService.environment().then(function(response){
        $scope.environment = response.data;
    });

    //call back after items are queued
    $scope.onQueued = function (response) {
        $scope.step = "queued";
    };

});