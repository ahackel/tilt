/**
 * Tilt - A puzzle game
 * @version v1.0.2 - 2014-12-06
 * @link
 * @author Andreas Hackel <http://www.andreashackel.de>
 * @license Creative Commons BY-NC License, http://creativecommons.org/licenses/by-nc/4.0/
 */

"use strict";

var tiltApp = angular.module('tiltApp', ['ngRoute', 'angular-carousel']);

tiltApp.config(function($routeProvider, $locationProvider){
    //$locationProvider.html5Mode(true);
    $routeProvider.
        when('/main', { controller: 'MainCtrl', templateUrl: 'views/main.html' }).
        when('/levels', { controller: 'LevelsCtrl', templateUrl: 'views/levels.html' }).
        when('/play/:category/:name', { controller: 'PlayCtrl', templateUrl: 'views/play.html' }).
        when('/edit', { controller: 'EditCtrl', templateUrl: 'views/edit.html' }).
        when('/edit/:category/:name', { controller: 'EditCtrl', templateUrl: 'views/edit.html' }).
        when('/pause', { controller: 'PauseCtrl', templateUrl: 'views/pause.html' }).
        when('/settings', { controller: 'SettingsCtrl', templateUrl: 'views/settings.html' }).
        when('/languages', { controller: 'LanguagesCtrl', templateUrl: 'views/languages.html' }).
        when('/about', { controller: 'AboutCtrl', templateUrl: 'views/about.html' }).
        when('/gameend', { controller: 'GameEndCtrl', templateUrl: 'views/gameend.html' }).
        otherwise({ redirectTo:'/main' })
});


tiltApp.run(function($rootScope, $location, $window, audio){

    $rootScope.resourcesLoaded = false;

	$rootScope.go = function(hash) {
        $location.path(hash);
    };
    $rootScope.goBack = function() {
        $window.history.back();
    };
    $rootScope.safeApply = function(fn) {
        var phase = this.$root.$$phase;
        if(phase == '$apply' || phase == '$digest') {
            if(fn && (typeof(fn) === 'function')) {
                fn();
            }
        } else {
            this.$apply(fn);
        }
    };

	$rootScope.isFreeEdition = function() {
		// tilt always has all levels:
		return false;
	};

	$rootScope.isLoading = function() {
		return (Object.keys(tilt.loadingStack).length > 0); };

	function loadResources() {
		// preload the images that are used in the main screen:

		tilt.loadResource((tilt.IPHONE3) ? 'img/background_low.png' : 'img/background.png', 'background');
		tilt.loadResource('img/logo.svg', 'logo');
		tilt.loadResource('img/logo-free.svg', 'logo_free');
		tilt.loadResource('img/logo-shadow.png', 'logo_shadow');
		tilt.loadResource((tilt.IPHONE3) ? 'img/board_low.png' : 'img/board.png', 'board');
		tilt.loadResource((tilt.IPHONE3) ? 'img/board_nobounds_low.png' : 'img/board_nobounds.png', 'board_nobounds');
		tilt.loadResource((tilt.IPHONE3) ? 'img/coin-shadow_low.png' : 'img/coin-shadow.png', 'coin_shadow');
		tilt.loadResource('img/elements.png', 'elements');
		tilt.loadResource((tilt.IPHONE3) ? 'img/block-shadow_low.png' : 'img/block-shadow.png', 'block_shadow');
        if (tilt.EDITOR) {
			tilt.loadResource('img/numbers.png', 'numbers');
			tilt.loadResource('img/delete.svg', 'delete');
			tilt.loadResource('img/eyedropper.svg', 'eyedropper');
		}
		tilt.loadResource('img/coin.svg', 'coin');
		tilt.loadResource('img/button.svg', 'button');
		tilt.loadResource((tilt.IPHONE3) ? 'img/button-shadow_low.png' : 'img/button-shadow.png', 'button_shadow');
		tilt.loadResource((tilt.IPHONE3) ? 'img/hole-shadow_low.png' : 'img/hole-shadow.png', 'hole_shadow');
		audio.load('audio/pop.mp3', 'door-opened');
		audio.load('audio/wood2.mp3', 'click');
		audio.load('audio/wood2.mp3', 'block-moved');
		audio.load('audio/bell2.mp3', 'star');
		audio.load('audio/bell3.mp3', 'record');
		audio.load('audio/reset.mp3', 'reset');
		audio.load('audio/xylophone_high3.mp3', 'won_1');
		audio.load('audio/xylophone_low3.mp3', 'won_2');
		audio.load('audio/zen4.mp3', 'music', { volume: 0.3, loop: true, streaming: true});
	}

	loadResources();

});

