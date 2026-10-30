"use strict";

window.photoOfTheDay = {
	  "bodyWidgetClass": "content"
	, "favicon": "apod"
	, "jsonURL1": "https://api.nasa.gov/planetary/apod?api_key=aw8ag28u5AV2Y6SYqfSWvPMc3ItWwxEtoHPmi9gH&date={0}"
	, "jsonURL": "https://science.nasa.gov/wp-json/wp/v2/apod-basic/{0}"
	, "pageURL": "https://apod.nasa.gov/apod/astropix.html"
	, "theme": "Dark Hive"
	, "title": "NASA - Astronomic Picture of the Day"

    , "getDateString": function(date) {
        return (date.getFullYear() - 2e3).toString().zeroPad(2) +
            (date.getMonth() + 1).toString().zeroPad(2) +
            date.getDate().toString().zeroPad(2);
    },
    "getLatestDate": function(date) {
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
				.append($(document.createElement("p")).html(data.explanation)),
            videoUrl;

		data.hdurl = cleanupURL(data.hdurl);
		data.url = cleanupURL(data.url);

		if (data.copyright && data.copyright.length) {
			$(document.createElement("div"))
				.addClass("copyright")
				.html(data.copyright)
				.appendTo(description);
		}
		if (data.media_type === "video") {
            videoUrl = data.url;

            if (data.basic_html && data.basic_html.length) {
                (function(value) {
                    var safeValue = value.replace("src=\"", "x-src=\""),
                        container = $(document.createElement("div")),
                        e;

                    container.html(safeValue);
                    e = container.find("iframe");
                    if (e.length) {
                        $(".iframeOfTheDay").attr({
                            "src": e.attr("x-src")
                        }).show();
                    } else {
                        e = container.find("video");
                        if (e.length) {
                            e = e.find("source");
                            if (e.length) {
                                $(".videoOfTheDay").attr({
                                    "src": e.attr("x-src")
                                }).show();
                            }
                        }
                    }
                })(data.basic_html);
            } else {
                $(".videoOfTheDay").attr({
                    "src": data.url
                }).show();
            }
		} else {
			if (data.hdurl && data.hdurl.length) {
				$(".photoLink").attr({
					"href": data.hdurl
				});
			}
            $(".photoOfTheDay").attr({
                "src": (data.url === data.permalink) ? data.hdurl : data.url
            })
			$(".photoLink").show();
		}
		$(".caption").html(description.html());
        window.photoOfTheDay.pageURL = data.url;
		return true;
	}
};
