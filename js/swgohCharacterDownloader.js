"use strict";

(function() {
	var url = "https://swgoh.gg/";

	if (window.location.href.toLowerCase() === url) {
		var content = JSON.stringify($.makeArray($("a.character").map(function(i, item) {
			return {
				"name": $(item).find("h5").text(),
				"image": $(item).find(".character-portrait__img").attr("src")
			}
		})), true, 4);

		var link = $(document.createElement("a"))
			.attr({
				"download": "swgoh.gg.json",
				"href": "data:text/plain;base64," +
					btoa("\xef\xbb\xbf" + window.encodeURIComponent(content).replace(/%([0-9A-F]{2})/g,
						function(match, p) { return String.fromCharCode("0x" + p); }))
			})
			.appendTo(document.body);

		link[0].click();
		link.remove();
	} else {
		window.alert("This works on '" + url + "' only!");
	}
})();
