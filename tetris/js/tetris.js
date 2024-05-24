"use strict";

/*
	 1. show paused state
	 2. show base-cleared state
	 3. auto pause on hide / tab switch
	 4. boss key
	 5. line history
	 6. save / restore game
	 7. new game options (base lines)
	 8. rotation matrices
	 9. polish css
	10. mobile version
*/

(function() {
	var _stateKey = "tetris-game-state",
		_storageName = "session";

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

	var _debug = _param("debug");

	var Game;

	(function() {
		var constants = {
				get baseMoveTime() { return 500; },
				get boardHeight() { return 20; },
				get boardWidth() { return 10; },
				get linesPerLevel() { return 10; },
				get moveTimeStep() { return 50; },
				get padding() { return 8; },
				get randomTiles() { return 4; },
				get tileHeight() { return 30; },
				get tileWidth() { return 30; }
			},
			tetrominoes = {
				I: { name: "I", basePosition: [[0, 0], [0, 1], [0, 2], [0, 3]] },
				J: { name: "J", basePosition: [[0, 0], [0, 1], [0, 2], [1, 2]] },
				L: { name: "L", basePosition: [[0, 0], [0, 1], [0, 2], [1, 0]] },
				O: { name: "O", basePosition: [[0, 0], [0, 1], [1, 0], [1, 1]] },
				S: { name: "S", basePosition: [[1, 0], [1, 1], [0, 1], [0, 2]] },
				T: { name: "T", basePosition: [[0, 0], [0, 1], [0, 2], [1, 1]] },
				Z: { name: "Z", basePosition: [[0, 0], [0, 1], [1, 1], [1, 2]] }
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

			var tetromino = (type) ? tetrominoes[type] : _randomTetromino();

			className = tetromino.name;
			tiles = tetromino.basePosition;

			var centerTiles = function(t, width) {
				var currentXs = xs(t),
					x = Math.floor((width - _max(currentXs) - _min(currentXs) + 1) / 2) - 1;

				if (x) {
					t = t.map(function(tile) { return [tile[0], tile[1] + x]; });
				}
				return t;
			};

			tiles = centerTiles(tiles, constants.boardWidth);

			return {
				className: className,
				createPreview: function() {
					/* var canvas = document.createElement("canvas");

					canvas.setAttribute("width", constants.tileWidth * 4);
					canvas.setAttribute("height", constants.tileHeight * 4);

					var context = canvas.getContext("2d");

					context.strokeStyle = "gray"; */

					var initialTiles = centerTiles(tetrominoes[className].basePosition, 4);

					/* initialTiles.forEach(function(tile) {
						var rect = [
							tile[1] * constants.tileWidth,
							tile[0] * constants.tileHeight,
							constants.tileWidth,
							constants.tileHeight
						];

						context.fillRect.apply(context, rect);
						context.strokeRect.apply(context, rect);
					});

					return canvas.toDataURL(); */

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

						if (x > 0 && tiles.filter(function(tile) { return !t.isTileFree(tile[0], tile[1] - 1); }).length === 0) {
							tiles = tiles.map(function(tile) { return [tile[0], tile[1] - 1]; });
						}
					}
				},
				moveRight: function() {
					if (!locked) {
						var t = this,
							x = _max(xs());

						if (x < constants.boardWidth - 1 && tiles.filter(function(tile) { return !t.isTileFree(tile[0], tile[1] + 1); }).length === 0) {
							tiles = tiles.map(function(tile) { return [tile[0], tile[1] + 1]; });
						}
					}
				},
				rotate: function() {
					if (!locked) {
						var newRotation = (rotation + 1) % 4,
							rotatedTiles = tetromino.rotate(tiles, newRotation),
							newXs = xs(rotatedTiles),
							t = this;

						if (_min(newXs) >= 0 &&
							_max(newXs) < constants.boardWidth) {

							if (rotatedTiles.filter(function(newTile) {
								return newTile[0] >= 0 && !t.isTileFree.apply(this, newTile);
							}).length === 0) {
								rotation = newRotation;
								tiles = rotatedTiles;
							}
						}
					}
				},
				get rotation() { return rotation; },
				get tiles() { return tiles; }
			};
		};

		Game = function(board, options, ready, state) {
			var start,
				end,
				lastMove,
				level,
				levelMoveTime,
				lines,
				pieces,
				nextPiece,
				pieceStats = { },
				paused = options && options.paused,
				allTiles,
				baseTiles = 0,
				remainingBaseTiles = 0,
				piece,
				timer;

			Object.keys(tetrominoes).forEach(function(key) {
				var tetromino = tetrominoes[key];

				pieceStats[tetromino.name] = 0;
			});

			var k = function(row, column) {
				return row + "°" + column;
			}

			var checkStatus = function() {
				updateBoard();

				if (piece && piece.locked) {
					lastMove = Date.now();
					piece.tiles.forEach(function(tile, i) {
						if (piece.isTileVisible(i)) {
							var boardTile = getBoardTile.apply(this, tile);

							boardTile.className = piece.className;
							boardTile.locked = true;
						}
					});

					var tilesPerRow = Object.keys(allTiles)
						.map(key => allTiles[key])
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
							var n = 0;

							console.log(filledLines.length + " filled");
							filledLines.sort(function(a, b) { return b - a; });

							for (var i = filledLines[0]; i >= 0; i--) {
								while (filledLines.includes(i - n)) {
									console.log("line " + i + " is filled");
									n++;
								}
								console.log("moving row " + (i - n) + " to row " + i + " (" + n + " rows down)");
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
						})();
						if (Math.floor(lines / constants.linesPerLevel) !==
							Math.floor((lines + filledLines.length) / constants.linesPerLevel)) {

							level++;
							levelMoveTime = Math.max(constants.moveTimeStep, levelMoveTime - constants.moveTimeStep);
						}
						lines += filledLines.length;
						updateBoard();
					}

					getNextPiece();
					board.dispatchEvent(new Event("game.changed"));
					if (end) {
						board.dispatchEvent(new Event("game.lost"));
					}
				}

				_writeObject(_stateKey, (end) ? undefined : {
					//
					start: start
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
					var newPiece = new Tetromino();

					newPiece.findEmptyTiles = findEmptyTiles;
					newPiece.isTileFree = isTileFree;
					return newPiece;
				};

				if (!nextPiece) {
					nextPiece = createPiece();
				}
				piece = nextPiece;
				pieceStats[piece.className]++;
				pieces++;
				nextPiece = createPiece();
				updateBoard();
				if (nextPiece.tiles.filter(function(tile) {
					return !isTileFree.apply(this, tile);
				}).length > 0) {
					end = Date.now();
					updateBoard();
				}
			};

			var isTileFree = function(row, column) {
				return row < 0 || !getBoardTile(row, column).className;
			};

			var updateBoard = function() {
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
					classes.add(tile.className);
					if (tile.locked) {
						classes.add("locked");
					}
					if (tile.baseTile) {
						classes.add("base-tile");
					}
					if (piece) {
						(function() {
							var classSet;

							piece.tiles.forEach(function(pieceTile) {
								if (pieceTile[0] === tile.row && pieceTile[1] === tile.column) {
									classes.add(piece.className);
									classSet = true;
								}
							});

							if (options && options.shadow && !classSet) {
								var shadow = piece.getShadow();

								if (shadow) {
									shadow.forEach(function(shadowTile) {
										if (shadowTile[0] === tile.row && shadowTile[1] === tile.column) {
											classes.add("shadow");
										}
									});
								}
							}
						})();
					}
				});
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
							tile.classList.add("fade");
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

				if (options && options.lines > 0) {
					(function() {
						var m = Math.min(options.lines, constants.boardHeight - 4);
						for (var i = 0; i < m; i++) {
							var tilesPerRow = Object.keys(allTiles)
								.map(function(key) { return allTiles[key]; })
								.filter(function(tile) { return tile.row === constants.boardHeight - i - 1; });

							for (var j = 0; j < constants.randomTiles; j++) {
								var k = Math.floor(Math.random() * tilesPerRow.length);

								tilesPerRow[k].className = _randomTetromino().name;
								tilesPerRow[k].baseTile = true;
								tilesPerRow.splice(k, 1);
								baseTiles++;
								remainingBaseTiles++;
							}
						}
					})();
				}

				board.appendChild(levelContainer);

				level = 1;
				pieces = lines = 0;
				levelMoveTime = constants.baseMoveTime;
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
							board.dispatchEvent(new Event("game.changed"));
						}

						var now = Date.now();

						if (!lastMove || now - lastMove >= levelMoveTime) {
							if (lastMove) {
								piece.moveDown();
							}
							lastMove = now;
							checkStatus();
						}
					}
				}, 50);
			})();

			return {
				get baseLines() { return baseTiles / constants.randomTiles; },
				board: {
					get width() { return constants.boardWidth * constants.tileWidth; },
					get height() { return constants.boardHeight * constants.tileHeight; }
				},
				get constants() { return constants; },
				dropPiece: function() { if (!paused && !end && piece) { piece.drop(); checkStatus(); } },
				get end() { return end; },
				getNextPiecePreview: function() { if (nextPiece) { return nextPiece.createPreview(); } },
				get level() { return level; },
				get lines() { return lines; },
				movePieceDown: function() { if (!paused && !end && piece) { piece.moveDown(); checkStatus(); } },
				movePieceLeft: function() { if (!paused && !end && piece) { piece.moveLeft(); checkStatus(); } },
				movePieceRight: function() { if (!paused && !end && piece) { piece.moveRight(); checkStatus(); } },
				pause: function() { paused = true; },
				get paused() { return paused; },
				get pieces() { return pieces; },
				get pieceStats() { return pieceStats; },
				get remainingBaseLines() { return remainingBaseTiles / constants.randomTiles; },
				resume: function() { paused = false; },
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

		var checkGame = function(e) {
			if (refreshTime) {
				refreshTime();
			}

			Array.from(document.getElementsByClassName("level")).forEach(function(item, i) {
				item.innerText = (game) ? game.level : undefined;
			});
			Array.from(document.getElementsByClassName("lines")).forEach(function(item, i) {
				item.innerText = (game) ? game.lines : undefined;
			});
			Array.from(document.getElementsByClassName("pieces")).forEach(function(item, i) {
				item.innerText = (game) ? game.pieces : undefined;
			});
			Array.from(document.getElementsByClassName("base-lines")).forEach(function(item, i) {
				item.innerText = (game) ? (game.remainingBaseLines.toLocaleString() + "/" + game.baseLines.toLocaleString()) : undefined;
			});
			Array.from(document.getElementsByClassName("next-piece")).forEach(function(item, i) {
				var preview = (game) ? game.getNextPiecePreview() : undefined;

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

			if (game) {
				stats = game.pieceStats;

				Array.from(document.getElementsByClassName("piece-stats")).forEach(function(item) {
					/* stats = Object.keys(stats).map(function(key) {
						return [key, stats[key]];
					});
					stats.sort(function(a, b) {
						return b[1] - a[1];
					});
					stats = stats.map(function(stat) {
						return stat[0] + ": " + stat[1].toLocaleString();
					}).join("\n"); */

					Array.from(item.getElementsByClassName("stat-table")).forEach(function(table) {
						var rows = Array.from(table.getElementsByClassName("stat-row"));

						rows.forEach(function(row, j) {
							Array.from(row.getElementsByClassName("stat-value")).forEach(function(cell, k) {
								cell.innerText = stats[row.dataset.type];
							});
						});

						rows.sort(function(a, b) {
							return stats[b.dataset.type] - stats[a.dataset.type];
						});
						rows.forEach(function(row) {
							table.appendChild(row);
						});
					});
				});
			}
		};

		var hideMessage = function() {
			_hide(message);
			_hide(menu);
			_hide(document.getElementById("messageBackdrop"));
		};

		var newGame = function(state, paused) {
			if (game) {
				game.stop();
				game = undefined;
				board.removeEventListener("game.changed", checkGame);
			}

			game = new Game(board, {
					lines: _params()["base"] || 0,
					paused: paused,
					shadow: _param("shadow")
				}, function() {
				board.addEventListener("game.changed", checkGame);
				setTimeout(function() {
					resizer();
					checkGame();
				});
			}, state);
		};

		var pauseGame = function() {
			if (game) {
				if (game.paused) {
					game.resume();
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
			Array.from(document.getElementsByClassName("time")).forEach(function(item, i) {
				item.innerText = text + elapsed;
			});
		};

		var showMessage = function(messageText, type) {
			if (game) {
				game.pause();
			}
			document.getElementById("messageText").innerText = messageText;
			_show(document.getElementById("messageBackdrop"));
			_show(message);
		};

		(function() {
			board.addEventListener("game.changed", checkGame);
			board.addEventListener("game.won", function() { showMessage(document.getElementById("wonMessage").value); });
			board.addEventListener("game.lost", function() { showMessage(document.getElementById("lostMessage").value); });
			board.addEventListener("game.wrong", function() { showMessage(document.getElementById("wrongGameMessage").value); });

			_bindClickByClassName(status, "newGame", askNewGame);
			_bindClickByClassName(status, "pauseGame", pauseGame);

			document.getElementById("messageBackdrop").addEventListener("click", function(e) {
				hideMessage();
			});
			_bindClickByTagName(message, "button", hideMessage);
			_bindClickByClassName(message, "newGame", function() { newGame(); });

			_bindClickByTagName(menu, "button", hideMessage);
		})();

		document.addEventListener("keydown", function(e) {
			switch (e.which) {
				case 13:				/* Enter */
					if (_isVisible(message)) {
						hideMessage();
						newGame();
					} else if (game) {
						game.dropPiece();
					}
					break;
				case 19:				/* Pause */
				case 80:				/* P */
					pauseGame();
					break;
				case 27:				/* Escape */
					if (_isVisible(message)) {
						hideMessage();
					} else {
						pauseGame();
					}
					break;
				case 32:				/* Space */
					if (game) {
						game.dropPiece();
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
				case 71:				/* G */
					showMessage(new Date().toLocaleString());
					break;
				case 113:				/* F2 */
					askNewGame();
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

		document.addEventListener("DOMContentLoaded", function() {
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
			newGame(_readObject(_stateKey), true);
		});
	})();
})();
