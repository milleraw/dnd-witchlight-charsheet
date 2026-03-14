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
  deity:          () => document.querySelector('#field-deity'),
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
  inspirationControl:() => document.querySelector("#inspiration-control"),
};
window.F = window.F || F; // Expose for other scripts if needed

// --- Renderers for Simple Fields ---

const SUBCLASS_LABELS = {
  artificer: "Artificer Specialist",
  barbarian: "Primal Path",
  bard: "College",
  cleric: "Domain",
  druid: "Circle",
  fighter: "Martial Archetype",
  monk: "Way",
  paladin: "Oath",
  ranger: "Conclave",
  rogue: "Roguish Archetype",
  sorcerer: "Sorcerous Origin",
  warlock: "Patron",
  wizard: "School"
};

function getSubclassLabel(className) {
  const key = String(className || "").toLowerCase();
  return SUBCLASS_LABELS[key] || "Subclass";
}

function renderRace(raceName) {
  const textEl = F.raceTextEl();
  const pathEl = F.racePathEl();
  const box    = F.raceBox();
  if (!textEl || !pathEl || !box) return;
  textEl.querySelector('textPath').textContent = String(raceName || '').trim();
  if (window.NameCurves?.growFitTextToPath) {
    window.NameCurves.growFitTextToPath(textEl, pathEl, (box.clientHeight || 60) * 0.90, 24, 9);
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

function getDisplayRaceLabel(character, raceInfo) {
  const baseRaceLabel = String(raceInfo?.displayName || character?.race || '').trim();
  const subraceLabel = String(character?.subrace || '').trim();
  if (!baseRaceLabel) return subraceLabel;
  if (baseRaceLabel.toLowerCase() === 'tiefling') return baseRaceLabel;
  return subraceLabel || baseRaceLabel;
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
  const buildValue = String(character.build ?? '').trim();
  window.autoFit(F.build(), buildValue, { max: 22, min: 10, letterSpacing: -0.1, fontFamily: 'var(--font-display)' });
  window.autoFit(F.eyesHair(), character.eyes_hair ?? '', { max: 18, min: 9, letterSpacing: -0.1, fontFamily: 'var(--font-display)' });
  window.autoFit(F.gender(), character.gender ?? '', { max: 18, min: 9, letterSpacing: -0.1, fontFamily: 'var(--font-display)' });
  window.autoFit(F.playerName(), character.player_name ?? '', { max: 18, min: 9, letterSpacing: -0.1, fontFamily: 'var(--font-display)' });
  window.autoFit(F.alignment(), character.alignment ?? '', { max: 18, min: 9, letterSpacing: -0.1, fontFamily: 'var(--font-display)' });
  window.autoFit(F.deity(), character.deity ?? '', { max: 18, min: 9, letterSpacing: -0.1, fontFamily: 'var(--font-display)' });

  // Race & Background
  const raceInfo = window.resolveRaceAlias(character); // from storage.cleaned.js
  const raceLabel = getDisplayRaceLabel(character, raceInfo);
  renderRace(raceLabel);
  renderBackground(character.background);
}

function effectiveAbilityScore(character, abbr) {
  const key = String(abbr || '').trim().toUpperCase();
  if (window.DDRules && typeof window.DDRules.getEffectiveAbilityScore === 'function') {
    return Number(window.DDRules.getEffectiveAbilityScore(character, key) || 10);
  }
  return Number(character?.abilities?.[key] ?? character?.abilities?.[key.toLowerCase()] ?? 10);
}

// --- Renderer for Ability Scores ---
function renderAbilityFields(character, state = {}, conditionEffects = {}) {
  const abilities = {
    cha: effectiveAbilityScore(character, 'CHA'),
    wis: effectiveAbilityScore(character, 'WIS'),
    int: effectiveAbilityScore(character, 'INT'),
    dex: effectiveAbilityScore(character, 'DEX'),
    str: effectiveAbilityScore(character, 'STR'),
    con: effectiveAbilityScore(character, 'CON'),
  };

  const isRaging = !!state.isRaging;
   const effects = conditionEffects || { saveDisadvantage: {}, saveAutoFail: {} };


  let showChaSparkle = false;
  for (const [abbr, score] of Object.entries(abilities)) {
    const baseEl = F.abil(abbr, 'base');
    const modEl = F.abil(abbr, 'mod');
    const upperAbbr = abbr.toUpperCase();

    // Reset styles
    baseEl.classList.remove('raging-stat', 'has-disadvantage');
    modEl.classList.remove('raging-stat', 'has-disadvantage', 'fey-sparkle');
    baseEl.classList.remove('tooltip');
    modEl.classList.remove('tooltip');
    if (baseEl.dataset.tooltip) delete baseEl.dataset.tooltip;
    if (modEl.dataset.tooltip) delete modEl.dataset.tooltip;

    window.autoFit(baseEl, String(score), { max: 22, min: 10, className: 'base-text', centerAbsolute: true });
    window.autoFit(modEl, window.DDRules.fmtMod(window.DDRules.abilityMod(score)), { max: 20, min: 10, className: 'base-text', centerAbsolute: true });

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

    if (upperAbbr === 'CHA') {
      const glamour = (typeof window.DDRules?.getAbilityCheckBonus === 'function')
        ? window.DDRules.getAbilityCheckBonus(character, 'CHA')
        : { bonus: 0, sources: [] };
      const glamourBonus = Number(glamour?.bonus || 0) || 0;
      if (glamourBonus > 0) {
        modEl.classList.add('tooltip');
        const existing = String(modEl.dataset.tooltip || '').trim();
        const add = `Otherworldly Glamour: CHA checks gain ${window.DDRules.fmtMod(glamourBonus)} (from WIS, min +1).`;
        modEl.dataset.tooltip = existing ? `${existing}\n${add}` : add;
        showChaSparkle = true;
      }
    }
  }
  setChaSparkleVisible(showChaSparkle);
}

function setChaSparkleVisible(show) {
  const host = document.getElementById('wrapper') || document.getElementById('sheet');
  if (!host) return;
  let el = document.getElementById('cha-fey-sparkle');
  if (!show) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('div');
    el.id = 'cha-fey-sparkle';
    el.className = 'tooltip';
    el.innerHTML = `
      <span class="spark-main">✦</span>
      <span class="spark-a">✧</span>
      <span class="spark-b">✦</span>
      <span class="spark-c">✦</span>
      <span class="spark-d">✧</span>
      <span class="spark-e">✦</span>
      <span class="spark-f">✧</span>
      <span class="spark-g">✦</span>
      <span class="spark-h">✦</span>
      <span class="spark-i">✧</span>
      <span class="spark-j">✦</span>
      <span class="spark-k">✧</span>
      <span class="spark-l">✦</span>
      <span class="spark-m">✧</span>
      <span class="spark-n">✦</span>
      <span class="spark-o">✧</span>
    `;
    el.setAttribute('aria-hidden', 'true');
    host.appendChild(el);
  }
  el.setAttribute('data-tooltip', 'Otherworldly Glamour active: Charisma checks gain bonus from Wisdom (minimum +1).');
}

async function renderArmorAndAC(character) {
  const { ac, armorName, breakdown } = await window.CharCalculations.calculateAC(character);
  window.autoFit(F.armorName(), armorName || '', { max: 14, min: 8, className: 'base-text', wrap: true, lineHeight: 1.1 });
  const acEl = F.ac();
  acEl.classList.add('tooltip');
  acEl.dataset.tooltip = breakdown;
  window.autoFit(acEl, String(ac), { max: 20, min: 10, className: 'base-text', centerAbsolute: true });
}

function renderInitiative(character) {
  const { value, breakdown, hasAdvantage } = window.CharCalculations.computeInitiative(character);
  const initEl = F.initiative();
  const display = hasAdvantage ? `${window.DDRules.fmtMod(value)} (adv)` : window.DDRules.fmtMod(value);
  window.autoFit(initEl, display, { max: 22, min: 10, className: 'base-text', centerAbsolute: true });
  initEl.classList.add('tooltip');
  initEl.dataset.tooltip = `Initiative\n${breakdown}`;
}

async function getPerceptionModifier(character){
  const wisMod = window.DDRules.abilityMod(effectiveAbilityScore(character, 'WIS'));
  const pb = window.DDRules.proficiencyFromLevel(character.level || 1);

  // Determine proficiency / expertise / half-prof
  let profLevel = 0; // 0=none, 0.5=half, 1=prof, 2=expertise
  const skills = character.skills || {};
  const s = skills.Perception ?? skills.perception ?? null;
  if (s === 'expertise' || s === 2 || s === '2') profLevel = 2;
  else {
    const skillPool = [
      ...(Array.isArray(character?.proficiencies?.skills) ? character.proficiencies.skills : []),
      ...(Array.isArray(character?.skill_proficiencies?.skills) ? character.skill_proficiencies.skills : [])
    ];
    const hasPerception = skillPool.some(v => String(v || '').trim().toLowerCase() === 'perception');
    if (s || s === 1 || s === '1' || hasPerception) profLevel = 1;
  }
  if (profLevel === 0 && window.CharCalculations.hasNamedFeature(character, 'Jack of All Trades')) profLevel = 0.5;

  // Ranger (TCE) Canny grants expertise in one chosen proficient skill.
  const cannySkill = normalizeSkillName(getRangerCannySkillName(character)).toLowerCase();
  if (cannySkill === 'perception') {
    profLevel = Math.max(profLevel, 2);
  }

  const misc =
    (window.CharCalculations.hasNamedFeature(character, 'Observant') ? 5 : 0) +
    Number(character.bonusPassivePerception || 0);

  return wisMod + Math.floor(pb * profLevel) + misc;
}

async function calculatePassivePerception(character, conditionEffects = {}){
  const percMod = await getPerceptionModifier(character);
  let value = 10 + percMod;
  const breakdown = [`Base: 10`, `Perception Bonus: ${window.DDRules.fmtMod(percMod)}`];

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

  const scoreEff = effectiveAbilityScore(character, abil);
  const mod = window.DDRules.abilityMod(scoreEff);
  const dc  = 8 + pb + mod;

  return { value: dc, breakdown: `8 + PB (${pb}) + ${abil} mod (${window.DDRules.fmtMod(mod)})` };
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

async function renderSpeed(character) {
  const el = F.speed();
  if (!el) return;
  const { total, breakdown } = await window.CharCalculations.calculateSpeed(character, null);
  el.classList.add('tooltip');
  el.dataset.tooltip = breakdown;
  window.autoFit(el, String(total), { max: 26, min: 12, className: 'base-text', centerAbsolute: true });
}

function parseBeastActions(actionsHtml) {
    if (!actionsHtml) return [];
    const attacks = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${actionsHtml}</div>`, 'text/html');

    doc.querySelectorAll('p').forEach(p => {
        const strong = p.querySelector('strong');
        if (!strong) return;

        const name = strong.textContent.replace(/[.]/g, '').trim();
        const text = p.textContent;

        // Regex to find to-hit bonus and damage string
        const toHitMatch = text.match(/([+-]\d+)\s+to hit/);
        const hitMatch = text.match(/Hit:\s*([\s\S]+)/);

        if (toHitMatch && hitMatch) {
            const toHit = toHitMatch[1];
            const damage = hitMatch[1].trim();

            attacks.push({
                name: name,
                value: parseInt(toHit, 10), // for sorting
                line1: `${name}: ${toHit} to hit`,
                line2: damage,
                tooltip: text,
                ability: 'STR/DEX' // Beast attacks are usually based on physical stats
            });
        }
    });
    return attacks;
}

async function createWildShapeProxy(originalCharacter, state) {
    const beastForm = (await window.loadBeasts()).find(b => b.name === state.wildShapeForm);
    if (!beastForm) return originalCharacter;

    const proxy = {
        ...originalCharacter, // Start with original character's data
        isWildShaped: true,
        wildShapeFormName: beastForm.name,

        // Override physical stats
        abilities: {
            ...originalCharacter.abilities,
            STR: beastForm.STR,
            DEX: beastForm.DEX,
            CON: beastForm.CON,
        },

        // Override HP
        maxHP: parseInt(beastForm['Hit Points'], 10) || 1,
        currentHP: state.wildShapeCurrentHP,
        tempHP: 0, // Temp HP from druid form don't carry over

        // Override AC and Speed
        overrideAC: parseInt(beastForm['Armor Class'], 10),
        overrideSpeed: beastForm.Speed,

        // Override features and attacks
        features: [], // Clear original features for display
        attacks: parseBeastActions(beastForm.Actions)
    };

    // --- Merge Proficiencies ---
    // Druid keeps their own proficiencies and gains the beast's.
    const druidSkills = new Set(originalCharacter.proficiencies?.skills || []);
    const druidSaves = new Set([
        ...(Array.isArray(originalCharacter.proficiencies?.saving_throws) ? originalCharacter.proficiencies.saving_throws : []),
        ...(Array.isArray(originalCharacter.skill_proficiencies?.['saving throws']) ? originalCharacter.skill_proficiencies['saving throws'] : []),
        ...(Array.isArray(originalCharacter.saving_throw_proficiencies) ? originalCharacter.saving_throw_proficiencies : [])
    ].map(v => String(v || '').trim().slice(0, 3).toUpperCase()).filter(Boolean));

    const beastSkillsString = beastForm.Skills || '';
    const beastSavesString = beastForm['Saving Throws'] || '';

    // Parse "Perception +5, Stealth +7" into ["Perception", "Stealth"]
    const beastSkills = beastSkillsString.split(',').map(s => s.trim().split(' ')[0]).filter(Boolean);
    // Parse "DEX +2, CON +4" into ["DEX", "CON"]
    const beastSaves = beastSavesString.split(',').map(s => s.trim().split(' ')[0].toUpperCase()).filter(Boolean);

    beastSkills.forEach(skill => druidSkills.add(skill));
    beastSaves.forEach(save => druidSaves.add(save));

    proxy.proficiencies = {
        ...originalCharacter.proficiencies, // carry over armor, weapons, tools
        skills: Array.from(druidSkills),
        saving_throws: Array.from(druidSaves)
    };

    // --- Senses and Special Traits ---
    const specialSenses = [];
    // The druid retains their own senses and gains the beast's.
    // For simplicity, we'll just display the beast's senses string, which is usually more comprehensive.
    if (beastForm.Senses) {
        // Remove passive perception part as it's calculated elsewhere
        const sensesText = beastForm.Senses.replace(/,?\s*passive Perception\s*\d+/i, '').trim();
        if (sensesText) specialSenses.push(sensesText);
    }

    // Check for Illumination trait specifically
    if (beastForm.Traits) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${beastForm.Traits}</div>`, 'text/html');
        doc.querySelectorAll('p').forEach(p => {
            const strong = p.querySelector('strong');
            if (strong && strong.textContent.toLowerCase().includes('illumination')) {
                specialSenses.push(p.textContent.trim());
            }
        });
    }
    proxy.specialSenses = specialSenses;

    // Parse beast traits and actions to display in the features box
    const beastFeatures = [];
    if (beastForm.Traits) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${beastForm.Traits}</div>`, 'text/html');
        doc.querySelectorAll('p').forEach(p => {
            const strong = p.querySelector('strong');
            const name = strong ? strong.textContent.replace(/[.]/g, '') : p.textContent.slice(0, 30);
            beastFeatures.push({ name: `Trait: ${name}`, desc: p.textContent });
        });
    }
    if (beastForm.Actions) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${beastForm.Actions}</div>`, 'text/html');
        doc.querySelectorAll('p').forEach(p => {
            // Only add non-attack actions (like Multiattack) to the features list
            if (!p.textContent.includes('to hit')) {
                const strong = p.querySelector('strong');
                const name = strong ? strong.textContent.replace(/[.]/g, '') : 'Action';
                beastFeatures.push({ name: `Action: ${name}`, desc: p.textContent });
            }
        });
    }
    proxy.features = beastFeatures;

    return proxy;
}

/**
 * Gets the summary text for a scaling feature like Wild Shape.
 * @param {object} character - The full character object.
 * @param {object} feature - The feature object from classes.json, containing the scaling data.
 * @returns {string} - The summary text for the feature at the character's current level, e.g., "(CR 1/2 or below, no flying speed)".
 */
function getFeatureSummary(character, feature) {
  const level = Number(character.level) || 1;
  const cls = String(character?.class || '').toLowerCase();
  const build = String(character?.build || '').toLowerCase();
  let scalingRules = feature.scaling; // Default to base class scaling

  // Check for subclass-specific scaling rules
  if (feature.subclass_scaling && character.build && feature.subclass_scaling[character.build]) {
    scalingRules = feature.subclass_scaling[character.build];
  }

  if (!scalingRules || !scalingRules.levels) {
    // Fallback for local class data that omits scaling blocks.
    if (cls === 'druid' && String(feature?.name || '').toLowerCase().includes('wild shape')) {
      let crText = '1/4';
      const restrictions = [];
      if (build.includes('moon')) {
        const moonCR = Math.max(1, Math.floor(level / 3));
        crText = String(moonCR);
        if (level < 8) restrictions.push('no flying speed');
      } else {
        if (level >= 8) crText = '1';
        else if (level >= 4) crText = '1/2';
        else crText = '1/4';
        if (level < 8) restrictions.push('no flying speed');
        if (level < 4) restrictions.push('no swimming speed');
      }
      const tail = restrictions.length ? `, ${restrictions.join(', ')}` : '';
      return `(CR ${crText} or below${tail})`;
    }
    return ''; // No scaling information available
  }

  // Find the highest-level rule that the character meets
  let applicableRule = null;
  for (let i = scalingRules.levels.length - 1; i >= 0; i--) {
    const rule = scalingRules.levels[i];
    if (level >= rule.level) {
      applicableRule = rule;
      break;
    }
  }

  if (!applicableRule) {
    return '';
  }

  let summary = applicableRule.summary;

  // Handle dynamic formulas in the summary, like for Moon Druid
  if (summary.includes('{cr}')) {
    const formula = applicableRule.max_cr_formula.replace('level', level);
    const cr = Math.floor(eval(formula)); // Simple eval for "level/3"
    summary = summary.replace('{cr}', cr);
  }

  return `(${summary})`;
}
// --- Wild Shape ---

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

  const line1 = `Unarmed Strike: ${window.DDRules.fmtMod(atk)} to hit`;
  const line2 = `${die}${window.DDRules.fmtMod(best.mod)} bludgeoning`;
  const tip = `Unarmed Strike (Monk)\nAbility: ${best.key} (${window.DDRules.fmtMod(best.mod)})\nProficiency: +${pb}\nDamage: ${die} bludgeoning + ${best.key} mod`;

  return { name: "Unarmed Strike", value: atk, line1, line2, tooltip: tip, ability: best.key };
}

