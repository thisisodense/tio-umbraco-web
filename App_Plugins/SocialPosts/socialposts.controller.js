angular.module("umbraco")
    .controller("My.SocialPostsController",
    function ($scope, contentResource, editorState, contentEditingHelper, dictionanyResource) {
        var findProperty = function (properties, alias) {
            return _.find(properties, function (property) { return property.alias === alias }).value;
        }

        var convertTimeformat = function (time) {
            var hours = Number(time.match(/^(\d+)/)[1]);
            var minutes = Number(time.match(/:(\d+)/)[1]);
            var AMPM = time.match(/\s(.*)$/)[1];
            if (AMPM == "pm" && hours < 12) hours = hours + 12;
            if (AMPM == "am" && hours == 12) hours = hours - 12;
            var sHours = hours.toString();
            var sMinutes = minutes.toString();
            if (hours < 10) sHours = "0" + sHours;
            if (minutes < 10) sMinutes = "0" + sMinutes;
            return (sHours + ":" + sMinutes);
        }

        var id = editorState.current.id;

        if (id == 0)
            return;

        var content = contentResource.getById(id).then(function (content) {
            var properties = contentEditingHelper.getAllProps(content);
            $scope.id = id;
            $scope.headline = findProperty(properties, 'headline');
            $scope.headlineEnglish = findProperty(properties, 'headlineEnglish');
            $scope.subheader = findProperty(properties, 'subheader');
            $scope.subheaderEnglish = findProperty(properties, 'subheaderEnglish');
            $scope.organizer = findProperty(properties, 'organizer');
            $scope.price = findProperty(properties, 'price');
            $scope.startDate = findProperty(properties, 'startDate');
            $scope.endDate = findProperty(properties, 'endDate');
            $scope.startTime = convertTimeformat(findProperty(properties, 'startTime'));
            $scope.endTime = convertTimeformat(findProperty(properties, 'endTime'));
            $scope.doorsOpen = findProperty(properties, 'doorsOpen');
            $scope.summaryForInstagram = findProperty(properties, 'summaryForInstagram');

            var eventTypeId = findProperty(properties, 'eventType');
            var eventType = _.find(properties, function (property) { return property.alias === 'eventType' });

            $scope.eventType = eventType.config.items[eventTypeId].value;
           
            dictionanyResource.getTranslation($scope.eventType, 'en').then(function (value) {
                $scope.eventTypeEN = JSON.parse(value.data);
            });

            $scope.linkToEvent = findProperty(properties, 'linkToEvent');
            $scope.ticketUrl = findProperty(properties, 'ticketUrl');
            $scope.summary = findProperty(properties, 'summary');
            $scope.summaryEnglish = findProperty(properties, 'summaryEnglish');

            var writerId = findProperty(properties, 'writer');
            contentResource.getById(writerId).then(function (writer) {
                $scope.writerName = writer.name;
            });

            var translatorId = findProperty(properties, 'translator');

            if (translatorId) {
                contentResource.getById(translatorId).then(function (translator) {
                    $scope.translatorName = translator.name;
                });
            }

            var locationId = findProperty(properties, 'location');
            contentResource.getById(locationId).then(function (location) {
                var locationProperties = contentEditingHelper.getAllProps(location);
   
                $scope.location = {
                    title: findProperty(locationProperties, 'title'),
                    url: findProperty(locationProperties, 'url'),
                    address: findProperty(locationProperties, 'address'),
                    hashtags: findProperty(locationProperties, 'hashtags')
                };
            });
        });
     });