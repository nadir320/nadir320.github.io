"use strict";

window.addEventListener("DOMContentLoaded", async () => {
    const key = `chat-details-${new URLSearchParams(window.location.search).get("id")}`;

    const columnMap = {
        "character.type": { className: "short-text",  contentClassName: true },
        "character.name": {},
        "character.title": { className: "title" },
        "character.visibility": { contentClassName: true },
        "character.creator_username": {},
        "character.creator_user_id": {},
        "character.greeting": { className: "long-text" },
        "character.persona": { className: "long-text" },
        "character.avatar_url": { className: "url" },
        "character.scenario": { className: "long-text" },
        "character.num_messages": { className: "number" },
        "character.is_nsfw": { className: "short-text" },
        "character.avatar_is_nsfw": { className: "short-text" },
        "character.definition_visible": {},
        "character.tags": {},
        "character.language": {},
        "character.definition_size_category": {},
        "character.lora_status": {},
        "character.token_count": { className: "number" },
        "character.reportsType": {},
        "character.translated_languages": {},
        "character.lorebooks": {},
        "character.group_size_category": {},
        "character.character_id": {},
        "character_id": {},
        "createdAt": { isDate: true },
        "id": {},
        "label": { className2: "highlight" },
        "last_message.role": { className: "short-text", contentClassName: true },
        "last_message.is_nsfw": { className: "short-text" },
        "last_message.content": { className: "long-text" },
        "last_message.createdAt": { isDate: true },
        "last_message_id": {},
        "last_text_message.id": {},
        "last_text_message.role": { className: "short-text", contentClassName: true },
        "last_text_message.content": { className: "long-text" },
        "last_text_message.is_nsfw": { className: "short-text" },
        "last_text_message.createdAt": { isDate: true },
        "message_count": { className: "number", match: "num_messages" },
        "num_messages": { className: "number", match: "message_count" },
        "user_persona_id": {},
        "character.type": { className: "short-text" },
        "is_last_id": { className: "short-text" }
    };

    let payload = (await chrome.storage.session.get(key))[key];

    if (payload && payload.length) {
        const isGuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

        const message = JSON.parse(payload);

        function flattenObject(obj, prefix = "", result = {}) {
            for (const [key, value] of Object.entries(obj)) {
                const path = prefix
                    ? `${prefix}.${key}`
                    : key;

                if (value !== null &&
                    typeof value === "object" &&
                    !Array.isArray(value)) {

                    flattenObject(value, path, result);
                }
                else {
                    result[path] = value;
                }
            }

            return result;
        }

        function humanize(s) {
            return s
                .replace(/([a-z\d])([A-Z])/gu, "$1 $2")
                .split(/[^\p{L}\p{N}]+/u)
                .filter(Boolean)
                .map(s => s.toLowerCase())
                .map((s, i) => i === 0 ? s[0].toUpperCase() + s.slice(1) : s)
                .join(" ");
        }

        function createTable(data) {
            if (!Array.isArray(data) || data.length === 0)
                return document.createElement("table");

            const rows = data.map(x => flattenObject(x));

            const columns = [];

            for (const row of rows) {
                for (const key of Object.keys(row)) {
                    if (!columns.includes(key)) {
                        columns.push(key);
                    }
                }
            }

            const table = document.createElement("table");

            const thead = table.createTHead();
            const headerRow = thead.insertRow();

            const nTh = document.createElement("th");

            nTh.textContent = "#";
            headerRow.appendChild(nTh);

            for (const column of columns) {
                const th = document.createElement("th");

                th.textContent = column.replace(/[_.]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                th.textContent = humanize(column);
                headerRow.appendChild(th);
            }

            const tbody = table.createTBody();

            let rowNumber = 0;

            for (const row of rows) {
                const tr = tbody.insertRow();

                const nTd = document.createElement("td");

                nTd.classList.add("number");
                nTd.textContent = (++rowNumber).toLocaleString();
                tr.appendChild(nTd);

                for (const column of columns) {
                    const td = tr.insertCell();

                    td.dataset["column"] = column;

                    const value = row[column];

                    if (value !== null && value !== undefined) {
                        if (typeof value === "boolean" && value) td.classList.add("truthy");
                        if (typeof value === "boolean" && !value) td.classList.add("falsy");
                        td.textContent = typeof value === "object" ?
                            JSON.stringify(value) :
                            typeof value === "number" ?
                                value.toLocaleString(undefined, { useGrouping: true }) :
                                String(value);
                    }

                    if (isGuid(td.textContent)) td.classList.add("guid");

                    const c = columnMap[column];

                    if (c) {
                        if (c.className) {
                            td.classList.add(c.className);
                        }
                        if (c.className2 && td.textContent) {
                            td.classList.add(c.className2);
                        }
                        if (c.contentClassName) {
                            try {
                                if (td.textContent) td.classList.add(td.textContent);
                            } catch {}
                        }
                        if (c.isDate) {
                            const date = new Date(value);

                            if (!isNaN(date)) {
                                td.textContent = __S_SHARED.formatDate(date, "it-IT");
                            }
                        }
                    }
                }

                [...tr.getElementsByTagName("td")].forEach(td => {
                    const column = td.dataset["column"];

                    if (column) {
                        const map = columnMap[column];

                        if (map && map.match) {
                            const other = tr.querySelector(`td[data-column='${map.match}']`);

                            if (other && td.textContent !== other.textContent) {
                                td.classList.add("mismatch");
                            }
                        }
                    }
                });
            }

            return table;
        }

        function tableToCsv(table) {
            const rows = [...table.querySelectorAll("tr")];

            return rows.map(row => {
                const cells = [...row.querySelectorAll("th, td")];

                return cells.map(cell => {
                    const value = cell.innerText
                        .replace(/\r?\n|\r/g, " ")
                        .trim();

                    return `"${value.replace(/"/g, '""')}"`;
                }).join(";");
            }).join("\r\n");
        }

        message.chats.forEach(c => {
            if (c.id) {
                c.chat_id = c.id;
                delete c.id;
            }
            if (c.character_id && c.character && (c.character_id || c.character.id)) {
                delete c.character_id;
            }
            if (c.character && c.character.character_id) {
                c.character.id = c.character.character_id;
                delete c.character.character_id;
            }
        });

        const table = createTable(message.chats);

        document.getElementById("container").appendChild(table);

        const blob = new Blob(
            ["\uFEFF" + tableToCsv(table)],
            { type: "text/csv;charset=utf-8;" }
        );

        const button = document.getElementById("downloadCSV"),
            title = `${document.title} - ${message.chats.length} chats`;

        document.title = title;
        button.setAttribute("download", title);
        button.addEventListener("click", () => {
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
                a.href = url;
                a.download = `${title}.csv`;
                a.click();

            URL.revokeObjectURL(url);
        });
    }
});
