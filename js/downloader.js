"use strict";

(function() {
	var functionName = "f375dd96fc464c42bdfa3847f4a41661",
		F = function($) {
			var height = window.innerHeight * 0.6;

			$(document.createElement("div"))
				.css({
					"overflow": "auto"
				})
				.appendTo(document.body)
				.dialog({
					"close": function(e, ui) {
						$(this).remove();
					},
					"destroyOnClose": true,
					"height": height,
					"hide": true,
					"modal": true,
					"open": function(e, ui) {
						var dialog = $(this),
							maxValue = Math.pow(2, 31) - 1,
							maxZIndex = 0,
							overlay = dialog
								.dialog("instance")
								.overlay;

						overlay.off().on({
							"click": function(e) {
								if (e.which === 1) {
									dialog.dialog("close");
								}
							}
						});
						$("*").each(function(i, item) {
							var z = parseInt($(item).css("z-index"));

							if (!isNaN(z) && z < maxValue) {
								maxZIndex = Math.max(maxZIndex, z);
							}
						});
						overlay.css("z-index", ++maxZIndex);
						dialog.closest(".ui-dialog").css({
							"position": "fixed",
							"top": (height / 3).toString() + "px",
							"z-index": ++maxZIndex
						});

						var dialogElement = $(this).css({
							"font-size": "10pt"
						});

						var containerElement = $(document.createElement("ul"))
							.css({
								"list-style-type": "disc",
								"padding-left": "2em"
							})
							.appendTo(dialogElement);

						var createLinks = function(name, selector, hrefConverter, textConverter, download) {
							var items = $(selector),
								keys,
								links,
								listElement;

							if (items.length) {
								keys = [ ];
								links = [ ];
								items.each(function(i, item) {
									var href = hrefConverter(item = $(item)),
										text;

									if (href && href.length && href !== "#" && href !== "/") {
										if (!keys[href]) {
											if (textConverter) {
												text = textConverter(item);
											}
											text = (text && text.length) ?
												text + " (" + href + ")" :
												href;
											links.push({
												"href": href,
												"text": text
											});
											keys[href] = href;
										}
									}
								});
								if (links.length) {
									$(document.createElement("li"))
										.append($(document.createElement("span"))
											.css({
												"font-size": "16pt",
												"font-weight": "bold"
											})
											.text(name + " (" + links.length.toLocaleString() + ")")
											.append((download) ?
												$(document.createElement("a"))
													.attr({
														"href": "data:text/xml;charset=utf-8," + encodeURIComponent($(document.createElement("div"))
															.append($(document.createElement("downloads"))
																.attr({
																	"folder": "."
																})
																.append($.map(links, function(link) {
																	return $(document.createElement("download"))
																		.attr({
																			"url": link.href
																		});
																})))
															.html()),
														"download": window.location.href.split("/").pop() + ".xml",
														"target": "_blank"
													})
													.button({
														"icons": {
															"primary": "ui-icon-script"
														},
														"text": false
													})
													.css({
														"height": "1.5em",
														"margin-left": "0.5em"
													})
													.on({
														"click": function(e) {
														}
													}) :
												undefined))
										.append(listElement = $(document.createElement("ol"))
											.css({
												"list-style-type": "decimal",
												"padding-left": "2em"
											}))
										.appendTo(containerElement);
									$(links).each(function(i, item) {
										$(document.createElement("li"))
											.append($(document.createElement("a"))
												.attr({
													"download": item.href,
													"href": item.href,
													"target": "_blank"
												})
												.text(item.text))
											.appendTo(listElement);
									});
								}
							}
						};

						createLinks("Audios", "audio", function(item) { return item[0].currentSrc || item.attr("src"); }, undefined, true);
						createLinks("Videos", "video", function(item) { return item[0].currentSrc || item.attr("src"); }, undefined, true);
						createLinks("Links", "a", function(item) { return item.attr("href"); }, function(item) { return item.text(); });
					},
					"resizable": true,
					"show": true,
					"title": "Download",
					"width": $(window).width() * 0.75
				});
		};

	if (window[functionName]) {
		window[functionName](window.jQuery);
	} else {
		(function() {
			var GOOGLE_HOST = "//ajax.googleapis.com/ajax/libs/",
				JQUERY = GOOGLE_HOST + "jquery/3.1.0/jquery.min.js",
				JQUERY_UI = GOOGLE_HOST  + "jqueryui/1.12.0/jquery-ui.min.js",
				JQUERY_UI_THEME = GOOGLE_HOST + "jqueryui/1.12.0/themes/smoothness/jquery-ui.css";

			var require = function(test, type, address, callback) {
				if (!test) {
					var tag,
						tagName;

					switch (type = (type || "script").toLowerCase()) {
						case "css":
							tagName = "link";
							break;
						case "script":
						default:
							tagName = "script";
							break;
					}
					tag = document.createElement(tagName);
					switch (type) {
						case "css":
							tag.setAttribute("rel", "stylesheet");
							tag.setAttribute("type", "text/css");
							tag.setAttribute("href", address);
							break;
						case "script":
							tag.setAttribute("type", "text/javascript");
							tag.setAttribute("src", address);
							break;
					}
					tag.onload = function() {
						callback();
					};
					document.body.appendChild(tag);
				} else {
					callback();
				}
			};

			var run = function($) {
				(window[functionName] = F)($);
			};

			require(window.jQuery, "script", JQUERY, function() {
				(function($) {
					require($.ui, "script", JQUERY_UI, function() {
						var e = $(document.createElement("div"))
							.addClass("ui-widget-header")
							.hide()
							.appendTo(document.body);

						window.setTimeout(function() {
							require(e.css("background-image") !== "none", "css", JQUERY_UI_THEME, function() {
								e.remove();
								run($);
							});
						});
					});
				})(window.jQuery);
			});
		})();
	}
})();
