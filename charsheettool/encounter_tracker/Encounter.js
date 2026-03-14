import { Combatant } from './Combatant.js';
import { StateManager } from './StateManager.js';

// Floating Isles complications module toggle.
// Set to false to disable all related behavior quickly.
const ENABLE_TFI_COMPLICATIONS = true;
const TFI_COMPLICATION_HANDLING = {
    // Set each entry to 'auto' or 'manual'.
    shrink: 'manual',
    grow: 'manual',
    poly_blink_dog: 'auto',
    levitate: 'auto',
    levitate_lift: 'auto',
    collision: 'auto',
    on_fire: 'manual',
    blue_skin: 'manual',
    entangle: 'auto',
    swap: 'manual',
    confusion: 'auto',
    fly: 'auto',
    flaming_sphere: 'manual',
    goodberry_tree: 'manual',
    sprite_shot: 'auto',
    forget_languages: 'manual',
    phantasmal_force: 'auto',
    poly_giant_eagle: 'auto',
    slippery: 'manual',
    rain_cloud: 'manual',
    pixie_glamour: 'manual',
    dispel_harmful: 'auto'
};

export class Encounter {
    constructor() {
        this.combatants = [];
        this.monsterData = {};
        this.beastData = [];
        this.conditionsData = [];
        this.partyData = {};
        this.playerFileNames = [];
        this.monsterCounts = {};
        this.turnOrder = [];
        this.round = 0;
        this.pendingHpChanges = {};
        this.turnIndex = -1;
        this.aidDurationMs = 8 * 60 * 60 * 1000;
        this.aidHpBonus = 5;
        this.spellCompendium = {};
        this.tfiComplicationsEnabled = ENABLE_TFI_COMPLICATIONS;

        // DOM elements
        this.setupView = document.getElementById('setup-view');
        this.combatView = document.getElementById('combat-view');
        this.setupList = document.getElementById('setup-list');
        this.combatTracker = document.getElementById('combat-tracker');
        this.roundCounter = document.getElementById('round-counter');
        this.monsterTypeSelect = document.getElementById('monster-type');
        this.partySelectionList = document.getElementById('party-selection-list');

        this.handleCombatTrackerClick = this.handleCombatTrackerClick.bind(this);
    }

    async init() {
        await this.loadMonsters();
        await this.loadBeasts();
        await this.loadConditions();
        if (this.tfiComplicationsEnabled) {
            await this.loadSpellCompendium();
        }
        this.combatTracker.addEventListener('click', this.handleCombatTrackerClick);
        await this.loadParty();
        this.renderPartySelection();

        const savedState = StateManager.load();
        if (savedState && (savedState.combatants.length > 0 || savedState.turnOrder.length > 0)) {
            if (confirm("An encounter is in progress. Would you like to restore it?")) {
                this.restoreState(savedState);
            } else {
                StateManager.clear();
            }
        }
    }

