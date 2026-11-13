"use strict";

/*
    - more about characters
    - manage stored chats (__S_chats) / move memories popup style to shared.js
*/

(() => {
    if (globalThis.__S_PAGE_LOADED__)
        return;

    globalThis.__S_PAGE_LOADED__ = true;

    const CMD_START = "/cmd",
        CMD_END = "--/",
        OOC_START = "OOC: Continuity reminder",
        OOC_END = "Please keep these established details consistent";

    const __escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        __normalize = s => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase(),
        __filterToRegex = s => __normalize(s)
            .split(/(\s+)/u)
            .map((part, i) => i % 2 ? "\\s+" : __escapeRegex(part))
            .join("");

    const __regExp_CMD = new RegExp(`${__escapeRegex(CMD_START)} (.*?) ${__escapeRegex(CMD_END)}`, "i"),
        __regExp_OOC = new RegExp(`\\[${__escapeRegex(OOC_START)} - (.*?)\\. ${__escapeRegex(OOC_END)}\\.\\]`, "i"),
        __regExp_Char = /{{char}}/gi,
        __regExp_User = /{{user}}/gi;

    const _message_min_score = 3;

    const _options = {},
        _state = {},
        _taskRunner = (() => {
            const _map = new Map();

            let nextId = 0;

            return {
                isTask: message => {
                    const task = _map.get(message.taskId);

                    if (task) {
                        _map.delete(message.taskId);

                        if (message.error) {
                            task.reject(new Error(message.error));
                        } else {
                            delete message.taskId;
                            task.resolve(message);
                        }
                        return true;
                    }
                },
                run: (type, data) => {
                    const taskId = ++nextId;

                    return new Promise((resolve, reject) => {
                        _map.set(taskId, { resolve, reject });

                        sendMessage(type, {
                            ...data,
                            taskId
                        });
                    });
                }
            };
        })(),
        _toast = {},
        _viewport = ((w) => {
            let _lvh;

            const getLvh = () => {
                const div = w.document.createElement("div");

                Object.assign(div.style, {
                    height: "100lvh",
                    position: "absolute",
                    pointerEvents: "none",
                    visibility: "hidden",
                    width: 0,
                    zIndex: -1
                });
                w.document.body.appendChild(div);
                _lvh = div.getBoundingClientRect().height;
                div.remove();
            };

            w.addEventListener("resize", () => {
                if (!w.document.querySelector(":focus")) {
                    getLvh();
                }
            });
            w.document.addEventListener("DOMContentLoaded", getLvh);
            w.screen.orientation?.addEventListener("change", getLvh);

            return {
                get lvh() { return _lvh },
                async getSize(container, imageURL) {
                    const image = new Image();

                    image.src = imageURL;
                    await image.decode();

                    const imageWidth = image.naturalWidth,
                        imageHeight = image.naturalHeight,
                        width = container.getBoundingClientRect().width,
                        height = _lvh;

                    const scale = Math.max(width / imageWidth,
                        height / imageHeight);

                    return {
                        width: imageWidth * scale,
                        height: imageHeight * scale
                    };
                }
            };
        })(window);

    const initState = () => Object.assign(_state, {
        conversation: {},
        conversations: [],
        enableMemories: false,
        handlers: new Map(),
        memories: [],
        messages: [],
        searchResults: {}
    });

    initState();

    if (window.location.href.startsWith(__S_SHARED.baseUrl)) {
        (() => {
            const originalOpen = XMLHttpRequest.prototype.open,
                originalSend = XMLHttpRequest.prototype.send,
                /* originalResponse = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, "response"), */
                originalResponseText = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, "responseText");

            Object.defineProperty(XMLHttpRequest.prototype, "responseText", {
                configurable: originalResponseText.configurable,
                enumerable: originalResponseText.enumerable,

                get: function () {
                    let responseText = originalResponseText.get.call(this);

                    if (this.status === 200) {
                        if (this.__url.includes("/multi_search")) {
                            if (__S_SHARED.isCharacterList()) {
                                /* let hasFilter = false;

                                if (this.__body && this.__body.length) {
                                    try {
                                        const filter = JSON.parse(this.__body).searches.pop().q;

                                        hasFilter = filter && filter.length && filter !== "*";
                                    } catch {}
                                }
                                if (!hasFilter) { */
                                    return handleMultiSearchResponseText(responseText);
                                /* } */
                            }
                        } else if (this.__url.includes("/messages")) {
                            if (_state.enableMemories && !_options.showSentCommands) {
                                const conversation = JSON.parse(responseText);

                                if (conversation.messages && conversation.messages.length) {
                                    let changed = false;

                                    conversation.messages.forEach(message => {
                                        const originalContent = message.content;

                                        if (message.role === "user") {
                                            message.content = message.content
                                                .split("\n")
                                                .filter(line => line.length === 0 ||
                                                    (!__regExp_OOC.test(line) &&
                                                    !__regExp_CMD.test(line)))
                                                .join("\n")
                                                .trim();
                                        }
                                        if (message.content !== originalContent) {
                                            message.originalContent = originalContent;
                                            changed = true;
                                        }
                                    });
                                    if (changed) {
                                        responseText = JSON.stringify(conversation);
                                    }
                                }
                            }
                        }
                    }
                    return responseText;
                }
            });

            /* Object.defineProperty(XMLHttpRequest.prototype, "response", {
                get: function () {
                    const response = originalResponse.get.call(this);

                    if (this.status === 200) {
                        if (this.__url.includes("/multi_search")) {
                            if (__S_SHARED.isCharacterList()) {
                                if (typeof response === "string") {
                                    return handleMultiSearchResponseText(response);
                                }
                            }
                        }
                    }
                    return response;
                }
            }); */

            XMLHttpRequest.prototype.open = function(method, url, ...args) {
                this.__date = new Date().getTime();
                this.__method = method;
                this.__url = String(url);

                return originalOpen.call(this, method, url, ...args);
            };

            XMLHttpRequest.prototype.send = function(body) {
                this.__body = body;

                this.addEventListener("load", function() {
                    if (this.status === 200) {
                        /* console.log(this.__method, this.__url, this.status, this.response); */
                        if (this.__url.includes("/conversations")) {
                            if (this.__method === "DELETE") {
                                const ids = JSON.parse(this.__body).ids;

                                ids.forEach(id => _state.messages.splice(_state.messages.findIndex(m => m.id === id), 1));
                            } else {
                                const conversations = JSON.parse(this.responseText);

                                conversations.forEach(c => {
                                    if (c && !c.character) {
                                        c.character = _state.searchResults[c.character_id];
                                    }
                                });
                                _state.conversations.push(...conversations);
                            }
                        } else if (this.__url.includes("/messages")) {
                            const conversationOrMessage = JSON.parse(this.responseText);

                            if (conversationOrMessage.messages) {
                                if (_state.conversation && _state.conversation.conversation_id && _state.conversation.conversation_id[0] === "-") {
                                    updateChats(_state.conversation.conversation_id, conversationOrMessage.conversation_id);
                                }
                                Object.assign(_state.conversation, conversationOrMessage);
                                delete _state.conversation.messages;
                                _state.messages.push(...conversationOrMessage.messages);
                            } else if (this.__method === "PATCH") {
                                _state.messages[_state.messages.findIndex(m => m.id === conversationOrMessage.id)] = conversationOrMessage;
                            } else {
                                console.warn("Unknown call to /messages");
                            }
                        } else if (this.__url.includes("/chat")) {
                            const message = JSON.parse(this.responseText);

                            if (message && message.message) {
                                if (message.message.prev_id &&
                                    !_state.messages.some(m => m.id === message.message.prev_id)) {

                                    const currentMessage = JSON.parse(this.__body);

                                    _state.messages.push({
                                        conversation_id: currentMessage.conversation_id,
                                        character_id: currentMessage.character_id,
                                        content: currentMessage.message,
                                        createdAt: this.__date,
                                        id: message.message.prev_id,
                                        role: "user"
                                    });
                                }
                                if (message.message.createdAt) {
                                    _state.messages.push(message.message);
                                }
                            }
                        } else if (this.__url.includes("/multi_search")) {
                            [...JSON.parse(this.responseText).results].map(r => r.hits.map(h => h.document)).flat()
                                .forEach(e => ensureResult(e));
                        } else if (this.__url.includes("/characters")) {
                            const c = JSON.parse(this.response);

                            ensureResult({
                                ...c,
                                character_id: c.id
                            });
                        }
                    }
                });

                if (this.__url === __S_SHARED.chatUrl &&
                    this.__method === "POST") {

                    const currentBody = JSON.parse(this.__body);

                    if (currentBody.message) {
                        const originalMessage = currentBody.message;

                        let newMessage = originalMessage;

                        if (_state.enableMemories &&
                            _state.memories.length) {

                            try {
                                const activeMemories = _state.memories.filter(e => e.active),
                                    { ooc, cmd } = activeMemories.reduce((values, value) => {
                                        (value.role ? values.ooc : values.cmd).push(value);
                                        return values;
                                    }, { ooc: [], cmd: [] });

                                if (ooc.length || cmd.length) {
                                    const lastMessages = getCurrentChatMessages()
                                       .filter(m => m.role === "user");

                                    /* alert(`${lastMessages.slice(0, 5).map(m => `${(m.originalContent || m.content).substr(0, 40)}`).join("\n")}
                                        \n\n${[...document.querySelectorAll("[data-chat-bubble-side=user]")].reverse().slice(1, 6)
                                            .map(x => x.querySelector("em").innerText.substr(0, 40)).join("\n")}`); */

                                    const toAppend = [],
                                        checkAndAppend = values => {
                                            if (values && values.length) {

                                                values.forEach(value => {
                                                    const i = lastMessages.findIndex(message =>
                                                        (message.originalContent || message.content)
                                                            .split("\n")
                                                            .some(l => l === value));

                                                    if (i < 0 || i >= _options.memoriesInterval - 1) {
                                                        toAppend.push(value);
                                                    }
                                                });
                                            }
                                        };

                                    checkAndAppend(ooc.map(command => `[${OOC_START} - ${command.role ? `{{${command.role === "bot" ?
                                        "char" : "user"}}} said: ${command.content}` : command.content}. ${OOC_END}.]`));

                                    checkAndAppend(cmd.map(command => `${CMD_START} ${command.content} ${CMD_END}`));

                                    if (toAppend.length) {
                                        currentBody.message += [undefined, undefined, ...toAppend].join("\n");
                                        newMessage = JSON.stringify(currentBody);
                                        if (_options.showSentCommands) {
                                            showToast(`Reminder sent (${toAppend.length.toLocaleString()} memories)`);
                                        }
                                    }
                                }
                            } catch (e) {
                                console.error(e.message);
                                showToast(e.message);
                                newMessage = originalMessage;
                            }
                        }
                        if (newMessage !== originalMessage) {
                            this.__body = newMessage;
                        }
                    }
                } else if (this.__url.includes("/messages/") &&
                    this.__method === "PATCH") {

                    const messageId = this.__url.split("/").pop(),
                        message = _state.messages.find(m => m.id === messageId);

                    if (message) {
                        const messageContent = message.originalContent || message.Content;

                        if (messageContent) {
                            const currentBody = JSON.parse(this.__body),
                                currentLines = currentBody.content.split("\n"),
                                characterName = _state.searchResults[message.character_id || Object.keys(_state.searchResults)[0]].name,
                                userName = _state.conversation.userPersona.name;

                            const toAppend = message.content
                                .split("\n")
                                .filter(line => {
                                    if (line.length) {
                                        line = line
                                            .replace(__regExp_Char, characterName)
                                            .replace(__regExp_User, userName);

                                        return (__regExp_OOC.test(line) ||
                                                __regExp_CMD.test(line)) &&
                                            !currentLines.includes(line);
                                    }
                                });

                            if (toAppend.length) {
                                currentBody.content += [undefined, undefined, ...toAppend].join("\n");
                                this.__body == JSON.stringify(currentBody);
                                if (_options.showSentCommands) {
                                    showToast(`${toAppend.length} memories restored`);
                                }
                            }
                        }
                    }
                }
                return originalSend.call(this, this.__body);
            };
        })();

        (() => {
            const originalFetch = window.fetch;

            window.fetch = async function (input, init) {
                const response = await originalFetch.apply(this, arguments);

                const url = input instanceof Request
                    ? input.url
                    : String(input);

                if (url.includes("/recomms")) {
                    try {
                        const clone = response.clone();

                        const data = await clone.json();

                        data.recomms.forEach(r => ensureResult({
                            ...ensureCharacterDate(r.values),
                            character_id: r.id
                        }));

                        if (window.location.pathname === "/") {
                            const hasFilter = getFilterInputs().filter(input => input.value).length;

                            if (!hasFilter) {
                                const entries = getReadLaterEntries();

                                if (entries && entries.length) {
                                    entries.reverse();
                                    entries.forEach(e => {
                                        ensureResult(e);

                                        /* const index = data.recomms.findIndex(r => r.character_id === e.character_id);

                                        if (index >= 0) {
                                            const existing = data.recomms[index];

                                            data.recomms.splice(index, 1);
                                            data.recomms.unshift(existing);
                                        } else {
                                            const f = structuredClone(e);

                                            delete f.character_id;
                                            data.recomms.unshift({ id: e.character_id, values: f });
                                        } */
                                    });

                                    return new Response(JSON.stringify(data), response);
                                }
                            }
                        }
                    }
                    catch (e) {
                        console.error(e);
                    }
                }
                return response;
            };
        })();
    }

    const addToReadLater = botId => {
        const data = window.localStorage.getItem("__S_read_later"),
            map = new Map(data && data.length && JSON.parse(data) || []);

        if (!map.has(botId)) {
            const bot = _state.searchResults[botId];

            if (bot) {
                map.set(botId, bot);
                window.localStorage.setItem("__S_read_later", JSON.stringify([...map]));
                refreshReadLater();
            } else {
                showToast("Not found");
            }
        }
    };

    const applyChatBackground = async () => {
        if (__S_SHARED.isChatPage()) {
            const chatContainer = getChatContainer();

            if (chatContainer) {
                const backgroundElement = chatContainer.closest(".top-0"),
                    path = window.location.href.split("/");

                let botId = path.pop(),
                    bot = _state.searchResults[botId];

                if (!bot) {
                    botId = path.pop(),
                    bot = _state.searchResults[botId];
                }

                const style = {
                    backgroundImage: "",
                    backgroundPosition: "",
                    backgroundRepeat: "",
                    backgroundSize: ""
                };

                if (bot && _options.backgroundAvatar) {
                    const avatarURL = new URL(bot.avatar_url, __S_SHARED.avatarBaseUrl);

                    let image = avatarURL.toString();

                    if (_options.backgroundAvatarStatic) {
                        try {
                            const result = await _taskRunner.run("MAKE_STATIC", {
                                options: _options,
                                url: image
                            });

                            if (result.blob) {
                                image = `data:image/png;base64,${result.blob}`;
                            }
                        } catch (e) {
                            showToast(e.message);
                        }
                    }
                    try {
                        const height = (await _viewport.getSize(backgroundElement, avatarURL)).height;

                        style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url("${image}")`;
                        style.backgroundPosition = "center top";
                        style.backgroundRepeat = "no-repeat";
                        style.backgroundSize = `auto ${height}px`;
                    } catch {}
                }
                chatContainer.classList[style.backgroundImage ? "add" : "remove"]("__S-background");
                Object.assign(backgroundElement.style, style);
            }
        }
    };

    const applyOptions = options => {
        Object.assign(_options, options);

        if (_options.hideBanners && _options.banners && _options.banners.length) {
            /* [...document.querySelectorAll("[aria-label='X-button']")]
                .forEach(e => e.closest(".grid.undefined").remove()); */

            const banners = JSON.parse(window.sessionStorage.getItem("closedBanners")) || {};

            for (const banner of _options.banners) {
                const parts = banner.split("|"),
                    value = parts.pop();

                let node = banners;

                for (const key of parts.slice(0, -1)) {
                    node = node[key] ??= {};
                }

                const key = parts.at(-1);

                if (!Object.hasOwn(node, key)) {
                    node[key] = value;
                } else if (Array.isArray(node[key])) {
                    node[key].push(value);
                } else {
                    node[key] = [node[key], value];
                }
            }

            window.sessionStorage.setItem("closedBanners", JSON.stringify(banners));
        }

        initMemories();

        _options.filterExpression = _options.applyFilter && _options.filter && _options.filter.length ?
            new RegExp(`(?<![\\p{L}\\p{N}_])(?:${_options.filter.map(__filterToRegex)
                .join("|")})(?![\\p{L}\\p{N}_\\-'])`, "gu") :
            undefined;

        if (__S_SHARED.isCharacterList()) {
            refreshFilter();
            applyGridFixes();
        } else if (__S_SHARED.isChatPage()) {
            applyChatBackground();
        }
    };

    const applyGridFixes = () => {
        [...document.getElementsByClassName("\!overflow-y-auto")].forEach(e => {
            const p = e.closest(".h-\\[180px\\]");

            p.style.height = "auto";
            [...p.getElementsByClassName("max-h-9")].forEach(h => h.classList.remove("max-h-9"));

            const f = e.cloneNode(true);

            f.classList.remove("!overflow-y-auto");
            f.classList.remove("line-clamp-2");
            f.style.maxHeight = "100vh";
            f.style.wordBreak = "break-word";
            e.parentElement.replaceChild(f, e);

            const botId = f.closest(".grid>div")
                    .querySelector("a")
                    .getAttribute("href")
                    .split("/")
                    .pop(),
                bot = _state.searchResults[botId];

            if (bot && bot.createdAt) {
                let date = new Date(bot.createdAt);

                if (!isNaN(date)) {
                    const dateElement = document.createElement("div");

                    dateElement.classList.add("flex");
                    dateElement.classList.add("text-gray-10");

                    const textElement = document.createElement("p");

                    [
                        "font-sans",
                        "text-decoration-skip-ink-none",
                        "text-underline-position-from-font",
                        "text-label-sm",
                        "font-regular",
                        "text-left",
                    ].forEach(c => textElement.classList.add(c));
                    textElement.appendChild(document.createTextNode(`Created: ${__S_SHARED.formatDate(date)}`));
                    dateElement.appendChild(textElement);

                    f.parentElement.lastChild.appendChild(dateElement);
                }
            }
        });

        const links = getChatLinks();

        links.map(e => e.closest(".grid>div"))
            .forEach(d => d.classList.add("__S-char-link"));

        if (_options.newTabButtons) {
            links
                .filter(e => !e.querySelector(".__S-new-tab-button"))
                .forEach(e => {
                    const botId = e.querySelector("a").getAttribute("href").split("/").pop();

                    const button = createCharacterButton(botId, [
                        "__S-new-tab-button",
                        "left-2"
                    ], __S_SHARED.icons.details,
                        "Details");

                    const a = document.createElement("a");

                    a.setAttribute("href", `/chatbot/${botId}`);
                    a.setAttribute("target", "_blank");
                    a.appendChild(button);
                    e.appendChild(a);
                });
        } else {
            [...document.getElementsByClassName("__S-new-tab-button")]
                .map(e => e.closest("a"))
                .forEach(e => e.remove());
        }

        if (_options.chatLinksToChatbots) {
            links
                .filter(e => !e.querySelector(".__S-bot-link"))
                .forEach(e => {
                    const a = e.querySelector("a"),
                        botId = a.getAttribute("href").split("/").pop();

                    a.dataset.chatHref = a.getAttribute("href");
                    a.setAttribute("href", `/chatbot/${botId}`);
                    a.classList.add("__S-bot-link");

                    const card = a.closest("[data-testid=CharacterCard]"),
                        profileButton = card && card.querySelector("[data-testid=CharacterCardOverlayActions-Info]"),
                        profileLink = profileButton && profileButton.querySelector("a");

                    if (profileLink) {
                        const handler = e => {
                            profileLink.click();
                            e.preventDefault();
                            e.cancelBubble();
                        };

                        _state.handlers.set(a, handler);
                        a.addEventListener("click", handler);
                    }
                });
        } else {
            for (const [a, handler] of _state.handlers) {
                a.removeEventListener("click", handler);
            }
            [...document.getElementsByClassName("__S-bot-link")]
                .forEach(a => {
                    a.setAttribute("href", a.dataset.chatHref);
                    delete a.dataset.chatHref;
                    a.classList.remove("__S-bot-link");
                });
        }

        if (_options.showMoreOptions) {
            links
                .filter(e => !e.querySelector(".__S-more-button"))
                .forEach(e => {
                    e.appendChild(createCharacterButton(e.querySelector("a")
                        .getAttribute("href")
                        .split("/")
                        .pop(), [
                            "__S-more-button"
                        ],
                        __S_SHARED.icons.more,
                        "More",
                        b => {
                            const bot = _state.searchResults[b.dataset.botId];

                            showToast(`More about \"${bot.name}\" (TODO)`);
                        }));
                });
        } else {
            [...document.getElementsByClassName("__S-more-button")]
                .map(e => e.closest("a"))
                .forEach(e => e.remove());
        }
    };

    const copyChatTitles = () => {
        const chats = getChats(),
            text = chats.map(a => `<li><a href=\"${new URL(a.getAttribute("href"), location.origin)}\" target=\"_blank\">` +
                `${a.querySelector("p.text-gray-12").innerText}</a></li>`).join("\n");

        sendMessage("COPY_TEXT", {
            count: chats.length,
            text: text
        });
    };

    const createCharacterButton = (botId, classes, icon, title, clickHandler) => {
        const outer = document.createElement("div");

        outer.classList.add("absolute");
        outer.classList.add("top-[6px]");
        outer.classList.add("__S-char-button");
        if (classes && classes.length) {
            if (classes.join) {
                classes.forEach(c => outer.classList.add(c));
            } else {
                outer.classList.add(classes);
            }
        }
        if (botId) {
            outer.dataset["botId"] = botId;
        }

        const inner = document.createElement("div");

        inner.classList.add("p-0.5");

        const clickable = document.createElement("div");

        [
            "cursor-pointer",
            "bg-black/[.47]",
            "p-1.5",
            "rounded-full",
            "w-7",
            "h-7",
            "flex",
            "items-center",
            "justify-center"
        ].forEach(c => clickable.classList.add(c));

        if (title && title.length) {
            clickable.setAttribute("title", title);
        }
        if (clickHandler) {
            clickable.addEventListener("click", () => clickHandler(outer));
        }
        if (icon && icon.length) {
            clickable.innerHTML = icon;

            const svg = clickable.querySelector("svg");

            if (svg) {
                svg.classList.add("text-white");
                svg.classList.add("fill-transparent");
            }
        }
        inner.appendChild(clickable);
        outer.appendChild(inner);
        return outer;
    };

    const createChatId = () => "-" + crypto.randomUUID();

    const downloadBlob = (blob, name) => {
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");

        a.setAttribute("href", url);
        a.setAttribute("download", name);
        a.click();

        URL.revokeObjectURL(url);
    };

    const editMemories = () => {
        let chatId = getChatId();

        if (!chatId) {
            chatId = createChatId();
            _state.conversation.conversation_id = chatId;
        }

        const host = document.createElement("div");

        host.setAttribute("tabIndex", 0);
        document.body.appendChild(host);

        const shadow = host.attachShadow({ mode: "open" }),
            theme = getTheme();

        shadow.innerHTML = `
            <style>
                :host {
                    all: initial;
                    font-family: Arial, sans-serif;
                }

                :host>* {
                    z-index: 2147483647;
                }

                .dark {
                    background-color: #333;
                    color: white;
                }

                .light {
                    background-color: white;
                    color: #222;
                }

                .full {
                    bottom: 0;
                    left: 0;
                    position: fixed;
                    right: 0;
                    top: 0;
                }

                .backdrop {
                    opacity: 0.5;
                }

                .panel {
                    border: 1px solid #ccc;
                    border-radius: 0.5rem;
                    bottom: initial;
                    box-shadow: 0 0.25rem 1rem #0003;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    height: auto;
                    margin: 2rem auto 0;
                    max-height: calc(100vh - 8rem);
                    max-width: 30rem;
                    padding: 1rem;
                    width: calc(100vw - 3rem);
                }

                .title {
                    display: flex;
                }

                .title>:first-child {
                    flex-grow: 2;
                }

                #close {
                    background-color: transparent;
                    border-radius: 100%;
                    height: 2rem;
                    width: 2rem;
                }

                #list {
                    list-style-type: none;
                    overflow-y: auto;
                    padding-inline-start: 0;
                }

                #list hr {
                    width: auto;
                }

                #list li {
                    display: flex;
                    gap: 0.25rem;
                    margin: 0 0 0.25rem;
                }

                #list *[data-role] {
                    font-style: italic;
                }

                #list li>*:first-child {
                    flex-grow: 100;
                }

                #list li label input[type=text],
                #list li label textarea {
                    width: 100%;
                }

                #list li button {
                    min-height: 1.5rem;
                    margin: auto;
                    padding: 0;
                    min-width: 1.5rem;
                }

                .buttons {
                    display: flex;
                    gap: 0.5rem;
                    justify-content: center;
                }

                button {
                    align-items: center;
                    background: #1769aa;
                    border: 1px solid silver;
                    border-radius: 0.25rem;
                    cursor: pointer;
                    display: inline-flex;
                    justify-content: center;
                    padding: 0.5rem;
                    transition: filter 0.1s;
                }

                button.delete {
                    background-color: red;
                }

                h2 {
                    margin-top: 0;
                }

                hr {
                    width: 100%;
                }

                button:hover { filter: brightness(0.95); }

                .dark button:hover { filter: brightness(0.75); }

                button:active { filter: brightness(0.90); }

                .dark button:active { filter: brightness(0.50); }

                button:disabled, button[disabled], button.disabled {
                    filter: grayscale(1) opacity(0.35);
                    pointer-events: none;
                }

                button svg {
                    width: 1rem;
                    height: 1rem;
                    display: block;
                }
            </style>

            <div class="full">
                <div class="full backdrop ${theme}"></div>
                <div class="full panel ${theme}">
                    <div class="title">
                        <h2>Memories</h2>
                        <button id="close"></button>
                    </div>
                    <label><input type="checkbox" id="active" disabled>Enable persistent memories (globally)</label>
                    <label><input type="checkbox" id="active2">Enable persistent memories (for this chat)</label>
                    <hr>
                    <ul id="list"></ul>
                    <div class="buttons">
                        <button id="reset">Reset</button>
                        <button id="saveAndClose">Save and close</button>
                    </div>
                </div>
            </div>
        `;

        shadow.getElementById("active").checked = _options.enableMemories;
        shadow.getElementById("active2").checked = _state.enableMemories;

        const list = shadow.getElementById("list");

        const fillSpan = (span, message) => {
            span.innerHTML = "";
            if (message.content) {
                span.dataset.content = message.content;
            }
            if (message.role) {
                span.dataset.role = message.role;
                span.appendChild(document.createTextNode(`(${message.role === "bot" ?
                    _state.searchResults[_state.messages.find(m => m.id === message.messageId)?.character_id]?.name ?? "char" :
                    _state.conversation?.userPersona?.name ?? "user"}): ${message.content || ""}`));
            } else {
                delete span.dataset.role;
                span.appendChild(document.createTextNode(message.content || ""));
            }
        };

        let added = false;

        const addMessage = (message, editable, before) => {
            const e = document.createElement("li"),
                label = document.createElement("label"),
                checkbox = document.createElement("input"),
                span = document.createElement("span");

            checkbox.setAttribute("type", "checkbox");
            if (!message || message.active) {
                checkbox.checked = true;
            }
            if (!message) {
                e.classList.add("empty");
                checkbox.style.display = "none";
            }
            label.appendChild(checkbox);
            fillSpan(span, message || {});
            label.appendChild(span);
            e.appendChild(label);
            if (editable) {
                let button = document.createElement("button");

                button.innerHTML = message ?
                    __S_SHARED.icons.edit :
                    __S_SHARED.icons.add;
                button.classList.add(message ? "edit" : "add");

                button.addEventListener("click", () => {
                    const i = document.createElement("textarea"),
                        resize = () => {
                            i.style.height = "auto";
                            i.style.height = i.scrollHeight + "px";
                        };

                    if (message) {
                        if (span.dataset.role) {
                            i.dataset.role = span.dataset.role;
                        }
                        i.value = span.dataset.content;
                    }
                    e.insertBefore(i, e.firstElementChild);
                    label.remove();
                    i.addEventListener("input", resize);
                    i.addEventListener("keydown", ev => {
                        if (ev.which === 13) {
                            i.blur();
                        }
                    });
                    i.addEventListener("blur", () => {
                        if (i.value) {
                            if (message) {
                                fillSpan(span, {
                                    content: i.value,
                                    role: i.dataset.role
                                });
                            } else {
                                addMessage({
                                    active: true,
                                    content: i.value
                                }, true, e);
                            }
                        }
                        e.insertBefore(label, e.firstElementChild);
                        i.remove();
                    });
                    resize();
                    i.focus();
                });
                e.appendChild(button);

                if (message) {
                    button = document.createElement("button");

                    button.innerHTML = __S_SHARED.icons.delete;
                    button.classList.add("delete");
                    button.addEventListener("click", () => e.remove());
                }
                e.appendChild(button);
            }
            if (before && before.parentElement === list) {
                list.insertBefore(e, before);
            } else {
                list.appendChild(e);
            }
            added = true;
        }

        const allMemories = [];

        _state.memories.forEach(m => {
            allMemories.push(m.content);
            addMessage(m, true);
        });

        const messages = getCurrentChatMessages();

        let addSeparator = added,
            globalOOC = new RegExp(__regExp_OOC.source, "gi"),
            globalCMD = new RegExp(__regExp_CMD.source, "gi");

        messages.forEach(message => {
            (message.originalContent || message.content)
                .split("\n")
                .forEach(line => {
                    if (line.length) {
                        [...line.matchAll(globalOOC)].map(m => m[1])
                            .concat([...line.matchAll(globalCMD)].map(m => m[1]))
                            .forEach(match => {
                                if (allMemories.findIndex(m => m.localeCompare(match,
                                    undefined, { sensitivity: "base" }) === 0) < 0) {

                                    if (addSeparator) {
                                        list.appendChild(document.createElement("hr"));
                                        addSeparator = false;
                                    }
                                    allMemories.push(match);
                                    addMessage({
                                        active: false,
                                        content: match,
                                        messageId: message.messageId,
                                        role: message.role
                                    });
                                }
                            });
                    }
                });
        });

        addMessage(undefined, true);

        const automaticMemories = MessageScanner.scanMessages(messages,
            allMemories, _message_min_score);

        if (_options.showSentCommands) {
            showToast(`${_state.messages.length.toLocaleString()} messages,
                ${automaticMemories.length.toLocaleString()} highlights`);
        }

        if (automaticMemories.length) {
            list.appendChild(document.createElement("hr"));
            automaticMemories.map(m => {
                return {
                    active: false,
                    content: m.text,
                    messageId: m.messageId,
                    role: m.role
                };
            }).forEach(m => addMessage(m));
        }

        shadow.querySelector(".backdrop").addEventListener("click", () => host.remove());

        host.addEventListener("keydown", e => {
            if (e.which === 27) {
                shadow.getElementById("close").click();
            }
        });
        shadow.getElementById("close").innerHTML = __S_SHARED.icons.close;
        shadow.getElementById("close").addEventListener("click", () => {
            host.remove();
        });
        shadow.getElementById("reset").addEventListener("click", () => {
            setMemories(chatId);
            host.remove();
            initMemories();
        });
        shadow.getElementById("saveAndClose").addEventListener("click", () => {
            const memories = [];

            list.querySelectorAll("li").forEach(e => {
                if (!e.classList.contains("empty")) {
                    const active = e.querySelector("input").checked,
                        span = e.querySelector("span");

                    if (!span.dataset.role || active) {
                        memories.push({
                            active: active,
                            content: span.dataset.content,
                            role: span.dataset.role
                        });
                    }
                }
            });

            const state = {
                enableMemories: shadow.getElementById("active2").checked,
                memories
            };

            setMemories(chatId, state);
            showToast("Saved");
            host.remove();
            initMemories();
        });
        host.focus();
    };

    const ensureCharacterDate = character => {
        if (character.createdAt) {
            character.createdAt *= 1e3;
        }
        return character;
    };

    const ensureResult = character => {
        const date = new Date(character.createdAt);

        if (!isNaN(date) && date.getYear() === new Date(0).getYear()) {
            debugger;
        }
        _state.searchResults[character.character_id] = character;
        return character;
    };

    const exportChat = () => {
        const parts = window.location.href.split("/");

        let character = _state.searchResults[parts.pop()] ||
            _state.searchResults[parts.pop()];

        if (character) {
            sendMessage("EXPORT_CHAT", {
                chat: {
                    character: character,
                    conversation: _state.conversation,
                    messages: _state.messages,
                    theme: getTheme()
                }
            });
        } else {
            showToast("Not found");
        }
    };

    const findFilteredWords = (text, filter) => {
        let normalizedText = "";

        const positionMap = [];

        for (let i = 0; i < text.length; i++) {
            const normalizedChar = __normalize(text[i]);

            normalizedText += normalizedChar;

            for (let j = 0; j < normalizedChar.length; j++) {
                positionMap.push(i);
            }
        }

        const result = new Set();

        for (const match of normalizedText.matchAll(filter)) {
            const start = positionMap[match.index],
                end = positionMap[match.index + match[0].length - 1] + 1;

            result.add(text.slice(start, end));
        }
        return [...result];
    };

    const getBotContainer = () => {
        const avatar = document.querySelector("img[alt='avatar image']");

        return avatar && avatar.closest("div");
    };

    const getChatContainer = () => document.querySelector("[data-chat-scroll-area=chat]");

    const getChatId = () => {
        if (__S_SHARED.isChatPage()) {
            let id = _state.conversation.conversation_id;

            if (!id) {
                const path = window.location.href.split("/"),
                    last = path.pop();

                if (!_state.searchResults[last]) {
                    id = last;
                }
            }
            return id;
        }
    };

    const getChatLinks = all => [...document.querySelectorAll("a[href]")]
        .filter(a => a.getAttribute("href").startsWith("/chat/") || a.dataset.chatHref)
        .map(a => a.parentElement)
        .filter((e, i) => all || i % 2 === 0);

    const getChatMap = () => getChats().map(c => {
        return {
            node: c,
            chat: _state.conversations.filter(chat => c.getAttribute("href").indexOf(chat.id) >= 0).pop()
        }
    });

    const getChats = () => [...getChatsContainer().childNodes]
        .map(n => n.querySelector("a"))
        .filter(a => a);

    const getChatsContainer = () => {
        let container = document.querySelector(".flex-grow.flex.flex-col.gap-md");

        if (!container) {
            container = document.querySelector(".w-full>.flex-grow.flex.flex-col");

            if (container) {
                return container.querySelector("div");
            }
        }
        return container;
    }

    const getChatsDetails = () => {
        sendMessage("CHAT_DETAILS", {
            chats: getChatMap().map(m => m.chat)
        });
    };

    const getCurrentChatMessages = () => _state.messages.slice().sort((a, b) => b.createdAt - a.createdAt);

    const getFilterInputs = () => [...document.querySelectorAll("input[type='text'], input:not([type])")]
        .filter(input => /search/i.test(input.getAttribute("placeholder")))
        .filter(input => input.parentElement.getElementsByTagName("svg").length);

    const getLoadMoreChatsButton = () => {
        const span = getChatsContainer().querySelector("[data-translate-key='common:loadMore']");

        return span && span.closest("button");
    };

    const getReadLaterEntries = () => {
        const storageData = window.localStorage.getItem("__S_read_later"),
            entries = storageData && storageData.length && JSON.parse(storageData);

            if (entries) {
                return [...(new Map(entries).values())];
            }
    };

    const getTheme = () => document.documentElement.classList.contains("light") ? "light" :
        document.documentElement.classList.contains("dark") ? "dark" :
        matchMedia("(prefers-color-scheme: dark)").matches ? "dark" :
        "light";

    const handleMultiSearchResponseText = (responseText, isResponseText) => {
        const entries = getReadLaterEntries();

        if (entries && entries.length) {
            const r = JSON.parse(responseText),
                result = r.results[0];

            entries.reverse();
            entries.forEach(e => {
                ensureResult(e);

                const index = result.hits.findIndex(r => r.document.character_id === e.character_id);

                if (index >= 0) {
                    result.hits.splice(index, 1);
                } else {
                    result.found++;
                }
                result.hits.unshift({
                    document: e,
                    highlight: {} /* ,
                    text_match: 100,
                    text_match_info: {
                        best_field_score: "0",
                        best_field_weight: 12,
                        fields_matched: 4,
                        num_tokens_dropped: 1,
                        score: "100",
                        tokens_matched: 0,
                        typo_prefix_score: 255
                    } */
                });
                /* result.hits.unshift({
                    document: {
                        group_addable : true,
                        lora_status : "ready",
                        type : "STANDARD",
                        visibility : "public",
                        ...e
                    },
                    highlight: {},
                    text_match: 1,
                    text_match_info: {
                        best_field_score: "1",
                        best_field_weight: 15,
                        fields_matched: 1,
                        num_tokens_dropped: 0,
                        score: "1",
                        tokens_matched: 1,
                        typo_prefix_score: 0
                    }
                }); */
            });

            responseText = JSON.stringify(r);
        }
        return responseText;
    };

    const highlightPrivateChats = noToast => {
        let count = 0;

        getChatMap().forEach(m => {
            if (m.chat.character) {
                if (m.chat.character.visibility === "private") {
                    m.node.closest("div").classList.add("__S-highlight");
                    count++;
                }
            } else {
                m.node.closest("div").classList.add("__S-error");
            }
        });
        if (!noToast) {
            showToast(`${count.toLocaleString()} chats highlighted`);
        }
    };

    const highlightVisibleDescriptions = noToast => {
        let count = 0;

        [...document.querySelectorAll(".bg-purple-9\\/\\[\\.47\\].w-7.h-7")]
            .map(e => e.closest(".grid>div>div"))
            .forEach(m => {
                m.classList.add("__S-highlight");
                count++;
            });

        if (!noToast) {
            showToast(`${count.toLocaleString()} characters highlighted`);
        }
    };

    const initMemories = () => {
        const chatId = getChatId(),
            memories = ((JSON.parse(window.localStorage.getItem("__S_chats")) || {})[chatId] || {}).memories;

        _state.enableMemories = _options?.enableMemories && memories?.enableMemories;
        _state.memories = memories?.memories ||
            (_options.memories && _options.memories.length ?
                _options.memories.map(m => {
                    return {
                        active: true,
                        content: m
                    };
                }) : []);
    };

    const initReadLater = () => {
        let count = 0;

        getChatLinks()
            .filter(e => !e.querySelector(".__S-read-later-button"))
            .forEach(e => {
                const botId = e.querySelector("a").getAttribute("href").split("/").pop();

                const button = createCharacterButton(botId, [
                    "__S-read-later-button"
                ], __S_SHARED.icons.clock,
                    "Later",
                    toggleReadLater);

                if (!e.querySelector(".left-2:not(.__S-char-button)")) {
                    button.classList.add("left-2");
                }
                e.appendChild(button);
                count++;
            });

        if (count) {
            /* showToast(`${count.toLocaleString()} buttons added`); */
        }

        const found = new Set();

        [...document.querySelectorAll(".__S-read-later-current")].forEach(e => {
            const botId = e.dataset.botId;

            if (found.has(botId)) {
                e.closest("div.grid>div").remove();
            } else {
                found.add(botId);
            }
        });
        refreshReadLater();
    };

    const initStyles = () => {
        const style = document.createElement("style");

        style.textContent = __S_SHARED.styles.page;
        document.head.appendChild(style);
    };

    const loadAllChats = () => {
        let done = false;

        const nextPage = () => {
            const loadMoreButton = getLoadMoreChatsButton();

            if (loadMoreButton) {
                scrollDown();
                if (!loadMoreButton.disabled) {
                    done = true;
                    loadMoreButton.click();
                }
                window.setTimeout(nextPage, 5e2)
            } else {
                if (done) {
                    scrollDown();
                }
                showToast(`${getChats().length.toLocaleString()} chats` + (done ? " loaded" : ""));
            }
        }

        nextPage();
    };

    const loadAllMessages = () => {
        let done = false;

        const nextBatch = () => {
            const container = getChatContainer();

            if (container) {
                const loadMoreButton = container.querySelector("button.z-0"),
                    loadingWheel = container.querySelector(".pb-0");

                if (loadMoreButton || loadingWheel) {
                    if (loadMoreButton) {
                        scrollUp(container);
                        if (!loadMoreButton.disabled) {
                            done = true;
                            loadMoreButton.click();
                        }
                    }
                    window.setTimeout(nextBatch, 5e2)
                } else {
                    if (done) {
                        scrollUp(container);
                    }
                    showToast(`${_state.messages.length.toLocaleString()} messages` + (done ? " loaded" : ""));
                }
            }
        }

        nextBatch();
    };

    const pngCreated = message => {
        if (message.error) {
            showToast(message.error);
        } else {
            const binary = atob(message.blob);

            const bytes = new Uint8Array(binary.length);

            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            downloadBlob(new Blob([ bytes ], { type: message.mimeType }), `${message.name}.png`);
        }
    };

    const refreshFilter = () => getChatLinks().forEach(p => {
        const d = p.closest(".grid>div");

        let hits = _options.filterExpression ? findFilteredWords(d.innerText, _options.filterExpression) : [];

        if (hits.length) {
            const input = getFilterInputs().pop();

            if (input) {
                const filterText = input.value;

                if (filterText && filterText.length) {
                    const exceptions = filterText.toLowerCase().split(" ").map(__normalize);

                    hits = hits.filter(hit => !exceptions.includes(__normalize(hit.toLowerCase())));
                }
            }
        }

        d.classList[hits.length ? "add" : "remove"]("dim");

        if (hits.length) {
            const message = hits.map(hit => hit.trim()).join(", ");

            let button = p.querySelector(".__S-dim-hits-button");

            if (!button) {
                button = createCharacterButton(undefined, [
                    "__S-dim-hits-button",
                    "left-2"
                ], __S_SHARED.icons.question,
                    undefined,
                    b => showToast(b.dataset.message));

                p.appendChild(button);
            }
            button.dataset.message = message;
            if (button.getAttribute("title") !== message) {
                button.setAttribute("title", message);
            }
        } else {
            [...p.getElementsByClassName("__S-dim-hits-button")]
                .forEach(e => e.remove());
        }
    });

    const refreshReadLater = () => {
        const entries = getReadLaterEntries(),
            keys = entries && entries.map(e => e.character_id);

        [...document.querySelectorAll(".__S-read-later-button")].forEach(e => {
            e.classList[keys && keys.includes(e.dataset["botId"]) ?
                "add" :
                "remove"]("__S-read-later-current");
        });
    };

    const removeFromReadLater = botId => {
        const data = window.localStorage.getItem("__S_read_later"),
            entries = data && data.length && JSON.parse(data);

        if (entries) {
            const map = new Map(entries);

            if (map.has(botId)) {
                map.delete(botId);
                if (map.size) {
                    window.localStorage.setItem("__S_read_later", JSON.stringify([...map]));
                } else {
                    window.localStorage.removeItem("__S_read_later");
                }
                refreshReadLater();
            }
        }
    };

    const reorderGrid = () => {
        const grid = document.querySelector(".__S-char-link").parentElement;

        if (grid.querySelector(".__S-read-later-current")) {
            const links = [...Array.from(grid.getElementsByClassName("__S-char-link"))];

            const first = [],
                second = [];

            links.forEach(link => (link.querySelector(".__S-read-later-current") ?
                first :
                second).push(link));

            const sorted = [...first, ...second];

            if (!links.every((value, index) => value === sorted[index])) {
                sorted.forEach(link => grid.appendChild(link));
            }
        }
    };

    const scrollElement = (element, data) => {
        let current = element || document.documentElement;

        while (current && current.scrollHeight <= current.clientHeight) {
            current = current.parentElement;
        }
        if (current) {
            current.scrollTo({
                ...Object.fromEntries(Object.entries(data).map(([k, v]) => {
                    if (typeof v === "string" && v[0] === ".") {
                        v = current[v.substring(1)];
                    }
                    return [k, v];
                })),
                behavior: "smooth"
            });
        }
    };

    const scrollDown = element => scrollElement(element, { top: ".scrollHeight" });

    const scrollUp = element => scrollElement(element, { top: 0 });

    const sendMessage = (type, data) =>
        window.postMessage({
            ...data,
            source: "__S-P",
            type: type,
        });

    const setFilterText = message => {
        const inputs = getFilterInputs();

        inputs.forEach(input => {
            input.focus();

            const setter = Object.getOwnPropertyDescriptor(
                HTMLInputElement.prototype,
                "value"
            ).set;

            let filter = message.filter;

            if (filter && filter.map && filter.join) {
                filter = filter.map(f => {
                    if (f.match(/\s+/)) {
                        f = `"${f}"`;
                    }
                    return `-${f}`;
                }).join(" ");
            }

            setter.call(input, filter || "");

            input.dispatchEvent(new Event("input", {
                bubbles: true
            }));

            input.dispatchEvent(new Event("change", {
                bubbles: true
            }));
        });
    };

    const setMemories = (chatId, memories) => {
        const chats = JSON.parse(window.localStorage.getItem("__S_chats")) || {};

        if (memories) {
            if (!chats[chatId]) {
                chats[chatId] = {};
            }
            chats[chatId].character = _state.searchResults[Object.keys(_state.searchResults)[0]];
            chats[chatId].memories = memories;
        } else if (chats[chatId]) {
            delete chats[chatId].memories;
        }
        if (Object.keys(chats).length) {
            window.localStorage.setItem("__S_chats", JSON.stringify(chats));
        } else {
            window.localStorage.removeItem("__S_chats");
        }
    };

    const showDetailedDates = () => getChatMap().forEach(m => {
        const n = m.node.querySelector(".justify-between>.justify-between.pr-8>.items-center.gap-\\[4px\\]").querySelectorAll("p")[0];

        n.textContent = new Date(m.chat.last_message.createdAt).toLocaleString();
    });

    const showOptions = () => sendMessage("SHOW_OPTIONS", {
        theme: getTheme()
    });

    const showToast = (message, duration) => {
        duration = duration || 4e3;

        const element = document.createElement("div");

        const dismiss = () => {
            element.classList.remove("visible");
            window.setTimeout(() => element.remove(), duration);
        };

        let timeout;

        element.className = "__S-toast";
        element.textContent = message;

        if (!_toast.host || !_toast.host.isConnected) {
            _toast.host = document.createElement("div");
            _toast.root = _toast.host.attachShadow({ mode: "closed" });

            const style = document.createElement("style");

            style.innerHTML = __S_SHARED.styles.toast;
            _toast.root.appendChild(style);

            document.body.appendChild(_toast.host);
        }

        const themeElement = document.createElement("div");

        themeElement.classList.add(getTheme());
        themeElement.appendChild(element);
        _toast.root.appendChild(themeElement);

        element.addEventListener("click", () => {
            window.clearTimeout(timeout);
            dismiss();
        });
        element.addEventListener("transitionend", () => {
            if (!element.classList.contains("visible")) {
                element.remove();
            }
        });

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                element.classList.add("visible");
            });
        });
        timeout = window.setTimeout(() => {
            dismiss();
        }, duration || 4e3);
    };

    const sortChats = message => {
        const sort = message.sort;

        if (sort && sort.length) {
            const container = getChatsContainer(),
                chats = getChatMap();

            chats.sort((a, b) => {
                const byName = () => (a.chat.label || a.chat.character.name)
                    .localeCompare(b.chat.label || b.chat.character.name);

                let r = 0;

                for (const part of sort.split("|")) {
                    const c = part.split(":"),
                        what = c[0] || "N",
                        direction = c[1] || "A";

                    switch (what.toUpperCase()) {
                        case "N":
                            r = byName();
                            break;
                        case "M":
                            r = a.chat.num_messages - b.chat.num_messages;
                            break;
                        case "D":
                            r = a.chat.last_message.createdAt - b.chat.last_message.createdAt;
                            break;
                    }
                    if (r) {
                        if (direction === "D") r = -r;
                        break;
                    }
                }
                if (r === 0) {
                    r = byName();
                }
                return r;
            }).forEach(m => {
                const p = [...container.children].find(x => x.contains(m.node));

                p.parentElement.appendChild(p);
            });

            const loadMoreButton = getLoadMoreChatsButton();

            if (loadMoreButton) {
                const row = loadMoreButton.closest("div");

                row.parentElement.appendChild(row);
            }
            showToast(`${chats.length.toLocaleString()} chats sorted`);
        }
    };

    const toggleReadLater = e => {
        const botId = e.dataset["botId"];

        if (e.classList.contains("__S-read-later-current")) {
            removeFromReadLater(botId);
        } else {
            addToReadLater(botId);
        }
    };

    const updateChats = (oldId, newId) => {
        const chats = JSON.parse(window.localStorage.getItem("__S_chats")) || {};

        const previousValue = chats[oldId];

        if (previousValue) {
            delete chats[oldId];
            chats[newId] = previousValue;
            window.localStorage.setItem("__S_chats", JSON.stringify(chats));
        }
    };

    window.addEventListener("DOMContentLoaded", () => {
        /* let initRoute = true; */

        initStyles();

        (() => {
            const getRoute = () => window.location.pathname;

            let currentRoute = getRoute();

            const routeChanged = () => {
                const newRoute = getRoute();

                if (newRoute !== currentRoute) {
                    let resetState = true;

                    if (__S_SHARED.isChatPage(new URL(currentRoute, window.location.href)) &&
                        __S_SHARED.isChatPage(new URL(newRoute, window.location.href))) {

                        const currentParts = currentRoute.split("/"),
                            newParts = newRoute.split("/");

                        if (newParts.length === currentParts.length + 1) {
                            if (currentParts.at(-1) === newParts.at(-2)) {
                                resetState = false;
                            }
                        }
                    }
                    currentRoute = newRoute;
                    /* console.log("Route:", currentRoute); */
                    /* initRoute = true; */
                    if (resetState) {
                        initState();
                        initMemories();
                    }
                }
            };

            const originalPushState = history.pushState;

            history.pushState = function (...args) {
                const result = originalPushState.apply(this, args);

                routeChanged();
                return result;
            };

            const originalReplaceState = history.replaceState;

            history.replaceState = function (...args) {
                const result = originalReplaceState.apply(this, args);

                routeChanged();
                return result;
            };

            window.addEventListener("popstate", routeChanged);
            window.addEventListener("hashchange", routeChanged);

            routeChanged();
        })();

        (() => {
            const createButton = (className, innerHTML, clickHandler, title) => {
                const button = document.createElement("button");

                button.setAttribute("type", "button");
                button.classList.add("__S-button");
                if (className) {
                    button.classList.add(className);
                }
                if (innerHTML) {
                    button.innerHTML = innerHTML;
                }
                if (clickHandler) {
                    button.addEventListener("click", clickHandler);
                }
                if (title) {
                    button.setAttribute("title", title);
                }
                return button;
            };

            if (window.location.href.startsWith(__S_SHARED.baseUrl)) {
                let renderPending = false;

                const observer = new MutationObserver(mutations => {
                    const isCharacterList = __S_SHARED.isCharacterList(),
                        isChatList = __S_SHARED.isChatList(),
                        isBotPage = __S_SHARED.isBotPage(),
                        isChatPage = __S_SHARED.isChatPage();

                    if (isCharacterList || isChatList || isBotPage || isChatPage) {
                        if (!renderPending) {
                            renderPending = true;

                            const container = isCharacterList ?
                                document.querySelector(".flex.flex-col.grow>.grid") :
                                isChatList ?
                                    getChatsContainer() :
                                    isBotPage ?
                                        getBotContainer() :
                                        isChatPage ?
                                            getChatContainer() :
                                            undefined;

                            if (container) {
                                /* if (initRoute) {
                                    initRoute = false; */

                                    if (isCharacterList) {
                                        getFilterInputs().forEach(input => {
                                            if (!input.dataset["__S_done"]) {
                                                input.dataset["__S_done"] = true;

                                                const parent = input.closest(".grow");

                                                parent.appendChild(createButton("__S-filter", __S_SHARED.icons.filter,
                                                    () => setFilterText({ filter: _options.filter }), "Set custom filter"));
                                                parent.appendChild(createButton("__S-options", __S_SHARED.icons.options,
                                                    showOptions, "Show options"));
                                            }
                                        });
                                    } else if (isChatList) {
                                        const buttonContainer = document.querySelector(".mb-md");

                                        if (buttonContainer) {
                                            if (!buttonContainer.dataset["__S_done"]) {
                                                buttonContainer.dataset["__S_done"] = true;

                                                const toolbar = document.createElement("div");

                                                toolbar.classList.add("__S-toolbar");

                                                toolbar.appendChild(createButton("__S-load", __S_SHARED.icons.load,
                                                    loadAllChats, "Load all chats"));

                                                toolbar.appendChild(createButton("__S-dates", __S_SHARED.icons.dates,
                                                    showDetailedDates, "Show dates"));

                                                __S_SHARED.sorts.forEach(sort => {
                                                    toolbar.appendChild(createButton("__S-sort", sort.icon,
                                                        () => sortChats({ sort: sort.sort }), sort.title));
                                                });

                                                toolbar.appendChild(createButton("__S-details", __S_SHARED.icons.details,
                                                    getChatsDetails, "Show details"));
                                                toolbar.appendChild(createButton("__S-options", __S_SHARED.icons.options,
                                                    showOptions, "Show options"));

                                                buttonContainer.firstChild.style.whiteSpace = "nowrap";
                                                buttonContainer.insertBefore(toolbar, buttonContainer.lastElementChild);
                                            }
                                        } else {
                                            showToast("not found");
                                        }
                                    } else if (isBotPage) {
                                        const botId = window.location.href.split("/").pop(),
                                            buttonContainer = [...container.querySelectorAll("div")]
                                                .filter(d => d.querySelectorAll(":scope>a").length > 0 &&
                                                    d.querySelectorAll(":scope>button").length > 0)
                                                .pop(),
                                            detailsContainer = container.querySelector(".opacity-60.text-sm");

                                        if (buttonContainer) {
                                            if (!buttonContainer.dataset["__S_done"]) {
                                                buttonContainer.dataset["__S_done"] = true;

                                                const lastButton = [...buttonContainer.querySelectorAll(":scope>button")].pop();

                                                const createBotButton = (className, icon, text, clickHandler) => {
                                                    const newButton = lastButton.cloneNode(true);

                                                    newButton.dataset["botId"] = botId;
                                                    newButton.classList.add("__S-bot-button");
                                                    if (className && className.length) {
                                                        newButton.classList.add(className);
                                                    }
                                                    if (icon && icon.length) {
                                                        newButton.innerHTML = icon;
                                                    }
                                                    if (text && text.length) {
                                                        newButton.appendChild(document.createTextNode(text));
                                                    }
                                                    if (clickHandler) {
                                                        newButton.addEventListener("click", () => clickHandler(newButton));
                                                    }
                                                    buttonContainer.appendChild(newButton);
                                                    return newButton;
                                                };

                                                const createDownloadButton = (text, icon, asPNG) => {
                                                    createBotButton("__S-export-bot",
                                                        icon,
                                                        text,
                                                        button => {
                                                            const bot = _state.searchResults[button.dataset.botId];

                                                            if (bot) {
                                                                const formatted = {
                                                                    "name": bot.name,
                                                                    "description": bot.persona,
                                                                    "personality": bot.title,
                                                                    "scenario": bot.scenario,
                                                                    "first_mes": bot.greeting,
                                                                    "mes_example": bot.dialogue
                                                                }, name = `${bot.name}_${__S_SHARED.formatDate(new Date())}`;

                                                                if (asPNG) {
                                                                    sendMessage("CREATE_PNG", {
                                                                        avatarURL: new URL(bot.avatar_url, __S_SHARED.avatarBaseUrl).toString(),
                                                                        name: name,
                                                                        character: formatted
                                                                    });
                                                                } else {
                                                                    downloadBlob(new Blob([ "\uFEFF" + JSON.stringify(formatted) ],
                                                                        { type: "application/json;charset=utf-8" }), `${name}.json`);
                                                                }
                                                            } else {
                                                                showToast("Not found");
                                                            }
                                                        });
                                                };

                                                createBotButton("__S-read-later",
                                                    __S_SHARED.icons.clock,
                                                    "Later",
                                                    toggleReadLater);
                                                refreshReadLater();

                                                createDownloadButton("Export (JSON)", __S_SHARED.icons.download);
                                                createDownloadButton("Export (PNG)", __S_SHARED.icons.downloadImage, true);
                                            }
                                        }
                                        if (detailsContainer) {
                                            if (!detailsContainer.dataset["__S_done"]) {
                                                detailsContainer.dataset["__S_done"] = true;

                                                const bot = _state.searchResults[botId];

                                                if (bot && bot.createdAt) {
                                                    const date = new Date(bot.createdAt);

                                                    if (!isNaN(date)) {
                                                        const firstText = detailsContainer.firstChild.cloneNode(true),
                                                            textElement = firstText.lastChild;

                                                        firstText.classList.add("__S-bot-details");
                                                        firstText.innerHTML = __S_SHARED.icons.clock;
                                                        textElement.innerText = `Created: ${__S_SHARED.formatDate(date)}`;
                                                        firstText.appendChild(textElement);
                                                        detailsContainer.appendChild(firstText);
                                                    }
                                                }
                                            }
                                        }
                                    } else if (isChatPage) {
                                        const buttonContainer = container.querySelector("div:not([role=separator]):not(.justify-end)");

                                        if (buttonContainer) {
                                            const toolbarContainer = buttonContainer.querySelector("div");

                                            if (toolbarContainer && !buttonContainer.dataset["__S_done"]) {
                                                buttonContainer.dataset["__S_done"] = true;

                                                const toolbar = document.createElement("div");

                                                toolbar.classList.add("__S-toolbar");

                                                toolbar.appendChild(createButton("__S-load-messages", __S_SHARED.icons.load,
                                                    loadAllMessages, "Load all messages"));
                                                toolbar.appendChild(createButton("__S-export-chat", __S_SHARED.icons.details,
                                                    exportChat, "Export chat"));
                                                toolbar.appendChild(createButton("__S-options", __S_SHARED.icons.options,
                                                    showOptions, "Show options"));

                                                toolbarContainer.lastElementChild.remove();
                                                toolbarContainer.appendChild(toolbar);
                                            }
                                        }

                                        const mainToolbarContainer = container.closest(".top-0").querySelector(".justify-end.items-center.gap-sm");

                                        if (mainToolbarContainer &&
                                            !mainToolbarContainer.dataset["__S_done"]) {

                                            mainToolbarContainer.dataset["__S_done"] = true;

                                            const original = [...mainToolbarContainer.getElementsByTagName("button")].pop(),
                                                button = original.cloneNode(true);

                                            button.classList.add("__S-toolbar-button");
                                            button.innerHTML = __S_SHARED.icons.details;
                                            button.addEventListener("click", editMemories);

                                            const relative = document.createElement("div");

                                            relative.classList.add("relative");

                                            const middle = document.createElement("div");

                                            middle.appendChild(button);
                                            relative.appendChild(middle);

                                            const buttonSet = original.closest(".gap-sm");

                                            buttonSet.firstElementChild.after(relative);
                                        }
                                    }
                                /* } */

                                const relevant = mutations
                                    .some(mutation => [...mutation.addedNodes]
                                    .some(node => container.contains(node)));

                                if (relevant) {
                                    if ((isBotPage || isChatPage) && document.title === "") {
                                        const botId = window.location.href.split("/").pop(),
                                            bot = _state.searchResults[botId];

                                        if (bot) {
                                            document.title = isBotPage ?
                                                `${bot.name} - Explore this AI chatbot on Spicychat` :
                                                isChatPage ?
                                                    `Chat with ${bot.name} on Spicychat` :
                                                    "";
                                        }
                                    }
                                    requestAnimationFrame(() => {
                                        renderPending = false;
                                        if (isCharacterList) {
                                            applyGridFixes();
                                            refreshFilter();
                                            highlightVisibleDescriptions(true);
                                            initReadLater();
                                            reorderGrid();
                                        } else if (isChatList) {
                                            highlightPrivateChats(true);
                                        } else if (isChatPage) {
                                            applyChatBackground();
                                        }
                                    });
                                } else {
                                    if (isChatPage) {
                                        if (mutations.filter(mutation => !mutation.target.closest("textarea")).length) {
                                            const nodes = [...new Set(mutations.flatMap(mutation => [
                                                mutation.type === "childList" ? undefined: mutation.target,
                                                ...mutation.addedNodes,
                                                ...mutation.removedNodes
                                            ]).filter(n => n))];

                                            if (!(nodes.length === 1 && nodes[0].shadowRoot)) {
                                                applyChatBackground();
                                            }
                                        }
                                    }
                                    renderPending = false;
                                }
                            } else {
                                renderPending = false;
                            }
                        }
                    }
                });
                observer.observe(document.body, { childList: true, subtree: true });
            } else {
                const test = new URLSearchParams(window.location.search).get("test");

                if (test) {
                    document.body.appendChild(createButton("__S-test", __S_SHARED.icons.options,
                        () => showToast(`Test ${test}`), "Test"));
                }
            }
        })();
    });

    window.addEventListener("message", e => {
        if (e.source !== window) return;
        if (e.data?.source !== "__S-S") return;

        const message = event.data.message;

        if (!_taskRunner.isTask(message)) {
            switch (message.type) {
                case "COPY_CHAT_TITLES":
                    copyChatTitles();
                    break;
                case "CREATE_PNG":
                    pngCreated(message);
                    break;
                case "EXPORT_CHAT":
                    exportChat();
                    break;
                case "GET_CHAT_DETAILS":
                    getChatsDetails();
                    break;
                case "HIGHLIGHT_PRIVATE_CHATS":
                    highlightPrivateChats();
                    break;
                case "HIGHLIGHT_VISIBLE_DESCRIPTIONS":
                    highlightVisibleDescriptions();
                    break;
                case "LOAD_ALL_CHATS":
                    loadAllChats();
                    break;
                case "LOAD_ALL_MESSAGES":
                    loadAllMessages();
                    break;
                case "OPTIONS_CHANGED":
                    applyOptions(message.options);
                    break;
                case "SET_FILTER":
                    setFilterText(message);
                    break;
                case "SHOW_DETAILED_DATES":
                    showDetailedDates();
                    break;
                case "SHOW_OPTIONS":
                    showOptions();
                    break;
                case "SORT_CHATS":
                    sortChats(message);
                    break;
                default:
                    showToast(JSON.stringify(message));
                    break;
            }
        }
    });

    window.addEventListener("resize", applyChatBackground);

    (() => {
        const EDGE_SIZE = 0.2,
            VERTICAL_TOLERANCE = 0.6;

        const getSwipeThreshold = () => window.innerWidth * (
            window.innerWidth <= 600 ? 0.10 :
            window.innerWidth <= 1200 ? 0.05 :
            0.03);

        let startX = 0,
            startY = 0,
            tracking = false;

        document.addEventListener("touchstart", (event) => {
            if (!_options.swipeRight ||
                event.touches.length !== 1) {

                tracking = false;
                return;
            }

            const touch = event.touches[0];

            startX = touch.clientX;
            startY = touch.clientY;

            tracking = startX <= window.innerWidth * EDGE_SIZE;
        }, { passive: true });

        document.addEventListener("touchmove", (event) => {
            if (!tracking || event.touches.length !== 1) {
                return;
            }

            const touch = event.touches[0],
                deltaX = touch.clientX - startX,
                deltaY = touch.clientY - startY;

            if (deltaX >= getSwipeThreshold() &&
                Math.abs(deltaY / deltaX) <= VERTICAL_TOLERANCE) {

                tracking = false;

                try {
                    const menuButton =
                        document.querySelector('button[aria-label="menu"]') ||
                        document.querySelector("nav button");

                    if (menuButton) {
                        menuButton.click();
                    }
                } catch (error) {
                    console.error(error);
                    showToast(error.message);
                }
            }
        }, { passive: true });

        document.addEventListener("touchend", () => tracking = false, { passive: true });
        document.addEventListener("touchcancel", () => tracking = false, { passive: true });
    })();

    sendMessage("GET_OPTIONS");
})();
