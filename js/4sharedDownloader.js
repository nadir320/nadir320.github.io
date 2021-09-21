"use strict";

(function() {
	/* var SECONDS = 20; */

	var /* date,
		href,
		i,
		index,
		index2, */
		link,
		/* name,
		pad2 = function(n) {
			return (n < 10) ? "0" + n : n
		},
		params,
		parts, */
		url/* ,
		value */;

	if (~window.location.hostname.search(/4shared\.com/i)) {
		if (~window.location.href.search(/get/i)) {
			try {
				link = (document.getElementById("baseDownloadLink") ||
					document.querySelector("[name=d3link]")).value;

				/* params = link.substring(index = link.indexOf("?") + 1).split("&");
				link = link.substring(0, index);
				for (i = 0; i < params.length; i++) {
					if ((name = params[i].substring(0, index2 = params[i].indexOf("="))).toLowerCase() === "tsid") {
						parts = params[i].substring(index2 + 1).split("-");
						date = new Date(parts[0].substr(0, 4),
							parts[0].substr(4, 2) - 1,
							parts[0].substr(6, 2),
							parts[1].substr(0, 2),
							parts[1].substr(2, 2),
							parts[1].substr(4, 2));
						date = new Date(date.getTime() - SECONDS * 1000);
						params[i] = name + "=" + date.getFullYear() +
							pad2(date.getMonth() + 1) +
							pad2(date.getDate()) + "-" +
							pad2(date.getHours()) +
							pad2(date.getMinutes()) +
							pad2(date.getSeconds()) +
							"-" + parts[2];
						link += params.join("&");
						break;
					}
				} */
				if (window.confirm("Go to\n\n" + link + "\n\n?")) {
					window.location.href = link;
				}
			} catch (e) {
				window.alert(e.message);
			}
		} else {
			url = window.location.href.split("/");
			url[3] = "get";
			window.location.href = url.join("/");
		}
	} else {
		window.alert("This works on 4shared only!");
	}
})();
