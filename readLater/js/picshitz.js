"use strict";

$().ready(function() {
	var CORS_PROXY = window.location.sameProtocol("api.allorigins.win/raw") + "?url={0}",
		IGLIVE = "iglive.picshitz.com",
		PASSWORD = "root",
		PICSHITZ = "Picshitz",
		_picshitz = new RegExp(PICSHITZ, "i");

	var _app = window.nadir.readLater,
		_password = window.location.get("password") || PASSWORD;

	_app.uid = window.location.get("uid");

	var isPicshitz = function(url) {
		return url.match(_picshitz);
	};

	var createLink = function(link) {
		var parent = $("#list"),
			list = parent.find("ul");

		if (!list.length) {
			list = $(document.createElement("ul"))
				.appendTo(parent);
		}

		var buttons = [{
			"id": "add",
			"click": function(e) {
				if (e) {
					$.toast.error(e.description || e.message || e);
				} else {
					$.toast.message("Saved!");
				}
			}
		}];

		if (link.go) {
			link = $.extend({ }, link);
			delete link.go;
			buttons.splice(0, 0, {
				"id": "go",
				"url": "{0}?uid={1}&url={2}&title={3}&password={4}".format(
					window.location.pathname,
					_app.uid,
					window.encodeURIComponent(link.url),
					window.encodeURIComponent(link.title),
					_password
				)
			});
		}

		_app.createLink(list, link, buttons);
		_app.loadFavicons(list);
		refreshTitle();
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
					var links,
						page = $(document.createElement("div"))
							.html(data.replace(/ src="/gi, " data-src=\"")),
						refs = page.find(".postBody a");

					if (refs.length) {
						links = { };
						refs.each(function() {
							var h = $(this).attr("href"), o;

							if (isPicshitz(h) && ((o = parseO(h)) && o.length) && !links[o]) {
								links[o] = {
									"category": PICSHITZ,
									"title": $(this).text().replace(/Click to download/i, "").trim(),
									"url": o
								};
							}
						});
						links = Object.keys(links).map(function(name) {
							return links[name];
						});
					} else {
						links = page.find(".blogPosts").find("article .postContent .postTitle a").toArray().map(function(a) {
							return {
								"go": true,
								"title": $(a).text(),
								"url": $(a).attr("href")
							};
						});
					}

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

	var refreshTitle = function() {
		var count = $("#list").find(".category").length;

		$(".header-title").text(("{0} links" + ((count) ?
			" ({1})" :
			String.empty)).format(PICSHITZ, count.toLocaleString()));
	};

	var start = function() {
		var o, pageUrl = window.location.get("url");

		if (_app.uid && _app.uid.length) {
			if (pageUrl && pageUrl.length) {
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
							invalidPage(o, "source page #2");
						}
					} else {
						loadLinks(pageUrl).fail(function() {
							invalidPage(pageUrl, "source page");
						});
					}
				} else {
					invalidPage(pageUrl, "origin ({0})".format(window.location.get("title")));
				}
			} else {
				var igLive = window.location.sameProtocol(IGLIVE);

				createLink({
					"title": "Source page",
					"url": igLive
				});
				loadLinks(igLive).fail(function() {
					invalidPage("", "source page");
				});
			}
		}
	};

	window.loader.value(false);
	start();
});
