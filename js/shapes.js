/**
 * Tilt - A puzzle game
 * @version v1.0.2 - 2014-12-06
 * @link
 * @author Andreas Hackel <http://www.andreashackel.de>
 * @license Creative Commons BY-NC License, http://creativecommons.org/licenses/by-nc/4.0/
 */

'use strict';

// TODO: implement use of webkitBackingStorePixelRatio (on Mac OS X with retina display)

class Shapes {
	constructor(tilt) {
		tilt.shapes = this;

		this._frameBorderColor = 0;
		this._frameSideColor = 0;

		this.CACHE_SIZE = 256,
		this.CACHE_DELTA_RESOLUTION = (tilt.IPHONE && !tilt.IPHONE5) ? 50 : 100;

		this.bitmapCache = {
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
				var dxInt = (params.dx * tilt.shapes.CACHE_DELTA_RESOLUTION) | 0,
					dyInt = (params.dy * tilt.shapes.CACHE_DELTA_RESOLUTION) | 0,

					cacheId = params.name + '_' + params.color;

				if (!params.forceUpdatePerFrame)
					cacheId += '_' + dxInt + '_' + dyInt;
				if (params.depth)
					cacheId += '_' + params.depth;

				var cacheItem = this.items[cacheId];

				if (cacheItem && cacheItem.forceUpdatePerFrame && cacheItem.timeStamp < tilt.game.timeStamp) {
					this.items[cacheId] = null;
					cacheItem = null;
				}

				if (!cacheItem){
					if (this.stack.length >= tilt.shapes.CACHE_SIZE) {
						var droppedItem = this.stack.shift();
						delete this.items[droppedItem.id];
						droppedItem = null;
					}

					cacheItem = params;
					if (!params.permanent && !params.forceUpdatePerFrame)
						this.stack.push(cacheItem);

					this.items[cacheId] = cacheItem;

					// draw to cache;

					cacheItem.id = cacheId;
					cacheItem.timeStamp = tilt.game.timeStamp;

					cacheItem.canvas = document.createElement('Canvas');
					cacheItem.canvas.width = Math.ceil(params.w * tilt.BITMAPSIZE);
					cacheItem.canvas.height = Math.ceil(params.h * tilt.BITMAPSIZE);
					cacheItem.ctx = cacheItem.canvas.getContext('2d');
					cacheItem.ctx.scale(tilt.BITMAPSIZE, tilt.BITMAPSIZE);

					this.drawCalls++;
					params.drawFn.call(tilt.shapes, cacheItem);
				}

				if (!cacheOnly)
					ctx.drawImage(cacheItem.canvas, params.x, params.y, cacheItem.w, cacheItem.h);

				return cacheItem;
			},
			clear: function() {
				this.items = {};
				this.stack = [];
				this.drawCalls = 0;
			}
		};
	}

	tiltRect (ctx, x, y, w, h, dx, dy) {
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
	}

	_drawBlockFace(cache) {
		var highlightOffset = 0.1,
			highlightRadius = 0.05,
			edgeDist = 0.025,
			faceDist = 0.07,
			edgeColor = tilt.lighten(cache.color, 10),
			faceColor1 = tilt.darken(cache.color, 7),
			faceColor2 = tilt.lighten(cache.color, 7),
			highlightColor = tilt.lighten(cache.color, 40),
			br = tilt.CORNER_RADIUS + tilt.BORDER_WIDTH,
			faceColor,
			ctx = cache.ctx;

		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.lineWidth = tilt.CORNER_RADIUS * 2;
		ctx.strokeStyle = cache.color;
		ctx.beginPath();
		ctx.rect(br, br, 1 - 2 * br, 1 - 2 * br);
		ctx.closePath();
		ctx.stroke();

		ctx.lineWidth = (tilt.CORNER_RADIUS - edgeDist) * 2;
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

		ctx.lineWidth = (tilt.CORNER_RADIUS - faceDist) * 2;
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

	_drawBlock(cache) {
		var borderColor = tilt.darken(cache.color, 30),
			sideColor = tilt.mixColor(tilt.darken(cache.color, 20), tilt.COLOR_BOARD_BG, 10),
			ctx = cache.ctx,

		// this is the position to draw the block into the cache canvas:
			offsetX = -Math.min(0, cache.dx),
			offsetY = -Math.min(0, cache.dy),

			br = tilt.CORNER_RADIUS + tilt.BORDER_WIDTH;

		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.lineWidth = br * 2;
		ctx.strokeStyle = borderColor;
		//ctx.save();

		// draw base:
		if (cache.dx !== 0 || cache.dy !== 0) {
			this.tiltRect(ctx, offsetX + br, offsetY + br, 1 - 2 * br, 1 - 2 * br, cache.dx, cache.dy);
			ctx.stroke();

			// Sides:

			ctx.lineWidth = tilt.CORNER_RADIUS * 2;
			ctx.strokeStyle = sideColor;
			ctx.stroke();
			ctx.fillStyle = sideColor;
			ctx.fill();
		}

		// draw face:
		this.bitmapCache.draw(ctx, { name: "Blockface", drawFn: this._drawBlockFace, color: cache.color,
			x: cache.dx + offsetX, y: cache.dy + offsetY, isShiny: cache.isShiny });

		// TODO: if we don't use 3D the block face does not need to be cached because the whole block is always cached:
	}

	drawBlock(ctx, x, y, color, dx, dy, isShiny, depth) {
		var w = Math.abs(dx) + 1,
			h = Math.abs(dy) + 1,
			offsetX = -Math.min(0, dx),
			offsetY = -Math.min(0, dy);

		this.bitmapCache.draw(ctx, {	name: "Block", drawFn: this._drawBlock, x: x - offsetX, y: y - offsetY,
			w: w, h: h,	dx: dx, dy: dy, color: color, isShiny: isShiny, depth: depth });
	}

	_drawHole(cache) {
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

	drawHole (ctx, x, y, color, dx, dy) {
		this.bitmapCache.draw(ctx, { name: "Hole", drawFn: this._drawHole, x: x, y: y, color: color, dx: dx, dy: dy, forceUpdatePerFrame: true });
	}

	_drawButtonFace(cache) {
		// draw slow svg image to cache:
		cache.ctx.drawImage(tilt.images['button'], 0, 0, 1, 1);
	}

	_drawButton(cache) {
		if (cache.depth > 0.01)
			cache.ctx.drawImage(tilt.images['button_shadow'], 0, 0, 1, 1);

		this.bitmapCache.draw(cache.ctx, { name: "Buttonface", drawFn: this._drawButtonFace, x: cache.depth * cache.dx, y: cache.depth * cache.dy, permanent: true } );
	}

	drawButton(ctx, x, y, dx, dy, depth) {
		this.bitmapCache.draw(ctx, { name: "Button", drawFn: this._drawButton, x: x, y: y, dx: dx, dy: dy, depth: depth, forceUpdatePerFrame: true })
	}

	_drawCoinFace(cache) {
		// draw slow svg image to cache:
		cache.ctx.drawImage(tilt.images['coin'], 0, 0, 1, 1);
	}

	_drawStar(cache) {
		var depth = 0.2;
		cache.ctx.drawImage(tilt.images["coin_shadow"], 0, 0, 1, 1);
		this.bitmapCache.draw(cache.ctx, { name: "Coinface", drawFn: this._drawCoinFace, x: depth * cache.dx, y: depth * cache.dy, permanent: true } );
	}

	drawStar(ctx, x, y, dx, dy) {
		this.bitmapCache.draw(ctx, { name: 'Star', drawFn: this._drawStar, x: x, y: y, dx: dx, dy: dy, forceUpdatePerFrame: true } );
	}

	hollowRect(ctx, x, y, w, h, bw) {
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
	}

	hollowTiltRect(ctx, x, y, w, h, bw, dx, dy) {
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
	}

	drawFrameBottom (ctx, x, y, color, dx, dy) {
		var br = tilt.CORNER_RADIUS + tilt.BORDER_WIDTH,
			w = tilt.WIDTH + 2 * tilt.FRAME_WIDTH,
			h = tilt.HEIGHT + 2 * tilt.FRAME_WIDTH;

		if (color != tilt.FRAME_COLOR) {
			tilt.FRAME_COLOR = color;
			this._frameBorderColor = tilt.darken(tilt.FRAME_COLOR, 30);
			this._frameSideColor = tilt.mixColor(tilt.darken(tilt.FRAME_COLOR, 20), tilt.COLOR_BOARD_BG, 10);
		}

		ctx.lineWidth = br * 2;

		// Border:

		ctx.strokeStyle = this._frameBorderColor;
		this.hollowTiltRect(ctx, x + br, y + br, w - 2 * br, h - 2 * br, tilt.FRAME_WIDTH - 2 * br, dx, dy);
		ctx.stroke();

		// Sides:

		ctx.lineWidth = tilt.CORNER_RADIUS * 2;
		ctx.fillStyle = this._frameSideColor;
		ctx.strokeStyle = this._frameSideColor;
		ctx.fill();
		ctx.stroke();
	}

	_drawFrameTop(cache) {
		var br = tilt.CORNER_RADIUS + tilt.BORDER_WIDTH,
			edgeDist = 0.025,
			faceDist = 0.07,
			w = tilt.WIDTH + 2 * tilt.FRAME_WIDTH,
			h = tilt.HEIGHT + 2 * tilt.FRAME_WIDTH,
			edgeColor = tilt.lighten(cache.color, 10),
			ctx = cache.ctx;

		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';

		// Face:

		var _frameGradient = ctx.createLinearGradient(0, 0, 0, h);
		_frameGradient.addColorStop(0, tilt.lighten(cache.color, 10));
		_frameGradient.addColorStop(1, tilt.darken(cache.color, 50));

		ctx.lineWidth = tilt.CORNER_RADIUS * 2;
		ctx.strokeStyle = cache.color;
		this.hollowRect(ctx, br, br, w - 2 * br, h - 2 * br, tilt.FRAME_WIDTH - 2 * br);
		ctx.stroke();

		ctx.lineWidth = (tilt.CORNER_RADIUS - edgeDist) * 2;
		ctx.strokeStyle = edgeColor;
		this.hollowRect(ctx, br, br, w - 2 * br, h - 2 * br, tilt.FRAME_WIDTH - 2 * br);
		ctx.stroke();

		ctx.lineWidth = (tilt.CORNER_RADIUS - faceDist) * 2;
		ctx.fillStyle = cache.color;
		ctx.strokeStyle = cache.color;
		//tilt.hollowRect(cache.ctx, br, br, w - 2 * br, h - 2 * br, tilt.FRAME_WIDTH - 2 * br);
		ctx.fill();
		ctx.stroke();
	}

	drawFrameTop(ctx, x, y, color, dx, dy) {
		var w = tilt.WIDTH + 2 * tilt.FRAME_WIDTH,
			h = tilt.HEIGHT + 2 * tilt.FRAME_WIDTH,
			fw = tilt.FRAME_WIDTH,
			bs = tilt.BITMAPSIZE;

		var cache = this.bitmapCache.draw(ctx, { name: "Frametop", drawFn: this._drawFrameTop, color: color, w: w, h: h, permanent: true }, true);

		ctx.drawImage(cache.canvas, 0, 0, w * bs, fw * bs, x + dx, y + dy, w, fw);
		ctx.drawImage(cache.canvas, 0, (h - fw) * bs, w * bs, fw * bs, x + dx, y + dy + h - fw, w, fw);
		ctx.drawImage(cache.canvas, 0, fw * bs, fw * bs, (h - 2 * fw) * bs, x + dx, y + dy + fw, fw, h - 2 * fw);
		ctx.drawImage(cache.canvas, (w - fw) * bs, fw * bs, fw * bs, (h - 2 * fw) * bs, x + dx + w - fw, y + dy + fw, fw, h - 2 * fw);
	}

	drawFrame(ctx, x, y, dx, dy) {
		/*		tilt.drawFrameBottom(c.ctx, offsetX, offsetY, w, h, dx, dy);
		 tilt.drawFrameTop(c.ctx, offsetX, offsetY, w, h, dx, dy);
		 ctx.drawImage(c.canvas, x - offsetX, y - offsetY, cacheW / _bitmapSize, cacheH / _bitmapSize);*/
	}


	drawSelection(ctx, x, y) {
		var lineWidth = 0.05,
			lw = lineWidth / 2;

		ctx.strokeStyle = 'white';
		ctx.lineWidth = lineWidth;
		ctx.beginPath();
		ctx.rect(x + lw, y + lw, 1 - lineWidth, 1 - lineWidth);
		ctx.closePath();
		ctx.stroke();
	}
}

new Shapes(tilt);
