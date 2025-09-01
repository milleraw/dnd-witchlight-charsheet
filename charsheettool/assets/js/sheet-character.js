// sheet-character-clean2.js

// --- DOM Element Shortcuts (page-specific) ---
// A minimal F object for the functions we are defining.
const F = {
  classBox:       () => document.querySelector('#field-class'),
  levelBox:       () => document.querySelector('#field-level'),
  build:          () => document.querySelector('#field-build'),
  eyesHair:       () => document.querySelector('#field-eyeshair'),
  gender:         () => document.querySelector('#field-gender'),
  playerName:     () => document.querySelector('#field-playername'),
  alignment:      () => document.querySelector('#field-alignment'),
  proficiency:    () => document.querySelector('#field-proficiency'),
  raceBox:        () => document.querySelector("#field-race"),
  raceTextPath:   () => document.querySelector("#race-tp"),
  raceTextEl:     () => document.querySelector("#race-text"),
  racePathEl:     () => document.querySelector("#race-curve"),
  bgBox:          () => document.querySelector("#field-background"),
  bgTextPath:     () => document.querySelector("#background-tp"),
  bgTextEl:       () => document.querySelector("#background-text"),
  bgPathEl:       () => document.querySelector("#background-curve"),
  abil: (abbr, kind) => document.querySelector(`#field-${abbr}-${kind}`),
  ac:             () => document.querySelector("#field-ac"),
  armorName:      () => document.querySelector("#field-armor-name"),
  initiative:     () => document.querySelector("#field-initiative"),
  passivePerception: () => document.querySelector("#field-passive-perception"),
  spellSaveDC:       () => document.querySelector("#field-spellsavedc"),
  speed:             () => document.querySelector("#field-speed"),
  attackbonus:       () => document.querySelector("#field-attackbonus"),
  attacks:           () => document.querySelector("#field-attacks"),
  gear:              () => document.querySelector("#field-gear"),
  currency:          () => document.querySelector("#field-currency"),
  languages:         () => document.querySelector("#field-languages"),
  proficiencies:     () => document.querySelector("#field-proficiencies"),
  features:          () => document.querySelector("#field-features"),
  maxHP:             () => document.querySelector("#field-maxhp"),
  currentHP:         () => document.querySelector("#field-currenthp"),
  tempHP:            () => document.querySelector("#field-temphp"),
  hitDie:            () => document.querySelector("#field-hitdie"),
  hpMinus:           () => document.querySelector("#hp-minus"),
  hpPlus:            () => document.querySelector("#hp-plus"),
  tempGrant:         () => document.querySelector("#temp-grant"),
  tempClear:         () => document.querySelector("#temp-clear"),
};
window.F = window.F || F; // Expose for other scripts if needed

// --- Renderers for Simple Fields ---

function renderRace(raceName) {
  const textEl = F.raceTextEl();
  const pathEl = F.racePathEl();
  const box    = F.raceBox();
  if (!textEl || !pathEl || !box) return;
  textEl.querySelector('textPath').textContent = String(raceName || '').trim();
  if (window.NameCurves?.growFitTextToPath) {
    window.NameCurves.growFitTextToPath(textEl, pathEl, (box.clientHeight || 60) * 0.90, 16, 8);
  }
}

function renderBackground(bgName) {
  const textEl = F.bgTextEl();
  const pathEl = F.bgPathEl();
  const box    = F.bgBox();
  if (!textEl || !pathEl || !box) return;
  textEl.querySelector('textPath').textContent = String(bgName || '').trim();
  if (window.NameCurves?.growFitTextToPath) {
    window.NameCurves.growFitTextToPath(textEl, pathEl, (box.clientHeight || 60) * 0.90, 16, 8);
  }
}

function renderProficiency(character) {
  const box = F.proficiency && F.proficiency();
  if (!box) return;
  const pb = window.DDRules.proficiencyFromLevel(character?.level);
  const text = (pb >= 0 ? '+' : '') + pb;
  box.classList.add('tooltip');
  box.dataset.tooltip = `Proficiency Bonus\nLevel ${character?.level ?? '?'} → ${text}`;
  window.autoFit(box, text, { max: 22, min: 10, className: 'base-text', centerAbsolute: true });
}

// This is the function the boot script is looking for.
function renderSimpleFields(character) {
  if (character?.name && window.NameCurves?.renderTwoArcName) {
    window.NameCurves.renderTwoArcName(F, character.name);
  }
  renderProficiency(character);

  // Class & Level
  window.autoFit(F.classBox(), (character.class || ''), { max: 40, min: 12, letterSpacing: -0.2, fontFamily: 'var(--font-display)' });
  window.autoFit(F.levelBox(), String(character.level ?? ''), { max: 24, min: 10, className: 'base-text', fontFamily: 'var(--font-body)' });

  // Other simple fields
  window.autoFit(F.build(), character.build ?? '', { max: 22, min: 10, letterSpacing: -0.1, fontFamily: 'var(--font-display)' });
  window.autoFit(F.eyesHair(), character.eyes_hair ?? '', { max: 18, min: 9, letterSpacing: -0.1, fontFamily: 'var(--font-display)' });
  window.autoFit(F.gender(), character.gender ?? '', { max: 18, min: 9, letterSpacing: -0.1, fontFamily: 'var(--font-display)' });
  window.autoFit(F.playerName(), character.player_name ?? '', { max: 18, min: 9, letterSpacing: -0.1, fontFamily: 'var(--font-display)' });
  window.autoFit(F.alignment(), character.alignment ?? '', { max: 18, min: 9, letterSpacing: -0.1, fontFamily: 'var(--font-display)' });

  // Race & Background
  const raceInfo = window.resolveRaceAlias(character); // from storage.cleaned.js
  renderRace(raceInfo.displayName);
  renderBackground(character.background);
}

// --- Rules Helpers ---
function abilityMod(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return 0;
  return Math.floor((n - 10) / 2);
}
function fmtMod(mod) {
  const n = Number(mod) || 0;
  return (n >= 0 ? `+${n}` : String(n));
}

