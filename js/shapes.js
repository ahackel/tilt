/**
 * Tilt - A puzzle game
 * @version v1.0.2 - 2014-12-06
 * @link
 * @author Andreas Hackel <http://www.andreashackel.de>
 * @license Creative Commons BY-NC License, http://creativecommons.org/licenses/by-nc/4.0/
 */

'use strict';

// TODO: implement use of webkitBackingStorePixelRatio (on Mac OS X with retina display)

(function() {

	var _bitmapSize = tilt.BITMAPSIZE,
		_cornerRadius = tilt.CORNER_RADIUS,
		_borderWidth = tilt.BORDER_WIDTH,
		_3D_Board = tilt.USE_3D_BOARD,
		_frameWidth = tilt.FRAME_WIDTH,
		_frameColor,
		_frameBorderColor,
		_frameSideColor,
		CACHE_SIZE = 256,
		CACHE_DELTA_RESOLUTION = (tilt.IPHONE && !tilt.IPHONE5) ? 50 : 100,
		abs = Math.abs,
		ceil = Math.ceil,
		min = Math.min;

	var bitmapCache = {
		drawCalls: 0,
		items: {},
		stack: [],
		draw: function(ctx, params, cacheOnly) {
			params.x = params.x || 0;
			params.y = params.y || 0;
			params.dx = params.dx || 0;
			params.dy = params.dy || 0;
			params.w = params.w || 1;
			params.h = params.h || 1;
			params.color = params.color || '';

			// fast method to generate an id from dx and dy:
			var dxInt = (params.dx * CACHE_DELTA_RESOLUTION) | 0,
				dyInt = (params.dy * CACHE_DELTA_RESOLUTION) | 0,

				cacheId = params.name + '_' + params.color;

			if (!params.forceUpdatePerFrame)
				cacheId += '_' + dxInt + '_' + dyInt;
			if (params.depth)
				cacheId += '_' + params.depth;

			var cacheItem = bitmapCache.items[cacheId];

			if (cacheItem && cacheItem.forceUpdatePerFrame && cacheItem.timeStamp < tilt.game.timeStamp) {
				bitmapCache.items[cacheId] = null;
				cacheItem = null;
			}

			if (!cacheItem){
				if (bitmapCache.stack.length >= CACHE_SIZE) {
					var droppedItem = bitmapCache.stack.shift();
					delete bitmapCache.items[droppedItem.id];
					droppedItem = null;
				}

				cacheItem = params;
				if (!params.permanent && !params.forceUpdatePerFrame)
					bitmapCache.stack.push(cacheItem);

				bitmapCache.items[cacheId] = cacheItem;

				// draw to cache;

				cacheItem.id = cacheId;
				cacheItem.timeStamp = tilt.game.timeStamp;

				cacheItem.canvas = document.createElement('Canvas');
				cacheItem.canvas.width = ceil(params.w * _bitmapSize);
				cacheItem.canvas.height = ceil(params.h * _bitmapSize);
				cacheItem.ctx = cacheItem.canvas.getContext('2d');
				cacheItem.ctx.scale(_bitmapSize, _bitmapSize);

				bitmapCache.drawCalls++;
				params.drawFn(cacheItem);
			}

			if (!cacheOnly)
				ctx.drawImage(cacheItem.canvas, params.x, params.y, cacheItem.w, cacheItem.h);

			return cacheItem;
		},
		clear: function() {
			bitmapCache.items = {};
			bitmapCache.stack = [];
			bitmapCache.drawCalls = 0;
		}
	};

	tilt.bitmapCache = bitmapCache;

	tilt.tiltRect = function(ctx, x, y, w, h, dx, dy) {
		ctx.beginPath();
		if (dx <= 0 && dy <= 0) {
			ctx.moveTo(x + dx, y + dy);
			ctx.lineTo(x + dx + w, y + dy);
			ctx.lineTo(x + w, y);
			ctx.lineTo(x + w, y + h);
			ctx.lineTo(x, y + h);
			ctx.lineTo(x + dx, y + dy + h);
		}
		else if (dx > 0 && dy <= 0) {
			ctx.moveTo(x + dx, y + dy);
			ctx.lineTo(x + dx + w, y + dy);
			ctx.lineTo(x + dx + w, y + dy + h);
			ctx.lineTo(x + w, y + h);
			ctx.lineTo(x, y + h);
			ctx.lineTo(x, y);
		}
		else if (dx <= 0 && dy > 0) {
			ctx.moveTo(x, y);
			ctx.lineTo(x + w, y);
			ctx.lineTo(x + w, y + h);
			ctx.lineTo(x + dx + w, y + dy + h);
			ctx.lineTo(x + dx, y + dy + h);
			ctx.lineTo(x + dx, y + dy);
		}
		else if (dx > 0 && dy > 0) {
			ctx.moveTo(x, y);
			ctx.lineTo(x + w, y);
			ctx.lineTo(x + dx + w, y + dy);
			ctx.lineTo(x + dx + w, y + dy + h);
			ctx.lineTo(x + dx, y + dy + h);
			ctx.lineTo(x, y + h);
		}
		ctx.closePath();

	};

	function _drawBlockFace(cache) {
		var highlightOffset = 0.1,
			highlightRadius = 0.05,
			edgeDist = 0.025,
			faceDist = 0.07,
			edgeColor = tilt.lighten(cache.color, 10),
			faceColor1 = tilt.darken(cache.color, 7),
			faceColor2 = tilt.lighten(cache.color, 7),
			highlightColor = tilt.lighten(cache.color, 40),
			br = _cornerRadius + _borderWidth,
			faceColor,
			ctx = cache.ctx;

		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.lineWidth = _cornerRadius * 2;
		ctx.strokeStyle = cache.color;
		ctx.beginPath();
		ctx.rect(br, br, 1 - 2 * br, 1 - 2 * br);
		ctx.closePath();
		ctx.stroke();

		ctx.lineWidth = (_cornerRadius - edgeDist) * 2;
		ctx.strokeStyle = edgeColor;
		ctx.beginPath();
		ctx.rect(br, br, 1 - 2 * br, 1 - 2 * br);
		ctx.closePath();

		ctx.stroke();

		if (cache.isShiny) {
			faceColor = ctx.createLinearGradient(0, 0, 0, 1);
			faceColor.addColorStop(0, faceColor1);
			faceColor.addColorStop(1, faceColor2);
		}
		else
			faceColor = cache.color;

		ctx.lineWidth = (_cornerRadius - faceDist) * 2;
		ctx.fillStyle = faceColor;
		ctx.strokeStyle = faceColor;
		ctx.beginPath();
		ctx.rect(br, br, 1 - 2 * br, 1 - 2 * br);
		ctx.closePath();
		ctx.stroke();
		ctx.fill();

		// Highlight:

		if (cache.isShiny) {
			ctx.fillStyle = highlightColor;
			ctx.beginPath();
			ctx.arc(highlightOffset, highlightOffset, highlightRadius, Math.PI*2, 0, true);
			ctx.closePath();
			ctx.fill();
		}
	}


	function _drawBlock(cache) {
		var borderColor = tilt.darken(cache.color, 30),
			sideColor = tilt.mixColor(tilt.darken(cache.color, 20), tilt.COLOR_BOARD_BG, 10),
			ctx = cache.ctx,

		// this is the position to draw the block into the cache canvas:
			offsetX = -min(0, cache.dx),
			offsetY = -min(0, cache.dy),

			br = _cornerRadius + _borderWidth;

		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.lineWidth = br * 2;
		ctx.strokeStyle = borderColor;
		//ctx.save();

		// draw base:
		if (cache.dx !== 0 || cache.dy !== 0) {
			tilt.tiltRect(ctx, offsetX + br, offsetY + br, 1 - 2 * br, 1 - 2 * br, cache.dx, cache.dy);
			ctx.stroke();

			// Sides:

			ctx.lineWidth = _cornerRadius * 2;
			ctx.strokeStyle = sideColor;
			ctx.stroke();
			ctx.fillStyle = sideColor;
			ctx.fill();
		}

		// draw face:
		bitmapCache.draw(ctx, { name: "Blockface", drawFn: _drawBlockFace, color: cache.color,
			x: cache.dx + offsetX, y: cache.dy + offsetY, isShiny: cache.isShiny });

		// TODO: if we don't use 3D the block face does not need to be cached because the whole block is always cached:
	}

	tilt.drawBlock = function(ctx, x, y, color, dx, dy, isShiny, depth) {
		var w = (_3D_Board) ? abs(dx) + 1 : 1,
			h = (_3D_Board) ? abs(dy) + 1 : 1.2,
			offsetX = -min(0, dx),
			offsetY = -min(0, dy);

		bitmapCache.draw(ctx, {	name: "Block", drawFn: _drawBlock, x: x - offsetX, y: y - offsetY,
			w: w, h: h,	dx: dx, dy: dy, color: color, isShiny: isShiny, depth: depth });
	};


	function _drawHole(cache) {
		var radius = 0.28,
			lineWidth = 0.05;

		cache.ctx.fillStyle = "rgba(0,0,0,0.2)";
		cache.ctx.beginPath();
		cache.ctx.arc(0.5, 0.5, radius + lineWidth, Math.PI*2, 0, true);
		cache.ctx.fill();

		cache.ctx.fillStyle = cache.color;
		cache.ctx.beginPath();
		cache.ctx.arc(0.5 + cache.dx, 0.5 + cache.dy, radius, Math.PI*2, 0, true);
		cache.ctx.fill();

		cache.ctx.drawImage(tilt.images['hole_shadow'], cache.dx, cache.dy, 1, 1);
	}

	tilt.drawHole = function(ctx, x, y, color, dx, dy) {
		bitmapCache.draw(ctx, { name: "Hole", drawFn: _drawHole, x: x, y: y, color: color, dx: dx, dy: dy, forceUpdatePerFrame: true });
	};

	function _drawButtonFace(cache) {
		// draw slow svg image to cache:
		cache.ctx.drawImage(tilt.images['button'], 0, 0, 1, 1);
	}


	function _drawButton(cache) {
		if (cache.depth > 0.01)
			cache.ctx.drawImage(tilt.images['button_shadow'], 0, 0, 1, 1);

		bitmapCache.draw(cache.ctx, { name: "Buttonface", drawFn: _drawButtonFace, x: cache.depth * cache.dx, y: cache.depth * cache.dy, permanent: true } );
	}

	tilt.drawButton = function(ctx, x, y, dx, dy, depth) {
		bitmapCache.draw(ctx, { name: "Button", drawFn: _drawButton, x: x, y: y, dx: dx, dy: dy, depth: depth, forceUpdatePerFrame: true })
	};

	function _drawCoinFace(cache) {
		// draw slow svg image to cache:
		cache.ctx.drawImage(tilt.images['coin'], 0, 0, 1, 1);
	}

	function _drawStar(cache) {
		var depth = 0.2;
		cache.ctx.drawImage(tilt.images["coin_shadow"], 0, 0, 1, 1);
		bitmapCache.draw(cache.ctx, { name: "Coinface", drawFn: _drawCoinFace, x: depth * cache.dx, y: depth * cache.dy, permanent: true } );
	}

	tilt.drawStar = function(ctx, x, y, dx, dy) {
		bitmapCache.draw(ctx, { name: 'Star', drawFn: _drawStar, x: x, y: y, dx: dx, dy: dy, forceUpdatePerFrame: true } );
	};

	tilt.hollowRect = function(ctx, x, y, w, h, bw) {
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x + w, y);
		ctx.lineTo(x + w, y + h);
		ctx.lineTo(x, y + h);
		ctx.closePath();

		//ctx.beginPath();
		ctx.moveTo(x + bw, y + bw);
		ctx.lineTo(x + bw, y + h - bw);
		ctx.lineTo(x + w - bw, y + h - bw);
		ctx.lineTo(x + w - bw, y + bw);
		ctx.closePath();
	};

	tilt.hollowTiltRect = function(ctx, x, y, w, h, bw, dx, dy) {
		if (dx <= 0 && dy <= 0) {
			ctx.beginPath();
			ctx.moveTo(x + dx, y + dy);
			ctx.lineTo(x + dx + w, y + dy);
			ctx.lineTo(x + w, y);
			ctx.lineTo(x + w, y + h);
			ctx.lineTo(x, y + h);
			ctx.lineTo(x + dx, y + dy + h);
			ctx.closePath();
			//ctx.beginPath();
			ctx.moveTo(x + bw, y + bw);
			ctx.lineTo(x + bw, y + h + dy - bw);
			ctx.lineTo(x + w + dx - bw, y + h + dy - bw);
			ctx.lineTo(x + w + dx - bw, y + bw);
			ctx.closePath();
		}
		else if (dx > 0 && dy <= 0) {
			ctx.beginPath();
			ctx.moveTo(x + dx, y + dy);
			ctx.lineTo(x + dx + w, y + dy);
			ctx.lineTo(x + dx + w, y + dy + h);
			ctx.lineTo(x + w, y + h);
			ctx.lineTo(x, y + h);
			ctx.lineTo(x, y);
			ctx.closePath();
			//ctx.beginPath();
			ctx.moveTo(x + dx + bw, y + bw);
			ctx.lineTo(x + dx + bw, y + h + dy - bw);
			ctx.lineTo(x + w - bw, y + h + dy - bw);
			ctx.lineTo(x + w - bw, y + bw);
			ctx.closePath();
		}
		else if (dx <= 0 && dy > 0) {
			ctx.beginPath();
			ctx.moveTo(x, y);
			ctx.lineTo(x + w, y);
			ctx.lineTo(x + w, y + h);
			ctx.lineTo(x + dx + w, y + dy + h);
			ctx.lineTo(x + dx, y + dy + h);
			ctx.lineTo(x + dx, y + dy);
			ctx.closePath();
			//ctx.beginPath();
			ctx.moveTo(x + bw, y + dy + bw);
			ctx.lineTo(x + bw, y + h - bw);
			ctx.lineTo(x + w + dx - bw, y + h - bw);
			ctx.lineTo(x + w + dx - bw, y + dy + bw);
			ctx.closePath();
		}
		else if (dx > 0 && dy > 0) {
			ctx.beginPath();
			ctx.moveTo(x, y);
			ctx.lineTo(x + w, y);
			ctx.lineTo(x + dx + w, y + dy);
			ctx.lineTo(x + dx + w, y + dy + h);
			ctx.lineTo(x + dx, y + dy + h);
			ctx.lineTo(x, y + h);
			ctx.closePath();
			//ctx.beginPath();
			ctx.moveTo(x + dx + bw, y + dy + bw);
			ctx.lineTo(x + dx + bw, y + h - bw);
			ctx.lineTo(x + w - bw, y + h - bw);
			ctx.lineTo(x + w - bw, y + dy + bw);
			ctx.closePath();
		}
	};

	tilt.drawFrameBottom = function(ctx, x, y, color, dx, dy) {
		var br = _cornerRadius + _borderWidth,
			w = tilt.WIDTH + 2 * _frameWidth,
			h = tilt.HEIGHT + 2 * _frameWidth;

		if (color != _frameColor) {
			_frameColor = color;
			_frameBorderColor = tilt.darken(_frameColor, 30);
			_frameSideColor = tilt.mixColor(tilt.darken(_frameColor, 20), tilt.COLOR_BOARD_BG, 10);
		}

		ctx.lineWidth = br * 2;

		// Border:

		ctx.strokeStyle = _frameBorderColor;
		tilt.hollowTiltRect(ctx, x + br, y + br, w - 2 * br, h - 2 * br, _frameWidth - 2 * br, dx, dy);
		ctx.stroke();

		// Sides:

		ctx.lineWidth = _cornerRadius * 2;
		ctx.fillStyle = _frameSideColor;
		ctx.strokeStyle = _frameSideColor;
		ctx.fill();
		ctx.stroke();
	};

	function _drawFrameTop(cache) {
		var br = _cornerRadius + _borderWidth,
			edgeDist = 0.025,
			faceDist = 0.07,
			w = tilt.WIDTH + 2 * _frameWidth,
			h = tilt.HEIGHT + 2 * _frameWidth,
			edgeColor = tilt.lighten(cache.color, 10),
			ctx = cache.ctx;

		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';

		// Face:

		var _frameColorGradient = ctx.createLinearGradient(0, 0, 0, h);
		_frameColorGradient.addColorStop(0, tilt.lighten(cache.color, 10));
		_frameColorGradient.addColorStop(1, tilt.darken(cache.color, 50));

		ctx.lineWidth = _cornerRadius * 2;
		ctx.strokeStyle = cache.color;
		tilt.hollowRect(ctx, br, br, w - 2 * br, h - 2 * br, _frameWidth - 2 * br);
		ctx.stroke();

		ctx.lineWidth = (_cornerRadius - edgeDist) * 2;
		ctx.strokeStyle = edgeColor;
		tilt.hollowRect(ctx, br, br, w - 2 * br, h - 2 * br, _frameWidth - 2 * br);
		ctx.stroke();

		ctx.lineWidth = (_cornerRadius - faceDist) * 2;
		ctx.fillStyle = cache.color;
		ctx.strokeStyle = cache.color;
		//tilt.hollowRect(cache.ctx, br, br, w - 2 * br, h - 2 * br, _frameWidth - 2 * br);
		ctx.fill();
		ctx.stroke();
	}

	tilt.drawFrameTop = function(ctx, x, y, color, dx, dy) {
		var w = tilt.WIDTH + 2 * _frameWidth,
			h = tilt.HEIGHT + 2 * _frameWidth,
			fw = _frameWidth,
			bs = _bitmapSize;

		var cache = bitmapCache.draw(ctx, { name: "Frametop", drawFn: _drawFrameTop, color: color, w: w, h: h, permanent: true }, true);

		ctx.drawImage(cache.canvas, 0, 0, w * bs, fw * bs, x + dx, y + dy, w, fw);
		ctx.drawImage(cache.canvas, 0, (h - fw) * bs, w * bs, fw * bs, x + dx, y + dy + h - fw, w, fw);
		ctx.drawImage(cache.canvas, 0, fw * bs, fw * bs, (h - 2 * fw) * bs, x + dx, y + dy + fw, fw, h - 2 * fw);
		ctx.drawImage(cache.canvas, (w - fw) * bs, fw * bs, fw * bs, (h - 2 * fw) * bs, x + dx + w - fw, y + dy + fw, fw, h - 2 * fw);
	};

	tilt.drawFrame = function(ctx, x, y, dx, dy) {
		/*		tilt.drawFrameBottom(c.ctx, offsetX, offsetY, w, h, dx, dy);
		 tilt.drawFrameTop(c.ctx, offsetX, offsetY, w, h, dx, dy);
		 ctx.drawImage(c.canvas, x - offsetX, y - offsetY, cacheW / _bitmapSize, cacheH / _bitmapSize);*/
	};


	tilt.drawSelection = function(ctx, x, y) {
		var lineWidth = 0.05,
			lw = lineWidth / 2;

		ctx.strokeStyle = 'white';
		ctx.lineWidth = lineWidth;
		ctx.beginPath();
		ctx.rect(x + lw, y + lw, 1 - lineWidth, 1 - lineWidth);
		ctx.closePath();
		ctx.stroke();
	};




}());

