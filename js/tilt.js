/**
 * Tilt - A puzzle game
 * @version v1.0.2 - 2014-12-06
 * @link https://github.com/ahackel/tilt
 * @author Andreas Hackel <http://www.andreashackel.de>
 * @license Creative Commons BY-NC License, http://creativecommons.org/licenses/by-nc/4.0/
 */

//'use strict';

var tilt = (function() {
 		// TODO
 		//
 		// $('.button,.button-small').click(function(){
 		//	tilt.audio.play('click');
 		//});

	function init() {
		// disable vertical scrolling:
		//if (tilt.IOS) {

			window.scrollTo(0, 1);
			document.addEventListener("touchmove", function(){
				event.preventDefault();
			}, false);
		//}
	}

	init();

	function loadResource(url, id) {
		var isImage = /.+\.(jpg|png|svg)$/i.test(url);

		if (isImage) {
			tilt.preloadCounter++;
			var image = new Image();
            image.crossOrigin = '';
			image.src = url;
			image.onload = function() {
				console.log('loaded image resource ' + url);
				tilt.preloadedCounter++;
			};
			image.onerror = function() {
				console.log('ERROR: could not load image resource ' + url);
				tilt.preloadedCounter++;
			};
			tilt.images[id] = image;
		}
    }

    function clamp01(val) {
	    return Math.min(1, Math.max(0, val));
	}

	function mixColor(c1, c2, weight) {
		var rgb1 = tinycolor(c1).toRgb();
		var rgb2 = tinycolor(c2).toRgb();
		var w2 = clamp01(weight / 100),
			w1 = 1 - w2;
		rgb1.r = rgb1.r * w1 + rgb2.r * w2;
		rgb1.g = rgb1.g * w1 + rgb2.g * w2;
		rgb1.b = rgb1.b * w1 + rgb2.b * w2;
		return tinycolor(rgb1).toHexString();
	}

    // lighten and warm color
    function lighten(color, amount) {
     	return tinycolor.lighten(color, amount).toHexString();
    }

    // darken and cool coler
    function darken(color, amount) {
    	return tinycolor.darken(color, amount).toHexString();
    }

// Cheats:
	function unlockAllLevels() {
		that.UNLOCK_ALL_LEVELS = ! that.UNLOCK_ALL_LEVELS;
        // to do: force $apply
	}

	function play(id) {
		tilt.game.play(id);
        // to do: switch location
   	}

	function edit(id) {
		if (tilt.game.editor) {
			tilt.game.editor.edit(id);
            // to do: switch location
		}
		else
			console.log('Editor is not active.');
	}


	var tilt = {
		loadResource: loadResource,
//		disableTouchScrolling : disableTouchScrolling,
//		enableTouchScrolling : enableTouchScrolling,
		lighten: lighten,
		darken: darken,
		mixColor: mixColor,
		images: {},
		unlockAllLevels: unlockAllLevels,
		play: play,
		edit: edit
    };

    tilt.VERSION = "1.0.2";
	tilt.REVISION = 184;
	tilt.PIXEL_RATIO = window.devicePixelRatio || 1;
    tilt.IPHONE = /iPhone/i.test(navigator.userAgent);
    tilt.IPHONE5 = (tilt.IPHONE && window.screen.height === 568);
	tilt.IPHONE3 = (tilt.IPHONE && tilt.PIXEL_RATIO === 1);
    tilt.IPAD = /iPad/i.test(navigator.userAgent);
    tilt.ANDROID = /android/i.test(navigator.userAgent);
    tilt.WEB_OS = /hpwos/i.test(navigator.userAgent);
    tilt.IOS = tilt.IPHONE || tilt.IPAD;
    tilt.MOBILE = tilt.IOS || tilt.ANDROID || tilt.WEB_OS;

	var gameDiv = document.getElementById("game"),
		smallDevice = true;
	if (gameDiv) {
		var clientRect = gameDiv.getBoundingClientRect();
		smallDevice = clientRect.width < 768;
	}

	tilt.BLOCKSIZE = (smallDevice ? 32 : 80);
	tilt.BITMAPSIZE = tilt.BLOCKSIZE * tilt.PIXEL_RATIO;
	//if (tilt.IPHONE && !tilt.IPHONE5) tilt.BITMAPSIZE = 32;
    tilt.USE_3D_BOARD = true; //!tilt.IPHONE || tilt.IPHONE5; // only activate 3D on IPHONE 5 or non-IPHONE devices
    tilt.WIDTH = 8;
    tilt.HEIGHT = 8;
    tilt.ORIGIN_X = 0.8;
    tilt.ORIGIN_Y = 0.8;
    tilt.BOARD_WIDTH = tilt.WIDTH + 1.6;
    tilt.BOARD_HEIGHT = tilt.HEIGHT + 1.6;
    tilt.FRAME_WIDTH = 0.4;
    tilt.CORNER_RADIUS = 0.15;
    tilt.BORDER_WIDTH = 0.025;
    tilt.SLIDE_THRESHOLD = 0.55; //0.55;
    tilt.SLIDE_FAST_THRESHOLD = 0.8; //1.2;
    tilt.SLIDE_FASTEST_THRESHOLD = 2; //1.2;
    tilt.ANGLE_MOVE_FULL = 1;
    tilt.MOVE_DELAY = 150; //100;
    tilt.MOVE_FAST_DELAY = 50; //50;
    tilt.MOVE_FASTEST_DELAY = 10; //50;
    tilt.PERSP_OFFSET = -5;
	tilt.MAX_MOVES = 250;
    tilt.UP = 1;
    tilt.RIGHT = 2;
    tilt.DOWN = 4;
    tilt.LEFT = 3;
    tilt.SHOWTARGETS = false;
    tilt.DRAW_REFRESH_RATE = -1; //1000 / 30;
    tilt.USE_DOUBLE_BUFFER = false;
    tilt.BOARD_DEPTH = 1;
    tilt.COLOR_BOARD = "#926138"; //"#b0996b";
	tilt.COLOR_BOARD_NO_BOUNDS = "#000000";
    tilt.COLOR_RED = "#d03613";
    tilt.COLOR_BLUE = "#0d66c5";
    tilt.COLOR_GREEN = "#4b7221"; //#708404"; //"#5b8732"; // "#46721c";
    tilt.COLOR_BOARD_BG = "#4d7813";
    tilt.COLOR_BACKGROUND = "#708404"; //"#446e20";
    tilt.UNLOCK_ALL_LEVELS = (localStorage['unlockAllLevels'] === 'true');
    tilt.DEBUG = false;
	tilt.DEVELOPER = false;
    tilt.EDITOR = tilt.DEVELOPER && !tilt.MOBILE;
    tilt.GYRO_ENABLED = false;
	tilt.LANGUAGES = ['en', 'de', 'es', 'fr', 'jp', 'kr']
	tilt.BETA_TESTERS = ['Ulrich Hackel', 'Christine Plückers', 'Jutta Plückers', 'Ute Plückers', "Stefan Kögler",
		"Stephan Schwake", "Kai Wernicke", "Elias Wernicke", "Aaron Marroquin", "Per Niemann", "Robert Clemens",
		"Boris Bauer", "Timo Müller-Wegner", "Jörn Zirfaß", "Moritz Mönnich", "Jost Sweinfurther", "Christoph Simon",
		"Matthias Kummer"];
	tilt.SPECIAL_THANKS = ['Helga Hackel', 'Candygun Games', 'MBL Development', 'Carsten Brüggmann'];

	tilt.preloadCounter = 0;
	tilt.preloadedCounter = 0;
	tilt.loadingStack = {};

    //window.tilt = tilt;

    return tilt;
})();