// --- Renderer for Ability Scores ---
function renderAbilityFields(character, state = {}, conditionEffects = {}) {
  const A = character.abilities || {};
  const abilities = {
    cha: Number(A.CHA ?? A.cha ?? 10),
    wis: Number(A.WIS ?? A.wis ?? 10),
    int: Number(A.INT ?? A.int ?? 10),
    dex: Number(A.DEX ?? A.dex ?? 10),
    str: Number(A.STR ?? A.str ?? 10),
    con: Number(A.CON ?? A.con ?? 10),
  };

  const isRaging = !!state.isRaging;
   const effects = conditionEffects || { saveDisadvantage: {}, saveAutoFail: {} };


  for (const [abbr, score] of Object.entries(abilities)) {
    const baseEl = F.abil(abbr, 'base');
    const modEl = F.abil(abbr, 'mod');
    const upperAbbr = abbr.toUpperCase();

    // Reset styles
    baseEl.classList.remove('raging-stat', 'has-disadvantage');
    modEl.classList.remove('raging-stat', 'has-disadvantage');
    baseEl.classList.remove('tooltip');
    modEl.classList.remove('tooltip');
    if (baseEl.dataset.tooltip) delete baseEl.dataset.tooltip;
    if (modEl.dataset.tooltip) delete modEl.dataset.tooltip;

    window.autoFit(baseEl, String(score), { max: 22, min: 10, className: 'base-text', centerAbsolute: true });
    window.autoFit(modEl, fmtMod(abilityMod(score)), { max: 20, min: 10, className: 'base-text', centerAbsolute: true });

     if (isRaging && upperAbbr === 'STR') {
      baseEl.classList.add('raging-stat');
      modEl.classList.add('raging-stat');
      baseEl.classList.add('tooltip');
      baseEl.dataset.tooltip = "Advantage on Strength Checks & Saves (Rage)";
    
    }
      // Apply condition styles
    const tooltips = [];
    if (effects.abilityCheckDisadvantage) {
        modEl.classList.add('has-disadvantage');
        tooltips.push(`Disadvantage on ${upperAbbr} checks from ${effects.abilityCheckDisadvantage}.`);
    }
    if (effects.saveDisadvantage[upperAbbr]) {
        modEl.classList.add('has-disadvantage');
        tooltips.push(`Disadvantage on ${upperAbbr} saves from ${effects.saveDisadvantage[upperAbbr]}.`);
    }
    if (effects.saveAutoFail[upperAbbr]) {
        modEl.classList.add('has-disadvantage');
        tooltips.push(`Auto-fail ${upperAbbr} saves from ${effects.saveAutoFail[upperAbbr]}.`);
    }

    if (tooltips.length > 0) {
        modEl.classList.add('tooltip');
        modEl.dataset.tooltip = tooltips.join('\n');
    }
  }
}

function dexModFromChar(c) {
  const A = c.abilities || {};
  const dex = Number(A.DEX ?? A.dex ?? 10);
  return abilityMod(dex);
}

async function calculateAC(character) {
  const cls = String(character.class || "").trim().toLowerCase();
  const A   = character.abilities || {};
  const dex = dexModFromChar(character);

  const armorList = Array.isArray(character.armor)
    ? character.armor
    : (character.armor ? [character.armor] : []);
  const lower = armorList.map(n => String(n).toLowerCase());
  const hasShield = lower.some(n => n.includes("shield"));

  const finish = (ac, label, parts) => ({ ac, armorName: label, breakdown: parts.join("\n") });

  const armorNameRaw = armorList.find(n => !String(n).toLowerCase().includes("shield"));
  const shieldName = armorList.find(n => String(n).toLowerCase().includes("shield"));
  const info = armorNameRaw ? await window.getArmorInfoByName(armorNameRaw) : null;

  const shieldBonus = hasShield ? 2 : 0;

  // --- Infusion Check ---
  const allInfusions = window.readAllActiveInfusions ? window.readAllActiveInfusions() : [];
  let infusionBonus = 0;
  const infusionParts = [];

  const armorInfusion = allInfusions.find(inf => inf.name === 'Enhanced Defense' && inf.owner === character.name && inf.item === armorNameRaw);
  if (armorInfusion && armorInfusion.bonus) {
    infusionBonus += armorInfusion.bonus;
    infusionParts.push(`Infusion (Armor): +${armorInfusion.bonus}`);
  }
  const shieldInfusion = allInfusions.find(inf => inf.name === 'Enhanced Defense' && inf.owner === character.name && inf.item === shieldName);
  if (shieldInfusion && shieldInfusion.bonus) {
    infusionBonus += shieldInfusion.bonus;
    infusionParts.push(`Infusion (Shield): +${shieldInfusion.bonus}`);
  }

  if (!info) { // Unarmored or only a shield
    const base = cls === "monk" ? 10 + dex + abilityMod(A.WIS ?? A.wis ?? 10)
               : cls === "barbarian" ? 10 + dex + abilityMod(A.CON ?? A.con ?? 10)
               : 10 + dex;
    const parts = [
      cls === "monk" ? `Unarmored Defense (Monk): 10 + Dex (${fmtMod(dex)}) + Wis (${fmtMod(abilityMod(A.WIS ?? A.wis ?? 10))})`
      : cls === "barbarian" ? `Unarmored Defense (Barbarian): 10 + Dex (${fmtMod(dex)}) + Con (${fmtMod(abilityMod(A.CON ?? A.con ?? 10))})`
      : `Unarmored: 10 + Dex (${fmtMod(dex)})`
    ];
    if (hasShield) parts.push('Shield: +2');
    if (infusionBonus > 0) parts.push(...infusionParts);
    return finish(base + shieldBonus + infusionBonus, hasShield ? "Unarmored + Shield" : "Unarmored", parts);
  }

  let total = info.baseAC;
  const parts = [`${info.name || armorNameRaw}: ${info.baseAC}`];
  if (info.dexBonus) {
    const used = info.maxDex == null ? dex : Math.min(dex, info.maxDex);
    total += used;
    parts.push(`Dex Mod${info.maxDex != null ? ` (cap ${info.maxDex})` : ''}: ${fmtMod(used)}`);
  }
  if (hasShield) { total += shieldBonus; parts.push(`Shield: +2`); }
  if (infusionBonus > 0) { total += infusionBonus; parts.push(...infusionParts); }

  const label = hasShield ? `${info.name || armorNameRaw} + Shield` : (info.name || armorNameRaw);
  return finish(total, label, parts);
}

async function renderArmorAndAC(character) {
  const { ac, armorName, breakdown } = await calculateAC(character);
  window.autoFit(F.armorName(), armorName || '', { max: 14, min: 8, className: 'base-text', wrap: true, lineHeight: 1.1 });
  const acEl = F.ac();
  acEl.classList.add('tooltip');
  acEl.dataset.tooltip = breakdown;
  window.autoFit(acEl, String(ac), { max: 20, min: 10, className: 'base-text', centerAbsolute: true });
}

function computeInitiative(character) {
  const A = character.abilities || {};
  const pb = window.DDRules.proficiencyFromLevel(character.level);
  const dex = abilityMod(A.DEX ?? A.dex ?? 10);

  let bonus = 0;
  const breakdownParts = [`Dex: ${fmtMod(dex)}`];

  if (Array.isArray(character.feats) && character.feats.some(f => String(f).toLowerCase() === 'alert')) {
    bonus += 5;
    breakdownParts.push('Alert feat: +5');
  }
  if (character.add_cha_to_initiative) {
    const chaMod = abilityMod(A.CHA ?? A.cha ?? 10);
    bonus += chaMod;
    breakdownParts.push(`Bonus (CHA): ${fmtMod(chaMod)}`);
  }
  if (typeof character.initiative_bonus === 'number') {
    bonus += character.initiative_bonus;
    breakdownParts.push(`Bonus (Misc): ${fmtMod(character.initiative_bonus)}`);
  }
  if (String(character.race || '').toLowerCase() === 'harengon') {
    bonus += pb;
    breakdownParts.push(`Hare-Trigger (PB): +${pb}`);
  }

  return { value: dex + bonus, breakdown: breakdownParts.join('\n') };
}

