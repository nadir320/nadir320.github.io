"use strict";

window.__S_SHARED = {
    avatarBaseUrl: "https://cdn.nd-api.com/",
    baseUrl: "https://spicychat.ai/",
    chatUrl: "https://prod.nd-api.com/chat",
    formatDate: (date, culture) => {
        const dateFormatter = new Intl.DateTimeFormat(culture, {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });

        const timeFormatter = new Intl.DateTimeFormat(culture, { timeStyle: "medium" });

        return `${dateFormatter.format(date)} ${timeFormatter.format(date)}`;
    },
    icons: {
        add: `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" stroke-width="2"/>
              <path d="M12 8V16M8 12H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `,
        clock: `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
              <path d="M12 7V12L15.5 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `,
        close: `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 7L17 17M17 7L7 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `,
        dates: `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M5 5h14v15H5zM5 9h14M8 3v4M16 3v4"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linejoin="round"
                      stroke-linecap="round"/>
            </svg>
        `,
        delete: `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 7H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M10 11V17M14 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M5 7L6 20H18L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 7V4H15V7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `,
        details: `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M10 5H5v14h14v-5"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"/>
                <path d="M14 4h6v6M20 4l-9 9"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"/>
            </svg>
        `,
        download: `
            <svg xmlns="http://www.w3.org/2000/svg"
                 viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="2"
                 stroke-linecap="round"
                 stroke-linejoin="round">
              <path d="M12 3v12"/>
              <path d="m7 10 5 5 5-5"/>
              <path d="M5 21h14"/>
            </svg>
        `,
        downloadImage: `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="5" width="14" height="14" rx="2"
                    stroke="currentColor" stroke-width="2"/>
                <circle cx="9" cy="9" r="1.5"
                    stroke="currentColor" stroke-width="2"/>
                <path d="M6.5 17L11 12.5L13.5 15L15.5 13L17.5 15"
                    stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `,
        edit: `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 20H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M16.5 3.5L20.5 7.5L10 18L5 19L6 14L16.5 3.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `,
        filter: `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M3 5h18l-7 8v5l-4 2v-7L3 5z"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linejoin="round"/>
            </svg>
        `,
        load: `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3v11m0 0l-4-4m4 4l4-4M5 17v3h14v-3"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"/>
            </svg>
        `,
        more: `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `,
        options: `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15.5C13.933 15.5 15.5 13.933 15.5 12C15.5 10.067 13.933 8.5 12 8.5C10.067 8.5 8.5 10.067 8.5 12C8.5 13.933 10.067 15.5 12 15.5Z"
                    stroke="currentColor"
                    stroke-width="2"/>
                <path d="M19.4 15C19.8 14.1 20 13.1 20 12C20 10.9 19.8 9.9 19.4 9L21 7.5L18.5 5L17 6.6C16.1 6.2 15.1 6 14 6L13.5 4H10.5L10 6C8.9 6.2 7.9 6.5 7 6.9L5.5 5.5L3 8L4.6 9.5C4.2 10.4 4 11.4 4 12.5C4 13.6 4.2 14.6 4.6 15.5L3 17L5.5 19.5L7 18C7.9 18.4 8.9 18.7 10 19L10.5 21H13.5L14 19C15.1 18.8 16.1 18.5 17 18.1L18.5 19.5L21 17L19.4 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `,
        question: `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.5 9C9.5 7.34315 10.6193 6 12 6C13.933 6 15.5 7.34315 15.5 9C15.5 10.5 14.5 11.25 13 12C12.3333 12.3333 12 13 12 14"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="18" r="1" fill="currentColor"/>
            </svg>
        `
    },
    isBotPage: url => {
        const pathName = new window.URL(url || window.location.href).pathname;

        return pathName.includes("/chatbot/");
    },
    isCharacterList: url => {
        const pathName = new window.URL(url || window.location.href).pathname;

        return pathName === "/" ||
            pathName.includes("/creator/") ||
            pathName.endsWith("/recommended-bots") ||
            pathName.endsWith("/favorite-bots");
    },
    isChatList: url => {
        const pathName = new window.URL(url || window.location.href).pathname;

        return pathName.includes("/chats/") ||
            pathName.endsWith("/chats");
    },
    isChatPage: url => {
        const pathName = new window.URL(url || window.location.href).pathname;

        return pathName.includes("/chat/");
    },
    messagesUrl: "https://prod.nd-api.com/messages",
    sorts: [
        {
            title: "Sort (A to Z)",
            sort: "N",
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M7 5v14M7 19l-3-3M7 19l3-3"
                          fill="none" stroke="currentColor" stroke-width="2"
                          stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M13 6h7M13 12h5M13 18h3"
                          fill="none" stroke="currentColor" stroke-width="2"
                          stroke-linecap="round"/>
                </svg>`,
        },
        {
            title: "Sort (Z to A)",
            sort: "N:D",
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M7 19V5M7 5l-3 3M7 5l3 3"
                          fill="none" stroke="currentColor" stroke-width="2"
                          stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M13 6h7M13 12h5M13 18h3"
                          fill="none" stroke="currentColor" stroke-width="2"
                          stroke-linecap="round"/>
                </svg>`
        },
        {
            title: "Sort (newest first)",
            sort: "D:D",
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <circle cx="9" cy="12" r="6"
                            fill="none" stroke="currentColor" stroke-width="2"/>
                    <path d="M9 8v4l3 2M17 7v10M17 17l-2-2M17 17l2-2"
                          fill="none" stroke="currentColor" stroke-width="2"
                          stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`
        },
        {
            title: "Sort (oldest first)",
            sort: "D",
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <circle cx="9" cy="12" r="6"
                            fill="none" stroke="currentColor" stroke-width="2"/>
                    <path d="M9 8v4l3 2M17 17V7M17 7l-2 2M17 7l2 2"
                          fill="none" stroke="currentColor" stroke-width="2"
                          stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`
        },
        {
            title: "Sort (most messages first)",
            sort: "M:D",
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M4 5v14M4 19h17"
                          fill="none" stroke="currentColor" stroke-width="2"
                          stroke-linecap="round"/>
                    <path d="M8 16h3M8 12h6M8 8h9"
                          fill="none" stroke="currentColor" stroke-width="2"
                          stroke-linecap="round"/>
                </svg>`
        },
        {
            title: "Sort (fewest messages first)",
            sort: "M",
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M4 5v14M4 19h17"
                          fill="none" stroke="currentColor" stroke-width="2"
                          stroke-linecap="round"/>
                    <path d="M8 8h3M8 12h6M8 16h9"
                          fill="none" stroke="currentColor" stroke-width="2"
                          stroke-linecap="round"/>
                </svg>`
        },
        {
            title: "Sort (fewest messages / newest first)",
            sort: "M|D:D",
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M3 18h3M3 13h5M3 8h7"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"/>
                    <circle cx="15" cy="13" r="4"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.7"/>
                    <path d="M15 11v2l1.5 1"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"/>
                    <path d="M21 8v10M21 18l-2.5-2.5M21 18l2.5-2.5"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2.2"
                          stroke-linecap="round"
                          stroke-linejoin="round"/>
                </svg>`
        },
        {
            title: "Sort (fewest messages / oldest first)",
            sort: "M|D",
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M3 18h3M3 13h5M3 8h7"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"/>
                    <circle cx="15" cy="13" r="4"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.7"/>
                    <path d="M15 11v2l1.5 1"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"/>
                    <path d="M21 18V8M21 8l-2.5 2.5M21 8l2.5 2.5"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2.2"
                          stroke-linecap="round"
                          stroke-linejoin="round"/>
                </svg>`
        }
    ],
    styles: {
        page:
        `
            button[aria-label=previous-page],
            button[aria-label=next-page] {
                min-width: 2.25rem;
            }

            button[aria-label^=page-] {
                min-width: fit-content;
            }

            [data-testid='ExploreLorebookCTA'] {
                display: none !important;
            }

            .dark .__S-highlight {
                background-color: rgba(255, 255, 255, 0.15);
                border-color: rgba(255, 255, 0, 0.5) !important;
                border-width: 1px;
            }

            .dark .__S-highlight:hover {
                background-color: rgba(255, 255, 255, 0.2);
                border-color: rgba(255, 255, 0, 0.75) !important;
            }

            .light .__S-highlight {
                background-color: rgba(0, 0, 0, 0.15);
                border-color: rgba(255, 255, 0, 0.75) !important;
                border-width: 2px;
            }

            .light .__S-highlight:hover {
                background-color: rgba(0, 0, 0, 0.2);
                border-color: rgba(255, 255, 0, 1) !important;
            }

            .__S-error {
                border-color: red !important;
            }

            .__S-button:hover { filter: brightness(0.95); }

            .__S-button:active { filter: brightness(0.90); }

            .__S-button {
                border: 1px solid silver;
                border-radius: 0.25rem;
                cursor: pointer;
                height: 2em;
                margin: auto 0;
                padding: 0.25rem;
                transition: filter 0.1s;
                width: 2em;
            }

            .dark .__S-button {
                background-color: #333;
                color: white;
            }

            .light .__S-button {
                background-color: #ddd;
                color: black;
            }

            .__S-toolbar {
                align-items: center;
                display: flex;
                margin: 0 0.5rem;
                overflow-x: auto;
            }

            .__S-toolbar .__S-button {
                border-radius: 0;
                flex-shrink: 0;
                margin-left: -1px;
            }

            .__S-toolbar .__S-button:first-child {
                border-radius: 0.25rem 0 0 0.25rem;
                margin-left: 0;
            }

            .__S-toolbar .__S-button:last-child {
                border-radius: 0 0.25rem 0.25rem 0;
            }

            .__S-new-tab-button,
            .__S-read-later-button {
                height: 2rem;
                width: 2rem;
            }

            .__S-new-tab-button {
                top: 2.75rem;
            }

            .__S-read-later-button:not(.left-2) {
                left: 2.75rem;
            }

            .__S-more-button {
                left: 8.75rem;
            }

            .__S-dim-hits-button,
            .__S-more-button {
                top: 8.75rem;
            }

            .__S-bot-button svg,
            .__S-char-button svg,
            .__S-filter svg,
            .__S-options svg {
                display: block;
                height: 1rem;
                width: 1rem;
            }

            .__S-toolbar-button svg {
                display: block;
                height: 1.25rem;
                width: 1.25rem;
            }

            .__S-load-messages svg {
                transform: rotate(180deg);
            }

            .__S-read-later-current [class~="bg-black/[.47]"] {
                background-color: rgba(255, 255, 64, 0.5);
            }

            .__S-read-later-current svg {
                color: black;
                fill: yellow;
            }

            .grid > div {
                display: flex;
            }

            .grid > div.dim *:not(:has(>*), .absolute, svg, svg *) {
                transition: filter 0.5s, opacity 0.5s;
                filter: sepia(60%) blur(0px);
                opacity: 0.4;
            }

            .grid > div.dim:hover *:not(:has(>*), .absolute, svg, svg *) {
                filter: none;
                opacity: 1;
            }

            @media (max-width: 768px) {
                .grid > div.dim *:not(:has(>*), .absolute, svg, svg *) {
                    opacity: 0.75;
                }
            }

            .flex-shrink-0.py-0.w-full.__S-background .mb-lg.bg-transparent {
                opacity: 0.75;
            }
        `,
        toast: `
            .__S-toast {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translate(-50%, 10px);
                padding: 10px 16px;
                border-radius: 4px;
                font: 11pt sans-serif;
                color: #333;
                background: #ddd;
                z-index: 2147483647;
                opacity: 0;
                transition: opacity .5s, transform .5s;
                cursor: pointer;
            }

            .dark .__S-toast {
                background: #333;
                color: white;
            }

            .__S-toast.visible {
                opacity: 1;
                transform: translate(-50%, 0);
            }

            .__S-toast:not(.visible) {
                pointer-events: none;
            }
        `
    }
};