tiltApp.filter('loc', function (localize) {
    return function (input) {
        return localize.translate(input);
    };
});

tiltApp.filter('replace', function() {
    return function (input) {
		var result = input;
		if (arguments.length > 1){
			for (var i = 1; i < arguments.length; i++)
				result = result.replace('$' + (i - 1), arguments[i]);
		}
        return result;
    };
});

tiltApp.filter('timespan', function() {
    return function (input) {
		if (input === null)
			return null;

        var seconds = Math.round(input / 1000),
            hours = Math.floor(seconds / 3600);

        seconds -= hours*3600;

        var minutes = Math.floor(seconds / 60);
        seconds -= minutes*60;

        if (hours   < 10) {hours   = "0"+hours;}
        if (minutes < 10) {minutes = "0"+minutes;}
        if (seconds < 10) {seconds = "0"+seconds;}
        return hours+':'+minutes+':'+seconds;
    };
});

tiltApp.directive('view', function(){
    return {
        restrict: 'E',
        transclude: true,
        replace: true,
        template: '<div class="screen" ng-transclude></div>'
    }
});

tiltApp.directive('stars', function(){
    return {
        restrict: 'E',
		replace: true,
        template: '<div class="stars"></div>',
		link: function(scope, iElement, iAttrs) {
			var count = iAttrs['ahCount'];
			for (var i = 0; i < count; i++)
				iElement.append('<div class="star"></div>');
		}
    }
});

tiltApp.directive('ahProgressbar', function(){
	return {
		restrict: 'E',
		replace: true,
		template: '<div class="progress" ng-hide="progress == 100"><div class="bar"></div></div>',
		link: function(scope, iElement, iAttrs) {
			var bar = iElement.find('div');
			scope.$watch('progress', function(value){
				bar.css('width', scope.progress + "%");
			})
		}
	}
});

tiltApp.directive('ahButton', function(audio){
	return {
		restrict: 'E',
		replace: true,
		transclude: true,
		template: '<button ng-transclude></button>',
		link: function(scope, iElement, iAttrs) {
			iElement.bind('click touchend', function(){
				tilt.audio.play('click');
			});
		}
	}
});

var levelThumbCaches = {};

