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
if (!window.nadir.readLater.database) {
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
if (window.jQuery && !window.nadir.readLater.loadFavicons) {
	window.nadir.readLater.loadFavicons = function(container) {
		window.jQuery(container).find(".favicon").each(function() {
			var icon = window.jQuery(this),
				url = icon.data("url");

			window.nadir.readLater.isNSFWUrl(url, function(nsfw) {
				var faviconUrl = (window.nadir.readLater.officeMode && nsfw) ?
					"./images/nsfw48.png" :
					url.split(":")[0] + "://" + url.substring(url.indexOf(":") + 3).split("/")[0] + "/favicon.ico";

				icon.on({
					"error": function(e) {
						icon.attr({
							"src": "./images/help48.png"
						});
					}
				})
				.attr({
					"src": faviconUrl
				})
			});
		});
	}
}
