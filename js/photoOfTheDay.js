"use strict";

if (window.photoOfTheDay) {
	(function() {
		window.document.title = window.photoOfTheDay.title;

		var head = window.jQuery("head");

		if (head.length) {
			if (window.photoOfTheDay.favicon && window.photoOfTheDay.favicon.length) {
				var favicon = "./images/" + window.photoOfTheDay.favicon + ".png";

				head
					.append(window.jQuery(document.createElement("link"))
						.attr({
							"href": favicon,
							"rel": "icon",
							"type": "image/png"
						}))
					.append(window.jQuery(document.createElement("link"))
						.attr({
							"href": favicon,
							"rel": "shortcut icon",
							"type": "image/png"
						}));
			}

			if (window.jQuery &&
				window.jQuery.ui &&
				window.jQuery.ui.themes &&
				window.jQuery.ui.themes.length &&
				window.photoOfTheDay.theme &&
				window.photoOfTheDay.theme.length) {

				var theme = window.jQuery.grep(window.jQuery.ui.themes, function(item) {
					return item.name.toLowerCase() === window.photoOfTheDay.theme.toLowerCase();
				});

				if (theme.length && (theme = theme[0])) {
					head
						.append(window.jQuery(document.createElement("meta"))
							.attr({
								"content": theme.theme,
								"name": "theme-color"
							}))
						.append(window.jQuery(document.createElement("link"))
							.attr({
								"href": theme.url,
								"rel": "stylesheet",
								"type": "text/css"
							}));
				}
			} else if (window.photoOfTheDay.theme &&
				window.photoOfTheDay.theme.length &&
				window.photoOfTheDay.theme.match(/\/\//)) {

				head.append(window.jQuery(document.createElement("link"))
					.attr({
						"href": window.photoOfTheDay.theme,
						"rel": "stylesheet",
						"type": "text/css"
					}));
			}
		}
	})();

	(function() {
		var parseDate = function(date, type) {
			return new Date(date.getTime() +
				(date.getTimezoneOffset() * 6e4) +
				new Date(date.getFullYear() + "-" +
					(date.getMonth() + 1) + "-" +
					date.getDate()).getTime() -
				new Date(date.getFullYear() + "-" +
					(date.getMonth() + 1) + "-" +
					date.getDate() + " " + type +
					((new Date(date.getFullYear(), 1, 1).getTimezoneOffset() === date.getTimezoneOffset()) ?
						"S" :
						"D") + "T").getTime());
		};

		window.photoOfTheDay.easternTime = window.photoOfTheDay.easternTime || function(date) {
			return parseDate(date, "E");
		};
		window.photoOfTheDay.easternTimeNow = window.photoOfTheDay.easternTimeNow || function() {
			/* var date = new Date(),
				time = date.getTime();

			time += date.getTimezoneOffset() * 6e4;
			time += (-5) * 36e5;
			return new Date(time); */

			var moment = window.moment.tz(new Date(), "America/New_York");

			return new Date(moment.year(), moment.month(), moment.date(),
				moment.hours(), moment.minutes(), moment.seconds());
		};
		window.photoOfTheDay.pacificTime = window.photoOfTheDay.pacificTime || function(date) {
			return parseDate(date, "P");
		};
	})();

	window.jQuery().ready(function() {
		var createLinkButton = function(text, href, inline, disabled) {
			if (!inline) {
				window.jQuery(document.createElement("br"))
					.appendTo(window.jQuery(".container"));
			}
			var button = window.jQuery(document.createElement("a"))
				.attr({
					"href": href
				})
				.button({
					"label": text
				})
				.hide()
				.appendTo(window.jQuery(".container"));

			if (disabled) {
				button.button("disable");
			}
			return button.fadeIn("slow");
		};

		(function(date) {
			if (window.photoOfTheDay.bodyWidgetClass &&
				window.photoOfTheDay.bodyWidgetClass.length) {

				(function() {
					var body = window.jQuery(document.body);

					if (body.length) {
						body.addClass("ui-widget-{0}"
							.format(window.photoOfTheDay.bodyWidgetClass));
					}
				})();
			}
			window.loading(function() {
				var errorHandler = function(error, textStatus) {
					if (textStatus === "error" && error === "error") {
						window.jQuery.toast.error("An error occurred");
					} else {
						window.jQuery.toast.error(textStatus);
						createLinkButton("Ricarica", location.href);
						window.jQuery(document.createElement("br"))
							.appendTo(window.jQuery(".container"));
					}
				}, getDateString = function(date) {
					return date.getFullYear() + "-" +
							(date.getMonth() + 1).toString().zeroPad(2) + "-" +
							(date.getDate()).toString().zeroPad(2);
				}, isLatest, latestDate, load, noTomorrow,
					todayHere = new Date(), waitFor, yesterday, yesterdayLink;

				if (window.isNaN(date = date || new Date())) {
					date = todayHere;
					if (isLatest = !!window.photoOfTheDay.getLatestDate) {
						waitFor = window.jQuery.Deferred(function(deferred) {
							window.jQuery.when(window.photoOfTheDay.getLatestDate())
								.then(function(currentDate) {
									latestDate = currentDate;
									deferred.resolve();
								}, deferred.reject);
							}).promise();
					}
				}
				if (window.isNaN(latestDate)) {
					latestDate = date;
				}
				return window.jQuery.when(waitFor).then(function() {
					yesterdayLink = window.location.set({
						"date": getDateString(yesterday = new Date(latestDate.getFullYear(),
							latestDate.getMonth(),
							latestDate.getDate() - 1))
					});
					return window.jQuery.when(window.jQuery.ajax({
						"url": window.photoOfTheDay.jsonURL.format((window.photoOfTheDay.getDateString) ?
							window.photoOfTheDay.getDateString(latestDate) :
							getDateString(latestDate))
					})).then(function(data) {
						var isToday;

						if (!(isToday = latestDate.getFullYear() === todayHere.getFullYear() &&
							latestDate.getMonth() === todayHere.getMonth() &&
							latestDate.getDate() === todayHere.getDate())) {

							window.jQuery(".date").text(latestDate.toLocaleDateString(undefined, {
								"weekday": "long",
								"month": "long",
								"day": "numeric",
								"year": (latestDate.getFullYear() === todayHere.getFullYear()) ?
									undefined :
									"numeric"
							})).fadeIn();
						}
						if (typeof (load = window.photoOfTheDay.loadJSON(data, latestDate, isToday)) === "boolean") {
							noTomorrow = isLatest || (latestDate.getFullYear() === todayHere.getFullYear() &&
								latestDate.getMonth() === todayHere.getMonth() &&
								latestDate.getDate() === todayHere.getDate());
							if (!load) {
								errorHandler(String.empty, "Unknown error");
							}
						} else {
							window.location.href = yesterdayLink;
						}
					}, function(jqXHR, error, textStatus) {
						if (window.location.sameProtocol(window.photoOfTheDay.jsonURL) === window.photoOfTheDay.jsonURL) {
							errorHandler(error, textStatus);
						} else {
							window.jQuery.toast.error("This page cannot be accessed via {0}".format(window.location.protocol.replace(/:/g, "")));
						}
					}).always(function() {
						createLinkButton("<", yesterdayLink);
						createLinkButton("Vedi pagina", window.photoOfTheDay.pageURL, true).attr({
							"target": "_blank"
						});
						createLinkButton(">", window.location.set({
							"date": getDateString(new Date(latestDate.getFullYear(),
								latestDate.getMonth(),
								latestDate.getDate() + 1))
						}), true, noTomorrow);
					});
				});
			}, "Connessione...");
		})(new Date(window.location.get("date")));
	});
} else {
	(function() {
		var currentScripts = window.document.getElementsByTagName("script"),
			min,
			source;

		if (currentScripts.length) {
			source = currentScripts[currentScripts.length - 1].getAttribute("src").split("?");
			min = (source[0].match(/\.min\./)) ? ".min" : "";
			source = source.pop().split("=").pop();

			window.document.open();
			window.document.write("<html>" +
			"	<head>" +
			"		<meta charset=\"utf-8\"/>" +
			"		<meta name=\"mobile-web-app-capable\" content=\"yes\"/>" +
			"		<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"/>" +
			"		<meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\"/>" +
			"		<script type=\"text/javascript\" src=\"../js/pancake" + min + ".js\"></script>" +
			"		<script type=\"text/javascript\" src=\"../js/000webhost" + min + ".js\"></script>" +
			"		<script type=\"text/javascript\" src=\"//code.jquery.com/jquery-2.2.3" + min + ".js\"></script>" +
			"		<script type=\"text/javascript\" src=\"//code.jquery.com/ui/1.11.4/jquery-ui" + min + ".js\"></script>" +
			"		<link rel=\"stylesheet\" type=\"text/css\" href=\"../css/base" + min + ".css\"/>" +
			"		<script type=\"text/javascript\" src=\"../js/base" + min + ".js\"></script>" +
			"		<link rel=\"stylesheet\" type=\"text/css\" href=\"../css/photo-of-the-day" + min + ".css\"/>" +
			"		<script type=\"text/javascript\" src=\"../cdnjs.cloudflare.com/ajax/libs/moment.js/2.24.0/moment" + min + ".js\"></script>" +
			"		<script type=\"text/javascript\" src=\"../cdnjs.cloudflare.com/ajax/libs/moment-timezone/0.5.26/moment-timezone-with-data" + min + ".js\"></script>" +
			"		<script type=\"text/javascript\" src=\"js/" + source + min + ".js\"></script>" +
			"		<script type=\"text/javascript\" src=\"../js/photoOfTheDay" + min + ".js\"></script>" +
			"	</head>" +
			"	<body class=\"ui-widget large-on-large-screens\">" +
			"		<div class=\"container\">" +
			"			<div class=\"date\"></div>" +
			"			<a class=\"photoLink\">" +
			"				<img class=\"photoOfTheDay\" src=\"//:0\"/></a>" +
			"				<iframe class=\"videoOfTheDay\" src=\"about:blank\" scrolling=\"no\" " +
			"					frameborder=\"0\" marginwidth=\"0\" marginheight=\"0\" vspace=\"0\" hspace=\"0\"></iframe>" +
			"			<br/>" +
			"			<div class=\"caption\"></div>" +
			"			<div class=\"copyright\"></div>" +
			"		</div>" +
			"		<div class=\"dialog loaderDialog\">" +
			"			<div class=\"loadingProgress\"></div>" +
			"			<div class=\"loadingMessage\"></div>" +
			"		</div>" +
			"	</body>" +
			"</html>");
		}
	})();
}
