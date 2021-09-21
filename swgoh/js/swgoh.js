"use strict";

(function() {
	var _comparePixels = function(pixel1, pixel2) {
		return pixel1.r === pixel2.r &&
			pixel1.g === pixel2.g &&
			pixel2.b === pixel2.b &&
			pixel2.a === pixel2.a;
	};

	var _drawScrollbar = function(context, scrollbarArea, _) {
		var border = [ ],
			imageData = context.getImageData(scrollbarArea.left, scrollbarArea.top,
				scrollbarArea.width, scrollbarArea.height),
			innerScrollbarArea,
			i,
			inner = [ ],
			length,
			pixelData = imageData.data,
			topBottomScrollbarBorder,
			x = 0,
			y = 0,
			width = scrollbarArea.width,
			height = scrollbarArea.height;

		length = pixelData.length;
		for (i in _.topBottomScrollbarBorder) {
			if (_.topBottomScrollbarBorder[i].length === scrollbarArea.width) {
				topBottomScrollbarBorder = _.topBottomScrollbarBorder[i];
				break;
			}
		}
		for (i in _.innerScrollbarArea) {
			if (_.innerScrollbarArea[i].length === scrollbarArea.width) {
				innerScrollbarArea = _.innerScrollbarArea[i];
				break;
			}
		}

		for (i = 0; i < topBottomScrollbarBorder.length; i++) {
			border.push(window.parseColor(topBottomScrollbarBorder[i]));
		}
		for (i = 0; i < innerScrollbarArea.length; i++) {
			inner.push(window.parseColor(innerScrollbarArea[i]));
		}

		for (i = 0; i < length; i += 4) {
			var r = pixelData[i + 0],
				g = pixelData[i + 1],
				b = pixelData[i + 2],
				a = pixelData[i + 3];

			r = (y === 0 || y === height - 1) ? border[x].r : inner[x].r;
			g = (y === 0 || y === height - 1) ? border[x].g : inner[x].g;
			b = (y === 0 || y === height - 1) ? border[x].b : inner[x].b;
			a = 255;

			pixelData[i + 0] = r;
			pixelData[i + 1] = g;
			pixelData[i + 2] = b;
			pixelData[i + 3] = a;

			if (++x >= width) {
				x = 0;
				y++;
			}
		}
		context.putImageData(imageData, scrollbarArea.left, scrollbarArea.top);
	};

	if (!window.SWGOH) {
		window.SWGOH = {
			"getScreenshotFileName": function(screenshotDateOrFileName) {
				var zp = function(n) {
					return ((n < 10) ? "0" : "") + n;
				};

				if (!(screenshotDateOrFileName instanceof Date)) {
					screenshotDateOrFileName = window.SWGOH.getDateFromScreenshotFileName(screenshotDateOrFileName);
				}
				if (screenshotDateOrFileName) {
					return "Heroes " +
						screenshotDateOrFileName.getFullYear() + "-" +
						zp(screenshotDateOrFileName.getMonth() + 1) + "-" +
						zp(screenshotDateOrFileName.getDate()) + " " +
						zp(screenshotDateOrFileName.getHours()) + "." +
						zp(screenshotDateOrFileName.getMinutes()) + "." +
						zp(screenshotDateOrFileName.getSeconds()) +
						".png";
				}
			},
			"getDateFromScreenshotFileName": function(fileName) {
				var name, p;

				if (fileName && fileName.length) {
					try {
						if ((p = (name = fileName).lastIndexOf(".")) >= 0) {
							name = name.substr(0, p);
						}
						name = name.split("_").pop().replace(/[^\d]/g, "");
						if (name.length === 14) {
							return new Date(name.substr(0, 4),
								parseInt(name.substr(4, 2) - 1),
								name.substr(6, 2),
								name.substr(8, 2),
								name.substr(10, 2),
								name.substr(12, 2));
						}
					} catch (e) { }
				}
			}
		};
	}
	if (!window.SWGOH.characterBoardCreator) {
		window.SWGOH.characterBoardCreator = (function() {
			var _ = {
				get "characterArea"() {
					return {
						"960": {
							"left": 39,
							"top": 144,
							"width": 876,
							"height": 318
						},
						"1280": {
							"left": 50,
							"top": 200,
							"width": 1180,
							"height": 424
						},
						"1440": {
							"left": 32,
							"top": 200,
							"width": 1376,
							"height": 424
						}
					};
				},
				get "characterProgressBarBottomPadding"() { return 2; },
				get "characterProgressBarHeightFactor"() { return 30; },
				get "characterProgressBarThresholdG"() { return 0x70; },
				get "characterProgressBarThresholdR"() { return 0x50/*0x30*/; },
				get "characterProgressBarStartX"() {
					return {
						"960": 9,
						"1280": 14,
						"1440": 14
					};
				},
				get "characterStripHeight"() {
					return {
						"960": 128,
						"1280": 170,
						"1440": 170
					};
				},
				get "innerScrollbarArea"() {
					return {
						"960": [
							"#214858",
							"#214a5b",
							"#20495b",
							"#1f4758",
							"#1f5064",
							"#2f89db"
						],
						"1280": [
							"#1e4657",
							"#1f4a5c",
							"#1f485a",
							"#1f495b",
							"#1f495b",
							"#1e3e4e",
							"#21617e",
							"#348ff2"
						],
						"1440": [
							"#1e4657",
							"#1f4a5c",
							"#1f485a",
							"#1f495b",
							"#1f495b",
							"#1e3e4e",
							"#21617e",
							"#348ff2"
						]
					};
				},
				get "sameStripNameAreaEqualityThreshold"() { return 0.05; },
				get "scrollbarArea"() {
					return {
						"960": {
							"left": 930,
							"top": 144,
							"width": 6,
							"height": 318
						},
						"1280": {
							"left": 1240,
							"top": 192,
							"width": 8,
							"height": 424
						},
						"1440": {
							"left": 1400,
							"top": 192,
							"width": 8,
							"height": 424
						}
					};
				},
				get "scrollbarDetectColor"() {
					return {
						"960": { "r": 0x23, "g": 0xc8, "b": 0xf5 },
						"1280": { "r": 0x23, "g": 0xc8, "b": 0xf5 },
						"1440": { "r": 0x69, "g": 0xe0, "b": 0xfe }
					};
				},
				get "scrollbarDetectOffsetX"() {
					return {
						"960": 2,
						"1280": 2,
						"1440": 0
					};
				},
				get "scrollbarDetectOffsetY"() {
					return {
						"960": 2,
						"1280": 2,
						"1440": 8
					};
				},
				get "topBottomScrollbarBorder"() {
					return {
						"960": [
							"#2c85ca",
							"#2d8ad3",
							"#2d8bd4",
							"#2d8bd3",
							"#2d8bd7",
							"#318ee9"
						],
						"1280": [
							"#318ade",
							"#3290e9",
							"#3291ea",
							"#3291ea",
							"#3291ea",
							"#3290e9",
							"#3291ed",
							"#338de9"
						],
						"1440": [
							"#318ade",
							"#3290e9",
							"#3291ea",
							"#3291ea",
							"#3291ea",
							"#3290e9",
							"#3291ed",
							"#338de9"
						]
					};
				}
			};

			var _findCharacterProgressBarYs = function(image) {
				var characterArea = _.characterArea[image.width],
					height,
					i,
					pixel,
					pixels = window.HTMLCanvasElement
						.fromImage(image)
						.getPixels(characterArea.left + _.characterProgressBarStartX[image.width], 0, 1, image.height),
					progressBarHeight = image.height / _.characterProgressBarHeightFactor,
					ys = [ ];

				for (i = characterArea.top + _.characterStripHeight[image.width] - (progressBarHeight +
						_.characterProgressBarBottomPadding), height = image.height; i < height; i++) {

					if (i >= characterArea.top + characterArea.height - progressBarHeight) {
						break;
					}
					if ((pixel = pixels[i][0]).r <= _.characterProgressBarThresholdR &&
						pixel.g >= _.characterProgressBarThresholdG) {

						window.console.log(i);
						ys.push(i);
						i += 2 * progressBarHeight;
					}
				}
				return ys;
			};

			var _isSameCharacterStrip = function(strip1, strip2, characterProgressBarHeight) {
				var count = 0,
					pixels1,
					pixels2,
					row1,
					row2,
					top = strip1.height - 2 * (characterProgressBarHeight + _.characterProgressBarBottomPadding),
					total = strip1.width * characterProgressBarHeight;

				pixels1 = (strip1.getPixels) ?
					strip1.getPixels(0, top, strip1.width, characterProgressBarHeight) :
					window.HTMLCanvasElement
						.fromImage(strip1)
						.getPixels(0, top, strip1.width, characterProgressBarHeight);
				pixels2 = (strip2.getPixels) ?
					strip2.getPixels(0, top, strip2.width, characterProgressBarHeight) :
					window.HTMLCanvasElement
						.fromImage(strip2)
						.getPixels(0, top, strip2.width, characterProgressBarHeight);
				for (var j = 0; j < characterProgressBarHeight; j++) {
					row1 = pixels1[j];
					row2 = pixels2[j];
					for (var i = 0; i < strip1.width; i++) {
						if (_comparePixels(row1[i], row2[i])) {
							if (++count / total >= _.sameStripNameAreaEqualityThreshold) {
								return true;
							}
						}
					}
				}
				return false;
			};

			return {
				"createCharacterBoard": function(baseImage, strips, created) {
					var actualStrips = [ strips[0] ],
						characterArea = _.characterArea[baseImage.width],
						scrollbarArea = _.scrollbarArea[baseImage.width];

					for (var i = 1; i < strips.length; i++) {
						if (!_isSameCharacterStrip(actualStrips[actualStrips.length - 1], strips[i],
							baseImage.height / _.characterProgressBarHeightFactor)) {

							actualStrips.push(strips[i]);
						}
					}
					window.Image.stackImages(actualStrips, function(stackedStrips) {
						var bandHeight = characterArea.height / 3,
							bottomHeight = baseImage.height - (characterArea.top + 2 * _.characterStripHeight[baseImage.width]),
							canvas = document.createElement("canvas"),
							context = canvas.getContext("2d"),
							y;

						canvas.width = baseImage.width;
						canvas.height = baseImage.height + stackedStrips.height - characterArea.height;
						context.drawImage(baseImage, 0, 0);

						y = characterArea.top;

						while (y <= canvas.height - bottomHeight) {
							context.drawImage(baseImage, 0, characterArea.top, baseImage.width, bandHeight,
								0, y, baseImage.width, bandHeight);
							y += bandHeight;
						}
						context.drawImage(baseImage,
							0, baseImage.height - bottomHeight, baseImage.width, bottomHeight,
							0, canvas.height - bottomHeight, baseImage.width, bottomHeight);
						_drawScrollbar(context, {
							"left": scrollbarArea.left,
							"top": scrollbarArea.top,
							"width": scrollbarArea.width,
							"height": stackedStrips.height
						}, _);
						context.drawImage(stackedStrips, characterArea.left, characterArea.top);
						canvas.toBlob(function(blob) {
							var image;

							(image = new Image()).addEventListener("load", function(e) {
								created.call(this, this);
							});
							image.src = URL.createObjectURL(blob);
						});
					});
				},
				"getCharacterStrips": function(image, created) {
					var i = 0,
						characterArea = _.characterArea[image.width],
						characterStripHeight = _.characterStripHeight[image.width],
						next = function() {
							window.Image.getFragment.call(image, characterArea.left,
								ys[i] + (image.height / _.characterProgressBarHeightFactor) + _.characterProgressBarBottomPadding -
									characterStripHeight, characterArea.width, characterStripHeight,
								function() {
									strips.push(this);
									if (i < ys.length - 1) {
										i++;
										next();
									} else {
										created.call(strips, strips);
									}
								});
						},
						strips = [ ],
						ys = _findCharacterProgressBarYs(image);

					next();
				},
				"findScrollbar": function(image) {
					var scrollbarArea = _.scrollbarArea[image.width];

					var pixels = window.HTMLCanvasElement
						.fromImage(image)
						.getPixels((scrollbarArea.left + _.scrollbarDetectOffsetX[image.width]), 0, 1, image.height);

					var scrollbarDetectColor = _.scrollbarDetectColor[image.width];

					for (var i = 0, length = pixels.length; i < length; i++) {
						if (_comparePixels(pixels[i][0], scrollbarDetectColor)) {
							return i - (scrollbarArea.top + _.scrollbarDetectOffsetY[image.width]);
						}
					}
				}
			};
		})();
	}
	if (!window.SWGOH.statusScreenshotCreator) {
		window.SWGOH.statusScreenshotCreator = (function() {
			var _ = {
				get "detailsArea"() {
					return {
						"left": 396,
						"top": 96,
						"width": 516,
						"height": 342
					};
				},
				get "fullDetailsHeight"() { return 578; },
				get "innerScrollbarArea"() {
					return [
						"#1c4d6c",
						"#1c506f",
						"#1c4f6f",
						"#1c4e6d",
						"#1c5678",
						"#2e8be1"
					];
				},
				get "removeFrom2"() { return 100; },	/* Maximum value is 103 */
				get "scrollbarArea"() {
					return {
						"left": 918,
						"top": 96,
						"width": 6,
						"height": 342
					};
				},
				get "topBottomScrollbarBorder"() {
					return [
						"#2b86d1",
						"#2c8ad9",
						"#2c8cdb",
						"#2c8ad9",
						"#2c8adb",
						"#308de9"
					];
				},
				get "y2Offset"() { return 236; }
			};

			return {
				"createFullDetailsImage": function(image1, image2, created) {
					var canvas = document.createElement("canvas"),
						context = canvas.getContext("2d"),
						detailsCanvas = document.createElement("canvas"),
						detailsContext = detailsCanvas.getContext("2d"),
						image;

					detailsCanvas.width = _.detailsArea.width;
					detailsCanvas.height = _.fullDetailsHeight;
					detailsContext.drawImage(image1,
						_.detailsArea.left, _.detailsArea.top,
							_.detailsArea.width, _.detailsArea.height,
						0, 0,
							_.detailsArea.width, _.detailsArea.height);
					detailsContext.drawImage(image2,
						_.detailsArea.left, _.detailsArea.top + _.removeFrom2,
							_.detailsArea.width, _.detailsArea.height - _.removeFrom2,
						0, _.y2Offset + _.removeFrom2, _
							.detailsArea.width, _.detailsArea.height - _.removeFrom2);

					canvas.width = Math.max(image1.width, image2.width);
					canvas.height = Math.max(image1.height, image2.height);
					context.drawImage(image1, 0, 0);
					context.drawImage(detailsCanvas, _.detailsArea.left, _.detailsArea.top,
						_.detailsArea.width, _.detailsArea.height);
					_drawScrollbar(context, _.scrollbarArea, _);
					(image = new Image()).addEventListener("load", function(e) {
						created.call(this, this);
					});
					image.src = canvas.toDataURL();
				}
			};
		})();
	}
})();
