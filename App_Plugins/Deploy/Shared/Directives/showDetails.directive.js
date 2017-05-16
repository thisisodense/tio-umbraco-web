angular.module("umbraco.directives")
    .directive('showDetails', function () {
        return {
            restrict: 'A',
            scope: {
                showDetails: '@'
            },
            link: function (scope, element, attrs) {
                element.bind('click', function() {
                    var target = $(scope.showDetails);
                    if (target.length > 0) {
                        $(element).hide();
                        target.slideDown(350);
                    }
                });
            }
        };
    });