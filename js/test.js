(function() {
	var functionName = "a23ff9aa7b4811e68b7786f30ca893d3",
		F = function($) {
			$(document.createElement("div"))
				.text("test!")
				.dialog({
					"close": function(e, ui) {
						$(this).remove();
					},
					"destroyOnClose": true,
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
						dialog.closest(".ui-dialog").css("z-index", ++maxZIndex);
					},
					"resizable": false,
					"show": true,
					"title": "Test"
				});
		};

	if (window[functionName]) {
		window[functionName](window.jQuery);
	} else {
		(function() {
			var GOOGLE_HOST = "//ajax.googleapis.com/ajax/libs/"
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
