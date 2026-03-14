// assets/js/spells-page.js
// Page-specific logic for the spells sheet.

(function (global) {
  // --- DOM Refs ---
  const $ = global.$ || ((sel, root = document) => (root || document).querySelector(sel));
  const F = {
    status:      () => $("#status"),
    klass:       () => $("#field-class"),
    level:       () => $("#field-level"),
    nameBox:     () => $("#field-name"),
    abilityTP:   () => $("#ability-tp"),
    scPrepBox:   ()=> $("#sc-prep"),
    scPrepCount: ()=> $("#prep-count"),
    scPrepLimit: ()=> $("#prep-limit"),
    short:       () => $("#short-rest"),
    long:        () => $("#long-rest"),
    reprep:      () => $("#reprepare"),
    lvlBox:      (n) => n===0 ? $("#lvl-cantrips") : $(`#lvl-${n}`),
    resKi:       () => $("#res-ki"),
    resCD:       () => $("#res-cd"),
    resCDP:      () => $("#cd-dots"),
    resKiP:      () => $("#ki-pips"),
    resWS:       () => $("#res-ws"),
    resWSP:      () => $("#ws-pips"),
    resSE:       () => $("#res-se"),
    seToggle:    () => $("#se-toggle"),
    resources:   () => $("#resources"),
  };

  // --- State Management ---
  const ST = {
    getPrepared: s => s.preparedByLevel || {},
    setPrepared: (s,v)=>{ s.preparedByLevel=v; },
    getSlotsSpent: s=> s.slotsSpent || {},
    setSlotsSpent: (s,v)=>{ s.slotsSpent=v; },
    getKi: s => Number(s.kiSpent||0),
    setKi: (s,v)=>{ s.kiSpent = Math.max(0, Number(v)||0); },
    getCD: s => Number(s.channelDivinityUsed||0),
    setCD: (s,v)=>{ s.channelDivinityUsed = Math.max(0, Number(v)||0); },
    getWS: s => Number(s.wildShapeUsed||0),
    setWS: (s,v)=>{ s.wildShapeUsed = Math.max(0, Number(v)||0); },
    getSE: s => !!s.symbioticActive,
    setSE: (s,v)=>{ s.symbioticActive = !!v; },
    getKnownInfusions: s => s.knownInfusions,
    setKnownInfusions: (s,v) => { s.knownInfusions = v; },
    getConcentrationSpell: s => String(s.concentrationSpell || '').trim(),
    setConcentrationSpell: (s,v)=>{ s.concentrationSpell = String(v || '').trim(); },
    getSpellStoringItem: s => (s && typeof s.spellStoringItem === 'object' && s.spellStoringItem ? s.spellStoringItem : null),
    setSpellStoringItem: (s,v)=>{ s.spellStoringItem = (v && typeof v === 'object') ? v : null; },
  };

  const SPELL_STORING_ALLOWED_TOOL_KEYS = new Set([
    'thieves-tools'
  ]);

  function normalizeKey(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function hasSpellStoringItemFeature(character) {
    const cls = String(character?.class || '').toLowerCase();
    const level = Number(character?.level || 1);
    if (cls.split(/[,/]/).map(s => s.trim()).includes('artificer') || cls.includes('artificer')) {
      return level >= 11;
    }
    const traits = Array.isArray(character?.traits) ? character.traits : [];
    return traits.some(t => String(t?.name || t || '').toLowerCase().includes('spell-storing item'));
  }

  function hasArcaneFirearmFeature(character) {
    const cls = String(character?.class || '').toLowerCase();
    const build = String(character?.build || '').toLowerCase();
    const level = Number(character?.level || 1);
    if ((cls.split(/[,/]/).map(s => s.trim()).includes('artificer') || cls.includes('artificer'))
      && build.includes('artillerist')
      && level >= 5) {
      return true;
    }
    const traits = Array.isArray(character?.traits) ? character.traits : [];
    return traits.some(t => String(t?.name || t || '').toLowerCase().includes('arcane firearm'));
  }

  function spellStoringMaxUses(character) {
    const intScore = Number(character?.abilities?.INT ?? character?.abilities?.int ?? 10);
    const intMod = (window.DDRules && typeof window.DDRules.abilityMod === 'function')
      ? window.DDRules.abilityMod(intScore)
      : Math.floor((intScore - 10) / 2);
    return Math.max(2, intMod * 2);
  }

  function getCastingTimeText(...spellLikeEntries) {
    for (const s of spellLikeEntries) {
      if (!s) continue;
      const raw = s.castingTime ?? s.casting_time ?? s.casting?.time ?? s.time ?? null;
      if (raw == null) continue;
      if (typeof raw === 'string') {
        const txt = raw.trim();
        if (txt) return txt;
        continue;
      }
      if (typeof raw === 'object') {
        const n = Number(raw.number);
        const unit = String(raw.unit || '').trim();
        if (Number.isFinite(n) && unit) return `${n} ${unit}`;
      }
    }
    return '';
  }

  function isOneActionCastingTime(...spellLikeEntries) {
    const txt = getCastingTimeText(...spellLikeEntries).toLowerCase().replace(/\s+/g, ' ').trim();
    if (!txt) return false;
    return txt === 'action'
      || txt === '1 action'
      || txt.startsWith('1 action,');
  }

  function formatSpellTooltip(name, baseText, suffixText = '') {
    const spellName = String(name || '').trim().toLowerCase();
    const base = String(baseText || '').trim();
    const suffix = String(suffixText || '');
    if (spellName === 'confusion') {
      const d10Table = [
        '',
        'Confusion (d10 behavior each turn):',
        '1: The creature uses all its movement to move in a random direction (roll a d8 for direction). It takes no action this turn.',
        '2-6: The creature does not move or take actions this turn.',
        '7-8: The creature uses its action to make a melee attack against a randomly determined creature within reach. If none are in reach, it does nothing.',
        '9-10: The creature can act and move normally.'
      ].join('\n');
      if (base.toLowerCase().includes('confusion (d10 behavior each turn)')) return `${base}${suffix}`;
      return `${base}${d10Table}${suffix}`;
    }
    if (spellName === 'cloudkill') {
      const notes = [
        '',
        "When a creature enters the spell's area for the first time on a turn or starts its turn there, that creature must make a Constitution saving throw.",
        'The creature takes 5d8 poison damage on a failed save, or half as much damage on a successful one.',
        "Creatures are affected even if they hold their breath or don't need to breathe.",
        '',
        'The fog moves 10 feet away from you at the start of each of your turns, rolling along the surface of the ground.',
        'The vapors, being heavier than air, sink to the lowest level of the land, even pouring down openings.'
      ].join('\n');
      if (base.toLowerCase().includes('the fog moves 10 feet away from you')) return `${base}${suffix}`;
      return `${base}${notes}${suffix}`;
    }
    if (spellName === 'contagion') {
      const notes = [
        '',
        'Your touch inflicts disease. Make a melee spell attack against a creature within your reach. On a hit, you afflict the creature with a disease of your choice from any of the ones described below.',
        '',
        "At the end of each of the target's turns, it must make a Constitution saving throw. After failing three of these saving throws, the disease's effects last for the duration, and the creature stops making these saves. After succeeding on three of these saves, the creature recovers from the disease, and the spell ends.",
        '',
        "Since this spell induces a natural disease in its target, any effect that removes a disease or otherwise ameliorates a disease's effects apply to it.",
        '',
        'Blinding Sickness. Pain grips the creature\'s mind, and its eyes turn milky white. The creature has disadvantage on Wisdom checks and Wisdom saving throws and is blinded.',
        '',
        'Filth Fever. A raging fever sweeps through the creature\'s body. The creature has disadvantage on Strength checks, Strength saving throws, and attack rolls that use Strength.',
        '',
        'Flesh Rot. The creature\'s flesh decays. The creature has disadvantage on Charisma checks and vulnerability to all damage.',
        '',
        'Mindfire. The creature\'s mind becomes feverish. The creature has disadvantage on Intelligence checks and Intelligence saving throws, and the creature behaves as if under the effects of the confusion spell during combat.',
        '',
        'Seizure. The creature is overcome with shaking. The creature has disadvantage on Dexterity checks, Dexterity saving throws, and attack rolls that use Dexterity.',
        '',
        'Slimy Doom. The creature begins to bleed uncontrollably. The creature has disadvantage on Constitution checks and Constitution saving throws. In addition, whenever the creature takes damage, it is stunned until the end of its next turn.'
      ].join('\n');
      if (base.toLowerCase().includes('blinding sickness.')) return `${base}${suffix}`;
      return `${base}${notes}${suffix}`;
    }
    return `${base}${suffix}`;
  }

  function rangerSpellsKnown(level) {
    const L = Number(level) || 1;
    const knownMap = {
        1: 0, 2: 2, 3: 3, 4: 3, 5: 4, 6: 4, 7: 5, 8: 5, 9: 6, 10: 6,
        11: 7, 12: 7, 13: 8, 14: 8, 15: 9, 16: 9, 17: 10, 18: 10, 19: 11, 20: 11
    };
    return knownMap[L] || 0;
  };

  function arcaneTricksterSpellsKnown(level) {
    const L = Number(level) || 1;
    const knownMap = {
      1: 0, 2: 0, 3: 3, 4: 4, 5: 4, 6: 4, 7: 5, 8: 6, 9: 6, 10: 7,
      11: 8, 12: 8, 13: 9, 14: 10, 15: 10, 16: 11, 17: 11, 18: 12, 19: 13, 20: 14
    };
    return knownMap[L] || 0;
  }

  function parseOptionalTaken(taken, rawValue = '') {
    if (typeof taken === 'boolean') return taken;
    const v = String(rawValue || '').trim().toLowerCase();
    return ['taken', 'yes', 'y', 'true', '1'].includes(v);
  }

  function isPrimalAwarenessTaken(character) {
    if (String(character?.class || '').toLowerCase() !== 'ranger') return false;
    const classChoices = Array.isArray(character?.choices?.classChoices) ? character.choices.classChoices : [];
    for (const row of classChoices) {
      const id = String(row?.choiceId || '').toLowerCase();
      if (!id.includes(':optional:primal-awareness')) continue;
      if (parseOptionalTaken(row?.taken, row?.value)) return true;
    }
    const levelUpDecisions = Array.isArray(character?.choices?.levelUpDecisions) ? character.choices.levelUpDecisions : [];
    for (const dec of levelUpDecisions) {
      for (const pick of (Array.isArray(dec?.choices) ? dec.choices : [])) {
        const id = String(pick?.choiceId || '').toLowerCase();
        if (!id.includes(':optional:primal-awareness')) continue;
        if (parseOptionalTaken(pick?.taken, pick?.value)) return true;
      }
    }
    const traits = Array.isArray(character?.traits) ? character.traits : [];
    return traits.some(t => String(t?.name || t || '').toLowerCase().includes('primal awareness'));
  }

  function getPrimalAwarenessSpells(character) {
    const level = Number(character?.level || 1);
    if (!isPrimalAwarenessTaken(character)) return [];
    const table = [
      { minLevel: 3, name: 'Speak with Animals', level: 1 },
      { minLevel: 5, name: 'Beast Sense', level: 2 },
      { minLevel: 9, name: 'Speak with Plants', level: 3 },
      { minLevel: 13, name: 'Locate Creature', level: 4 },
      { minLevel: 17, name: 'Commune with Nature', level: 5 }
    ];
    return table.filter(row => level >= row.minLevel);
  }

  function hasFeyReinforcements(character) {
    const cls = String(character?.class || '').toLowerCase();
    const build = String(character?.build || '').toLowerCase();
    const level = Number(character?.level || 1);
    if (cls === 'ranger' && build.includes('fey wanderer') && level >= 11) return true;
    const traits = Array.isArray(character?.traits) ? character.traits : [];
    return traits.some(t => String(t?.name || t || '').toLowerCase().includes('fey reinforcements'));
  }

  function getFeyReinforcementsSpells(character) {
    if (!hasFeyReinforcements(character)) return [];
    return [{ name: 'Summon Fey', level: 3 }];
  }

  function hasMistyWanderer(character) {
    const cls = String(character?.class || '').toLowerCase();
    const build = String(character?.build || '').toLowerCase();
    const level = Number(character?.level || 1);
    if (cls === 'ranger' && build.includes('fey wanderer') && level >= 15) return true;
    const traits = Array.isArray(character?.traits) ? character.traits : [];
    return traits.some(t => String(t?.name || t || '').toLowerCase().includes('misty wanderer'));
  }

  function shouldHideDynamicCantrip(character, className) {
    const cls = String(className || '').toLowerCase();
    // These classes know a fixed number of cantrips; show only the cantrips
    // explicitly present on the character (plus racial/domain/class-granted entries).
    return ['cleric', 'druid', 'wizard', 'artificer'].includes(cls);
  }

  function shortFeatLabel(name) {
    const raw = String(name || '').trim();
    if (!raw) return 'Feat';
    return raw.replace(/\s*\(.+\)\s*$/, '').trim() || raw;
  }

  function hasFeatByIdOrName(character, idOrName) {
    const target = String(idOrName || '').trim().toLowerCase();
    if (!target) return false;
    if (window.FeatRuntime?.hasFeat?.(character, target)) return true;
    const feats = Array.isArray(character?.feats) ? character.feats : [];
    return feats.some(f => {
      const id = String(f?.id || '').trim().toLowerCase();
      const key = String(f?.key || '').trim().toLowerCase();
      const name = String(f?.name || '').trim().toLowerCase();
      return id === target || key === target || name === target;
    });
  }

  let _srdSpellMeta = null; // Map<lowerName, { ritual:boolean, concentration:boolean, higherLevelSlot:string }>
  let _srdSpellCatalog = null; // Array<{name, level, classes, description, ...}>
  async function loadSrdSpellMeta() {
    if (_srdSpellMeta) return _srdSpellMeta;
    try {
      const root = (document.querySelector('meta[name="data-root"]')?.content?.trim()) || './data/';
      const res = await fetch(`${root.replace(/\/+$/, '')}/srd-5.2-spells.json`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const list = await res.json();
      const map = new Map();
      for (const s of (Array.isArray(list) ? list : [])) {
        if (!s?.name) continue;
        const key = String(s.name).toLowerCase();
        map.set(key, {
          ritual: s.ritual === true,
          concentration: s.concentration === true,
          higherLevelSlot: String(s.higherLevelSlot || '').trim(),
          castingTime: String(s.castingTime || s.casting_time || '').trim()
        });
      }
      _srdSpellMeta = map;
    } catch (_) {
      _srdSpellMeta = new Map();
    }
    return _srdSpellMeta;
  }

  async function loadSrdSpellCatalog() {
    if (_srdSpellCatalog) return _srdSpellCatalog;
    try {
      const root = (document.querySelector('meta[name="data-root"]')?.content?.trim()) || './data/';
      const res = await fetch(`${root.replace(/\/+$/, '')}/srd-5.2-spells.json`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const list = await res.json();
      _srdSpellCatalog = Array.isArray(list) ? list : [];
    } catch (_) {
      _srdSpellCatalog = [];
    }
    return _srdSpellCatalog;
  }

  // --- Racial/Subclass Spell Hooks ---
  function hasDevilsTongue(character) {
    return (character.traits || []).some(trait =>
      String(trait?.name || trait).toLowerCase().includes("devil's tongue")
    );
  }

  function racialSpells(character){
    const out = { cantrips:[], leveled:[] };
    const race = String(character?.race||'').toLowerCase();
    if (race.includes('tiefling')) {
      const hasDevilsTongueTrait = hasDevilsTongue(character);

      if (hasDevilsTongueTrait) {
        out.cantrips.push({ name: 'Vicious Mockery', level: 0, badge: 'Racial', locked: true, desc: "You know the Vicious Mockery cantrip.\n(Spellcasting ability: Charisma)" });
        if ((character.level || 1) >= 3) out.leveled.push({
          name: 'Charm Person',
          level: 1,
          badge: 'Racial',
          locked: true,
          desc: "You attempt to charm a humanoid you can see within range. It must make a Wisdom saving throw, and does so with advantage if you or your companions are fighting it. On a failed save, it is charmed by you until the spell ends or until you or your companions do anything harmful to it.\n\nAt Higher Levels: When you cast this spell using a spell slot of 2nd level or higher, you can target one additional humanoid for each slot level above 1st.\n\nDevil's Tongue: You cast Charm Person as a 2nd-level spell once per long rest, so this casting can target up to two humanoids.\n(Spellcasting ability: Charisma)"
        });
        if ((character.level || 1) >= 5) out.leveled.push({
          name: 'Enthrall',
          level: 2,
          badge: 'Racial',
          locked: true,
          desc: "You weave a distracting string of words, causing creatures of your choice that you can see within range and that can hear you to make a Wisdom saving throw. Any creature that can't be charmed succeeds on this saving throw automatically, and if you or your companions are fighting a creature, it has advantage on the save. On a failed save, the target has disadvantage on Wisdom (Perception) checks made to perceive any creature other than you until the spell ends or until the target can no longer hear you.\n\nDevil's Tongue: You can cast Enthrall once per long rest.\n(Spellcasting ability: Charisma)"
        });
      } else { // Default: Infernal Legacy
        out.cantrips.push({
          name: 'Thaumaturgy',
          level: 0,
          badge: 'Racial',
          locked: true,
          desc: "You manifest a minor wonder, a sign of supernatural power, within range. You create one of the following magical effects within range.\n\n• Your voice booms up to three times as loud as normal for 1 minute.\n\n• You cause flames to flicker, brighten, dim, or change color for 1 minute.\n\n• You cause harmless tremors in the ground for 1 minute.\n\n• You create an instantaneous sound that originates from a point of your choice within range, such as a rumble of thunder, the cry of a raven, or ominous whispers.\n\n• You instantaneously cause an unlocked door or window to fly open or slam shut.\n\n• You alter the appearance of your eyes for 1 minute.\n\nIf you cast this spell multiple times, you can have up to three of its 1-minute effects active at a time, and you can dismiss such an effect as an action.\n\n(Spellcasting ability: Charisma)"
        });
        if ((character.level || 1) >= 3) out.leveled.push({
          name: 'Hellish Rebuke',
          level: 1,
          badge: 'Racial',
          locked: true,
          desc: "The creature that damaged you is momentarily surrounded by green flames. It makes a Dexterity saving throw, taking 2d10 fire damage on a failed save or half as much damage on a successful one.\n\nInfernal Legacy: You cast this as a 2nd-level spell once per long rest (3d10 fire damage on a failed save, or half on a success).\n\nCast as a reaction when you take damage from a creature you can see within 60 feet.\n(Spellcasting ability: Charisma)"
        });
        if ((character.level || 1) >= 5) out.leveled.push({
          name: 'Darkness',
          level: 2,
          badge: 'Racial',
          locked: true,
          desc: "Magical darkness spreads from a point you choose within range to fill a 15-foot-radius sphere for the duration. The darkness spreads around corners. A creature with Darkvision can't see through this darkness, and nonmagical light can't illuminate it.\n\nIf the point you choose is on an object you are holding or one that isn't being worn or carried, the darkness emanates from the object and moves with it. Completely covering the source of the darkness with an opaque object, such as a bowl or a helm, blocks the darkness.\n\nIf any of this spell's area overlaps with an area of light created by a spell of level 2 or lower, the spell that created the light is dispelled.\n\nInfernal Legacy: You can cast Darkness once per long rest.\n(Spellcasting ability: Charisma)"
        });
      }
    }
    return out;
  }
  async function subclassAlwaysPrepared(character, masterIndex){ // Added masterIndex
    const out = [];
    const level = Number(character.level) || 1;
    const className = String(character.class || '').toLowerCase();
    const subclassName = String(character.build || '').toLowerCase();

    if (!subclassName) return [];

    const allSubclasses = await window.loadSubclassesLocal();
    const subclassData = allSubclasses.find(s => 
        String(s.name || '').toLowerCase() === subclassName &&
        String(s.class || '').toLowerCase() === className
    );

    if (subclassData && subclassData.alwaysPreparedSpells) {
        const badge = subclassData.name.split(' ').pop();
        for (const levelKey in subclassData.alwaysPreparedSpells) {
            if (level >= Number(levelKey)) {
                for (const spellName of subclassData.alwaysPreparedSpells[levelKey]) {
                    const spellData = masterIndex ? masterIndex.get(String(spellName).toLowerCase()) : null;
                    const spellLevel = spellData ? (Number(spellData.level) || 0) : 0;
                    out.push({ name: spellName, level: spellLevel, badge: badge, locked: true });
                }
            }
        }
    }
    return out;
  }

  function slotsFor(cls, level, character) {
    const C = String(cls || '').toLowerCase();
    const L = Number(level) || 1;
    const build = String(character?.build || '').toLowerCase();
    const progression = String(character?.spellcastingProgression || '').toLowerCase();

    const FULL_CASTER = {
      1: { 1: 2 }, 2: { 1: 3 }, 3: { 1: 4, 2: 2 }, 4: { 1: 4, 2: 3 }, 5: { 1: 4, 2: 3, 3: 2 },
      6: { 1: 4, 2: 3, 3: 3 }, 7: { 1: 4, 2: 3, 3: 3, 4: 1 }, 8: { 1: 4, 2: 3, 3: 3, 4: 2 },
      9: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 }, 10: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
      11: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 }, 12: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
      13: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 }, 14: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
      15: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 }, 16: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
      17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 }, 18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 },
      19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1 }, 20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 }
    };
    const HALF_CASTER = {
      1: {}, 2: { 1: 2 }, 3: { 1: 3 }, 4: { 1: 3 }, 5: { 1: 4, 2: 2 },
      6: { 1: 4, 2: 2 }, 7: { 1: 4, 2: 3 }, 8: { 1: 4, 2: 3 }, 9: { 1: 4, 2: 3, 3: 2 },
      10: { 1: 4, 2: 3, 3: 2 }, 11: { 1: 4, 2: 3, 3: 3 }, 12: { 1: 4, 2: 3, 3: 3 },
      13: { 1: 4, 2: 3, 3: 3, 4: 1 }, 14: { 1: 4, 2: 3, 3: 3, 4: 1 },
      15: { 1: 4, 2: 3, 3: 3, 4: 2 }, 16: { 1: 4, 2: 3, 3: 3, 4: 2 },
      17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 }, 18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
      19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 }, 20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 }
    };
    const ARTIFICER_CASTER = {
      1: { 1: 2 }, 2: { 1: 2 }, 3: { 1: 3 }, 4: { 1: 3 }, 5: { 1: 4, 2: 2 },
      6: { 1: 4, 2: 2 }, 7: { 1: 4, 2: 3 }, 8: { 1: 4, 2: 3 }, 9: { 1: 4, 2: 3, 3: 2 },
      10: { 1: 4, 2: 3, 3: 2 }, 11: { 1: 4, 2: 3, 3: 3 }, 12: { 1: 4, 2: 3, 3: 3 },
      13: { 1: 4, 2: 3, 3: 3, 4: 1 }, 14: { 1: 4, 2: 3, 3: 3, 4: 1 },
      15: { 1: 4, 2: 3, 3: 3, 4: 2 }, 16: { 1: 4, 2: 3, 3: 3, 4: 2 },
      17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 }, 18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
      19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 }, 20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 }
    };
    const THIRD_CASTER = {
      1: {}, 2: {}, 3: { 1: 2 }, 4: { 1: 3 }, 5: { 1: 3 }, 6: { 1: 3 }, 7: { 1: 4, 2: 2 },
      8: { 1: 4, 2: 2 }, 9: { 1: 4, 2: 2 }, 10: { 1: 4, 2: 3 }, 11: { 1: 4, 2: 3 },
      12: { 1: 4, 2: 3 }, 13: { 1: 4, 2: 3, 3: 2 }, 14: { 1: 4, 2: 3, 3: 2 },
      15: { 1: 4, 2: 3, 3: 2 }, 16: { 1: 4, 2: 3, 3: 3 }, 17: { 1: 4, 2: 3, 3: 3 },
      18: { 1: 4, 2: 3, 3: 3 }, 19: { 1: 4, 2: 3, 3: 3, 4: 1 }, 20: { 1: 4, 2: 3, 3: 3, 4: 1 }
    };
    if (['cleric', 'druid', 'wizard', 'bard', 'sorcerer'].includes(C)) return FULL_CASTER[L] || {};
    if (C === 'artificer') return ARTIFICER_CASTER[L] || {};
    if (['ranger', 'paladin'].includes(C)) return HALF_CASTER[L] || {};
    if (progression === 'third') return THIRD_CASTER[L] || {};
    if (C === 'rogue' && build.includes('arcane trickster')) return THIRD_CASTER[L] || {};
    if (C === 'fighter' && build.includes('eldritch knight')) return THIRD_CASTER[L] || {};
    return {};
  }

  // --- Class-specific Abilities (data-driven) ---
  async function classAbilities(character, masterIndex) {
    const out = [];
    const level = Number(character.level) || 1;
    const className = String(character.class || '').toLowerCase();
    const subclassName = String(character.build || '').toLowerCase();

    if (!className) return [];

    const [allClasses, allSubclasses] = await Promise.all([
      window.loadClassesLocal(),
      window.loadSubclassesLocal()
    ]);

    const classData = allClasses.find(c => String(c.name || '').toLowerCase() === className);
    const subclassData = allSubclasses.find(s => 
        String(s.name || '').toLowerCase() === subclassName &&
        String(s.class || '').toLowerCase() === className
    );

    const sources = [classData, subclassData];
    for (const source of sources) {
      if (!source) continue;

      if (source.bonusCantrips) {
        const sourceBadge = (source === subclassData) ? 'Subclass' : 'Class';
        for (const levelKey in source.bonusCantrips) {
          if (level >= Number(levelKey)) {
            for (const cantripName of source.bonusCantrips[levelKey]) {
              out.push({ name: cantripName, level: 0, badge: sourceBadge, locked: true });
            }
          }
        }
      }

      if (Array.isArray(source.actions)) {
        for (const action of source.actions) {
          if (!(action.level && level >= action.level)) continue;

          // Monks track core ki options on spells.html even though they are not spells.
          const isMonkKiAction = className === 'monk' && [
            'flurry of blows',
            'patient defense',
            'step of the wind',
            'shadow arts'
          ].includes(String(action.name || '').toLowerCase());
          if (isMonkKiAction) {
            out.push({ name: action.name, level: 0, badge: (action.badge || 'Ki'), locked: true, desc: action.desc });
          }
        }
      }
    }

    // Ranger optional feature: Primal Awareness replaces Primeval Awareness.
    // These spells are always known and do not count against spells known.
    const primalAwarenessSpells = getPrimalAwarenessSpells(character);
    if (primalAwarenessSpells.length) {
      for (const row of primalAwarenessSpells) {
        const idx = masterIndex ? masterIndex.get(String(row.name).toLowerCase()) : null;
        const spellLevel = idx ? (Number(idx.level) || row.level) : row.level;
        out.push({
          name: row.name,
          level: spellLevel,
          badge: 'Class',
          locked: true
        });
      }
    }

    return out;
  }

  // --- Build Model ---
  async function buildModel(character){
    // --- FIX: Ensure DDData has the infusion loader from storage.js ---
    if (window.DDData && typeof window.DDData.loadInfusions !== 'function' && typeof window.loadInfusions === 'function') {
      window.DDData.loadInfusions = window.loadInfusions;
    }

    const [allSpellsList, allInfusionsList, srdSpellMeta, srdSpellCatalog] = await Promise.all([
      DDData.loadAllSpells(),
      typeof DDData.loadInfusions === 'function' ? DDData.loadInfusions() : Promise.resolve([]),
      loadSrdSpellMeta(),
      loadSrdSpellCatalog()
    ]);

    const masterIndex = new Map();
    for (const s of (Array.isArray(allSpellsList) ? allSpellsList : Object.values(allSpellsList))) {
      if (s && s.name) masterIndex.set(String(s.name).toLowerCase(), s);
    }
    // Also index infusions by name for easy lookup
    for (const i of (Array.isArray(allInfusionsList) ? allInfusionsList : Object.values(allInfusionsList))) {
      if (i && i.name) masterIndex.set(String(i.name).toLowerCase(), i);
    }

    const allInfusions = (allInfusionsList || []).map(inf => masterIndex.get(String(inf.name).toLowerCase())).filter(Boolean);
    const cls = String(character.class||'');
    const level = Number(character.level)||1;
    const stats = window.DDRules.computeSpellStats(character) || { ab:null, dc:'—', atk:'—' };
    const explicitSpellSources = Object.fromEntries(
      Object.entries(character?.spellSources || {}).map(([k, v]) => [String(k || '').toLowerCase(), String(v || '').trim()])
    );
    const featSpellResourcesBySpell = new Map();
    const featResources = Array.isArray(character?.resources) ? character.resources : [];
    for (const res of featResources) {
      const resUses = Number(res?.uses || 0);
      if (!Number.isFinite(resUses) || resUses <= 0) continue;
      const resKey = `featRes:${String(res?.id || res?.name || '').toLowerCase()}`;
      const consumes = Array.isArray(res?.consumes) ? res.consumes : [];
      for (const c of consumes) {
        const spellName = String(c?.spell || '').trim();
        if (!spellName) continue;
        const perSpellUses = Number(c?.uses || resUses || 1) || 1;
        const key = spellName.toLowerCase();
        const arr = featSpellResourcesBySpell.get(key) || [];
        arr.push({
          resKey,
          uses: perSpellUses,
          label: shortFeatLabel(res?.name || 'Feat')
        });
        featSpellResourcesBySpell.set(key, arr);
      }
    }
    const spellAbilityOverrides = Object.fromEntries(
      Object.entries(character?.spellCastingAbilityOverrides || {}).map(([k, v]) => [String(k || '').toLowerCase(), String(v || '').trim().toUpperCase()])
    );
    const baseKnown = Array.isArray(character.spells) ? character.spells.slice() : [];
    const racial = racialSpells(character, masterIndex);
    const always = await subclassAlwaysPrepared(character, masterIndex);
    const classAbils = await classAbilities(character, masterIndex);
    const primalAwarenessRows = getPrimalAwarenessSpells(character);
    const primalAwarenessSpells = new Set(primalAwarenessRows.map(r => String(r?.name || '').toLowerCase()).filter(Boolean));
    const feyReinforcementRows = getFeyReinforcementsSpells(character);
    const feyReinforcementSpells = new Set(feyReinforcementRows.map(r => String(r?.name || '').toLowerCase()).filter(Boolean));
    const mistyWandererSpells = new Set(hasMistyWanderer(character) ? ['misty step'] : []);
    const devilsTongueSpells = new Set();
    const infernalLegacyRebukeSpells = new Set();
    if (String(character?.race || '').toLowerCase().includes('tiefling') && hasDevilsTongue(character) && (Number(character?.level || 1) >= 3)) {
      devilsTongueSpells.add('charm person');
    }
    if (
      String(character?.race || '').toLowerCase().includes('tiefling') &&
      !hasDevilsTongue(character) &&
      (Number(character?.level || 1) >= 3)
    ) {
      infernalLegacyRebukeSpells.add('hellish rebuke');
    }
    const allEntries = [];
    for (const n of baseKnown) {
      const idx = masterIndex.get(String(n).toLowerCase());
      const lvl = (idx && typeof idx==='object' && Number.isInteger(idx.level)) ? idx.level : 1;
      const srcBadge = explicitSpellSources[String(n).toLowerCase()] || null;
      const fromFeyTouched = String(srcBadge || '').toLowerCase().includes('fey touched');
      allEntries.push({ name:n, level:lvl, badge:(srcBadge || 'Class'), locked:fromFeyTouched });
    }
    allEntries.push(...racial.cantrips, ...racial.leveled, ...always, ...classAbils);
    const hasTelekineticFeat = hasFeatByIdOrName(character, 'feat:telekinetic') || hasFeatByIdOrName(character, 'telekinetic');
    if (hasTelekineticFeat) {
      const mageHandEntries = allEntries.filter(s => String(s?.name || '').toLowerCase() === 'mage hand');
      if (mageHandEntries.length) {
        // Already known: annotate for tooltip/range upgrade messaging.
        for (const row of mageHandEntries) {
          row.telekineticGranted = true;
          row.telekineticRangeBoost = true;
        }
      } else {
        // Not known: feat grants the cantrip.
        allEntries.push({
          name: 'Mage Hand',
          level: 0,
          badge: 'Feat',
          locked: true,
          telekineticGranted: true,
          telekineticRangeBoost: false
        });
      }
    }
    if (feyReinforcementRows.length) {
      for (const row of feyReinforcementRows) {
        const idx = masterIndex.get(String(row.name).toLowerCase());
        const spellLevel = idx ? (Number(idx.level) || row.level) : row.level;
        allEntries.push({
          name: row.name,
          level: spellLevel,
          badge: 'Subclass',
          locked: true
        });
      }
    }

    // For prepared/known casters, fetch their entire class list for preparation/selection.
    const lowerCls = cls.toLowerCase();
    const preparedCasters = ['cleric', 'druid', 'paladin', 'wizard', 'artificer'];
    const knownCastersWithChoice = ['ranger', 'bard', 'sorcerer'];
    const build = String(character.build || '').toLowerCase();
    const isArcaneTrickster = lowerCls === 'rogue' && build.includes('arcane trickster');
    const isEldritchKnight = lowerCls === 'fighter' && build.includes('eldritch knight');
    let dynamic = [];
    const artificerSpellNames = new Set();

    if (preparedCasters.includes(lowerCls) || knownCastersWithChoice.includes(lowerCls) || isArcaneTrickster || isEldritchKnight) {
      const upTo = Math.min(9, window.DDRules.getMaxSpellLevelFor(character));
      const listClass = (isArcaneTrickster || isEldritchKnight) ? 'wizard' : cls;
      // Local-first for all classes so we include non-SRD spells from data/spells.json.
      const classSpells = await DDData.getSpellsForClassLevel(listClass, 0, upTo, { character });
      const localDynamic = Array.isArray(classSpells)
        ? classSpells
            .filter(s => !(Number(s?.level) === 0 && shouldHideDynamicCantrip(character, lowerCls)))
            .map(s => ({ name: s.name, level: Number(s.level) || 0, badge: 'Class', locked: false }))
        : [];
      const srdDynamic = (Array.isArray(srdSpellCatalog) ? srdSpellCatalog : [])
        .filter(s => Array.isArray(s?.classes) && s.classes.map(c => String(c || '').toLowerCase()).includes(String(listClass || '').toLowerCase()))
        .filter(s => (Number(s?.level) || 0) <= upTo)
        .filter(s => !(Number(s?.level) === 0 && shouldHideDynamicCantrip(character, lowerCls)))
        .map(s => ({ name: s.name, level: Number(s.level) || 0, badge: 'Class', locked: false }));
      if (localDynamic.length || srdDynamic.length) {
        dynamic = localDynamic.concat(srdDynamic);
      } else {
        // Fallback for legacy/empty local datasets.
        const viaAPI = await DDData.getClassSpellList(listClass).catch(() => []); // Gracefully handle API failure
        dynamic = viaAPI
          .filter(s => s.level <= upTo)
          .filter(s => !(Number(s?.level) === 0 && shouldHideDynamicCantrip(character, lowerCls)))
          .map(s => ({ name: s.name, level: s.level, badge:'Class', locked:false }));
      }
    }
    // Build a reusable artificer spell-name set for Arcane Firearm eligibility checks.
    try {
      const artLocal = await DDData.getSpellsForClassLevel('artificer', 0, 9, { character });
      for (const s of (Array.isArray(artLocal) ? artLocal : [])) {
        const n = String(s?.name || '').trim().toLowerCase();
        if (n) artificerSpellNames.add(n);
      }
    } catch (_) { /* no-op */ }
    for (const s of (Array.isArray(srdSpellCatalog) ? srdSpellCatalog : [])) {
      const classes = Array.isArray(s?.classes) ? s.classes.map(c => String(c || '').toLowerCase()) : [];
      if (!classes.includes('artificer')) continue;
      const n = String(s?.name || '').trim().toLowerCase();
      if (n) artificerSpellNames.add(n);
    }
    allEntries.push(...dynamic);
    const map = new Map();
    for (const s of allEntries){
      const k = `${s.level}|${s.name.toLowerCase()}`;
      if (!map.has(k)) map.set(k, s);
      else {
        const prev = map.get(k);
        map.set(k, {
          ...prev,
          locked: (prev.locked || s.locked),
          badge: prev.badge || s.badge,
          telekineticGranted: !!(prev.telekineticGranted || s.telekineticGranted),
          telekineticRangeBoost: !!(prev.telekineticRangeBoost || s.telekineticRangeBoost)
        });
      }
    }
    const byLevel = Array.from({length:10},()=>[]);
    for (const s of map.values()) if (s.level>=0 && s.level<=9) byLevel[s.level].push(s);
    // Apply explicit source badges last so per-character overrides win.
    for (const levelList of byLevel) {
      for (const s of levelList) {
        const forced = explicitSpellSources[String(s.name || '').toLowerCase()];
        if (forced) s.badge = forced;
      }
    }
    const slots = slotsFor(cls, level, character);
    const caster = String(cls).toLowerCase();
    let prepLimit = 0;
    let knownLimit = 0;

    if (caster==='cleric' || caster==='druid' || caster==='wizard') {
        prepLimit = Math.max(1, stats.mod + level);
    } else if (caster==='artificer') {
        prepLimit = Math.max(1, stats.mod + Math.floor(level/2));
    } else if (caster==='ranger') {
        knownLimit = rangerSpellsKnown(level);
    } else if (isArcaneTrickster) {
        knownLimit = arcaneTricksterSpellsKnown(level);
    }
    const hasKi = (caster==='monk');
    const kiMax = hasKi ? level : 0;
    const hasWildShape = (caster==='druid' && level >= 2);
    const isArchdruid = (caster === 'druid' && level >= 20);
    const wildMaxRaw = hasWildShape
      ? (isArchdruid ? 0 : (window.WildShapeUI?.getMaxUses ? window.WildShapeUI.getMaxUses(character) : 2))
      : 0;
    const wildMax = Number.isFinite(wildMaxRaw) ? Math.max(0, Number(wildMaxRaw)) : 0;
    const hasSymbioticEntity = (wildMax > 0) && String(character?.build || '').toLowerCase().includes('circle of spores');
    const hasChannelDivinity = (caster==='cleric' || caster==='paladin');
    let cdMax = 0;
    if (hasChannelDivinity && level >= 2) { cdMax = (level >= 18) ? 3 : (level >= 6 ? 2 : 1); }
    const hasSpellStoringItem = hasSpellStoringItemFeature(character);
    const hasArcaneFirearm = hasArcaneFirearmFeature(character);
    const spellStoringUsesMax = hasSpellStoringItem ? spellStoringMaxUses(character) : 0;
    return { character, cls, level, abilKey: stats.ab, dc: stats.dc, atk: stats.atk, masterIndex, allInfusions, byLevel, slots, prepLimit, knownLimit, hasKi, kiMax, hasWildShape, wildMax, hasSymbioticEntity, hasChannelDivinity, cdMax, spellAbilityOverrides, srdSpellMeta, featSpellResourcesBySpell, primalAwarenessSpells, feyReinforcementSpells, mistyWandererSpells, devilsTongueSpells, infernalLegacyRebukeSpells, artificerSpellNames, hasSpellStoringItem, hasArcaneFirearm, spellStoringUsesMax, hasTelekineticFeat };
  }
  
  // --- Renderers ---
  async function renderSpellcastingNumbers(character){
   const atkEl = F.scAtk ? F.scAtk() : document.querySelector('#field-spell-attack');
    const dcEl  = document.querySelector('#field-spell-dc');
    if (!atkEl || !dcEl) return;
    const stats = window.DDRules.computeSpellStats(character);
    if (!stats){ atkEl.textContent = '—'; dcEl.textContent = '—'; return; }
    const sign = n => (n>=0?`+${n}`:`${n}`);
    atkEl.textContent = sign(stats.atk);
    dcEl.textContent  = String(stats.dc);
    atkEl.setAttribute('data-tooltip', `Spell Attack = PB ${sign(stats.pb)} + ${stats.ab} mod ${sign(stats.mod)}`);
    dcEl.setAttribute('data-tooltip',  `Spell Save DC = 8 + PB ${sign(stats.pb)} + ${stats.ab} mod ${sign(stats.mod)}`);
  }
  function paintHeader(model){
    window.autoFit(F.klass(), model.cls);
    window.autoFit(F.level(), String(model.level));
    if (window.NameCurves?.renderTwoArcName) {
      const F_name = {
        nameBox:        F.nameBox,
        nameTop:        () => document.getElementById('name-top'),
        nameBot:        () => document.getElementById('name-bottom'),
        nameTopTP:      () => document.getElementById('name-top-tp'),
        nameBotTP:      () => document.getElementById('name-bottom-tp'),
        nameTopPath:    () => document.getElementById('name-curve-top'),
        nameBottomPath: () => document.getElementById('name-curve-bottom'),
      };
      window.NameCurves.renderTwoArcName(F_name, model.character.name || '');
    }
    const abilWord = window.DDRules.abilityFullName(model.abilKey);
    F.abilityTP().textContent = abilWord || '';
    if (model.prepLimit > 0 || model.knownLimit > 0){
      F.scPrepBox().classList.remove('hidden');
      const state = window.readSpellState(model.character);
      const prepared = ST.getPrepared(state);
      const totalPrepared = getRelevantSelectionCount(model, prepared);
      
      const limit = model.prepLimit > 0 ? model.prepLimit : model.knownLimit;
      const label = model.prepLimit > 0 ? 'Prepared' : 'Known';
      F.scPrepBox().title = `Daily ${label} spells (excludes always-prepared)`;
      F.scPrepBox().innerHTML = `⭐ <span id="prep-count">${totalPrepared}</span>/<span id="prep-limit">${limit}</span> ${label}`;

      const lvl6Title = F.lvlBox(6)?.querySelector('.title');
      const lvl7Title = F.lvlBox(7)?.querySelector('.title');
      const lvl8Title = F.lvlBox(8)?.querySelector('.title');
      const lvl9Title = F.lvlBox(9)?.querySelector('.title');
      if (model.cls.toLowerCase() === 'artificer') {
        const infusionLimit = model.character?.infusions?.known_limit || 0;
        const activeLimit = model.character?.infusions?.active_limit || 0;
        if (lvl6Title) {
          lvl6Title.classList.add('infusion-header');
          lvl6Title.textContent = `Known Infusions (${infusionLimit})`;
          lvl6Title.innerHTML = `Known Infusions (${infusionLimit}) <button id="manage-infusions-btn" title="Manage Known Infusions">⚙️</button>`;
          const btn = lvl6Title.querySelector('#manage-infusions-btn');
          if (btn) {
            btn.onclick = () => showInfusionManager(model);
          }
        }
        if (lvl7Title) {
          lvl7Title.classList.add('infusion-header');
          lvl7Title.textContent = `Active Infusions (${activeLimit})`;
        }
        if (lvl8Title) {
          lvl8Title.classList.remove('infusion-header');
          lvl8Title.textContent = '8th-level';
        }
        if (lvl9Title) {
          lvl9Title.classList.remove('infusion-header');
          lvl9Title.textContent = '9th-level';
        }
      } else {
        if (lvl6Title) {
          lvl6Title.classList.remove('infusion-header');
          lvl6Title.textContent = '6th-level';
        }
        if (lvl7Title) {
          lvl7Title.classList.remove('infusion-header');
          lvl7Title.textContent = '7th-level';
        }
        if (lvl8Title) {
          lvl8Title.classList.remove('infusion-header');
          lvl8Title.textContent = '8th-level';
        }
        if (lvl9Title) {
          lvl9Title.classList.remove('infusion-header');
          lvl9Title.textContent = '9th-level';
        }
      }
    
    } else {
      F.scPrepBox().classList.add('hidden');
    }
  }
  function clearLists(){
    for(let L=0; L<=9; L++){
      const box = F.lvlBox(L);
      if (!box) continue;
      const list = box.querySelector('.list');
      if (list) list.innerHTML = '';
      const p = box.querySelector('.slot-dots');
      if (p) p.innerHTML = '';
    }
  }
  function knowsHomunculusInfusion(character, spellState) {
    if (!character) return false;
    if (window.characterKnowsHomunculusServant) return !!window.characterKnowsHomunculusServant(character);
    const knownFromChar = Array.isArray(character?.infusions?.known) ? character.infusions.known : [];
    const knownFromState = Array.isArray(spellState?.knownInfusions) ? spellState.knownInfusions : [];
    return knownFromChar.concat(knownFromState).some(n => String(n || '').trim().toLowerCase() === 'homunculus servant');
  }

  function renderHomunculusCompanionRow(model, listEl, opts = {}) {
    if (!listEl) return;
    const character = model.character;
    const state = (window.getHomunculusServantState && window.getHomunculusServantState(character)) || {};
    const stats = (window.getHomunculusServantStats && window.getHomunculusServantStats(character, state)) || null;
    if (!stats) return;
    const hpText = `${Number(stats.currentHP)}/${Number(stats.maxHP)}`;
    const isActive = !!state.active;
    const activeLimit = Math.max(0, Number(opts?.activeInfusionLimit ?? model.character?.infusions?.active_limit ?? 0));
    const baseActiveCount = Math.max(0, Number(opts?.activeInfusionCount ?? 0));
    const activeWithHomunculus = baseActiveCount + (isActive ? 1 : 0);
    const atCapacityForNew = !isActive && activeWithHomunculus >= activeLimit;
    const summonLabel = isActive ? 'Summoned' : 'Summon';
    const tooltip = [
      'Homunculus Servant',
      '',
      'Companion created by your infusion.',
      `AC ${stats.ac}; HP ${hpText}; Speed ${stats.speed}.`,
      `Force Strike: +${stats.attackBonus} to hit, 1d4 + ${stats.pb} force.`,
      '',
      'Can move and use reactions on its own.',
      'Needs your bonus action command to take actions (otherwise Dodge).'
    ].join('\n');
    const toSigned = (n) => (Number(n) >= 0 ? `+${Number(n)}` : `${Number(n)}`);
    const passivePerception = 10 + (Number(stats.pb) * 2);
    const levelLabel = (lvl) => (Number(lvl) === 0 ? 'Cantrip' : `Level ${Number(lvl)}`);
    const escapeHtml = (v) => String(v || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    const channelMagicSpells = (() => {
      const spellState = window.readSpellState ? (window.readSpellState(character) || {}) : {};
      const preparedByLevel = ST.getPrepared(spellState) || {};
      const out = [];
      const seen = new Set();
      for (const [lvlRaw, arr] of Object.entries(preparedByLevel)) {
        if (!Array.isArray(arr)) continue;
        const preparedLevel = Number(lvlRaw) || 0;
        for (const spellName of arr) {
          const name = String(spellName || '').trim();
          if (!name) continue;
          const key = name.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          const idx = model.masterIndex?.get(key) || null;
          const rangeText = String(idx?.range || idx?.range_raw || '').trim().toLowerCase();
          const isTouch = /\btouch\b/.test(rangeText);
          const isArtificerSpell = !!model.artificerSpellNames?.has(key)
            || (Array.isArray(idx?.classes) && idx.classes.some(c => String(c || '').toLowerCase() === 'artificer'));
          if (!isTouch || !isArtificerSpell) continue;
          out.push({
            name: String(idx?.name || name),
            level: Number(idx?.level ?? preparedLevel) || 0
          });
        }
      }
      out.sort((a, b) => (Number(a.level) - Number(b.level)) || String(a.name).localeCompare(String(b.name)));
      return out;
    })();
    const channelMagicListText = channelMagicSpells.length
      ? channelMagicSpells.map(s => `${s.name} (${levelLabel(s.level)})`).join(', ')
      : 'No prepared touch-range artificer spells found.';
    const channelMagicListHtml = channelMagicSpells.length
      ? `<ul class="hs-channel-list">${channelMagicSpells.map(s => `<li>${escapeHtml(s.name)} <span class="hs-channel-level">(${escapeHtml(levelLabel(s.level))})</span></li>`).join('')}</ul>`
      : '<div class="hs-channel-empty">No prepared touch-range artificer spells found.</div>';
    const detailTooltip = [
      'Homunculus Servant',
      '',
      'Tiny construct',
      `Armor Class ${stats.ac} (natural armor)`,
      `Hit Points ${stats.maxHP} (1 + INT mod + artificer level)`,
      `Speed ${stats.speed}`,
      '',
      `STR 4 (${toSigned(-3)})  DEX 15 (${toSigned(2)})  CON 12 (${toSigned(1)})`,
      `INT 10 (${toSigned(0)})  WIS 10 (${toSigned(0)})  CHA 7 (${toSigned(-2)})`,
      '',
      `Saving Throws DEX ${toSigned(2 + Number(stats.pb))}`,
      `Skills Perception ${toSigned(Number(stats.pb) * 2)}, Stealth ${toSigned(2 + Number(stats.pb))}`,
      'Damage Immunities poison',
      'Condition Immunities exhaustion, poisoned',
      `Senses darkvision 60 ft., passive Perception ${passivePerception}`,
      'Languages understands the languages you speak',
      'Challenge Proficiency Bonus (PB) equals your bonus',
      '',
      'Evasion: If subjected to an effect that allows a DEX save for half damage, it takes no damage on a success, half on a failure.',
      '',
      `Force Strike: Ranged Weapon Attack +${stats.attackBonus} to hit, range 30 ft., one target. Hit: ${stats.forceStrike} force damage.`,
      'Channel Magic (Reaction): Delivers a touch spell you cast, within 120 feet.',
      '',
      `Prepared touch artificer spells: ${channelMagicListText}`
    ].join('\n');

    const showHomunculusDetailsModal = () => {
      const old = document.getElementById('hs-details-overlay');
      if (old) old.remove();
      const overlay = document.createElement('div');
      overlay.id = 'hs-details-overlay';
      overlay.className = 'hs-overlay';
      const modal = document.createElement('div');
      modal.className = 'hs-details-modal';
      modal.innerHTML = `
        <div class="hs-head">Homunculus Servant</div>
        <div class="hs-subhead">Tiny construct</div>
        <div class="hs-rule"></div>
        <div class="hs-lines">
          <div><strong>Armor Class</strong> ${stats.ac} (natural armor)</div>
          <div><strong>Hit Points</strong> ${stats.maxHP} (1 + INT mod + artificer level)</div>
          <div><strong>Speed</strong> ${stats.speed}</div>
        </div>
        <div class="hs-rule"></div>
        <div class="hs-abilities">
          <div><strong>STR</strong><span>4 (${toSigned(-3)})</span></div>
          <div><strong>DEX</strong><span>15 (${toSigned(2)})</span></div>
          <div><strong>CON</strong><span>12 (${toSigned(1)})</span></div>
          <div><strong>INT</strong><span>10 (${toSigned(0)})</span></div>
          <div><strong>WIS</strong><span>10 (${toSigned(0)})</span></div>
          <div><strong>CHA</strong><span>7 (${toSigned(-2)})</span></div>
        </div>
        <div class="hs-rule"></div>
        <div class="hs-lines hs-secondary">
          <div><strong>Saving Throws</strong> DEX ${toSigned(2 + Number(stats.pb))}</div>
          <div><strong>Skills</strong> Perception ${toSigned(Number(stats.pb) * 2)}, Stealth ${toSigned(2 + Number(stats.pb))}</div>
          <div><strong>Damage Immunities</strong> poison</div>
          <div><strong>Condition Immunities</strong> exhaustion, poisoned</div>
          <div><strong>Senses</strong> darkvision 60 ft., passive Perception ${passivePerception}</div>
          <div><strong>Languages</strong> understands the languages you speak</div>
          <div><strong>Challenge</strong> Proficiency Bonus (PB) equals your bonus</div>
        </div>
        <div class="hs-rule"></div>
        <div class="hs-section">Traits</div>
        <div class="hs-lines">
          <div><strong>Evasion.</strong> If subjected to an effect that allows a Dexterity saving throw to take only half damage, it instead takes no damage on a success and only half damage on a failure.</div>
        </div>
        <div class="hs-section">Actions</div>
        <div class="hs-lines">
          <div><strong>Force Strike.</strong> Ranged Weapon Attack: +${stats.attackBonus} to hit, range 30 ft., one target. Hit: ${stats.forceStrike} force damage.</div>
        </div>
        <div class="hs-section">Reactions</div>
        <div class="hs-lines">
          <div><strong>Channel Magic.</strong> The homunculus delivers a spell you cast that has a range of touch. The homunculus must be within 120 feet of you.</div>
          <div><strong>Prepared touch artificer spells:</strong>${channelMagicListHtml}</div>
        </div>
        <div class="hs-actions">
          <button class="hs-close-btn" type="button">Close</button>
        </div>
      `;
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      const close = () => overlay.remove();
      overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
      modal.querySelector('.hs-close-btn')?.addEventListener('click', close);
    };

    listEl.innerHTML = `
      <div class="Item tooltip homunculus-row" data-tooltip="${tooltip}">
        <div class="star hs-icon">HS</div>
        <div class="name hs-name" data-tooltip="${detailTooltip}">${state.name || `${character.name}'s Homunculus`}</div>
        <div class="hs-controls">
          <span class="badge">HP ${hpText}</span>
          <span class="badge">${isActive ? 'active' : 'inactive'}</span>
          <span class="badge">slots ${Math.min(activeWithHomunculus, activeLimit)}/${activeLimit}</span>
          <button class="hs-btn" data-hs-action="toggle">${summonLabel}</button>
          <button class="hs-btn" data-hs-action="send">Deploy</button>
        </div>
      </div>
    `;
    const nameEl = listEl.querySelector('.hs-name');
    if (nameEl) {
      nameEl.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        showHomunculusDetailsModal();
      });
    }
    const toggleBtn = listEl.querySelector('[data-hs-action="toggle"]');
    const sendBtn = listEl.querySelector('[data-hs-action="send"]');
    if (isActive && toggleBtn) {
      toggleBtn.classList.add('disabled');
      toggleBtn.title = 'Already summoned. Deactivate the Homunculus Servant infusion to dismiss it.';
    }
    if (atCapacityForNew) {
      if (toggleBtn) {
        toggleBtn.classList.add('disabled');
        toggleBtn.title = `No active infusion slots available (${activeWithHomunculus}/${activeLimit}).`;
      }
      if (sendBtn) {
        sendBtn.classList.add('disabled');
        sendBtn.title = `No active infusion slots available (${activeWithHomunculus}/${activeLimit}).`;
      }
    }
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (isActive) {
          if (F.status()) {
            F.status().textContent = 'Already summoned. Deactivate the Homunculus Servant infusion to dismiss it.';
            setTimeout(() => { if (F.status()?.textContent.startsWith('Already summoned.')) F.status().textContent = ''; }, 2200);
          }
          return;
        }
        if (atCapacityForNew) {
          if (F.status()) {
            F.status().textContent = `No active infusion slots available (${activeWithHomunculus}/${activeLimit}).`;
            setTimeout(() => { if (F.status()?.textContent.startsWith('No active infusion slots available')) F.status().textContent = ''; }, 2000);
          }
          return;
        }
        const curr = (window.getHomunculusServantState && window.getHomunculusServantState(character)) || state;
        const next = {
          ...curr,
          active: true
        };
        if (!Number.isFinite(Number(next.currentHP)) || Number(next.currentHP) <= 0) {
          next.currentHP = Number(stats.maxHP);
        }
        if (window.writeHomunculusServantState) window.writeHomunculusServantState(character, next);
        const msg = 'Homunculus summoned/active.';
        if (F.status()) {
          F.status().textContent = msg;
          setTimeout(() => { if (F.status()?.textContent === msg) F.status().textContent = ''; }, 1600);
        }
        paintLevels(model);
      });
    }
    if (sendBtn) {
      sendBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (atCapacityForNew) {
          if (F.status()) {
            F.status().textContent = `No active infusion slots available (${activeWithHomunculus}/${activeLimit}).`;
            setTimeout(() => { if (F.status()?.textContent.startsWith('No active infusion slots available')) F.status().textContent = ''; }, 2000);
          }
          return;
        }
        const curr = (window.getHomunculusServantState && window.getHomunculusServantState(character)) || state;
        const normalized = {
          ...curr,
          active: true,
          currentHP: Number.isFinite(Number(curr.currentHP)) && Number(curr.currentHP) > 0 ? Number(curr.currentHP) : Number(stats.maxHP)
        };
        if (window.writeHomunculusServantState) window.writeHomunculusServantState(character, normalized);
        if (window.queueEncounterPendingSummon) {
          window.queueEncounterPendingSummon({
            ownerName: String(character?.name || ''),
            summonType: 'homunculus_servant',
            name: normalized.name || `${character.name}'s Homunculus`
          });
        }
        if (F.status()) {
          F.status().textContent = 'Homunculus deployed to encounter queue.';
          setTimeout(() => { if (F.status()?.textContent === 'Homunculus deployed to encounter queue.') F.status().textContent = ''; }, 1800);
        }
        paintLevels(model);
      });
    }
  }

  function getRelevantSelectionCount(model, prepared){
    if (!model || !prepared || typeof prepared !== 'object') return 0;
    const available = new Set();
    for (let L = 1; L <= 9; L++) {
      const rows = Array.isArray(model.byLevel?.[L]) ? model.byLevel[L] : [];
      for (const s of rows) {
        const key = String(s?.name || '').toLowerCase();
        if (key) available.add(key);
      }
    }
    let count = 0;
    for (const [lvl, arr] of Object.entries(prepared)) {
      if (Number(lvl) <= 0) continue;
      if (!Array.isArray(arr)) continue;
      for (const name of arr) {
        if (available.has(String(name || '').toLowerCase())) count += 1;
      }
    }
    return count;
  }
  function paintLevels(model){
    console.log('DEBUG: model object passed to paintLevels:', model);
    const state = window.readSpellState(model.character);
    const prepared = ST.getPrepared(state);
    const actionState = window.readActionState ? (window.readActionState(model.character) || {}) : {};
    const totalPrepared = getRelevantSelectionCount(model, prepared);
    const atPreparedCap = model.prepLimit > 0 && totalPrepared >= model.prepLimit;
    const atKnownCap = model.knownLimit > 0 && totalPrepared >= model.knownLimit;
    const atSelectionCap = atPreparedCap || atKnownCap;
    const activeInfusions = window.readAllActiveInfusions();
    const artificerName = String(model.character?.name || '');
    const isCurrentArtificerInfusion = (inf) => {
      if (!inf) return false;
      const infuser = String(inf.infuser || inf.source || inf.artificer || '').trim();
      if (infuser) return infuser === artificerName;
      // Legacy fallback: older records may not store infuser; assume self-owned.
      return String(inf.owner || '').trim() === artificerName;
    };
    const activeForCurrent = activeInfusions.filter(isCurrentArtificerInfusion);
    const infusionLimits = model.character?.infusions || { active_limit: 0 };
    const spent = ST.getSlotsSpent(state);
    const activeConcentration = ST.getConcentrationSpell(state).toLowerCase();
    const spellStoringRaw = model.hasSpellStoringItem ? ST.getSpellStoringItem(state) : null;
    const spellStoringMax = Math.max(0, Number(model.spellStoringUsesMax || 0));
    const spellStoring = spellStoringRaw ? {
      ...spellStoringRaw,
      spellName: String(spellStoringRaw?.spellName || '').trim(),
      usesSpent: Math.max(0, Math.min(spellStoringMax || Math.max(0, Number(spellStoringRaw?.maxUses || 0)), Number(spellStoringRaw?.usesSpent || 0) || 0)),
      maxUses: spellStoringMax || Math.max(0, Number(spellStoringRaw?.maxUses || 0)),
      itemName: String(spellStoringRaw?.itemName || '').trim()
    } : null;
    const storedSpellLower = String(spellStoring?.spellName || '').toLowerCase();
    if (model.prepLimit>0){
      F.scPrepCount().textContent = String(totalPrepared);
    }
    for(let L=0; L<=9; L++){
      const box = F.lvlBox(L);
      if (!box) continue;
      box.style.display = '';
      const list = box.querySelector('.list');
      if (!list) continue;

      // --- Artificer Infusions Logic ---
      if (model.cls.toLowerCase() === 'artificer' && L >= 6) {
        box.style.display = ''; // Make sure it's visible
        const slotsEl = box.querySelector('.slots');
        if (slotsEl) slotsEl.style.display = 'none'; // Hide spell slots UI
        const knowsHomunculus = knowsHomunculusInfusion(model.character, state);

        if (L === 6) { // Use Level 6 box for "Known Infusions"
          const knownFromState = ST.getKnownInfusions(state);
          const known = Array.isArray(knownFromState) ? knownFromState : (model.character?.infusions?.known || []);
          

          list.innerHTML = ''; // Clear before appending
          known.sort().forEach(name => {
            const infusion = model.masterIndex.get(name.toLowerCase());
            const desc = infusion?.desc || 'Infusion details not found.';
            const activeInstance = activeForCurrent.find(inf => inf.name === name);

            const el = document.createElement('div');
            el.className = 'Item tooltip infusion-known' + (activeInstance ? ' active' : '');
            el.setAttribute('data-tooltip', desc);
            el.innerHTML = `<div class="star">${activeInstance ? '✅' : '⚙️'}</div><div class="name">${name}</div>`;
            
            el.addEventListener('click', () => {
              const currentActive = window.readAllActiveInfusions();
              const activeIndex = currentActive.findIndex(inf => inf.name === name && isCurrentArtificerInfusion(inf));

              if (activeIndex > -1) { // It's active, so deactivate it
                currentActive.splice(activeIndex, 1);
                window.writeAllActiveInfusions(currentActive);
                paintLevels(model); // Re-render
              } else { // It's not active, so try to activate it
                showInfusionTargeter(infusion, model, character => paintLevels(model));
              }
            });
            list.appendChild(el);
          });
        } else if (L === 7) { // Use Level 7 box for "Active Infusions"
          list.innerHTML = activeForCurrent.sort((a, b) => a.name.localeCompare(b.name)).map(inf => {
            const infusionData = model.masterIndex.get(inf.name.toLowerCase());
            const desc = infusionData?.desc || 'Infusion details not found.';
              const extra = (String(inf?.name || '').toLowerCase() === 'resistant armor' && inf?.resistType)
                ? ` <span class="infusion-target">(${String(inf.resistType)})</span>`
                : '';
              return `<div class="Item tooltip infusion-active" data-tooltip="${desc}">
                          <div class="star">✅</div>
                          <div class="name">${inf.name}${extra} <span class="infusion-target">on ${inf.item} (${inf.owner || '?'})</span></div>
                      </div>`;
          }).join('');
          if (activeForCurrent.length === 0) {
            list.innerHTML = '<div style="opacity:0.5; text-align:center; padding-top:20px;">(Click a known infusion to activate)</div>';
          }
        } else if (L === 8) { // Companion panel slot
          const titleEl = box.querySelector('.title');
          if (titleEl) {
            titleEl.classList.add('infusion-header');
            titleEl.textContent = 'Companion';
          }
          if (!knowsHomunculus) {
            box.style.display = 'none';
          } else {
            box.style.display = '';
            renderHomunculusCompanionRow(model, list, {
              activeInfusionCount: activeForCurrent.length,
              activeInfusionLimit: infusionLimits.active_limit || 0
            });
          }
        } else {
          box.style.display = 'none'; // Hide 8 and 9 for now
        }
        continue; // Skip the regular spell rendering for this level
      }

      // --- Regular Spell Rendering ---
      const rawSpells = (model.byLevel[L]||[]);
      const visibleSpells = (atSelectionCap && L > 0)
        ? rawSpells.filter(s => {
          const lowerName = String(s?.name || '').toLowerCase();
          return !!(prepared[L]?.includes(s.name) || s.locked || (storedSpellLower && lowerName === storedSpellLower));
        })
        : rawSpells;
      const spells = visibleSpells.slice().sort((a,b)=>{
        const ap = (prepared[L]?.includes(a.name) || a.locked) ? 0 : 1;
        const bp = (prepared[L]?.includes(b.name) || b.locked) ? 0 : 1;
        return (ap-bp) || a.name.localeCompare(b.name);
      });
      list.innerHTML='';
      for (const s of spells){
        const el = document.createElement('div');
        el.className = 'Item tooltip';
        el.dataset.locked = s.locked ? '1' : '0';
        const isCantrip = Number(s.level) === 0;
        const srdMeta = model.srdSpellMeta?.get(String(s.name || '').toLowerCase()) || null;
        const idx = model.masterIndex.get(String(s.name || '').toLowerCase());
        const isRitual = !!(s.ritual === true || idx?.ritual === true || srdMeta?.ritual === true);
        const hasLocalConcentration = Object.prototype.hasOwnProperty.call(s, 'concentration');
        const hasIndexConcentration = !!(idx && Object.prototype.hasOwnProperty.call(idx, 'concentration'));
        const isConcentration = hasLocalConcentration
          ? (s.concentration === true)
          : (hasIndexConcentration ? (idx.concentration === true) : (srdMeta?.concentration === true));
        const actionType = String(s?.actionType || idx?.actionType || '').toLowerCase();
        const isReaction = actionType === 'reaction';
        const isBonusAction = actionType === 'bonusaction' || actionType === 'bonus';
        const isMistyStep = String(s.name || '').toLowerCase() === 'misty step';
        const higherLevelText = String(
          s?.higherLevelSlot
          || idx?.higherLevelSlot
          || srdMeta?.higherLevelSlot
          || ''
        ).trim();
        const abilityOverride = model.spellAbilityOverrides?.[String(s.name || '').toLowerCase()];
        const scoreOverride = abilityOverride
          ? Number(model.character?.abilities?.[abilityOverride] ?? model.character?.abilities?.[String(abilityOverride || '').toLowerCase()] ?? 10)
          : 10;
        const modOverride = (window.DDRules && typeof window.DDRules.abilityMod === 'function')
          ? window.DDRules.abilityMod(scoreOverride)
          : Math.floor((scoreOverride - 10) / 2);
        const pbOverride = (window.DDRules && typeof window.DDRules.proficiencyFromLevel === 'function')
          ? window.DDRules.proficiencyFromLevel(model.level)
          : (2 + Math.floor((Math.max(1, Number(model.level || 1)) - 1) / 4));
        const spellSaveDCBonus = Number(model.character?.spellSaveDCMod || 0);
        const computedOverrideDC = 8 + pbOverride + modOverride + spellSaveDCBonus;
        const chaScoreRacial = Number(model.character?.abilities?.CHA ?? model.character?.abilities?.cha ?? 10);
        const chaModRacial = (window.DDRules && typeof window.DDRules.abilityMod === 'function')
          ? window.DDRules.abilityMod(chaScoreRacial)
          : Math.floor((chaScoreRacial - 10) / 2);
        const pbRacial = (window.DDRules && typeof window.DDRules.proficiencyFromLevel === 'function')
          ? window.DDRules.proficiencyFromLevel(model.level)
          : (2 + Math.floor((Math.max(1, Number(model.level || 1)) - 1) / 4));
        const computedRacialDC = 8 + pbRacial + chaModRacial + spellSaveDCBonus;
        const descForSaveCheck = String(
          s?.desc
          || idx?.desc
          || idx?.description
          || idx?.full
          || idx?.text
          || ''
        );
        const hasSavingThrowText = /\bsaving throw\b/i.test(descForSaveCheck);
        const fmt = (n) => (window.DDRules && typeof window.DDRules.fmtMod === 'function')
          ? window.DDRules.fmtMod(n)
          : ((Number(n) >= 0) ? `+${Number(n)}` : String(Number(n)));
        const higherLevelNote = higherLevelText ? `\n\nAt Higher Levels: ${higherLevelText}` : '';
        const overrideNote = abilityOverride ? `\n\nUses ${abilityOverride} for this spell.` : '';
        const overrideSaveNote = (abilityOverride && hasSavingThrowText)
          ? `\n\nSpell Save DC (${abilityOverride}): 8 + PB (${fmt(pbOverride)}) + ${abilityOverride} mod (${fmt(modOverride)})${spellSaveDCBonus ? ` + bonuses (${fmt(spellSaveDCBonus)})` : ''} = ${computedOverrideDC}`
          : '';
        const isTieflingRacialSpell = String(s?.badge || '').toLowerCase() === 'racial'
          && String(model.character?.race || '').toLowerCase().includes('tiefling');
        const racialSaveNote = (!abilityOverride && isTieflingRacialSpell && hasSavingThrowText)
          ? `\n\nSpell Save DC (CHA): 8 + PB (${fmt(pbRacial)}) + CHA mod (${fmt(chaModRacial)})${spellSaveDCBonus ? ` + bonuses (${fmt(spellSaveDCBonus)})` : ''} = ${computedRacialDC}`
          : '';
        const concentrationNote = isConcentration ? '\n\nConcentration: You can concentrate on only one spell at a time.' : '';
        const damageTypeHints = (() => {
          if (!window.FeatRuntime?.extractDamageTypesFromText) return [];
          const localDesc = String(s?.desc || '');
          const idxDescRaw = idx && (idx.desc || idx.description || idx.full || idx.text);
          const idxDesc = String(Array.isArray(idxDescRaw) ? idxDescRaw.join('\n\n') : (idxDescRaw || ''));
          const merged = []
            .concat(window.FeatRuntime.extractDamageTypesFromText(localDesc))
            .concat(window.FeatRuntime.extractDamageTypesFromText(idxDesc));
          return Array.from(new Set(merged.map(x => String(x || '').toLowerCase()).filter(Boolean)));
        })();
        const damageRulesNote = window.FeatRuntime?.describeSpellDamageRules
          ? window.FeatRuntime.describeSpellDamageRules(model.character, damageTypeHints)
          : '';
        const featDamageNote = damageRulesNote ? `\n\n${damageRulesNote}` : '';
        const mergedDescForDamageCheck = `${String(s?.desc || '')}\n${String(idx?.desc || idx?.description || idx?.full || idx?.text || '')}`.toLowerCase();
        const isArtillerist = String(model.character?.class || '').toLowerCase() === 'artificer'
          && String(model.character?.build || '').toLowerCase().includes('artillerist')
          && Number(model.character?.level || 1) >= 5;
        const lowerBadge = String(s?.badge || '').toLowerCase();
        const isSubclassGrantedArtilleristSpell = isArtillerist && (
          lowerBadge === 'subclass' ||
          lowerBadge.includes('artillerist')
        );
        const isArtificerSpell = !!model.artificerSpellNames?.has(String(s.name || '').toLowerCase()) || isSubclassGrantedArtilleristSpell;
        const spellNameLower = String(s.name || '').toLowerCase();
        const castingTimeText = getCastingTimeText(s, idx, srdMeta);
        const isOneActionSpell = actionType === 'action' || isOneActionCastingTime(s, idx, srdMeta);
        const isSpellStoringEligibleSpell =
          !!model.hasSpellStoringItem &&
          Number(s.level) >= 1 &&
          Number(s.level) <= 2 &&
          isArtificerSpell &&
          isOneActionSpell;
        const isStoredSpell = !!spellStoring && spellNameLower === storedSpellLower;
        const spellStoringNote = isStoredSpell
          ? `\n\nSpell-Storing Item: Stored in ${spellStoring.itemName || 'item'}. Uses ${spellStoring.usesSpent}/${spellStoring.maxUses}.`
          : '';
        const noArcaneFirearmOnStoredCastNote = (isStoredSpell && spellStoring?.viaArcaneFirearm)
          ? '\n\nSpell-Storing Item castings do not gain Arcane Firearm bonus damage (+1d8).'
          : '';
        const telekineticNote = (() => {
          const isMageHand = spellNameLower === 'mage hand';
          const hasTelekinetic = !!(model.hasTelekineticFeat || s?.telekineticGranted);
          if (!isMageHand || !hasTelekinetic) return '';
          const boostedRange = !!s?.telekineticRangeBoost;
          const rangeLine = boostedRange
            ? 'Range increases by 30 feet (to 60 feet) when you cast it.'
            : 'This cantrip is granted by Telekinetic.';
          return `\n\nTelekinetic feat: You can cast Mage Hand without verbal or somatic components, and the hand can be made invisible. ${rangeLine}`;
        })();
        const hasDamageRollText = /\b\d+d\d+\b[^.\n]{0,80}\bdamage\b/.test(mergedDescForDamageCheck);
        const hasTakesDamageText = /\btakes?\b(?![^.\n]{0,20}\bno damage\b)[^.\n]{0,120}\bdamage\b/.test(mergedDescForDamageCheck);
        const hasDealsDamageText = /\bdeals?\b[^.\n]{0,120}\bdamage\b/.test(mergedDescForDamageCheck);
        const hasOffensiveDamageText = hasDamageRollText || hasTakesDamageText || hasDealsDamageText;
        const isAbsorbElements = spellNameLower === 'absorb elements';
        const isDamageTriggerOnly = /\bwhen you take\b[^.\n]{0,80}\bdamage\b/.test(mergedDescForDamageCheck);
        const isArcaneFirearmEligible =
          isArtillerist &&
          isArtificerSpell &&
          hasOffensiveDamageText &&
          !isAbsorbElements &&
          !isDamageTriggerOnly;
        const arcaneFirearmNote = isArcaneFirearmEligible
          ? '\n\nArcane Firearm: Add 1d8 damage to one damage roll if cast through your arcane firearm.'
          : '';
        const tooltipSuffix = `${higherLevelNote}${overrideNote}${overrideSaveNote}${racialSaveNote}${concentrationNote}${featDamageNote}${arcaneFirearmNote}${spellStoringNote}${noArcaneFirearmOnStoredCastNote}${telekineticNote}`;

        // Handle description: prefer inline (for Ki), then local index, then API
        if (s.desc) {
          el.setAttribute('data-tooltip', formatSpellTooltip(s.name, s.desc, tooltipSuffix));
        } else {
          const localDesc = (idx && (idx.desc || idx.description || idx.full || idx.text));
          if (localDesc) {
            const base = String(Array.isArray(localDesc) ? localDesc.join('\n\n') : localDesc);
            el.setAttribute('data-tooltip', formatSpellTooltip(s.name, base, tooltipSuffix));
          } else {
            el.setAttribute('data-tooltip', `Looking up description…${tooltipSuffix}`);
            const onHover = async () => {
              const resolved = await DDData.getSpellDescription(s.name, model.masterIndex) || 'No description found.';
              el.setAttribute('data-tooltip', formatSpellTooltip(s.name, resolved, tooltipSuffix));
            };
            el.addEventListener('mouseenter', onHover, { once: true });
          }
        }
        const star = document.createElement('div');
        star.className = 'star';
        const isPrepared = !!(prepared[L]?.includes(s.name) || s.locked);
        if (isCantrip) {
          star.textContent = '•';
          star.title = 'Known cantrip';
        } else {
          star.textContent = isPrepared ? '⭐' : '☆';
          star.title = s.locked ? 'Always prepared' : (model.prepLimit > 0 ? 'Toggle prepared' : (model.knownLimit > 0 ? 'Toggle known' : 'Known spell'));
        }
        const name = document.createElement('div');
        name.className = 'name';
        name.textContent = s.name;
        if (isConcentration && activeConcentration === String(s.name || '').toLowerCase()) {
          el.classList.add('is-concentrating');
        }
        el.appendChild(star);
        el.appendChild(name);
        const featUsesRaw = model.featSpellResourcesBySpell?.get(String(s.name || '').toLowerCase()) || [];
        const featUses = isMistyStep ? [] : featUsesRaw;
        const lowerSpellName = String(s.name || '').toLowerCase();
        const hasInlineRacialTracker =
          model.devilsTongueSpells?.has(lowerSpellName) ||
          model.infernalLegacyRebukeSpells?.has(lowerSpellName);
        const hideSourceBadge = !!(
          s.badge && (
            featUses.some(fr => String(s.badge || '').toLowerCase().includes(String(fr.label || '').toLowerCase())) ||
            (String(s.badge || '').toLowerCase() === 'racial' && hasInlineRacialTracker)
          )
        );
        if (s.badge && !hideSourceBadge){ const b = document.createElement('span'); b.className = 'badge'; b.textContent = s.badge; el.appendChild(b); }
        for (const fr of featUses) {
          const used = Number(actionState?.[fr.resKey] || 0);
          const fb = document.createElement('span');
          fb.className = 'badge';
          fb.textContent = `${fr.label} ${used}/${fr.uses}`;
          fb.title = 'Click to mark free cast use. Shift-click resets.';
          fb.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const st2 = window.readActionState ? (window.readActionState(model.character) || {}) : {};
            const curr = Number(st2[fr.resKey] || 0);
            st2[fr.resKey] = ev.shiftKey ? 0 : (curr >= fr.uses ? 0 : curr + 1);
            if (window.writeActionState) window.writeActionState(model.character, st2);
            paintLevels(model);
            paintResources(model);
          });
          el.appendChild(fb);
        }
        if (model.primalAwarenessSpells?.has(String(s.name || '').toLowerCase())) {
          const key = `primalAwareness:${String(s.name || '').toLowerCase()}`;
          const used = Number(actionState?.[key] || 0);
          const pb = document.createElement('span');
          pb.className = 'badge';
          pb.textContent = `primal ${used}/1`;
          pb.title = 'Primal Awareness: cast once per long rest without expending a spell slot. Click to toggle use. Shift-click resets.';
          pb.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const st2 = window.readActionState ? (window.readActionState(model.character) || {}) : {};
            const curr = Number(st2[key] || 0);
            st2[key] = ev.shiftKey ? 0 : (curr >= 1 ? 0 : 1);
            if (window.writeActionState) window.writeActionState(model.character, st2);
            paintLevels(model);
            paintResources(model);
          });
          el.appendChild(pb);
        }
        if (model.feyReinforcementSpells?.has(String(s.name || '').toLowerCase())) {
          const key = `feyReinforcements:${String(s.name || '').toLowerCase()}`;
          const used = Number(actionState?.[key] || 0);
          const fb = document.createElement('span');
          fb.className = 'badge';
          fb.textContent = `fey ${used}/1`;
          fb.title = 'Fey Reinforcements: cast once per long rest without expending a spell slot. Click to toggle use. Shift-click resets.';
          fb.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const st2 = window.readActionState ? (window.readActionState(model.character) || {}) : {};
            const curr = Number(st2[key] || 0);
            st2[key] = ev.shiftKey ? 0 : (curr >= 1 ? 0 : 1);
            if (window.writeActionState) window.writeActionState(model.character, st2);
            paintLevels(model);
            paintResources(model);
          });
          el.appendChild(fb);
        }
        if (model.mistyWandererSpells?.has(String(s.name || '').toLowerCase())) {
          const key = `mistyWanderer:${String(s.name || '').toLowerCase()}`;
          const wisScore = Number(model.character?.abilities?.WIS ?? model.character?.abilities?.wis ?? 10);
          const wisMod = (window.DDRules && typeof window.DDRules.abilityMod === 'function')
            ? window.DDRules.abilityMod(wisScore)
            : Math.floor((wisScore - 10) / 2);
          const maxUses = Math.max(1, Number.isFinite(wisMod) ? wisMod : 0);
          const used = Math.max(0, Number(actionState?.[key] || 0));
          const mb = document.createElement('span');
          mb.className = 'badge';
          mb.textContent = `misty ${used}/${maxUses}`;
          mb.title = 'Misty Wanderer: cast Misty Step without expending a spell slot. Uses = WIS modifier (minimum 1) per long rest. Click to spend 1 use. Shift-click refunds 1 use.';
          mb.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const st2 = window.readActionState ? (window.readActionState(model.character) || {}) : {};
            const curr = Math.max(0, Number(st2[key] || 0));
            if (ev.shiftKey) {
              st2[key] = Math.max(0, curr - 1);
            } else {
              st2[key] = Math.min(maxUses, curr + 1);
            }
            if (window.writeActionState) window.writeActionState(model.character, st2);
            paintLevels(model);
            paintResources(model);
          });
          el.appendChild(mb);
        }
        if (isMistyStep) {
          const key = 'spellFreeCast:misty-step';
          const used = Math.max(0, Number(actionState?.[key] || 0));
          const mb = document.createElement('span');
          mb.className = 'badge';
          mb.textContent = `misty ${used}/1`;
          mb.title = 'Misty Step: one free cast per long rest. Click to toggle use. Shift-click resets.';
          mb.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const st2 = window.readActionState ? (window.readActionState(model.character) || {}) : {};
            const curr = Math.max(0, Number(st2[key] || 0));
            st2[key] = ev.shiftKey ? 0 : (curr >= 1 ? 0 : 1);
            if (window.writeActionState) window.writeActionState(model.character, st2);
            paintLevels(model);
            paintResources(model);
          });
          el.appendChild(mb);
        }
        if (model.devilsTongueSpells?.has(String(s.name || '').toLowerCase())) {
          const key = `racialSpell:${String(s.name || '').toLowerCase()}`;
          const used = Math.max(0, Number(actionState?.[key] || 0));
          const rb = document.createElement('span');
          rb.className = 'badge';
          rb.textContent = `racial ${used}/1`;
          rb.title = "Devil's Tongue: cast once per long rest without expending a spell slot. Click to toggle use. Shift-click resets.";
          rb.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const st2 = window.readActionState ? (window.readActionState(model.character) || {}) : {};
            const curr = Math.max(0, Number(st2[key] || 0));
            st2[key] = ev.shiftKey ? 0 : (curr >= 1 ? 0 : 1);
            if (window.writeActionState) window.writeActionState(model.character, st2);
            paintLevels(model);
            paintResources(model);
          });
          el.appendChild(rb);
        }
        if (model.infernalLegacyRebukeSpells?.has(String(s.name || '').toLowerCase())) {
          const key = `racialSpell:${String(s.name || '').toLowerCase()}`;
          const used = Math.max(0, Number(actionState?.[key] || 0));
          const rb = document.createElement('span');
          rb.className = 'badge';
          rb.textContent = `racial ${used}/1`;
          rb.title = 'Infernal Legacy: cast once per long rest without expending a spell slot. Click to toggle use. Shift-click resets.';
          rb.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const st2 = window.readActionState ? (window.readActionState(model.character) || {}) : {};
            const curr = Math.max(0, Number(st2[key] || 0));
            st2[key] = ev.shiftKey ? 0 : (curr >= 1 ? 0 : 1);
            if (window.writeActionState) window.writeActionState(model.character, st2);
            paintLevels(model);
            paintResources(model);
          });
          el.appendChild(rb);
        }
        if (isRitual) {
          const rb = document.createElement('span');
          rb.className = 'badge tooltip';
          rb.textContent = 'rit';
          rb.setAttribute('data-tooltip', "The ritual version of a spell takes 10 minutes longer to cast than normal. It also doesn’t expend a spell slot, which means the ritual version of a spell can’t be cast at a higher level.");
          el.appendChild(rb);
        }
        if (isReaction) {
          const rb = document.createElement('span');
          rb.className = 'badge tooltip';
          rb.textContent = 'react';
          rb.setAttribute('data-tooltip', 'Reaction spell.');
          rb.title = 'Can be cast only as a reaction.';
          el.appendChild(rb);
        }
        if (isBonusAction) {
          const bb = document.createElement('span');
          bb.className = 'badge tooltip';
          bb.textContent = 'bonus';
          bb.setAttribute('data-tooltip', 'Bonus action spell.');
          bb.title = 'Can be cast as a bonus action.';
          el.appendChild(bb);
        }
        if (isConcentration) {
          const cb = document.createElement('span');
          const isActiveConcentration = activeConcentration === String(s.name || '').toLowerCase();
          cb.className = `badge tooltip concentration-badge${isActiveConcentration ? ' active' : ''}`;
          cb.textContent = isActiveConcentration ? 'conc 1/1' : 'conc';
          cb.setAttribute('data-tooltip', "Concentration spell. Click to mark this as your active concentration spell; casting another concentration spell ends the previous one.");
          cb.title = isActiveConcentration ? 'Click to end concentration.' : 'Click to mark active concentration.';
          cb.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const st2 = window.readSpellState(model.character);
            const current = ST.getConcentrationSpell(st2).toLowerCase();
            ST.setConcentrationSpell(st2, current === String(s.name || '').toLowerCase() ? '' : s.name);
            window.writeSpellState(model.character, st2);
            paintLevels(model);
          });
          el.appendChild(cb);
        }
        if (isSpellStoringEligibleSpell) {
          if (isStoredSpell) {
            const sb = document.createElement('span');
            sb.className = 'badge';
            sb.textContent = `ssi ${spellStoring.usesSpent}/${spellStoring.maxUses}`;
            sb.title = 'Spell-Storing Item uses. Click to spend 1 use. Shift-click refunds 1 use.';
            sb.addEventListener('click', (ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              const st2 = window.readSpellState(model.character) || {};
              const existing = ST.getSpellStoringItem(st2);
              if (!existing || String(existing?.spellName || '').trim().toLowerCase() !== spellNameLower) return;
              const maxUses = Math.max(0, Number(model.spellStoringUsesMax || existing?.maxUses || 0));
              const usedNow = Math.max(0, Number(existing?.usesSpent || 0));
              const next = ev.shiftKey
                ? Math.max(0, usedNow - 1)
                : Math.min(maxUses, usedNow + 1);
              ST.setSpellStoringItem(st2, {
                ...existing,
                usesSpent: next,
                maxUses
              });
              window.writeSpellState(model.character, st2);
              paintLevels(model);
            });
            el.appendChild(sb);

            const ib = document.createElement('span');
            ib.className = 'badge';
            ib.textContent = `on ${spellStoring.itemName || 'item'}`;
            ib.title = 'Stored item. Click to choose a different item or spell.';
            ib.addEventListener('click', async (ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              await showSpellStoringItemModal(model, { name: s.name, level: Number(s.level || 0) });
            });
            el.appendChild(ib);
          } else {
            const sb = document.createElement('span');
            sb.className = 'badge';
            sb.textContent = 'store';
            sb.title = 'Spell-Storing Item: store this spell in an eligible item.';
            sb.addEventListener('click', async (ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              await showSpellStoringItemModal(model, { name: s.name, level: Number(s.level || 0) });
            });
            el.appendChild(sb);
          }
        }
        if (isArcaneFirearmEligible) {
          const af = document.createElement('span');
          af.className = 'badge tooltip';
          af.textContent = '⚡';
          af.setAttribute('data-tooltip', 'Arcane Firearm: when you cast this artificer spell through your arcane firearm, roll 1d8 and add it to one damage roll of the spell.');
          af.title = 'Arcane Firearm (+1d8 to one damage roll).';
          el.appendChild(af);
        }
        list.appendChild(el);
        if (!s.locked && !isCantrip){
          const allowToggle = (model.prepLimit > 0 || model.knownLimit > 0);
          if (!allowToggle) {
            star.style.opacity = .35; star.style.cursor = 'not-allowed';
          } else {
          star.addEventListener('click', ()=>{
            const st = window.readSpellState(model.character);
            const prep = ST.getPrepared(st);
            prep[L] = prep[L] || [];
            const i = prep[L].indexOf(s.name);
            if (i>=0){ prep[L].splice(i,1); }
            else {
              const limit = model.prepLimit > 0 ? model.prepLimit : model.knownLimit;
              const total = Object.values(prep).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
              if (total >= limit){
                const type = model.prepLimit > 0 ? 'prepared' : 'known';
                F.status().textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} spell limit reached.`;
                setTimeout(()=>F.status().textContent='',1500);
                return;
              }
              prep[L].push(s.name);
            }
            ST.setPrepared(st, prep);
            window.writeSpellState(model.character, st);
            paintLevels(model);
            paintHeader(model);
          });
        }}
      }
      const pipBox = box.querySelector('.slot-dots');
      const resetBtn = box.querySelector('.reset');
      if (L>0 && pipBox){
        const max = Number(model.slots[L]||0);
        console.log(`DEBUG: For Level ${L}, max slots = ${max}`);
        pipBox.innerHTML='';
        const curr = Number(spent[L]||0);
        for(let i=0;i<max;i++){
          const dot = document.createElement('div');
          dot.className='slot-dot'+(i<curr?' spent':'');
          dot.title = 'Spell slot';
          dot.addEventListener('click', (ev)=>{
            const st = window.readSpellState(model.character);
            const sl = ST.getSlotsSpent(st);
            const c = Number(sl[L]||0);
            sl[L] = (!ev.shiftKey) ? ((i < c) ? i : (i+1)) : ((c>=max) ? 0 : max);
            ST.setSlotsSpent(st, sl);
            window.writeSpellState(model.character, st);
            paintLevels(model);
          });
          pipBox.appendChild(dot);
        }
        if (resetBtn){ resetBtn.onclick = ()=>{ const st = window.readSpellState(model.character); const sl = ST.getSlotsSpent(st); sl[L]=0; ST.setSlotsSpent(st, sl); window.writeSpellState(model.character, st); paintLevels(model); }; }
      } else if (L===0 && pipBox){ pipBox.parentElement.style.display='none'; }
    }
  }
  function paintResources(model){
    const st = window.readSpellState(model.character);
    const actionState = window.readActionState ? window.readActionState(model.character) : {};
    const featResources = Array.isArray(model.character?.resources) ? model.character.resources : [];
    const resKey = (res) => `featRes:${String(res?.id || res?.name || '').toLowerCase()}`;

    // Channel Divinity tracker is displayed on actions.html to keep action resources together.
    F.resCD().style.display = 'none';
    if (model.hasKi){
      F.resKi().style.display = '';
      F.resKiP().innerHTML = '';
      const used = ST.getKi(st);
      for (let i=0;i<model.kiMax;i++){
        const d=document.createElement('div');
        d.className='resource-dot'+(i<used?' spent':''); d.title='Ki point';
        d.addEventListener('click', (ev)=>{
          const curr = ST.getKi(window.readSpellState(model.character));
          ST.setKi(st, (!ev.shiftKey) ? ((i < curr) ? i : (i+1)) : ((curr>=model.kiMax) ? 0 : model.kiMax));
          window.writeSpellState(model.character, st);
          paintResources(model);
        });
        F.resKiP().appendChild(d);
      }
    } else { F.resKi().style.display = 'none'; }
    if (model.hasWildShape && model.wildMax > 0){
      F.resWS().style.display = '';
      F.resWSP().innerHTML = '';
      const used = ST.getWS(st);
      for (let i=0;i<model.wildMax;i++){
        const d=document.createElement('div');
        d.className='resource-dot'+(i<used?' spent':''); d.title='Wild Shape use';
        d.addEventListener('click', (ev)=>{
          const curr = ST.getWS(window.readSpellState(model.character));
          ST.setWS(st, (!ev.shiftKey) ? ((i < curr) ? i : (i+1)) : ((curr>=model.wildMax) ? 0 : model.wildMax));
          if (ST.getWS(st) < 1 && ST.getSE(st)) ST.setSE(st,false);
          window.writeSpellState(model.character, st);
          paintResources(model);
        });
        F.resWSP().appendChild(d);
      }
      if (model.hasSymbioticEntity) {
        F.resSE().style.display = '';
        F.seToggle().checked = ST.getSE(st);
        F.seToggle().onchange = ()=>{
          const st2 = window.readSpellState(model.character);
          const onNow = !!F.seToggle().checked;
          if (onNow){
            if (ST.getWS(st2) >= model.wildMax){ F.seToggle().checked = false; F.status().textContent = 'No Wild Shape uses remaining.'; setTimeout(()=>F.status().textContent='',1500); return; }
            ST.setWS(st2, ST.getWS(st2)+1);
            ST.setSE(st2, true);
          } else { ST.setSE(st2, false); }
          window.writeSpellState(model.character, st2);
          paintResources(model);
        };
      } else {
        F.resSE().style.display = 'none';
      }
    } else { F.resWS().style.display = 'none'; F.resSE().style.display = 'none'; }

    const resBox = F.resources();
    if (resBox) {
      resBox.querySelectorAll('.feat-resource').forEach(el => el.remove());
    }
    if (resBox && featResources.length) {
      for (const res of featResources) {
        const consumes = Array.isArray(res?.consumes) ? res.consumes : [];
        const isSpellLinked = consumes.some(c => !!(c?.spell || c?.spell_from_choice));
        if (isSpellLinked) continue; // spell-linked feat uses are tracked inline on spell rows
        const maxUses = Number(res.uses || 0);
        if (!Number.isFinite(maxUses) || maxUses <= 0) continue;
        const usedCount = Number(actionState[resKey(res)] || 0);
        const pill = document.createElement('div');
        pill.className = 'pill feat-resource';
        const label = document.createElement('span');
        label.textContent = res.name || 'Feat Resource';
        const dots = document.createElement('div');
        dots.className = 'resource-dots';
        for (let i = 0; i < maxUses; i++) {
          const d = document.createElement('div');
          d.className = 'resource-dot' + (i < usedCount ? ' spent' : '');
          d.title = `${res.name || 'Feat Resource'} (${res.recharge || 'rest'})`;
          d.addEventListener('click', (ev) => {
            const curr = Number((window.readActionState(model.character) || {})[resKey(res)] || 0);
            const next = !ev.shiftKey ? ((i < curr) ? i : (i + 1)) : 0;
            const st2 = window.readActionState(model.character) || {};
            st2[resKey(res)] = next;
            window.writeActionState(model.character, st2);
            paintResources(model);
          });
          dots.appendChild(d);
        }
        pill.appendChild(label);
        pill.appendChild(dots);
        resBox.appendChild(pill);
      }
    }
  }
  function wireRests(model){
    const infusionStateKey = (name, item = '') => {
      const n = String(name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const i = String(item || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return `infusion:${n}${i ? `:${i}` : ''}`;
    };

    function applyInfusionDawnRecharge(character, actionState) {
      if (!actionState || typeof actionState !== 'object') return [];
      const all = (window.readAllActiveInfusions && typeof window.readAllActiveInfusions === 'function')
        ? window.readAllActiveInfusions()
        : [];
      const mine = all.filter(inf =>
        String(inf?.owner || '').trim() === String(character?.name || '').trim()
      );
      const notes = [];

      const mindList = mine.filter(inf => String(inf?.name || '').toLowerCase() === 'mind sharpener');
      for (const inf of mindList) {
        const key = infusionStateKey('mind-sharpener', inf.item);
        const used = Math.max(0, Number(actionState[key] || 0));
        if (used <= 0) continue;
        const regain = 1 + Math.floor(Math.random() * 4); // 1d4
        actionState[key] = Math.max(0, used - regain);
        notes.push(`Mind Sharpener (${inf.item || 'item'}): regained ${Math.min(regain, used)}.`);
      }

      const armorList = mine.filter(inf => String(inf?.name || '').toLowerCase() === 'armor of magical strength');
      for (const inf of armorList) {
        const key = infusionStateKey('armor-of-magical-strength', inf.item);
        const used = Math.max(0, Number(actionState[key] || 0));
        if (used <= 0) continue;
        const regain = 1 + Math.floor(Math.random() * 6); // 1d6
        actionState[key] = Math.max(0, used - regain);
        notes.push(`Armor of Magical Strength (${inf.item || 'item'}): regained ${Math.min(regain, used)}.`);
      }

      return notes;
    }

    function persistCharacterOverride(character) {
      const file = (window.getCurrentCharacterFile && window.getCurrentCharacterFile()) || '';
      const clean = String(file || '').replace(/^\/?data\//, '');
      if (!clean || !window.STORAGE?.set) return;
      window.STORAGE.set(`dd:char:${clean}`, character || null);
    }

    async function resetActionTrackersByRecharge(character, actionState, wantedRecharges) {
      if (!character || !actionState || typeof actionState !== 'object') return;
      if (typeof window.getCharacterActions !== 'function') return;
      const wanted = new Set((Array.isArray(wantedRecharges) ? wantedRecharges : [])
        .map(v => String(v || '').toLowerCase().trim())
        .filter(Boolean));
      if (!wanted.size) return;

      const allActions = await window.getCharacterActions(character, actionState);
      const buckets = ['action', 'bonus', 'reaction', 'move', 'special'];
      const keysToReset = new Set();

      const shouldReset = (rechargeRaw) => {
        const recharge = String(rechargeRaw || '').toLowerCase().trim();
        if (!recharge) return false;
        if (wanted.has(recharge)) return true;
        return recharge === 'short_or_long_rest'
          && (wanted.has('short_rest') || wanted.has('long_rest'));
      };

      for (const bucket of buckets) {
        const rows = Array.isArray(allActions?.[bucket]) ? allActions[bucket] : [];
        for (const row of rows) {
          const stateKey = String(row?.stateKey || '').trim();
          const maxUses = Number(row?.maxUses || 0);
          if (!stateKey || !Number.isFinite(maxUses) || maxUses <= 0) continue;
          if (!shouldReset(row?.recharge)) continue;
          keysToReset.add(stateKey);
        }
      }

      for (const key of keysToReset) actionState[key] = 0;
    }

    const dailyPrepClasses = new Set(['cleric', 'druid', 'wizard', 'paladin', 'artificer', 'ranger']);
    F.short().onclick = async ()=>{
      const st = window.readSpellState(model.character);
      if (model.hasChannelDivinity) ST.setCD(st,0);
      if (model.hasKi) ST.setKi(st,0);
      if (model.hasWildShape){ ST.setWS(st,0); ST.setSE(st,false); }
      if (window.FeatRuntime?.resetResourcesByRecharge) {
        window.FeatRuntime.resetResourcesByRecharge(model.character, ['short_rest']);
      } else if (window.readActionState && window.writeActionState) {
        const actionState = window.readActionState(model.character) || {};
        const featResources = Array.isArray(model.character?.resources) ? model.character.resources : [];
        for (const res of featResources) {
          if (String(res?.recharge || '').toLowerCase() !== 'short_rest') continue;
          const key = `featRes:${String(res?.id || res?.name || '').toLowerCase()}`;
          actionState[key] = 0;
        }
        window.writeActionState(model.character, actionState);
      }
      if (window.readActionState && window.writeActionState) {
        const actionState = window.readActionState(model.character) || {};
        await resetActionTrackersByRecharge(model.character, actionState, ['short_rest']);
        actionState.battleMasterSuperiorityUsed = 0;
        actionState.perfectSelfTriggered = false;
        actionState.eldritchCannons = [];
        actionState.eldritchCannonActive = false;
        actionState.eldritchCannonType = '';
        window.writeActionState(model.character, actionState);
      }
      window.writeSpellState(model.character, st);
      paintResources(model);
      F.status().textContent = 'Short Rest applied.';
      setTimeout(()=>F.status().textContent='',1200);
    };
    F.long().onclick = async ()=>{
      const st = window.readSpellState(model.character);
      let infusionRechargeNotes = [];
      ST.setSlotsSpent(st, {});
      ST.setConcentrationSpell(st, '');
      // Long Rest restores hit points to full.
      const maxHP = Number(model.character?.maxHP || 0);
      if (Number.isFinite(maxHP) && maxHP > 0) {
        model.character.currentHP = maxHP;
        if (global._currentCharacter) global._currentCharacter.currentHP = maxHP;
        persistCharacterOverride(model.character);
      }
      if (model.hasChannelDivinity) ST.setCD(st,0);
      if (model.hasKi) ST.setKi(st,0);
      if (window.readActionState && window.writeActionState) {
        const actionState = window.readActionState(model.character);
        if (actionState) {
          await resetActionTrackersByRecharge(model.character, actionState, ['short_rest', 'long_rest']);
          actionState.rageUsed = 0;
          actionState.zealousPresenceUsed = 0;
          actionState.battleMasterSuperiorityUsed = 0;
          actionState.eldritchCannonFreeUsed = 0;
          actionState.eldritchCannonUsed = 0;
          actionState.eldritchCannons = [];
          actionState.eldritchCannonActive = false;
          actionState.eldritchCannonType = '';
          actionState.rabbitHopUsed = 0;
          actionState.fungalInfestationUsed = 0;
          actionState.hellishRebukeUsed = 0;
          actionState.naturesVeilUsed = 0;
          actionState.foeSlayerUsedTurn = 0;
          actionState.natureCharmActive = false;
          actionState.perfectSelfTriggered = false;
          if (window.FeatRuntime?.listResources && window.FeatRuntime?.resourceKey) {
            const featResources = window.FeatRuntime.listResources(model.character);
            for (const res of featResources) {
              const recharge = String(res?.recharge || '').toLowerCase();
              if (recharge !== 'long_rest' && recharge !== 'short_rest') continue;
              actionState[window.FeatRuntime.resourceKey(res)] = 0;
            }
          } else {
            const featResources = Array.isArray(model.character?.resources) ? model.character.resources : [];
            for (const res of featResources) {
              const recharge = String(res?.recharge || '').toLowerCase();
              if (recharge !== 'long_rest' && recharge !== 'short_rest') continue;
              const key = `featRes:${String(res?.id || res?.name || '').toLowerCase()}`;
              actionState[key] = 0;
            }
          }
          for (const k of Object.keys(actionState)) {
            if (String(k).startsWith('primalAwareness:')) actionState[k] = 0;
            if (String(k).startsWith('feyReinforcements:')) actionState[k] = 0;
            if (String(k).startsWith('mistyWanderer:')) actionState[k] = 0;
            if (String(k).startsWith('racialSpell:')) actionState[k] = 0;
            if (String(k).startsWith('spellFreeCast:')) actionState[k] = 0;
            if (String(k).startsWith('infusion:spell-refueling-ring:')) actionState[k] = 0;
          }
          infusionRechargeNotes = applyInfusionDawnRecharge(model.character, actionState);
          window.writeActionState(model.character, actionState);
        }
      }
      if (model.hasWildShape){ ST.setWS(st,0); ST.setSE(st,false); }
      if (model.hasSpellStoringItem) {
        const ssi = ST.getSpellStoringItem(st);
        if (ssi) {
          ST.setSpellStoringItem(st, {
            ...ssi,
            usesSpent: 0,
            maxUses: Math.max(0, Number(model.spellStoringUsesMax || spellStoringMaxUses(model.character)))
          });
        }
      }

      const cls = String(model.character?.class || '').toLowerCase();
      const shouldPromptPrep = dailyPrepClasses.has(cls) && (model.prepLimit > 0 || model.knownLimit > 0);
      if (shouldPromptPrep) {
        const currentCount = Object.values(ST.getPrepared(st)).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
        const cap = model.prepLimit > 0 ? model.prepLimit : model.knownLimit;
        const label = model.prepLimit > 0 ? 'prepared' : 'selected';
        const doReview = window.confirm(
          `Long Rest complete.\n\n${model.character.class} should review daily spells now.\nCurrent ${label}: ${currentCount}/${cap}.\n\nClick OK to re-choose now, or Cancel to keep current selection.`
        );
        if (doReview) {
          ST.setPrepared(st, {});
        }
      }

      window.writeSpellState(model.character, st);
      paintLevels(model);
      paintHeader(model);
      paintResources(model);
      const baseMsg = shouldPromptPrep
        ? 'Long Rest: resources restored. Review daily spells if needed.'
        : 'Long Rest: all slots/resources restored.';
      F.status().textContent = infusionRechargeNotes.length
        ? `${baseMsg} ${infusionRechargeNotes.join(' ')}`
        : baseMsg;
      setTimeout(()=>F.status().textContent='',1200);
    };
    F.reprep().onclick = ()=>{
      const st = window.readSpellState(model.character);
      ST.setPrepared(st, {});
      window.writeSpellState(model.character, st);
      paintLevels(model);
      paintHeader(model);
      F.status().textContent = 'Prepared spells cleared.';
      setTimeout(()=>F.status().textContent='',1200);
    };
  }

  function showInfusionManager(model) {
    const state = window.readSpellState(model.character);
    const knownLimit = model.character?.infusions?.known_limit || 0;
    const knownFromState = ST.getKnownInfusions(state);
    const initialKnown = Array.isArray(knownFromState) ? knownFromState : (model.character?.infusions?.known || []);
    let selection = new Set(initialKnown);

    // Create modal elements
    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    const modal = document.createElement('div');
    modal.id = 'infusion-manager-modal';

    const availableInfusions = model.allInfusions.filter(inf => inf.level <= model.level);

    const listHtml = availableInfusions
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(infusion => {
        const isKnown = selection.has(infusion.name);
        return `
            <label class="infusion-choice tooltip" data-tooltip="${infusion.desc}">
                <input type="checkbox" value="${infusion.name}" ${isKnown ? 'checked' : ''}>
                <span>${infusion.name}</span>
            </label>
        `;
    }).join('');

    modal.innerHTML = `
        <h3 class="modal-title">Manage Known Infusions</h3>
        <p class="modal-subtitle">You can know up to <strong>${knownLimit}</strong> infusions. (<span id="infusion-known-count">${selection.size}</span> selected)</p>
        <div class="infusion-list">${listHtml}</div>
        <div class="modal-actions">
            <button id="infusion-cancel">Cancel</button>
            <button id="infusion-save">Save</button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Event Listeners
    const countEl = modal.querySelector('#infusion-known-count');
    modal.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', () => {
            if (cb.checked) {
                if (selection.size >= knownLimit) {
                    cb.checked = false; // prevent checking more
                    F.status().textContent = `You can only know ${knownLimit} infusions.`;
                    setTimeout(() => F.status().textContent = '', 2000);
                    return;
                }
                selection.add(cb.value);
            } else {
                selection.delete(cb.value);
            }
            countEl.textContent = selection.size;
        });
    });

    const close = () => document.body.removeChild(overlay);

    modal.querySelector('#infusion-cancel').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    modal.querySelector('#infusion-save').addEventListener('click', () => {
        const newState = window.readSpellState(model.character);
        const newKnownList = Array.from(selection).sort();
        ST.setKnownInfusions(newState, newKnownList);

        // Prune active infusions for this artificer only; keep other artificers untouched.
        const artificerName = String(model.character?.name || '');
        const allActive = window.readAllActiveInfusions();
        const newActiveList = allActive.filter(inf => {
          const infuser = String(inf?.infuser || inf?.source || inf?.artificer || '').trim();
          const isCurrent = infuser ? (infuser === artificerName) : (String(inf?.owner || '').trim() === artificerName);
          if (!isCurrent) return true;
          return newKnownList.includes(inf.name);
        });
        window.writeAllActiveInfusions(newActiveList);
        
        window.writeSpellState(model.character, newState);
        paintLevels(model); // Re-render the main UI
        close();
    });
  }

  async function listCharacterItemsForSpellStoring(character) {
    const gearRaw = Array.isArray(character?.equipment?.gear) ? character.equipment.gear : [];
    const gearEntries = (typeof window.expandPackedGearEntries === 'function')
      ? window.expandPackedGearEntries(gearRaw)
      : gearRaw;
    const weaponNames = Array.isArray(character?.equipment?.weapons) ? character.equipment.weapons.filter(Boolean) : [];
    const allItemNames = [...weaponNames, ...gearEntries.map(g => g?.name).filter(Boolean)];
    const detailsByName = new Map();
    await Promise.all(allItemNames.map(async (name) => {
      const key = String(name || '').trim().toLowerCase();
      if (!key || detailsByName.has(key)) return;
      const details = await window.getEquipmentByName(name);
      if (details) detailsByName.set(key, details);
    }));

    const out = [];
    for (const name of weaponNames) {
      const key = String(name || '').trim().toLowerCase();
      const details = detailsByName.get(key);
      if (!details) continue;
      out.push({
        ...details,
        name: String(details?.name || name).trim(),
        sourceType: 'weapon'
      });
    }
    for (const g of gearEntries) {
      const gearName = String(g?.name || '').trim();
      if (!gearName) continue;
      const key = gearName.toLowerCase();
      const details = detailsByName.get(key);
      if (details) {
        out.push({
          ...details,
          name: gearName,
          equip_slot: g?.equip_slot || details?.equip_slot,
          object_form: g?.object_form == null ? details?.object_form ?? null : g.object_form,
          is_spellcasting_focus: typeof g?.is_spellcasting_focus === 'boolean' ? g.is_spellcasting_focus : !!details?.is_spellcasting_focus,
          focus_kind: g?.focus_kind == null ? details?.focus_kind ?? null : g.focus_kind,
          sourceType: 'gear',
          key: g?.key || details?.key
        });
      } else {
        out.push({
          name: gearName,
          equip_slot: g?.equip_slot || null,
          object_form: g?.object_form == null ? null : g.object_form,
          is_spellcasting_focus: !!g?.is_spellcasting_focus,
          focus_kind: g?.focus_kind == null ? null : g.focus_kind,
          key: g?.key || null,
          sourceType: 'gear'
        });
      }
    }
    return out;
  }

  function isItemInfusedAsArcaneFocus(item, activeInfusions, artificerName) {
    const itemName = String(item?.name || '').trim().toLowerCase();
    if (!itemName || !Array.isArray(activeInfusions)) return false;
    return activeInfusions.some(inf => {
      if (String(inf?.name || '').trim().toLowerCase() !== 'enhanced arcane focus') return false;
      const infuser = String(inf?.infuser || inf?.source || inf?.artificer || '').trim();
      if (infuser && infuser !== artificerName) return false;
      return String(inf?.item || '').trim().toLowerCase() === itemName;
    });
  }

  function itemCanBeSpellStoringFocus(item, activeInfusions, artificerName) {
    if (!item) return false;
    if (item?.is_spellcasting_focus === true) return true;
    const key = normalizeKey(item?.key || item?.name);
    const slot = itemEquipSlot(item);
    if (slot === 'tool') {
      if (SPELL_STORING_ALLOWED_TOOL_KEYS.has(key)) return true;
      if (itemToolCategory(item).includes("artisan")) return true;
    }
    if (isItemInfusedAsArcaneFocus(item, activeInfusions, artificerName)) return true;
    return false;
  }

  function describeSpellStoringCandidate(item, activeInfusions, artificerName) {
    if (isSimpleOrMartialWeapon(item)) return 'Simple/Martial Weapon';
    if (isItemInfusedAsArcaneFocus(item, activeInfusions, artificerName)) return 'Infused Arcane Focus';
    const key = normalizeKey(item?.key || item?.name);
    if (SPELL_STORING_ALLOWED_TOOL_KEYS.has(key)) return 'Tool Focus';
    if (itemToolCategory(item).includes("artisan")) return "Artisan's Tools";
    if (item?.is_spellcasting_focus) return 'Spellcasting Focus';
    return 'Eligible Item';
  }

  async function collectSpellStoringCandidates(model) {
    const character = model?.character || {};
    const artificerName = String(character?.name || '').trim();
    const activeInfusions = (typeof window.readAllActiveInfusions === 'function')
      ? window.readAllActiveInfusions()
      : [];
    const items = await listCharacterItemsForSpellStoring(character);
    const seen = new Set();
    const candidates = [];
    for (const item of items) {
      const canUse = isSimpleOrMartialWeapon(item)
        || itemCanBeSpellStoringFocus(item, activeInfusions, artificerName);
      if (!canUse) continue;
      const sig = `${String(item?.name || '').trim().toLowerCase()}|${itemEquipSlot(item)}|${itemObjectForm(item) || ''}`;
      if (!sig || seen.has(sig)) continue;
      seen.add(sig);
      candidates.push({
        itemName: String(item?.name || '').trim(),
        viaArcaneFirearm: false,
        reason: describeSpellStoringCandidate(item, activeInfusions, artificerName)
      });
    }
    if (model?.hasArcaneFirearm) {
      candidates.push({
        itemName: 'Arcane Firearm',
        viaArcaneFirearm: true,
        reason: 'Artillerist Feature'
      });
    }
    candidates.sort((a, b) => String(a.itemName).localeCompare(String(b.itemName)));
    return candidates;
  }

  async function showSpellStoringItemModal(model, spell) {
    if (!model?.hasSpellStoringItem) return;
    const spellName = String(spell?.name || '').trim();
    const spellLevel = Number(spell?.level || 0);
    if (!spellName || spellLevel < 1 || spellLevel > 2) return;

    const candidates = await collectSpellStoringCandidates(model);
    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    const modal = document.createElement('div');
    modal.id = 'infusion-manager-modal';
    const usesMax = Math.max(0, Number(model?.spellStoringUsesMax || spellStoringMaxUses(model?.character)));
    const state = window.readSpellState(model.character) || {};
    const current = ST.getSpellStoringItem(state);
    const currentItemName = String(current?.itemName || '').trim().toLowerCase();
    const currentViaAF = !!current?.viaArcaneFirearm;

    const optionsHtml = candidates.map((c, i) => {
      const selected = (currentItemName && currentItemName === String(c.itemName || '').trim().toLowerCase() && currentViaAF === !!c.viaArcaneFirearm)
        ? ' selected'
        : '';
      return `<option value="${i}"${selected}>${c.itemName} (${c.reason})</option>`;
    }).join('');

    modal.innerHTML = `
      <h3 class="modal-title">Spell-Storing Item</h3>
      <p class="modal-subtitle">Store <strong>${spellName}</strong> (level ${spellLevel}) in an eligible item.</p>
      <div class="infusion-list" style="padding: 20px;">
        <p>Uses per long rest: <strong>${usesMax}</strong></p>
        <select id="ssi-item-select" style="width: 100%; font-size: 14px; padding: 6px;" ${candidates.length ? '' : 'disabled'}>
          <option value="">-- Choose a target item --</option>
          ${optionsHtml}
        </select>
        <p id="ssi-hint" style="margin-top:10px; font-size:12px; color:#5d4836;">
          ${candidates.length ? '' : 'No eligible items found. Requires a simple/martial weapon, qualifying tool focus, infused arcane focus, or Arcane Firearm.'}
        </p>
      </div>
      <div class="modal-actions">
        <button id="ssi-cancel">Cancel</button>
        <button id="ssi-save" ${candidates.length ? '' : 'disabled'}>Store</button>
      </div>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const close = () => {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };
    modal.querySelector('#ssi-cancel')?.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    modal.querySelector('#ssi-save')?.addEventListener('click', () => {
      const sel = modal.querySelector('#ssi-item-select');
      const idx = Number(sel?.value);
      if (!Number.isFinite(idx) || idx < 0 || idx >= candidates.length) return;
      const chosen = candidates[idx];
      const st = window.readSpellState(model.character) || {};
      ST.setSpellStoringItem(st, {
        spellName,
        spellLevel,
        itemName: chosen.itemName,
        viaArcaneFirearm: !!chosen.viaArcaneFirearm,
        usesSpent: 0,
        maxUses: usesMax,
        configuredAt: new Date().toISOString()
      });
      window.writeSpellState(model.character, st);
      paintLevels(model);
      if (F.status()) {
        F.status().textContent = `Spell-Storing Item set: ${spellName} in ${chosen.itemName}.`;
        setTimeout(() => {
          if (F.status()?.textContent.startsWith('Spell-Storing Item set:')) F.status().textContent = '';
        }, 1800);
      }
      close();
    });
  }

  const REPLICATE_TARGET_SPEC = {
    'bag of holding': { equipSlot: 'container', objectForm: 'bag' },
    'alchemy jug': { equipSlot: 'wondrous_handheld', objectForm: 'jug' },
    'rope of climbing': { equipSlot: 'wondrous_handheld', objectForm: 'rope' },
    'sending stones': { equipSlot: 'wondrous_handheld', objectForm: 'stones' },
    'wand of magic detection': { equipSlot: 'wondrous_handheld', objectForm: 'wand' },
    'wand of secrets': { equipSlot: 'wondrous_handheld', objectForm: 'wand' },
    'lantern of revealing': { equipSlot: 'wondrous_handheld', objectForm: 'lantern' },
    'dimensional shackles': { equipSlot: 'wondrous_handheld', objectForm: 'shackles' },
    'gem of seeing': { equipSlot: 'wondrous_handheld', objectForm: 'gem' },
    'horn of blasting': { equipSlot: 'wondrous_handheld', objectForm: 'horn' },
    'pipes of haunting': { equipSlot: 'instrument', objectForm: 'pipes' },
    'boots of elvenkind': { equipSlot: 'boots' },
    'boots of the winterlands': { equipSlot: 'boots' },
    'boots of striding and springing': { equipSlot: 'boots' },
    'boots of levitation': { equipSlot: 'boots' },
    'boots of speed': { equipSlot: 'boots' },
    'winged boots': { equipSlot: 'boots' },
    'cloak of elvenkind': { equipSlot: 'cloak' },
    'cloak of the manta ray': { equipSlot: 'cloak' },
    'cloak of protection': { equipSlot: 'cloak' },
    'cloak of the bat': { equipSlot: 'cloak' },
    'gloves of thievery': { equipSlot: 'gloves' },
    'gauntlets of ogre power': { equipSlot: 'gloves' },
    'goggles of night': { equipSlot: 'goggles' },
    'eyes of charming': { equipSlot: 'goggles' },
    'eyes of the eagle': { equipSlot: 'goggles' },
    'hat of disguise': { equipSlot: 'headwear' },
    'helm of telepathy': { equipSlot: 'headwear' },
    'bracers of archery': { equipSlot: 'bracers' },
    'bracers of defense': { equipSlot: 'bracers' },
    'belt of hill giant strength': { equipSlot: 'belt' },
    'amulet of health': { equipSlot: 'amulet' },
    'periapt of wound closure': { equipSlot: 'amulet' },
    'medallion of thoughts': { equipSlot: 'amulet' },
    'ring of water walking': { equipSlot: 'ring' },
    'ring of protection': { equipSlot: 'ring' },
    'ring of the ram': { equipSlot: 'ring' },
    'ring of free action': { equipSlot: 'ring' },
    'ring of jumping': { equipSlot: 'ring' },
    'ring of mind shielding': { equipSlot: 'ring' },
    'ring of swimming': { equipSlot: 'ring' },
    'spell-refueling ring': { equipSlot: 'ring' }
  };

  function normalizeInfusionKey(infusion) {
    return String(infusion?.name || '').trim().toLowerCase();
  }

  function normalizeReplicateKey(infusion) {
    return String(infusion?.replicates || '').trim().toLowerCase();
  }

  function itemEquipSlot(item) {
    return String(item?.equip_slot || '').trim().toLowerCase();
  }

  function itemObjectForm(item) {
    const raw = item?.object_form;
    return raw == null ? null : String(raw).trim().toLowerCase();
  }

  function itemWeaponCategory(item) {
    return String(item?.weapon_category || item?.weapon?.category || item?.rules?.weapon?.category || '').trim().toLowerCase();
  }

  function itemToolCategory(item) {
    return String(item?.tool?.category || item?.rules?.tool?.category || item?.tool_category || '').trim().toLowerCase();
  }

  function itemGoldValue(item) {
    const explicit = Math.max(0, Number(item?.value_gp || 0) || 0);
    if (explicit > 0) return explicit;
    const cp = Number(item?.cost?.cp);
    if (Number.isFinite(cp) && cp > 0) return cp / 100;
    const gp = Number(item?.cost?.gp);
    if (Number.isFinite(gp) && gp > 0) return gp;
    return 0;
  }

  function infusionRequiresAttunement(infusion) {
    return /\(requires attunement\)/i.test(String(infusion?.item_type || ''));
  }

  function attunementLimitForCharacter(character) {
    const cls = String(character?.class || '').toLowerCase();
    const isArtificer = cls.split(/[,/]/).map(s => s.trim()).includes('artificer') || cls.includes('artificer');
    if (!isArtificer) return 3;
    const level = Number(character?.level || 1);
    if (level >= 18) return 6;
    if (level >= 14) return 5;
    if (level >= 10) return 4;
    return 3;
  }

  function attunedCountForCharacter(character) {
    const gear = Array.isArray(character?.equipment?.gear) ? character.equipment.gear : [];
    return gear.reduce((sum, it) => {
      const qty = Math.max(1, Number(it?.qty || 1));
      const attunedQty = Math.max(0, Number(it?.attuned_qty ?? (it?.attuned ? 1 : 0)) || 0);
      return sum + Math.min(qty, attunedQty);
    }, 0);
  }

  function isTargetAlreadyAttuned(character, targetItemName) {
    const want = String(targetItemName || '').trim().toLowerCase();
    if (!want) return false;
    const gear = Array.isArray(character?.equipment?.gear) ? character.equipment.gear : [];
    return gear.some(it => {
      const same = String(it?.name || '').trim().toLowerCase() === want;
      if (!same) return false;
      const attunedQty = Math.max(0, Number(it?.attuned_qty ?? (it?.attuned ? 1 : 0)) || 0);
      return attunedQty > 0;
    });
  }

  async function tryAutoAttuneTarget(ownerRow, targetItemName) {
    const char = ownerRow?.char;
    const file = ownerRow?.file;
    if (!char || !file || typeof window.saveCharacter !== 'function') return false;
    const updated = structuredClone(char);
    if (!updated.equipment) updated.equipment = {};
    if (!Array.isArray(updated.equipment.gear)) updated.equipment.gear = [];
    const idx = updated.equipment.gear.findIndex(it => String(it?.name || '').trim().toLowerCase() === String(targetItemName || '').trim().toLowerCase());
    if (idx < 0) return false;

    const qty = Math.max(1, Number(updated.equipment.gear[idx]?.qty || 1));
    updated.equipment.gear[idx].attuned = true;
    updated.equipment.gear[idx].attuned_qty = Math.min(qty, Math.max(1, Number(updated.equipment.gear[idx]?.attuned_qty || 1)));

    await window.saveCharacter(file, updated, { prompt: false });
    ownerRow.char = updated;
    return true;
  }

  function isSimpleOrMartialWeapon(item) {
    if (itemEquipSlot(item) !== 'weapon') return false;
    const cat = itemWeaponCategory(item);
    return cat === 'simple' || cat === 'martial';
  }

  function matchesReplicateSpec(item, infusion) {
    const spec = REPLICATE_TARGET_SPEC[normalizeReplicateKey(infusion)];
    if (!spec) return false;
    if (itemEquipSlot(item) !== spec.equipSlot) return false;
    if (spec.objectForm && itemObjectForm(item) !== spec.objectForm) return false;
    return true;
  }

  function itemMatchesInfusionTarget(item, infusion) {
    if (!item || !infusion) return false;

    const infusionName = normalizeInfusionKey(infusion);
    const slot = itemEquipSlot(item);

    if (infusionName.startsWith('replicate magic item')) {
      return matchesReplicateSpec(item, infusion);
    }

    if (infusionName === 'enhanced arcane focus') {
      const form = itemObjectForm(item);
      return !!item?.is_spellcasting_focus
        && String(item?.focus_kind || '').toLowerCase() === 'arcane'
        && (form === 'wand' || form === 'rod' || form === 'staff');
    }
    if (infusionName === 'enhanced defense') {
      return slot === 'armor' || slot === 'shield';
    }
    if (infusionName === 'enhanced weapon') {
      return isSimpleOrMartialWeapon(item);
    }
    if (infusionName === 'repeating shot') {
      return isSimpleOrMartialWeapon(item) && window.DDRules.propHas(item, 'ammunition');
    }
    if (infusionName === 'returning weapon') {
      return isSimpleOrMartialWeapon(item) && window.DDRules.propHas(item, 'thrown');
    }
    if (infusionName === 'mind sharpener') {
      return slot === 'armor' || !!item?.is_armor_like_garment;
    }
    if (infusionName === 'resistant armor' || infusionName === 'armor of magical strength' || infusionName === 'arcane propulsion armor') {
      return slot === 'armor';
    }
    if (infusionName === 'radiant weapon') {
      return isSimpleOrMartialWeapon(item);
    }
    if (infusionName === 'spell-refueling ring') {
      return slot === 'ring';
    }
    if (infusionName === 'helm of awareness') {
      return slot === 'headwear';
    }
    if (infusionName === 'boots of the winding path') {
      return slot === 'boots';
    }
    if (infusionName === 'homunculus servant') {
      const form = itemObjectForm(item);
      const valueGp = itemGoldValue(item);
      return form === 'gem' && valueGp >= 100;
    }

    // If an infusion has no targeting metadata, keep it unavailable rather than
    // falling back to name matching.
    return false;
  }

  function infusionTargetHint(infusion) {
    const infusionName = normalizeInfusionKey(infusion);
    if (infusionName.startsWith('replicate magic item')) {
      const rep = normalizeReplicateKey(infusion);
      const spec = REPLICATE_TARGET_SPEC[rep];
      if (!spec) return 'No metadata target spec found for this replicate item.';
      const formText = spec.objectForm ? `, object_form="${spec.objectForm}"` : '';
      return `Requires equipment metadata: equip_slot="${spec.equipSlot}"${formText}.`;
    }
    if (infusionName === 'enhanced arcane focus') {
      return 'Requires is_spellcasting_focus=true, focus_kind="arcane", and object_form in wand/rod/staff.';
    }
    if (infusionName === 'enhanced defense') return 'Requires equip_slot armor or shield.';
    if (infusionName === 'enhanced weapon') return 'Requires equip_slot weapon and simple/martial category.';
    if (infusionName === 'repeating shot') return 'Requires simple/martial weapon with ammunition property.';
    if (infusionName === 'returning weapon') return 'Requires simple/martial weapon with thrown property.';
    if (infusionName === 'mind sharpener') return 'Requires equip_slot armor or is_armor_like_garment=true.';
    if (infusionName === 'resistant armor' || infusionName === 'armor of magical strength' || infusionName === 'arcane propulsion armor') {
      return 'Requires equip_slot armor.';
    }
    if (infusionName === 'radiant weapon') return 'Requires equip_slot weapon and simple/martial category.';
    if (infusionName === 'spell-refueling ring') return 'Requires equip_slot ring.';
    if (infusionName === 'helm of awareness') return 'Requires equip_slot headwear.';
    if (infusionName === 'boots of the winding path') return 'Requires equip_slot boots.';
    if (infusionName === 'homunculus servant') return 'Requires object_form="gem" and item value >= 100 gp.';
    return 'No target metadata rule is defined for this infusion.';
  }

  async function showInfusionTargeter(infusion, model, onComplete) {
    const character = model.character;
    const infusionLimits = character?.infusions || { active_limit: 0 };
    const currentActive = window.readAllActiveInfusions();
    const artificerName = String(character?.name || '');
    const currentArtificerActive = currentActive.filter((inf) => {
      const infuser = String(inf?.infuser || inf?.source || inf?.artificer || '').trim();
      if (infuser) return infuser === artificerName;
      return String(inf?.owner || '').trim() === artificerName;
    });

    if (currentArtificerActive.length >= infusionLimits.active_limit) {
        F.status().textContent = `Active infusion limit (${infusionLimits.active_limit}) reached.`;
      setTimeout(() => F.status().textContent = '', 2000);
      return;
    }

    const currentFile = (window.getCurrentCharacterFile && typeof window.getCurrentCharacterFile === 'function')
      ? window.getCurrentCharacterFile()
      : null;

    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    const modal = document.createElement('div');
    modal.id = 'infusion-manager-modal'; // Re-using style

    

    modal.innerHTML = `
        <h3 class="modal-title">Infuse Item</h3>
        <p class="modal-subtitle">Select an item to infuse with <strong>${infusion.name}</strong>.</p>
        <div class="infusion-list" style="padding: 20px;">
            <p>This infusion applies to: <em>${infusion.item_type || 'any non-magical item'}</em></p>
            <p style="margin-top: 10px;">Party Scope:</p>
            <select id="infusion-party-scope" style="width: 100%; font-size: 14px; padding: 5px; margin-bottom: 10px;"></select>
            <select id="infusion-item-select" style="width: 100%; font-size: 14px; padding: 5px;">
                <option value="">-- Choose a target item --</option>
            </select>
            <p id="infusion-target-hint" style="margin-top:10px; font-size:12px; color:#5d4836;"></p>
        </div>
        <div class="modal-actions">
            <button id="infusion-cancel">Cancel</button>
            <button id="infusion-save">Infuse</button>
        </div>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const close = () => document.body.removeChild(overlay);
    modal.querySelector('#infusion-cancel').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    const partySelect = modal.querySelector('#infusion-party-scope');
    const itemSelect = modal.querySelector('#infusion-item-select');
    const hintEl = modal.querySelector('#infusion-target-hint');
    const ownerRowsByName = new Map();

    const partyScopes = (window.getPartyScopes && typeof window.getPartyScopes === 'function')
      ? window.getPartyScopes()
      : ['All Parties', 'Witchlight', 'Witchlight-Test', 'One-Shots'];
    const activeScope = (window.getActivePartyScope && typeof window.getActivePartyScope === 'function')
      ? window.getActivePartyScope()
      : 'All Parties';
    partySelect.innerHTML = partyScopes.map(scope => `<option value="${scope}">${scope}</option>`).join('');
    partySelect.value = partyScopes.includes(activeScope) ? activeScope : 'All Parties';

    async function refreshTargetOptions(scopeName) {
      const preserve = itemSelect.value;
      let optionsHtml = '';
      const partyFiles = (window.getPartyCharacterFiles && typeof window.getPartyCharacterFiles === 'function')
        ? window.getPartyCharacterFiles(scopeName, { currentFile })
        : [];
      const allCharacterRows = await Promise.all(
        partyFiles.map(async (file) => {
          if (currentFile && file === currentFile && model?.character) {
            return { file, char: model.character };
          }
          return { file, char: await window.loadCharacter(file) };
        })
      );
      for (const row of allCharacterRows) {
        const char = row?.char;
        if (!char) continue;
        const party = (window.resolveCharacterParty && typeof window.resolveCharacterParty === 'function')
          ? window.resolveCharacterParty(row.file, char)
          : 'Witchlight';
        if (scopeName !== 'All Parties' && party !== scopeName) continue;

        const gearRaw = Array.isArray(char?.equipment?.gear) ? char.equipment.gear : [];
        const gearEntries = (typeof window.expandPackedGearEntries === 'function')
          ? window.expandPackedGearEntries(gearRaw)
          : gearRaw;
        const weaponNames = Array.isArray(char?.equipment?.weapons) ? char.equipment.weapons.filter(Boolean) : [];
        const armorNames = (Array.isArray(char?.armor) ? char.armor : [char?.armor]).filter(Boolean);
        const allItemNames = [...weaponNames, ...armorNames, ...gearEntries.map(g => g?.name).filter(Boolean)];
        if (allItemNames.length === 0) continue;

        const catalogDetailsByName = new Map();
        await Promise.all(allItemNames.map(async (name) => {
          if (!name || catalogDetailsByName.has(name)) return;
          const details = await window.getEquipmentByName(name);
          if (details) catalogDetailsByName.set(name, details);
        }));

        const allItemDetails = [];
        for (const name of weaponNames) {
          const details = catalogDetailsByName.get(name);
          if (details) allItemDetails.push(details);
        }
        for (const name of armorNames) {
          const details = catalogDetailsByName.get(name);
          if (details) allItemDetails.push(details);
        }
        for (const g of gearEntries) {
          const gearName = String(g?.name || '').trim();
          if (!gearName) continue;
          const details = catalogDetailsByName.get(gearName);
          if (details) {
            const merged = {
              ...details,
              name: gearName,
              value_gp: Math.max(0, Number(g?.value_gp || 0) || 0) || itemGoldValue(details),
              equip_slot: g?.equip_slot || details?.equip_slot,
              object_form: g?.object_form == null ? details?.object_form ?? null : g.object_form,
              is_spellcasting_focus: typeof g?.is_spellcasting_focus === 'boolean' ? g.is_spellcasting_focus : !!details?.is_spellcasting_focus,
              focus_kind: g?.focus_kind == null ? details?.focus_kind ?? null : g.focus_kind,
              is_armor_like_garment: typeof g?.is_armor_like_garment === 'boolean' ? g.is_armor_like_garment : !!details?.is_armor_like_garment
            };
            allItemDetails.push(merged);
          } else {
            allItemDetails.push({
              name: gearName,
              value_gp: Math.max(0, Number(g?.value_gp || 0) || 0),
              equip_slot: g?.equip_slot || null,
              object_form: g?.object_form == null ? null : g.object_form,
              is_spellcasting_focus: !!g?.is_spellcasting_focus,
              focus_kind: g?.focus_kind == null ? null : g.focus_kind,
              is_armor_like_garment: !!g?.is_armor_like_garment,
              cost: { gp: Math.max(0, Number(g?.value_gp || 0) || 0) }
            });
          }
        }

        const targetableItems = allItemDetails.filter(item => item && itemMatchesInfusionTarget(item, infusion));
        if (targetableItems.length > 0) {
          ownerRowsByName.set(String(char.name || ''), row);
          optionsHtml += `<optgroup label="${char.name} [${party}]">`;
          optionsHtml += targetableItems.map(item => {
            const reqAttune = infusionRequiresAttunement(infusion) || !!item?.magic?.requiresAttunement || !!item?.magic?.attunement?.required;
            const cost = itemGoldValue(item);
            const costLabel = cost > 0 ? ` (${cost} gp)` : '';
            return `<option value="${item.name}" data-owner="${char.name}" data-requires-attunement="${reqAttune ? '1' : '0'}">${item.name}${costLabel}</option>`;
          }).join('');
          optionsHtml += `</optgroup>`;
        }
      }
      itemSelect.innerHTML = `<option value="">-- Choose a target item --</option>${optionsHtml}`;
      if (hintEl) {
        if (!optionsHtml) {
          hintEl.textContent = `No valid targets found. ${infusionTargetHint(infusion)}`;
        } else {
          hintEl.textContent = '';
        }
      }
      if (preserve) {
        const has = Array.from(itemSelect.options).some(opt => opt.value === preserve);
        if (has) itemSelect.value = preserve;
      }
    }

    partySelect.addEventListener('change', async () => {
      if (window.setActivePartyScope && typeof window.setActivePartyScope === 'function') {
        window.setActivePartyScope(partySelect.value);
      }
      await refreshTargetOptions(partySelect.value);
    });
    await refreshTargetOptions(partySelect.value);

    modal.querySelector('#infusion-save').addEventListener('click', () => {
        const selectEl = modal.querySelector('#infusion-item-select');
        const selectedOption = selectEl.options[selectEl.selectedIndex];
        if (!selectedOption || !selectedOption.value) return;
        const targetOwner = String(selectedOption.dataset.owner || '').trim();
        const ownerRow = ownerRowsByName.get(targetOwner);
        const ownerChar = ownerRow?.char || null;
        const requiresAttunement = selectedOption.dataset.requiresAttunement === '1';

        if (requiresAttunement && ownerChar) {
          const used = attunedCountForCharacter(ownerChar);
          const limit = attunementLimitForCharacter(ownerChar);
          const alreadyAttuned = isTargetAlreadyAttuned(ownerChar, selectedOption.value);
          if (!alreadyAttuned && used >= limit) {
            F.status().textContent = `${targetOwner} is at attunement limit (${used}/${limit}).`;
            setTimeout(() => F.status().textContent = '', 2200);
            return;
          }
          if (!alreadyAttuned) {
            tryAutoAttuneTarget(ownerRow, selectedOption.value).catch(() => {});
          }
        }
        
        let bonus = 0;
        let resistType = '';
        if (infusion.name === 'Enhanced Defense' || infusion.name === 'Enhanced Weapon' || infusion.name === 'Returning Weapon') {
            bonus = (model.character.level >= 10) ? 2 : 1;
        } else if (infusion.name === 'Radiant Weapon') {
            bonus = 1;
        } else if (infusion.name === 'Repeating Shot') {
            // Repeating Shot is always +1 attack/+1 damage (no level scaling).
            bonus = 1;
        } else if (infusion.name === 'Resistant Armor') {
            const choices = ['acid', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'poison', 'psychic', 'radiant', 'thunder'];
            const pickedRaw = window.prompt(`Choose resistance type for Resistant Armor:\n${choices.join(', ')}`, 'fire');
            if (pickedRaw == null) return;
            const picked = String(pickedRaw || '').trim().toLowerCase();
            if (!choices.includes(picked)) {
              F.status().textContent = `Invalid type. Choose one of: ${choices.join(', ')}.`;
              setTimeout(() => F.status().textContent = '', 2200);
              return;
            }
            resistType = picked;
        }

        const active = window.readAllActiveInfusions();
        const newInfusion = {
          name: infusion.name,
          replicates: infusion.replicates || null,
          item: selectedOption.value,
          owner: selectedOption.dataset.owner,
          infuser: artificerName,
          bonus: bonus
        };
        if (resistType) newInfusion.resistType = resistType;
        active.push(newInfusion);
        window.writeAllActiveInfusions(active);
        if (onComplete) onComplete();
        close();
    });
  }

  // --- Main Render Function ---
  async function render(character){
    global._currentCharacter = character;
    const model = await buildModel(character);
    paintHeader(model);
    clearLists();
    paintLevels(model);
    paintResources(model);
    wireRests(model);
    await renderSpellcastingNumbers(character);
  }

  // --- Public Entry Point ---
  async function renderFromCharacterFile(file){
    const clean = String(file||'').replace(/^\/?data\//,'');
    const char = await global.loadCharacter(clean);
    if (!char) { const st = $('#status'); if (st) st.textContent = `Could not load ${clean}`; return; }

    if (typeof global.setCurrentCharacter === 'function') {
      global.setCurrentCharacter(clean, char);
    }

    global.STORAGE.set('dd:lastChar', clean);
    global.setURLParam('char', clean);

    await render(char);

    const st = $('#status'); if (st) st.textContent = `Loaded ${char.name || clean}`;
  }

  // --- Boot & Toolbar Wiring ---
  function boot(){
    if (typeof global.initToolbar === 'function') {
      global.initToolbar({
        onLoadCharacter: renderFromCharacterFile,
        onSaveCharacter: () => {
          const char = global._currentCharacter;
          if (!char) return;
          const state = readState(char);
          writeState(char, state);
          const st = $('#status'); if (st) { st.textContent = 'State saved to localStorage.'; setTimeout(()=>st.textContent='', 2000); }
        }
      });
    }

    // Initial load: ?char=… or lastChar or a sensible default
    const url = new URL(location.href);
    const want = url.searchParams.get('char') || global.STORAGE.get('dd:lastChar') || 'direcris-zzzxaaxthroth-new.json';
    renderFromCharacterFile(want);

    // Add navigation ribbon button to go back to the character sheet
    if (typeof createRibbonButton === 'function') {
      createRibbonButton({
        id: "to-character", container: "#sheet", top: 6, left: 5, width: 110, height: 52,
        label: "Sheet →",
        d: "M 12 19 C 10.3333 19.6667 20 17 25 15 L 30 22 L 30 15 L 32 16 L 32 13 C 34.6667 11 64 20 98 2 C 97 14 88 18 89 23 Q 93 30 106 34 C 94 44 87 44 74 40 L 71 34 L 71 40 C 68.6667 39.6667 66.3333 39.3333 64 39 L 62 36 L 61 39 C 62 38 41 41 9 56 C 11 48 18 43 20 34 C 10 30 11 29 2 21 Z",
        onClick: () => { location.href = `charactersheet.html${location.search}`; }
      });

      createRibbonButton({
        id: "to-actions", container: "#sheet", top: 6, left: 676, width: 110, height: 52,
        label: "← Actions",
        mirrored: true,
        d: "M 12 19 C 10.3333 19.6667 20 17 25 15 L 30 22 L 30 15 L 32 16 L 32 13 C 34.6667 11 64 20 98 2 C 97 14 88 18 89 23 Q 93 30 106 34 C 94 44 87 44 74 40 L 71 34 L 71 40 C 68.6667 39.6667 66.3333 39.3333 64 39 L 62 36 L 61 39 C 62 38 41 41 9 56 C 11 48 18 43 20 34 C 10 30 11 29 2 21 Z",
        onClick: () => { location.href = `actions.html${location.search}`; }
      });
    }
  }

  // expose & start
  global.renderFromCharacterFile = renderFromCharacterFile;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})(window);
