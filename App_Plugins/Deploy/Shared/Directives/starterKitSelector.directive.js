(function() {
    'use strict';

    function StarterKitSelector($compile, $timeout, packageResource) {

        function link(scope, el, attr, ctrl) {
			
            scope.installStarterKit = false;
            scope.installStatus = "";
            scope.starterkitName = "";
            
            scope.selectStarterKit = function(starterKitName) {
                scope.starterkitName = starterKitName;
            };
            
            scope.startInstall = function() {
				var starterKitName = scope.starterkitName;
				
                if(starterKitName !== "blank") {
                    installStarterKit(starterKitName);
                } else {

                    if (scope.onSelectStarterKit) {
                        scope.onSelectStarterKit(starterKitName);
                    }

                }
            };

            function installStarterKit(starterKitName) {

                scope.installStarterKit = true;
                scope.installStatus = "Downloading starterkit...";
                scope.starterkitName = starterKitName;
        
                packageResource
                    .fetch(starterKitName)
                    .then(function(pack){
                        scope.installStatus = "Importing starterkit...";
                        return packageResource.import(pack);
                    }, installError)
                    .then(function(pack){
                        scope.installStatus = "Installing starterkit...";
                        return packageResource.installFiles(pack);
                    }, installError)
                    .then(function(pack){
                        scope.installStatus = "Restarting, please hold...";
                        return packageResource.installData(pack);
                    }, installError)
                    .then(function(pack){
                        scope.installStatus = "All done, your browser will now refresh";
                        return packageResource.cleanUp(pack);
                    }, installError)
                    .then(installComplete, installError);    
            }

            function installComplete(result){
                if (scope.onSelectStarterKit) {
                        scope.onSelectStarterKit(scope.starterkitName);
                }
            };

            function installError(err){
                scope.installStatus = undefined;
                scope.installError = err;
            };


            // hack: move element to body to make it full-screen
            // we cannot make an element full screen because of overflow hidden on content
            if (attr.hasOwnProperty("show")) {
                scope.$watch("show", function(value) {
                    if (value === true) {
                        el.appendTo("body");
						$compile(el)(scope);
                    } else {
                        el.remove();
                    }
                });
            }
        }

        var directive = {
            restrict: 'E',
            replace: true,
            templateUrl: '/app_plugins/deploy/views/starter-kit-selector.html',
            link: link,
            scope: {
                onSelectStarterKit: "=",
                show: "="
            }
        };

        return directive;
    }

    angular.module('umbraco.directives').directive('starterKitSelector', StarterKitSelector);

})();
