"use strict";

window.addEventListener("DOMContentLoaded", async () => {
    const parseMarkup = (text) => {
        const fragment = document.createDocumentFragment();

        function parseInline(text, parent) {
            const stack = [];
            let current = parent;
            let buffer = "";

            function flush() {
                if (!buffer)
                    return;

                current.appendChild(document.createTextNode(buffer));
                buffer = "";
            }

            function open(marker, element) {
                flush();

                current.appendChild(element);

                stack.push({
                    marker,
                    element
                });

                current = element;
            }

            function close(marker) {
                const top = stack.at(-1);

                if (!top || top.marker !== marker)
                    return false;

                flush();

                stack.pop();
                current = stack.at(-1)?.element ?? parent;

                return true;
            }

            for (let i = 0; i < text.length;) {

                // ***
                if (text.startsWith("***", i)) {
                    if (stack.at(-1)?.marker === "***") {
                        close("***");
                    }
                    else {
                        flush();

                        const strong = document.createElement("strong");
                        strong.classList.add("markup-blue");

                        const italic = document.createElement("i");
                        strong.appendChild(italic);

                        current.appendChild(strong);

                        stack.push({
                            marker: "***",
                            element: strong,
                            content: italic
                        });

                        current = italic;
                    }

                    i += 3;
                    continue;
                }

                // **
                if (text.startsWith("**", i)) {
                    if (stack.at(-1)?.marker === "**") {
                        close("**");
                    }
                    else {
                        const strong = document.createElement("strong");
                        strong.classList.add("markup-white");

                        open("**", strong);
                    }

                    i += 2;
                    continue;
                }

                // ~~
                if (text.startsWith("~~", i)) {
                    if (stack.at(-1)?.marker === "~~") {
                        close("~~");
                    }
                    else {
                        open("~~", document.createElement("del"));
                    }

                    i += 2;
                    continue;
                }

                // *
                if (text[i] === "*") {
                    if (stack.at(-1)?.marker === "*") {
                        close("*");
                    }
                    else {
                        const italic = document.createElement("i");
                        italic.classList.add("markup-blue");

                        open("*", italic);
                    }

                    i++;
                    continue;
                }

                // `
                if (text[i] === "`") {
                    if (stack.at(-1)?.marker === "`") {
                        close("`");
                    }
                    else {
                        const highlighted = document.createElement("span");
                        highlighted.classList.add("highlighted");

                        open("`", highlighted);
                    }

                    i++;
                    continue;
                }

                // Normal text: accumula!
                buffer += text[i];
                i++;
            }

            flush();
        }

        for (const line of text.split(/\r?\n/)) {

            // /cmd
            if (line.startsWith("/cmd")) {
                const element = document.createElement("div");
                element.classList.add("markup-command");

                parseInline(line, element);

                fragment.appendChild(element);
                continue;
            }

            // # Heading
            const heading = line.match(/^(#{1,6})[ \t]+(.*)$/);

            if (heading) {
                const level = heading[1].length;
                const element = document.createElement(`h${level}`);

                parseInline(heading[2], element);

                fragment.appendChild(element);
                continue;
            }

            // Normal line
            const element = document.createElement("div");

            parseInline(line, element);

            fragment.appendChild(element);
        }

        return fragment;
    };

    const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "short" });

    const timeFormatter = new Intl.DateTimeFormat(undefined, { timeStyle: "medium" });

    const key = `chat-${new URLSearchParams(window.location.search).get("id")}`;

    let payload = (await chrome.storage.session.get(key))[key];

    if (payload && payload.length) {
        const message = JSON.parse(payload),
            chat = message.chat;

        if (chat.theme) {
            document.documentElement.classList.add(chat.theme);
        }

        chat.messages.sort((a, b) => a.createdAt - b.createdAt);

        //document.getElementById("container").appendChild(document.createTextNode(JSON.stringify(chat)));

        [...document.querySelectorAll(".messages")].forEach(n => {
            let i = 0;

            chat.messages.forEach(m => {
                const e = document.createElement("div");

                e.classList.add("message");
                e.classList.add(m.role);

                const h = document.createElement("div");

                h.classList.add("header");

                const x = document.createElement("div");

                x.textContent = `#${(++i).toLocaleString()}`;
                h.appendChild(x);

                const d = document.createElement("div"),
                    date = new Date(m.createdAt);

                d.classList.add("timestamp");
                if (!isNaN(date)) {
                    d.textContent = __S_SHARED.formatDate(date);
                }
                h.appendChild(d);

                e.appendChild(h);

                e.appendChild(parseMarkup(m.content));
                n.appendChild(e);
            });
        });

        const blobRaw = new Blob(
            [ "\uFEFF" + JSON.stringify(chat) ],
            { type: "text/json;charset=utf-8;" }
        ), blobHtml = new Blob(
            [ "\uFEFF" + document.documentElement.outerHTML ],
            { type: "text/html;charset=utf-8;" }
        );

        const buttonRaw = document.getElementById("downloadRaw"),
            buttonHtml = document.getElementById("downloadChat"),
            name = chat.character.name,
            title = `${document.title} with ${name + (chat.conversation.label ? ` (${chat.conversation.label})` : "")} - ${chat.messages.length} messages`;

        document.title = title;

        buttonRaw.setAttribute("download", `${title} - raw`);
        buttonHtml.setAttribute("download", title);

        buttonRaw.addEventListener("click", () => {
            const url = URL.createObjectURL(blobRaw);

            const a = document.createElement("a");
                a.href = url;
                a.download = `${title}.json`;
                a.click();

            URL.revokeObjectURL(url);
        });
        buttonHtml.addEventListener("click", () => {
            const url = URL.createObjectURL(blobHtml);

            const a = document.createElement("a");
                a.href = url;
                a.download = `${title}.html`;
                a.click();

            URL.revokeObjectURL(url);
        });
    }
});
