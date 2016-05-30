angular.module("umbraco")
    .controller("My.SocialPostsForLocationsController",
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
            $scope.title = findProperty(properties, 'title');
            $scope.address = findProperty(properties, 'address');
            $scope.shortDescription = findProperty(properties, 'shortdescription');
            $scope.shortDescriptionEnglish = findProperty(properties, 'shortdescriptionenglish');
            $scope.longDescription = findProperty(properties, 'longdescription');
            $scope.longDescriptionEnglish = findProperty(properties, 'longdescriptionenglish');

            $scope.url = findProperty(properties, 'url');
            $scope.phoneNumber = findProperty(properties, 'phonenumber');
            $scope.hashtags = findProperty(properties, 'hashtags');
            $scope.fotograf = findProperty(properties, 'fotograf');
            $scope.fotografURL = findProperty(properties, 'fotografURL');

            var categoryIds = findProperty(properties, 'categories');
            var categories = _.find(properties, function (property) { return property.alias === 'categories' });

            $scope.categories = [];

            for (var categoryId in categoryIds) {
                $scope.categories.push(categories.config.items[categoryIds[categoryId]].value);
            }

            var writerId = findProperty(properties, 'writer');
            contentResource.getById(writerId).then(function (writer) {
                $scope.writerName = writer.name;
            });
          
        });
     });