tiltApp.directive('level', function(levels){
    return {
        restrict: 'E',
        transclude: true,
        replace: true,
        template: '<div class="level" ng-transclude></div>',
        link: function(scope, iElement, iAttrs) {
			var visibleElements = 'ABCDbcd';
			var elementOffsets = {
				'A': 0,
				'B': 20,
				'C': 40,
				'D': 120,
				'b': 60,
				'c': 80,
				'd': 140
			};

			var cached = false; //tilt.IPHONE && !tilt.IPHONE5; // use cache on low-end platfporms (iPhone 4)

            var id = iAttrs['ahId'],
				locked = (iAttrs['ahLocked'] === "true") ? true : false;

            if (!locked) {
				if (id) {
					var elements = levels.get(id).elements;

					if (cached) {
						if (!levelThumbCaches[id]) {
							var canvas = document.createElement('Canvas');
							levelThumbCaches[id] = canvas;
							var ctx = canvas.getContext('2d');

							var clientRect = iElement[0].getBoundingClientRect();

							var blockWidth = Math.min(20, (clientRect.width / tilt.WIDTH) * tilt.PIXEL_RATIO),
								blockHeight = Math.min(20, (clientRect.height / tilt.HEIGHT) * tilt.PIXEL_RATIO);

							canvas.width = blockWidth * tilt.WIDTH;
							canvas.height = blockHeight * tilt.HEIGHT;
							ctx.scale(blockWidth, blockHeight);

							var x = 0,
								y = 0;

							for (var i = 0; i < elements.length; i++) {
								var code = elements[i];
								if (visibleElements.indexOf(code) > -1) {
									var offset = elementOffsets[code];
									ctx.drawImage(tilt.images['elements'], offset, 0, 20, 20, x, y, 1, 1);
								}
								x++;
								if (x == tilt.WIDTH) {
									x = 0;
									y++;
								}
							}
						}
						iElement.prepend(levelThumbCaches[id]);
					}
					else {
						var s = '<div class="thumbnail">';
						for (var i = 0; i < elements.length; i++) {
							var code = elements[i];
							if (visibleElements.indexOf(code) > -1)
								s += '<div class="thumb-' + code + '"></div>';
							else
								s += '<div class="thumb-empty"></div>';
						}

						s += '</div>';

						iElement.prepend(s);
					}
				}
			}
			else
				iElement.prepend('<div class="lock"></div>');
			//iElement.toggleClass('locked', locked);
        }
    }
});

tiltApp.controller('AppCtrl', function AppCtrl($scope, $timeout, game) {

	tilt.loadingStack['routeChange'] = true;
	$scope.game = game;

	$scope.$on("$routeChangeStart", function(event, next){
		//console.log('routeChangeStart', next.$$route.templateUrl);
		tilt.loadingStack['routeChange'] = true;
	});

	$scope.$on("$routeChangeSuccess", function(event, next){
		//console.log('routeChangeSuccess', next.$$route.templateUrl);
		// we need timeout here, to ensure the black screen is displayed:
		$timeout(function(){
			delete tilt.loadingStack['routeChange'];
		});
	});

	$scope.isIdle = function(){ return false; };
});

tiltApp.controller('LoadingCtrl', function LoadingCtrl($scope, $timeout, audio, $rootScope, game) {
    $rootScope.resourcesLoaded = (navigator.splashscreen);
	$scope.progress = 0;

    function updateProgress() {
        $scope.progress = tilt.preloadCounter > 0 ? (tilt.preloadedCounter / tilt.preloadCounter) * 100 : 0;
        if ($scope.progress === 100)
            $timeout(showMainScreen);
        else
            $timeout(updateProgress, 30);
    }


    function showMainScreen() {
		console.log('Loading completed');
		$rootScope.resourcesLoaded = true;

		// audio.play can only be triggered by a click:
		var playMusic = function(){
			audio.play('music');
			document.removeEventListener('touchend', playMusic);
		}
		document.addEventListener('touchend', playMusic);

        if (window.cordova) {
			document.addEventListener('pause', function(){
				// save memory when app is put into background:
				game.pause();
				tilt.bitmapCache.clear();
			}, false);

			document.addEventListener('resume', function(){
				if (tilt.DEVELOPER && window.plugins && window.plugins.testFlight) {
					window.plugins.testFlight.passCheckpoint(function(){}, function(){}, 'Resuming app from background');
				game.resume();
				}
			}, false);

		}

        if (navigator.splashscreen)
            navigator.splashscreen.hide();
     }

     updateProgress();
});

tiltApp.controller('MainCtrl', function MainCtrl($scope) {
	$scope.openFacebook = function(){
		window.open("http://facebook.com/tiltgame", '_system');
	};
});

tiltApp.controller('LevelsCtrl', function LevelsCtrl($scope, progress, levels) {
	$scope.title = { text: "Simple" };
	$scope.categoryIndex = levels.getCategoryIndex(progress.currentCategory);
	if ($scope.categoryIndex < 0)
		$scope.categoryIndex = 0;
	$scope.categories = [];

	var length = levels.lengthCategories;
    for (var i = 0; i < length; i++) {
        var category = levels.getCategory(i);
        if (!progress.isCategoryLocked(category))
            $scope.categories.push(category);
    }
});

