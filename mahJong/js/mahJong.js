"use strict";

(function() {
	var _ = {
		  depth: 6
		, height: 40
		, padding: 4
		, width: 30
	};

	var _array = function(list) {
		var a = [ ], e, i, l;

		for (i = 0, l = list.length; i < l, e = list[i]; i++) {
			a.push(e);
		}
		return a;
	}

	var _board = document.getElementsByClassName("board")[0],
		_message = document.getElementById("message"),
		_scaler = document.getElementsByClassName("scaler")[0],
		_status = document.getElementsByClassName("status")[0];

	var _game;

	(function() {
		var askNewGame,
			checkGame,
			getFreeTiles,
			getMatchingTiles,
			hideMessage,
			isTileFree,
			isTileVisible,
			isTileVisibleByIndex,
			newGame,
			nextHint,
			refreshTime,
			resizer,
			showMessage,
			tileClick,
			tileSet,
			undo;

		(function() {
			if (typeof window.ShadowRoot === "undefined") {
				_message.classList.add("compatible");
			}
		})();

		(function() {
			var b = 2,
				c,
				css,
				i,
				j,
				k,
				n,
				p,
				rules,
				shadow,
				w,
				x = 0,
				y = 0;

			if (!!window.location.search.match(/shadow/i)) {
				shadow = [ ];
				if ((w = window.location.search.match(/blur(\d+)/i)) && w.length > 1) {
					b = w[1] || b;
				}
				for (i = 0; i < _.depth; i++) {
					shadow.push(((i === _.depth - 1) ? "black " : "") +
						(i + 1) + "px " + (i + 1) + "px " + b + "px");
				}

			}
			tileSet = [ ];
			tileSet.width = ((_.width + 2 * _.padding) * 15 + _.depth);
			tileSet.height = ((_.height + 2 * _.padding) * 8 + _.depth);

			tileSet.width += 4 * _.padding;
			tileSet.height += 4 * _.padding;

			rules = [ /* "body { min-width: " + tileSet.width + "px; min-height: " + tileSet.height + "px; }", */
				".wrapper { max-width: " + tileSet.width + "px; " +
					"max-height:" + tileSet.height + "px; }",
				".board { width: " + tileSet.width + "px; " +
					"height: " + tileSet.height + "px; }",
				".face { padding: " + _.padding + "px; width: " +
					(_.width + 2 * _.padding) + "px; height: " +
					(_.height + 2 * _.padding) + "px; }" ];

			if (shadow && shadow.length) {
				rules.push(".tile { box-shadow: " + shadow.join(", ") + "; }");
			} else {
				rules.push(".tile { width: " + (_.width + 2 * _.padding + _.depth) + "px; " +
					"height: " + (_.height + 2 * _.padding + _.depth) + "px; " +
					"background-image: url(\"images/shadow" + _.width + "x" + _.height + ".png\"); " +
					"background-position: bottom right; " +
					"background-repeat: no-repeat; " +
					"clip-path: polygon(" + (_.width + 2 * _.padding) + "px 0, 100% " + _.depth + "px, 100% 100%" +
						", " + _.depth + "px 100%, 0 " + (_.height + 2 * _.padding) + "px, 0 0); }");
			}

			for (i = 0; i < 5; i++) {
				c = (i === 3) ? 8 : (i === 4) ? 7 : 9;

				for (j = 0; j < c; j++) {
					rules.push(".t" + x + "{ background-position: -" +
						(_.width * j) + "px -" + (_.height * i) + "px }");

					n = (i > 2 && j < 4) ? 1 : 4;

					if (n !== 1 || p !== n) {
						y++;
					}
					for (k = 0; k < n; k++) {
						tileSet.push({
							face: x,
							index: tileSet.length,
							type: y
						});
					}
					x++;
					p = n;
				}
			}

			var css = document.createElement("style");

			css.setAttribute("type", "text/css");
			css.innerText = rules.join("\n");
			document.getElementsByTagName("head")[0].appendChild(css);
		})();

		askNewGame = function() {
			if (_message.classList.contains("hidden")) {
				if (_game && _game.history && _game.history.length) {
					showMessage(document.getElementById("askNewMessage").value);
				} else {
					newGame();
				}
			} else {
				hideMessage();
				newGame();
			}
		};

		checkGame = function() {
			_status.classList.add("working2");

			var free = 0,
				hasMoves;

			if (refreshTime) {
				refreshTime();
			}
			if (_game) {
				_array(document.querySelectorAll(".undo, .restart")).forEach(function(item, i) {
					if (_game.history.length) {
						item.removeAttribute("disabled");
					} else {
						item.setAttribute("disabled", "disabled");
					}
				});
				_array(document.getElementsByClassName("hint")).forEach(function(item, i) {
					if (_game.end) {
						item.setAttribute("disabled", "disabled");
					} else {
						item.removeAttribute("disabled");
					}
				});
			}

			(function() {
				var isTileFree = function(tile) {
					var index;

					if (!tile.classList.contains("hidden")) {
						switch (index = parseInt(tile.dataset.index)) {
							case 31:
								return true;
							case 32:
							case 44:
								if (isTileVisibleByIndex(31)) {
									if (isTileVisible(parseInt(tile.dataset.x) + 1,
										tile.dataset.y, tile.dataset.z)) {

										return false;
									}
								}
								break;
							case 43:
							case 55:
								if (isTileVisibleByIndex(56)) {
									if (isTileVisible(parseInt(tile.dataset.x) - 1,
										tile.dataset.y, tile.dataset.z)) {

										return false;
									}
								}
								break;
							case 56:
								if (isTileVisibleByIndex(43) &&
									isTileVisibleByIndex(55) &&
									isTileVisibleByIndex(57)) {

									return false;
								}
								break;
							case 57:
								return true;
							case 140:
							case 141:
							case 142:
							case 143:
								if (isTileVisibleByIndex(144)) {
									return false;
								}
								break;
							case 144:
								return true;
							default:
								if (isTileVisible(parseInt(tile.dataset.x) + 1,
										tile.dataset.y, tile.dataset.z) &&
									isTileVisible(parseInt(tile.dataset.x) - 1,
										tile.dataset.y, tile.dataset.z)) {

									return false;
								} else if (isTileVisible(tile.dataset.x,
									tile.dataset.y, parseInt(tile.dataset.z) + 1)) {

									return false;
								}
								break;
						}
						return true;
					}
					return false;
				};

				_array(_board.getElementsByClassName("tile")).forEach(function(tile, i) {
					tile.classList[(isTileFree(tile)) ? "add" : "remove"]("free");
				});
			})();

			(function() {
				var hints = [ ],
					keys = [ ];

				if (!_game.end) {
					getFreeTiles().forEach(function(tile, i) {
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
								hints.push(matches);
								free += length;
							}
						}
					});
					hints.sort(function(a, b) {
						var n = function(data) {
							var x = parseInt(data.x),
								y = parseInt(data.y),
								z = parseInt(data.z);

							return z * 1e6 + y * 1e3 + x;
						}, x = n(a[0].dataset), y = n(b[0].dataset);

						return (x < y) ? 1 : (x > y) ? -1 : 0;
					});
				}
				_game.hints = hints;
			})();

			document.getElementById("tiles").innerText = _board
				.querySelectorAll(".tile:not(.hidden)")
					.length.toLocaleString();
			document.getElementById("freeTiles").innerText = free;

			if (_board.getElementsByClassName("tile").length ===
				_board.getElementsByClassName("hidden").length) {

				if (!_game.end) {
					showMessage(document.getElementById("wonMessage").value);
					_game.end = Date.now();
				}
			} else {
				if (!hasMoves && !(!_game.history.length && document
					.getElementsByClassName("tile").length < tileSet.length)) {

					if (!_game.end) {
						showMessage(document.getElementById("lostMessage").value);
						_game.end = Date.now();
					}
				}
			}
			_status.classList.remove("working2");
		};

		getFreeTiles = function() {
			return _array(_board.getElementsByClassName("free"));
		};

		getMatchingTiles = function(tile, freeOnly) {
			var type = tile.dataset.type;

			return _array(_board.getElementsByClassName("tile")).filter(function(item, i) {
				return item !== tile && item.dataset.type === type &&
					(!freeOnly || item.classList.contains("free"));
			});
		};

		hideMessage = function() {
			_message.classList.add("hidden");
			document.getElementById("messageBackdrop").classList.add("hidden");
		};

		isTileVisible = function(x, y, z) {
			var tile = _game.filter(function(item, i) {
				return parseInt(item.dataset.x) === parseInt(x) &&
					parseInt(item.dataset.y) === parseInt(y) &&
					parseInt(item.dataset.z) === parseInt(z);
			})[0];

			return tile && !tile.classList.contains("hidden");
		};

		isTileVisibleByIndex = function(index) {
			var tiles = _game.filter(function(item, i) {
				return parseInt(item.dataset.index) === index;
			});

			if (tiles.length) {
				return !tiles[0].classList.contains("hidden");
			}
		};

		newGame = function() {
			var face,
				flag,
				getTilePosition = function(index) {
					var x, y, z;

					if (index <= 12) {
						x = index;
						y = 0;
						z = 0;
					} else if (index <= 20) {
						x = index - 10;
						y = 1;
						z = 0;
					} else if (index <= 30) {
						x = index - 19;
						y = 2;
						z = 0;
					} else if (index === 31) {
						x = 0;
						y = 3.5;
						z = 0;
					} else if (index <= 43) {
						x = index - 31;
						y = 3;
						z = 0;
					} else if (index <= 55) {
						x = index - 43;
						y = 4;
						z = 0;
					} else if (index === 56) {
						x = 13;
						y = 3.5;
						z = 0;
					} else if (index === 57) {
						x = 14;
						y = 3.5;
						z = 0;
					} else if (index <= 67) {
						x = index - 56;
						y = 5;
						z = 0;
					} else if (index <= 75) {
						x = index - 65;
						y = 6;
						z = 0;
					} else if (index <= 87) {
						x = index - 75;
						y = 7;
						z = 0;
					} else if (index <= 123) {
						x = 4 + (index % 88) % 6;
						y = 1 + Math.floor((index - 88) / 6);
						z = 1;
					} else if (index <= 139) {
						x = 5 + (index - 124) % 4
						y = 2 + Math.floor((index - 124) / 4);
						z = 2;
					} else if (index <= 143) {
						x = 6 + (index - 140) % 2;
						y = 3 + Math.floor((index - 140) / 2);
						z = 3;
					} else {
						x = 6.5;
						y = 3.5;
						z = 4;
					}
					return {
						i: index + 1,
						x: x,
						y: y,
						z: z
					};
				},
				index,
				lastIndex,
				max = tileSet.length,
				nextFreePosition = function() {
					var found,
						start;

					if (tiles.length) {
						while (!found) {
							start = getTilePosition(parseInt(tiles[Math.floor(Math.random() * tiles.length)].dataset.index));

							switch (Math.floor(Math.random() * 4)) {
								case 0:		/* N */
									debugger;
									break;
								case 1:		/* E */
									debugger;
									break;
								case 2:		/* S */
									debugger;
									break;
								case 3:		/* W */
									debugger;
									break;
							}
							found = true;
						}
					}
					return Math.floor(Math.random() * set.length);
				},
				position,
				positionIndex,
				set = tileSet.slice(0),
				smart = !!window.location.search.match(/smart/i),
				tile,
				tiles = [ ],
				zIndex = 0;

			if (smart) { max = 2; }

			while (_board.childNodes.length) {
				_board.removeChild(_board.childNodes[0]);
			}
			while (set.length && set.length > tileSet.length - max) {
				index = (smart && flag) ? lastIndex :
					Math.floor(Math.random() * set.length);

				if (smart && index % 2) {
					index--;
				}
				lastIndex = index;
				flag = !flag;

				tile = document.createElement("div");
				tile.classList.add("tile");
				tile.classList.add("fade");

				position = getTilePosition(positionIndex = (smart) ?
					nextFreePosition() :
					tiles.length + 1);

				tile.style.left = (position.x * (_.width + 2 * _.padding) -
					(position.z * _.depth) + 2 * _.padding) + "px";
				tile.style.top = (position.y * (_.height + 2 * _.padding) -
					(position.z * _.depth) + 2 * _.padding) + "px";
				tile.style.zIndex = (smart) ?
					position.i :
					zIndex++;

				tile.dataset.index = positionIndex;
				tile.dataset.type = set[index].type;
				tile.dataset.x = position.x;
				tile.dataset.y = position.y;
				tile.dataset.z = position.z;

				tile.addEventListener("click", function(e) {
					tileClick(this);
				});

				face = document.createElement("div");
				face.classList.add("face");
				face.classList.add("t" + set[index].face);

				/* var x = document.createElement("span");

				x.style.color = "red";
				x.style.fontSize = "7pt";
				x.style.fontWeight = "bold";
				x.innerText = [tiles.length + 1, position.x, position.y, position.z].join(", ");
				face.appendChild(x); */

				tile.appendChild(face);

				_board.appendChild(tile);
				tiles.push(tile);
				set.splice(index, 1);
			}
			_game = tiles;
			_game.history = [ ];
			checkGame();
		};

		nextHint = function() {
			var index;

			_array(_board.getElementsByClassName("hint")).forEach(function(hint, i) {
				hint.classList.remove("hint");
			});
			if (typeof _game.hint !== "undefined" &&
				_game.hint === _game.hints.length - 1) {

				delete _game.hint;
			}
			if (_game.hints && _game.hints.length) {
				index = (typeof _game.hint !== "undefined") ? _game.hint + 1 : 0;
				_game.hints[index].forEach(function(hint, i) {
					hint.classList.add("hint");
				});
				_game.hint = index;
			}
		};

		refreshTime = function() {
			var elapsed = 0,
				temp,
				text = "";

			if (_game && _game.start) {
				elapsed = (_game.end || Date.now()) - _game.start;
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

		showMessage = function(message, type) {
			document.getElementById("messageText").innerText = message;
			document.getElementById("messageBackdrop").classList.remove("hidden");
			_message.classList.remove("hidden");
		};

		undo = function(all) {
			var entry;

			if (_game && _game.history && _game.history.length) {
				_array(_board.getElementsByClassName("clicked")).forEach(function(item, i) {
					item.classList.remove("clicked");
				});
				_array(_board.getElementsByClassName("matching")).forEach(function(item, i) {
					item.classList.remove("matching");
				});
				(entry = _game.history.pop()).forEach(function(item, i) {
					item.classList.remove("hidden");
				});
				_array(_board.getElementsByClassName("last")).forEach(function(item, i) {
					item.classList.remove("last");
				});
				if (entry.length > 1) {
					delete _game.end;
				}
				if (all && _game.history.length) {
					undo(all);
				} else {
					checkGame();
				}
			}
		};

		_array(_status.getElementsByClassName("newGame")).forEach(function(item, i) {
			item.addEventListener("click", function(e) {
				askNewGame();
			});
		});
		_array(_status.getElementsByClassName("restart")).forEach(function(item, i) {
			item.addEventListener("click", function(e) {
				showMessage(document.getElementById("restartMessage").value);
			});
		});
		_array(document.getElementsByClassName("undo")).forEach(function(item, i) {
				item.addEventListener("click", function(e) {
				undo();
			});
		});
		_array(document.getElementsByClassName("hint")).forEach(function(item, i) {
			item.addEventListener("click", function(e) {
				nextHint();
			});
		});

		document.getElementById("messageBackdrop").addEventListener("click", function(e) {
			hideMessage();
		});
		_array(_message.getElementsByTagName("button")).forEach(function(item, i) {
			item.addEventListener("click", function(e) {
				hideMessage();
			});
		});
		_array(_message.getElementsByClassName("newGame")).forEach(function(item, i) {
			item.addEventListener("click", function(e) {
				newGame();
			});
		});
		_array(_message.getElementsByClassName("restart")).forEach(function(item, i) {
			item.addEventListener("click", function(e) {
				undo(true);
			});
		});

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
			var x = (window.innerWidth - (2 * _.padding + _.depth)) / tileSet.width,
				y = (window.innerHeight - (2 * _.padding + _.depth)) / tileSet.height,
				z = 1;

			if (_board.clientHeight) {
				if (x < 1 || y < 1) {
					z = Math.min(x, y);
				}

				_scaler.style["-ms-transform"] =
					_scaler.style["-moz-transform"] =
					_scaler.style["-o-transform"] =
					_scaler.style["-webkit-transform"] =
					_scaler.style.transform = (z < 1) ?
						"scale(" + z + ")" : "";

				/* x = ((window.innerWidth - (_board.clientWidth + 2 * _.padding + _.depth)) / 2) / z; */
				/* y = ((window.innerHeight - (_board.clientHeight + 2 * _.padding + _.depth)) / 2) / z; */
				/* "scale(" + z + ") " + "translateX(" + x + "px)" + "translateY(" + y + "px)"; */
			}
		});
		resizer();

		window.setInterval(refreshTime, 100);

		tileClick = function(tile) {
			_status.classList.add("working");
			_status.classList.add("working1");

			var clearHints = true,
				clicked = _array(_board.getElementsByClassName("clicked")),
				hint = _array(_board.getElementsByClassName("hint")),
				isLast,
				matching = _array(_board.getElementsByClassName("matching"));

			if (tile.classList.contains("free") || _game.end) {
				if (!_game.start) {
					_game.start = Date.now();
				}
				matching.forEach(function(match, i) {
					match.classList.remove("matching");
				});
				if (clicked.length === 1 && clicked[0] !== tile &&
					clicked[0].dataset.type === tile.dataset.type) {

					clicked[0].classList.add("hidden");
					tile.classList.add("hidden");
					clicked[0].classList.remove("clicked");
					tile.classList.remove("clicked");
					_game.history.push([ clicked[0], tile ]);
					checkGame();
				} else if (_game.end) {
					tile.classList.add("hidden");
					tile.classList.remove("clicked");
					_game.history.push([ tile ]);
					checkGame();
				} else {
					_status.classList.add("working3");
					clicked.forEach(function(item, i) {
						if (item !== tile) {
							item.classList.remove("clicked");
						}
					});
					tile.classList.toggle("clicked");
					if (tile.classList.contains("clicked")) {
						clearHints = !tile.classList.contains("hint");
						if (isLast = _array(_board.getElementsByClassName("hidden"))
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
					_status.classList.remove("working3");
				}
				if (clearHints) {
					_status.classList.add("working4");
					delete _game.hint;
					hint.forEach(function(item, i) {
						item.classList.remove("hint");
					});
					_status.classList.remove("working4");
				}
			}
			_status.classList.remove("working1");
			_status.classList.remove("working");
		};

		newGame();
	})();
})();
