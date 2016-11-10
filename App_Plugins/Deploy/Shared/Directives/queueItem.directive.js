angular.module("umbraco.directives")
    .directive('queueItem', function (deployService) {
        return {
            transclude: true,
            restrict: 'E',
            replace: true,
            templateUrl: '/app_plugins/deploy/views/queue-item.html',
            scope: {
                currentNode: "=",
                packageQueue: "=",
                environment: "=",
                onQueued: "&"
            },
            link: function (scope, element, attrs) {
                if (scope.currentNode) {

                    //Deployment model
                    scope.deployment = {
                        rootId: scope.currentNode.id,
                        includeDescendants: true,
                        //if set to true will package this single item in a custom id'd manifest
                        "package": scope.packageQueue
                    };

                    //if we are deploying media, set the media provider
                    if (scope.currentNode.section === "media") {
                        scope.deployment.provider = "d8e6ad87-e73a-11df-9492-0800200c9a66";
                    }

                    scope.nodeName = scope.currentNode.name;
                    scope.hasChildren = scope.currentNode.hasChildren;

                    //deploying root will always include everything
                    if (scope.currentNode.id === '-1') {
                        scope.hasChildren = false;
                    }

                }
                
                scope.queue = function(deployModel) {
                    
                    deployService.addToManifest(deployModel).then(function (response) {
                        //call the call back
                        scope.onQueued({ response: response.data });
                    });
                };
            }
        };
    });