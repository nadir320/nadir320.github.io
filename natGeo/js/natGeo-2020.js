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
	, "jsonURL": "https://www.nationalgeographic.com/photography/photo-of-the-day/_jcr_content/.gallery.{0}.json?user.testname=none"
	, "pageURL": "https://photography.nationalgeographic.com/photography/photo-of-the-day/"
	, "theme": "Dot LUV"
	, "title": "National Geographic - Photo of the Day"

	, "getLatestDate": function(date) {
		return new Date(window.photoOfTheDay.easternTimeNow().getTime() - 36e5);
	}, "loadJSON": function(data, date, isToday) {
		var found = false,
			theDate = englishMonths[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();

		$(data.items).each(function(i, item) {
			if (item.publishDate === theDate) {
				var caption = item.caption,
					copyright,
					href,
					i,
					image,
					sizeWidth,
					source,
					title = item.title,
					windowWidth;

				found = true;
				if (item.sizes) {
					windowWidth = $(window).width();

					for (sizeWidth in item.sizes) {
						if (sizeWidth < windowWidth) {
							source = item.sizes[sizeWidth];
						} else {
							break;
						}
					}
					href = item.sizes[sizeWidth];
					source = source || href;

					if (href.indexOf(":") < 0) {
						href = item.url + href;
					}
					if (source.indexOf(":") < 0) {
						source = item.url + source;
					}
				} else if (item.image) {
					windowWidth = $(window).width();

					for (i in item.image.renditions) {
						image = item.image.renditions[i];

						if (parseInt(image.width) < windowWidth) {
							source = image.uri;
						} else {
							break;
						}
					}
					href = item.image.renditions[item.image.renditions.length - 1].uri; // source; // item.pageUrl;
					title = item.image.title;
					caption = item.image.caption;
					copyright = item.image.credit;
				} else {
					href = source = item.originalUrl || item.url || item.pageURL;
				}
				if (item.social) {
					if (!(caption && caption.length)) {
						caption = item.social["og:description"];
					}
					if (!(title && title.length)) {
						title = item.social["og:title"];
					}
				}
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
				window.photoOfTheDay.pageURL = item.pageUrl;
				return false;
			}
		});
		return found;
	}
};