    async loadMonsters() {
        try {
            const response = await fetch('output.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const monsterArray = await response.json();

            // Convert array to an object keyed by monster name for easy lookup
            this.monsterData = monsterArray.reduce((acc, monster) => {
                acc[monster.name] = monster;
                return acc;
            }, {});

            this.populateMonsterSelect();
        } catch (error) {
            console.error("Could not load monster data:", error);
            alert("Error: Could not load output.json. Check the console for details.");
        }
    }

    async loadBeasts() {
        try {
            // Assumes beasts.json is in the root /data folder
            const response = await fetch('../data/beasts.json');
            if (!response.ok) throw new Error('beasts.json not found');
            this.beastData = await response.json();
        } catch (error) {
            console.error("Could not load beasts data:", error);
        }
    }

    async loadConditions() {
        try {
            // Assumes conditions.json is in the root /data folder
            const response = await fetch('../data/conditions.json');
            if (!response.ok) throw new Error('conditions.json not found');
            this.conditionsData = await response.json();
            this.conditionsData.sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
            console.error("Could not load conditions data:", error);
        }
    }

    async loadParty() {
        try {
            // Use the shared function from storage.js to get the list of character files
            // These files are expected to be in the /data/ directory relative to the root.
            // The loadCharacter function in storage.js handles the pathing.
            this.playerFileNames = window.getCharacterList() || [];
        } catch (error) {
            console.warn("Could not load party data via getCharacterList():", error);
            this.playerFileNames = [];
        }
    }

    async loadSpellCompendium() {
        try {
            const response = await fetch('../data/spells.json');
            if (!response.ok) throw new Error(`spells.json status ${response.status}`);
            const spells = await response.json();
            const byName = {};
            for (const s of (Array.isArray(spells) ? spells : [])) {
                const key = String(s?.name || '').trim().toLowerCase();
                if (!key) continue;
                const desc = Array.isArray(s?.desc) ? s.desc.join(' ') : String(s?.desc || '');
                byName[key] = {
                    name: String(s?.name || key),
                    school: String(s?.school || ''),
                    level: Number(s?.level || 0),
                    range: String(s?.range || ''),
                    duration: String(s?.duration || ''),
                    desc: String(desc || '').trim()
                };
            }
            this.spellCompendium = byName;
        } catch (err) {
            console.warn('Could not load spell compendium for complication tooltips:', err);
            this.spellCompendium = {};
        }
    }

    escapeHtml(text) {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    spellTag(name) {
        const key = String(name || '').trim().toLowerCase();
        const base = this.spellCompendium?.[key] || null;
        if (!base) return `<em>${this.escapeHtml(name)}</em>`;
        const lead = base.level === 0 ? 'Cantrip' : `Level ${base.level}`;
        const tip = `${base.name} (${lead} ${base.school})\nRange: ${base.range}\nDuration: ${base.duration}\n${base.desc}`.trim();
        return `<span class="spell-ref" title="${this.escapeHtml(tip)}"><em>${this.escapeHtml(base.name)}</em></span>`;
    }

    abilityModFromCombatant(c, ability) {
        const ab = String(ability || '').trim().toUpperCase();
        if (!ab) return 0;
        if (c?.isPlayer) {
            const score = Number(c?.full_stats?.abilities?.[ab] ?? c?.full_stats?.abilities?.[ab.toLowerCase()] ?? 10);
            return Math.floor((score - 10) / 2);
        }
        const raw = String(c?.full_stats?.[`${ab}_mod`] || '(+0)');
        const n = Number(raw.replace(/[()]/g, ''));
        return Number.isFinite(n) ? n : 0;
    }

    rollSave(c, ability, dc) {
        const mod = this.abilityModFromCombatant(c, ability);
        const die = Math.floor(Math.random() * 20) + 1;
        const total = die + mod;
        return { die, mod, total, success: total >= Number(dc || 0) };
    }

    getTFIComplicationMode(onFailKey) {
        const key = String(onFailKey || '').trim();
        if (!key) return 'manual';
        return TFI_COMPLICATION_HANDLING[key] === 'auto' ? 'auto' : 'manual';
    }

    getComplicationTableEntry(roll) {
        if (roll <= 50) return { label: 'No Complication', html: 'No complication.' };
        if (roll <= 52) return { dc: 12, save: 'WIS', onFail: 'shrink', html: `Two spells collide causing a spray of wild magic. Make a DC 12 Wisdom saving throw. On a failed save, your legs shrink to half their size for 1 minute. While affected this way, your movement speed and jump distances are reduced by half.` };
        if (roll <= 54) return { dc: 12, save: 'WIS', onFail: 'grow', html: `Two spells collide causing a spray of wild magic. Make a DC 12 Wisdom saving throw. On a failed save, your legs grow to double their size for 1 minute. While affected this way, your movement speed and jump distances are doubled.` };
        if (roll <= 56) return { dc: 12, save: 'WIS', onFail: 'poly_blink_dog', html: `An errant spell catches you in the mayhem. Make a DC 12 Wisdom saving throw. On a failed save, you become polymorphed into a blink dog for 1 minute or until dispelled.` };
        if (roll <= 58) return { dc: 12, save: 'CHA', onFail: 'levitate', html: `Two spells collide causing a spray of wild magic. Make a DC 12 Charisma saving throw. On a failed save, you become affected by the ${this.spellTag('levitate')} spell for 1 minute.` };
        if (roll <= 60) return { dc: 12, save: 'CON', onFail: 'levitate_lift', html: `An errant spell catches you in the mayhem. Make a DC 12 Constitution saving throw. On a failed save, you are lifted 20 feet into the air and become affected by a ${this.spellTag('levitate')} spell until the end of your next turn.` };
        if (roll <= 62) return { dc: 12, save: 'STR', onFail: 'collision', html: `A flying fey collides with you suddenly. Make a DC 12 Strength saving throw. On a failed save, the collision causes you to take 1d6 bludgeoning damage and knocks you prone.` };
        if (roll <= 64) return { dc: 12, save: 'DEX', onFail: 'on_fire', html: `An errant spell catches you in the mayhem. Make a DC 12 Dexterity saving throw. On a failed save, you ignite. Until you take an action to douse the fire (or move through a pool), you take 5 (1d10) fire damage at the start of each of your turns.` };
        if (roll <= 66) return { dc: 12, save: 'CHA', onFail: 'blue_skin', html: `Two spells collide causing a spray of wild magic. Make a DC 12 Charisma saving throw. On a failed save, your skin turns a vibrant shade of blue. A ${this.spellTag('remove curse')} spell can end this effect.` };
        if (roll <= 68) return { dc: 12, save: 'STR', onFail: 'entangle', html: `An errant spell catches you in the mayhem. Make a DC 12 Strength saving throw. On a failed save, you become affected by an ${this.spellTag('entangle')} spell (escape DC 12).` };
        if (roll <= 70) return { dc: 12, save: 'CHA', onFail: 'swap', html: `Two spells collide causing a spray of wild magic. Make a DC 12 Charisma saving throw. On a failed save, you teleport, magically switching places with a random allied creature within 100 feet of you.` };
        if (roll <= 72) return { dc: 12, save: 'WIS', onFail: 'confusion', html: `An errant spell catches you in the mayhem. Make a DC 12 Wisdom saving throw. On a failed save, you become affected by a ${this.spellTag('confusion')} spell.` };
        if (roll <= 74) return { onFail: 'fly', html: `An errant spell catches you in the mayhem. You become the target of a ${this.spellTag('fly')} spell.` };
        if (roll <= 76) return { onFail: 'flaming_sphere', html: `Two spells collide causing a spray of wild magic. A ${this.spellTag('flaming sphere')} spell (save DC 12) spontaneously activates in an unoccupied space within 5 feet of you.` };
        if (roll <= 78) return { onFail: 'goodberry_tree', html: `The nearest tree to you suddenly sprouts 1d6 magical berries. Each berry grants the benefits of a berry created by a ${this.spellTag('goodberry')} spell.` };
        if (roll <= 80) return { onFail: 'sprite_shot', html: `You become the target of a stray shortbow attack by a sprite.` };
        if (roll <= 82) return { dc: 12, save: 'WIS', onFail: 'forget_languages', html: `Two spells collide causing a spray of wild magic. Make a DC 12 Wisdom saving throw. On a failed save, you forget all languages except for Sylvan for the next 8 hours.` };
        if (roll <= 84) return { dc: 12, save: 'INT', onFail: 'phantasmal_force', html: `An errant spell catches you in the mayhem. Make a DC 12 Intelligence saving throw. On a failed save, you become affected by a ${this.spellTag('phantasmal force')} spell.` };
        if (roll <= 86) return { dc: 12, save: 'WIS', onFail: 'poly_giant_eagle', html: `An errant spell catches you in the mayhem. Make a DC 12 Wisdom saving throw. On a failed save, you become polymorphed into a giant eagle for 1 minute or until dispelled.` };
        if (roll <= 88) return { onFail: 'slippery', html: `The ground in a 10-foot radius centered on you becomes slick with ice.` };
        if (roll <= 90) return { onFail: 'rain_cloud', html: `Two spells collide causing a spray of wild magic. A rain cloud appears right over your head and follows you around until the start of your next turn.` };
        if (roll <= 92) return { onFail: 'pixie_glamour', html: `Two spells collide causing a spray of wild magic. Everyone around you appears to be you and a confused-looking pixie for 1 turn, during which you can use actions and move as normal.` };
        return { onFail: 'dispel_harmful', html: `You become the target of a ${this.spellTag('dispel magic')} spell, ending one harmful effect of your choice.` };
    }

    showComplicationModal(title, html) {
        const existing = document.getElementById('tfi-complication-modal');
        if (existing) existing.remove();
        const wrap = document.createElement('div');
        wrap.id = 'tfi-complication-modal';
        wrap.style.position = 'fixed';
        wrap.style.inset = '0';
        wrap.style.background = 'rgba(0,0,0,0.55)';
        wrap.style.zIndex = '20000';
        wrap.style.display = 'flex';
        wrap.style.alignItems = 'center';
        wrap.style.justifyContent = 'center';
        const card = document.createElement('div');
        card.style.width = 'min(760px, 95vw)';
        card.style.maxHeight = '85vh';
        card.style.overflow = 'auto';
        card.style.background = '#f7f0df';
        card.style.border = '1px solid #8a6f43';
        card.style.borderRadius = '8px';
        card.style.padding = '14px';
        card.innerHTML = `<h3 style=\"margin:0 0 8px 0;\">${this.escapeHtml(title)}</h3><div style=\"line-height:1.4;\">${html}</div><div style=\"margin-top:12px;\"><button type=\"button\" id=\"tfi-complication-close\">Close</button></div>`;
        wrap.appendChild(card);
        document.body.appendChild(wrap);
        const close = () => wrap.remove();
        wrap.addEventListener('click', (ev) => { if (ev.target === wrap) close(); });
        card.querySelector('#tfi-complication-close')?.addEventListener('click', close);
    }

    applyComplicationPolymorph(target, beastName) {
        if (!target) return false;
        const pickName = (this.monsterData[`${beastName} -TFI`] ? `${beastName} -TFI` : beastName);
        const beast = this.monsterData[pickName];
        if (!beast) return false;
        target.transform(beast, { source: 'polymorph', transformedBy: target.id });
        const effects = this.ensureSpellEffects(target);
        const withoutOld = effects.filter(e => String(e?.id || '') !== 'tfi_complication_polymorph');
        withoutOld.push({
            id: 'tfi_complication_polymorph',
            name: `TFI Polymorph (${pickName})`,
            expiresRound: Number(this.round || 1) + 10
        });
        target.spellEffects = withoutOld;
        return true;
    }

    purgeExpiredTFIComplications() {
        if (!this.tfiComplicationsEnabled) return false;
        let changed = false;
        const nowRound = Number(this.round || 1);
        for (const c of (Array.isArray(this.turnOrder) ? this.turnOrder : [])) {
            const effects = this.ensureSpellEffects(c);
            const fx = effects.find(e => String(e?.id || '') === 'tfi_complication_polymorph');
            if (!fx) continue;
            if (Number(fx.expiresRound || 0) <= nowRound) {
                c.spellEffects = effects.filter(e => String(e?.id || '') !== 'tfi_complication_polymorph');
                if (c.isWildShaped && String(c.transformSource || '').toLowerCase() === 'polymorph') {
                    c.revert();
                }
                changed = true;
            }
        }
        return changed;
    }

    rollTFIComplicationForActiveTurn() {
        if (!this.tfiComplicationsEnabled) return;
        const active = this.turnOrder?.[this.turnIndex];
        if (!active || !active.isPlayer) return;

        const roll = Math.floor(Math.random() * 100) + 1;
        const entry = this.getComplicationTableEntry(roll);
        let html = `<p><strong>d100 Roll:</strong> ${roll}</p><p>${entry.html}</p>`;

        let failed = true;
        if (entry.save && entry.dc) {
            const save = this.rollSave(active, entry.save, entry.dc);
            failed = !save.success;
            html += `<p><strong>${entry.save} Save:</strong> d20 (${save.die}) ${save.mod >= 0 ? '+' : ''}${save.mod} = ${save.total} vs DC ${entry.dc} -> <strong>${save.success ? 'Success' : 'Failure'}</strong></p>`;
        }

        if (!failed) {
            html += `<p><strong>Outcome:</strong> No additional effect.</p>`;
            this.showComplicationModal(`${active.name}: Floating Isles Complication`, html);
            return;
        }

        const onFailKey = String(entry.onFail || '').trim();
        const mode = this.getTFIComplicationMode(onFailKey);
        if (mode !== 'auto') {
            html += `<p><strong>Resolution Mode:</strong> Manual</p>`;
            html += `<p><strong>Outcome:</strong> Apply this complication manually.</p>`;
            this.showComplicationModal(`${active.name}: Floating Isles Complication`, html);
            return;
        }

        switch (onFailKey) {
            case 'poly_blink_dog': {
                const ok = this.applyComplicationPolymorph(active, 'Blink Dog');
                html += `<p><strong>Outcome:</strong> ${ok ? 'Polymorphed into Blink Dog.' : 'Polymorph failed (creature block missing).'}</p>`;
                break;
            }
            case 'poly_giant_eagle': {
                const ok = this.applyComplicationPolymorph(active, 'Giant Eagle');
                html += `<p><strong>Outcome:</strong> ${ok ? 'Polymorphed into Giant Eagle.' : 'Polymorph failed (creature block missing).'}</p>`;
                break;
            }
            case 'collision': {
                const dmg = Math.floor(Math.random() * 6) + 1;
                active.currentHp = Math.max(0, Number(active.currentHp || 0) - dmg);
                active.conditions.add('prone');
                html += `<p><strong>Outcome:</strong> Took ${dmg} bludgeoning damage and is now prone.</p>`;
                break;
            }
            case 'entangle':
                active.conditions.add('restrained');
                html += `<p><strong>Outcome:</strong> Restrained by entangling growth (escape DC 12).</p>`;
                break;
            case 'confusion':
                active.conditions.add('confused');
                html += `<p><strong>Outcome:</strong> Affected by confusion.</p>`;
                break;
            case 'phantasmal_force':
                active.conditions.add('phantasmal force');
                html += `<p><strong>Outcome:</strong> Affected by phantasmal force.</p>`;
                break;
            case 'levitate':
            case 'levitate_lift':
                active.conditions.add('levitating');
                html += `<p><strong>Outcome:</strong> Affected by levitate.</p>`;
                break;
            case 'fly':
                active.conditions.add('flying');
                html += `<p><strong>Outcome:</strong> Affected by fly.</p>`;
                break;
            case 'sprite_shot': {
                const attackRoll = Math.floor(Math.random() * 20) + 1 + 6;
                if (attackRoll >= Number(active.ac || 10)) {
                    active.currentHp = Math.max(0, Number(active.currentHp || 0) - 1);
                    const save = this.rollSave(active, 'CON', 10);
                    html += `<p><strong>Sprite Attack:</strong> Hit (attack ${attackRoll} vs AC ${active.ac}), 1 piercing damage.</p>`;
                    html += `<p><strong>Con Save:</strong> d20 (${save.die}) ${save.mod >= 0 ? '+' : ''}${save.mod} = ${save.total} vs DC 10 -> <strong>${save.success ? 'Success' : 'Failure'}</strong></p>`;
                    if (!save.success) {
                        active.conditions.add('poisoned');
                        if (save.total <= 5) active.conditions.add('unconscious');
                    }
                } else {
                    html += `<p><strong>Sprite Attack:</strong> Missed (attack ${attackRoll} vs AC ${active.ac}).</p>`;
                }
                break;
            }
            case 'dispel_harmful': {
                const conds = Array.from(active.conditions || []);
                if (conds.length > 0) {
                    active.conditions.delete(String(conds[0]).toLowerCase());
                    html += `<p><strong>Outcome:</strong> Removed harmful effect: ${this.escapeHtml(conds[0])}.</p>`;
                } else {
                    html += `<p><strong>Outcome:</strong> No tracked harmful condition to remove.</p>`;
                }
                break;
            }
            default:
                html += `<p><strong>Outcome:</strong> Applied as narrative/manual effect.</p>`;
                break;
        }

        html += `<p><strong>Resolution Mode:</strong> Auto</p>`;
        this.showComplicationModal(`${active.name}: Floating Isles Complication`, html);
        this.saveState();
        this.renderCombatTracker();
        const activeCard = this.combatTracker.querySelector('.active-turn');
        if (activeCard) {
            activeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    populateMonsterSelect() {
        // Clear any existing options first to prevent duplicates
        this.monsterTypeSelect.innerHTML = '';

        const monsterNames = Object.keys(this.monsterData || {}).sort();

        if (monsterNames.length === 0) {
            const option = document.createElement('option');
            option.textContent = 'No monsters found!';
            option.disabled = true;
            this.monsterTypeSelect.appendChild(option);
            return;
        }

        for (const monsterName of monsterNames) {
            const option = document.createElement('option');
            option.value = monsterName;
            option.textContent = monsterName;
            this.monsterTypeSelect.appendChild(option);
        }
    }

    renderPartySelection() {
        this.partySelectionList.innerHTML = '';
        // The file names are the identifiers now
        this.playerFileNames.forEach(fileName => {
            const div = document.createElement('div');
            div.className = 'party-selection-item';
            // Use the file name as the ID and data attribute
            const characterName = fileName.replace('.json', '');
            div.innerHTML = `
                <input type="checkbox" id="player-select-${characterName}" data-name="${fileName}">
                <label for="player-select-${characterName}">${characterName.charAt(0).toUpperCase() + characterName.slice(1)}</label>
            `;
            this.partySelectionList.appendChild(div);
        });
    }

      addCombatant(data) {
        const combatant = new Combatant(data);
        this.combatants.push(combatant);
        return combatant;
    }

    addMonsters(type, count) {
        if (!this.monsterData[type]) {
            alert(`Monster type "${type}" not found.`);
            return;
        }
        const stats = this.monsterData[type];
        for (let i = 0; i < count; i++) {
            this.monsterCounts[type] = (this.monsterCounts[type] || 0) + 1;
            const name = `${type} ${this.monsterCounts[type]}`;
            // Create a data object for the combatant, including the unique name
            const combatantData = {
                ...stats, // Spread all stats from the JSON
                name: name
            };
            this.addCombatant(combatantData); // This no longer renders
        }
        this.renderSetupList();
        this.saveState();
    }

    renderSetupList() {
        this.setupList.innerHTML = '';
        this.combatants.forEach(c => {
            const item = document.createElement('div');
            item.className = 'combatant-setup-item';
            const isLinkedHomunculus = String(c?.summonType || '').toLowerCase() === 'homunculus_servant' && !!c?.controlledBy;
            const details = c.isPlayer
                ? `Player, AC: ${c.ac}`
                : (isLinkedHomunculus ? `Companion, AC: ${c.ac}` : `Monster, AC: ${c.ac}`);
            const bonus = c.initiativeBonus;
            const bonusString = bonus >= 0 ? `+${bonus}` : bonus;
            const initGroup = isLinkedHomunculus
                ? `<div class="initiative-group"><span class="initiative-bonus">Uses owner's initiative</span></div>`
                : `<div class="initiative-group">
                    <span class="initiative-bonus">${bonusString} to Initiative</span>
                    <input type="number" id="init-${c.id}" class="initiative-input" data-id="${c.id}" value="10">
                  </div>`;
            item.innerHTML = `
                <span class="combatant-name-details">${c.name} (${details})</span>
                ${initGroup}
            `;
            this.setupList.appendChild(item);
        });
    }

    start() {
        if (this.combatants.length === 0) {
            alert("Add some combatants before starting the encounter!");
            return;
        }

        this.combatants.forEach(c => {
            const input = document.getElementById(`init-${c.id}`);
            if (input) {
                c.initiative = parseInt(input.value, 10) || 0;
            }
        });

        // Controlled homunculi always share their owner's initiative.
        this.combatants.forEach(c => {
            if (String(c?.summonType || '').toLowerCase() !== 'homunculus_servant') return;
            if (!c.controlledBy) return;
            const owner = this.combatants.find(x => x.id === c.controlledBy);
            if (owner) c.initiative = Number(owner.initiative || 0);
        });

        this.turnOrder = [...this.combatants].sort((a, b) => b.initiative - a.initiative);
        this.round = 1;
        this.turnIndex = 0;
        this.purgeExpiredTFIComplications();

        this.setupView.classList.add('hidden');
        this.combatView.classList.remove('hidden');
        this.saveState();
        this.renderCombatTracker();
        this.rollTFIComplicationForActiveTurn();
        const activeCard = this.combatTracker.querySelector('.active-turn');
        if (activeCard) {
            activeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    nextTurn() {
        this.purgeExpiredSpellEffects();
        this.turnIndex++;
        if (this.turnIndex >= this.turnOrder.length) {
            this.turnIndex = 0;
            this.round++;
        }
        this.purgeExpiredTFIComplications();
        this.saveState();
        this.renderCombatTracker();
        this.rollTFIComplicationForActiveTurn();
        const activeCard = this.combatTracker.querySelector('.active-turn');
        if (activeCard) {
            activeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    previousTurn() {
        this.purgeExpiredSpellEffects();
        if (this.turnIndex <= 0 && this.round <= 1) return; // Can't go back from the very first turn.

        this.turnIndex--;
        if (this.turnIndex < 0) {
            this.turnIndex = this.turnOrder.length - 1;
            this.round--;
        }

        this.saveState();
        this.renderCombatTracker();
        const activeCard = this.combatTracker.querySelector('.active-turn');
        if (activeCard) {
            activeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    end() {
        if (!confirm("Are you sure you want to end the encounter?")) return;

        this.combatants = [];
        this.monsterCounts = {};
        this.turnOrder = [];
        this.round = 0;
        this.turnIndex = -1;

        StateManager.clear();
        this.combatView.classList.add('hidden');
        this.setupView.classList.remove('hidden');

        // Re-enable player checkboxes for the next encounter
        const allPlayerCheckboxes = document.querySelectorAll('#party-selection-list input[type="checkbox"]');
        allPlayerCheckboxes.forEach(checkbox => {
            checkbox.disabled = false;
        });
        this.renderSetupList();
    }

    getCombatantById(id) {
        return this.turnOrder.find(c => c.id === id);
    }

    getCombatantByIdAny(id) {
        if (!id) return null;
        return this.turnOrder.find(c => c.id === id) || this.combatants.find(c => c.id === id) || null;
    }

    ensureSpellEffects(combatant) {
        if (!combatant) return [];
        if (!Array.isArray(combatant.spellEffects)) combatant.spellEffects = [];
        return combatant.spellEffects;
    }

    getAidEffect(combatant) {
        const effects = this.ensureSpellEffects(combatant);
        return effects.find(e => String(e?.id || '').toLowerCase() === 'aid') || null;
    }

    hasAidEffect(combatant) {
        return !!this.getAidEffect(combatant);
    }

    getCombatantSpellNames(combatant) {
        const out = new Set();
        if (!combatant) return out;
        const stats = combatant.full_stats || {};

        const baseSpells = Array.isArray(stats?.spells) ? stats.spells : [];
        for (const s of baseSpells) {
            const n = String(s || '').trim().toLowerCase();
            if (n) out.add(n);
        }

        const sourceSpells = Object.keys(stats?.spellSources || {});
        for (const s of sourceSpells) {
            const n = String(s || '').trim().toLowerCase();
            if (n) out.add(n);
        }

        if (typeof window.readSpellState === 'function') {
            const spellState = window.readSpellState(stats) || {};
            const preparedByLevel = spellState.preparedByLevel || {};
            for (const arr of Object.values(preparedByLevel)) {
                if (!Array.isArray(arr)) continue;
                for (const s of arr) {
                    const n = String(s || '').trim().toLowerCase();
                    if (n) out.add(n);
                }
            }
        }

        return out;
    }

    canCastAid(combatant) {
        if (!combatant) return false;
        if (!combatant.isPlayer) return false;
        const known = this.getCombatantSpellNames(combatant);
        return known.has('aid');
    }

    formatDuration(ms) {
        const clamped = Math.max(0, Number(ms) || 0);
        const totalMin = Math.floor(clamped / 60000);
        const hours = Math.floor(totalMin / 60);
        const minutes = totalMin % 60;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }

    applyAidEffect(combatantId) {
        const combatant = this.getCombatantById(combatantId);
        if (!combatant) return;
        if (this.hasAidEffect(combatant)) {
            // Refresh duration on recast; Aid doesn't stack.
            const aid = this.getAidEffect(combatant);
            aid.expiresAt = Date.now() + this.aidDurationMs;
            return;
        }

        const effects = this.ensureSpellEffects(combatant);
        effects.push({
            id: 'aid',
            name: 'Aid',
            maxHpBonus: this.aidHpBonus,
            currentHpBonus: this.aidHpBonus,
            expiresAt: Date.now() + this.aidDurationMs
        });

        combatant.maxHp = Math.max(1, Number(combatant.maxHp || 0) + this.aidHpBonus);
        combatant.currentHp = Math.max(0, Math.min(combatant.maxHp, Number(combatant.currentHp || 0) + this.aidHpBonus));
    }

    removeAidEffect(combatantId) {
        const combatant = this.getCombatantByIdAny(combatantId);
        if (!combatant) return false;
        const effects = this.ensureSpellEffects(combatant);
        const idx = effects.findIndex(e => String(e?.id || '').toLowerCase() === 'aid');
        if (idx < 0) return false;

        const effect = effects[idx] || {};
        const hpBonus = Math.max(0, Number(effect.maxHpBonus || this.aidHpBonus));
        combatant.maxHp = Math.max(1, Number(combatant.maxHp || 1) - hpBonus);
        combatant.currentHp = Math.max(0, Math.min(combatant.maxHp, Number(combatant.currentHp || 0) - hpBonus));
        effects.splice(idx, 1);
        return true;
    }

    purgeExpiredSpellEffects() {
        const now = Date.now();
        let changed = false;
        const seen = new Set();
        const all = []
            .concat(Array.isArray(this.turnOrder) ? this.turnOrder : [])
            .concat(Array.isArray(this.combatants) ? this.combatants : []);
        for (const c of all) {
            if (!c || !c.id || seen.has(c.id)) continue;
            seen.add(c.id);
            const aid = this.getAidEffect(c);
            if (!aid) continue;
            const expiresAt = Number(aid.expiresAt || 0);
            if (Number.isFinite(expiresAt) && expiresAt > 0 && now >= expiresAt) {
                const removed = this.removeAidEffect(c.id);
                changed = changed || removed;
            }
        }
        if (changed) this.saveState();
        return changed;
    }

    syncHomunculusToCharacter(combatant, opts = {}) {
        if (!combatant) return;
        if (String(combatant?.summonType || '').toLowerCase() !== 'homunculus_servant') return;
        if (typeof window.writeHomunculusServantState !== 'function') return;

        const controller = this.getCombatantByIdAny(combatant.controlledBy);
        const ownerCharacter = controller?.full_stats || null;
        if (!ownerCharacter) return;

        const currentState = (typeof window.getHomunculusServantState === 'function')
            ? (window.getHomunculusServantState(ownerCharacter) || {})
            : {};
        const computed = (typeof window.getHomunculusServantStats === 'function')
            ? window.getHomunculusServantStats(ownerCharacter, currentState)
            : null;
        const maxHp = Math.max(1, Number(computed?.maxHP || combatant.maxHp || 1));
        const hp = Math.max(0, Math.min(maxHp, Number(combatant.currentHp || 0)));
        const forcedActive = Object.prototype.hasOwnProperty.call(opts, 'active')
            ? !!opts.active
            : (hp > 0);

        window.writeHomunculusServantState(ownerCharacter, {
            ...currentState,
            enabled: true,
            active: forcedActive,
            name: String(combatant.name || currentState.name || `${ownerCharacter.name}'s Homunculus`),
            currentHP: hp
        });
    }

    updateHp(combatantId, amount) {
        const combatant = this.getCombatantById(combatantId);
        if (!combatant) return;

        combatant.currentHp += amount;

        combatant.updateHp(amount);

        // --- HP change indicator logic ---
        const pending = this.pendingHpChanges[combatantId] || { amount: 0, timeoutId: null };
        if (pending.timeoutId) {
            clearTimeout(pending.timeoutId);
        }
        pending.amount += amount;
        pending.timeoutId = setTimeout(() => {
            delete this.pendingHpChanges[combatantId];
            this.renderCombatTracker(); // Re-render to remove the indicator
        }, 2000);
        this.pendingHpChanges[combatantId] = pending;
        // --- End of logic ---

        this.syncHomunculusToCharacter(combatant);

        this.saveState();
        this.renderCombatTracker(); // Re-render to show the change
    }

    async showWildShapeModal(combatantId) {
        const combatant = this.getCombatantById(combatantId);
        if (!combatant || !combatant.isPlayer) return;

        const modal = document.getElementById('wild-shape-modal');
        const backdrop = document.getElementById('modal-backdrop');
        const listEl = document.getElementById('ws-beast-list');
        const statBlockEl = document.getElementById('ws-stat-block-container');
        const searchEl = document.getElementById('ws-search');
        const transformBtn = document.getElementById('ws-modal-transform-btn');
        const closeBtn = document.getElementById('ws-modal-close-btn');

        const options = await window.CharCalculations.getWildShapeOptions(combatant.full_stats);
        let selectedBeast = null;

        const renderList = (filter = '') => {
            listEl.innerHTML = '';
            const filteredOptions = filter ? options.filter(o => o.name.toLowerCase().includes(filter.toLowerCase())) : options;
            filteredOptions.forEach(beast => {
                const item = document.createElement('div');
                item.className = 'ws-beast-item';
                item.textContent = `${beast.name} (CR ${beast.Challenge})`;
                item.onclick = () => {
                    selectedBeast = beast;
                    // Re-use the monster card renderer for the stat block display
                    const tempCombatant = new Combatant(beast);
                    statBlockEl.innerHTML = this._renderMonsterCard(tempCombatant).innerHTML;
                    document.querySelectorAll('.ws-beast-item.selected').forEach(el => el.classList.remove('selected'));
                    item.classList.add('selected');
                    transformBtn.disabled = false;
                };
                listEl.appendChild(item);
            });
        };

        searchEl.oninput = () => renderList(searchEl.value);
        renderList();
        statBlockEl.innerHTML = '<p style="text-align: center; color: #666; margin-top: 2em;">Select a beast to view its stats.</p>';
        transformBtn.disabled = true;

        modal.classList.remove('hidden');
        backdrop.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        const close = () => {
            modal.classList.add('hidden');
            backdrop.classList.add('hidden');
            document.body.style.overflow = '';
            transformBtn.onclick = null;
        };

        closeBtn.onclick = close;
        backdrop.onclick = close;

        transformBtn.onclick = () => {
            if (!selectedBeast) return;
            this.transformCombatant(combatantId, selectedBeast);
            close();
        };
    }

    showConditionModal(combatantId) {
        const combatant = this.getCombatantById(combatantId);
        if (!combatant) return;

        const modal = document.getElementById('generic-modal');
        const backdrop = document.getElementById('modal-backdrop');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        const confirmBtn = document.getElementById('modal-confirm-btn');
        const cancelBtn = document.getElementById('modal-cancel-btn');

        title.textContent = `Add/Remove Conditions for ${combatant.name}`;

        const conditionsHtml = this.conditionsData.map(cond => {
            const isChecked = combatant.conditions.has(cond.name.toLowerCase());
            const safeDesc = (cond.desc || '').replace(/"/g, '&quot;');
            return `
                <div class="condition-selection-item tooltip" data-tooltip="${cond.name}\n\n${safeDesc}">
                    <input type="checkbox" id="cond-select-${cond.name}" value="${cond.name}" ${isChecked ? 'checked' : ''}>
                    <label for="cond-select-${cond.name}">${cond.name}</label>
                </div>
            `;
        }).join('');

        body.innerHTML = `<div class="condition-selection-list">${conditionsHtml}</div>`;

        modal.classList.remove('hidden');
        backdrop.classList.remove('hidden');

        const close = () => {
            modal.classList.add('hidden');
            backdrop.classList.add('hidden');
            confirmBtn.onclick = null; // Clean up listener
        };

        cancelBtn.onclick = close;
        backdrop.onclick = close;

        confirmBtn.onclick = () => {
            const selectedConditions = new Set();
            body.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
                selectedConditions.add(cb.value.toLowerCase());
            });

            combatant.conditions = selectedConditions; // Replace the entire set
            this.saveState();
            this.renderCombatTracker();
            close();
        };
    }

    transformCombatant(combatantId, beastData) {
        const combatant = this.getCombatantById(combatantId);
        if (!combatant) return;
        combatant.transform(beastData, { source: 'wild_shape' });
        this.saveState();
        this.renderCombatTracker();
    }

    canUseFungalInfestation(combatant) {
        if (!combatant?.isPlayer || !combatant?.full_stats) return false;
        const cls = String(combatant.full_stats.class || '').toLowerCase();
        const build = String(combatant.full_stats.build || '').toLowerCase();
        const lvl = Number(combatant.full_stats.level || 1);
        return cls === 'druid' && build.includes('spores') && lvl >= 6;
    }

    canUseConjureAnimals(combatant) {
        if (!combatant?.isPlayer || !combatant?.full_stats) return false;
        const cls = String(combatant.full_stats.class || '').toLowerCase();
        const lvl = Number(combatant.full_stats.level || 1);
        // Conjure Animals is a 3rd-level spell available to Druids/Rangers.
        return (cls === 'druid' || cls === 'ranger') && lvl >= 5;
    }

    canCastPolymorph(combatant) {
        if (!combatant?.isPlayer || !combatant?.full_stats) return false;
        const stats = combatant.full_stats || {};
        const cls = String(stats.class || '').toLowerCase();
        const lvl = Number(stats.level || 1);
        const hasByClassLevel = ['bard', 'druid', 'sorcerer', 'warlock', 'wizard'].includes(cls) && lvl >= 7;
        const knownSpells = Array.isArray(stats.spells) ? stats.spells.map(s => String(s || '').toLowerCase()) : [];
        const sourceNames = Object.keys(stats.spellSources || {}).map(s => String(s || '').toLowerCase());
        const hasExplicit = knownSpells.includes('polymorph') || sourceNames.includes('polymorph');
        return hasByClassLevel || hasExplicit;
    }

    getPolymorphCrCap(target) {
        if (!target) return 0;
        if (target.isPlayer) return Math.max(0, Number(target?.full_stats?.level || 0));
        return Math.max(0, this.parseChallengeToNumber(target?.full_stats?.Challenge));
    }

    parseChallengeToNumber(rawChallenge) {
        const raw = String(rawChallenge || '').trim();
        if (!raw) return NaN;
        const first = raw.split(/\s+/)[0]; // "1/4 (50 XP)" -> "1/4"
        if (first.includes('/')) {
            const [a, b] = first.split('/').map(Number);
            if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return NaN;
            return a / b;
        }
        const n = Number(first);
        return Number.isFinite(n) ? n : NaN;
    }

    getConjureAnimalsOptions(maxCr) {
        const cap = Number(maxCr);
        const all = Array.isArray(this.beastData) ? this.beastData : [];
        return all
            .filter(b => Number.isFinite(this.parseChallengeToNumber(b?.Challenge)))
            .filter(b => this.parseChallengeToNumber(b?.Challenge) <= cap)
            .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')));
    }

    getConjureAnimalsMultiplier(slotLevel) {
        const slot = Number(slotLevel) || 3;
        if (slot >= 9) return 4;
        if (slot >= 7) return 3;
        if (slot >= 5) return 2;
        return 1;
    }

    getConjureAnimalsBaseOptions() {
        return [
            { key: 'one-cr2', label: 'One beast (CR 2 or lower)', baseCount: 1, maxCr: 2 },
            { key: 'two-cr1', label: 'Two beasts (CR 1 or lower)', baseCount: 2, maxCr: 1 },
            { key: 'four-crhalf', label: 'Four beasts (CR 1/2 or lower)', baseCount: 4, maxCr: 0.5 },
            { key: 'eight-crquarter', label: 'Eight beasts (CR 1/4 or lower)', baseCount: 8, maxCr: 0.25 }
        ];
    }

    showConjureAnimalsModal(casterId) {
        const caster = this.getCombatantById(casterId);
        if (!caster || !this.canUseConjureAnimals(caster)) return;

        const modal = document.getElementById('generic-modal');
        const backdrop = document.getElementById('modal-backdrop');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        const confirmBtn = document.getElementById('modal-confirm-btn');
        const cancelBtn = document.getElementById('modal-cancel-btn');

        const optionRows = this.getConjureAnimalsBaseOptions();
        title.textContent = `Conjure Animals (${caster.name})`;

        const slotOptions = [3, 5, 7, 9]
            .map(lvl => `<option value="${lvl}">Level ${lvl}</option>`)
            .join('');
        const rowOptions = optionRows
            .map((row, i) => `<option value="${i}">${row.label}</option>`)
            .join('');

        body.innerHTML = `
            <div class="condition-selection-list" style="display:grid;gap:0.6em;">
                <label>
                    Spell Slot Used
                    <select id="ca-slot-level">${slotOptions}</select>
                </label>
                <label>
                    Summoning Option
                    <select id="ca-option-row">${rowOptions}</select>
                </label>
                <label>
                    Beast Type
                    <select id="ca-beast-select"></select>
                </label>
                <div id="ca-preview" style="font-size:0.95em;color:#555;"></div>
            </div>
        `;

        const slotEl = body.querySelector('#ca-slot-level');
        const rowEl = body.querySelector('#ca-option-row');
        const beastEl = body.querySelector('#ca-beast-select');
        const previewEl = body.querySelector('#ca-preview');

        const rerender = () => {
            const row = optionRows[Number(rowEl.value) || 0];
            const slot = Number(slotEl.value) || 3;
            const multiplier = this.getConjureAnimalsMultiplier(slot);
            const totalCount = row.baseCount * multiplier;
            const beasts = this.getConjureAnimalsOptions(row.maxCr);

            beastEl.innerHTML = '';
            if (!beasts.length) {
                const empty = document.createElement('option');
                empty.value = '';
                empty.textContent = `No beasts found (CR ${row.maxCr} or lower)`;
                beastEl.appendChild(empty);
            } else {
                beasts.forEach((b, idx) => {
                    const opt = document.createElement('option');
                    opt.value = String(idx);
                    opt.textContent = `${b.name} (CR ${b.Challenge})`;
                    beastEl.appendChild(opt);
                });
            }
            previewEl.textContent = `This will summon ${totalCount} creature(s), all on one initiative count.`;
        };

        slotEl.onchange = rerender;
        rowEl.onchange = rerender;
        rerender();

        modal.classList.remove('hidden');
        backdrop.classList.remove('hidden');

        const close = () => {
            modal.classList.add('hidden');
            backdrop.classList.add('hidden');
            confirmBtn.onclick = null;
        };

        cancelBtn.onclick = close;
        backdrop.onclick = close;

        confirmBtn.onclick = () => {
            const row = optionRows[Number(rowEl.value) || 0];
            const slot = Number(slotEl.value) || 3;
            const multiplier = this.getConjureAnimalsMultiplier(slot);
            const totalCount = row.baseCount * multiplier;
            const beasts = this.getConjureAnimalsOptions(row.maxCr);
            const beastIndex = Number(beastEl.value);
            const chosen = beasts[beastIndex];
            if (!chosen) {
                alert('No valid beast selected.');
                return;
            }

            this.addConjuredAnimals(caster, chosen, totalCount, slot);
            close();
        };
    }

    addConjuredAnimals(caster, beastTemplate, count, slotLevel) {
        const qty = Math.max(1, Number(count) || 1);
        const key = `Conjured ${beastTemplate.name}`;
        this.monsterCounts[key] = this.monsterCounts[key] || 0;

        const created = [];
        for (let i = 0; i < qty; i++) {
            this.monsterCounts[key] += 1;
            const serial = this.monsterCounts[key];
            const summonName = `${beastTemplate.name} (Conjured ${serial})`;
            const fullStats = {
                ...beastTemplate,
                meta: `${String(beastTemplate?.meta || '').trim()} [Fey spirit; Conjure Animals]`
            };
            const combatantData = {
                ...fullStats,
                name: summonName,
                initiative: Number(caster.initiative || 0),
                controlledBy: caster.id,
                summonType: 'conjure_animals',
                summonedBySpell: 'Conjure Animals',
                summonedBySlot: Number(slotLevel || 3)
            };
            created.push(new Combatant(combatantData));
        }

        this.combatants.push(...created);
        const casterIndex = this.turnOrder.findIndex(c => c.id === caster.id);
        if (casterIndex >= 0) this.turnOrder.splice(casterIndex + 1, 0, ...created);
        else this.turnOrder.push(...created);

        this.saveState();
        this.renderCombatTracker();
    }

    hasConjuredAnimals(controllerId) {
        return this.turnOrder.some(c => c && c.controlledBy === controllerId && c.summonType === 'conjure_animals');
    }

    dismissConjuredAnimals(controllerId) {
        const controller = this.getCombatantById(controllerId);
        if (!controller) return;

        const summonedIds = new Set(
            this.turnOrder
                .filter(c => c && c.controlledBy === controllerId && c.summonType === 'conjure_animals')
                .map(c => c.id)
        );

        if (!summonedIds.size) {
            alert('No Conjure Animals summons to dismiss.');
            return;
        }

        const currentId = this.turnOrder[this.turnIndex]?.id || null;
        this.turnOrder = this.turnOrder.filter(c => !summonedIds.has(c.id));
        this.combatants = this.combatants.filter(c => !summonedIds.has(c.id));

        if (this.turnOrder.length === 0) {
            this.end();
            return;
        }

        const currentIdx = currentId ? this.turnOrder.findIndex(c => c.id === currentId) : -1;
        if (currentIdx >= 0) {
            this.turnIndex = currentIdx;
        } else if (this.turnIndex >= this.turnOrder.length) {
            this.turnIndex = this.turnOrder.length - 1;
        }

        this.saveState();
        this.renderCombatTracker();
    }

    showPolymorphModal(casterId) {
        const caster = this.getCombatantById(casterId);
        if (!caster || !this.canCastPolymorph(caster)) return;

        const validTargets = this.turnOrder.filter(c => c && Number(c.currentHp || 0) > 0 && !c.isWildShaped);
        if (!validTargets.length) {
            alert('No valid target for Polymorph.');
            return;
        }

        const modal = document.getElementById('generic-modal');
        const backdrop = document.getElementById('modal-backdrop');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        const confirmBtn = document.getElementById('modal-confirm-btn');
        const cancelBtn = document.getElementById('modal-cancel-btn');

        title.textContent = `Polymorph (${caster.name})`;
        body.innerHTML = `
            <div class="condition-selection-list" style="display:grid;gap:0.6em;">
                <label>
                    Target
                    <select id="pm-target-select"></select>
                </label>
                <label>
                    Beast Form
                    <select id="pm-beast-select"></select>
                </label>
                <div id="pm-preview" style="font-size:0.95em;color:#555;"></div>
            </div>
        `;

        const targetEl = body.querySelector('#pm-target-select');
        const beastEl = body.querySelector('#pm-beast-select');
        const previewEl = body.querySelector('#pm-preview');

        validTargets.forEach((t, idx) => {
            const opt = document.createElement('option');
            opt.value = String(idx);
            opt.textContent = `${t.name} (${t.isPlayer ? `Level ${t?.full_stats?.level || 1}` : `CR ${t?.full_stats?.Challenge || '?'}`})`;
            targetEl.appendChild(opt);
        });

        const rerender = () => {
            const target = validTargets[Number(targetEl.value) || 0];
            const cap = this.getPolymorphCrCap(target);
            const beasts = this.getConjureAnimalsOptions(cap);
            beastEl.innerHTML = '';
            if (!beasts.length) {
                const empty = document.createElement('option');
                empty.value = '';
                empty.textContent = `No beasts found (CR ${cap} or lower)`;
                beastEl.appendChild(empty);
            } else {
                beasts.forEach((b, idx) => {
                    const opt = document.createElement('option');
                    opt.value = String(idx);
                    opt.textContent = `${b.name} (CR ${b.Challenge})`;
                    beastEl.appendChild(opt);
                });
            }
            previewEl.textContent = `CR cap for ${target?.name || 'target'}: ${cap}.`;
        };

        targetEl.onchange = rerender;
        rerender();

        modal.classList.remove('hidden');
        backdrop.classList.remove('hidden');

        const close = () => {
            modal.classList.add('hidden');
            backdrop.classList.add('hidden');
            confirmBtn.onclick = null;
        };

        cancelBtn.onclick = close;
        backdrop.onclick = close;

        confirmBtn.onclick = () => {
            const target = validTargets[Number(targetEl.value) || 0];
            if (!target) {
                alert('Choose a target.');
                return;
            }
            const cap = this.getPolymorphCrCap(target);
            const beasts = this.getConjureAnimalsOptions(cap);
            const picked = beasts[Number(beastEl.value)];
            if (!picked) {
                alert('Choose a beast form.');
                return;
            }
            target.transform(picked, { source: 'polymorph', transformedBy: caster.id });
            this.saveState();
            this.renderCombatTracker();
            close();
        };
    }

    getFungalInfestationEligibleCorpses() {
        const getMeta = (c) => String(c?.full_stats?.meta || '').toLowerCase();
        const parseMeta = (meta) => {
            const part = String(meta || '').split(',')[0].trim();
            const words = part.split(/\s+/).filter(Boolean);
            if (words.length < 2) return { size: '', type: '' };
            return { size: words[0], type: words[1] };
        };
        const validSizes = new Set(['small', 'medium']);
        const validTypes = new Set(['beast', 'humanoid']);
        return this.turnOrder.filter(c => {
            if (!c || c.currentHp > 0) return false;
            if (c.isPlayer) return false;
            if (c.fungalConsumed) return false;
            const meta = getMeta(c);
            if (!meta) return false;
            const { size, type } = parseMeta(meta);
            if (!validSizes.has(size)) return false;
            if (!validTypes.has(type)) return false;
            return true;
        });
    }

    createFungalZombieTemplate() {
        const zombieKey = Object.keys(this.monsterData || {}).find(k => String(k || '').toLowerCase() === 'zombie');
        const zombie = zombieKey ? this.monsterData[zombieKey] : null;
        if (zombie) return zombie;
        return {
            name: 'Zombie',
            meta: 'Medium undead, neutral evil',
            'Armor Class': '8',
            'Hit Points': '22 (3d8 + 9)',
            Speed: '20 ft.',
            STR: '13', STR_mod: '(+1)', DEX: '6', DEX_mod: '(-2)', CON: '16', CON_mod: '(+3)',
            INT: '3', INT_mod: '(-4)', WIS: '6', WIS_mod: '(-2)', CHA: '5', CHA_mod: '(-3)',
            Senses: 'darkvision 60 ft., passive Perception 8',
            Challenge: '1/4 (50 XP)',
            Traits: '<p><em><strong>Undead Fortitude.</strong></em> If damage reduces the zombie to 0 hit points, it must make a Constitution saving throw with a DC of 5 + the damage taken, unless the damage is radiant or from a critical hit. On a success, the zombie drops to 1 hit point instead.</p>',
            Actions: '<p><em><strong>Slam.</strong></em> <em>Melee Weapon Attack:</em> +3 to hit, reach 5 ft., one target. <em>Hit:</em> 4 (1d6 + 1) bludgeoning damage.</p>'
        };
    }

    useFungalInfestation(controllerId) {
        const controller = this.getCombatantById(controllerId);
        if (!controller || !this.canUseFungalInfestation(controller)) return;

        const corpses = this.getFungalInfestationEligibleCorpses();
        if (!corpses.length) {
            alert('No eligible Small/Medium beast or humanoid corpse at 0 HP to animate.');
            return;
        }

        const optionsText = corpses.map((c, i) => `${i + 1}. ${c.name}`).join('\n');
        const picked = prompt(`Fungal Infestation: choose a corpse to animate as a zombie:\n${optionsText}`, '1');
        if (picked == null) return;
        const idx = Number(picked) - 1;
        if (!Number.isInteger(idx) || idx < 0 || idx >= corpses.length) {
            alert('Invalid selection.');
            return;
        }

        const corpse = corpses[idx];
        corpse.fungalConsumed = true;

        const zombieTemplate = this.createFungalZombieTemplate();
        const summonName = `${controller.name}'s Zombie (${corpse.name})`;
        const combatantData = {
            ...zombieTemplate,
            name: summonName,
            initiative: controller.initiative,
            controlledBy: controller.id,
            summonType: 'fungal_infestation',
            fungalAnimatedFromId: corpse.id
        };
        const zombieCombatant = new Combatant(combatantData);
        zombieCombatant.currentHp = 1; // Fungal Infestation zombie rises with 1 HP.
        zombieCombatant.maxHp = Math.max(zombieCombatant.maxHp, 1);

        this.combatants.push(zombieCombatant);
        const controllerIndex = this.turnOrder.findIndex(c => c.id === controller.id);
        if (controllerIndex >= 0) this.turnOrder.splice(controllerIndex + 1, 0, zombieCombatant);
        else this.turnOrder.push(zombieCombatant);

        this.saveState();
        this.renderCombatTracker();
    }

    revertCombatant(combatantId) {
        const combatant = this.getCombatantById(combatantId);
        if (!combatant) return;
        combatant.revert();
        this.saveState();
        this.renderCombatTracker();
    }

    removeCondition(combatantId, condition) {
        const combatant = this.getCombatantById(combatantId);
        if (combatant && condition) {
            combatant.removeCondition(condition);
            this.saveState();
            this.renderCombatTracker();
        }
    }

       removeCombatant(combatantId) {
        const combatant = this.getCombatantById(combatantId);
        if (!combatant) return;

        if (!confirm(`Are you sure you want to remove ${combatant.name} from the encounter? This cannot be undone.`)) {
            return;
        }

        this.syncHomunculusToCharacter(combatant, { active: false });

        const originalIndex = this.turnOrder.findIndex(c => c.id === combatantId);

        // Remove from both lists
        this.turnOrder = this.turnOrder.filter(c => c.id !== combatantId);
        this.combatants = this.combatants.filter(c => c.id !== combatantId);

        if (this.turnOrder.length === 0) {
            this.end();
            return;
        }

        if (originalIndex !== -1 && originalIndex < this.turnIndex) {
            this.turnIndex--;
        }
        if (this.turnIndex >= this.turnOrder.length) { this.turnIndex = 0; }

        this.saveState();
        this.renderCombatTracker();
    }


    toggleConcentration(combatantId) {
        const combatant = this.getCombatantById(combatantId);
        if (combatant) {
            const wasConcentrating = !!combatant.isConcentrating;
            combatant.toggleConcentration();
            const nowConcentrating = !!combatant.isConcentrating;

            // If concentration ends, drop any Polymorph effects maintained by this caster.
            if (wasConcentrating && !nowConcentrating) {
                const seen = new Set();
                const allRefs = []
                    .concat(Array.isArray(this.turnOrder) ? this.turnOrder : [])
                    .concat(Array.isArray(this.combatants) ? this.combatants : []);
                for (const c of allRefs) {
                    if (!c || seen.has(c.id)) continue;
                    seen.add(c.id);
                    if (!c.isWildShaped) continue;
                    if (String(c.transformSource || '').toLowerCase() !== 'polymorph') continue;
                    if (String(c.transformedBy || '') !== String(combatantId || '')) continue;
                    c.revert();
                }
            }
            this.saveState();
            this.renderCombatTracker();
        }
    }

    saveState() {
        StateManager.save(this);
    }

    restoreState(savedState) {
        this.combatants = savedState.combatants.map(cData => new Combatant(cData));
        this.turnOrder = savedState.turnOrder.map(cData => new Combatant(cData));
        this.round = savedState.round;
        this.turnIndex = savedState.turnIndex;
        this.monsterCounts = savedState.monsterCounts;

        if (savedState.inCombat) {
            this.setupView.classList.add('hidden');
            this.combatView.classList.remove('hidden');
            this.renderCombatTracker();
        } else {
            this.renderSetupList();
            // Disable player checkboxes that are already in the encounter
            const combatantNames = new Set(this.combatants.map(c => c.name));
            const allPlayerCheckboxes = document.querySelectorAll('#party-selection-list input[type="checkbox"]');
            allPlayerCheckboxes.forEach(checkbox => {
                if (combatantNames.has(checkbox.dataset.name)) {
                    checkbox.disabled = true;
                }
            });
        }
    }

    handleCombatTrackerClick(e) {
        const button = e.target.closest('button');
        if (!button) return;

        const combatantId = button.dataset.id;

        if (button.matches('.hp-change-btn') && combatantId) {
            const amount = parseInt(button.dataset.amount, 10);
            this.updateHp(combatantId, amount);
        } else if (button.matches('.add-condition-btn') && combatantId) {
            this.showConditionModal(combatantId);
        } else if (button.matches('.remove-condition-btn') && combatantId) {
            const condition = button.dataset.condition;
            this.removeCondition(combatantId, condition);
        } else if (button.matches('.concentration-btn') && combatantId) {
            this.toggleConcentration(combatantId);    
        } else if (button.matches('.wild-shape-btn') && combatantId) {
            this.showWildShapeModal(combatantId);
        } else if (button.matches('.revert-shape-btn') && combatantId) {
            this.revertCombatant(combatantId);
        } else if (button.matches('.fungal-infestation-btn') && combatantId) {
            this.useFungalInfestation(combatantId);
        } else if (button.matches('.conjure-animals-btn') && combatantId) {
            this.showConjureAnimalsModal(combatantId);
        } else if (button.matches('.dismiss-conjure-btn') && combatantId) {
            this.dismissConjuredAnimals(combatantId);
        } else if (button.matches('.polymorph-btn') && combatantId) {
            this.showPolymorphModal(combatantId);
        } else if (button.matches('.end-polymorph-btn') && combatantId) {
            this.revertCombatant(combatantId);
        } else if (button.matches('.aid-btn') && combatantId) {
            const combatant = this.getCombatantByIdAny(combatantId);
            if (!combatant) return;
            if (this.hasAidEffect(combatant)) this.removeAidEffect(combatantId);
            else this.applyAidEffect(combatantId);
            this.saveState();
            this.renderCombatTracker();
        } else if (button.matches('.remove-combatant-btn') && combatantId) {
            this.removeCombatant(combatantId);
        }
    }

    _renderMonsterCard(c) {
        const aidEffect = this.getAidEffect(c);
        const aidRemaining = aidEffect ? this.formatDuration(Number(aidEffect.expiresAt || 0) - Date.now()) : '';
        const aidButtonLabel = aidEffect ? `Aid (${aidRemaining})` : 'Aid +5 HP';
        const showAidButton = !!aidEffect || this.canCastAid(c);
        const aidTagHtml = aidEffect
            ? `<span class="condition-tag">Aid (+5 HP, ${aidRemaining}) <button class="aid-btn" data-id="${c.id}">×</button></span>`
            : '';
        const card = document.createElement('div');
        card.className = 'stat-block';
        const s = c.full_stats; // shortcut to full stats

           if (c.currentHp === 0) {
            card.className = 'stat-block dead';
            card.innerHTML = `
                <div class="dead-content">
                    <span class="dead-icon">☠️</span>
                    <span class="dead-name">${c.name}</span>
                    <button class="remove-combatant-btn" data-id="${c.id}" title="Remove from Combat">Remove</button>
                </div>
            `;
            return card;
        }

        const pendingChange = this.pendingHpChanges[c.id];
        const hpChangeHtml = pendingChange
            ? `<span class="hp-change-indicator ${pendingChange.amount > 0 ? 'heal' : 'damage'}">(${pendingChange.amount > 0 ? '+' : ''}${pendingChange.amount})</span>`
            : '';

        const hpPercent = (c.currentHp / c.maxHp) * 100;

        // Parse meta string: "Large monstrosity, chaotic evil"
        const metaParts = s.meta.split(',').map(part => part.trim());
        const sizeAndType = metaParts[0] || '';
        const alignment = metaParts[1] || '';

        // Parse AC string: "17 (Natural Armor)"
        const acDetailsMatch = s['Armor Class'].match(/\((.*?)\)/);
        const acDetails = acDetailsMatch ? ` (${acDetailsMatch[1]})` : '';

        // Parse HP string: "135 (18d10 + 36)"
        const hpDiceMatch = s['Hit Points'].match(/\((.*?)\)/);
        const hpDice = hpDiceMatch ? `(${hpDiceMatch[1]})` : '';

        const hpControlsHTML = `
            <div class="hp-controls">
                <button class="hp-change-btn damage" data-id="${c.id}" data-amount="-5" title="Deal 5 damage">-5</button>
                <button class="hp-change-btn damage" data-id="${c.id}" data-amount="-1" title="Deal 1 damage">-1</button>
                <button class="hp-change-btn heal" data-id="${c.id}" data-amount="1" title="Heal 1 HP">+1</button>
                <button class="hp-change-btn heal" data-id="${c.id}" data-amount="5" title="Heal 5 HP">+5</button>
            </div>
        `;

        const imageHTML = s.img_url ? `
            <div class="stat-block-image-container">
                <img src="${s.img_url}" alt="${s.name}" loading="lazy">
            </div>
        ` : '';

        const abilityScoresHTML = `
            <div class="ability-scores">
                <div><strong>STR</strong><span>${s.STR} (${s.STR_mod})</span></div>
                <div><strong>DEX</strong><span>${s.DEX} (${s.DEX_mod})</span></div>
                <div><strong>CON</strong><span>${s.CON} (${s.CON_mod})</span></div>
                <div><strong>INT</strong><span>${s.INT} (${s.INT_mod})</span></div>
                <div><strong>WIS</strong><span>${s.WIS} (${s.WIS_mod})</span></div>
                <div><strong>CHA</strong><span>${s.CHA} (${s.CHA_mod})</span></div>
            </div>
        `;

        const secondaryStatsHTML = `
            <div class="stat-block-secondary-stats">
                ${s['Saving Throws'] ? `<div><strong>Saving Throws</strong> ${s['Saving Throws']}</div>` : ''}
                ${s.Skills ? `<div><strong>Skills</strong> ${s.Skills}</div>` : ''}
                ${s['Damage Vulnerabilities'] ? `<div><strong>Damage Vulnerabilities</strong> ${s['Damage Vulnerabilities']}</div>` : ''}
                ${s['Damage Resistances'] ? `<div><strong>Damage Resistances</strong> ${s['Damage Resistances']}</div>` : ''}
                ${s['Damage Immunities'] ? `<div><strong>Damage Immunities</strong> ${s['Damage Immunities']}</div>` : ''}
                ${s['Condition Immunities'] ? `<div><strong>Condition Immunities</strong> ${s['Condition Immunities']}</div>` : ''}
                ${s.Senses ? `<div><strong>Senses</strong> ${s.Senses}</div>` : ''}
                ${s.languages ? `<div><strong>Languages</strong> ${s.languages}</div>` : ''}
                ${s.Challenge ? `<div><strong>Challenge</strong> ${s.Challenge}</div>` : ''}
            </div>
        `;

        // The new format has Traits, Actions, etc. as pre-formatted HTML strings.
        const traitsHTML = s.Traits ? `<div class="injected-html">${s.Traits}</div>` : '';
        const actionsHTML = s.Actions ? `<h3 class="actions-header">Actions</h3><div class="injected-html">${s.Actions}</div>` : '';
        const legendaryActionsHTML = s['Legendary Actions'] ? `<h3 class="actions-header">Legendary Actions</h3><div class="injected-html">${s['Legendary Actions']}</div>` : '';
        const reactionsHTML = s.Reactions ? `<h3 class="actions-header">Reactions</h3><div class="injected-html">${s.Reactions}</div>` : '';
        const lairActionsHTML = s['Lair Actions'] ? `<h3 class="actions-header">Lair Actions</h3><div class="injected-html">${s['Lair Actions']}</div>` : '';

        card.innerHTML = `
            <div class="bar"></div>
            <div class="stat-block-content">
                ${imageHTML}
                <div class="stat-block-header">
                    <div class="stat-block-name">${c.name}</div>
                    <div class="stat-block-init">Initiative: ${c.initiative}</div>
                </div>
                <div class="stat-block-subtitle">${sizeAndType}, ${alignment}</div>
                <div class="bar"></div>
                <div class="stat-block-stats">
                    <div><strong>AC</strong> ${s['Armor Class']}</div>
                    <div><strong>HP</strong> ${c.currentHp} / ${c.maxHp} ${hpDice} ${hpChangeHtml}</div>
                    <div><strong>Speed</strong> ${s.Speed}</div>
                </div>
                <div class="hp-bar-container">
                    <div class="hp-bar">
                        <div class="hp-bar-fill" style="width: ${hpPercent}%;"></div>
                    </div>
                </div>
                ${hpControlsHTML}
                <div class="bar"></div>
                ${abilityScoresHTML}
                <div class="bar"></div>
                ${secondaryStatsHTML}
                ${traitsHTML}
                ${actionsHTML}
                ${reactionsHTML}
                ${legendaryActionsHTML}
                ${lairActionsHTML}
                <div class="conditions">
                ${aidTagHtml}
                ${[...c.conditions].sort().map(cond => `
                    <span class="condition-tag">
                        ${cond.charAt(0).toUpperCase() + cond.slice(1)}
                        <button class="remove-condition-btn" data-id="${c.id}" data-condition="${cond}">×</button>
                    </span>
                `).join('')}
                </div>
                <div class="stat-block-controls">
                    <div class="status-controls">
                        <button class="concentration-btn" data-id="${c.id}">Concentration</button>
                        ${showAidButton ? `<button class="aid-btn" data-id="${c.id}" title="Aid: +5 max and current HP for 8 hours.">${aidButtonLabel}</button>` : ''}
                        <button class="add-condition-btn" data-id="${c.id}">Add Condition</button>
                        ${c.isWildShaped && c.transformSource === 'polymorph' ? `<button class="end-polymorph-btn" data-id="${c.id}">End Polymorph</button>` : ''}
                        <button class="remove-combatant-btn" data-id="${c.id}" title="Remove from Combat">Remove</button>
                    </div>
                </div>
            </div>
        `;
        return card;
    }

    _renderPlayerCard(c) {
        const aidEffect = this.getAidEffect(c);
        const aidRemaining = aidEffect ? this.formatDuration(Number(aidEffect.expiresAt || 0) - Date.now()) : '';
        const aidButtonLabel = aidEffect ? `Aid (${aidRemaining})` : 'Aid +5 HP';
        const showAidButton = !!aidEffect || this.canCastAid(c);
        const aidTagHtml = aidEffect
            ? `<span class="condition-tag">Aid (+5 HP, ${aidRemaining}) <button class="aid-btn" data-id="${c.id}">×</button></span>`
            : '';
        const card = document.createElement('div');
        card.className = 'stat-block player-card';

         if (c.currentHp === 0) {
            card.className = 'stat-block player-card dead';
            card.innerHTML = `
                <div class="dead-content">
                    <span class="dead-icon">☠️</span>
                    <span class="dead-name">${c.name}</span>
                    <button class="remove-combatant-btn" data-id="${c.id}" title="Remove from Combat">Remove</button>
                </div>
            `;
            return card;
        }

        const pendingChange = this.pendingHpChanges[c.id];
        const hpChangeHtml = pendingChange
            ? `<span class="hp-change-indicator ${pendingChange.amount > 0 ? 'heal' : 'damage'}">(${pendingChange.amount > 0 ? '+' : ''}${pendingChange.amount})</span>`
            : '';

        const hpPercent = c.maxHp > 0 ? (c.currentHp / c.maxHp) * 100 : 0;

        const hpControlsHTML = `
            <div class="hp-controls">
                <button class="hp-change-btn damage" data-id="${c.id}" data-amount="-5" title="Deal 5 damage">-5</button>
                <button class="hp-change-btn damage" data-id="${c.id}" data-amount="-1" title="Deal 1 damage">-1</button>
                <button class="hp-change-btn heal" data-id="${c.id}" data-amount="1" title="Heal 1 HP">+1</button>
                <button class="hp-change-btn heal" data-id="${c.id}" data-amount="5" title="Heal 5 HP">+5</button>
            </div>
        `;

        const wildShapeBtnHTML = (c.full_stats.class?.toLowerCase() === 'druid' && c.full_stats.level >= 2)
            ? c.isWildShaped
                ? `<button class="revert-shape-btn" data-id="${c.id}">Revert Form</button>`
                : `<button class="wild-shape-btn" data-id="${c.id}">Wild Shape</button>`
            : '';
        const fungalInfestationBtnHTML = this.canUseFungalInfestation(c)
            ? `<button class="fungal-infestation-btn" data-id="${c.id}" title="Animate an eligible dead Small/Medium beast or humanoid as a zombie with 1 HP.">Fungal Infestation</button>`
            : '';
        const conjureAnimalsBtnHTML = this.canUseConjureAnimals(c)
            ? `<button class="conjure-animals-btn" data-id="${c.id}" title="Summon beasts as fey spirits. They roll initiative as a group and obey your verbal commands.">Conjure Animals</button>`
            : '';
        const polymorphBtnHTML = this.canCastPolymorph(c)
            ? `<button class="polymorph-btn" data-id="${c.id}" title="Transform a creature into a beast (CR cap = target CR or level).">Polymorph</button>`
            : '';
        const dismissConjureBtnHTML = this.hasConjuredAnimals(c.id)
            ? `<button class="dismiss-conjure-btn" data-id="${c.id}" title="Dismiss all beasts summoned by this combatant via Conjure Animals.">Dismiss Conjured Animals</button>`
            : '';

        const beastActionsHTML = c.isWildShaped && c.beast_stats?.Actions
            ? `<h3 class="actions-header">Beast Actions</h3><div class="injected-html">${c.beast_stats.Actions}</div>`
            : '';

        card.innerHTML = `
            <div class="bar"></div>
            <div class="stat-block-content">
                <div class="stat-block-header">
                    <div class="stat-block-name">${c.name}</div>
                    <div class="stat-block-init">Initiative: ${c.initiative}</div>
                </div>
                <div class="stat-block-subtitle">Player Character</div>
                <div class="bar"></div>
                <div class="stat-block-stats">
                    <div><strong>AC</strong> ${c.ac}</div>
                    <div><strong>HP</strong> ${c.currentHp} / ${c.maxHp} ${hpChangeHtml}</div>
                </div>
                <div class="hp-bar-container">
                    <div class="hp-bar">
                        <div class="hp-bar-fill" style="width: ${hpPercent}%;"></div>
                    </div>
                </div>
                ${hpControlsHTML}
                <div class="conditions">
                ${aidTagHtml}
                ${[...c.conditions].sort().map(cond => `
                    <span class="condition-tag">
                        ${cond.charAt(0).toUpperCase() + cond.slice(1)}
                        <button class="remove-condition-btn" data-id="${c.id}" data-condition="${cond}">×</button>
                    </span>
                `).join('')}
                </div>
                <div class="stat-block-controls">
                    ${beastActionsHTML}
                    <div class="status-controls">
                        <button class="concentration-btn" data-id="${c.id}">Concentration</button>
                        ${showAidButton ? `<button class="aid-btn" data-id="${c.id}" title="Aid: +5 max and current HP for 8 hours.">${aidButtonLabel}</button>` : ''}
                        <button class="add-condition-btn" data-id="${c.id}">Add Condition</button>
                        ${wildShapeBtnHTML}
                        ${fungalInfestationBtnHTML}
                        ${conjureAnimalsBtnHTML}
                        ${polymorphBtnHTML}
                        ${dismissConjureBtnHTML}
                        ${c.isWildShaped && c.transformSource === 'polymorph' ? `<button class="end-polymorph-btn" data-id="${c.id}">End Polymorph</button>` : ''}
                        <button class="remove-combatant-btn" data-id="${c.id}" title="Remove from Combat">Remove</button>
                    </div>
                </div>
            </div>
        `;
        return card;
    }

    renderCombatTracker() {
        this.purgeExpiredSpellEffects();
        this.roundCounter.textContent = `Round ${this.round}`;
        this.combatTracker.innerHTML = '';

        this.turnOrder.forEach((c, index) => {
            const card = c.isPlayer ? this._renderPlayerCard(c) : this._renderMonsterCard(c);
            if (index === this.turnIndex) card.classList.add('active-turn');
            if (c.isConcentrating) card.classList.add('concentrating');


            
            this.combatTracker.appendChild(card);
        });
    }
}
