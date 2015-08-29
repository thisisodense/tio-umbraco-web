var contentEditingHelperDecorator = function($delegate, deployService, navigationService, editorState) {

    $delegate.configureContentEditorButtons = (function() {
        var cached_function = $delegate.configureContentEditorButtons;
        return function() {
            var buttons = cached_function.apply(this, arguments);

            buttons.subButtons.push({

                                letter: "D",
                                labelKey: "Deploy",
                                hotKey: "ctrl+d",
                                handler: function(){
                                                
                                                navigationService.showDialog({
                                                    action:{
                                                        name: "Deploy",
                                                        metaData:{
                                                            actionView: "../app_plugins/deploy/views/deploy.html"
                                                        }
                                                    },
                                                    node: editorState.current
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