angular.module("umbraco").controller("UmbracoForms.Editors.Form.EditLegacyController",

function ($scope, $routeParams, formResource, editorState, dialogService, formService, notificationsService, contentEditingHelper, formHelper, navigationService, userService, securityResource) {

    //On load/init of 'editing' a form then
    //Let's check & get the current user's form security
    var currentUserId = null;
    var currentFormSecurity = null;

    //By default set to have access (in case we do not find the current user's per indivudal form security item)
    $scope.hasAccessToCurrentForm = true;

    userService.getCurrentUser().then(function (response) {
        currentUserId = response.id;

        //Now we can make a call to form securityResource
        securityResource.getByUserId(currentUserId).then(function (response) {
            $scope.security = response.data;

            //Use _underscore.js to find a single item in the JSON array formsSecurity
            //where the FORM guid matches the one we are currently editing (if underscore does not find an item it returns an empty array)
            //As _.findWhere not in Umb .1.6 using _.where() that lists multiple matches - checking that we have only item in the array (ie one match)
            currentFormSecurity = _.where(response.data.formsSecurity, { Form: $routeParams.id });

            if (currentFormSecurity.length === 1) {
                //Check & set if we have access to the form
                //if we have no entry in the JSON array by default its set to true (so won't prevent)
                $scope.hasAccessToCurrentForm = currentFormSecurity[0].HasAccess;
            }

            //Check if we have access to current form OR manage forms has been disabled
            if (!$scope.hasAccessToCurrentForm || !$scope.security.userSecurity.manageForms) {

                //Show error notification
                notificationsService.error("Access Denied", "You do not have access to edit this form");


                //Resync tree so that it's removed & hides
                navigationService.syncTree({ tree: "form", path: ['-1'], forceReload: true, activate: false }).then(function(response) {

                    //Response object contains node object & activate bool
                    //Can then reload the root node -1 for this tree 'Forms Folder'
                    navigationService.reloadNode(response.node);
                });

                //Don't need to wire anything else up
                return;
            }
        });
    });


    if ($routeParams.create) {

		//we are creating so get an empty data type item
	    formResource.getScaffold($routeParams.template)
	        .then(function(response) {
	            $scope.form = response.data;
				$scope.currentPage = {};

	            formResource.getPrevalueSources()
	                .then(function(resp){
	                    $scope.prevaluesources = resp.data;
	            });

				formResource.getAllFieldTypesWithSettings()
					.then(function (resp) {
						$scope.fieldtypes = resp.data;
						$scope.ready = true;
					});

				//set a shared state
				editorState.set($scope.form);
			});

    } else {

		$scope.workflowsUrl = "#/forms/form/workflows/" +$routeParams.id;
		$scope.entriesUrl = "#/forms/form/entries/" +$routeParams.id;


		//we are editing so get the content item from the server
		formResource.getByGuid($routeParams.id)
			.then(function (response) {

			    //As we are editing an item we can highlight it in the tree
			    navigationService.syncTree({ tree: "form", path: [String($routeParams.id)], forceReload: false });


				$scope.form = response.data;
				$scope.saved = true;

				formResource.getPrevalueSources()
	                .then(function (resp) {
	                    $scope.prevaluesources = resp.data;
	                });

				formResource.getAllFieldTypesWithSettings()
					.then(function (resp) {
						$scope.fieldtypes = resp.data;
						$scope.ready = true;
					});

				//set a shared state
				editorState.set($scope.form);
			});


	}

	$scope.editForm = function(form, section){
		dialogService.open(
			{
				template: "/app_plugins/UmbracoForms/Backoffice/Form/dialogs/formsettings.html",
				form: form,
				section: section,
				page: $scope.currentPage
			});
	};

	$scope.save = function(){

	    if (formHelper.submitForm({ scope: $scope })) {
	        //make sure we set correct widths on all containers
	        formService.syncContainerWidths($scope.form);

	        formResource.save($scope.form).then(function (response) {

	            formHelper.resetForm({ scope: $scope });

	            contentEditingHelper.handleSuccessfulSave({
	                scope: $scope,
	                savedContent: response.data
	            });

	            $scope.ready = true;
	            //$scope.form = response.data;

	            //set a shared state
	            editorState.set($scope.form);

	            navigationService.syncTree({ tree: "form", path: [String($scope.form.id)], forceReload: true });

	            notificationsService.success("Form saved", "");

	        }, function (err) {
	            notificationsService.error("Form Failed to save", err.data.Message);
	        });
	    }

	};


});
