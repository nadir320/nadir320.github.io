"use strict";

window.photoOfTheDay = {
	  "bodyWidgetClass": "content"
	, "favicon": "apod"
	, "jsonURL": "https://api.nasa.gov/planetary/apod?api_key=aw8ag28u5AV2Y6SYqfSWvPMc3ItWwxEtoHPmi9gH&date={0}"
	, "pageURL": "https://apod.nasa.gov/apod/astropix.html"
	, "theme": "Dark Hive"
	, "title": "NASA - Astronomic Picture of the Day"

	, "getLatestDate": function(date) {
		return window.photoOfTheDay.easternTimeNow();
	}, "loadJSON": function(data, date, isToday) {
		var cleanupURL = function(url) {
				if (url && url.length) {
					if (url.split(":").length > 2) {
						url = url.substr(url.lastIndexOf(":") + 1);
					}
				}
				return url;
			},
			description = $(document.createElement("div"))
				.append($(document.createElement("strong")).html(data.title))
				.append($(document.createElement("p")).html(data.explanation));

		data.hdurl = cleanupURL(data.hdurl);
		data.url = cleanupURL(data.url);

		if (data.copyright && data.copyright.length) {
			$(document.createElement("div"))
				.addClass("copyright")
				.text(data.copyright)
				.appendTo(description);
		}
		if (data.media_type === "video") {
			$(".videoOfTheDay").attr({
				"src": data.url
			}).show();
		} else {
			if (data.hdurl && data.hdurl.length) {
				$(".photoLink").attr({
					"href": data.hdurl
				});
			}
			$(".photoOfTheDay").attr({
				"src": data.url
			})
			$(".photoLink").show();
		}
		$(".caption").html(description.html());
		if (!isToday) {
			window.photoOfTheDay.pageURL = "https://apod.nasa.gov/apod/ap{0}{1}{2}.html"
				.format((date.getFullYear() - 2e3).toString().zeroPad(2),
					(date.getMonth() + 1).toString().zeroPad(2),
					date.getDate().toString().zeroPad(2));
		}
		return true;
	}
};
