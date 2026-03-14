(function(global) {
    'use strict';

    // --- DOM Elements ---
    const F = {
        name: () => document.getElementById('builder-name'),
        player: () => document.getElementById('builder-player'),
        class: () => document.getElementById('builder-class'),
        level: () => document.getElementById('builder-level'),
        race: () => document.getElementById('builder-race'),
        background: () => document.getElementById('builder-background'),
        alignment: () => document.getElementById('builder-alignment'),
        str: () => document.getElementById('builder-str'),
        dex: () => document.getElementById('builder-dex'),
        con: () => document.getElementById('builder-con'),
        int: () => document.getElementById('builder-int'),
        wis: () => document.getElementById('builder-wis'),
        cha: () => document.getElementById('builder-cha'),
        generateBtn: () => document.getElementById('generate-json'),
        downloadBtn: () => document.getElementById('download-json'),
        output: () => document.getElementById('json-output'),
    };

    let generatedJson = null;

    // --- Data Loading and UI Population ---

      /**
     * Fetches a list of items from the 5e API.
     * @param {string} endpoint - The API endpoint (e.g., 'races', 'classes').
     * @returns {Promise<Array<{name: string}>>}
     */
    async function fetchFromApi(endpoint) {
        try {
            const response = await fetch(`https://www.dnd5eapi.co/api/${endpoint}`);
            if (!response.ok) return [];
            const data = await response.json();
            return data.results || []; // The API returns { count, results: [...] }
        } catch (err) {
            console.warn(`Failed to fetch from D&D 5e API endpoint: ${endpoint}`, err);
            return [];
        }
    }

    /**
     * Merges local data with API data, removing duplicates.
     * @param {Promise<Array>} localPromise - Promise that resolves to local data array.
     * @param {Promise<Array>} apiPromise - Promise that resolves to API data array.
     * @returns {Promise<Array<{name: string}>>}
     */
    async function mergeDataSources(localPromise, apiPromise) {
        const [localData, apiData] = await Promise.all([localPromise, apiPromise]);
        
        const combined = new Map();

        // Local data gets priority
        for (const item of localData) {
            if (item.name) {
                combined.set(item.name.toLowerCase(), item);
            }
        }

        // Add API data only if not already present
        for (const item of apiData) {
            if (item.name && !combined.has(item.name.toLowerCase())) {
                combined.set(item.name.toLowerCase(), item);
            }
        }

        const sorted = Array.from(combined.values());
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        return sorted;
    }

    /**
     * Compares local data with API data and logs the missing ones.
     */
    async function logMissingData() {
        const localRacesPromise = global.loadRacesLocal ? global.loadRacesLocal() : Promise.resolve([]);
        const apiRacesPromise = fetchFromApi('races');
        const localBackgroundsPromise = global.loadBackgroundsLocal ? global.loadBackgroundsLocal() : Promise.resolve([]);
        const apiBackgroundsPromise = fetchFromApi('backgrounds');

        const [localRaces, apiRaces, localBackgrounds, apiBackgrounds] = await Promise.all([
            localRacesPromise, apiRacesPromise, localBackgroundsPromise, apiBackgroundsPromise
        ]);

        const messages = [];

        const localRaceNames = new Set(localRaces.map(item => item.name.toLowerCase()));
        const missingRaces = apiRaces.filter(item => item.name && !localRaceNames.has(item.name.toLowerCase()));
        if (missingRaces.length) {
            console.warn("The following races are available in the D&D 5e API but not in your local races.json:", missingRaces.map(r => r.name).join(', '));
            messages.push("Missing races found in API. See console for details.");
        }

        const localBackgroundNames = new Set(localBackgrounds.map(item => item.name.toLowerCase()));
        const missingBackgrounds = apiBackgrounds.filter(item => item.name && !localBackgroundNames.has(item.name.toLowerCase()));
        if (missingBackgrounds.length) {
            console.warn("The following backgrounds are available in the D&D 5e API but not in your local backgrounds.json:", missingBackgrounds.map(b => b.name).join(', '));
            messages.push("Missing backgrounds found in API. See console for details.");
        }

        if (messages.length) {
            F.output().textContent = messages.join('\n');
        } else {
            F.output().textContent = "Your local data for races and backgrounds is up to date with the SRD API.";
        }
    }



    async function populateDropdowns() {
          // We can reuse the loaders from storage.js for local data
        const localRacesPromise = global.loadRacesLocal ? global.loadRacesLocal() : Promise.resolve([]);
        const localClassesPromise = global.loadClassesLocal ? global.loadClassesLocal() : Promise.resolve([]);
        const localBackgroundsPromise = global.loadBackgroundsLocal ? global.loadBackgroundsLocal() : Promise.resolve([]);

        // Fetch from API as a fallback/supplement
        const apiRacesPromise = fetchFromApi('races');
        const apiClassesPromise = fetchFromApi('classes');
        const apiBackgroundsPromise = fetchFromApi('backgrounds');

        const [races, classes, backgrounds] = await Promise.all([
            mergeDataSources(localRacesPromise, apiRacesPromise),
            mergeDataSources(localClassesPromise, apiClassesPromise),
            mergeDataSources(localBackgroundsPromise, apiBackgroundsPromise),
        ]);

        const populate = (selectEl, data, placeholder) => {
            if (!selectEl) return;
            const options = data.map(item => `<option value="${item.name}">${item.name}</option>`).join('');
            selectEl.innerHTML = `<option value="">-- ${placeholder} --</option>${options}`;
        };

        populate(F.race(), races, 'Select a Race');
        populate(F.class(), classes, 'Select a Class');
        populate(F.background(), backgrounds, 'Select a Background');

        logMissingData();
    }

    // --- JSON Generation ---

    function generateCharacterObject() {
            const selectedClassName = F.class().value;

        const CLASS_DATA = {
            "Artificer": { saves: ["CON", "INT"], hit_die: 8 },
            "Barbarian": { saves: ["STR", "CON"], hit_die: 12 },
            "Bard":      { saves: ["DEX", "CHA"], hit_die: 8 },
            "Cleric":    { saves: ["WIS", "CHA"], hit_die: 8 },
            "Druid":     { saves: ["INT", "WIS"], hit_die: 8 },
            "Fighter":   { saves: ["STR", "CON"], hit_die: 10 },
            "Monk":      { saves: ["STR", "DEX"], hit_die: 8 },
            "Paladin":   { saves: ["WIS", "CHA"], hit_die: 10 },
            "Ranger":    { saves: ["STR", "DEX"], hit_die: 10 },
            "Rogue":     { saves: ["DEX", "INT"], hit_die: 8 },
            "Sorcerer":  { saves: ["CON", "CHA"], hit_die: 6 },
            "Warlock":   { saves: ["WIS", "CHA"], hit_die: 8 },
            "Wizard":    { saves: ["INT", "WIS"], hit_die: 6 },
        };
        const classData = CLASS_DATA[selectedClassName] || { saves: [], hit_die: 8 };

        const character = {
            name: F.name().value.trim(),
            player_name: F.player().value.trim(),
            class: selectedClassName,
            level: parseInt(F.level().value, 10) || 1,
            race: F.race().value,
            background: F.background().value,
            alignment: F.alignment().value.trim(),
            abilities: {
                STR: parseInt(F.str().value, 10) || 10,
                DEX: parseInt(F.dex().value, 10) || 10,
                CON: parseInt(F.con().value, 10) || 10,
                INT: parseInt(F.int().value, 10) || 10,
                WIS: parseInt(F.wis().value, 10) || 10,
                CHA: parseInt(F.cha().value, 10) || 10,
            },
            // --- Placeholders for more complex data ---
            // These would be filled by more advanced UI elements in the future
            proficiencies: {
                saves: classData.saves,
                skills: [], // e.g., ["Arcana", "History"]
                tools: [],
                armor: [],
                weapons: []
            },
            spells: [], // e.g., ["Fire Bolt", "Mage Armor"]
            equipment: {
                weapons: [],
                armor: [],
                gear: []
            },
            coins: { pp: 0, gp: 0, sp: 0, cp: 0 },
            hit_die: `d${classData.hit_die}`,
            // HP would be calculated based on class, level, and CON
            maxHP: 10, 
        };

        // A more accurate HP calculation
        const conMod = Math.floor((character.abilities.CON - 10) / 2);
        const avgHitDie = (classData.hit_die / 2) + 1;
        character.maxHP = classData.hit_die + conMod + ((character.level - 1) * (avgHitDie + conMod));
        character.currentHP = character.maxHP;

        return character;
    }

    function handleGenerate() {
        const charObject = generateCharacterObject();
        generatedJson = JSON.stringify(charObject, null, 2);
        F.output().textContent = generatedJson;
        F.downloadBtn().disabled = false;
    }

    function handleDownload() {
        if (!generatedJson) return;

        const charName = F.name().value.trim().toLowerCase().replace(/\s+/g, '-') || 'character';
        const fileName = `${charName}.json`;
        const blob = new Blob([generatedJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // --- Initialization ---

    function boot() {
        populateDropdowns().catch(err => {
            console.error("Failed to populate dropdowns:", err);
            F.output().textContent = "Error: Could not load data files (races.json, classes.json, etc.). Make sure they are in the /data/ directory.";
        });

        F.generateBtn().addEventListener('click', handleGenerate);
        F.downloadBtn().addEventListener('click', handleDownload);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

})(window);