"use strict";

if (!window.nadir) {
	window.nadir = { };
}
if (!window.nadir.readLater) {
	window.nadir.readLater = { };
}
if (window.nadir.readLater.officeMode === undefined) {
	window.nadir.readLater.officeMode = window.location.get("officeMode");
}
if (!window.nadir.readLater.database && window.firebase) {
	window.nadir.readLater.database = window.firebase.initializeApp({
		"apiKey": "AIzaSyA58csfwsnx3CIFhx73ecGlP0dY9-s8BS4",
		"databaseURL": "https://readlater-274ac.firebaseio.com"
	}, new Date().getTime().toString());
}
(function() {
	var expressions, waitFor;

	if (!window.nadir.readLater.isNSFWUrl) {
		window.nadir.readLater.isNSFWUrl = function(url, callback) {
			var check = function() {
				var nsfw = false;

				for (var i = 0, l = expressions.length; i < l; i++) {
					if (url.match(expressions[i])) {
						nsfw = true;
						break;
					}
				}
				callback(nsfw);
			}

			if (!expressions) {
				if (waitFor) {
					waitFor.then(check);
				} else {
					waitFor = window.nadir.readLater.database.database().ref("filters/nsfw").once("value").then(function(snapshot) {
						expressions = snapshot.val().map(function(value) { return new RegExp(value, "i"); });
						check();
					});
				}
			} else {
				check();
			}
		};
	}
})();

