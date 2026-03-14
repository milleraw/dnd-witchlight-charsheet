// assets/js/fey_generator.js

(function(global) {
    'use strict';

    /**
     * A helper function to pick a random element from an array.
     * @param {Array} arr The array to pick from.
     * @returns {*} A random element from the array.
     */
    function getRandom(arr) {
        if (!arr || arr.length === 0) {
            return null;
        }
        return arr[Math.floor(Math.random() * arr.length)];
    }

    /**
     * A helper function to pick a random element from a weighted array.
     * @param {Array<object>} weightedArray - Array of objects with a 'weight' property.
     * @returns {object} A random element from the array.
     */
    function getWeightedRandom(weightedArray) {
        if (!weightedArray || weightedArray.length === 0) return null;
        const totalWeight = weightedArray.reduce((sum, item) => sum + item.weight, 0);
        if (totalWeight <= 0) return getRandom(weightedArray); // Fallback for zero/negative weights

        let random = Math.random() * totalWeight;

        for (const item of weightedArray) {
            random -= item.weight;
            if (random <= 0) {
                return item;
            }
        }

        // Fallback for floating point inaccuracies
        return weightedArray[weightedArray.length - 1];
    }

    /**
     * Selects a thematically compatible offer based on a chosen want using a weighted system.
     * @param {object} want - The selected want object, with a `tags` array.
     * @param {Array} offers - The list of available offer objects.
     * @param {object} compatibility - The compatibility matrix with rules, hard_links, and avoid_links.
     * @returns {object} A compatible offer object.
     */
    function getCompatibleOffer(want, offers, compatibility) {
        if (!want || !offers || !compatibility || offers.length === 0) {
            return getRandom(offers); // Fallback to random if data is missing
        }

        const wantTags = new Set(want.tags || []);
        if (wantTags.size === 0) {
            return getRandom(offers); // Fallback if want has no tags
        }

        const scoredOffers = offers.map(offer => {
            let score = 1; // Base score for every offer
            const offerTags = new Set(offer.tags || []);

            // 1. Apply weighted rules from the compatibility matrix
            for (const rule of (compatibility.rules || [])) {
                const wantMatch = rule.want_tags.some(tag => wantTags.has(tag));
                const offerMatch = rule.offer_tags.some(tag => offerTags.has(tag));
                if (wantMatch && offerMatch) {
                    score += rule.weight;
                }
            }

            // 2. Apply high-priority hard links
            for (const rule of (compatibility.hard_links || [])) {
                const wantTextMatch = rule.want_text_contains && want.text.toLowerCase().includes(rule.want_text_contains.toLowerCase());
                const wantTagMatch = rule.want_tags_any && rule.want_tags_any.some(tag => wantTags.has(tag));
                const offerMatch = rule.offer_tags_any && rule.offer_tags_any.some(tag => offerTags.has(tag));
                if ((wantTextMatch || wantTagMatch) && offerMatch) {
                    score += rule.priority;
                }
            }

            // 3. Apply disqualifying avoid links
            for (const rule of (compatibility.avoid_links || [])) {
                const wantMatch = rule.want_tags_any && rule.want_tags_any.some(tag => wantTags.has(tag));
                const offerMatch = rule.offer_tags_any && rule.offer_tags_any.some(tag => offerTags.has(tag));
                if (wantMatch && offerMatch) {
                    score = 0; // Disqualify this pairing
                    break;
                }
            }

            return { offer, score: Math.max(0, score) }; // Ensure score isn't negative
        }).filter(item => item.score > 0);

        if (scoredOffers.length === 0) {
            return getRandom(offers); // Fallback if no compatible offers were found
        }

        // Perform weighted random selection
        const totalWeight = scoredOffers.reduce((sum, item) => sum + item.score, 0);
        let random = Math.random() * totalWeight;

        for (const item of scoredOffers) {
            random -= item.score;
            if (random <= 0) {
                return item.offer;
            }
        }

        // Fallback for floating point inaccuracies
        return scoredOffers[scoredOffers.length - 1].offer;
    }

    /**
     * Generates a description for a random Fey NPC.
     * @param {string} feyType - The type of fey to generate (e.g., 'pixie', 'satyr').
     * @param {string} powerLevel - The power level for wants/offers ('minor_fey', 'major_fey', 'archfey').
     * @param {object} data - An object containing all your loaded JSON data.
     * @param {string|null} rarity - The rarity category of the fey ('common', 'uncommon', etc.).
     * @returns {string} A formatted string describing the generated NPC.
     */
    async function generateFeyNpc(feyType, powerLevel, data, rarity = null, environmentString = '') {
        const { descriptions, names, pixieOutfits, wants, offers, compatibility, pranks, scenes, appearances } = data;

        let feyData, namePool, finalFeyType = feyType;

        // 1. Get description and name data, handling nested types
        if (feyType === 'eladrin') {
            const seasons = Object.keys(descriptions.eladrin);
            const season = getRandom(seasons);
            // Eladrin descriptions are just body types, no separate quirks in the JSON
            feyData = { body: descriptions.eladrin[season], quirk: [] };
            namePool = names.eladrin[season];
            finalFeyType = `${season} eladrin`;
        } else if (feyType === 'talking_animals') {
            const animals = Object.keys(descriptions.talking_animals);
            const animal = getRandom(animals);
            feyData = descriptions.talking_animals[animal];
            namePool = names.talking_animals[animal];
            finalFeyType = `talking ${animal}`;
        } else {
            feyData = descriptions[feyType];
            namePool = names[feyType];
        }

        if (!feyData) return `Could not find description for type: ${feyType}`;
        
        const body = getRandom(feyData.body);
        const quirk = getRandom(feyData.quirk) || "an unreadable expression"; // Fallback for types without quirks

        // 2. Get a name
        const name = getRandom(namePool);

        // 3. Get an outfit (if applicable)
        let outfitString = '';
        if (feyType === 'pixie' && pixieOutfits) {
            const top = getRandom(pixieOutfits.tops);
            const bottom = getRandom(pixieOutfits.bottoms);
            const shoes = getRandom(pixieOutfits.shoes);
            const hat = getRandom(pixieOutfits.hats);
            const accessory = getRandom(pixieOutfits.accessories);

            const descriptions = [];
            if (top) descriptions.push(top);
            if (bottom) descriptions.push(bottom);
            if (shoes) descriptions.push(shoes);
            if (hat) descriptions.push(hat);
            if (accessory) descriptions.push(accessory);

            if (descriptions.length > 0) {
                let outfitDesc = "";
                if (descriptions.length > 1) {
                    const lastPart = descriptions.pop();
                    outfitDesc = descriptions.join(', ') + `, and ${lastPart}`;
                } else {
                    outfitDesc = descriptions[0];
                }
                outfitString = `Their outfit is a collection of items: ${outfitDesc}.`;
            }
        }

        // Get additional appearance details and description for non-pixies
        let appearanceDetails = [];
        let feyTypeDescription = '';
        if (feyType !== 'pixie' && appearances && appearances[feyType]) {
            const appearanceData = appearances[feyType];
            if (appearanceData.description) {
                feyTypeDescription = appearanceData.description;
            }
            if (Array.isArray(appearanceData.appearances)) {
                const pool = [...appearanceData.appearances]; // Create a mutable copy
                if (pool.length > 0) {
                    // Pick first detail
                    let index = Math.floor(Math.random() * pool.length);
                    appearanceDetails.push(pool.splice(index, 1)[0]);
                    
                    // Pick second detail if available
                    if (pool.length > 0) {
                        index = Math.floor(Math.random() * pool.length);
                        appearanceDetails.push(pool.splice(index, 1)[0]);
                    }
                }
            }
        }

        // Get a scene to set the context
        let sceneString = '';

        if (scenes && scenes[feyType]) {
            const sceneData = getRandom(scenes[feyType]);
            if (sceneData) {
                let ruleText = '';
                const feyRules = {
                    hospitality: "The Rule of Hospitality is in effect. Be a gracious host or guest, as every offering has meaning.",
                    reciprocity: "The Rule of Reciprocity is in effect. Every gift, service, or insult must be repaid in kind.",
                    ownership: "The Rule of Ownership is in effect. Do not take what has been claimed, or touch without permission."
                };

                // Find the first applicable rule from the tags
                const ruleTag = (sceneData.tags || []).find(tag => feyRules[tag]);
                if (ruleTag) {
                    const ruleName = ruleTag.charAt(0).toUpperCase() + ruleTag.slice(1);
                    ruleText = `**${ruleName}:** ${feyRules[ruleTag]}`;
                }

                const sceneParts = [`**Scene:** ${sceneData.scene} *${sceneData.flavor}*`];
                if (ruleText) {
                    sceneParts.push(ruleText);
                }
                sceneString = sceneParts.join('\n\n');
            }
        }

        // 4. Get a want and a compatible offer
        const availableWants = wants[powerLevel] || [];
        const availableOffers = offers[powerLevel] || [];
        
        const want = getRandom(availableWants);
        const offer = getCompatibleOffer(want, availableOffers, compatibility);

        // 5. Add a prank for common fey
        let prankString = '';
        if (rarity === 'common' && pranks && Math.random() < 0.6) { // 60% chance
            let prankPool = [];
            if (powerLevel === 'minor_fey') {
                prankPool = pranks.minor || [];
            } else if (powerLevel === 'major_fey') {
                prankPool = [...(pranks.minor || []), ...(pranks.major || [])];
            } else { // archfey
                prankPool = [...(pranks.major || []), ...(pranks.cruel || [])];
            }
            
            const prank = getRandom(prankPool);
            if (prank && prank.text) {
                prankString = `**Prank:** ${prank.text}`;
            }
        }


        // 6. Assemble the final description
        const output = [];
        if (environmentString) {
            output.push(environmentString);
        }

        output.push(`You meet ${name}, a ${finalFeyType}.`);

        if (feyTypeDescription) {
            output.push(feyTypeDescription);
        }

        if (sceneString) {
            output.push(sceneString);
        }

        const appearanceBlock = [
            `**Appearance:** ${body}`,
            `**Quirk:** ${quirk}`
        ];
        if (outfitString) {
            appearanceBlock.push(outfitString);
        }
        if (appearanceDetails.length > 0) {
            appearanceDetails.forEach(detail => {
                appearanceBlock.push(`- ${detail}`);
            });
        }
        output.push(appearanceBlock.join('\n'));

        const interactionBlock = `They seem to want "${want?.text || 'something mysterious'}" and might offer you "${offer?.text || 'a strange gift'}" in return.`;
        output.push(interactionBlock);

        if (prankString) {
            output.push(prankString);
        }

        // Join all the separate, clean blocks with double newlines for proper spacing.
        return output.filter(Boolean).join('\n\n');
    }

    /**
     * Generates a completely random Fey NPC based on weighted probabilities.
     * @param {string} powerLevel - The power level for wants/offers ('minor_fey', 'major_fey', 'archfey').
     * @param {object} data - An object containing all your loaded JSON data.
     * @returns {string} A formatted string describing the generated NPC.
     */
    async function generateRandomFeyNpc(powerLevel, data) {
        const { environments, envNpcWeights } = data;

        // --- 1. Select Environment and generate its description ---
        let environmentString = '';
        let chosenEnvKey = 'woodland'; // Fallback
        let npcWeightTable = {};

        if (environments?.environments && envNpcWeights?.environments) {
            const environmentTypes = Object.keys(environments.environments).map(key => ({
                type: key,
                ...environments.environments[key]
            }));
            const chosenEnvData = getWeightedRandom(environmentTypes);

            if (chosenEnvData?.entries) {
                chosenEnvKey = chosenEnvData.type;
                npcWeightTable = envNpcWeights.environments[chosenEnvKey]?.npc_weights || {};

                const envData = getRandom(chosenEnvData.entries);
                if (envData) {
                    let ruleText = '';
                    const feyRules = {
                        hospitality: "The Rule of Hospitality is in effect. Be a gracious host or guest, as every offering has meaning.",
                        reciprocity: "The Rule of Reciprocity is in effect. Every gift, service, or insult must be repaid in kind.",
                        ownership: "The Rule of Ownership is in effect. Do not take what has been claimed, or touch without permission."
                    };
                    const ruleTag = (envData.tags || []).find(tag => feyRules[tag]);
                    if (ruleTag) {
                        const ruleName = ruleTag.charAt(0).toUpperCase() + ruleTag.slice(1);
                        ruleText = `**${ruleName}:** ${feyRules[ruleTag]}`;
                    }
                    const envParts = [`**Environment:** ${envData.scene} *${envData.flavor}*`];
                    if (ruleText) {
                        envParts.push(ruleText);
                    }
                    environmentString = envParts.join('\n\n');
                }
            }
        }

        // --- 2. Select Fey Type based on Environment ---
        let feyType;
        let rarity = 'common'; // Default

        // This data is used as a fallback for the 'other' category
        const feyTypesByCategory = {
            uncommon: [
                { type: 'korred', weight: 5 }, { type: 'redcap', weight: 5 },
                { type: 'faerie_dragon', weight: 5 }, { type: 'eladrin', weight: 5 }
            ],
            rare: [ { type: 'giant_talking_animal', weight: 2 } ],
            weird: [ { type: 'storybook_oddity', weight: 1 } ]
        };

        const weightedNpcList = Object.keys(npcWeightTable).map(key => ({ type: key, weight: npcWeightTable[key] }));
        const npcChoice = getWeightedRandom(weightedNpcList);
        feyType = npcChoice?.type;

        if (!feyType || feyType === 'other') {
            const otherFeyPool = [ ...feyTypesByCategory.uncommon, ...feyTypesByCategory.rare, ...feyTypesByCategory.weird ];
            const otherTypeChoice = getWeightedRandom(otherFeyPool);
            feyType = otherTypeChoice.type;

            if (feyTypesByCategory.uncommon.some(f => f.type === feyType)) rarity = 'uncommon';
            else if (feyTypesByCategory.rare.some(f => f.type === feyType)) rarity = 'rare';
            else rarity = 'weird';
        }

        // --- 3. Handle special cases and call main generator ---
        const storybookOddities = [ "You meet a stag with antlers hung with lanterns, its eyes holding ancient wisdom.", "A sly fox approaches, offering to answer any riddle you pose, but it asks for your shadow as payment.", "You find a porcelain doll, animated by a child's lost memory of a happy day. It wants to find its way home, but can't remember where that is.", "A scarecrow, leaning against a fence, straightens up and insists it was once a knight sworn to protect this land. It asks for your help in finding its lost sword.", "You encounter a fey-touched mortal, lost in the Feywild. It could be an elf bard composing a song of longing, or a gnome tinkerer trying to build a machine to get home." ];

        if (feyType === 'storybook_oddity') return getRandom(storybookOddities);

        if (feyType === 'giant_talking_animal') {
            const baseDesc = await generateFeyNpc('talking_animals', powerLevel, data, rarity, environmentString);
            return baseDesc.replace('a talking', 'a giant talking');
        }

        return await generateFeyNpc(feyType, powerLevel, data, rarity, environmentString);
    }

    // Expose the function to the global scope to be used in your HTML
    global.generateFeyNpc = generateFeyNpc;
    global.generateRandomFeyNpc = generateRandomFeyNpc;

})(window);