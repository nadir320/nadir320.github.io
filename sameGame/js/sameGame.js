"use strict";

(function() {
	var _stateKey = "same-game-state",
		_storageName = "session",
		_styleID = "same-game-style";

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

	var _clone = function(o) {
		var clone = { };

		Object.keys(o).forEach(function(name) {
			clone[name] = o[name];
		});
		return clone;
	};

	var _getKey = function() {
		return Array.from((arguments.length === 1) ? arguments[0] : arguments).join("_");
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

	var _setClass = function(element, className, condition) {
		if (condition) {
			if (!element.classList.contains(className)) {
				element.classList.add(className);
			}
		} else if (element.classList.contains(className)) {
			element.classList.remove(className);
		}
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

	var _debug = _param("debug");

	var Game;

	(function() {
		var constants = {
			get boardWidth() { return 16; },
			get boardHeight() { return 10; },
			get colors() { return 5; },
			getBombsPerLevel: function(level) {
				return ((level === 1) ? 3 : 2);
			},
			get levels() { return 7; },
			get padding() { return 8; },
			get singleTileAdjustFactor() { return 3 / 4; },
			get tileAdjustFactor() { return 2 / 3; },
			get tileWidth() { return 40; },
			get tileHeight() { return 40; }
		};

		var _adjustSingleTiles = function(tileSet) {
			var i,
				lastTilePerColor = Array(constants.colors),
				tilesPerColor = Array(constants.colors);

			Object.keys(tileSet)
				.map(function(key) { return tileSet[key]; })
				.forEach(function(tile) {
					if (_isTileSingle(tileSet, tile)) {
						if (Math.random() <= constants.singleTileAdjustFactor) {
							var color = _getColorIndexFromRandomSibling(tileSet, tile);
							
							if (color >= 0 && color != tile.color) {
								tile.adjusted = true;
								tile.color = color;
							}
						}
					}
					lastTilePerColor[tile.color] = tile;
					tilesPerColor[tile.color]++;
				});

			for (i = 0; i < tilesPerColor.Length; i++) {
				if (tilesPerColor[i] == 0) {
					if (constants.boardWidth * constants.boardHeight >= tilesPerColor.Length * tilesPerColor.length) {
						return false;
					}
				} else if (tilesPerColor[i] == 1) {
					lastTilePerColor[i].color = _getColorIndexFromRandomSibling(tileSet, lastTilePerColor[i]);
				}
			}
			return true;
		};

		var _createTiles = function(level) {
			var tileSet;

			while (!_adjustSingleTiles(tileSet = _getTiles(level))) { }
			return tileSet;
		};

		var _getBlock = function(tileSet, startingTile) {
			var block = { },
				scan;

			(scan = function(tile) {
				var key = _getKey(tile.x, tile.y);

				if (typeof block[key] === "undefined") {
					block[key] = tile;

					_getSiblings(tileSet, tile).filter(function(sibling) {
						return sibling.color === tile.color;
					}).forEach(scan);
				}
			})(startingTile);

			return Object.keys(block).map(function(key) {
				return block[key];
			});
		};

		var _getColorIndexFromRandomSibling = function(tileSet, startingTile) {
			var siblings = _getSiblings(tileSet, startingTile);

			return siblings.length && siblings[Math.floor(Math.random() * siblings.length)].color;
		};

		var _getSiblings = function(tileSet, startingTile) {
			return [
				[startingTile.x, startingTile.y - 1],	// Up
				[startingTile.x - 1, startingTile.y],	// Left
				[startingTile.x + 1, startingTile.y],	// Right
				[startingTile.x, startingTile.y + 1]	// Down
			].map(function(xy) {
				return tileSet[_getKey(xy[0], xy[1])];
			}).filter(function(x) { return !!x; });
		};

		var _isTileSingle = function(tileSet, tile) {
			return _getBlock(tileSet, tile).length === 1;
		};

		var _getTiles = function(level) {
			var n = 0,
				tileSet = { };

			for (var i = 0; i < constants.boardWidth; i++) {
				for (var j = 0; j < constants.boardHeight; j++) {
					tileSet[_getKey(i, j)] = {
						n: n++,
						x: i,
						y: j,
						color: Math.floor(Math.random() * constants.colors),
					};
				}
			}
			Object.keys(tileSet)
				.map(function(key) { return tileSet[key]; })
				.forEach(function(tile) {
					if (Math.random() <= constants.tileAdjustFactor * (constants.levels + 1 - level) / constants.levels) {
						var color = _getColorIndexFromRandomSibling(tileSet, tile);

						if (color >= 0 && color != tile.color) {
							tile.adjusted = true;
							tile.color = color;
						}
					}
				});
			return tileSet;
		};

		Game = function(board, options, ready, state) {
			var availableMoves = 0,
				bomb = false,
				bombs,
				end,
				history,
				inPressedBlock,
				level,
				pressedBlock,
				start,
				tileSet,
				visibleTiles;

			(function() {
				var rules = [ ];

				rules.push(".scaler .level { font-size: " + Math.floor(constants.boardHeight * constants.tileHeight * 0.8).toString() + "pt}");

				rules.push(".tile { font-size: " + Math.floor(constants.tileHeight * 0.4).toString() + "pt; left: " + constants.padding + "px; top: " + constants.padding + "px;" +
					" width: " + constants.tileWidth + "px; height: " + constants.tileHeight + "px}");

				for (var i = 0; i < constants.boardWidth; i++) {
					rules.push(".column-" + (i + 1).toString() + " { left: " + (i * constants.tileWidth + constants.padding).toString() + "px }");
				}
				for (var i = 0; i < constants.boardHeight; i++) {
					rules.push(".row-" + (i + 1).toString() + " { top: " + (i * constants.tileHeight + constants.padding).toString() + "px }");
				}

				_setStyle(rules.join("\n"), _styleID);
			})();

			var checkStatus = function(followUp) {
				var checkedTiles = { },
					tileCount = { };

				visibleTiles = 0;

				var moves = Object.keys(tileSet)
					.filter(function(key) {
						var tile = tileSet[key];

						visibleTiles++;

						if (typeof checkedTiles[key] === "undefined") {
							checkedTiles[key] = true;

							if (typeof tileCount[tile.color] === "undefined") {
								tileCount[tile.color] = 0;
							}
							tileCount[tile.color]++;

							var block = getBlock(tile);

							block.slice(1).forEach(function(t) {
								checkedTiles[_getKey(t.x, t.y)] = true;
								tileCount[t.color]++;
							});
							return block.length > 1;
						}
					});

				availableMoves = moves.length;

				var singleTileCount = Object.keys(tileCount)
					.map(function(key) {
						return tileCount[key];
					}).filter(function(count) {
						return count === 1;
					}).length,
					hasMoves = singleTileCount <= bombs;

				if (bombs <= 0) {
					hasMoves &= availableMoves > 0;
				}

				board.dispatchEvent(new Event("game.changed"));
				if (board.getElementsByClassName("tile").length === board.getElementsByClassName("hidden").length) {
					if (!end) {
						if (level < constants.levels) {
							setTimeout(function() {
								tileSet = _createTiles(++level);
								resetBombs();
								history.splice(0, history.length);
								updateBoard(true);
								checkStatus();
							}, 2e2);
						} else {
							end = Date.now();
							board.dispatchEvent(new Event("game.won"));
						}
					}
				} else if (board.querySelector(".tile.fatal") || !hasMoves) {
					if (!end) {
						end = Date.now();
						/* if (start) { */
							board.dispatchEvent(new Event("game.lost"));
						/* } */
					}
				}

				_writeObject(_stateKey, (end) ? undefined : {
					bombs: bombs,
					history: history,
					level: level,
					start: start,
					tileSet: tileSet
				});

				if (followUp !== false) {
					if (bombs > 0 && singleTileCount > 0 && Object.keys(tileCount)
						.map(function(key) {
							return tileCount[key];
						}).filter(function(count) {
							return count > 1;
						}).length <= 1) {

						window.setTimeout(function() {
							for (var colorKey in tileCount) {
								if (tileCount[colorKey] === 1) {
									var color = parseInt(colorKey);

									for (var key in tileSet) {
										var tile = tileSet[key];

										if (tile.color === color) {
											bomb = true;
											removeTiles([tile]);
											updateBoard();
											checkStatus(true);
											break;
										}
									}
									break;
								}
							}
						});
					} else if (followUp && Object.keys(tileCount).length === 1) {
						window.setTimeout(function() {
							removeTiles(getBlock(moves.map(function(key) { return tileSet[key]; }).pop()));
							updateBoard();
							checkStatus();
						});
					}
				}
			};

			var getBlock = function(startingTile) {
				return _getBlock(tileSet, startingTile);
			};

			var removeTiles = function(block) {
				var blockByKey = { },
					moves = { },
					addMove = function(key, x, y) {
						var move = moves[key];

						if (typeof move === "undefined") {
							moves[key] = move = {
								key: key,
								x: x,
								y: y,
								xSteps: 0,
								ySteps: 0
							};
						}
						return move;
					};

				block.forEach(function(item) {
					blockByKey[_getKey(item.x, item.y)] = item;
				});

				block.forEach(function(item) {
					var key,
						tile;

					for (var i = item.y - 1; i >= 0; i--) {
						tile = tileSet[key = _getKey(item.x, i)];

						if (tile && typeof blockByKey[key] === "undefined") {
							addMove(key, tile.x, tile.y).ySteps++;
						}
					}
				});

				var columns = Array.from(Array(constants.boardWidth)).map(function(_) { return false; }),
					newKeys = Object.keys(tileSet)
						.filter(function(key) { return typeof blockByKey[key] === "undefined"; });

				newKeys.forEach(function(key) {
					columns[tileSet[key].x] = true;
				});

				(function() {
					var n = 0;

					columns = columns.map(function(value) {
						if (!value) {
							n++;
						}
						return n;
					});
				})();

				newKeys.forEach(function(key) {
					var tile = tileSet[key],
						n = columns[tile.x];

					if (n > 0) {
						addMove(key, tile.x, tile.y).xSteps -= n;
					}
				});

				var newTiles = { },
					oldTiles = {
						bomb: bomb
					};

				Object.keys(tileSet).forEach(function(key) {
					oldTiles[key] = _clone(tileSet[key]);
				});
				history.push(oldTiles);

				newKeys.forEach(function(key) {
					var tile = tileSet[key],
						move = moves[key];

					if (typeof move !== "undefined") {
						tile.x += move.xSteps;
						tile.y += move.ySteps;
						newTiles[_getKey(tile.x, tile.y)] = tile;
					} else {
						newTiles[key] = tile;
					}
				});
				tileSet = newTiles;
				if (bomb) {
					bombs--;
					bomb = false;
				}
			};

			var resetBombs = function() {
				if (!(options && options.noBomb)) {
					bombs = constants.getBombsPerLevel(level);
				} else {
					bombs = 0;
				}
			};

			var updateBoard = function(reset) {
				var blocks = { },
					colorClasses = [ ],
					columnClasses = [ ],
					rowClasses = [ ],
					tilesByIndex = [ ],
					tilesPerColor = Array.from(Array(constants.colors))
						.map(function(_) { return 0; }),
					i;

				Object.keys(tileSet)
					.forEach(function(key) {
						var tile = tileSet[key];

						tilesByIndex[tile.n] = tile;
						tilesPerColor[tile.color]++;
						if (typeof blocks[key] === "undefined") {
							var block = getBlock(tile);

							block.forEach(function(t) {
								blocks[_getKey(t.x, t.y)] = block.length;
							});
						}
					});

				for (i = 0; i < constants.colors; i++) {
					colorClasses.push("color-" + (i + 1).toString());
				}
				for (i = 0; i < constants.boardWidth; i++) {
					columnClasses.push("column-" + (i + 1).toString());
				}
				for (i = 0; i < constants.boardHeight; i++) {
					rowClasses.push("row-" + (i + 1).toString());
				}

				Array.from(board.getElementsByClassName("tile")).forEach(function(tileElement) {
					var tile = tilesByIndex[parseInt(tileElement.dataset.n)];

					_setClass(tileElement, "move", tile);
					(tile ? _show : _hide)(tileElement);

					if (tile) {
						var columnClassName = "column-" + (tile.x + 1).toString(),
							rowClassName = "row-" + (tile.y + 1).toString();

						columnClasses.forEach(function(className) {
							_setClass(tileElement, className, className === columnClassName);
						});
						rowClasses.forEach(function(className) {
							_setClass(tileElement, className, className === rowClassName);
						});

						if (reset) {
							tileElement.classList.remove("move");

							var colorClassName = "color-" + (tile.color + 1).toString();

							colorClasses.forEach(function(className) {
								_setClass(tileElement, className, className === colorClassName);
							});
						}
						_setClass(tileElement, "adjusted", tile.adjusted);

						_setClass(tileElement, "pressed", inPressedBlock && pressedBlock && pressedBlock.filter(function(t) {
							return t.x === tile.x && t.y === tile.y;
						}).length > 0);

						var blockSize = blocks[_getKey(tile.x, tile.y)];

						tileElement.innerText = (blockSize > 1 && !bomb) ? blockSize.toLocaleString() : "";
						_setClass(tileElement, "last", blockSize === 1 && tilesPerColor[tile.color] === 1);
					}
				});
				if (reset) {
					window.setTimeout(function() {
						Array.from(board.getElementsByClassName("tile")).forEach(function(tileElement) {
							tileElement.classList.add("move");
						});
					}, 500);
				}
			};

			(function() {
				try {
					Array.from(board.childNodes).forEach(function(node) {
						node.parentElement.removeChild(node);
					});

					board.style.padding = constants.padding + "px";
					board.style.width = (constants.tileWidth * constants.boardWidth + 2 * constants.padding) + "px";
					board.style.height = (constants.tileHeight * constants.boardHeight + 2 * constants.padding) + "px";

					if (state) {
						bombs = state.bombs;
						history = state.history;
						level = state.level;
						start = state.start;
						tileSet = state.tileSet;
					} else {
						level = 1;
						resetBombs();
						history = [ ];
					}

					(function() {
						var getTileBlock = function(e) {
							var n = parseInt(e.srcElement.dataset.n),
								tile = Object.keys(tileSet)
									.map(function(key) { return tileSet[key]; })
									.filter(function(item) { return item.n === n; }).pop();

							return getBlock(tileSet[_getKey(tile.x, tile.y)]);
						};

						Object.keys(tileSet = tileSet || _createTiles(level))
							.map(function(key) { return tileSet[key]; })
							.forEach(function(item) {
								var tile = document.createElement("div");

								tile.classList.add("tile");
								tile.classList.add("fade");
								tile.classList.add("move");
								tile.dataset.n = item.n;

								tile.addEventListener("mousedown", function(e) {
									if (e.which === 1) {
										var block = getTileBlock(e),
											onBomb = bomb || e.shiftKey;

										if (onBomb || block.length > 1) {
											pressedBlock = (onBomb) ? [block[0]] : block;
											inPressedBlock = true;
											updateBoard();
										}
									}
								});
								tile.addEventListener("mousemove", function(e) {
									if (e.which === 1) {
										var currentTile = getTileBlock(e)[0];

										var newValue = pressedBlock && pressedBlock.filter(function(t) {
											return t.x === currentTile.x && t.y === currentTile.y;
										}).length > 0;

										if (newValue !== inPressedBlock) {
											inPressedBlock = newValue;
											updateBoard();
										}
									}
								});
								tile.addEventListener("mouseout", function(e) {
									if (e.which === 1) {
										if (inPressedBlock && !document.elementFromPoint(e.clientX, e.clientY).classList.contains("tile")) {
											inPressedBlock = false;
											updateBoard();
										}
									}
								});
								tile.addEventListener("mouseup", function(e) {
									if (e.which === 1) {
										var block = getTileBlock(e),
											currentTile = block[0];

										if (pressedBlock && pressedBlock.filter(function(t) {
											return t.x === currentTile.x && t.y === currentTile.y;
										}).length > 0) {
											if (pressedBlock.length === 1) {
												bomb = true;
											}
											removeTiles(pressedBlock);
											if (!start) {
												start = Date.now();
											}
										}
										pressedBlock = undefined;
										inPressedBlock = false;
										updateBoard();
										checkStatus();
									}
								});

								board.appendChild(tile);
							});
						updateBoard(true);
						checkStatus();
					})();

					if (ready) {
						ready();
					}
				} catch (e) {
					board.dispatchEvent(new Event("game.wrong"));
				}
			})();

			return {
				get availableMoves() { return availableMoves; },
				get bomb() { return bomb; },
				set bomb(value) { bomb = value; },
				get bombs() { return bombs; },
				board: {
					get width() { return constants.boardWidth * constants.tileWidth; },
					get height() { return constants.boardHeight * constants.tileHeight; }
				},
				get constants() { return constants; },
				get end() { return end; },
				get level() { return level; },
				get history() { return history; },
				get start() { return start; },
				undo: function(all) {
					if (history.length) {
						if (all) {
							tileSet = history[0];
							history.splice(0, history.length);
							resetBombs();
						} else {
							tileSet = history.pop();
							if (tileSet.bomb) {
								bombs++;
							}
							delete tileSet.bomb;
						}
						end = undefined;
						updateBoard(true);
						checkStatus(false);
					}
				},
				get visibleTiles() { return visibleTiles; }
			};
		};
	})();

	(function() {
		var BossIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
			BossTitle = decodeURIComponent("%E3%85%A4");

		var board = document.querySelector(".board"),
			message = document.getElementById("message"),
			scaler = document.querySelector(".scaler"),
			status = document.querySelector(".status");

		(function() {
			if (typeof window.ShadowRoot === "undefined") {
				message.classList.add("compatible");
			}
			if (_param("animate")) {
				document.querySelector("body").classList.add("animate");
			}
		})();

		var boss, bossActive, game, icon, large, noBomb, resizer, title;

		var askNewGame = function() {
			if (!_isVisible(message)) {
				if (game && game.history.length) {
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

		var bossScreen = function(value) {
			Array.from(document.getElementsByClassName("boss")).forEach(function(item, i) {
				((value) ? _show : _hide)(item);
			});

			if (boss !== value) {
				var iconElement = document.querySelector("[rel='shortcut icon']");

				if (boss = value) {
					title = document.title;
					document.title = BossTitle;
					if (iconElement) {
						icon = iconElement.getAttribute("href");
						iconElement.setAttribute("href", BossIcon);
					}
				} else {
					document.title = title;
					if (iconElement) {
						iconElement.setAttribute("href", icon);
					}
				}
			}
		};

		var checkGame = function(e) {
			if (refreshTime) {
				refreshTime();
			}

			Array.from(document.getElementsByClassName("level")).forEach(function(item, i) {
				item.innerText = (game) ? game.level : undefined;
			});
			Array.from(document.getElementsByClassName("bombs")).forEach(function(item, i) {
				item.innerText = (game) ? game.bombs : undefined;
				_setClass(item, "active", game && game.bomb);
				if (game && game.bombs > 0) {
					item.removeAttribute("disabled");
				} else {
					item.setAttribute("disabled", "disabled");
				}
			});
			Array.from(document.getElementsByClassName("moves")).forEach(function(item, i) {
				item.innerText = (game) ? game.availableMoves : undefined;
			});
			Array.from(document.getElementsByClassName("remaining")).forEach(function(item, i) {
				item.innerText = (game) ? game.visibleTiles : undefined;
			});
			Array.from(document.querySelectorAll(".undo, .restart")).forEach(function(item, i) {
				if (game && game.history.length) {
					item.removeAttribute("disabled");
				} else {
					item.setAttribute("disabled", "disabled");
				}
			});
		};

		var hideMessage = function() {
			_hide(message);
			_hide(document.getElementById("messageBackdrop"));
		};

		var newGame = function(state) {
			if (game) {
				game = undefined;
				board.removeEventListener("game.changed", checkGame);
			}

			game = new Game(board, {
				noBomb: noBomb
			}, function() {
				board.addEventListener("game.changed", checkGame);
				setTimeout(function() {
					resizer();
					checkGame();
				});
			}, state);
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
			hideMessage();
		};

		var showMessage = function(messageText, type) {
			if (!boss) {
				document.getElementById("messageText").innerText = messageText;
				_show(document.getElementById("messageBackdrop"));
				_show(message);
			}
		};

		var undo = function(all) {
			game.undo(all);
			checkGame();
		};

		(function() {
			board.addEventListener("game.changed", checkGame);
			board.addEventListener("game.won", function() { showMessage(document.getElementById("wonMessage").value); });
			board.addEventListener("game.lost", function() { showMessage(document.getElementById("lostMessage").value); });
			board.addEventListener("game.wrong", function() { showMessage(document.getElementById("wrongGameMessage").value); });

			_bindClickByClassName(status, "newGame", askNewGame);
			_bindClickByClassName(status, "undo", function() { undo(); });
			_bindClickByClassName(status, "restart", askRestart);
			_bindClickByClassName(status, "bombs", function(e) {
				if (game && game.bombs > 0) {
					game.bomb = !game.bomb;
					checkGame();
				}
			});

			document.getElementById("messageBackdrop").addEventListener("click", function(e) {
				hideMessage();
			});
			_bindClickByTagName(message, "button", hideMessage);
			_bindClickByClassName(message, "newGame", function() { newGame(); });
			_bindClickByClassName(message, "restart", restart);

			/* _bindClickByClassName(document, "boss", function() { bossScreen(false); }); */

			bossActive = _param("boss") || !!parseInt(_thisScript.getAttribute("boss"));

			var bossColor = _params()["boss-color"] || _thisScript.getAttribute("boss-color");

			if (typeof bossColor !== "undefined") {
				_setStyle(".boss { background-color: " + bossColor + " !important; }");
			}

			var version = _params()["version"] || _thisScript.getAttribute("version");

			if (version) {
				Array.from(document.getElementsByClassName("version")).forEach(function(item) {
					item.innerText = version;
				});
			}

			var palette = parseInt(_params()["palette"] || _thisScript.getAttribute("palette")) || 0;

			Array.from(document.getElementsByClassName("board")).forEach(function(item) {
				item.classList.add("palette-" + palette.toString());
			});

			_setClass(document.body, "no-bomb", noBomb = _param("no-bomb") || !!parseInt(_thisScript.getAttribute("no-bomb")));
			large = _param("large") || !!parseInt(_thisScript.getAttribute("large"))
		})();

		document.addEventListener("keydown", function(e) {
			switch (e.which) {
				case 13:				/* Enter */
					if (_isVisible(message)) {
						message.getElementsByTagName("button")[0].click();
					}
					break;
				case 27:				/* Escape */
					if (!boss && _isVisible(message)) {
						hideMessage();
					} else if (bossActive && !boss) {
						bossScreen(true);
					}
					break;
				case 66:				/* B */
					if (e.ctrlKey) {
						if (game && game.bombs > 0) {
							game.bomb = !game.bomb;
							checkGame();
						}
					} else {
						bossScreen(!boss);
					}
					break;
				case 68:				/* D */
					showMessage(new Date().toLocaleString());
					break;
				case 90:				/* Z */
					if (e.ctrlKey) {
						if (!_isVisible(message)) {
							undo();
						}
					}
					break;
				case 113:				/* F2 */
					if (!_isVisible(message)) {
						askNewGame();
					}
					break;
				case 221:				/* ^ */
					if (e.ctrlKey) {
						if (!_isVisible(message)) {
							undo(true);
						}
					}
					break;
				default:
					/* console.info(e.which); */
					break;
			}
		});

		(resizer = function() {
			if (game) {
				var x = ((window.innerWidth - 16 * 16) - 2 * game.constants.padding) / game.board.width,
					y = (window.innerHeight - 2 * game.constants.padding) / game.board.height,
					z = 1;

				if (board.clientHeight) {
					if (x < 1 || y < 1) {
						z = Math.min(x, y);
					} else if (!large) {
						if ((window.getComputedStyle(document.body).getPropertyValue("--screen") || "").match(/large/i)) {
							z /= 2;
						}
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
		if (bossActive) {
			window.addEventListener("blur", function() {
				bossScreen(true);
			});
			document.addEventListener("visibilitychange", function() {
				if (document.hidden) {
					bossScreen(true);
				}
			}, false);
		}
		window.setInterval(refreshTime, 100);

		document.addEventListener("DOMContentLoaded", function() {
			newGame(_readObject(_stateKey));
		});
	})();
})();