function renderInitiative(character) {
  const { value, breakdown } = computeInitiative(character);
  const initEl = F.initiative();
  window.autoFit(initEl, fmtMod(value), { max: 22, min: 10, className: 'base-text', centerAbsolute: true });
  initEl.classList.add('tooltip');
  initEl.dataset.tooltip = `Initiative\n${breakdown}`;
}

function hasNamedFeature(character, name){
  const needle = String(name).toLowerCase();
  const pool = (character.features || []).concat(character.feats || []);
  return pool.some(f => String(f.name || f).toLowerCase().includes(needle));
}

async function getPerceptionModifier(character){
  const wisMod = abilityMod(character?.abilities?.WIS ?? 10);
  const pb = window.DDRules.proficiencyFromLevel(character.level || 1);

  // Determine proficiency / expertise / half-prof
  let profLevel = 0; // 0=none, 0.5=half, 1=prof, 2=expertise
  const skills = character.skills || {};
  const s = skills.Perception ?? skills.perception ?? null;
  if (s === 'expertise' || s === 2 || s === '2') profLevel = 2;
  else if (s || s === 1 || s === '1' || (character.proficiencies?.skills || []).includes('Perception')) profLevel = 1;
  else if (hasNamedFeature(character, 'Jack of All Trades')) profLevel = 0.5;

  const misc =
    (hasNamedFeature(character, 'Observant') ? 5 : 0) +
    Number(character.bonusPassivePerception || 0);

  return wisMod + Math.floor(pb * profLevel) + misc;
}

async function calculatePassivePerception(character, conditionEffects = {}){
  const percMod = await getPerceptionModifier(character);
  let value = 10 + percMod;
  const breakdown = [`Base: 10`, `Perception Bonus: ${fmtMod(percMod)}`];

  const penalty = conditionEffects.passivePerceptionPenalty || 0;
  if (penalty !== 0) {
    value += penalty;
    breakdown.push(`Condition Penalty: ${penalty}`);
  }

  return { value, tooltip: `Passive Perception\n${breakdown.join('\n')}` };
}

async function renderPassivePerception(character, conditionEffects = {}) {
  const { value, tooltip } = await calculatePassivePerception(character, conditionEffects);
  const el = F.passivePerception();
  el.classList.add('tooltip');
  el.dataset.tooltip = tooltip;
  window.autoFit(el, String(value), { max: 22, min: 10, className: 'base-text', centerAbsolute: true });
}

function computeSpellSaveDC(character) {
  const pb = window.DDRules.proficiencyFromLevel(character.level);
  const cls  = String(character.class || "").toLowerCase();
  const race = String(character.race  || "").toLowerCase();
  let abil = null;

  if (["cleric", "druid", "ranger", "monk"].includes(cls)) abil = "WIS";
  else if (["artificer", "wizard"].includes(cls)) abil = "INT";
  else if (["sorcerer", "warlock", "bard", "paladin"].includes(cls)) abil = "CHA";
  else if (cls === "barbarian" && race.includes("tiefling")) abil = "CHA";

  if (!abil) return null;

  const score = Number(character.abilities?.[abil] ?? character.abilities?.[abil.toLowerCase()] ?? 10);
  const mod = abilityMod(score);
  const dc  = 8 + pb + mod;

  return { value: dc, breakdown: `8 + PB (${pb}) + ${abil} mod (${fmtMod(mod)})` };
}

function renderSpellSaveDC(character) {
  const out = computeSpellSaveDC(character);
  const box = F.spellSaveDC();
  if (!box) return;
  if (!out) { box.innerHTML = ''; return; }
  window.autoFit(box, String(out.value), { max: 22, min: 10, className: 'base-text', centerAbsolute: true });
  box.classList.add('tooltip');
  box.dataset.tooltip = `Spell Save DC\n${out.breakdown}`;
}

// --- Speed Calculation ---

function monkUnarmoredBonus(level) {
  if (level >= 18) return 30;
  if (level >= 14) return 25;
  if (level >= 10) return 20;
  if (level >= 6)  return 15;
  if (level >= 2)  return 10;
  return 0;
}

function isWearingArmor(armor) {
  return Boolean(armor && (armor.category || armor.type));
}

function isHeavyArmor(armor) {
  return Boolean(armor && /heavy/i.test(armor.category || armor.type || ''));
}

function safeArmorCtx(ctx) {
  return ctx && typeof ctx === 'object'
    ? { armor: ctx.armor || null, shield: !!ctx.shield }
    : { armor: null, shield: false };
}

async function calculateSpeed(character, armorCtxOpt = null) {
  // Check for conditions that reduce speed to 0
  const activeConditions = new Set(window.readConditionState(character));
  const speedZeroConditions = ['Grappled', 'Paralyzed', 'Petrified', 'Restrained', 'Stunned', 'Unconscious'];
  for (const cond of speedZeroConditions) {
    if (activeConditions.has(cond)) {
      return {
        total: 0,
        breakdown: `Condition (${cond}): Speed is 0`
      };
    }
  }

  const armorCtx = safeArmorCtx(armorCtxOpt);
  const bd = [];

  const { speed: base, src } = await window.getRaceBaseSpeed(character);
  let total = base;
  bd.push(`${src}: ${base}`);

  const cls = (character?.class || '').trim().toLowerCase();
  const lvl = Number(character?.level || 1);

  if (cls === 'monk' && lvl >= 2 && !isWearingArmor(armorCtx.armor) && !armorCtx.shield) {
    const bonus = monkUnarmoredBonus(lvl);
    total += bonus; bd.push(`Monk Unarmored Movement (lvl ${lvl}): +${bonus}`);
  }

  total = Math.max(0, total);
  return { total, breakdown: bd.join('\n') };
}

async function renderSpeed(character) {
  const el = F.speed();
  if (!el) return;
  const { total, breakdown } = await calculateSpeed(character, null);
  el.classList.add('tooltip');
  el.dataset.tooltip = breakdown;
  window.autoFit(el, String(total), { max: 26, min: 12, className: 'base-text', centerAbsolute: true });
}

// --- Special Attack Builders ---

function monkMartialArtsDie(level) {
  const L = Number(level) || 1;
  if (L <= 4) return "1d4";
  if (L <= 10) return "1d6";
  if (L <= 16) return "1d8";
  return "1d10";
}

