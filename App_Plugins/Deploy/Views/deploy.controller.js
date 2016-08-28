angular.module("umbraco").controller("Concorde.FlowController", function($scope, deployService, contentResource, taskManService, packageResource, $cookieStore, $location) {

    var vm = this;
    var subscribed = false;
    vm.showStarterKitSelector = true;
    vm.hasChanges = false;
    vm.editorChanges = 0;
    vm.devChanges = 0;
    vm.selectStarterKit = selectStarterKit;

    //used to control the message and under what workspace
    vm.workspaceMessage = "deploy";
    vm.activeWorkspace = {type: "local"};

    //used to track the state of the deploy dialog specifically
    vm.deploystep = "";
    vm.openWorkspace = openWorkspace;
    vm.openAddEnvironment = openAddEnvironment;
    vm.openDocumentation = openDocumentation;

    //handling the arrow
    vm.deploying = false;
    vm.deployingToNext = false; //used to indicate if local is deploying to live or dev
    vm.legacyDashboard = Umbraco.Sys.ServerVariables.application.version !== undefined && (Umbraco.Sys.ServerVariables.application.version.startsWith('7.3') || Umbraco.Sys.ServerVariables.application.version.startsWith('7.2'));

    function init() {
        openStarterKitSelector();
        loadUaasData();
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

    function openAddEnvironment(){
        window.open("https://www.s1.umbraco.io/project/" + vm.environment.alias + "?addEnvironment=true");
    }

    function openWorkspace(){
        window.open("https://www.s1.umbraco.io/project/" + vm.environment.alias);
    }

    function openDocumentation(){
        window.open("https://our.umbraco.org/documentation/Umbraco-as-a-Service/");
    }

    //custom function to display the local message, this can either be pending changes or connection information
    $scope.showLocalMessage = function(event){
        vm.activeWorkspace = {type : "local"};

        if(vm.user.isLocalEnvironment){
            $scope.showMessage("deploy");
        }else{
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
    $scope.showAddMessage = function(event){
        vm.activeWorkspace = {type : "add"};
        $scope.showMessage("add-workspace");
    };

    //handler for clicking a non-local workspace
    $scope.showWorkspaceMessage = function(event, workspace){

        //if changing space, always reset
        if(vm.activeWorkspace.type !== workspace.type){
            vm.workspaceMessage = "";
        }

        //set active workspace to the clicked one
        vm.activeWorkspace = workspace;

        //if workspace is the space we detect as active - then show deployment information - else show site configuration
        if (workspace.current && vm.environment.destination !== undefined && vm.environment.destination !== "") {
            $scope.showMessage("deploy");
        }else{
            $scope.showMessage("config");
        }
    };

    $scope.showMessage = function(mode) {
        vm.workspaceMessage = mode;
    };

    $scope.closeWorkspaceMessage = function(){
        vm.workspaceMessage = "";
        vm.activeWorkspace.type = "";
    };

    /* Borrowed from the current deploy js  */

    //handle task manager updates
    var onTaskUpDate = function(event, task){
        vm.currentTask = task;
        if(vm.deploystep === "empty-queue" || vm.deploystep === "done"){
          vm.deploystep = "working";
          vm.deploying = true;
        }
    };

    var onTaskComplete = function(event, task){
        vm.currentTask = task;

        //when a task completes, the UI might do different things...

        //we are done packaging and now needs to show the user the packaged items
        if (task.name === "Umbraco.Courier.Core.Tasks.PackagingTask") {
            $scope.showPackagedItems();
            vm.deploying = true;
        }

        //we are done extracting / deploying to a target, we will just show the down page
        if (task.name === "Umbraco.Courier.Core.Tasks.ExtractionTask") {
            vm.deploystep = "done";
            vm.deploying = false;
        }

        //we just completed a restore, should we show anything? - we cant tell the difference between
        //nonodes restore and dialog restore since its the same task
        if (task.name === "Concorde.CacheHandler.Tasks.InitialExtractionTask") {
            vm.deploystep = "restored";
            vm.deploying = false;
        }

    };

    //triggers when items are added to the deploy queue
    var onChangeAdd = function(){
        $scope.reloadQueue();
    };

    //tell the service there is a subscriber
    taskManService.subscribe();
    var subscribed = true;

    //when a change is added
    deployService.events.on("add", onChangeAdd);

    //when a task updates
    taskManService.events.on("task-update", onTaskUpDate);

    //when a task completes, move to done, or move to showing what has been packaged
    taskManService.events.on("task-complete", onTaskComplete);

    //when an error occurs in polling - this will be a critical error
    taskManService.events.on("error", function(evt, msg) {
        handleError(msg);

        //there's an error, we cannot continue or we'll overwrite the UI message that the user must see
        // if an error occurs, this is critical, we cannot swallow/hide issues.
        taskManService.unsubscribe();
        subscribed = false;
    });


    $scope.$on(
        "$destroy",
        function (event) {
            deployService.events.off("add", onChangeAdd);
            taskManService.events.off("task-update", onTaskUpDate);
            taskManService.events.off("task-complete", onTaskComplete);
            taskManService.unsubscribe();
            subscribed = false;
        }
    );

    //for the deploy ui
    $scope.providerName = function(guid){
        return deployService.itemProviderName(guid);
    }

    //show the items packaged by courier
    $scope.showPackagedItems = function(){
        //if the task is completed
        //load the deployment
        deployService.getDeployment().success( function(response){

            //iterate through all the returned data for better view
            var notallowed = [];
            angular.forEach(response.notAllowed, function(value, key) {
                var provider = deployService.itemProviderName(key);
                provider.items = value;
                notallowed.push(provider);
                response.notAllowed = notallowed;
            });

            vm.manifest = response;

            if(Object.keys(vm.manifest.notAllowed).length > 0){
                vm.deploystep = "problems";
            }else{
                if(Object.keys(vm.manifest.deployment).length === 0){
                     deployService.clearQueue();
                     vm.deploystep = "empty";
                  }else{
                    vm.deploystep = "collect";
                }
            }
        }).error(handleError);
    };

    //deploy the packaged revision to the remote host
    $scope.deploy = function(){

        vm.activeWorkspace = "deploy";
    	vm.deploystep = "deploy";

        deployService.deployQueue().success(function(response){
            //we get a task back
            vm.currentTask = response;
    	}).error(handleError);
    };

    //clear the collected changes to start over
    $scope.clear = function () {
        deployService.clearQueue().success(function () {
            vm.deploystep = "";
            vm.manifest = undefined;
            vm.editorChanges = 0;
            vm.hasChanges = false;
        }).error(handleError);
    };

    //reload the queue
    $scope.reloadQueue = function () {

        //tell the service there is a subscriber
        if (!subscribed) {
            taskManService.subscribe();
            subscribed = true;
        }


        //get the current manifest the editor is adding items to
        deployService.getManifest().success(function (response) {
            vm.manifest = response;
            vm.editorChanges = 0;
            _.each(vm.manifest.Providers, function(provider){
                if (provider.IncludeAll === true) {
                    vm.editorChanges++;
                }
                vm.editorChanges += provider.Items.length;
                provider.name = deployService.itemProviderName(provider.Id).name;
            });

            vm.hasChanges = vm.editorChanges > 0;


            if(response.Providers.length === 0){
                $scope.clear();
            }else{
                vm.deploystep = "current-queue";
            }
        }).error(handleError);
    };

    //package the collected items in the manifest
    $scope.package = function () {

        //tell the service there is a subscriber
        if (!subscribed) {
            taskManService.subscribe();
            subscribed = true;
        }

    	deployService.package().success( function(response){
            vm.deploystep = "pre-collect";
            vm.currentTask = response;
    	}).error(handleError);
    };

    vm.error = {};

    //Handles errors and shows in the UI
    function handleError(err) {

        if (err && err.data) {
            //need to set it to .data because this handles the error
            //bubbling up from $http and from the taskman event
            err = err.data;
        }

        if (err) {
            if (err.ExceptionMessage) {
                vm.error.message = err.Message;
                vm.error.exceptionMessage = err.ExceptionMessage;
                vm.error.type = err.ExceptionType;
                vm.error.stackTrace = err.StackTrace;
                vm.deploystep = "exception";
                vm.workspaceMessage = "deploy";
            }
            else {
                vm.workspaceMessage = "deploy";
                vm.deploystep = "errors";
                vm.errors = err.errors;
            }
        }
    }

    //first get the environment data
    //fetch environment meta data

    function loadUaasData(){

        deployService.environment().then(function (response) {

            vm.environment = response.data;
            vm.user  = {
                    isDebug: vm.environment.debug === true,
                    isLocalEnvironment: vm.environment.localEnvironment === true,
                    userType: vm.environment.userType,
                    settingsSection: false,
                    developerSection: false,
                };

            vm.user.developerSection = vm.environment.userAllowedSections.indexOf("developer") >= 0;
            vm.user.settingsSection = vm.environment.userAllowedSections.indexOf("settings") >= 0;
            vm.user.isDeveloper = (vm.user.developerSection || vm.user.settingsSection);

            //load the current task
            vm.currentTask = taskManService.currentTask;

            //show the portal link to adding the extra env.
            //vm.user.isDeveloper &&
            vm.showAddEnvironment = (vm.environment.configured.length < 2);

            //put markers on the enviroments to mark them in the ui
            _.each(vm.environment.configured, function(env){

                env.current = (env.name == vm.environment.source);
                env.next = (env.name == vm.environment.destination);

                if(env.current){
                    vm.activeWorkspace = env;
                }
            });

            if (vm.environment.destination !== undefined && vm.environment.destination !== "") {
                $scope.showMessage("deploy");
            } else {
                $scope.showMessage("config");
            }

            //on init, check if a task is running already
            if (taskManService.currentTask && !taskManService.currentTask.complete) {
                vm.deploystep = "working";
            }else {
                $scope.reloadQueue();
            }

        }, handleError);
    }

    function getUiObject(environment) {
      return ui;
    }

    init();

});
