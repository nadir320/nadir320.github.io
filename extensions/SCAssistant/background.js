"use strict";

import { CharacterCardPNG } from "./character-card-png.js";
import { OffscreenWorkerClient } from "./offscreen-worker-client.js";
import * as defaults from "./defaults.js";

const _offscreenWorkerClient = new OffscreenWorkerClient("offscreen.html");

chrome.runtime.onInstalled.addListener(async details => {
    const options = await chrome.storage.local.get(),
        values = {};

    if (options.applyFilter === undefined) {
        values.applyFilter = defaults.APPLY_FILTER;
    }
    if (options.banners === undefined) {
        values.banners = defaults.BANNERS;
    }
    if (options.backgroundAvatar === undefined) {
        values.backgroundAvatar = defaults.BACKGROUND_AVATAR;
    }
    if (options.backgroundAvatarStatic === undefined) {
        values.backgroundAvatar = defaults.BACKGROUND_AVATAR_STATIC;
    }
    if (options.showMoreOptions === undefined) {
        values.showMoreOptions = defaults.SHOW_MORE_OPTIONS;
    }
    if (options.filter === undefined) {
        values.filter = defaults.FILTER;
    }
    if (options.hideBanners === undefined) {
        values.hideBanners = defaults.HIDE_BANNERS;
    }
    if (options.newTabButtons === undefined) {
        values.newTabButtons = defaults.NEW_TAB_BUTTONS;
    }
    if (options.chatLinksToChatbots === undefined) {
        values.chatLinksToChatbots = defaults.CHAT_LINKS_TO_CHATBOTS;
    }
    if (options.swipeRight === undefined) {
        values.swipeRight = defaults.SWIPE_RIGHT;
    }
    if (options.enableMemories === undefined) {
        values.enableMemories = defaults.ENABLE_MEMORIES;
    }
    if (options.memories === undefined) {
        values.memories = defaults.MEMORIES;
    }
    if (options.memoriesInterval === undefined) {
        values.memoriesInterval = defaults.MEMORIES_INTERVAL;
    }
    if (options.memoriesMinScore === undefined) {
        values.memoriesMinScore = defaults.MEMORIES_MIN_SCORE;
    }
    await chrome.storage.local.set(values);
});

chrome.runtime.onMessage.addListener(async (message, sender) => {
    const openExtensionPage = async (key, page) => {
        const id = crypto.randomUUID();

        await chrome.storage.session.set({
            [`${key}-${id}`]: JSON.stringify(message)
        });

        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });

        if (!tab) tab = sender.tab;

        const newTab = await chrome.tabs.create({
            windowId: tab.windowId,
            url: chrome.runtime.getURL(`${page}.html?id=${id}`)
        });
    };

    switch (message.type) {
        case "CHAT_DETAILS":
            await openExtensionPage("chat-details", "summary");
            break;
        case "CREATE_PNG":
            await createCharacterPNG(sender, message);
            break;
        case "MAKE_STATIC":
            await makeStaticPNG(sender, message);
            break;
        case "EXPORT_CHAT":
            await openExtensionPage("chat", "chat");
            break;
        case "GET_OPTIONS":
            await sendOptionsChanged(sender.tab.id);
            break;
        case "SHOW_OPTIONS":
            await chrome.storage.session.set({ "options_theme": message.theme });
            chrome.runtime.openOptionsPage();
            break;
    }
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local") {
        chrome.tabs.query({}, async tabs => {
            for (const tab of tabs) {
                await sendOptionsChanged(tab.id);
            }
        });
    }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    const tab = await chrome.tabs.get(tabId);

    await updateAction(tabId, tab.url);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        updateAction(tabId, changeInfo.url);
    }
});

chrome.webNavigation.onHistoryStateUpdated.addListener(async ({ tabId, frameId, url }) => {
    if (frameId !== 0)
        return;

    await updateAction(tabId, url);

    if (!isSupportedUrl(url))
        return;

    await chrome.scripting.executeScript({
        target: { tabId },
        files: ["content.js"]
    });

    await chrome.scripting.executeScript({
        target: { tabId },
        files: ["shared.js", "message-scanner.js", "page.js"],
        world: "MAIN"
    });
});

const isSupportedUrl = url => url?.startsWith("https://spicychat.ai/") || url?.startsWith("https://localhost/");

const createCharacterPNG = async (sender, message) => {
    try {
        const blob = await CharacterCardPNG.create(message.avatarURL, message.character);

        const bytes = await blob.arrayBuffer();

        const binString = Array.from(new Uint8Array(bytes), b => String.fromCodePoint(b)).join("");

        chrome.tabs.sendMessage(sender.tab.id, {
            ...message,
            mimeType: blob.type,
            blob: btoa(binString)
        });
    } catch (e) {
        chrome.tabs.sendMessage(sender.tab.id, {
            ...message,
            error: e.message
        });
    }
};

const makeStaticPNG = async (sender, message) => {
    const error = e => chrome.tabs.sendMessage(sender.tab.id, {
        ...message,
        error: e.message
    });

    try {
        let isAnimated,
            response;

        if (message.options && message.options.useOffscreenImageDecoder) {
            isAnimated = async blob => {
                try {
                    const tracks = await _offscreenWorkerClient.send({
                        type: "TRACKS",
                        blob
                    });

                    const track = tracks.selectedTrack;

                    return track && track.animated && track.frameCount > 1;
                } catch (e) {
                    error(e);
                    throw e;
                }
            };
        }
        const blob = await CharacterCardPNG.makeStatic(message.url, isAnimated);

        if (blob instanceof Blob) {
            const bytes = await blob.arrayBuffer();

            const binString = Array.from(new Uint8Array(bytes), b => String.fromCodePoint(b)).join("");

            response = {
                mimeType: blob.type,
                blob: btoa(binString)
            };
        }

        chrome.tabs.sendMessage(sender.tab.id, {
            ...message,
            ...response
        });
    } catch (e) {
        error(e);
    }
};

const sendOptionsChanged = async (tabId) => {
    chrome.tabs.sendMessage(tabId, {
        source: "__S-S",
        type: "OPTIONS_CHANGED",
        options: await chrome.storage.local.get()
    }).catch(() => {});
};

const updateAction = async (tabId, url) => await chrome.action[(isSupportedUrl(url) || true) ? "enable" : "disable"](tabId);