function buildMonkUnarmed(character) {
  if (String(character.class || '').toLowerCase() !== 'monk') return null;

  const die = monkMartialArtsDie(character.level);
  const best = bestDexOrStr(character);
  const pb = window.DDRules.proficiencyFromLevel(character.level);
  const atk = best.mod + pb;

  const line1 = `Unarmed Strike: ${fmtMod(atk)} to hit`;
  const line2 = `${die}${fmtMod(best.mod)} bludgeoning`;
  const tip = `Unarmed Strike (Monk)\nAbility: ${best.key} (${fmtMod(best.mod)})\nProficiency: +${pb}\nDamage: ${die} bludgeoning + ${best.key} mod`;

  return { name: "Unarmed Strike", value: atk, line1, line2, tooltip: tip, ability: best.key };
}

function buildDragonbornBreath(character) {
  const race = String(character.race || '').toLowerCase();
  if (!race.includes('dragonborn')) return null;

  const ancKey = String(character.draconic_ancestry || character.race_detail?.ancestry || '').toLowerCase();
  const DRAGONBORN_ANCESTRY = {
    bronze: { dmg: "lightning", save: "DEX" },
    // Add other ancestries here as needed
  };
  const anc = DRAGONBORN_ANCESTRY[ancKey];
  if (!anc) return null;

  const pb = window.DDRules.proficiencyFromLevel(character.level);
  const conMod = abilityMod(character?.abilities?.CON ?? 10);
  const dc = 8 + pb + conMod;
  const dice = (level => {
    if (level >= 16) return "5d6";
    if (level >= 11) return "4d6";
    if (level >= 6) return "3d6";
    return "2d6";
  })(character.level);

  const line1 = `Breath Weapon (DC ${dc})`;
  const line2 = `${dice} ${anc.dmg} (${anc.save} save)`;
  const tip = `Dragonborn Breath Weapon (${ancKey})\nSave DC: 8 + CON mod (${fmtMod(conMod)}) + PB (+${pb}) = ${dc}`;

  return { name: "Breath Weapon", value: null, line1, line2, tooltip: tip, ability: null };
}

function buildArtilleristCannons(character) {
  const cls = String(character.class || '').toLowerCase();
  const sub = String(character.build || '').toLowerCase();
  if (cls !== 'artificer' || !sub.includes('artillerist')) return [];

  const pb = window.DDRules.proficiencyFromLevel(character.level);
  const intMod = abilityMod(character?.abilities?.INT ?? 10);
  const dc = 8 + pb + intMod;
  const atk = pb + intMod;
  const damageDice = (character.level || 1) >= 9 ? '3d8' : '2d8';

  return [
    { name: "Eldritch Cannon: Force Ballista", value: atk, ability: "INT", line1: `Force Ballista: ${fmtMod(atk)} to hit`, line2: `${damageDice} force, push 5 ft`, tooltip: `Ranged spell attack using INT. On hit, pushes target 5 ft away.` },
    { name: "Eldritch Cannon: Flamethrower", value: null, ability: null, line1: `Flamethrower (DC ${dc})`, line2: `${damageDice} fire, 15-ft cone (DEX save half)`, tooltip: `15-ft cone. DEX save vs DC ${dc} for half of ${damageDice} fire damage.` },
    { name: "Eldritch Cannon: Protector", value: null, ability: null, line1: `Protector`, line2: `1d8${fmtMod(intMod)} temp HP (10-ft aura)`, tooltip: `Grant 1d8 + INT modifier temporary HP to creatures within 10 ft.` }
  ];
}

// --- Attack Calculation & Rendering ---

function getThrownText(w) {
  const src = w?.throw_range || w?.range || {};
  const n = Number(src.normal);
  const l = Number(src.long);
  if (!Number.isFinite(n) && !Number.isFinite(l)) return null;
  return `${Number.isFinite(n) ? n : '-'}/${Number.isFinite(l) ? l : '-'}`;
}

function weaponTooltip(w) {
  const parts = [];
  if (w?.damage?.damage_dice && w?.damage?.damage_type?.name) {
    parts.push(`${w.damage.damage_dice} ${String(w.damage.damage_type.name).toLowerCase()}`);
  }
  const props = (w.properties || []).map(p => String(p.index || p.name).toLowerCase());
  if (window.DDRules.propHas(w, 'thrown')) {
    const thr = getThrownText(w);
    if (thr) parts.push(`thr ${thr}`);
  }
  if (props.includes('versatile')) parts.push('ver');
  const hasMagic = (w.magic_bonus ?? w.attack_bonus ?? w.damage_bonus) ? true : false;
  if (hasMagic) parts.push(`+${w.magic_bonus ?? w.attack_bonus ?? w.damage_bonus} magic`);
  const summary = parts.join(', ');
  const spec = Array.isArray(w.special) ? w.special.join('\n') : (w.special || '');
  return spec ? (summary ? `${summary}\n\n${spec}` : spec) : summary;
}

function bestDexOrStr(character) {
  const dex = abilityMod(character?.abilities?.DEX ?? character?.abilities?.dex ?? 10);
  const str = abilityMod(character?.abilities?.STR ?? character?.abilities?.str ?? 10);
  return (dex >= str) ? { key: "DEX", mod: dex } : { key: "STR", mod: str };
}

