angular.module('umbraco.resources').factory('dictionanyResource',
    function ($q, $http) {
    	return {
    		getTranslation: function (label, lang) {
    			return $http.get("/Api/Dictionany/GetTranslation/" + label + '/' + lang);
    		}
    	};
    }
);