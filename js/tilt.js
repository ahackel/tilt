/**
 * Tilt - A puzzle game
 * @version v1.0.2 - 2014-12-06
 * @link https://github.com/ahackel/tilt
 * @author Andreas Hackel <http://www.andreashackel.de>
 * @license Creative Commons BY-NC License, http://creativecommons.org/licenses/by-nc/4.0/
 */

'use strict';

class Tilt {

	constructor() {
		this.VERSION = "1.0.3";
		this.REVISION = 184;
		this.PIXEL_RATIO = window.devicePixelRatio || 1;
		this.IPHONE = /iPhone/i.test(navigator.userAgent);
		this.IPHONE5 = (this.IPHONE && window.screen.height === 568);
		this.IPHONE3 = (this.IPHONE && this.PIXEL_RATIO === 1);
		this.IPAD = /iPad/i.test(navigator.userAgent);
		this.ANDROID = /android/i.test(navigator.userAgent);
		this.WEB_OS = /hpwos/i.test(navigator.userAgent);
		this.IOS = this.IPHONE || this.IPAD;
		this.MOBILE = this.IOS || this.ANDROID || this.WEB_OS;
		this.BLOCKSIZE = (this._isSmallDevice() ? 32 : 80);
		this.BITMAPSIZE = this.BLOCKSIZE * this.PIXEL_RATIO;
		//if (this.IPHONE && !this.IPHONE5) this.BITMAPSIZE = 32;
		this.WIDTH = 8;
		this.HEIGHT = 8;
		this.ORIGIN_X = 0.8;
		this.ORIGIN_Y = 0.8;
		this.BOARD_WIDTH = this.WIDTH + 1.6;
		this.BOARD_HEIGHT = this.HEIGHT + 1.6;
		this.FRAME_WIDTH = 0.4;
		this.CORNER_RADIUS = 0.15;
		this.BORDER_WIDTH = 0.025;
		this.SLIDE_THRESHOLD = 0.55; //0.55;
		this.SLIDE_FAST_THRESHOLD = 0.8; //1.2;
		this.SLIDE_FASTEST_THRESHOLD = 2; //1.2;
		this.ANGLE_MOVE_FULL = 1;
		this.MOVE_DELAY = 150; //100;
		this.MOVE_FAST_DELAY = 50; //50;
		this.MOVE_FASTEST_DELAY = 10; //50;
		this.PERSP_OFFSET = -5;
		this.MAX_MOVES = 250;
		this.UP = 1;
		this.RIGHT = 2;
		this.DOWN = 4;
		this.LEFT = 3;
		this.SHOWTARGETS = false;
		this.DRAW_REFRESH_RATE = -1; //1000 / 30;
		this.USE_DOUBLE_BUFFER = false;
		this.BOARD_DEPTH = 1;
		this.COLOR_BOARD = "#926138"; //"#b0996b";
		this.COLOR_BOARD_NO_BOUNDS = "#000000";
		this.COLOR_RED = "#d03613";
		this.COLOR_BLUE = "#0d66c5";
		this.COLOR_GREEN = "#4b7221"; //#708404"; //"#5b8732"; // "#46721c";
		this.COLOR_BOARD_BG = "#4d7813";
		this.COLOR_BACKGROUND = "#708404"; //"#446e20";
		this.UNLOCK_ALL_LEVELS = (localStorage['unlockAllLevels'] === 'true');
		this.DEBUG = false;
		this.DEVELOPER = true;
		this.EDITOR = this.DEVELOPER && !this.MOBILE;
		this.GYRO_ENABLED = false;
		this.LANGUAGES = ['en', 'de', 'es', 'fr', 'jp', 'kr']
		this.BETA_TESTERS = ['Ulrich Hackel', 'Christine Plückers', 'Jutta Plückers', 'Ute Plückers', "Stefan Kögler",
			"Stephan Schwake", "Kai Wernicke", "Elias Wernicke", "Aaron Marroquin", "Per Niemann", "Robert Clemens",
			"Boris Bauer", "Timo Müller-Wegner", "Jörn Zirfaß", "Moritz Mönnich", "Jost Sweinfurther", "Christoph Simon",
			"Matthias Kummer"];
		this.SPECIAL_THANKS = ['Helga Hackel', 'Candygun Games', 'MBL Development', 'Carsten Brüggmann'];

		this.preloadCounter = 0;
		this.preloadedCounter = 0;
		this.loadingStack = {};
		this.images = [];

		// disable vertical scrolling:
		window.scrollTo(0, 1);
		document.addEventListener("touchmove", function(){
			event.preventDefault();
		}, false);
	}

	_isSmallDevice() {
		var gameDiv = document.getElementById("game");
		if (gameDiv) {
			var clientRect = gameDiv.getBoundingClientRect();
			return clientRect.width < 768;
		}
		return true;
	}

	loadResource(url, id) {
		var isImage = /.+\.(jpg|png|svg)$/i.test(url);

		if (isImage) {
			this.preloadCounter++;
			var image = new Image();
            image.crossOrigin = '';
			image.src = url;
			image.onload = () => {
				console.log('loaded image resource ' + url);
				this.preloadedCounter++;
			};
			image.onerror = () => {
				console.log('ERROR: could not load image resource ' + url);
				this.preloadedCounter++;
			};
			this.images[id] = image;
		}
    }

    clamp01(val) {
	    return Math.min(1, Math.max(0, val));
	}

	mixColor(c1, c2, weight) {
		var rgb1 = tinycolor(c1).toRgb();
		var rgb2 = tinycolor(c2).toRgb();
		var w2 = this.clamp01(weight / 100),
			w1 = 1 - w2;
		rgb1.r = rgb1.r * w1 + rgb2.r * w2;
		rgb1.g = rgb1.g * w1 + rgb2.g * w2;
		rgb1.b = rgb1.b * w1 + rgb2.b * w2;
		return tinycolor(rgb1).toHexString();
	}

    // lighten and warm color
    lighten(color, amount) {
     	return tinycolor.lighten(color, amount).toHexString();
    }

    // darken and cool coler
    darken(color, amount) {
    	return tinycolor.darken(color, amount).toHexString();
    }

// Cheats:
	unlockAllLevels() {
		this.UNLOCK_ALL_LEVELS = ! this.UNLOCK_ALL_LEVELS;
        // to do: force $apply
	}

	play(id) {
		this.game.play(id);
        // to do: switch location
   	}

	edit(id) {
		if (this.game.editor) {
			this.game.editor.edit(id);
            // to do: switch location
		}
		else
			console.log('Editor is not active.');
	}
}

var tilt = new Tilt();
