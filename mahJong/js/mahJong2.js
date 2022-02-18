"use strict";

(function() {
	var _thisScript = Array.prototype.slice.call(window.document.getElementsByTagName("script")).pop();

	(function() {
		if (!Array.prototype.findIndex) {
			Array.prototype.findIndex = function(predicate) {
				var t = this;

				for (var i = 0, length = this.length; i < length; i++) {
					if (predicate.call(t, this[i], i)) {
						return i;
					}
				}
				return -1;
			};
		}

		if (!Array.from) {
			Array.from = function(arrayLike) {
				var a = [ ];

				for (var i = 0, length = arrayLike.length; i < length; i++) {
					a.push(arrayLike[i]);
				}
				return a;
			};
		}
	})();

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

	var _clone = function(o) {
		var clone = { };

		Object.keys(o).forEach(function(name) {
			clone[name] = o[name];
		});
		return clone;
	};

	var _hide = function(element) {
		element.classList.add("hidden");
	};

	var _isVisible = function(element) {
		return !element.classList.contains("hidden");
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

	var _param = function(name) {
		return Object.keys(_params()).findIndex(function(key) {
			return key.toLowerCase() === name.toLowerCase();
		}) >= 0;
	};

	var _params = function(url) {
		var i = (url = url || window.location.href).indexOf("?"),
			params = { },
			values;

		if (i >= 0) {
			url = url.substr(i + 1);
			i = url.indexOf("#");
			if (i >= 0) {
				url = url.substr(0, i);
			}
			url.split("&").forEach(function(param) {
				var j = param.indexOf("="),
					name = param.substr(0, j),
					value = param.substr(j + 1);

				params[name || value] = (name) ? window.decodeURIComponent(value) : undefined;
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
			if (id) {
				cssElement.setAttribute("id", id);
			}
			cssElement.innerText = css;
			document.querySelector("head").appendChild(cssElement);
		}
	};

	var _show = function(element) {
		element.classList.remove("hidden");
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
				for (var i = 0, length = f.callbacks.length; i < length; i++) {
					f.callbacks[i]();
				}
			});
		}
	};

	var _debug = _param("debug");

	var Game;

	(function() {
		var constants = {
				get depth() { return 6; },
				get padding() { return 8; }
			},
			faces,
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
						clipPath = "polygon(" + constants.width + "px 0, 100% " + constants.depth + "px, 100% 100%" +
							", " + constants.depth + "px 100%, 0 " + constants.height + "px, 0 0)",
						c, i, j, k, n, p, w, x = 0, y = 0;

					rules = [ ".face { background-image: url(\"" + this.src + "\") !important; " +
								"width: " + constants.width + "px; height: " + constants.height + "px; }",
							".tile { width: " + (constants.width + constants.depth) + "px; " +
								"height: " + (constants.height + constants.depth) + "px; " +
								"background-image: url(" + getShadow(constants.width, constants.height) + "); " +
								"background-repeat: no-repeat; " +
								["", "ms", "moz", "o", "webkit"].map(function(item) { return ((item) ? "-" + item + "-" : "") + "clip-path: " + clipPath; }).join("; ") + "}" ];

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

				var src = _thisScript.getAttribute("palette") ||
					_params(_thisScript.getAttribute("src")).palette ||
					_params(window.location.href).palette;

				palette.src = src;
			},
			isAreaCovered = function(area, by) {
				var shards = [ ];

				by.forEach(function(item) {
					shards.push({ x: item.x, y: area.y, w: item.w, h: area.h });
					shards.push({ x: area.x, y: item.y, w: area.w, h: item.h });
				});
				for (var i = 0, s; s = shards[i]; i++) {
					for (var j = 0, b; b = by[j]; j++) {
						if (!zCover(s, b)) {
							return false;
						}
					}
				}
				return true;
			},
			loadFaces = function(map) {
				var x1 = _min(map.map(function(item) { return item.x; })),
					x2 = _max(map.map(function(item) { return item.x + item.w; })),
					y1 = _min(map.map(function(item) { return item.y; })),
					y2 = _max(map.map(function(item) { return item.y + item.h; })),
					z1 = _min(map.map(function(item) { return item.z; })),
					z2 = _max(map.map(function(item) { return item.z; })),
					mW = _max(map.map(function(item) { return item.w; })),
					mH = _max(map.map(function(item) { return item.h; })),
					w = x2 - x1,
					h = y2 - y1;

				var excess = map.length % 4;

				if (excess) {
					(function() {
						var tiles = map.slice();

						tiles.sort(function(a, b) {
							return b.z - a.z;
						});
						excess = tiles.slice(0, excess);

						var remainder = map.filter(function(item) {
							return excess.findIndex(function(value) { return value === item; }) < 0;
						});
						remainder.splice(0, 0, 0, map.length);
						map.splice.apply(map, remainder);
					})();
					return loadFaces(map);
				}

				if (x1 !== 0 || y1 !== 0) {
					map.forEach(function(item) {
						item.x -= x1;
						item.y -= y1;
					});
				}
				if (z1 !== 0) {
					map.forEach(function(item) {
						item.z -= z1;
					});
				}

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

				var tilesPerType;

				(function() {
					var n, newTiles;

					do {
						var index, faceSet = faces.slice(), m, n, t = { };

						tilesPerType = { };
						while (map.length < faceSet.length) {
							index = Math.floor(Math.random() * faceSet.length);
							index = faceSet[index].type;
							m = (t[index]) ? 0 : 2;
							t[index] = true;
							n = 0;
							faceSet = faceSet.filter(function(item) {
								return item.type !== index || n++ < m;
							});
						}
						while (map.length > faceSet.length) {
							index = Math.floor(Math.random() * faceSet.length);
							index = faceSet[index].type;
							n = faceSet.length;
							newTiles = faceSet.filter(function(item) {
								return item.type === index;
							}).slice(0, 2).map(function(item) {
								return {
									background: {
										x: item.background.x,
										y: item.background.y
									},
									face: item.face,
									index: n++,
									type: item.type
								};
							});
							newTiles.splice(0, 0, 0, 0);
							faceSet.splice.apply(faceSet, newTiles);
						}
						faceSet.forEach(function(item) {
							if (typeof tilesPerType[item.type] !== "undefined") {
								tilesPerType[item.type]++;
							} else {
								tilesPerType[item.type] = 1;
							}
						});
						map.forEach(function(tile, i) {
							tile.index = i;

							var index = Math.floor(Math.random() * faceSet.length),
								face = faceSet[index];

							tile.background = face.background;
							tile.face = face.face;
							tile.type = face.type;
							faceSet.splice(index, 1);
						});
					} while ((function() {
						var i,
							inColumn,
							index,
							length,
							maxPerColumn,
							non0ZTiles,
							tile,
							z;

						non0ZTiles = map.filter(function(item) {
							return item.z;
						});

						for (i = 0, length = non0ZTiles.length; i < length; i++) {
							tile = non0ZTiles[i];
							maxPerColumn = tilesPerType[tile.type] / 2;

							inColumn = 0;
							for (z = z1; z <= z2; z++) {
								if (z !== tile.z && map.findIndex(function(item) {
									return item.z === z && item.type === tile.type && zOverlap(non0ZTiles[i], item);
								}) >= 0) {
									if (++inColumn >= maxPerColumn) {
										return true;
									}
								}
							}
						}
					})());
				})();
				return tilesPerType;
			},
			zCover = function(what, cover) {
				return cover.x <= what.x && cover.x + cover.w >= what.x + what.w &&
					cover.y <= what.y && cover.y + cover.h >= what.y + what.h;
			},
			zOverlap = function(box1, box2) {
				return box1 !== box2 &&
					box1.y + box1.h > box2.y && box1.y < box2.y + box2.h
					&&
					box1.x + box1.w > box2.x && box1.x < box2.x + box2.w
					;
			};

		Game = function(board, map, ready) {
			var availableMoves = 0,
				end,
				hiddenTiles = 0,
				hintIndex,
				hints = [ ],
				history = [ ],
				start,
				tileSet,
				tilesPerType;

			var getMatchingTiles = function(tile, freeOnly) {
				var type = tile.dataset.type;

				return Array.from(board.getElementsByClassName("tile")).filter(function(item, i) {
					return item !== tile && item.dataset.type === type &&
						(!freeOnly || item.classList.contains("free"));
				});
			};

			var getTileBox = function(tile) {
				return {
					index: parseInt(tile.dataset.index),
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
				hiddenTiles = 0;
				(function() {
					var tileStatus = Array.from(board.getElementsByClassName("tile")).map(function(tile, i) {
						var status = getTileBox(tile);

						status.index = parseInt(tile.dataset.index);
						status.visible = _isVisible(tile);
						return status;
					});

					var freeTiles = tileStatus.filter(function(tile) {
						var row = tileStatus.filter(function(item) {
							return item.index !== tile.index &&
								item.visible &&
								item.z === tile.z &&
								item.y + item.h > tile.y &&
								item.y < tile.y + tile.h;
						});

						if (row.length &&
							row.filter(function(item) { return item.x + item.w === tile.x }).length &&
							row.filter(function(item) { return item.x === tile.x + tile.w }).length) {

							return false;
						}

						if (tileStatus.findIndex(function(item) {
							return item.visible &&
								item.z === tile.z + 1 &&
								zOverlap(item, tile);
						}) >= 0) {
							return false;
						}

						return true;
					});

					var allTiles = Array.from(board.getElementsByClassName("tile"));

					allTiles.forEach(function(tile, i) {
						tile.classList[(freeTiles.findIndex(function(item) {
							return item.visible && item.index === parseInt(tile.dataset.index);
						}) >= 0) ? "add" : "remove"]("free");
					});
					allTiles.forEach(function(tile, i) {
						var isVisible = _isVisible(tile),
							box = (isVisible) ? getTileBox(tile) : undefined,
							remainingMatches = getMatchingTiles(tile).filter(function(item) {
								return _isVisible(item);
							});

						tile.classList[(end || remainingMatches.length > 1) ? "remove" : "add"]("last");
						tile.classList[(remainingMatches.length && remainingMatches.findIndex(function(item) {
							return !item.classList.contains("free");
						}) < 0) ? "add" : "remove"]("all");

						(function() {
							if (isVisible) {
								var isObscured = true,
									lastXY,
									over;

								var obscuring = tileStatus.filter(function(item) {
									return item.index !== box.index &&
										item.visible &&
										item.z === box.z &&
										item.x === box.x + box.w &&
										item.y + item.h > box.y &&
										item.y < box.y + box.h;
								});

								if (obscuring.length) {
									obscuring.sort(function(a, b) {
										return b.y - a.y;
									});
									lastXY = obscuring[0].y;
									obscuring.forEach(function(item, i) {
										if (isObscured && i > 0 && item.y > lastXY) {
											isObscured = false;
										}
										lastXY = item.y;
									});
									if (isObscured) {
										obscuring = tileStatus.filter(function(item) {
											return item.index !== box.index &&
												item.visible &&
												item.z === box.z &&
												item.y === box.y + box.h &&
												item.x + item.w > box.x &&
												item.x < box.x + box.w;
										});
										if (obscuring.length) {
											obscuring.sort(function(a, b) {
												return b.x - a.x;
											});
											lastXY = obscuring[0].x;
											obscuring.forEach(function(item, i) {
												if (isObscured && i > 0 && item.x > lastXY) {
													isObscured = false;
												}
											});
											if (isObscured) {
												over = tileStatus.filter(function(item) {
													return item.visible && item.z === box.z + 1 && zOverlap(item, box);
												});
												if (over.length && isAreaCovered(box, over)) {
													hiddenTiles++;
												}
											}
										}
									}
								}
							}
						})();
						if (tile.classList.contains("sandwich")) {
							(function() {
								var fatal,
									nonOverlapping,
									overlapping,
									visibleMatches,
									type,
									uncovered;

								if (isVisible && !end) {
									overlapping = [ ];
									nonOverlapping = [ ];

									remainingMatches.forEach(function(item) {
										((zOverlap(box, getTileBox(item))) ? overlapping : nonOverlapping).push(item);
									});
									if (overlapping.length > tilesPerType[parseInt(tile.dataset.type)] / 2) {
										fatal = true;
									} else if (nonOverlapping.length === 0) {
										fatal = true;
									}
									if (!fatal) {
										type = parseInt(tile.dataset.type);
										uncovered = history.findIndex(function(item) {
											return parseInt(item[0].dataset.type) === type;
										}) >= 0;
									}
								}
								tile.classList[(fatal) ? "add": "remove"]("fatal");
								tile.classList[(uncovered) ? "add": "remove"]("uncovered");
							})();
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
									// Combinations:
									// availableMoves += 1 + ((length === 1) ? 0 : length);

									// Moves:
									availableMoves += Math.floor((length + 1) / 2);
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
						/* (board.querySelector(".tile.sandwich.last:not(.hidden):not(.uncovered)")) */
						(board.querySelector(".tile.fatal"))
						||
						(!hasMoves/* && !(!history.length && board.getElementsByClassName("tile").length < tileSet.length)*/)
					) {

					if (!end) {
						end = Date.now();
						/* if (start) { */
							board.dispatchEvent(new Event("game.lost"));
						/* } */
					}
				}
			};

			init(function() {
				tilesPerType = loadFaces(tileSet = map);

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
									matching = Array.from(board.getElementsByClassName("matching"));

								if (tile.classList.contains("free") || end) {
									matching.forEach(function(match, i) {
										match.classList.remove("matching");
									});
									if (clicked.length === 1 && clicked[0] !== tile &&
										clicked[0].dataset.type === tile.dataset.type) {

										_hide(clicked[0]);
										_hide(tile);
										clicked[0].classList.remove("clicked");
										tile.classList.remove("clicked");
										history.push([ clicked[0], tile ]);
										if (!start) {
											start = Date.now();
										}
										checkStatus();
									} else if (end) {
										_hide(tile);
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
											getMatchingTiles(tile).forEach(function(match, i) {
												match.classList.add("matching");
											});
										}
									}
									if (clearHints) {
										hintIndex = undefined;
										Array.from(board.getElementsByClassName("hint")).forEach(function(item, i) {
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
				get hiddenTiles() { return hiddenTiles; },
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
					if (history.length) {
						Array.from(board.querySelectorAll(".clicked, .matching")).forEach(function(item, i) {
							item.classList.remove("clicked");
							item.classList.remove("matching");
						});
						if (end && (all || history[history.length - 1].length > 1)) {
							end = undefined;
						}
						((all) ? history : [ history.pop() ]).forEach(function(entry, i) {
							entry.forEach(function(item, j) {
								_show(item);
							});
						});
						if (all && history.length) {
							history.splice(0, history.length);
						}
						hintIndex = undefined;
						checkStatus();
					}
				},
				get visibleTiles() {
					return board.querySelectorAll(".tile:not(.hidden)").length;
				}
			};
		};
	})();

	(function() {
		var board = document.querySelector(".board"),
			menu = document.getElementById("menu"),
			message = document.getElementById("message"),
			scaler = document.querySelector(".scaler"),
			status = document.querySelector(".status");

		(function() {
			if (typeof window.ShadowRoot === "undefined") {
				message.classList.add("compatible");
				menu.classList.add("compatible");
			}
			if (_param("animate")) {
				document.querySelector("body").classList.add("animate");
			}
		})();

		var game, mapName, resizer;

		var askChangeMap = function() {
			_show(menu);
			_show(messageBackdrop);
		};

		var askNewGame = function() {
			if (!_isVisible(message)) {
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

		var changeMap = function() {
			mapName = document.getElementById("mapList").querySelector("input[type=radio]:checked").value;
			try {
				if (window.sessionStorage && window.sessionStorage.setItem) {
					window.sessionStorage.setItem("mahJong-map", mapName);
				}
			} catch (e) { }
			newGame();
		};

		var checkGame = function(e) {
			if (refreshTime) {
				refreshTime();
			}

			Array.from(document.querySelectorAll(".undo, .restart")).forEach(function(item, i) {
				if (game && game.history.length) {
					item.removeAttribute("disabled");
				} else {
					item.setAttribute("disabled", "disabled");
				}
			});
			Array.from(document.getElementsByClassName("hint")).forEach(function(item, i) {
				if (!game || game.end) {
					item.setAttribute("disabled", "disabled");
				} else {
					item.removeAttribute("disabled");
				}
			});

			document.getElementById("tiles").innerText = (game) ? game.visibleTiles.toLocaleString() : "";
			document.getElementById("availableMoves").innerText = (game) ? game.availableMoves.toLocaleString() : "";
			document.getElementById("hiddenTiles").innerText = (game) ? game.hiddenTiles.toLocaleString() : "";
		};

		var hideMessage = function() {
			_hide(message);
			_hide(menu);
			_hide(document.getElementById("messageBackdrop"));
		};

		var newGame = function() {
			if (mapName) {
				if (game) {
					game = undefined;
					board.removeEventListener("game.changed", checkGame);
				}

				game = new Game(board, new window.maps[mapName](), function() {
					board.addEventListener("game.changed", checkGame);
					setTimeout(function() {
						resizer();
						checkGame();
					});
				});
			}
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
			_show(document.getElementById("messageBackdrop"));
			_show(message);
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
			_bindClickByClassName(status, "undo", function() { undo(); });
			_bindClickByClassName(status, "hint", nextHint);
			_bindClickByClassName(status, "restart", askRestart);
			_bindClickByClassName(status, "map", askChangeMap);

			document.getElementById("messageBackdrop").addEventListener("click", function(e) {
				hideMessage();
			});
			_bindClickByTagName(message, "button", hideMessage);
			_bindClickByClassName(message, "newGame", newGame);
			_bindClickByClassName(message, "restart", restart);

			_bindClickByTagName(menu, "button", hideMessage);
			_bindClickByClassName(menu, "accept", changeMap);

			(function() {
				var allMaps, list, names;

				if ((allMaps = window.maps) && (names = Object.keys(allMaps)).length) {
					try {
						if (window.sessionStorage && window.sessionStorage.getItem) {
							mapName = window.sessionStorage.getItem("mahJong-map");
						}
					} catch (e) { }
					if (mapName && names.indexOf(mapName) < 0) {
						mapName = undefined;
					}
					mapName = mapName || names[0];
				}
				if (names && names.length > 1) {
					list = document.getElementById("mapList");
					Array.from(list.childNodes).forEach(function(node) {
						node.parentElement.removeChild(node);
					});
					names.forEach(function(name) {
						var item = document.createElement("li"),
							label = document.createElement("label"),
							radio = document.createElement("input"),
							text = document.createTextNode(allMaps[name].displayName);

						label.addEventListener("dblclick", function(e) {
							if (e.which === 1) {
								menu.querySelector(".accept").click();
							}
						});
						radio.setAttribute("name", "map");
						radio.setAttribute("type", "radio");
						radio.value = name;
						if (name === mapName) {
							radio.setAttribute("checked", "checked");
						}
						label.appendChild(radio);
						label.appendChild(text);
						item.appendChild(label);
						list.appendChild(item);
					});
				} else {
					status.querySelector(".map").style.display = "none";
				}
			})();
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

		(resizer = function() {
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
		})();
		window.addEventListener("resize", resizer);

		window.setInterval(refreshTime, 100);

		document.addEventListener("DOMContentLoaded", newGame);
	})();
})();
