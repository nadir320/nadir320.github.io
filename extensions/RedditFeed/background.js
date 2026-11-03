chrome.action.onClicked.addListener(tab => {
	return;

	const alert = message => chrome.notifications.create({
		type: "basic",
		iconUrl: "r.png",
		title: "R",
		message: message,
		priority: 1
	});

	const done = () => {
		chrome.action.setBadgeText({ text: null });
	};

	//chrome.action.setIcon({ path: "feeding.png" });
	chrome.action.setBadgeText({ text: "..." });
	chrome.action.setBadgeBackgroundColor({color: 'lightgreen'}, () => { /* ... */ });

	fetch("https://www.reddit.com/r/SWGalaxyOfHeroes/.json")
		.then(response => response.json()
			.then(feed => {
				const posts = feed.data.children
					.map(child => { return { ...child.data /*, created: new Date(child.data.created * 1000) */ } })
					.sort((a, b) => a.created > b.created ? -1 : a.created < b.created ? 1 : 0);

				/* console.log(posts.map(post => post.title + " (" + post.created.toLocaleString() + ")").join("\n")); */
				done();

				chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
					sendResponse(posts);
					return true;
				});

				chrome.action.setPopup({ popup: "popup.html" });
				chrome.action.openPopup();
			})
			.catch(e => { alert(e.message); done(); }))
		.catch(e => { alert(e.message); done(); });

	/* chrome.tabs.query({
		currentWindow: true,
		active: true
	}, function(tab) {
		chrome.tabs.create({
			"url": "http://help.opera.com"
		});
	}); */
});
