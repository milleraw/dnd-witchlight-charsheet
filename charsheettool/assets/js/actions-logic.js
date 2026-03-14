// assets/js/actions-logic.js
(function(global) {
  'use strict';

  let _spellDescMap = null; // Map<lowerName, description>
  let _maneuverDescMap = null; // Map<lowerName, description>

  async function ensureSpellDescMap() {
    if (_spellDescMap) return _spellDescMap;
    const map = new Map();
    try {
      const all = typeof global.DDData?.loadAllSpells === 'function'
        ? await global.DDData.loadAllSpells()
        : [];
      for (const s of (Array.isArray(all) ? all : [])) {
        const name = String(s?.name || '').trim();
        if (!name) continue;
        const raw = s?.desc ?? s?.description ?? '';
        const desc = Array.isArray(raw) ? raw.join('\n\n') : String(raw || '').trim();
        if (desc) map.set(name.toLowerCase(), desc);
      }
    } catch (_) {
      // Keep empty map fallback.
    }
    _spellDescMap = map;
    return _spellDescMap;
  }

  async function ensureManeuverDescMap() {
    if (_maneuverDescMap) return _maneuverDescMap;
    const map = new Map();
    try {
      const res = await fetch('./data/maneuvers.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const all = await res.json();
      for (const m of (Array.isArray(all) ? all : [])) {
        const name = String(m?.name || '').trim();
        if (!name) continue;
        const desc = String(m?.desc || '').trim();
        if (desc) map.set(name.toLowerCase(), desc);
      }
    } catch (_) {
      // Keep empty map fallback.
    }
    _maneuverDescMap = map;
    return _maneuverDescMap;
  }

  function infusionStateKey(name, item = '') {
    const n = String(name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const i = String(item || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `infusion:${n}${i ? `:${i}` : ''}`;
  }

  function characterHasItem(character, itemName) {
    const want = String(itemName || '').trim().toLowerCase();
    if (!want) return false;
    const weapons = Array.isArray(character?.equipment?.weapons) ? character.equipment.weapons : [];
    const gear = Array.isArray(character?.equipment?.gear) ? character.equipment.gear.map(g => g?.name).filter(Boolean) : [];
    const armor = Array.isArray(character?.armor) ? character.armor : (character?.armor ? [character.armor] : []);
    return [...weapons, ...gear, ...armor].some(n => String(n || '').trim().toLowerCase() === want);
  }

  // --- Generic Actions (Universal Rules) ---
  function getGenericActions(character) {
    return [
      { name: 'Attack', desc: 'Make one melee or ranged attack. Certain features, such as the Extra Attack feature, allow you to make more than one attack with this action.', source: 'Basic Rules' },
      { name: 'Grapple', desc: 'As part of an Attack action, you can make a special melee attack to grapple. This replaces one of your attacks. The target must be no more than one size larger than you and within your reach. Make a Strength (Athletics) check contested by the target’s Strength (Athletics) or Dexterity (Acrobatics) check.', source: 'Special Melee Attack' },
      { name: 'Shove', desc: 'As part of an Attack action, you can make a special melee attack to shove a creature, either to knock it prone or push it 5 feet away from you. This replaces one of your attacks. The target must be no more than one size larger than you and within your reach. Make a Strength (Athletics) check contested by the target’s Strength (Athletics) or Dexterity (Acrobatics) check.', source: 'Special Melee Attack' },
      { name: 'Cast a Spell', desc: 'Cast a spell with a casting time of 1 action.', source: 'Basic Rules' },
      { name: 'Dash', desc: 'Gain extra movement for the current turn.', source: 'Basic Rules' },
      { name: 'Disengage', desc: 'Your movement doesn’t provoke opportunity attacks for the rest of the turn.', source: 'Basic Rules' },
      { name: 'Dodge', desc: 'Until the start of your next turn, any attack roll made against you has disadvantage if you can see the attacker, and you make Dexterity saving throws with advantage.', source: 'Basic Rules' },
      { name: 'Help', desc: 'Give an ally advantage on an ability check or their next attack roll.', source: 'Basic Rules' },
      { name: 'Hide', desc: 'Make a Dexterity (Stealth) check to become unseen.', source: 'Basic Rules' },
      { name: 'Ready', desc: 'Ready an action to occur on a specific trigger.', source: 'Basic Rules' },
      { name: 'Search', desc: 'Make a Wisdom (Perception) or Intelligence (Investigation) check.', source: 'Basic Rules' },
      { name: 'Use an Object', desc: 'Interact with a second object on your turn.', source: 'Basic Rules' },
      { name: 'Don/Doff a Shield', desc: 'Donning or doffing a shield takes 1 action.', source: 'Basic Rules' },
    ];
  }

  function getGenericBonusActions(character) {
    return [{
      name: 'Two-Weapon Fighting',
      desc: "When you take the Attack action and attack with a light melee weapon that you're holding in one hand, you can use a bonus action to attack with a different light melee weapon that you're holding in the other hand. You don't add your ability modifier to the damage of the bonus attack, unless that modifier is negative.",
      source: 'Basic Rules'
    }];
  }

  function getGenericReactions(character) {
    const rows = [{
      name: 'Opportunity Attack',
      desc: 'You can make an opportunity attack when a hostile creature that you can see moves out of your reach. You use your reaction to make one melee attack against the provoking creature.',
      source: 'Basic Rules'
    }];
    const styles = getFightingStyleNames(character);
    if (styles.has('protection')) {
      rows.push({
        name: 'Protection (Fighting Style)',
        desc: 'When a creature you can see attacks a target other than you within 5 feet, you can use your reaction to impose disadvantage on that attack roll. You must be wielding a shield.',
        source: 'Fighting Style'
      });
    }
    if (styles.has('interception')) {
      rows.push({
        name: 'Interception (Fighting Style)',
        desc: 'When a creature you can see hits a target other than you within 5 feet, you can use your reaction to reduce the damage by 1d10 + your proficiency bonus (minimum 0). You must be wielding a shield or a simple/martial weapon.',
        source: 'Fighting Style'
      });
    }
    return rows;
  }

  function getMovementActions(character) {
    const strScore = Number(character?.abilities?.STR ?? character?.abilities?.str ?? 10);
    const strMod = window.DDRules.abilityMod(strScore);
    const cls = String(character?.class || '').toLowerCase();
    const lvl = Number(character?.level || 1);
    const traits = Array.isArray(character?.traits) ? character.traits : [];
    const hasLandsStride =
      (cls === 'ranger' && lvl >= 8) ||
      traits.some(t => String((typeof t === 'string' ? t : t?.name) || '').toLowerCase().includes("land's stride"));

    const difficultTerrainDesc = hasLandsStride
      ? "Land's Stride: Nonmagical difficult terrain doesn't cost extra movement for you. You can also pass through nonmagical plants without being slowed and without taking damage from their thorns, spines, or similar hazards. You have advantage on saving throws against plants that are magically created or manipulated to impede movement."
      : 'Moving through difficult terrain costs 2 feet of speed for every 1 foot moved.';
    const difficultTerrainSource = hasLandsStride ? "Ranger 8 (Land's Stride)" : 'Basic Rules';

    return [
      { name: 'Move', desc: `You can move up to your speed on your turn. You can break up your movement, using some of it before and after your action.`, source: 'Basic Rules' },
      { name: 'Stand Up', desc: 'You can stand up from prone by using half of your movement speed.', source: 'Basic Rules' },
      { name: 'Drop Prone', desc: 'You can drop prone without using any of your speed.', source: 'Basic Rules' },
      { name: 'Climb, Swim, or Crawl', desc: 'Each foot of movement costs 1 extra foot (2 extra feet in difficult terrain) when you climb, swim, or crawl.', source: 'Basic Rules' },
      { name: 'Long Jump', desc: `With a 10-foot run-up, you can long jump up to your Strength score in feet (${strScore} ft). Without a run-up, you can only jump half that distance.`, source: 'Basic Rules' },
      { name: 'High Jump', desc: `With a 10-foot run-up, you can high jump up to 3 + your Strength modifier feet (${3 + strMod} ft). Without a run-up, you can only jump half that distance.`, source: 'Basic Rules' },
      { name: 'Difficult Terrain', desc: difficultTerrainDesc, source: difficultTerrainSource },
    ];
  }

  function getAttackCountForCharacter(character) {
    const cls = String(character?.class || '').toLowerCase();
    const build = String(character?.build || '').toLowerCase();
    const level = Number(character?.level || 1);

    if (cls === 'fighter') {
      if (level >= 20) return 4;
      if (level >= 11) return 3;
      if (level >= 5) return 2;
      return 1;
    }

    if (['barbarian', 'monk', 'paladin', 'ranger'].includes(cls)) {
      return level >= 5 ? 2 : 1;
    }

    if (cls === 'bard' && (build.includes('college of valor') || build.includes('college of swords'))) {
      return level >= 6 ? 2 : 1;
    }

    if (cls === 'artificer' && (build.includes('battle smith') || build.includes('armorer'))) {
      return level >= 5 ? 2 : 1;
    }

    if (cls === 'wizard' && build.includes('bladesinging')) {
      return level >= 6 ? 2 : 1;
    }

    return 1;
  }

  function hasHarnessDivinePower(character) {
    const choices = character?.choices || {};

    if (Array.isArray(choices.classFeatures)) {
      if (choices.classFeatures.some(f => String(f?.id || '').toLowerCase().includes('harness-divine-power-optional'))) {
        return true;
      }
    }

    if (Array.isArray(choices.classChoices)) {
      const hit = choices.classChoices.find(c => String(c?.choiceId || '').toLowerCase().includes('optional:harness-divine-power'));
      if (hit) {
        if (typeof hit?.taken === 'boolean') return hit.taken;
        const value = String(hit?.value || '').trim().toLowerCase();
        if (!value || value === 'taken' || value === 'yes' || value === 'true') return true;
      }
    }

    if (Array.isArray(choices.levelUpDecisions)) {
      for (const row of choices.levelUpDecisions) {
        const picks = Array.isArray(row?.choices) ? row.choices : [];
        const hit = picks.find(c => String(c?.choiceId || '').toLowerCase().includes('optional:harness-divine-power'));
        if (!hit) continue;
        if (typeof hit?.taken === 'boolean') return hit.taken;
        const value = String(hit?.value || '').trim().toLowerCase();
        if (!value || value === 'taken' || value === 'yes' || value === 'true') return true;
      }
    }

    return false;
  }

  function resolveFeatChoiceValue(character, featId, choiceId) {
    const rows = Array.isArray(character?.choices?.featChoices) ? character.choices.featChoices : [];
    const row = rows.find(r => String(r?.featId || '').toLowerCase() === String(featId || '').toLowerCase());
    if (!row || !row.choices || !choiceId) return '';
    const values = Array.isArray(row.choices[choiceId]) ? row.choices[choiceId] : [];
    return String(values[0] || '').trim();
  }

  function normalizeAbilityAbbr(raw, fallback = '') {
    const str = String(raw || '').trim().toUpperCase();
    if (!str) return String(fallback || '').trim().toUpperCase();
    if (['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].includes(str)) return str;
    if (str.startsWith('INT')) return 'INT';
    if (str.startsWith('WIS')) return 'WIS';
    if (str.startsWith('CHA')) return 'CHA';
    if (str.startsWith('STR')) return 'STR';
    if (str.startsWith('DEX')) return 'DEX';
    if (str.startsWith('CON')) return 'CON';
    return String(fallback || '').trim().toUpperCase();
  }

  function hasFeatByIdOrName(character, idOrName) {
    const target = String(idOrName || '').trim().toLowerCase();
    if (!target) return false;
    if (global.FeatRuntime?.hasFeat?.(character, target)) return true;
    const feats = Array.isArray(character?.feats) ? character.feats : [];
    return feats.some(f => {
      const id = String(f?.id || '').trim().toLowerCase();
      const key = String(f?.key || '').trim().toLowerCase();
      const name = String(f?.name || '').trim().toLowerCase();
      return id === target || key === target || name === target;
    });
  }

  function normalizeManeuverName(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/^maneuver:\s*/i, '')
      .replace(/\s*\(1\s*superiority\s*die\)\s*$/i, '')
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function extractManeuverNameFromActionName(actionName) {
    const raw = String(actionName || '').trim();
    if (!/^maneuver:\s*/i.test(raw)) return '';
    return normalizeManeuverName(raw);
  }

  function getSelectedManeuverNameSet(character) {
    const picked = new Set();
    const add = (name) => {
      const n = normalizeManeuverName(name);
      if (n) picked.add(n);
    };

    (Array.isArray(character?.maneuvers) ? character.maneuvers : []).forEach(add);

    const fromClassChoices = Array.isArray(character?.choices?.classChoices) ? character.choices.classChoices : [];
    for (const row of fromClassChoices) {
      if (!String(row?.choiceId || '').toLowerCase().includes('maneuver')) continue;
      (Array.isArray(row?.values) ? row.values : []).forEach(add);
      add(row?.value);
    }
    const fromLevelUps = Array.isArray(character?.choices?.levelUpDecisions) ? character.choices.levelUpDecisions : [];
    for (const dec of fromLevelUps) {
      const rows = Array.isArray(dec?.choices) ? dec.choices : [];
      for (const row of rows) {
        if (!String(row?.choiceId || '').toLowerCase().includes('maneuver')) continue;
        (Array.isArray(row?.values) ? row.values : []).forEach(add);
        add(row?.value);
      }
    }

    return picked;
  }

  function getManeuverSaveDcMeta(character) {
    const rules = Array.isArray(character?.saveDcRules) ? character.saveDcRules : [];
    const rule = rules.find(r => String(r?.id || '').toLowerCase() === 'dc:maneuver');
    if (!rule) return null;

    let ability = String(rule.ability || '').trim().toUpperCase();
    if (!ability && rule.ability_from_choice) {
      const picked = resolveFeatChoiceValue(character, rule.source, rule.ability_from_choice);
      if (picked) ability = String(picked).trim().slice(0, 3).toUpperCase();
    }
    if (!ability) ability = 'STR';

    const score = Number(character?.abilities?.[ability] ?? character?.abilities?.[ability.toLowerCase()] ?? 10);
    const mod = window.DDRules.abilityMod(score);
    const pb = window.DDRules.proficiencyFromLevel(Number(character?.level || 1));
    return { dc: 8 + pb + mod, ability, mod, pb };
  }

  // --- Spell actions sourced from prepared/known spell lists ---
  function _storageKeyForSpells(c) { return 'spells:' + String(c?.name || '').toLowerCase(); }
  function _readSpellState(c) { try { return JSON.parse(localStorage.getItem(_storageKeyForSpells(c)) || '{}'); } catch { return {}; } }
  function _hasTrait(character, needle) {
    const want = String(needle || '').toLowerCase();
    if (!want) return false;
    const traits = Array.isArray(character?.traits) ? character.traits : [];
    return traits.some(t => String(t?.name || t || '').toLowerCase().includes(want));
  }

  function getFightingStyleNames(character) {
    const picked = new Set();
    const addRaw = (value) => {
      const text = String(value || '').trim();
      if (!text) return;
      picked.add(text.toLowerCase());
      const match = text.match(/fighting style\s*[:(]\s*([^)\n]+)\)?/i);
      if (match?.[1]) picked.add(String(match[1]).trim().toLowerCase());
    };
    const traitList = Array.isArray(character?.traits) ? character.traits : [];
    traitList.forEach(t => addRaw(typeof t === 'string' ? t : t?.name));
    const featureList = Array.isArray(character?.features) ? character.features : [];
    featureList.forEach(f => addRaw(typeof f === 'string' ? f : f?.name));
    const classChoices = Array.isArray(character?.choices?.classChoices) ? character.choices.classChoices : [];
    classChoices.forEach(row => {
      if (!String(row?.choiceId || '').toLowerCase().includes('fighting_style')) return;
      (Array.isArray(row?.values) ? row.values : []).forEach(addRaw);
      addRaw(row?.value);
    });
    const decisions = Array.isArray(character?.choices?.levelUpDecisions) ? character.choices.levelUpDecisions : [];
    decisions.forEach(decision => {
      const rows = Array.isArray(decision?.choices) ? decision.choices : [];
      rows.forEach(row => {
        if (!String(row?.choiceId || '').toLowerCase().includes('fighting_style')) return;
        (Array.isArray(row?.values) ? row.values : []).forEach(addRaw);
        addRaw(row?.value);
      });
    });
    return picked;
  }

  function normalizeQuickCastType(spellData) {
    const raw = String(
      spellData?.actionType
      || spellData?.action_type
      || spellData?.casting_time
      || spellData?.castingTime
      || ''
    ).trim().toLowerCase();
    if (!raw) return '';
    if (raw === 'bonus' || raw === 'bonus_action' || raw === 'bonusaction' || raw === '1 bonus action') return 'bonus';
    if (raw === 'reaction' || raw === '1 reaction') return 'reaction';
    return '';
  }

  function collectPreparedOrKnownSpellNames(character) {
    const names = new Set();
    const state = _readSpellState(character);
    const preparedByLevel = state.preparedByLevel || {};
    for (const level in preparedByLevel) {
      if (!Array.isArray(preparedByLevel[level])) continue;
      for (const name of preparedByLevel[level]) {
        if (name) names.add(String(name));
      }
    }
    if (Array.isArray(character?.spells)) {
      for (const name of character.spells) {
        if (name) names.add(String(name));
      }
    }
    const sourcedSpellNames = Object.keys(character?.spellSources || {});
    for (const name of sourcedSpellNames) {
      if (name) names.add(String(name));
    }
    const level = Number(character?.level || 1);
    const race = String(character?.race || '').toLowerCase();
    if (race.includes('tiefling')) {
      const hasDevilsTongue = _hasTrait(character, "devil's tongue");
      if (hasDevilsTongue) {
        names.add('Vicious Mockery');
        if (level >= 3) names.add('Charm Person');
        if (level >= 5) names.add('Enthrall');
      } else {
        names.add('Thaumaturgy');
        if (level >= 3) names.add('Hellish Rebuke');
        if (level >= 5) names.add('Darkness');
      }
    }
    if (_hasTrait(character, 'misty wanderer')) {
      names.add('Misty Step');
    }
    const featSpellGrants = Array.isArray(character?.choices?.featSpellGrants) ? character.choices.featSpellGrants : [];
    for (const grant of featSpellGrants) {
      const spells = Array.isArray(grant?.spells) ? grant.spells : [];
      for (const spell of spells) {
        if (spell) names.add(String(spell));
      }
    }
    const resources = Array.isArray(character?.resources) ? character.resources : [];
    for (const res of resources) {
      const consumes = Array.isArray(res?.consumes) ? res.consumes : [];
      for (const c of consumes) {
        const spell = String(c?.spell || '').trim();
        if (spell) names.add(spell);
      }
    }
    return names;
  }

  async function getSpellQuickCastActions(character) {
    const out = { bonus: [], reaction: [] };
    const spellNames = collectPreparedOrKnownSpellNames(character);
    if (spellNames.size === 0) return out;
    if (typeof global.DDData?.loadAllSpells !== 'function') return out;

    const allSpells = await global.DDData.loadAllSpells();
    const spellsByName = new Map(allSpells.map(s => [String(s?.name || '').toLowerCase(), s]));

    for (const spellName of spellNames) {
      const spellData = spellsByName.get(String(spellName).toLowerCase());
      if (!spellData) continue;
      const quickCastType = normalizeQuickCastType(spellData);
      if (!quickCastType) continue;
      const rawDesc = spellData?.desc ?? spellData?.description ?? '';
      const desc = Array.isArray(rawDesc) ? rawDesc.join('\n\n') : String(rawDesc || '');
      const row = { name: spellData.name, desc, source: `Spell (Lvl ${spellData.level})` };
      if (quickCastType === 'bonus') out.bonus.push(row);
      if (quickCastType === 'reaction') out.reaction.push(row);
    }
    return out;
  }

  // --- Data-Driven Action Collector ---
  let _racesV1 = null;
  async function loadRacesV1() {
    if (_racesV1) return _racesV1;
    try {
      const res = await fetch('data/races.v1.json');
      if (!res.ok) return null;
      const data = await res.json();
      _racesV1 = Array.isArray(data?.races) ? data.races : null;
      return _racesV1;
    } catch {
      return null;
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

  function parseTakenChoice(val, fallbackRaw = '') {
    if (typeof val === 'boolean') return val;
    const raw = String(fallbackRaw || '').trim().toLowerCase();
    if (!raw) return false;
    return ['taken', 'yes', 'y', 'true', 'ok', 'done', '1'].includes(raw);
  }

  function buildOptionalChoiceState(character) {
    const map = new Map();
    const choices = character?.choices || {};

    const classChoices = Array.isArray(choices.classChoices) ? choices.classChoices : [];
    for (const choice of classChoices) {
      const id = String(choice?.choiceId || '');
      const marker = ':optional:';
      const idx = id.indexOf(marker);
      if (idx < 0) continue;
      const key = String(id.slice(idx + marker.length) || '').trim().toLowerCase();
      if (!key) continue;
      map.set(key, parseTakenChoice(choice?.taken, choice?.value));
    }

    const levelUp = Array.isArray(choices.levelUpDecisions) ? choices.levelUpDecisions : [];
    for (const row of levelUp) {
      const picks = Array.isArray(row?.choices) ? row.choices : [];
      for (const pick of picks) {
        const id = String(pick?.choiceId || '');
        const marker = ':optional:';
        const idx = id.indexOf(marker);
        if (idx < 0) continue;
        const key = String(id.slice(idx + marker.length) || '').trim().toLowerCase();
        if (!key || map.has(key)) continue;
        map.set(key, parseTakenChoice(pick?.taken, pick?.value));
      }
    }

    return map;
  }

  function hasTakenOptionalFeature(character, optionalKey) {
    const want = String(optionalKey || '').trim().toLowerCase();
    if (!want) return false;
    const state = buildOptionalChoiceState(character);
    return state.get(want) === true;
  }

  function isOptionalActionTaken(action, optionalState) {
    const isOptional = /\(optional\)/i.test(String(action?.name || '')) || /-optional$/i.test(String(action?.id || ''));
    if (!isOptional) return true;
    const nameKey = slugify(String(action?.name || '').replace(/\(optional\)/ig, '').trim());
    const idKey = slugify(String(action?.id || '').replace(/-optional$/i, '').trim());
    for (const [k, taken] of optionalState.entries()) {
      if (
        (nameKey && (nameKey === k || nameKey.includes(k) || k.includes(nameKey))) ||
        (idKey && (idKey === k || idKey.includes(k) || k.includes(idKey)))
      ) {
        return !!taken;
      }
    }
    return false;
  }

  function mapActionType(t) {
    const type = String(t || '').toLowerCase();
    if (type === 'bonus_action') return 'bonus';
    if (type === 'bonusaction') return 'bonus';
    if (type === 'reaction') return 'reaction';
    if (type === 'action') return 'action';
    if (type === 'special') return 'special';
    return type;
  }

  function findFeatResourceForAction(action, resources) {
    const normalize = (v) => String(v || '').trim().toLowerCase();
    const trimParen = (v) => normalize(v).replace(/\s*\([^)]*\)\s*$/, '');
    const actionName = normalize(action?.name);
    const actionNameTrim = trimParen(action?.name);

    return resources.find(r => {
      const rn = normalize(r?.name);
      return rn === actionName || trimParen(rn) === actionNameTrim;
    }) || null;
  }

  function attachFeatResourceIds(actionsObj, character) {
    const resources = Array.isArray(character?.resources) ? character.resources : [];
    if (!resources.length) return;

    const buckets = ['action', 'bonus', 'reaction', 'special'];

    for (const bucket of buckets) {
      const list = Array.isArray(actionsObj?.[bucket]) ? actionsObj[bucket] : [];
      for (const act of list) {
        if (!act || act.featResourceId) continue;
        const matched = findFeatResourceForAction(act, resources);
        if (!matched) continue;
        act.featResourceId = String(matched.id || matched.name || '');
      }
    }
  }

  async function collectDataDrivenActions(character) {
    const actions = { action: [], bonus: [], reaction: [], special: [] };
    const level = Number(character.level) || 1;
    const optionalState = buildOptionalChoiceState(character);

    const [classData, subClassData, raceData] = await Promise.all([
      window.loadClassesLocal(),
      window.loadSubclassesLocal(),
      window.loadRacesLocal()
    ]);

    const className = String(character.class || '').trim().toLowerCase();
    const subclassName = String(character.build || '').trim().toLowerCase();
    const raceName = String(character.race || '').trim().toLowerCase();

    const charClass = classData.find(c => String(c.name || '').trim().toLowerCase() === className);
    const charSubclass = subClassData.find(s => String(s.name || '').trim().toLowerCase() === subclassName && String(s.class || '').trim().toLowerCase() === className);
    const charRace = raceData.find(r => String(r.name || '').trim().toLowerCase() === raceName || String(r.index || '').trim().toLowerCase() === raceName);

    const sources = [charClass, charSubclass, charRace];
    for (const source of sources) {
      if (source && Array.isArray(source.actions)) {
        for (const action of source.actions) {
          if (action.level && action.level > level) continue;
          if (!isOptionalActionTaken(action, optionalState)) continue;
          const type = mapActionType(action.type || action.actionType);
          if (type && actions[type]) {
            actions[type].push({ ...action, type });
          }
        }
      }
    }

    if (Array.isArray(character.actions)) {
      for (const action of character.actions) {
        if (action.level && action.level > level) continue;
        if (!isOptionalActionTaken(action, optionalState)) continue;
        const type = mapActionType(action.type || action.actionType);
        if (type && actions[type]) {
          actions[type].push({ ...action, type });
        }
      }
    }

    // v1 race actions (supports aliases/inheritance)
    const racesV1 = await loadRacesV1();
    if (racesV1) {
      const raceKey = character?.choices?.raceKey || slugify(character.race);
      const subraceKey = character?.choices?.subraceKey || slugify(character.subrace);
      const subraceAlias = character?.choices?.subraceAlias || character.subrace || '';
      const race = racesV1.find(r => r.key === raceKey || String(r.name || '').toLowerCase() === String(character.race || '').toLowerCase());
      if (race) {
        const addActions = (list, sourceLabel) => {
          if (!Array.isArray(list)) return;
          for (const action of list) {
            if (action.level && action.level > level) continue;
            if (!isOptionalActionTaken(action, optionalState)) continue;
            const type = mapActionType(action.type);
            if (type && actions[type]) {
              actions[type].push({ ...action, type, source: sourceLabel });
            }
          }
        };

        addActions(race.actions, `${race.name} (Racial)`);

        let option = null;
        if (subraceKey) {
          option = (race.options || []).find(o => o.key === subraceKey) || null;
        }
        if (!option && subraceAlias) {
          option = (race.options || []).find(o => Array.isArray(o.aliases) && o.aliases.includes(subraceAlias)) || null;
        }
        if (option?.inherits) {
          const parent = (race.options || []).find(o => o.id === option.inherits) || null;
          if (parent) {
            option = { ...parent, apply: { ...(parent.apply || {}) } };
          }
        }
        const optActions = option?.apply?.actions;
        if (optActions) {
          addActions(optActions, `${race.name} (${option.name || 'Subrace'})`);
        }
      }
    }

    // De-duplicate actions that can arrive from multiple race data sources
    // (e.g., races.json and races.v1.json both contributing the same entry).
    const buckets = ['action', 'bonus', 'reaction', 'special'];
    const normalizeName = (v) => String(v || '')
      .trim()
      .toLowerCase()
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
    const dedupeKey = (a, type) => {
      const name = normalizeName(a?.name);
      const id = String(a?.id || '').trim().toLowerCase();
      return `${type}::${name || id}`;
    };
    for (const bucket of buckets) {
      const list = Array.isArray(actions[bucket]) ? actions[bucket] : [];
      const seen = new Set();
      const next = [];
      for (const act of list) {
        const key = dedupeKey(act, bucket);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        next.push(act);
      }
      actions[bucket] = next;
    }

    const normalizeActionName = (v) => String(v || '')
      .trim()
      .toLowerCase()
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
    for (const bucket of ['action', 'bonus', 'reaction', 'move']) {
      const list = Array.isArray(actions[bucket]) ? actions[bucket] : [];
      const seen = new Set();
      actions[bucket] = list.filter(a => {
        const key = `${bucket}::${normalizeActionName(a?.name)}`;
        if (!normalizeActionName(a?.name) || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    return actions;
  }

  async function getSneakAttackInfo(character) {
    const className = String(character?.class || '').trim().toLowerCase();
    if (className !== 'rogue') return null;
    const level = Number(character?.level || 1);
    const classes = await window.loadClassesLocal();
    const rogue = (classes || []).find(c => String(c?.name || '').trim().toLowerCase() === 'rogue');
    const dice = rogue?.progression?.[String(level)]?.sneakAttackDice;
    if (!dice) return null;
    let desc = '';
    if (rogue?.features) {
      for (const key of Object.keys(rogue.features)) {
        const feat = (rogue.features[key] || []).find(f => String(f?.name || '').toLowerCase() === 'sneak attack');
        if (feat?.desc) { desc = feat.desc; break; }
      }
    }
    return { dice, desc };
  }

  // --- Main Function ---
  // This gathers all actions and organizes them by type.
  async function getCharacterActions(character, state = {}) {
    const dataDriven = await collectDataDrivenActions(character);
    const spellQuickActions = await getSpellQuickCastActions(character);
    const spellState = (typeof global.readSpellState === 'function') ? (global.readSpellState(character) || {}) : {};
    const activeConcentration = String(spellState?.concentrationSpell || '').toLowerCase().trim();
    const sneak = await getSneakAttackInfo(character);
    const selectedManeuvers = getSelectedManeuverNameSet(character);

    if (selectedManeuvers.size > 0) {
      const keepIfSelected = (row) => {
        const maneuverName = extractManeuverNameFromActionName(row?.name);
        if (!maneuverName) return true;
        return selectedManeuvers.has(maneuverName);
      };
      for (const bucket of ['action', 'bonus', 'reaction', 'special']) {
        const list = Array.isArray(dataDriven?.[bucket]) ? dataDriven[bucket] : [];
        dataDriven[bucket] = list.filter(keepIfSelected);
      }
    }

    if (sneak) {
      const already = dataDriven.special?.some(a => String(a?.name || '').toLowerCase() === 'sneak attack');
      if (!already) {
        const base = sneak.desc || 'Once per turn, you can deal extra damage to one creature you hit with an attack if you have advantage on the attack roll, or if an enemy of the target is within 5 feet of it and you do not have disadvantage.';
        dataDriven.special.push({
          name: 'Sneak Attack',
          desc: `${base}\n\nSneak Attack Damage: ${sneak.dice}d6.`,
          source: 'Rogue'
        });
      }
    }

    // Handle conditional descriptions
    if (state.isRaging) {
      const rageAction = dataDriven.bonus.find(a => a.name === 'Rage');
      if (rageAction) {
        const rageDamageBonus = character.level >= 16 ? 4 : character.level >= 9 ? 3 : 2;
        let benefits = `• Advantage on Strength checks and saving throws.\n• +${rageDamageBonus} bonus to damage rolls with Strength-based melee attacks.\n• Resistance to bludgeoning, piercing, and slashing damage.`;
        if (character.level >= 6) {
          benefits += `\n• Fanatical Focus: If you fail a saving throw, you can reroll it (once per rage).`;
        }
        rageAction.desc = `You are currently raging. You gain the following benefits:\n\n${benefits}\n\nYou can end your rage as a bonus action.`;
      }
    }

    // Filter out actions whose conditions are not met
    const filterByCondition = (action) => {
      if (!action.condition) return true;
      if (action.condition === 'isRaging') return !!state.isRaging;
      return false;
    };

    const filteredDataBonus = dataDriven.bonus
      .filter(filterByCondition)
      .filter(a => String(a?.name || '').toLowerCase() !== 'misty wanderer');

    const actions = {
      move: getMovementActions(character),
      action: getGenericActions(character).concat(dataDriven.action.filter(filterByCondition)),
      bonus: getGenericBonusActions(character).concat(filteredDataBonus, spellQuickActions.bonus),
      reaction: getGenericReactions(character).concat(dataDriven.reaction.filter(filterByCondition), spellQuickActions.reaction),
    };

    const knowsHomunculus = !!(global.characterKnowsHomunculusServant && global.characterKnowsHomunculusServant(character));
    if (knowsHomunculus) {
      const hasCommand = actions.bonus.some(a => String(a?.name || '').toLowerCase() === 'command homunculus');
      if (!hasCommand) {
        actions.bonus.push({
          name: 'Command Homunculus',
          desc: 'As a bonus action, command your Homunculus Servant to take an action on its turn. Without your command, it takes only the Dodge action (it can still move and use reactions).',
          source: 'Homunculus Servant (Infusion)'
        });
      }
    }

    const attackAction = actions.action.find(a => String(a?.name || '').toLowerCase() === 'attack');
    if (attackAction) {
      const attacksPerAction = getAttackCountForCharacter(character);
      if (attacksPerAction > 1) {
        attackAction.name = `Attack (${attacksPerAction}x)`;
        attackAction.desc = `Make one melee or ranged attack. You can make ${attacksPerAction} attacks when you take the Attack action.`;
        attackAction.source = String(character?.class || '').trim() || 'Class';
      }
    }

    if (String(character?.class || '').toLowerCase() === 'ranger' && Number(character?.level || 1) >= 20) {
      const hasFoeSlayer = actions.action.some(a => String(a?.name || '').toLowerCase().startsWith('foe slayer'));
      if (!hasFoeSlayer) {
        actions.action.push({
          name: 'Foe Slayer',
          desc: 'Once on each of your turns, you can add your Wisdom modifier to either one attack roll or one damage roll of an attack you make against one of your favored enemies.',
          source: 'Ranger 20'
        });
      }
    }

    if (String(character?.class || '').toLowerCase() === 'fighter') {
      const lvl = Number(character?.level || 1);
      const surgeMax = lvl >= 17 ? 2 : 1;
      const buckets = ['action', 'bonus', 'reaction'];
      for (const bucket of buckets) {
        const list = Array.isArray(actions[bucket]) ? actions[bucket] : [];
        for (const row of list) {
          const n = String(row?.name || '').toLowerCase();
          if (n === 'action surge' || n.startsWith('action surge ')) {
            row.stateKey = 'class:fighter:action-surge';
            row.maxUses = surgeMax;
            row.resourceLabel = row.resourceLabel || 'Action Surge uses';
            row.recharge = row.recharge || 'short_or_long_rest';
          }
          if (n === 'second wind' || n.startsWith('second wind ')) {
            row.stateKey = 'class:fighter:second-wind';
            row.maxUses = 1;
            row.resourceLabel = row.resourceLabel || 'Second Wind uses';
            row.recharge = row.recharge || 'short_or_long_rest';
          }
        }
      }

      if (lvl >= 2) {
        const hasActionSurge = actions.action.some(a => {
          const n = String(a?.name || '').toLowerCase();
          return n === 'action surge' || n.startsWith('action surge ');
        });
        if (!hasActionSurge) {
          actions.action.push({
            name: 'Action Surge',
            desc: 'On your turn, you can take one additional action on top of your regular action and a possible bonus action.',
            source: 'Fighter 2',
            stateKey: 'class:fighter:action-surge',
            maxUses: surgeMax,
            resourceLabel: 'Action Surge uses',
            recharge: 'short_or_long_rest'
          });
        }
      }

      if (lvl >= 1) {
        const hasSecondWind = actions.bonus.some(a => {
          const n = String(a?.name || '').toLowerCase();
          return n === 'second wind' || n.startsWith('second wind ');
        });
        if (!hasSecondWind) {
          actions.bonus.push({
            name: 'Second Wind',
            desc: 'Regain hit points equal to 1d10 + your fighter level.',
            source: 'Fighter 1',
            stateKey: 'class:fighter:second-wind',
            maxUses: 1,
            resourceLabel: 'Second Wind uses',
            recharge: 'short_or_long_rest'
          });
        }
      }
    }

    if (String(character?.class || '').toLowerCase() === 'artificer' && Number(character?.level || 1) >= 1) {
      const hasMagicalTinkering = actions.action.some(a => String(a?.name || '').toLowerCase() === 'magical tinkering');
      if (!hasMagicalTinkering) {
        const intScore = Number(character?.abilities?.INT ?? character?.abilities?.int ?? 10);
        const intMod = window.DDRules.abilityMod(intScore);
        const maxObjects = Math.max(1, intMod);
        actions.action.push({
          name: 'Magical Tinkering',
          desc: `As an action, touch a Tiny nonmagical object and give it one magical property (light, recorded message, odor/sound, or static visual effect). The property lasts indefinitely until ended.\n\nYou can maintain up to ${maxObjects} active tinkered object${maxObjects === 1 ? '' : 's'} at once (based on Intelligence modifier).`,
          source: 'Artificer 1',
          stateKey: 'class:artificer:magical-tinkering-active',
          maxUses: maxObjects,
          resourceLabel: 'Active tinkered objects'
        });
      }
    }

    if (String(character?.class || '').toLowerCase() === 'artificer' && Number(character?.level || 1) >= 7) {
      const hasFlashOfGenius = actions.reaction.some(a => String(a?.name || '').toLowerCase() === 'flash of genius');
      if (!hasFlashOfGenius) {
        const intScore = Number(character?.abilities?.INT ?? character?.abilities?.int ?? 10);
        const intMod = window.DDRules.abilityMod(intScore);
        const uses = Math.max(1, intMod);
        actions.reaction.push({
          name: 'Flash of Genius',
          desc: `When you or another creature you can see within 30 feet makes an ability check or a saving throw, you can use your reaction to add your Intelligence modifier (${window.DDRules.fmtMod(intMod)}) to the roll.\n\nUses: ${uses} per long rest.`,
          source: 'Artificer 7',
          stateKey: 'class:artificer:flash-of-genius',
          maxUses: uses,
          resourceLabel: 'Flash of Genius uses'
        });
      }
    }

    {
      const hasTelekinetic = hasFeatByIdOrName(character, 'feat:telekinetic')
        || hasFeatByIdOrName(character, 'telekinetic');
      if (hasTelekinetic) {
        const exists = actions.bonus.some(a => String(a?.name || '').toLowerCase() === 'telekinetic shove');
        if (!exists) {
          const picked = resolveFeatChoiceValue(character, 'feat:telekinetic', 'choice:feat:telekinetic:asi');
          let abil = normalizeAbilityAbbr(picked);
          if (!['INT', 'WIS', 'CHA'].includes(abil)) {
            const mental = ['INT', 'WIS', 'CHA'];
            abil = mental.sort((a, b) => {
              const av = Number(character?.abilities?.[a] ?? character?.abilities?.[a.toLowerCase()] ?? 10);
              const bv = Number(character?.abilities?.[b] ?? character?.abilities?.[b.toLowerCase()] ?? 10);
              return bv - av;
            })[0] || 'INT';
          }
          const score = Number(character?.abilities?.[abil] ?? character?.abilities?.[abil.toLowerCase()] ?? 10);
          const mod = window.DDRules.abilityMod(score);
          const pb = window.DDRules.proficiencyFromLevel(Number(character?.level || 1));
          const dc = 8 + pb + mod;
          actions.bonus.push({
            name: 'Telekinetic Shove',
            desc: `As a bonus action, target one creature you can see within 30 feet. It must succeed on a Strength saving throw (DC ${dc}) or be moved 5 feet toward you or away from you. A creature can willingly fail this save.\n\nSave DC: 8 + PB (+${pb}) + ${abil} mod (${window.DDRules.fmtMod(mod)}) = ${dc}.`,
            source: 'Feat (Telekinetic)'
          });
        }
      }
    }

    if (String(character?.class || '').toLowerCase() === 'monk' && Number(character?.level || 1) >= 2) {
      const kiNameMap = new Map([
        ['flurry of blows', 'Flurry of Blows (1 Ki)'],
        ['patient defense', 'Patient Defense (1 Ki)'],
        ['step of the wind', 'Step of the Wind (1 Ki)'],
        ['quickened healing', 'Quickened Healing (2 Ki)'],
        ['quickened healing (optional)', 'Quickened Healing (2 Ki)']
      ]);
      for (const action of actions.bonus) {
        const key = String(action?.name || '').toLowerCase();
        if (kiNameMap.has(key)) action.name = kiNameMap.get(key);
      }
      for (const action of actions.action) {
        const key = String(action?.name || '').toLowerCase();
        if (kiNameMap.has(key)) action.name = kiNameMap.get(key);
      }
    }

    if (String(character?.class || '').toLowerCase() === 'monk' && Number(character?.level || 1) >= 3) {
      const hasKiFueledChoice = hasTakenOptionalFeature(character, 'ki-fueled-attack');
      const hasKiFueledAction = actions.bonus.some(a => String(a?.name || '').toLowerCase().startsWith('ki-fueled attack'));
      if (hasKiFueledChoice && !hasKiFueledAction) {
        actions.bonus.push({
          name: 'Ki-Fueled Attack',
          desc: 'If you spend 1 ki point or more as part of your action on your turn, you can make one attack with an unarmed strike or a monk weapon as a bonus action before the end of the turn.',
          source: 'Monk 3 (Optional)'
        });
      }
      for (const action of actions.bonus) {
        if (String(action?.name || '').toLowerCase() === 'ki-fueled attack (optional)') {
          action.name = 'Ki-Fueled Attack';
        }
      }
    }

    if (String(character?.class || '').toLowerCase() === 'monk' && Number(character?.level || 1) >= 5) {
      const stunningSpecial = dataDriven.special?.find(a => String(a?.name || '').toLowerCase() === 'stunning strike');
      const hasStunningAction = actions.action.some(a => String(a?.name || '').toLowerCase().startsWith('stunning strike'));
      if (stunningSpecial && !hasStunningAction) {
        actions.action.push({
          name: 'Stunning Strike - On Hit (1 Ki)',
          desc: String(stunningSpecial.desc || 'When you hit a creature with a melee weapon attack, you can spend 1 ki point; it makes a CON save or is stunned until the end of your next turn.'),
          source: stunningSpecial.source || 'Monk 5'
        });
      }
    }

    if (String(character?.class || '').toLowerCase() === 'monk' && Number(character?.level || 1) >= 7) {
      const hasStillness = actions.action.some(a => String(a?.name || '').toLowerCase() === 'stillness of mind');
      if (!hasStillness) {
        actions.action.push({
          name: 'Stillness of Mind',
          desc: 'You can use your action to end one effect on yourself that is causing you to be charmed or frightened.',
          source: 'Monk 7'
        });
      }
    }

    if (String(character?.class || '').toLowerCase() === 'monk' && Number(character?.level || 1) >= 20) {
      const hasPerfectSelf = actions.reaction.some(a => String(a?.name || '').toLowerCase() === 'perfect self (on initiative)');
      if (!hasPerfectSelf) {
        actions.reaction.push({
          name: 'Perfect Self (On Initiative)',
          desc: 'Trigger (no action): When you roll initiative and have no ki points remaining, you regain 4 ki points.',
          source: 'Monk 20 (Perfect Self)'
        });
      }
    }

    if (String(character?.class || '').toLowerCase() === 'monk' && Number(character?.level || 1) >= 18) {
      const spellDescMap = await ensureSpellDescMap();
      const astralProjectionDesc = String(spellDescMap.get('astral projection') || '').trim();

      // Replace any generic Empty Body row with the explicit Ki-cost actions.
      actions.action = actions.action.filter(a => String(a?.name || '').toLowerCase() !== 'empty body');

      const emptyBodyActions = [
        {
          name: 'Empty Body: Invisibility (4 Ki)',
          desc: 'As an action, spend 4 ki points to become invisible for 1 minute. During that time, you also have resistance to all damage except force damage.',
          source: 'Monk 18 (Empty Body)'
        },
        {
          name: 'Empty Body: Astral Projection (8 Ki)',
          desc: `${astralProjectionDesc || 'You and up to eight willing creatures within 10 feet project your astral bodies into the Astral Plane while your physical bodies remain unconscious and in suspended animation. The spell ends when you use your action to dismiss it, or if a projected form or body is reduced to 0 hit points.'}\n\nEmpty Body: By spending 8 ki points, you cast Astral Projection without material components. When you do so, you cannot take any other creatures with you.`,
          source: 'Monk 18 (Empty Body)'
        }
      ];

      for (const entry of emptyBodyActions) {
        if (actions.action.some(a => String(a?.name || '').toLowerCase() === entry.name.toLowerCase())) continue;
        actions.action.push(entry);
      }
    }

    if (String(character?.class || '').toLowerCase() === 'monk'
      && String(character?.build || '').toLowerCase().includes('way of shadow')
      && Number(character?.level || 1) >= 3) {
      const spellDescMap = await ensureSpellDescMap();
      const shadowArts = actions.action.find(a => String(a?.name || '').toLowerCase() === 'shadow arts');
      const shadowSpells = [
        { name: 'Shadow Arts: Darkness (2 Ki)', spell: 'Darkness' },
        { name: 'Shadow Arts: Darkvision (2 Ki)', spell: 'Darkvision' },
        { name: 'Shadow Arts: Pass without Trace (2 Ki)', spell: 'Pass without Trace' },
        { name: 'Shadow Arts: Silence (2 Ki)', spell: 'Silence' }
      ];
      for (const entry of shadowSpells) {
        if (actions.action.some(a => String(a?.name || '').toLowerCase() === entry.name.toLowerCase())) continue;
        const spellDesc = String(spellDescMap.get(String(entry.spell || '').toLowerCase()) || '').trim();
        actions.action.push({
          name: entry.name,
          desc: `${spellDesc || `As an action, spend 2 ki points to cast ${entry.spell} (Shadow Arts), without material components.`}\n\nShadow Arts: Spend 2 ki points to cast this spell without material components.`,
          source: 'Way of Shadow 3 (Shadow Arts)'
        });
      }
      if (shadowArts) {
        shadowArts.desc = `${String(shadowArts.desc || '')}\n\nThese options are listed separately in Actions: Darkness, Darkvision, Pass without Trace, and Silence (each costs 2 Ki).`.trim();
      }
    }

    // Lucky feat pilot: add a direct trigger entry tied to feat resource usage.
    const luckyRes = global.FeatRuntime?.getLuckyResource?.(character) || null;
    if (luckyRes && (global.FeatRuntime?.hasFeat?.(character, 'lucky') || global.FeatRuntime?.hasFeat?.(character, 'feat:lucky'))) {
      const exists = actions.reaction.some(a => String(a?.name || '').toLowerCase() === 'lucky (1 point)');
      if (!exists) {
        actions.reaction.push({
          name: 'Lucky (1 Point)',
          desc: 'Trigger (no action): Spend 1 luck point after seeing a d20 roll, before the outcome is determined, to roll an extra d20 and choose which die is used. You can also use this when an attack roll is made against you.',
          source: 'Feat (Lucky)',
          featResourceId: String(luckyRes.id || luckyRes.name || '')
        });
      }
    }

    const sw = actions.bonus.find(a => String(a?.name || '').toLowerCase() === 'spiritual weapon');
    if (sw) {
      const extra = "As a bonus action on your turn, you can move the weapon up to 20 feet and repeat the attack.";
      const desc = String(sw.desc || "");
      if (!desc.toLowerCase().includes('move the weapon up to 20 feet')) {
        sw.desc = `${desc}${desc ? '\n\n' : ''}${extra}`;
      }
      if (state.spiritualWeaponActive) {
        actions.bonus.push({
          name: 'Spiritual Weapon: Move & Attack',
          desc: extra,
          source: 'Spell (Active)'
        });
      }
    }

    // Spell reaction helper: Absorb Elements
    {
      const spellState = (typeof global.readSpellState === 'function') ? (global.readSpellState(character) || {}) : {};
      const prepared = spellState.preparedByLevel || {};
      const preparedNames = Object.values(prepared).flat().map(s => String(s || '').toLowerCase());
      const baseSpells = Array.isArray(character?.spells) ? character.spells.map(s => String(s || '').toLowerCase()) : [];
      const spellSources = Object.keys(character?.spellSources || {}).map(s => String(s || '').toLowerCase());
      const hasAbsorbElements =
        preparedNames.includes('absorb elements') ||
        baseSpells.includes('absorb elements') ||
        spellSources.includes('absorb elements');
      if (hasAbsorbElements) {
        const exists = actions.reaction.some(a => String(a?.name || '').toLowerCase() === 'absorb elements');
        if (!exists) {
          const spellDescMap = await ensureSpellDescMap();
          const baseDesc = String(spellDescMap.get('absorb elements') || '').trim();
          const reminder = 'Casting this spell expends a spell slot (1st level or higher).';
          actions.reaction.push({
            name: 'Absorb Elements',
            desc: `${baseDesc || 'Reaction when you take acid, cold, fire, lightning, or thunder damage: gain resistance to the triggering type until the start of your next turn; your next melee hit deals +1d6 of that type.'}\n\n${reminder}`,
            source: 'Spell (Reaction)'
          });
        }
      }
    }

    // Infernal Legacy helper: Hellish Rebuke (Tiefling)
    {
      const race = String(character?.race || '').toLowerCase();
      const levelNow = Number(character?.level || 1);
      const traits = Array.isArray(character?.traits) ? character.traits : [];
      const hasDevilsTongue = traits.some(trait =>
        String(trait?.name || trait || '').toLowerCase().includes("devil's tongue")
      );
      const hasInfernalLegacyRebuke = race.includes('tiefling') && !hasDevilsTongue && levelNow >= 3;
      if (hasInfernalLegacyRebuke) {
        const exists = actions.reaction.some(a => String(a?.name || '').toLowerCase() === 'hellish rebuke');
        if (!exists) {
          actions.reaction.push({
            name: 'Hellish Rebuke',
            desc: "You point your finger, and the creature that damaged you is momentarily surrounded by hellish flames. The creature must make a Dexterity saving throw. It takes 2d10 fire damage on a failed save, or half as much damage on a successful one.\n\nInfernal Legacy: You cast this as a 2nd-level spell once per long rest, so the damage is 3d10 fire (or half on a success).",
            source: 'Tiefling (Infernal Legacy)'
          });
        }
      }
    }

    // Active Infusion helpers (owned by this character as the infused-item holder).
    {
      const allInfusions = (typeof global.readAllActiveInfusions === 'function')
        ? global.readAllActiveInfusions()
        : [];
      const mine = allInfusions.filter(inf =>
        String(inf?.owner || '').trim() === String(character?.name || '').trim()
      );

      const hasInfusion = (n) => mine.find(inf => String(inf?.name || '').toLowerCase() === String(n || '').toLowerCase());
      const listInfusions = (n) => mine.filter(inf => String(inf?.name || '').toLowerCase() === String(n || '').toLowerCase());

      const mindSharpeners = listInfusions('Mind Sharpener');
      for (const mindSharpener of mindSharpeners) {
        const key = infusionStateKey('mind-sharpener', mindSharpener.item);
        const labelItem = String(mindSharpener.item || 'Infused Armor');
        if (!actions.reaction.some(a => String(a?.name || '').toLowerCase() === `mind sharpener (${labelItem})`.toLowerCase())) {
          actions.reaction.push({
            name: `Mind Sharpener (${labelItem})`,
            desc: 'When the wearer fails a Constitution saving throw to maintain concentration on a spell, they can use their reaction to expend 1 charge and succeed instead. Mind Sharpener has 4 charges; it regains 1d4 expended charges daily at dawn.\n\nTracker note: click to spend 1 charge; Shift-click refunds 1 charge.',
            source: 'Infusion (Mind Sharpener)',
            stateKey: key,
            maxUses: 4,
            resourceLabel: 'Mind Sharpener charges'
          });
        }
      }

      const spellRefuel = hasInfusion('Spell-Refueling Ring');
      if (spellRefuel) {
        const key = infusionStateKey('spell-refueling-ring', spellRefuel.item);
        if (!actions.action.some(a => String(a?.name || '').toLowerCase().startsWith('spell-refueling ring'))) {
          actions.action.push({
            name: 'Spell-Refueling Ring',
            desc: 'As an action, recover one expended spell slot of 3rd level or lower. Once used, the ring can’t be used again until the next dawn.\n\nTracker note: click to consume the daily use and recover a slot; Shift-click resets the daily use.',
            source: 'Infusion (Spell-Refueling Ring)',
            stateKey: key,
            maxUses: 1,
            recoverSpellSlot: true
          });
        }
      }

      const bootsWinding = hasInfusion('Boots of the Winding Path');
      if (bootsWinding && !actions.bonus.some(a => String(a?.name || '').toLowerCase() === 'boots of the winding path')) {
        actions.bonus.push({
          name: 'Boots of the Winding Path',
          desc: 'As a bonus action, teleport up to 15 feet to an unoccupied space you can see, as long as you occupied that space at some point during the current turn.',
          source: 'Infusion (Boots of the Winding Path)'
        });
      }

      const radiantWeapon = hasInfusion('Radiant Weapon');
      if (radiantWeapon) {
        if (!actions.bonus.some(a => String(a?.name || '').toLowerCase() === 'radiant weapon: shed light')) {
          actions.bonus.push({
            name: 'Radiant Weapon: Shed Light',
            desc: 'As a bonus action while holding the infused weapon, cause it to shed bright light in a 30-foot radius and dim light for an additional 30 feet. Repeat to extinguish.',
            source: 'Infusion (Radiant Weapon)'
          });
        }
        if (!actions.reaction.some(a => String(a?.name || '').toLowerCase() === 'radiant weapon: flash blind')) {
          actions.reaction.push({
            name: 'Radiant Weapon: Flash Blind',
            desc: 'When hit by an attack while holding the infused weapon, you can use your reaction to force the attacker to make a Constitution saving throw against your artificer spell save DC. On a failed save, the attacker is blinded until the end of its next turn.',
            source: 'Infusion (Radiant Weapon)'
          });
        }
      }

      const armorMagicalStrengthList = listInfusions('Armor of Magical Strength');
      for (const armorMagicalStrength of armorMagicalStrengthList) {
        const itemLabel = String(armorMagicalStrength.item || 'Infused Armor');
        const sharedKey = infusionStateKey('armor-of-magical-strength', armorMagicalStrength.item);
        if (!actions.action.some(a => String(a?.name || '').toLowerCase() === `armor of magical strength (${itemLabel}): empower str check/save`.toLowerCase())) {
          actions.action.push({
            name: `Armor of Magical Strength (${itemLabel}): Empower STR Check/Save`,
            desc: 'When you make a Strength check or Strength saving throw while wearing this armor, you can expend 1 charge to add your Intelligence modifier to the roll. (This infusion has 6 charges and regains 1d6 expended charges daily at dawn.)',
            source: 'Infusion (Armor of Magical Strength)',
            stateKey: sharedKey,
            maxUses: 6,
            resourceLabel: 'Armor of Magical Strength charges'
          });
        }
        if (!actions.reaction.some(a => String(a?.name || '').toLowerCase() === `armor of magical strength (${itemLabel}): avoid prone`.toLowerCase())) {
          actions.reaction.push({
            name: `Armor of Magical Strength (${itemLabel}): Avoid Prone`,
            desc: 'If an effect would knock you prone while wearing this armor, you can use your reaction to expend 1 charge and not be knocked prone.',
            source: 'Infusion (Armor of Magical Strength)',
            stateKey: sharedKey,
            maxUses: 6,
            resourceLabel: 'Armor of Magical Strength charges'
          });
        }
      }

      const resistantArmor = hasInfusion('Resistant Armor');
      if (resistantArmor) {
        const picked = String(resistantArmor?.resistType || resistantArmor?.choice || '').trim();
        const chosen = picked || 'chosen damage type';
        if (!actions.reaction.some(a => String(a?.name || '').toLowerCase() === 'resistant armor')) {
          actions.reaction.push({
            name: 'Resistant Armor',
            desc: `While wearing the infused armor, you have resistance to ${chosen}.`,
            source: `Infusion (Resistant Armor${picked ? `: ${picked}` : ''})`
          });
        }
      }
    }

    const cls = String(character?.class || '').toLowerCase();
    const level = Number(character?.level || 1);
    if (cls === 'cleric' && level >= 2) {
      const hasTurnUndead = actions.action.some(a => String(a?.name || '').toLowerCase() === 'channel divinity: turn undead');
      if (!hasTurnUndead) {
        actions.action.push({
          name: 'Channel Divinity: Turn Undead',
          desc: 'As an action, present your Holy Symbol and censure Undead. Each Undead of your choice within 30 feet that can see or hear you must make a Wisdom saving throw. If the save fails, the target has the Frightened and Incapacitated conditions for 1 minute. For that duration, it tries to move as far from you as it can on its turns. This effect ends early on the target if it takes any damage, if you have the Incapacitated condition, or if you die.',
          source: 'Cleric'
        });
      }
    }

    if (cls === 'cleric' && level >= 5) {
      const destroyByLevel = (lvl) => {
        if (lvl >= 17) return '4';
        if (lvl >= 14) return '3';
        if (lvl >= 11) return '2';
        if (lvl >= 8) return '1';
        return '1/2';
      };
      const maxCR = destroyByLevel(level);
      const turnUndead = actions.action.find(a => String(a?.name || '').toLowerCase() === 'channel divinity: turn undead');
      if (turnUndead) {
        const marker = 'Destroy Undead';
        const addendum = `Destroy Undead: When an Undead fails its save against your Turn Undead, the creature is instantly destroyed if its Challenge Rating is ${maxCR} or lower.`;
        const desc = String(turnUndead.desc || '');
        if (!desc.toLowerCase().includes(marker.toLowerCase())) {
          turnUndead.desc = `${desc}${desc ? '\n\n' : ''}${addendum}`;
        }
      }
    }

    if (cls === 'cleric' && level >= 10) {
      const hasDivineIntervention = actions.action.some(a => String(a?.name || '').toLowerCase() === 'divine intervention');
      if (!hasDivineIntervention) {
        const desc = level >= 20
          ? 'As an action, call on your deity for aid. Divine Intervention succeeds automatically at 20th level. Once you use this feature successfully, you can’t use it again for 7 days.'
          : 'As an action, call on your deity for aid. Roll percentile dice; if the number rolled is equal to or lower than your cleric level, your deity intervenes. If successful, you can’t use this feature again for 7 days. If unsuccessful, you can use it again after a long rest.';
        actions.action.push({
          name: 'Divine Intervention',
          desc,
          source: 'Cleric'
        });
      }
    }

    const build = String(character?.build || '').toLowerCase();
    const isNatureDomainCleric = cls === 'cleric' && build.includes('nature domain');
    if (isNatureDomainCleric) {
      const charmAction = actions.action.find(a => String(a?.name || '').toLowerCase() === 'channel divinity: charm animals and plants');
      if (charmAction && level >= 17) {
        const extra = 'Master of Nature: While creatures are charmed by this feature, you can take a bonus action on your turn to verbally command what each of those creatures will do on its next turn.';
        const desc = String(charmAction.desc || '');
        if (!desc.toLowerCase().includes('master of nature')) {
          charmAction.desc = `${desc}${desc ? '\n\n' : ''}${extra}`;
        }
        if (state.natureCharmActive) {
          actions.bonus.push({
            name: 'Master of Nature: Command Charmed Creatures',
            desc: 'As a bonus action, verbally command what each creature charmed by your Channel Divinity: Charm Animals and Plants will do on its next turn.',
            source: 'Nature Domain 17 (Master of Nature)'
          });
        }
      }
    }

    if ((cls === 'cleric' || cls === 'paladin') && level >= 2 && hasHarnessDivinePower(character)) {
      actions.bonus.push({
        name: 'Harness Divine Power',
        desc: "As a bonus action, expend one use of Channel Divinity to regain one expended spell slot. The slot can be no higher than half your proficiency bonus (rounded up).",
        source: 'Optional Feature'
      });
    }

    if (activeConcentration === 'call lightning') {
      const exists = actions.action.some(a => String(a?.name || '').toLowerCase() === 'call bolt of lightning');
      if (!exists) {
        const spellStats = (window.DDRules && typeof window.DDRules.computeSpellStats === 'function')
          ? window.DDRules.computeSpellStats(character)
          : null;
        const saveDC = Number(spellStats?.dc || 0);
        const dcText = saveDC > 0 ? `Spell Save DC ${saveDC}` : 'your spell save DC';
        actions.action.push({
          name: 'Call Bolt of Lightning',
          desc: `When you cast the spell, choose a point you can see under the cloud. Each creature within 5 feet of that point must make a Dexterity saving throw against ${dcText}. A creature takes 3d10 lightning damage on a failed save, or half as much damage on a successful one. When you cast this spell using a spell slot of 4th or higher level, the damage increases by 1d10 for each slot level above 3rd.`,
          source: 'Spell (Call Lightning, Concentration)'
        });
      }
    }

    const isBattleMaster = String(character?.class || '').toLowerCase() === 'fighter'
      && String(character?.build || '').toLowerCase() === 'battle master';
    if (!isBattleMaster && Array.isArray(character?.maneuvers) && character.maneuvers.length) {
      const maneuverMap = await ensureManeuverDescMap();
      const saveDcMeta = getManeuverSaveDcMeta(character);
      const resources = Array.isArray(character?.resources) ? character.resources : [];
      const superiority = resources.find(r => String(r?.id || '').toLowerCase().includes('superiority-die') || String(r?.name || '').toLowerCase() === 'superiority dice');
      const supResId = String(superiority?.id || superiority?.name || '');
      for (const m of character.maneuvers) {
        const name = String(m || '').trim();
        if (!name) continue;
        const actionName = `Maneuver: ${name} (1 Superiority Die)`;
        const exists = actions.action.some(a => String(a?.name || '').toLowerCase() === actionName.toLowerCase());
        if (exists) continue;
        const baseDesc = String(maneuverMap.get(name.toLowerCase()) || '').trim();
        const dcLine = saveDcMeta
          ? `\n\nManeuver Save DC (if required): ${saveDcMeta.dc} (8 + PB ${saveDcMeta.pb} + ${saveDcMeta.ability} mod ${saveDcMeta.mod >= 0 ? '+' : ''}${saveDcMeta.mod}).`
          : '';
        actions.action.push({
          name: actionName,
          desc: `${baseDesc || 'Use a learned Battle Master maneuver by expending one superiority die.'}${dcLine}`.trim(),
          source: 'Feat (Martial Adept)',
          featResourceId: supResId,
          featResourceCost: 1
        });
      }
    }

    if (cls === 'monk') {
      const deflect = actions.reaction.find(a => String(a?.name || '').toLowerCase() === 'deflect missiles');
      if (deflect && !String(deflect.source || '').trim()) {
        deflect.source = 'Monk 3';
      }
      const slowFall = actions.reaction.find(a => String(a?.name || '').toLowerCase() === 'slow fall');
      if (slowFall && !String(slowFall.source || '').trim()) {
        slowFall.source = 'Monk 4';
      }
    }

    attachFeatResourceIds(actions, character);

    // Integrate "special" actions into the descriptions of their parent actions
    for (const special of dataDriven.special.filter(filterByCondition)) {
      if (String(character?.class || '').toLowerCase() === 'monk' && String(special?.name || '').toLowerCase() === 'stunning strike') {
        continue; // Rendered as a dedicated action row for Ki tracking.
      }
      const isFeatSpecial = !!special?.featResourceId || String(special?.source || '').toLowerCase().startsWith('feat:');
      if (isFeatSpecial) {
        const exists = actions.action.some(a => String(a?.name || '').toLowerCase() === String(special?.name || '').toLowerCase());
        if (!exists) {
          const resources = Array.isArray(character?.resources) ? character.resources : [];
          const matched = findFeatResourceForAction(special, resources);
          actions.action.push({
            ...special,
            type: 'action',
            featResourceId: String(special?.featResourceId || matched?.id || matched?.name || '')
          });
        }
        continue;
      }
      const parentAction = actions.action.find(a => a.name === 'Attack');
      if (parentAction) {
        parentAction.desc += `\n\n${special.name}: ${special.desc}`;
      }
    }

    // Final safety dedupe after all merges/augmentations.
    const normalizeActionNameFinal = (v) => String(v || '')
      .trim()
      .toLowerCase()
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
    for (const bucket of ['move', 'action', 'bonus', 'reaction']) {
      const list = Array.isArray(actions[bucket]) ? actions[bucket] : [];
      const seen = new Set();
      actions[bucket] = list.filter(a => {
        const norm = normalizeActionNameFinal(a?.name);
        const key = `${bucket}::${norm}`;
        if (!norm || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    return actions;
  }

  // Expose to global scope so other scripts can use it
  global.getCharacterActions = getCharacterActions;

})(window);
