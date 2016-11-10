angular.module("umbraco").controller("Concorde.FlowController", function ($scope, deployService, contentResource, taskManService, packageResource, $cookieStore, $location) {

    var vm = this;
    vm.showStarterKitSelector = true;
    vm.currentTask = null; //used for 2 way binding to the flow-deploy directive
    vm.selectStarterKit = selectStarterKit;
    vm.environment = null;
    vm.user = null;

    //used to control the message and under what workspace
    vm.workspaceMessage = "";
    vm.activeWorkspace = { type: "local" };

    vm.openWorkspace = openWorkspace;
    vm.openAddEnvironment = openAddEnvironment;
    vm.openDocumentation = openDocumentation;

    //handling the arrow
    vm.legacyDashboard = Umbraco.Sys.ServerVariables.application.version !== undefined && (Umbraco.Sys.ServerVariables.application.version.startsWith('7.3') || Umbraco.Sys.ServerVariables.application.version.startsWith('7.2'));

    function init() {
        openStarterKitSelector();
        loadUmbracoCloudData("deploy");
    }    

    function openStarterKitSelector() {
        if ($location.search().dashboard !== "starter") {
            vm.showStarterKitSelector = false;
            return;
        }

        //Check localStorage for selected starterKit even though
        //the ?dashboard=starter querystring is present
        if (localStorage.starterKit) {
            vm.showStarterKitSelector = false;
        } else {
            //only show the message if there is no content
            contentResource.getChildren(-1).then(function (response) {
                if (!response.items || response.items.length === 0) {
                    vm.showStarterKitSelector = true;
                }
            });
        }
    }

    function selectStarterKit(starterkitName) {
        //Set the starterkit name in localStorage so we know
        //not to show the overlay/selector again.
        localStorage.starterKit = starterkitName;
        //TODO Fix this - currently doesn't seem to remove the querystring
        $location.search('dashboard', null);
        window.location.reload(true);
    }

    function openAddEnvironment() {
        window.open("https://www.s1.umbraco.io/project/" + vm.environment.alias + "?addEnvironment=true");
    }

    function openWorkspace() {
        window.open("https://www.s1.umbraco.io/project/" + vm.environment.alias);
    }

    function openDocumentation() {
        window.open("https://our.umbraco.org/Documentation/Umbraco-Cloud/");
    }


    //custom function to display the local message, this can either be pending changes or connection information
    $scope.showLocalMessage = function (event) {
        vm.activeWorkspace = { type: "local" };

        if (vm.user.isLocalEnvironment) {
            $scope.showMessage("deploy");
        } else {
            $scope.showMessage("connection");
        }
    };

    $scope.showFlowArrow = function () {
        if (vm.environment.destination !== undefined && vm.environment.destination !== "") {
            return true;
        }
        return false;
    }

    //message to show adding workspace message
    $scope.showAddMessage = function (event) {
        vm.activeWorkspace = { type: "add" };
        $scope.showMessage("add-workspace");
    };

    //handler for clicking a non-local workspace
    $scope.showWorkspaceMessage = function (event, workspace) {

        //if changing space, always reset
        if (vm.activeWorkspace.type !== workspace.type) {
            vm.workspaceMessage = "";
        }

        //set active workspace to the clicked one
        vm.activeWorkspace = workspace;

        //if workspace is the space we detect as active - then show deployment information - else show site configuration
        if (workspace.current && vm.environment.destination !== undefined && vm.environment.destination !== "") {
            $scope.showMessage("deploy");
        } else {
            $scope.showMessage("config");
        }
    };

    $scope.showMessage = function (mode) {
        vm.workspaceMessage = mode;
    };

    $scope.closeWorkspaceMessage = function () {
        vm.workspaceMessage = "";
        vm.activeWorkspace.type = "";
    };

    //for the deploy ui
    $scope.providerName = function (guid) {
        return deployService.itemProviderName(guid);
    }

    //first get the environment data
    //fetch environment meta data

    function loadUmbracoCloudData(defaultMsg) {

        return deployService.environment().then(function (response) {

            vm.environment = response.data;
            vm.user = {
                isDebug: vm.environment.debug === true,
                isLocalEnvironment: vm.environment.localEnvironment === true,
                userType: vm.environment.userType,
                settingsSection: false,
                developerSection: false
            };

            vm.user.developerSection = vm.environment.userAllowedSections.indexOf("developer") >= 0;
            vm.user.settingsSection = vm.environment.userAllowedSections.indexOf("settings") >= 0;
            vm.user.isDeveloper = (vm.user.developerSection || vm.user.settingsSection);
            
            //show the portal link to adding the extra env.
            //vm.user.isDeveloper &&
            vm.showAddEnvironment = (vm.environment.configured.length < 2);

            //put markers on the enviroments to mark them in the ui
            _.each(vm.environment.configured, function (env) {

                env.current = (env.name === vm.environment.source);
                env.next = (env.name === vm.environment.destination);

                if (env.current) {
                    vm.activeWorkspace = env;
                }
            });

            if (vm.environment.destination !== undefined && vm.environment.destination !== "") {
                $scope.showMessage(defaultMsg);
            }
            else {
                $scope.showMessage("config");
            }

        });
    }

    init();

});
