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

  function slotsFor(cls, level){
    const C = String(cls || '').trim().toLowerCase();
    const L = Number(level) || 1;

    // Full Casters
    if (['bard', 'cleric', 'druid', 'sorcerer', 'wizard'].includes(C)) {
      return FULL[L] || {};
    } 
    // Half Casters
    else if (['artificer', 'paladin', 'ranger'].includes(C)) {
      return HALF[L] || {};
    }
    
    return {}; // Non-casters or other types (Warlock, etc.)
  }

  function propHas(w, key) {
    return (w?.properties || []).some(
      p => String(p.index || p.name).toLowerCase() === String(key).toLowerCase()
    );
  }

  function fmtMod(mod) {
    const n = Number(mod) || 0;
    return (n >= 0 ? `+${n}` : String(n));
  }

  function pickCastingAbility(character){
    const cls = String(character.class||'').toLowerCase();
    if (cls==='artificer' || cls==='wizard') return 'INT';
    if (cls==='cleric' || cls==='druid' || cls==='ranger' || cls==='monk') return 'WIS';
    if (cls==='bard' || cls==='sorcerer' || cls==='warlock' || cls==='paladin') return 'CHA';
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
    if (['paladin','ranger','artificer'].includes(cls)) return _halfCasterMax(L);
    if (cls === 'warlock') return _warlockPactMax(L);
    if (cls === 'fighter-eldritch knight' || cls === 'rogue-arcane trickster') return _thirdCasterMax(L);
    return 0;
  }

  function computeSpellStats(character){
    const ab = pickCastingAbility(character);
    if (!ab) return null;
    const score = Number(character?.abilities?.[ab] ?? character?.abilities?.[ab.toLowerCase()]) || 10;
    const mod = abilityMod(score);
    const pb  = proficiencyFromLevel(Number(character?.level) || 1);
    const atk = pb + mod + (Number(character?.spellAttackBonusMod) || 0);
    const dc  = 8 + pb + mod + (Number(character?.spellSaveDCMod) || 0);
    return { ab, mod, pb, atk, dc };
  }

  function clericPreparedCapacity(character) {
    const L = Number(character?.level)||1;
    const wis = Number(character?.abilities?.WIS ?? character?.abilities?.Wis ?? character?.abilities?.wis ?? 10);
    const wisMod = abilityMod(wis);
    return Math.max(1, L + wisMod);
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
    clericPreparedCapacity
  };

})(window);