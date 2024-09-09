"use strict";

((w, t) => {
    const root = (() => {
        const ID = "gg-assignment-reader";

        let host = w.document.getElementById(ID);

        if (host) {
            host.parentElement.removeChild(host);
        }

        host = w.document.createElement("div");
        host.setAttribute("id", ID);
        w.document.body.appendChild(host);

        return host.attachShadow({
            mode: "closed"
        });
    })();

    const css = (parent => {
        const cssElement = w.document.createElement("style");

        cssElement.textContent = `
            * {
                background-color: transparent;
                color: black;
                box-sizing: border-box;
            }

            .backdrop {
                inset: 0;
                position: fixed;
                z-index: 99998;
            }

            .backdrop::before {
                content: "";
                position: absolute;
                width: 100%;
                height: 100%;
                -webkit-backdrop-filter: blur(2px);
                backdrop-filter: blur(2px);
                z-index: 99998;
            }

            .body {
                opacity: 0.9;
                z-index: 99999;
            }

            .loader {
                position: fixed;
                z-index: 100000;
            }

            .loader:not(.loading) {
                display: none;
            }

            .panel {
                inset: 0.5rem;
                align-items: center;
                background-color: whitesmoke;
                border: 1px solid silver;
                border-radius: 0.5rem;
                display: flex;
                flex-direction: column;
                gap: 2rem;
                justify-content: center;
                position: fixed;
            }

            .loader .panel {
                background-color: transparent;
                z-index: 100001;
            }

            .spinner {
                display: inline-block;
                width: 4rem;
                height: 4rem;
                border: 0.25em solid blue;
                border-right-color: transparent;
                border-radius: 50%;
                animation: spinner-loader .75s linear infinite;
            }

            @keyframes spinner-loader {
              to { transform: rotate(360deg); }
            }
        `;
        parent.appendChild(cssElement);
        return cssElement;
    })(root);

    const error = e => {
        w.alert(e.message || e);
    };

    const j = (parent => {
        const loaderContainer = w.document.createElement("div");

        loaderContainer.classList.add("loader");
        parent.appendChild(loaderContainer);

        const loaderBackdrop = w.document.createElement("div");

        loaderBackdrop.classList.add("backdrop");
        loaderContainer.appendChild(loaderBackdrop);

        const loaderPanel = w.document.createElement("div");

        loaderPanel.classList.add("panel");
        loaderContainer.appendChild(loaderPanel);

        const loaderImage = w.document.createElement("div");

        loaderImage.classList.add("spinner");
        loaderPanel.appendChild(loaderImage);

        const loaderMessage = w.document.createElement("div");

        loaderPanel.appendChild(loaderMessage);

        let count = 0;

        return (url, callback, message) => {
            (async () => {
                let json;

                loaderMessage.textContent = message;
                if (count++ === 0) {
                    loaderContainer.classList.add("loading");
                }
                try {
                    const response = await w.fetch(url);

                    json = await response.json();
                } catch (e) {
                    error(e);
                } finally {
                    if (--count === 0) {
                        loaderContainer.classList.remove("loading");
                    }
                    if (callback && json) {
                        /*w.setTimeout(() => */callback(json)/*, 5e1)*/;
                    }
                }
            })();
        };
    })(root);

    const cached = ((url, key, callback, message, transformer) => {
        key = "___" + key;

        const getItem = () => {
            try {
                return w.sessionStorage.getItem(key);
            } catch (e) {
                return w.document[key];
            }
        };

        const setItem = value => {
            try {
                w.sessionStorage.setItem(key, value);
            } catch (e) {
                w.document[key] = value;
            }
        };

        let value = getItem();

        if (value) {
            callback(JSON.parse(value));
        } else {
            j(url, data => {
                setItem(JSON.stringify(data = transformer ? transformer(data) : data));
                callback(data);
            }, message);
        }
    });

    const body = (parent => {
        const backdrop = w.document.createElement("div");

        backdrop.classList.add("backdrop");
        parent.appendChild(backdrop);

        const b = w.document.createElement("div");

        b.classList.add("body");
        b.classList.add("panel");
        parent.appendChild(b);
        return b;
    })(root);

    (parent => {
        const span = w.document.createElement("span");

        span.textContent = "Content";
        parent.appendChild(span);

        const createButton = options => {
            const button = w.document.createElement("button");

            button.textContent = options.text;
            button.addEventListener("click", options.callback);
            return button;
        };

        const createTestButton = options => {
            return createButton({
                ...options,
                callback: () => j(options.url, options.callback, options.message + "...")
            });
        };

        parent.appendChild(createTestButton({
            callback: units => w.alert(units.data.length + " units found"),
            message: "Loading units",
            text: "Units",
            url: "https://swgoh.gg/api/units"
        }));

        parent.appendChild(createTestButton({
            callback: data => {
                const operations = w.JSON.parse(data.contents);

                w.alert(operations.eventType + " loaded");
            },
            message: "Loading Operations",
            text: "Operations (via CORS proxy)",
            url: "https://api.allorigins.win/get?url=https://nadir320.github.io/swgoh/json/rote.json"
        }));

        const allyCode = w.document.createElement("input");

        allyCode.value = "552664879";
        parent.appendChild(allyCode);

        const fileSelector = w.document.createElement("input");

        fileSelector.setAttribute("type", "file");
        parent.appendChild(fileSelector);

        const corsBox = w.document.createElement("input");

        corsBox.setAttribute("type", "checkbox");
        corsBox.checked = true;

        const corsLabel = w.document.createElement("label");

        corsLabel.appendChild(corsBox);
        corsLabel.appendChild(w.document.createTextNode("Cross origin"));
        parent.appendChild(corsLabel);

        const showAssignments = data => {
            const {units, operations, guild, assignments} = data;

            w.alert([
				guild.name + " loaded (" + guild.members.length + " members)",
				units.length + " units loaded",
				operations.eventType + " operations loaded",
				assignments.platoonAssignments.length + " assignments loaded"
			].join("\n"));
        };

        parent.appendChild(createButton({
            callback: () => {
                if (fileSelector.files.length) {
                    const corsNeeded = corsBox.checked;

                    for (var file of fileSelector.files) {
                        const reader = new w.FileReader();

                        reader.onload = e => {
                            const assignments = w.JSON.parse(e.srcElement.result);

                            cached("https://swgoh.gg/api/player/" + allyCode.value, "player_" + allyCode.value, player => {
                                cached("https://swgoh.gg/api/guild-profile/" + player.guild_id, "guild_" + player.guild_id, guild => {
                                    cached("https://swgoh.gg/api/units", "units", units => {
                                        cached((corsNeeded ? "https://api.allorigins.win/get?url=" : "") +
                                           "https://nadir320.github.io/swgoh/json/rote.json", "operations", operations => {

                                            showAssignments({
                                                assignments,
                                                guild,
                                                operations,
                                                units,
                                            });
                                        }, "Loading operations...", corsNeeded ? a => w.JSON.parse(a.contents) : undefined);
                                    } , "Loading units...", a => a.data);
                                }, "Loading guild...", a => a.data);
                            }, "Loading player...", a => a.data);
                        };
                        reader.readAsText(file);
                        break;
                    }
                } else {
                    error("Select a file");
                }
            },
			text: "Show assignments"
        }));
    })(body);
})(window, this);
