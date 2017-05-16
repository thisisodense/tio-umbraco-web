angular.module("umbraco.directives")
    .directive('deployProblems', function (contentEditingHelper) {
        return {
            transclude: true,
            restrict: 'E',
            replace: true,
            templateUrl: '/app_plugins/deploy/views/problems.html',
            scope: {
                isLocalEnvironment: "=",
                destinationName: "=",
                environmentAlias: "="
            }            
        };
    });