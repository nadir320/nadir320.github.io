"use strict";

window.addEventListener("DOMContentLoaded", async () => {
    try {
        const buttonToMessage = (buttonId, messageType, dontClose, more, onError) => {
            const button = buttonId instanceof HTMLElement ? buttonId : document.getElementById(buttonId);

            if (button) {
                button.addEventListener("click", async () => {
                    try {
                        const [tab] = await chrome.tabs.query({
                            active: true,
                            currentWindow: true
                        });

                        await chrome.tabs.sendMessage(tab.id, { ...(typeof messageType === "string" ? {
                            type: messageType
                        } : messageType), ...more });
                    } catch (e) {
                        if (onError && typeof onError === "function") {
                            dontClose = onError() === false;
                        } else {
                            window.alert(e.message);
                            dontClose = true;
                        }
                    }
                    if (!dontClose) {
                        window.close();
                    }
                });
            }
        };

        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });

        const isSupportedURL = tab.url.includes(__S_SHARED.baseUrl);

        const homeButton = document.getElementById("home"),
            optionsButton = document.getElementById("options");

        if (homeButton) {
            if (isSupportedURL) {
                homeButton.textContent = "Home";
            } else {
                homeButton.textContent = __S_SHARED.baseUrl;
                /*homeButton.addEventListener("click", async () => {
                    try {
                        await chrome.tabs.create({
                            windowId: tab.windowId,
                            url: __S_SHARED.baseUrl
                        });
                    } catch (e) {
                        window.alert(e.message);
                    }
                    window.close();
                });*/
            }
            homeButton.addEventListener("click", async () => {
                try {
                    await chrome.tabs.update(tab.id, {
                        url: __S_SHARED.baseUrl
                    });
                    window.close();
                } catch (e) {
                    window.alert(e.message);
                }
            });
        }
        if (optionsButton) {
            buttonToMessage(optionsButton, { type: "SHOW_OPTIONS" }, undefined, undefined, () => chrome.runtime.openOptionsPage());
        }

        if (isSupportedURL) {
            buttonToMessage("test", "TEST");

            const isCharacterList = __S_SHARED.isCharacterList(tab.url),
                isChatList = __S_SHARED.isChatList(tab.url),
                isChatPage = __S_SHARED.isChatPage(tab.url);

            if (!isCharacterList) {
                document.getElementById("setFilter").setAttribute("disabled", "");
                document.getElementById("highlightVisibleDescriptions").setAttribute("disabled", "");
            }
            if (!isChatList) {
                [...document.getElementsByClassName("chats")].forEach(e => {
                    e.setAttribute("disabled", "");
                });
            }
            if (!isChatPage) {
                [...document.getElementsByClassName("chat")].forEach(e => {
                    e.setAttribute("disabled", "");
                });
            }

            buttonToMessage("setFilter", { type: "SET_FILTER", filter: __S_SHARED.filter });
            buttonToMessage("highlightVisibleDescriptions", { type: "HIGHLIGHT_VISIBLE_DESCRIPTIONS" });

            buttonToMessage("loadAllChats", "LOAD_ALL_CHATS");
            buttonToMessage("copyChatTitles", "COPY_CHAT_TITLES", true);
            buttonToMessage("showDetailedDates", "SHOW_DETAILED_DATES");
            buttonToMessage("highlightPrivateChats", "HIGHLIGHT_PRIVATE_CHATS");
            buttonToMessage("getChatDetails", "GET_CHAT_DETAILS");

            buttonToMessage("loadAllMessages", "LOAD_ALL_MESSAGES");
            buttonToMessage("exportChat", "EXPORT_CHAT");

            __S_SHARED.sorts.forEach(sort => {
                const button = document.createElement("button");

                button.setAttribute("type", "button");
                button.innerHTML = sort.icon;
                button.appendChild(document.createTextNode(sort.title));
                if (!isChatList) {
                    button.setAttribute("disabled", "");
                }
                buttonToMessage(button, { type: "SORT_CHATS", sort: sort.sort });
                document.body.appendChild(button);
            });
        } else if (homeButton) {
            let found = false;

            [...homeButton.parentElement.childNodes].forEach(e => {
                if (!found) {
                    if (e === optionsButton) {
                        found = true;
                    }
                } else if (e.style) {
                    e.style.display = "none";
                }
            });
        }
    } catch (e) {
        [...document.getElementsByTagName("button")].forEach(button => button.style.backgroundColor = "red");
        window.alert(e.message);
    }
});

chrome.runtime.onMessage.addListener(async message => {
    try {
        switch (message.type) {
            case "COPY_TEXT":
                try {
                    await navigator.clipboard.writeText(message.text);
                    window.alert(`${message.count.toLocaleString()} chats copied (${message.text.length.toLocaleString()} chars)`);
                } catch (e) {
                    window.alert(e.message);
                }
                window.close();
                break;
            default:
                /* window.alert(JSON.stringify(message)); */
                break;
        }
    } catch (e) {
        window.alert(e.message);
    }
});