function computeItemAttack(character, equip, state = {}, conditionEffects = {}) {
  const isRanged = String(equip?.weapon_range || "").toLowerCase() === "ranged";
  const finesse = window.DDRules.propHas(equip, "finesse");

  let abilKey = "STR"; // Default for melee weapons
  if (isRanged) {
    abilKey = "DEX"; // Default for ranged weapons
  }
  if (finesse) {
    // Finesse property allows using the better of STR or DEX
    abilKey = bestDexOrStr(character).key;
  }
  const mod = abilityMod(character?.abilities?.[abilKey] ?? character?.abilities?.[abilKey.toLowerCase()] ?? 10);
  const pb = window.DDRules.proficiencyFromLevel(character?.level);
  
  const proficient = true; // Simplified for now
  const magicAtk = Number(equip.attack_bonus ?? equip.magic_bonus ?? 0);
  let toHit = mod + (proficient ? pb : 0) + magicAtk;

  // Check for Archery fighting style
  const hasArchery = (character.traits || []).some(t => String(t.name || t).toLowerCase().includes('archery'));
  if (hasArchery && isRanged) {
    toHit += 2;
  }

  // --- NEW: Check for infusion bonuses ---
  const allInfusions = window.readAllActiveInfusions ? window.readAllActiveInfusions() : [];
  const infusion = allInfusions.find(inf => inf.item === equip.name && inf.owner === character.name);
  let infusionBonus = 0;
  if (infusion && (infusion.name === 'Enhanced Weapon' || infusion.name === 'Returning Weapon') && infusion.bonus) {
    infusionBonus = infusion.bonus;
  }

  const dmgDice = equip?.damage?.damage_dice || "1d4";
  const dmgType = (equip?.damage?.damage_type?.name || "Bludgeoning").toLowerCase();
  const magicDmg = Number(equip.damage_bonus ?? equip.magic_bonus ?? 0);

  const isRaging = !!state.isRaging;
  const isStrMelee = (abilKey === 'STR' && !isRanged);
  const rageDamageBonus = isRaging && isStrMelee ? (character.level >= 16 ? 4 : character.level >= 9 ? 3 : 2) : 0;
  const dmgMod = mod + magicDmg + rageDamageBonus + infusionBonus;

  const finalToHit = toHit + infusionBonus;
  const line1 = `${equip.name}: ${fmtMod(finalToHit)} to hit`;
  let line2 = `${dmgDice}${dmgMod !== 0 ? fmtMod(dmgMod) : ''} ${dmgType}`;
  if (isRaging && isStrMelee) {
    line2 = `<strong class="rage-damage">${line2}</strong>`;
  }

  let tooltip = weaponTooltip(equip);
  if (hasArchery && isRanged) {
    tooltip += `\n\nFighting Style (Archery): +2 to attack rolls`;
  }
  if (infusion) {
    tooltip += `\n\nInfused: ${infusion.name}`;
  }

  // Add disadvantage from conditions
  if (conditionEffects.attackDisadvantage) {
    tooltip += `\n\nDisadvantage from ${conditionEffects.attackDisadvantage} condition.`;
  }

  // Add Dreadful Strikes damage if applicable
  const isFeyWanderer = String(character.build || '').toLowerCase().includes('fey wanderer');
  if (isFeyWanderer && character.level >= 3) {
    const dreadfulDie = (character.level || 1) >= 11 ? '1d6' : '1d4';
    line2 += ` + ${dreadfulDie} psychic`;
    tooltip += `\n\nDreadful Strikes: +${dreadfulDie} psychic damage (once per turn).`;
  }

  // Add Divine Fury tooltip if applicable
  if (isRaging && isStrMelee && String(character.build || '').toLowerCase().includes('zealot')) {
    const divineFuryBonus = Math.floor((character.level || 1) / 2);
    const divineFuryTip = `\n\nDivine Fury: +1d6${fmtMod(divineFuryBonus)} radiant or necrotic damage (if first hit this turn).`;
    tooltip += divineFuryTip;
  }

  return { name: equip.name, value: finalToHit, line1, line2, tooltip, ability: abilKey, isHTML: isRaging && isStrMelee, hasDisadvantage: !!conditionEffects.attackDisadvantage };
}

async function renderAttacks(character, state = {}, conditionEffects = {}) {
  const box = F.attacks();
  if (!box) return;
  box.innerHTML = '';

  const rows = [];

  // Add special, non-weapon attacks first
  const monk = buildMonkUnarmed(character);
  if (monk) rows.push(monk);
  const breath = buildDragonbornBreath(character);
  if (breath) rows.push(breath);
  const cannons = buildArtilleristCannons(character);
  if (cannons.length) rows.push(...cannons);

  const names = window.getEquippedWeapons(character);

  for (const name of names) {
    const item = await window.getEquipmentByName(name);
    if (item) rows.push(computeItemAttack(character, item, state, conditionEffects));
  }

  for (const r of rows) {
    const div = document.createElement('div');
    div.className = 'attack-row tooltip';
    if (r.hasDisadvantage) {
      div.classList.add('has-disadvantage');
    }
    if (r.tooltip) div.setAttribute('data-tooltip', r.tooltip);
    const l1 = document.createElement('div'); l1.className = 'line1 base-text'; l1.textContent = r.line1;
    const l2 = document.createElement('div'); l2.className = 'line2 base-text';
    if (r.isHTML) {
      l2.innerHTML = r.line2;
    } else {
      l2.textContent = r.line2;
    }
    div.appendChild(l1); div.appendChild(l2);
    box.appendChild(div);
  }

  const best = rows.slice().sort((a, b) => (b.value || 0) - (a.value || 0))[0];
  if (best) {
    const abox = F.attackbonus();
    if (abox) {
      abox.classList.add('tooltip');
      abox.dataset.tooltip = `Attack Bonus\n${best.name}\n(${best.ability || '—'})`;
      window.autoFit(abox, fmtMod(best.value), { max: 26, min: 12, className: 'base-text', centerAbsolute: true });
    }
  }
}

// --- Gear Rendering ---
async function renderGear(character) {
  const box = F.gear();
  if (!box) return;
  box.innerHTML = '';

  // Get active infusions to decorate items
  const allInfusions = window.readAllActiveInfusions ? window.readAllActiveInfusions() : [];
  const infusedItems = new Map();
  for (const inf of allInfusions) {
    // Only care about items this character owns
    if (inf.item && inf.owner === character.name) infusedItems.set(inf.item, inf.name);
  }

  // normalizeGearList is from storage.cleaned.js
  const items = window.normalizeGearList(character);

  if (!items.length) {
    const hint = document.createElement('div');
    hint.className = 'row';
    hint.style.opacity = '0.6';
    hint.textContent = '— no gear listed —';
    box.appendChild(hint);
    return;
  }

  // gearTooltipFor is from tooltip.clean.js
  const rows = await Promise.all(items.map(async (it) => {
    const qty = it.qty > 1 ? `${it.qty}× ` : '';
    const label = `${qty}${it.name}`;
    let tt = await window.Tooltips.gearTooltipFor(it);
    let finalLabel = label;
    if (infusedItems.has(it.name)) {
      finalLabel = `⚙️ ${label}`;
      tt += `\n\nInfused: ${infusedItems.get(it.name)}`;
    }
    return { label: finalLabel, tt };
  }));

  rows.forEach((r, i) => {
    if (i > 0) box.appendChild(document.createTextNode(' • '));
    const span = document.createElement('span');
    span.className = 'itm base-text tooltip' + (r.label.startsWith('⚙️') ? ' infused-item' : '');
    span.textContent = r.label;
    if (r.tt) span.setAttribute('data-tooltip', r.tt);
    box.appendChild(span);
  });
}

// --- Currency Rendering ---
function renderCurrency(character) {
  const box = F.currency();
  if (!box) return;
  box.innerHTML = ''; // Clear existing content

  const coins = character.coins || {};
  const order = ['PP', 'GP', 'SP', 'CP'];
  const tips = {
    PP: "Platinum pieces.\n1 pp = 10 gp = 100 sp = 1000 cp",
    GP: "Gold pieces.\n1 gp = 10 sp = 100 cp\n1 pp = 10 gp",
    SP: "Silver pieces.\n10 sp = 1 gp\n1 sp = 10 cp",
    CP: "Copper pieces.\n100 cp = 1 gp\n10 cp = 1 sp"
  };

  for (const abbr of order) {
    const value = Number(coins[abbr.toLowerCase()] || 0);
    const row = document.createElement('div');
    row.className = 'coin-row tooltip'; // The tooltip class is key
    row.setAttribute('data-tooltip', tips[abbr]);

    const lbl = document.createElement('span');
    lbl.className = 'lbl';
    lbl.textContent = `${abbr}:`;

    const val = document.createElement('span');
    val.className = 'val';
    val.textContent = String(value);

    row.appendChild(lbl);
    row.appendChild(val);
    box.appendChild(row);
  }
}

