// dom.js — tiny, shared DOM helpers

export const qs  = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** Update one URLSearchParam without reloading (e.g., ?char=psalm.json) */
export function setURLParam(key, val) {
  const url = new URL(window.location.href);
  if (val != null && val !== "") url.searchParams.set(key, String(val));
  else url.searchParams.delete(key);
  window.history.replaceState({}, "", url);
}

/** Optional niceties: */
export const on  = (el, type, fn, opts) => el && el.addEventListener(type, fn, opts);
export const off = (el, type, fn, opts) => el && el.removeEventListener(type, fn, opts);

/** Shorthand aliases if you like the $ style */
export const $  = qs;
export const $$ = qsa;

function computeSpellSaveDC(character) {
  const pb = proficiencyFromLevel(character.level);

  // Decide which ability drives DC
  const cls  = String(character.class||'').toLowerCase();
  const race = String(character.race||'').toLowerCase();
  let abil = null;

  if (['cleric','druid','ranger','monk'].includes(cls)) abil = 'WIS';
  else if (['artificer','wizard'].includes(cls)) abil = 'INT';
  else if (['sorcerer','warlock','bard','paladin'].includes(cls)) abil = 'CHA';
  else if (cls === 'barbarian') {
    // racial/innate spellcasting (e.g., tiefling Infernal Legacy)
    if (race.includes('tiefling')) abil = 'CHA';
  }
  // also handle other innate cases (e.g., dragonborn breath uses CON, but that’s not a Spell Save DC)

  if (!abil) return null;

  const score = Number(character.abilities?.[abil] ?? character.abilities?.[abil.toLowerCase()] ?? 10);
  const mod   = Math.floor((score - 10) / 2);
  const dc    = 8 + pb + mod;

  return {
    value: dc,
    breakdown: `8 + PB (${pb}) + ${abil} mod (${mod >= 0 ? '+' : ''}${mod})`
  };
}