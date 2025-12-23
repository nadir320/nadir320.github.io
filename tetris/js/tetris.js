"use strict";

(function() {
	var _stateKey = "tetris-game-state",
		_storageName = "session",
		_styleID = "tetris-style";

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

		var storageName = _thisScript.getAttribute("storage");

		if (storageName && storageName.length) {
			_storageName = storageName;
		}
		_storageName += "Storage";
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

	var _clear = function(element) {
		Array.from(element.childNodes).forEach(function(node) {
			node.parentElement.removeChild(node);
		});
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

	var _readObject = function(key) {
		var value = _readValue(key);

		if (value && value.length) {
			try {
				return window.JSON.parse(value);
			} catch (e) { }
		}
	};

	var _readValue = function(key) {
		try {
			var storage = window[_storageName];

			if (storage && storage.getItem) {
				return storage.getItem(key);
			}
		} catch (e) { }
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

	var _writeObject = function(key, value) {
		if (typeof value !== "undefined") {
			value = window.JSON.stringify(value);
		}
		_writeValue(key, value);
	};

	var _writeValue = function(key, value) {
		try {
			var storage = window[_storageName];

			if (storage) {
				if (typeof value !== "undefined") {
					if (storage.setItem) {
						storage.setItem(key, value);
					}
				} else if (storage.removeItem) {
					storage.removeItem(key);
				}
			}
		} catch (e) { }
	}

	var _debug = _param("debug"),
		_cw = _param("cw");

	var Game;

	(function() {
		var constants = {
			get boardHeight() { return 20; },
			get boardWidth() { return 10; },
			levelMoveTime: function(level, slow) {
				var time = 500,
                    move = slow ? 25 : 35;

                return Math.max(move, time - ((level - 1) * move));
			},
			get levels() { return 25; },
			get linesPerLevel() { return 10; },
			get padding() { return 8; },
			get randomTiles() { return 4; },
			get tileHeight() { return 30; },
			get tileWidth() { return 30; }
		}, tetrominoes = {
			I: { name: "I", basePosition: [[0, 0], [0, 1], [0, 2], [0, 3]], baseRotation: 1 },
			J: { name: "J", basePosition: [[0, 0], [0, 1], [0, 2], [1, 2]], baseRotation: 3 },
			L: { name: "L", basePosition: [[0, 0], [0, 1], [0, 2], [1, 0]], baseRotation: 1 },
			O: { name: "O", basePosition: [[0, 0], [0, 1], [1, 0], [1, 1]], baseRotation: 0 },
			S: { name: "S", basePosition: [[1, 0], [1, 1], [0, 1], [0, 2]], baseRotation: 1 },
			T: { name: "T", basePosition: [[0, 0], [0, 1], [0, 2], [1, 1]], baseRotation: 0 },
			Z: { name: "Z", basePosition: [[0, 0], [0, 1], [1, 1], [1, 2]], baseRotation: 1 }
		};

		var _randomTetromino = function() {
			var names = Object.keys(tetrominoes);

			return tetrominoes[names[Math.floor(Math.random() * names.length)]];
		};

		var _rotate = function(className, tiles, rotation) {
			var rotated;

			switch (className) {
				case "I":
					switch (rotation) {
						case 0:
						case 2:
							rotated = [
								[tiles[0][0] + +2, tiles[0][1] + -2],
								[tiles[1][0] + +1, tiles[1][1] + -1],
								[tiles[2][0] + +0, tiles[2][1] + +0],
								[tiles[3][0] + -1, tiles[3][1] + +1],
							];
							break;
						case 1:
						case 3:
							rotated = [
								[tiles[0][0] + -2, tiles[0][1] + +2],
								[tiles[1][0] + -1, tiles[1][1] + +1],
								[tiles[2][0] + +0, tiles[2][1] + +0],
								[tiles[3][0] + +1, tiles[3][1] + -1],
							];
							break;
					}
					break;
				case "J":
					switch (rotation) {
						case 0:
							rotated = [
								[tiles[0][0] + -1, tiles[0][1] + -1],
								[tiles[1][0] + +0, tiles[1][1] + +0],
								[tiles[2][0] + +1, tiles[2][1] + +1],
								[tiles[3][0] + +2, tiles[3][1] + +0],
							];
							break;
						case 1:
							rotated = [
								[tiles[0][0] + -1, tiles[0][1] + +1],
								[tiles[1][0] + +0, tiles[1][1] + +0],
								[tiles[2][0] + +1, tiles[2][1] + -1],
								[tiles[3][0] + +0, tiles[3][1] + -2],
							];
							break;
						case 2:
							rotated = [
								[tiles[0][0] + +1, tiles[0][1] + +1],
								[tiles[1][0] + +0, tiles[1][1] + +0],
								[tiles[2][0] + -1, tiles[2][1] + -1],
								[tiles[3][0] + -2, tiles[3][1] + -0],
							];
							break;
						case 3:
							rotated = [
								[tiles[0][0] + +1, tiles[0][1] + -1],
								[tiles[1][0] + +0, tiles[1][1] + +0],
								[tiles[2][0] + -1, tiles[2][1] + +1],
								[tiles[3][0] + +0, tiles[3][1] + +2],
							];
							break;
					}
					break;
				case "L":
					switch (rotation) {
						case 0:
							rotated = [
								[tiles[0][0] + -1, tiles[0][1] + -1],
								[tiles[1][0] + +0, tiles[1][1] + +0],
								[tiles[2][0] + +1, tiles[2][1] + +1],
								[tiles[3][0] + +0, tiles[3][1] + -2],
							];
							break;
						case 1:
							rotated = [
								[tiles[0][0] + -1, tiles[0][1] + +1],
								[tiles[1][0] + +0, tiles[1][1] + +0],
								[tiles[2][0] + +1, tiles[2][1] + -1],
								[tiles[3][0] + -2, tiles[3][1] + +0],
							];
							break;
						case 2:
							rotated = [
								[tiles[0][0] + +1, tiles[0][1] + +1],
								[tiles[1][0] + +0, tiles[1][1] + +0],
								[tiles[2][0] + -1, tiles[2][1] + -1],
								[tiles[3][0] + +0, tiles[3][1] + +2],
							];
							break;
						case 3:
							rotated = [
								[tiles[0][0] + +1, tiles[0][1] + -1],
								[tiles[1][0] + +0, tiles[1][1] + +0],
								[tiles[2][0] + -1, tiles[2][1] + +1],
								[tiles[3][0] + +2, tiles[3][1] + +0],
							];
							break;
					}
					break;
				case "O":
					rotated = tiles;
					break;
				case "S":
					switch (rotation) {
						case 0:
						case 2:
							rotated = [
								[tiles[0][0] + +0, tiles[0][1] + -2],
								[tiles[1][0] + +1, tiles[1][1] + -1],
								[tiles[2][0] + +0, tiles[2][1] + +0],
								[tiles[3][0] + +1, tiles[3][1] + +1],
							];
							break;
						case 1:
						case 3:
							rotated = [
								[tiles[0][0] + +0, tiles[0][1] + +2],
								[tiles[1][0] + -1, tiles[1][1] + +1],
								[tiles[2][0] + +0, tiles[2][1] + +0],
								[tiles[3][0] + -1, tiles[3][1] + -1],
							];
							break;
					}
					break;
				case "T":
					switch (rotation) {
						case 0:
							rotated = [
								[tiles[0][0] + -1, tiles[0][1] + -1],
								[tiles[1][0] + +0, tiles[1][1] + +0],
								[tiles[2][0] + +1, tiles[2][1] + +1],
								[tiles[3][0] + +1, tiles[3][1] + -1],
							];
							break;
						case 1:
							rotated = [
								[tiles[0][0] + -1, tiles[0][1] + +1],
								[tiles[1][0] + +0, tiles[1][1] + +0],
								[tiles[2][0] + +1, tiles[2][1] + -1],
								[tiles[3][0] + -1, tiles[3][1] + -1],
							];
							break;
						case 2:
							rotated = [
								[tiles[0][0] + +1, tiles[0][1] + +1],
								[tiles[1][0] + +0, tiles[1][1] + +0],
								[tiles[2][0] + -1, tiles[2][1] + -1],
								[tiles[3][0] + -1, tiles[3][1] + +1],
							];
							break;
						case 3:
							rotated = [
								[tiles[0][0] + +1, tiles[0][1] + -1],
								[tiles[1][0] + +0, tiles[1][1] + +0],
								[tiles[2][0] + -1, tiles[2][1] + +1],
								[tiles[3][0] + +1, tiles[3][1] + +1],
							];
							break;
					}
					break;
				case "Z":
					switch (rotation) {
						case 0:
						case 2:
							rotated = [
								[tiles[0][0] + -1, tiles[0][1] + -1],
								[tiles[1][0] + +0, tiles[1][1] + +0],
								[tiles[2][0] + +1, tiles[2][1] + -1],
								[tiles[3][0] + +2, tiles[3][1] + +0],
							];
							break;
						case 1:
						case 3:
							rotated = [
								[tiles[0][0] + +1, tiles[0][1] + +1],
								[tiles[1][0] + +0, tiles[1][1] + +0],
								[tiles[2][0] + -1, tiles[2][1] + +1],
								[tiles[3][0] + -2, tiles[3][1] + +0],
							];
							break;
					}
					break;
			}
			return rotated;
		};

		Object.keys(tetrominoes).forEach(function(key) {
			tetrominoes[key].rotate = function(tiles, rotation) {
				return _rotate(key, tiles, rotation);
			};
		});

		var Tetromino = function(type) {
			var className, rotation = 0, locked, tiles;

			var xs = function(t) { return (t || tiles).map(function(tile) { return tile[1]; }) },
				ys = function(t) { return (t || tiles).map(function(tile) { return tile[0]; }) };

			var checkLocked = function(findEmptyTiles) {
				var diffs = tiles.filter(function(tile) {
					return tile[0] >= 0;
				}).map(function(tile) {
					return findEmptyTiles.apply(this, tile);
				});

				if (diffs.filter(function(n) { return !n; }).length) {
					locked = true;
				}
			};

			var rotateAndCenter = function(t, width, r) {
				t = t.slice();

				if (r) {
					for (var i = 0; i < r; i++) {
						t = _rotate(className, t, i + 1);
					}
				}
				var currentXs = xs(t),
					x = Math.floor((width - _max(currentXs) - _min(currentXs) + 1) / 2) - 1;

				if (x) {
					t = t.map(function(tile) { return [tile[0], tile[1] + x]; });
				}
				return t;
			};

			var tetromino;

			if (type) {
				if (type.tiles) {
					tetromino = tetrominoes[type.className];
					rotation = type.rotation;
					locked = type.locked;
				} else {
					tetromino = tetrominoes[type];
					rotation = tetromino.baseRotation;
				}
			} else {
				tetromino = _randomTetromino();
				rotation = tetromino.baseRotation;
			}
			className = tetromino.name;
			tiles = (type && type.tiles) ?
				type.tiles :
				rotateAndCenter(tetromino.basePosition, constants.boardWidth, tetromino.baseRotation);

			return {
				className: className,
				createPreview: function(actual) {
					var initialTiles = rotateAndCenter(tetromino.basePosition, 4, (actual) ? rotation : 0);

					var baseXs = xs(initialTiles),
						baseYs = ys(initialTiles),
						minX = _min(baseXs),
						minY = _min(baseYs),
						xTiles = _max(baseXs) - minX + 1,
						yTiles = _max(baseYs) - minY + 1;

					var container = document.createElement("div");

					for (var i = 0; i < yTiles; i++) {
						for (var j = 0; j < xTiles; j++) {
							if (initialTiles.filter(function(tile) {
								return tile[0] === i + minY && tile[1] === j + minX;
							}).length) {
								var tile = document.createElement("div");

								tile.classList.add(className);
								tile.style.gridColumn = j + 1;
								tile.style.gridRow = i + 1;
								tile.style.width = constants.tileWidth + "px";
								tile.style.height = constants.tileHeight + "px";
								container.appendChild(tile);
							}
						}
					}
					return container;
				},
				createPreviewImage: function(color, actual) {
					var canvas = document.createElement("canvas");

					canvas.setAttribute("width", constants.tileWidth * 4);
					canvas.setAttribute("height", constants.tileHeight * 4);

					var context = canvas.getContext("2d");

					context.fillStyle = color;
					context.strokeStyle = color;

					var initialTiles = rotateAndCenter(tetromino.basePosition, 4, (actual) ? rotation : 0);

					initialTiles.forEach(function(tile) {
						var rect = [
							tile[1] * constants.tileWidth,
							tile[0] * constants.tileHeight,
							constants.tileWidth,
							constants.tileHeight
						];

						context.fillRect.apply(context, rect);
						context.strokeRect.apply(context, rect);
					});

					return canvas.toDataURL();
				},
				drop: function() {
					var t = this;

					if (!locked) {
						var dropped = t.getShadow();

						if (dropped) {
							tiles = dropped;
						}
						checkLocked(this.findEmptyTiles);
					}
				},
				getShadow: function() {
					var t = this,
						diff = _min(tiles.map(function(tile) { return t.findEmptyTiles.apply(t, tile); }));

					if (diff) {
						return tiles.map(function(tile) { return [tile[0] + diff, tile[1]]; });
					}
				},
				get locked() { return locked; },
				isTileVisible: function(n) {
					return tiles[n][0] >= 0;
				},
				moveDown: function() {
					checkLocked(this.findEmptyTiles);
					if (!locked) {
						tiles = tiles.map(function(tile) { return [tile[0] + 1, tile[1]]; });
					}
				},
				moveLeft: function() {
					if (!locked) {
						var t = this,
							x = _min(xs());

						if (x > 0 && tiles.filter(function(tile) { return !t.isTileEmpty(tile[0], tile[1] - 1); }).length === 0) {
							tiles = tiles.map(function(tile) { return [tile[0], tile[1] - 1]; });
						}
					}
				},
				moveRight: function() {
					if (!locked) {
						var t = this,
							x = _max(xs());

						if (x < constants.boardWidth - 1 && tiles.filter(function(tile) { return !t.isTileEmpty(tile[0], tile[1] + 1); }).length === 0) {
							tiles = tiles.map(function(tile) { return [tile[0], tile[1] + 1]; });
						}
					}
				},
				rotate: function(_) {
					if (!locked) {
						if (_cw || _) {
							var newRotation = (rotation + 1) % 4,
								rotatedTiles = tetromino.rotate(tiles, newRotation),
								newXs = xs(rotatedTiles),
								t = this;

							if (_min(newXs) >= 0 &&
								_max(newXs) < constants.boardWidth) {

								if (rotatedTiles.filter(function(newTile) {
									return newTile[0] >= 0 && !t.isTileEmpty.apply(this, newTile);
								}).length === 0) {
									rotation = newRotation;
									tiles = rotatedTiles;
								}
							}
						} else {
							for (var i = 0; i < 3; i++) {
								this.rotate(true);
							}
						}
					}
				},
				get rotation() { return rotation; },
				get tiles() { return tiles.slice(); }
			};
		};

		(function() {
			var css = [ ".level-container { background-color: whitesmoke; }" ],
				x;

			for (var i = 1; i <= constants.levels; i++) {
				x = Math.min(Math.max(Math.floor(255 - ((i - 1) / constants.levels * 255)), 0), 255);
				css.push(".level-container[level=\"" + i + "\"] { background-color: rgba(" + x + ", " + x + ", " + x + ", 1); " +
					"background: radial-gradient(circle, rgba(" + x + ", " + x + ", " + x + ", 1) 0%, rgba(255, 255, 255, 1) 100%); }");
			}
			_setStyle(css.join(" "), _styleID);
		})();

		Game = function(board, options, ready, state) {
			var activePieces,
                start,
				elapsed = 0,
				end,
				lastMove,
				lastLock,
				lastTime,
				level,
				levelMoveTime,
				lines,
				lineHistory = [ ],
				pieces,
				nextPiece,
				pieceStats = { },
				paused = options && options.paused,
				allTiles,
				baseTiles = 0,
				baseCleared,
				baseRemoved,
				remainingBaseTiles = 0,
                remainingTiles = 0,
				piece,
				timer;

			Object.keys(tetrominoes).forEach(function(key) {
				var tetromino = tetrominoes[key];

				pieceStats[tetromino.name] = {
                    currentStreak: 0,
                    currentNegativeStreak: 0,
                    maximumStreak: 0,
                    maximumNegativeStreak: 0,
                    total: 0
                };
			});

			var k = function(row, column) {
				return row + "°" + column;
			}

			var checkBaseStatus = function() {
				if (baseTiles) {
					if (!baseRemoved && !remainingBaseTiles) {
						baseRemoved = true;
					}
					if (!baseCleared) {
						var currentTiles = Object.keys(allTiles)
								.map(function(key) {
									return allTiles[key];
								})
								.filter(function(tile) {
									return tile.className;
								}),
							remainingTiles = currentTiles
								.filter(function(tile) {
									return tile.baseTile;
								});

						if (remainingTiles
							.filter(function(tile) {
								for (var i = tile.row + 1; i < constants.boardHeight; i++) {
									if (isTileEmpty(i, tile.column)) {
										return true;
									}
								}

								var isFree,
									wasFree = isTileEmpty(tile.row - 1, tile.column),
									changed = false;

								for (var i = tile.row - 2; i >= 0; i--) {
									isFree = isTileEmpty(i, tile.column);

									if (isFree !== wasFree) {
										if (changed) {
											return true;
										} else {
											wasFree = isFree;
										}
									}
								}
								return false;
							}).length === 0) {
								if (currentTiles.filter(function(tile) {
									for (var i = tile.row + 1; i < constants.boardHeight; i++) {
										if (isTileEmpty(i, tile.column)) {
											return true;
										}
									}
									return false;
								}).length === 0) {
									baseCleared = true;
								}
							}
					}
				}
			};

			var checkStatus = function() {
				updateBoard();

				if (piece && piece.locked) {
					lastLock = lastMove = Date.now();
					piece.tiles.forEach(function(tile, i) {
						if (piece.isTileVisible(i)) {
							var boardTile = getBoardTile.apply(this, tile);

							boardTile.className = piece.className;
							boardTile.locked = true;
						}
					});

					var tilesPerRow = Object.keys(allTiles)
						.map(function(key) { return allTiles[key]; })
						.reduce(function(array, value) {
							(array[value.row] || (array[value.row] = (function() {
								var r = [ ];

								r.row = value.row;
								return r;
							})())).push(value);
							return array;
						}, [ ]);

					var filledLines = tilesPerRow
						.filter(function(row) {
							return row.filter(function(item) {
								return item.className;
							}).length == constants.boardWidth;
						})
						.map(function(row) {
							return row.row;
						});

					if (filledLines.length) {
						(function() {
							lineHistory.push(filledLines.length);
							filledLines.sort(function(a, b) { return b - a; });

							var n = 0;

							for (var i = filledLines[0]; i >= 0; i--) {
								while (filledLines.includes(i - n)) { n++; }
								tilesPerRow[i].forEach(function(item) {
									var from = (i - n >= 0) ?
										tilesPerRow[i - n].filter(function(subItem) {
											return subItem.column === item.column;
										}).pop() :
										{ };

									item.className = from.className;
									item.locked = from.locked;
									if (item.baseTile) {
										item.baseTile = false;
										remainingBaseTiles--;
									}
								});
							}
							checkBaseStatus();
						})();
						if (Math.floor(lines / constants.linesPerLevel) !==
							Math.floor((lines + filledLines.length) / constants.linesPerLevel)) {

							level++;
							levelMoveTime = constants.levelMoveTime(level, options.slow);
						}
						lines += filledLines.length;
						updateBoard();
					}
                    remainingTiles = Object.keys(allTiles).map(function(key) { return allTiles[key].className; }).filter(function(n) { return n; }).length;

					getNextPiece();
					board.dispatchEvent(new Event("game.changed"));
					if (end) {
						board.dispatchEvent(new Event("game.lost"));
					}
				}

				_writeObject(_stateKey, (end) ? undefined : {
					  allTiles: Object.keys(allTiles).reduce(function(current, key) {
						  var tile = allTiles[key];

						  current[key] = {
							  baseTile: tile.baseTile,
							  className: tile.className,
							  column: tile.column,
							  locked: tile.locked,
							  row: tile.row
						  };
						  return current;
					  }, { })
					, baseCleared: baseCleared
					, baseRemoved: baseRemoved
					, baseLines: (options && options.lines) || 0
					, baseTiles: baseTiles
					, elapsed: elapsed
					, level: level
					, lineHistory: lineHistory
					, lines: lines
					, nextPiece: nextPiece.className
					, piece: piece
					, pieceStats: pieceStats
					, pieces: pieces
					, remainingBaseTiles: remainingBaseTiles
                    , remainingTiles: remainingTiles
					, start: start
				});
			};

			var findEmptyTiles = function(row, column) {
				var freeRows = Object.keys(allTiles)
					.map(function(key) { return allTiles[key]; })
					.filter(function(tile) {
						return tile.column == column &&
							!tile.className &&
							tile.row > row;
					}).map(function(tile) { return tile.row; });

				if (row < 0) {
					for (var i = -1; i > row; i--) {
						freeRows.splice(0, 0, i);
					}
				}

				freeRows.sort(function(a, b) { return a - b; });
				for (var i = 0; i < freeRows.length; i++) {
					if (freeRows[i] !== row + i + 1) {
						return i;
					}
				}
				return freeRows.length;
			};

			var getBoardTile = function(row, column) {
				return allTiles[k(row, column)];
			};

			var getNextPiece = function() {
				var createPiece = function() {
					var newPiece;

                    do {
                        newPiece = new Tetromino();
                    } while (activePieces.length && !activePieces.includes(newPiece.className));

					newPiece.findEmptyTiles = findEmptyTiles;
					newPiece.isTileEmpty = isTileEmpty;
					return newPiece;
				};

				if (!nextPiece) {
					nextPiece = createPiece();
				}

                var same = piece && piece.className === nextPiece.className;

				piece = nextPiece;

                Object.keys(pieceStats).forEach(function(key) {
                    var stat = pieceStats[key];

                    if (key == piece.className) {
                        stat.total++;
                        if (same) {
                            stat.currentStreak++;
                        } else {
                            stat.currentStreak = 1;
                        }
                        stat.currentNegativeStreak = 0;
                    } else {
                        stat.currentStreak = 0;
                        stat.currentNegativeStreak++;
                    }
                    stat.maximumStreak = Math.max(stat.maximumStreak, stat.currentStreak);
                    stat.maximumNegativeStreak = Math.max(stat.maximumNegativeStreak, stat.currentNegativeStreak);
                });

				pieces++;
				nextPiece = createPiece();
				updateBoard();
				if (nextPiece.tiles.filter(function(tile) {
					return !isTileEmpty.apply(this, tile);
				}).length > 0) {
					end = Date.now();
					updateBoard();
				}
			};

			var isTileEmpty = function(row, column) {
				return row < 0 || !getBoardTile(row, column).className;
			};

			var updateBoard = function() {
				var shadow;

				Array.from(document.getElementsByClassName("level-container")).forEach(function(item) {
					if (level > 1) {
						item.setAttribute("level", level);
					} else {
						item.removeAttribute("level");
					}
				});

				Object.keys(allTiles).forEach(function(key) {
					var tile = allTiles[key],
						classes = tile.tile.classList;

					classes.remove("I");
					classes.remove("J");
					classes.remove("L");
					classes.remove("O");
					classes.remove("S");
					classes.remove("T");
					classes.remove("Z");
					classes.remove("locked");
					classes.remove("base-tile");
					classes.remove("shadow");
					if (tile.className) {
						classes.add(tile.className);
					}
					if (tile.locked) {
						classes.add("locked");
					}
					if (tile.baseTile) {
						classes.add("base-tile");
					}
				});

				if (piece) {
					piece.tiles.forEach(function(pieceTile, i) {
						if (piece.isTileVisible(i)) {
							allTiles[k(pieceTile[0], pieceTile[1])].tile.classList.add(piece.className);
						}
					});

					if (options && options.shadow) {
						if (shadow = piece.getShadow()) {
							shadow.filter(function(tile) {
								return piece.tiles.filter(function(pieceTile) {
									return pieceTile[0] === tile[0] && pieceTile[1] === tile[1];
								}).length === 0;
							})
							.forEach(function(shadowTile) {
								allTiles[k(shadowTile[0], shadowTile[1])].tile.classList.add("shadow");
							});
						}
					}
				}
			};

			(function() {
				_clear(board);

				board.style.padding = constants.padding + "px";
				board.style.width = (constants.tileWidth * constants.boardWidth + 2 * constants.padding) + "px";
				board.style.height = (constants.tileHeight * constants.boardHeight + 2 * constants.padding) + "px";

				var levelContainer = document.createElement("div");

				levelContainer.classList.add("level-container");

				allTiles = { };

				(function() {
					for (var i = 0; i < constants.boardHeight; i++) {
						for (var j = 0; j < constants.boardWidth; j++) {
							var tile = document.createElement("div");

							tile.classList.add("tile");
							if (options.fade) {
								tile.classList.add("fade");
							}
							tile.style.gridColumn = j + 1;
							tile.style.gridRow = i + 1;
							tile.style.width = constants.tileWidth + "px";
							tile.style.height = constants.tileHeight + "px";
							levelContainer.appendChild(tile);

							allTiles[k(i, j)] = {
								row: i,
								column: j,
								tile: tile
							};
						}
					}
				})();

				if (state && state.start) {
					Object.keys(state.allTiles)
						.map(function(key) {
							return state.allTiles[key];
						})
						.forEach(function(savedTile) {
							var tile = allTiles[k(savedTile.row, savedTile.column)];

							tile.baseTile = !!savedTile.baseTile;
							if (savedTile.className) {
								tile.className = savedTile.className;
							}
							tile.locked = !!savedTile.locked;
						});

					nextPiece = new Tetromino(state.nextPiece);
					nextPiece.findEmptyTiles = findEmptyTiles;
					nextPiece.isTileEmpty = isTileEmpty;

					piece = new Tetromino(state.piece);
					piece.findEmptyTiles = findEmptyTiles;
					piece.isTileEmpty = isTileEmpty;
				} else if (options && options.lines > 0) {
					(function() {
						var m = Math.min(options.lines, constants.boardHeight - 4);
						for (var i = 0; i < m; i++) {
							var tilesPerRow = Object.keys(allTiles)
								.map(function(key) { return allTiles[key]; })
								.filter(function(tile) { return tile.row === constants.boardHeight - i - 1; });

							for (var j = 0; j < constants.randomTiles; j++) {
								var k = Math.floor(Math.random() * tilesPerRow.length),
									name;

								do {
									name = _randomTetromino().name;
								} while (name === tetrominoes.Z.name);

								tilesPerRow[k].className = name;
								tilesPerRow[k].baseTile = true;
								tilesPerRow.splice(k, 1);
								baseTiles++;
								remainingBaseTiles++;
							}
						}
					})();
				}

				board.appendChild(levelContainer);

				if (state && state.start) {
                    activePieces = state.activePieces || [ ];
					baseCleared = state.baseCleared;
					baseRemoved = state.baseRemoved;
					baseTiles = state.baseTiles;
					elapsed = state.elapsed;
					level = state.level;
					lineHistory = state.lineHistory;
					lines = state.lines;
					pieceStats = state.pieceStats;
					pieces = state.pieces;
					remainingBaseTiles = state.remainingBaseTiles;
					remainingTiles = state.remainingTiles;
					start = state.start;
				} else {
                    activePieces = options.activePieces || [ ];
					pieces = lines = 0;
					level = 1;
				}
                levelMoveTime = constants.levelMoveTime(level, options.slow);
				updateBoard();

				if (!paused) {
					start = Date.now();
					getNextPiece();
				}

				if (ready) {
					ready();
				}
				timer = window.setInterval(function() {
					if (!end && !paused) {
						if (!start) {
							start = Date.now();
							getNextPiece();
							checkBaseStatus();
							board.dispatchEvent(new Event("game.changed"));
						}

						var now = Date.now();

						if (lastTime) {
							elapsed += now - lastTime;
						}
						if (!lastMove || now - lastMove >= levelMoveTime) {
							if (lastMove) {
								piece.moveDown();
							}
							lastMove = now;
							checkStatus();
						}
						lastTime = now;
					}
				}, 50);
			})();

			return {
                get activePieces() { return activePieces; },
				get baseCleared() { return baseCleared; },
				get baseLines() { return baseTiles / constants.randomTiles; },
				get baseRemoved() { return baseRemoved; },
				board: {
					get width() { return constants.boardWidth * constants.tileWidth; },
					get height() { return constants.boardHeight * constants.tileHeight; }
				},
				get constants() { return constants; },
				dropPiece: function() {
					if (!paused && !end && piece) {
						if (!lastLock || (Date.now() - lastLock >= levelMoveTime / 2)) {
							piece.drop();
							checkStatus();
						}
					}
				},
				get elapsed() { return elapsed; },
				get end() { return end; },
				getNextPiecePreview: function(actual) { if (nextPiece) { return nextPiece.createPreview(actual); } },
				get level() { return level; },
				get lineHistory() { return lineHistory; },
				get lines() { return lines; },
				movePieceDown: function() { if (!paused && !end && piece) { piece.moveDown(); checkStatus(); } },
				movePieceLeft: function() { if (!paused && !end && piece) { piece.moveLeft(); checkStatus(); } },
				movePieceRight: function() { if (!paused && !end && piece) { piece.moveRight(); checkStatus(); } },
				pause: function() {
					if (!paused && !end) {
						paused = true;
						board.dispatchEvent(new Event("game.paused"));
					}
				},
				get paused() { return paused; },
				get pieces() { return pieces; },
				get pieceStats() { return pieceStats; },
				get remainingBaseLines() { return remainingBaseTiles / constants.randomTiles; },
                get remainingTiles() { return remainingTiles; },
				resume: function() {
					if (paused && !end) {
						lastTime = Date.now();
						paused = false;
						board.dispatchEvent(new Event("game.resumed"));
					}
				},
				rotatePiece: function() { if (!paused && !end && piece) { piece.rotate(); checkStatus(); } },
				get start() { return start; },
				stop: function() {
					end = Date.now();
					window.clearInterval(timer);
					timer = undefined;
				}
			};
		};

		Game.createPreviews = function() {
			return Object.keys(tetrominoes).map(function(key) {
				var tetromino = tetrominoes[key];

				return {
					name: tetromino.name,
					preview: new Tetromino(tetromino.name).createPreview(),
				};
			});
		};
	})();

	(function() {
		var BossIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
			BossTitle = decodeURIComponent("%E3%85%A4");

		var _boss,
			_fade = !_param("no-fade") && !parseInt(_thisScript.getAttribute("no-fade")),
			_icon,
			_bossActive = _param("boss") || !!parseInt(_thisScript.getAttribute("boss")),
			_title,
			_touch = !!_param("touch") || !!parseInt(_thisScript.getAttribute("touch"));

		var board = document.querySelector(".board"),
			message = document.getElementById("message"),
			scaler = document.querySelector(".scaler"),
			status = document.querySelector(".status"),
            statMessage = document.getElementById("stat-message");

		(function() {
			if (typeof window.ShadowRoot === "undefined") {
				message.classList.add("compatible");
			}
			if (_param("animate")) {
				document.querySelector("body").classList.add("animate");
			}
		})();

		var game, resizer;

		var addTileClass = function(container) {
			Array.from(container.getElementsByTagName("div")).forEach(function(item, i) {
				if (item.parentElement) {
					item.classList.add("tile");
				}
			});
		};

		var askNewGame = function() {
			if (!_isVisible(message)) {
				if (game) {
					showMessage(document.getElementById("askNewMessage").value);
				} else {
					newGame();
				}
			} else {
				hideMessage();
				newGame();
			}
		};

		var bossScreen = function(value) {
			Array.from(document.getElementsByClassName("boss")).forEach(function(item, i) {
				((value) ? _show : _hide)(item);
			});

			if (_boss !== value) {
				var icon = document.querySelector("[rel='shortcut icon']");

				if (_boss = value) {
					if (game) {
						game.pause();
					}
					_title = document.title;
					document.title = BossTitle;
					if (icon) {
						_icon = icon.getAttribute("href");
						icon.setAttribute("href", BossIcon);
					}
				} else {
					document.title = _title;
					if (icon) {
						icon.setAttribute("href", _icon);
					}
				}
			}
		};

		var checkGame = function(e) {
			if (refreshTime) {
				refreshTime();
			}

            var statusElement = document.querySelector(".status");

			Array.from(statusElement.getElementsByClassName("level")).forEach(function(item, i) {
				item.innerText = (game) ? game.level : undefined;
			});
			Array.from(statusElement.getElementsByClassName("lines")).forEach(function(item, i) {
				item.innerText = ((game) ? game.lines : 0).toLocaleString();
			});
			Array.from(statusElement.getElementsByClassName("line-details")).forEach(function(item, i) {
				var details = "";

				if (game && game.lines) {
					details = game.lineHistory
						.reduce(function(current, value) {
							current[value] = (current[value] || 0) + 1;
							return current;
						}, [ ])
						.map(function(value, i) {
							return {
								index: i,
								value: value
							};
						});
					details.sort(function(a, b) {
						return b.index - a.index;
					});

					details = details
						.filter(function(value) {
							return value.value;
						})
						.map(function(value, i) {
							return value.index + ": " + value.value.toLocaleString();
						})
						.join(" - ");
				}
				item.innerText = details;
			});
			Array.from(statusElement.getElementsByClassName("pieces")).forEach(function(item, i) {
				item.innerText = (game) ? game.pieces : undefined;
			});
			Array.from(statusElement.getElementsByClassName("base-lines-row")).forEach(function(item, i) {
				item.classList[(game && game.baseLines) ? "remove" : "add"]("removed");
			});
			if (game && game.baseLines) {
				Array.from(document.getElementsByClassName("base-lines")).forEach(function(item, i) {
					item.innerText = (game) ? (game.remainingBaseLines.toLocaleString() +
					"/" +
					game.baseLines.toLocaleString() +
                    " (" +
                    game.remainingTiles.toLocaleString() +
                    ")") : undefined;
					(item.classList)[(game && game.baseCleared) ? "add" : "remove"]("base-cleared");
					(item.classList)[(game && game.baseRemoved) ? "add" : "remove"]("base-removed");
				});
			}
			Array.from(statusElement.getElementsByClassName("next-piece-row")).forEach(function(item, i) {
				item.classList[(game && game.start) ? "remove" : "add"]("removed");
			});
			Array.from(statusElement.getElementsByClassName("next-piece")).forEach(function(item, i) {
				var preview = (game) ? game.getNextPiecePreview(true) : undefined;

				if (typeof preview === "string") {
					item.setAttribute("src", preview);
				} else {
					_clear(item);
					if (preview) {
						addTileClass(preview);
						item.appendChild(preview);
					}
				}
			});

			var stats;

			Array.from(statusElement.getElementsByClassName("piece-stats-row")).forEach(function(item, i) {
				item.classList[(game && game.start) ? "remove" : "add"]("removed");
			});
			if (game) {
				stats = game.pieceStats;

				Array.from(statusElement.getElementsByClassName("piece-stats")).forEach(function(item) {
					Array.from(item.getElementsByClassName("stat-table")).forEach(function(table) {
						var rows = Array.from(table.getElementsByClassName("stat-row")),
                            maximumNegativeStreak = { types: [ ], value: 0 };

						rows.forEach(function(row, j) {
                            row.classList.remove("longest-negative-streak");
							Array.from(row.getElementsByClassName("stat-value")).forEach(function(cell, k) {
                                var stat = stats[row.dataset.type];

								cell.innerText = stat.total.toLocaleString();
                                if (maximumNegativeStreak.value <= stat.maximumNegativeStreak) {
                                    if (maximumNegativeStreak.value === stat.maximumNegativeStreak) {
                                        maximumNegativeStreak.types.push(row.dataset.type);
                                    } else {
                                        maximumNegativeStreak.types = [row.dataset.type];
                                        maximumNegativeStreak.value = stat.maximumNegativeStreak;
                                    }
                                }
							});
						});

                        maximumNegativeStreak.types.forEach(function(type) {
                            table.querySelector(".stat-row[data-type=" + type + "]")
                                .classList.add("longest-negative-streak");
                        });

						rows.sort(function(a, b) {
							return stats[b.dataset.type].total - stats[a.dataset.type].total;
						});
						rows.forEach(function(row) {
							table.appendChild(row);
                            row.classList[(game.activePieces.length && game.activePieces.includes(row.dataset.type)) ? "remove" : "add"]("removed");
						});
					});
				});
			}
		};

		var gamePaused = function() {
			Array.from(document.getElementsByClassName("pause")).forEach(function(item, i) {
				_show(item);
			});
		};

		var gameResumed = function() {
			Array.from(document.getElementsByClassName("pause")).forEach(function(item, i) {
				_hide(item);
			});
		};

		var hideMessage = function() {
			_hide(message);
            _hide(statMessage);
			_hide(document.getElementById("messageBackdrop"));
			board.focus();
		};

		var newGame = function(state, paused) {
			if (game) {
				game.stop();
				game = undefined;
				board.removeEventListener("game.changed", checkGame);
			}

			var activePieces = [ ],
                lines = 0;

			if (!state) {
				lines = parseInt(Array.from(document.querySelectorAll("[name=initial-lines]"))
                    .filter(function(item) { return item.checked; })
                    .pop()
                    .value);
                activePieces = Array.from(document.querySelectorAll(".message .pieces input"))
                    .filter(function(item) { return item.checked; })
                    .map(function(item) { return item.dataset.piece; });
			}

			game = new Game(board, {
					fade: _fade,
					lines: lines || 0,
                    activePieces: activePieces,
					paused: paused,
					shadow: !_param("no-shadow"),
					slow: !!_param("slow")
				}, function() {
				board.addEventListener("game.changed", checkGame);
				if (paused) {
					gamePaused();
				} else {
					gameResumed();
				}
				setTimeout(function() {
					resizer();
					checkGame();
				});
			}, state);
		};

		var pauseGame = function() {
			if (game) {
				if (game.paused) {
					if (!_boss) {
						game.resume();
					}
				} else {
					game.pause();
				}
			}
		};

		var refreshTime = function() {
			var elapsed = 0,
				temp,
				text = "";

			if (game && game.start) {
				elapsed = game.elapsed;
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
			Array.from(document.getElementsByClassName("time")).forEach(function(item, i) {
				item.innerText = text + elapsed;
			});
		};

		var showMessage = function(messageText, type) {
			if (!_boss) {
				if (game) {
					game.pause();
				}
				document.getElementById("messageText").innerText = messageText;
				_show(document.getElementById("messageBackdrop"));
				_show(message);
				window.setTimeout(function() {
					try {
						document.querySelector("[name=initial-lines]:checked").focus();
					} catch (e) { debugger; }
				});
			}
		};

        var showStats = function(e) {
            if (game) {
                game.pause();

                var stats = game.pieceStats,
                    previews = Game.createPreviews(),
                    tableBody = statMessage.querySelector("table tbody");

                tableBody.textContent = "";

                var keys = Object.keys(stats);

                if (game.activePieces.length) {
                    keys = keys.filter(function(key) { return game.activePieces.includes(key); });
                }
                keys.forEach(function(key) {
                    var row = document.createElement("tr"),
                        cell = function(value) {
                            var cellElement = document.createElement("td");

                            if (value instanceof HTMLElement) {
                                cellElement.appendChild(value);
                            } else {
                                cellElement.textContent = value.toLocaleString();
                            }
                            row.appendChild(cellElement);
                        },
                        preview =  previews.filter(function(item) {
                            return item.name == key;
                        }).pop(),
                        stat = stats[key];

                    addTileClass(preview.preview);
                    preview.preview.classList.add("preview");
                    cell(preview.preview);
                    [
                        stat.total,
                        stat.currentStreak,
                        stat.maximumStreak,
                        stat.currentNegativeStreak,
                        stat.maximumNegativeStreak
                    ].forEach(cell);
                    tableBody.appendChild(row);
                });
                _show(document.getElementById("messageBackdrop"));
                _show(statMessage);
            }
            if (e && e.preventDefault) {
                e.preventDefault();
            }
        };

		var keyHandler = function(e) {
			switch (e.which) {
				case 13:				/* Enter */
					if (_isVisible(message)) {
						hideMessage();
						newGame();
					} else if (game) {
						if (game.paused) {
							if (!_boss) {
								game.resume();
							}
						} else {
							game.dropPiece();
						}
					}
					break;
				case 19:				/* Pause */
				case 80:				/* P */
					if (!_isVisible(message)) {
						pauseGame();
					}
					break;
				case 27:				/* Escape */
					if (_isVisible(message)) {
						hideMessage();
					} else if (_bossActive) {
						bossScreen(true);
					} else {
						pauseGame();
					}
					break;
				case 32:				/* Space */
					if (!_isVisible(message) && game) {
						if (game.paused) {
							if (!_boss) {
								game.resume();
							}
						} else {
							game.dropPiece();
						}
					}
					break;
				case 37:				/* Left */
				case 65:				/* A */
					if (game) {
						game.movePieceLeft();
					}
					break;
				case 38:				/* Top */
				case 75:				/* K */
				case 87:				/* W */
					if (game) {
						game.rotatePiece();
					}
					break;
				case 39:				/* Right */
				case 68:				/* D */
					if (game) {
						game.movePieceRight();
					}
					break;
				case 40:				/* Down */
				case 83:				/* S */
					if (game) {
						game.movePieceDown();
					}
					break;
				case 66:				/* B */
					bossScreen(!_boss);
					break;
				case 71:				/* G */
					showMessage(new Date().toLocaleString());
					break;
				case 113:				/* F2 */
					askNewGame();
					break;
				case 118:				/* F7 */
					showStats();
					break;
				default:
					/* console.info(e.which); */
					break;
			}
		};

		(function() {
			board.addEventListener("game.changed", checkGame);
			board.addEventListener("game.won", function() { showMessage(document.getElementById("wonMessage").value); });
			board.addEventListener("game.lost", function() { showMessage(document.getElementById("lostMessage").value); });
			board.addEventListener("game.paused", gamePaused);
			board.addEventListener("game.resumed", gameResumed);

            _bindClickByClassName(status, "stats", showStats);
			_bindClickByClassName(status, "newGame", askNewGame);
			_bindClickByClassName(status, "pauseGame", pauseGame);

			document.getElementById("messageBackdrop").addEventListener("click", function(e) {
				hideMessage();
			});
			_bindClickByTagName(message, "button", hideMessage);
			_bindClickByClassName(message, "newGame", function() { newGame(); });

			/* _bindClickByClassName(document, "boss", function() { bossScreen(false); }); */
			_bindClickByClassName(document, "pause", function(e) { if (!_boss) { pauseGame(); } });

			if (_touch) {
				(function() {
					var container = document.createElement("div"),
						heights = [
							2,
							5,
							3,
							1
						],
						total = heights.reduce(function(current, value) { current += value; return current; }, 0);

					container.classList.add("touch-container");

					var createTouchArea = function(className) {
						var element = document.createElement("div");

						element.classList.add("touch");
						element.classList.add(className);
						container.appendChild(element);
					};

					for (var i = 0; i < 5; i++) {
						createTouchArea("touch-" + (i + 1));
					}
					_setStyle([
						".touch-container { grid-template-rows: " + heights.map(function(height) { return height + "fr"; }).join(" ") + " }",
						".touch-1 { grid-area: 1 / 1 / span 1 / span 2}",
						".touch-2 { grid-area: 2 / 1 / span 1 / span 1}",
						".touch-3 { grid-area: 2 / 2 / span 1 / span 1}",
						".touch-4 { grid-area: 3 / 1 / span 1 / span 2}",
						".touch-5 { grid-area: 4 / 1 / span 1 / span 2}"
					].join(" "));

					document.body.appendChild(container);

					document.addEventListener("touchstart", function(e) {
						var w = document.body.clientWidth,
							h = document.body.clientHeight;

						Array.from(e.touches).forEach(function(e2) {
							/* console.log(e2.identifier + ": " + e2.clientX + "/" + w + ", " + e2.clientY + "/" + h); */

							if (e2.clientY <= h * heights[0] / total) {
								keyHandler({ which: 38 });		// up
							} else if (e2.clientY >= h * (heights[0] + heights[1]) / total) {
								keyHandler({ which: 13 });		// enter
							} else if (e2.clientY >= h * (heights[0] + heights[1] + heights[2]) / total) {
								keyHandler({ which: 40 });		// down
							} else if (e2.clientX <= w / 2) {
								keyHandler({ which: 37 });		// left
							} else {
								keyHandler({ which: 39 });		// right
							}
						});
					});
				})();
			}
		})();

		document.addEventListener("keydown", keyHandler);

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
		window.addEventListener("blur", function() {
            if (_bossActive) {
                bossScreen(true);
            } else if (game) {
                game.pause();
            }
		});
		document.addEventListener("visibilitychange", function() {
			if (document.hidden) {
				if (_bossActive) {
					bossScreen(true);
				} else if (game) {
					game.pause();
				}
			}
		}, false);
		window.setInterval(refreshTime, 100);

		document.addEventListener("DOMContentLoaded", function() {
			var state = _readObject(_stateKey),
				lines = parseInt(state && state.baseLines) || parseInt(_params()["base"]) || 0,
				e = document.getElementById("initial-lines");

			[0, 4, 7, 10, 13].forEach(function(n) {
				var l = document.createElement("label"),
					i = document.createElement("input");

				i.setAttribute("type", "radio");
				i.setAttribute("name", "initial-lines");
				i.value = n;
				if (n === lines) {
					i.checked = true;
				}
				l.appendChild(i);
				l.appendChild(document.createTextNode(n.toLocaleString()));
				e.appendChild(l);
			});

			var bossColor = _params()["boss-color"] || _thisScript.getAttribute("boss-color");

			if (typeof bossColor !== "undefined") {
				_setStyle(".boss { background-color: " + bossColor + " !important; }");
			}

			var previews = Game.createPreviews();

			Array.from(document.getElementsByClassName("piece-stats")).forEach(function(item, i) {
				_clear(item);

				var table = document.createElement("table");

				table.classList.add("stat-table");

				previews.forEach(function(preview) {
					addTileClass(preview.preview);
					preview.preview.classList.add("preview");

					var row = document.createElement("tr"),
						cell = document.createElement("td");

					row.classList.add("stat-row");
					row.dataset["type"] = preview.name;

					cell.appendChild(preview.preview);
					row.appendChild(cell);

					cell = document.createElement("td");
					cell.classList.add("stat-value");

					row.appendChild(cell);
					table.appendChild(row);
				});
				item.appendChild(table);
			});

			previews = Game.createPreviews();

            var activePieces = previews.map(function(item) { return item.name; }),
                pieces = document.getElementById("pieces"),
                piecesTable = document.createElement("table"),
                piecesRow = document.createElement("tr");

            if (state && state.activePieces) {
                activePieces = state.activePieces;
            } else {
                var filter = _params()["pieces"];

                if (filter && filter.length) {
                    activePieces = filter.toUpperCase().split(/[^a-zA-Z0-9]+/);
                }
            }

            previews.forEach(function(preview) {
                var pieceCell = document.createElement("td"),
                    pieceLabel = document.createElement("label"),
                    pieceCheckBox = document.createElement("input");

                addTileClass(preview.preview);
                preview.preview.classList.add("preview");

                pieceCheckBox.setAttribute("type", "checkbox");
                pieceCheckBox.dataset.piece = preview.name;
                if (activePieces.includes(preview.name)) {
                    pieceCheckBox.checked = true;
                }
                pieceLabel.appendChild(pieceCheckBox);
                pieceLabel.appendChild(preview.preview);
                pieceCell.appendChild(pieceLabel);
                piecesRow.appendChild(pieceCell);
            });
            piecesTable.appendChild(piecesRow);
            pieces.appendChild(piecesTable);

			newGame(state, true);
		});
	})();
})();
