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
	, "jsonURL": "https://api.allorigins.win/get?url=https://photography.nationalgeographic.com/photography/photo-of-the-day/"
	, "jsonURL1": "http://localhost/home/dropbox/web/cors/proxy.aspx?route=https://photography.nationalgeographic.com/photography/photo-of-the-day/"
	, "pageURL": "https://photography.nationalgeographic.com/photography/photo-of-the-day/"
	, "siteURL": "https://www.nationalgeographic.com/"
	, "theme": "Dot LUV"
	, "title": "National Geographic - Photo of the Day"

	, "getLatestDate": function(date) {
		return new Date(window.photoOfTheDay.easternTimeNow().getTime() - 36e5);
	}, "loadJSON": function(data, date, isToday) {
		var p = data.contents.indexOf("{", data.contents.indexOf("__natgeo__"));

		data = window.JSON.parse(data.contents.substring(p, data.contents.indexOf("</script>", p) - 1));

		var found = false,
			theDate = englishMonths[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();

		$(data.page.content.mediaspotlight.frms[0].mods[0].edgs.pop().media).each(function(i, item) {
			var caption,
				copyright,
				hostName,
				href,
				pageURL,
				source,
				title;

			if (item.caption.preHeading === theDate) {
				found = true;

				caption = item.caption.text;
				copyright = item.caption.credit;
				href =
					source = item.img.src;
				title = item.caption.title;

				$(".photoLink").attr({
					"href": href
				});
				$(".photoOfTheDay").attr({
					"src": source
				});
				$(".photoLink").show();
				$(".caption")
					.html($(document.createElement("div"))
						.append($(document.createElement("strong")).html(title))
						.append($(document.createElement("div")).html(caption))
						.html());
				$(".copyright").text(copyright);


				if (item.locator.indexOf(":") >= 0) {
					pageURL = String.empty;
				} else if (item.locator[0] === "/") {
					pageURL = window.photoOfTheDay.siteURL;
					item.locator = item.locator.substr(1);
				} else {
					pageURL = window.photoOfTheDay.pageURL;
				}
				window.photoOfTheDay.pageURL = pageURL + item.locator;
				return false;
			}
		});
		return found;
	}
};
