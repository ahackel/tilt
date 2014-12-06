/**
 * Tilt - A puzzle game
 * @version v1.0.2 - 2014-12-06
 * @link
 * @author Andreas Hackel <http://www.andreashackel.de>
 * @license Creative Commons BY-NC License, http://creativecommons.org/licenses/by-nc/4.0/
 */

'use strict';

var __extends = window.__extends || function (d, b) {
	function __() { this.constructor = d; }
	__.prototype = b.prototype;
	d.prototype = new __();
};

(function() {

	var WIDTH = tilt.WIDTH,
		HEIGHT = tilt.HEIGHT,
		_originX = tilt.ORIGIN_X,
		_originY = tilt.ORIGIN_Y,
		abs = Math.abs,
		min = Math.min,
		pow = Math.pow,
		game;


	tilt.BoardElement = (function() {

		var	_classes = {};

		function BoardElement(x, y) {
			if (!game)
				game = tilt.game;
			this.x = this.clampedX = x;
			this.y = this.clampedY = y;
			this.z = 0;
			this.isVisible = true;
			this.startX = x;
			this.startY = y;
			this.renderX = x;
			this.renderY = y;
			this.renderZ = 0;
			this.depth = 1;
			this.renderDepth = 1;
			this.isFixed = true;
			this.isMoving = false;
			this.color = 0;
			this.moveByCache = {};
		}

		// static

		BoardElement._extends = function(_class, _super, code) {
			__extends(_class, _super);
			_class.prototype.getCode = function() { return code };
			_classes[code] = _class;
		};

		BoardElement.addClass = function(code, className) {
			_classes[code] = className;
		};

		BoardElement.createFromCode = function(code, x, y) {
			if (_classes[code])
				return new _classes[code](x, y);
			else
				return null;
		};

		BoardElement.getClasses = function() { return _classes; };


		// dynamic

		BoardElement.prototype.setPosition = function(x, y) {
			game.updateElementPosition(this, true);
			this.x = x;
			this.y = y;
			this.clampedX = game.clampX(x);
			this.clampedY = game.clampY(y);
			game.updateElementPosition(this);
		}

		BoardElement.prototype.reset = function() {
			this.setPosition(this.startX, this.startY);
			this.isVisible = true;
			this.moveByCache = {};
		};

		// additinal variable: passingElement
		BoardElement.prototype.blocks = function() {
			return false;
		};

		BoardElement.prototype.canMoveBy = function(dx, dy, depth) {
			if (this.isFixed) return false;

			if (!depth)
				depth = 0;

			if (depth === tilt.WIDTH)
				return true;

			if (dx === 0 && dy === 0) return false;

			var _dx = 0;
			var _dy = 0;

			// check if target space if free:

			if (dx < 0) _dx = -1;
			if (dx > 0) _dx = 1;
			if (dy < 0) _dy = -1;
			if (dy > 0) _dy = 1;

			var cacheId = _dx + 3 * _dy;

			if (this.moveByCache[cacheId] === undefined) {

				var _targetX = this.x + _dx;
				var _targetY = this.y + _dy;

				if (game.noBounds) {
					_targetX = game.clampX(_targetX);
					_targetY = game.clampY(_targetY);
				}

				if (game.noBounds === false && (
					_targetX < 0 || _targetX > WIDTH - 1 ||
						_targetY < 0 || _targetY > HEIGHT - 1))
					this.moveByCache[cacheId] = false;
				else {
					var blocker = game.getFixedElement(_targetX, _targetY);
					if (blocker == null || blocker.blocks(this) == false) {
						blocker = game.getMovingElement(_targetX, _targetY);
						if (blocker && blocker.blocks(this) == false)
							blocker = null;
					}

					if (blocker)
						this.moveByCache[cacheId] = blocker.canMoveBy(_dx, _dy, depth + 1);
					else
						this.moveByCache[cacheId] = true;
				}
			}
			return this.moveByCache[cacheId];
		};

		BoardElement.prototype.updateSituation = function() {
			this.moveByCache = {};
		};

		BoardElement.prototype.trigger = function(element) {
		};

		BoardElement.prototype.triggerElementsOnMyPosition = function() {
			var element = game.getFixedElement(this.clampedX, this.clampedY);
			if (element)
				element.trigger(this);
		};

		BoardElement.prototype.moveBy = function(dx, dy, force) {
			if (this.isFixed) return false;

			if (dx !== 0 || dy !== 0) {

				var _dx = dx;
				var _dy = dy;


				if (!force) {

					if (_dx < -1) _dx = -1;
					if (_dx > 1) _dx = 1;
					if (_dy < -1) _dy = -1;
					if (_dy > 1) _dy = 1;
				}

				if (this.canMoveBy(_dx, _dy)) {
					this.setPosition(this.x + _dx, this.y + _dy);

					if (force) {
						this.x = this.clampedX;
						this.y = this.clampedY;
					}
					else {

						// reduce extreme offsets:
						if (this.x < -1) {
							this.x += tilt.WIDTH;
							this.renderX += tilt.WIDTH;
						}
						if (this.x > tilt.WIDTH) {
							this.x -= tilt.WIDTH;
							this.renderX -= tilt.WIDTH;
						}
						if (this.y < -1) {
							this.y += tilt.HEIGHT;
							this.renderY += tilt.HEIGHT;
						}
						if (this.y > tilt.HEIGHT) {
							this.y -= tilt.HEIGHT;
							this.renderY -= tilt.HEIGHT;
						}
					}

					this.isMoving = true;

					this.triggerElementsOnMyPosition();

					return true;
				}
			}
			return false;
		};

		BoardElement.prototype.tick = function(e) {
			if (this.renderDepth != this.depth) {
				var step = min(1, e.timeDelta * 0.01);
				this.renderDepth += (this.depth - this.renderDepth) * step;
				if (abs(this.renderDepth - this.depth) < 0.01)
					this.renderDepth = this.depth;
				e.changed = true;
			}

			// shortcuts to minimize execution length:
			if (this.isFixed || !e.timeDelta || e.timeDelta < 0) return;

			//if (!this.isMoving) return;

			var oldRenderX = this.renderX;
			var oldRenderY = this.renderY;

			var previewX = game.previewOffsetX;
			var previewY = game.previewOffsetY;

			if (!this.canMoveBy(previewX, previewY)) {
				previewX = 0;
				previewY = 0;
			}

			// calculate display (render) position:
			var targetX = this.x + previewX;
			var targetY = this.y + previewY;

			var distX = targetX - this.renderX;
			var distY = targetY - this.renderY;

			var deccelFaq = pow(0.99, e.timeDelta);

			var dx = distX - distX * deccelFaq;
			var dy = distY - distY * deccelFaq;

			this.renderX += dx;
			this.renderY += dy;

			// workaround for number inaccuracy:
			if (abs(this.x - this.renderX) < 0.01 && abs(this.y - this.renderY) < 0.01){
				if (game.noBounds) {
					this.x = this.clampedX;
					this.y = this.clampedY;
				}
				this.renderX = this.x;
				this.renderY = this.y;
			}

			this.isMoving = (this.renderX != oldRenderX || this.renderY != oldRenderY);
			if (this.isMoving) {
				e.changed = true;
			}
		};

		BoardElement.prototype.draw = function(addDrawCall) {
			// abstract
		};

		BoardElement.prototype.drawShadow = function(data) {
			var sw = 1.1 + 0.15 * this.renderDepth - 0.5 * this.renderZ;

			var x = data.x + _originX - 0.1 + this.renderZ * 0.3,
				y = data.y + _originY - 0.1 + this.renderZ * 0.3;

			data.ctx.drawImage(tilt.images["block_shadow"], x, y, sw, sw);
		};

		return BoardElement;
	}());



	tilt.Block = (function(_super) {
		tilt.BoardElement._extends(Block, _super, "");

		function Block(x, y) {
			_super.call(this, x, y);
			this.isFixed = false;
			this.holeUnderMe = null;
			this.depth = 1;
			this.renderDepth = this.depth;
			this.drawEdge = true;
			this.hasWon = false;
			this.wonTimestamp = null;
			this.renderColor = null;
		}

		Block.prototype.getCode = function() {
			throw new Error("Called abstract method 'Block.getCode()'");
		};

		Block.prototype.reset = function() {
			_super.prototype.reset.apply(this, arguments);
			this.holeUnderMe = null;
			this.hasWon = false;
			this.wonTimestamp = null;
			this.z = 0;
			this.renderZ = 0;
			this.renderColor = null;
		};

		// additional variable: passingElement
		Block.prototype.blocks = function() {
			return true;
		};

		Block.prototype.updateSituation = function() {
			this.moveByCache = {};
			var element = game.getFixedElement(this.clampedX, this.clampedY);
			this.holeUnderMe = (element && ("isFilled" in element)) ? element : null;
		};

		Block.prototype.tick = function(e) {
			var step;

			if (this.hasWon) {
				if (!this.wonTimestamp)
					this.wonTimestamp = e.timeStamp;
				this.z = 0.1;
				this.color = "#ffba00";
				e.changed = true;
			}
			if (this.renderZ != this.z) {
				step = min(1, e.timeDelta * 0.01);
				this.renderZ += (this.z - this.renderZ) * step;
				e.changed = true;
				if (this.y === 0 &&	game.paintOverFrameOffset < this.renderZ)
					game.paintOverFrameOffset = this.renderZ;
			}
			if (!this.renderColor)
				this.renderColor = this.color;
			else {
				if (this.renderColor != this.color) {
					step = min(1, e.timeDelta * 0.005);
					this.renderColor = tilt.mixColor(this.renderColor, this.color, 100 * step);
					e.changed = true;
				}
			}

			return _super.prototype.tick.apply(this, arguments);
		};


		Block.prototype.drawBlock = function(data){
			var x = data.x + _originX;
			var y = data.y + _originY - this.renderZ;
			var dx = game.tiltX * this.renderDepth;
			var dy = game.tiltY * this.renderDepth;

			// if a block has a low depth paint only its face:
			var depth = (this.renderDepth > 0.1) ? 1 : 0;

			tilt.drawBlock(data.ctx, x, y, this.renderColor, dx, dy, this.drawEdge, depth);

			if (this.holeUnderMe && !this.hasWon) {
				//var color = (this.hasWon || this.color === this.holeUnderMe.color) ? "#ffba00" : this.holeUnderMe.color;

				x += dx * this.depth;
				y += dy * this.depth;

				dx = -game.tiltX * 0.1;
				dy = -game.tiltY * 0.1;
				tilt.drawHole(data.ctx, x, y, this.holeUnderMe.color, dx, dy);
			}
		}

		Block.prototype.draw = function(addDrawCall) {
			if (!this.isVisible)
				return;

			var x = this.renderX,
				y = this.renderY,
				z = (this.renderDepth > 0.1) ? 0 : -2000;

			addDrawCall.call(this, { x: x, y: y, z: z, fn: this.drawBlock });

			if (this.renderDepth > 0.1)
				addDrawCall.call(this, { x: x, y: y, z: -1000, fn: this.drawShadow });

			// if block is outside frame add draw block again on the other side:
			if (x < 0 || x > tilt.WIDTH - 1 || y < 0 || y > tilt.HEIGHT - 1) {
				x = game.clampX(x);
				y = game.clampY(y);
				addDrawCall.call(this, { x: x, y: y, z: z, fn: this.drawBlock });

				if (this.renderDepth > 0.1)
					addDrawCall.call(this, { x: x, y: y, z: -1000, fn: this.drawShadow });
			}
		};

		Block.prototype.won = function() {
			if (this.holeUnderMe) {
				this.hasWon = true;
				return true;
			}
			else
				return false;
		};

		return Block;
	})(tilt.BoardElement);


	tilt.BlockSolid = (function(_super) {
		tilt.BoardElement._extends(BlockSolid, _super, "A");

		function BlockSolid(x, y) {
			_super.call(this, x, y);
			this.isFixed = true;
			this.depth = 1;
			this.drawEdge = false;
			this.color = this.renderColor = tilt.COLOR_BOARD;
		}
		return BlockSolid;
	})(tilt.Block);


	tilt.BlockRed = (function(_super) {
		tilt.BoardElement._extends(BlockRed, _super, "B");

		function BlockRed(x, y) {
			_super.call(this, x, y);
			this.color = this.renderColor = tilt.COLOR_RED;
		}

		BlockRed.prototype.won = function() {
			tilt.audio.play('won_1');
			return _super.prototype.won.apply(this, arguments);
		};

		return BlockRed;
	})(tilt.Block);


	tilt.BlockBlue = (function(_super) {
		tilt.BoardElement._extends(BlockBlue, _super, "C");

		function BlockBlue(x, y) {
			_super.call(this, x, y);
			this.color = this.renderColor = tilt.COLOR_BLUE;
		}

		BlockBlue.prototype.won = function() {
			tilt.audio.play('won_2');
			return _super.prototype.won.apply(this, arguments);
		};

		return BlockBlue;
	})(tilt.Block);



	tilt.Hole = (function(_super) {
		tilt.BoardElement._extends(Hole, _super, "");

		var	_originX = tilt.ORIGIN_X,
			_originY = tilt.ORIGIN_Y;

		function Hole(x, y) {
			_super.call(this, x, y);
			this.isFilled = false;
		}

		Hole.prototype.reset = function() {
			_super.prototype.reset.apply(this, arguments);
			this.isFilled = false;
		};

		Hole.prototype.drawHole = function(data) {
			var x = _originX + data.x,
				y = _originY + data.y,
				dx = -game.tiltX * 0.1,
				dy = -game.tiltY * 0.1;

			tilt.drawHole(data.ctx, x, y, this.color, dx, dy);
		}

		Hole.prototype.draw = function(addDrawCall) {
			if (this.isFilled)
				return;

			if (!this.isVisible)
				return;

			addDrawCall.call(this, { x: this.renderX, y: this.renderY, z: -2000, fn: this.drawHole });
		};

		Hole.prototype.updateSituation = function() {
			var block = game.getMovingElement(this.clampedX, this.clampedY);
			this.isFilled = (block && this.color === block.color);
		};

		return Hole;
	})(tilt.BoardElement);


	tilt.HoleRed = (function(_super) {
		tilt.BoardElement._extends(HoleRed, _super, "b");

		function HoleRed(x, y) {
			_super.call(this, x, y);
			this.color = tilt.COLOR_RED;
		}

		return HoleRed;
	})(tilt.Hole);


	tilt.HoleBlue = (function(_super) {
		tilt.BoardElement._extends(HoleBlue, _super, "c");

		function HoleBlue(x, y) {
			_super.call(this, x, y);
			this.color = tilt.COLOR_BLUE;
		}

		return HoleBlue;
	})(tilt.Hole);


	tilt.HoleAll = (function(_super) {
		tilt.BoardElement._extends(HoleAll, _super, "a");

		function HoleAll(x, y) {
			_super.call(this, x, y);
			this.color = "#afc98d";
		}

		HoleAll.prototype.isFilled = function() {
			var block = game.getMovingElement(this.clampedX, this.clampedY);
			this.isFilled = (block !== null);
		};

		return HoleAll;
	})(tilt.Hole);



	tilt.Star = (function(_super) {

		var _bitmapSize = 80;

		tilt.BoardElement._extends(Star, _super, "s");

		function Star(x, y) {
			_super.call(this, x, y);
			this.color = "#ffe500";
			this.number = 0;
			//this.renderOpacity = 1;
			this.collected = false;
		}

		Star.prototype.reset = function() {
			_super.prototype.reset.apply(this, arguments);
			this.isVisible = this.number < 2;
			if (game.editor)
				this.isVisible = true;
			this.renderOpacity = (this.isVisible) ? 1 : 0;
			this.collected = false;
		};

		Star.prototype.drawStar = function(data) {
			var x =	data.x + tilt.ORIGIN_X;
			var y = data.y + tilt.ORIGIN_Y;

			//data.ctx.globalAlpha = this.renderOpacity;
			tilt.drawStar(data.ctx, x, y, game.tiltX, game.tiltY);

			if (this.number > 0 && game.editor) {
				data.ctx.drawImage(tilt.images['numbers'], _bitmapSize * (this.number - 1), 0, _bitmapSize, _bitmapSize,
					x, y, 1, 1);
			}
			//data.ctx.globalAlpha = 1;
		};

		Star.prototype.draw = function(addDrawCall) {
			if (this.isVisible) {
				addDrawCall.call(this, { x: this.renderX, y: this.renderY, z: -2000, fn: this.drawStar });
			}
		};

		Star.prototype.trigger = function() {
			if (this.isVisible) {
				this.isVisible = false;
				this.collected = true;
				tilt.audio.play('star');

				// show subsequent stars:
				if (this.number > 0) {
					var that = this;

					// Check if there are more stars with the same number to collect:
					if (game.checkEach(function(element){
						return (element.number && element.number === that.number && element.isVisible);
					}))
						return;


					game.each(function(element){
						if (element.number && element.number === that.number + 1) {
							element.renderOpacity = 0;
							element.isVisible = true;
						}
					});
				}

			}
		};

		return Star;
	}(tilt.BoardElement));


	tilt.Star1 = (function(_super) {
		tilt.BoardElement._extends(Star1, _super, "1");

		function Star1(x, y) {
			_super.call(this, x, y);
			this.number = 1;
		}

	}(tilt.Star));

	tilt.Star2 = (function(_super) {
		tilt.BoardElement._extends(Star2, _super, "2");

		function Star2(x, y) {
			_super.call(this, x, y);
			this.number = 2;
		}

	}(tilt.Star));

	tilt.Star3 = (function(_super) {
		tilt.BoardElement._extends(Star3, _super, "3");

		function Star3(x, y) {
			_super.call(this, x, y);
			this.number = 3;
		}

	}(tilt.Star));

	tilt.Star4 = (function(_super) {
		tilt.BoardElement._extends(Star3, _super, "4");

		function Star3(x, y) {
			_super.call(this, x, y);
			this.number = 4;
		}

	}(tilt.Star));

	tilt.Star5 = (function(_super) {
		tilt.BoardElement._extends(Star3, _super, "5");

		function Star3(x, y) {
			_super.call(this, x, y);
			this.number = 5;
		}

	}(tilt.Star));



	tilt.Door = (function(_super) {
		var _isOpen = false;

		tilt.BoardElement._extends(Door, _super, "D");

		function Door(x, y) {
			_super.call(this, x, y);
			this.color = this.renderColor = "#e07a01";
			this.depth = 1;
			_isOpen = false;
		}

		Door.prototype.reset = function() {
			_super.prototype.reset.apply(this, arguments);
			_isOpen = false;
		};

		Door.prototype.isOpen = function() {
			return _isOpen || this.isBlocked;
		};

		Door.prototype.blocks = function() {
			return !this.isOpen();
		};

		Door.prototype.tick = function(e) {
			var oldDepth = this.depth;

			this.depth = (this.isOpen()) ? 0 : 1;
			if (this.depth === 0)
				this.renderDepth = 0;

			if (this.depth != oldDepth) {
				if (this.depth === 0)
					tilt.audio.play('door-opened');
				e.changed = true;
			}

			return _super.prototype.tick.apply(this, arguments);
		};

		Door.prototype.updateSituation = function() {
			_super.prototype.updateSituation.apply(this, arguments);

			var block = game.getMovingElement(this.clampedX, this.clampedY);
			this.isBlocked = (block !== null);
			//console.log(_isOpen + ' ' + this.isBlocked + ' ' + this.isOpen());
		};

		Object.defineProperty(Door, "isOpen", {
			get: function() { return _isOpen; },
			set: function(value) { _isOpen = value }
		});

		return Door;
	}(tilt.BlockSolid));



	tilt.Button = (function(_super) {
		var _lastTimeStamp = 0,
			_isPressed = false;

		tilt.BoardElement._extends(Button, _super, "d");

		function Button(x, y) {
			_super.call(this, x, y);
			_isPressed = false;
		}

		Button.prototype.reset = function() {
			_super.prototype.reset.apply(this, arguments);
			this.depth = this.renderDepth = 0.1;
			_isPressed = false;
		};

		Button.prototype.drawButton = function(data) {
			tilt.drawButton(data.ctx, tilt.ORIGIN_X + data.x, tilt.ORIGIN_Y + data.y, game.tiltX, game.tiltY, this.renderDepth);
		};

		Button.prototype.draw = function(addDrawCall) {
			if (this.isVisible)
				addDrawCall.call(this, { x: this.renderX, y: this.renderY, z: -2000, fn: this.drawButton });
		};

		Button.prototype.updateSituation = function(timeStamp) {
			_super.prototype.updateSituation.apply(this, arguments);

			if (timeStamp !== _lastTimeStamp) {
				// make sure this is called only once per update:
				tilt.Door.isOpen = false;
				_isPressed = false;
				_lastTimeStamp = timeStamp;
			}

			if (!_isPressed) {
				var block = game.getMovingElement(this.clampedX, this.clampedY);
				_isPressed = (block !== null);

				if (_isPressed) {
					tilt.Door.isOpen = true;
				}
			}
			this.depth = (_isPressed) ? 0 : 0.1;
		};

		Object.defineProperty(Button, "isPressed", {
			get: function() { return _isPressed; },
			set: function(value) { _isPressed = value }
		});

		return Button;

	}(tilt.BoardElement));

})();