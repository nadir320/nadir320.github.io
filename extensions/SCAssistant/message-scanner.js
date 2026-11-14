"use strict";

(() => {
    class MessageScanner {
        static #STOP_WORDS = new Set([
            "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "at", "for", "with", "from", "as", "is", "was",
            "are", "were", "be", "been", "being", "it", "this", "that", "these", "those", "he", "she", "they", "them", "his",
            "her", "their", "you", "your", "i", "me", "my", "we", "our", "so", "very", "just", "still", "now", "then"
        ]);

        static isSimilarText(a, b) {
            const left = this.#clean(a).toLowerCase();
            const right = this.#clean(b).toLowerCase();
            if (!left || !right) return false;
            if (left === right) return true;
            if (left.length > 35 && right.length > 35 && (left.includes(right) || right.includes(left))) return true;

            const aTokens = this.#tokens(left);
            const bTokens = this.#tokens(right);
            if (!aTokens.size || !bTokens.size) return false;
            let common = 0;
            for (const token of aTokens) if (bTokens.has(token)) common++;
            const union = aTokens.size + bTokens.size - common;
            const jaccard = union ? common / union : 0;
            const smallerCoverage = common / Math.min(aTokens.size, bTokens.size);
            return jaccard >= 0.64 || (common >= 5 && smallerCoverage >= 0.78);
        }

        static scanMessages(messages, filter, minScore = 5) {
            const highlights = [];

            (messages || []).forEach(message => {
                const messageHighlights = [];

                for (const sentence of this.#splitSentences(message.content)) {
                    const score = this.#scoreSentence(sentence);

                    if (score >= minScore) {
                        if (!highlights.some(item => this.isSimilarText(item.text, sentence))) {
                            if (!messageHighlights.some(item => this.isSimilarText(item.text, sentence))) {
                                if (!(filter && filter.some(item => this.isSimilarText(item, sentence)))) {
                                    messageHighlights.push({
                                        text: sentence,
                                        category: this.#categoryFor(sentence),
                                        score,
                                        messageId: message.id,
                                        role: message.role
                                    });
                                }
                            }
                        }
                    }
                }
                highlights.push(...messageHighlights.reverse());
            });
            return highlights;
        }

        static #categoryFor(text) {
            const value = this.#clean(text).toLowerCase();

            const groups = [
                ["rule", /\b(rule|boundary|boundaries|must|mustn'?t|never|always has to|not optional|allowed|forbidden|permission|can'?t|cannot|shouldn'?t|safe word|safeword|calls? (?:him|her|them)|address(?:es)? as|don'?t call|do not call|won'?t use (?:that|the) term|stop using|doesn'?t enjoy being|does not enjoy being|being called)\b/i],
                ["need", /\b(trigger(?:s|ed)?|panic|freeze response|ground(?:ing|ed)?|needs? (?:space|quiet|predictability|control|routine)|sensitive to|overwhelm(?:ed|ing)?|noise[- ]cancel(?:ing|ling)|headphones?|unfamiliar places?|predictab(?:le|ility)|feels? (?:safe|unsafe|trapped)|discomfort|calms? (?:him|her|them)|comforted by)\b/i],
                ["identity", /\b(real name|identity|alias|called|name is|works? as|job|occupation|age|years old|from [a-z]|lives? (?:in|with)|roommate|yakuza boss|doctor|surgeon|mechanic|racer|programmer|developer)\b/i],
                ["ability", /\b(skilled|expert|experienced|trained|training|talent|ability|abilities|capable|proficient|elite[- ]level|professional|legendary status|mechanical experience|motorcycle control|riding skills?|coding abilities?|built an? (?:antivirus|program|system)|decompiles?|decrypts?|firearms?|shooting range|assemble and disassemble)\b/i],
                ["growth", /\b(became|becoming|changed|change of heart|learned to trust|trust (?:grew|deepened)|began to trust|no longer (?:fears?|hates?|distrusts?)|forgave|forgiven|reconciled|overcame|grew closer|grew apart|relationship (?:changed|evolved)|started opening up|began opening up|developed feelings)\b/i],
                ["npc", /\b(npc|side character|recurring character|met (?:a|the) (?:guard|merchant|captain|innkeeper|doctor|neighbor|neighbour)|introduced (?:him|her|them)self|joined (?:the|our) (?:party|group))\b/i],
                ["event", /\b(betrayal|betrayed|rescued|escaped|discovered|revelation|reunited|lost (?:his|her|their) life|battle ended|confession|confessed|was killed|died|wedding|married|mission completed)\b/i],
                ["relationship", /\b(friend|best friend|girlfriend|boyfriend|wife|husband|lover|partner|dating|married|sister|brother|mother|father|roommate|trusts?|distrusts?|loves?|hates?|dynamic|belongs? to|ownership|together|relationship|commitment|committed|grow old|long[- ]term|only person|first person|protect(?:s|ive)?|cherish)\b/i],
                ["preference", /\b(likes?|dislikes?|prefers?|favorite|favourite|enjoys?|doesn'?t like|does not like|hates?|would rather|choice|requested?|asks? for|chooses?|ordered?|food|drink|music|color|colour|exactly what (?:he|she|they|i) like|water bottle|breakfast|pancakes?|coffee|milk|spaghetti|fried eggs?)\b/i],
                ["history", /\b(for \d+ years?|\d+ years?|used to|previously|before they|before he|before she|in the past|grew up|since childhood|since (?:he|she|they|i) (?:was|were)|earliest memories|learned from|history|habit|routine|usually|normally|always|every (?:day|night|morning|week)|friend (?:died|was killed)|survived the crash)\b/i],
                ["knowledge", /\b(knows?|doesn'?t know|didn'?t know|told|secret|hid(?:den|e|ing)?|revealed?|learned?|realized?|aware|unaware|found out|remembers?|forgot|recognizes?|identified|memorized)\b/i],
                ["plans", /\b(promised?|agreed?|plan(?:ned|s)?|tomorrow|tonight|later|meet(?:ing)?|will|going to|supposed to|goal|intend(?:s|ed)?|next time|after this|first date|release plan|vow(?:s|ed)?|pledge(?:s|d)?)\b/i],
                ["location", /\b(at the|in the|inside|outside|staying|hotel|house|room|garage|forest|city|school|office|hospital|basement|apartment|dock|river|park|location|ramen shop|botanical gardens?)\b/i],
                ["state", /\b(injured?|hurt|wound(?:ed)?|broken|bleeding|tired|exhausted|angry|afraid|sick|pregnant|missing|dead|alive|unconscious|awake|sore|asleep|sleeping|relaxed|calm)\b/i],
                ["possession", /\b(has|have|holding|carrying|owns?|gave|took|stole|key|keycard|weapon|phone|ring|letter|item|wears?|keeps?|katana|gaming setup|motorcycle|bike)\b/i]
            ];

            for (const [category, re] of groups) if (re.test(value)) return category;
            return "other";
        }

        static #clean(value) {
            return String(value || "")
                .replace(/\u00a0/g, " ")
                .replace(/\u200b/g, "")
                .replace(/\s+/g, " ")
                .trim();
        }

        static #hasPersistentCue(value) {
            return /\b(became|forgave|reconciled|overcame|developed feelings|betrayed|confessed|died|reunited|prefers?|favorite|favourite|enjoys?|likes?|dislikes?|hates?|always|never|usually|normally|habit|routine|for \d+ years?|\d+ years?|since childhood|since (?:he|she|they|i) (?:was|were)|grew up|learned from|promised?|agreed?|committed|commitment|relationship|partner|married|dating|trusts?|secret|identity|skill|skilled|experienced|trained|trigger|boundary|doesn'?t enjoy|does not enjoy|needs? (?:space|quiet|predictability|control|routine)|safe|unsafe|protective|long[- ]term|grow old|first date)\b/i.test(value);
        }

        static #scoreSentence(text) {
            const value = this.#clean(text);
            if (value.length < 18 || value.length > 520) return 0;

            const category = this.#categoryFor(value);

            const base = {
                identity: 7,
                relationship: 7,
                growth: 7,
                npc: 6,
                event: 6,
                preference: 6,
                rule: 8,
                history: 7,
                knowledge: 6,
                plans: 6,
                ability: 7,
                need: 8,
                location: 3,
                state: 2,
                possession: 3,
                other: 0
            }[category] || 0;

            let score = base;

            const persistent = this.#hasPersistentCue(value);

            if (/\b(never|always|usually|normally|before|after|only|first|last|for \d+ years?|\d+ years?|since childhood)\b/i.test(value)) score += 2;
            if (/\b(prefers?|favorite|favourite|enjoys?|likes?|promised?|agreed?|trusts?|married|dating|partner|secret|identity|habit|routine|boundary|trigger|skilled|experienced)\b/i.test(value)) score += 2;
            if (/\b(don'?t call|do not call|won'?t use (?:that|the) term|stop immediately|stop using|thank you for correcting|doesn'?t enjoy being|does not enjoy being)\b/i.test(value)) score += 4;
            if (/\b[A-Z][a-z]{2,}(?:[-’'][A-Z]?[a-z]+)?\b/.test(value)) score += 1;
            if (/\b(is|was|has|had|knows|told|promised|agreed|needs|likes|prefers|loves|trusts|works|built|owns)\b/i.test(value)) score += 1;

            if (/\?$/.test(value)) score -= 2;
            if (/^(what|why|how|where|when|who)\b/i.test(value)) score -= 2;

            const transientPhysical = /\b(breath|eyes?|gaze|fingers?|hands?|body|hips?|thighs?|lips?|mouth|chest|heartbeat|shudder|trembl|whimper|moan|walks?|sits?|stands?|leans?|nods?|smiles?|grins?|swallows?|blush|pulse|kisses?|kissed|bites?|biting|grips?|gripping|wraps?|pressing|convuls|climax|arousal|scrub top|against (?:a|the) wall)\b/i.test(value);

            const sceneMoment = /\b(during (?:intimacy|their kiss|the moment)|in (?:a|this) moment|right now|at that moment|currently|shifts? her weight|pulling .* closer|leans? in|whispers?|winks?|sets? .* on .* plate)\b/i.test(value);

            if (transientPhysical && !persistent) score -= 5;
            if (sceneMoment && !persistent) score -= 3;

            const dynamicOnly = category === "relationship" && /\b(dominant|dominance|submissive|submission|surrender|claim(?:s|ed)?|possessive)\b/i.test(value);

            if (dynamicOnly && transientPhysical && !/\b(dynamic|relationship|prefers?|likes?|always|private|public|partner|commitment)\b/i.test(value)) score -= 4;

            if (category === "state" && !/\b(still|ongoing|chronic|remains?|currently has|missing|dead|alive)\b/i.test(value)) score -= 2;
            if (/\b(the room|the river|the leaves|sunlight|wind|atmosphere|clearing)\b/i.test(value) && category === "location") score -= 2;
            if (/\b(last one to|search party|light is going to be perfect|what's the plan)\b/i.test(value)) score -= 3;

            return Math.max(0, score);
        }

        static #splitSentences(text) {
            const normalized = String(text || "").replace(/\n+/g, " ");

            return normalized
                .split(/(?<=[.!?])\s+(?=[A-Z0-9*\[(])|\s*[;]\s*/g)
                .map(value => this.#clean(value.replace(/^\*+|\*+$/g, "")))
                .filter(Boolean);
        }

        static #tokens(text) {
            return new Set(this.#clean(text).toLowerCase()
                .replace(/[^a-z0-9'’-]+/g, " ")
                .split(/\s+/g)
                .map(token => token.replace(/^['’]+|['’]+$/g, ""))
                .filter(token => token.length > 2 && !this.#STOP_WORDS.has(token)));
        }
    }

    window.MessageScanner = MessageScanner;
})();
