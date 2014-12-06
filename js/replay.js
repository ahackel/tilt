/**
 * Tilt - A puzzle game
 * @version v1.0.2 - 2014-12-06
 * @link
 * @author Andreas Hackel <http://www.andreashackel.de>
 * @license Creative Commons BY-NC License, http://creativecommons.org/licenses/by-nc/4.0/
 */

'use strict';

tiltApp.factory('replay', function() {

	var	_stack = [],
		_position = 0;


	function reset() {
		_stack = [];
		_position = 0;
	}

	function toString() {
		return _stack.join('');
	}

	function toJSON() {
		return toString();
	}

	function fromJSON(value) {
		reset();
		if (!value) return;
		for (var i in value) {
			_stack.push(parseInt(value[i]));
		}
	}

	function removeFutureSteps() {
		if (_position < _stack.length) {
			// we have gone back in the replay _stack, remove items from replay _stack that are in the future:
			_stack.splice(_position, _stack.length - _position);
			_position = _stack.length;
		}
	}

	function push(direction) {
		removeFutureSteps();
		_stack.push(direction);
		_position++;
	}

	function forward(moveFunction) {
		if (_position == _stack.length)
			return false;

		moveFunction(_stack[_position], true);
		_position++;
		return true;
	}

	function backward(resetFunction, moveFunction) {
		if (_position == 0)
			return false;

		_position--;
		resetFunction();

        for (var i = 0; i < _position; i++) {
			moveFunction(_stack[i], true, true);
        }

		return true;
	}

	var replay = {
		get length() { return _stack.length; },
		reset : reset,
		toString : toString,
		toJSON : toJSON,
		fromJSON : fromJSON,
		push : push,
		forward : forward,
		backward : backward,
		get canForward() { return _position < _stack.length; },
		get canBackward() { return _position > 0; },
		removeFutureSteps : removeFutureSteps
	}

	return replay;
});