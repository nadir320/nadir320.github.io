"use strict";

(function(window) {
	var thisScript = Array.prototype.slice.call(window.document.getElementsByTagName("script")).pop(),
		source = thisScript.src,
		uid = thisScript.getAttribute("uid");

	if (!(uid && uid.length)) {
		uid = (function(url, name) {
			var i = url.indexOf("?"), l, n;

			if (i >= 0) {
				url = url.substring(i + 1).split("&");
				for (i = 0, l = url.length; i < l; i++) {
					if ((n = url[i].split("="))[0].toLowerCase() === name.toLowerCase()) {
						return n.pop();
					}
				}
			}
		})(source, "uid");
	}
	if (window.nadir && window.nadir.readLater && window.nadir.readLater.add) {
		window.nadir.readLater.add(uid, window.location.href, window.document.title);
	} else {
		(function() {
			var Firebase_Base = "https://www.gstatic.com/firebasejs/5.8.4/",
				Firebase_App = Firebase_Base + "firebase-app.js",
				Firebase_Database = Firebase_Base + "firebase-database.js";

			var add = source.split("/");

			add.push("add" + ((add.pop().match(/\.min\./i)) ? ".min" : "") + ".js");
			add = add.join("/");

			var requireScript = function(test, address, callback) {
				if (!test) {
					var tag = document.createElement("script");

					tag.setAttribute("type", "text/javascript");
					tag.setAttribute("src", address);
					tag.onload = function() {
						callback();
					};
					document.body.appendChild(tag);
				} else {
					callback();
				}
			};

			requireScript(window.firebase, Firebase_App, function() {
				requireScript(window.firebase.database, Firebase_Database, function() {
					requireScript(window.nadir && window.nadir.readLater && window.nadir.readLater.add, add, function() {
						window.nadir.readLater.add(uid, window.location.href, window.document.title);
					});
				});
			});
		})();
	}
})(window);
