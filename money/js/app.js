"use strict";

(function() {
	var C = {
		  "apiKey": "AIzaSyCONXtbIVqtDdZYuYrjtkVG37zFYG5VN0o"
		, "databaseID": "money-75492"
		, "defaultIcon": "E53B"
		, "editIcon": "E3C9"
		, "errorToast": 15e3
		, "storagePrefix": "money_"
		, "toast": 3e3
	};

	var T = {
		  "all": "Tutto"
		, "categories": "Categorie"
		, "categories2": "Categorie ({0})"
		, "cost": "{0}€"
		, "edit": "Modifica"
		, "last-access": "Ultimo accesso: {0}"
		, "no-access": "Nessun accesso"
		, "no-entry": "Nessun elemento"
		, "no-user": "Nessun utente connesso"
		, "summary": "Riassunto"
		, "tags": "Tag"
		, "tags2": "Tag ({0})"
		, "title": "{0} ({1})"
		, "total": "Totale"
	};

	var _categories,
		_categoryFilter,
		_entries,
		_tagFilter,
		_tags;

	var _s = function(storage, name, value) {
		name = C.storagePrefix + name;

		if (typeof value !== "undefined") {
			if (typeof value === "object") {
				value = window.JSON.stringify(value);
			}
			storage.setItem(name, value);
		} else {
			return storage.getItem(name);
		}
	};

	var L = function(name, value) {
		return _s(window.localStorage, name, value);
	};

	var S = function(name, value) {
		return _s(window.sessionStorage, name, value);
	};

	var _icon = function(icon, defaultIcon) {
		if (!icon) {
			if (!defaultIcon) {
				defaultIcon = C.defaultIcon;
			}
			icon = defaultIcon;
		}
		return $(document.createElement("i"))
			.addClass("material-icons")
			.html("&#x{0};".format(icon));
	};

	var _itemsFromSetInSet = function(values, set) {
		var found, i, item, j, length1, length2;

		if (values && values.length) {
			if (set && set.length) {
				for (i = 0, length1 = set.length; i < length1; i++) {
					item = set[i];
					for (j = 0, length2 = values.length; j < length2; j++) {
						if (values[j] === item) {
							found = true;
							break;
						}
					}
					if (!found) {
						return false;
					}
				}
			}
			return true;
		} else if (set && set.length) {
			return false;
		}
		return true;
	};

	var _loading = function(fn) {
		var instance,
			loader = $(".loader");

		if (!loader.length) {
			M.Modal.init((loader = $(document.createElement("div"))
				.append($(document.createElement("div"))
					.addClass("indeterminate"))
				.addClass("loader")
				.addClass("progress")
				.appendTo(document.body))[0], {
					"dismissible": false,
					"opacity": 0.25
				});
		}
		(instance = M.Modal.getInstance(loader[0])).open();
		$.when(fn()).always(function() {
			instance.close();
		});
	};

	var _text = function(name) {
		var a, i;

		name = T[name];
		if (arguments.length > 1) {
			a = window.argumentsArray(arguments);

			a.splice(0, 1);
			for (i = 0; i < a.length; i++) {
				if (a[i] &&
					typeof a[i] !== "string" &&
					a[i].toLocaleString) {

					a[i] = a[i].toLocaleString();
				}
			}
			name = name.format.apply(name, a);
		}
		return name;
	};

	var _toast = function(html, error) {
		var toast = {
			"displayLength": C[(error) ?
				"errorToast" :
				"toast"],
			"html": html
		};
		if (error) {
			toast["classes"] = "error-toast";
		}
		M.toast(toast);
	};

	var loadEntries = function() {
		var container = $(document.createElement("div"))
				.addClass("container")
				.appendTo($(".contentContainer")
					.empty()),
			createCard = function(entry) {
				var card,
					content;

				createCell(createRow(), "s12")
					.append(card = $(document.createElement("div"))
						.addClass("card"));

				content = $(document.createElement("div"))
					.addClass("card-content")
					.appendTo(card);

				$(entry.categories).each(function(j, category) {
					var categoryObject = _categories.find(function(item) {
						return item.id === category;
					});

					card.append(_icon(categoryObject.icon)
						.addClass("category")
						.attr({
							"title": categoryObject.name
						})
						.data({
							"category": categoryObject
						})
						.on({
							"click": function(e) {
								var id = $(this).data("category").id;

								if (!_categoryFilter) {
									_categoryFilter = [ ];
								}
								if (typeof _categoryFilter.find(function(item) {
									return item === id;
								}) === "undefined") {
									_categoryFilter.push(id);
									loadEntries();
								}
							}
						}));
				});
				$(entry.tags).each(function(j, tag) {
					var tagObject = _tags.find(function(item) {
						return item.id === tag;
					});

					if (tagObject) {
						card.append($(document.createElement("div"))
							.addClass("chip")
							.addClass("tag")
							.data({
								"tag": tagObject
							})
							.text(tagObject.name)
							.on({
								"click": function(e) {
									var id = $(this).data("tag").id;

									if (!_tagFilter) {
										_tagFilter = [ ];
									}
									if (typeof (_tagFilter.find(function(item) {
										return item === id;
									})) === "undefined") {
										_tagFilter.push(id);
										loadEntries();
									}
								}
							}));
					}
				});
				content.append($(document.createElement("div"))
					.addClass("description")
					.text(entry.description));
				if (entry.date) {
					content.append($(document.createElement("div"))
						.addClass("date")
						.addClass("grey-text")
						.addClass("text-lighten-1")
						.text(new Date(entry.date).toLocaleString()));
					content.append($(document.createElement("button"))
						.addClass("btn-floating")
						.addClass("blue")
						.addClass("small")
						.addClass("darken-4")
						.addClass("z-depth-2")
						.addClass("waves-effect")
						.addClass("edit-entry")
						.append(_icon(C.editIcon))
						.on({
							"click": function(e) {
							}
						}));
				}
				if (typeof entry.cost !== "undefined") {
					content.append($(document.createElement("div"))
						.addClass("cost")
						.addClass("right")
						.text(_text("cost", entry.cost)));
				}
				return card;
			},
			createCell = function(row, classes) {
				var cell = $(document.createElement("div"))
					.addClass("col")
					.appendTo(row);

				if (classes && classes.length) {
					if (typeof classes === "string") {
						cell.addClass(classes);
					} else {
						$(classes).each(function(i, item) {
							cell.addClass(item);
						});
					}
				}
				return cell;
			},
			createRow = function() {
				return $(document.createElement("div"))
					.addClass("row")
					.appendTo(container);
			},
			entries = _entries,
			filter = [ ],
			total = 0;

		$(".button-action").removeClass("disabled");
		if (_categoryFilter && _categoryFilter.length) {
			filter = $.merge(filter, $(_categoryFilter).map(function(i, item) {
				return _categories.find(function(category) {
					return category.id == item;
				}).name;
			}));
			entries = entries.filter(function(item, i) {
				return _itemsFromSetInSet(item.categories, _categoryFilter);
			});
		}
		if (_tagFilter && _tagFilter.length) {
			filter = $.merge(filter, $(_tagFilter).map(function(i, item) {
				return _tags.find(function(tag) {
					return tag.id == item;
				}).name;
			}));
			entries = entries.filter(function(item, i) {
				return _itemsFromSetInSet(item.tags, _tagFilter);
			});
		}
		if (!filter.length) {
			filter.push(_text("all"));
		}
		createCell(createRow(), [ "s12", "blue", "lighten-3", "center"])
			.append($(document.createElement("h4"))
				.text(_text("title", filter.join(" + "), entries.length)));
		if (entries.length) {
			$(entries).each(function(i, entry) {
				total += entry.cost;
			});
			createCard({
				"cost": total,
				"description": _text("total")
			}).addClass("total");
			$(entries).each(function(i, entry) {
				createCard(entry);
			});
			if (entries.length >= 2e1) {
				createCard({
					"cost": total,
					"description": _text("total")
				}).addClass("total");
			}
		} else {
			createCard({
				"description": _text("no-entry")
			});
		}
	};

	(function() {
		$(".T").each(function(i, item) {
			(item = $(item)).text(_text(item.data("text")));
		});
	})();

	(function() {
		$(".sidenav").sidenav({
			"draggable": true
		});
		$(".collapsible").collapsible({
			"accordion": false
		});

		$(".fixed-action-btn")
			.floatingActionButton({
				"hoverEnabled": false
			});

		$(".btn-floating").addClass("waves-effect")
			.addClass("z-depth-2");

		$("a[href=\"#\"]").on({
			"click": function(e) {
				e.preventDefault();
			}
		});

		$(document).on({
			"click": function(e) {
				if (!$(e.target)
					.closest(".fixed-action-btn")
					.length) {

					$(".fixed-action-btn")
						.floatingActionButton("close");
				}
			}
		});

		$(".all").on({
			"click": function(e) {
				_categoryFilter = _tagFilter = undefined;
				loadEntries();
			}
		});
		$(".button-add").on({
			"click": function(e) {
				_toast("Add...");
			}
		});
		$(".button-quick-add").on({
			"click": function(e) {
				_toast("Quick add...");
			}
		});
	})();

	(function(key, database, username, password) {
		var _firebase,
			_firebaseError = function(error) {
				var errorCode = error.code,
					errorMessage = error.message;

				/* if (errorCode === "auth/wrong-password") {
					window.alert("Wrong password.");
				} else {
					window.alert(errorMessage);
				} */
				_toast(errorMessage = errorCode + ": " + errorMessage, true);
				console.error(errorMessage);
			},
			_firebaseGet = function(name, fn) {
				return _firebase
					.database()
					.ref(_uid + "/" + name)
					.once("value")
					.catch(_firebaseError)
					.then(function(data) {
						fn(data.val());
					});
			},
			_firebaseSet = function(data) {
				if (data) {
					if (data.getTime) {
						data = data.getTime();
					}
					return _firebase
						.database()
						.ref(_uid)
						.update(data)
						.catch(_firebaseError);
				}
			},
			_uid;

		_loading(function() {
			return (_firebase = firebase
				.initializeApp({
					apiKey: key,
					authDomain: database + ".firebaseapp.com",
					databaseURL: "https://" + database + ".firebaseio.com",
					projectId: database
				}))
				.auth()
				.signInWithEmailAndPassword(username, password)
				.then(function(data) {
					var editButton = function(parent, fn) {
						$(parent).append($(document.createElement("li"))
							.append($(document.createElement("a"))
								.addClass("sidenav-close")
								.attr({
									"href": "#"
								})
								.text(_text("edit"))
								.prepend(_icon(C.editIcon))
								.on({
									"click": function(e) {
										e.preventDefault();
										fn();
									}
								})));
					};

					var email = data.email || data.user.email;

					_uid = data.uid || data.user.uid;

					return _firebaseGet("entries", function(entries) {
						(_entries = entries || [ ]).sort(function(a, b) {
							return (a.date > b.date) ?
								-1 :
								(a.date < b.date) ?
									1 :
									0;
						});
						return $.when.apply(this, [
							_firebaseGet("info", function(info) {
								var user = email;

								if (info && info.name && info.name.length) {
									$(".current-user").text(info.name);
									$(".user-email").text(email);
								} else {
									$(".current-user").text(email);
								}
							}),
							_firebaseGet("last/access", function(date) {
								if (date) {
									$(".last-access").text(_text("last-access", new Date(date)));
								}
								_firebaseSet({
									"last": {
										"access": new Date().getTime()
									}
								});
							}),
							_firebaseGet("categories", function(categories) {
								var container = $(".categories"),
									header = container.find(".collapsible-header"),
									body = container.find(".collapsible-body").empty();

								header
									.find(".T")
									.text(_text("categories2", (_categories = categories).length));
								body.append(body = $(document.createElement("ul")));
								$(categories).each(function(i, item) {
									body.append($(document.createElement("li"))
										.append($(document.createElement("a"))
											.addClass("sidenav-close")
											.attr({
												"href": "#"
											})
											.data({
												"category": item
											})
											.text(item.name)
											.prepend(_icon(item.icon))
											.on({
												"click": function(e) {
													e.preventDefault();
													_categoryFilter = [ $(this).data("category").id ];
													_tagFilter = undefined;
													loadEntries();
												}
											})));
								});
								body.append($(document.createElement("div"))
									.addClass("divider"));
								editButton(body, function() {
									_toast("Edit categories...");
								});
							}),
							_firebaseGet("tags", function(tags) {
								var container = $(".tags"),
									header = container.find(".collapsible-header"),
									body = container.find(".collapsible-body").empty();

								header
									.find(".T")
									.text(_text("tags2", (_tags = tags).length));
								$(tags).each(function(i, item) {
									body.append($(document.createElement("a"))
										.addClass("chip")
										.addClass("sidenav-close")
										.attr({
											"href": "#"
										})
										.data({
											"tag": item
										})
										.text(item.name)
										.on({
											"click": function(e) {
												e.preventDefault();
												_categoryFilter = undefined;
												_tagFilter = [ $(this).data("tag").id ];
												loadEntries();
											}
										}));
								});
								editButton(body, function() {
									_toast("Edit tags...");
								});
							})
						]).then(loadEntries);
					});
				})
				.catch(_firebaseError);
		});
	})(C.apiKey, C.databaseID, "test@test.com", "test00");
})();