function buildDragonbornBreath(character) {
  const race = String(character.race || '').toLowerCase();
  if (!race.includes('dragonborn')) return null;

  const ancKey = String(character.draconic_ancestry || character.race_detail?.ancestry || '').toLowerCase();
  const DRAGONBORN_ANCESTRY = {
    black:  { dmg: "acid",      save: "DEX", area: "5 by 30 ft. line" },
    blue:   { dmg: "lightning", save: "DEX", area: "5 by 30 ft. line" },
    brass:  { dmg: "fire",      save: "DEX", area: "5 by 30 ft. line" },
    bronze: { dmg: "lightning", save: "DEX", area: "5 by 30 ft. line" },
    copper: { dmg: "acid",      save: "DEX", area: "5 by 30 ft. line" },
    gold:   { dmg: "fire",      save: "DEX", area: "15 ft. cone" },
    green:  { dmg: "poison",    save: "CON", area: "15 ft. cone" },
    red:    { dmg: "fire",      save: "DEX", area: "15 ft. cone" },
    silver: { dmg: "cold",      save: "CON", area: "15 ft. cone" },
    white:  { dmg: "cold",      save: "CON", area: "15 ft. cone" }
  };
  const anc = DRAGONBORN_ANCESTRY[ancKey];
  if (!anc) return null;

  const pb = window.DDRules.proficiencyFromLevel(character.level);
  const conMod = window.DDRules.abilityMod(effectiveAbilityScore(character, 'CON'));
  const dc = 8 + pb + conMod;
  const dice = (level => {
    if (level >= 16) return "5d6";
    if (level >= 11) return "4d6";
    if (level >= 6) return "3d6";
    return "2d6";
  })(character.level);

  const line1 = `Breath Weapon (DC ${dc})`;
  const line2 = `${dice} ${anc.dmg} (${anc.area}, ${anc.save} save)`;
  const tip = `Dragonborn Breath Weapon (${ancKey})\nArea: ${anc.area}\nSave DC: 8 + CON mod (${window.DDRules.fmtMod(conMod)}) + PB (+${pb}) = ${dc}`;

  return { name: "Breath Weapon", value: null, line1, line2, tooltip: tip, ability: null };
}

function buildArtilleristCannons(character, actionState = {}) {
  const cls = String(character.class || '').toLowerCase();
  const sub = String(character.build || '').toLowerCase();
  const level = Number(character.level || 1);
  // Eldritch Cannon is gained at Artillerist 3.
  if (cls !== 'artificer' || !sub.includes('artillerist') || level < 3) return [];
  const cannonList = Array.isArray(actionState?.eldritchCannons)
    ? actionState.eldritchCannons.map(v => String(v || '').trim()).filter(Boolean)
    : ((actionState?.eldritchCannonActive && String(actionState?.eldritchCannonType || '').trim())
      ? [String(actionState.eldritchCannonType).trim()]
      : []);
  if (!cannonList.length) return [];

  const pb = window.DDRules.proficiencyFromLevel(character.level);
  const intMod = window.DDRules.abilityMod(effectiveAbilityScore(character, 'INT'));
  const dc = 8 + pb + intMod;
  const atk = pb + intMod;
  const damageDice = (character.level || 1) >= 9 ? '3d8' : '2d8';
  const rows = [];
  cannonList.forEach((rawType, idx) => {
    const type = String(rawType || '').toLowerCase()
      .replace(/^force\s*/, '')
      .replace(/\s+/g, ' ')
      .trim();
    const suffix = cannonList.length > 1 ? ` #${idx + 1}` : '';

    if (type.includes('ballista')) {
      rows.push({
        name: `Eldritch Cannon${suffix}: Force Ballista`,
        value: atk,
        ability: "INT",
        line1: `Force Ballista${suffix}: ${window.DDRules.fmtMod(atk)} to hit`,
        line2: `${damageDice} force, push 5 ft`,
        tooltip: `Ranged spell attack using INT. On hit, pushes target 5 ft away.`
      });
      return;
    }
    if (type.includes('flamethrower')) {
      rows.push({
        name: `Eldritch Cannon${suffix}: Flamethrower`,
        value: null,
        ability: null,
        line1: `Flamethrower${suffix} (DC ${dc})`,
        line2: `${damageDice} fire, 15-ft cone (DEX save half)`,
        tooltip: `15-ft cone. DEX save vs DC ${dc} for half of ${damageDice} fire damage.`
      });
      return;
    }
    if (type.includes('protector')) {
      rows.push({
        name: `Eldritch Cannon${suffix}: Protector`,
        value: null,
        ability: null,
        line1: `Protector${suffix}`,
        line2: `1d8${window.DDRules.fmtMod(intMod)} temp HP (10-ft aura)`,
        tooltip: `Grant 1d8 + INT modifier temporary HP to creatures within 10 ft.`
      });
    }
  });
  return rows;
}

// --- Attack Calculation & Rendering ---

function getThrownText(w) {
  const src = w?.throw_range || w?.range || w?.weapon?.range_values || {};
  const n = Number(src.normal);
  const l = Number(src.long);
  if (!Number.isFinite(n) && !Number.isFinite(l)) return null;
  return `${Number.isFinite(n) ? n : '-'}/${Number.isFinite(l) ? l : '-'}`;
}

function normalizeWeaponData(equip) {
  if (!equip) return {};
  if (equip.rules?.weapon) {
    const w = equip.rules.weapon;
    return {
      name: equip.name,
      weapon_range: String(equip.subtype || '').includes('ranged') ? 'ranged' : 'melee',
      weapon_category: String(equip.weapon_category || '').trim(),
      category_range: String(equip.category_range || '').trim(),
      properties: (w.properties || []).map(p => ({ name: p })),
      damage: w.damage ? { damage_dice: w.damage.dice, damage_type: { name: w.damage.type } } : null,
      range: w.range,
      ability: w.ability,
      effects: Array.isArray(equip.effects) ? equip.effects : [],
      special: equip.desc || equip.special
    };
  }
  if (equip.weapon) {
    const versatileDice = String(equip?.weapon?.versatile_dice || '').trim();
    return {
      name: equip.name,
      weapon_range: equip.weapon.range,
      weapon_category: equip.weapon.category || equip.weapon.weapon_category || equip.weapon_category,
      category_range: equip.weapon.category_range || equip.category_range,
      properties: (equip.weapon.properties || []).map(p => ({ name: p })),
      damage: equip.weapon.damage
        ? {
            damage_dice: equip.weapon.damage.dice,
            damage_type: { name: equip.weapon.damage.type },
            ...(equip.weapon.damage.alt_type ? { damage_type_alt: { name: equip.weapon.damage.alt_type } } : {})
          }
        : null,
      range: equip.weapon.range_values || equip.range,
      special: equip.desc || equip.special,
      two_handed_damage: versatileDice ? { damage_dice: versatileDice } : undefined
    };
  }
  return equip;
}

function sumItemEffects(equip, kind, appliesPrefix) {
  const effects = Array.isArray(equip?.effects) ? equip.effects : [];
  return effects.reduce((acc, eff) => {
    if (String(eff?.when || '').toLowerCase() !== 'equipped') return acc;
    if (String(eff?.kind || '').toLowerCase() !== String(kind).toLowerCase()) return acc;
    if (appliesPrefix) {
      const applies = String(eff?.appliesTo || '').toLowerCase();
      if (!applies.startsWith(String(appliesPrefix).toLowerCase())) return acc;
    }
    const val = Number(eff?.value || 0);
    return acc + (Number.isFinite(val) ? val : 0);
  }, 0);
}

function weaponTooltip(w) {
  const weapon = normalizeWeaponData(w);
  const parts = [];
  if (weapon?.damage?.damage_dice && weapon?.damage?.damage_type?.name) {
    const primary = String(weapon.damage.damage_type.name).toLowerCase();
    const alt = String(weapon?.damage?.damage_type_alt?.name || '').toLowerCase();
    parts.push(`${weapon.damage.damage_dice} ${primary}${alt ? ` or ${alt}` : ''}`);
  }
  const props = (weapon.properties || []).map(p => String(p.index || p.name).toLowerCase().replace(/^prop:/, ""));
  if (window.DDRules.propHas(weapon, 'thrown')) {
    const thr = getThrownText(weapon);
    if (thr) parts.push(`thr ${thr}`);
  }
  if (props.includes('versatile')) parts.push('ver');
  const effectBonus = sumItemEffects(w, 'attack', 'weapon') || sumItemEffects(w, 'damage', 'weapon');
  const hasMagic = (weapon.magic_bonus ?? weapon.attack_bonus ?? weapon.damage_bonus ?? effectBonus) ? true : false;
  if (hasMagic) parts.push(`+${weapon.magic_bonus ?? weapon.attack_bonus ?? weapon.damage_bonus ?? effectBonus} magic`);
  const summary = parts.join(', ');
  const spec = Array.isArray(weapon.special) ? weapon.special.join('\n') : (weapon.special || '');
  return spec ? (summary ? `${summary}\n\n${spec}` : spec) : summary;
}

