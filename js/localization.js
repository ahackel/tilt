/**
 * Tilt - A puzzle game
 * @version v1.0.2 - 2014-12-06
 * @link
 * @author Andreas Hackel <http://www.andreashackel.de>
 * @license Creative Commons BY-NC License, http://creativecommons.org/licenses/by-nc/4.0/
 */

tiltApp.factory('localize', function($http, $rootScope) {
    var LOCAL_STORAGE_ID = 'language',
        storageString = localStorage[LOCAL_STORAGE_ID];

    var localize = {

        languages: tilt.LANGUAGES,
        language: 'en',
        dictionary: [],
        languageLoaded: null,

        updateLanguage: function(){
			localize.language = storageString || navigator.language.substring(0, 2) || 'en';
		},

		successCallback: function (data) {
            localize.dictionary = data;
            localize.resourceFileLoaded = true;
            $rootScope.$broadcast('localizeResourcesUpdates');
        },

        loadLanguage: function (newLanguage) {
            if (localize.languageLoaded != newLanguage) {
                localize.languageLoaded = newLanguage;
                console.log('loading language', newLanguage);
                var url = 'loc/' + localize.language + '.json';
                $http({ method:"GET", url:url, cache:false }).success(localize.successCallback);
                return true;
            }
            return false;
        },


        translate: function(s) {
            var result = s;

            if (localize.loadLanguage(localize.language)) {
                // current language is not yet loaded, cannot translate...
                 return '';
            }

            if (localize.dictionary[s])
                result = localize.dictionary[s];

            //console.log('Translate', s, result);

            return result;
        }
    };

	localize.updateLanguage();

    $rootScope.$watch(function() { return localize.language; }, function() {
        localStorage[LOCAL_STORAGE_ID] = localize.language;
        localize.loadLanguage(localize.language);
    }, false);

    return localize;
});
