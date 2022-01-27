"use strict";

$().ready(function() {
	var CORS_PROXY = window.location.sameProtocol("api.allorigins.win/raw") + "?url={0}";

	var _app = window.nadir.readLater,
		_password = window.location.get("password");

	_app.uid = window.location.get("uid");

	var isPicshitz = function(url) {
		return url.match(/picshitz/gi);
	};

	var createLink = function(link) {
		var list = $("#list").find("ul");

		_app.createLink(list, link, [{
			"id": "add",
			"click": function(e) {
				if (e) {
					$.toast.error(e.description || e.message || e);
				} else {
					$.toast.message("Saved!");
				}
			}
		}]);
		_app.loadFavicons(list);
	};

	var invalidPage = function(url, title) {
		$.toast.error("Invalid page!");
		createLink({
			"error": true,
			"title": "Invalid " + title,
			"url": url
		});
	};

	var loadLinks = function(url) {
		return $.Deferred(function(deferred) {
			window.loading(function() {
				return $.get(CORS_PROXY.format(url)).then(function(data) {
					var links = { };

					$(document.createElement("div"))
						.html(data.replace(/ src="/gi, " data-src=\""))
						.find(".postBody a")
						.each(function() {
							var h = $(this).attr("href"), o;

							if (isPicshitz(h) && ((o = parseO(h)) && o.length) && !links[o]) {
								links[o] = {
									"title": $(this).text().replace(/Click to download/i, "").trim(),
									"url": o
								};
							}
						});

					links = Object.keys(links).map(function(name) {
						return links[name];
					});

					if (links.length) {
						links.forEach(function(link) {
							createLink(link);
						});
						deferred.resolve();
					} else {
						$.toast.error("No link found");
						deferred.reject();
					}
				}, function(jqXHR, error, textStatus) {
					if (error === "error" && (textStatus === "error" || !textStatus)) {
						 textStatus = "An error occurred";
					}
					$.toast.error(textStatus || error);
					deferred.reject();
				});
			}, "Loading links...");
		});
	};

	var parseO = function(href) {
		var i = href.lastIndexOf("?"), m, n;

		if (i >= 0) {
			for (var j = 0, p = href.substr(i + 1).split("&"), k = p.length; j < k; j++) {
				m = p[j].indexOf("=");
				n = p[j].substr(0, m);
				if (n === "o") {
					return aesCrypto.decrypt(p[j].substr(m + 1), _password);
				}
			}
		}
	};

	var start = function() {
		var o, pageUrl = window.location.get("url");

		if (_app.uid && _app.uid.length) {
			if (isPicshitz(pageUrl)) {
				createLink({
					"title": "Source page",
					"url": pageUrl
				});
				if ((o = parseO(pageUrl)) && o.length) {
					createLink({
						"title": "Source page #2",
						"url": o
					});
					if (isPicshitz(o)) {
						loadLinks(o);
					} else {
						invalidPage(o, "Source page #2");
					}
				} else {
					loadLinks(pageUrl).fail(function() {
						invalidPage(pageUrl, "Source page");
					});
				}
			} else {
				invalidPage(pageUrl, "origin ({0})".format(window.location.get("title")));
			}
		}
	};

	window.loader.value(false);
	start();
});
