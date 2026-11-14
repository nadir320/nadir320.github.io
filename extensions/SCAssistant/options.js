"use strict";

(async () => {
    let { options_theme: theme } = await chrome.storage.session.get("options_theme");

    if (!theme) {
        theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.documentElement.classList.add(theme);

    const options = await chrome.storage.local.get();

    const newTabButtons = document.getElementById("newTabButtons"),
        chatLinksToChatbots = document.getElementById("chatLinksToChatbots"),
        swipeRight = document.getElementById("swipeRight"),
        backgroundAvatar = document.getElementById("backgroundAvatar"),
        backgroundAvatarStatic = document.getElementById("backgroundAvatarStatic"),
        showMoreOptions = document.getElementById("showMoreOptions"),
        applyFilter = document.getElementById("applyFilter"),
        filter = document.getElementById("filter"),
        hideBanners = document.getElementById("hideBanners"),
        banners = document.getElementById("banners"),
        enableMemories = document.getElementById("enableMemories"),
        memoriesInterval = document.getElementById("memoriesInterval"),
        memories = document.getElementById("memories"),
        memoriesMinScore = document.getElementById("memoriesMinScore"),
        showSentCommands = document.getElementById("showSentCommands"),
        useOffscreenImageDecoder = document.getElementById("useOffscreenImageDecoder");

    newTabButtons.checked = options.newTabButtons;
    chatLinksToChatbots.checked = options.chatLinksToChatbots;
    swipeRight.checked = options.swipeRight;
    backgroundAvatar.checked = options.backgroundAvatar;
    backgroundAvatarStatic.checked = options.backgroundAvatarStatic;
    showMoreOptions.checked = options.showMoreOptions;
    applyFilter.checked = options.applyFilter;
    filter.value = options.filter.join("\n");
    hideBanners.checked = options.hideBanners;
    banners.value = options.banners.join("\n");
    enableMemories.checked = options.enableMemories;
    memoriesInterval.value = options.memoriesInterval;
    memoriesMinScore.value = options.memoriesMinScore;
    memories.value = options.memories.join("\n");
    showSentCommands.checked = options.showSentCommands;
    useOffscreenImageDecoder.checked = options.useOffscreenImageDecoder;

    const save = async () => {
        const filterValues = [...new Set(filter.value.split(/\r?\n/)
            .map(line => line.trim().toLowerCase()))]
            .sort();

        filter.value = filterValues.join("\n");

        const bannerValues = [...new Set(banners.value.split(/\r?\n/)
            .map(line => line.trim()))]
            .sort();

        banners.value = bannerValues.join("\n");

        const memoriesValues = memories.value.split(/\r?\n/);

        await chrome.storage.local.set({
            newTabButtons: newTabButtons.checked,
            chatLinksToChatbots: chatLinksToChatbots.checked,
            swipeRight: swipeRight.checked,
            backgroundAvatar: backgroundAvatar.checked,
            backgroundAvatarStatic: backgroundAvatarStatic.checked,
            showMoreOptions: showMoreOptions.checked,
            applyFilter: applyFilter.checked,
            filter: filterValues,
            hideBanners: hideBanners.checked,
            banners: bannerValues,
            enableMemories: enableMemories.checked,
            memoriesInterval: parseInt(memoriesInterval.value),
            memoriesMinScore: parseInt(memoriesMinScore.value),
            memories: memoriesValues,
            showSentCommands: showSentCommands.checked,
            useOffscreenImageDecoder: useOffscreenImageDecoder.checked
        });
    };

    document.getElementById("version").innerText = `Version: ${__S_SHARED.version}`;

    document.getElementById("save").addEventListener("click", async () => await save());

    document.getElementById("saveAndClose").addEventListener("click", async () => {
        await save();
        window.close();
    });
})();