tiltApp.controller('CategoryCtrl', function CategoryCtrl($scope, $location, $timeout, progress, levels, audio) {
	$scope.levels = [];

	//workaround for levels starting immediately:
	$scope.lockPlay = true;
	$timeout(function(){
		$scope.lockPlay = false;
	}, 100);

    var levelDatas = levels.get(levels.getByCategory($scope.category));

    for (var i = 0; i < levelDatas.length; i++) {
        var id = levelDatas[i].id,
			levelProgress = progress.getLevelProgress(id);

        $scope.levels.push({
            id: id,
            locked: progress.isLevelLocked(levelDatas[i].id),
            stars: (levelProgress) ? levelProgress.stars : 0,
			noBounds: levelDatas[i].noBounds,
			isCurrentLevel: (id == progress.currentLevel)
        });
    }

	$scope.$watch('categoryIndex', function(newValue, oldValue) {
		$scope.title.text = levels.getCategory(newValue);
	}, true);

    $scope.play = function(id) {
		if (!$scope.lockPlay && !progress.isLevelLocked(id)) {
			tilt.audio.play('click');
			$location.path('/play/'+id);
		}
	}
});

tiltApp.controller('PlayCtrl', function PlayCtrl($scope, $routeParams, game) {
    $scope.game = game;
    $scope.replay = tilt.replay;
    $scope.canEdit = tilt.EDITOR;
    var id = $routeParams.category + "/" + $routeParams.name;
    $scope.$on('$viewContentLoaded', function() {
		if (tilt.DEVELOPER && window.plugins && window.plugins.testFlight) {
			window.plugins.testFlight.passCheckpoint(function(){}, function(){}, 'Is playing level ' + id);
		}
        game.play(id);
    });
	$scope.debug = tilt.DEBUG;
	$scope.getCacheSize = function(){ return Object.keys(tilt.bitmapCache.items).length; }
	$scope.getDrawCalls = function(){ return tilt.bitmapCache.drawCalls; }
});

tiltApp.controller('EditCtrl', function EditCtrl($scope, $routeParams, game) {
    $scope.game = game;
    var id = $routeParams.category + "/" + $routeParams.name;
    $scope.$on('$viewContentLoaded', function() {
        game.editor.edit(id);
    });
});

tiltApp.controller('PauseCtrl', function PauseCtrl($scope, $timeout, game, audio) {
    var cancelUpdate;

	$scope.game = game;
	$scope.audio = tilt.audio;
	$scope.replay = tilt.replay;

    $scope.stars = 0;
	$scope.maxStars = game.stars;
	$scope.title = "Game Paused";


	if ($scope.game.isGameOver) {
		switch (game.stars) {
			case 4: $scope.title = "Woooooow!"; break;
			case 3: $scope.title = "Perfect!"; break;
			case 2: $scope.title = "Amazing!"; break;
			case 1: $scope.title = "Very good!"; break;
			default: $scope.title = "You failed!";
		}
	}

    function addStar() {
		if ($scope.stars < $scope.maxStars) {
            audio.play('star');
			$scope.stars++;
            cancelUpdate = $timeout(addStar, 300);
        }
        else
          countScore();
    }

    $scope.showButtons = true;//!$scope.game.isGameOver;
    $scope.showMinMoves = !$scope.game.isGameOver;
	$scope.devBeaten = false;
	$scope.score = (!$scope.game.isGameOver) ? $scope.game.score : 0;
    $scope.totalScore = $scope.game.score;
	$scope.isNewRecord = false;
    var scoreStep = Math.ceil($scope.totalScore / 20);

    function countScore() {
        if ($scope.score < $scope.totalScore) {
			$scope.score = Math.min($scope.totalScore, $scope.score + scoreStep);
			cancelUpdate = $timeout(countScore, 33);
        }
        else {
			$scope.isNewRecord = $scope.score > $scope.game.bestScore;
			if ($scope.isNewRecord)
				audio.play('record');

			if ($scope.game.moves > $scope.game.minMoves)
				cancelUpdate = $timeout(function(){ $scope.showMinMoves = true; }, 100);

			if ($scope.game.moves < $scope.game.minMoves)
				cancelUpdate = $timeout(function(){ $scope.devBeaten = true; }, 100);
			$scope.showButtons = true;
        }
    }

    // update the time:

    if ($scope.game.isGameOver)
        addStar();

	$scope.$on('$destroy', function(){
		$timeout.cancel(cancelUpdate);
	});
});

