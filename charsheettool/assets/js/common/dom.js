// dom.js — tiny, shared DOM helpers (no modules; attaches to window)

// Lightweight selectors (functions so they can be hoisted & re-used across files)
function qs(sel, root = document)  { return root.querySelector(sel); }
function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

// Expose as globals for other non‑module scripts
window.qs  = window.qs  || qs;
window.qsa = window.qsa || qsa;

// jQuery-style shorthands (don’t overwrite if something else already defined them)
function $_(sel, root = document)  { return qs(sel, root); }
function $$_(sel, root = document) { return qsa(sel, root); }
window.$  = window.$  || $_;
window.$$ = window.$$ || $$_;

// URL param helper
function setURLParam(key, val) {
  const url = new URL(window.location.href);
  if (val != null && val !== "") url.searchParams.set(key, String(val));
  else url.searchParams.delete(key);
  window.history.replaceState({}, "", url);
}

// Optional niceties:
const on  = (el, type, fn, opts) => el && el.addEventListener(type, fn, opts);
const off = (el, type, fn, opts) => el && el.removeEventListener(type, fn, opts);

// Spell DC helper kept here so it’s globally available
function _proficiencyFromLevel(level) {
  const L = Math.max(1, Number(level || 1));
  return 2 + Math.floor((L - 1) / 4);
}
function computeSpellSaveDC(character) {
  const pb = _proficiencyFromLevel(character.level);
  const cls  = String(character.class || "").toLowerCase();
  const race = String(character.race  || "").toLowerCase();
  let abil = null;

  if (["cleric", "druid", "ranger", "monk"].includes(cls)) abil = "WIS";
  else if (["artificer", "wizard"].includes(cls)) abil = "INT";
  else if (["sorcerer", "warlock", "bard", "paladin"].includes(cls)) abil = "CHA";
  else if (cls === "barbarian") {
    if (race.includes("tiefling")) abil = "CHA";
  }
  if (!abil) return null;

  const score = Number(
    character.abilities?.[abil] ?? character.abilities?.[abil.toLowerCase()] ?? 10
  );
  const mod = Math.floor((score - 10) / 2);
  const dc  = 8 + pb + mod;

  return {
    value: dc,
    breakdown: `8 + PB (${pb}) + ${abil} mod (${mod >= 0 ? "+" : ""}${mod})`,
  };
}

// Attach a neat bundle (optional)
window.Dom = Object.freeze({
  qs, qsa, setURLParam, on, off, $: window.$, $$: window.$$,
  computeSpellSaveDC
});
