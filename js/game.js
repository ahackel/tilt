/**
 * Tilt - A puzzle game
 * @version v1.0.2 - 2014-12-06
 * @link
 * @author Andreas Hackel <http://www.andreashackel.de>
 * @license Creative Commons BY-NC License, http://creativecommons.org/licenses/by-nc/4.0/
 */

'use strict';


tiltApp.factory('game', function($location, $rootScope, progress, replay, audio, $timeout, levels) {

	var	ceil = Math.ceil,
		floor = Math.floor,
		round = Math.round,
		min = Math.min,
		_elements = [],
		_elementsFixed = [],
		_elementsMoving = [],
		_tutorial,
		_progress,
		_levelData,
		_isGameOver = false;


	function handleElements (timeStamp, timeDelta) {
		var e = {
			timeStamp: timeStamp || 0,
			timeDelta: timeDelta || 0,
			changed: false,
			fast: false
		};

		for (var i = _elements.length; i--;)
			_elements[i].tick(e);

		return e.changed;
	}

	function updateElementsSituation(direction, fast) {
		for (var i = _elements.length; i--;) {
			_elements[i].updateSituation(game.lastTime);
		}

		if (!fast && direction) {
			replay.push(direction);
			$rootScope.safeApply(function(){
				game.moves++; // = replay.length;
			});

			if (!fast) {
				audio.play('block-moved');
			}

		}

		game.allowInput = game.moves < tilt.MAX_MOVES;
		game.forceRedraw = true;
	}

	function hasWon(){
		for (var i = _elements.length; i--;) {
			var element = _elements[i];
			if ('isFilled' in element && !element.isFilled) {
				return false;
			}
		}
		return true;
	}

	function isValidLevel(id, verbose){
		if (!id) {
			if (verbose) console.log('INVALID LEVEL: Level id is null.');
			return false;
		}

		var data = levels.get(id);
		if (!data) {
			if (verbose) console.log('INVALID LEVEL: Level id not found in database.');
			return false;
		}

		var elements = data.elements;
		if (!elements) {
			if (verbose) console.log('INVALID LEVEL: Level elements is null.');
			return false;
		}

		var numBlocksRed = levels.countElements(id, 'B');
		var numBlocksBlue = levels.countElements(id, 'C');
		var numBlocks = numBlocksRed + numBlocksBlue;
		var numHolesRed = levels.countElements(id, 'b');
		var numHolesBlue = levels.countElements(id, 'c');
		var numHoles = numHolesRed + numHolesBlue;

		var result = true;

		if (numBlocks === 0) {
			if (verbose) console.log('INVALID LEVEL: No movable blocks.');
			result = false;
		}

		if (numHoles === 0) {
			if (verbose) console.log('INVALID LEVEL: No holes.');
			result = false;
		}

		if (numHolesRed > numBlocksRed) {
			if (verbose) console.log('INVALID LEVEL: Not enough red blocks for every red hole.');
			result = false;
		}

		if (numHolesBlue > numBlocksBlue) {
			if (verbose) console.log('INVALID LEVEL: Not enough blue blocks for every blue hole.');
			result = false;
		}

		return result;
	}

	function redraw() {
		game.forceRedraw = true;
	}

	function move(direction, force, increaseTime) {
		if (!direction) return false;

		var dx = 0;
		var dy = 0;

		// when move is used in undo function lastTime needs to be changed so the elements know this is a new move:
		if (increaseTime)
			game.lastTime++;

		switch(direction) {
			case tilt.UP:	dy = -1; break;
			case tilt.RIGHT:dx = 1; break;
			case tilt.DOWN:	dy = 1; break;
			case tilt.LEFT:	dx = -1; break;
		}

		var moved = false;

		for (var i = _elements.length; i--;)
			if (_elements[i].moveBy(dx, dy, force))
				moved = true;

		if (moved) {
			updateElementsSituation(direction, force);
		}

		return moved;
	}

	function start() {
		game.moves = 0;
		game.time = 0;
		game.allowInput = isValidLevel(game.levelId, true);
		_tutorial = null;
		_isGameOver = false;
		game.isPaused = false;
		game.previewOffsetX = 0;
		game.previewOffsetY = 0;
		game.paintOverFrameOffset = 0;
		return game.allowInput;
	}

	function stop() {
		game.allowInput = false;
	}

	function calculateScore(moves, minMoves, time, stars) {
		var minutes = ceil(time / (1000 * 60));

		var __moves = moves;
		if (__moves < 1)
			__moves = 1;

		var __minMoves = minMoves || 10;

		var score = (10000 * (__minMoves / __moves)) / (1 + minutes / 4);

		//score += stars * 100;
		return floor(score);
	}

	function showLevelEndScreen() {
		progress.update(game.levelId, game.moves, game.time, game.score, game.stars, replay.toJSON());
		game.isPaused = true;
		//$rootScope.safeApply();
	}

	function checkWon() {
		if (!game.checkWonPosition) {
			var numHoles = levels.countElements(game.levelId, 'abc');
			game.checkWonElementDelay = Math.max(1000 / numHoles, 200);
			game.checkWonPosition = { x: 0, y: 0 };
		}

		var block = getMovingElement(game.checkWonPosition.x, game.checkWonPosition.y);
		var wait = (block && block.won());

		if (wait)
			redraw();

		if (game.checkWonPosition.x === tilt.WIDTH - 1 &&
			game.checkWonPosition.y === tilt.HEIGHT - 1) {
			game.checkWonPosition = null;
			game.checkWonElementDelay = null;
				$timeout(showLevelEndScreen, 1000);
		}
		else {
			game.checkWonPosition.x++;
			if (game.checkWonPosition.x === tilt.WIDTH) {
				game.checkWonPosition.y++;
				game.checkWonPosition.x = 0;
			}
			if (!wait)
				checkWon();
			else
				$timeout(checkWon, game.checkWonElementDelay);      // TODO: Don't use a fixed timespan but divide by number of elements
		}
	}

	function gameOver() {
		_isGameOver = true;
		stop();

//		audio.play('won');

		window.setTimeout(checkWon, 300);
	}

	function load(levelId) {
		//console.log('loading level', levelId);

		_levelData = levels.get(levelId);
		createElements();
		_progress = progress.getLevelProgress(game.levelId);
		if (_progress)
			replay.fromJSON(_progress.replay);
		else
			replay.reset();

		reset(false);
		handleElements();
	}

	function play(levelId) {
		load(levelId);
		start();
	}

	function createElements() {
		_elements = [];
		for (var i = 0; i < tilt.WIDTH * tilt.HEIGHT; i++)
			_elementsFixed[i] = _elementsMoving[i] = null;

		if (_levelData && _levelData.elements) {

			game.noBounds = _levelData.noBounds || false;

			// create element objects from string:
			var x = 0;
			var y = 0;

			for (var i in _levelData.elements) {
				var element = tilt.BoardElement.createFromCode(_levelData.elements[i], x, y);

				if (element)
					_elements.push(element);
				x++;
				if (x == tilt.WIDTH) {
					x = 0;
					y++;
				}
			}
		}

		game.forceRedraw = true;
		updateElementsSituation(null, true);
	}

	function deleteElement(element) {
		if (!element)
			return false;

		var index = _elements.indexOf(element);
		if (index > -1) {
			_elements.splice(index, 1);

			index = element.clampedX + element.clampedY * tilt.WIDTH;
			if (element.isFixed)
				_elementsFixed[index] = null;
			else
				_elementsMoving[index] = null;

			element = null;
			return true;
		}
		return false;
	}

	function addElement(element, replace) {
		if (!element)
			return false;

		if (replace) {
			if (element.isFixed)
				deleteElement(getFixedElement(element.clampedX, element.clampedY));
			else
				deleteElement(getMovingElement(element.clampedX, element.clampedY));
		}
		_elements.push(element);
		updateElementPosition(element);
	}

	// sets all gameplay elements back to saved state:
	function reset(startGame) {
		if (startGame) {
			audio.play('reset');
			play(game.levelId);
			game.isResetting = true;
			$timeout(function(){
				game.isResetting = false;
			}, 10);
		}
		else {
			for (var i = 0; i < _elements.length; i++)
				_elements[i].reset();
			updateElementsSituation(0, true);
		}
	}

	function finishMoves() {
		each(function(element){
			if (!element.isFixed) {
				element.renderX = element.x = element.clampedX;
				element.renderY = element.y = element.clampedY;
			}
		});
	}

	function checkNoBoundsMove(){
		if (!game.noBounds)
			return;

		// check if any elements need to cross to bounds and if so, move them to the other side:
		each(function(element){
			if (!element.isFixed) {
				// round old position, because the move could not be finished if the player pressed undo very quickly:
				var oldX = round(element.renderX),
					oldY = round(element.renderY);

				//console.log(oldX, oldY, '->', element.x, element.y);

				if (element.x == 0 && oldX == tilt.WIDTH - 1) element.x = tilt.WIDTH;
				if (element.y == 0 && oldY == tilt.HEIGHT - 1) element.y = tilt.HEIGHT;
				if (element.x == tilt.WIDTH - 1 && oldX == 0) element.x = -1;
				if (element.y == tilt.HEIGHT - 1 && oldY == 0) element.y = -1;
			}
		});
	}

	function redo() {
		finishMoves();
		var oldMuted = audio.soundMuted;
		audio.soundMuted = true;
		if (replay.forward(move)) {
			checkNoBoundsMove();
			game.moves++;
		}
		audio.soundMuted = oldMuted;
	}

	function undo() {
		finishMoves();
		//audio.play('undo');
		var oldMuted = audio.soundMuted;
		audio.soundMuted = true;
		if (replay.backward(reset, move)) {
			checkNoBoundsMove();
			game.moves--;
		}
		audio.soundMuted = oldMuted;
	}

	function updateElementPosition(element, clear) {
		var index = element.clampedX + element.clampedY * tilt.WIDTH;
		if (element.isFixed) {
			if (clear) {
				if (_elementsFixed[index] === element)
					_elementsFixed[index] = null;
			}
			else if (!element.isFloating)
				_elementsFixed[index] = element;
		}
		else {
			if (clear) {
				if (_elementsMoving[index] === element)
					_elementsMoving[index] = null;
			}
			else if (!element.isFloating)
				_elementsMoving[index] = element;
		}
	}

	// x and y should be clamped:
	function getFixedElement(x, y) {
		return _elementsFixed[x + y * tilt.WIDTH];
	}

	// x and y should be clamped:
	function getMovingElement(x, y) {
		return _elementsMoving[x + y * tilt.WIDTH];
	}

	function each(callback) {
		if (_elements) {
			for (var i = _elements.length; i--;) {
				callback(_elements[i]);
			}
		}
	}

	function checkEach(callback) {
		if (_elements) {
			for (var i = _elements.length; i--;) {
				if (callback(_elements[i]))
					return true;
			}
		}
		return false;
	}

	function getNumCollectedStars() {
		var stars = 0;
		each(function(element){
			if (('s123'.indexOf(element.getCode()) > -1) && element.collected)
				stars++;
		});
		return stars;
	}

	function startNextLevel() {
		// show next level if there is one, if this is the last one, go to main menu
		var nextLevelId = levels.getNextLevel(game.levelId);

		if (nextLevelId) {
			//play(nextLevelId);
			$rootScope.go("/play/" + nextLevelId);
		}
		else
			$rootScope.go('/gameend');
	}

	function clampX(x){
		if (x < 0) return x + tilt.WIDTH;
		else if (x > tilt.WIDTH - 1) return x - tilt.WIDTH;
		else return x;
	}

	function clampY(y){
		if (y < 0) return y + tilt.HEIGHT;
		else if (y > tilt.HEIGHT - 1) return y - tilt.HEIGHT;
		else return y;
	}

	var game = {
		moves: 0,
		noBounds: false,
		tiltX: 0,
		tiltY: 0.03 * tilt.PERSP_OFFSET,
		previewOffsetX: 0,
		previewOffsetY: 0,
		time: 0,
		lastTime: null,
		forceRedraw: false,
		forceCompleteRedraw: false,
		paintOverFrameOffset: 0,
		get levelId(){ return (_levelData) ? _levelData.id : null; },
		get levelName() { return levels.getNameFromId(game.levelId) || "untitled "; },
		get levelCategory() { return levels.getCategoryFromId(game.levelId); },
		load: load,
		play: play,
		start: start,
		stop: stop,
		reset: function(){ reset(true) },
		undo: undo,
		redo: redo,
		get canUndo() { return replay.canBackward && !game.isGameOver; },
		move: move,
		pause: function(){
			game.isPaused = true;
		},
		resume: function(){
			game.lastTime = null;
			game.isPaused = false;
		},
		addElement: addElement,
		deleteElement: deleteElement,
		handleElements: handleElements,
		updateElementPosition: updateElementPosition,
		getFixedElement: getFixedElement,
		getMovingElement: getMovingElement,
		each: each,
		checkEach: checkEach,
		redraw: redraw,
		startNextLevel: startNextLevel,
		hasWon: hasWon,
		gameOver: gameOver,
		allowInput: false,
		clampX: clampX,
		clampY: clampY,
		get bestMoves() { return (_progress) ? _progress.moves : null; },
		get minMoves() {
			return (_levelData) ? _levelData.moves : null;
		},
		get maxStars() {
			if (!game.levelId) return null;
			var index = levels.getIndex(game.levelId);
			return (index > -1) ? levels.getMaxStars(game.levelId) : null;
		},
		get stars() {
			if (!_levelData) return 0;
			if (!game.moves || !game.minMoves) return 0;
			var rating = game.minMoves / game.moves;
			if (rating < 0.5) return 1;
			if (rating < 1.0) return 2;
			if (rating == 1.0) return 3;
			// rating > 1, beaten the dev:
			return 4;
		},
		get elements() { return _elements; },
		get score() {
			if (!game.levelId) return null;
			if (!game.isGameOver) return null;
			return calculateScore(game.moves, game.minMoves, game.time, getNumCollectedStars());
		},
		get bestScore() { return (_progress) ? _progress.score : null; },
		get bestTime() { return (_progress) ? _progress.time : null; },
		get isGameOver() { return _isGameOver; },
		get isRunning() { return game.allowInput; },
		get levelData() { return _levelData; },
		get tutorial() { return (_levelData) ? _levelData.tutorial : null; },
		showTutorial: false,
		isPaused: false,
		fps: 0
	};

	tilt.game = game;

	return game;

});

