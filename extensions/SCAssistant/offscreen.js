"use strict";

(() => {
    const worker = new Worker("dedicated-worker.js");

    chrome.runtime.onConnect.addListener(port => {
        if (port.name !== "__S_OFFSCREEN") return;

        port.onMessage.addListener(message => {
            worker.postMessage(message);
        });

        worker.addEventListener("message", event => {
            port.postMessage(event.data);
        });
    });
})();
