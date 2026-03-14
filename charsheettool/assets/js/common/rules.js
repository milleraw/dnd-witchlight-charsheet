(function(exports){
  'use strict';

  function abilityMod(score){
    const s = Number(score)||10;
    return Math.floor((s-10)/2);
  }

  function proficiencyFromLevel(level){
    const L = Math.max(1, Number(level || 1));
    return 2 + Math.floor((L - 1) / 4);
  }

  const FULL = {
    1:{1:2}, 2:{1:3}, 3:{1:4,2:2}, 4:{1:4,2:3}, 5:{1:4,2:3,3:2},
    6:{1:4,2:3,3:3}, 7:{1:4,2:3,3:3,4:1}, 8:{1:4,2:3,3:3,4:2},
    9:{1:4,2:3,3:3,4:3,5:1}, 10:{1:4,2:3,3:3,4:3,5:2},
    11:{1:4,2:3,3:3,4:3,5:2,6:1}, 12:{1:4,2:3,3:3,4:3,5:2,6:1},
    13:{1:4,2:3,3:3,4:3,5:2,6:1,7:1}, 14:{1:4,2:3,3:3,4:3,5:2,6:1,7:1},
    15:{1:4,2:3,3:3,4:3,5:2,6:1,7:1,8:1}, 16:{1:4,2:3,3:3,4:3,5:2,6:1,7:1,8:1},
    17:{1:4,2:3,3:3,4:3,5:2,6:1,7:1,8:1,9:1}, 18:{1:4,2:3,3:3,4:3,5:3,6:1,7:1,8:1,9:1},
    19:{1:4,2:3,3:3,4:3,5:3,6:2,7:1,8:1,9:1}, 20:{1:4,2:3,3:3,4:3,5:3,6:2,7:2,8:1,9:1}
  };
  const HALF = {
    1:{}, 2:{1:2}, 3:{1:3}, 4:{1:3}, 5:{1:4,2:2}, 6:{1:4,2:2}, 7:{1:4,2:3}, 8:{1:4,2:3},
    9:{1:4,2:3,3:2}, 10:{1:4,2:3,3:2}, 11:{1:4,2:3,3:3}, 12:{1:4,2:3,3:3},
    13:{1:4,2:3,3:3,4:1}, 14:{1:4,2:3,3:3,4:1}, 15:{1:4,2:3,3:3,4:2}, 16:{1:4,2:3,3:3,4:2},
    17:{1:4,2:3,3:3,4:3,5:1}, 18:{1:4,2:3,3:3,4:3,5:1}, 19:{1:4,2:3,3:3,4:3,5:2}, 20:{1:4,2:3,3:3,4:3,5:2}
  };
  // Artificer is a half-caster with 1st-level slots at class level 1.
  const ARTIFICER = {
    1:{1:2}, 2:{1:2}, 3:{1:3}, 4:{1:3}, 5:{1:4,2:2}, 6:{1:4,2:2}, 7:{1:4,2:3}, 8:{1:4,2:3},
    9:{1:4,2:3,3:2}, 10:{1:4,2:3,3:2}, 11:{1:4,2:3,3:3}, 12:{1:4,2:3,3:3},
    13:{1:4,2:3,3:3,4:1}, 14:{1:4,2:3,3:3,4:1}, 15:{1:4,2:3,3:3,4:2}, 16:{1:4,2:3,3:3,4:2},
    17:{1:4,2:3,3:3,4:3,5:1}, 18:{1:4,2:3,3:3,4:3,5:1}, 19:{1:4,2:3,3:3,4:3,5:2}, 20:{1:4,2:3,3:3,4:3,5:2}
  };

  function slotsFor(cls, level){
    const C = String(cls || '').trim().toLowerCase();
    const L = Number(level) || 1;

    // Full Casters
    if (['bard', 'cleric', 'druid', 'sorcerer', 'wizard'].includes(C)) {
      return FULL[L] || {};
    } 
    // Half Casters
    else if (C === 'artificer') {
      return ARTIFICER[L] || {};
    }
    else if (['paladin', 'ranger'].includes(C)) {
      return HALF[L] || {};
    }
    
    return {}; // Non-casters or other types (Warlock, etc.)
  }

  function propHas(w, key) {
    const list = (w?.properties || w?.weapon?.properties || w?.rules?.weapon?.properties || []).map(p => {
      if (typeof p === 'string') return p;
      return p?.id || p?.index || p?.name;
    });
    const want = String(key).toLowerCase();
    return list.some(p => {
      const raw = String(p || "").toLowerCase();
      return raw === want || raw.replace(/^prop:/, "") === want;
    });
  }

  function fmtMod(mod) {
    const n = Number(mod) || 0;
    return (n >= 0 ? `+${n}` : String(n));
  }

  function pickCastingAbility(character){
    const explicit = String(character?.spellcastingAbility || '').toUpperCase();
    if (explicit === 'INT' || explicit === 'WIS' || explicit === 'CHA') return explicit;
    const cls = String(character.class||'').toLowerCase();
    if (cls==='artificer' || cls==='wizard') return 'INT';
    if (cls==='cleric' || cls==='druid' || cls==='ranger' || cls==='monk') return 'WIS';
    if (cls==='bard' || cls==='sorcerer' || cls==='warlock' || cls==='paladin') return 'CHA';
    const build = String(character?.build || '').toLowerCase();
    if (cls === 'rogue' && build.includes('arcane trickster')) return 'INT';
    if (cls === 'fighter' && build.includes('eldritch knight')) return 'INT';
    return null;
  }

  function abilityFullName(abbr){
    if (!abbr) return '';
    const m = {INT:'Intelligence', WIS:'Wisdom', CHA:'Charisma'};
    return m[abbr] || abbr;
  }

  // Highest spell level by class level (single-class only)
  function _fullCasterMax(level){
    const map = [0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,9,9];
    return map[Math.max(0, Math.min(20, level))];
  }

  function _halfCasterMax(level){
    if (level <= 1) return 0; if (level <= 4) return 1; if (level <= 8) return 2;
    if (level <= 12) return 3; if (level <= 16) return 4; return 5;
  }

  function _thirdCasterMax(level){
    if (level <= 2) return 0; if (level <= 6) return 1; if (level <= 12) return 2;
    if (level <= 18) return 3; return 4;
  }

  function _warlockPactMax(level){
    if (level <= 2) return 1; if (level <= 4) return 2; if (level <= 6) return 3;
    if (level <= 8) return 4; return 5;
  }

  function getMaxSpellLevelFor(character){
    const cls = String(character?.class||'').toLowerCase();
    const L = Number(character?.level)||1;
    if (['cleric','druid','wizard','bard','sorcerer'].includes(cls)) return _fullCasterMax(L);
    if (cls === 'artificer') return Math.max(1, _halfCasterMax(L));
    if (['paladin','ranger'].includes(cls)) return _halfCasterMax(L);
    if (cls === 'warlock') return _warlockPactMax(L);
    if (cls === 'fighter-eldritch knight' || cls === 'rogue-arcane trickster') return _thirdCasterMax(L);
    return 0;
  }

  function computeSpellStats(character){
    const ab = pickCastingAbility(character);
    if (!ab) return null;
    const score = getEffectiveAbilityScore(character, ab);
    const mod = abilityMod(score);
    const pb  = proficiencyFromLevel(Number(character?.level) || 1);
    let bonusAtk = (Number(character?.spellAttackBonusMod) || 0);
    // Enhanced Arcane Focus: +1 to spell attack rolls while using the infused focus.
    // Table approximation: apply when the character owns an active Enhanced Arcane Focus infusion.
    try {
      const allInfusions = (typeof window.readAllActiveInfusions === 'function') ? window.readAllActiveInfusions() : [];
      const mine = allInfusions.filter(inf =>
        String(inf?.name || '').toLowerCase() === 'enhanced arcane focus'
        && String(inf?.owner || '') === String(character?.name || '')
      );
      if (mine.length > 0) bonusAtk += 1;
    } catch (_) { /* no-op */ }
    const atk = pb + mod + bonusAtk;
    const dc  = 8 + pb + mod + (Number(character?.spellSaveDCMod) || 0);
    return { ab, mod, pb, atk, dc };
  }

  function clericPreparedCapacity(character) {
    const L = Number(character?.level)||1;
    const wis = getEffectiveAbilityScore(character, 'WIS');
    const wisMod = abilityMod(wis);
    return Math.max(1, L + wisMod);
  }

  function getAbilityCheckBonus(character, ability, skillName){
    const ab = String(ability || '').trim().toUpperCase();
    const lvl = Number(character?.level || 1);
    const build = String(character?.build || '').toLowerCase();
    const out = { bonus: 0, sources: [] };
    if (!ab) return out;

    // Fey Wanderer 3: Otherworldly Glamour
    // Applies to all Charisma checks (skill-based or raw checks).
    if (ab === 'CHA' && lvl >= 3 && build.includes('fey wanderer')) {
      const wis = getEffectiveAbilityScore(character, 'WIS');
      const wisMod = abilityMod(wis);
      const bonus = Math.max(1, wisMod);
      out.bonus += bonus;
      const skillPart = skillName ? ` (${skillName})` : '';
      out.sources.push(`Otherworldly Glamour${skillPart}: +WIS mod (min +1) = ${fmtMod(bonus)}`);
    }

    return out;
  }

  function attunedQtyForItem(character, itemName){
    const want = String(itemName || '').trim().toLowerCase();
    if (!want) return 0;
    const gear = Array.isArray(character?.equipment?.gear) ? character.equipment.gear : [];
    let total = 0;
    for (const it of gear) {
      if (String(it?.name || '').trim().toLowerCase() !== want) continue;
      const qty = Math.max(1, Number(it?.qty || 1));
      const attunedQty = Math.max(0, Number(it?.attuned_qty ?? (it?.attuned ? 1 : 0)) || 0);
      total += Math.min(qty, attunedQty);
    }
    return total;
  }

  function gearEntriesByName(character, itemName){
    const want = String(itemName || '').trim().toLowerCase();
    if (!want) return [];
    const gear = Array.isArray(character?.equipment?.gear) ? character.equipment.gear : [];
    return gear.filter(it => String(it?.name || '').trim().toLowerCase() === want);
  }

  function activeInfusionsForOwner(character){
    const all = (typeof window.readAllActiveInfusions === 'function') ? window.readAllActiveInfusions() : [];
    const owner = String(character?.name || '').trim();
    return (Array.isArray(all) ? all : []).filter(inf => String(inf?.owner || '').trim() === owner);
  }

  function getEffectiveAbilityScore(character, ability){
    const ab = String(ability || '').trim().toUpperCase();
    if (!ab) return 10;
    const base = Number(character?.abilities?.[ab] ?? character?.abilities?.[ab.toLowerCase()] ?? 10) || 10;
    let effective = base;
    try {
      const mine = activeInfusionsForOwner(character);
      for (const inf of mine) {
        const infName = String(inf?.name || '').trim().toLowerCase();
        const itemName = String(inf?.item || '').trim();
        const isAttuned = itemName ? (attunedQtyForItem(character, itemName) > 0) : false;
        const slots = itemName
          ? gearEntriesByName(character, itemName).map(it => String(it?.equip_slot || '').trim().toLowerCase())
          : [];
        const hasSlot = (slot) => slots.includes(String(slot || '').trim().toLowerCase());
        if (infName === 'replicate magic item (amulet of health)' && ab === 'CON' && isAttuned && hasSlot('amulet')) {
          effective = Math.max(effective, 19);
        }
        if (infName === 'replicate magic item (belt of hill giant strength)' && ab === 'STR' && isAttuned && hasSlot('belt')) {
          effective = Math.max(effective, 21);
        }
      }
    } catch (_) { /* no-op */ }
    return effective;
  }

  function getEffectiveAbilities(character){
    const out = {};
    for (const ab of ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']) {
      out[ab] = getEffectiveAbilityScore(character, ab);
    }
    return out;
  }

  exports.DDRules = {
    abilityMod,
    proficiencyFromLevel,
    fmtMod,
    propHas,
    slotsFor,
    pickCastingAbility,
    abilityFullName,
    getMaxSpellLevelFor,
    computeSpellStats,
    clericPreparedCapacity,
    getAbilityCheckBonus,
    getEffectiveAbilityScore,
    getEffectiveAbilities
  };

})(window);
