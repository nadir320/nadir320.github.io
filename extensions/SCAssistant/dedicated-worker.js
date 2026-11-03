"use strict";

(() => {
    const serialize = obj => {
        if (obj === null || typeof obj !== "object") {
            return obj;
        }

        const result = {};

        for (const key of new Set([
            ...Object.keys(obj),
            ...Object.getOwnPropertyNames(
                Object.getPrototypeOf(obj)
            )
        ])) {
            if (key === "constructor") {
                continue;
            }

            try {
                const value = obj[key];

                if (typeof value !== "function") {
                    result[key] = serialize(value);
                }
            } catch {}
        }

        return result;
    };

    self.addEventListener("message", async event => {
        const message = event.data;

        try {
            let result;

            switch (message.type) {
                case "TRACKS": {
                    const binary = atob(message.blob.arrayBuffer);

                    const bytes = new Uint8Array(binary.length);

                    for (let i = 0; i < binary.length; i++) {
                        bytes[i] = binary.charCodeAt(i);
                    }

                    const decoder = new ImageDecoder({
                        data: bytes,
                        type: message.blob.type
                    });

                    try {
                        await decoder.tracks.ready;

                        const track = decoder.tracks.selectedTrack;

                        result = serialize(decoder.tracks);
                    } finally {
                        decoder.close();
                    }
                    break;
                }

                default:
                    throw new Error(`Unknown worker task: ${message.type}`);
            }

            self.postMessage({
                id: message.id,
                result
            });
        } catch (error) {
            self.postMessage({
                id: message.id,
                error: error.message
            });
        }
    });
})();