angular.module("umbraco.directives")
    .directive('unhandledDeployException', function (contentEditingHelper) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: '/app_plugins/deploy/views/unhandled-exception.html',
            scope: {
                isLocalEnvironment: "=",
                message: "=",
                exception: "=",
                stack: "=",
                additionalErrors: "="
            }            
        };
    });