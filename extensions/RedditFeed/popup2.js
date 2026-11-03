"use strict";

const truncateDate = date => new Date(date.getYear(), date.getMonth(), date.getDate());

window.addEventListener("DOMContentLoaded", () => {
	const loader = document.querySelector(".loader"),
		feedList = document.createElement("ul");

	loader.appendChild(feedList);

	const checkFeed = name => {
		const Host = "https://www.reddit.com";

		const feedItem = document.createElement("li"),
			url = Host + "/r/" + name;

		feedItem.classList.add("feed-item");
		feedItem.classList.add("loading");
		feedList.appendChild(feedItem);

		const feedTitle = document.createElement("a");

		feedTitle.setAttribute("target", "_blank");
		feedTitle.setAttribute("href", url);
		feedTitle.classList.add("feed-item");
		feedTitle.classList.add("loading");
		feedTitle.textContent = name + "...";
		feedItem.appendChild(feedTitle);

		const messageItem = document.createElement("div");

		messageItem.classList.add("loader");
		messageItem.classList.add("loading");
		messageItem.textContent = "Loading...";
		feedItem.appendChild(messageItem);

		const done = e => {
			feedItem.classList.remove("loading");
			if (e && e.message) {
				messageItem.classList.remove("loading");
				messageItem.classList.add("error");
				messageItem.textContent = e.message;
			} else {
				feedItem.removeChild(messageItem);
			}
		};

		fetch(url + "/.json").then(response => {
			response.json().then(feed => {
				feedTitle.classList.remove("loading");
				feedTitle.textContent = name;

				const posts = feed.data.children
					.map(child => { return { ...child.data , created: new Date(child.data.created * 1000) } })
					.sort((a, b) => a.created > b.created ? 1 : a.created < b.created ? -1 : 0)
					.reverse();

				Promise.all(posts.map(post => Host + post.permalink)
					.map(url => chrome.history.search({ text: url })
					//.then(r => { console.log(url + ": " + r.length); return r; })
					)).then(visitedPosts => {

					const lastVisitedPost = posts.findIndex((post, i) => visitedPosts[i].length),
						unreadPosts = lastVisitedPost >= 0 ? posts.slice(0, lastVisitedPost) : posts;

					if (unreadPosts.length) {
						const postList = document.createElement("ol");

						let lastDate;

						unreadPosts.forEach((post , i) => {
							const postItem = document.createElement("li"),
								postLink = document.createElement("a"),
								postDate = truncateDate(post.created);

							if (lastDate && lastDate > postDate) {
								postList.appendChild(document.createElement("hr"));
							}

							postLink.setAttribute("href", Host + post.permalink);
							postLink.setAttribute("target", "_blank");
							postLink.classList.add("post-link");
							postLink.textContent = post.title + " (" + post.created.toLocaleString() + ")";
							postItem.appendChild(postLink);
							postList.appendChild(postItem);

							if (visitedPosts[i].length) {
								postItem.classList.add("visited");
							}
							lastDate = postDate;
						});
						done();
						feedItem.appendChild(postList);
						feedItem.classList.add("to-read");
					} else {
						feedItem.classList.remove("loading");
						messageItem.classList.remove("loading");
						messageItem.textContent = "No new post";
					}
				}).catch(done);
			}).catch(done);
		}).catch(done);
	};

	[
		"SWGalaxyOfHeroes",
		"ShitEuropeansSay",
		"comedyheaven",
		"USDefaultism",
		"ShitAmericansSay"
	].forEach(checkFeed);
});
