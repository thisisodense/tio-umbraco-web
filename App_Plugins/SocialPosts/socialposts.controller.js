angular.module("umbraco")
    .controller("My.SocialPostsController",
    function ($scope, contentResource, editorState, contentEditingHelper, dictionanyResource) {
        var findProperty = function (properties, alias) {
            return _.find(properties, function (property) { return property.alias === alias }).value;
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
            $scope.startTime = findProperty(properties, 'startTime');
            $scope.endTime = findProperty(properties, 'endTime');
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

            var writerId = findProperty(properties, 'writerRecommendation');
            contentResource.getById(writerId).then(function (writer) {
                $scope.writerRecommendation = writer.name;
            });

            var translatorId = findProperty(properties, 'translatorRecommendation');

            if (translatorId) {
                contentResource.getById(translatorId).then(function (translator) {
                    $scope.translatorRecommendation = translator.name;
                });
            }

            var locationId = findProperty(properties, 'locationRecommendation');
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