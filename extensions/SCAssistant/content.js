"use strict";

if (!globalThis.__S_EXTENSION_CONTENT_LOADED__) {
    globalThis.__S_EXTENSION_CONTENT_LOADED__ = true;

    chrome.runtime.onMessage.addListener(message => window.postMessage({source: "__S-S", message}));

    window.addEventListener("message", e => {
        if (e.source !== window) return;
        if (e.data?.source !== "__S-P") return;
        chrome.runtime.sendMessage(e.data);
    });
}
