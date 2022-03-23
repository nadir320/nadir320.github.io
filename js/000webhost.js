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

	if (window.document.evaluate) {
		while (p = document.evaluate("//div[contains(., \"Ukraine\")]", document, null, XPathResult.ANY_TYPE, null).iterateNext()) {
			if (p.parentElement === document.body) {
				p.parentElement.removeChild(p);
			}
		}
});
