/**
 * Tilt - A puzzle game
 * @version v1.0.2 - 2014-12-06
 * @link
 * @author Andreas Hackel <http://www.andreashackel.de>
 * @license Creative Commons BY-NC License, http://creativecommons.org/licenses/by-nc/4.0/
 */

'use strict';

tiltApp.factory('input', function($rootElement) {

	var _startMouseX,
		_startMouseY,
		_key = 0,
		_movingHorizontally,
		_currentTouchIdentifier,

		input = {
			deltaX : 0,
			deltaY : 0,
			mouseButton : -1,
			mouseX : -1,
			mouseY : -1,
			shiftKey : false,
			altKey : false,
			bind: bind,
			unbind: unbind,
			updateGamepadInput : updateGamepadInput
		};

	function onKeydown(event) {
		//event.preventDefault();
		input.shiftKey = event.shiftKey;
		input.altKey = event.altKey;

		if (_key != event.which) {
			_key = event.which;

			switch(_key) {
				case KeyboardEvent.DOM_VK_LEFT:
					input.deltaX = -1;
					break;
				case KeyboardEvent.DOM_VK_RIGHT:
					input.deltaX = 1;
					break;
				case KeyboardEvent.DOM_VK_UP:
					input.deltaY = -1;
					break;
				case KeyboardEvent.DOM_VK_DOWN:
					input.deltaY = 1;
					break;
			}
		}
	}

	function onKeyup(event) {
		//event.preventDefault();
		_key = 0;
		input.shiftKey = event.shiftKey;
		input.altKey = event.altKey;

		input.deltaX = 0;
		input.deltaY = 0;
	}

	function onMouseDown(event) {
		//console.log('tilt.input.onMouseDown');
		if (event.type == "touchstart") {

			// ignore additional touches:
			if (_currentTouchIdentifier) {
				event.preventDefault();
				return;
			}
			_currentTouchIdentifier = event.touches[0].identifier;
			//console.log(_currentTouchIdentifier);

			// map touches to left mouse button:
			input.mouseButton = 0;
		}
		else
			input.mouseButton = event.button;

		resetDrag();
		// onMouseMove handles details:
		onMouseMove(event);
		// dont call event.preventDefault(), because this would prevent the system from sending click events...
	}

	function handleDragAction(clientX, clientY) {
		if (_startMouseX == null) _startMouseX = clientX;
		if (_startMouseY == null) _startMouseY = clientY;

		input.deltaX = (clientX - _startMouseX) / tilt.BLOCKSIZE;
		input.deltaY = (clientY - _startMouseY) / tilt.BLOCKSIZE;

		//console.log(input.mouseButton);

		if (_movingHorizontally === true) input.deltaY = 0;
		if (_movingHorizontally === false) input.deltaX = 0;

		// calculate if dragging horizontally or vertically:
		if (input.deltaX != null && _movingHorizontally == null) {
			var dragThreshold = 0.5; // direction is defined when moving further than this

			var absDeltaX = Math.abs(input.deltaX);
			var absDeltaY = Math.abs(input.deltaY);

			if (absDeltaX > dragThreshold || absDeltaY > dragThreshold)
				_movingHorizontally = absDeltaX > absDeltaY;
		}
	}

	function resetDrag() {
		_startMouseX = null;
		_startMouseY = null;
		_movingHorizontally = null;
	}

	function onMouseMove(event) {
		//console.log('tilt.input.onMouseMove');
		//event.stopPropagation();

		event.preventDefault();

		var clientX = event.clientX;
		var clientY = event.clientY;

		if (event.type == "touchmove" || event.type == "touchstart") {
			clientX = event.touches[0].clientX;
			clientY = event.touches[0].clientY;
		}

        var canvas = document.getElementById("game-canvas");
        if (canvas) {

            var clientRect = canvas.getBoundingClientRect();

            input.mouseX = Math.floor((clientX - clientRect.left) / tilt.BLOCKSIZE - tilt.ORIGIN_X);
            input.mouseY = Math.floor((clientY - clientRect.top) / tilt.BLOCKSIZE - tilt.ORIGIN_Y);

            input.deltaX = 0;
            input.deltaY = 0;

            if (input.mouseButton == 0) {
            	handleDragAction(clientX, clientY);
            }
        }
	}

	function onMouseUp(event) {
		//console.log('tilt.input.onMouseUp');
		//event.preventDefault();
		input.mouseButton = -1;
		input.deltaX = 0;
		input.deltaY = 0;
		resetDrag();
	}

	function onMouseOut(event) {
		//console.log('tilt.input.onMouseOut');

		// check if mouse has left the window:
		if (event.toElement == null && event.relatedTarget == null) {
			//event.preventDefault();
			input.deltaX = 0;
			input.deltaY = 0;
			input.mouseButton = -1;
			input.mouseX = -1;
			input.mouseY = -1;
			resetDrag();
		}
	}

	function onTouchEnd(event) {
		// Check if the finger that first touched the board is released, ignore other fingers that might have been added:
		for (var i in event.changedTouches) {
			var touch = event.changedTouches[i];
			if (_currentTouchIdentifier == touch.identifier) {
				onMouseUp(event);
				_currentTouchIdentifier = null;
			}
		}

		// other fingers:
	//	event.preventDefault();
	}

	function updateGamepadInput() {
		if (window.Gamepad && Gamepad.supported) {
			var states = Gamepad.getStates();
			if (states.length > 0) {
				input.deltaX = states[0].leftStickX;
				input.deltaY = states[0].leftStickY;
			}
		}
	}

	function bind() {
		var root = $rootElement[0];

		if ('ontouchstart' in window) {
			root.addEventListener('touchstart', onMouseDown, false);
			root.addEventListener('touchmove', onMouseMove, false);
			root.addEventListener('touchend', onTouchEnd, false);
			root.addEventListener('touchcancel', onTouchEnd, false);
		}
		else {
			root.addEventListener('mousedown', onMouseDown, false);
			root.addEventListener('mousemove', onMouseMove, false);
			root.addEventListener('mouseup', onMouseUp, false);
			root.addEventListener('mouseout', onMouseOut, false);
			root.addEventListener('keydown', onKeydown, false);
			root.addEventListener('keyup', onKeyup, false);
		}
	}

	function unbind() {
		var root = $rootElement[0];

		if ('ontouchstart' in window) {
			root.removeEventListener('touchstart', onMouseDown, false);
			root.removeEventListener('touchmove', onMouseMove, false);
			root.removeEventListener('touchend', onTouchEnd, false);
			root.removeEventListener('touchcancel', onTouchEnd, false);
		}
		else {
			root.removeEventListener('mousedown', onMouseDown, false);
			root.removeEventListener('mousemove', onMouseMove, false);
			root.removeEventListener('mouseup', onMouseUp, false);
			root.removeEventListener('mouseout', onMouseOut, false);
			root.removeEventListener('keydown', onKeydown, false);
			root.removeEventListener('keyup', onKeyup, false);
		}
	}

	bind();

	return input;
});

