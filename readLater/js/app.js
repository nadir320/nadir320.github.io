"use strict"

$().ready(function() {
	var _app = window.nadir.readLater,
		_email,
		_storageName = "readLater";

	var inSpan = function(text) {
		return $(document.createElement("div"))
			.append($(document.createElement("span"))
				.text(text))
			.html();
	};

	var load = function() {
		return window.loading(function() {
			return $.Deferred(function(deferred) {
				_app.database.database().ref(_app.uid).once("value").then(function(snapshot) {
					var entries,
						list = $("#list").empty(),
						values = snapshot.val();

					if (values) {
						list = $(document.createElement("ul")).appendTo(list);

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

						var buttons = [ "rename", { "id": "remove", "click": refreshTitle }];

						$(entries).each(function(i, value) {
							window.nadir.readLater.createLink(list, value, buttons);
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
			$(".email").button("option", "label", inSpan(_email = auth.user.email)).fadeIn();
			$(".refresh").fadeIn();
			_app.uid = auth.user.uid;
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

		$(".header-text").text(("Read later links" + ((count) ?
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
		},
		"label": inSpan("Refresh")
	}).on({
		"click": function(e) {
			load();
		}
	});
	start();
});
