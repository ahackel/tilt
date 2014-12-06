/**
 * Tilt - A puzzle game
 * @version v1.0.2 - 2014-12-06
 * @link
 * @author Andreas Hackel <http://www.andreashackel.de>
 * @license Creative Commons BY-NC License, http://creativecommons.org/licenses/by-nc/4.0/
 */

'use strict';

tiltApp.directive('editor', function(game, input, levels){

	var _scope,
		_codes,
		_toolIndex = 0,
		_toolElement,
		_oldMouseX,
		_oldMouseY,
		_dragElement = null;

	function init(scope) {
		_scope = scope;

		console.log('editor enabled');

		document.addEventListener('keydown', onKeydown, false);
		document.addEventListener('keyup', onKeyup, false);
		document.addEventListener("mousewheel", onMouseWheel, false);


		_codes = Object.keys(tilt.BoardElement.getClasses());
		selectTool(0);


		_scope.$on('$destroy', function(){
			document.removeEventListener('keydown', onKeydown);
			document.removeEventListener('keyup', onKeyup);
			document.removeEventListener('mousewheel', onMouseWheel);
			game.editor = null;
		});

		// save level before location changes:
		_scope.$on('$locationChangeStart', function(scope){
			if (!saveLevel())
				scope.preventDefault();
		});

		// extent game object:
		game.editor = {
			play: play,
			edit: edit,
			tick: tick,
			draw: draw,
			selectTool: selectTool,
			saveLevel: saveLevel,
			saveLevelAs: saveLevelAs,
			clearLevel: clearLevel,
			toggleNoBounds: toggleNoBounds
		}
	}

	function toggleNoBounds(){
		if (game.levelData) {
			game.levelData.noBounds = (game.levelData.noBounds) ? false : true;
			game.noBounds = game.levelData.noBounds;
			game.forceCompleteRedraw = true;
			game.redraw();
			//console.log('Set noBounds to', game.noBounds);
		}
	}

	function setToolElement(code) {
		_toolElement = tilt.BoardElement.createFromCode(code, 0, 0);
		_toolElement.isFloating = true;
		game.redraw();
	}

	function selectTool(offset) {
		_toolIndex += offset;

		if (_toolIndex < 0)
			_toolIndex += _codes.length;
		if (_toolIndex > _codes.length - 1)
			_toolIndex -= _codes.length;


		setToolElement(_codes[_toolIndex]);
	}

	function modify() {
		game.redraw();
	}

	function drawToolElement(data){
		var x = tilt.ORIGIN_X + data.x,
			y = tilt.ORIGIN_Y + data.y;

		if (input.altKey) {
			data.ctx.drawImage(tilt.images["eyedropper"], x, y, 1, 1);
		}
		else if (input.shiftKey) {
			data.ctx.drawImage(tilt.images["delete"], x, y, 1, 1);
		}
		tilt.drawSelection(data.ctx, x, y);
	}

	function draw(addDrawCall) {

		var x = input.mouseX;
		var y = input.mouseY;

		var visible = (x >= 0 && x < tilt.WIDTH && y >= 0 && y < tilt.HEIGHT);

		if (visible) {
			addDrawCall.call(this, { x: x, y: y, z: 2000, fn: drawToolElement });

			if (_toolElement && !input.altKey && !input.shiftKey)
				_toolElement.draw(function(data){
					if (data.z !== -1000) // ignore shadows
						data.z = 1000;
					addDrawCall.call(_toolElement, data);
				});
		}
	}

	function tick() {
		var x = input.mouseX;
		var y = input.mouseY;

	   // _toolElement.x = _toolElement.renderX = _toolElement.startX = x;
	   // _toolElement.y = _toolElement.renderY = _toolElement.startY = y;

		if (_oldMouseX != x || _oldMouseY != y) {
			_oldMouseX = x;
			_oldMouseY = y;
			game.redraw();
		}

		// check if mouse is in board:
		if (x >= 0 && x < tilt.WIDTH &&
			y >= 0 && y < tilt.HEIGHT) {

			if (input.mouseButton == 0) {
				var element = game.getFixedElement(x, y) || game.getMovingElement(x, y),
					code = (element) ? element.getCode() : ' ';

				if (input.altKey) {
					if (element) {
						setToolElement(code);
					}
				}
				else if (input.shiftKey) {
					if (game.deleteElement(element)) {
						modify();
						updateStatusbar();
					}
				}
				else {
					if (_toolElement) {
						// draw active tool:
						var toolCode = _toolElement.getCode();
						if (toolCode !== code) {
							_toolElement.isFloating = false;
							game.addElement(_toolElement, true);
							//game.updateElementPosition(element, true);

							// tool element has been placed, create a new one:
							setToolElement(_toolElement.getCode());
							modify();
							updateStatusbar();
						}
					}
					else {
						if (_dragElement) {
							// drag selected element:
							_drawElement.setPosition(x, y);
							_dragElement.renderX = _dragElement.startX = x;
							_dragElement.renderY = _dragElement.startY = y;
						}
						else {
							_dragElement = element;
							element.isFloating = true;
							game.updateElementPosition(element, true);
						}
					}
				}
			}
			else {
				if (_dragElement) {
					_dragElement.isFloating = false;
					game.updateElementPosition(_dragElement);
				}
				_dragElement = null;
			}
		}

		if (_toolElement) {
			_toolElement.setPosition(x, y);
			_toolElement.renderX = _toolElement.startX = x;
			_toolElement.renderY = _toolElement.startY = y;
		}
	}

	function getUniqueLevelId(id) {
		var name = levels.getNameFromId(id) || "untitled",
			customLevels = levels.getByCategory('Custom'),
			suffix = 0,
			newId;

		do {
			newId = 'Custom/' + name + '_' + (String('000' + suffix).slice(-3));
			suffix++;
		} while (customLevels.indexOf(newId) > -1);

		return newId;
	}

	function copyLevel(id) {
		var index = levels.getIndex(id);

		if (index < 0)
			return false;

		var newId = getUniqueLevelId(id);

		// copy data and insert into list at the end of the custom levels:

		var data = levels.get(index);
		levels.addCustomLevel({ id: newId, elements: data.elements })

		return newId;
	}

	function getElementCodes() {
		var elements = '';
		for (var y = 0; y < tilt.HEIGHT; y++) {
			for (var x = 0; x < tilt.WIDTH; x++) {
				var element = game.getFixedElement(x, y) || game.getMovingElement(x, y);
				elements += (element) ? element.getCode() : ' ';
			}
		}
		return elements;
	}

	function saveElements() {
		var elements = getElementCodes();
		var id = game.levelId;
		var index = levels.getIndex(id);

		var data;
		var tempId = 'Custom/TEMP';

		if (index >= 0) {
			data = levels.get(index);
			data.elements = elements;
		}
		else {
			// level does not yet exist in database, create a new entry:
			levels.addCustomLevel({ id: tempId, elements: elements });
			id = tempId;
		}
		var code = '{ id: "' + id + '", elements: "' + getElementCodes() + '" },';
		console.log('saving elements:');
		console.log(code);
		return id;
	}

	function edit(id) {
		if (id && levels.getIndex(id) === -1) {
			_scope.go('/edit');
		}
		else if (id && levels.getCategoryFromId(id) !== 'Custom') {
			var newId = copyLevel(id);
			_scope.go('/edit/' + newId);
		}
		else {
			game.load(id);

			// TODO: reset values properly:
			game.start();
			game.stop();
		}
	}

	function play() {
		if (!game.levelId) {
			if (!renameLevel(false))
				return;
		}
		_scope.safeApply(function(){
			_scope.go('/play/' + game.levelId);
		});
	}

	function clearLevel() {
		_scope.safeApply(function(){
			_scope.go('/edit');
		});
	}

	function saveLevel() {
		// Check if level can be saved:
		if (levels.getIndex(game.levelId) >= 0)
			saveElements();

		levels.saveCustomLevels();
		return true;
	}

	function saveLevelAs() {
		renameLevel(true);
	}

	function deleteLevel() {
		var id = game.levelId;
		if (window.confirm('Delete level "' + id + '"?')) {
			levels.deleteCustomLevel(id);
			levels.saveCustomLevels();
			game.load();
			_scope.safeApply(function(){
				_scope.go("/levels");
			});
		}
	}

	function renameLevel(copy) {
		var title = (copy) ? 'Save level as' : 'Rename level';
		var newName = window.prompt(title, game.levelName);
		if (newName) {
			var category = levels.getCategoryFromId(game.levelId) || 'Custom';
			var newId = category + '/' + newName;

			if (levels.getIndex(newId) > -1) {
				window.alert('The Id "' + newId + '" already exists. Please choose another level name.');
				return false;
			}

			var id = saveElements();
			if (copy) {
				id = copyLevel(id);
			}

			var data = levels.get(id);

			data.id = newId;

			game.load(newId);

			saveLevel();
			//updateStatusbar();
			_scope.safeApply(function(){
				_scope.go('/edit/' + newId);
			});
		}
		return false;
	}

	function updateStatusbar() {
		var id = game.levelId;

		var code = '{ id: "' + id + '", elements: "' + getElementCodes() + '" },';

		//_statusbar.innerHTML = '<pre>' + code + '</pre>';
	}

	function onKeydown(event) {
		// force redraw of tool element in case alt or ctrl are pressed:
		game.redraw();

		var key = event.which;

		switch(key) {
			case KeyboardEvent.DOM_VK_ESCAPE:
				game.isPaused = true;
				break;
			case KeyboardEvent.DOM_VK_SPACE:
				play();
				event.stopPropagation();
				break;
			case KeyboardEvent.DOM_VK_N:
				clearLevel();
				break;
			case KeyboardEvent.DOM_VK_S:
				saveLevelAs();
				break;
			case KeyboardEvent.DOM_VK_D:
				deleteLevel();
				break;
			case KeyboardEvent.DOM_VK_R:
				renameLevel();
				break;
			case KeyboardEvent.DOM_VK_V:
				setToolElement(null);
				break;
			case KeyboardEvent.DOM_VK_UP:
			case KeyboardEvent.DOM_VK_LEFT:
				selectTool(-1);
				break;
			case KeyboardEvent.DOM_VK_DOWN:
			case KeyboardEvent.DOM_VK_RIGHT:
				selectTool(1);
				break;
		}
		//event.preventDefault();
	}

	function onKeyup(event) {
		// force redraw of tool element in case alt or ctrl are pressed:
		game.redraw();
	}

	function onMouseWheel(event) {
		event.preventDefault();
		var offset = 0;
		if (event.wheelDelta > 0) offset = 1;
		if (event.wheelDelta < 0) offset = -1;
		selectTool(offset);
	}

	return {
		restrict: 'E',
		replace: true,
		template: '<div><board></board></div>',
		link: function(scope, iElement, iAttrs) {
			init(scope);
		}
	}
});

