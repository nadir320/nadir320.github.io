"use strict"

$().ready(function() {
	var _app = window.nadir.readLater,
		_email,
		_storageName = "readLater",
		_uid;

	var load = function() {
		return window.loading(function() {
			return $.Deferred(function(deferred) {
				_app.database.database().ref(_uid).once("value").then(function(snapshot) {
					var entries,
						list = $("#list").empty(),
						values = snapshot.val();

					if (values) {
						list.append(list = $(document.createElement("ul")));

						entries = [ ];
						$(values).eachProp(function(name, value) {
							var entry = $.extend({ }, value);

							entry.date = new Date(entry.date);
							entry.id = name;
							if (!(entry.title && entry.title.length)) {
								entry.title = "<No title>";
							}
							if (!(entry.url && entry.url.length)) {
								entry.url = "";
							}
							entries.push(entry);
						});
						entries.sort(function(a, b) {
							var x, y;

							if (a.date.getTime) {
								if (isNaN(x = a.date.getTime())) {
									x = a.title;
								}
							} else {
								x = a.title;
							}
							if (b.date.getTime) {
								if (isNaN(y = b.date.getTime())) {
									y = b.title;
								}
							} else {
								y = b.title;
							}
							return (x < y) ? 1 : (x > y) ? -1 : 0;
						});
						$(entries).each(function(i, value) {
							$(document.createElement("li"))
								.append($(document.createElement("div"))
									.addClass("title")
									.append($(document.createElement("div"))
										.addClass("title")
										.append($(document.createElement("img"))
											.addClass("favicon")
											.data({
												"url": value.url
											}))
										.append($(document.createElement("div"))
											.addClass("title")
											.text(value.title))
										.append((value.category && value.category.length) ?
											$(document.createElement("div"))
												.addClass("category")
												.addClass("ui-state-default")
												.text(value.category) :
											undefined))
									.append($(document.createElement("div"))
										.addClass("date")
										.text(value.date.toLocaleString())))
								.append($(document.createElement("div"))
									.addClass("row")
									.append($(document.createElement("div"))
										.addClass("link")
										.append($(document.createElement("a"))
											.attr({
												"href": value.url,
												"target": "_blank"
											})
											.text(value.url)))
									.append($(document.createElement("div"))
										.addClass("buttons")
										.append($(document.createElement("button"))
											.addClass("ui-state-default")
											.addClass("rename")
											.attr({
												"type": "button"
											})
											.button({
												"icons": {
													"primary": "ui-icon-pencil"
												},
												"label": "Rename"
											})
											.data({
												"id": value.id,
												"title": value.title,
												"url": value.url
											})
											.on({
												"click": function(e) {
													var button = $(this).closest("button"),
														data = button.data();

													$.prompt("Rename '{0}':".format(data.title), data.title).then(function(value) {
														if (value && value.length) {
															window.loading(function() {
																return $.Deferred(function(deferred) {
																	_app.database.database().ref(_uid + "/" + data.id + "/title").set(value).then(function() {
																		button.closest("li").find(".title .title .title").text(value);
																		button.data({
																			"title": value
																		});
																		deferred.resolve();
																	}).catch(function(e) {
																		deferred.reject();
																		$.alert(e);
																	});
																});
															});
														}
													});
												}
											}))
										.append($(document.createElement("button"))
											.addClass("ui-state-error")
											.addClass("remove")
											.attr({
												"type": "button"
											})
											.button({
												"icons": {
													"primary": "ui-icon-closethick"
												},
												"label": "Remove"
											})
											.data({
												"id": value.id,
												"title": value.title,
												"url": value.url
											})
											.on({
												"click": function(e) {
													var button = $(this).closest("button"),
														data = button.data();

													$.confirm("Are you sure you want to remove '{0}'?"
														.format((data.title && data.title.length) ? data.title : data.url)).then(function() {

														window.loading(function() {
															return $.Deferred(function(deferred) {
																_app.database.database().ref(_uid + "/" + data.id).set(null).then(function() {
																	button.closest("li").fadeOut(function() {
																		$(this).remove();
																		refreshTitle();
																	});
																	deferred.resolve();
																}).catch(function(e) {
																	deferred.reject();
																	$.alert(e);
																});
															});
														});
													});
												}
											}))))
								.appendTo(list);
						});
						if (list.find("li").length) {
							_app.loadFavicons(list);
						} else {
							list.remove();
						}
					}
					refreshTitle();
				}).catch(function(e) {
					$.alert(e.message || e);
				}).finally(function(e) {
					deferred.resolve();
				});
			}).promise();
		}, "Loading links...");
	};

	var loginAndLoad = function(username, password, rememberMe, successCallback, errorCallback) {
		window.loader.message("Logging in...");
		window.loader.show();
		_app.database.auth().signInWithEmailAndPassword(username, password).then(function(auth) {
			if (rememberMe) {
				window.localStorage.setItem(_storageName, window.JSON.stringify({
					"username": username,
					"password": password,
					"rememberMe": true
				}));
			} else {
				window.localStorage.removeItem(_storageName);
			}
			$(".email").button("option", "label", _email = auth.user.email).fadeIn();
			$(".refresh").fadeIn();
			_uid = auth.user.uid;
			if (successCallback) {
				successCallback();
			}
			window.loader.hide();
			load();
		}).catch(function(e) {
			window.loader.hide();
			$.alert(e.description || e.message || e).then(errorCallback);
		});
	};

	var refreshTitle = function() {
		var count = $("#list").find("li").length;

		$(".title-text").text(("Read later links" + ((count) ?
			" ({0})" :
			String.empty)).format(count.toLocaleString()));
		$(".no-link")[(!count) ? "fadeIn" : "fadeOut"]();
	};

	var showLogin = function(username, password, rememberMe) {
		$(".loginButton").button().off().on({
			"click": function(e) {
				loginAndLoad($("#username").val(), $("#password").val(), $("#rememberMe").prop("checked"), function() {
					$(".loginDialog").dialog("close");
				});
				return false;
			}
		});
		$("#username").val(username);
		$("#password").val(password);
		$("#rememberMe").prop("checked", rememberMe);
		$(".loginDialog").dialog({
			"hide": true,
			"minWidth": $(window).width() * 0.5,
			"modal": true,
			"show": true
		});
	};

	var start = function(forceLogin) {
		var options = window.localStorage.getItem(_storageName);

		options = (options && options.length) ? window.JSON.parse(options) : { };
		if (forceLogin || !(options.username && options.username.length)) {
			showLogin(options.username, options.password, options.rememberMe);
		} else {
			loginAndLoad(options.username, options.password, options.rememberMe, undefined, function() {
				showLogin(options.username, options.password, options.rememberMe);
			});
		}
	};

	window.loader.value(false);
	$(".email").button({
		"icons": {
			"primary": "ui-icon-key"
		}
	}).on({
		"click": function(e) {
			start(true);
		}
	});
	$(".refresh").button({
		"icons": {
			"primary": "ui-icon-refresh"
		}
	}).on({
		"click": function(e) {
			load();
		}
	});
	start();
});
