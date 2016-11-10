var contentEditingHelperDecorator = function($delegate, appState, deployService, navigationService, editorState) {

    $delegate.configureContentEditorButtons = (function() {
        var cached_function = $delegate.configureContentEditorButtons;
        return function() {
            var buttons = cached_function.apply(this, arguments);

            buttons.subButtons.push({

                                letter: "D",
                                labelKey: "Deploy",
                                hotKey: "ctrl+d",
                                handler: function(){

                                                //getting the current tree node to open the dialog against.
                                                var node = appState.getTreeState("selectedNode");
                                                if(!node){
                                                    node = editorState.current;
                                                }

                                                navigationService.showDialog({
                                                    action:{
                                                        name: "Deploy",
                                                        metaData:{
                                                            actionView: "../app_plugins/deploy/views/deploy-dialog.html",
                                                            dialogMode: true
                                                        }
                                                    },                                                    
                                                    node: node
                                                });
                                            }
                                
                            });

            return buttons;
        };
    }());

    return $delegate;
};

angular.module("umbraco").config(["$provide", function ($provide) {
    $provide.decorator("contentEditingHelper",  contentEditingHelperDecorator);
}]);