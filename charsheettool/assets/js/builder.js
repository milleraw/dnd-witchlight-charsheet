(function(global) {
    'use strict';

    // --- DOM Elements ---
    const F = {
        name: () => document.getElementById('builder-name'),
        player: () => document.getElementById('builder-player'),
        gender: () => document.getElementById('builder-gender'),
        class: () => document.getElementById('builder-class'),
        level: () => document.getElementById('builder-level'),
        subclassContainer: () => document.getElementById('subclass-container'),
        subclass: () => document.getElementById('builder-subclass'),
        race: () => document.getElementById('builder-race'),
        background: () => document.getElementById('builder-background'),
        backgroundChoicesContainer: () => document.getElementById('background-choices-container'),
        classChoicesContainer: () => document.getElementById('class-choices-container'),
        alignmentLCN: () => document.getElementById('builder-alignment-lcn'),
        alignmentGNE: () => document.getElementById('builder-alignment-gne'),
        deity: () => document.getElementById('builder-deity'),
        deityList: () => document.getElementById('builder-deity-list'),
        deitySuggestions: () => document.getElementById('deity-suggestions'),
        eyesHair: () => document.getElementById('builder-eyes-hair'),
        trait: () => document.getElementById('builder-trait'),
        ideal: () => document.getElementById('builder-ideal'),
        bond: () => document.getElementById('builder-bond'),
        flaw: () => document.getElementById('builder-flaw'),
        randomTraitBtn: () => document.getElementById('random-trait-btn'),
        randomIdealBtn: () => document.getElementById('random-ideal-btn'),
        randomBondBtn: () => document.getElementById('random-bond-btn'),
        randomFlawBtn: () => document.getElementById('random-flaw-btn'),
        str: () => document.getElementById('builder-str'),
        dex: () => document.getElementById('builder-dex'),
        con: () => document.getElementById('builder-con'),
        int: () => document.getElementById('builder-int'),
        wis: () => document.getElementById('builder-wis'),
        cha: () => document.getElementById('builder-cha'),
        ethnicityContainer: () => document.getElementById('ethnicity-container'),
        variantHumanContainer: () => document.getElementById('variant-human-container'),
        variantHumanEnable: () => document.getElementById('builder-variant-human-enable'),
        variantHumanFields: () => document.getElementById('variant-human-fields'),
        variantHumanAsi1: () => document.getElementById('builder-variant-human-asi-1'),
        variantHumanAsi2: () => document.getElementById('builder-variant-human-asi-2'),
        variantHumanSkill: () => document.getElementById('builder-variant-human-skill'),
        variantHumanFeat: () => document.getElementById('builder-variant-human-feat'),
        variantHumanFeatChoices: () => document.getElementById('variant-human-feat-choices'),
        variantHumanFeatSummary: () => document.getElementById('variant-human-feat-summary'),
        subraceContainer: () => document.getElementById('subrace-container'),
        subraceLabel: () => document.getElementById('builder-subrace-label'),
        subrace: () => document.getElementById('builder-subrace'),
        tieflingVariantsContainer: () => document.getElementById('tiefling-variants-container'),
        tieflingVariantsChoices: () => document.getElementById('tiefling-variants-choices'),
        infoSpeed: () => document.getElementById('info-speed'),
        infoSize: () => document.getElementById('info-size'),
        infoLanguages: () => document.getElementById('info-languages'),
        infoAge: () => document.getElementById('info-age'),
        infoMaxHP: () => document.getElementById('info-max-hp'),
        infoHitDie: () => document.getElementById('info-hit-die'),
        savingThrowsList: () => document.getElementById('saving-throws-list'),
        abilityChoiceCard: () => document.getElementById('ability-choice-card'),
        abilityChoicesContainer: () => document.getElementById('ability-choices-container'),
        knownLanguages: () => document.getElementById('known-languages'),
        grantedToolsContainer: () => document.getElementById('granted-tools-container'),
        cantripsContainer: () => document.getElementById('cantrips-container'),
        spellsContainer: () => document.getElementById('spells-container'),
        armorProfsContainer: () => document.getElementById('armor-profs-container'),
        weaponProfsContainer: () => document.getElementById('weapon-profs-container'),
        grantedEquipmentContainer: () => document.getElementById('granted-equipment-container'),
        equipmentChoicesContainer: () => document.getElementById('equipment-choices-container'),
        toolChoicesContainer: () => document.getElementById('tool-choices-container'),
        grantedSkillsContainer: () => document.getElementById('granted-skills-container'),
        skillChoicesContainer: () => document.getElementById('skill-choices-container'),
        languageChoicesContainer: () => document.getElementById('language-choices-container'),
        infoTraits: () => document.getElementById('racial-traits-list'),
        ethnicity: () => document.getElementById('builder-ethnicity'),
        randomNameBtn: () => document.getElementById('random-name-btn'),
        generateBtn: () => document.getElementById('generate-json'),
        downloadBtn: () => document.getElementById('download-json'),
        saveBtn: () => document.getElementById('save-json'),
        output: () => document.getElementById('json-output'),
    };

    let generatedJson = null;
    let _racesData = [];
    let _racesV1 = null;
    let _useRacesV1 = false;
    let _classesData = [];
    let _subclassesData = [];
    let _backgroundsData = [];
    let _backgroundsCanonicalData = [];
    let _backgroundsV1 = null;
    let _useBackgroundsV1 = false;
    let _namesData = [];
    let _allLanguagesData = [];
    let _featsData = [];
    let _allSpellsData = [];
    let _spellIndex = {};
    let _classSpellIndex = {};
    global._builder_debug = { getSpells: () => _allSpellsData }; // Expose for debugging
    let _allToolsData = [];
    let _allManeuversData = null;
    let _allMetamagicData = null;
    let _allInvocationsData = null;
    let _allMetamagicOptions = null;
    let _allInvocationOptions = null;
    let _allWeaponNames = null;
    let _deityData = [];
    let _legacyEquipmentItems = null;
    let _currentRacialBonuses = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };

    const CLASS_DATA = {
        "Artificer": { saves: ["CON", "INT"], hit_die: 8, subclass_level: 3 },
        "Barbarian": { saves: ["STR", "CON"], hit_die: 12, subclass_level: 3 },
        "Bard":      { saves: ["DEX", "CHA"], hit_die: 8, subclass_level: 3 },
        "Cleric":    { saves: ["WIS", "CHA"], hit_die: 8, subclass_level: 1 },
        "Druid":     { saves: ["INT", "WIS"], hit_die: 8, subclass_level: 2 },
        "Fighter":   { saves: ["STR", "CON"], hit_die: 10, subclass_level: 3 },
        "Monk":      { saves: ["STR", "DEX"], hit_die: 8, subclass_level: 3 },
        "Paladin":   { saves: ["WIS", "CHA"], hit_die: 10, subclass_level: 3 },
        "Ranger":    { saves: ["STR", "DEX"], hit_die: 10, subclass_level: 3 },
        "Rogue":     { saves: ["DEX", "INT"], hit_die: 8, subclass_level: 3 },
        "Sorcerer":  { saves: ["CON", "CHA"], hit_die: 6, subclass_level: 1 },
        "Warlock":   { saves: ["WIS", "CHA"], hit_die: 8, subclass_level: 1 },
        "Wizard":    { saves: ["INT", "WIS"], hit_die: 6, subclass_level: 2 },
    };

    const SUBCLASS_LABELS = {
        "Artificer": "Artificer Specialist",
        "Barbarian": "Primal Path",
        "Bard": "College",
        "Cleric": "Domain",
        "Druid": "Circle",
        "Fighter": "Martial Archetype",
        "Monk": "Way",
        "Paladin": "Oath",
        "Ranger": "Conclave",
        "Rogue": "Roguish Archetype",
        "Sorcerer": "Sorcerous Origin",
        "Warlock": "Patron",
        "Wizard": "School"
    };

    const DEFAULT_DEITY_CATALOG = [
        { name: 'Azuth', alignments: ['LN'], domains: ['Arcana', 'Knowledge'] },
        { name: 'Mystra', alignments: ['NG'], domains: ['Arcana', 'Knowledge'] },
        { name: 'Savras', alignments: ['LN'], domains: ['Arcana', 'Knowledge'] },
        { name: 'Kelemvor', alignments: ['LN'], domains: ['Death', 'Grave'] },
        { name: 'Myrkul', alignments: ['NE'], domains: ['Death'] },
        { name: 'Bhaal', alignments: ['NE'], domains: ['Death'] },
        { name: 'Moradin', alignments: ['LG'], domains: ['Forge', 'Knowledge'] },
        { name: 'Gond', alignments: ['N'], domains: ['Forge', 'Knowledge'] },
        { name: 'Dumathoin', alignments: ['N'], domains: ['Forge', 'Knowledge'] },
        { name: 'Jergal', alignments: ['LN'], domains: ['Grave', 'Knowledge'] },
        { name: 'Oghma', alignments: ['N'], domains: ['Knowledge'] },
        { name: 'Deneir', alignments: ['NG'], domains: ['Knowledge'] },
        { name: 'Lathander', alignments: ['NG'], domains: ['Life', 'Light'] },
        { name: 'Chauntea', alignments: ['NG'], domains: ['Life', 'Nature'] },
        { name: 'Ilmater', alignments: ['LG'], domains: ['Life', 'Peace'] },
        { name: 'Selune', alignments: ['CG'], domains: ['Light', 'Twilight'] },
        { name: 'Sune', alignments: ['CG'], domains: ['Light'] },
        { name: 'Silvanus', alignments: ['N'], domains: ['Nature'] },
        { name: 'Mielikki', alignments: ['NG'], domains: ['Nature', 'Life'] },
        { name: 'Tyr', alignments: ['LG'], domains: ['Order', 'War'] },
        { name: 'Torm', alignments: ['LG'], domains: ['Order', 'War'] },
        { name: 'Helm', alignments: ['LN'], domains: ['Order', 'Twilight'] },
        { name: 'Eldath', alignments: ['NG'], domains: ['Peace', 'Nature'] },
        { name: 'Lliira', alignments: ['CG'], domains: ['Peace'] },
        { name: 'Tempus', alignments: ['CN'], domains: ['War', 'Tempest'] },
        { name: 'The Red Knight', alignments: ['LN'], domains: ['War'] },
        { name: 'Talos', alignments: ['CE'], domains: ['Tempest'] },
        { name: 'Umberlee', alignments: ['CE'], domains: ['Tempest'] },
        { name: 'Mask', alignments: ['NE'], domains: ['Trickery'] },
        { name: 'Leira', alignments: ['CN'], domains: ['Trickery'] },
        { name: 'Tymora', alignments: ['CG'], domains: ['Trickery', 'Peace'] },
        { name: 'Shar', alignments: ['NE'], domains: ['Twilight', 'Trickery'] }
    ];

    function getSubclassLabel(className) {
        return SUBCLASS_LABELS[className] || 'Subclass';
    }

    function currentAlignmentCode() {
        const l = String(F.alignmentLCN()?.value || '').trim().toUpperCase();
        const g = String(F.alignmentGNE()?.value || '').trim().toUpperCase();
        const a = l.startsWith('L') ? 'L' : (l.startsWith('C') ? 'C' : 'N');
        const b = g.startsWith('G') ? 'G' : (g.startsWith('E') ? 'E' : 'N');
        return `${a}${b}`;
    }

    function normalizeAlignCode(code) {
        const s = String(code || '').trim().toUpperCase();
        if (s === 'N' || s === 'TN' || s === 'TRUE NEUTRAL') return 'NN';
        if (s.length === 2) return s;
        return 'NN';
    }

    function extractDomainFromSubclass(className, subclassName) {
        if (String(className || '').toLowerCase() !== 'cleric') return '';
        const raw = String(subclassName || '').trim();
        if (!raw) return '';
        return raw.replace(/\s*domain$/i, '').trim();
    }

    function scoreAlignmentMatch(playerCode, deityCode) {
        const p = normalizeAlignCode(playerCode);
        const d = normalizeAlignCode(deityCode);
        if (p === d) return 4;
        let score = 0;
        if (p[0] === d[0]) score += 1;
        if (p[1] === d[1]) score += 1;
        return score;
    }

    function hasMoralAlignmentConflict(playerCode, deityCode) {
        const p = normalizeAlignCode(playerCode);
        const d = normalizeAlignCode(deityCode);
        const playerMoral = p[1];
        const deityMoral = d[1];
        if (playerMoral === 'N' || deityMoral === 'N') return false;
        if (playerMoral === 'G' && deityMoral === 'E') return true;
        if (playerMoral === 'E' && deityMoral === 'G') return true;
        return false;
    }

    function rankDeities({ alignmentCode, domain }) {
        const source = Array.isArray(_deityData) && _deityData.length ? _deityData : DEFAULT_DEITY_CATALOG;
        const domainLower = String(domain || '').trim().toLowerCase();
        const ranked = source.map(d => {
            const domains = Array.isArray(d.domains) ? d.domains : [];
            const domainMatch = domainLower && domains.some(x => String(x).toLowerCase() === domainLower);
            const alignments = Array.isArray(d.alignments) && d.alignments.length ? d.alignments : ['N'];
            const alignScore = Math.max(...alignments.map(a => scoreAlignmentMatch(alignmentCode, a)));
            const score = (domainMatch ? 6 : 0) + alignScore;
            return { ...d, score, domainMatch };
        });
        const filteredByDomain = domainLower ? ranked.filter(d => d.domainMatch) : ranked;
        const filtered = filteredByDomain.filter(d => {
            const alignments = Array.isArray(d.alignments) && d.alignments.length ? d.alignments : ['N'];
            // Keep deity only if at least one listed alignment is not morally opposed.
            return alignments.some(a => !hasMoralAlignmentConflict(alignmentCode, a));
        });
        return filtered
            .sort((a, b) => (b.score - a.score) || String(a.name).localeCompare(String(b.name)));
    }

    function updateDeitySuggestions() {
        const input = F.deity?.();
        const list = F.deityList?.();
        const wrap = F.deitySuggestions?.();
        if (!input || !list || !wrap) return;

        const className = F.class?.()?.value || '';
        const subclassName = F.subclass?.()?.value || '';
        const alignmentCode = currentAlignmentCode();
        const domain = extractDomainFromSubclass(className, subclassName);
        const ranked = rankDeities({ alignmentCode, domain });

        list.innerHTML = ranked.map(d => `<option value="${d.name}"></option>`).join('');
        const top = ranked.filter(d => d.score > 0).slice(0, 8);
        wrap.innerHTML = '';
        if (!top.length) return;
        top.forEach(d => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'deity-suggestion-btn';
            btn.textContent = d.name;
            const domains = (d.domains || []).join(', ') || 'Any';
            const aligns = (d.alignments || []).join(', ') || 'Any';
            const symbol = String(d.symbol || '').trim();
            btn.title = `Domains: ${domains} | Alignments: ${aligns}${symbol ? ` | Symbol: ${symbol}` : ''}`;
            btn.addEventListener('click', () => {
                input.value = d.name;
                input.dispatchEvent(new Event('change', { bubbles: true }));
            });
            wrap.appendChild(btn);
        });
    }

    const ICONIC_SPELL_NAMES = {
        "Hideous Laughter": "Tasha's Hideous Laughter",
        "Floating Disk": "Tenser's Floating Disk",
        "Arcane Hand": "Bigby's Hand",
        "Faithful Hound": "Mordenkainen's Faithful Hound",
        "Secret Chest": "Leomund's Secret Chest",
        "Tiny Hut": "Leomund's Tiny Hut",
        "Private Sanctum": "Mordenkainen's Private Sanctum",
        "Acid Arrow": "Melf's Acid Arrow",
        "Minute Meteors": "Melf's Minute Meteors",
        "Resilient Sphere": "Otiluke's Resilient Sphere",
    };

    const SKILL_LIST = [
        "Athletics", "Acrobatics", "Sleight of Hand", "Stealth",
        "Arcana", "History", "Investigation", "Nature", "Religion",
        "Animal Handling", "Insight", "Medicine", "Perception", "Survival",
        "Deception", "Intimidation", "Performance", "Persuasion"
    ];
    const DRAGONBORN_ANCESTRIES = [
        { key: 'black', label: 'Black' },
        { key: 'blue', label: 'Blue' },
        { key: 'brass', label: 'Brass' },
        { key: 'bronze', label: 'Bronze' },
        { key: 'copper', label: 'Copper' },
        { key: 'gold', label: 'Gold' },
        { key: 'green', label: 'Green' },
        { key: 'red', label: 'Red' },
        { key: 'silver', label: 'Silver' },
        { key: 'white', label: 'White' }
    ];
    const DEFAULT_TOOL_OPTIONS = [
        "Alchemist's Supplies",
        "Brewer's Supplies",
        "Calligrapher's Supplies",
        "Carpenter's Tools",
        "Cartographer's Tools",
        "Cobbler's Tools",
        "Cook's Utensils",
        "Glassblower's Tools",
        "Jeweler's Tools",
        "Leatherworker's Tools",
        "Mason's Tools",
        "Painter's Supplies",
        "Potter's Tools",
        "Smith's Tools",
        "Tinker's Tools",
        "Weaver's Tools",
        "Woodcarver's Tools",
        "Disguise Kit",
        "Forgery Kit",
        "Herbalism Kit",
        "Navigator's Tools",
        "Poisoner's Kit",
        "Thieves' Tools"
    ];
    const DEFAULT_CLASS_TOOL_GRANTS = {
        artificer: ["Thieves' tools", "Tinker's tools"]
    };
    const DEFAULT_CLASS_TOOL_CHOICES = {
        artificer: {
            choose: 1,
            from: [
                "Alchemist's supplies",
                "Brewer's supplies",
                "Calligrapher's supplies",
                "Carpenter's tools",
                "Cartographer's tools",
                "Cobbler's tools",
                "Cook's utensils",
                "Glassblower's tools",
                "Jeweler's tools",
                "Leatherworker's tools",
                "Mason's tools",
                "Painter's supplies",
                "Potter's tools",
                "Smith's tools",
                "Tinker's tools",
                "Weaver's tools",
                "Woodcarver's tools"
            ]
        }
    };
    const DRAGONBORN_ANCESTRY_DATA = {
        black:  { damageType: 'acid',      save: 'DEX', area: '5 by 30 ft. line' },
        blue:   { damageType: 'lightning', save: 'DEX', area: '5 by 30 ft. line' },
        brass:  { damageType: 'fire',      save: 'DEX', area: '5 by 30 ft. line' },
        bronze: { damageType: 'lightning', save: 'DEX', area: '5 by 30 ft. line' },
        copper: { damageType: 'acid',      save: 'DEX', area: '5 by 30 ft. line' },
        gold:   { damageType: 'fire',      save: 'DEX', area: '15 ft. cone' },
        green:  { damageType: 'poison',    save: 'CON', area: '15 ft. cone' },
        red:    { damageType: 'fire',      save: 'DEX', area: '15 ft. cone' },
        silver: { damageType: 'cold',      save: 'CON', area: '15 ft. cone' },
        white:  { damageType: 'cold',      save: 'CON', area: '15 ft. cone' }
    };
    function titleCase(value) {
        const s = String(value || '').trim();
        return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
    }
    function applyDragonbornAncestryDetails(character, ancestryKey) {
        if (!character || String(character.race || '') !== 'Dragonborn') return;
        const key = String(ancestryKey || '').toLowerCase();
        const data = DRAGONBORN_ANCESTRY_DATA[key];
        if (!data) return;

        const resistanceType = titleCase(data.damageType);
        const ancestryLabel = titleCase(key);

        character.draconic_ancestry = key;
        character.race_detail = {
            ...(character.race_detail || {}),
            ancestry: key,
            breath_weapon: {
                damage_type: data.damageType,
                save: data.save,
                area: data.area
            },
            damage_resistance: data.damageType
        };
        character.resistances = Array.from(new Set([...(Array.isArray(character.resistances) ? character.resistances : []), resistanceType]));

        if (!Array.isArray(character.traits)) character.traits = [];
        const traits = character.traits;
        const ancTrait = traits.find(t => String(t?.id || '').toLowerCase() === 'trait:dragonborn:draconic-ancestry')
            || traits.find(t => String(t?.name || '').toLowerCase() === 'draconic ancestry');
        if (ancTrait && typeof ancTrait === 'object') {
            ancTrait.desc = `You have draconic ancestry (${ancestryLabel}). Your breath weapon and damage resistance are determined by this dragon type.`;
        }
        const resTrait = traits.find(t => String(t?.id || '').toLowerCase() === 'trait:dragonborn:damage-resistance')
            || traits.find(t => String(t?.name || '').toLowerCase() === 'damage resistance');
        if (resTrait && typeof resTrait === 'object') {
            resTrait.desc = `You have resistance to ${data.damageType} damage (${ancestryLabel} ancestry).`;
            resTrait.effects = [{ resistances: [resistanceType] }];
        }
    }
    const FAERUN_HUMAN_ETHNICITIES = [
        'Calishite',
        'Chondathan',
        'Damaran',
        'Illuskan',
        'Mulan',
        'Rashemi',
        'Shou',
        'Turami'
    ];
    const FAERUN_HUMAN_NAME_POOLS = {
        Calishite: {
            male: ['Aseir', 'Bardeid', 'Haseid', 'Khemed', 'Mehmen', 'Sudeiman', 'Zasheir'],
            female: ['Atala', 'Ceidil', 'Hama', 'Jasmal', 'Meilil', 'Seipora', 'Yasheira', 'Zasheida'],
            surnames: ['Basha', 'Dumein', 'Jassan', 'Khalid', 'Mostana', 'Pashar', 'Rein']
        },
        Chondathan: {
            male: ['Darvin', 'Dorn', 'Evendur', 'Gorstag', 'Grim', 'Helm', 'Malark', 'Morn', 'Randal', 'Stedd'],
            female: ['Arveene', 'Esvele', 'Jhessail', 'Kerri', 'Lureene', 'Miri', 'Rowan', 'Shandri', 'Tessele'],
            surnames: ['Amblecrown', 'Buckman', 'Dundragon', 'Evenwood', 'Greycastle', 'Tallstag']
        },
        Damaran: {
            male: ['Bor', 'Fodel', 'Glar', 'Grigor', 'Igan', 'Ivor', 'Kosef', 'Mival', 'Orel', 'Pavel', 'Sergor'],
            female: ['Alethra', 'Kara', 'Katernin', 'Mara', 'Natali', 'Olma', 'Tana', 'Zora'],
            surnames: ['Bersk', 'Chernin', 'Dotsk', 'Kulenov', 'Marsk', 'Nemetsk', 'Shemov', 'Starag']
        },
        Illuskan: {
            male: ['Ander', 'Blath', 'Bran', 'Frath', 'Geth', 'Lander', 'Luth', 'Malcer', 'Stor', 'Taman', 'Urth'],
            female: ['Amafrey', 'Betha', 'Cefrey', 'Kethra', 'Mara', 'Olga', 'Silifrey', 'Westra'],
            surnames: ['Brightwood', 'Helder', 'Hornraven', 'Lackman', 'Stormwind', 'Windriver']
        },
        Mulan: {
            male: ['Aoth', 'Bareris', 'Ehput-Ki', 'Kethoth', 'Mumed', 'Ramas', 'So-Kehur', 'Thazar-De', 'Urhur'],
            female: ['Arizima', 'Chathi', 'Nephis', 'Nulara', 'Murithi', 'Sefris', 'Thola', 'Umara', 'Zolis'],
            surnames: ['Ankhalab', 'Anskuld', 'Fezim', 'Hahpet', 'Nathandem', 'Sepret', 'Uuthrakt']
        },
        Rashemi: {
            male: ['Borivik', 'Faurgar', 'Jandar', 'Kanithar', 'Madislak', 'Ralmevik', 'Shaumar', 'Vladsalak'],
            female: ['Yevareva', 'Hulmarra', 'Immith', 'Imzel', 'Navarra', 'Shevarra', 'Tammith', 'Yuldra'],
            surnames: ['Chergoba', 'Dyernina', 'Iltazyara', 'Murnyethara', 'Stayonoga', 'Ulmokina']
        },
        Shou: {
            male: ['An', 'Chen', 'Chi', 'Fai', 'Jiang', 'Jun', 'Lian', 'Long', 'Meng', 'On', 'Shan', 'Shui', 'Wen'],
            female: ['Bai', 'Chao', 'Jia', 'Lei', 'Mei', 'Qiao', 'Shui', 'Tai'],
            surnames: ['Chien', 'Huang', 'Kao', 'Kung', 'Lao', 'Ling', 'Mei', 'Pin', 'Shin', 'Sum', 'Tan', 'Wan']
        },
        Turami: {
            male: ['Anton', 'Diero', 'Marcon', 'Pieron', 'Rimardo', 'Romero', 'Salazar', 'Umbero'],
            female: ['Balama', 'Dona', 'Faiella', 'Jalana', 'Luisa', 'Marta', 'Quara', 'Selise', 'Vonda'],
            surnames: ['Agosto', 'Astorio', 'Calabra', 'Donine', 'Falone', 'Marivaldi', 'Pisacar', 'Ramondo']
        }
    };

    function getSpellDisplayName(srdName) {
        return ICONIC_SPELL_NAMES[srdName] || srdName;
    }

    function isVariantHumanEnabled() {
        return F.race().value === 'Human' && !!F.variantHumanEnable()?.checked;
    }

    function getVariantHumanSelection() {
        const featName = String(F.variantHumanFeat()?.value || '').trim();
        const featDef = _featsData.find(f => String(f?.name || '') === featName) || null;
        return {
            enabled: isVariantHumanEnabled(),
            asi1: String(F.variantHumanAsi1()?.value || '').trim().toUpperCase(),
            asi2: String(F.variantHumanAsi2()?.value || '').trim().toUpperCase(),
            skill: String(F.variantHumanSkill()?.value || '').trim(),
            featName,
            featId: String(featDef?.id || '').trim(),
            featDesc: String(featDef?.desc || '').trim(),
            featDef
        };
    }

    function readVariantHumanFeatChoices() {
        const selections = {};
        const wrap = F.variantHumanFeatChoices?.();
        if (!wrap) return selections;
        wrap.querySelectorAll('.variant-human-feat-choice').forEach(block => {
            const choiceId = String(block.dataset.choiceId || '').trim();
            if (!choiceId) return;
            const values = [];
            block.querySelectorAll('select[data-choice-id]').forEach(sel => {
                if (sel.value) values.push(sel.value);
            });
            block.querySelectorAll('input[data-choice-id]').forEach(input => {
                const value = String(input.value || '').trim();
                if (value) values.push(value);
            });
            selections[choiceId] = values;
        });
        return selections;
    }

    function getSpellLevel(spell) {
        return Number(spell?.level ?? spell?.level_int ?? -1);
    }

    function getSpellSchool(spell) {
        const school = spell?.school;
        if (typeof school === 'string') return school.toLowerCase();
        if (school && typeof school === 'object') {
            return String(school.index || school.name || school.key || '').toLowerCase();
        }
        return '';
    }

    function asUniqueSorted(values) {
        return Array.from(new Set((values || []).filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b)));
    }

    function parseLevelFromNotes(notesText) {
        const raw = String(notesText || '');
        const m = raw.match(/(\d+)(?:st|nd|rd|th)-level/i);
        const n = Number(m?.[1] || NaN);
        return Number.isFinite(n) ? n : null;
    }

    async function loadBuilderManeuverNames() {
        if (Array.isArray(_allManeuversData)) return _allManeuversData.slice();
        try {
            const res = await fetch('data/maneuvers.json');
            const json = res.ok ? await res.json() : [];
            _allManeuversData = asUniqueSorted((Array.isArray(json) ? json : []).map(m => String(m?.name || '').trim()));
        } catch (err) {
            _allManeuversData = [];
        }
        return _allManeuversData.slice();
    }

    async function loadBuilderInvocationNames() {
        if (Array.isArray(_allInvocationsData)) return _allInvocationsData.slice();
        try {
            const res = await fetch('data/eldritch_invocations.json');
            const json = res.ok ? await res.json() : [];
            _allInvocationsData = asUniqueSorted((Array.isArray(json) ? json : []).map(i => String(i?.name || '').trim()));
        } catch (err) {
            _allInvocationsData = [];
        }
        return _allInvocationsData.slice();
    }

    async function loadBuilderMetamagicNames() {
        if (Array.isArray(_allMetamagicData)) return _allMetamagicData.slice();
        try {
            const res = await fetch('data/metamagic.json');
            const json = res.ok ? await res.json() : [];
            _allMetamagicData = asUniqueSorted((Array.isArray(json) ? json : []).map(i => String(i?.name || '').trim()));
        } catch (err) {
            _allMetamagicData = [];
        }
        return _allMetamagicData.slice();
    }

    async function loadBuilderInvocationOptions() {
        if (Array.isArray(_allInvocationOptions)) return _allInvocationOptions.map(x => ({ ...x }));
        try {
            const res = await fetch('data/eldritch_invocations.json');
            const json = res.ok ? await res.json() : [];
            _allInvocationOptions = (Array.isArray(json) ? json : [])
                .map(item => {
                    const name = String(item?.name || '').trim();
                    if (!name) return null;
                    const prereq = Array.isArray(item?.prerequisites) && item.prerequisites.length
                        ? `Prerequisites: ${item.prerequisites.join(', ')}.`
                        : '';
                    const body = String(item?.desc || '').trim();
                    const desc = [prereq, body].filter(Boolean).join(' ');
                    return { value: name, label: name, desc };
                })
                .filter(Boolean)
                .sort((a, b) => a.label.localeCompare(b.label));
        } catch (err) {
            _allInvocationOptions = [];
        }
        return _allInvocationOptions.map(x => ({ ...x }));
    }

    async function loadBuilderMetamagicOptions() {
        if (Array.isArray(_allMetamagicOptions)) return _allMetamagicOptions.map(x => ({ ...x }));
        try {
            const res = await fetch('data/metamagic.json');
            const json = res.ok ? await res.json() : [];
            _allMetamagicOptions = (Array.isArray(json) ? json : [])
                .map(item => {
                    const name = String(item?.name || '').trim();
                    if (!name) return null;
                    const desc = String(item?.desc || item?.description || '').trim();
                    return { value: name, label: name, desc };
                })
                .filter(Boolean)
                .sort((a, b) => a.label.localeCompare(b.label));
        } catch (err) {
            _allMetamagicOptions = [];
        }
        return _allMetamagicOptions.map(x => ({ ...x }));
    }

    async function loadBuilderWeaponNames() {
        if (Array.isArray(_allWeaponNames)) return _allWeaponNames.slice();
        try {
            const res = await fetch('data/equipment.v2.json');
            const json = res.ok ? await res.json() : [];
            _allWeaponNames = asUniqueSorted((Array.isArray(json) ? json : [])
                .filter(item => String(item?.equip_slot || '').toLowerCase() === 'weapon')
                .map(item => String(item?.name || '').trim()));
        } catch (err) {
            _allWeaponNames = [];
        }
        return _allWeaponNames.slice();
    }

    function getCurrentSkillListForFeatChoice(selectionsMap, choice) {
        const skills = new Set();
        document.querySelectorAll('.skill-choice-select').forEach(sel => { if (sel.value) skills.add(sel.value); });
        (F.grantedSkillsContainer()?.textContent || '')
            .split(':')
            .slice(1)
            .join(':')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
            .forEach(s => skills.add(s));
        const variantHumanSkill = String(F.variantHumanSkill()?.value || '').trim();
        if (variantHumanSkill) skills.add(variantHumanSkill);
        if (choice?.selector?.include_pending_grants) {
            Object.values(selectionsMap || {}).forEach(values => {
                (values || []).forEach(v => {
                    if (SKILL_LIST.includes(v)) skills.add(v);
                });
            });
        }
        return asUniqueSorted(Array.from(skills));
    }

    async function resolveVariantHumanFeatChoiceOptions(choice, selectionsMap) {
        const selector = choice?.selector || {};
        if (selector.type === 'from_list') {
            return asUniqueSorted(selector.options || []);
        }
        if (selector.type === 'skill_any') {
            return SKILL_LIST.slice();
        }
        if (selector.type === 'skill_proficient') {
            return getCurrentSkillListForFeatChoice(selectionsMap, choice);
        }
        if (selector.type === 'spell_from_class_list') {
            const className = String(selector.class || (selectionsMap?.[selector.class_from_choice] || [])[0] || '').trim();
            if (!className) return [];
            return asUniqueSorted((_allSpellsData || [])
                .filter(s => getSpellLevel(s) === Number(selector.level ?? 0))
                .filter(s => Array.isArray(s.classes) && s.classes.some(c => String(c).toLowerCase() === className.toLowerCase()))
                .map(s => String(s.name || '').trim()));
        }
        if (selector.type === 'from_index') {
            if (selector.index === 'spells') {
                const where = selector.where || {};
                const allowedSchools = Array.isArray(where.school_in) ? where.school_in.map(s => String(s).toLowerCase()) : [];
                return asUniqueSorted((_allSpellsData || [])
                    .filter(s => where.level == null || getSpellLevel(s) === Number(where.level))
                    .filter(s => !allowedSchools.length || allowedSchools.includes(getSpellSchool(s)))
                    .map(s => String(s.name || '').trim()));
            }
            if (selector.index === 'skills') return SKILL_LIST.slice();
            if (selector.index === 'languages') return asUniqueSorted(_allLanguagesData.map(l => String(l?.name || '').trim()));
            if (selector.index === 'tools') return asUniqueSorted(_allToolsData);
            if (selector.index === 'weapons') return loadBuilderWeaponNames();
            if (selector.index === 'skills_and_tools') return asUniqueSorted(SKILL_LIST.concat(_allToolsData));
            if (selector.index === 'maneuvers') return loadBuilderManeuverNames();
            if (selector.index === 'eldritch_invocations') return loadBuilderInvocationNames();
        }
        return [];
    }

    function buildVariantHumanFeatChoiceBlock(choice, state) {
        const block = document.createElement('div');
        block.className = 'variant-human-feat-choice form-group';
        block.dataset.choiceId = choice.id || '';
        const label = document.createElement('label');
        label.textContent = choice.prompt || 'Feat choice';
        block.appendChild(label);
        const count = Number(choice.count || choice.choose || 1) || 1;
        const options = Array.isArray(state?.options) ? state.options : [];
        if (options.length) {
            for (let i = 0; i < count; i++) {
                const select = document.createElement('select');
                select.dataset.choiceId = choice.id || '';
                select.innerHTML = ['<option value="">-- Select --</option>']
                    .concat(options.map(option => `<option value="${option}">${option}</option>`))
                    .join('');
                if (state?.values?.[i]) select.value = state.values[i];
                block.appendChild(select);
            }
        } else {
            for (let i = 0; i < count; i++) {
                const input = document.createElement('input');
                input.type = 'text';
                input.dataset.choiceId = choice.id || '';
                input.className = 'choice-custom-input';
                if (state?.values?.[i]) input.value = state.values[i];
                block.appendChild(input);
            }
        }
        return block;
    }

    function renderVariantHumanFeatSummary(featDef, featSelections) {
        const summaryEl = F.variantHumanFeatSummary?.();
        if (!summaryEl) return;
        if (!featDef || !Array.isArray(featDef.effects) || !featDef.effects.length) {
            summaryEl.textContent = '';
            return;
        }

        const abilityParts = [];
        const spellSet = new Set();
        const skillSet = new Set();
        const toolSet = new Set();
        const saveSet = new Set();
        const actionSet = new Set();

        featDef.effects.forEach(effect => {
            if (!effect?.type) return;
            if (effect.type === 'ability_score_bonus') {
                const ability = String(effect.ability || (effect.ability_from_choice ? (featSelections?.[effect.ability_from_choice] || [])[0] : '')).trim().toUpperCase();
                const amount = Number(effect.amount || 0);
                if (ability && amount) abilityParts.push(`+${amount} ${ability}`);
                return;
            }
            if (effect.type === 'spell_grant') {
                const spells = []
                    .concat(effect.spells || [])
                    .concat((effect.spells_from_choice && featSelections?.[effect.spells_from_choice]) || [])
                    .map(name => String(name || '').trim())
                    .filter(Boolean);
                spells.forEach(name => spellSet.add(getSpellDisplayName(name)));
                return;
            }
            if (effect.type === 'skill_proficiency') {
                []
                    .concat(effect.skills || [])
                    .concat((effect.skills_from_choice && featSelections?.[effect.skills_from_choice]) || [])
                    .forEach(skill => { if (skill) skillSet.add(String(skill)); });
                return;
            }
            if (effect.type === 'tool_proficiency') {
                []
                    .concat(effect.tools || [])
                    .concat((effect.tools_from_choice && featSelections?.[effect.tools_from_choice]) || [])
                    .forEach(tool => { if (tool) toolSet.add(String(tool)); });
                return;
            }
            if (effect.type === 'skill_or_tool_proficiency') {
                []
                    .concat(effect.items || [])
                    .concat((effect.items_from_choice && featSelections?.[effect.items_from_choice]) || [])
                    .forEach(item => {
                        if (!item) return;
                        if (SKILL_LIST.includes(item)) skillSet.add(String(item));
                        else toolSet.add(String(item));
                    });
                return;
            }
            if (effect.type === 'saving_throw_proficiency') {
                []
                    .concat(effect.saves || [])
                    .concat((effect.saves_from_choice && featSelections?.[effect.saves_from_choice]) || [])
                    .concat((effect.ability_from_choice && featSelections?.[effect.ability_from_choice]) || [])
                    .forEach(save => {
                        const normalized = String(save || '').trim().slice(0, 3).toUpperCase();
                        if (normalized) saveSet.add(normalized);
                    });
                return;
            }
            if (effect.type === 'action_grant') {
                const actions = Array.isArray(effect.actions) ? effect.actions : (effect.action ? [effect.action] : []);
                actions.forEach(action => {
                    const name = String(action?.name || '').trim();
                    if (name) actionSet.add(name);
                });
            }
        });

        const parts = [];
        if (abilityParts.length) parts.push(`ASI ${abilityParts.join(', ')}`);
        if (spellSet.size) parts.push(`Spells: ${Array.from(spellSet).join(', ')}`);
        if (skillSet.size) parts.push(`Skills: ${Array.from(skillSet).join(', ')}`);
        if (toolSet.size) parts.push(`Tools: ${Array.from(toolSet).join(', ')}`);
        if (saveSet.size) parts.push(`Saves: ${Array.from(saveSet).join(', ')}`);
        if (actionSet.size) parts.push(`Actions: ${Array.from(actionSet).join(', ')}`);

        if (!parts.length) {
            const desc = String(featDef.desc || '').trim();
            summaryEl.textContent = desc ? `Feat grants: ${desc.split('\n')[0]}` : '';
            return;
        }
        summaryEl.textContent = `Feat grants: ${parts.join(' | ')}`;
    }

    async function renderVariantHumanFeatChoices() {
        const wrap = F.variantHumanFeatChoices?.();
        const summaryEl = F.variantHumanFeatSummary?.();
        if (!wrap) return;
        const variantHuman = getVariantHumanSelection();
        if (!variantHuman.enabled || !variantHuman.featDef) {
            wrap.innerHTML = '';
            if (summaryEl) summaryEl.textContent = '';
            return;
        }
        const featChoices = Array.isArray(variantHuman.featDef.choices) ? variantHuman.featDef.choices : [];
        const currentSelections = readVariantHumanFeatChoices();
        wrap.innerHTML = '';
        if (!featChoices.length) {
            renderVariantHumanFeatSummary(variantHuman.featDef, currentSelections);
            return;
        }
        for (const choice of featChoices) {
            const options = await resolveVariantHumanFeatChoiceOptions(choice, currentSelections);
            const block = buildVariantHumanFeatChoiceBlock(choice, {
                options,
                values: currentSelections[choice.id] || []
            });
            wrap.appendChild(block);
        }
        wrap.querySelectorAll('select[data-choice-id]').forEach(select => {
            select.addEventListener('change', () => { renderVariantHumanFeatChoices(); });
        });
        wrap.querySelectorAll('input[data-choice-id]').forEach(input => {
            input.addEventListener('input', () => { renderVariantHumanFeatChoices(); });
        });
        renderVariantHumanFeatSummary(variantHuman.featDef, readVariantHumanFeatChoices());
    }

    function addUniqueCaseInsensitive(list, value) {
        const nextValue = String(value || '').trim();
        if (!nextValue) return;
        if (!Array.isArray(list)) return;
        if (list.some(entry => String(entry || '').toLowerCase() === nextValue.toLowerCase())) return;
        list.push(nextValue);
    }

    function resolveCastingAbility(effect, featSelections) {
        const direct = String(effect?.casting_ability || '').trim().toUpperCase();
        if (direct) return direct;
        if (effect?.casting_ability_from_choice) {
            const picked = String((featSelections?.[effect.casting_ability_from_choice] || [])[0] || '').trim().toUpperCase();
            if (picked) return picked;
        }
        const map = effect?.casting_ability_map && typeof effect.casting_ability_map === 'object'
            ? effect.casting_ability_map
            : null;
        const classChoiceId = String(effect?.casting_ability_class_from_choice || '').trim();
        if (map && classChoiceId) {
            const pickedClass = String((featSelections?.[classChoiceId] || [])[0] || '').trim();
            if (pickedClass) {
                const mapKey = Object.keys(map).find(k => String(k || '').toLowerCase() === pickedClass.toLowerCase());
                const mapped = String(mapKey ? map[mapKey] : '').trim().toUpperCase();
                if (mapped) return mapped;
            }
        }
        return '';
    }

    function applyFeatEffectsToCharacter(character, featDef, featSelections) {
        if (!character || !featDef || !Array.isArray(featDef.effects)) return;
        const featName = String(featDef.name || 'Feat').trim();
        const featId = String(featDef.id || '').trim();
        character.choices = character.choices || {};
        for (const effect of featDef.effects) {
            if (!effect || !effect.type) continue;
            if (effect.type === 'ability_score_bonus') {
                const ability = String(effect.ability || (effect.ability_from_choice ? (featSelections?.[effect.ability_from_choice] || [])[0] : '')).trim().toUpperCase();
                if (!ability) continue;
                const amount = Number(effect.amount || 0);
                const max = Number(effect.max || 20) || 20;
                const currentValue = Number(character.abilities?.[ability]) || 0;
                character.abilities[ability] = Math.min(currentValue + amount, max);
            } else if (effect.type === 'spell_grant') {
                if (!Array.isArray(character.spells)) character.spells = [];
                if (!character.spellSources || typeof character.spellSources !== 'object') character.spellSources = {};
                if (!character.spellCastingAbilityOverrides || typeof character.spellCastingAbilityOverrides !== 'object') character.spellCastingAbilityOverrides = {};
                const spells = []
                    .concat(effect.spells || [])
                    .concat((effect.spells_from_choice && featSelections?.[effect.spells_from_choice]) || [])
                    .map(spell => String(spell || '').trim())
                    .filter(Boolean);
                const castingAbility = resolveCastingAbility(effect, featSelections);
                spells.forEach(spell => {
                    addUniqueCaseInsensitive(character.spells, spell);
                    const sourceKey = Object.keys(character.spellSources).find(key => key.toLowerCase() === spell.toLowerCase()) || spell;
                    character.spellSources[sourceKey] = featName;
                    if (castingAbility) {
                        const abilityKey = Object.keys(character.spellCastingAbilityOverrides).find(key => key.toLowerCase() === spell.toLowerCase()) || spell;
                        character.spellCastingAbilityOverrides[abilityKey] = castingAbility;
                    }
                });
                if (!Array.isArray(character.choices.featSpellGrants)) character.choices.featSpellGrants = [];
                character.choices.featSpellGrants.push({
                    featId,
                    featName,
                    spells,
                    castingAbility: effect.casting_ability || null,
                    castingAbilityFromChoice: effect.casting_ability_from_choice || null,
                    castingAbilityMap: effect.casting_ability_map || null,
                    castingAbilityClassFromChoice: effect.casting_ability_class_from_choice || null
                });
            } else if (effect.type === 'tool_proficiency') {
                character.proficiencies = { ...(character.proficiencies || {}) };
                const tools = new Set(character.proficiencies.tools || []);
                const list = []
                    .concat(effect.tools || [])
                    .concat((effect.tools_from_choice && featSelections?.[effect.tools_from_choice]) || []);
                list.forEach(tool => { if (tool) tools.add(tool); });
                character.proficiencies.tools = [...tools];
            } else if (effect.type === 'weapon_proficiency') {
                character.proficiencies = { ...(character.proficiencies || {}) };
                const weapons = new Set(character.proficiencies.weapons || []);
                const list = []
                    .concat(effect.weapons || [])
                    .concat((effect.weapons_from_choice && featSelections?.[effect.weapons_from_choice]) || []);
                list.forEach(weapon => { if (weapon) weapons.add(weapon); });
                character.proficiencies.weapons = [...weapons];
            } else if (effect.type === 'armor_proficiency') {
                character.proficiencies = { ...(character.proficiencies || {}) };
                const armor = new Set(character.proficiencies.armor || []);
                const list = []
                    .concat(effect.armor || [])
                    .concat((effect.armor_from_choice && featSelections?.[effect.armor_from_choice]) || []);
                list.forEach(piece => { if (piece) armor.add(piece); });
                character.proficiencies.armor = [...armor];
            } else if (effect.type === 'skill_or_tool_proficiency' || effect.type === 'skill_proficiency') {
                const list = effect.type === 'skill_or_tool_proficiency'
                    ? []
                        .concat(effect.items || [])
                        .concat((effect.items_from_choice && featSelections?.[effect.items_from_choice]) || [])
                    : []
                        .concat(effect.skills || [])
                        .concat((effect.skills_from_choice && featSelections?.[effect.skills_from_choice]) || []);
                const skills = new Set(character.skill_proficiencies?.skills || []);
                const tools = new Set(character.proficiencies?.tools || []);
                list.forEach(item => {
                    if (!item) return;
                    if (SKILL_LIST.includes(item)) skills.add(item);
                    else if (effect.type === 'skill_or_tool_proficiency') tools.add(item);
                });
                character.skill_proficiencies.skills = [...skills];
                character.proficiencies.tools = [...tools];
            } else if (effect.type === 'language_grant') {
                if (!Array.isArray(character.languages)) character.languages = [];
                const list = []
                    .concat(effect.languages || [])
                    .concat((effect.languages_from_choice && featSelections?.[effect.languages_from_choice]) || []);
                list.forEach(language => addUniqueCaseInsensitive(character.languages, language));
            } else if (effect.type === 'saving_throw_proficiency') {
                const saves = new Set([
                    ...(Array.isArray(character.skill_proficiencies?.['saving throws']) ? character.skill_proficiencies['saving throws'] : [])
                ].map(v => String(v || '').trim().slice(0, 3).toUpperCase()).filter(Boolean));
                const list = []
                    .concat(effect.saves || [])
                    .concat((effect.saves_from_choice && featSelections?.[effect.saves_from_choice]) || [])
                    .concat((effect.ability_from_choice && featSelections?.[effect.ability_from_choice]) || []);
                list.forEach(save => {
                    const normalized = String(save || '').trim().slice(0, 3).toUpperCase();
                    if (normalized) saves.add(normalized);
                });
                character.skill_proficiencies['saving throws'] = [...saves];
            } else if (effect.type === 'resource_grant') {
                if (!Array.isArray(character.resources)) character.resources = [];
                const resolved = { ...effect, source: featId || 'feat' };
                if (Array.isArray(effect.consumes)) {
                    const consumes = [];
                    for (const entry of effect.consumes) {
                        if (!entry) continue;
                        if (entry.spell_from_choice) {
                            const picks = featSelections?.[entry.spell_from_choice] || [];
                            picks.forEach(spellName => {
                                if (!spellName) return;
                                const next = { ...entry, spell: spellName };
                                delete next.spell_from_choice;
                                consumes.push(next);
                            });
                        } else {
                            consumes.push({ ...entry });
                        }
                    }
                    resolved.consumes = consumes;
                }
                character.resources.push(resolved);
            } else if (effect.type === 'action_grant') {
                if (!Array.isArray(character.actions)) character.actions = [];
                const existing = new Set(character.actions.map(a => `${String(a?.name || '').toLowerCase()}::${String(a?.type || '').toLowerCase()}`));
                const addAction = (action) => {
                    if (!action?.name) return;
                    const key = `${String(action.name || '').toLowerCase()}::${String(action.type || '').toLowerCase()}`;
                    if (existing.has(key)) return;
                    existing.add(key);
                    character.actions.push({ ...action, source: featId || 'feat' });
                };
                if (Array.isArray(effect.actions)) effect.actions.forEach(addAction);
                else if (effect.action) addAction(effect.action);
            } else if (effect.type === 'expertise') {
                const list = []
                    .concat(effect.skills || [])
                    .concat((effect.skills_from_choice && featSelections?.[effect.skills_from_choice]) || []);
                if (!character.skills || typeof character.skills !== 'object') character.skills = {};
                const profSkills = new Set(character.skill_proficiencies?.skills || []);
                list.forEach(skill => {
                    if (!skill) return;
                    character.skills[skill] = 'expertise';
                    profSkills.add(skill);
                });
                character.skill_proficiencies.skills = [...profSkills];
            } else if (effect.type === 'initiative_bonus') {
                const amount = Number(effect.amount || 0);
                if (amount) {
                    character.initiative_bonus = (Number(character.initiative_bonus) || 0) + amount;
                    character.bonusInitiative = (Number(character.bonusInitiative) || 0) + amount;
                }
            } else if (effect.type === 'speed_bonus') {
                const amount = Number(effect.amount || 0);
                if (amount) character.speedBonus = (Number(character.speedBonus) || 0) + amount;
            } else if (effect.type === 'passive_rule') {
                if (!Array.isArray(character.passiveRules)) character.passiveRules = [];
                character.passiveRules.push({ ...effect, source: featId || '' });
            } else if (effect.type === 'save_dc_formula') {
                if (!Array.isArray(character.saveDcRules)) character.saveDcRules = [];
                const resolved = { ...effect, source: featId || '' };
                if (!resolved.ability && effect.ability_from_choice) {
                    const picked = String((featSelections?.[effect.ability_from_choice] || [])[0] || '').trim().toUpperCase();
                    if (picked) resolved.ability = picked;
                }
                character.saveDcRules.push(resolved);
            } else if (effect.type === 'damage_resistance_ignore' || effect.type === 'damage_die_floor') {
                if (!Array.isArray(character.damageRules)) character.damageRules = [];
                const resolved = { ...effect, source: featId || '' };
                if (effect.damage_type_from_choice) {
                    const picked = (featSelections?.[effect.damage_type_from_choice] || [])[0];
                    if (picked) resolved.damage_type = String(picked).trim().toLowerCase();
                }
                character.damageRules.push(resolved);
            } else if (effect.type === 'replacement_rule') {
                if (!Array.isArray(character.replacementRules)) character.replacementRules = [];
                character.replacementRules.push({ ...effect, source: featId || '' });
            } else if (effect.type === 'maneuver_grant') {
                if (!Array.isArray(character.maneuvers)) character.maneuvers = [];
                const list = []
                    .concat(effect.maneuvers || [])
                    .concat((effect.maneuvers_from_choice && featSelections?.[effect.maneuvers_from_choice]) || []);
                list.forEach(maneuver => addUniqueCaseInsensitive(character.maneuvers, maneuver));
            } else if (effect.type === 'eldritch_invocation_grant') {
                if (!Array.isArray(character.invocations)) character.invocations = [];
                const list = []
                    .concat(effect.invocations || [])
                    .concat((effect.invocations_from_choice && featSelections?.[effect.invocations_from_choice]) || []);
                list.forEach(invocation => addUniqueCaseInsensitive(character.invocations, invocation));
            } else if (effect.type === 'hp_max_bonus') {
                const amount = Number(effect.amount || 0);
                if (!amount) continue;
                const perLevel = !!effect.per_level;
                const appliesImmediately = !!effect.applies_immediately;
                const delta = perLevel
                    ? (appliesImmediately ? amount * (Number(character.level) || 0) : amount)
                    : amount;
                character.maxHP = (Number(character.maxHP) || 0) + delta;
                character.currentHP = (Number(character.currentHP) || 0) + delta;
            }
        }
    }

    // --- Data Loading and UI Population ---

    async function fetchFromApi(endpoint) {
        
        try {
            const response = await fetch(`https://www.dnd5eapi.co/api/${endpoint}`);
            if (!response.ok) return [];
            const data = await response.json();
            return data.results || [];
        } catch (err) {
            console.warn(`Failed to fetch from API for endpoint: ${endpoint}`, err);
            return [];
        }
    }

    async function mergeDataSources(localPromise, apiPromise) {
        const [localData, apiData] = await Promise.all([localPromise, apiPromise]);
        const combined = new Map();
        const apiMap = new Map((apiData || []).map(item => [item.name.toLowerCase(), item]));

        for (const item of localData) {
            if (item.name) {
                const key = item.name.toLowerCase();
                const apiItem = apiMap.get(key);
                const mergedItem = { ...(apiItem || {}), ...item };
                combined.set(key, mergedItem);
            }
        }

        for (const item of apiData) {
            if (item.name && !combined.has(item.name.toLowerCase())) {
                combined.set(item.name.toLowerCase(), item);
            }
        }

        const sorted = Array.from(combined.values());
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        return sorted;
    }

    async function logMissingData() {
        // This function can be expanded later if needed.
    }

    async function loadNameData() {
        try {
            const response = await fetch('assets/NPC Generator - Names Master.csv');
            if (!response.ok) throw new Error('Could not fetch name data.');
            const text = await response.text();
            
            const lines = text.trim().split('\n');
            const header = lines[0].split(',').map(h => h.trim());
            _namesData = lines.slice(1).map(line => {
                const values = line.split(',');
                const rowObject = {};
                header.forEach((h, i) => { rowObject[h] = (values[i] || '').trim(); });
                return rowObject;
            });
        } catch (err) {
            console.error("Failed to load name data:", err);
        }
    }

    function parseCsvLine(line) {
        const out = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    cur += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
                continue;
            }
            if (ch === ',' && !inQuotes) {
                out.push(cur.trim());
                cur = '';
                continue;
            }
            cur += ch;
        }
        out.push(cur.trim());
        return out;
    }

    async function loadDeityData() {
        try {
            const response = await fetch('data/deities.csv');
            if (!response.ok) throw new Error('Could not fetch deity data.');
            const text = await response.text();
            const lines = text.split(/\r?\n/).filter(Boolean);
            if (lines.length < 2) return;
            const header = parseCsvLine(lines[0]).map(h => String(h || '').trim().toLowerCase());
            const idx = {
                deity: header.indexOf('deity'),
                alignment: header.indexOf('alignment'),
                domains: header.indexOf('suggested domains'),
                symbol: header.indexOf('symbol')
            };
            _deityData = lines.slice(1).map(line => {
                const cols = parseCsvLine(line);
                const name = String(cols[idx.deity] || '').trim();
                const alignment = String(cols[idx.alignment] || '').trim().toUpperCase();
                const domainsRaw = String(cols[idx.domains] || '').trim();
                const symbol = String(cols[idx.symbol] || '').trim();
                const domains = domainsRaw
                    .split(',')
                    .map(d => d.trim())
                    .filter(Boolean);
                return {
                    name,
                    alignments: alignment ? [alignment] : ['N'],
                    domains,
                    symbol
                };
            }).filter(d => d.name);
        } catch (err) {
            console.warn('Failed to load deity data, using defaults.', err);
            _deityData = [];
        }
    }

    function buildSpellIndex(spells) {
      _spellIndex = {};
      _classSpellIndex = {};
      const list = Array.isArray(spells) ? spells : Object.values(spells || {});
      for (const s of list) {
        if (s && s.name) {
          _spellIndex[s.name.toLowerCase()] = s;
          const classes = Array.isArray(s.classes) ? s.classes : [];
          classes.forEach(c => {
            const key = String(c).toLowerCase();
            if (!_classSpellIndex[key]) _classSpellIndex[key] = [];
            _classSpellIndex[key].push(s);
          });
        }
      }
    }

    function slugify(value) {
        return String(value || '')
            .trim()
            .toLowerCase()
            .replace(/&/g, ' and ')
            .replace(/['’]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    function getBackgroundChoiceByAward(backgroundData, awardKey) {
        if (!backgroundData || !Array.isArray(backgroundData.choices)) return null;
        return backgroundData.choices.find(c => c?.awards && Object.prototype.hasOwnProperty.call(c.awards, awardKey)) || null;
    }

    function getBackgroundChoicesByAward(backgroundData, awardKey) {
        if (!backgroundData || !Array.isArray(backgroundData.choices)) return [];
        return backgroundData.choices.filter(c => c?.awards && Object.prototype.hasOwnProperty.call(c.awards, awardKey));
    }

    function buildChoiceOptions(choice) {
        if (!choice || !Array.isArray(choice.from)) return [];
        const options = [];
        for (const item of choice.from) {
            if (!item || typeof item !== 'object') continue;
            if (item.any) {
                const t = String(item.type || '').toLowerCase();
                if (t === 'language') {
                    _allLanguagesData.forEach(l => options.push({ id: `lang:${slugify(l.name)}`, label: l.name }));
                } else if (t === 'tool') {
                    _allToolsData.forEach(tn => options.push({ id: `tool:${slugify(tn)}`, label: tn }));
                }
                continue;
            }
            const label = item.name || item.text || item.desc || '';
            if (!label) continue;
            options.push({ id: item.id || slugify(label), label });
        }
        return options;
    }

    function getChoiceItemById(choice, itemId) {
        if (!choice || !Array.isArray(choice.from)) return null;
        return choice.from.find(item => item && item.id === itemId) || null;
    }

    function getCustomChoiceValue(choiceId) {
        if (!choiceId) return '';
        const input = document.querySelector(`.choice-custom-input[data-choice-id="${choiceId}"]`);
        return input?.value?.trim() || '';
    }

    function findBackgroundChoiceItem(backgroundData, itemId) {
        if (!backgroundData || !Array.isArray(backgroundData.choices)) return null;
        for (const choice of backgroundData.choices) {
            const item = getChoiceItemById(choice, itemId);
            if (item) return item;
        }
        return null;
    }

    function levelFromSource(source, kind) {
        const label = kind === 'subclass' ? 'Subclass' : 'Class';
        const re = new RegExp(`\\b${label}\\s+(\\d+)\\b`, 'i');
        const match = String(source || '').match(re);
        return match ? match[1] : '';
    }

    function showErrors(errors) {
        const box = document.getElementById('builder-errors');
        if (!box) return;
        if (!errors || errors.length === 0) {
            box.classList.add('hidden');
            box.innerHTML = '';
            return;
        }
        box.classList.remove('hidden');
        box.innerHTML = '<strong>Please fix the following:</strong><ul>' +
            errors.map(e => `<li>${e}</li>`).join('') +
            '</ul>';
    }

    function countSelected(containerSelector) {
        const selects = document.querySelectorAll(containerSelector);
        let count = 0;
        selects.forEach(sel => { if (sel.value) count += 1; });
        return count;
    }

    function countChoiceSelectionsById(choiceId) {
        if (!choiceId) return 0;
        let count = 0;
        document.querySelectorAll(`select[data-choice-id="${choiceId}"]`).forEach(sel => {
            if (sel.value) count += 1;
        });
        document.querySelectorAll(`input.choice-custom-input[data-choice-id="${choiceId}"]`).forEach(input => {
            if (input.value.trim()) count += 1;
        });
        return count;
    }

    function clearFieldErrors() {
        document.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error'));
        document.querySelectorAll('.field-error-block').forEach(el => el.classList.remove('field-error-block'));
    }

    function validateBuilderForm(context) {
        const errors = [];
        clearFieldErrors();

        if (!F.name().value.trim()) {
            errors.push('Character name is required.');
            F.name().classList.add('field-error');
        }
        if (!F.player().value.trim()) {
            errors.push('Player name is required.');
            F.player().classList.add('field-error');
        }
        if (!F.class().value) {
            errors.push('Class is required.');
            F.class().classList.add('field-error');
        }
        if (!F.race().value) {
            errors.push('Race is required.');
            F.race().classList.add('field-error');
        }
        if (F.race().value === 'Dragonborn' && !F.subrace().value) {
            errors.push('Draconic Ancestry is required for Dragonborn.');
            F.subrace().classList.add('field-error');
        }
        if (!F.background().value) {
            errors.push('Background is required.');
            F.background().classList.add('field-error');
        }

        const level = parseInt(F.level().value, 10) || 1;
        const className = F.class().value;
        const classInfo = CLASS_DATA[className];
        const subclassLevel = classInfo?.subclass_level || 3;
        if (level >= subclassLevel && F.subclass().value === '') {
            errors.push(`Subclass is required at level ${subclassLevel} for ${className}.`);
            F.subclass().classList.add('field-error');
        }

        if (className === 'Ranger' && level >= 1) {
            const choices = readRangerChoices();
            if (!choices.favoredChoice) {
                errors.push('Select Favored Enemy or Favored Foe.');
                document.querySelectorAll('input[name="ranger-favored-choice"]').forEach(r => r.classList.add('field-error'));
            } else if (choices.favoredChoice === 'favored-enemy') {
                const typeSel = document.getElementById('ranger-favored-enemy-type');
                const langSel = document.getElementById('ranger-favored-enemy-language');
                if (!choices.favoredEnemyType) {
                    errors.push('Select a Favored Enemy type.');
                    typeSel?.classList.add('field-error');
                }
                if (!choices.favoredEnemyLanguage) {
                    errors.push('Select a Favored Enemy language.');
                    langSel?.classList.add('field-error');
                }
            }

            if (!choices.terrainChoice) {
                errors.push('Select Natural Explorer or Deft Explorer.');
                document.querySelectorAll('input[name="ranger-terrain-choice"]').forEach(r => r.classList.add('field-error'));
            } else if (choices.terrainChoice === 'natural-explorer') {
                const terrainSel = document.getElementById('ranger-favored-terrain');
                if (!choices.favoredTerrain) {
                    errors.push('Select a Favored Terrain.');
                    terrainSel?.classList.add('field-error');
                }
            } else if (choices.terrainChoice === 'deft-explorer') {
                const cannySel = document.getElementById('ranger-canny-skill');
                const cannyLang1Sel = document.getElementById('ranger-canny-language-1');
                const cannyLang2Sel = document.getElementById('ranger-canny-language-2');
                if (!choices.cannySkill) {
                    errors.push('Select a Canny skill.');
                    cannySel?.classList.add('field-error');
                }
                if (!choices.cannyLanguage1) {
                    errors.push('Select Canny language 1.');
                    cannyLang1Sel?.classList.add('field-error');
                }
                if (!choices.cannyLanguage2) {
                    errors.push('Select Canny language 2.');
                    cannyLang2Sel?.classList.add('field-error');
                }
            }
        }

        const requiredClassChoiceSelects = document.querySelectorAll('.class-choice-select[data-required="1"]');
        requiredClassChoiceSelects.forEach(sel => {
            if (sel.value) return;
            const labelText = sel.closest('.form-group')?.querySelector('label')?.textContent?.trim() || 'class choice';
            errors.push(`Select ${labelText}.`);
            sel.classList.add('field-error');
        });

        const classNameLower = String(F.class().value || '').trim().toLowerCase();
        const subclassNameLower = String(F.subclass().value || '').trim().toLowerCase();
        if (classNameLower === 'fighter' && subclassNameLower === 'eldritch knight' && level >= 3) {
            const ekSpellChoiceId = 'choice:subclass:fighter:eldritch-knight:eldritch_knight_spells_3';
            const picks = Array.from(document.querySelectorAll(`.class-choice-select[data-choice-id="${ekSpellChoiceId}"]`))
                .map(sel => String(sel.value || '').trim())
                .filter(Boolean);
            if (picks.length >= 3) {
                const abjEvo = picks.reduce((count, name) => {
                    const spell = _spellIndex?.[String(name || '').toLowerCase()];
                    const school = String(spell?.school?.name || spell?.school || '').toLowerCase();
                    return count + ((school === 'abjuration' || school === 'evocation') ? 1 : 0);
                }, 0);
                if (abjEvo < 2) {
                    errors.push('Eldritch Knight spell choices at level 3 must include at least two abjuration or evocation spells.');
                    document.querySelectorAll(`.class-choice-select[data-choice-id="${ekSpellChoiceId}"]`).forEach(sel => sel.classList.add('field-error'));
                }
            }
        }

        const variantHuman = getVariantHumanSelection();
        if (variantHuman.enabled) {
            if (!variantHuman.asi1 || !variantHuman.asi2) {
                errors.push('Variant Human requires selecting two different ability scores for +1/+1.');
                F.variantHumanAsi1()?.classList.add('field-error');
                F.variantHumanAsi2()?.classList.add('field-error');
            } else if (variantHuman.asi1 === variantHuman.asi2) {
                errors.push('Variant Human ability score increases must be two different abilities.');
                F.variantHumanAsi1()?.classList.add('field-error');
                F.variantHumanAsi2()?.classList.add('field-error');
            }
            if (!variantHuman.skill) {
                errors.push('Variant Human requires one skill proficiency choice.');
                F.variantHumanSkill()?.classList.add('field-error');
            }
            if (!variantHuman.featName) {
                errors.push('Variant Human requires one feat choice.');
                F.variantHumanFeat()?.classList.add('field-error');
            } else {
                const featChoicesWrap = F.variantHumanFeatChoices?.();
                const featChoices = Array.isArray(variantHuman.featDef?.choices) ? variantHuman.featDef.choices : [];
                const featSelections = readVariantHumanFeatChoices();
                featChoices.forEach(choice => {
                    const values = featSelections[choice.id] || [];
                    const count = Number(choice.count || choice.choose || 1) || 1;
                    if (values.length < count) {
                        errors.push(`Variant Human feat choice incomplete: ${choice.prompt || choice.id}.`);
                        featChoicesWrap?.classList.add('field-error-block');
                    }
                    if (choice.distinct && new Set(values).size !== values.length) {
                        errors.push(`Variant Human feat choice must be distinct: ${choice.prompt || choice.id}.`);
                        featChoicesWrap?.classList.add('field-error-block');
                    }
                });
            }
        }

        const skillChoicesNeeded = context?.skillChoiceCount || 0;
        const skillSelects = document.querySelectorAll('.skill-choice-select');
        const skillChoicesMade = countSelected('.skill-choice-select');
        if (skillChoicesMade < skillChoicesNeeded) {
            errors.push(`Select ${skillChoicesNeeded} skill choice(s).`);
            skillSelects.forEach(sel => { if (!sel.value) sel.classList.add('field-error'); });
        }

        const toolChoicesNeeded = context?.toolChoiceCount || 0;
        const toolSelects = document.querySelectorAll('.tool-choice-select');
        const toolChoicesMade = countSelected('.tool-choice-select');
        if (toolChoicesMade < toolChoicesNeeded) {
            errors.push(`Select ${toolChoicesNeeded} tool choice(s).`);
            toolSelects.forEach(sel => { if (!sel.value) sel.classList.add('field-error'); });
        }

        const languageChoicesNeeded = context?.languageChoiceCount || 0;
        const languageSelects = document.querySelectorAll('.language-choice-select');
        const languageChoicesMade = countSelected('.language-choice-select');
        if (languageChoicesMade < languageChoicesNeeded) {
            errors.push(`Select ${languageChoicesNeeded} language choice(s).`);
            languageSelects.forEach(sel => { if (!sel.value) sel.classList.add('field-error'); });
        }

        const abilityChoiceCount = context?.abilityChoiceCount || 0;
        const abilitySelects = document.querySelectorAll('.ability-choice-select');
        const abilityChoicesMade = countSelected('.ability-choice-select');
        if (abilityChoicesMade < abilityChoiceCount) {
            errors.push(`Select ${abilityChoiceCount} ability score choice(s).`);
            abilitySelects.forEach(sel => { if (!sel.value) sel.classList.add('field-error'); });
        }

        const spellChoiceCount = context?.spellChoiceCount || 0;
        const spellSelects = document.querySelectorAll('.spell-choice-select');
        const spellChoicesMade = countSelected('.spell-choice-select');
        if (spellChoicesMade < spellChoiceCount) {
            errors.push(`Select ${spellChoiceCount} spell choice(s).`);
            spellSelects.forEach(sel => { if (!sel.value) sel.classList.add('field-error'); });
        }

        const racialCantripSelects = document.querySelectorAll('.racial-cantrip-select');
        if (racialCantripSelects.length) {
            const made = Array.from(racialCantripSelects).filter(sel => sel.value).length;
            const total = racialCantripSelects.length;
            if (made < total) {
                errors.push(`Select ${total} racial cantrip choice(s).`);
                racialCantripSelects.forEach(sel => { if (!sel.value) sel.classList.add('field-error'); });
            }
        }

        if (_useBackgroundsV1 && F.background().value) {
            const bgData = _backgroundsData.find(b => b.name === F.background().value);
            const skipAwards = new Set([
                'skills', 'tools', 'languages', 'personality_traits', 'ideals', 'bonds', 'flaws'
            ]);
            (bgData?.choices || []).forEach(choice => {
                const awards = choice?.awards ? Object.keys(choice.awards) : [];
                if (awards.some(a => skipAwards.has(a))) return;
                const min = choice?.choose?.min || 0;
                const max = choice?.choose?.max || 0;
                if (!max && !min) return;
                const made = countChoiceSelectionsById(choice.id);
                if (min > 0 && made < min) {
                    errors.push(`Select at least ${min} option(s) for: ${choice.prompt || 'background choice'}.`);
                }
                if (max > 0 && made > max) {
                    errors.push(`Select no more than ${max} option(s) for: ${choice.prompt || 'background choice'}.`);
                }
            });
        }

        const equipBlocks = document.querySelectorAll('.equipment-choice-block');
        equipBlocks.forEach((block, idx) => {
            const radio = block.querySelector('input[type="radio"]:checked');
            if (!radio) {
                errors.push(`Select an option for equipment choice ${idx + 1}.`);
                block.classList.add('field-error-block');
                return;
            }
            const neededSub = block.querySelectorAll('.equipment-sub-choice-select');
            neededSub.forEach((sel) => {
                if (!sel.value) {
                    errors.push(`Complete all sub-choices for equipment choice ${idx + 1}.`);
                    sel.classList.add('field-error');
                }
            });
        });

        return errors;
    }

    async function loadAllSpells() {
        let list = [];
        try {
            const root = (document.querySelector('meta[name="data-root"]')?.content?.trim()) || './data/';
            const res = await fetch(`${root.replace(/\/+$/, '')}/spells.json`, { cache: 'no-store' });
            if (res.ok) {
                const spells = await res.json();
                list = Array.isArray(spells) ? spells : Object.values(spells || {});
            }
        } catch (_) {}
        if (!list.length && typeof global.loadSpells === 'function') {
            const spells = await global.loadSpells(); // storage.js fallback (SRD list)
            list = Array.isArray(spells) ? spells : Object.values(spells || {});
        }
        _allSpellsData = list;
        buildSpellIndex(_allSpellsData);
        return _allSpellsData;
    }

    async function loadLegacyEquipmentItems() {
        if (Array.isArray(_legacyEquipmentItems)) return _legacyEquipmentItems;
        try {
            const root = (document.querySelector('meta[name="data-root"]')?.content?.trim()) || './data/';
            const res = await fetch(`${root.replace(/\/+$/, '')}/equipment.json`, { cache: 'no-store' });
            if (!res.ok) throw new Error(`equipment.json not found (${res.status})`);
            const raw = await res.json();
            _legacyEquipmentItems = Array.isArray(raw) ? raw : Object.values(raw || {});
        } catch (_) {
            _legacyEquipmentItems = [];
        }
        return _legacyEquipmentItems;
    }

    async function populateDropdowns() {
        const raceSelect = F.race();
        const classSelect = F.class();
        const backgroundSelect = F.background();
        const selects = [raceSelect, classSelect, backgroundSelect];

        for (const sel of selects) {
            if (sel) {
                sel.disabled = true;
                sel.innerHTML = '<option>Loading...</option>';
            }
        }

        try {
            const localRacesPromise = global.loadRacesLocal ? global.loadRacesLocal() : Promise.resolve([]);
            const localClassesPromise = global.loadClassesLocal ? global.loadClassesLocal() : Promise.resolve([]);
            const localSubclassesPromise = global.loadSubclassesLocal ? global.loadSubclassesLocal() : Promise.resolve([]);
            const localBackgroundsPromise = global.loadBackgroundsLocal ? global.loadBackgroundsLocal() : Promise.resolve([]);

            const apiRacesPromise = fetchFromApi('races');
            const apiClassesPromise = fetchFromApi('classes');
            const apiBackgroundsPromise = fetchFromApi('backgrounds');

            const [races, classes, subclasses, backgrounds] = await Promise.all([
                mergeDataSources(localRacesPromise, apiRacesPromise),
                mergeDataSources(localClassesPromise, apiClassesPromise),
                localSubclassesPromise,
                mergeDataSources(localBackgroundsPromise, apiBackgroundsPromise),
            ]);

            // Prefer v1 race schema if present
            try {
                const v1Res = await fetch('data/races.v1.json');
                if (v1Res.ok) {
                    const v1Data = await v1Res.json();
                    if (Array.isArray(v1Data?.races)) {
                        _racesV1 = v1Data.races;
                        _useRacesV1 = true;
                    }
                }
            } catch (err) {
                console.warn('Failed to load races.v1.json, falling back to legacy schema.', err);
            }

            // Prefer v1 background schema if present
            try {
                const v1BgRes = await fetch('data/backgrounds.v1.json');
                if (v1BgRes.ok) {
                    const v1BgData = await v1BgRes.json();
                    if (Array.isArray(v1BgData?.backgrounds)) {
                        _backgroundsV1 = v1BgData.backgrounds;
                        _useBackgroundsV1 = true;
                    }
                }
            } catch (err) {
                console.warn('Failed to load backgrounds.v1.json, falling back to legacy schema.', err);
            }

            await loadNameData();
            await loadDeityData();
            _allLanguagesData = await fetchFromApi('languages');
            // Local extension languages not present in upstream API datasets.
            if (!Array.isArray(_allLanguagesData)) _allLanguagesData = [];
            const hasKenderspeak = _allLanguagesData.some(l => String(l?.name || '').trim().toLowerCase() === 'kenderspeak');
            if (!hasKenderspeak) _allLanguagesData.push({ name: 'Kenderspeak' });
            _allLanguagesData = _allLanguagesData
                .filter(l => String(l?.name || '').trim())
                .sort((a, b) => String(a.name).localeCompare(String(b.name)));
            await loadAllSpells(); // This will populate _allSpellsData
            try {
                const featsRes = await fetch('data/feats.json');
                _featsData = featsRes.ok ? (await featsRes.json()) : [];
                if (!Array.isArray(_featsData)) _featsData = [];
            } catch (_) {
                _featsData = [];
            }
            _allToolsData = await fetchFromApi('equipment-categories/tools').then(res => res.map(t => t.name));

            _racesData = _useRacesV1 ? _racesV1 : races;
            _classesData = classes;
            _subclassesData = Array.isArray(subclasses) ? subclasses : [];
            _backgroundsCanonicalData = Array.isArray(backgrounds) ? backgrounds : [];
            _backgroundsData = _useBackgroundsV1 ? _backgroundsV1 : backgrounds;

            const populate = (selectEl, data, placeholder) => {
                if (!selectEl) return;
                const options = data.map(item => `<option value="${item.name}">${item.name}</option>`).join('');
                selectEl.innerHTML = `<option value="">-- ${placeholder} --</option>${options}`;
            };

            populate(raceSelect, _racesData, 'Select a Race');
            populate(classSelect, classes, 'Select a Class');
            populate(backgroundSelect, _backgroundsData, 'Select a Background');
            updateDeitySuggestions();

            const humanEthnicities = [...new Set(
                _namesData
                    .filter(row => row.Species === 'Human' && row.Ethicity)
                    .map(row => String(row.Ethicity || '').trim())
                    .concat(FAERUN_HUMAN_ETHNICITIES)
            )].sort((a, b) => a.localeCompare(b));
            populate(F.ethnicity(), humanEthnicities.map(e => ({name: e})), 'Select an Ethnicity');

        } finally {
            for (const sel of selects) {
                if (sel) sel.disabled = false;
            }
        }
    }

    function mapV1AbilityScores(abilityScores) {
        if (!abilityScores) return { bonuses: [], ability_score_options: null };
        if (abilityScores.mode === 'fixed') {
            const bonuses = (abilityScores.bonuses || []).map(b => ({
                ability_score: { index: String(b.ability || '').toLowerCase(), name: b.ability },
                bonus: b.bonus || 0
            }));
            return { bonuses, ability_score_options: null };
        }
        if (abilityScores.mode === 'choice' || abilityScores.mode === 'flexible') {
            return {
                bonuses: [],
                ability_score_options: {
                    choose: abilityScores.choose || 0,
                    bonus: abilityScores.bonus || 0,
                    from: (abilityScores.from || []).map(a => ({ index: String(a).toLowerCase(), name: a }))
                }
            };
        }
        return { bonuses: [], ability_score_options: null };
    }

    function mapV1Languages(languages) {
        const fixed = (languages?.fixed || []).map(name => ({ name }));
        const choose = languages?.choose || 0;
        const chooseFrom = languages?.choose_from || [];
        return { fixed, choose, chooseFrom };
    }

    function defaultDragonbornAbilityBonuses() {
        return [
            { ability_score: { index: 'str', name: 'STR' }, bonus: 2 },
            { ability_score: { index: 'cha', name: 'CHA' }, bonus: 1 }
        ];
    }

    function buildV1BaseAggregation(raceData) {
        const baseAbility = mapV1AbilityScores(raceData.ability_scores || {});
        const baseLang = mapV1Languages(raceData.languages || {});
        const baseProfs = raceData.proficiencies || {};
        const starting = [];
        (baseProfs.skills || []).forEach(s => starting.push({ name: `Skill: ${s}` }));
        (baseProfs.weapons || []).forEach(w => starting.push({ name: `Weapon: ${w}` }));
        (baseProfs.armor || []).forEach(a => starting.push({ name: `Armor: ${a}` }));
        const out = {
            speed: raceData.speed?.walk || 30,
            size: raceData.size?.value || (raceData.size?.values ? raceData.size.values[0] : 'Medium'),
            age: raceData.flavor?.age || 'Varies.',
            ability_bonuses: baseAbility.bonuses,
            traits: raceData.features || [],
            languages: baseLang.fixed,
            language_options: baseLang.choose || 0,
            language_choice_from: baseLang.chooseFrom || [],
            spells: raceData.spells?.granted?.by_level || {},
            cantrip_options: null,
            proficiencies: {
                skills: [...(baseProfs.skills || [])],
                tools: [...(baseProfs.tools || [])],
                weapons: [...(baseProfs.weapons || [])],
                armor: [...(baseProfs.armor || [])]
            },
            starting_proficiencies: starting
        };
        if (String(raceData?.name || '').toLowerCase() === 'dragonborn' && (!Array.isArray(out.ability_bonuses) || !out.ability_bonuses.length)) {
            out.ability_bonuses = defaultDragonbornAbilityBonuses();
        }
        return out;
    }

    function applyV1Option(agg, option) {
        if (!agg || !option) return agg || {};
        const apply = option?.apply || {};
        const out = {
            ...agg,
            traits: [...(agg.traits || [])],
            languages: [...(agg.languages || [])],
            proficiencies: {
                skills: [...(agg.proficiencies?.skills || [])],
                tools: [...(agg.proficiencies?.tools || [])],
                weapons: [...(agg.proficiencies?.weapons || [])],
                armor: [...(agg.proficiencies?.armor || [])]
            },
            spells: { ...(agg.spells || {}) }
        };

        const replaceFeatureIds = new Set((apply.replace_features || []).map(v => String(v || '').trim()).filter(Boolean));
        if (replaceFeatureIds.size) {
            out.traits = out.traits.filter(t => !replaceFeatureIds.has(String(t?.id || '').trim()));
            const nextSpells = {};
            for (const lvl of Object.keys(out.spells || {})) {
                const arr = Array.isArray(out.spells[lvl]) ? out.spells[lvl] : [];
                nextSpells[lvl] = arr.filter(entry => {
                    if (!entry || typeof entry !== 'object') return true;
                    return !replaceFeatureIds.has(String(entry?.source || '').trim());
                });
            }
            out.spells = nextSpells;
        }

        if (String(option?.key || '').toLowerCase() === 'tiefling-hellfire') {
            const nextSpells = {};
            for (const lvl of Object.keys(out.spells || {})) {
                const arr = Array.isArray(out.spells[lvl]) ? out.spells[lvl] : [];
                nextSpells[lvl] = arr.filter(entry => {
                    const spell = (typeof entry === 'string') ? entry : (entry?.spell || entry?.name || '');
                    return String(spell || '').toLowerCase() !== 'hellish rebuke';
                });
            }
            out.spells = nextSpells;
        }

        if (apply.replace_ability_scores && apply.ability_scores) {
            const mapped = mapV1AbilityScores(apply.ability_scores);
            out.ability_bonuses = mapped.bonuses;
        } else {
            const addBonuses = (apply.ability_scores?.add_bonuses || []).map(b => ({
                ability_score: { index: String(b.ability || '').toLowerCase(), name: b.ability },
                bonus: b.bonus || 0
            }));
            out.ability_bonuses = [...(out.ability_bonuses || []), ...addBonuses];
        }

        if (apply.languages?.replace_fixed) {
            out.languages = (apply.languages.replace_fixed || []).map(name => ({ name }));
        }
        if (Array.isArray(apply.languages?.add)) {
            out.languages.push(...apply.languages.add.map(name => ({ name })));
        }
        if (Number.isFinite(apply.languages?.choose)) {
            out.language_options = Number(out.language_options || 0) + Number(apply.languages.choose || 0);
        }
        if (Array.isArray(apply.languages?.choose_from) && apply.languages.choose_from.length) {
            out.language_choice_from = apply.languages.choose_from;
        }

        const addProfs = apply.proficiencies || {};
        out.proficiencies.skills.push(...(addProfs.add_skills || []));
        out.proficiencies.tools.push(...(addProfs.add_tools || []));
        out.proficiencies.weapons.push(...(addProfs.add_weapons || []));
        out.proficiencies.armor.push(...(addProfs.add_armor || []));

        if (Array.isArray(apply.features)) out.traits.push(...apply.features);

        if (Number.isFinite(apply.speed?.walk)) out.speed = apply.speed.walk;

        const optSpells = apply.spells?.granted?.by_level || {};
        for (const lvl of Object.keys(optSpells)) {
            out.spells[lvl] = (out.spells[lvl] || []).concat(optSpells[lvl] || []);
        }

        const choices = apply.spells?.choices || [];
        for (const choice of choices) {
            const list = String(choice.from_list || '');
            if (!list.toLowerCase().includes('cantrip')) continue;
            const className = list
                .replace(/\s*cantrips?/i, '')
                .replace(/\s*spell\s*list/i, '')
                .trim();
            out.cantrip_options = { class: className || 'Wizard', choose: choice.choose || 1 };
            break;
        }

        out.proficiencies.skills = [...new Set(out.proficiencies.skills)];
        out.proficiencies.tools = [...new Set(out.proficiencies.tools)];
        out.proficiencies.weapons = [...new Set(out.proficiencies.weapons)];
        out.proficiencies.armor = [...new Set(out.proficiencies.armor)];

        const starting = [];
        out.proficiencies.skills.forEach(s => starting.push({ name: `Skill: ${s}` }));
        out.proficiencies.weapons.forEach(w => starting.push({ name: `Weapon: ${w}` }));
        out.proficiencies.armor.forEach(a => starting.push({ name: `Armor: ${a}` }));
        out.starting_proficiencies = starting;
        return out;
    }

    async function getAggregatedRacialData(raceName, subraceName, variantKeys = []) {
        if (!raceName) return {};

        if (_useRacesV1) {
            const raceData = (_racesV1 || []).find(r => r.name === raceName) || {};
            let selected = subraceName || '';
            let aliasName = '';
            if (selected.includes('||')) {
                const parts = selected.split('||');
                selected = parts[0];
                aliasName = parts[1] || '';
            }
            let option = (raceData.options || []).find(o => o.key === selected) || null;
            if (option?.inherits) {
                const parentId = option.inherits;
                const parent = (raceData.options || []).find(o => o.id === parentId) || null;
                if (parent) {
                    const mergedApply = { ...(parent.apply || {}) };
                    option = { ...option, apply: mergedApply };
                }
            }
            if (!option && aliasName) {
                option = (raceData.options || []).find(o => Array.isArray(o.aliases) && o.aliases.includes(aliasName)) || null;
            }
            let aggregated = buildV1BaseAggregation(raceData);
            if (option) {
                aggregated = applyV1Option(aggregated, option);
            }

            if (Array.isArray(variantKeys) && variantKeys.length) {
                const selectedVariants = (raceData.options || [])
                    .filter(o => variantKeys.includes(String(o?.key || '').trim()));
                for (const v of selectedVariants) {
                    aggregated = applyV1Option(aggregated, v);
                }
            }

            return aggregated;
        }

        let raceData = _racesData.find(r => r.name === raceName) || {};
        if (raceData.url && !raceData.age) {
            try {
                raceData = { ...raceData, ...await fetch(`https://www.dnd5eapi.co${raceData.url}`).then(res => res.json()) };
                const index = _racesData.findIndex(r => r.name === raceName);
                if (index !== -1) _racesData[index] = raceData;
            } catch (err) { console.error(`Failed to fetch full data for race: ${raceName}`, err); }
        }

        let subraceData = {};
        if (subraceName && Array.isArray(raceData.subraces)) {
            const subraceStub = raceData.subraces.find(sr => sr.name === subraceName);
            if (subraceStub) {
                // If the subrace object in our local data has its own properties, use it directly.
                if (subraceStub.ability_bonuses || subraceStub.traits || subraceStub.starting_proficiencies) {
                    subraceData = subraceStub;
                }
                // Otherwise, fetch from the API if a URL is provided.
                else if (subraceStub.url) {
                    try {
                        subraceData = await fetch(`https://www.dnd5eapi.co${subraceStub.url}`).then(res => res.json());
                    } catch (err) { console.error(`Failed to fetch full data for subrace: ${subraceName}`, err); }
                }
            }
        }

        const mergedSpells = { ...(raceData.spells || {}) };
        if (subraceData.spells) {
            for (const level in subraceData.spells) {
                if (!mergedSpells[level]) mergedSpells[level] = [];
                mergedSpells[level].push(...subraceData.spells[level]);
            }
        }

        const merged = {
            speed: subraceData.speed || raceData.speed || 30,
            size: raceData.size || 'Medium',
            age: raceData.age || 'Varies.',
            ability_bonuses: [...(raceData.ability_bonuses || []), ...(subraceData.ability_bonuses || [])],
            traits: [...(raceData.traits || []), ...(subraceData.racial_traits || [])],
            languages: [...(raceData.languages || []), ...(subraceData.languages || [])],
            language_options: (raceData.language_options?.choose || 0) + (subraceData.language_options?.choose || 0),
            spells: mergedSpells,
            proficiencies: {
                skills: [...(raceData.proficiencies?.skills || []), ...(subraceData.proficiencies?.skills || [])],
                tools: [...(raceData.proficiencies?.tools || []), ...(subraceData.proficiencies?.tools || [])],
                armor: [...(raceData.proficiencies?.armor || []), ...(subraceData.proficiencies?.armor || [])],
                ability_score_choices: subraceData.ability_score_options || raceData.ability_score_options
            },
            starting_proficiencies: [...(raceData.starting_proficiencies || []), ...(subraceData.starting_proficiencies || [])]
        };
        if (String(raceName || '').toLowerCase() === 'dragonborn' && (!Array.isArray(merged.ability_bonuses) || !merged.ability_bonuses.length)) {
            merged.ability_bonuses = defaultDragonbornAbilityBonuses();
        }
        return merged;
    }

    function racialSpells(aggregatedData, level) {
        const out = { cantrips: [], leveled: [] };
        const racialSpellsByLevel = aggregatedData.spells || {};

        for (const spellLevel in racialSpellsByLevel) {
            if (level >= Number(spellLevel)) {
                const spellNames = racialSpellsByLevel[spellLevel];
                if (Number(spellLevel) === 0) {
                    spellNames.forEach(entry => {
                        const name = (typeof entry === 'string')
                            ? entry
                            : String(entry?.spell || entry?.name || '').trim();
                        if (name) out.cantrips.push({ name, level: 0 });
                    });
                } else {
                    spellNames.forEach(entry => {
                        const name = (typeof entry === 'string')
                            ? entry
                            : String(entry?.spell || entry?.name || '').trim();
                        if (name) out.leveled.push({ name, level: Number(spellLevel) });
                    });
                }
            }
        }
        return out;
    }

    function subclassGrantedSpells(className, subclassName, level) {
        const out = { cantrips: [], leveled: [] };
        if (!className || !subclassName) return out;
        const cls = String(className).toLowerCase();
        const sub = String(subclassName).toLowerCase();
        const lvl = Number(level) || 1;
        const data = (_subclassesData || []).find(s =>
            String(s?.class || '').toLowerCase() === cls &&
            String(s?.name || '').toLowerCase() === sub
        );
        if (!data) return out;

        const alwaysPrepared = data.alwaysPreparedSpells || {};
        for (const key of Object.keys(alwaysPrepared)) {
            if (lvl < Number(key)) continue;
            (alwaysPrepared[key] || []).forEach(name => out.leveled.push({ name, level: Number(key) }));
        }

        const bonusCantrips = data.bonusCantrips || {};
        for (const key of Object.keys(bonusCantrips)) {
            if (lvl < Number(key)) continue;
            (bonusCantrips[key] || []).forEach(name => out.cantrips.push({ name, level: 0 }));
        }

        return out;
    }

    async function renderRacialCantripChoice(aggregatedData) {
        const container = F.cantripsContainer();
        if (!container) return;
        let options = aggregatedData?.cantrip_options;
        // Fallback for race data variants where cantrip choice is encoded in trait text
        // but cantrip_options was not propagated.
        if ((!options || !options.class || !options.choose) && aggregatedData) {
            const traits = Array.isArray(aggregatedData.traits) ? aggregatedData.traits : [];
            const textBlob = traits
                .map(t => `${String(t?.name || '')} ${String(t?.desc || '')}`.toLowerCase())
                .join(' \n ');
            if (textBlob.includes('cantrip') && textBlob.includes('wizard spell list')) {
                options = { class: 'Wizard', choose: 1 };
            } else if (textBlob.includes('cantrip') && textBlob.includes('druid spell list')) {
                options = { class: 'Druid', choose: 1 };
            }
        }
        const existing = container.querySelector('.racial-cantrip-choice');
        if (!options || !options.class || !options.choose) {
            if (existing) existing.remove();
            return;
        }

        const classKey = String(options.class || '')
            .trim()
            .toLowerCase()
            .replace(/\s*cantrips?/i, '')
            .replace(/\s*spell\s*list/i, '')
            .trim();
        let spellSource = _classSpellIndex?.[classKey] || [];
        if (!Array.isArray(spellSource) || !spellSource.length) {
            const all = Array.isArray(_allSpellsData) ? _allSpellsData : [];
            spellSource = all.filter(s => {
                const classes = Array.isArray(s?.classes) ? s.classes : [];
                return classes.some(c => String(c || '').trim().toLowerCase() === classKey);
            });
        }
        let cantrips = spellSource.filter(s => Number(s?.level ?? s?.level_int ?? -1) === 0);
        if (!cantrips.length) {
            try {
                const root = (document.querySelector('meta[name="data-root"]')?.content?.trim()) || './data/';
                const res = await fetch(`${root.replace(/\/+$/, '')}/spells.json`, { cache: 'no-store' });
                if (res.ok) {
                    const raw = await res.json();
                    const list = Array.isArray(raw) ? raw : Object.values(raw || {});
                    cantrips = list.filter(s => Number(s?.level ?? s?.level_int ?? -1) === 0)
                        .filter(s => {
                            const classes = Array.isArray(s?.classes) ? s.classes : [];
                            return classes.some(c => String(c || '').trim().toLowerCase() === classKey);
                        });
                }
            } catch (_) {}
        }
        if (!cantrips.length) {
            const FALLBACK_CANTRIPS = {
                wizard: [
                    'Acid Splash','Blade Ward','Booming Blade','Chill Touch','Control Flames','Create Bonfire',
                    'Dancing Lights','Fire Bolt','Friends','Frostbite','Green-Flame Blade','Gust','Infestation',
                    'Light','Lightning Lure','Mage Hand','Mending','Message','Mind Sliver','Minor Illusion',
                    'Mold Earth','Poison Spray','Prestidigitation','Ray of Frost','Shape Water','Shocking Grasp',
                    'Sword Burst','Thunderclap','Toll the Dead','True Strike'
                ],
                druid: [
                    'Control Flames','Create Bonfire','Druidcraft','Frostbite','Guidance','Gust','Infestation',
                    'Magic Stone','Mending','Mold Earth','Poison Spray','Primal Savagery','Produce Flame',
                    'Resistance','Shape Water','Shillelagh','Thorn Whip','Thunderclap'
                ]
            };
            const names = FALLBACK_CANTRIPS[classKey] || [];
            cantrips = names.map(name => ({ name, level: 0 }));
        }
        if (existing) existing.remove();

        const group = document.createElement('div');
        group.className = 'racial-cantrip-choice spell-choice-group form-group';
        group.innerHTML = `<label><strong title="Granted by your race; must be selected to finish the character.">Racial Cantrip Choice (${options.class}, required)</strong></label>`;
        for (let i = 0; i < options.choose; i++) {
            const select = document.createElement('select');
            select.className = 'spell-choice-select racial-cantrip-select';
            if (!cantrips.length) {
                select.innerHTML = `<option value="">-- No ${options.class} cantrips found --</option>`;
                select.disabled = true;
            } else {
                select.innerHTML = `<option value="">-- Select a cantrip --</option>` +
                    cantrips.map(s => `<option value="${s.name}">${getSpellDisplayName(s.name)}</option>`).join('');
            }
            group.appendChild(select);
        }
        if (!cantrips.length) {
            const hint = document.createElement('div');
            hint.className = 'class-choice-help';
            hint.style.cssText = 'font-size: 0.85em; color: #7a1f1f; margin-top: 4px;';
            hint.textContent = `Expected a ${options.class} cantrip list here.`;
            group.appendChild(hint);
        }
        container.prepend(group);
    }

    function captureCoreInputState() {
        return {
            name: F.name().value,
            player: F.player().value,
            deity: F.deity?.()?.value || '',
            eyesHair: F.eyesHair().value,
            trait: F.trait().value,
            ideal: F.ideal().value,
            bond: F.bond().value,
            flaw: F.flaw().value
        };
    }

    function restoreCoreInputState(state) {
        if (!state) return;
        if (state.name && !F.name().value) F.name().value = state.name;
        if (state.player && !F.player().value) F.player().value = state.player;
        if (state.deity && F.deity?.() && !F.deity().value) F.deity().value = state.deity;
        if (state.eyesHair && !F.eyesHair().value) F.eyesHair().value = state.eyesHair;

        const restoreSelectIfEmpty = (selectEl, value) => {
            if (!selectEl || !value || selectEl.value) return;
            if (Array.from(selectEl.options || []).some(opt => opt.value === value)) {
                selectEl.value = value;
            }
        };
        restoreSelectIfEmpty(F.trait(), state.trait);
        restoreSelectIfEmpty(F.ideal(), state.ideal);
        restoreSelectIfEmpty(F.bond(), state.bond);
        restoreSelectIfEmpty(F.flaw(), state.flaw);
    }

    function captureSelectValues(container, selector) {
        if (!container) return [];
        return Array.from(container.querySelectorAll(selector)).map(sel => sel.value || '');
    }

    function restoreSelectValues(container, selector, values) {
        if (!container || !Array.isArray(values)) return;
        const selects = Array.from(container.querySelectorAll(selector));
        selects.forEach((sel, idx) => {
            const value = values[idx];
            if (!value || sel.value) return;
            if (Array.from(sel.options || []).some(opt => opt.value === value)) {
                sel.value = value;
            }
        });
    }

    function captureChoiceSelectState(container, selector) {
        if (!container) return [];
        const counts = new Map();
        return Array.from(container.querySelectorAll(selector)).map(sel => {
            const choiceId = String(sel?.dataset?.choiceId || '').trim();
            const idx = counts.get(choiceId) || 0;
            counts.set(choiceId, idx + 1);
            return { choiceId, index: idx, value: sel.value || '' };
        });
    }

    function restoreChoiceSelectState(container, selector, state) {
        if (!container || !Array.isArray(state)) return;
        const wanted = new Map(
            state.map(row => [`${String(row?.choiceId || '')}::${Number(row?.index || 0)}`, String(row?.value || '')])
        );
        const counts = new Map();
        Array.from(container.querySelectorAll(selector)).forEach(sel => {
            const choiceId = String(sel?.dataset?.choiceId || '').trim();
            const idx = counts.get(choiceId) || 0;
            counts.set(choiceId, idx + 1);
            const key = `${choiceId}::${idx}`;
            const value = wanted.get(key) || '';
            if (!value) return;
            if (Array.from(sel.options || []).some(opt => opt.value === value)) {
                sel.value = value;
            }
        });
    }

    function captureChoiceInputState(container, selector) {
        if (!container) return [];
        const counts = new Map();
        return Array.from(container.querySelectorAll(selector)).map(input => {
            const choiceId = String(input?.dataset?.choiceId || '').trim();
            const idx = counts.get(choiceId) || 0;
            counts.set(choiceId, idx + 1);
            return { choiceId, index: idx, value: input.value || '' };
        });
    }

    function restoreChoiceInputState(container, selector, state) {
        if (!container || !Array.isArray(state)) return;
        const wanted = new Map(
            state.map(row => [`${String(row?.choiceId || '')}::${Number(row?.index || 0)}`, String(row?.value || '')])
        );
        const counts = new Map();
        Array.from(container.querySelectorAll(selector)).forEach(input => {
            const choiceId = String(input?.dataset?.choiceId || '').trim();
            const idx = counts.get(choiceId) || 0;
            counts.set(choiceId, idx + 1);
            const key = `${choiceId}::${idx}`;
            const value = wanted.get(key) || '';
            if (!value) return;
            input.value = value;
        });
    }

    function captureEquipmentState() {
        const container = F.equipmentChoicesContainer();
        if (!container) return [];
        const blocks = Array.from(container.querySelectorAll('.equipment-choice-block'));
        return blocks.map((block, blockIndex) => {
            const radio = block.querySelector('input[type="radio"]:checked');
            const option = radio ? parseInt(radio.value, 10) : null;
            const subChoices = Array.from(block.querySelectorAll('.equipment-sub-choice-select')).map(sel => sel.value || '');
            return { block: blockIndex, option, subChoices };
        });
    }

    function restoreEquipmentState(state) {
        if (!Array.isArray(state)) return;
        const container = F.equipmentChoicesContainer();
        if (!container) return;
        const blocks = Array.from(container.querySelectorAll('.equipment-choice-block'));
        state.forEach(saved => {
            if (!saved || saved.option === null || saved.option === undefined) return;
            const block = blocks[saved.block];
            if (!block) return;
            const radio = block.querySelector(`input[type="radio"][value="${saved.option}"]`);
            if (!radio) return;
            radio.checked = true;
            handleEquipmentChoice({ target: radio });
            const subSelects = Array.from(block.querySelectorAll('.equipment-sub-choice-select'));
            subSelects.forEach((sel, idx) => {
                const value = saved.subChoices?.[idx] || '';
                if (!value || sel.value) return;
                if (Array.from(sel.options || []).some(opt => opt.value === value)) {
                    sel.value = value;
                }
            });
        });
    }

    async function generateCharacterObject() {
        const selectedClassName = F.class().value;
        const selectedRaceName = F.race().value;
        const isDragonborn = selectedRaceName === 'Dragonborn';
        let selectedSubraceName = F.subrace().value;
        let selectedSubraceKey = '';
        let selectedSubraceAlias = '';
        const selectedTieflingVariantKeys = getSelectedTieflingVariantKeys();
        if (selectedSubraceName && selectedSubraceName.includes('||')) {
            const parts = selectedSubraceName.split('||');
            selectedSubraceKey = parts[0] || '';
            selectedSubraceAlias = parts[1] || '';
            selectedSubraceName = selectedSubraceAlias || selectedSubraceKey;
        } else if (selectedSubraceName) {
            selectedSubraceKey = selectedSubraceName;
        }
        const selectedBackgroundName = F.background().value;
        const bgData = selectedBackgroundName ? _backgroundsData.find(b => b.name === selectedBackgroundName) : null;
        const variantHuman = getVariantHumanSelection();
        const variantHumanFeatSelections = readVariantHumanFeatChoices();
        const selectedDraconicAncestry = isDragonborn ? String(selectedSubraceKey || selectedSubraceName || '').toLowerCase() : '';

        const aggregatedData = await getAggregatedRacialData(selectedRaceName, isDragonborn ? '' : selectedSubraceName, selectedTieflingVariantKeys);
        const classData = CLASS_DATA[selectedClassName] || { saves: [], hit_die: 8 };

        const lcn = F.alignmentLCN().value;
        const gne = F.alignmentGNE().value;
        let alignment;
        if (lcn === 'Neutral' && gne === 'Neutral') {
            alignment = 'True Neutral';
        } else {
            alignment = `${lcn} ${gne}`;
        }

        const rangerChoices = selectedClassName === 'Ranger' ? readRangerChoices() : null;

        const character = {
            name: F.name().value.trim(),
            player_name: F.player().value.trim(),
            gender: F.gender().value || '',
            class: selectedClassName,
            level: parseInt(F.level().value, 10) || 1,
            build: F.subclass().value || undefined,
            race: selectedRaceName,
            subrace: isDragonborn ? undefined : (selectedSubraceName || undefined),
            draconic_ancestry: selectedDraconicAncestry || undefined,
            race_detail: selectedDraconicAncestry ? { ancestry: selectedDraconicAncestry } : undefined,
            speed: aggregatedData.speed || 30,
            size: aggregatedData.size || 'Medium',
            background: F.background().value,
            alignment: alignment,
            deity: String(F.deity?.()?.value || '').trim() || undefined,
            eyes_hair: F.eyesHair().value.trim(),
            armor: [],
            abilities: {
                STR: (parseInt(F.str().value, 10) || 10) + (_currentRacialBonuses.str || 0),
                DEX: (parseInt(F.dex().value, 10) || 10) + (_currentRacialBonuses.dex || 0),
                CON: (parseInt(F.con().value, 10) || 10) + (_currentRacialBonuses.con || 0),
                INT: (parseInt(F.int().value, 10) || 10) + (_currentRacialBonuses.int || 0),
                WIS: (parseInt(F.wis().value, 10) || 10) + (_currentRacialBonuses.wis || 0),
                CHA: (parseInt(F.cha().value, 10) || 10) + (_currentRacialBonuses.cha || 0),
            },
            traits: aggregatedData.traits,
            proficiencies: { // For armor, weapons, tools
                armor: [],
                weapons: [],
                tools: []
            },
            skill_proficiencies: { // For skills and saves
                "saving throws": classData.saves,
                skills: []
            },            languages: [], spells: [],
            equipment: { weapons: [], gear: [] },
            coins: { pp: 0, gp: 0, sp: 0, cp: 0 },
            hit_die: `d${classData.hit_die}`,
            maxHP: 10,
            feats: [],
            characteristics: {
                trait: F.trait().value || '',
                ideal: F.ideal().value || '',
                bond: F.bond().value || '',
                flaw: F.flaw().value || '',
            },
            choices: {
                class: selectedClassName || '',
                subclass: F.subclass().value || '',
                race: selectedRaceName || '',
                subrace: isDragonborn ? '' : (selectedSubraceName || ''),
                subraceKey: selectedSubraceKey || '',
                subraceAlias: selectedSubraceAlias || '',
                draconicAncestry: selectedDraconicAncestry || '',
                raceVariantKeys: selectedTieflingVariantKeys,
                background: selectedBackgroundName || '',
                alignment: alignment,
                deity: String(F.deity?.()?.value || '').trim(),
                abilities: {
                    STR: parseInt(F.str().value, 10) || 10,
                    DEX: parseInt(F.dex().value, 10) || 10,
                    CON: parseInt(F.con().value, 10) || 10,
                    INT: parseInt(F.int().value, 10) || 10,
                    WIS: parseInt(F.wis().value, 10) || 10,
                    CHA: parseInt(F.cha().value, 10) || 10
                },
                abilityBonuses: { ..._currentRacialBonuses },
                languages: [],
                skills: [],
                tools: [],
                spells: [],
                racialCantrips: [],
                equipmentChoices: [],
                backgroundFeatures: [],
                backgroundChoices: [],
                raceTraits: [],
                classFeatures: [],
                subclassFeatures: [],
                classChoices: []
            }
        };
        if (selectedDraconicAncestry) {
            applyDragonbornAncestryDetails(character, selectedDraconicAncestry);
        }
        if (rangerChoices) {
            character.choices.rangerChoices = { ...rangerChoices };
        }
        if (selectedTieflingVariantKeys.length) {
            character.choices.raceVariants = selectedTieflingVariantKeys.slice();
        }
        const classChoiceMap = new Map();
        Array.from(document.querySelectorAll('.class-choice-select')).forEach(selectEl => {
            const value = String(selectEl.value || '').trim();
            if (!value) return;
            const choiceId = String(selectEl.dataset.choiceId || '').trim();
            if (!choiceId) return;
            const row = classChoiceMap.get(choiceId) || {
                level: character.level,
                choiceId,
                value: '',
                values: [],
                cantrips: []
            };
            row.values.push(value);
            if (!row.value) row.value = value;
            classChoiceMap.set(choiceId, row);
        });
        const classChoiceSelections = Array.from(classChoiceMap.values());
        if (classChoiceSelections.length) {
            character.choices.classChoices.push(...classChoiceSelections);
        }

        const subclassNameNow = String(F.subclass().value || '').trim();
        const subclassChoiceDefsById = new Map();
        if (selectedClassName && subclassNameNow) {
            const subclassData = (_subclassesData || []).find(s =>
                String(s?.class || '').toLowerCase() === String(selectedClassName || '').toLowerCase() &&
                String(s?.name || '').toLowerCase() === String(subclassNameNow || '').toLowerCase()
            );
            const byLevel = (subclassData?.choices && typeof subclassData.choices === 'object') ? subclassData.choices : {};
            Object.keys(byLevel).forEach(levelKey => {
                const n = Number(levelKey);
                if (!Number.isFinite(n) || n > Number(character.level || 1)) return;
                (Array.isArray(byLevel[levelKey]) ? byLevel[levelKey] : []).forEach(choice => {
                    const id = String(choice?.id || '').trim();
                    if (id) subclassChoiceDefsById.set(id, choice);
                });
            });
        }

        const subclassSpellChoices = [];
        const subclassCantripChoices = [];
        const subclassSkillChoices = [];
        const subclassLanguageChoices = [];
        const subclassToolChoices = [];
        classChoiceSelections.forEach(row => {
            const choiceId = String(row?.choiceId || '').trim();
            if (!choiceId.startsWith('choice:subclass:')) return;
            const parts = choiceId.split(':');
            const rawChoiceId = parts.slice(4).join(':');
            const choiceDef = subclassChoiceDefsById.get(rawChoiceId);
            if (!choiceDef) return;
            const type = String(choiceDef.type || '').toLowerCase();
            const picks = Array.isArray(row?.values) ? row.values.map(v => String(v || '').trim()).filter(Boolean) : [];
            if (type === 'spell') subclassSpellChoices.push(...picks);
            if (type === 'cantrip') subclassCantripChoices.push(...picks);
            if (type === 'skill') subclassSkillChoices.push(...picks);
            if (type === 'language') subclassLanguageChoices.push(...picks);
            if (type === 'tool') subclassToolChoices.push(...picks);
        });

        const maneuverChoices = classChoiceSelections
            .filter(row => /maneuver/i.test(String(row?.choiceId || '')))
            .flatMap(row => Array.isArray(row?.values) ? row.values : [])
            .map(v => String(v || '').trim())
            .filter(Boolean);
        if (maneuverChoices.length) {
            if (!Array.isArray(character.maneuvers)) character.maneuvers = [];
            maneuverChoices.forEach(maneuver => addUniqueCaseInsensitive(character.maneuvers, maneuver));
        }
        if (variantHuman.enabled) {
            character.choices.variantHuman = {
                enabled: true,
                asi: [variantHuman.asi1, variantHuman.asi2].filter(Boolean),
                skill: variantHuman.skill || '',
                feat: variantHuman.featName || '',
                featChoices: variantHumanFeatSelections
            };
            if (variantHuman.featName) {
                character.feats.push({
                    id: variantHuman.featId || '',
                    name: variantHuman.featName,
                    desc: variantHuman.featDesc || ''
                });
                if (!Array.isArray(character.choices.featChoices)) character.choices.featChoices = [];
                const featChoiceIds = Object.keys(variantHumanFeatSelections || {});
                if (featChoiceIds.length) {
                    character.choices.featChoices.push({
                        featId: variantHuman.featId || '',
                        featName: variantHuman.featName,
                        choices: variantHumanFeatSelections
                    });
                }
            }
        }

        // Re-assign characteristics from dropdowns, as they might be selected from suggestions
        if (_useBackgroundsV1 && bgData) {
            const traitChoice = getBackgroundChoiceByAward(bgData, 'personality_traits');
            const idealChoice = getBackgroundChoiceByAward(bgData, 'ideals');
            const bondChoice = getBackgroundChoiceByAward(bgData, 'bonds');
            const flawChoice = getBackgroundChoiceByAward(bgData, 'flaws');

            const traitCustom = getCustomChoiceValue(traitChoice?.id);
            const idealCustom = getCustomChoiceValue(idealChoice?.id);
            const bondCustom = getCustomChoiceValue(bondChoice?.id);
            const flawCustom = getCustomChoiceValue(flawChoice?.id);

            const traitItem = traitCustom ? null : getChoiceItemById(traitChoice, F.trait().value);
            const idealItem = idealCustom ? null : getChoiceItemById(idealChoice, F.ideal().value);
            const bondItem = bondCustom ? null : getChoiceItemById(bondChoice, F.bond().value);
            const flawItem = flawCustom ? null : getChoiceItemById(flawChoice, F.flaw().value);

            character.characteristics = {
                trait: traitCustom || traitItem?.text || '',
                ideal: idealCustom || idealItem?.desc || '',
                bond: bondCustom || bondItem?.text || '',
                flaw: flawCustom || flawItem?.text || ''
            };
        } else {
            character.characteristics = {
                trait: F.trait().value || '',
                ideal: F.ideal().value || '',
                bond: F.bond().value || '',
                flaw: F.flaw().value || '',
            };
        }

        if (selectedBackgroundName && bgData) {
            if (_useBackgroundsV1) {
                const featureIds = bgData?.grants?.features || [];
                const features = featureIds.map(id => (bgData.features || []).find(f => f.id === id)).filter(Boolean);
                character.traits.push(...features);
                character.choices.backgroundFeatures = features.map(f => ({
                    id: f.id || `background:${slugify(selectedBackgroundName)}:${slugify(f.name)}`,
                    name: f.name,
                    desc: f.desc || ''
                }));
            } else if (bgData?.features) {
                character.traits.push(...bgData.features);
                character.choices.backgroundFeatures = bgData.features.map(f => ({
                    id: f.id || `background:${slugify(selectedBackgroundName)}:${slugify(f.name)}`,
                    name: f.name,
                    desc: f.desc || ''
                }));
            }

            if (_useBackgroundsV1) {
                const selections = [];
                const bgChoiceIds = new Set((Array.isArray(bgData?.choices) ? bgData.choices : []).map(c => String(c?.id || '').trim()).filter(Boolean));
                document.querySelectorAll('select[data-choice-id]').forEach(selectEl => {
                    if (!selectEl.value) return;
                    const choiceId = selectEl.dataset.choiceId;
                    if (!bgChoiceIds.has(String(choiceId || '').trim())) return;
                    const itemId = selectEl.value;
                    const item = findBackgroundChoiceItem(bgData, itemId);
                    const label = item?.name || item?.text || item?.desc || selectEl.options?.[selectEl.selectedIndex]?.text || '';
                    selections.push({ choiceId, itemId, label });
                });
                document.querySelectorAll('input.choice-custom-input[data-choice-id]').forEach(input => {
                    const value = input.value.trim();
                    if (!value) return;
                    const choiceId = input.dataset.choiceId;
                    if (!bgChoiceIds.has(String(choiceId || '').trim())) return;
                    const itemId = `custom:${choiceId}:${slugify(value)}`;
                    selections.push({ choiceId, itemId, label: value, custom: true });
                });
                character.choices.backgroundChoices = selections;
                const specialtyRows = selections
                    .map(sel => {
                        const choiceDef = (bgData?.choices || []).find(c => String(c?.id || '') === String(sel.choiceId || ''));
                        const awards = choiceDef?.awards || {};
                        if (!Object.prototype.hasOwnProperty.call(awards, 'tags')) return null;
                        const prompt = String(choiceDef?.prompt || '').toLowerCase();
                        const prefix = prompt.includes('specialty') ? 'Specialty' : 'Background Tag';
                        return { name: `${prefix}: ${sel.label}`, desc: '', source: 'Background' };
                    })
                    .filter(Boolean);
                if (specialtyRows.length) {
                    character.traits.push(...specialtyRows);
                }
            }
        }

        // Record racial traits with IDs
        if (Array.isArray(aggregatedData.traits) && aggregatedData.traits.length) {
            character.choices.raceTraits = aggregatedData.traits.map(t => ({
                id: t.id || `race:${slugify(selectedRaceName)}:${slugify(t.name)}`,
                name: t.name,
                desc: t.desc || ''
            }));
        }

        const subclassName = F.subclass().value;
        const [classFeatures, subclassFeatures] = await Promise.all([
            global.getClassFeatures(selectedClassName, character.level),
            global.getSubclassFeatures(subclassName, selectedClassName, character.level)
        ]);

        let filteredClassFeatures = classFeatures;
        if (selectedClassName === 'Ranger' && rangerChoices) {
            if (rangerChoices.favoredChoice === 'favored-foe') {
                filteredClassFeatures = filteredClassFeatures.filter(f => String(f.name || '').toLowerCase() !== 'favored enemy');
            } else if (rangerChoices.favoredChoice === 'favored-enemy') {
                filteredClassFeatures = filteredClassFeatures.filter(f => String(f.name || '').toLowerCase() !== 'favored foe (optional)');
            }
            if (rangerChoices.terrainChoice === 'deft-explorer') {
                filteredClassFeatures = filteredClassFeatures.filter(f => String(f.name || '').toLowerCase() !== 'natural explorer');
            } else if (rangerChoices.terrainChoice === 'natural-explorer') {
                filteredClassFeatures = filteredClassFeatures.filter(f => String(f.name || '').toLowerCase() !== 'deft explorer (optional)');
            }
        }

        for (const feature of [...filteredClassFeatures, ...subclassFeatures]) {
            if (!global.isNoiseFeature(feature)) {
                character.traits.push({ name: feature.name, desc: feature.desc });
                const isSubclass = feature.source?.toLowerCase().includes('subclass');
                const kind = isSubclass ? 'subclass' : 'class';
                const level = levelFromSource(feature.source, kind);
                let id = feature.id || '';
                if (!id) {
                    const owner = isSubclass ? (F.subclass().value || '') : selectedClassName;
                    const ownerSlug = slugify(owner);
                    const lvl = level || '0';
                    id = `${kind}:${ownerSlug}:lvl${lvl}:${slugify(feature.name)}`;
                }
                if (isSubclass) {
                    character.choices.subclassFeatures.push({ id, name: feature.name });
                } else {
                    character.choices.classFeatures.push({ id, name: feature.name });
                }
            }
        }

        const finalLanguages = new Set((aggregatedData.languages || [])
            .map(l => (typeof l === 'string' ? l : l?.name))
            .filter(Boolean));
        if (String(selectedRaceName || '').toLowerCase() === 'dragonborn') {
            finalLanguages.add('Common');
            finalLanguages.add('Draconic');
        }
        if (selectedClassName === 'Ranger' && rangerChoices?.favoredChoice === 'favored-enemy' && rangerChoices.favoredEnemyLanguage) {
            finalLanguages.add(rangerChoices.favoredEnemyLanguage);
        }
        if (selectedClassName === 'Ranger' && rangerChoices?.terrainChoice === 'deft-explorer') {
            if (rangerChoices.cannyLanguage1) finalLanguages.add(rangerChoices.cannyLanguage1);
            if (rangerChoices.cannyLanguage2) finalLanguages.add(rangerChoices.cannyLanguage2);
        }
        if (selectedBackgroundName && bgData) {
            if (_useBackgroundsV1) {
                (bgData?.grants?.languages || []).forEach(lang => finalLanguages.add(lang));
            } else if (bgData?.proficiencies?.languages) {
                bgData.proficiencies.languages.forEach(langEntry => {
                    if (typeof langEntry === 'string') {
                        finalLanguages.add(langEntry);
                    }
                });
            }
        }
        if (finalLanguages.size === 0) finalLanguages.add('Common');
        subclassLanguageChoices.forEach(lang => finalLanguages.add(lang));
        F.languageChoicesContainer().querySelectorAll('.language-choice-select').forEach(select => {
            if (select.value) finalLanguages.add(select.value);
        });
        character.languages = [...finalLanguages].sort();
        character.choices.languages = Array.from(finalLanguages).sort();

        const finalSkills = new Set((character.skill_proficiencies.skills || []));
        (aggregatedData.proficiencies?.skills || []).forEach(s => finalSkills.add(s));
        (aggregatedData.starting_proficiencies || []).forEach(p => {
            if (p.name?.startsWith('Skill: ')) finalSkills.add(p.name.replace('Skill: ', ''));
        });
        if (selectedBackgroundName && bgData) {
            if (_useBackgroundsV1) {
                (bgData?.grants?.skills || []).forEach(s => finalSkills.add(s));
            } else {
                let bgDataLegacy = bgData;
                if (bgDataLegacy?.slug && !bgDataLegacy.skill_proficiencies && !bgDataLegacy.proficiencies) {
                    try { bgDataLegacy = await fetch(`https://api.open5e.com/v1/backgrounds/${bgDataLegacy.slug}/`).then(res => res.json()); } catch(e) {}
                }
                if (bgDataLegacy?.proficiencies?.skills) {
                    bgDataLegacy.proficiencies.skills.forEach(s => {
                        if (typeof s === 'string') finalSkills.add(s);
                    });
                } else {
                    (bgDataLegacy?.skill_proficiencies || '').split(', ').forEach(s => finalSkills.add(s.trim()));
                }
            }
        }
        // Add skills from both class and background choices
        document.querySelectorAll('.skill-choice-select').forEach(s => { 
            if (s.value) {
                finalSkills.add(s.value);
            }
        });
        if (variantHuman.enabled && variantHuman.skill) {
            finalSkills.add(variantHuman.skill);
        }
        subclassSkillChoices.forEach(skill => finalSkills.add(skill));
        character.skill_proficiencies.skills = [...finalSkills];
        character.choices.skills = [...finalSkills];

        const finalTools = new Set();
        (aggregatedData.proficiencies?.tools || []).forEach(t => finalTools.add(t));
        const defaultClassTools = DEFAULT_CLASS_TOOL_GRANTS[String(selectedClassName || '').trim().toLowerCase()] || [];
        defaultClassTools.forEach(t => finalTools.add(t));
        if (selectedBackgroundName && bgData) {
            if (_useBackgroundsV1) {
                (bgData?.grants?.tools || []).forEach(t => finalTools.add(t));
            } else {
                let bgDataLegacy = bgData;
                if (bgDataLegacy?.slug && !bgDataLegacy.tool_proficiencies && !bgDataLegacy.proficiencies) {
                    try { bgDataLegacy = await fetch(`https://api.open5e.com/v1/backgrounds/${bgDataLegacy.slug}/`).then(res => res.json()); } catch(e) {}
                }
                if (bgDataLegacy?.proficiencies?.tools) {
                    bgDataLegacy.proficiencies.tools.forEach(t => {
                        if (typeof t === 'string') finalTools.add(t);
                    });
                } else {
                    (bgDataLegacy?.tool_proficiencies || '').split(', ').forEach(t => finalTools.add(t.trim()));
                }
            }
        }
        F.toolChoicesContainer().querySelectorAll('.tool-choice-select').forEach(s => { if (s.value) finalTools.add(s.value); });
        subclassToolChoices.forEach(tool => finalTools.add(tool));
        character.proficiencies.tools = [...finalTools];
        character.choices.tools = [...finalTools];

        const finalSpells = new Set();
        const alwaysKnownSpells = racialSpells(aggregatedData, character.level);
        const subclassKnownSpells = subclassGrantedSpells(selectedClassName, F.subclass().value, character.level);
        alwaysKnownSpells.cantrips.forEach(s => finalSpells.add(s.name));
        alwaysKnownSpells.leveled.forEach(s => finalSpells.add(s.name));
        subclassKnownSpells.cantrips.forEach(s => finalSpells.add(s.name));
        subclassKnownSpells.leveled.forEach(s => finalSpells.add(s.name));
        subclassCantripChoices.forEach(name => finalSpells.add(name));
        subclassSpellChoices.forEach(name => finalSpells.add(name));
        document.querySelectorAll('.spell-choice-select').forEach(s => { if (s.value) finalSpells.add(s.value); });
        // Use getSpellDisplayName to ensure iconic names are saved if desired, or just use s.value for SRD names
        character.spells = [...finalSpells].map(srdName => getSpellDisplayName(srdName));
        character.choices.spells = [...finalSpells].map(srdName => getSpellDisplayName(srdName));
        const racialCantrips = [];
        document.querySelectorAll('.racial-cantrip-select').forEach(s => { if (s.value) racialCantrips.push(getSpellDisplayName(s.value)); });
        if (racialCantrips.length) {
            character.choices.racialCantrips = racialCantrips;
        }
        const abilityFromClass = {
            wizard: 'INT',
            artificer: 'INT',
            cleric: 'WIS',
            druid: 'WIS',
            ranger: 'WIS',
            paladin: 'CHA',
            bard: 'CHA',
            sorcerer: 'CHA',
            warlock: 'CHA'
        };
        character.spellSources = character.spellSources || {};
        alwaysKnownSpells.cantrips.forEach(s => { if (s?.name) character.spellSources[getSpellDisplayName(s.name)] = 'Race'; });
        alwaysKnownSpells.leveled.forEach(s => { if (s?.name) character.spellSources[getSpellDisplayName(s.name)] = 'Race'; });
        const subclassBadge = getSubclassLabel(selectedClassName).replace(/^.*\s/, '') || 'Subclass';
        subclassKnownSpells.cantrips.forEach(s => { if (s?.name) character.spellSources[getSpellDisplayName(s.name)] = subclassBadge; });
        subclassKnownSpells.leveled.forEach(s => { if (s?.name) character.spellSources[getSpellDisplayName(s.name)] = subclassBadge; });
        if (racialCantrips.length && aggregatedData?.cantrip_options?.class) {
            const ab = abilityFromClass[String(aggregatedData.cantrip_options.class).toLowerCase()];
            if (ab) {
                character.spellCastingAbilityOverrides = character.spellCastingAbilityOverrides || {};
                racialCantrips.forEach(name => { character.spellCastingAbilityOverrides[name] = ab; });
            }
        }

        const finalArmor = new Set();
        const finalWeapons = new Set();
        let fullClassData = _classesData.find(c => c.name === selectedClassName);
        if (fullClassData?.url && !fullClassData.proficiencies) {
            try { fullClassData = await fetch(`https://www.dnd5eapi.co${fullClassData.url}`).then(res => res.json()); } catch(e) {}
        }
        (fullClassData?.proficiencies || []).forEach(p => {
            const raw = String(p?.name || '').trim();
            if (raw.includes('Armor')) finalArmor.add(raw.replace(/^Armor:\s*/i, '').trim());
            else if (raw.includes('Weapon')) finalWeapons.add(raw.replace(/^Weapon:\s*/i, '').trim());
        });
        (aggregatedData.starting_proficiencies || []).forEach(p => {
            const raw = String(p?.name || '').trim();
            if (raw.includes('Armor')) finalArmor.add(raw.replace(/^Armor:\s*/i, '').trim());
            else if (raw.includes('Weapon')) finalWeapons.add(raw.replace(/^Weapon:\s*/i, '').trim());
        });
        character.proficiencies.armor = [...finalArmor];
        character.proficiencies.weapons = [...finalWeapons];
        if (variantHuman.enabled && variantHuman.featDef) {
            applyFeatEffectsToCharacter(character, variantHuman.featDef, variantHumanFeatSelections);
            if (Array.isArray(character.skill_proficiencies?.skills)) {
                character.choices.skills = [...new Set(character.skill_proficiencies.skills)];
            }
            if (Array.isArray(character.proficiencies?.tools)) {
                character.choices.tools = [...new Set(character.proficiencies.tools)];
            }
            if (Array.isArray(character.languages)) {
                character.choices.languages = [...new Set(character.languages)];
            }
            if (Array.isArray(character.spells)) {
                character.choices.spells = [...new Set(character.spells)];
            }
        }

        // --- Equipment ---
        const allEquipmentItems = [];

        // 1. Granted Class Equipment
        if (fullClassData?.url && !fullClassData.starting_equipment) {
            try {
                const fetchedData = await fetch(`https://www.dnd5eapi.co${fullClassData.url}`).then(res => res.json());
                fullClassData = { ...fullClassData, ...fetchedData };
            } catch(e) { console.error("Failed to fetch full class data for equipment", e); }
        }
        
        (fullClassData?.starting_equipment || []).forEach(item => {
            allEquipmentItems.push({ name: item.equipment.name, quantity: item.quantity });
        });

        // 2. Chosen Class Equipment
        const choiceBlocks = document.querySelectorAll('.equipment-choice-block');
        const collectEquipmentFromOption = (optionData, optionRootEl, path, collectedItems, selectedNames) => {
            if (!optionData || typeof optionData !== 'object') return;
            const optionType = String(optionData.option_type || '').toLowerCase();
            if (optionType === 'counted_reference' && optionData.of?.name) {
                const count = Number(optionData.count || 1) || 1;
                collectedItems.push({ name: optionData.of.name, quantity: count });
                selectedNames.push(optionData.of.name);
                return;
            }
            if (optionType === 'reference' && optionData.item?.name) {
                collectedItems.push({ name: optionData.item.name, quantity: 1 });
                selectedNames.push(optionData.item.name);
                return;
            }
            if (optionType === 'choice') {
                if (!optionRootEl) return;
                const selects = Array.from(optionRootEl.querySelectorAll(`.equipment-sub-choice-select[data-choice-path="${path}"]`));
                selects.forEach(select => {
                    const value = String(select.value || '').trim();
                    if (!value) return;
                    collectedItems.push({ name: value, quantity: 1 });
                    selectedNames.push(value);
                });
                return;
            }
            if (optionType === 'multiple' && Array.isArray(optionData.items)) {
                optionData.items.forEach((item, idx) => {
                    collectEquipmentFromOption(item, optionRootEl, `${path}.items[${idx}]`, collectedItems, selectedNames);
                });
            }
        };
        if (fullClassData?.starting_equipment_options) {
            choiceBlocks.forEach((block, blockIndex) => {
                const radio = block.querySelector('input[type="radio"]:checked');
                if (!radio) return;

                const optionIndex = parseInt(radio.value, 10);
                const choiceBlockData = fullClassData.starting_equipment_options[blockIndex];
                const selectedOptionData = choiceBlockData?.from.options[optionIndex];

                if (!selectedOptionData) return;

                const chosen = [];
                collectEquipmentFromOption(selectedOptionData, radio.closest('.equipment-option'), 'opt', allEquipmentItems, chosen);
                character.choices.equipmentChoices.push({ block: blockIndex, option: optionIndex, items: chosen });
            });
        }

        // 3. Background Equipment (added as strings to be parsed by sheet)
        if (selectedBackgroundName && bgData) {
            const baseItems = _useBackgroundsV1 ? (bgData?.grants?.equipment || []) : (bgData?.equipment || []);
            baseItems.forEach(itemStr => {
                const coinMatch = itemStr.match(/(\d+)\s*(gp|sp|cp|pp)/i);
                if (coinMatch) {
                    character.coins[coinMatch[2].toLowerCase()] += parseInt(coinMatch[1], 10);
                } else {
                    allEquipmentItems.push({ name: itemStr, quantity: 1 });
                }
            });

            if (_useBackgroundsV1) {
                const equipmentChoiceIds = new Set(getBackgroundChoicesByAward(bgData, 'equipment').map(c => c.id));
                (character.choices.backgroundChoices || []).forEach(sel => {
                    if (!equipmentChoiceIds.has(sel.choiceId)) return;
                    const name = sel.label || '';
                    if (!name) return;
                    allEquipmentItems.push({ name, quantity: 1 });
                });
            }
        }

        // 4. Categorize and add to character object
        for (const item of allEquipmentItems) {
            const itemDetails = await global.getEquipmentByName(item.name);
            const category = String(itemDetails?.equipment_category?.index || '').toLowerCase();
            const equipSlot = String(itemDetails?.equip_slot || '').toLowerCase();
            const hasWeapon = (name) => character.equipment.weapons
                .some(w => String(w || '').toLowerCase() === String(name || '').toLowerCase());
            const hasArmor = (name) => character.armor
                .some(a => String(a || '').toLowerCase() === String(name || '').toLowerCase());

            if (category === 'weapon' || equipSlot === 'weapon') {
                if (!hasWeapon(item.name)) character.equipment.weapons.push(item.name);
            } else if (category === 'armor' || category === 'shield' || equipSlot === 'armor' || equipSlot === 'shield') {
                if (!hasArmor(item.name)) character.armor.push(item.name);
            } else {
                character.equipment.gear.push({ name: item.name, qty: item.quantity });
            }
        }

        const conMod = Math.floor((character.abilities.CON - 10) / 2);
        const avgHitDie = (classData.hit_die / 2) + 1;
        let maxHP = classData.hit_die + conMod + ((character.level - 1) * (avgHitDie + conMod));

        // Check for Dwarven Toughness
        if (character.traits.some(t => t.name === "Dwarven Toughness")) {
            maxHP += character.level;
        }

        character.maxHP = maxHP;
        character.currentHP = maxHP;

        return character;
    }

    async function handleEquipmentChoice(event) {
        const radio = event.target;
        if (radio.type !== 'radio' || !radio.name.startsWith('equip-choice-')) return;

        const blockEl = radio.closest('.equipment-choice-block');
        if (!blockEl) return;

        // Clear any existing sub-choices in this block
        blockEl.querySelectorAll('.equipment-sub-choice').forEach(el => el.remove());

        const blockIndex = parseInt(radio.name.replace('equip-choice-', ''), 10);
        const optionIndex = parseInt(radio.value, 10);

        const className = F.class().value;
        if (!className) return;

        let classData = _classesData.find(c => c.name === className);
        if (!classData) return;
        // Ensure full data is loaded
        if (classData.url && !classData.starting_equipment_options) {
            try {
                const fullData = await fetch(`https://www.dnd5eapi.co${classData.url}`).then(res => res.json());
                classData = { ...classData, ...fullData };
            } catch (err) {
                console.error(`Failed to fetch full class data for equipment choices: ${className}`);
                return;
            }
        }
        if (!classData.starting_equipment_options) return;

        const choiceBlockData = classData.starting_equipment_options[blockIndex];
        const selectedOptionData = choiceBlockData?.from.options[optionIndex];
        if (!selectedOptionData) return;

        const collectChoiceNodes = (optionData, path, nodes) => {
            if (!optionData || typeof optionData !== 'object') return;
            const optionType = String(optionData.option_type || '').toLowerCase();
            if (optionType === 'choice' && optionData.choice) {
                nodes.push({ choice: optionData.choice, path });
                return;
            }
            if (optionType === 'multiple' && Array.isArray(optionData.items)) {
                optionData.items.forEach((item, idx) => collectChoiceNodes(item, `${path}.items[${idx}]`, nodes));
            }
        };

        const loadChoiceItems = async (choiceData) => {
            const categoryUrl = choiceData?.from?.equipment_category?.url;
            const categoryName = String(choiceData?.from?.equipment_category?.name || '').toLowerCase();
            const categoryKey = String(categoryUrl || choiceData?.from?.equipment_category?.index || '').toLowerCase();
            const localMatchesCategory = (item) => {
                const weaponCategory = String(item?.weapon_category || '').toLowerCase();
                const weaponRange = String(item?.weapon_range || '').toLowerCase();
                const categoryRange = String(item?.category_range || '').toLowerCase();
                const equipCatIdx = String(item?.equipment_category?.index || '').toLowerCase();
                if (categoryKey.includes('simple-melee-weapons')) {
                    return weaponCategory.includes('simple') && (weaponRange === 'melee' || categoryRange.includes('melee'));
                }
                if (categoryKey.includes('simple-ranged-weapons')) {
                    return weaponCategory.includes('simple') && (weaponRange === 'ranged' || categoryRange.includes('ranged'));
                }
                if (categoryKey.includes('simple-weapons')) {
                    return weaponCategory.includes('simple');
                }
                if (categoryKey.includes('martial-melee-weapons')) {
                    return weaponCategory.includes('martial') && (weaponRange === 'melee' || categoryRange.includes('melee'));
                }
                if (categoryKey.includes('martial-ranged-weapons')) {
                    return weaponCategory.includes('martial') && (weaponRange === 'ranged' || categoryRange.includes('ranged'));
                }
                if (categoryKey.includes('martial-weapons')) {
                    return weaponCategory.includes('martial');
                }
                if (categoryKey.includes('weapon') || categoryName.includes('weapon')) {
                    return equipCatIdx === 'weapon' || !!weaponCategory;
                }
                return false;
            };
            if (categoryUrl) {
                let items = [];
                try {
                    const categoryData = await fetch(`https://www.dnd5eapi.co${categoryUrl}`).then(res => res.json());
                    items = Array.isArray(categoryData?.equipment) ? categoryData.equipment.slice() : [];
                } catch (err) {
                    console.error(`Failed to load equipment category: ${categoryUrl}`, err);
                }
                try {
                    const legacy = await loadLegacyEquipmentItems();
                    const extras = legacy
                        .filter(localMatchesCategory)
                        .map(i => ({ index: String(i?.index || i?.key || i?.name || ''), name: String(i?.name || '') }))
                        .filter(i => !!i.name);
                    const seen = new Set(items.map(i => String(i?.name || '').toLowerCase()));
                    extras.forEach(it => {
                        const key = String(it.name || '').toLowerCase();
                        if (!key || seen.has(key)) return;
                        seen.add(key);
                        items.push(it);
                    });
                } catch (_) {}
                return items;
            }
            if (Array.isArray(choiceData?.from?.options)) {
                return choiceData.from.options.map(opt => opt.of || opt.item).filter(Boolean);
            }
            return [];
        };

        const choiceNodes = [];
        collectChoiceNodes(selectedOptionData, 'opt', choiceNodes);
        if (!choiceNodes.length) return;

        const optionLabel = radio.closest('.equipment-option');
        if (!optionLabel) return;

        for (const node of choiceNodes) {
            const items = await loadChoiceItems(node.choice);
            if (!items.length) continue;
            const subChoiceContainer = document.createElement('div');
            subChoiceContainer.className = 'equipment-sub-choice';
            subChoiceContainer.dataset.choicePath = node.path;

            const prompt = String(node.choice?.desc || '').trim();
            if (prompt) {
                const promptEl = document.createElement('div');
                promptEl.className = 'equipment-sub-choice-label';
                promptEl.textContent = prompt;
                subChoiceContainer.appendChild(promptEl);
            }

            for (let i = 0; i < (Number(node.choice.choose || 1) || 1); i++) {
                const select = document.createElement('select');
                select.className = 'equipment-sub-choice-select';
                select.dataset.choicePath = node.path;
                select.innerHTML = `<option value="">-- Choose item ${i + 1} --</option>` +
                    items.map(item => `<option value="${item.name}">${item.name}</option>`).join('');
                subChoiceContainer.appendChild(select);
            }
            optionLabel.appendChild(subChoiceContainer);
        }
    }

    function handleEquipmentSubChoiceChange(event) {
        const select = event.target;
        // Only act on the sub-choice dropdowns
        if (!select.classList.contains('equipment-sub-choice-select')) return;

        const subChoiceContainer = select.closest('.equipment-sub-choice');
        if (!subChoiceContainer) return;

        // Get all dropdowns in this group
        const allSelects = Array.from(subChoiceContainer.querySelectorAll('.equipment-sub-choice-select'));
        
        // Collect all currently selected (non-empty) values
        const selectedValues = new Set();
        allSelects.forEach(s => {
            if (s.value) {
                selectedValues.add(s.value);
            }
        });

        // Disable selected options in other dropdowns
        allSelects.forEach(s => {
            Array.from(s.options).forEach(opt => {
                // An option should be disabled if its value is in the selected set,
                // but it's not the value for the current dropdown we're looking at.
                opt.disabled = opt.value && selectedValues.has(opt.value) && opt.value !== s.value;
            });
        });
    }

    function updateCharacteristics(backgroundData) {
        const populateFromChoice = (selectEl, choice, type) => {
            if (!selectEl) return;
            selectEl.dataset.choiceId = choice?.id || '';
            if (!choice) {
                selectEl.innerHTML = '<option value="">-- No suggestions --</option>';
                selectEl.disabled = true;
                return;
            }
            const options = [];
            (choice.from || []).forEach(item => {
                if (!item || typeof item !== 'object') return;
                if (type === 'ideal') {
                    options.push({ id: item.id, label: `${item.name}: ${item.desc}` });
                } else {
                    options.push({ id: item.id, label: item.text || item.name || '' });
                }
            });
            selectEl.disabled = options.length === 0;
            const optionsHtml = options.length === 0
                ? '<option value="">-- No suggestions --</option>'
                : '<option value="">-- Select one --</option>' +
                  options.map(opt => `<option value="${opt.id}">${opt.label}</option>`).join('');
            selectEl.innerHTML = optionsHtml;
        };

        if (_useBackgroundsV1 && backgroundData?.choices) {
            const traitChoice = getBackgroundChoiceByAward(backgroundData, 'personality_traits');
            const idealChoice = getBackgroundChoiceByAward(backgroundData, 'ideals');
            const bondChoice = getBackgroundChoiceByAward(backgroundData, 'bonds');
            const flawChoice = getBackgroundChoiceByAward(backgroundData, 'flaws');
            const hasCharacteristicChoices = !!(traitChoice || idealChoice || bondChoice || flawChoice);

            const ensureCustomInput = (selectEl, choice, placeholder) => {
                if (!selectEl) return;
                const group = selectEl.closest('.characteristic-group');
                if (!group) return;
                let input = group.querySelector('.characteristic-custom-input');
                if (choice?.allow_custom) {
                    if (!input) {
                        input = document.createElement('input');
                        input.type = 'text';
                        input.className = 'characteristic-custom-input choice-custom-input';
                        input.addEventListener('input', () => {
                            if (input.value.trim()) selectEl.value = '';
                        });
                        group.appendChild(input);
                    }
                    input.dataset.choiceId = choice.id || '';
                    input.placeholder = placeholder;
                } else if (input) {
                    input.remove();
                }
            };

            populateFromChoice(F.trait(), traitChoice, 'text');
            ensureCustomInput(F.trait(), traitChoice, 'Custom personality trait');

            populateFromChoice(F.ideal(), idealChoice, 'ideal');
            ensureCustomInput(F.ideal(), idealChoice, 'Custom ideal');

            populateFromChoice(F.bond(), bondChoice, 'text');
            ensureCustomInput(F.bond(), bondChoice, 'Custom bond');

            if (hasCharacteristicChoices) {
                populateFromChoice(F.flaw(), flawChoice, 'text');
                ensureCustomInput(F.flaw(), flawChoice, 'Custom flaw');
                return;
            }
        }

        const canonicalBackground = (_backgroundsCanonicalData || []).find(b =>
            String(b?.name || '').trim().toLowerCase() === String(backgroundData?.name || '').trim().toLowerCase()
        );
        const characteristics = backgroundData?.suggested_characteristics
            || canonicalBackground?.suggested_characteristics
            || {};
        const traits = characteristics.personality_traits || [];
        const ideals = characteristics.ideals || [];
        const bonds = characteristics.bonds || [];
        const flaws = characteristics.flaws || [];

        const populate = (selectEl, options, isObject = false) => {
            if (!selectEl) return;
            if (options.length === 0) {
                selectEl.innerHTML = '<option value="">-- No suggestions --</option>';
                selectEl.disabled = true;
                return;
            }
            selectEl.disabled = false;
            let optionsHtml = '<option value="">-- Select one --</option>';
            if (isObject) {
                optionsHtml += options.map(opt => `<option value="${opt.desc}">${opt.name}: ${opt.desc}</option>`).join('');
            } else {
                optionsHtml += options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
            }
            selectEl.innerHTML = optionsHtml;
        };

        populate(F.trait(), traits);
        populate(F.ideal(), ideals, true);
        populate(F.bond(), bonds);
        populate(F.flaw(), flaws);
    }

    function handleRandomCharacteristic(selectEl) {
        if (!selectEl || selectEl.options.length <= 1) return; // <=1 to account for placeholder
        const randomIndex = Math.floor(Math.random() * (selectEl.options.length - 1)) + 1;
        selectEl.selectedIndex = randomIndex;
    }

    function debounce(fn, delayMs = 120) {
        let timer = null;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delayMs);
        };
    }

    function renderBackgroundChoices(backgroundData) {
        const container = F.backgroundChoicesContainer();
        if (!container) return;
        container.innerHTML = '';

        if (!_useBackgroundsV1 || !backgroundData?.choices) {
            return;
        }

        const skipAwards = new Set([
            'skills', 'tools', 'languages', 'personality_traits', 'ideals', 'bonds', 'flaws'
        ]);

        backgroundData.choices.forEach(choice => {
            const awards = choice?.awards ? Object.keys(choice.awards) : [];
            if (awards.some(a => skipAwards.has(a))) return;

            const max = choice?.choose?.max || 0;
            if (!max) return;

            const options = buildChoiceOptions(choice);
            if (!options.length) return;

            const group = document.createElement('div');
            group.className = 'form-group background-choice-group';
            const label = document.createElement('label');
            label.textContent = choice.prompt || 'Background Choice';
            group.appendChild(label);

            for (let i = 0; i < max; i++) {
                const select = document.createElement('select');
                select.className = 'background-choice-select';
                select.dataset.choiceId = choice.id || '';
                select.innerHTML = `<option value="">-- Select --</option>` +
                    options.map(opt => `<option value="${opt.id}" data-choice-label="${opt.label}">${opt.label}</option>`).join('');
                group.appendChild(select);
            }

            if (choice.allow_custom) {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'background-custom-input choice-custom-input';
                input.placeholder = 'Custom entry';
                input.dataset.choiceId = choice.id || '';
                input.addEventListener('input', () => {
                    if (!input.value.trim()) return;
                    group.querySelectorAll('select').forEach(sel => { sel.value = ''; });
                });
                group.appendChild(input);
            }

            container.appendChild(group);
        });
    }

    async function renderClassChoices(className, level) {
        const container = F.classChoicesContainer();
        if (!container) return;
        container.innerHTML = '';

        if (!className || level < 1) return;
        const classData = _classesData.find(c => c.name === className);
        const classChoicesMeta = classData?.choices || {};
        const slug = slugify(className);

        const levelVal = Number(level) || 1;
        const choiceLevels = (entry) => {
            if (!entry || typeof entry !== 'object') return [];
            if (Array.isArray(entry.levels)) return entry.levels.map(v => Number(v)).filter(Number.isFinite);
            if (entry.level != null) {
                const n = Number(entry.level);
                return Number.isFinite(n) ? [n] : [];
            }
            return [];
        };
        const choiceCountAtLevel = (entry, fallback = 1) => {
            if (!entry || typeof entry !== 'object') return fallback;
            const pbl = entry.picksByLevel && typeof entry.picksByLevel === 'object' ? Number(entry.picksByLevel[String(levelVal)]) : NaN;
            if (Number.isFinite(pbl) && pbl > 0) return pbl;
            const cbl = entry.countByLevel && typeof entry.countByLevel === 'object' ? Number(entry.countByLevel[String(levelVal)]) : NaN;
            if (Number.isFinite(cbl) && cbl > 0) return cbl;
            const picks = Number(entry.picks);
            if (Number.isFinite(picks) && picks > 0) return picks;
            const choose = Number(entry.choose);
            if (Number.isFinite(choose) && choose > 0) return choose;
            return fallback;
        };
        const getSubclassChoiceOptions = (choice) => {
            const type = String(choice?.type || '').toLowerCase();
            const options = Array.isArray(choice?.options) ? choice.options : [];
            if (type === 'skill') return options.length ? options : SKILL_LIST.slice();
            if (type === 'language') return options.length ? options : asUniqueSorted(_allLanguagesData.map(l => String(l?.name || '').trim()).filter(Boolean));
            if (type === 'tool') return options.length ? options : asUniqueSorted(_allToolsData || []);
            if (type === 'cantrip' || type === 'spell') {
                const inferSpellList = () => {
                    const fromSourceList = String(choice?.sourceList || '').trim();
                    if (fromSourceList) return fromSourceList;
                    const fromOptions = options.map(o => String(o || '')).join(' ');
                    const notes = String(choice?.notes || '');
                    const blob = `${fromOptions} ${notes}`.toLowerCase();
                    const m = blob.match(/(artificer|bard|cleric|druid|paladin|ranger|sorcerer|warlock|wizard)\s+spell\s+list/);
                    if (m?.[1]) return m[1];
                    const m2 = blob.match(/(artificer|bard|cleric|druid|paladin|ranger|sorcerer|warlock|wizard)\s+cantrips?/);
                    if (m2?.[1]) return m2[1];
                    return '';
                };
                const listName = String(inferSpellList() || '').trim().toLowerCase();
                const parsedLevel = parseLevelFromNotes(choice?.notes);
                const spellLevel = (type === 'cantrip') ? 0 : (Number.isFinite(parsedLevel) ? parsedLevel : 1);
                const spellRows = (_allSpellsData || [])
                    .filter(s => Number(s?.level ?? s?.level_int ?? -1) === spellLevel)
                    .filter(s => {
                        if (!listName) return true;
                        const classes = Array.isArray(s?.classes) ? s.classes : [];
                        return classes.some(c => String(c || '').trim().toLowerCase() === listName);
                    })
                    .map(s => {
                        const name = String(s?.name || '').trim();
                        const school = String(s?.school?.name || s?.school || '').trim();
                        const firstLine = String(s?.description || s?.desc || '').split('\n')[0].trim();
                        return {
                            value: name,
                            label: name,
                            desc: [school ? `School: ${school}.` : '', firstLine].filter(Boolean).join(' ')
                        };
                    })
                    .filter(row => !!row.value);
                if (spellRows.length) return spellRows;
                // Fallback for malformed data where only text placeholders are present.
                return options.filter(Boolean).map(v => ({ value: String(v), label: String(v), desc: '' }));
            }
            if (options.length) return options;
            return [];
        };
        const FIGHTING_STYLE_DESCRIPTIONS = {
            'archery': 'You gain a +2 bonus to attack rolls you make with ranged weapons.',
            'defense': 'While you are wearing armor, you gain a +1 bonus to AC.',
            'dueling': 'When you are wielding a melee weapon in one hand and no other weapons, you gain a +2 bonus to damage rolls with that weapon.',
            'great weapon fighting': 'When you roll 1 or 2 on a damage die for an attack with a two-handed or versatile melee weapon, reroll the die and use the new roll.',
            'protection': 'When a creature you can see attacks a target other than you within 5 feet, you can use your reaction to impose disadvantage. You must be wielding a shield.',
            'two-weapon fighting': 'You can add your ability modifier to the damage of the second attack when two-weapon fighting.',
            'blind fighting': 'You have blindsight with a range of 10 feet.',
            'interception': 'When a nearby target is hit, you can use your reaction to reduce damage by 1d10 + proficiency bonus (minimum 0). You must wield a shield or simple/martial weapon.',
            'superior technique': 'You learn one maneuver of your choice and gain one superiority die (d6), replenished on a short or long rest.',
            'thrown weapon fighting': 'You can draw a thrown weapon as part of the attack, and thrown weapon ranged hits gain +2 damage.',
            'unarmed fighting': 'Your unarmed strikes deal d6 damage (d8 if no weapon/shield), and at start of grappled creature’s turn it takes 1d4 bludgeoning damage.',
            'blessed warrior': 'You learn two cleric cantrips of your choice. They count as paladin spells for you.'
        };
        const toOptionRows = (options, descMap) => {
            const rows = [];
            const byValue = new Map();
            (Array.isArray(options) ? options : []).forEach(opt => {
                const value = String(
                    typeof opt === 'string'
                        ? opt
                        : (opt?.value || opt?.name || opt?.label || '')
                ).trim();
                if (!value) return;
                const label = String(typeof opt === 'string' ? opt : (opt?.label || opt?.name || opt?.value || value)).trim();
                const desc = String(
                    typeof opt === 'string'
                        ? (descMap?.[value.toLowerCase()] || '')
                        : (opt?.desc || opt?.description || opt?.notes || descMap?.[value.toLowerCase()] || '')
                ).trim();
                if (!byValue.has(value)) {
                    byValue.set(value, { value, label, desc });
                    rows.push(byValue.get(value));
                } else if (desc && !byValue.get(value).desc) {
                    byValue.get(value).desc = desc;
                }
            });
            rows.sort((a, b) => a.label.localeCompare(b.label));
            return rows;
        };
        const appendChoiceSelects = ({ title, choiceId, options, count = 1, required = true, notes = '' }) => {
            const optionRows = toOptionRows(options, title === 'Fighting Style' ? FIGHTING_STYLE_DESCRIPTIONS : null);
            if (!optionRows.length) return;
            const group = document.createElement('div');
            group.className = 'form-group';
            const titleSlug = slugify(`${choiceId || title}`);
            group.innerHTML = `<label>${title}</label>`;
            const max = Math.max(1, Number(count) || 1);
            for (let i = 0; i < max; i++) {
                const select = document.createElement('select');
                select.id = `builder-class-choice-${titleSlug}-${i}`;
                select.className = 'class-choice-select';
                select.dataset.choiceId = choiceId;
                select.dataset.required = required ? '1' : '0';
                const placeholder = document.createElement('option');
                placeholder.value = '';
                placeholder.textContent = '-- Select --';
                select.appendChild(placeholder);
                optionRows.forEach(row => {
                    const option = document.createElement('option');
                    option.value = row.value;
                    option.textContent = row.label;
                    if (row.desc) option.dataset.desc = row.desc;
                    if (row.desc) option.title = row.desc;
                    select.appendChild(option);
                });
                const help = document.createElement('div');
                help.className = 'class-choice-help';
                help.style.cssText = 'font-size: 0.85em; color: #5f6b7a; margin: 4px 0 6px;';
                const refreshHelp = () => {
                    const selected = select.options[select.selectedIndex];
                    const desc = String(selected?.dataset?.desc || '').trim();
                    help.textContent = desc || notes || '';
                };
                select.addEventListener('change', refreshHelp);
                refreshHelp();
                group.appendChild(select);
                group.appendChild(help);
            }
            if (notes && !group.querySelector('.class-choice-help')) {
                const note = document.createElement('div');
                note.className = 'help-text';
                note.style.cssText = 'font-size: 0.85em; color: #5f6b7a;';
                note.textContent = notes;
                group.appendChild(note);
            }
            container.appendChild(group);
        };

        const styleChoice = classChoicesMeta.fightingStyleChoice;
        if (styleChoice && choiceLevels(styleChoice).includes(levelVal)) {
            const idSuffix = slug === 'ranger' ? 'ranger_fighting_style' : 'fighting_style';
            appendChoiceSelects({
                title: 'Fighting Style',
                choiceId: `choice:class:${slug}:${idSuffix}`,
                options: styleChoice.options || [],
                count: 1,
                required: true
            });
        }

        const expertiseChoice = classChoicesMeta.expertiseChoice || classChoicesMeta.expertise;
        if (expertiseChoice && choiceLevels(expertiseChoice).includes(levelVal)) {
            const expertiseOptions = (() => {
                const raw = normalizeOptions(expertiseChoice.options || []);
                if (!raw.length) return SKILL_LIST.slice();
                const expanded = new Set();
                raw.forEach(option => {
                    const lower = option.toLowerCase();
                    if (lower.includes('any skill')) SKILL_LIST.forEach(skill => expanded.add(skill));
                    else if (lower.includes("thieves' tools")) expanded.add("Thieves' tools");
                    else expanded.add(option);
                });
                return Array.from(expanded);
            })();
            appendChoiceSelects({
                title: 'Expertise',
                choiceId: `choice:class:${slug}:expertise`,
                options: expertiseOptions,
                count: choiceCountAtLevel(expertiseChoice, 2),
                required: true
            });
        }

        const metamagicChoice = classChoicesMeta.metamagicChoice;
        if (metamagicChoice && choiceLevels(metamagicChoice).includes(levelVal)) {
            appendChoiceSelects({
                title: 'Metamagic',
                choiceId: `choice:class:${slug}:metamagic`,
                options: await loadBuilderMetamagicOptions(),
                count: choiceCountAtLevel(metamagicChoice, 1),
                required: true
            });
        }

        const invocationsChoice = classChoicesMeta.eldritchInvocationsChoice;
        if (invocationsChoice && choiceLevels(invocationsChoice).includes(levelVal)) {
            appendChoiceSelects({
                title: 'Eldritch Invocations',
                choiceId: `choice:class:${slug}:eldritch_invocations`,
                options: await loadBuilderInvocationOptions(),
                count: choiceCountAtLevel(invocationsChoice, 1),
                required: true
            });
        }

        const pactBoonChoice = classChoicesMeta.pactBoonChoice;
        if (pactBoonChoice && choiceLevels(pactBoonChoice).includes(levelVal)) {
            appendChoiceSelects({
                title: 'Pact Boon',
                choiceId: `choice:class:${slug}:pact_boon`,
                options: pactBoonChoice.options || [],
                count: 1,
                required: true
            });
        }

        const magicalSecrets = classChoicesMeta.magicalSecrets;
        if (magicalSecrets && choiceLevels(magicalSecrets).includes(levelVal)) {
            const count = Math.max(1, Number(magicalSecrets.spellsPerPick || 2) || 2);
            const maxLevel = global.DDRules?.getMaxSpellLevelFor?.({ class: className, level: levelVal }) || 9;
                const options = (_allSpellsData || [])
                    .filter(s => Number(s.level ?? s.level_int ?? 0) > 0)
                    .filter(s => Number(s.level ?? s.level_int ?? 0) <= maxLevel)
                    .map(s => {
                        const name = String(s.name || '').trim();
                        const desc = String(s.description || s.desc || '').trim().split('\n')[0];
                        return { value: name, label: `${name} (Lvl ${Number(s.level ?? s.level_int ?? 0)})`, desc };
                    });
                appendChoiceSelects({
                    title: 'Magical Secrets Spells',
                    choiceId: `choice:class:${slug}:magical_secrets`,
                    options,
                    count,
                required: true
            });
        }

        const mysticArcanum = classChoicesMeta.mysticArcanumChoice;
        if (mysticArcanum && choiceLevels(mysticArcanum).includes(levelVal)) {
            const entry = mysticArcanum.spellsByLevel?.[String(levelVal)] || {};
            const spellLevel = Number(entry.spellLevel || 0);
            const count = Math.max(1, Number(entry.picks || 1) || 1);
            if (spellLevel > 0) {
                const options = (_allSpellsData || [])
                    .filter(s => Number(s.level ?? s.level_int ?? 0) === spellLevel)
                    .filter(s => Array.isArray(s.classes) && s.classes.some(c => String(c || '').toLowerCase() === 'warlock'))
                    .map(s => {
                        const name = String(s.name || '').trim();
                        const desc = String(s.description || s.desc || '').trim().split('\n')[0];
                        return { value: name, label: name, desc };
                    });
                appendChoiceSelects({
                    title: `Mystic Arcanum (Level ${spellLevel})`,
                    choiceId: `choice:class:${slug}:mystic_arcanum_${spellLevel}`,
                    options,
                    count,
                    required: true
                });
            }
        }

        const subclassName = String(F.subclass()?.value || '').trim();
        if (subclassName) {
            const subclassData = (_subclassesData || []).find(s =>
                String(s?.class || '').toLowerCase() === String(className || '').toLowerCase() &&
                String(s?.name || '').toLowerCase() === String(subclassName || '').toLowerCase()
            );
            const subclassChoices = Array.isArray(subclassData?.choices?.[String(levelVal)])
                ? subclassData.choices[String(levelVal)]
                : [];
            subclassChoices.forEach(choice => {
                const options = getSubclassChoiceOptions(choice);
                if (!options.length) return;
                const title = String(choice?.name || 'Subclass Choice').trim();
                const choiceKey = String(choice?.id || slugify(title)).trim();
                const count = choiceCountAtLevel(choice, Number(choice?.count || choice?.choose || 1) || 1);
                appendChoiceSelects({
                    title,
                    choiceId: `choice:subclass:${slugify(className)}:${slugify(subclassName)}:${choiceKey}`,
                    options,
                    count,
                    required: true,
                    notes: String(choice?.notes || '').trim()
                });
            });
        }

        const syncDistinctByChoiceId = () => {
            const all = Array.from(container.querySelectorAll('.class-choice-select'));
            const byChoice = new Map();
            all.forEach(sel => {
                const cid = String(sel.dataset.choiceId || '').trim();
                if (!cid) return;
                const list = byChoice.get(cid) || [];
                list.push(sel);
                byChoice.set(cid, list);
            });
            byChoice.forEach(selects => {
                const picked = new Set(selects.map(s => s.value).filter(Boolean));
                selects.forEach(sel => {
                    Array.from(sel.options).forEach(opt => {
                        if (!opt.value) return;
                        opt.disabled = picked.has(opt.value) && opt.value !== sel.value;
                    });
                });
            });
        };
        container.querySelectorAll('.class-choice-select').forEach(sel => {
            sel.addEventListener('change', syncDistinctByChoiceId);
        });
        syncDistinctByChoiceId();

        if (className !== 'Ranger') return;
        const classChoices = Array.isArray(classData?.choices?.[String(level)])
            ? classData.choices[String(level)]
            : [];
        const pickChoice = (id) => classChoices.find(c => c.id === id);
        const favoredFeatureChoice = pickChoice('ranger_favored_feature');
        const favoredEnemyChoice = pickChoice('ranger_favored_enemy_type');
        const favoredLanguageChoice = pickChoice('ranger_favored_enemy_language');
        const explorerFeatureChoice = pickChoice('ranger_explorer_feature');
        const favoredTerrainChoice = pickChoice('ranger_favored_terrain');
        const cannySkillChoice = pickChoice('ranger_canny_skill');

        const favoredGroup = document.createElement('div');
        favoredGroup.className = 'form-group';
        favoredGroup.innerHTML = `
            <label>Favored Enemy or Favored Foe (Optional)</label>
            <div class="inline-input-group">
                <label><input type="radio" name="ranger-favored-choice" value="favored-enemy"> ${favoredFeatureChoice?.options?.[0] || 'Favored Enemy'}</label>
                <label><input type="radio" name="ranger-favored-choice" value="favored-foe"> ${favoredFeatureChoice?.options?.[1] || 'Favored Foe (Optional)'}</label>
            </div>
            <div id="ranger-favored-enemy-fields" class="form-group hidden">
                <label for="ranger-favored-enemy-type">Favored Enemy Type</label>
                <select id="ranger-favored-enemy-type">
                    <option value="">-- Select --</option>
                    ${(favoredEnemyChoice?.options || []).map(e => `<option value="${e}">${e}</option>`).join('')}
                </select>
                <label for="ranger-favored-enemy-language">Favored Enemy Language</label>
                <select id="ranger-favored-enemy-language">
                    <option value="">-- Select --</option>
                    ${_allLanguagesData.map(l => `<option value="${l.name}">${l.name}</option>`).join('')}
                </select>
            </div>
        `;
        container.appendChild(favoredGroup);

        const terrainGroup = document.createElement('div');
        terrainGroup.className = 'form-group';
        terrainGroup.innerHTML = `
            <label>Natural Explorer or Deft Explorer (Optional)</label>
            <div class="inline-input-group">
                <label><input type="radio" name="ranger-terrain-choice" value="natural-explorer"> ${explorerFeatureChoice?.options?.[0] || 'Natural Explorer'}</label>
                <label><input type="radio" name="ranger-terrain-choice" value="deft-explorer"> ${explorerFeatureChoice?.options?.[1] || 'Deft Explorer (Optional)'}</label>
            </div>
            <div id="ranger-natural-explorer-fields" class="form-group hidden">
                <label for="ranger-favored-terrain">Favored Terrain</label>
                <select id="ranger-favored-terrain">
                    <option value="">-- Select --</option>
                    ${(favoredTerrainChoice?.options || []).map(t => `<option value="${t}">${t}</option>`).join('')}
                </select>
            </div>
            <div id="ranger-deft-explorer-fields" class="form-group hidden">
                <label for="ranger-canny-skill">Canny Skill</label>
                <select id="ranger-canny-skill">
                    <option value="">-- Select --</option>
                    ${(cannySkillChoice?.options || SKILL_LIST).map(s => `<option value="${s}">${s}</option>`).join('')}
                </select>
                <label for="ranger-canny-language-1">Canny Language 1</label>
                <select id="ranger-canny-language-1">
                    <option value="">-- Select --</option>
                    ${_allLanguagesData.map(l => `<option value="${l.name}">${l.name}</option>`).join('')}
                </select>
                <label for="ranger-canny-language-2">Canny Language 2</label>
                <select id="ranger-canny-language-2">
                    <option value="">-- Select --</option>
                    ${_allLanguagesData.map(l => `<option value="${l.name}">${l.name}</option>`).join('')}
                </select>
            </div>
        `;
        container.appendChild(terrainGroup);

        const syncCannyLanguageDistinct = () => {
            const sel1 = document.getElementById('ranger-canny-language-1');
            const sel2 = document.getElementById('ranger-canny-language-2');
            if (!sel1 || !sel2) return;
            const v1 = String(sel1.value || '');
            const v2 = String(sel2.value || '');
            Array.from(sel1.options).forEach(opt => {
                if (!opt.value) return;
                opt.disabled = !!v2 && opt.value === v2 && opt.value !== v1;
            });
            Array.from(sel2.options).forEach(opt => {
                if (!opt.value) return;
                opt.disabled = !!v1 && opt.value === v1 && opt.value !== v2;
            });
        };

        const syncRangerFields = () => {
            const favoredChoice = document.querySelector('input[name="ranger-favored-choice"]:checked')?.value || '';
            const terrainChoice = document.querySelector('input[name="ranger-terrain-choice"]:checked')?.value || '';
            const favoredFields = document.getElementById('ranger-favored-enemy-fields');
            const naturalFields = document.getElementById('ranger-natural-explorer-fields');
            const deftFields = document.getElementById('ranger-deft-explorer-fields');
            if (favoredFields) favoredFields.classList.toggle('hidden', favoredChoice !== 'favored-enemy');
            if (naturalFields) naturalFields.classList.toggle('hidden', terrainChoice !== 'natural-explorer');
            if (deftFields) deftFields.classList.toggle('hidden', terrainChoice !== 'deft-explorer');
            syncCannyLanguageDistinct();
        };

        container.querySelectorAll('input[name="ranger-favored-choice"]').forEach(r => {
            r.addEventListener('change', syncRangerFields);
        });
        container.querySelectorAll('input[name="ranger-terrain-choice"]').forEach(r => {
            r.addEventListener('change', syncRangerFields);
        });
        document.getElementById('ranger-canny-language-1')?.addEventListener('change', syncCannyLanguageDistinct);
        document.getElementById('ranger-canny-language-2')?.addEventListener('change', syncCannyLanguageDistinct);
        syncRangerFields();

    }

    function readRangerChoices() {
        const favoredChoice = document.querySelector('input[name="ranger-favored-choice"]:checked')?.value || '';
        const terrainChoice = document.querySelector('input[name="ranger-terrain-choice"]:checked')?.value || '';
        const favoredEnemyType = document.getElementById('ranger-favored-enemy-type')?.value || '';
        const favoredEnemyLanguage = document.getElementById('ranger-favored-enemy-language')?.value || '';
        const favoredTerrain = document.getElementById('ranger-favored-terrain')?.value || '';
        const cannySkill = document.getElementById('ranger-canny-skill')?.value || '';
        const cannyLanguage1 = document.getElementById('ranger-canny-language-1')?.value || '';
        const cannyLanguage2 = document.getElementById('ranger-canny-language-2')?.value || '';
        return {
            favoredChoice,
            favoredEnemyType,
            favoredEnemyLanguage,
            terrainChoice,
            favoredTerrain,
            cannySkill,
            cannyLanguage1,
            cannyLanguage2
        };
    }

    function renderTieflingVariantControls(raceName, event) {
        const container = F.tieflingVariantsContainer?.();
        const choicesEl = F.tieflingVariantsChoices?.();
        if (!container || !choicesEl) return [];

        if (!_useRacesV1 || raceName !== 'Tiefling') {
            container.classList.add('hidden');
            choicesEl.innerHTML = '';
            return [];
        }

        const raceData = (_racesV1 || []).find(r => r.name === raceName) || {};
        const variants = (raceData.options || []).filter(o => String(o?.metadata?.category || '').toLowerCase() === 'variant');
        if (!variants.length) {
            container.classList.add('hidden');
            choicesEl.innerHTML = '';
            return [];
        }

        let preserved = new Set(getSelectedTieflingVariantKeys());
        if (event?.target === F.race()) preserved = new Set();

        const rows = variants.map(v => {
            const key = String(v?.key || '');
            const name = String(v?.name || key);
            const source = String(v?.source?.book || 'Variant');
            const page = v?.source?.page ? ` p.${v.source.page}` : '';
            const group = String(v?.metadata?.exclusive_group || '').trim();
            const checked = preserved.has(key) ? 'checked' : '';
            return `
                <label class="tiefling-variant-row">
                    <input type="checkbox" class="tiefling-variant-checkbox" value="${key}" data-exclusive-group="${group}" ${checked}>
                    <span>${name}</span>
                    <small>${source}${page}</small>
                </label>
            `;
        }).join('');

        choicesEl.innerHTML = rows;
        container.classList.remove('hidden');
        return getSelectedTieflingVariantKeys();
    }

    async function renderVariantHumanControls(raceName, event) {
        const container = F.variantHumanContainer?.();
        const enabledToggle = F.variantHumanEnable?.();
        const fields = F.variantHumanFields?.();
        const asi1 = F.variantHumanAsi1?.();
        const asi2 = F.variantHumanAsi2?.();
        const skill = F.variantHumanSkill?.();
        const feat = F.variantHumanFeat?.();
        const featChoicesWrap = F.variantHumanFeatChoices?.();
        if (!container || !enabledToggle || !fields || !asi1 || !asi2 || !skill || !feat || !featChoicesWrap) return;

        if (raceName !== 'Human') {
            container.classList.add('hidden');
            fields.classList.add('hidden');
            enabledToggle.checked = false;
            featChoicesWrap.innerHTML = '';
            if (F.variantHumanFeatSummary?.()) F.variantHumanFeatSummary().textContent = '';
            return;
        }

        container.classList.remove('hidden');
        const raceChanged = event?.target === F.race();
        if (raceChanged) enabledToggle.checked = false;
        fields.classList.toggle('hidden', !enabledToggle.checked);
        if (fields.classList.contains('hidden')) {
            featChoicesWrap.innerHTML = '';
            if (F.variantHumanFeatSummary?.()) F.variantHumanFeatSummary().textContent = '';
            return;
        }

        const abilities = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
        const prevAsi1 = String(asi1.value || '');
        const prevAsi2 = String(asi2.value || '');
        const prevSkill = String(skill.value || '');
        const prevFeat = String(feat.value || '');

        const abilityOptions = abilities.map(a => `<option value="${a}">${a}</option>`).join('');
        asi1.innerHTML = `<option value="">-- Select Ability --</option>${abilityOptions}`;
        asi2.innerHTML = `<option value="">-- Select Ability --</option>${abilityOptions}`;
        if (!raceChanged) {
            asi1.value = prevAsi1;
            asi2.value = prevAsi2;
        }

        skill.innerHTML = `<option value="">-- Select Skill --</option>${SKILL_LIST.map(s => `<option value="${s}">${s}</option>`).join('')}`;
        if (!raceChanged) skill.value = prevSkill;

        const featList = [..._featsData]
            .filter(f => String(f?.name || '').trim())
            .sort((a, b) => String(a.name).localeCompare(String(b.name)));
        feat.innerHTML = `<option value="">-- Select Feat --</option>${featList.map(f => `<option value="${f.name}">${f.name}</option>`).join('')}`;
        if (!raceChanged) feat.value = prevFeat;

        const selectedAsi = new Set([asi1.value, asi2.value].filter(Boolean));
        [asi1, asi2].forEach(sel => {
            Array.from(sel.options).forEach(opt => {
                if (!opt.value) return;
                opt.disabled = selectedAsi.has(opt.value) && opt.value !== sel.value;
            });
        });
        await renderVariantHumanFeatChoices();
    }

    async function updateDerivedFields(event) {
        const preservedCoreInputs = captureCoreInputState();
        const preservedEquipment = captureEquipmentState();
        const preservedSkills = captureSelectValues(F.skillChoicesContainer(), '.skill-choice-select');
        const preservedTools = captureSelectValues(F.toolChoicesContainer(), '.tool-choice-select');
        const preservedLanguages = captureSelectValues(F.languageChoicesContainer(), '.language-choice-select');
        const preservedClassChoices = captureChoiceSelectState(F.classChoicesContainer(), '.class-choice-select');
        const preservedClassChoiceCustom = captureChoiceInputState(F.classChoicesContainer(), '.choice-custom-input[data-choice-id]');
        const preservedBackgroundChoices = captureChoiceSelectState(F.backgroundChoicesContainer(), '.background-choice-select');
        const preservedBackgroundChoiceCustom = captureChoiceInputState(F.backgroundChoicesContainer(), '.choice-custom-input[data-choice-id]');
        const raceName = F.race().value;
        const backgroundName = F.background().value;
        const className = F.class().value;
        const level = parseInt(F.level().value, 10) || 1;

        let backgroundData = backgroundName ? _backgroundsData.find(b => b.name === backgroundName) : null;

        // Ensure full background data is loaded if it's a stub from an API list
        if (!_useBackgroundsV1 && backgroundData && backgroundData.slug && !backgroundData.suggested_characteristics) {
            try {
                const fullData = await fetch(`https://api.open5e.com/v1/backgrounds/${backgroundData.slug}/`).then(res => res.json());
                // Merge full data back into our main data store to cache it
                const index = _backgroundsData.findIndex(b => b.name === backgroundName);
                if (index !== -1) {
                    _backgroundsData[index] = { ...backgroundData, ...fullData };
                    backgroundData = _backgroundsData[index]; // Use the updated object
                }
            } catch (err) { console.error(`Failed to fetch full data for background: ${backgroundName}`, err); }
        }

        let baseRaceData = {};
        if (raceName) {
            baseRaceData = _racesData.find(r => r.name === raceName) || {};
            if (!_useRacesV1 && baseRaceData.url && !baseRaceData.age) {
                try {
                    const fullData = await fetch(`https://www.dnd5eapi.co${baseRaceData.url}`).then(res => res.json());
                    baseRaceData = { ...baseRaceData, ...fullData };
                    const index = _racesData.findIndex(r => r.name === raceName);
                    if (index !== -1) _racesData[index] = baseRaceData;
                } catch (err) { console.error(`Failed to fetch full data for race: ${raceName}`, err); }
            }
        }

        // --- Subclass Population ---
        const subclassContainer = F.subclassContainer();
        const subclassSelect = F.subclass();
        const oldSubclass = subclassSelect.value;

        if (className) {
            let classData = _classesData.find(c => c.name === className);
            if (classData?.url && !classData.subclasses) {
                try {
                    const fullData = await fetch(`https://www.dnd5eapi.co${classData.url}`).then(res => res.json());
                    classData = { ...classData, ...fullData };
                    const index = _classesData.findIndex(c => c.name === className);
                    if (index !== -1) _classesData[index] = classData;
                } catch (err) { console.error(`Failed to fetch full data for class subclasses: ${className}`, err); }
            }

            const classInfo = CLASS_DATA[className];
            const subclassLevel = classInfo?.subclass_level || 3; // Default to 3, a common level
            const fromClassData = Array.isArray(classData?.subclasses) ? classData.subclasses : [];
            const fromSubclassData = (_subclassesData || [])
                .filter(sc => String(sc?.class || '').toLowerCase() === String(className || '').toLowerCase())
                .map(sc => ({ name: sc.name }));
            let subclassList = [...fromClassData, ...fromSubclassData];
            const canonicalSubclassName = (name) => {
                const raw = String(name || '').trim();
                if (!raw) return '';
                if (String(className || '').toLowerCase() === 'cleric') {
                    return raw.replace(/\s*domain$/i, '').trim().toLowerCase();
                }
                return raw.toLowerCase();
            };
            const bestSubclassDisplay = (current, candidate) => {
                const cur = String(current || '').trim();
                const next = String(candidate || '').trim();
                if (!cur) return next;
                if (!next) return cur;
                if (String(className || '').toLowerCase() === 'cleric') {
                    const curHasDomain = /\bdomain$/i.test(cur);
                    const nextHasDomain = /\bdomain$/i.test(next);
                    if (nextHasDomain && !curHasDomain) return next;
                    if (curHasDomain && !nextHasDomain) return cur;
                }
                return next.length > cur.length ? next : cur;
            };
            const byCanonical = new Map();
            subclassList.forEach(sc => {
                const name = String(sc?.name || '').trim();
                if (!name) return;
                const key = canonicalSubclassName(name);
                if (!key) return;
                const existing = byCanonical.get(key);
                const chosen = bestSubclassDisplay(existing?.name, name);
                byCanonical.set(key, { name: chosen });
            });
            subclassList = Array.from(byCanonical.values())
                .sort((a, b) => String(a.name).localeCompare(String(b.name)));

            if (subclassList.length > 0 && level >= subclassLevel) {
                const options = subclassList.map(sc => `<option value="${sc.name}">${sc.name}</option>`).join('');
                const label = getSubclassLabel(className);
                subclassSelect.innerHTML = `<option value="">-- Select a ${label} --</option>${options}`;
                subclassContainer.classList.remove('hidden');
            } else {
                subclassContainer.classList.add('hidden');
                subclassSelect.innerHTML = '';
            }
        } else {
            subclassContainer.classList.add('hidden');
            subclassSelect.innerHTML = '';
        }
        // Preserve selection if it's still valid
        if (Array.from(subclassSelect.options).some(opt => opt.value === oldSubclass)) {
            subclassSelect.value = oldSubclass;
        }

        const subraceContainer = F.subraceContainer();
        const subraceSelect = F.subrace();
        const subraceLabel = F.subraceLabel();
        let selectedTieflingVariantKeys = [];
        if (subraceLabel) subraceLabel.textContent = raceName === 'Dragonborn' ? 'Draconic Ancestry' : 'Subrace';
        if (raceName === 'Dragonborn') {
            const currentSubrace = subraceSelect.value;
            const options = DRAGONBORN_ANCESTRIES.map(a => `<option value="${a.key}">${a.label}</option>`).join('');
            subraceSelect.innerHTML = `<option value="">-- Select Draconic Ancestry --</option>${options}`;
            if (event?.target === F.race()) {
                subraceSelect.value = '';
            } else if (Array.from(subraceSelect.options).some(opt => opt.value === currentSubrace)) {
                subraceSelect.value = currentSubrace;
            }
            subraceContainer.classList.remove('hidden');
        } else if (_useRacesV1) {
            const raceData = (_racesV1 || []).find(r => r.name === raceName) || {};
            let opts = raceData.options || [];
            if (raceName === 'Tiefling') {
                opts = opts.filter(o => String(o?.metadata?.category || '').toLowerCase() !== 'variant');
            }
            if (opts.length > 0) {
                const currentSubrace = subraceSelect.value;
                const entries = [];
                opts.forEach(opt => {
                    entries.push({ value: opt.key, label: opt.name });
                    if (Array.isArray(opt.aliases)) {
                        opt.aliases.forEach(alias => {
                            entries.push({ value: `${opt.key}||${alias}`, label: alias });
                        });
                    }
                });
                const options = entries.map(e => `<option value="${e.value}">${e.label}</option>`).join('');
                subraceSelect.innerHTML = `<option value="">-- Select a Subrace --</option>${options}`;
                if (event?.target === F.race()) {
                    subraceSelect.value = '';
                } else {
                    subraceSelect.value = currentSubrace;
                    if (!subraceSelect.value && raceName === 'Tiefling') {
                        const hasAsmodeus = entries.some(e => e.value === 'tiefling-asmodeus');
                        if (hasAsmodeus) subraceSelect.value = 'tiefling-asmodeus';
                    }
                }
                subraceContainer.classList.remove('hidden');
            } else {
                subraceContainer.classList.add('hidden');
                subraceSelect.innerHTML = '';
            }
        } else if (baseRaceData && Array.isArray(baseRaceData.subraces) && baseRaceData.subraces.length > 0) {
            const currentSubrace = subraceSelect.value;
            const options = baseRaceData.subraces.map(sr => `<option value="${sr.name}">${sr.name}</option>`).join('');
            subraceSelect.innerHTML = `<option value="">-- Select a Subrace --</option>${options}`;
            if (event?.target === F.race()) {
                subraceSelect.value = '';
            } else {
                subraceSelect.value = currentSubrace;
            }
            subraceContainer.classList.remove('hidden');
        } else {
            subraceContainer.classList.add('hidden');
            subraceSelect.innerHTML = '';
        }

        selectedTieflingVariantKeys = renderTieflingVariantControls(raceName, event);
        await renderVariantHumanControls(raceName, event);

        const subraceName = subraceSelect.value;
        const aggregatedDataRaw = await getAggregatedRacialData(raceName, raceName === 'Dragonborn' ? '' : subraceName, selectedTieflingVariantKeys);
        const aggregatedData = {
            speed: 30,
            size: 'Medium',
            age: 'Varies.',
            ability_bonuses: [],
            traits: [],
            languages: [],
            language_options: 0,
            language_choice_from: [],
            spells: {},
            cantrip_options: null,
            proficiencies: { skills: [], tools: [], weapons: [], armor: [] },
            starting_proficiencies: [],
            ...(aggregatedDataRaw && typeof aggregatedDataRaw === 'object' ? aggregatedDataRaw : {})
        };
        // Deterministic fallback: High Elf / Moon Elf / Sun Elf always grant one wizard cantrip.
        if (!aggregatedData.cantrip_options && String(raceName || '').toLowerCase() === 'elf') {
            const subraceValue = String(subraceSelect?.value || '').toLowerCase();
            const subraceLabelText = String(subraceSelect?.selectedOptions?.[0]?.textContent || '').toLowerCase();
            const isHighElfLineage =
                subraceValue.includes('high-elf') ||
                subraceValue.includes('moon elf') ||
                subraceValue.includes('sun elf') ||
                subraceLabelText.includes('high elf') ||
                subraceLabelText.includes('moon elf') ||
                subraceLabelText.includes('sun elf');
            if (isHighElfLineage) {
                aggregatedData.cantrip_options = { class: 'Wizard', choose: 1 };
            }
        }

        _currentRacialBonuses = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
        const variantHuman = getVariantHumanSelection();
        const useVariantHuman = variantHuman.enabled;
        if (!useVariantHuman && Array.isArray(aggregatedData.ability_bonuses)) {
            for (const bonus of aggregatedData.ability_bonuses) {
                const ability = bonus.ability_score?.index?.toLowerCase();
                const amount = bonus.bonus;
                if (ability && typeof _currentRacialBonuses[ability] !== 'undefined' && typeof amount === 'number') {
                    _currentRacialBonuses[ability] += amount;
                }
            }
        }
        if (useVariantHuman) {
            const a1 = String(variantHuman.asi1 || '').toLowerCase();
            const a2 = String(variantHuman.asi2 || '').toLowerCase();
            if (a1 && Object.prototype.hasOwnProperty.call(_currentRacialBonuses, a1)) _currentRacialBonuses[a1] += 1;
            if (a2 && Object.prototype.hasOwnProperty.call(_currentRacialBonuses, a2) && a2 !== a1) _currentRacialBonuses[a2] += 1;
        }
        for (const key of ['str', 'dex', 'con', 'int', 'wis', 'cha']) {
            const choiceSelects = document.querySelectorAll('.ability-choice-select');
            choiceSelects.forEach(select => {
                if (select.value === key.toUpperCase()) {
                    const amount = parseInt(select.dataset.bonus, 10) || 0;
                    _currentRacialBonuses[key] += amount;
                }
            });
            const bonusDisplay = document.getElementById(`bonus-${key}`);
            if (bonusDisplay) {
                const bonusValue = _currentRacialBonuses[key];
                bonusDisplay.textContent = bonusValue > 0 ? `+${bonusValue}` : '';
            }
        }

        const ethnicityContainer = F.ethnicityContainer();
        if (raceName === 'Human') {
            ethnicityContainer.classList.remove('hidden');
        } else {
            ethnicityContainer.classList.add('hidden');
        }

        F.infoSpeed().textContent = aggregatedData.speed || '--';
        F.infoSize().textContent = aggregatedData.size || '--';
        F.infoAge().textContent = aggregatedData.age || 'Varies.';
        F.infoLanguages().textContent = (aggregatedData.languages || []).map(l => l.name).join(', ') || '--';

        const traitsEl = F.infoTraits();
        if(traitsEl) {
            traitsEl.innerHTML = '<strong>Traits:</strong> ';
            if (Array.isArray(aggregatedData.traits) && aggregatedData.traits.length > 0) {
                const finalTraits = await Promise.all(aggregatedData.traits.map(async (trait) => {
                    if (trait.url) {
                        return fetch(`https://www.dnd5eapi.co${trait.url}`).then(res => res.json()).catch(() => ({ name: trait.name, desc: 'Description not found.' }));
                    }
                    return Promise.resolve({ name: trait.name, desc: trait.desc || 'No description available.' });
                }));
                finalTraits.forEach(trait => {
                    const traitSpan = document.createElement('span');
                    traitSpan.className = 'trait-item tooltip';
                    traitSpan.textContent = trait.name;
                    traitSpan.dataset.tooltip = Array.isArray(trait.desc) ? trait.desc.join('\n\n') : trait.desc;
                    traitsEl.appendChild(traitSpan);
                });
            } else {
                traitsEl.innerHTML += '<span>None listed.</span>';
            }
        }
        // Add background features
        if (backgroundData) {
            let bgFeatures = [];
            if (_useBackgroundsV1) {
                const ids = backgroundData?.grants?.features || [];
                bgFeatures = ids.map(id => (backgroundData.features || []).find(f => f.id === id)).filter(Boolean);
            } else {
                bgFeatures = backgroundData.features || [];
            }
            bgFeatures.forEach(feature => {
                const traitSpan = document.createElement('span');
                traitSpan.className = 'trait-item tooltip';
                traitSpan.textContent = feature.name;
                traitSpan.dataset.tooltip = feature.desc || 'No description available.';
                traitsEl.appendChild(traitSpan);
            });
        }

        updateCharacteristics(backgroundData);
        renderBackgroundChoices(backgroundData);
        restoreChoiceSelectState(F.backgroundChoicesContainer(), '.background-choice-select', preservedBackgroundChoices);
        restoreChoiceInputState(F.backgroundChoicesContainer(), '.choice-custom-input[data-choice-id]', preservedBackgroundChoiceCustom);
        F.backgroundChoicesContainer()?.querySelectorAll('.background-choice-select').forEach(sel => {
            sel.dispatchEvent(new Event('change'));
        });
        await renderClassChoices(className, level);
        restoreChoiceSelectState(F.classChoicesContainer(), '.class-choice-select', preservedClassChoices);
        restoreChoiceInputState(F.classChoicesContainer(), '.choice-custom-input[data-choice-id]', preservedClassChoiceCustom);
        F.classChoicesContainer()?.querySelectorAll('.class-choice-select').forEach(sel => {
            sel.dispatchEvent(new Event('change'));
        });

        // Add class/subclass features
        if (className) {
            const subclassName = F.subclass().value;
            const [classFeatures, subclassFeatures] = await Promise.all([
                global.getClassFeatures(className, level),
                global.getSubclassFeatures(subclassName, className, level)
            ]);

            [...classFeatures, ...subclassFeatures].forEach(feature => {
                if (global.isNoiseFeature(feature)) return;
                const traitSpan = document.createElement('span');
                traitSpan.className = 'trait-item tooltip';
                traitSpan.textContent = feature.name;
                traitSpan.dataset.tooltip = feature.desc || 'No description available.';
                traitsEl.appendChild(traitSpan);
            });
        }

        const knownLangs = new Set((aggregatedData.languages || []).map(l => l.name));
        const languageChoiceGroups = [];

        // Racial language choices (assumes "any" for now, based on API structure)
        if (aggregatedData.language_options > 0) {
            const fromList = aggregatedData.language_choice_from || ['any'];
            languageChoiceGroups.push({ choose: aggregatedData.language_options, from: fromList });
        }

        // Background language choices
        if (backgroundData) {
            if (_useBackgroundsV1) {
                (backgroundData?.grants?.languages || []).forEach(lang => knownLangs.add(lang));
                const langChoices = getBackgroundChoicesByAward(backgroundData, 'languages');
                langChoices.forEach(choice => {
                    const options = buildChoiceOptions(choice).map(opt => opt.label);
                    languageChoiceGroups.push({
                        choose: choice?.choose?.max || 0,
                        from: options,
                        choiceId: choice.id
                    });
                });
            } else if (backgroundData?.proficiencies?.languages) {
                backgroundData.proficiencies.languages.forEach(langEntry => {
                    if (typeof langEntry === 'string') {
                        knownLangs.add(langEntry);
                    } else if (langEntry.choose && Array.isArray(langEntry.from)) {
                        languageChoiceGroups.push(langEntry);
                    }
                });
            }
        }

        // Rules fallback: Witchlight Hand grants two language choices.
        if (String(backgroundData?.name || '').trim().toLowerCase() === 'witchlight hand') {
            const alreadyFromWitchlight = languageChoiceGroups
                .filter(g => String(g?.choiceId || '').toLowerCase().includes('choice:bg:witchlight-hand:languages'))
                .reduce((sum, g) => sum + (Number(g?.choose || 0) || 0), 0);
            if (alreadyFromWitchlight < 2) {
                languageChoiceGroups.push({
                    choose: 2 - alreadyFromWitchlight,
                    from: ['any'],
                    choiceId: 'choice:bg:witchlight-hand:languages'
                });
            }
        }

        if (knownLangs.size === 0) knownLangs.add('Common');
        F.knownLanguages().textContent = [...knownLangs].join(', ');

        const langContainer = F.languageChoicesContainer();
        langContainer.innerHTML = '';
        let langLabelCounter = 1;

        const normalizeLanguageOptions = (fromList) => {
            const list = Array.isArray(fromList) ? fromList : [];
            const hasAny = list.some(item => {
                if (!item) return false;
                if (typeof item === 'string') return item.toLowerCase() === 'any';
                if (typeof item === 'object') {
                    if (item.any && String(item.type || '').toLowerCase() === 'language') return true;
                    if (typeof item.name === 'string' && item.name.toLowerCase() === 'any') return true;
                }
                return false;
            });
            if (hasAny) return _allLanguagesData.map(l => l.name);
            return list.map(item => {
                if (typeof item === 'string') return item;
                if (typeof item?.name === 'string') return item.name;
                if (typeof item?.label === 'string') return item.label;
                return '';
            }).filter(Boolean);
        };

        languageChoiceGroups.forEach(choice => {
            const options = normalizeLanguageOptions(choice.from)
                .filter(lang => !knownLangs.has(lang));

            for (let i = 0; i < choice.choose; i++) {
                const group = document.createElement('div');
                group.className = 'language-choice-group form-group';
                group.innerHTML = `<label>Language Choice ${langLabelCounter++}</label><select class="language-choice-select"><option value="">-- Select a language --</option>${options.map(lang => `<option value="${lang}">${lang}</option>`).join('')}</select>`;
                const selectEl = group.querySelector('select');
                if (choice.choiceId) {
                    selectEl.dataset.choiceId = choice.choiceId;
                }
                langContainer.appendChild(group);
            }
        });

        const classDataForHp = CLASS_DATA[className] || { hit_die: 8 };
        const levelForHp = parseInt(F.level().value, 10) || 1;
        const baseCon = parseInt(F.con().value, 10) || 10;
        const finalCon = baseCon + (_currentRacialBonuses.con || 0);
        const conMod = Math.floor((finalCon - 10) / 2);
        const hitDie = classDataForHp.hit_die;
        const avgHitDie = (hitDie / 2) + 1;
        let maxHP = hitDie + conMod + ((levelForHp - 1) * (avgHitDie + conMod));

        // Check for Dwarven Toughness from aggregated racial data
        if (aggregatedData.traits.some(t => t.name === "Dwarven Toughness")) {
            maxHP += levelForHp;
        }

        const hpEl = F.infoMaxHP();
        const hdEl = F.infoHitDie();
        if (hpEl) hpEl.textContent = Math.max(1, maxHP);
        if (hdEl) hdEl.textContent = `${levelForHp}d${hitDie}`;

        // --- Saving Throws ---
        const savingThrowsContainer = F.savingThrowsList();
        if (savingThrowsContainer) {
            savingThrowsContainer.innerHTML = '';
            const pb = global.DDRules.proficiencyFromLevel(level);
            const classInfoForSaves = CLASS_DATA[className] || { saves: [] };
            const proficientSaves = new Set(classInfoForSaves.saves);

            const abilities = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

            for (const abbr of abilities) {
                const score = (parseInt(F[abbr.toLowerCase()]().value, 10) || 10) + (_currentRacialBonuses[abbr.toLowerCase()] || 0);
                const mod = global.DDRules.abilityMod(score);
                const isProficient = proficientSaves.has(abbr);
                const totalMod = mod + (isProficient ? pb : 0);

                const div = document.createElement('div');
                div.className = 'save-item';
                if (isProficient) div.classList.add('proficient');

                div.innerHTML = `<span class="save-name">${abbr}</span><span class="save-mod">${global.DDRules.fmtMod(totalMod)}</span>`;
                savingThrowsContainer.appendChild(div);
            }
        }

        const grantedSkills = new Set();
        (aggregatedData.proficiencies?.skills || []).forEach(s => grantedSkills.add(s));
        (aggregatedData.starting_proficiencies || []).forEach(p => {
            if (p.name?.startsWith('Skill: ')) grantedSkills.add(p.name.replace('Skill: ', ''));
        });

        const grantedTools = new Set();
        (aggregatedData.proficiencies?.tools || []).forEach(t => grantedTools.add(t));

        const backgroundSkillChoices = [];
        const backgroundToolChoices = [];

        if (backgroundData) {
            if (_useBackgroundsV1) {
                (backgroundData?.grants?.skills || []).forEach(s => grantedSkills.add(s));
                (backgroundData?.grants?.tools || []).forEach(t => grantedTools.add(t));
                getBackgroundChoicesByAward(backgroundData, 'skills').forEach(choice => {
                    const options = buildChoiceOptions(choice).map(opt => opt.label);
                    backgroundSkillChoices.push({
                        choose: choice?.choose?.max || 0,
                        from: options,
                        choiceId: choice.id,
                        source: 'background'
                    });
                });
                getBackgroundChoicesByAward(backgroundData, 'tools').forEach(choice => {
                    const options = buildChoiceOptions(choice).map(opt => opt.label);
                    backgroundToolChoices.push({
                        choose: choice?.choose?.max || 0,
                        from: options,
                        choiceId: choice.id,
                        source: 'background'
                    });
                });
            } else if (backgroundData?.proficiencies) {
                (backgroundData.proficiencies.skills || []).forEach(s => {
                    if (typeof s === 'string') grantedSkills.add(s);
                    else if (s.choose) backgroundSkillChoices.push({ ...s, source: 'background' });
                });
                (backgroundData.proficiencies.tools || []).forEach(t => {
                    if (typeof t === 'string') grantedTools.add(t);
                    else if (t.choose) backgroundToolChoices.push({ ...t, source: 'background' });
                });
            } else { // Fallback for old API format
                (backgroundData?.skill_proficiencies || '').split(', ').filter(Boolean).forEach(s => grantedSkills.add(s.trim()));
                (backgroundData?.tool_proficiencies || '').split(', ').filter(Boolean).forEach(t => grantedTools.add(t.trim()));
            }
        }
        F.grantedSkillsContainer().innerHTML = grantedSkills.size > 0 ? `<strong>Granted Skills:</strong> <span>${[...grantedSkills].join(', ')}</span>` : '';
        F.grantedToolsContainer().innerHTML = grantedTools.size > 0 ? `<strong>Granted Tools:</strong> <span>${[...grantedTools].join(', ')}</span>` : '';

        const armorProfs = new Set();
        const weaponProfs = new Set();
        if (className) {
            let classDataForProfs = _classesData.find(c => c.name === className);
            if (classDataForProfs?.url && !classDataForProfs.proficiencies) {
                try {
                    const fullClassData = await fetch(`https://www.dnd5eapi.co${classDataForProfs.url}`).then(res => res.json());
                    classDataForProfs = { ...classDataForProfs, ...fullClassData };
                    const index = _classesData.findIndex(c => c.name === className);
                    if (index !== -1) _classesData[index] = classDataForProfs;
                } catch (err) { /* fail silently */ }
            }
            (classDataForProfs?.proficiencies || []).forEach(p => {
                const raw = String(p?.name || '').trim();
                if (raw.includes('Armor')) armorProfs.add(raw.replace(/^Armor:\s*/i, '').trim());
                else if (raw.includes('Weapon')) weaponProfs.add(raw.replace(/^Weapon:\s*/i, '').trim());
            });
        }
        (aggregatedData.starting_proficiencies || []).forEach(p => {
            const raw = String(p?.name || '').trim();
            if (raw.includes('Armor')) armorProfs.add(raw.replace(/^Armor:\s*/i, '').trim());
            else if (raw.includes('Weapon')) weaponProfs.add(raw.replace(/^Weapon:\s*/i, '').trim());
        });
        F.armorProfsContainer().innerHTML = armorProfs.size > 0 ? `<strong>Armor:</strong> <span>${[...armorProfs].join(', ')}</span>` : '';
        F.weaponProfsContainer().innerHTML = weaponProfs.size > 0 ? `<strong>Weapons:</strong> <span>${[...weaponProfs].join(', ')}</span>` : '';

        const cantripsContainer = F.cantripsContainer();
        const spellsContainer = F.spellsContainer();
        cantripsContainer.innerHTML = '';
        spellsContainer.innerHTML = '';
        const alwaysKnown = racialSpells(aggregatedData, level);
        const subclassKnown = subclassGrantedSpells(className, F.subclass().value, level);
        const grantedCantripNames = [...new Set([
            ...alwaysKnown.cantrips.map(s => s.name),
            ...subclassKnown.cantrips.map(s => s.name)
        ])];
        const grantedSpellNames = [...new Set([
            ...alwaysKnown.leveled.map(s => s.name),
            ...subclassKnown.leveled.map(s => s.name)
        ])];
        if (grantedCantripNames.length > 0) {
            const grantedEl = document.createElement('div');
            grantedEl.className = 'granted-spells';
            grantedEl.innerHTML = `<strong>Granted Cantrips:</strong> <span>${grantedCantripNames.join(', ')}</span>`;
            cantripsContainer.appendChild(grantedEl);
        }
        if (grantedSpellNames.length > 0) {
            const grantedEl = document.createElement('div');
            grantedEl.className = 'granted-spells';
            grantedEl.innerHTML = `<strong>Granted Spells:</strong> <span>${grantedSpellNames.join(', ')}</span>`;
            spellsContainer.appendChild(grantedEl);
        }
        if (className) {
            let classData = _classesData.find(c => c.name === className);
            if (classData?.url && !classData.spellcasting) {
                try {
                    const fullClassData = await fetch(`https://www.dnd5eapi.co${classData.url}`).then(res => res.json());
                    classData = { ...classData, ...fullClassData };
                    const index = _classesData.findIndex(c => c.name === className);
                    if (index !== -1) _classesData[index] = classData;
                } catch (err) { /* fail silently */ }
            }
            const level = parseInt(F.level().value, 10) || 1;
            let spellsKnown = 0;
            let cantripsKnown = 0;

            // Prefer local class progression data.
            const localProgression = classData?.progression?.[String(level)] || {};
            cantripsKnown = Number(localProgression?.cantripsKnown ?? localProgression?.cantrips_known ?? 0) || 0;
            spellsKnown = Number(localProgression?.spellsKnown ?? localProgression?.spells_known ?? 0) || 0;

            // Optionally refine from API level endpoint if available.
            const levelDataUrl = classData?.class_levels;
            if (levelDataUrl) {
              try {
                const levelData = await fetch(`https://www.dnd5eapi.co${levelDataUrl.startsWith('/') ? '' : '/'}${levelDataUrl}/${level}`).then(res => res.json());
                cantripsKnown = Number(levelData?.spellcasting?.cantrips_known ?? cantripsKnown) || cantripsKnown;
                spellsKnown = Number(levelData?.spells_known ?? levelData?.spellcasting?.spells_known ?? spellsKnown) || spellsKnown;
              } catch (err) {
                // Keep local progression values if API fetch fails.
              }
            }

            // Special case for Wizard's starting spellbook
            if (className.toLowerCase() === 'wizard' && level === 1) {
                spellsKnown = 6;
            }

            const classSpells = Array.isArray(_allSpellsData)
                ? _allSpellsData.filter(s => s && s.classes && Array.isArray(s.classes) && s.classes.some(c => String(c).toLowerCase() === String(className).toLowerCase()))
                : [];
            if (cantripsKnown > 0) {
                const cantripOptions = classSpells.filter(s => s.level === 0);
                for (let i = 0; i < cantripsKnown; i++) {
                    const group = document.createElement('div');
                    group.className = 'spell-choice-group form-group';
                    group.innerHTML = `<label>Cantrip Choice ${i + 1}</label><select class="spell-choice-select"><option value="">-- Select a cantrip --</option>${cantripOptions.map(s => `<option value="${s.name}">${getSpellDisplayName(s.name)}</option>`).join('')}</select>`;
                    if (cantripOptions.length > 0) cantripsContainer.appendChild(group);
                }
            }
            if (spellsKnown > 0) {
                const maxSpellLevel = global.DDRules.getMaxSpellLevelFor({ class: className, level: level });
                const spellOptions = classSpells.filter(s => s.level > 0 && s.level <= maxSpellLevel);
                for (let i = 0; i < spellsKnown; i++) {
                    const group = document.createElement('div');
                    group.className = 'spell-choice-group form-group';
                    group.innerHTML = `<label>Spell Choice ${i + 1}</label><select class="spell-choice-select"><option value="">-- Select a spell --</option>${spellOptions.map(s => `<option value="${s.name}">${getSpellDisplayName(s.name)} (Lvl ${s.level})</option>`).join('')}</select>`;
                    if (spellOptions.length > 0) spellsContainer.appendChild(group);
                }
            } else if (['cleric', 'druid', 'paladin', 'artificer'].includes(className.toLowerCase())) {
                const info = document.createElement('p');
                info.style.cssText = 'font-size: 0.9em; color: #4a5568; margin-top: 0;';
                info.textContent = 'Spells are prepared daily from the full class spell list.';
                spellsContainer.appendChild(info);
            }
        }
        await renderRacialCantripChoice(aggregatedData);
        const abilityChoiceCard = F.abilityChoiceCard();
        const abilityChoiceContainer = F.abilityChoicesContainer();
        const abilityChoiceData = aggregatedData.proficiencies?.ability_score_choices;

        if (abilityChoiceData) {
            abilityChoiceCard.classList.remove('hidden');

            // --- Tasha's-style flexible ability scores ---
            if (abilityChoiceData.type === 'flexible_tashas') {
                // Check if the method choice UI is already there to avoid re-rendering on every update
                if (!abilityChoiceContainer.querySelector('.ability-method-choice')) {
                    abilityChoiceContainer.innerHTML = `
                        <div class="ability-method-choice">
                            <label><input type="radio" name="ability-method" value="plus2plus1"> +2 / +1</label>
                            <label><input type="radio" name="ability-method" value="plus1x3" checked> +1 / +1 / +1</label>
                        </div>
                        <div id="flexible-ability-dropdowns"></div>
                    `;
                    abilityChoiceContainer.querySelector('.ability-method-choice').addEventListener('change', (e) => {
                        // When method changes, re-render the whole section to clear selections
                        updateDerivedFields(e);
                    });
                }

                const method = abilityChoiceContainer.querySelector('input[name="ability-method"]:checked').value;
                const dropdownContainer = abilityChoiceContainer.querySelector('#flexible-ability-dropdowns');
                dropdownContainer.innerHTML = ''; // Clear old dropdowns

                const abilityOptions = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
                const optionsHtml = abilityOptions.map(s => `<option value="${s}">${s}</option>`).join('');

                const createDropdown = (bonus) => {
                    const group = document.createElement('div');
                    group.className = 'ability-choice-group form-group';
                    group.innerHTML = `<label>Ability Score Increase (+${bonus})</label><select class="ability-choice-select" data-bonus="${bonus}"><option value="">-- Select --</option>${optionsHtml}</select>`;
                    return group;
                };

                if (method === 'plus2plus1') {
                    dropdownContainer.appendChild(createDropdown(2));
                    dropdownContainer.appendChild(createDropdown(1));
                } else { // plus1x3
                    dropdownContainer.appendChild(createDropdown(1));
                    dropdownContainer.appendChild(createDropdown(1));
                    dropdownContainer.appendChild(createDropdown(1));
                }
            } 
            // --- Original logic for fixed choices ---
            else {
                abilityChoiceContainer.innerHTML = ''; // Clear any previous UI
                const numChoices = abilityChoiceData.choose;
                const bonusAmount = abilityChoiceData.from.options[0]?.bonus || 1;
                const abilityOptions = abilityChoiceData.from.options.map(opt => opt.ability_score.name);
                for (let i = 0; i < numChoices; i++) {
                    const group = document.createElement('div');
                    group.className = 'ability-choice-group form-group';
                    group.innerHTML = `<label>Ability Score Increase (+${bonusAmount})</label><select class="ability-choice-select" data-bonus="${bonusAmount}"><option value="">-- Select --</option>${abilityOptions.map(s => `<option value="${s}">${s}</option>`).join('')}</select>`;
                    abilityChoiceContainer.appendChild(group);
                }
            }

            // This logic runs for both cases to handle duplicate prevention
            const allSelects = Array.from(abilityChoiceContainer.querySelectorAll('.ability-choice-select'));
            const selectedValues = new Set(allSelects.map(sel => sel.value).filter(Boolean));

            allSelects.forEach(sel => {
                Array.from(sel.options).forEach(opt => {
                    if (opt.value && opt.value !== sel.value) {
                        opt.disabled = selectedValues.has(opt.value);
                    }
                });
            });

        } else {
            abilityChoiceCard.classList.add('hidden');
            abilityChoiceContainer.innerHTML = '';
        }
        const skillContainer = F.skillChoicesContainer();
        skillContainer.innerHTML = '';
        if (className) {
            let classData = _classesData.find(c => c.name === className) || {};
            const normalizeChoiceList = (rawList) => {
                const list = Array.isArray(rawList) ? rawList : [];
                return list.map(item => {
                    if (typeof item === 'string') return item.trim();
                    if (typeof item?.name === 'string') return item.name.trim();
                    if (typeof item?.item?.name === 'string') return item.item.name.trim();
                    if (typeof item?.value === 'string') return item.value.trim();
                    return '';
                }).filter(Boolean);
            };
            const normalizeChoiceCount = (rawCount) => {
                const n = Number(rawCount);
                return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
            };
            if (classData?.url && !classData.proficiency_choices && !classData.proficiencies) {
                try {
                    classData = { ...classData, ...await fetch(`https://www.dnd5eapi.co${classData.url}`).then(res => res.json()) };
                    const index = _classesData.findIndex(c => c.name === className);
                    if (index !== -1) _classesData[index] = classData;
                } catch (err) { console.error(`Failed to fetch full data for class: ${className}`, err); }
            }

            const classSkillChoices = [];
            const defaultClassSkillChoices = {
                artificer: {
                    choose: 2,
                    from: ['Arcana', 'History', 'Investigation', 'Medicine', 'Nature', 'Perception', 'Sleight of Hand']
                }
            };

            // Handle flexible local skill proficiency format first.
            if (classData.proficiencies?.skills && Array.isArray(classData.proficiencies.skills)) {
                classData.proficiencies.skills.forEach(skillEntry => {
                    if (typeof skillEntry === 'string') {
                        grantedSkills.add(skillEntry);
                    } else if (typeof skillEntry === 'object' && skillEntry.choose && Array.isArray(skillEntry.from)) {
                        classSkillChoices.push(skillEntry);
                    }
                });
            }

            // If no local choices were found, try the API format.
            if (classSkillChoices.length === 0) {

            // Handle API's standard proficiency_choices format
            const profChoice = (Array.isArray(classData.proficiency_choices) ? classData.proficiency_choices : [])
                .find(c => c?.from?.options?.[0]?.item?.name?.startsWith('Skill:'));
            if (profChoice) {
                classSkillChoices.push({
                    choose: profChoice.choose,
                    from: profChoice.from.options.map(opt => opt.item.name.replace('Skill: ', ''))
                });
            }
            const fallback = defaultClassSkillChoices[String(className || '').trim().toLowerCase()];
            if (!profChoice && fallback) {
                classSkillChoices.push({
                    choose: fallback.choose,
                    from: [...fallback.from]
                });
            }
            }

            // Re-render granted skills in case the class added some
            F.grantedSkillsContainer().innerHTML = grantedSkills.size > 0 ? `<strong>Granted Skills:</strong> <span>${[...grantedSkills].join(', ')}</span>` : '';

            // Render all collected skill choices
            let labelCounter = 1;
            const allSkillChoices = [...classSkillChoices, ...backgroundSkillChoices];
            allSkillChoices.forEach((choice) => {
                const numChoices = normalizeChoiceCount(choice?.choose);
                const skillOptions = normalizeChoiceList(choice?.from).filter(skill => !grantedSkills.has(skill));
                for (let i = 0; i < numChoices; i++) {
                    const group = document.createElement('div');
                    group.className = 'skill-choice-group form-group';
                    const labelPrefix = choice.source === 'background' ? 'Background Skill Choice' : 'Class Skill Choice';
                    group.innerHTML = `<label>${labelPrefix} ${labelCounter++}</label><select class="skill-choice-select"><option value="">-- Select a skill --</option>${skillOptions.map(s => `<option value="${s}">${s}</option>`).join('')}</select>`;
                    const selectEl = group.querySelector('select');
                    if (choice.choiceId) {
                        selectEl.dataset.choiceId = choice.choiceId;
                    }
                    skillContainer.appendChild(group);
                }
            });

            const classToolChoices = [];
            const classToolDefaultsKey = String(className || '').trim().toLowerCase();
            const defaultToolGrants = DEFAULT_CLASS_TOOL_GRANTS[classToolDefaultsKey] || [];
            defaultToolGrants.forEach(tool => grantedTools.add(tool));
            F.grantedToolsContainer().innerHTML = grantedTools.size > 0 ? `<strong>Granted Tools:</strong> <span>${[...grantedTools].join(', ')}</span>` : '';

            // Handle flexible local tool proficiency format (e.g., from a local classes.json)
            if (classData.proficiencies?.tools && Array.isArray(classData.proficiencies.tools)) {
                classData.proficiencies.tools.forEach(toolEntry => {
                    if (typeof toolEntry === 'string') {
                        grantedTools.add(toolEntry);
                    } else if (typeof toolEntry === 'object' && toolEntry.choose && Array.isArray(toolEntry.from)) {
                        classToolChoices.push(toolEntry);
                    }
                });
                // Re-render granted tools in case the class added some
                F.grantedToolsContainer().innerHTML = grantedTools.size > 0 ? `<strong>Granted Tools:</strong> <span>${[...grantedTools].join(', ')}</span>` : '';
            }

            // Handle API's standard proficiency_choices format for tools
            const toolChoiceFromApi = (Array.isArray(classData.proficiency_choices) ? classData.proficiency_choices : [])
                .find(c => String(c?.desc || '').toLowerCase().includes('tools'));
            if (toolChoiceFromApi) {
                classToolChoices.push({
                    choose: toolChoiceFromApi.choose,
                    from: (toolChoiceFromApi?.from?.options || []).map(opt => opt?.item?.name).filter(Boolean)
                });
            }
            if (!toolChoiceFromApi && classToolChoices.length === 0) {
                const fallback = DEFAULT_CLASS_TOOL_CHOICES[classToolDefaultsKey];
                if (fallback) {
                    classToolChoices.push({
                        choose: fallback.choose,
                        from: [...fallback.from]
                    });
                }
            }

            const toolContainer = F.toolChoicesContainer();
            toolContainer.innerHTML = '';

            // Combine class and background tool choices
            const allToolChoices = [...classToolChoices, ...backgroundToolChoices];
            let toolLabelCounter = 1;

            allToolChoices.forEach((choice) => {
                const numChoices = normalizeChoiceCount(choice?.choose);
                let toolOptions = normalizeChoiceList(choice?.from).filter(tool => !grantedTools.has(tool));
                if (!toolOptions.length) {
                    // Fallback so a malformed payload does not remove the picker entirely.
                    toolOptions = normalizeChoiceList(_allToolsData).filter(tool => !grantedTools.has(tool));
                }
                if (!toolOptions.length) {
                    toolOptions = DEFAULT_TOOL_OPTIONS.filter(tool => !grantedTools.has(tool));
                }
                for (let i = 0; i < numChoices; i++) {
                    const group = document.createElement('div');
                    group.className = 'tool-choice-group form-group';
                    const labelPrefix = choice.source === 'background' ? 'Background Tool Choice' : 'Tool Choice';
                    const labelEl = document.createElement('label');
                    labelEl.textContent = `${labelPrefix} ${toolLabelCounter++}`;
                    const selectEl = document.createElement('select');
                    selectEl.className = 'tool-choice-select';
                    const placeholder = document.createElement('option');
                    placeholder.value = '';
                    placeholder.textContent = '-- Select a tool --';
                    selectEl.appendChild(placeholder);
                    toolOptions.forEach(toolName => {
                        const optionEl = document.createElement('option');
                        optionEl.value = String(toolName);
                        optionEl.textContent = String(toolName);
                        selectEl.appendChild(optionEl);
                    });
                    if (choice.choiceId) {
                        selectEl.dataset.choiceId = choice.choiceId;
                    }
                    group.appendChild(labelEl);
                    group.appendChild(selectEl);
                    toolContainer.appendChild(group);
                }
            });
        }
        if (!skillContainer.dataset.boundChange) {
            skillContainer.dataset.boundChange = '1';
            skillContainer.addEventListener('change', (e) => {
                if (!e.target.classList.contains('skill-choice-select')) return;
                const allSelects = Array.from(skillContainer.querySelectorAll('.skill-choice-select'));
                const selectedValues = new Set();
                allSelects.forEach(sel => { if (sel.value) selectedValues.add(sel.value); });
                allSelects.forEach(sel => {
                    Array.from(sel.options).forEach(opt => {
                        if (opt.value && opt.value !== sel.value) opt.disabled = selectedValues.has(opt.value);
                    });
                });
                renderVariantHumanFeatChoices();
            });
        }
        const toolChoicesContainer = F.toolChoicesContainer();
        if (toolChoicesContainer && !toolChoicesContainer.dataset.boundChange) {
            toolChoicesContainer.dataset.boundChange = '1';
            toolChoicesContainer.addEventListener('change', (e) => {
                if (!e.target.classList.contains('tool-choice-select')) return;
                const allSelects = Array.from(toolChoicesContainer.querySelectorAll('.tool-choice-select'));
                const selectedValues = new Set();
                allSelects.forEach(sel => { if (sel.value) selectedValues.add(sel.value); });
                allSelects.forEach(sel => {
                    Array.from(sel.options).forEach(opt => {
                        if (opt.value && opt.value !== sel.value) opt.disabled = selectedValues.has(opt.value);
                    });
                });
            });
        }
        const spellChoiceHandler = (e) => {
            if (!e.target.classList.contains('spell-choice-select')) return;
            const allSelects = document.querySelectorAll('.spell-choice-select');
            const selectedValues = new Set();
            allSelects.forEach(sel => { if (sel.value) selectedValues.add(sel.value); });
            allSelects.forEach(sel => {
                Array.from(sel.options).forEach(opt => {
                    if (opt.value && opt.value !== sel.value) opt.disabled = selectedValues.has(opt.value);
                });
            });
        };
        if (!cantripsContainer.dataset.boundSpellChange) {
            cantripsContainer.dataset.boundSpellChange = '1';
            cantripsContainer.addEventListener('change', spellChoiceHandler);
        }
        if (!spellsContainer.dataset.boundSpellChange) {
            spellsContainer.dataset.boundSpellChange = '1';
            spellsContainer.addEventListener('change', spellChoiceHandler);
        }

        // --- Starting Equipment Choices ---
        const equipmentContainer = F.equipmentChoicesContainer();
        equipmentContainer.innerHTML = '';

        const grantedEquipContainer = F.grantedEquipmentContainer();
        let grantedEquipHtml = '';

        if (backgroundName) {
            const backgroundData = _backgroundsData.find(b => b.name === backgroundName);
            if (_useBackgroundsV1) {
                const equipList = (backgroundData?.grants?.equipment || []).map(item => {
                    if (String(item).toLowerCase().includes('pouch containing')) return null;
                    return `<li>${item}</li>`;
                }).filter(Boolean).join('');
                if (equipList) {
                    grantedEquipHtml += `<strong>Background Equipment:</strong><ul>${equipList}</ul>`;
                }
            } else if (backgroundData?.equipment) {
                const equipList = backgroundData.equipment.map(item => {
                    if (String(item).toLowerCase().includes('pouch containing')) return null;
                    return `<li>${item}</li>`;
                }).filter(Boolean).join('');
                if (equipList) {
                    grantedEquipHtml += `<strong>Background Equipment:</strong><ul>${equipList}</ul>`;
                }
            }
        }
        if (className) {
            let classData = _classesData.find(c => c.name === className);
            if (classData?.url && (!classData.starting_equipment_options || !classData.starting_equipment)) {
                try {
                    const fullClassData = await fetch(`https://www.dnd5eapi.co${classData.url}`).then(res => res.json());
                    classData = { ...classData, ...fullClassData };
                } catch (err) { /* fail silently */ }
            }

            if (Array.isArray(classData?.starting_equipment) && classData.starting_equipment.length > 0) {
                const equipList = classData.starting_equipment.map(item => {
                    return `<li>${item.quantity}x ${item.equipment.name}</li>`;
                }).join('');
                if (equipList) {
                    grantedEquipHtml += `<strong>Class Equipment:</strong><ul>${equipList}</ul>`;
                }
            }

            if (Array.isArray(classData?.starting_equipment_options)) {
                classData.starting_equipment_options.forEach((choiceBlock, blockIndex) => {
                    const blockEl = document.createElement('div');
                    blockEl.className = 'equipment-choice-block';
                    
                    const descEl = document.createElement('p');
                    descEl.innerHTML = `<strong>${choiceBlock.desc}</strong>`;
                    blockEl.appendChild(descEl);

                    choiceBlock.from.options.forEach((option, optionIndex) => {
                        const label = document.createElement('label');
                        label.className = 'equipment-option';

                        const radio = document.createElement('input');
                        radio.type = 'radio';
                        radio.name = `equip-choice-${blockIndex}`;
                        radio.value = optionIndex;

                        const getChoiceLabel = (choice) => {
                            if (!choice) return 'Choose item';
                            const direct = String(choice.desc || '').trim();
                            if (direct) return direct;
                            if (choice.from?.options) return `Choose ${choice.choose || 1} from a list`;
                            return `Choose ${choice.choose || 1} from ${choice.from?.equipment_category?.name || 'a category'}`;
                        };

                        const getOptionLabel = (opt) => {
                            const optionType = String(opt?.option_type || '').toLowerCase();
                            if (optionType === 'counted_reference') return `${opt.count || 1}x ${opt.of?.name || 'item'}`;
                            if (optionType === 'reference') return String(opt.item?.name || 'item');
                            if (optionType === 'choice') return getChoiceLabel(opt.choice);
                            if (optionType === 'multiple') {
                                return (opt.items || []).map(item => {
                                    const itemType = String(item?.option_type || '').toLowerCase();
                                    if (itemType === 'counted_reference') return `${item.count || 1}x ${item.of?.name || 'item'}`;
                                    if (itemType === 'reference') return String(item.item?.name || 'item');
                                    if (itemType === 'choice') return getChoiceLabel(item.choice);
                                    return 'item';
                                }).join(', ');
                            }
                            return 'Unknown Option';
                        };

                        label.appendChild(radio);
                        label.appendChild(document.createTextNode(` ${getOptionLabel(option)}`));
                        blockEl.appendChild(label);
                    });
                    equipmentContainer.appendChild(blockEl);
                });
            }
        }
        grantedEquipContainer.innerHTML = grantedEquipHtml;
        restoreEquipmentState(preservedEquipment);
        restoreSelectValues(F.skillChoicesContainer(), '.skill-choice-select', preservedSkills);
        restoreSelectValues(F.toolChoicesContainer(), '.tool-choice-select', preservedTools);
        restoreSelectValues(F.languageChoicesContainer(), '.language-choice-select', preservedLanguages);
        restoreCoreInputState(preservedCoreInputs);
        updateDeitySuggestions();
        await renderVariantHumanFeatChoices();
    }


    function handleRandomName() {
        const race = F.race().value;
        const gender = F.gender().value;
        const ethnicity = F.ethnicity().value;
        if (!race || !_namesData.length) return;
        let namePool = _namesData.filter(row => row.Species === race);
        if (race === 'Human' && ethnicity) {
            const byEthnicity = namePool.filter(row => String(row.Ethicity || '').trim().toLowerCase() === String(ethnicity || '').trim().toLowerCase());
            if (byEthnicity.length > 0) {
                namePool = byEthnicity;
            } else {
                const fallback = FAERUN_HUMAN_NAME_POOLS[String(ethnicity || '').trim()];
                if (fallback) {
                    const first = String(gender || '').toLowerCase() === 'female' ? fallback.female : fallback.male;
                    const last = fallback.surnames || [];
                    if (!first.length) return;
                    const randomFirstName = first[Math.floor(Math.random() * first.length)];
                    let finalName = randomFirstName;
                    if (last.length) {
                        const randomLastName = last[Math.floor(Math.random() * last.length)];
                        finalName += ` ${randomLastName}`;
                    }
                    F.name().value = finalName;
                    return;
                }
            }
        }
        let firstNames, lastNames;
        if (race === 'Tiefling') {
            const genderedNames = namePool.filter(row => row.Gender === gender);
            const virtueNames = namePool.filter(row => row.Gender === 'Virtue');
            firstNames = genderedNames.map(r => r.First).concat(virtueNames.map(r => r.First));
            lastNames = genderedNames.map(r => r.Last).filter(Boolean);
        } else {
            const genderedNames = namePool.filter(row => row.Gender === gender);
            firstNames = genderedNames.map(r => r.First).filter(Boolean);
            lastNames = genderedNames.map(r => r.Last).filter(Boolean);
        }
        if (firstNames.length === 0) {
            firstNames = namePool.map(r => r.First).filter(Boolean);
            lastNames = namePool.map(r => r.Last).filter(Boolean);
        }
        if (firstNames.length === 0) return;
        const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        let finalName = randomFirstName;
        if (lastNames.length > 0) {
            const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            finalName += ` ${randomLastName}`;
        }
        F.name().value = finalName;
    }

    function getChoiceCounts() {
        return {
            skillChoiceCount: document.querySelectorAll('.skill-choice-select').length,
            toolChoiceCount: document.querySelectorAll('.tool-choice-select').length,
            languageChoiceCount: document.querySelectorAll('.language-choice-select').length,
            abilityChoiceCount: document.querySelectorAll('.ability-choice-select').length,
            spellChoiceCount: document.querySelectorAll('.spell-choice-select').length
        };
    }

    function getSelectedTieflingVariantKeys() {
        const box = F.tieflingVariantsChoices?.();
        if (!box) return [];
        return Array.from(box.querySelectorAll('input.tiefling-variant-checkbox:checked'))
            .map(el => String(el.value || '').trim())
            .filter(Boolean);
    }

    function handleGenerate() {
        const errors = validateBuilderForm(getChoiceCounts());
        showErrors(errors);
        if (errors.length) return;
        generateCharacterObject().then(charObject => {
            generatedJson = JSON.stringify(charObject, null, 2);
            F.output().textContent = generatedJson;
            F.downloadBtn().disabled = false;
            if (F.saveBtn()) F.saveBtn().disabled = false;
        });
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

    async function handleSave() {
        if (!generatedJson) return;
        if (typeof window.saveCharacter !== 'function') {
            alert('Direct file save is not supported in this browser.');
            return;
        }
        const charName = F.name().value.trim().toLowerCase().replace(/\s+/g, '-') || 'character';
        const fileName = `${charName}.json`;
        try {
            const character = JSON.parse(generatedJson);
            await window.saveCharacter(fileName, character, { prompt: true });
            window.setCurrentCharacter?.(fileName, character);
            alert(`Saved to data folder as ${fileName}.`);
        } catch (err) {
            console.error('Failed to save character JSON', err);
            alert('Could not save the file. See console for details.');
        }
    }

    function boot() {
        populateDropdowns().catch(err => {
            console.error("Failed to populate dropdowns:", err);
            F.output().textContent = "Error: Could not load data files (races.json, classes.json, etc.). Make sure they are in the /data/ directory.";
        });
        F.race().addEventListener('change', updateDerivedFields);
        F.subrace().addEventListener('change', updateDerivedFields);
        F.tieflingVariantsChoices()?.addEventListener('change', (event) => {
            const target = event?.target;
            if (!(target instanceof HTMLInputElement) || !target.classList.contains('tiefling-variant-checkbox')) {
                return;
            }
            if (target.checked) {
                const group = String(target.dataset.exclusiveGroup || '').trim();
                if (group) {
                    F.tieflingVariantsChoices()?.querySelectorAll('input.tiefling-variant-checkbox').forEach(box => {
                        if (box === target) return;
                        if (String(box.dataset.exclusiveGroup || '').trim() === group) box.checked = false;
                    });
                }
                const key = String(target.value || '');
                if (key === 'tiefling-feral') {
                    const winged = F.tieflingVariantsChoices()?.querySelector('input.tiefling-variant-checkbox[value="tiefling-winged"]');
                    if (winged) winged.checked = false;
                }
                if (key === 'tiefling-winged') {
                    const feral = F.tieflingVariantsChoices()?.querySelector('input.tiefling-variant-checkbox[value="tiefling-feral"]');
                    if (feral) feral.checked = false;
                }
            }
            updateDerivedFields(event);
        });
        F.variantHumanEnable()?.addEventListener('change', updateDerivedFields);
        F.variantHumanAsi1()?.addEventListener('change', updateDerivedFields);
        F.variantHumanAsi2()?.addEventListener('change', updateDerivedFields);
        F.variantHumanSkill()?.addEventListener('change', updateDerivedFields);
        F.variantHumanFeat()?.addEventListener('change', updateDerivedFields);
        F.class().addEventListener('change', updateDerivedFields);
        F.subclass().addEventListener('change', updateDerivedFields);
        F.alignmentLCN()?.addEventListener('change', updateDeitySuggestions);
        F.alignmentGNE()?.addEventListener('change', updateDeitySuggestions);
        F.deity()?.addEventListener('input', updateDeitySuggestions);
        const debouncedDerivedUpdate = debounce(updateDerivedFields, 140);
        F.level().addEventListener('input', debouncedDerivedUpdate);
        F.abilityChoicesContainer()?.addEventListener('change', updateDerivedFields);
        F.equipmentChoicesContainer()?.addEventListener('change', handleEquipmentChoice);
        F.equipmentChoicesContainer()?.addEventListener('change', handleEquipmentSubChoiceChange);
        F.background().addEventListener('change', updateDerivedFields);
        F.randomTraitBtn().addEventListener('click', () => handleRandomCharacteristic(F.trait()));
        F.randomIdealBtn().addEventListener('click', () => handleRandomCharacteristic(F.ideal()));
        F.randomBondBtn().addEventListener('click', () => handleRandomCharacteristic(F.bond()));
        F.randomFlawBtn().addEventListener('click', () => handleRandomCharacteristic(F.flaw()));
        F.randomNameBtn().addEventListener('click', handleRandomName);
        F.generateBtn().addEventListener('click', handleGenerate);
        F.downloadBtn().addEventListener('click', handleDownload);
        F.saveBtn()?.addEventListener('click', handleSave);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

})(window);
