"use strict";

$().ready(function() {
	var app = window.nadir.readLater,
		password = window.location.get("password"),
		uid = window.location.get("uid");

	var isPicshitz = function(url) {
		return url.match(/picshitz/gi);
	};

	var createLink = function(link) {
		var item = $(document.createElement("li"))
			.addClass((link.error) ? "ui-state-error" : undefined)
			.append($(document.createElement("div"))
				.addClass("title")
				.append($(document.createElement("div"))
					.addClass("title")
					.append($(document.createElement("img"))
						.addClass("favicon")
						.data({
							"url": link.href
						}))
					.append($(document.createElement("div"))
						.addClass("title")
						.text(link.title))))
			.append($(document.createElement("div"))
				.addClass("row")
				.append($(document.createElement("div"))
					.addClass("link")
					.append($(document.createElement("a"))
						.attr({
							"href": link.href,
							"target": "_blank"
						})
						.text(link.href)))
				.append($(document.createElement("div"))
					.addClass("buttons")
					.append((link.error) ? undefined : $(document.createElement("button"))
						.addClass("ui-state-highlight")
						.addClass("add")
						.attr({
							"type": "button"
						})
						.button({
							"icons": {
								"primary": "ui-icon-disk"
							},
							"label": "Add to Read Later"
						})
						.data({
							"title": link.title,
							"url": link.href
						})
						.on({
							"click": function(e) {
								var button = $(this).closest("button"),
									data = button.data();

								$.confirm("Are you sure you want to add '{0}'?"
									.format((data.title && data.title.length) ? data.title : data.url)).then(function() {

										app.add({
											"uid": uid,
											"href": data.url,
											"title": data.title,
											"category": "picshitz",
											"callback": function(e) {
												if (e) {
													done(e.description || e.message || e);
												} else {
													$.toast.message("Saved!");
												}
											}
										});
								});
							}
						}))))
			.appendTo($("#list").find("ul"));

		app.loadFavicons(item);
	};

	var done = function(message) {
		window.jQuery.toast.error(message);
	};

	var invalidSourcePage = function(url, title) {
		done("Invalid source page!");
		createLink({
			"error": true,
			"href": url,
			"title": "Invalid " + title
		});
	};

	var loadLinks = function(url) {
		window.loader.value(false);
		window.loading(function() {
			return $.get(window.location.sameProtocol("api.allorigins.win/raw") + "?url=" + url)
				.then(function(data) {
					var links = { };

					$(document.createElement("div"))
						.html(data.replace(/ src="/gi, " data-src=\""))
						.find(".postBody a")
						.each(function() {
							var h = $(this).attr("href"), o;

							if (isPicshitz(h) && ((o = parseO(h)) && o.length) && !links[o]) {
								links[o] = {
									"href": o,
									"title": $(this).text().replace(/Click to download/i, "").trim()
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
					} else {
						done("No link found");
					}
				}, function(jqXHR, error, textStatus) {
					if (error === "error" && (textStatus === "error" || !textStatus)) {
						 textStatus = "An error occurred";
					}
					done(textStatus || error);
				});
		});
	};

	var parseO = function(href) {
		var i = href.lastIndexOf("?"), m, n;

		if (i >= 0) {
			for (var j = 0, p = href.substr(i + 1).split("&"), k = p.length; j < k; j++) {
				m = p[j].indexOf("=");
				n = p[j].substr(0, m);
				if (n === "o") {
					return aesCrypto.decrypt(p[j].substr(m + 1), password);
				}
			}
		}
	};

	(function() {
		var o, pageUrl = window.location.get("url");

		if (!((uid = window.location.get("uid")) && uid.length)) {
			uid = window.prompt("UID:");
		}
		if (uid && uid.length) {
			if (isPicshitz(pageUrl)) {
				createLink({
					"href": pageUrl,
					"title": "Source page"
				});
				if ((o = parseO(pageUrl)) && o.length) {
					createLink({
						"href": o,
						"title": "Source page #2"
					});
					if (isPicshitz(o)) {
						loadLinks(o);
					} else {
						invalidSourcePage(o, "Source page #2");
					}
				} else if(!loadLinks(pageUrl)) {
					invalidSourcePage(pageUrl, "Source page");
				}
			} else {
				invalidSourcePage(pageUrl, "origin ({0})".format(window.location.get("title")));
			}
		}
	})();
});
