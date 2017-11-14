angular.module("umbraco.directives")
    .directive('unhandledDeployException', function (contentEditingHelper) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: '/app_plugins/deploy/views/unhandled-exception.html',
            scope: {
                isHandled: "=",
                isLocalEnvironment: "=",
                message: "=",
                exception: "=",
                stack: "=",
                additionalErrors: "="
            },
            link: function (scope, el, attr, ctrl) {
                scope.showDetails = false;
            }
        };
    });