tiltApp.directive('board', function(game, input){

	var abs = Math.abs,
		min = Math.min,
		max = Math.max,
		_scope,
		_board,
		_canvas,
		_ctx,
		_timer = null,
		_timeDelta = 0,
		_bitmapSize = tilt.BITMAPSIZE,
		_canvasWidth = _bitmapSize * tilt.BOARD_WIDTH,
		_canvasHeight = _bitmapSize * tilt.BOARD_HEIGHT,
		_frameOriginX = 0.8,
		_frameOriginY = 0.8,
		_frameWidth = tilt.FRAME_WIDTH,
		_lastDrawTime = 0,
		_rotationX = 0,
		_rotationY = 0,
		_dragOriginX = 0,
		_dragOriginY = 0,
		_tiltOriginX = 0,
		_tiltOriginY = 0,
		_moveDelayTime = 0,
		_lastFpsTime = 0,
		_boardX,
		_boardY,
		_drawList = [];

	function init(scope) {
		_scope = scope;
		var _screen = document.getElementById('scn-game');
		_board = document.getElementById('game-board');
		_canvas = document.getElementById('game-canvas');

		_canvas.width = _canvasWidth;
		_canvas.height = _canvasHeight;

		_ctx = _canvas.getContext('2d');

		game.forceCompleteRedraw = true;
		tilt.loadingStack['firstDraw'] = true;

		_ctx.lineCap = 'round';
		_ctx.lineJoin = 'round';
		_ctx.scale(_bitmapSize, _bitmapSize);

		// center board:
		var boardClientRect = _board.getBoundingClientRect(),
			screenClientRect = _screen.getBoundingClientRect();

		_boardX = (screenClientRect.width - boardClientRect.width) / 2;
		_boardY = (screenClientRect.height - boardClientRect.height) / 2;

		window.addEventListener('keydown', handleKeydown, false);
	}

	function tick(timeStamp) {
		_timer = requestAnimationFrame(tick);

		if (game.isPaused)
			return;

		game.timeStamp = timeStamp;


		var changed = game.forceRedraw;
		var rotationChanged = game.forceRedraw;

		var allowInput = game.allowInput && (!game.isPaused);

		if (game.forceRedraw)
			game.forceRedraw = false;

		if (!game.lastTime)
			game.lastTime = timeStamp;

		_timeDelta = timeStamp - game.lastTime;

		if (_timeDelta === 0)
			_timeDelta = 0.3;

		if (tilt.DEBUG) {
			var newfps = 1000 / _timeDelta;
			game.fps = 0.95 * game.fps + 0.05 * newfps;
			if (timeStamp - _lastFpsTime > 500) {
				_lastFpsTime = timeStamp;
				_scope.safeApply();
			}
		}

		game.lastTime = timeStamp;

		// prevent time from ticking after game is over:
		if (!game.isGameOver)
			game.time += _timeDelta;

		if (game.editor)
			game.editor.tick(_timeDelta, timeStamp);

		if (window.Gamepad)
			input.updateGamepadInput();


		var absDeltaX = abs(input.deltaX);
		var absDeltaY = abs(input.deltaY);





		if (allowInput) {
			var direction;
			var canMove = true;

			if (input.deltaX === 0 && input.deltaY === 0) {
				_dragOriginX = 0;
				_dragOriginY = 0;
				_tiltOriginX = 0;
				_tiltOriginY = 0;
			}

			// calculate the board tilt:
			var maxTilt = 0.25;
			if (input.deltaX - _tiltOriginX > maxTilt)
				_tiltOriginX = input.deltaX - maxTilt;
			else if (input.deltaX - _tiltOriginX < -maxTilt)
				_tiltOriginX = input.deltaX + maxTilt;

			if (input.deltaY - _tiltOriginY > maxTilt)
				_tiltOriginY = input.deltaY - maxTilt;
			else if (input.deltaY - _tiltOriginY < -maxTilt)
				_tiltOriginY = input.deltaY + maxTilt;


			// prevent elements from being dragged further than finger or mouse:
			var dx = input.deltaX - _dragOriginX;
			var dy = input.deltaY - _dragOriginY;

			var absDx = abs(dx);
			var absDy = abs(dy);


			var slideOffset = (absDx > absDy) ? absDx : absDy;

			if (slideOffset > tilt.SLIDE_THRESHOLD) {

//				if ((timeStamp > _moveDelayTime + tilt.MOVE_DELAY) ||
//					(slideOffset > tilt.SLIDE_FAST_THRESHOLD && timeStamp > _moveDelayTime + tilt.MOVE_FAST_DELAY) ||
//					(slideOffset > tilt.SLIDE_FASTEST_THRESHOLD && timeStamp > _moveDelayTime + tilt.MOVE_FASTEST_DELAY)) {

					if (absDx > absDy)
						direction = (dx > 0) ? tilt.RIGHT : tilt.LEFT;
					else
						direction = (dy > 0) ? tilt.DOWN : tilt.UP;

					_moveDelayTime = timeStamp;
//				}
			}
			/*else {
			 // not tilted far enough, reset delay:
			 _moveDelayTime = 0;
			 _moveRepeatTime = 0;
			 }*/

			if (direction) {
				canMove = game.move(direction, false);
				if (canMove) {
					if (direction === tilt.UP) _dragOriginY--;
					if (direction === tilt.DOWN) _dragOriginY++;
					if (direction === tilt.LEFT) _dragOriginX--;
					if (direction === tilt.RIGHT) _dragOriginX++;
				}

				changed = true;
			}

		}

		// calculate previewOffset:
		if (allowInput) {
			var maxPreviewOffset = 0.3;

			var previewX = max(-maxPreviewOffset, min(maxPreviewOffset, (input.deltaX - _dragOriginX) / 2));
			var previewY = max(-maxPreviewOffset, min(maxPreviewOffset, (input.deltaY - _dragOriginY) / 2));

			game.previewOffsetX += (previewX - game.previewOffsetX) * _timeDelta * 0.004;
			game.previewOffsetY += (previewY - game.previewOffsetY) * _timeDelta * 0.004;

			if (absDeltaX > absDeltaY)
				game.previewOffsetY = 0;
			else
				game.previewOffsetX = 0;
		}
		else {
			game.previewOffsetX = 0;
			game.previewOffsetY = 0;
		}


		if (game.handleElements(timeStamp, _timeDelta))
			changed = true;

		if (game.isRunning && game.hasWon())
			game.gameOver();

		var oldRotX = _rotationX;
		var oldRotY = _rotationY;

		// tilt board:

		var _newRotationPart = 0.1;
		var max_rotation = 24;


		if (game.isPaused) {
			// force board to un-tilted position if pause screen is displayed to prevent the board from showing through
			_rotationX = _rotationY = 0;
		}
		else {
			var rx = (input.deltaX - _tiltOriginX) * max_rotation;
			var ry = (input.deltaY - _tiltOriginY) * max_rotation;

			if (!allowInput) {
				rx = ry = 0;
			}

			if (abs(rx) > abs(ry)){
				ry = 0;
				if (rx != 0)
					_rotationY = 0;
			}
			else {
				rx = 0;
				if (ry != 0)
					_rotationX = 0;
			}

			_rotationX = _rotationX * (1 - _newRotationPart) + rx * _newRotationPart;
			_rotationY = _rotationY * (1 - _newRotationPart) + ry * _newRotationPart;

			_rotationX = max(-max_rotation, min(max_rotation, _rotationX));
			_rotationY = max(-max_rotation, min(max_rotation, _rotationY));

			if (abs(_rotationX) < 0.005)
				_rotationX = 0;
			if (abs(_rotationY) < 0.005)
				_rotationY = 0;
		}

		if (oldRotX !== _rotationX || oldRotY !== _rotationY) {
			rotationChanged = true;
			changed = true;
		}

		game.tiltX = 0.03 * _rotationX;
		game.tiltY = 0.03 * (_rotationY + tilt.PERSP_OFFSET);

		if (changed) { // && (timeStamp - _lastDrawTime > tilt.DRAW_REFRESH_RATE)) {
			draw();
			_lastDrawTime = timeStamp;
		}

		if (rotationChanged) {
			var t = 'rotateY(' + _rotationX * 3 + 'deg) rotateX(' + _rotationY * -3 + 'deg) ';
				//+ 'translateX(' + _boardX + 'px) translateY(' + _boardY +'px)';
			_board.style.webkitTransform = t;
			_board.style.transform = t;
		}
	}

	function addDrawCall(data) {
		var tiltX = game.tiltX,
			tiltY = game.tiltY;

		data.caller = this;
		data.order = tiltX * data.x + tiltY * data.y -data.z
		_drawList.push(data);
	}

	function draw() {
		var frameX = _frameOriginX - _frameWidth,
			frameY = _frameOriginY - _frameWidth,
			dx = game.tiltX,
			dy = game.tiltY,
			clipX = tilt.ORIGIN_X + dx,
			clipY = tilt.ORIGIN_Y + dy - game.paintOverFrameOffset,
			clipW = tilt.ORIGIN_X + dx + tilt.WIDTH - clipX,
			clipH = tilt.ORIGIN_Y + dy + tilt.HEIGHT - clipY;

		game.ctx = _ctx;
		_ctx.clearRect(0, 0, tilt.BOARD_WIDTH, tilt.BOARD_HEIGHT);

		_ctx.fillStyle = "green";


		if (game.forceCompleteRedraw) {
			//console.log("drawing board background...");
			delete tilt.loadingStack['firstDraw'];
			_scope.safeApply();

			game.forceCompleteRedraw = false;
		}

		var frameColor = (game.noBounds) ? tilt.COLOR_BOARD_NO_BOUNDS : tilt.COLOR_BOARD;
		var bgImage = (game.noBounds) ? "board_nobounds" : "board";
		_ctx.drawImage(tilt.images[bgImage], 0, 0, tilt.BOARD_WIDTH, tilt.BOARD_HEIGHT);

		tilt.shapes.drawFrameBottom(_ctx, frameX, frameY, frameColor, dx, dy);
		tilt.shapes.drawFrameTop(_ctx, frameX, frameY, frameColor, dx, dy);
		_ctx.save();
		_ctx.beginPath();
		_ctx.rect(clipX, clipY, clipW, clipH);
		_ctx.closePath();
		_ctx.clip();

		game.each(function(element){
			element.draw(addDrawCall);
		});

		if (game.editor)
			game.editor.draw(addDrawCall);

		_drawList.sort(function(a, b){
			return b.order - a.order;
		});

		for (var i in _drawList) {
			var drawCall = _drawList[i];
			drawCall.ctx = _ctx;
			drawCall.fn.call(drawCall.caller, drawCall);
		}
		_drawList = [];


		_ctx.restore();

	}

	function stopTimer() {
		if (_timer != null) {
			window.cancelAnimationFrame(_timer);
			_timer = null;
		}
	}

	function startTimer() {
		game.lastTime = null;
		if (_timer === null)
			_timer = window.requestAnimationFrame(tick);
	}

	function handleKeydown(event) {
		if (game.editor) return;

		var key = event.which;
		switch(key) {
			case KeyboardEvent.DOM_VK_SPACE:
				if (tilt.EDITOR) {
					_scope.safeApply(function(){
						_scope.go('/edit/' + game.levelId);
					});
					event.stopPropagation();
				}
				break;
			case KeyboardEvent.DOM_VK_ESCAPE:
				game.isPaused = true;
				break;
			case KeyboardEvent.DOM_VK_R:
				game.reset(true);
				break;
			case KeyboardEvent.DOM_VK_U:
				game.undo();
				break;
			case KeyboardEvent.DOM_VK_Z:
				game.redo();
				break;
		}
		//event.preventDefault();
	}

	return {
		priority: 1, // compile before editor
		restrict: 'E',
		replace: true,
		template: '<div id="game-board">' +
			//     '   <canvas id="game-canvasBG">Canvas is not supported</canvas>' +
			'   <canvas id="game-canvas">Canvas is not supported</canvas>' +
			'   <div id="tutorial" ng-bind-html-unsafe="game.tutorial | loc " ng-hide="game.moves > 0" ng-animate="\'fade\'"></div>' +
			'   <div id="max-moves" ng-show="game.moves == maxMoves">{{ \'Too many moves. Press undo or reset\' | loc }}</div>' +
			'</div>',
		link: function(scope, element, attrs) {
			init(scope);

			scope.maxMoves = tilt.MAX_MOVES;

			scope.$on('$destroy', function(){
				stopTimer;
				window.removeEventListener('keydown', handleKeydown);
			});

			startTimer();
		}
	}
});
