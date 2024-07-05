"use strict";

/*
	~ animations
	- smart grid generation
	- history
	- state preserval
	- bombs
	- auto bombs
	- game modes?
*/

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
			get colors() { return 5/5*3; },
			get levels() { return 7; },
			get padding() { return 8; },
			get tileWidth() { return 40; },
			get tileHeight() { return 40; }
		};

		Game = function(board, ready, state) {
			var availableMoves = 0,
				bombs,
				end,
				history = [ ],
				inPressedBlock,
				level,
				pressedBlock,
				start,
				tileSet,
				visibleTiles;

			(function() {
				var rules = [ ];

				rules.push(".tile { width: " + constants.tileWidth + "px; height: " + constants.tileHeight + "px}");

				for (var i = 0; i < constants.boardWidth; i++) {
					rules.push(".column-" + i.toString() + " { left: " + (i * constants.tileWidth + constants.padding).toString() + "px }");
				}
				for (var i = 0; i < constants.boardHeight; i++) {
					rules.push(".row-" + i.toString() + " { top: " + (i * constants.tileHeight + constants.padding).toString() + "px }");
				}

				_setStyle(rules.join("\n"), _styleID);
			})();

			var checkStatus = function() {
				var checkedTiles = { },
					tileCount = { };

				visibleTiles = 0;

				availableMoves = tileSet.filter(function(tile) {
					if (tile.visible) {
						visibleTiles++;

						var key = _getKey(tile.x, tile.y);

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
					}
				}).length;

				var hasMoves = Object.keys(tileCount).map(function(key) {
					return tileCount[key];
				}).filter(function(count) {
					return count === 1;
				}).length <= bombs;

				if (bombs <= 0) {
					hasMoves &= availableMoves > 0;
				}

				board.dispatchEvent(new Event("game.changed"));
				if (board.getElementsByClassName("tile").length === board.getElementsByClassName("hidden").length) {
					if (!end) {
						if (level < constants.levels) {
							setTimeout(function() {
								tileSet = getTiles(++level);
								bombs = getBombsPerLevel(level, bombs);
								updateBoard();
								checkStatus();
							});
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
					/* hintIndex: hintIndex,
					history: history.map(function(entry, i) {
						return entry.map(function(item, j) {
							return parseInt(item.dataset.index);
						});
					}),
					start: start,
					tileSet: tileSet,
					tilesPerType: tilesPerType */
				});
			};

			var getBlock = function(startingTile) {
				var block = { },
					scan;

				(scan = function(t) {
					if (t.visible) {
						var k = _getKey(t.x, t.y);

						if (typeof block[k] === "undefined") {
							block[k] = t;

							getSiblings(t).filter(function(s) {
								return s.color === t.color;
							}).forEach(scan);
						}
					}
				})(startingTile);

				return Object.keys(block).map(function(key) {
					return block[key];
				});
			};

			var getBombsPerLevel = function(level, bombs) {
				return (level === 1) ? 3 : 2;
			}

			var getSiblings = function(startingTile) {
				return [
					[startingTile.x, startingTile.y - 1],	// Up
					[startingTile.x - 1, startingTile.y],	// Left
					[startingTile.x + 1, startingTile.y],	// Right
					[startingTile.x, startingTile.y + 1]	// Down
				].map(function(xy) {
					return tileSet.filter(function(item) {
						return item.x === xy[0] && item.y === xy[1];
					}).pop();
				}).filter(function(x) { return !!x; });
			};

			var getTiles = function(level) {
				var t = [ ];

				for (var i = 0; i < constants.boardWidth; i++) {
					for (var j = 0; j < constants.boardHeight; j++) {
						t.push({
							x: i,
							y: j,
							color: Math.floor(Math.random() * constants.colors),
							visible: true
						});
					}
				}
				return t;
			};

			var moveTiles = function() {
				var columns = [ ];

				tileSet.forEach(function(tile) {
					var column = tile.x;

					if (typeof columns[column] === "undefined") {
						columns[column] = [ ];
					}
					columns[column][tile.y] = tile;
				});

				var moves = [ ];

				columns.forEach(function(column) {
					var h = column.filter(function(tile) {
						return !tile.visible;
					});

					if (h.length && h.length < column.length) {
						column.forEach(function(tile) {
							if (tile.visible) {
								var steps = h.filter(function(hT) {
									return hT.y > tile.y;
								}).length;

								if (steps) {
									moves.push({
										column,
										tile,
										steps
									});
								}
							}
						});
						return true;
					}
				});

				if (moves.length) {
					moves.sort(function(a, b) {
						return b.tile.y - a.tile.y;
					});
					moves.forEach(function(move) {
						move.column[move.tile.y + move.steps].color = move.tile.color;
						move.column[move.tile.y + move.steps].visible = true;
						move.tile.visible = false;
					});
				}

				var emptyColumns = columns.map(function(column, i) {
					return {
						column,
						i
					};
				}).filter(function(column) {
					return column.column.filter(function(tile) {
						return tile.visible;
					}).length === 0;
				});

				if (emptyColumns.length) {
					moves = [ ];
					columns.forEach(function(column, i) {
						var steps = emptyColumns.filter(function(eC) {
							return eC.i < i;
						}).length;

						if (steps) {
							moves.push({
								column,
								i,
								steps
							});
						}
					});
					if (moves.length) {
						moves.sort(function(a, b) {
							return a.i - b.i;
						});
						moves.forEach(function(move) {
							move.column.forEach(function(tile) {
								columns[move.i - move.steps][tile.y].color = tile.color;
								columns[move.i - move.steps][tile.y].visible = tile.visible;
								tile.visible = false;
							});
						});
					}
				}
			};

			var updateBoard = function() {
				var blocks = { },
					classes = [ ],
					i;

				tileSet.forEach(function(tile) {
					if (tile.visible) {
						var key = _getKey(tile.x, tile.y);

						if (typeof blocks[key] === "undefined") {
							var block = getBlock(tile);

							if (block.length > 1) {
								block.forEach(function(t) {
									blocks[_getKey(t.x, t.y)] = block.length;
								});
							}
						}
					}
				});
				for (i = 0; i < constants.colors; i++) {
					classes.push("color-" + (i + 1).toString());
				}
				Array.from(board.getElementsByClassName("tile")).forEach(function(tile) {
					var x = parseInt(tile.dataset.x),
						y = parseInt(tile.dataset.y);

					for (i = 0; i < classes.length; i++) {
						tile.classList.remove(classes[i]);
					}
					tile.classList.add("color-" + (tileSet.filter(function(item) {
						if (item.x === x && item.y === y) {
							(item.visible ? _show : _hide)(tile);
							return true;
						}
					}).pop().color + 1).toString());

					tile.innerText = blocks[_getKey(x, y)] || "";

					tile.classList[(inPressedBlock && pressedBlock && pressedBlock.filter(function(t) {
						return t.x === x && t.y === y;
					}).length > 0) ? "add" : "remove"]("pressed");
				});
			};

			(function() {
				try {
					Array.from(board.childNodes).forEach(function(node) {
						node.parentElement.removeChild(node);
					});

					board.style.padding = constants.padding + "px";
					board.style.width = (constants.tileWidth * constants.boardWidth + 2 * constants.padding) + "px";
					board.style.height = (constants.tileHeight * constants.boardHeight + 2 * constants.padding) + "px";

					if (state && state.start) {
						bombs = state.bombs;
						level = state.level;
						start = state.start;
					} else {
						bombs = getBombsPerLevel(level = 1, 0);
					}

					(function() {
						(tileSet = getTiles(level)).forEach(function(item) {
							var getTileBlock = function() {
								return getBlock(tileSet.filter(function(t) {
									return t.x === item.x && t.y === item.y;
								}).pop());
							}, tile = document.createElement("div");

							tile.classList.add("tile");
							tile.classList.add("fade");
							tile.dataset.x = item.x;
							tile.dataset.y = item.y;
							tile.classList.add("column-" + item.x.toString());
							tile.classList.add("row-" + item.y.toString());

							tile.addEventListener("mousedown", function(e) {
								if (e.which === 1) {
									var block = getTileBlock();

									if (block.length > 1) {
										pressedBlock = block;
										inPressedBlock = true;
										updateBoard();
									}
								}
							});
							tile.addEventListener("mousemove", function(e) {
								if (e.which === 1) {
									var currentTile = getTileBlock()[0];

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
									var block = getTileBlock(),
										currentTile = block[0];

									if (pressedBlock && pressedBlock.filter(function(t) {
										return t.x === currentTile.x && t.y === currentTile.y;
									}).length > 0) {
										block.forEach(function(b) {
											b.visible = false;
										});
										moveTiles();
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
						updateBoard();
						checkStatus();
					})();

					/* if (state && state.history && state.history.length) {
						history = state.history.map(function(entry, i) {
							return entry.map(function(index, j) {
								var item = board.querySelector("[data-index='" + index + "']");

								_hide(item);
								return item;
							});
						});
						checkStatus();
					} */

					if (ready) {
						ready();
					}
				} catch (e) {
					board.dispatchEvent(new Event("game.wrong"));
				}
			})();

			return {
				get availableMoves() { return availableMoves; },
				get bombs() { return bombs; },
				board: {
					get width() { return constants.width * constants.tileWidth },
					get height() { return constants.height * constants.tileHeight }
				},
				get constants() { return constants; },
				get end() { return end; },
				get level() { return level; },
				get history() { return history; },
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

		var boss, bossActive, game, icon, resizer, title;

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

			game = new Game(board, function() {
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
					bossScreen(!boss);
					break;
				case 68:				/* D */
					showMessage(new Date().toLocaleString());
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
