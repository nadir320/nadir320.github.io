"use strict";

if (!window.nadir) {
	window.nadir = { };
}
if (!window.nadir.addToReadLater) {
	window.nadir.addToReadLater = function(uid, href, title, closeWindow) {
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
					"date": now.toISOString(),
					"title": title,
					"url": href
				}).then(function() {
					window.alert("Saved!");
					done();
				}).catch(function(e) {
					window.alert(e.description || e.message || e);
					done();
				}).finally(function() {
					app.delete();
				});
			} catch (e) {
				window.alert(e.description || e.message || e);
				done();
			}
		}
	};
}
