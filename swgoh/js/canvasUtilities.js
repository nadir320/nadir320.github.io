"use strict";

(function() {
	if (!window.HTMLCanvasElement.fromImage) {
		window.HTMLCanvasElement.fromImage = function(image) {
			var canvas = document.createElement("canvas"),
				context = canvas.getContext("2d");

			canvas.width = image.width;
			canvas.height = image.height;
			context.drawImage(image, 0, 0);
			return context;
		}
	}

	var canvasPrototype = window.HTMLCanvasElement.prototype;

	if (!canvasPrototype.clear) {
		canvasPrototype.clear = function() {
			this.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
		};
	}
	if (!canvasPrototype.getImage) {
		canvasPrototype.getImage = function(created) {
			var image;

			(image = new Image()).addEventListener("load", function(e) {
				created.call(this, this);
			});
			if (this.toBlob) {
				this.toBlob(function(blob) {
					image.src = URL.createObjectURL(blob);
				});
			} else {
				image.src = this.toDataURL();
			}
		};
	}

	var contextPrototype = window.CanvasRenderingContext2D.prototype;

	var _getPixel = function(pixelData, i) {
		i = i || 0;
		return {
				"r": pixelData[i + 0],
				"g": pixelData[i + 1],
				"b": pixelData[i + 2],
				"a": pixelData[i + 3]
		};
	};

	var _setPixel = function(pixelData, i, color) {
		pixelData[i + 0] = color.r || 0;
		pixelData[i + 1] = color.g || 0;
		pixelData[i + 2] = color.b || 0;
		pixelData[i + 3] = (color.a !== undefined) ? color.a : 255;
	};

	if (!contextPrototype.floodFill) {
		contextPrototype.floodFill = function(x, y, color, tolerance, width, height) {
			var bytesWidth, comparePixel, compareAndSetPixel, count, east, fillColor, i, j, height,
				imageData, maximumEast, minimumWest, length, pixelData, queue, targetColor, west, width;

			count = 0;
			fillColor = {
				"a": (color.a === undefined) ? 255 : color.a || 0,
				"r": color.r || 0,
				"g": color.g || 0,
				"b": color.b || 0
			};
			tolerance = tolerance || 0;

			comparePixel = function(index) {
				var pixel;

				if (index >= 0 && index < length) {
					if ((pixel = _getPixel(pixelData, index)).a === 0) {
						return true;
					}
					if (targetColor.a === fillColor.a &&
						targetColor.r === fillColor.r &&
						targetColor.g === fillColor.g &&
						targetColor.b === fillColor.b) {

						return false;
					}
					if (targetColor.a === pixel.a &&
						targetColor.r === pixel.r &&
						targetColor.g === pixel.g &&
						targetColor.b === pixel.b) {

						return true;
					}
					if (tolerance &&
						Math.abs(targetColor.a - pixel.a) <= tolerance &&
						Math.abs(targetColor.r - pixel.r) <= tolerance &&
						Math.abs(targetColor.g - pixel.g) <= tolerance &&
						Math.abs(targetColor.b - pixel.b) <= tolerance) {

						return true;
					}
				}
				return false;
			};

			compareAndSetPixel = function(index) {
				if (comparePixel(index)) {
					_setPixel(pixelData, index, fillColor);
					count++;
					return true;
				}
				return false;
			};

			length = (pixelData = (imageData = this.getImageData(0, 0,
				width = width || this.canvas.clientWidth,
				height = height || this.canvas.clientHeight)).data).length;
			bytesWidth = 4 * width;
			queue = [ i = 4 * (width * y + x) ];
			targetColor = _getPixel(pixelData, i);

			if (comparePixel(i)) {
				while (queue.length) {
					if (compareAndSetPixel(i = queue.pop())) {
						east = west = i;
						maximumEast = (minimumWest = parseInt(i / bytesWidth) * bytesWidth) + bytesWidth;
						while ((west -= 4) > minimumWest && compareAndSetPixel(west)) { }
						while ((east += 4) < maximumEast && compareAndSetPixel(east)) { }
						for (j = west + 4; j < east; j += 4) {
							if (j - bytesWidth >= 0 && comparePixel(j - bytesWidth)) {
								queue.push(j - bytesWidth);
							}
							if (j + bytesWidth < length && comparePixel(j + bytesWidth)) {
								queue.push(j + bytesWidth);
							}
						}
					}
				}
				this.putImageData(imageData, 0, 0);
			}
			return count;
		};
	}
	if (!contextPrototype.getPixel) {
		contextPrototype.getPixel = function(x, y) {
			var imageData = this.getImageData(x, y, 1, 1),
				pixelData = imageData.data;

			return _getPixel(pixelData);
		};
	}
	if (!contextPrototype.getPixels) {
		contextPrototype.getPixels = function(x, y, width, height) {
			var i,
				imageData = this.getImageData(x || 0, y || 0, width || 0, height || 0),
				j,
				pixelData = imageData.data,
				pixels = new Array(height),
				row,
				rowOffset = 4 * width;

			for (j = 0; j < height; j++) {
					row = new Array(width);
					for (i = 0; i < width; i++) {
						row[i] = _getPixel(pixelData, rowOffset * j + 4 * i);
					}
					pixels[j] = row;
			}
			return pixels;
		};
	}
	if (!contextPrototype.setPixel) {
		contextPrototype.setPixel = function(x, y, color) {
			var imageData = this.getImageData(x, y, 1, 1),
				pixelData = imageData.data;

			_setPixel(pixelData, 0, color);
			this.putImageData(imageData, x, y);
		};
	}
	if (!contextPrototype.setPixels) {
		contextPrototype.setPixels = function(pixels, x, y) {
			var height = pixels.length,
				i,
				imageData,
				j,
				pixelData,
				row,
				rowOffset,
				width = 0;

			for (j = 0; j < height; j++) {
				width = Math.max(width, pixels[j].length);
			}
			imageData = this.getImageData(x = x || 0, y = y || 0, width, pixels.length);
			pixelData = imageData.data;
			rowOffset = 4 * width;

			for (j = 0; j < height; j++) {
				width = (row = pixels[j]).length;
				for (i = 0; i < width; i++) {
					_setPixel(pixelData, rowOffset * j + 4 * i, row[i]);
				}
			}
			this.putImageData(imageData, x, y);
		};
	}

	if (!window.Image.createFromPixels) {
		window.Image.createFromPixels = function(pixels, created) {
			var canvas,
				height,
				i,
				image,
				width = 0;

			(canvas = document.createElement("canvas")).height = height = pixels.length;
			for (i = 0; i < height; i++) {
				width = Math.max(width, pixels[i].length);
			}
			canvas.width = width;
			canvas.getContext("2d").setPixels(pixels);
			canvas.getImage(created);
		};
	}
	if (!window.Image.getFragment) {
		window.Image.getFragment = function(x, y, width, height, created) {
			var canvas,
				context;

			context = (canvas = document.createElement("canvas")).getContext("2d");
			canvas.width = width;
			canvas.height = height;
			context.drawImage(this, -x, -y);
			canvas.getImage(created);
		};
	}
	if (!window.Image.getPixels) {
		window.Image.getPixels = function(x, y, width, height) {
			return window.HTMLCanvasElement.fromImage(this)
				.getPixels(x || 0, y || 0, width || this.width, height || this.height);
		};
	}
	if (!window.Image.stackImagePixels) {
		window.Image.stackImagePixels = function(images, created) {
			var pixels = [ ];

			images.map(function(image) {
				pixels = pixels.concat(window.HTMLCanvasElement
					.fromImage(image)
					.getPixels(0, 0, image.width, image.height));
			});
			return window.Image.createFromPixels(pixels, created);
		};
	}
	if (!window.Image.stackImages) {
		window.Image.stackImages = function(images, created) {
			var canvas,
				context,
				width = 0,
				height = 0,
				y = 0;

			images.map(function(image) {
				width = Math.max(width, image.width);
				height += image.height;
			});
			context = (canvas = document.createElement("canvas")).getContext("2d");
			canvas.width = width;
			canvas.height = height;
			images.map(function(image) {
				context.drawImage(image, 0, y);
				y += image.height;
			});
			canvas.getImage(created);
		};
	}
})();