// Add Firefox keyboard constants for other browsers:
if (KeyboardEvent.DOM_VK_CANCEL == null) {
	KeyboardEvent.DOM_VK_CANCEL = 3
	KeyboardEvent.DOM_VK_HELP = 6
	KeyboardEvent.DOM_VK_BACK_SPACE = 8
	KeyboardEvent.DOM_VK_TAB = 9
	KeyboardEvent.DOM_VK_CLEAR = 12
	KeyboardEvent.DOM_VK_RETURN = 13
	KeyboardEvent.DOM_VK_ENTER = 14
	KeyboardEvent.DOM_VK_SHIFT = 16
	KeyboardEvent.DOM_VK_CONTROL = 17
	KeyboardEvent.DOM_VK_ALT = 18
	KeyboardEvent.DOM_VK_PAUSE = 19
	KeyboardEvent.DOM_VK_CAPS_LOCK = 20
	KeyboardEvent.DOM_VK_ESCAPE = 27
	KeyboardEvent.DOM_VK_SPACE = 32
	KeyboardEvent.DOM_VK_PAGE_UP = 33
	KeyboardEvent.DOM_VK_PAGE_DOWN = 34
	KeyboardEvent.DOM_VK_END = 35
	KeyboardEvent.DOM_VK_HOME = 36
	KeyboardEvent.DOM_VK_LEFT = 37
	KeyboardEvent.DOM_VK_UP = 38
	KeyboardEvent.DOM_VK_RIGHT = 39
	KeyboardEvent.DOM_VK_DOWN = 40
	KeyboardEvent.DOM_VK_PRINTSCREEN = 44
	KeyboardEvent.DOM_VK_INSERT = 45
	KeyboardEvent.DOM_VK_DELETE = 46
	KeyboardEvent.DOM_VK_0 = 48
	KeyboardEvent.DOM_VK_1 = 49
	KeyboardEvent.DOM_VK_2 = 50
	KeyboardEvent.DOM_VK_3 = 51
	KeyboardEvent.DOM_VK_4 = 52
	KeyboardEvent.DOM_VK_5 = 53
	KeyboardEvent.DOM_VK_6 = 54
	KeyboardEvent.DOM_VK_7 = 55
	KeyboardEvent.DOM_VK_8 = 56
	KeyboardEvent.DOM_VK_9 = 57
	KeyboardEvent.DOM_VK_SEMICOLON = 59
	KeyboardEvent.DOM_VK_EQUALS = 61
	KeyboardEvent.DOM_VK_A = 65
	KeyboardEvent.DOM_VK_B = 66
	KeyboardEvent.DOM_VK_C = 67
	KeyboardEvent.DOM_VK_D = 68
	KeyboardEvent.DOM_VK_E = 69
	KeyboardEvent.DOM_VK_F = 70
	KeyboardEvent.DOM_VK_G = 71
	KeyboardEvent.DOM_VK_H = 72
	KeyboardEvent.DOM_VK_I = 73
	KeyboardEvent.DOM_VK_J = 74
	KeyboardEvent.DOM_VK_K = 75
	KeyboardEvent.DOM_VK_L = 76
	KeyboardEvent.DOM_VK_M = 77
	KeyboardEvent.DOM_VK_N = 78
	KeyboardEvent.DOM_VK_O = 79
	KeyboardEvent.DOM_VK_P = 80
	KeyboardEvent.DOM_VK_Q = 81
	KeyboardEvent.DOM_VK_R = 82
	KeyboardEvent.DOM_VK_S = 83
	KeyboardEvent.DOM_VK_T = 84
	KeyboardEvent.DOM_VK_U = 85
	KeyboardEvent.DOM_VK_V = 86
	KeyboardEvent.DOM_VK_W = 87
	KeyboardEvent.DOM_VK_X = 88
	KeyboardEvent.DOM_VK_Y = 89
	KeyboardEvent.DOM_VK_Z = 90
	KeyboardEvent.DOM_VK_CONTEXT_MENU = 93
	KeyboardEvent.DOM_VK_NUMPAD0 = 96
	KeyboardEvent.DOM_VK_NUMPAD1 = 97
	KeyboardEvent.DOM_VK_NUMPAD2 = 98
	KeyboardEvent.DOM_VK_NUMPAD3 = 99
	KeyboardEvent.DOM_VK_NUMPAD4 = 100
	KeyboardEvent.DOM_VK_NUMPAD5 = 101
	KeyboardEvent.DOM_VK_NUMPAD6 = 102
	KeyboardEvent.DOM_VK_NUMPAD7 = 103
	KeyboardEvent.DOM_VK_NUMPAD8 = 104
	KeyboardEvent.DOM_VK_NUMPAD9 = 105
	KeyboardEvent.DOM_VK_MULTIPLY = 106
	KeyboardEvent.DOM_VK_ADD = 107
	KeyboardEvent.DOM_VK_SEPARATOR = 108
	KeyboardEvent.DOM_VK_SUBTRACT = 109
	KeyboardEvent.DOM_VK_DECIMAL = 110
	KeyboardEvent.DOM_VK_DIVIDE = 111
	KeyboardEvent.DOM_VK_F1 = 112
	KeyboardEvent.DOM_VK_F2 = 113
	KeyboardEvent.DOM_VK_F3 = 114
	KeyboardEvent.DOM_VK_F4 = 115
	KeyboardEvent.DOM_VK_F5 = 116
	KeyboardEvent.DOM_VK_F6 = 117
	KeyboardEvent.DOM_VK_F7 = 118
	KeyboardEvent.DOM_VK_F8 = 119
	KeyboardEvent.DOM_VK_F9 = 120
	KeyboardEvent.DOM_VK_F10 = 121
	KeyboardEvent.DOM_VK_F11 = 122
	KeyboardEvent.DOM_VK_F12 = 123
	KeyboardEvent.DOM_VK_F13 = 124
	KeyboardEvent.DOM_VK_F14 = 125
	KeyboardEvent.DOM_VK_F15 = 126
	KeyboardEvent.DOM_VK_F16 = 127
	KeyboardEvent.DOM_VK_F17 = 128
	KeyboardEvent.DOM_VK_F18 = 129
	KeyboardEvent.DOM_VK_F19 = 130
	KeyboardEvent.DOM_VK_F20 = 131
	KeyboardEvent.DOM_VK_F21 = 132
	KeyboardEvent.DOM_VK_F22 = 133
	KeyboardEvent.DOM_VK_F23 = 134
	KeyboardEvent.DOM_VK_F24 = 135
	KeyboardEvent.DOM_VK_NUM_LOCK = 144
	KeyboardEvent.DOM_VK_SCROLL_LOCK = 145
	KeyboardEvent.DOM_VK_COMMA = 188
	KeyboardEvent.DOM_VK_PERIOD = 190
	KeyboardEvent.DOM_VK_SLASH = 191
	KeyboardEvent.DOM_VK_BACK_QUOTE = 192
	KeyboardEvent.DOM_VK_OPEN_BRACKET = 219
	KeyboardEvent.DOM_VK_BACK_SLASH = 220
	KeyboardEvent.DOM_VK_CLOSE_BRACKET = 221
	KeyboardEvent.DOM_VK_QUOTE = 222
	KeyboardEvent.DOM_VK_META = 224
}