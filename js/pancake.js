﻿"use strict";

if (!(window.location.search && window.location.search.length) &&
	!(window.location.hash && window.location.hash.length)) {

	var fileName = window.location.href.split("/").pop();

	if (fileName &&
		fileName.length &&
		fileName.indexOf(".") < 0) {

		window.location.replace(window.location.href + "/");
	}
}
window.NREUM = { };
