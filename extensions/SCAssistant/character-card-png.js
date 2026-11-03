export class CharacterCardPNG {

    static async create(imageURL, characterObject) {
        const response = await fetch(imageURL);

        if (!response.ok) {
            throw new Error(
                `Unable to fetch image: HTTP ${response.status}`
            );
        }

        const blob = await response.blob();
        const bytes = new Uint8Array(
            await blob.arrayBuffer()
        );

        const format = this.#detectFormat(bytes);

        if (format === "png") {
            return this.#addCharacterMetadata(
                bytes,
                characterObject
            );
        }

        return this.#decodeToPNG(
            blob,
            characterObject
        );
    }

    static async makeStatic(imageURL, isAnimatedAsync) {
        const response = await fetch(imageURL);

        if (!response.ok) {
            throw new Error(
                `Unable to fetch image: HTTP ${response.status}`
            );
        }

        const blob = await response.blob();
        const bytes = new Uint8Array(
            await blob.arrayBuffer()
        );

        const format = this.#detectFormat(bytes);

        let isAnimated;

        if (isAnimatedAsync) {
            try {
                isAnimated = await isAnimatedAsync({
                    arrayBuffer: this.#bytesToBase64(new Uint8Array(await blob.arrayBuffer())),
                    type: blob.type
                });
            } catch {}
        }
        if (typeof isAnimated === "undefined") {
            isAnimated = await this.#isAnimated(blob);
        }

        if (isAnimated) {
            return this.#decodeToPNG(
                blob
            );
        }
        return imageURL;
    }

    // ---------------------------------------------------------
    // Format detection
    // ---------------------------------------------------------

    static #detectFormat(bytes) {

        // PNG
        if (
            bytes.length >= 8 &&
            bytes[0] === 0x89 &&
            bytes[1] === 0x50 &&
            bytes[2] === 0x4E &&
            bytes[3] === 0x47 &&
            bytes[4] === 0x0D &&
            bytes[5] === 0x0A &&
            bytes[6] === 0x1A &&
            bytes[7] === 0x0A
        ) {
            return "png";
        }

        // JPEG
        if (
            bytes.length >= 3 &&
            bytes[0] === 0xFF &&
            bytes[1] === 0xD8 &&
            bytes[2] === 0xFF
        ) {
            return "jpeg";
        }

        // GIF
        if (
            bytes.length >= 6 &&
            (
                this.#ascii(bytes, 0, 6) === "GIF87a" ||
                this.#ascii(bytes, 0, 6) === "GIF89a"
            )
        ) {
            return "gif";
        }

        // WebP
        if (
            bytes.length >= 12 &&
            this.#ascii(bytes, 0, 4) === "RIFF" &&
            this.#ascii(bytes, 8, 4) === "WEBP"
        ) {
            return "webp";
        }

        // BMP
        if (
            bytes.length >= 2 &&
            bytes[0] === 0x42 &&
            bytes[1] === 0x4D
        ) {
            return "bmp";
        }

        // TIFF
        if (
            bytes.length >= 4 &&
            (
                (
                    bytes[0] === 0x49 &&
                    bytes[1] === 0x49 &&
                    bytes[2] === 0x2A &&
                    bytes[3] === 0x00
                ) ||
                (
                    bytes[0] === 0x4D &&
                    bytes[1] === 0x4D &&
                    bytes[2] === 0x00 &&
                    bytes[3] === 0x2A
                )
            )
        ) {
            return "tiff";
        }

        return null;
    }


    // ---------------------------------------------------------
    // PNG metadata
    // ---------------------------------------------------------

    static #addCharacterMetadata(
        pngBytes,
        characterObject
    ) {
        const signature = new Uint8Array([
            0x89, 0x50, 0x4E, 0x47,
            0x0D, 0x0A, 0x1A, 0x0A
        ]);

        const json = JSON.stringify(characterObject);
        const jsonBytes = new TextEncoder().encode(json);
        const base64 = this.#bytesToBase64(jsonBytes);

        const keyword = new TextEncoder().encode("chara");
        const text = new TextEncoder().encode(base64);

        const data = new Uint8Array(
            keyword.length + 1 + text.length
        );

        data.set(keyword);
        data[keyword.length] = 0;
        data.set(text, keyword.length + 1);

        const newChunk = this.#createPNGChunk(
            "tEXt",
            data
        );

        const chunks = [];
        let offset = 8;

        while (offset + 12 <= pngBytes.length) {

            const view = new DataView(
                pngBytes.buffer,
                pngBytes.byteOffset + offset
            );

            const length = view.getUint32(0);

            if (offset + 12 + length > pngBytes.length) {
                throw new Error("Invalid PNG chunk structure.");
            }

            const type = this.#ascii(
                pngBytes,
                offset + 4,
                4
            );

            const totalLength = 12 + length;

            let isChara = false;

            if (type === "tEXt") {

                const keywordEnd = pngBytes.indexOf(
                    0,
                    offset + 8
                );

                if (
                    keywordEnd !== -1 &&
                    keywordEnd < offset + 8 + length
                ) {
                    const keyword = this.#ascii(
                        pngBytes,
                        offset + 8,
                        keywordEnd - offset - 8
                    );

                    isChara = keyword === "chara";
                }
            }

            if (!isChara) {
                chunks.push(
                    pngBytes.subarray(
                        offset,
                        offset + totalLength
                    )
                );
            }

            if (type === "IEND") {
                break;
            }

            offset += totalLength;
        }

        let size = 8 + newChunk.length;

        for (const chunk of chunks) {
            size += chunk.length;
        }

        const result = new Uint8Array(size);

        result.set(signature);
        offset = 8;

        for (const chunk of chunks) {

            const type = this.#ascii(chunk, 4, 4);

            if (type === "IEND") {
                result.set(newChunk, offset);
                offset += newChunk.length;
            }

            result.set(chunk, offset);
            offset += chunk.length;
        }

        return new Blob(
            [result],
            { type: "image/png" }
        );
    }


    // ---------------------------------------------------------
    // Decode non-PNG → PNG
    // ---------------------------------------------------------

    static async #decodeToPNG(
        imageBlob,
        characterObject
    ) {
        let bitmap;

        try {
            bitmap = await createImageBitmap(imageBlob);
        } catch (error) {
            throw new Error(
                `Unable to decode image: ${error.message}`
            );
        }

        try {
            if (!bitmap.width || !bitmap.height) {
                throw new Error(
                    "Decoded image has invalid dimensions."
                );
            }

            const canvas = new OffscreenCanvas(
                bitmap.width,
                bitmap.height
            );

            const context = canvas.getContext("2d", {
                alpha: true
            });

            if (!context) {
                throw new Error(
                    "Unable to create OffscreenCanvas."
                );
            }

            context.drawImage(bitmap, 0, 0);

            const pngBlob = await canvas.convertToBlob({
                type: "image/png"
            });

            if (characterObject) {
                const pngBytes = new Uint8Array(
                    await pngBlob.arrayBuffer()
                );
                return this.#addCharacterMetadata(
                    pngBytes,
                    characterObject
                );
            }

            return pngBlob;
        } finally {
            bitmap.close();
        }
    }


    // ---------------------------------------------------------
    // PNG chunk
    // ---------------------------------------------------------

    static #createPNGChunk(type, data) {
        const typeBytes =
            new TextEncoder().encode(type);

        const chunk = new Uint8Array(
            4 + 4 + data.length + 4
        );

        const view = new DataView(chunk.buffer);

        view.setUint32(0, data.length);

        chunk.set(typeBytes, 4);
        chunk.set(data, 8);

        const crcInput = new Uint8Array(
            typeBytes.length + data.length
        );

        crcInput.set(typeBytes);
        crcInput.set(data, typeBytes.length);

        view.setUint32(
            8 + data.length,
            this.#crc32(crcInput)
        );

        return chunk;
    }


    // ---------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------

    static #ascii(bytes, offset, length) {
        let result = "";

        for (let i = 0; i < length; i++) {
            result += String.fromCharCode(
                bytes[offset + i]
            );
        }

        return result;
    }


    static #bytesToBase64(bytes) {
        let binary = "";
        const chunkSize = 0x8000;

        for (
            let offset = 0;
            offset < bytes.length;
            offset += chunkSize
        ) {
            binary += String.fromCharCode(
                ...bytes.subarray(
                    offset,
                    offset + chunkSize
                )
            );
        }

        return btoa(binary);
    }


    static #crc32(bytes) {
        let crc = 0xFFFFFFFF;

        for (let i = 0; i < bytes.length; i++) {
            crc ^= bytes[i];

            for (let bit = 0; bit < 8; bit++) {
                crc =
                    (crc >>> 1) ^
                    (0xEDB88320 & -(crc & 1));
            }
        }

        return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    static async #isAnimated(blob) {
        const bytes = new Uint8Array(await blob.arrayBuffer());
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

        const is = (offset, text) => {
            for (let i = 0; i < text.length; i++) {
                if (bytes[offset + i] !== text.charCodeAt(i)) {
                    return false;
                }
            }
            return true;
        };

        const skipSubBlocks = offset => {
            while (offset < bytes.length) {
                const size = bytes[offset++];

                if (!size) {
                    return offset;
                }

                if (offset + size > bytes.length) {
                    return -1;
                }

                offset += size;
            }

            return -1;
        };

        // GIF87a / GIF89a
        if (is(0, "GIF87a") || is(0, "GIF89a")) {
            if (bytes.length < 13) {
                return false;
            }

            let offset = 13;
            let frames = 0;

            // Global Color Table
            const packed = bytes[10];

            if (packed & 0x80) {
                offset += 3 * (1 << ((packed & 7) + 1));
            }

            while (offset < bytes.length) {
                const marker = bytes[offset++];

                // Trailer
                if (marker === 0x3B) {
                    return false;
                }

                // Extension
                if (marker === 0x21) {
                    offset++; // Extension Label
                    offset = skipSubBlocks(offset);

                    if (offset < 0) {
                        return false;
                    }

                    continue;
                }

                // Image Descriptor
                if (marker === 0x2C) {
                    if (offset + 9 > bytes.length) {
                        return false;
                    }

                    const flags = bytes[offset + 8];
                    offset += 9;

                    // Local Color Table
                    if (flags & 0x80) {
                        offset += 3 * (1 << ((flags & 7) + 1));
                    }

                    if (offset >= bytes.length) {
                        return false;
                    }

                    offset++; // LZW Minimum Code Size

                    // Image Data
                    offset = skipSubBlocks(offset);

                    if (offset < 0) {
                        return false;
                    }

                    if (++frames > 1) {
                        return true;
                    }

                    continue;
                }

                // Invalid marker
                return false;
            }

            return false;
        }

        // WebP (RIFF)
        if (is(0, "RIFF") && is(8, "WEBP")) {
            if (bytes.length < 12) {
                return false;
            }

            const riffEnd = 8 + view.getUint32(4, true);

            if (riffEnd > bytes.length || riffEnd < 12) {
                return false;
            }

            let offset = 12;
            let frames = 0;

            while (offset + 8 <= riffEnd) {
                const size = view.getUint32(offset + 4, true);
                const payload = offset + 8;
                const next = payload + size + (size & 1);

                if (next > riffEnd) {
                    return false;
                }

                // Animation Frame
                if (is(offset, "ANMF")) {
                    if (size < 16) {
                        return false;
                    }

                    if (++frames > 1) {
                        return true;
                    }
                }

                offset = next;
            }
        }

        return false;
    }
}