// --- Languages Rendering ---
function renderLanguages(character) {
  const box = F.languages();
  if (!box) return;

  const langs = Array.isArray(character.languages) ? character.languages : [];
  const text = langs.join(', ');

  window.autoFit(box, text, { max: 16, min: 8, className: 'base-text', wrap: true, lineHeight: 1.1, centerAbsolute: true });
}

// --- Other Proficiencies (Armor, Weapons, Tools) ---
async function renderProficiencies(character) {
  const box = F.proficiencies();
  if (!box) return;

  const p = character.proficiencies || {};
  const tools   = Array.isArray(p.tools)   ? p.tools   : [];
  const weapons = Array.isArray(p.weapons) ? p.weapons : [];
  const armor   = Array.isArray(p.armor)   ? p.armor   : [];

  const norm = (arr) => {
    const seen = new Set();
    const out = [];
    for (const v of arr) {
      const s = String(v || '').trim();
      if (!s || seen.has(s.toLowerCase())) continue;
      seen.add(s.toLowerCase());
      out.push(s);
    }
    return out;
  };

  const textParts = [];
  if (norm(armor).length)   textParts.push(`Armor: ${norm(armor).join(", ")}`);
  if (norm(weapons).length) textParts.push(`Weapons: ${norm(weapons).join(", ")}`);
  if (norm(tools).length)   textParts.push(`Tools: ${norm(tools).join(", ")}`);

  window.autoFit(box, textParts.join(" • "), { max: 14, min: 8, className: 'base-text', wrap: true, lineHeight: 1.05, centerAbsolute: true });
}