if (window.jQuery) {
	if (!window.nadir.readLater.loadFavicons) {
		var createFavicon = function(src, f) {
			var letter = window.location.noProtocol(src)[0].toUpperCase(),
				canvas = document.createElement("canvas"),
				context = canvas.getContext("2d");

			try {
				var image = new Image();

				image.onload = function() {
					var w = image.width,
						h = image.height;

					canvas.width = w;
					canvas.height = h;
					context.imageSmoothingEnabled = false;

					context.drawImage(image, 0, 0);

					context.font = (w / 2).toString() + "px Sans-Serif";
					context.textAlign = "center";
					context.strokeStyle = "#9A7F59";
					context.fillStyle = "#AA9F79";
					context.fillText(letter, w / 2, h / 1.55);
					context.strokeText(letter, w / 2, h / 1.55);

					f(canvas.toDataURL());
				};
				image.src = "./images/base48.png";
				return;
			} catch (e) { }
			f("./images/help48.png");
		}

		window.nadir.readLater.loadFavicons = function(container) {
			window.jQuery(container).find(".favicon").each(function() {
				var icon = window.jQuery(this),
					url = icon.data("url");

				window.nadir.readLater.isNSFWUrl(url, function(nsfw) {
					var isFixedNSFW = window.nadir.readLater.officeMode && nsfw,
						faviconUrl = (isFixedNSFW) ?
							"./images/nsfw48.png" :
							url.split(":")[0] + "://" + url.substring(url.indexOf(":") + 3).split("/")[0] + "/favicon.ico";

					icon.on({
						"error": function(e) {
							var i = $(this);

							((i.data("fixedNSFW")) ?
								function(src, f) { f("./images/help48.png"); } :
								createFavicon)(i.attr("src"), function(src) {
									i.attr({
										"src": src
									});
								});
						}
					})
					.data({
						"fixedNSFW": isFixedNSFW
					})
					.attr({
						"src": faviconUrl
					})
				});
			});
		}
	}
	if (!window.nadir.readLater.createLink) {
		window.nadir.readLater.createLink = function(container, link, buttons) {
			return $(document.createElement("li"))
				.append($(document.createElement("div"))
					.addClass((link.error) ? "ui-state-error" : undefined)
					.append($(document.createElement("div"))
						.addClass("title")
						.addClass("row")
						.append($(document.createElement("div"))
							.addClass("title-row")
							.append($(document.createElement("img"))
								.addClass("favicon")
								.data({
									"url": link.url
								}))
							.append($(document.createElement("div"))
								.addClass("title-title")
								.text(link.title))
							.append((link.category && link.category.length) ?
								$(document.createElement("div"))
									.addClass("category")
									.addClass("ui-state-default")
									.text(link.category) :
								undefined))
						.append((link.date) ? $(document.createElement("div"))
							.addClass("date")
							.text(link.date.toLocaleString()) : undefined))
					.append($(document.createElement("div"))
						.addClass("row")
						.append($(document.createElement("div"))
							.addClass("link")
							.append($(document.createElement("a"))
								.attr({
									"href": link.url,
									"target": "_blank"
								})
								.text(link.url)))
						.append($(document.createElement("div"))
							.addClass("buttons")
							.append((link.error) ? undefined : $(buttons || []).map(function() {
								var item = this,
									id = ((typeof item === "object") ? item.id : item).toLowerCase(),
									icon,
									label,
									state;

								switch (id) {
									case "add":
										icon = "disk";
										label = "Add to Read Later";
										state = "highlight";
										break;
									case "go":
										icon = "extlink";
										label = "Go";
										state = "default";
										break;
									case "rename":
										icon = "pencil";
										label = "Rename";
										state = "default";
										break;
									case "remove":
										icon = "closethick";
										label = "Remove";
										state = "error";
										break;
								}
								return $(document.createElement("button"))
									.addClass("ui-state-" + state)
									.addClass(id)
									.attr({
										"type": "button"
									})
									.button({
										"icons": {
											"primary": "ui-icon-" + icon
										},
										"label": label
									})
									.data({
										"id": id,
										"link": link
									})
									.on({
										"click": function(e) {
											var button = $(this).closest("button"),
												data = button.data();

											switch (data.id) {
												case "add":
													$.confirm("Are you sure you want to add '{0}'?"
														.format((data.link.title && data.link.title.length) ? data.link.title : data.link.url)).then(function() {

															window.loading(function() {
																return $.Deferred(function(deferred) {
																	window.nadir.readLater.add({
																		"uid": window.nadir.readLater.uid,
																		"href": data.link.url,
																		"title": data.link.title,
																		"category": data.link.category,
																		"callback": function(e) {
																			if (e) {
																				deferred.reject();
																				if (item.click) {
																					item.click(e);
																				} else {
																					$.alert(e);
																				}
																			} else {
																				deferred.resolve();
																				if (item.click) {
																					item.click();
																				}
																			}
																		}
																	});
																});
															}, "Adding...");
													});
													break;
												case "go":
													window.open(item.url || data.link.url);
													break;
												case "rename":
													$.prompt("Rename '{0}':".format(data.link.title), data.link.title).then(function(name) {
														if (name && name.length) {
															window.loading(function() {
																return $.Deferred(function(deferred) {
																	window.nadir.readLater.database.database()
																		.ref(window.nadir.readLater.uid + "/" + data.link.id + "/title").set(name).then(function() {
																			button.closest("li").find(".title-title").text(name);
																			data.link.title = name;
																			deferred.resolve();
																			if (item.click) {
																				item.click();
																			}
																		}).catch(function(e) {
																			deferred.reject();
																			if (item.click) {
																				item.click(e);
																			} else {
																				$.alert(e);
																			}
																		});
																});
															}, "Renaming...");
														}
													});
													break;
												case "remove":
													$.confirm("Are you sure you want to remove '{0}'?".format((data.link.title && data.link.title.length) ?
														data.link.title : data.link.url)).then(function() {

														window.loading(function() {
															return $.Deferred(function(deferred) {
																window.nadir.readLater.database.database()
																	.ref(window.nadir.readLater.uid + "/" + data.link.id).set(null).then(function() {
																		button.closest("li").fadeOut(function() {
																			$(this).remove();
																			deferred.resolve();
																			if (item.click) {
																				item.click();
																			}
																		});
																	}).catch(function(e) {
																		deferred.reject();
																		if (item.click) {
																			item.click(e);
																		} else {
																			$.alert(e);
																		}
																	});
															}, "Removing...");
														});
													});
													break;
											}
										}
									})
							}).toArray()))))
				.appendTo(container);
		};
	}
}
