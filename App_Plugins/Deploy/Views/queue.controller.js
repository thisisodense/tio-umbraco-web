angular.module("umbraco").controller("Concorde.QueueDialogController", function ($scope, deployService, $q, $timeout) {

    //fetch environment meta data
    deployService.environment().then(function(response){
        $scope.environment = response.data;
    });

    if($scope.currentNode){
        //Deployment model
        $scope.deployment = {
            rootId: $scope.currentNode.id,
            includeDescendants: true,
            "package": false
       };

       //if we are deploying media, set the media provider
       if($scope.currentNode.section === "media"){
           $scope.deployment.provider = "d8e6ad87-e73a-11df-9492-0800200c9a66";
       }

       $scope.nodeName = $scope.currentNode.name;
       $scope.hasChildren = $scope.currentNode.hasChildren;

       //deploying root will always include everything
       if($scope.currentNode.id === '-1'){
          $scope.hasChildren = false;
       }

    }


    //add item to the manifest to be deployed
    $scope.queue = function (deployModel, package) {
        deployModel.package = false;

        deployService.addToManifest(deployModel).success(function (response) {
            $scope.step = "queued";
        });
    };

});
