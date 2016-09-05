angular.module('chatApp.utils', [])

.factory('$_', function() {
	return window._; // assumes underscore has already been loaded on the page
})

.factory('$localstorage', ['$window', function($window) {
    return {
        set: function(key, value) {
            $window.localStorage[key] = value;
        },
        get: function(key, defaultValue) {
          return $window.localStorage[key] || defaultValue;
        },
        setObject: function(key, value) {
          $window.localStorage[key] = JSON.stringify(value);
        },
        getObject: function(key) {
          return JSON.parse($window.localStorage[key] || '{}');
        },
        addLogEntry: function(value) {
            var log = JSON.parse($window.localStorage["log"] || '[]');
            log.push(value);
            $window.localStorage["log"] = JSON.stringify(log);
        },
        clearLog: function() {
            $window.localStorage.removeItem("log");
        }
    }
}]);
