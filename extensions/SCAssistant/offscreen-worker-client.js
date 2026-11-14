export class OffscreenWorkerClient {
    #documentUrl;
    #portName;
    #port = null;
    #ready = null;
    #requests = new Map();
    #requestId = 0;

    constructor(documentUrl, portName = "__S_OFFSCREEN") {
        this.#documentUrl = documentUrl;
        this.#portName = portName;
    }

    async #ensureReady() {
        if (!this.#ready) {
            this.#ready = (async () => {
                const contexts = await chrome.runtime.getContexts({
                    contextTypes: ["OFFSCREEN_DOCUMENT"],
                    documentUrls: [
                        chrome.runtime.getURL(this.#documentUrl)
                    ]
                });

                if (!contexts.length) {
                    await chrome.offscreen.createDocument({
                        url: this.#documentUrl,
                        reasons: ["WORKERS"],
                        justification: "Run Dedicated Worker tasks"
                    });
                }
            })().catch(error => {
                this.#ready = null;
                throw error;
            });
        }

        await this.#ready;

        if (!this.#port) {
            this.#connect();
        }
    }

    #connect() {
        const port = chrome.runtime.connect({
            name: this.#portName
        });

        this.#port = port;

        port.onMessage.addListener(message => {
            const request = this.#requests.get(message.id);

            if (!request) {
                return;
            }

            this.#requests.delete(message.id);

            if (message.error) {
                request.reject(new Error(message.error));
            } else {
                request.resolve(message.result);
            }
        });

        port.onDisconnect.addListener(() => {
            if (this.#port === port) {
                this.#port = null;
            }

            for (const request of this.#requests.values()) {
                request.reject(
                    new Error("Offscreen connection lost")
                );
            }

            this.#requests.clear();
        });
    }

    async send(message) {
        await this.#ensureReady();

        const id = ++this.#requestId;

        return new Promise((resolve, reject) => {
            this.#requests.set(id, { resolve, reject });

            try {
                this.#port.postMessage({
                    ...message,
                    id
                });
            } catch (error) {
                this.#requests.delete(id);
                reject(error);
            }
        });
    }
}