tiltApp.controller('SettingsCtrl', function SettingsCtrl($scope, progress, localize) {
    $scope.audio = tilt.audio;

    $scope.isReset = function(){ return progress.isReset; }

	$scope.isDeveloper = tilt.DEVELOPER;

    $scope.resetProgress = function() {
        progress.reset();
		localize.updateLanguage();
		tilt.UNLOCK_ALL_LEVELS = false;
    }

	$scope.unlockAllLevels = function(){
		tilt.UNLOCK_ALL_LEVELS = true;
		localStorage['unlockAllLevels'] = 'true';
	};

	$scope.allLevelsUnlocked = function() {
		return tilt.UNLOCK_ALL_LEVELS;
	}
});

tiltApp.controller('LanguagesCtrl', function LanguagesCtrl($scope, localize, $location) {
    $scope.languages = localize.languages;

    $scope.swapLanguage = function(language) {
  //      console.log('swapLanguage', language);
        localize.language = language;
        $location.path('/settings');
		if (tilt.DEVELOPER && window.plugins && window.plugins.testFlight) {
			window.plugins.testFlight.passCheckpoint(function(){}, function(){}, 'Set language to ' + language);
		}
    }
});

tiltApp.controller('AboutCtrl', function AboutCtrl($scope, localize) {
	$scope.betaTesters = tilt.BETA_TESTERS.join('<br>');
	$scope.specialThanks = tilt.SPECIAL_THANKS.join('<br>');

	$scope.version = '' + tilt.VERSION + ' (' + tilt.REVISION + ')';
	if (tilt.DEVELOPER && window.plugins && window.plugins.testFlight) {
		window.plugins.testFlight.passCheckpoint(function(){}, function(){}, 'Showing credits');
	}
});

function GameEndCtrl($scope, progress) {
}

function preventOverscroll(){
	document.addEventListener("touchmove", evt => evt.preventDefault());
}

document.addEventListener("DOMContentLoaded", function() {
	
	//preventOverscroll();

	var htmlElement = document.getElementsByTagName("html")[0],
		resizeTimeout;

	function resize(){
		var size = window.innerWidth,
			scale = (window.innerWidth > 320) ? 9.6 : 8;
		if (window.innerHeight * 0.8 < size)
			size = window.innerHeight * 0.8;

		htmlElement.style.fontSize = (size / scale) + "px";
	}

	// initial size:
	resize();

	window.addEventListener("resize", function(){
		if (!resizeTimeout) {
			resizeTimeout = setTimeout(function(){
				resizeTimeout = null;
				// scale everything to window width:
				resize();
			}, 66);
		}
	}, false);


    if (window.cordova) {
        document.addEventListener('deviceready', function () {
			if (tilt.DEVELOPER) {
				window.plugins.testFlight = cordova.require("cordova/plugin/testflightsdk");

				window.plugins.testFlight.setDeviceIdentifier(function(){
					console.log('device identify success');
				}, function(){
					console.log('device identify failed');
				}, window.device.udid);

				window.plugins.testFlight.takeOff(function(){}, function(){}, '7074e865-1a63-4eb1-a721-f681a401393e');
			}
			angular.bootstrap(document, ['tiltApp']);
        });
    }
    else {
        angular.bootstrap(document, ['tiltApp']);
    }
}, false);
