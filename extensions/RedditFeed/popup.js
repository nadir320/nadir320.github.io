"use strict";

window.addEventListener("DOMContentLoaded", () => {
	chrome.runtime.sendMessage(null, "a", null, posts => {
		const ul = document.createElement("ol");

		posts.forEach(post => {
			const li = document.createElement("li");

			li.innerText = post.title + " (" + new Date(post.created).toLocaleString() + ")";
			ul.appendChild(li);
		});
		document.body.appendChild(ul);
	});
});
