// glue.js — bridges page expectations with shared code

// 1) Pick some equipped weapons if the character file doesn't list any
window.getEquippedWeapons = window.getEquippedWeapons || function getEquippedWeapons(c = {}) {
  // explicit wins if present in the character JSON
  if (Array.isArray(c.weapons) && c.weapons.length) return c.weapons.slice();
  if (Array.isArray(c.equipment?.weapons) && c.equipment.weapons.length) return c.equipment.weapons.slice();

  const cls = String(c.class || '').toLowerCase();
  // super‑simple defaults so the sheet has *something* to render
  if (cls === 'monk')       return ['Shortsword'];                 // plus Unarmed is added separately
  if (cls === 'barbarian')  return ['Greataxe'];
  if (cls === 'ranger')     return ['Longbow', 'Shortsword'];
  if (cls === 'artificer')  return ['Light Crossbow'];
  if (cls === 'cleric')     return ['Mace'];
  if (cls === 'druid')      return ['Quarterstaff'];
  return ['Dagger'];
};

// 2) Weapon attack bonus used by chooseMainAttack()
//    (lightweight wrapper around your equipment + ability/proficiency logic)
window.weaponAttackBonus = window.weaponAttackBonus || async function weaponAttackBonus(c = {}, name) {
  const item = await getEquipmentByName(name);
  if (!item) return { value: 0, label: String(name || 'Weapon'), ability: 'STR', pb: 0, mod: 0, proficient: false };

  // ability choice (matches computeItemAttack in sheet file)
  const finesse   = (item.properties || []).some(p => /finesse/i.test(p.index || p.name));
  const thrown    = (item.properties || []).some(p => /thrown/i.test(p.index || p.name));
  const isRanged  = String(item.weapon_range || '').toLowerCase() === 'ranged';

  const abilMod = (() => {
    const A = c.abilities || {};
    const STRm = Math.floor(((A.STR ?? A.str ?? 10) - 10) / 2);
    const DEXm = Math.floor(((A.DEX ?? A.dex ?? 10) - 10) / 2);
    if (finesse) return (DEXm >= STRm) ? DEXm : STRm;
    if (isRanged && !thrown) return DEXm;
    return STRm;
  })();

  const pb = (typeof window.proficiencyBonus === 'function')
    ? window.proficiencyBonus(c.level)
    : (2 + Math.floor(Math.max(1, Number(c.level || 1)) - 1) / 4);

  // Very permissive proficiency (tweak later if you want stricter rules)
  const proficient = true;

  const magicAtk = Number(item.attack_bonus ?? item.magic_bonus ?? 0);
  const value = abilMod + (proficient ? pb : 0) + magicAtk;
  const label = item.name || String(name);

  return {
    value,
    label,
    ability: (isRanged || finesse) ? 'DEX' : 'STR',
    pb,
    mod: abilMod,
    proficient
  };
};

// 3) Spell attack bonus fallback (used by chooseMainAttack and cannons helper)
window.spellAttackBonus = window.spellAttackBonus || function spellAttackBonus(c = {}) {
  const cls = String(c.class || '').toLowerCase();
  let abil = null;
  if (['cleric','druid','ranger','monk'].includes(cls)) abil = 'WIS';
  else if (['artificer','wizard'].includes(cls))        abil = 'INT';
  else if (['sorcerer','warlock','bard','paladin'].includes(cls)) abil = 'CHA';
  if (!abil) return null;

  const score = Number(c.abilities?.[abil] ?? c.abilities?.[abil.toLowerCase()] ?? 10);
  const mod   = Math.floor((score - 10) / 2);
  const pb    = (typeof window.proficiencyBonus === 'function')
    ? window.proficiencyBonus(c.level)
    : (2 + Math.floor(Math.max(1, Number(c.level || 1)) - 1) / 4);

  return { value: mod + pb, label: `${abil} spell attack`, ability: abil, pb, mod, proficient: true, kind: 'spell' };
};
