"use strict";

(function() {
	var _bindClicks = function(elements, callback) {
		Array.from((typeof elements.length !== "undefined") ? elements : [ elements ]).forEach(function(item) {
			item.addEventListener("click", callback);
		});
	};

	var _bindClickByClassName = function(parent, className, callback) {
		_bindClicks(parent.querySelectorAll("." + className), callback);
	};

	var _bindClickByTagName = function(parent, tagName, callback) {
		_bindClicks(parent.getElementsByTagName(tagName), callback);
	};

	var _max = function(values) {
		var value = undefined, x;

		for (var i = 0, l = values.length; i < l; i++) {
			x = values[i];
			if (value === undefined) {
				value = x;
			} else {
				value = Math.max(value, x);
			}
		}
		return value;
	};

	var _min = function(values) {
		var value = undefined, x;

		for (var i = 0, l = values.length; i < l; i++) {
			x = values[i];
			if (value === undefined) {
				value = x;
			} else {
				value = Math.min(value, x);
			}
		}
		return value;
	};

	var _params = function(url) {
		var i = url.indexOf("?"),
			params = { },
			values;

		if (i >= 0) {
			url = url.substr(i + 1);
			i = url.indexOf("#");
			if (i >= 0) {
				url = url.substr(0, i);
			}
			url.split("&").forEach(function(param) {
				var j = param.indexOf("=");

				params[param.substr(0, j)] = window.decodeURIComponent(param.substr(j + 1));
			});
		}
		return params;
	};

	var _setStyle = function(css, id) {
		var cssElement;

		if (id && (cssElement = document.getElementById(id))) {
			cssElement.innerText = css;
		} else {
			cssElement = document.createElement("style");
			cssElement.setAttribute("type", "text/css");
			cssElement.innerText = css;
			document.querySelector("head").appendChild(cssElement);
		}
	};

	var _singletonInvoke = function(f, callback) {
		if (f.completed) {
			callback();
		} else if (f.executing) {
			f.callbacks.push(callback);
		} else {
			f.callbacks = [ callback ];
			f.executing = true;
			f(function() {
				f.completed = true;
				f.executing = false;
				for (var i in f.callbacks) {
					f.callbacks[i]();
				}
			});
		}
	};

	var _debug = !!window.location.search.match(/debug/i);

	var Game;

	(function() {
		var constants = {
				get depth() { return 6; },
				get padding() { return 8; }
			},
			faces,
			getDragonMap = function() {
				var dragonMap = [ ];

				var f = function(x, y, z, w, h) { dragonMap.push({ x: x || 0, y: y || 0, z: z || 0, w: w || 1, h: h || 1 }); };

				for (var i =   1; i <=  12; i++) f(i -  0, 0);												// First row, 12 tiles
				for (var i =  13; i <=  20; i++) f(i - 10, 1);												// Second row, 8 tiles
				for (var i =  21; i <=  30; i++) f(i - 19, 2);												// Third row, 10 tiles
				f(0, 3.5);																					// First tile on the left (the head)
				for (var i =  32; i <=  43; i++) f(i - 31, 3);												// Fourth row, 12 tiles
				for (var i =  44; i <=  55; i++) f(i - 43, 4);												// Fifth row, 12 tiles
				f(13, 3.5);																					// First tile on the right (the tail)
				f(14, 3.5);																					// Last tile on the right (the tip of the tail)
				for (var i =  58; i <=  67; i++) f(i - 56, 5);												// Sixth row, 10 tiles
				for (var i =  68; i <=  75; i++) f(i - 65, 6);												// Seventh row, 8 tiles
				for (var i =  76; i <=  87; i++) f(i - 75, 7);												// Eighth row, 12 tiles
				for (var i =  88; i <= 123; i++) f(4 + (i -  88) % 6, 1 + Math.floor((i -  88) / 6), 1);	// Second floor, 36 tiles
				for (var i = 124; i <= 139; i++) f(5 + (i - 124) % 4, 2 + Math.floor((i - 124) / 4), 2);	// Third floor, 16 tiles
				for (var i = 140; i <= 143; i++) f(6 + (i - 140) % 2, 3 + Math.floor((i - 140) / 2), 3);	// Fourth floor, 4 tiles
				f(6.5, 3.5, 4);																				// The top tile

				return dragonMap;
			},
			getShadow = function(width, height) {
				var canvas = document.createElement("canvas"),
					gradient,
					w = width + constants.depth,
					h = height + constants.depth;

				canvas.setAttribute("width", w);
				canvas.setAttribute("height", h);

				var context = canvas.getContext("2d");

				context.fillStyle = "";

				gradient = context.createLinearGradient(0, height, 0, h);
				gradient.addColorStop(0, "rgba(0, 0, 0, 0.25)");
				gradient.addColorStop(1, "rgba(0, 0, 0, 0.75)");
				context.fillStyle = gradient;

				context.beginPath();
				context.moveTo(0, height);
				context.lineTo(constants.depth, h);
				context.lineTo(w, h);
				context.lineTo(width, height);
				context.closePath();
				context.fill();

				gradient = context.createLinearGradient(width, 0, w, 0);
				gradient.addColorStop(0, "rgba(0, 0, 0, 0.25)");
				gradient.addColorStop(1, "rgba(0, 0, 0, 0.75)");
				context.fillStyle = gradient;

				context.beginPath();
				context.moveTo(width, 0);
				context.lineTo(width, height);
				context.lineTo(w, h);
				context.lineTo(w, constants.depth);
				context.closePath();
				context.fill();

				return canvas.toDataURL();
			},
			init = function(callback) {
				_singletonInvoke(initEngine, callback);
			},
			initEngine = function(callback) {
				var palette = new Image();

				palette.onload = function() {
					var imageWidth = this.width / 9,
						imageHeight = this.height / 5,
						shadowData;

					Object.defineProperty(constants, "width", { get: function() { return imageWidth; } });
					Object.defineProperty(constants, "height", { get: function() { return imageHeight; } });

					var rules,
						c, i, j, k, n, p, w, x = 0, y = 0;

					rules = [ ".face { background-image: url(\"" + this.src + "\") !important; " +
								"width: " + constants.width + "px; height: " + constants.height + "px; }",
							".tile { width: " + (constants.width + constants.depth) + "px; " +
								"height: " + (constants.height + constants.depth) + "px; " +
								"background-image: url(" + getShadow(constants.width, constants.height) + "); " +
								"background-repeat: no-repeat; " +
								"clip-path: polygon(" + constants.width + "px 0, 100% " + constants.depth + "px, 100% 100%" +
									", " + constants.depth + "px 100%, 0 " + constants.height + "px, 0 0); }" ];

					faces = [ ];
					for (i = 0; i < 5; i++) {
						c = (i === 3) ? 8 : (i === 4) ? 7 : 9;

						for (j = 0; j < c; j++) {
							rules.push(".t" + x + "{ background-position: -" +
								(constants.width * j) + "px -" + (constants.height * i) + "px }");

							n = (i > 2 && j < 4) ? 1 : 4;

							if (n !== 1 || p !== n) {
								y++;
							}
							for (k = 0; k < n; k++) {
								faces.push({
									background: {
										x: -(constants.width * j),
										y: -(constants.height * i)
									},
									face: x,
									index: faces.length,
									type: y
								});
							}
							x++;
							p = n;
						}
					}

					_setStyle(rules.join("\n"));
					callback();
				}

				var thisScript = Array.prototype.slice.call(window.document.getElementsByTagName("script")).pop(),
					src = thisScript.getAttribute("palette") || _params(thisScript.getAttribute("src")).palette;

				palette.src = src;
			},
			loadFaces = function(map) {
				var x1 = _min(map.map(function(item) { return item.x; })),
					x2 = _max(map.map(function(item) { return item.x + item.w; })),
					y1 = _min(map.map(function(item) { return item.y; })),
					y2 = _max(map.map(function(item) { return item.y + item.h; })),
					mW = _max(map.map(function(item) { return item.w; })),
					mH = _max(map.map(function(item) { return item.h; })),
					w = x2 - x1,
					h = y2 - y1;

				w *= constants.width;
				w += constants.depth;
				w += 2 * constants.padding;

				map.width = w;

				h *= constants.height;
				h += constants.depth;
				h += 2 * constants.padding;

				map.height = h;

				var styles = [
					".wrapper { max-width: " + w + "px; max-height:" + h + "px; }",
					".board { width: " + w + "px; height: " + h + "px; }"
				];

				(function() {
					var faceRules, rules;

					for (var i = 1; i <= mW; i++) {
						for (var j = 1; j <= mH; j++) {
							if (i !== 1 || j !== 1) {
								rules = [];

								rules.push("background-image: url(\"" + getShadow(constants.width * i, constants.height * j) + "\")");
								rules.push("width: " + (i * constants.width + constants.depth) + "px");
								rules.push("height: " + (j * constants.height + constants.depth) + "px");
								rules.push("clip-path: polygon(" + (i * constants.width) + "px 0, 100% " + constants.depth + "px, 100% 100%, " +
									constants.depth + "px 100%, 0 " + (j * constants.height) + "px, 0 0)");
								styles.push(".tile.w-" + i + ".h-" + j + " { " + rules.join("; ") + " }");

								faceRules = [];

								faceRules.push("background-size: " + (constants.width * 9 * i) + "px " + (constants.height * 5 * j) + "px");
								faceRules.push("width: " + (i * constants.width) + "px");
								faceRules.push("height: " + (j * constants.height) + "px");

								styles.push(".tile.w-" + i + ".h-" + j + " .face { " + faceRules.join("; ") + " }");
							}
						}
					}
				})();

				_setStyle(styles.join("\n"), "map-style");

				var index, faceSet = faces.slice();

				map.forEach(function(tile, i) {
					tile.index = i;

					var index = Math.floor(Math.random() * faceSet.length),
						face = faceSet[index];

					tile.background = face.background;
					tile.face = face.face;
					tile.type = face.type;
					faceSet.splice(index, 1);
				});
			},
			zOverlap = function(box1, box2) {
				return box1 !== box2 &&
					box1.y + box1.h > box2.y && box1.y < box2.y + box2.h
					&&
					box1.x + box1.w > box2.x && box1.x < box2.x + box2.w
					//box1.x === box2.x && box1.y === box2.y
					;
			};

		Game = function(board, ready) {
			var availableMoves = 0,
				end,
				hintIndex,
				hints = [ ],
				history = [ ],
				start,
				tileSet;

			var getMatchingTiles = function(tile, freeOnly) {
				var type = tile.dataset.type;

				return Array.from(board.getElementsByClassName("tile")).filter(function(item, i) {
					return item !== tile && item.dataset.type === type &&
						(!freeOnly || item.classList.contains("free"));
				});
			};

			var getTileBox = function(tile) {
				return {
					x: parseFloat(tile.dataset.x),
					y: parseFloat(tile.dataset.y),
					z: parseFloat(tile.dataset.z),
					w: parseFloat(tile.dataset.w),
					h: parseFloat(tile.dataset.h)
				};
			};

			var checkStatus = function() {
				var hasMoves;

				availableMoves = 0;
				(function() {
					var tileStatus = Array.from(board.getElementsByClassName("tile")).map(function(tile, i) {
						var status = getTileBox(tile);

						status.index = parseInt(tile.dataset.index);
						status.visible = !tile.classList.contains("hidden");
						return status;
					});

					var isTileVisible = function(index) {
						return tileStatus[tileSet.findIndex(function(item) { return item.index === index; })].visible;
					};

					var freeTiles = tileStatus.filter(function(tile) {
						var row = tileSet.filter(function(item) {
							return item.z === tile.z &&
								item.y + item.h > tile.y &&
								item.y < tile.y + tile.h &&
								isTileVisible(item.index);
							});

						if (row.length &&
							row.filter(function(item) { return item.x + item.w === tile.x }).length &&
							row.filter(function(item) { return item.x === tile.x + tile.w }).length) {

							return false;
						}

						if (tileSet.findIndex(function(item) {
							return item.z === tile.z + 1 &&
								zOverlap(item, tile) &&
								isTileVisible(item.index);
						}) >= 0) {
							return false;
						}

						return true;
					});

					Array.from(board.getElementsByClassName("tile")).forEach(function(tile, i) {
						tile.classList[(freeTiles.findIndex(function(item) {
							return item.visible && item.index === parseInt(tile.dataset.index);
						}) >= 0) ? "add" : "remove"]("free");

						if (tile.classList.contains("sandwich")) {
							var box,
								f,
								g,
								nonOverlapping,
								overlapping,
								visibleMatches,
								type;

							if (!tile.classList.contains("hidden")) {
								box = getTileBox(tile);
								overlapping = [ ];
								nonOverlapping = [ ];

								getMatchingTiles(tile).forEach(function(item) {
									if (!item.classList.contains("hidden")) {
										((zOverlap(box, getTileBox(item))) ? overlapping : nonOverlapping).push(item);
									}
								});
								if (overlapping.length > 1) {
									f = true;
								} else if (nonOverlapping.length === 0) {
									f = true;
								}
								type = parseInt(tile.dataset.type);
								g = history.findIndex(function(item) {
									return parseInt(item[0].dataset.type) === type;
								}) >= 0;
							}
							tile.classList[(f) ? "add": "remove"]("f");
							tile.classList[(g && !f) ? "add": "remove"]("g");
						}
					});
				})();

				(function() {
					var newHints = [ ],
						keys = [ ];

					if (!end) {
						Array.from(board.getElementsByClassName("free")).forEach(function(tile, i) {
							var isNew = true,
								j,
								match,
								matches = getMatchingTiles(tile, true),
								length = matches.length;

							if (length) {
								matches.push(tile);
								hasMoves = true;

								for (j = 0; i < length, match = matches[j]; j++) {
									if (keys[match.dataset.index]) {
										isNew = false;
										break;
									}
								}
								if (isNew) {
									matches.forEach(function(item, k) {
										keys[item.dataset.index] = true;
									});
									newHints.push(matches);
									availableMoves += length;
								}
							}
						});
						newHints.sort(function(a, b) {
							var n = function(i) {
								var box = getTileBox(i[0]);

								return i.length * 1e9 + box.z * 1e6 + box.y * 1e3 + box.x;
							}, x = n(a), y = n(b);

							return (x < y) ? 1 : (x > y) ? -1 : 0;
						});
					}
					hints = newHints;
				})();

				board.dispatchEvent(new Event("game.changed"));
				if (board.getElementsByClassName("tile").length === board.getElementsByClassName("hidden").length) {
					if (!end) {
						end = Date.now();
						board.dispatchEvent(new Event("game.won"));
					}
				} else if (
						(board.querySelector(".tile.sandwich.f"))
						||
						(!hasMoves && !(!history.length && board.getElementsByClassName("tile").length < tileSet.length))
					) {

					if (!end) {
						end = Date.now();
						board.dispatchEvent(new Event("game.lost"));
					}
				}
			};

			init(function() {
				loadFaces(tileSet = getDragonMap());

				Array.from(board.childNodes).forEach(function(node) {
					node.parentElement.removeChild(node);
				});

				(function() {
					var z = 0;

					tileSet.forEach(function(item) {
						var tile = document.createElement("div");

						tile.classList.add("tile");
						tile.classList.add("fade");
						if (item.w !== 1 || item.h !== 1) {
							tile.classList.add("w-" + item.w);
							tile.classList.add("h-" + item.h);
						}

						tile.style.left = (item.x * constants.width - item.z * constants.depth + constants.padding) + "px";
						tile.style.top = (item.y * constants.height - item.z * constants.depth + constants.padding) + "px";
						tile.style.zIndex = z++;

						tile.dataset.index = item.index;
						tile.dataset.type = item.type;
						tile.dataset.x = item.x;
						tile.dataset.y = item.y;
						tile.dataset.z = item.z;
						tile.dataset.w = item.w;
						tile.dataset.h = item.h;

						tile.addEventListener("click", function(e) {
							(function(tile) {
								var clearHints = true,
									clicked = Array.from(board.getElementsByClassName("clicked")),
									hintElements = Array.from(board.getElementsByClassName("hint")),
									isLast,
									matching = Array.from(board.getElementsByClassName("matching"));

								if (tile.classList.contains("free") || end) {
									matching.forEach(function(match, i) {
										match.classList.remove("matching");
									});
									if (clicked.length === 1 && clicked[0] !== tile &&
										clicked[0].dataset.type === tile.dataset.type) {

										clicked[0].classList.add("hidden");
										tile.classList.add("hidden");
										clicked[0].classList.remove("clicked");
										tile.classList.remove("clicked");
										history.push([ clicked[0], tile ]);
										if (!start) {
											start = Date.now();
										}
										checkStatus();
									} else if (end) {
										tile.classList.add("hidden");
										tile.classList.remove("clicked");
										history.push([ tile ]);
										checkStatus();
									} else {
										clicked.forEach(function(item, i) {
											if (item !== tile) {
												item.classList.remove("clicked");
											}
										});
										tile.classList.toggle("clicked");
										if (tile.classList.contains("clicked")) {
											clearHints = !tile.classList.contains("hint");
											if (isLast = Array.from(board.getElementsByClassName("hidden"))
												.filter(function(item, i) {
													return item.dataset.type === tile.dataset.type;
												}).length) {
												tile.classList.add("last");
											}
											getMatchingTiles(tile).forEach(function(match, i) {
												match.classList.add("matching");
												if (isLast) {
													match.classList.add("last");
												}
											});
										}
									}
									if (clearHints) {
										hintIndex = undefined;
										hintElements.forEach(function(item, i) {
											item.classList.remove("hint");
										});
									}
								}
							})(this);
						});

						var face = document.createElement("div");

						face.classList.add("face");
						face.classList.add("t" + item.face);
						if (item.w !== 1 || item.h !== 1) {
							face.style.backgroundPosition = (item.background.x * item.w) + "px " + (item.background.y * item.h) + "px";
						}
						if (_debug) {
							var info = document.createElement("span");

							info.style.color = "red";
							info.style.fontSize = "7pt";
							info.style.fontWeight = "bold";
							info.style.pointerEvents = "none";
							info.innerText = [item.index, item.x, item.y, item.z].join(", ");
							face.appendChild(info);
						}
						tile.appendChild(face);
						board.appendChild(tile);
						item.tile = tile;
					});
					(function() {
						tileSet.forEach(function(item) {
							getMatchingTiles(item.tile).filter(function(tile) {
								return zOverlap(getTileBox(tile), item);
							}).forEach(function(tile) {
								tile.classList.add("sandwich");
							});
						});
					})();
					checkStatus();
				})();
				if (ready) {
					ready();
				}
			});

			return {
				get availableMoves() { return availableMoves; },
				board: {
					get width() { return (tileSet) ? tileSet.width : 0 },
					get height() { return (tileSet) ? tileSet.height : 0 }
				},
				get constants() { return constants; },
				get end() { return end; },
				get hints() { return hints },
				get history() { return history; },
				nextHint: function() {
					var index;

					Array.from(board.getElementsByClassName("hint")).forEach(function(hintElement, i) {
						hintElement.classList.remove("hint");
					});
					if (typeof hintIndex !== "undefined" && hintIndex === hints.length - 1) {
						hintIndex = undefined;
					}
					if (hints.length) {
						index = (typeof hintIndex !== "undefined") ? hintIndex + 1 : 0;
						hints[index].forEach(function(hintElement, i) {
							hintElement.classList.add("hint");
						});
						hintIndex = index;
					}
				},
				get start() { return start; },
				undo: function(all) {
					Array.from(board.querySelectorAll(".clicked, .matching, .last")).forEach(function(item, i) {
						item.classList.remove("clicked");
						item.classList.remove("matching");
						item.classList.remove("last");
					});
					if (end && (all || this.history[this.history.length - 1].length > 1)) {
						end = undefined;
					}
					((all) ? this.history : [ this.history.pop() ]).forEach(function(entry, i) {
						entry.forEach(function(item, j) {
							item.classList.remove("hidden");
						});
					});
					if (all && this.history.length) {
						this.history.splice(0, this.history.length);
					}
					checkStatus();
				},
				get visibleTiles() {
					return board.querySelectorAll(".tile:not(.hidden)").length;
				}
			};
		};
	})();

	(function() {
		var board = document.querySelector(".board"),
			message = document.getElementById("message"),
			scaler = document.querySelector(".scaler"),
			status = document.querySelector(".status");

		(function() {
			if (typeof window.ShadowRoot === "undefined") {
				message.classList.add("compatible");
			}
		})();

		var game, resizer;

		var askNewGame = function() {
			if (message.classList.contains("hidden")) {
				if (game.history.length) {
					showMessage(document.getElementById("askNewMessage").value);
				} else {
					newGame();
				}
			} else {
				hideMessage();
				newGame();
			}
		};

		var askRestart = function() {
			showMessage(document.getElementById("restartMessage").value);
		};

		var checkGame = function() {
			if (refreshTime) {
				refreshTime();
			}
			if (game) {
				Array.from(document.querySelectorAll(".undo, .restart")).forEach(function(item, i) {
					if (game.history.length) {
						item.removeAttribute("disabled");
					} else {
						item.setAttribute("disabled", "disabled");
					}
				});
				Array.from(document.getElementsByClassName("hint")).forEach(function(item, i) {
					if (game.end) {
						item.setAttribute("disabled", "disabled");
					} else {
						item.removeAttribute("disabled");
					}
				});
			}

			document.getElementById("tiles").innerText = (game) ? game.visibleTiles.toLocaleString() : "";
			document.getElementById("availableMoves").innerText = (game) ? game.availableMoves.toLocaleString() : "";
		};

		var hideMessage = function() {
			message.classList.add("hidden");
			document.getElementById("messageBackdrop").classList.add("hidden");
		};

		var newGame = function() {
			game = new Game(board, function() {
				resizer();
				checkGame();
			});
		};

		var nextHint = function() {
			game.nextHint();
		};

		var refreshTime = function() {
			var elapsed = 0,
				temp,
				text = "";

			if (game && game.start) {
				elapsed = (game.end || Date.now()) - game.start;
			}
			elapsed = Math.floor(elapsed / 1e3);
			if (elapsed >= 3600) {
				text = Math.floor(elapsed / 3600) + ":"
				elapsed %= 3600;
			}
			temp = Math.floor(elapsed / 60);
			elapsed %= 60;
			if (text.length && temp < 10) {
				temp = "0" + temp;
			}
			text += temp + ":";
			if (elapsed < 10) {
				elapsed = "0" + elapsed;
			}
			document.getElementById("time").innerText = text + elapsed;
		};

		var restart = function() {
			undo(true);
		};

		var showMessage = function(messageText, type) {
			document.getElementById("messageText").innerText = messageText;
			document.getElementById("messageBackdrop").classList.remove("hidden");
			message.classList.remove("hidden");
		};

		var undo = function(all) {
			game.undo(all);
			checkGame();
		};

		(function() {
			board.addEventListener("game.changed", checkGame);
			board.addEventListener("game.won", function() { showMessage(document.getElementById("wonMessage").value); });
			board.addEventListener("game.lost", function() { showMessage(document.getElementById("lostMessage").value); });

			_bindClickByClassName(status, "newGame", askNewGame);
			_bindClickByClassName(status, "hint", nextHint);
			_bindClickByClassName(status, "restart", askRestart);
			_bindClickByClassName(status, "undo", function() { undo(); });

			document.getElementById("messageBackdrop").addEventListener("click", function(e) {
				hideMessage();
			});
			_bindClickByTagName(message, "button", hideMessage);
			_bindClickByClassName(message, "newGame", newGame);
			_bindClickByClassName(message, "restart", restart);
		})();

		document.addEventListener("keydown", function(e) {
			switch (e.which) {
				case 27:				/* Escape */
					hideMessage();
					break;
				case 68:				/* D */
					showMessage(new Date().toLocaleString());
					break;
				case 72: 				/* H */
					nextHint();
					break;
				case 90:				/* Z */
					if (e.ctrlKey) {
						undo();
					}
					break;
				case 113:				/* F2 */
					askNewGame();
					break;
				case 221:				/* ^ */
					if (e.ctrlKey) {
						undo(true);
					}
					break;
				default:
					/* console.info(e.which); */
					break;
			}
		});

		window.addEventListener("resize", resizer = function() {
			if (game) {
				var x = (window.innerWidth - 2 * game.constants.padding) / game.board.width,
					y = (window.innerHeight - 2 * game.constants.padding) / game.board.height,
					z = 1;

				if (board.clientHeight) {
					if (x < 1 || y < 1) {
						z = Math.min(x, y);
					}

					scaler.style["-ms-transform"] =
						scaler.style["-moz-transform"] =
						scaler.style["-o-transform"] =
						scaler.style["-webkit-transform"] =
						scaler.style.transform = (z < 1) ?
							"scale(" + z + ")" : "";
				}
			}
		});
		resizer();

		window.setInterval(refreshTime, 100);

		newGame();
	})();
})();
