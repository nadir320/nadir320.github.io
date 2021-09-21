"use strict";

window.document.addEventListener("DOMContentLoaded", function(e) {
	var i = window.document.querySelector("[alt=\"www.000webhost.com\"]"),
		p = i;

	while (p && p.parentElement && p.parentElement !== document.body) {
		p = p.parentElement;
	}
	if (p && p.parentElement) {
		p.parentElement.removeChild(p);
	}
});
