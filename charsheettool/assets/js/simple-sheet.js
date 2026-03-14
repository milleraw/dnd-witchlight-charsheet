// assets/js/simple-sheet.js

(function(global) {
    'use strict';

    // DOM Element shortcuts for our new sheet
    const F = {
        name: () => document.getElementById('char-name'),
        classLevel: () => document.getElementById('char-class-level'),
        race: () => document.getElementById('char-race'),
        background: () => document.getElementById('char-background'),
        alignment: () => document.getElementById('char-alignment'),
        ac: () => document.getElementById('stat-ac'),
        initiative: () => document.getElementById('stat-initiative'),
        speed: () => document.getElementById('stat-speed'),
        maxHP: () => document.getElementById('stat-max-hp'),
        currentHP: () => document.getElementById('current-hp'),
        profBonus: () => document.getElementById('stat-prof-bonus'),
        passivePerception: () => document.getElementById('stat-passive-perception'),
        abilitiesContainer: () => document.querySelector('.abilities-grid'),
        savingThrowsContainer: () => document.getElementById('saving-throws-list'),
        skillsContainer: () => document.getElementById('skills-list'),
        attacksContainer: () => document.getElementById('attacks-list'),
        featuresContainer: () => document.getElementById('features-list'),
        equipmentContainer: () => document.getElementById('equipment-list'),
        actionsContainer: () => document.getElementById('actions-list'),
        spellsContainer: () => document.getElementById('spells-list'),
        spellStatsContainer: () => document.getElementById('spell-stats'),
    };

    /**
     * Renders the main header section of the sheet.
     */
    function renderHeader(character) {
        F.name().textContent = character.name || 'Unknown';
        F.classLevel().textContent = `${character.class || 'Class'} ${character.level || 1}`;
        F.race().textContent = character.race || 'Race';
        F.background().textContent = character.background || 'Background';
        F.alignment().textContent = character.alignment || 'Alignment';
    }

    /**
     * Renders the six ability scores and their modifiers.
     */
    function renderAbilities(character) {
        const abilities = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
        const container = F.abilitiesContainer();
        if (!container) return;
        container.innerHTML = ''; // Clear previous content

        for (const abbr of abilities) {
            const score = character.abilities?.[abbr] ?? character.abilities?.[abbr.toLowerCase()] ?? 10;
            const mod = global.DDRules.abilityMod(score);

            const abilityEl = document.createElement('div');
            abilityEl.className = 'ability-box';
            abilityEl.innerHTML = `
                <div class="ability-abbr">${abbr}</div>
                <div class="ability-score">${score}</div>
                <div class="ability-mod">${global.DDRules.fmtMod(mod)}</div>
            `;
            container.appendChild(abilityEl);
        }
    }

    function renderSavingThrows(character) {
        const container = F.savingThrowsContainer();
        if (!container) return;
        container.innerHTML = '';

        const pb = global.DDRules.proficiencyFromLevel(character.level);
        const proficientSaves = [
            ...(Array.isArray(character.proficiencies?.saves) ? character.proficiencies.saves : []),
            ...(Array.isArray(character.proficiencies?.saving_throws) ? character.proficiencies.saving_throws : []),
            ...(Array.isArray(character.skill_proficiencies?.['saving throws']) ? character.skill_proficiencies['saving throws'] : []),
            ...(Array.isArray(character.saving_throw_proficiencies) ? character.saving_throw_proficiencies : [])
        ].map(s => String(s || '').trim().slice(0, 3).toUpperCase()).filter(Boolean);
        const passiveRules = Array.isArray(character?.passiveRules) ? character.passiveRules : [];
        const hasRule = (rule) => passiveRules.some(r => String(r?.rule || "").toLowerCase() === String(rule).toLowerCase());
        const hasFeat = (name) => (character.feats || []).some(f => String(f?.name || f).toLowerCase() === String(name || '').toLowerCase());
        const hasMageSlayer = hasFeat('Mage Slayer');
        const hasShieldMaster = hasFeat('Shield Master');
        const hasDungeonDelver = hasRule('dungeon_delver_bonuses');
        const abilities = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
        const abilityNames = {
            STR: 'Strength', DEX: 'Dexterity', CON: 'Constitution',
            INT: 'Intelligence', WIS: 'Wisdom', CHA: 'Charisma'
        };

        for (const abbr of abilities) {
            const score = character.abilities?.[abbr] ?? character.abilities?.[abbr.toLowerCase()] ?? 10;
            const mod = global.DDRules.abilityMod(score);
            const isProficient = proficientSaves.includes(abbr);
            const totalMod = mod + (isProficient ? pb : 0);

            const li = document.createElement('li');
            li.className = 'save-item';
            if (isProficient) {
                li.classList.add('proficient');
            }
            const tips = [];
            if (hasMageSlayer) tips.push('Mage Slayer: advantage on saves vs spells cast by creatures within 5 feet.');
            if (hasDungeonDelver) tips.push('Dungeon Delver: advantage on saves to avoid/resist traps.');
            if (hasShieldMaster && abbr === 'DEX') {
                tips.push('Shield Master: add shield AC bonus to Dex saves vs effects targeting only you; reaction to take no damage on success for half-damage effects.');
            }
            if (tips.length) {
                li.classList.add('tooltip');
                li.dataset.tooltip = tips.join('\n');
            }

            li.innerHTML = `
                <span class="save-mod">${global.DDRules.fmtMod(totalMod)}</span>
                <span class="save-name">${abilityNames[abbr]}</span>
            `;
            container.appendChild(li);
        }
    }

    const ALL_SKILLS = [
        { name: 'Acrobatics',      ability: 'DEX' }, { name: 'Animal Handling', ability: 'WIS' },
        { name: 'Arcana',          ability: 'INT' }, { name: 'Athletics',       ability: 'STR' },
        { name: 'Deception',       ability: 'CHA' }, { name: 'History',         ability: 'INT' },
        { name: 'Insight',         ability: 'WIS' }, { name: 'Intimidation',    ability: 'CHA' },
        { name: 'Investigation',   ability: 'INT' }, { name: 'Medicine',        ability: 'WIS' },
        { name: 'Nature',          ability: 'INT' }, { name: 'Perception',      ability: 'WIS' },
        { name: 'Performance',     ability: 'CHA' }, { name: 'Persuasion',      ability: 'CHA' },
        { name: 'Religion',        ability: 'INT' }, { name: 'Sleight of Hand', ability: 'DEX' },
        { name: 'Stealth',         ability: 'DEX' }, { name: 'Survival',        ability: 'WIS' },
    ];

    function hasNamedFeature(character, name) {
        if (!character || !name) return false;
        const needle = String(name).toLowerCase();
        // Combine features from multiple common locations in the JSON
        const allFeatures = [
            ...(character.features || []),
            ...(character.traits || []),
            ...(character.feats || [])
        ];
        return allFeatures.some(f => {
            const featureName = (typeof f === 'string') ? f : (f.name || '');
            return String(featureName).toLowerCase().includes(needle);
        });
    }

    /**
     * Renders the main combat-related stats.
     */
    async function renderCombatStats(character) {
        const acResult = await global.CharCalculations.calculateAC(character);
        F.ac().textContent = acResult.ac;

        const initResult = global.CharCalculations.computeInitiative(character);
        F.initiative().textContent = global.DDRules.fmtMod(initResult.value);

        const speedResult = await global.CharCalculations.calculateSpeed(character);
        F.speed().textContent = `${speedResult.total} ft.`;

        F.maxHP().textContent = character.maxHP || 10;
        F.currentHP().value = character.currentHP ?? character.maxHP ?? 10;

        const pb = global.DDRules.proficiencyFromLevel(character.level);
        F.profBonus().textContent = global.DDRules.fmtMod(pb);

        const passivePercMod = await getPerceptionModifier(character);
        F.passivePerception().textContent = 10 + passivePercMod;
    }

    function getSkillProficiencyLevel(character, skillName) {
        const skills = character.skills || {};
        const profs = character.proficiencies?.skills || [];
        const skillKey = Object.keys(skills).find(k => k.toLowerCase() === skillName.toLowerCase());

        const skillValue = skillKey ? skills[skillKey] : null;
        if (skillValue === 'expertise' || skillValue === 2 || skillValue === '2') return 2;
        if (skillValue === true || skillValue === 1 || skillValue === '1') return 1;

        if (profs.some(s => String(s).toLowerCase() === skillName.toLowerCase())) return 1;

        if (hasNamedFeature(character, 'Jack of All Trades')) {
            // Jack of All Trades applies only if not already proficient.
            if (skillValue === null && !profs.some(s => String(s).toLowerCase() === skillName.toLowerCase())) {
                return 0.5;
            }
        }

        return 0;
    }

    async function getPerceptionModifier(character) {
        const wisMod = global.DDRules.abilityMod(character?.abilities?.WIS ?? 10);
        const pb = global.DDRules.proficiencyFromLevel(character.level || 1);
        const profLevel = getSkillProficiencyLevel(character, 'Perception');
        const profBonus = Math.floor(pb * profLevel);

        const hasObservant = (character.feats || []).some(f => String(f).toLowerCase() === 'observant');
        const misc = (hasObservant ? 5 : 0) + Number(character.bonusPassivePerception || 0);

        return wisMod + profBonus + misc;
    }

    function bestDexOrStr(character) {
        const dex = global.DDRules.abilityMod(character?.abilities?.DEX ?? 10);
        const str = global.DDRules.abilityMod(character?.abilities?.STR ?? 10);
        return (dex >= str) ? { key: "DEX", mod: dex } : { key: "STR", mod: str };
    }

    function normalizeWeaponItem(item) {
        if (!item) return null;
        if (item.rules?.weapon) {
            const w = item.rules.weapon;
            return {
                name: item.name,
                weapon_range: String(item.subtype || '').includes('ranged') ? 'ranged' : 'melee',
                properties: (w.properties || []).map(p => ({ name: p })),
                damage: w.damage
                    ? { damage_dice: w.damage.dice, damage_type: { name: w.damage.type } }
                    : null
            };
        }
        if (item.weapon) {
            return {
                name: item.name,
                weapon_range: item.weapon.range,
                properties: (item.weapon.properties || []).map(p => ({ name: p })),
                damage: item.weapon.damage
                    ? { damage_dice: item.weapon.damage.dice, damage_type: { name: item.weapon.damage.type } }
                    : null
            };
        }
        return item;
    }

    async function renderAttacks(character) {
        const container = F.attacksContainer();
        if (!container) return;
        container.innerHTML = ''; // Clear

        const weaponNames = global.getEquippedWeapons(character);
        if (weaponNames.length === 0) {
            container.innerHTML = '<div>— No weapons equipped —</div>';
        }

        for (const name of weaponNames) {
            const item = await global.getEquipmentByName(name);
            const weapon = normalizeWeaponItem(item);
            if (weapon && weapon.damage) {
                const isRanged = String(weapon.weapon_range || "").toLowerCase() === "ranged"
                    || String(item?.subtype || '').toLowerCase().includes('ranged')
                    || global.DDRules.propHas(weapon, 'ammunition');
                const finesse = global.DDRules.propHas(weapon, "finesse");

                let abilKey = isRanged ? "DEX" : "STR";
                const abilityPref = String(item?.rules?.weapon?.ability || '').toLowerCase();
                if (abilityPref === 'dex') abilKey = "DEX";
                else if (abilityPref === 'str') abilKey = "STR";
                else if (abilityPref === 'str_or_dex' || finesse) abilKey = bestDexOrStr(character).key;

                const abilityScore = character.abilities?.[abilKey] ?? character.abilities?.[abilKey.toLowerCase()] ?? 10;
                const mod = global.DDRules.abilityMod(abilityScore);
                const pb = global.DDRules.proficiencyFromLevel(character.level);
                
                // For simplicity, assume proficiency with all equipped weapons.
                const proficient = true; 
                const effectAtk = (item?.effects || []).reduce((acc, eff) => {
                    if (String(eff?.when || '').toLowerCase() !== 'equipped') return acc;
                    if (String(eff?.kind || '').toLowerCase() !== 'attack') return acc;
                    const applies = String(eff?.appliesTo || '').toLowerCase();
                    if (!applies.startsWith('weapon')) return acc;
                    return acc + (Number(eff?.value || 0) || 0);
                }, 0);
                const effectDmg = (item?.effects || []).reduce((acc, eff) => {
                    if (String(eff?.when || '').toLowerCase() !== 'equipped') return acc;
                    if (String(eff?.kind || '').toLowerCase() !== 'damage') return acc;
                    const applies = String(eff?.appliesTo || '').toLowerCase();
                    if (!applies.startsWith('weapon')) return acc;
                    return acc + (Number(eff?.value || 0) || 0);
                }, 0);
                const magicBonus = Number(weapon.attack_bonus ?? weapon.magic_bonus ?? 0) + effectAtk;
                const gearBonus = (() => {
                    const gear = Array.isArray(character?.equipment?.gear) ? character.equipment.gear : [];
                    const keys = [item?.id, item?.key, item?.index, item?.name].filter(Boolean).map(k => String(k).toLowerCase());
                    const match = gear.find(g => {
                        const ref = String(g?.ref || '').toLowerCase();
                        const gname = String(g?.name || '').toLowerCase();
                        return (ref && keys.includes(ref)) || (gname && keys.includes(gname));
                    });
                    return Number(match?.modifier || 0) || 0;
                })();
                
                const toHit = mod + (proficient ? pb : 0) + magicBonus + gearBonus;
                const dmgMod = mod + magicBonus + gearBonus + effectDmg;

                const tooltip = await global.Tooltips.gearTooltipFor(item);

                const attackRow = document.createElement('div');
                attackRow.className = 'attack-row tooltip';
                attackRow.setAttribute('data-tooltip', tooltip);
                attackRow.innerHTML = `
                    <span class="attack-name">${item.name}:</span> 
                    <span class="attack-hit">${global.DDRules.fmtMod(toHit)} to hit,</span>
                    <span class="attack-damage">${weapon.damage.damage_dice}${dmgMod !== 0 ? global.DDRules.fmtMod(dmgMod) : ''} ${weapon.damage.damage_type.name}</span>
                `;
                container.appendChild(attackRow);
            }
        }
    }

    async function renderSkills(character) {
        const container = F.skillsContainer();
        if (!container) return;
        container.innerHTML = '';

        const pb = global.DDRules.proficiencyFromLevel(character.level);
        const passiveRules = Array.isArray(character?.passiveRules) ? character.passiveRules : [];
        const hasRule = (rule) => passiveRules.some(r => String(r?.rule || "").toLowerCase() === String(rule).toLowerCase());
        const hasDungeonDelver = hasRule('dungeon_delver_bonuses');
        const hasSkulker = hasRule('skulker');

        for (const skill of ALL_SKILLS) {
            const abilityScore = character.abilities?.[skill.ability] ?? character.abilities?.[skill.ability.toLowerCase()] ?? 10;
            const abilityMod = global.DDRules.abilityMod(abilityScore);
            const profLevel = getSkillProficiencyLevel(character, skill.name);
            const profBonus = Math.floor(pb * profLevel);
            const checkBonusInfo = (typeof global.DDRules.getAbilityCheckBonus === 'function')
                ? global.DDRules.getAbilityCheckBonus(character, skill.ability, skill.name)
                : { bonus: 0, sources: [] };
            const checkBonus = Number(checkBonusInfo?.bonus || 0) || 0;
            const totalMod = abilityMod + profBonus + checkBonus;

            const li = document.createElement('li');
            li.className = 'skill-item';
            if (profLevel === 1) li.classList.add('proficient');
            if (profLevel === 2) li.classList.add('expertise');

            li.innerHTML = `
                <span class="skill-mod">${global.DDRules.fmtMod(totalMod)}</span>
                <span class="skill-name">${skill.name}</span>
                <span class="skill-ability">(${skill.ability})</span>
            `;
            const tips = [];
            if (hasDungeonDelver && (skill.name === 'Perception' || skill.name === 'Investigation')) {
                tips.push('Dungeon Delver: advantage on checks to detect secret doors.');
            }
            if (hasSkulker && skill.name === 'Perception') {
                tips.push('Skulker: dim light doesn\'t impose disadvantage on Perception checks relying on sight.');
            }
            if (checkBonus && Array.isArray(checkBonusInfo?.sources)) {
                tips.push(...checkBonusInfo.sources);
            }
            if (tips.length) {
                li.classList.add('tooltip');
                li.dataset.tooltip = tips.join('\n');
            }
            container.appendChild(li);
        }
    }

    async function renderFeatures(character) {
        const container = F.featuresContainer();
        if (!container) return;
        container.innerHTML = '';

        const features = await global.loadAllFeatures(character);

        // De-duplicate features to show specific choices over generic placeholders.
        const suppressedBases = new Set();
        const seenNames = new Set();
        const finalFeatures = [];

        for (const f of features) {
            const name = String(f.name || '').trim();
            if (name.includes(':')) {
                const baseName = name.split(':')[0].trim().toLowerCase();
                suppressedBases.add(baseName);
            }
        }

        for (const f of features) {
            const name = String(f.name || '').trim();
            const lowerName = name.toLowerCase();
            if (/^ability score (improvement|increase)$/i.test(name)) continue;

            if (seenNames.has(lowerName)) continue;

            let isGenericAndSuppressed = false;
            for (const base of suppressedBases) {
                if (lowerName.startsWith(base) && !lowerName.includes(':')) {
                    isGenericAndSuppressed = true;
                    break;
                }
            }
            if (isGenericAndSuppressed) continue;

            finalFeatures.push(f);
            seenNames.add(lowerName);
        }

        if (finalFeatures.length === 0) {
            container.innerHTML = '<div>— No features listed —</div>';
            return;
        }

        for (const f of finalFeatures) {
            const featureEl = document.createElement('div');
            featureEl.className = 'feature-item tooltip';
            featureEl.textContent = f.name;
            if (f.desc) {
                featureEl.setAttribute('data-tooltip', f.desc);
            }
            container.appendChild(featureEl);
        }
    }

    async function renderEquipment(character) {
        const container = F.equipmentContainer();
        if (!container) return;
        container.innerHTML = '';

        const items = global.normalizeGearList(character);

        if (!items.length) {
            container.innerHTML = '<div>— No equipment listed —</div>';
            return;
        }

        const list = document.createElement('ul');
        list.className = 'equipment-item-list';

        for (const it of items) {
            const qty = it.qty > 1 ? `${it.qty}× ` : '';
            const label = `${qty}${it.name}`;
            const tt = await global.Tooltips.gearTooltipFor(it);
            
            const li = document.createElement('li');
            li.className = 'tooltip';
            li.textContent = label;
            if (tt) {
                li.setAttribute('data-tooltip', tt);
            }
            list.appendChild(li);
        }
        container.appendChild(list);
    }

    function racialSpells(character){
        const out = { cantrips:[], leveled:[] };
        const race = String(character?.race||'').toLowerCase();
        const level = character.level || 1;
        
        if (race.includes('tiefling')){
            out.cantrips.push({ name:'Thaumaturgy', level:0, badge:'Racial' });
            if (level >= 3) out.leveled.push({ name:'Hellish Rebuke', level:1, badge:'Racial' });
            if (level >= 5) out.leveled.push({ name:'Darkness', level:2, badge:'Racial' });
        } 
        else if (race.includes('drow') || race.includes('dark elf')) {
            out.cantrips.push({ name: 'Dancing Lights', level: 0, badge: 'Racial' });
            if (level >= 3) out.leveled.push({ name: 'Faerie Fire', level: 1, badge: 'Racial' });
            if (level >= 5) out.leveled.push({ name: 'Darkness', level: 2, badge: 'Racial' });
        }
        // For races with a choice of cantrip like High Elf, it's best to add the chosen spell
        // to the main `spells: []` array in the character's JSON file.
        
        return out;
    }

    async function subclassSpells(character) {
        const out = [];
        const subclassName = global.pickSubclassName(character);
        if (!subclassName) return out;

        const subclasses = await global.loadSubclassesLocal();
        const sub = subclasses.find(s => 
            s.name.toLowerCase() === subclassName.toLowerCase() && 
            s.class.toLowerCase() === character.class.toLowerCase()
        );

        if (sub) {
            const badge = sub.name.split(' ').pop(); // e.g., "Domain", "Spores"
            if (sub.alwaysPreparedSpells) {
                for (const level in sub.alwaysPreparedSpells) {
                    if (character.level >= Number(level)) {
                        sub.alwaysPreparedSpells[level].forEach(name => out.push({ name, level: Number(level), badge }));
                    }
                }
            }
            if (sub.bonusCantrips) {
                 for (const level in sub.bonusCantrips) {
                     if (character.level >= Number(level)) {
                        sub.bonusCantrips[level].forEach(name => out.push({ name, level: 0, badge }));
                    }
                }
            }
        }
        return out;
    }

    async function getAllCharacterSpells(character) {
        const allSpells = await global.loadSpells();
        if (!allSpells || allSpells.length === 0) return [];
        const spellIndex = new Map(allSpells.map(s => [s.name.toLowerCase(), s]));
        const explicitSources = Object.fromEntries(
            Object.entries(character?.spellSources || {}).map(([k, v]) => [String(k || '').toLowerCase(), String(v || '').trim()])
        );

        const spellBook = new Map();

        const addSpell = (spell) => {
            const spellData = spellIndex.get(spell.name.toLowerCase());
            if (spellData) {
                const key = spellData.name.toLowerCase();
                const existing = spellBook.get(key);

                // If it doesn't exist, add it.
                if (!existing) {
                    spellBook.set(key, { 
                        ...spellData, 
                        source: spell.badge || 'Class', 
                        locked: !!spell.locked 
                    });
                } 
                // If it exists, but the new one is locked, update it to be locked.
                else if (spell.locked && !existing.locked) {
                    existing.locked = true;
                    existing.source = spell.badge || existing.source; // Update source if new one is more specific
                } else if (spell.forceSource && spell.badge) {
                    existing.source = spell.badge;
                }
            }
        };

        const charClass = String(character.class || '').toLowerCase();
        const maxLevel = global.DDRules.getMaxSpellLevelFor(character);

        // 1. Handle casters who have access to their full class list (Clerics, Druids, Paladins)
        const fullListCasters = ['cleric', 'druid', 'paladin'];
        if (fullListCasters.includes(charClass)) {
            allSpells.forEach(spell => {
                const canLearn = (spell.classes || []).some(c => c.toLowerCase() === charClass);
                if (canLearn && spell.level <= maxLevel) {
                    addSpell({ name: spell.name, badge: 'Class List' });
                }
            });
        }

        // 2. Add spells explicitly listed on the character (for Wizards, Bards, Sorcerers, etc.)
        (character.spells || []).forEach(name => {
            const key = String(name || '').toLowerCase();
            const badge = explicitSources[key] || 'Known';
            addSpell({ name, badge, forceSource: !!explicitSources[key] });
        });

        // 3. Add innate spells from race and subclass, and mark them as "always prepared" (locked)
        const racial = racialSpells(character);
        racial.cantrips.forEach(s => addSpell({ ...s, locked: true }));
        racial.leveled.forEach(s => addSpell({ ...s, locked: true }));
        
        const subclass = await subclassSpells(character);
        subclass.forEach(s => addSpell({ ...s, locked: true }));

        const characterSpells = Array.from(spellBook.values());
        characterSpells.sort((a, b) => (a.level - b.level) || a.name.localeCompare(b.name));
        return characterSpells;
    }

    function getPrepLimit(character) {
        const cls = String(character.class || '').toLowerCase();
        const level = Number(character.level) || 1;
        const stats = global.DDRules.computeSpellStats(character);
        if (!stats) return 0;

        const mod = stats.mod;

        if (['cleric', 'druid', 'wizard'].includes(cls)) {
            return Math.max(1, level + mod);
        }
        if (cls === 'artificer' || cls === 'paladin') {
            return Math.max(1, Math.floor(level / 2) + mod);
        }
        // Other classes like Bard, Sorcerer, Ranger, Warlock are "known" casters,
        // they don't prepare from a list in the same way.
        return 0;
    }

    function handleSpellPrepToggle(event) {
        const spellItem = event.target.closest('.spell-item.preparable');
        if (!spellItem) return;

        const character = global.getCurrentCharacter();
        if (!character) return;

        const spellName = spellItem.dataset.spellName;
        const spellLevel = spellItem.dataset.spellLevel;
        if (!spellName || spellLevel === '0') return; // Can't prepare/unprepare cantrips

        const spellState = global.readSpellState(character) || {};
        if (!spellState.preparedByLevel) spellState.preparedByLevel = {};
        if (!spellState.preparedByLevel[spellLevel]) spellState.preparedByLevel[spellLevel] = [];

        const prepLimit = getPrepLimit(character);
        const preparedList = spellState.preparedByLevel[spellLevel];
        const isPrepared = preparedList.includes(spellName);

        if (isPrepared) {
            const index = preparedList.indexOf(spellName);
            preparedList.splice(index, 1);
        } else {
            const totalPrepared = Object.values(spellState.preparedByLevel).flat().length;
            if (prepLimit > 0 && totalPrepared >= prepLimit) {
                alert(`Preparation limit of ${prepLimit} reached.`);
                return;
            }
            preparedList.push(spellName);
        }
        global.writeSpellState(character, spellState);
        renderSpells(character);
    }

    function handleSlotInteraction(event) {
        const character = global.getCurrentCharacter();
        if (!character) return;

        const pip = event.target.closest('.spell-slot-pip');
        const resetButton = event.target.closest('.spell-slot-reset');

        if (!pip && !resetButton) return;

        // The 'change' event on the checkbox fires before the click bubbles up,
        // so we need to give the DOM a moment to update the 'checked' state.
        setTimeout(() => {
            const slotsContainer = event.target.closest('.spell-slots');
            if (!slotsContainer) return;

            const level = slotsContainer.dataset.level;
            const pips = slotsContainer.querySelectorAll('.spell-slot-pip');
            const label = slotsContainer.querySelector('.spell-slots-label');

            if (resetButton) {
                pips.forEach(p => p.checked = false);
            }

            const usedCount = Array.from(pips).filter(p => p.checked).length;

            const spellState = global.readSpellState(character) || {};
            if (!spellState.used) spellState.used = {};
            spellState.used[level] = usedCount;
            global.writeSpellState(character, spellState);

            if (label) {
                label.textContent = `${pips.length - usedCount}/${pips.length}`;
            }
        }, 10);
    }

    async function renderSpells(character) {
        const container = F.spellsContainer();
        const statsContainer = F.spellStatsContainer();
        if (!container || !statsContainer) return;
        const spellAbilityOverrides = Object.fromEntries(
            Object.entries(character?.spellCastingAbilityOverrides || {}).map(([k, v]) => [
                String(k || '').toLowerCase(),
                String(v || '').trim().toUpperCase()
            ])
        );

        // Clear previous content and listeners
        container.innerHTML = '';
        statsContainer.innerHTML = '';
        container.removeEventListener('click', handleSpellPrepToggle);
        container.removeEventListener('click', handleSlotInteraction);

        const spellStats = global.DDRules.computeSpellStats(character);
        if (!spellStats) {
            container.innerHTML = '<div class="spell-level-group"><div>— Not a spellcaster —</div></div>';
            return;
        }

        const prepLimit = getPrepLimit(character);
        const spellState = global.readSpellState(character) || {};
        const totalPrepared = Object.values(spellState.preparedByLevel || {}).flat().length;

        let prepCounterHtml = '';
        if (prepLimit > 0) {
            prepCounterHtml = `<div class="stat-item"><strong>Prepared:</strong> <span id="spell-prep-count">${totalPrepared}/${prepLimit}</span></div>`;
        }

        // Render spellcasting stats (DC, Attack Bonus)
        statsContainer.innerHTML = `
            <div class="stat-item"><strong>Casting Ability:</strong> <span>${spellStats.ab}</span></div>
            <div class="stat-item"><strong>Spell Attack:</strong> <span>${global.DDRules.fmtMod(spellStats.atk)}</span></div>
            <div class="stat-item"><strong>Save DC:</strong> <span>${spellStats.dc}</span></div>
            ${prepCounterHtml}
        `;

        // Get all data needed for rendering
        const spells = await getAllCharacterSpells(character);
        if (spells.length === 0) {
            container.innerHTML = '<div class="spell-level-group"><div>— No spells known or prepared —</div></div>';
            return;
        }

        const spellsByLevel = spells.reduce((acc, spell) => {
            const level = spell.level;
            if (!acc[level]) acc[level] = [];
            acc[level].push(spell);
            return acc;
        }, {});
        
        const maxSlots = global.DDRules.slotsFor(character.class, character.level);
        if (!spellState.used) spellState.used = {};

        // Render Cantrips (Level 0)
        if (spellsByLevel[0] && spellsByLevel[0].length > 0) {
            const levelEl = document.createElement('div');
            levelEl.className = 'spell-level-group';
            levelEl.innerHTML = `<div class="spell-level-header"><h4>Cantrips</h4></div>`;
            const list = document.createElement('ul');
            list.className = 'spell-list';
            for (const spell of spellsByLevel[0]) {
                const item = document.createElement('li');
                item.className = 'spell-item tooltip';
                item.classList.add('prepared'); // Cantrips are always prepared
                item.dataset.spellName = spell.name;
                item.dataset.spellLevel = spell.level;
                item.dataset.locked = true;
                
                let badgeHtml = '';
                if (spell.source && spell.source !== 'Known') {
                    badgeHtml = `<span class="spell-badge">${spell.source}</span>`;
                }
                item.innerHTML = `<span class="spell-name-text">${spell.name}</span>${badgeHtml}`;

                const overrideAbility = spellAbilityOverrides[String(spell.name || '').toLowerCase()];
                const overrideNote = overrideAbility ? `\n\nUses ${overrideAbility} for this spell.` : '';
                item.setAttribute('data-tooltip', (spell.desc || 'No description available.') + overrideNote);
                list.appendChild(item);
            }
            levelEl.appendChild(list);
            container.appendChild(levelEl);
        }

        // Render Leveled Spells (Levels 1-9)
        for (let level = 1; level <= 9; level++) {
            const totalSlots = maxSlots[level] || 0;
            const levelSpells = spellsByLevel[level] || [];

            if (totalSlots === 0 && levelSpells.length === 0) continue;

            const levelEl = document.createElement('div');
            levelEl.className = 'spell-level-group';

            const headerEl = document.createElement('div');
            headerEl.className = 'spell-level-header';
            headerEl.innerHTML = `<h4>Level ${level}</h4>`;

            if (totalSlots > 0) {
                const usedSlots = spellState.used[level] || 0;
                const slotsEl = document.createElement('div');
                slotsEl.className = 'spell-slots';
                slotsEl.dataset.level = level;

                const pipsHtml = Array.from({ length: totalSlots }, (_, i) => 
                    `<input type="checkbox" class="spell-slot-pip" ${i < usedSlots ? 'checked' : ''}>`
                ).join('');

                slotsEl.innerHTML = `
                    <span class="spell-slots-label">${totalSlots - usedSlots}/${totalSlots}</span>
                    <div class="spell-slot-pips">${pipsHtml}</div>
                    <button class="spell-slot-reset" title="Reset Slots">↻</button>
                `;
                headerEl.appendChild(slotsEl);
            }
            levelEl.appendChild(headerEl);

            if (levelSpells.length > 0) {
                const list = document.createElement('ul');
                list.className = 'spell-list';

                const isKnownCaster = prepLimit === 0 && spellStats;
                levelSpells.sort((a, b) => {
                    const aIsPrepared = a.locked || isKnownCaster || (spellState.preparedByLevel?.[level] || []).includes(a.name);
                    const bIsPrepared = b.locked || isKnownCaster || (spellState.preparedByLevel?.[level] || []).includes(b.name);

                    if (aIsPrepared !== bIsPrepared) {
                        return aIsPrepared ? -1 : 1; // Prepared spells first
                    }
                    return a.name.localeCompare(b.name); // Then sort alphabetically
                });

                for (const spell of levelSpells) {
                    const isPrepared = spell.locked || isKnownCaster || (spellState.preparedByLevel?.[level] || []).includes(spell.name);
                    const item = document.createElement('li');
                    item.className = 'spell-item tooltip';
                    if (isPrepared) item.classList.add('prepared');
                    if (!spell.locked && prepLimit > 0) item.classList.add('preparable');

                    item.dataset.spellName = spell.name;
                    item.dataset.spellLevel = spell.level;
                    item.dataset.locked = spell.locked || false;
                    
                    let badgeHtml = '';
                    if (spell.source && spell.source !== 'Known') {
                        badgeHtml = `<span class="spell-badge">${spell.source}</span>`;
                    }
                    item.innerHTML = `<span class="spell-name-text">${spell.name}</span>${badgeHtml}`;

                    const overrideAbility = spellAbilityOverrides[String(spell.name || '').toLowerCase()];
                    const overrideNote = overrideAbility ? `\n\nUses ${overrideAbility} for this spell.` : '';
                    item.setAttribute('data-tooltip', (spell.desc || 'No description available.') + overrideNote);
                    list.appendChild(item);
                }
                levelEl.appendChild(list);
            }
            container.appendChild(levelEl);
        }

        // Attach a single event listener for all slot interactions
        container.addEventListener('click', handleSlotInteraction);
        container.addEventListener('click', handleSpellPrepToggle);
    }

    async function renderActions(character) {
        const container = F.actionsContainer();
        if (!container || typeof global.getCharacterActions !== 'function') {
            if(container) container.innerHTML = '<div>Action logic not loaded.</div>';
            return;
        }
        container.innerHTML = '';

        const actions = await global.getCharacterActions(character, {}); // Pass empty state for now

        const renderActionCategory = (title, actionList) => {
            if (!actionList || actionList.length === 0) return;

            const categoryEl = document.createElement('div');
            categoryEl.className = 'action-category';
            
            const titleEl = document.createElement('h3');
            titleEl.textContent = title;
            categoryEl.appendChild(titleEl);

            const listEl = document.createElement('ul');
            listEl.className = 'action-list';

            for (const action of actionList) {
                const itemEl = document.createElement('li');
                itemEl.className = 'action-item tooltip';
                itemEl.setAttribute('data-tooltip', action.desc || 'No description.');
                itemEl.innerHTML = `<span class="action-name">${action.name}</span>`;
                listEl.appendChild(itemEl);
            }
            categoryEl.appendChild(listEl);
            container.appendChild(categoryEl);
        };

        renderActionCategory('Actions', actions.action);
        renderActionCategory('Bonus Actions', actions.bonus);
        renderActionCategory('Reactions', actions.reaction);
    }

    /**
     * The main render function that orchestrates all the smaller renderers.
     */
    async function renderCharacter(character) {
        if (!character) return;
        global._character = character; // Store for easy access

        renderHeader(character);
        renderAbilities(character);
        renderSavingThrows(character);
        await renderCombatStats(character);
        await renderAttacks(character);
        await renderSkills(character);
        await renderFeatures(character);
        await renderEquipment(character);
        await renderActions(character);
        await renderSpells(character);
    }

    /**
     * Loads a character from a file and renders it.
     */
    async function renderFromCharacterFile(fileName) {
        const statusEl = document.getElementById('status');
        try {
            const character = await global.loadCharacter(fileName);
            if (!character) throw new Error(`Could not load ${fileName}`);

            global.setCurrentCharacter(fileName, character);
            global.setURLParam('char', fileName);

            await renderCharacter(character);
            if (statusEl) statusEl.textContent = `Loaded ${character.name || fileName}`;

        } catch (err) {
            console.error(err);
            if (statusEl) statusEl.textContent = `Error: ${err.message}`;
        }
    }

    /**
     * Initializes the page, toolbar, and loads the initial character.
     */
    function boot() {
        // Initialize the toolbar using the shared function
        if (typeof global.initToolbar === 'function') {
            global.initToolbar({
                onLoadCharacter: renderFromCharacterFile,
                onSaveCharacter: () => {
                    // Implement HP/state saving if needed
                    alert('Save functionality not yet implemented for this sheet.');
                }
            });
        }

        // Load initial character from URL param or default
        const params = new URLSearchParams(location.search);
        const initialChar = params.get('char') || global.getCharacterList()[0] || 'direcris-zzzxaaxthroth-new.json';
        renderFromCharacterFile(initialChar);
    }

    // Run on DOM load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

})(window);
