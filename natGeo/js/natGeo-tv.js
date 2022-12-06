"use strict";

var englishMonths = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December"
];

window.photoOfTheDay = {
	  "bodyWidgetClass": "header"
	, "favicon": "natGeo"
	, "getDateString": function(date) { return date.getFullYear() + "/" + englishMonths[date.getMonth()].toLowerCase(); }
	, "jsonURL": "https://api.allorigins.win/get?url=https://www.natgeotv.com/ca/photo-of-the-day/{0}"
	, "jsonURL1": "http://localhost/home/dropbox/web/cors/proxy.aspx?route=https://www.natgeotv.com/ca/photo-of-the-day/{0}"
	, "pageURL": "https://www.natgeotv.com/ca/photo-of-the-day/"
	, "siteURL": "https://www.natgeotv.com/ca/photo-of-the-day/"
	, "theme": "UI Darkness"
	, "title": "National Geographic TV - Photo of the Day"

	, "getLatestDate": function(date) {
		return new Date(window.photoOfTheDay.easternTimeNow().getTime() - 36e5);
	}, "loadJSON": function(data, date, isToday) {
		var found = false,
			theDate = date.getDate() + " " + englishMonths[date.getMonth()] + " " + date.getFullYear(),
			page = (data.contents || data).replace(/ src="/gi, " data-src=\"");

		$(page).find("li.PODItem").each(function(i, item) {
			var caption,
				copyright,
				href,
				pageURL,
				source;

			if ((item = $(item)).find(".ItemDate").text().trim().toLowerCase() === theDate.toLowerCase()) {
				found = true;

				caption = item.find(".ItemDescription").text();
				copyright = item.find(".ItemPhotographer").text();
				href = source = item.find("img").data("src");
				
				try {
					caption = JSON.parse("\"" + caption + "\"");
				} catch (e) { }

				$(".photoLink").attr({
					"href": href
				});
				$(".photoOfTheDay").attr({
					"src": source
				});
				$(".photoLink").show();
				$(".caption")
					.html($(document.createElement("div"))
						.append($(document.createElement("div")).html(caption))
						.html());
				$(".copyright").text(copyright);

				window.photoOfTheDay.pageURL = window.photoOfTheDay.siteURL + date.getFullYear() + "/" + englishMonths[date.getMonth()].toLowerCase() + "#" + item.find("a").first().attr("id");
				return false;
			}
		});
		return found;
	}
};
