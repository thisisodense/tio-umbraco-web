angular.module("umbraco").controller("CharLimit.CharLimitController", function ($scope) {

    var limit = $scope.model.config.limit;

    $scope.info = (limit - $scope.model.value.length);
    $scope.fontColor = { 'color': '#FFF' };

    $scope.limitchars = function () {

        if ($scope.model.value.length > limit) {
            $scope.model.value = $scope.model.value.substr(0, limit);
            $scope.info = 0 + '!';
            $scope.fontColor = { 'color': '#9d261d' };
        } else{
            $scope.info = (limit - $scope.model.value.length);
            $scope.fontColor = { 'color': 'rgb(182, 182, 182)' };
        }

    }
});