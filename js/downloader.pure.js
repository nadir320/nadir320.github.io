"use strict";

(function() {
	var closeButton,
		closeFunction,
		containerElement,
		createLinks,
		dialogElement,
		keyboardHandler;

	try {
		window.document.body.appendChild(dialogElement = window.document.createElement("div"));

		dialogElement.style.backgroundColor = "white";
		dialogElement.style.border = "1px solid dodgerBlue";
		/* dialogElement.style.borderRadius = "1em"; */
		dialogElement.style.fontSize = "12pt";
		/* dialogElement.style.opacity = 0.975; */
		dialogElement.style.overflow = "auto";
		dialogElement.style.padding = "0 1em";
		dialogElement.style.position = "fixed";
		dialogElement.style.left =
			dialogElement.style.top =
			dialogElement.style.right =
			dialogElement.style.bottom = "1em";
		dialogElement.style.wordBreak = "break-word";
		dialogElement.style.zIndex = 1e9;

		window.document.addEventListener("keydown", keyboardHandler = function(e) {
			if (e.keyCode === 27) {
				closeFunction();
			}
		});

		dialogElement.appendChild(closeButton = window.document.createElement("button"));

		closeButton.setAttribute("type", "button");
		closeButton.style.borderRadius = "3px";
		closeButton.style.position = "fixed";
		closeButton.style.top = "1.5em";
		closeButton.style.right = "2.5em";
		closeButton.style.width =
			closeButton.style.height = "2em";
		closeButton.style.textAlign = "center";
		closeButton.style.zIndex = 2e3;
		closeButton.textContent = "x";
		closeButton.addEventListener("click", closeFunction = function(e) {
			dialogElement.parentNode.removeChild(dialogElement);
			window.document.removeEventListener("keydown", keyboardHandler);
		});

		dialogElement.appendChild(containerElement = window.document.createElement("ul"));

		createLinks = function(name, tagName, hrefConverter, textConverter) {
			var element,
				elements = window.document.getElementsByTagName(tagName),
				href,
				i,
				itemElement,
				keys,
				linkElement,
				links,
				listElement,
				mainElement,
				text,
				titleElement,
				url = window.location.href;

			if (elements.length) {
				keys = [ ];
				links = [ ];
				for (i = 0; i < elements.length; i++) {
					href = hrefConverter(element = elements[i]),
					text = undefined;

					if (href && href.length && href !== "#" && href !== "/") {
						if (url.indexOf(href + "#")) {
							if (!keys[href]) {
								if (textConverter) {
									text = textConverter(element);
								}
								text = (text && text.length) ?
									text + " (" + href + ")" :
									href;
								links.push({
									"href": href,
									"text": text
								});
								keys[href] = href;
							}
						}
					}
				}
				if (links.length) {
					containerElement.appendChild(mainElement = window.document.createElement("li"));
					mainElement.appendChild(titleElement = window.document.createElement("div"));

					titleElement.style.fontSize = "16pt";
					titleElement.style.fontWeight = "bold";
					titleElement.textContent = name + " (" + links.length.toLocaleString() + ")";

					mainElement.appendChild(listElement = window.document.createElement("ol"));
					for (i = 0; i < links.length; i++) {
						listElement.appendChild(itemElement = window.document.createElement("li"));
						itemElement.appendChild(linkElement = window.document.createElement("a"));

						linkElement.setAttribute("download", (element = links[i]).href);
						linkElement.setAttribute("href", element.href);
						linkElement.setAttribute("target", "_blank");
						linkElement.style.fontSize = "9pt";
						linkElement.textContent = element.text;
					}
				}
			}
		};

		createLinks("Audios", "audio", function(item) { return item.currentSrc || item.src || item.getAttribute("src"); });
		createLinks("Videos", "video", function(item) { return item.currentSrc || item.src || item.getAttribute("src"); });
		createLinks("Links", "a", function(item) { return item.getAttribute("href"); }, function(item) { return item.textContent; });
	} catch (e) {
		window.alert(e.message);
	}
})();