function bestDexOrStr(character) {
  const dex = window.DDRules.abilityMod(effectiveAbilityScore(character, 'DEX'));
  const str = window.DDRules.abilityMod(effectiveAbilityScore(character, 'STR'));
  return (dex >= str) ? { key: "DEX", mod: dex } : { key: "STR", mod: str };
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

function isProficientWithWeapon(character, equip, weapon) {
  const profs = Array.isArray(character?.proficiencies?.weapons)
    ? character.proficiencies.weapons.map(v => String(v || '').trim().toLowerCase()).filter(Boolean)
    : [];
  if (!profs.length) return false;

  const normalizeWeaponProfToken = (s) => String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ');
  const singularizeWeaponName = (s) => {
    const token = normalizeWeaponProfToken(s);
    if (!token) return token;
    // Handle common 5e proficiency list plurals: "Quarterstaffs" vs "Quarterstaff", etc.
    if (token.endsWith('ves')) return token.slice(0, -3) + 'f';
    if (token.endsWith('ies')) return token.slice(0, -3) + 'y';
    if (token.endsWith('s') && !token.endsWith('ss')) return token.slice(0, -1);
    return token;
  };

  const weaponName = String(equip?.name || weapon?.name || '').trim().toLowerCase();
  if (weaponName) {
    const nameNorm = normalizeWeaponProfToken(weaponName);
    const nameSingular = singularizeWeaponName(weaponName);
    const matchesByName = profs.some(p => {
      const pNorm = normalizeWeaponProfToken(p);
      if (pNorm === nameNorm) return true;
      return singularizeWeaponName(pNorm) === nameSingular;
    });
    if (matchesByName) return true;
  }
  if (profs.some(p => p.includes('all weapons'))) return true;

  const categoryRangeRaw = String(weapon?.category_range || '').trim().toLowerCase();
  const categoryRaw = String(weapon?.weapon_category || weapon?.category || '').trim().toLowerCase();
  const rangeRaw = String(weapon?.weapon_range || '').trim().toLowerCase();

  let cls = '';
  if (categoryRangeRaw) {
    const hasSimple = categoryRangeRaw.includes('simple');
    const hasMartial = categoryRangeRaw.includes('martial');
    const hasMelee = categoryRangeRaw.includes('melee');
    const hasRanged = categoryRangeRaw.includes('ranged');
    if (hasSimple) cls = hasMelee ? 'simple melee' : (hasRanged ? 'simple ranged' : 'simple');
    else if (hasMartial) cls = hasMelee ? 'martial melee' : (hasRanged ? 'martial ranged' : 'martial');
  }
  if (!cls && categoryRaw) {
    if (categoryRaw.includes('simple')) cls = rangeRaw === 'ranged' ? 'simple ranged' : 'simple melee';
    else if (categoryRaw.includes('martial')) cls = rangeRaw === 'ranged' ? 'martial ranged' : 'martial melee';
  }

  // Legacy/custom fallback: if classification is unknown, preserve permissive behavior.
  if (!cls) return true;

  const checks = new Set([cls]);
  if (cls.startsWith('simple')) checks.add('simple');
  if (cls.startsWith('martial')) checks.add('martial');
  if (cls.endsWith('melee')) checks.add('melee weapons');
  if (cls.endsWith('ranged')) checks.add('ranged weapons');
  if (cls.startsWith('simple')) checks.add('simple weapons');
  if (cls.startsWith('martial')) checks.add('martial weapons');

  for (const c of checks) {
    if (profs.some(p => p === c || p.includes(c))) return true;
  }
  return false;
}

function computeItemAttack(character, equip, state = {}, conditionEffects = {}) {
  const weapon = normalizeWeaponData(equip);
  const isRanged = String(weapon?.weapon_range || "").toLowerCase() === "ranged"
    || String(equip?.subtype || '').toLowerCase().includes('ranged')
    || window.DDRules.propHas(weapon, 'ammunition');
  const finesse = window.DDRules.propHas(weapon, "finesse");
  const props = (weapon?.properties || [])
    .map(p => String(p.index || p.name).toLowerCase().replace(/^prop:/, ""));
  const passiveRules = Array.isArray(character?.passiveRules) ? character.passiveRules : [];
  const hasRule = (rule) => passiveRules.some(r => String(r?.rule || "").toLowerCase() === String(rule).toLowerCase());
  const hasFeat = (name) => (character.feats || []).some(f => String(f?.name || f).toLowerCase() === String(name || '').toLowerCase());
  const hasSharpshooter = hasRule('sharpshooter') || hasFeat('Sharpshooter');

  let abilKey = "STR"; // Default for melee weapons
  const abilityPref = String(weapon?.ability || '').toLowerCase();
  if (abilityPref === 'dex') abilKey = "DEX";
  else if (abilityPref === 'str') abilKey = "STR";
  else if (abilityPref === 'str_or_dex' || finesse) abilKey = bestDexOrStr(character).key;
  else if (isRanged) abilKey = "DEX";
  const mod = window.DDRules.abilityMod(effectiveAbilityScore(character, abilKey));
  const pb = window.DDRules.proficiencyFromLevel(character?.level);
  
  const proficient = isProficientWithWeapon(character, equip, weapon);
  const effectAtk = sumItemEffects(equip, 'attack', 'weapon');
  const magicAtk = Number(weapon.attack_bonus ?? weapon.magic_bonus ?? 0) + effectAtk;
  const gearBonus = (() => {
    const gear = Array.isArray(character?.equipment?.gear) ? character.equipment.gear : [];
    const keys = [equip?.id, equip?.key, equip?.index, equip?.name].filter(Boolean).map(k => String(k).toLowerCase());
    const match = gear.find(g => {
      const ref = String(g?.ref || '').toLowerCase();
      const name = String(g?.name || '').toLowerCase();
      return (ref && keys.includes(ref)) || (name && keys.includes(name));
    });
    return Number(match?.modifier || 0) || 0;
  })();
  const profBonus = proficient ? pb : 0;

  const fightingStyles = getFightingStyleNames(character);
  const hasArchery = fightingStyles.has('archery');
  const hasDueling = fightingStyles.has('dueling');
  const hasThrown = fightingStyles.has('thrown weapon fighting');
  const hasGreatWeaponFighting = fightingStyles.has('great weapon fighting');
  const archeryBonus = (hasArchery && isRanged) ? 2 : 0;

  // --- NEW: Check for infusion bonuses ---
  const allInfusions = window.readAllActiveInfusions ? window.readAllActiveInfusions() : [];
  const infusion = allInfusions.find(inf => inf.item === equip.name && inf.owner === character.name);
  let infusionBonus = 0;
  if (infusion) {
    if ((infusion.name === 'Enhanced Weapon' || infusion.name === 'Returning Weapon') && infusion.bonus) {
      infusionBonus = infusion.bonus;
    } else if (infusion.name === 'Radiant Weapon') {
      infusionBonus = Number(infusion.bonus) || 1;
    } else if (infusion.name === 'Repeating Shot') {
      // Applies to ranged attacks made with the infused weapon.
      infusionBonus = isRanged ? (Number(infusion.bonus) || 1) : 0;
    }
  }

  const dmgDice = weapon?.damage?.damage_dice || "1d4";
  const versatileDice = (() => {
    const explicit = String(weapon?.two_handed_damage?.damage_dice || '').trim();
    if (explicit) return explicit;
    const specialList = Array.isArray(weapon?.special) ? weapon.special : [];
    for (const entry of specialList) {
      const m = String(entry || '').match(/versatile\s*\((\d+d\d+)\)/i);
      if (m?.[1]) return m[1];
    }
    return '';
  })();
  const dmgType = (weapon?.damage?.damage_type?.name || "Bludgeoning").toLowerCase();
  const dmgTypeAlt = String(weapon?.damage?.damage_type_alt?.name || '').toLowerCase();
  const effectDmg = sumItemEffects(equip, 'damage', 'weapon');
  const magicDmg = Number(weapon.damage_bonus ?? weapon.magic_bonus ?? 0) + gearBonus + effectDmg;

  const isRaging = !!state.isRaging;
  const isStrMelee = (abilKey === 'STR' && !isRanged);
  const rageDamageBonus = isRaging && isStrMelee ? (character.level >= 16 ? 4 : character.level >= 9 ? 3 : 2) : 0;
  const baseCharForSpellState = window.__char_original || character;
  const spellState = window.readSpellState ? (window.readSpellState(baseCharForSpellState) || {}) : {};
  const isSporesDruid = String(baseCharForSpellState?.class || '').toLowerCase() === 'druid'
    && String(baseCharForSpellState?.build || '').toLowerCase().includes('spores');
  const symbioticMeleeBonus = (isSporesDruid && !!spellState.symbioticActive && !isRanged) ? '1d6 necrotic' : '';
  const duelingBonus = (hasDueling && !isRanged && !props.includes('two-handed')) ? 2 : 0;
  const thrownBonus = (hasThrown && props.includes('thrown')) ? 2 : 0;

  const baseToHit = mod + profBonus + magicAtk + gearBonus + archeryBonus;
  const finalToHit = baseToHit + infusionBonus;
  const baseDmgMod = mod + magicDmg + rageDamageBonus + duelingBonus + thrownBonus;
  const twoHandedDmgMod = mod + magicDmg + rageDamageBonus + thrownBonus;
  const dmgMod = baseDmgMod + infusionBonus;
  const displayName = (() => {
    const gear = Array.isArray(character?.equipment?.gear) ? character.equipment.gear : [];
    const keys = [equip?.id, equip?.key, equip?.index, equip?.name].filter(Boolean).map(k => String(k).toLowerCase());
    const match = gear.find(g => {
      const ref = String(g?.ref || '').toLowerCase();
      const name = String(g?.name || '').toLowerCase();
      return (ref && keys.includes(ref)) || (name && keys.includes(name));
    });
    return match?.name || equip.name;
  })();
  const line1 = `${displayName}: ${window.DDRules.fmtMod(finalToHit)} to hit`;
  let line2 = `${dmgDice}${dmgMod !== 0 ? window.DDRules.fmtMod(dmgMod) : ''} ${dmgType}${dmgTypeAlt ? ` or ${dmgTypeAlt}` : ''}`;
  if (symbioticMeleeBonus) {
    line2 += ` + ${symbioticMeleeBonus}`;
  }
  if (isRaging && isStrMelee) {
    line2 = `<strong class="rage-damage">${line2}</strong>`;
  }

  let tooltip = weaponTooltip(weapon);
  if (gearBonus) {
    tooltip += `\n\nMagic Bonus: +${gearBonus}`;
  }
  if (hasArchery && isRanged) {
    tooltip += `\n\nFighting Style (Archery): +2 to attack rolls`;
  }
  if (hasDueling && !isRanged && !props.includes('two-handed')) {
    tooltip += `\n\nFighting Style (Dueling): +2 damage when wielding one-handed`;
  }
  if (hasThrown && props.includes('thrown')) {
    tooltip += `\n\nFighting Style (Thrown Weapon Fighting): +2 damage on thrown attacks`;
  }
  if (hasGreatWeaponFighting && (!isRanged && (props.includes('two-handed') || props.includes('versatile')))) {
    tooltip += `\n\nFighting Style (Great Weapon Fighting): reroll 1s and 2s on weapon damage dice (manual).`;
  }
  if (infusion) {
    tooltip += `\n\nInfused: ${infusion.name}`;
  }
  tooltip += `\n\nWeapon Proficiency: ${proficient ? 'Yes (PB applied)' : 'No (PB not applied)'}`;
  if (props.includes('versatile') && versatileDice) {
    tooltip += `\n\nVersatile: one-handed damage ${dmgDice}${dmgMod !== 0 ? window.DDRules.fmtMod(dmgMod) : ''}; two-handed damage ${versatileDice}${(twoHandedDmgMod + infusionBonus) !== 0 ? window.DDRules.fmtMod(twoHandedDmgMod + infusionBonus) : ''}.`;
  }
  const fmt = window.DDRules.fmtMod;
  const nonZeroTerms = (terms) => terms.filter(t => Number(t?.value || 0) !== 0);
  const renderTerms = (terms) => {
    const kept = nonZeroTerms(terms);
    if (!kept.length) return '0';
    return kept.map(t => `${t.label} ${fmt(t.value)}`).join(' + ');
  };
  const toHitTerms = [
    { label: abilKey, value: mod },
    { label: 'PB', value: profBonus },
    { label: 'weapon/effect', value: magicAtk },
    { label: 'gear', value: gearBonus },
    { label: 'archery', value: archeryBonus },
    { label: 'infusion', value: infusionBonus },
  ];
  const dmgTerms = [
    { label: abilKey, value: mod },
    { label: 'weapon/effect', value: magicDmg },
    { label: 'rage', value: rageDamageBonus },
    { label: 'dueling', value: duelingBonus },
    { label: 'thrown', value: thrownBonus },
    { label: 'infusion', value: infusionBonus },
  ];
  tooltip += `\n\nTo Hit Math: ${fmt(finalToHit)} = ${renderTerms(toHitTerms)}`;
  tooltip += `\nDamage Math: ${dmgDice}${dmgMod !== 0 ? fmt(dmgMod) : ''} = ${renderTerms(dmgTerms)}`;
  if (hasSharpshooter && isRanged) {
    tooltip += `\n\nSharpshooter: ignore half/three-quarters cover; no disadvantage at long range`;
  }
  if (symbioticMeleeBonus) {
    tooltip += `\n\nSymbiotic Entity: +1d6 necrotic damage on melee weapon hits.`;
  }

  // Add disadvantage from conditions
  if (conditionEffects.attackDisadvantage) {
    tooltip += `\n\nDisadvantage from ${conditionEffects.attackDisadvantage} condition.`;
  }

  // Add Dreadful Strikes damage if applicable
  const isFeyWanderer = String(character.build || '').toLowerCase().includes('fey wanderer');
  if (isFeyWanderer && character.level >= 3) {
    const dreadfulDie = (character.level || 1) >= 11 ? '1d6' : '1d4';
    line2 += ` + ${dreadfulDie} psychic (1/target/turn)`;
    tooltip += `\n\nDreadful Strikes: +${dreadfulDie} psychic damage when you hit with a weapon; each target can take this extra damage only once per turn.`;
  }

  // Ranger 20: Foe Slayer reminder/state marker (manual once-per-turn tracker on actions page).
  const baseCharForActionState = window.__char_original || character;
  const isRanger20 = String(baseCharForActionState?.class || '').toLowerCase() === 'ranger'
    && Number(baseCharForActionState?.level || 1) >= 20;
  if (isRanger20 && !character.isWildShaped) {
    const wisScore = Number(baseCharForActionState?.abilities?.WIS ?? baseCharForActionState?.abilities?.wis ?? 10);
    const wisMod = window.DDRules.abilityMod(wisScore);
    const actionState = (window.readActionState && typeof window.readActionState === 'function')
      ? (window.readActionState(baseCharForActionState) || {})
      : {};
    const usedThisTurn = Number(actionState.foeSlayerUsedTurn || 0) >= 1;
    line2 += usedThisTurn
      ? ' | Foe Slayer: SPENT'
      : ' | Foe Slayer: READY';
    tooltip += `\n\nFoe Slayer: Once on each of your turns, you can add your Wisdom modifier (${window.DDRules.fmtMod(wisMod)}) to one attack roll OR one damage roll against a favored enemy.\nCurrent turn state: ${usedThisTurn ? 'SPENT' : 'READY'}.`;
  }

  // Zealot Barbarian: Divine Fury applies only while raging, on the first creature hit each turn.
  if (isRaging && isStrMelee && String(character.build || '').toLowerCase().includes('zealot')) {
    const divineFuryBonus = Math.floor((character.level || 1) / 2);
    tooltip += `\n\nDivine Fury (Active: Rage ON): first creature you hit with a weapon attack on your turn takes +1d6${window.DDRules.fmtMod(divineFuryBonus)} extra radiant or necrotic damage.`;
  }

  return { name: equip.name, value: finalToHit, line1, line2, tooltip, ability: abilKey, isHTML: isRaging && isStrMelee, hasDisadvantage: !!conditionEffects.attackDisadvantage };
}

async function renderAttacks(character, state = {}, conditionEffects = {}) {
  const box = F.attacks();
  if (!box) return;
  const rowsBox = document.getElementById('attack-rows') || box;
  rowsBox.innerHTML = '';
  const offhandSelect = document.getElementById('offhand-weapon');
  const hasSharpshooter = (character.traits || []).some(t => String(t.name || t).toLowerCase().includes('sharpshooter'))
    || (character.feats || []).some(f => String(f?.name || f).toLowerCase() === 'sharpshooter');
  const hasGWM = (character.traits || []).some(t => String(t.name || t).toLowerCase().includes('great weapon master'))
    || (character.feats || []).some(f => String(f?.name || f).toLowerCase() === 'great weapon master');

  let powerToggle = document.getElementById('attack-power-toggle');
  if (!powerToggle && (hasSharpshooter || hasGWM)) {
    powerToggle = document.createElement('label');
    powerToggle.className = 'attack-power-toggle';
    powerToggle.id = 'attack-power-toggle';
    powerToggle.innerHTML = `
      <input id="attack-power-enabled" type="checkbox">
      Power Attack (-5/+10)
    `;
    box.insertBefore(powerToggle, box.firstChild);
    const chk = powerToggle.querySelector('#attack-power-enabled');
    if (chk) {
      chk.checked = !!character.powerAttackEnabled;
      chk.onchange = async () => {
        character.powerAttackEnabled = chk.checked;
        if (window.__char_original) {
          window.__char_original.powerAttackEnabled = character.powerAttackEnabled;
          const file = window.getCurrentCharacterFile?.();
          if (file && typeof window.saveCharacter === 'function') {
            try {
              await window.saveCharacter(file, window.__char_original, { prompt: false });
              window.setCurrentCharacter?.(file, window.__char_original);
            } catch (err) {
              console.warn('Failed to save power attack toggle', err);
            }
          }
        }
        renderAttacks(character, state, conditionEffects);
      };
    }
  }
  if (powerToggle) {
    powerToggle.classList.toggle('hidden', !(hasSharpshooter || hasGWM));
  }
  if (offhandSelect) {
    offhandSelect.innerHTML = '<option value="">-- none --</option>';
  }
  let rows = [];

  if (character.isWildShaped) {
    // For Wild Shape, the attacks are pre-computed on the proxy object
    rows = character.attacks || [];
  } else {
    // For normal form, build attacks from weapons and class features
    const monk = buildMonkUnarmed(character);
    if (monk) rows.push(monk);
    const breath = buildDragonbornBreath(character);
    if (breath) rows.push(breath);
    const cannons = buildArtilleristCannons(character, state);
    if (cannons.length) rows.push(...cannons);

    const names = window.getEquippedWeapons(character);
    const getCustomWeaponByName = (weaponName) => {
      const gear = Array.isArray(character?.equipment?.gear) ? character.equipment.gear : [];
      return gear.find(it =>
        String(it?.name || '').trim().toLowerCase() === String(weaponName || '').trim().toLowerCase()
        && (String(it?.equip_slot || '').trim().toLowerCase() === 'weapon' || !!it?.weapon)
      ) || null;
    };
    const mergeWeaponOverride = (baseItem, customItem) => {
      if (!customItem && !baseItem) return null;
      if (!customItem) return baseItem;
      if (!baseItem) return customItem;
      return {
        ...baseItem,
        ...customItem,
        weapon: (customItem?.weapon && typeof customItem.weapon === 'object')
          ? customItem.weapon
          : baseItem.weapon
      };
    };
    if (offhandSelect) {
      const opts = names.map(n => `<option value="${n}">${n}</option>`).join('');
      offhandSelect.innerHTML = `<option value="">-- none --</option>${opts}`;
      if (character.offhandWeapon) {
        offhandSelect.value = character.offhandWeapon;
      }
      offhandSelect.onchange = async () => {
        character.offhandWeapon = offhandSelect.value || '';
        if (window.__char_original) {
          window.__char_original.offhandWeapon = character.offhandWeapon;
          const file = window.getCurrentCharacterFile?.();
          if (file && typeof window.saveCharacter === 'function') {
            try {
              await window.saveCharacter(file, window.__char_original, { prompt: false });
              window.setCurrentCharacter?.(file, window.__char_original);
            } catch (err) {
              console.warn('Failed to save off-hand weapon selection', err);
            }
          }
        }
        renderAttacks(character, state, conditionEffects);
      };
    }
    for (const name of names) {
      const baseItem = await window.getEquipmentByName(name);
      const customItem = getCustomWeaponByName(name);
      const item = mergeWeaponOverride(baseItem, customItem);
      if (item) {
        const row = computeItemAttack(character, item, state, conditionEffects);
        if (character.powerAttackEnabled) {
          const isRanged = String(item?.weapon_range || '').toLowerCase() === 'ranged';
          const props = (item?.properties || []).map(p => String(p.index || p.name).toLowerCase());
          const isHeavy = props.includes('heavy');
          if (isRanged && hasSharpshooter) {
            row.value -= 5;
            row.line1 = `${item.name}: ${window.DDRules.fmtMod(row.value)} to hit`;
            row.line2 = row.line2.replace(/^([^+\\-]+)([+-]\\d+)?(.*)$/i, (m, dice, bonus, rest) => {
              const dmgBonus = bonus ? Number(bonus) : 0;
              const newBonus = dmgBonus + 10;
              return `${dice}${window.DDRules.fmtMod(newBonus)}${rest}`;
            });
            row.tooltip = (row.tooltip || '') + `\n\nSharpshooter: -5 to hit, +10 damage`;
          }
          if (!isRanged && isHeavy && hasGWM) {
            row.value -= 5;
            row.line1 = `${item.name}: ${window.DDRules.fmtMod(row.value)} to hit`;
            row.line2 = row.line2.replace(/^([^+\\-]+)([+-]\\d+)?(.*)$/i, (m, dice, bonus, rest) => {
              const dmgBonus = bonus ? Number(bonus) : 0;
              const newBonus = dmgBonus + 10;
              return `${dice}${window.DDRules.fmtMod(newBonus)}${rest}`;
            });
            row.tooltip = (row.tooltip || '') + `\n\nGreat Weapon Master: -5 to hit, +10 damage`;
          }
        }
        rows.push(row);
      }
    }

    if (character.offhandWeapon) {
      const baseOffhand = await window.getEquipmentByName(character.offhandWeapon);
      const customOffhand = getCustomWeaponByName(character.offhandWeapon);
      const offhandItem = mergeWeaponOverride(baseOffhand, customOffhand);
      if (offhandItem) {
        const offhandRow = computeItemAttack(character, offhandItem, state, conditionEffects);
        offhandRow.name = `${offhandRow.name} (Off-hand)`;
        offhandRow.line1 = `${offhandRow.name}: ${window.DDRules.fmtMod(offhandRow.value)} to hit`;

        const hasTwoWeapon = getFightingStyleNames(character).has('two-weapon fighting');
        const isMelee = String(offhandItem?.weapon_range || '').toLowerCase() !== 'ranged';
        const isLight = window.DDRules.propHas(offhandItem, 'light');
        const dmgMatch = offhandRow.line2.match(/^([^+\\-]+)([+-]\\d+)?(.*)$/);
        if (!hasTwoWeapon) {
          if (dmgMatch) {
            offhandRow.line2 = `${dmgMatch[1]}${dmgMatch[3]}`.trim();
          }
          offhandRow.tooltip = (offhandRow.tooltip || '') + `\n\nOff-hand: no ability modifier to damage`;
        } else if (!isMelee || !isLight) {
          offhandRow.tooltip = (offhandRow.tooltip || '') + `\n\nOff-hand: requires a light melee weapon`;
        } else {
          offhandRow.tooltip = (offhandRow.tooltip || '') + `\n\nTwo-Weapon Fighting: add ability modifier to off-hand damage`;
        }
        rows.push(offhandRow);
      }
    }
  }

  const baseCharForSpellState = window.__char_original || character;
  const spState = window.readSpellState ? (window.readSpellState(baseCharForSpellState) || {}) : {};
  const activeConcentration = String(spState.concentrationSpell || '').toLowerCase().trim();
  if (activeConcentration === 'call lightning') {
    const spellStats = (window.DDRules && typeof window.DDRules.computeSpellStats === 'function')
      ? window.DDRules.computeSpellStats(baseCharForSpellState)
      : null;
    const saveDC = Number(spellStats?.dc || 0);
    const dcText = saveDC > 0 ? `DC ${saveDC}` : 'Spell Save DC';
    rows.push({
      name: 'Call Bolt of Lightning',
      value: null,
      line1: `Call Bolt of Lightning: DEX save (${dcText})`,
      line2: '3d10 lightning (half on success)',
      tooltip: `When you cast the spell, choose a point you can see under the cloud. Each creature within 5 feet of that point must make a Dexterity saving throw against ${saveDC > 0 ? `Spell Save DC ${saveDC}` : 'your spell save DC'}. A creature takes 3d10 lightning damage on a failed save, or half as much damage on a successful one. When you cast this spell using a spell slot of 4th or higher level, the damage increases by 1d10 for each slot level above 3rd.`,
      ability: 'WIS',
      className: 'lightning-action'
    });
  }

  for (const r of rows) {
    const div = document.createElement('div');
    div.className = 'attack-row tooltip';
    if (r.className) div.classList.add(r.className);
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
    rowsBox.appendChild(div);
  }

  const best = rows.slice().sort((a, b) => (b.value || 0) - (a.value || 0))[0];
  if (best) {
    const abox = F.attackbonus();
    if (abox) {
      abox.classList.add('tooltip');
      abox.dataset.tooltip = `Attack Bonus\n${best.name}\n(${best.ability || '—'})`;
      window.autoFit(abox, window.DDRules.fmtMod(best.value), { max: 26, min: 12, className: 'base-text', centerAbsolute: true });
    }
  }
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

function itemAttunedQty(it) {
  const qty = Math.max(1, Number(it?.qty || 1));
  const stored = Number(it?.attuned_qty ?? (it?.attuned ? 1 : 0));
  const normalized = Number.isFinite(stored) ? Math.max(0, Math.round(stored)) : 0;
  return Math.min(qty, normalized);
}

function textRequiresAttunement(text) {
  return /\brequires?\s+attunement\b/i.test(String(text || ''));
}

function equipmentRequiresAttunement(baseItem) {
  if (!baseItem || typeof baseItem !== 'object') return false;
  if (baseItem?.magic?.requiresAttunement === true) return true;
  if (baseItem?.magic?.attunement?.required === true) return true;
  if (baseItem?.attunement?.required === true) return true;
  if (baseItem?.requires_attunement === true) return true;
  if (textRequiresAttunement(baseItem?.type) || textRequiresAttunement(baseItem?.item_type)) return true;
  const descText = Array.isArray(baseItem?.desc) ? baseItem.desc.join('\n') : baseItem?.desc;
  return textRequiresAttunement(descText);
}

async function resolveGearItemBase(it) {
  const ref = String(it?.ref || '').trim().toLowerCase();
  const name = String(it?.name || '').trim();
  try {
    if (ref) {
      const list = await loadEquipmentList();
      const found = list.find(e => {
        const ids = [e?.id, e?.key, e?.index, e?.name].map(v => String(v || '').trim().toLowerCase());
        return ids.includes(ref);
      });
      if (found) return found;
    }
    if (typeof window.getEquipmentByName === 'function' && (ref || name)) {
      return await window.getEquipmentByName(ref || name);
    }
  } catch (_) {
    return null;
  }
  return null;
}

function sameGearItemIdentity(a, b) {
  const aName = String(a?.name || '').trim().toLowerCase();
  const bName = String(b?.name || '').trim().toLowerCase();
  const aRef = String(a?.ref || '').trim().toLowerCase();
  const bRef = String(b?.ref || '').trim().toLowerCase();
  const aDesc = String(a?.desc || '').trim();
  const bDesc = String(b?.desc || '').trim();
  const aMod = Number(a?.modifier || 0) || 0;
  const bMod = Number(b?.modifier || 0) || 0;
  const aValue = Math.max(0, Number(a?.value_gp || 0) || 0);
  const bValue = Math.max(0, Number(b?.value_gp || 0) || 0);
  const aSlot = String(a?.equip_slot || '').trim().toLowerCase();
  const bSlot = String(b?.equip_slot || '').trim().toLowerCase();
  const aForm = String(a?.object_form || '').trim().toLowerCase();
  const bForm = String(b?.object_form || '').trim().toLowerCase();
  return aName === bName && aRef === bRef && aDesc === bDesc && aMod === bMod && aValue === bValue && aSlot === bSlot && aForm === bForm;
}

async function persistGearAttunement(character, item, nextAttunedQty) {
  const original = window.__char_original;
  const file = window.getCurrentCharacterFile?.();
  if (!original || !file || typeof window.saveCharacter !== 'function') return false;

  const updated = structuredClone(original);
  if (!updated.equipment) updated.equipment = {};
  if (!Array.isArray(updated.equipment.gear)) updated.equipment.gear = [];
  if (Array.isArray(updated.gear) && updated.gear.length) {
    for (const legacy of updated.gear) updated.equipment.gear.push(legacy);
    updated.gear = [];
  }
  const idx = updated.equipment.gear.findIndex(it => sameGearItemIdentity(it, item));
  if (idx < 0) return false;

  const qty = Math.max(1, Number(updated.equipment.gear[idx]?.qty || 1));
  const clamped = Math.min(qty, Math.max(0, Number(nextAttunedQty || 0)));
  updated.equipment.gear[idx].attuned = clamped > 0;
  if (clamped > 0) updated.equipment.gear[idx].attuned_qty = clamped;
  else delete updated.equipment.gear[idx].attuned_qty;

  await window.saveCharacter(file, updated, { prompt: false });
  window.setCurrentCharacter?.(file, updated);
  const state = window.readActionState ? window.readActionState(updated) : {};
  await renderCharacter(updated, state);
  return true;
}

function gpValueFromEquipmentItem(item) {
  const cp = Number(item?.cost?.cp);
  if (Number.isFinite(cp) && cp > 0) return cp / 100;
  const gp = Number(item?.cost?.gp);
  if (Number.isFinite(gp) && gp > 0) return gp;
  const gpValue = Number(item?.cost?.gpValue);
  if (Number.isFinite(gpValue) && gpValue > 0) return gpValue;
  return 0;
}

// --- Gear Rendering ---
async function renderGear(character) {
  const box = F.gear();
  if (!box) return;
  box.innerHTML = '';
  const statusEl = document.getElementById('status');
  const setStatus = (msg, ms = 1800) => {
    if (!statusEl) return;
    statusEl.textContent = msg;
    setTimeout(() => {
      if (statusEl.textContent === msg) statusEl.textContent = '';
    }, ms);
  };

  // Get active infusions to decorate items
  const allInfusions = window.readAllActiveInfusions ? window.readAllActiveInfusions() : [];
  const infusedItems = new Map();
  const ownerKey = String(character?.name || '').trim().toLowerCase();
  for (const inf of allInfusions) {
    // Only care about items this character owns
    if (!inf?.item) continue;
    if (String(inf?.owner || '').trim().toLowerCase() !== ownerKey) continue;
    const key = String(inf.item).trim().toLowerCase();
    if (!key) continue;
    const list = infusedItems.get(key) || [];
    list.push({
      name: String(inf.name || '').trim(),
      replicates: String(inf.replicates || '').trim()
    });
    infusedItems.set(key, list);
  }
  const infusionDefs = (typeof window.loadInfusions === 'function') ? await window.loadInfusions().catch(() => []) : [];
  const infusionDefByName = new Map((Array.isArray(infusionDefs) ? infusionDefs : []).map(inf => [String(inf?.name || '').trim().toLowerCase(), inf]));
  const infusionRequiresAttunementByKey = new Map();
  const uniqueInfusions = new Set(
    Array.from(infusedItems.values())
      .flat()
      .map(inf => `${String(inf?.name || '').trim().toLowerCase()}|${String(inf?.replicates || '').trim().toLowerCase()}`)
      .filter(Boolean)
  );
  for (const infKey of uniqueInfusions) {
    const [lower, replicateKey] = String(infKey || '').split('|');
    let requires = false;
    const def = infusionDefByName.get(lower);
    if (def) {
      requires = textRequiresAttunement(def?.item_type)
        || textRequiresAttunement(def?.desc)
        || textRequiresAttunement(def?.type);
    }
    if (!requires && lower.startsWith('replicate magic item')) {
      const m = lower.match(/\(([^)]+)\)/);
      const replicated = String(replicateKey || m?.[1] || '').trim();
      if (replicated && typeof window.getEquipmentByName === 'function') {
        const replicatedBase = await window.getEquipmentByName(replicated).catch(() => null);
        requires = equipmentRequiresAttunement(replicatedBase);
      }
    }
    infusionRequiresAttunementByKey.set(infKey, !!requires);
  }

  // normalizeGearList is from storage.cleaned.js
  const items = window.normalizeGearList(character);
  const attunementLimit = attunementLimitForCharacter(character);

  if (!items.length) {
    const hint = document.createElement('div');
    hint.className = 'row';
    hint.style.opacity = '0.6';
    hint.textContent = '— no gear listed —';
    box.appendChild(hint);
    return;
  }

  // gearTooltipFor is from tooltip.clean.js
  let attunedTotal = 0;
  const rows = await Promise.all(items.map(async (it) => {
    const qty = it.qty > 1 ? `${it.qty}× ` : '';
    const label = `${qty}${it.name}`;
    let tt = await window.Tooltips.gearTooltipFor(it);
    let finalLabel = label;
    const infusedList = infusedItems.get(String(it?.name || '').trim().toLowerCase()) || [];
    const infusedNames = infusedList.map(inf => String(inf?.name || '').trim()).filter(Boolean);
    if (infusedNames.length) {
      finalLabel = `⚙️ ${label}`;
      tt += `\n\nInfused: ${infusedNames.join(', ')}`;
    }
    const base = await resolveGearItemBase(it);
    const requiresAttunement = equipmentRequiresAttunement(base)
      || infusedList.some(inf => {
        const k = `${String(inf?.name || '').trim().toLowerCase()}|${String(inf?.replicates || '').trim().toLowerCase()}`;
        return infusionRequiresAttunementByKey.get(k) === true;
      })
      || textRequiresAttunement(it?.desc)
      || textRequiresAttunement(it?.name);
    const attunedQty = requiresAttunement ? itemAttunedQty(it) : 0;
    if (requiresAttunement) {
      attunedTotal += attunedQty;
      const qtyNum = Math.max(1, Number(it?.qty || 1));
      const stateLabel = attunedQty > 0 ? `${attunedQty}/${qtyNum} attuned` : 'not attuned';
      tt += `\n\nAttunement: ${stateLabel} (click to toggle)`;
    }
    return { label: finalLabel, tt, item: it, requiresAttunement, attunedQty };
  }));

  const attuneRow = document.createElement('div');
  attuneRow.className = 'attunement-row' + (attunedTotal > attunementLimit ? ' over-limit' : '');
  attuneRow.textContent = `Attunement: ${attunedTotal}/${attunementLimit}`;
  box.appendChild(attuneRow);

  rows.forEach((r, i) => {
    if (i === 0) box.appendChild(document.createTextNode(' '));
    else box.appendChild(document.createTextNode(' • '));
    const span = document.createElement('span');
    span.className = 'itm base-text tooltip'
      + (r.label.startsWith('⚙️') ? ' infused-item' : '')
      + (r.requiresAttunement ? ' attunable-item' : '')
      + (r.attunedQty > 0 ? ' is-attuned' : '');
    const attunePrefix = r.requiresAttunement ? (r.attunedQty > 0 ? '◆ ' : '◇ ') : '';
    span.textContent = `${attunePrefix}${r.label}`;
    if (r.tt) span.setAttribute('data-tooltip', r.tt);
    if (r.requiresAttunement) {
      span.title = 'Click to toggle attunement';
      span.addEventListener('click', async (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        const qty = Math.max(1, Number(r.item?.qty || 1));
        const next = (r.attunedQty + 1) % (qty + 1);
        const projected = attunedTotal - r.attunedQty + next;
        if (projected > attunementLimit) {
          setStatus(`Attunement limit reached (${attunementLimit}).`);
          return;
        }
        const ok = await persistGearAttunement(character, r.item, next);
        if (!ok) {
          setStatus('Could not update attunement.');
          return;
        }
        setStatus(`${r.item?.name || 'Item'} attunement: ${next}/${qty}.`);
      });
    }
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

// --- Equipment Modal ---
let _equipmentCatalogCache = null;
let _equipmentListCache = null;
async function loadEquipmentCatalog() {
  if (_equipmentCatalogCache) return _equipmentCatalogCache;
  if (typeof window.loadEquipmentLocal === 'function') {
    const catalog = await window.loadEquipmentLocal();
    const list = Array.isArray(catalog?.equipment) ? catalog.equipment : [];
    const modifiers = Array.isArray(catalog?.modifiers) ? catalog.modifiers : [];
    _equipmentCatalogCache = { equipment: list, modifiers };
  } else {
    const res = await fetch('data/equipment.json', { cache: 'no-store' });
    const list = res.ok ? await res.json() : [];
    _equipmentCatalogCache = { equipment: Array.isArray(list) ? list : [], modifiers: [] };
  }
  return _equipmentCatalogCache;
}

async function loadEquipmentList() {
  if (_equipmentListCache) return _equipmentListCache;
  const catalog = await loadEquipmentCatalog();
  _equipmentListCache = Array.isArray(catalog?.equipment) ? catalog.equipment : [];
  return _equipmentListCache;
}

function getEquipmentCategory(item) {
  const raw = item?.equipment_category?.name || item?.equipment_category?.index
    || item?.category?.name || item?.category?.id
    || item?.category || item?.type || '';
  return String(raw).toLowerCase();
}

function formatModifier(modifier) {
  const num = Number(modifier);
  if (!Number.isFinite(num) || num === 0) return '';
  return num > 0 ? `+${num}` : String(num);
}

function formatDerivedName(baseName, modifier) {
  const mod = formatModifier(modifier);
  if (!mod) return baseName;
  return `${baseName} ${mod}`;
}

function gearItemSignature(it) {
  const name = String(it?.name || '').trim().toLowerCase();
  const qty = Number(it?.qty ?? 1) || 1;
  const ref = String(it?.ref || '').trim().toLowerCase();
  const desc = String(it?.desc || '').trim();
  const mod = Number(it?.modifier || 0) || 0;
  const valueGp = Math.max(0, Number(it?.value_gp || 0) || 0);
  const slot = String(it?.equip_slot || '').trim().toLowerCase();
  const form = String(it?.object_form || '').trim().toLowerCase();
  const attuned = !!it?.attuned ? 1 : 0;
  const attunedQty = Number(it?.attuned_qty ?? (attuned ? 1 : 0)) || 0;
  const weapon = it?.weapon && typeof it.weapon === 'object' ? JSON.stringify(it.weapon) : '';
  return `${name}|${qty}|${ref}|${desc}|${mod}|${valueGp}|${slot}|${form}|${attuned}|${attunedQty}|${weapon}`;
}

function wireEquipmentModal() {
  const addBtn = document.getElementById('gear-add-btn');
  const coinBtn = document.getElementById('currency-edit-btn');
  const modal = document.getElementById('equipment-modal');
  const backdrop = document.getElementById('modal-backdrop');
  const saveBtn = document.getElementById('equip-save-btn');
  const cancelBtn = document.getElementById('equip-cancel-btn');
  const baseSelect = document.getElementById('equip-base-item');
  const filterSlot = document.getElementById('equip-filter-slot');
  const filterForm = document.getElementById('equip-filter-form');
  const filterMinGp = document.getElementById('equip-filter-min-gp');
  const filterHomunculusBtn = document.getElementById('equip-filter-homunculus');
  const filterPotionsBtn = document.getElementById('equip-filter-potions');
  const modifierInput = document.getElementById('equip-modifier');
  const qtyInput = document.getElementById('equip-qty');
  const valueInput = document.getElementById('equip-value-gp');
  const derivedEl = document.getElementById('equip-derived');
  const notesInput = document.getElementById('equip-notes');
  const customWrap = document.getElementById('equip-custom');
  const removeWrap = document.getElementById('equip-remove');
  const pickWrap = document.getElementById('equip-picklist');
  const customName = document.getElementById('equip-custom-name');
  const customDesc = document.getElementById('equip-custom-desc');
  const customQty = document.getElementById('equip-custom-qty');
  const customValue = document.getElementById('equip-custom-value-gp');
  const customSlot = document.getElementById('equip-custom-slot');
  const customForm = document.getElementById('equip-custom-form');
  const customIsWeapon = document.getElementById('equip-custom-is-weapon');
  const customWeaponFields = document.getElementById('equip-custom-weapon-fields');
  const customWeaponRange = document.getElementById('equip-custom-weapon-range');
  const customWeaponDice = document.getElementById('equip-custom-weapon-dice');
  const customWeaponDamageType = document.getElementById('equip-custom-weapon-damage-type');
  const customWeaponDamageTypeAlt = document.getElementById('equip-custom-weapon-damage-type-alt');
  const customWeaponDamageTypeCustom = document.getElementById('equip-custom-weapon-damage-type-custom');
  const customWeaponCategory = document.getElementById('equip-custom-weapon-category');
  const customWeaponRangeNormal = document.getElementById('equip-custom-weapon-range-normal');
  const customWeaponRangeLong = document.getElementById('equip-custom-weapon-range-long');
  const customWeaponProperties = document.getElementById('equip-custom-weapon-properties');
  const customWeaponPropertiesExtra = document.getElementById('equip-custom-weapon-properties-extra');
  const customWeaponVersatileDice = document.getElementById('equip-custom-weapon-versatile-dice');
  const removeItem = document.getElementById('equip-remove-item');
  const removeQty = document.getElementById('equip-remove-qty');
  const editWrap = document.getElementById('equip-edit');
  const editItem = document.getElementById('equip-edit-item');
  const editDesc = document.getElementById('equip-edit-desc');
  const ppInput = document.getElementById('equip-pp');
  const gpInput = document.getElementById('equip-gp');
  const spInput = document.getElementById('equip-sp');
  const cpInput = document.getElementById('equip-cp');
  const modeInputs = document.querySelectorAll('input[name="equip-mode"]');
  let removeChoices = [];

  if (!modal || !backdrop || !saveBtn || !cancelBtn || !baseSelect || !filterSlot || !filterForm || !filterMinGp || !filterHomunculusBtn || !valueInput || !customValue || !customSlot || !customForm) return;
  let potionOnlyFilter = false;

  const resetFields = () => {
    baseSelect.value = '';
    filterSlot.value = '';
    filterForm.value = '';
    filterMinGp.value = '0';
    potionOnlyFilter = false;
    modifierInput.value = '';
    qtyInput.value = 1;
    valueInput.value = '';
    derivedEl.textContent = 'Derived Item: —';
    notesInput.value = '';
    customName.value = '';
    customDesc.value = '';
    customQty.value = 1;
    customValue.value = '';
    customSlot.value = '';
    customForm.value = '';
    if (customIsWeapon) customIsWeapon.checked = false;
    if (customWeaponRange) customWeaponRange.value = 'melee';
    if (customWeaponDice) customWeaponDice.value = '';
    if (customWeaponDamageType) customWeaponDamageType.value = '';
    if (customWeaponDamageTypeAlt) customWeaponDamageTypeAlt.value = '';
    if (customWeaponDamageTypeCustom) customWeaponDamageTypeCustom.value = '';
    if (customWeaponCategory) customWeaponCategory.value = '';
    if (customWeaponRangeNormal) customWeaponRangeNormal.value = '';
    if (customWeaponRangeLong) customWeaponRangeLong.value = '';
    if (customWeaponProperties) Array.from(customWeaponProperties.options || []).forEach(opt => { opt.selected = false; });
    if (customWeaponPropertiesExtra) customWeaponPropertiesExtra.value = '';
    if (customWeaponVersatileDice) customWeaponVersatileDice.value = '';
    removeItem.value = '';
    removeQty.value = 1;
    if (editItem) editItem.value = '';
    if (editDesc) editDesc.value = '';
    ppInput.value = 0;
    gpInput.value = 0;
    spInput.value = 0;
    cpInput.value = 0;
  };

  const syncDerived = () => {
    const opt = baseSelect.selectedOptions?.[0];
    const baseName = opt?.dataset?.name || '';
    if (!baseName) {
      derivedEl.textContent = 'Derived Item: —';
      return;
    }
    const derived = formatDerivedName(baseName, modifierInput.value);
    derivedEl.textContent = `Derived Item: ${derived}`;
  };

  const syncPickValue = async () => {
    const baseId = String(baseSelect.value || '').trim();
    if (!baseId) {
      valueInput.value = '';
      return;
    }
    const list = await loadEquipmentList();
    const baseItem = list.find(i =>
      String(i?.id || '').toLowerCase() === baseId.toLowerCase() ||
      String(i?.key || '').toLowerCase() === baseId.toLowerCase() ||
      String(i?.index || '').toLowerCase() === baseId.toLowerCase() ||
      String(i?.name || '').toLowerCase() === baseId.toLowerCase()
    );
    const gpValue = gpValueFromEquipmentItem(baseItem);
    valueInput.value = gpValue > 0 ? String(gpValue) : '';
  };

  const syncMode = () => {
    const mode = document.querySelector('input[name="equip-mode"]:checked')?.value || 'pick';
    pickWrap.classList.toggle('hidden', mode !== 'pick');
    customWrap.classList.toggle('hidden', mode !== 'custom');
    if (editWrap) editWrap.classList.toggle('hidden', mode !== 'edit');
    removeWrap.classList.toggle('hidden', mode !== 'remove');
    if (customWeaponFields) {
      customWeaponFields.classList.toggle('hidden', !(mode === 'custom' && customIsWeapon?.checked));
    }
  };

  const renderBaseOptions = (list) => {
    const wantSlot = String(filterSlot.value || '').trim().toLowerCase();
    const wantForm = String(filterForm.value || '').trim().toLowerCase();
    const minGp = Math.max(0, Number(filterMinGp.value || 0) || 0);
    const current = String(baseSelect.value || '').trim().toLowerCase();
    const options = (Array.isArray(list) ? list : [])
      .filter(i => {
        const slot = String(i?.equip_slot || '').trim().toLowerCase();
        const form = String(i?.object_form || '').trim().toLowerCase();
        const subtype = String(i?.subtype || '').trim().toLowerCase();
        const gp = gpValueFromEquipmentItem(i);
        if (potionOnlyFilter && subtype !== 'potion') return false;
        if (wantSlot && slot !== wantSlot) return false;
        if (wantForm && form !== wantForm) return false;
        if (gp < minGp) return false;
        return true;
      })
      .map(i => {
        const id = i?.id || i?.key || i?.index || i?.name;
        const name = i?.name || i?.key || i?.index;
        const gp = gpValueFromEquipmentItem(i);
        return { id, name, gp };
      })
      .filter(o => o.id && o.name)
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
    baseSelect.innerHTML = ['<option value="">-- Select an item --</option>']
      .concat(options.map(o => `<option value="${o.id}" data-name="${String(o.name)}" title="${o.gp > 0 ? `${o.gp} gp` : 'No listed gp value'}">${o.name}</option>`))
      .join('');
    if (current) {
      const match = Array.from(baseSelect.options).find(o => String(o.value || '').trim().toLowerCase() === current);
      if (match) baseSelect.value = match.value;
    }
    syncDerived();
    syncPickValue();
  };

  const open = async () => {
    const catalog = await loadEquipmentCatalog();
    const list = Array.isArray(catalog?.equipment) ? catalog.equipment : [];
    renderBaseOptions(list);
    const mods = Array.isArray(catalog?.modifiers) && catalog.modifiers.length
      ? catalog.modifiers
      : [
          { name: '+1', bonus: 1 },
          { name: '+2', bonus: 2 },
          { name: '+3', bonus: 3 }
        ];
    modifierInput.innerHTML = ['<option value="">None</option>']
      .concat(mods.map(m => `<option value="${Number(m.bonus || 0)}">${m.name || formatModifier(m.bonus)}</option>`))
      .join('');
    const original = window.__char_original || {};
    const snapshot = structuredClone(original);
    const listNow = typeof window.normalizeGearList === 'function' ? window.normalizeGearList(snapshot) : [];
    removeChoices = (listNow || []).map(it => ({ key: gearItemSignature(it), item: it }));
    removeItem.innerHTML = ['<option value="">-- Select current item --</option>']
      .concat(removeChoices.map(c => {
        const qtyText = Number(c.item?.qty || 1) > 1 ? ` (x${Number(c.item.qty)})` : '';
        const valueGp = Math.max(0, Number(c.item?.value_gp || 0) || 0);
        const valueText = valueGp > 0 ? ` [${valueGp} gp]` : '';
        return `<option value="${c.key}">${c.item.name}${qtyText}${valueText}</option>`;
      }))
      .join('');
    if (editItem) {
      editItem.innerHTML = ['<option value="">-- Select current item --</option>']
        .concat(removeChoices.map(c => {
          const qtyText = Number(c.item?.qty || 1) > 1 ? ` (x${Number(c.item.qty)})` : '';
          const valueGp = Math.max(0, Number(c.item?.value_gp || 0) || 0);
          const valueText = valueGp > 0 ? ` [${valueGp} gp]` : '';
          return `<option value="${c.key}">${c.item.name}${qtyText}${valueText}</option>`;
        }))
        .join('');
    }
    resetFields();
    syncMode();
    syncDerived();
    syncPickValue();
    modal.classList.remove('hidden');
    backdrop.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    modal.classList.add('hidden');
    backdrop.classList.add('hidden');
    document.body.style.overflow = '';
  };

  const applyChanges = async () => {
    const original = window.__char_original;
    const file = window.getCurrentCharacterFile?.();
    if (!original || !file || typeof window.saveCharacter !== 'function') {
      alert('Cannot save: no character file loaded.');
      return;
    }
    const updated = structuredClone(original);
    if (!updated.equipment) updated.equipment = {};
    if (!Array.isArray(updated.equipment.gear)) updated.equipment.gear = [];
    if (Array.isArray(updated.gear) && updated.gear.length) {
      const existing = new Set(updated.equipment.gear.map(it => {
        const name = String(it?.name || '').trim().toLowerCase();
        const qty = Number(it?.qty ?? 1) || 1;
        const ref = String(it?.ref || '').trim().toLowerCase();
        const desc = String(it?.desc || '').trim();
        const mod = Number(it?.modifier || 0) || 0;
        const valueGp = Math.max(0, Number(it?.value_gp || 0) || 0);
        const slot = String(it?.equip_slot || '').trim().toLowerCase();
        const form = String(it?.object_form || '').trim().toLowerCase();
        const attuned = !!it?.attuned ? 1 : 0;
        const attunedQty = Number(it?.attuned_qty ?? (attuned ? 1 : 0)) || 0;
        const weapon = it?.weapon && typeof it.weapon === 'object' ? JSON.stringify(it.weapon) : '';
        return `${name}|${qty}|${ref}|${desc}|${mod}|${valueGp}|${slot}|${form}|${attuned}|${attunedQty}|${weapon}`;
      }));
      for (const legacy of updated.gear) {
        const name = String(legacy?.name || '').trim();
        if (!name) continue;
        const qty = Number(legacy?.qty ?? 1) || 1;
        const ref = String(legacy?.ref || '').trim();
        const desc = String(legacy?.desc || '').trim();
        const mod = Number(legacy?.modifier || 0) || 0;
        const valueGp = Math.max(0, Number(legacy?.value_gp || 0) || 0);
        const slot = String(legacy?.equip_slot || '').trim().toLowerCase();
        const form = String(legacy?.object_form || '').trim().toLowerCase();
        const attuned = !!legacy?.attuned ? 1 : 0;
        const attunedQty = Number(legacy?.attuned_qty ?? (attuned ? 1 : 0)) || 0;
        const weapon = legacy?.weapon && typeof legacy.weapon === 'object' ? JSON.stringify(legacy.weapon) : '';
        const key = `${name.toLowerCase()}|${qty}|${ref.toLowerCase()}|${desc}|${mod}|${valueGp}|${slot}|${form}|${attuned}|${attunedQty}|${weapon}`;
        if (existing.has(key)) continue;
        existing.add(key);
        updated.equipment.gear.push({
          name,
          qty,
          ref: ref || undefined,
          desc: desc || undefined,
          modifier: mod || undefined,
          value_gp: valueGp || undefined,
          equip_slot: slot || undefined,
          object_form: form || undefined,
          is_spellcasting_focus: !!legacy?.is_spellcasting_focus || undefined,
          focus_kind: legacy?.focus_kind || undefined,
          is_armor_like_garment: !!legacy?.is_armor_like_garment || undefined,
          weapon: legacy?.weapon && typeof legacy.weapon === 'object' ? legacy.weapon : undefined,
          attuned: !!legacy?.attuned || undefined,
          attuned_qty: attunedQty || undefined
        });
      }
      updated.gear = [];
    }
    if (!Array.isArray(updated.equipment.weapons)) updated.equipment.weapons = [];
    if (!Array.isArray(updated.armor)) updated.armor = [];

    const mode = document.querySelector('input[name="equip-mode"]:checked')?.value || 'pick';
    if (mode === 'pick') {
      const baseId = String(baseSelect.value || '').trim();
      const list = await loadEquipmentList();
      const baseItem = list.find(i =>
        String(i?.id || '').toLowerCase() === baseId.toLowerCase() ||
        String(i?.key || '').toLowerCase() === baseId.toLowerCase() ||
        String(i?.index || '').toLowerCase() === baseId.toLowerCase() ||
        String(i?.name || '').toLowerCase() === baseId.toLowerCase()
      );
      const baseName = baseItem?.name || baseSelect.selectedOptions?.[0]?.dataset?.name || '';
      if (baseId || baseName) {
        const mod = Number(modifierInput.value || 0) || 0;
        const qty = Math.max(1, Number(qtyInput.value || 1));
        const valueGp = Math.max(0, Number(valueInput.value || 0) || 0);
        const packContents = Array.isArray(baseItem?.rules?.pack?.contents) ? baseItem.rules.pack.contents : [];
        const isPackItem = String(baseItem?.type || '').toLowerCase() === 'pack' && packContents.length > 0;
        if (isPackItem) {
          for (const part of packContents) {
            const partRef = String(part?.item || '').trim();
            const partQty = Math.max(1, Number(part?.quantity || 1) || 1) * qty;
            const partItem = list.find(i =>
              String(i?.id || '').toLowerCase() === partRef.toLowerCase()
              || String(i?.key || '').toLowerCase() === partRef.toLowerCase()
              || String(i?.index || '').toLowerCase() === partRef.toLowerCase()
              || String(i?.name || '').toLowerCase() === partRef.toLowerCase()
            );
            const partName = partItem?.name || partRef || 'Pack Item';
            updated.equipment.gear.push({
              name: partName,
              qty: partQty,
              ref: partItem?.id || partItem?.key || partItem?.index || partName,
              equip_slot: partItem?.equip_slot || undefined,
              object_form: partItem?.object_form || undefined,
              is_spellcasting_focus: !!partItem?.is_spellcasting_focus || undefined,
              focus_kind: partItem?.focus_kind || undefined,
              is_armor_like_garment: !!partItem?.is_armor_like_garment || undefined
            });
          }
          // Pack becomes its concrete contents; do not keep a top-level pack token item.
          // Any optional notes/value entered for the pack are ignored in favor of real contents.
        } else {
          const derivedName = formatDerivedName(baseName, mod);
          const descParts = [];
          if (mod) {
            descParts.push(`Base Item: ${baseName}`);
            descParts.push(`Magic Modifier: ${formatModifier(mod)}`);
          }
          if (notesInput.value.trim()) descParts.push(notesInput.value.trim());
          const desc = descParts.join('\n');
          updated.equipment.gear.push({
            name: derivedName,
            qty,
            ref: baseItem?.id || baseItem?.key || baseItem?.index || baseName,
            modifier: mod || undefined,
            value_gp: valueGp || undefined,
            equip_slot: baseItem?.equip_slot || undefined,
            object_form: baseItem?.object_form || undefined,
            is_spellcasting_focus: !!baseItem?.is_spellcasting_focus || undefined,
            focus_kind: baseItem?.focus_kind || undefined,
            is_armor_like_garment: !!baseItem?.is_armor_like_garment || undefined,
            desc: desc || undefined
          });

          const cat = getEquipmentCategory(baseItem);
          if (cat.includes('weapon')) {
            for (let i = 0; i < qty; i++) updated.equipment.weapons.push(baseName);
          } else if (cat.includes('armor') || cat.includes('shield')) {
            for (let i = 0; i < qty; i++) updated.armor.push(baseName);
          }
        }
      }
    } else {
      if (mode === 'custom') {
        const name = String(customName.value || '').trim();
        if (name) {
          const qty = Math.max(1, Number(customQty.value || 1));
          const desc = String(customDesc.value || '').trim();
          const valueGp = Math.max(0, Number(customValue.value || 0) || 0);
          const manualSlot = String(customSlot.value || '').trim().toLowerCase();
          const manualForm = String(customForm.value || '').trim().toLowerCase();
          const lower = name.toLowerCase();
          const inferredForm = manualForm || (/\bgem\b|\bcrystal\b/.test(lower) ? 'gem' : (/\bbag\b|\bpack\b|\bbackpack\b/.test(lower) ? 'bag' : undefined));
          const inferredSlot = manualSlot
            || (/\bcloak\b/.test(lower) ? 'cloak' : undefined)
            || (/\bring\b/.test(lower) ? 'ring' : undefined)
            || (/\bamulet\b|\bnecklace\b|\bmedallion\b|\bperiapt\b/.test(lower) ? 'amulet' : undefined)
            || (/\bboots?\b/.test(lower) ? 'boots' : undefined)
            || (/\bgloves?\b|\bgauntlets?\b/.test(lower) ? 'gloves' : undefined)
            || (/\bbracers?\b/.test(lower) ? 'bracers' : undefined)
            || (/\bbelt\b/.test(lower) ? 'belt' : undefined)
            || (/\bhelm\b|\bhat\b|\bhood\b|\bcirclet\b/.test(lower) ? 'headwear' : undefined)
            || (/\bgoggles?\b|\beyes?\b/.test(lower) ? 'goggles' : undefined)
            || (/\bbag\b|\bpack\b|\bbackpack\b/.test(lower) ? 'container' : undefined);
          const isWeapon = !!customIsWeapon?.checked;
          const propertyValues = [];
          if (customWeaponProperties) {
            for (const opt of Array.from(customWeaponProperties.selectedOptions || [])) {
              const v = String(opt?.value || '').trim().toLowerCase();
              if (v) propertyValues.push(v);
            }
          }
          const extraProperties = String(customWeaponPropertiesExtra?.value || '')
            .split(',')
            .map(v => String(v || '').trim().toLowerCase())
            .filter(Boolean);
          const allProperties = [...new Set(propertyValues.concat(extraProperties))];
          const rangeNormal = Number(customWeaponRangeNormal?.value || 0);
          const rangeLong = Number(customWeaponRangeLong?.value || 0);
          const damageTypeOverride = String(customWeaponDamageTypeCustom?.value || '').trim().toLowerCase();
          const damageTypeSelected = String(customWeaponDamageType?.value || '').trim().toLowerCase();
          const damageTypeAltSelected = String(customWeaponDamageTypeAlt?.value || '').trim().toLowerCase();
          const normalizedAltDamageType = damageTypeOverride
            ? ''
            : (damageTypeAltSelected && damageTypeAltSelected !== damageTypeSelected ? damageTypeAltSelected : '');
          const weaponPayload = isWeapon ? {
            range: String(customWeaponRange?.value || 'melee').trim().toLowerCase() === 'ranged' ? 'ranged' : 'melee',
            category: String(customWeaponCategory?.value || '').trim().toLowerCase() || undefined,
            damage: {
              dice: String(customWeaponDice?.value || '').trim() || '1d4',
              type: damageTypeOverride || damageTypeSelected || 'bludgeoning',
              alt_type: normalizedAltDamageType || undefined
            },
            properties: allProperties,
            range_values: (Number.isFinite(rangeNormal) && rangeNormal > 0) || (Number.isFinite(rangeLong) && rangeLong > 0)
              ? {
                  ...(Number.isFinite(rangeNormal) && rangeNormal > 0 ? { normal: Math.floor(rangeNormal) } : {}),
                  ...(Number.isFinite(rangeLong) && rangeLong > 0 ? { long: Math.floor(rangeLong) } : {})
                }
              : undefined,
            versatile_dice: String(customWeaponVersatileDice?.value || '').trim() || undefined
          } : null;
          updated.equipment.gear.push({
            name,
            qty,
            desc: desc || undefined,
            value_gp: valueGp || undefined,
            object_form: inferredForm,
            equip_slot: (isWeapon ? 'weapon' : inferredSlot),
            weapon: weaponPayload || undefined
          });
          if (isWeapon) {
            const exists = updated.equipment.weapons.some(w => String(w || '').trim().toLowerCase() === lower);
            if (!exists) updated.equipment.weapons.push(name);
          }
        }
      } else if (mode === 'remove') {
        const selectedKey = String(removeItem.value || '').trim();
        const decBy = Math.max(1, Number(removeQty.value || 1));
        const choice = removeChoices.find(c => c.key === selectedKey)?.item || null;
        if (choice) {
          const matchIdx = updated.equipment.gear.findIndex(it => {
            const sameName = String(it?.name || '').trim().toLowerCase() === String(choice.name || '').trim().toLowerCase();
            const sameRef = String(it?.ref || '').trim().toLowerCase() === String(choice.ref || '').trim().toLowerCase();
            const sameDesc = String(it?.desc || '').trim() === String(choice.desc || '').trim();
            const sameMod = (Number(it?.modifier || 0) || 0) === (Number(choice?.modifier || 0) || 0);
            const sameValue = Math.max(0, Number(it?.value_gp || 0) || 0) === Math.max(0, Number(choice?.value_gp || 0) || 0);
            const sameSlot = String(it?.equip_slot || '').trim().toLowerCase() === String(choice?.equip_slot || '').trim().toLowerCase();
            const sameForm = String(it?.object_form || '').trim().toLowerCase() === String(choice?.object_form || '').trim().toLowerCase();
            const sameAttuned = (Number(it?.attuned_qty ?? (it?.attuned ? 1 : 0)) || 0) === (Number(choice?.attuned_qty ?? (choice?.attuned ? 1 : 0)) || 0);
            return sameName && sameRef && sameDesc && sameMod && sameValue && sameSlot && sameForm && sameAttuned;
          });
          if (matchIdx > -1) {
            const currentQty = Math.max(1, Number(updated.equipment.gear[matchIdx]?.qty || 1));
            const nextQty = currentQty - decBy;
            if (nextQty > 0) {
              updated.equipment.gear[matchIdx].qty = nextQty;
            } else {
              updated.equipment.gear.splice(matchIdx, 1);
            }
          }
          if (Array.isArray(updated.gear)) {
            const legacyIdx = updated.gear.findIndex(it => {
              const sameName = String(it?.name || '').trim().toLowerCase() === String(choice.name || '').trim().toLowerCase();
              const sameDesc = String(it?.desc || '').trim() === String(choice.desc || '').trim();
              return sameName && sameDesc;
            });
            if (legacyIdx > -1) {
              const currentQty = Math.max(1, Number(updated.gear[legacyIdx]?.qty || 1));
              const nextQty = currentQty - decBy;
              if (nextQty > 0) {
                updated.gear[legacyIdx].qty = nextQty;
              } else {
                updated.gear.splice(legacyIdx, 1);
              }
            }
          }

          const list = await loadEquipmentList();
          const ref = String(choice.ref || '').trim();
          const byRef = list.find(i => {
            const ids = [i?.id, i?.key, i?.index, i?.name].map(v => String(v || '').trim().toLowerCase());
            return ids.includes(ref.toLowerCase());
          });
          const inferredBaseName = byRef?.name
            || String(choice.name || '').replace(/\s*[+-]\d+\s*$/, '').trim()
            || String(choice.name || '').trim();
          const cat = getEquipmentCategory(byRef || {});
          const removeByNameCount = (arr, name, count) => {
            if (!Array.isArray(arr) || !name) return;
            let left = count;
            for (let i = arr.length - 1; i >= 0 && left > 0; i--) {
              if (String(arr[i] || '').trim().toLowerCase() === String(name).trim().toLowerCase()) {
                arr.splice(i, 1);
                left--;
              }
            }
          };
          if (cat.includes('weapon')) {
            removeByNameCount(updated.equipment.weapons, inferredBaseName, decBy);
          } else if (cat.includes('armor') || cat.includes('shield')) {
            removeByNameCount(updated.armor, inferredBaseName, decBy);
          } else {
            removeByNameCount(updated.equipment.weapons, inferredBaseName, decBy);
            removeByNameCount(updated.armor, inferredBaseName, decBy);
          }
        }
      } else if (mode === 'edit') {
        const selectedKey = String(editItem?.value || '').trim();
        const choice = removeChoices.find(c => c.key === selectedKey)?.item || null;
        if (choice) {
          const nextDesc = String(editDesc?.value || '').trim();
          const sameWeaponPayload = (a, b) => {
            const aw = (a?.weapon && typeof a.weapon === 'object') ? JSON.stringify(a.weapon) : '';
            const bw = (b?.weapon && typeof b.weapon === 'object') ? JSON.stringify(b.weapon) : '';
            return aw === bw;
          };
          const matchIdx = updated.equipment.gear.findIndex(it => gearItemSignature(it) === selectedKey);
          const fallbackIdx = matchIdx > -1 ? matchIdx : updated.equipment.gear.findIndex(it => {
            const sameName = String(it?.name || '').trim().toLowerCase() === String(choice?.name || '').trim().toLowerCase();
            const sameRef = String(it?.ref || '').trim().toLowerCase() === String(choice?.ref || '').trim().toLowerCase();
            const sameSlot = String(it?.equip_slot || '').trim().toLowerCase() === String(choice?.equip_slot || '').trim().toLowerCase();
            const sameForm = String(it?.object_form || '').trim().toLowerCase() === String(choice?.object_form || '').trim().toLowerCase();
            return sameName && sameRef && sameSlot && sameForm && sameWeaponPayload(it, choice);
          });
          const finalIdx = matchIdx > -1 ? matchIdx : fallbackIdx;
          if (finalIdx > -1) {
            updated.equipment.gear[finalIdx].desc = nextDesc || undefined;
          }
          if (Array.isArray(updated.gear)) {
            const legacyIdx = updated.gear.findIndex(it => gearItemSignature(it) === selectedKey);
            if (legacyIdx > -1) {
              updated.gear[legacyIdx].desc = nextDesc || undefined;
            }
          }
        }
      }
    }

    const deltas = {
      pp: Number(ppInput.value || 0),
      gp: Number(gpInput.value || 0),
      sp: Number(spInput.value || 0),
      cp: Number(cpInput.value || 0)
    };
    if (!updated.coins) updated.coins = { pp: 0, gp: 0, sp: 0, cp: 0 };
    for (const key of Object.keys(deltas)) {
      const next = Number(updated.coins[key] || 0) + Number(deltas[key] || 0);
      updated.coins[key] = Math.max(0, next);
    }

    try {
      await window.saveCharacter(file, updated, { prompt: false });
      window.setCurrentCharacter?.(file, updated);
      const state = window.readActionState ? window.readActionState(updated) : {};
      await renderCharacter(updated, state);
      close();
    } catch (err) {
      console.warn('Failed to save equipment changes', err);
      alert('Could not save changes. See console for details.');
    }
  };

  addBtn?.addEventListener('click', open);
  coinBtn?.addEventListener('click', open);
  cancelBtn.addEventListener('click', close);
  saveBtn.addEventListener('click', applyChanges);
  backdrop.addEventListener('click', () => {
    if (!modal.classList.contains('hidden')) close();
  });
  baseSelect.addEventListener('change', () => {
    syncDerived();
    syncPickValue();
  });
  filterForm.addEventListener('change', async () => {
    potionOnlyFilter = false;
    const list = await loadEquipmentList();
    renderBaseOptions(list);
  });
  filterSlot.addEventListener('change', async () => {
    potionOnlyFilter = false;
    const list = await loadEquipmentList();
    renderBaseOptions(list);
  });
  filterMinGp.addEventListener('input', async () => {
    potionOnlyFilter = false;
    const list = await loadEquipmentList();
    renderBaseOptions(list);
  });
  filterHomunculusBtn.addEventListener('click', async () => {
    potionOnlyFilter = false;
    filterForm.value = 'gem';
    filterMinGp.value = '100';
    const list = await loadEquipmentList();
    renderBaseOptions(list);
  });
  filterPotionsBtn?.addEventListener('click', async () => {
    potionOnlyFilter = true;
    filterSlot.value = 'wondrous_handheld';
    filterForm.value = '';
    filterMinGp.value = '0';
    const list = await loadEquipmentList();
    renderBaseOptions(list);
  });
  modifierInput.addEventListener('input', syncDerived);
  customIsWeapon?.addEventListener('change', syncMode);
  editItem?.addEventListener('change', () => {
    const selectedKey = String(editItem.value || '').trim();
    const choice = removeChoices.find(c => c.key === selectedKey)?.item || null;
    if (editDesc) editDesc.value = String(choice?.desc || '');
  });
  modeInputs.forEach(input => input.addEventListener('change', syncMode));
}

// --- Languages Rendering ---
function renderLanguages(character) {
  const box = F.languages();
  if (!box) return;

  const parts = [];
  const langs = Array.isArray(character.languages) ? character.languages : [];
  const traits = Array.isArray(character?.traits) ? character.traits : [];
  const hasTongueOfSunMoon =
    (String(character?.class || "").toLowerCase() === "monk" && Number(character?.level || 0) >= 13) ||
    traits.some(t => {
      const name = String((typeof t === "string" ? t : t?.name) || "").toLowerCase();
      return name.includes("tongue of the sun and moon");
    });
  
  if (character.isWildShaped) {
    if (hasTongueOfSunMoon) {
      parts.push("All (Tongue of the Sun and Moon)");
    } else if (langs.length > 0) {
      parts.push(`Understands: ${langs.join(', ')}`);
    }
    if (Array.isArray(character.specialSenses) && character.specialSenses.length > 0) {
      parts.push(...character.specialSenses);
    }
  } else {
    if (hasTongueOfSunMoon) {
      parts.push("All (Tongue of the Sun and Moon)");
    } else if (langs.length > 0) {
      parts.push(langs.join(', '));
    }
  }
  
  const text = parts.join(' • ');

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
  const cls = String(character?.class || "").toLowerCase();
  const level = Number(character?.level || 0);
  const traits = Array.isArray(character?.traits) ? character.traits : [];
  const hasToolExpertise =
    (cls === "artificer" && level >= 6) ||
    traits.some(t => String((typeof t === "string" ? t : t?.name) || "").toLowerCase().includes("tool expertise"));
  const cannySkill = getRangerCannySkillName(character);
  if (norm(tools).length) {
    const toolLabel = hasToolExpertise ? "Tools (x2 PB)" : "Tools";
    textParts.push(`${toolLabel}: ${norm(tools).join(", ")}`);
  }
  if (cannySkill) {
    textParts.push(`Canny (x2 PB): ${cannySkill}`);
  }

  window.autoFit(box, textParts.join(" • "), { max: 14, min: 8, className: 'base-text', wrap: true, lineHeight: 1.05, centerAbsolute: true });
  if ((hasToolExpertise && norm(tools).length) || cannySkill) {
    box.classList.add("tooltip");
    const tips = [];
    if (hasToolExpertise && norm(tools).length) {
      tips.push("Tool Expertise active: double proficiency bonus applies to ability checks using proficient tools.");
    }
    if (cannySkill) {
      tips.push(`Canny active: double proficiency bonus applies to ${cannySkill} checks.`);
    }
    box.dataset.tooltip = tips.join('\n');
  } else {
    box.classList.remove("tooltip");
    if (box.dataset.tooltip) delete box.dataset.tooltip;
  }
}

// --- Features & Traits ---
async function renderFeaturesBox(character) {
  const box = F.features();
  if (!box) return;
  box.innerHTML = '';

  const actionState = window.readActionState(character);
  const features = await window.loadAllFeatures(character);
  const getSneakAttackInfo = async () => {
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
  };

  const featureKey = (name) => String(name || '')
    .toLowerCase()
    .replace(/\bunarmored movement improvement\b/g, 'unarmored movement')
    .replace(/\s*\([^)]*\)\s*$/, '') // remove trailing "(...)"
    .trim();

  // De-duplicate features to show specific choices over generic placeholders.
  const suppressedBases = new Set();
  const replacedByUpgrade = new Set();
  const seenNames = new Set();
  const finalFeatures = [];

  // First pass: find specific features (e.g., "Name: Subtype") and mark their base for suppression.
  for (const f of features) {
    const name = String(f.name || '').trim();
    const desc = String(f?.desc || '').trim();

    // Check for `replaces` property to handle direct upgrades
    if (f.replaces) {
      replacedByUpgrade.add(featureKey(f.replaces));
    }
    // Also infer replacements from rules text like:
    // "Replaces Favored Enemy."
    const replaceMatch = desc.match(/\breplaces\s+([^.;\n]+)/i);
    if (replaceMatch?.[1]) {
      replacedByUpgrade.add(featureKey(replaceMatch[1]));
    }

    // Existing logic for ":" names
    if (name.includes(':')) {
      const baseName = name.split(':')[0].trim().toLowerCase();
      suppressedBases.add(baseName);
    }
  }

  // Second pass: choose the "best" feature per key (so upgrades win over base entries).
const bestByKey = new Map();

const featureRank = (f) => {
  // Prefer higher class level if source contains "Class N"
  const src = String(f?.source || '');
  const m = src.match(/\bClass\s+(\d+)\b/i);
  const lvl = m ? parseInt(m[1], 10) : 0;

  // Tiny tie-breaker: longer description tends to be the more complete one
  const descLen = String(f?.desc || '').length;

  return lvl * 100000 + descLen;
};

for (const f of features) {
  const name = String(f.name || '').trim();
  const key = featureKey(name);
  if (/^ability score (improvement|increase)$/i.test(name)) continue;
  if (/^background tag\s*:/i.test(name)) continue;

  // If this key is explicitly replaced by an upgrade, skip it
  if (replacedByUpgrade.has(key)) continue;

  // Suppress generic placeholders when a specific ":" version exists
  let isGenericAndSuppressed = false;
  for (const base of suppressedBases) {
    if (key.startsWith(base) && !key.includes(':')) {
      isGenericAndSuppressed = true;
      break;
    }
  }
  if (isGenericAndSuppressed) continue;

  const existing = bestByKey.get(key);
  if (!existing) {
    bestByKey.set(key, f);
    continue;
  }

  if (key === 'unarmored movement') {
    const existingDescLen = String(existing?.desc || '').length;
    const incomingDescLen = String(f?.desc || '').length;
    if (incomingDescLen > existingDescLen || (incomingDescLen === existingDescLen && featureRank(f) > featureRank(existing))) {
      bestByKey.set(key, { ...f, name: 'Unarmored Movement' });
    } else {
      bestByKey.set(key, { ...existing, name: 'Unarmored Movement' });
    }
    continue;
  }

  if (featureRank(f) > featureRank(existing)) {
    bestByKey.set(key, f);
  }
}

finalFeatures.push(...bestByKey.values());

  const sneak = await getSneakAttackInfo();
  if (sneak) {
    for (let i = finalFeatures.length - 1; i >= 0; i--) {
      if (String(finalFeatures[i]?.name || '').trim().toLowerCase() === 'sneak attack') {
        finalFeatures.splice(i, 1);
      }
    }
    finalFeatures.unshift({
      name: `Sneak Attack (${sneak.dice}d6)`,
      desc: sneak.desc || 'Once per turn, you can deal extra damage to one creature you hit with an attack if you have advantage on the attack roll, or if an enemy of the target is within 5 feet of it and you do not have disadvantage.'
    });
  }

  const cannySkill = normalizeSkillName(getRangerCannySkillName(character));
  const hasCannyRow = finalFeatures.some(f => /^canny\b/i.test(String(f?.name || '').trim()));
  if (cannySkill && !hasCannyRow) {
    finalFeatures.push({
      name: 'Canny',
      desc: `Deft Explorer option. You gain expertise in ${cannySkill}, and learn two additional languages.`
    });
  }

  const hasFavoredFoe = finalFeatures.some(f => /^favored foe\b/i.test(String(f?.name || '').trim()));
  const hasDeftExplorer = finalFeatures.some(f => /^deft explorer\b/i.test(String(f?.name || '').trim()));
  const hasPrimalAwareness = finalFeatures.some(f => /^primal awareness\b/i.test(String(f?.name || '').trim()));
  const hasTakenClassChoice = (needle) => {
    const want = String(needle || '').toLowerCase();
    if (!want) return false;
    const rows = [
      ...(Array.isArray(character?.choices?.classChoices) ? character.choices.classChoices : []),
      ...(Array.isArray(character?.choices?.levelUpDecisions)
        ? character.choices.levelUpDecisions.flatMap(d => (Array.isArray(d?.choices) ? d.choices : []))
        : [])
    ];
    return rows.some(row => {
      const id = String(row?.choiceId || '').toLowerCase();
      if (!id.includes(want)) return false;
      if (row?.taken === true) return true;
      const value = String(row?.value || '').trim().toLowerCase();
      return value === 'taken' || value === 'true' || value === 'yes';
    });
  };
  const tookPrimalAwareness = hasTakenClassChoice('optional:primal-awareness');
  const favoredChoice = String(
    character?.choices?.rangerChoices?.favoredChoice
    || character?.ranger_choices?.favoredChoice
    || ''
  ).trim().toLowerCase();
  const terrainChoice = String(
    character?.choices?.rangerChoices?.terrainChoice
    || character?.ranger_choices?.terrainChoice
    || ''
  ).trim().toLowerCase();
  const shouldHideFavoredEnemy = hasFavoredFoe || favoredChoice === 'favored-foe';
  const shouldHideNaturalExplorer = hasDeftExplorer || terrainChoice === 'deft-explorer';
  const shouldHidePrimevalAwareness = hasPrimalAwareness || tookPrimalAwareness;
  if (shouldHideFavoredEnemy || shouldHideNaturalExplorer || shouldHidePrimevalAwareness) {
    for (let i = finalFeatures.length - 1; i >= 0; i--) {
      const nm = String(finalFeatures[i]?.name || '').trim().toLowerCase();
      if (shouldHideFavoredEnemy && nm.includes('favored enemy')) {
        finalFeatures.splice(i, 1);
        continue;
      }
      if (shouldHideNaturalExplorer && nm.includes('natural explorer')) {
        finalFeatures.splice(i, 1);
        continue;
      }
      if (shouldHidePrimevalAwareness && nm.includes('primeval awareness')) {
        finalFeatures.splice(i, 1);
      }
    }
  }

  // Ensure TCE replacements appear even when source feature loader omits them.
  if (favoredChoice === 'favored-foe' && !finalFeatures.some(f => /^favored foe\b/i.test(String(f?.name || '').trim()))) {
    finalFeatures.push({
      name: 'Favored Foe',
      desc: 'When you hit a creature with an attack roll, you can mark it as your favored foe for 1 minute (as if concentrating on a spell). The first time on each of your turns that you hit it and deal damage, it takes an extra 1d4 damage. You can use this feature a number of times equal to your proficiency bonus per long rest.'
    });
  }
  if (terrainChoice === 'deft-explorer' && !finalFeatures.some(f => /^deft explorer\b/i.test(String(f?.name || '').trim()))) {
    finalFeatures.push({
      name: 'Deft Explorer',
      desc: 'You gain benefits as you advance: at 1st level choose Canny; at 6th level gain Roving; at 10th level gain Tireless.'
    });
  }
  if (tookPrimalAwareness && !finalFeatures.some(f => /^primal awareness\b/i.test(String(f?.name || '').trim()))) {
    finalFeatures.push({
      name: 'Primal Awareness',
      desc: "You learn additional ranger spells at certain levels; these spells don't count against spells known, and each can be cast once without a slot per long rest."
    });
  }

  // ...rest of your function continues here...



  finalFeatures.sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || ""), undefined, { sensitivity: "base" }));
  const baseChar = window.__char_original || character;
  const getSpellState = () => (window.readSpellState ? (window.readSpellState(baseChar) || {}) : {});
  const writeSpellState = (st) => { if (window.writeSpellState) window.writeSpellState(baseChar, st); };
  const getActionState = () => (window.readActionState ? (window.readActionState(baseChar) || {}) : {});
  const writeActionState = (st) => { if (window.writeActionState) window.writeActionState(baseChar, st); };
  const setStatus = (msg) => {
    const el = document.getElementById('status');
    if (!el) return;
    el.textContent = String(msg || '');
    if (msg) setTimeout(() => { if (el.textContent === msg) el.textContent = ''; }, 1800);
  };
  const persistOverride = () => {
    const file = (window.getCurrentCharacterFile && window.getCurrentCharacterFile()) || '';
    const clean = String(file || '').replace(/^\/?data\//, '');
    if (!clean || !window.STORAGE?.set) return;
    window.STORAGE.set(`dd:char:${clean}`, baseChar || null);
  };
  const dragonbornAncestryKey = String(baseChar?.draconic_ancestry || baseChar?.race_detail?.ancestry || '').toLowerCase();
  const DRAGONBORN_ANCESTRY = {
    black:  { label: 'Black',  damage: 'acid',      save: 'DEX', area: '5 by 30 ft. line' },
    blue:   { label: 'Blue',   damage: 'lightning', save: 'DEX', area: '5 by 30 ft. line' },
    brass:  { label: 'Brass',  damage: 'fire',      save: 'DEX', area: '5 by 30 ft. line' },
    bronze: { label: 'Bronze', damage: 'lightning', save: 'DEX', area: '5 by 30 ft. line' },
    copper: { label: 'Copper', damage: 'acid',      save: 'DEX', area: '5 by 30 ft. line' },
    gold:   { label: 'Gold',   damage: 'fire',      save: 'DEX', area: '15 ft. cone' },
    green:  { label: 'Green',  damage: 'poison',    save: 'CON', area: '15 ft. cone' },
    red:    { label: 'Red',    damage: 'fire',      save: 'DEX', area: '15 ft. cone' },
    silver: { label: 'Silver', damage: 'cold',      save: 'CON', area: '15 ft. cone' },
    white:  { label: 'White',  damage: 'cold',      save: 'CON', area: '15 ft. cone' }
  };
  const dragonbornAncestry = DRAGONBORN_ANCESTRY[dragonbornAncestryKey] || null;

  for (const f of finalFeatures) {
    const row = document.createElement('div');
    row.className = 'feature-item base-text tooltip';
    row.textContent = f.name;
    let featureTooltip = String(f.desc || '');
    const featureNameLower = String(f.name || '').toLowerCase();
    if (dragonbornAncestry && featureNameLower === 'draconic ancestry') {
      featureTooltip = `Draconic Ancestry (${dragonbornAncestry.label})\n\nBreath Weapon: ${dragonbornAncestry.area}, ${dragonbornAncestry.save} save, ${dragonbornAncestry.damage} damage type.\nDamage Resistance: ${dragonbornAncestry.damage}.`;
    } else if (dragonbornAncestry && featureNameLower === 'damage resistance') {
      featureTooltip = `Damage Resistance (${dragonbornAncestry.label} ancestry)\n\nYou have resistance to ${dragonbornAncestry.damage} damage.`;
    } else if (featureNameLower === 'martial arts' && String(character?.class || '').toLowerCase() === 'monk') {
      const die = monkMartialArtsDie(character.level);
      featureTooltip = `${featureTooltip}${featureTooltip ? '\n\n' : ''}Current Martial Arts Die: ${die}.`;
    }
    if (featureTooltip) row.setAttribute('data-tooltip', featureTooltip);

    if (featureNameLower.startsWith('favored foe')) {
      const pb = window.DDRules?.proficiencyFromLevel
        ? window.DDRules.proficiencyFromLevel(Number(baseChar?.level || 1))
        : (2 + Math.floor((Math.max(1, Number(baseChar?.level || 1)) - 1) / 4));
      const maxUses = Math.max(1, Number(pb || 2));
      const act = getActionState();
      const used = Math.max(0, Math.min(maxUses, Number(act?.favoredFoeUsed || 0)));
      row.textContent = `Favored Foe (${used}/${maxUses})`;
      row.style.cursor = 'pointer';
      const helper = `\n\nUses: ${used}/${maxUses} (based on proficiency bonus).\nRecharge: long rest.\nClick to spend 1 use. Shift-click refunds 1 use.`;
      row.setAttribute('data-tooltip', `${String(row.getAttribute('data-tooltip') || '')}${helper}`);
      row.addEventListener('click', (ev) => {
        const st = getActionState();
        const current = Math.max(0, Math.min(maxUses, Number(st?.favoredFoeUsed || 0)));
        st.favoredFoeUsed = ev.shiftKey
          ? Math.max(0, current - 1)
          : Math.min(maxUses, current + 1);
        writeActionState(st);
        persistOverride();
        renderCharacter(baseChar, st);
      });
    }

    if (f.name.toLowerCase().includes('halo of spores')) {
      const sp = getSpellState();
      const active = !!sp.symbioticActive;
      if (active) {
        const baseTip = String(f.desc || row.getAttribute('data-tooltip') || '');
        const m = baseTip.match(/(\d+)d(\d+)/i);
        let boostText = 'Symbiotic Entity active: roll Halo of Spores damage die twice.';
        if (m) {
          const dice = Math.max(1, Number(m[1] || 1));
          const die = Math.max(2, Number(m[2] || 4));
          boostText = `Symbiotic Entity active: Halo of Spores deals ${dice * 2}d${die} necrotic instead of ${dice}d${die}.`;
        }
        row.setAttribute('data-tooltip', `${baseTip}${baseTip ? '\n\n' : ''}${boostText}`);
      }
    }
    
    // Wild Shape specific logic
    if (f.name.toLowerCase().includes('wild shape')) {
      row.classList.add('wild-shape-feature');
      row.style.cursor = 'pointer';

      // --- NEW: Use getFeatureSummary to generate the dynamic text ---
      let featureName = f.name;
      // The feature object 'f' from loadAllFeatures doesn't have the scaling data.
      // We need to find the full feature definition from the class data.
      const classData = await window.loadClassesLocal().then(classes => classes.find(c => c.name === character.class));
      
      // Corrected: Look for the feature in the `features` object by level.
      let wildShapeFeatureDef = null;
      if (classData?.features) {
        for (const levelKey in classData.features) {
            wildShapeFeatureDef = classData.features[levelKey].find(feat => feat.name === 'Wild Shape');
            if (wildShapeFeatureDef) break;
        }
      }

      if (wildShapeFeatureDef) {
          const summary = getFeatureSummary(character, wildShapeFeatureDef);
          if (summary) {
              featureName = `${f.name} ${summary}`;
          }
      }
      row.textContent = featureName;

      if (actionState.isWildShaped) {
        row.classList.add('active');
        row.textContent = `› Wild Shape: ${actionState.wildShapeForm}`;
        row.setAttribute('data-tooltip', `You are in the form of a ${actionState.wildShapeForm}.\nClick to revert to your normal form.`);
        row.addEventListener('click', () => {
          if (!window.WildShapeUI?.revert) return;
          window.WildShapeUI.revert(window.__char_original, {
            onChange: () => {
              const stNow = window.readActionState(window.__char_original);
              renderCharacter(window.__char_original, stNow);
            }
          });
        });
      } else {
        row.addEventListener('click', () => {
          if (!window.WildShapeUI?.open) return;
          window.WildShapeUI.open(baseChar, {
            onChange: () => {
              const stNow = window.readActionState(baseChar);
              renderCharacter(baseChar, stNow);
            }
          });
        });
      }
    }

    // Symbiotic Entity (Circle of Spores) toggle in features list
    if (f.name.toLowerCase().includes('symbiotic entity')) {
      const cls = String(baseChar?.class || '').toLowerCase();
      const build = String(baseChar?.build || '').toLowerCase();
      if (cls === 'druid' && build.includes('spores')) {
        row.classList.add('symbiotic-feature');
        row.style.cursor = 'pointer';

        const spellState = getSpellState();
        const actState = getActionState();
        const isActive = !!spellState.symbioticActive;
        const isWildShapeActive = !!actState.isWildShaped;
        const wsMax = window.WildShapeUI?.getMaxUses ? window.WildShapeUI.getMaxUses(baseChar) : 0;
        const wsUsed = Math.max(0, Number(spellState.wildShapeUsed || 0));
        const wsRemaining = Number.isFinite(wsMax) ? Math.max(0, wsMax - wsUsed) : Number.POSITIVE_INFINITY;
        const tempGain = Math.max(0, Number(baseChar.level || 1) * 4);

        if (isActive) {
          row.classList.add('active');
          row.textContent = '› Symbiotic Entity (Active)';
        }
        if (isWildShapeActive) {
          row.classList.add('disabled');
          row.setAttribute('data-tooltip', `Symbiotic Entity\n\nUnavailable while Wild Shape form is active.\nRevert Wild Shape first.`);
        } else {
          row.setAttribute(
            'data-tooltip',
            `${String(f.desc || 'As an action, expend a use of Wild Shape to awaken spores around you.')}

Wild Shape uses remaining: ${Number.isFinite(wsRemaining) ? wsRemaining : '∞'}.
Temp HP granted on activation: ${tempGain}.
${isActive ? 'Click to end Symbiotic Entity.' : 'Click to activate (expends 1 Wild Shape use).'}`.trim()
          );
        }

        row.addEventListener('click', () => {
          const stateNow = getActionState();
          if (stateNow.isWildShaped) {
            setStatus('Symbiotic Entity is unavailable while Wild Shape form is active.');
            return;
          }

          const sp = getSpellState();
          const act = getActionState();
          const activeNow = !!sp.symbioticActive;
          if (activeNow) {
            sp.symbioticActive = false;
            const granted = Math.max(0, Number(act.symbioticTempHpGranted || 0));
            if (granted > 0 && Number(baseChar.tempHP || 0) <= granted) {
              baseChar.tempHP = 0;
            }
            delete act.symbioticTempHpGranted;
            writeSpellState(sp);
            writeActionState(act);
            persistOverride();
            renderCharacter(baseChar, act);
            return;
          }

          const maxUses = window.WildShapeUI?.getMaxUses ? window.WildShapeUI.getMaxUses(baseChar) : 0;
          const used = Math.max(0, Number(sp.wildShapeUsed || 0));
          if (Number.isFinite(maxUses) && used >= maxUses) {
            setStatus('No Wild Shape uses remaining for Symbiotic Entity.');
            return;
          }

          if (Number.isFinite(maxUses)) sp.wildShapeUsed = used + 1;
          sp.symbioticActive = true;
          const gain = Math.max(0, Number(baseChar.level || 1) * 4);
          baseChar.tempHP = Math.max(Number(baseChar.tempHP || 0), gain);
          act.symbioticTempHpGranted = gain;
          writeSpellState(sp);
          writeActionState(act);
          persistOverride();
          renderCharacter(baseChar, act);
        });
      }
    }
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

function hasPoisonImmunity(character) {
    const cls = String(character?.class || '').toLowerCase();
    const lvl = Number(character?.level || 0);
    if (cls === 'monk' && lvl >= 10) return true; // Purity of Body

    const traits = Array.isArray(character?.traits) ? character.traits : [];
    return traits.some(t => {
        const name = String((typeof t === 'string' ? t : t?.name) || '').toLowerCase();
        return name.includes('purity of body');
    });
}

function hasFungalBody(character) {
    const cls = String(character?.class || '').toLowerCase();
    const build = String(character?.build || '').toLowerCase();
    const lvl = Number(character?.level || 0);
    if (cls === 'druid' && build.includes('spores') && lvl >= 14) return true;

    const traits = Array.isArray(character?.traits) ? character.traits : [];
    return traits.some(t => {
        const name = String((typeof t === 'string' ? t : t?.name) || '').toLowerCase();
        return name.includes('fungal body');
    });
}

async function renderConditionsTracker(character) {
    const box = document.querySelector('#field-conditions');
    if (!box) return;

    const allConditions = await loadConditionsData();
    const activeConditions = new Set(window.readConditionState(character));
    const baseChar = window.__char_original || character;
    const poisonImmune = hasPoisonImmunity(character);
    const sp = window.readSpellState ? (window.readSpellState(baseChar) || {}) : {};
    const fungalBodyBlocks = hasFungalBody(character) && !!sp.symbioticActive;
    const fungalBlocked = new Set(['Blinded', 'Deafened', 'Frightened', 'Poisoned']);

    if (poisonImmune && activeConditions.has('Poisoned')) {
        activeConditions.delete('Poisoned');
        window.writeConditionState(character, Array.from(activeConditions));
    }

    if (fungalBodyBlocks) {
        let changed = false;
        for (const c of fungalBlocked) {
            if (activeConditions.has(c)) {
                activeConditions.delete(c);
                changed = true;
            }
        }
        if (changed) {
            window.writeConditionState(character, Array.from(activeConditions));
        }
    }

    // Incapacitated ends Symbiotic Entity.
    if (activeConditions.has('Incapacitated')) {
        if (sp.symbioticActive) {
            sp.symbioticActive = false;
            if (window.writeSpellState) window.writeSpellState(baseChar, sp);
            if (window.readActionState && window.writeActionState) {
                const act = window.readActionState(baseChar) || {};
                delete act.symbioticTempHpGranted;
                window.writeActionState(baseChar, act);
            }
            const file = (window.getCurrentCharacterFile && window.getCurrentCharacterFile()) || '';
            const clean = String(file || '').replace(/^\/?data\//, '');
            if (clean && window.STORAGE?.set) window.STORAGE.set(`dd:char:${clean}`, baseChar);
        }
    }

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
        const isDisabledByPoison = poisonImmune && cond.name === 'Poisoned';
        const isDisabledByFungal = fungalBodyBlocks && fungalBlocked.has(cond.name);
        const isDisabled = isDisabledByPoison || isDisabledByFungal;
        pill.dataset.tooltip = isDisabled
            ? (
                isDisabledByFungal
                    ? `${cond.name}\n\n${cond.desc}\n\nDisabled: Fungal Body prevents this condition while Symbiotic Entity is active.`
                    : `${cond.name}\n\n${cond.desc}\n\nDisabled: You are immune to the Poisoned condition (Purity of Body).`
            )
            : `${cond.name}\n\n${cond.desc}`;
        pill.dataset.condition = cond.name;

        if (activeConditions.has(cond.name)) {
            pill.classList.add('active');
        }
        if (isDisabled) pill.classList.add('disabled');

        pill.addEventListener('click', () => {
            if (isDisabled) return;
            // Read current state, modify it, and write it back
            const currentActiveSet = new Set(window.readConditionState(character));
            const turningOnIncapacitated = cond.name === 'Incapacitated' && !currentActiveSet.has('Incapacitated');
            if (currentActiveSet.has(cond.name)) {
                currentActiveSet.delete(cond.name);
            } else {
                currentActiveSet.add(cond.name);
            }
            window.writeConditionState(character, Array.from(currentActiveSet));

            if (turningOnIncapacitated) {
                const sp = window.readSpellState ? (window.readSpellState(baseChar) || {}) : {};
                if (sp.symbioticActive) {
                    sp.symbioticActive = false;
                    if (window.writeSpellState) window.writeSpellState(baseChar, sp);
                    if (window.readActionState && window.writeActionState) {
                        const act = window.readActionState(baseChar) || {};
                        delete act.symbioticTempHpGranted;
                        window.writeActionState(baseChar, act);
                    }
                    const file = (window.getCurrentCharacterFile && window.getCurrentCharacterFile()) || '';
                    const clean = String(file || '').replace(/^\/?data\//, '');
                    if (clean && window.STORAGE?.set) window.STORAGE.set(`dd:char:${clean}`, baseChar);
                }
            }

            // Re-render the entire character sheet to apply condition effects
            if (window.renderCharacter) window.renderCharacter(window.__char);
        });
        box.appendChild(pill);
    }
}

function getActiveConditionEffects(character) {
    const active = new Set(window.readConditionState(character));
    const poisonImmune = hasPoisonImmunity(character);
    const baseChar = window.__char_original || character;
    const sp = window.readSpellState ? (window.readSpellState(baseChar) || {}) : {};
    const fungalBodyBlocks = hasFungalBody(character) && !!sp.symbioticActive;
    if (fungalBodyBlocks) {
        active.delete('Blinded');
        active.delete('Deafened');
        active.delete('Frightened');
        active.delete('Poisoned');
    }
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

    if (active.has('Poisoned') && !poisonImmune) {
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

function hpBaseFromLevelLog(character) {
  const lvl = Math.max(1, Number(character?.level || 1));
  const logs = Array.isArray(character?.levelUpLog) ? character.levelUpLog : [];
  if (!logs.length) return null;
  const hitDie = Number(String(character?.hit_die || '').replace(/^d/i, '')) || 0;
  if (!hitDie) return null;

  const byLevel = new Map();
  for (const row of logs) {
    const toLevel = Number(row?.level || 0);
    if (toLevel >= 2 && toLevel <= lvl) byLevel.set(toLevel, row);
  }
  // Require contiguous log coverage so we do not "repair" from partial history.
  for (let to = 2; to <= lvl; to += 1) {
    if (!byLevel.has(to)) return null;
  }

  const baseConScore = Number(character?.abilities?.CON ?? character?.abilities?.con ?? 10);
  const baseConMod = window.DDRules.abilityMod(baseConScore);
  let total = hitDie + baseConMod; // level 1 max HP
  for (let to = 2; to <= lvl; to += 1) {
    const row = byLevel.get(to) || {};
    total += Number(row?.hpGain || 0) || 0;
    total += Number(row?.conHpAdjustment || 0) || 0;
  }
  return Math.max(1, total);
}

function syncHpFromEffectiveCon(character) {
  if (!character || typeof character !== 'object') return { changed: false };

  const level = Math.max(1, Number(character?.level || 1));
  const baseConScore = Number(character?.abilities?.CON ?? character?.abilities?.con ?? 10);
  const effectiveConScore = effectiveAbilityScore(character, 'CON');
  const baseConMod = window.DDRules.abilityMod(baseConScore);
  const effectiveConMod = window.DDRules.abilityMod(effectiveConScore);
  const conHpDelta = (effectiveConMod - baseConMod) * level;

  // Prefer deterministic base HP from the level-up log when available.
  const loggedBase = hpBaseFromLevelLog(character);
  const inferredBase = Math.max(1, Number(character.maxHP || 1) - conHpDelta);
  const baseMax = (loggedBase != null) ? loggedBase : inferredBase;
  const targetMax = Math.max(1, baseMax + conHpDelta);

  const prevMax = Math.max(1, Number(character.maxHP || 1));
  const prevCurrent = Math.max(0, Number(character.currentHP ?? prevMax));
  const hpDelta = targetMax - prevMax;
  if (!hpDelta) return { changed: false };

  character.maxHP = targetMax;
  character.currentHP = clamp(prevCurrent + hpDelta, 0, targetMax);
  return { changed: true, hpDelta, nextMax: targetMax, nextCurrent: character.currentHP };
}
window.syncHpFromEffectiveCon = window.syncHpFromEffectiveCon || syncHpFromEffectiveCon;

function persistCharacterOverrideFromSheet() {
  const file = (window.getCurrentCharacterFile && window.getCurrentCharacterFile()) || '';
  const clean = String(file || '').replace(/^\/?data\//, '');
  const base = window.__char_original || window.__char;
  if (!clean || !base || !window.STORAGE?.set) return;
  window.STORAGE.set(`dd:char:${clean}`, base);
}

function syncAndMaybeEndSymbioticOnTempZero() {
  const base = window.__char_original || window.__char;
  if (!base) return false;
  const tempNow = Math.max(0, Number(base.tempHP ?? window.__char?.tempHP ?? 0));
  base.tempHP = tempNow;

  const sp = window.readSpellState ? (window.readSpellState(base) || {}) : {};
  if (!sp.symbioticActive || tempNow > 0) return false;

  sp.symbioticActive = false;
  if (window.writeSpellState) window.writeSpellState(base, sp);

  if (window.readActionState && window.writeActionState) {
    const act = window.readActionState(base) || {};
    delete act.symbioticTempHpGranted;
    window.writeActionState(base, act);
  }
  persistCharacterOverrideFromSheet();
  return true;
}

function applyDamage(amount){
  if (!window.__char) return;
  const originalChar = window.__char_original;
  const state = window.readActionState(originalChar);

  let n = Math.max(0, Number(amount)|0);

  if (state.isWildShaped) {
    const currentBeastHP = state.wildShapeCurrentHP || 0;
    const newBeastHP = currentBeastHP - n;
    state.wildShapeCurrentHP = newBeastHP;
    window.writeActionState(originalChar, state);

    if (newBeastHP <= 0) {
        alert(`${state.wildShapeForm} form dropped to 0 HP! Reverting to normal form.`);
        // Trigger the revert logic from the feature box click handler
        const revertButton = document.querySelector('.wild-shape-feature.active');
        if (revertButton) revertButton.click();
    } else {
        renderCharacter(originalChar, state);
    }

  } else {
    let t = Number(window.__char.tempHP || 0);
    let c = Number(window.__char.currentHP || 0);

    const fromTemp = Math.min(t, n); t -= fromTemp; n -= fromTemp;
    const fromHP   = Math.min(c, n); c -= fromHP;

    window.__char.tempHP = t;
    window.__char.currentHP = c;
    if (window.__char_original && window.__char_original !== window.__char) {
      window.__char_original.tempHP = t;
      window.__char_original.currentHP = c;
    }
    const symbioticEnded = syncAndMaybeEndSymbioticOnTempZero();
    if (symbioticEnded && window.__char_original && window.renderCharacter) {
      const act = window.readActionState ? (window.readActionState(window.__char_original) || {}) : {};
      window.renderCharacter(window.__char_original, act);
    } else {
      renderHPCluster(window.__char);
    }
    saveHPSnapshot();
  }
}

function applyHealing(amount){
  if (!window.__char) return;
  const oldHP = Number(window.__char.currentHP || 0);
  const maxHP = Number(window.__char.maxHP || 0);
  const c = clamp(Number(window.__char.currentHP || 0) + (Number(amount)|0), 0, maxHP);

  const originalChar = window.__char_original;
  const state = window.readActionState(originalChar);

  if (state.isWildShaped) {
      const beastMaxHP = window.__char.maxHP;
      state.wildShapeCurrentHP = clamp((state.wildShapeCurrentHP || 0) + (Number(amount)|0), 0, beastMaxHP);
      window.writeActionState(originalChar, state);
      renderCharacter(originalChar, state);
  } else {
    window.__char.currentHP = c;

    // If healing from 0 HP, the character is no longer dying.
    if (oldHP === 0 && c > 0) {
      window.__char.deathSaves = { successes: 0, failures: 0 };
      renderDeathSaves(window.__char);
    }

    renderHPCluster(window.__char);
    saveHPSnapshot();
  }
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
      if (window.__char_original && window.__char_original !== window.__char) {
        window.__char_original.tempHP = 0;
      }
      const symbioticEnded = syncAndMaybeEndSymbioticOnTempZero();
      if (symbioticEnded && window.__char_original && window.renderCharacter) {
        const act = window.readActionState ? (window.readActionState(window.__char_original) || {}) : {};
        window.renderCharacter(window.__char_original, act);
      } else {
        renderHPCluster(window.__char);
      }
      saveHPSnapshot();
    }
  });
}

function renderInspirationControl(character) {
  const control = F.inspirationControl?.();
  if (!control) return;
  const base = window.__char_original || character;
  const hasInspiration = !!base?.inspiration;
  control.classList.toggle('active', hasInspiration);
  control.setAttribute('aria-pressed', hasInspiration ? 'true' : 'false');
  control.setAttribute(
    'data-tooltip',
    [
      'Inspiration',
      '',
      'Spend inspiration to gain advantage on one attack roll, saving throw, or ability check.',
      'You can hold at most one inspiration at a time.',
      '',
      `Status: ${hasInspiration ? 'Available' : 'Not available'}`,
      '',
      'Click to toggle on/off.'
    ].join('\n')
  );
}

function setInspirationState(enabled) {
  const base = window.__char_original || window.__char;
  if (!base) return;
  base.inspiration = !!enabled;
  if (window.__char && window.__char !== base) {
    window.__char.inspiration = !!enabled;
  }
  persistCharacterOverrideFromSheet();
  renderInspirationControl(base);
}

function wireInspirationToggle() {
  const control = F.inspirationControl?.();
  if (!control || control.dataset.bound === '1') return;
  control.dataset.bound = '1';
  control.addEventListener('click', () => {
    const base = window.__char_original || window.__char;
    setInspirationState(!base?.inspiration);
  });
  control.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    ev.preventDefault();
    const base = window.__char_original || window.__char;
    setInspirationState(!base?.inspiration);
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
  el.dataset.skillName = normalizeSkillName(id).toLowerCase();
  el.dataset.baseTooltip = String(tip || '');
  el.setAttribute('data-tooltip', tip);
  parentEl.appendChild(el);
}

function wireSkillHotspots() {
  addSkillHotspot('deception',
    { top: '302px', left: '603px', width: '45px', height: '9px' },
    'CHA (Deception): Your Charisma (Deception) check determines whether you can convincingly hide the truth, either verbally or through your actions.\n\nFey Wanderer (Otherworldly Glamour, level 3+): add your Wisdom modifier (minimum +1) to this Charisma check.'
  );
  addSkillHotspot('intimidation',
    { top: '315px', left: '603px', width: '59px', height: '9px'},
    'CHA (Intimidation): When you attempt to influence someone through overt threats, hostile actions, and physical violence, the DM might ask you to make a Charisma (Intimidation) check.\n\nFey Wanderer (Otherworldly Glamour, level 3+): add your Wisdom modifier (minimum +1) to this Charisma check.'
  );
  addSkillHotspot('performance',
    { top:'330px', left:'603px', width:'57px', height:'9px' },
    'CHA (Performance): Your Charisma (Performance) check determines how well you can delight an audience with music, dance, acting, storytelling, or some other form of entertainment.\n\nFey Wanderer (Otherworldly Glamour, level 3+): add your Wisdom modifier (minimum +1) to this Charisma check.'
  );
  addSkillHotspot('persuasion',
    { top:'345px', left:'603px', width:'49px', height:'9px' },
    'CHA (Persuasion): When you attempt to influence someone or a group of people with tact, social graces, or good nature, the DM might ask you to make a Charisma (Persuasion) check.\n\nFey Wanderer (Otherworldly Glamour, level 3+): add your Wisdom modifier (minimum +1) to this Charisma check.'
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
  addSkillHotspot('Arcana',
    { top:'471px', left:'603px', width:'34px', height:'9px' },
    'INT (Arcana): Your Intelligence (Arcana) check measures your ability to recall lore about spells, magic items, eldritch symbols, magical traditions, the planes of existence, and the inhabitants of those planes.'
  );
  addSkillHotspot('History',
    { top:'485px', left:'603px', width:'34px', height:'9px' },
    'INT (History): Your Intelligence (History) check measures your ability to recall lore about historical events, legendary people, ancient kingdoms, past disputes, recent wars, and lost civilizations.'
  );
  addSkillHotspot('Investigation',
    { top:'499px', left:'603px', width:'55px', height:'9px' },
    'INT (Investigation): When you look around for clues and make deductions based on those clues, you make an Intelligence (Investigation) check.'
  );
  addSkillHotspot('Nature',
    { top:'513px', left:'603px', width:'32px', height:'9px' },
    'INT (Nature): Your Intelligence (Nature) check measures your ability to recall lore about terrain, plants and animals, the weather, and natural cycles.'
  );
  addSkillHotspot('Religion',
    { top:'527px', left:'603px', width:'37px', height:'9px' },
    'INT (Religion): Your Intelligence (Religion) check measures your ability to recall lore about deities, rites and prayers, religious hierarchies, holy symbols, and the practices of secret cults.'
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
wireEquipmentModal();



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
  const raw = [
    ...(Array.isArray(c?.proficiencies?.saves) ? c.proficiencies.saves : []),
    ...(Array.isArray(c?.proficiencies?.saving_throws) ? c.proficiencies.saving_throws : []),
    ...(Array.isArray(c?.skill_proficiencies?.['saving throws']) ? c.skill_proficiencies['saving throws'] : []),
    ...(Array.isArray(c?.saving_throw_proficiencies) ? c.saving_throw_proficiencies : [])
  ];
  const saves = new Set(raw.map(v => String(v || '').trim().slice(0, 3).toUpperCase()).filter(Boolean));

  const cls = String(c?.class || '').toLowerCase();
  const lvl = Number(c?.level || 0);
  const traits = Array.isArray(c?.traits) ? c.traits : [];
  const hasDiamondSoul =
    (cls === 'monk' && lvl >= 14) ||
    traits.some(t => {
      const name = String((typeof t === 'string' ? t : t?.name) || '').toLowerCase();
      return name.includes('diamond soul');
    });

  if (hasDiamondSoul) {
    for (const abbr of Object.keys(PIP_MAP.saves)) saves.add(abbr);
  }

  return saves;
}

function readSkills(c) {
  const prof = Array.isArray(c?.proficiencies?.skills) ? c.proficiencies.skills : [];
  const legacy = Array.isArray(c?.skill_proficiencies?.skills) ? c.skill_proficiencies.skills : [];
  const out = new Set([...prof, ...legacy].map(s => String(s).trim()).filter(Boolean));
  const decisions = Array.isArray(c?.choices?.levelUpDecisions) ? c.choices.levelUpDecisions : [];
  for (const row of decisions) {
    for (const pick of (Array.isArray(row?.choices) ? row.choices : [])) {
      const id = String(pick?.choiceId || '').toLowerCase();
      if (!id.includes('otherworldly-glamour')) continue;
      const val = String(pick?.value || (Array.isArray(pick?.values) ? pick.values[0] : '') || '').trim();
      if (val) out.add(val);
    }
  }
  return out;
}

function normalizeSkillName(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  return s.replace(/\s*\([^)]*\)\s*/g, '').trim();
}

function getRangerCannySkillName(c) {
  const directValues = [
    c?.choices?.rangerChoices?.cannySkill,
    c?.ranger_choices?.cannySkill
  ];
  for (const entry of directValues) {
    const direct = normalizeSkillName(entry);
    if (direct) return direct;
  }

  const classChoices = Array.isArray(c?.choices?.classChoices) ? c.choices.classChoices : [];
  for (const row of classChoices) {
    const id = String(row?.choiceId || '').toLowerCase();
    if (!/ranger[-_ ]canny[-_ ]skill/.test(id)) continue;
    const val = normalizeSkillName(row?.value || (Array.isArray(row?.values) ? row.values[0] : ''));
    if (val) return val;
  }

  const decisions = Array.isArray(c?.choices?.levelUpDecisions) ? c.choices.levelUpDecisions : [];
  for (const dec of decisions) {
    for (const row of (Array.isArray(dec?.choices) ? dec.choices : [])) {
      const id = String(row?.choiceId || '').toLowerCase();
      if (!/ranger[-_ ]canny[-_ ]skill/.test(id)) continue;
      const val = normalizeSkillName(row?.value || (Array.isArray(row?.values) ? row.values[0] : ''));
      if (val) return val;
    }
  }
  return '';
}

function renderCannySkillTooltip(c) {
  const cannySkillLower = normalizeSkillName(getRangerCannySkillName(c)).toLowerCase();
  const nodes = document.querySelectorAll('#hotspot-layer [id^="skill-"]');
  if (!nodes?.length) return;
  const addendum = 'Canny: your proficiency bonus is doubled for checks using this skill.';
  for (const el of nodes) {
    const base = String(el.dataset.baseTooltip || el.getAttribute('data-tooltip') || '').trim();
    if (!el.dataset.baseTooltip) el.dataset.baseTooltip = base;
    const skillName = String(el.dataset.skillName || '').trim().toLowerCase();
    if (cannySkillLower && skillName === cannySkillLower) {
      const next = base ? `${base}\n\n${addendum}` : addendum;
      el.setAttribute('data-tooltip', next);
    } else {
      el.setAttribute('data-tooltip', base);
    }
  }
}

function renderProficiencyPips(character) {
  const layer = ensurePipLayer();
  if (!layer) return;

  const saves = readSaves(character);
  const skills = readSkills(character);
  const skillLower = new Set(Array.from(skills).map(s => s.toLowerCase()));
  const cannySkillLower = String(getRangerCannySkillName(character) || '').toLowerCase();

  for (const abbr of Object.keys(PIP_MAP.saves)) {
    const el = layer.querySelector(`.pip[data-id="save:${abbr}"]`);
    if (el) el.style.display = saves.has(abbr) ? 'block' : 'none';
  }
  for (const name of Object.keys(PIP_MAP.skills)) {
    const el = layer.querySelector(`.pip[data-id="skill:${CSS.escape(name)}"]`);
    if (!el) continue;
    const isProficient = skillLower.has(name.toLowerCase());
    el.style.display = isProficient ? 'block' : 'none';
    el.classList.toggle('canny-expertise', isProficient && !!cannySkillLower && name.toLowerCase() === cannySkillLower);
  }
  renderCannySkillTooltip(character);
}

function renderDiamondSoulControl(character) {
  const btn = document.getElementById('diamond-soul-reroll');
  if (!btn) return;

  const cls = String(character?.class || '').toLowerCase();
  const lvl = Number(character?.level || 0);
  const traits = Array.isArray(character?.traits) ? character.traits : [];
  const hasDiamondSoul =
    (cls === 'monk' && lvl >= 14) ||
    traits.some(t => {
      const name = String((typeof t === 'string' ? t : t?.name) || '').toLowerCase();
      return name.includes('diamond soul');
    });

  if (!hasDiamondSoul) {
    btn.style.display = 'none';
    return;
  }

  const originalChar = window.__char_original || character;
  const st = window.readSpellState ? (window.readSpellState(originalChar) || {}) : {};
  const kiMax = Math.max(0, lvl);
  const usedKi = Math.max(0, Number(st.kiSpent || 0));
  const remainingKi = Math.max(0, kiMax - usedKi);

  btn.style.display = 'block';
  btn.textContent = 'Diamond Soul: Reroll Save';
  btn.classList.toggle('no-resource', remainingKi < 1);
  btn.dataset.tooltip = [
    'Diamond Soul',
    '',
    'Whenever you fail a saving throw, you can spend 1 ki point to reroll it and must use the new result.',
    '',
    `Ki remaining: ${remainingKi}/${kiMax}`,
    '',
    'Click: spend 1 Ki for a reroll.',
    'Shift-click: refund 1 Ki.'
  ].join('\n');

  if (btn.dataset.bound === '1') return;
  btn.dataset.bound = '1';
  btn.addEventListener('click', (ev) => {
    const baseChar = window.__char_original || window.__char;
    if (!baseChar || String(baseChar.class || '').toLowerCase() !== 'monk') return;

    const level = Number(baseChar.level || 0);
    const maxKi = Math.max(0, level);
    const state = window.readSpellState ? (window.readSpellState(baseChar) || {}) : {};
    const curr = Math.max(0, Number(state.kiSpent || 0));
    const refund = !!ev.shiftKey;

    if (refund) {
      state.kiSpent = Math.max(0, curr - 1);
    } else {
      if ((maxKi - curr) < 1) {
        const status = document.getElementById('status');
        if (status) status.textContent = 'No Ki points remaining for Diamond Soul reroll.';
        return;
      }
      state.kiSpent = curr + 1;
    }

    if (window.writeSpellState) window.writeSpellState(baseChar, state);
    if (window.renderCharacter) {
      const actionState = window.readActionState ? (window.readActionState(baseChar) || {}) : {};
      window.renderCharacter(baseChar, actionState);
    }
  });
}
    if (customWeaponDamageType) customWeaponDamageType.value = 'piercing';
