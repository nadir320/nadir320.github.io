"use strict";

if (!window.nadir) {
	window.nadir = { };
}
if (!window.nadir.readLater) {
	window.nadir.readLater = { };
}
if (!window.nadir.readLater.add) {
	window.nadir.readLater.add = function(uid, href, title, closeWindow, category, callback) {
		if (arguments.length === 1 && typeof uid === "object") {
			href = uid.href;
			title = uid.title;
			closeWindow = uid.closeWindow;
			category = uid.category;
			callback = uid.callback;

			uid = uid.uid;
		}

		if (uid && uid.length && href && href.length) {
			var done = function() {
				if (closeWindow) {
					window.close();
				}
			};

			try {
				var now = new Date(),
					time = now.getTime().toString();

				var app = window.firebase.initializeApp({
					"apiKey": "AIzaSyA58csfwsnx3CIFhx73ecGlP0dY9-s8BS4",
					"databaseURL": "https://readlater-274ac.firebaseio.com"
				}, time);

				app.database().ref(uid + "/" + time).set({
					"category": category,
					"date": now.toISOString(),
					"title": title,
					"url": href
				}).then(function() {
					if (callback) {
						callback();
					} else {
						window.alert("Saved!");
					}
					done();
				}).catch(function(e) {
					if (callback) {
						callback(e);
					} else {
						window.alert(e.description || e.message || e);
					}
					done();
				}).finally(function() {
					app.delete();
				});
			} catch (e) {
				if (callback) {
					callback(e);
				} else {
					window.alert(e.description || e.message || e);
				}
				done();
			}
		}
	};
}