// --- Features & Traits ---
async function renderFeaturesBox(character) {
  const box = F.features();
  if (!box) return;
  box.innerHTML = '';

  const features = await window.loadAllFeatures(character);

  // De-duplicate features to show specific choices over generic placeholders.
  const suppressedBases = new Set();
  const seenNames = new Set();
  const finalFeatures = [];

  // First pass: find specific features (e.g., "Name: Subtype") and mark their base for suppression.
  for (const f of features) {
    const name = String(f.name || '').trim();
    if (name.includes(':')) {
      const baseName = name.split(':')[0].trim().toLowerCase();
      suppressedBases.add(baseName);
    }
  }

  // Second pass: build the final list, filtering out duplicates and suppressed generic features.
  for (const f of features) {
    const name = String(f.name || '').trim();
    const lowerName = name.toLowerCase();

    if (seenNames.has(lowerName)) continue; // It's a straight duplicate

    // Check if it's a generic version of a feature for which we have a specific choice.
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

  for (const f of finalFeatures) {
    const row = document.createElement('div');
    row.className = 'feature-item base-text tooltip';
    row.textContent = f.name;
    if (f.desc) row.setAttribute('data-tooltip', f.desc);
    box.appendChild(row);
  }
}

// --- Conditions Tracker ---
let __conditions_data = null;
async function loadConditionsData() {
    if (__conditions_data) return __conditions_data;
    try {
        const res = await fetch('./data/conditions.json');
        if (!res.ok) return [];
        __conditions_data = await res.json();
        return __conditions_data;
    } catch {
        return [];
    }
}

async function renderConditionsTracker(character) {
    const box = document.querySelector('#field-conditions');
    if (!box) return;

    const allConditions = await loadConditionsData();
    const activeConditions = new Set(window.readConditionState(character));

    // Sort to prioritize active conditions
    const sortedConditions = allConditions.slice().sort((a, b) => {
        const aIsActive = activeConditions.has(a.name);
        const bIsActive = activeConditions.has(b.name);
        if (aIsActive && !bIsActive) return -1;
        if (!aIsActive && bIsActive) return 1;
        return a.name.localeCompare(b.name);
    });

    box.innerHTML = '';

    for (const cond of sortedConditions) {
        const pill = document.createElement('div');
        pill.className = 'condition-pill tooltip';
        pill.textContent = cond.name;
        pill.dataset.tooltip = `${cond.name}\n\n${cond.desc}`;
        pill.dataset.condition = cond.name;

        if (activeConditions.has(cond.name)) {
            pill.classList.add('active');
        }

        pill.addEventListener('click', () => {
            // Read current state, modify it, and write it back
            const currentActiveSet = new Set(window.readConditionState(character));
            if (currentActiveSet.has(cond.name)) {
                currentActiveSet.delete(cond.name);
            } else {
                currentActiveSet.add(cond.name);
            }
            window.writeConditionState(character, Array.from(currentActiveSet));

            // Re-render the entire character sheet to apply condition effects
            if (window.renderCharacter) window.renderCharacter(window.__char);
        });
        box.appendChild(pill);
    }
}

function getActiveConditionEffects(character) {
    const active = new Set(window.readConditionState(character));
    const effects = {
        attackDisadvantage: null,
        abilityCheckDisadvantage: null,
        saveDisadvantage: {}, // e.g., { DEX: 'Restrained' }
        saveAutoFail: {}, // e.g., { STR: 'Paralyzed', DEX: 'Paralyzed' },
        passivePerceptionPenalty: 0,
        isIncapacitated: false
    };

    if (active.has('Blinded')) {
        effects.attackDisadvantage = 'Blinded';
        // Disadvantage on checks requiring sight imposes a -5 penalty on Passive Perception
        effects.passivePerceptionPenalty = -5;
    }

    if (active.has('Poisoned')) {
        effects.attackDisadvantage = effects.attackDisadvantage || 'Poisoned';
        effects.abilityCheckDisadvantage = 'Poisoned';
    }
    if (active.has('Frightened')) {
        effects.attackDisadvantage = effects.attackDisadvantage || 'Frightened';
        effects.abilityCheckDisadvantage = effects.abilityCheckDisadvantage || 'Frightened';
    }
    if (active.has('Restrained')) {
        effects.attackDisadvantage = effects.attackDisadvantage || 'Restrained';
        effects.saveDisadvantage.DEX = 'Restrained';
    }
    if (active.has('Prone')) {
        effects.attackDisadvantage = effects.attackDisadvantage || 'Prone';
    }

    const autoFailSource = active.has('Paralyzed') ? 'Paralyzed' : active.has('Petrified') ? 'Petrified' : active.has('Stunned') ? 'Stunned' : active.has('Unconscious') ? 'Unconscious' : null;
    if (autoFailSource) {
        effects.saveAutoFail.STR = autoFailSource;
        effects.saveAutoFail.DEX = autoFailSource;
    }

    if (autoFailSource || active.has('Incapacitated')) {
        effects.isIncapacitated = true;
    }

    return effects;
}

// --- Incapacitated Overlay Renderer ---
function renderIncapacitatedOverlay(conditionEffects) {
    const overlay = document.getElementById('incapacitated-overlay');
    if (!overlay) return;

    if (conditionEffects.isIncapacitated) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

// --- Death Saves Tracker ---
function renderDeathSaves(character) {
  const container = document.getElementById('death-saves');
  if (!container) return;

  container.innerHTML = ''; // Clear previous circles

  const saves = character.deathSaves || { successes: 0, failures: 0 };
  const positions = {
    successes: [68, 85, 106],
    failures: [137, 155, 175]
  };

  const createCircle = (type, index, left) => {
    const circle = document.createElement('div');
    circle.className = 'death-save-circle';
    circle.style.top = '307px';
    circle.style.left = `${left}px`;
    circle.style.width = '9px';
    circle.style.height = '9px';

    const count = saves[type] || 0;
    if (index < count) {
      circle.classList.add('filled');
    }

    circle.addEventListener('click', () => {
      const currentSaves = window.__char.deathSaves || { successes: 0, failures: 0 };
      const currentCount = currentSaves[type] || 0;

      // If this circle is the last one filled, un-fill it. Otherwise, fill up to this one.
      currentSaves[type] = (index + 1 === currentCount) ? index : index + 1;

      // Check for outcomes
      if (currentSaves.successes >= 3) {
        // Character becomes stable. They are unconscious at 0 HP. Reset saves.
        currentSaves.successes = 0;
        currentSaves.failures = 0;
      } else if (currentSaves.failures >= 3) {
        // Character is dead. Reset UI for next time.
        currentSaves.successes = 0;
        currentSaves.failures = 0;
      }

      window.__char.deathSaves = currentSaves;
      saveHPSnapshot();
      renderDeathSaves(window.__char); // Re-render just this component
    });
    container.appendChild(circle);
  };

  positions.successes.forEach((left, i) => createCircle('successes', i, left));
  positions.failures.forEach((left, i) => createCircle('failures', i, left));
}
// --- HP Cluster & Controls ---

const HP_SNAPSHOT_PREFIX = 'dd:hp::';
function saveHPSnapshot() {
  if (!window.__char || !window.__char.name) return;
  const key = HP_SNAPSHOT_PREFIX + window.__char.name.toLowerCase();
  const data = {
    currentHP: window.__char.currentHP,
    tempHP: window.__char.tempHP,
    deathSaves: window.__char.deathSaves,
    ts: Date.now()
  };
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

function applyHPSnapshot(character) {
  if (!character || !character.name) return;
  const key = HP_SNAPSHOT_PREFIX + character.name.toLowerCase();
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (saved) {
      character.currentHP = saved.currentHP;
      character.tempHP = saved.tempHP;
      character.deathSaves = saved.deathSaves;
    }
  } catch {}
}

function renderHPCluster(character) {
  const max = character.maxHP ?? 0;
  const cur = character.currentHP ?? max;
  const tmp = character.tempHP ?? 0;

  window.autoFit(F.maxHP(), String(max), { max: 24, min: 10, letterSpacing: -0.2, className: 'base-text', centerAbsolute: true });
  window.autoFit(F.currentHP(), String(cur), { max: 24, min: 10, letterSpacing: -0.2, className: 'base-text', centerAbsolute: true });
  window.autoFit(F.tempHP(), String(tmp), { max: 24, min: 10, letterSpacing: -0.2, className: 'base-text', centerAbsolute: true });
  window.autoFit(F.hitDie(), character.hit_die || '', { max: 24, min: 10, letterSpacing: -0.2, className: 'base-text', centerAbsolute: true });
}

function clamp(n, lo, hi){ return Math.max(lo, Math.min(hi, n)); }

function applyDamage(amount){
  if (!window.__char) return;
  let n = Math.max(0, Number(amount)|0);
  let t = Number(window.__char.tempHP || 0);
  let c = Number(window.__char.currentHP || 0);

  const fromTemp = Math.min(t, n); t -= fromTemp; n -= fromTemp;
  const fromHP   = Math.min(c, n); c -= fromHP;

  window.__char.tempHP = t; window.__char.currentHP = c;
  renderHPCluster(window.__char);
  saveHPSnapshot();
}

function applyHealing(amount){
  if (!window.__char) return;
  const oldHP = Number(window.__char.currentHP || 0);
  const maxHP = Number(window.__char.maxHP || 0);
  const c = clamp(Number(window.__char.currentHP || 0) + (Number(amount)|0), 0, maxHP);
  window.__char.currentHP = c;

  // If healing from 0 HP, the character is no longer dying.
  if (oldHP === 0 && c > 0) {
    window.__char.deathSaves = { successes: 0, failures: 0 };
    renderDeathSaves(window.__char);
  }

  renderHPCluster(window.__char);
  saveHPSnapshot();
}

function grantTempHP(){
  const input = prompt('Grant how many temporary hit points?', '5');
  if (input == null) return;
  const v = Math.max(0, Number(input)|0);
  const cur = Number(window.__char.tempHP || 0);
  window.__char.tempHP = Math.max(cur, v); // 5e: replace with higher
  renderHPCluster(window.__char);
  saveHPSnapshot();
}

function wireHPButtons() {
  F.hpMinus()?.addEventListener('click', (e) => applyDamage(e.shiftKey ? 5 : 1));
  F.hpPlus()?.addEventListener('click', (e) => applyHealing(e.shiftKey ? 5 : 1));
  F.tempGrant()?.addEventListener('click', grantTempHP);
  F.tempClear()?.addEventListener('click', () => {
    if (window.__char) {
      window.__char.tempHP = 0;
      renderHPCluster(window.__char);
      saveHPSnapshot();
    }
  });
}

// --- Skill Hotspots ---

function addSkillHotspot(id, rect, tip) {
  const parentEl = document.getElementById('hotspot-layer');
  if (!parentEl) return;

  const el = document.createElement('div');
  el.id = `skill-${id}`;
  el.className = 'tooltip'; // This class is what tooltip.clean.js looks for
  Object.assign(el.style, {
    position: 'absolute',
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    cursor: 'help',
    zIndex: '50'
  });
  el.setAttribute('data-tooltip', tip);
  parentEl.appendChild(el);
}

function wireSkillHotspots() {
  addSkillHotspot('deception',
    { top: '302px', left: '603px', width: '45px', height: '9px' },
    'CHA (Deception): Your Charisma (Deception) check determines whether you can convincingly hide the truth, either verbally or through your actions.'
  );
  addSkillHotspot('intimidation',
    { top: '315px', left: '603px', width: '59px', height: '9px'},
    'CHA (Intimidation): When you attempt to influence someone through overt threats, hostile actions, and physical violence, the DM might ask you to make a Charisma (Intimidation) check.'
  );
  addSkillHotspot('performance',
    { top:'330px', left:'603px', width:'57px', height:'9px' },
    'CHA (Performance): Your Charisma (Performance) check determines how well you can delight an audience with music, dance, acting, storytelling, or some other form of entertainment.'
  );
  addSkillHotspot('persuasion',
    { top:'345px', left:'603px', width:'49px', height:'9px' },
    'CHA (Persuasion): When you attempt to influence someone or a group of people with tact, social graces, or good nature, the DM might ask you to make a Charisma (Persuasion) check.'
  );
  addSkillHotspot('Animal Handling',
    { top:'380px', left:'603px', width:'78px', height:'9px' },
    'WIS (Animal Handling): When there is any question whether you can calm down a domesticated animal, keep a mount from getting spooked, or intuit an animal’s intentions, the DM might call for a Wisdom (Animal Handling) check.'
  );
  addSkillHotspot('Insight',
    { top:'393px', left:'603px', width:'33px', height:'9px' },
    'WIS (Insight): Your Wisdom (Insight) check decides whether you can determine the true intentions of a creature, such as when searching out a lie or predicting someone’s next move.'
  );
  addSkillHotspot('Medicine',
    { top:'407px', left:'603px', width:'41px', height:'9px' },
    'WIS (Medicine): A Wisdom (Medicine) check lets you try to stabilize a dying companion or diagnose an illness.'
  );
  addSkillHotspot('Perception',
    { top:'423px', left:'603px', width:'48px', height:'9px' },
    'WIS (Perception): Your Wisdom (Perception) check lets you spot, hear, or otherwise detect the presence of something. It measures your general awareness of your surroundings and the keenness of your senses.'
  );
  addSkillHotspot('Survival',
    { top:'436px', left:'603px', width:'39px', height:'9px' },
    'WIS (Survival): The DM might ask you to make a Wisdom (Survival) check to follow tracks, hunt wild game, guide your group through frozen wastelands, or avoid quicksand and other natural hazards.'
  );
  addSkillHotspot('acrobatics',
    { top:'561px', left:'603px', width:'57px', height:'9px' },
    'DEX (Acrobatics): Your Dexterity (Acrobatics) check covers your attempt to stay on your feet in a tricky situation, such as when you’re trying to run across a sheet of ice, balance on a tightrope, or stay upright on a rocking ship’s deck.'
  );
  addSkillHotspot('sleight of hand',
    { top:'575px', left:'603px', width:'73px', height:'9px' },
    'DEX (Sleight of Hand): Whenever you attempt an act of legerdemain or manual trickery, such as planting something on someone else or concealing an object on your person, make a Dexterity (Sleight of Hand) check.'
  );
  addSkillHotspot('stealth',
    { top:'589px', left:'603px', width:'39px', height:'9px' },
    'DEX (Stealth): Make a Dexterity (Stealth) check when you attempt to conceal yourself from enemies, slink past guards, slip away without being noticed, or sneak up on someone without being seen or heard.'
  );
  addSkillHotspot('athletics',
    { top:'651px', left:'603px', width:'45px', height:'9px' },
    'STR (Athletics): Your Strength (Athletics) check covers difficult situations you encounter while climbing, jumping, or swimming.'
  );
}

// Run once on script load
wireSkillHotspots();



// --- Proficiency Pips ---

const PIP_MAP = {
  saves: {
    CHA: { x: 578, y: 292 }, WIS: { x: 578, y: 369 }, INT: { x: 578, y: 460 },
    DEX: { x: 578, y: 550 }, STR: { x: 578, y: 641 }, CON: { x: 578, y: 726 }
  },
  skills: {
    "Deception": { x: 578, y: 308 }, "Intimidation": { x: 578, y: 322 },
    "Performance": { x: 578, y: 335 }, "Persuasion": { x: 578, y: 350 },
    "Animal Handling": { x: 578, y: 385 }, "Insight": { x: 578, y: 399 },
    "Medicine": { x: 578, y: 413 }, "Perception": { x: 578, y: 427 },
    "Survival": { x: 578, y: 440 }, "Arcana": { x: 578, y: 476 },
    "History": { x: 578, y: 490 }, "Investigation": { x: 578, y: 504 },
    "Nature": { x: 578, y: 518 }, "Religion": { x: 578, y: 532 },
    "Acrobatics": { x: 578, y: 566 }, "Sleight of Hand": { x: 578, y: 580 },
    "Stealth": { x: 578, y: 594 }, "Athletics": { x: 578, y: 655 }
  }
};

function ensurePipLayer() {
  const layer = document.getElementById('pip-layer');
  if (!layer || layer.dataset.initialized) return layer;

  const SHEET_W = 791, SHEET_H = 1024;
  const toPct = (x, y) => ({ left: `${x / SHEET_W * 100}%`, top: `${y / SHEET_H * 100}%` });

  for (const [abbr, pt] of Object.entries(PIP_MAP.saves)) {
    const el = document.createElement('div');
    el.className = 'pip diamond';
    el.dataset.id = `save:${abbr}`;
    Object.assign(el.style, toPct(pt.x, pt.y));
    layer.appendChild(el);
  }
  for (const [name, pt] of Object.entries(PIP_MAP.skills)) {
    const el = document.createElement('div');
    el.className = 'pip circle';
    el.dataset.id = `skill:${name}`;
    Object.assign(el.style, toPct(pt.x, pt.y));
    layer.appendChild(el);
  }
  layer.dataset.initialized = 'true';
  return layer;
}

function readSaves(c) {
  const raw = c?.skill_proficiencies?.['saving throws'] || c?.saving_throw_proficiencies || [];
  return new Set(raw.map(v => String(v).slice(0, 3).toUpperCase()));
}

function readSkills(c) {
  const raw = c?.skill_proficiencies?.skills || [];
  return new Set(raw.map(s => String(s).trim()));
}

function renderProficiencyPips(character) {
  const layer = ensurePipLayer();
  if (!layer) return;

  const saves = readSaves(character);
  const skills = readSkills(character);
  const skillLower = new Set(Array.from(skills).map(s => s.toLowerCase()));

  for (const abbr of Object.keys(PIP_MAP.saves)) {
    const el = layer.querySelector(`.pip[data-id="save:${abbr}"]`);
    if (el) el.style.display = saves.has(abbr) ? 'block' : 'none';
  }
  for (const name of Object.keys(PIP_MAP.skills)) {
    const el = layer.querySelector(`.pip[data-id="skill:${CSS.escape(name)}"]`);
    if (el) el.style.display = skillLower.has(name.toLowerCase()) ? 'block' : 'none';
  }
}
