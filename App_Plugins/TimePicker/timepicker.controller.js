angular.module("umbraco").controller("timepicker.timepickerController", function ($scope, assetsService) {

    var attrs = {
        defaultTime: "current",
        minuteStep: 1,
        showSeconds: false,
        secondStep: 10,
        showMeridian: true,
        showInputs: true,
        disableFocus: false,
        disableMousewheel: false,
        modalBackdrop: false
    };

    for (var attr in $scope.model.config) {
        var value = $scope.model.config[attr];
        console.log(attr);
        if (value != null) {
            if(attr[0]==="minuteStep" || attr[0]==="secondStep"){
                value = parseInt(value);
            }
            attrs[attr] = value;
        }
    }
    console.log(attrs);

    assetsService.load(['/App_Plugins/TimePicker/bootstrap-timepicker.min.js']).then(function () {
        
        var thisTimePicker = $('#timepicker' + $scope.model.id);
        
        /* Don't display default time if model.value is empty */
        if ($scope.model.value != null || $scope.model.value != "") {
            $scope.defaultTime = $scope.model.value;
        }

        /* Configuration */
        thisTimePicker.timepicker(attrs);

        /* Update the model.value when using the timepicker */
        thisTimePicker.timepicker().on('changeTime.timepicker', function (e) {
            $scope.model.value = e.time.value;
        });

        /* Reset model.value if input is empty */
        $scope.resetTime = function () {
            if ($scope.model.value == null || $scope.model.value == "") {
                $scope.model.value = null
            }
            console.log($scope.model.value)
        }
    });
    
    assetsService.loadCss("/app_plugins/TimePicker/bootstrap-timepicker.min.css");

    
});