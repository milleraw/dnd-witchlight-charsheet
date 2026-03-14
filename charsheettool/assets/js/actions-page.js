// assets/js/actions-page.js
(function(global) {
  'use strict';

  // --- DOM Refs ---
  const F = {
    status:      () => document.querySelector("#status"),
    nameBox:     () => document.querySelector("#field-name"),
    classBox:    () => document.querySelector("#field-class"),
    levelBox:    () => document.querySelector("#field-level"),
    build:       () => document.querySelector("#field-build"),
    eyesHair:    () => document.querySelector("#field-eyeshair"),
    gender:      () => document.querySelector("#field-gender"),
    playerName:  () => document.querySelector("#field-playername"),
    alignment:   () => document.querySelector("#field-alignment"),
    raceBox:     () => document.querySelector("#field-race"),
    raceTextEl:  () => document.querySelector("#race-text"),
    racePathEl:  () => document.querySelector("#race-curve"),
    bgBox:       () => document.querySelector("#field-background"),
    bgTextEl:    () => document.querySelector("#background-text"),
    bgPathEl:    () => document.querySelector("#background-curve"),
    statusTrackers: () => document.querySelector("#status-trackers"),
    actionMove:  () => document.querySelector("#action-move"),
    actionStd:   () => document.querySelector("#action-standard"),
    actionBonus: () => document.querySelector("#action-bonus"),
    actionReact: () => document.querySelector("#action-reaction"),
  };

  function spellStoringMaxUses(character) {
    const intScore = Number(character?.abilities?.INT ?? character?.abilities?.int ?? 10);
    const intMod = (window.DDRules && typeof window.DDRules.abilityMod === 'function')
      ? window.DDRules.abilityMod(intScore)
      : Math.floor((intScore - 10) / 2);
    return Math.max(2, intMod * 2);
  }

  function getEldritchCannonFreeUsed(state) {
    if (!state || typeof state !== 'object') return 0;
    const raw = state.eldritchCannonFreeUsed;
    if (Number.isFinite(Number(raw))) return Math.max(0, Math.min(1, Number(raw)));
    // Legacy fallback from older PB-based tracker
    return Math.max(0, Math.min(1, Number(state.eldritchCannonUsed || 0)));
  }

  function isArtilleristCharacter(character) {
    return String(character?.class || '').toLowerCase() === 'artificer'
      && String(character?.build || '').toLowerCase() === 'artillerist';
  }

  function eldritchCannonCapacity(character) {
    return (isArtilleristCharacter(character) && Number(character?.level || 1) >= 15) ? 2 : 1;
  }

  function getActiveCannons(state) {
    if (!state || typeof state !== 'object') return [];
    if (Array.isArray(state.eldritchCannons)) {
      return state.eldritchCannons.map(v => String(v || '').trim()).filter(Boolean);
    }
    if (state.eldritchCannonActive && String(state.eldritchCannonType || '').trim()) {
      return [String(state.eldritchCannonType || '').trim()];
    }
    return [];
  }

  function setActiveCannons(state, cannons) {
    if (!state || typeof state !== 'object') return;
    const list = (Array.isArray(cannons) ? cannons : []).map(v => String(v || '').trim()).filter(Boolean);
    state.eldritchCannons = list;
    state.eldritchCannonActive = list.length > 0;
    state.eldritchCannonType = list[0] || '';
  }

  function cannonTypeSummary(cannons, joiner = ' + ') {
    const list = (Array.isArray(cannons) ? cannons : []).map(v => String(v || '').trim()).filter(Boolean);
    if (!list.length) return '';
    if (list.length === 1) return list[0];
    return list.join(joiner);
  }

  function setEldritchCannonFreeUsed(state, next) {
    if (!state || typeof state !== 'object') return;
    const clamped = Math.max(0, Math.min(1, Number(next || 0)));
    state.eldritchCannonFreeUsed = clamped;
    // Keep legacy key aligned to avoid stale UI/logic in older paths.
    state.eldritchCannonUsed = clamped;
  }

  function getEligibleCannonSlotLevels(character) {
    const totals = window.DDRules?.slotsFor ? window.DDRules.slotsFor(character?.class, Number(character?.level || 1)) : {};
    const spellState = window.readSpellState(character) || {};
    const spent = spellState.slotsSpent || {};
    return Object.keys(totals || {})
      .map(k => Number(k))
      .filter(lvl => Number.isFinite(lvl) && lvl >= 1 && Number(totals[String(lvl)] || totals[lvl] || 0) > 0)
      .filter(lvl => {
        const total = Number(totals[String(lvl)] || totals[lvl] || 0);
        const used = Number(spent[String(lvl)] || 0);
        return used < total;
      })
      .sort((a, b) => a - b);
  }

  function spendCannonSpellSlot(character) {
    const eligible = getEligibleCannonSlotLevels(character);
    if (!eligible.length) return { ok: false, reason: 'no_slots' };

    let pick = eligible[eligible.length - 1];
    if (eligible.length > 1) {
      const input = window.prompt(`Create Eldritch Cannon by expending which spell slot level? Eligible: ${eligible.join(', ')}`, String(pick));
      if (input == null) return { ok: false, reason: 'cancelled' };
      const parsed = Number(input);
      if (!eligible.includes(parsed)) return { ok: false, reason: 'invalid_slot', eligible };
      pick = parsed;
    }

    const spellState = window.readSpellState(character) || {};
    const spent = spellState.slotsSpent || {};
    spent[String(pick)] = Math.max(0, Number(spent[String(pick)] || 0)) + 1;
    spellState.slotsSpent = spent;
    window.writeSpellState(character, spellState);
    return { ok: true, slotLevel: pick };
  }

  function getBattleMasterSuperiorityMax(character) {
    const isBm = String(character?.class || '').toLowerCase() === 'fighter'
      && String(character?.build || '').toLowerCase() === 'battle master';
    if (!isBm) return 0;
    const lvl = Number(character?.level || 1);
    if (lvl >= 15) return 6;
    if (lvl >= 7) return 5;
    if (lvl >= 3) return 4;
    return 0;
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

  function getDisplayRaceLabel(character, raceInfo) {
    const baseRaceLabel = String(raceInfo?.displayName || character?.race || '').trim();
    const subraceLabel = String(character?.subrace || '').trim();
    if (!baseRaceLabel) return subraceLabel;
    if (baseRaceLabel.toLowerCase() === 'tiefling') return baseRaceLabel;
    return subraceLabel || baseRaceLabel;
  }

  function getKnownManeuverSet(character) {
    const set = new Set();
    const add = (v) => {
      const n = normalizeManeuverName(v);
      if (n) set.add(n);
    };
    (Array.isArray(character?.maneuvers) ? character.maneuvers : []).forEach(add);
    const classChoices = Array.isArray(character?.choices?.classChoices) ? character.choices.classChoices : [];
    classChoices.forEach(row => {
      if (!String(row?.choiceId || '').toLowerCase().includes('maneuver')) return;
      (Array.isArray(row?.values) ? row.values : []).forEach(add);
      add(row?.value);
    });
    const levelUp = Array.isArray(character?.choices?.levelUpDecisions) ? character.choices.levelUpDecisions : [];
    levelUp.forEach(dec => {
      (Array.isArray(dec?.choices) ? dec.choices : []).forEach(row => {
        if (!String(row?.choiceId || '').toLowerCase().includes('maneuver')) return;
        (Array.isArray(row?.values) ? row.values : []).forEach(add);
        add(row?.value);
      });
    });
    return set;
  }

  function characterHasFeat(character, needle) {
    const want = String(needle || '').trim().toLowerCase();
    if (!want) return false;
    const feats = Array.isArray(character?.feats) ? character.feats : [];
    return feats.some(f => {
      const id = String(f?.id || '').toLowerCase();
      const name = String(f?.name || '').toLowerCase();
      const key = String(f?.key || '').toLowerCase();
      return id.includes(want) || name.includes(want) || key.includes(want);
    });
  }

  function spendSmiteSpellSlot(character) {
    const cls = String(character?.class || '').toLowerCase();
    const lvl = Number(character?.level || 1);
    const totals = window.DDRules?.slotsFor ? window.DDRules.slotsFor(cls, lvl) : {};
    const st = window.readSpellState(character) || {};
    const spent = st.slotsSpent || {};
    const eligible = Object.keys(totals || {})
      .map(k => Number(k))
      .filter(slot => Number.isFinite(slot) && slot >= 1 && Number(totals[String(slot)] || 0) > Number(spent[String(slot)] || 0))
      .sort((a, b) => a - b);
    if (!eligible.length) return { ok: false, reason: 'no_slots' };
    let pick = eligible[0];
    if (eligible.length > 1) {
      const input = window.prompt(`Divine Smite: expend which spell slot level? Eligible: ${eligible.join(', ')}`, String(pick));
      if (input == null) return { ok: false, reason: 'cancelled' };
      const parsed = Number(input);
      if (!eligible.includes(parsed)) return { ok: false, reason: 'invalid_slot' };
      pick = parsed;
    }
    spent[String(pick)] = Math.max(0, Number(spent[String(pick)] || 0)) + 1;
    st.slotsSpent = spent;
    window.writeSpellState(character, st);
    return { ok: true, slotLevel: pick };
  }

  function openAttackOptionsModal(character, rerender) {
    const actionState = window.readActionState(character) || {};
    const spellState = window.readSpellState(character) || {};
    const superiorityMax = getBattleMasterSuperiorityMax(character);
    const superiorityUsed = Math.max(0, Number(actionState.battleMasterSuperiorityUsed || 0));
    const superiorityRemaining = Math.max(0, superiorityMax - superiorityUsed);
    const maneuvers = getKnownManeuverSet(character);
    const hasPrecisionAttack = maneuvers.has('precision attack');
    const hasTripAttack = maneuvers.has('trip attack');
    const isPaladin = String(character?.class || '').toLowerCase() === 'paladin' && Number(character?.level || 1) >= 2;
    const isRogue = String(character?.class || '').toLowerCase() === 'rogue' && Number(character?.level || 1) >= 1;
    const isMonk = String(character?.class || '').toLowerCase() === 'monk' && Number(character?.level || 1) >= 5;
    const isBarbarian = String(character?.class || '').toLowerCase() === 'barbarian' && Number(character?.level || 1) >= 2;

    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0,0,0,0.55)';
    overlay.style.zIndex = '10000';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';

    const modal = document.createElement('div');
    modal.style.width = 'min(760px, 96vw)';
    modal.style.maxHeight = '88vh';
    modal.style.overflow = 'auto';
    modal.style.background = '#fff';
    modal.style.border = '1px solid #cfc9c1';
    modal.style.borderRadius = '8px';
    modal.style.boxShadow = '0 10px 30px rgba(0,0,0,0.25)';
    modal.style.padding = '14px';

    const kiMax = Math.max(0, Number(character?.level || 0));
    const kiUsed = Math.max(0, Number(spellState.kiSpent || 0));
    const kiRemaining = Math.max(0, kiMax - kiUsed);
    const sneakUsedTurn = !!actionState.sneakAttackUsedTurn;
    const preGwm = !!actionState.attackPreGreatWeaponMaster;
    const preSharp = !!actionState.attackPreSharpshooter;
    const preReckless = !!actionState.attackPreRecklessAttack;

    modal.innerHTML = `
      <h3 style="margin:0 0 10px 0; font-family: var(--font-display, serif); color:#5a2a12; font-size: 20px;">Attack Options</h3>
      <div style="font-size:12px; color:#555; margin-bottom:10px;">Superiority Dice: ${superiorityUsed}/${superiorityMax}${superiorityMax ? ` (${superiorityRemaining} remaining)` : ''}</div>

      <div style="border:1px solid #ddd; border-radius:6px; padding:10px; margin-bottom:10px;">
        <div style="font-weight:700; margin-bottom:6px;">Before Roll</div>
        <label class="tooltip" data-tooltip="Great Weapon Master: before you make a melee attack with a heavy weapon you are proficient with, you can take -5 to hit for +10 damage." style="display:block; margin:4px 0;"><input id="atk-pre-gwm" type="checkbox" ${preGwm ? 'checked' : ''}> Great Weapon Master (-5 hit / +10 damage)</label>
        <label class="tooltip" data-tooltip="Sharpshooter: before you make a ranged attack with a weapon you are proficient with, you can take -5 to hit for +10 damage." style="display:block; margin:4px 0;"><input id="atk-pre-sharp" type="checkbox" ${preSharp ? 'checked' : ''}> Sharpshooter (-5 hit / +10 damage)</label>
        <label style="display:block; margin:4px 0;">
          <input id="atk-pre-reckless" type="checkbox" ${preReckless ? 'checked' : ''} ${isBarbarian ? '' : 'disabled'}>
          <span id="atk-pre-reckless-label" class="tooltip" data-tooltip="Reckless Attack: on your first attack this turn, you can gain advantage on Strength-based melee attack rolls during this turn; attack rolls against you have advantage until your next turn.">Reckless Attack ${isBarbarian ? '' : '(Barbarian 2+)'}</span>
        </label>
        <button id="atk-pre-precision" class="tooltip" data-tooltip="Precision Attack (Battle Master): expend one superiority die to add it to your attack roll. You can use this before or after the roll, but before effects are applied." style="margin-top:6px;" ${hasPrecisionAttack && superiorityRemaining > 0 ? '' : 'disabled'}>Precision Attack (spend 1 Superiority Die)</button>
      </div>

      <div style="border:1px solid #ddd; border-radius:6px; padding:10px; margin-bottom:10px;">
        <div style="font-weight:700; margin-bottom:6px;">On Hit</div>
        <button id="atk-hit-divine-smite" class="tooltip" data-tooltip="Divine Smite: when you hit with a melee weapon attack, expend a spell slot to deal radiant damage (plus extra vs undead/fiends)." ${isPaladin ? '' : 'disabled'}>Divine Smite (spend spell slot)</button>
        <button id="atk-hit-sneak" class="tooltip" data-tooltip="Sneak Attack: once per turn, when conditions are met, add Sneak Attack damage to your hit." style="margin-left:8px;" ${isRogue ? '' : 'disabled'}>Sneak Attack ${isRogue ? (sneakUsedTurn ? '(used this turn)' : '(mark used this turn)') : ''}</button>
        <button id="atk-hit-stunning" class="tooltip" data-tooltip="Stunning Strike: when you hit with a melee weapon attack, spend 1 Ki; target makes a CON save or is stunned until end of your next turn." style="margin-left:8px;" ${isMonk && kiRemaining > 0 ? '' : 'disabled'}>Stunning Strike (1 Ki)</button>
        <button id="atk-hit-trip" class="tooltip" data-tooltip="Trip Attack (Battle Master): expend one superiority die to add it to damage and force a STR save (if target Large or smaller) or be knocked prone." style="margin-left:8px;" ${hasTripAttack && superiorityRemaining > 0 ? '' : 'disabled'}>Trip Attack (spend 1 Superiority Die)</button>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button id="atk-close" style="padding:8px 14px; border:1px solid #b8b2aa; background:#f2f0ec; cursor:pointer;">Close</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const close = () => {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (typeof rerender === 'function') rerender(character);
    };
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    modal.querySelector('#atk-close')?.addEventListener('click', close);

    const savePreToggle = (key, checked) => {
      const st = window.readActionState(character) || {};
      st[key] = !!checked;
      window.writeActionState(character, st);
    };
    modal.querySelector('#atk-pre-gwm')?.addEventListener('change', (e) => savePreToggle('attackPreGreatWeaponMaster', !!e.target.checked));
    modal.querySelector('#atk-pre-sharp')?.addEventListener('change', (e) => savePreToggle('attackPreSharpshooter', !!e.target.checked));
    modal.querySelector('#atk-pre-reckless')?.addEventListener('change', (e) => savePreToggle('attackPreRecklessAttack', !!e.target.checked));
    const recklessLabel = modal.querySelector('#atk-pre-reckless-label');
    if (recklessLabel) {
      recklessLabel.style.cursor = 'help';
    }

    const spendSuperiority = () => {
      const st = window.readActionState(character) || {};
      const max = getBattleMasterSuperiorityMax(character);
      const used = Math.max(0, Number(st.battleMasterSuperiorityUsed || 0));
      if (used >= max) return false;
      st.battleMasterSuperiorityUsed = used + 1;
      window.writeActionState(character, st);
      return true;
    };

    modal.querySelector('#atk-pre-precision')?.addEventListener('click', () => {
      if (!spendSuperiority()) {
        if (F.status()) {
          F.status().textContent = 'No superiority dice remaining.';
          setTimeout(() => { if (F.status()?.textContent === 'No superiority dice remaining.') F.status().textContent = ''; }, 1500);
        }
      }
      close();
    });

    modal.querySelector('#atk-hit-trip')?.addEventListener('click', () => {
      if (!spendSuperiority()) {
        if (F.status()) {
          F.status().textContent = 'No superiority dice remaining.';
          setTimeout(() => { if (F.status()?.textContent === 'No superiority dice remaining.') F.status().textContent = ''; }, 1500);
        }
      }
      close();
    });

    modal.querySelector('#atk-hit-divine-smite')?.addEventListener('click', () => {
      const res = spendSmiteSpellSlot(character);
      if (!res.ok && F.status()) {
        F.status().textContent = res.reason === 'no_slots' ? 'No spell slots available for Divine Smite.' : 'Divine Smite not applied.';
        setTimeout(() => { F.status().textContent = ''; }, 1500);
      }
      close();
    });

    modal.querySelector('#atk-hit-stunning')?.addEventListener('click', () => {
      const st = window.readSpellState(character) || {};
      const curr = Math.max(0, Number(st.kiSpent || 0));
      const max = Math.max(0, Number(character?.level || 0));
      if (curr >= max) {
        if (F.status()) {
          F.status().textContent = 'No Ki points remaining.';
          setTimeout(() => { F.status().textContent = ''; }, 1500);
        }
      } else {
        st.kiSpent = curr + 1;
        window.writeSpellState(character, st);
      }
      close();
    });

    modal.querySelector('#atk-hit-sneak')?.addEventListener('click', () => {
      const st = window.readActionState(character) || {};
      st.sneakAttackUsedTurn = !st.sneakAttackUsedTurn;
      window.writeActionState(character, st);
      close();
    });
  }

  // --- Renderers ---
  function renderHeader(character) {
    // Name
    if (window.NameCurves?.renderTwoArcName) {
      window.NameCurves.renderTwoArcName(F, character.name);
    }
    // Class & Level
    window.autoFit(F.classBox(), (character.class || ''), { max: 40, min: 12, letterSpacing: -0.2, fontFamily: 'var(--font-display)' });
    window.autoFit(F.levelBox(), String(character.level ?? ''), { max: 24, min: 10, className: 'base-text', fontFamily: 'var(--font-body)' });
    // Other simple fields
    window.autoFit(F.build(), character.build ?? '', { max: 22, min: 10, letterSpacing: -0.1, fontFamily: 'var(--font-display)' });
    window.autoFit(F.eyesHair(), character.eyes_hair ?? '', { max: 18, min: 9, letterSpacing: -0.1, fontFamily: 'var(--font-display)' });
    window.autoFit(F.gender(), character.gender ?? '', { max: 18, min: 9, letterSpacing: -0.1, fontFamily: 'var(--font-display)' });
    window.autoFit(F.playerName(), character.player_name ?? '', { max: 18, min: 9, letterSpacing: -0.1, fontFamily: 'var(--font-display)' });
    window.autoFit(F.alignment(), character.alignment ?? '', { max: 18, min: 9, letterSpacing: -0.1, fontFamily: 'var(--font-display)' });
    // Race
    const raceInfo = window.resolveRaceAlias(character);
    const raceTextEl = F.raceTextEl();
    if (raceTextEl) {
      const raceLabel = getDisplayRaceLabel(character, raceInfo);
      raceTextEl.querySelector('textPath').textContent = raceLabel;
      if (window.NameCurves?.growFitTextToPath) {
        window.NameCurves.growFitTextToPath(raceTextEl, F.racePathEl(), (F.raceBox().clientHeight || 60) * 0.90, 16, 8);
      }
    }
    // Background
    const bgTextEl = F.bgTextEl();
    if (bgTextEl) {
      bgTextEl.querySelector('textPath').textContent = String(character.background || '').trim();
      if (window.NameCurves?.growFitTextToPath) {
        window.NameCurves.growFitTextToPath(bgTextEl, F.bgPathEl(), (F.bgBox().clientHeight || 60) * 0.90, 16, 8);
      }
    }
  }

  function renderResourceTrackers(character, state) {
    const container = F.statusTrackers();
    const isArtillerist = isArtilleristCharacter(character);
    const cls = String(character.class || '').toLowerCase();
    const hasKi = cls === 'monk' && (Number(character.level || 0) >= 2);
    const wildShapeMax = window.WildShapeUI?.getMaxUses ? window.WildShapeUI.getMaxUses(character) : 0;
    const hasWildShape = Number.isFinite(wildShapeMax) && wildShapeMax > 0;

    if (hasKi) {
      const maxKi = Number(character.level || 1);
      const spellState = window.readSpellState(character);
      const usedCount = Number(spellState.kiSpent || 0);

      const pill = document.createElement('div');
      pill.className = 'status-toggle';

      const dotsContainer = document.createElement('div');
      dotsContainer.className = 'resource-dots';

      for (let i = 0; i < maxKi; i++) {
        const dot = document.createElement('div');
        dot.className = 'resource-dot' + (i < usedCount ? ' spent' : '');
        dot.title = 'Ki point (Shift-click to reset)';
        dot.addEventListener('click', (e) => {
          const st = window.readSpellState(character);
          const curr = Number(st.kiSpent || 0);
          st.kiSpent = !e.shiftKey ? ((i < curr) ? i : (i + 1)) : 0;
          window.writeSpellState(character, st);
          render(character);
        });
        dotsContainer.appendChild(dot);
      }

      pill.innerHTML = '<span>Ki</span>';
      pill.appendChild(dotsContainer);
      container.appendChild(pill);
    }

    if (hasWildShape) {
      const spellState = window.readSpellState(character);
      const usedCount = Number(spellState.wildShapeUsed || 0);

      const pill = document.createElement('div');
      pill.className = 'status-toggle';

      const dotsContainer = document.createElement('div');
      dotsContainer.className = 'resource-dots';

      for (let i = 0; i < wildShapeMax; i++) {
        const dot = document.createElement('div');
        dot.className = 'resource-dot' + (i < usedCount ? ' spent' : '');
        dot.title = 'Wild Shape use (Shift-click to reset)';
        dot.addEventListener('click', (e) => {
          const st = window.readSpellState(character);
          const curr = Number(st.wildShapeUsed || 0);
          st.wildShapeUsed = !e.shiftKey ? ((i < curr) ? i : (i + 1)) : 0;
          if (Number(st.wildShapeUsed || 0) < 1 && st.symbioticActive) st.symbioticActive = false;
          window.writeSpellState(character, st);
          render(character);
        });
        dotsContainer.appendChild(dot);
      }

      pill.innerHTML = '<span>Wild Shape</span>';
      pill.appendChild(dotsContainer);
      container.appendChild(pill);
    }

    const superiorityMax = getBattleMasterSuperiorityMax(character);
    if (superiorityMax > 0) {
      const usedCount = Math.max(0, Math.min(superiorityMax, Number(state?.battleMasterSuperiorityUsed || 0)));

      const pill = document.createElement('div');
      pill.className = 'status-toggle';

      const dotsContainer = document.createElement('div');
      dotsContainer.className = 'resource-dots';

      for (let i = 0; i < superiorityMax; i++) {
        const dot = document.createElement('div');
        dot.className = 'resource-dot' + (i < usedCount ? ' spent' : '');
        dot.title = 'Superiority Die (short/long rest recharge). Shift-click resets.';
        dot.addEventListener('click', (e) => {
          const currentState = window.readActionState(character) || {};
          const curr = Math.max(0, Number(currentState.battleMasterSuperiorityUsed || 0));
          currentState.battleMasterSuperiorityUsed = !e.shiftKey ? ((i < curr) ? i : (i + 1)) : 0;
          window.writeActionState(character, currentState);
          render(character);
        });
        dotsContainer.appendChild(dot);
      }

      pill.innerHTML = '<span>Superiority Dice</span>';
      pill.appendChild(dotsContainer);
      container.appendChild(pill);
    }

    if (isArtillerist && character.level >= 3) {
        const maxUses = 1;
        const usedCount = getEldritchCannonFreeUsed(state);

        const pill = document.createElement('div');
        pill.className = 'status-toggle';
        
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'resource-dots';

        for (let i = 0; i < maxUses; i++) {
            const dot = document.createElement('div');
            dot.className = 'resource-dot' + (i < usedCount ? ' spent' : '');
            dot.title = 'Eldritch Cannon free use (long rest recharge). Shift-click resets.';
            dot.addEventListener('click', (e) => {
                const currentState = window.readActionState(character);
                const currentUsed = getEldritchCannonFreeUsed(currentState);
                const nextUsed = !e.shiftKey ? ((i < currentUsed) ? i : (i + 1)) : 0;
                setEldritchCannonFreeUsed(currentState, nextUsed);
                window.writeActionState(character, currentState);
                render(character);
            });
            dotsContainer.appendChild(dot);
        }
        pill.innerHTML = `<span>Eldritch Cannon (Free)</span>`;
        pill.appendChild(dotsContainer);
        container.appendChild(pill);
    }

    // Rabbit Hop usage is tracked inline on the Rabbit Hop bonus action row.
  }

  function persistCharacterOverride(character) {
    const file = (window.getCurrentCharacterFile && window.getCurrentCharacterFile()) || '';
    const clean = String(file || '').replace(/^\/?data\//, '');
    if (!clean || !window.STORAGE?.set) return;
    window.STORAGE.set(`dd:char:${clean}`, character || null);
  }

  async function render(character) {
    global._currentCharacter = character; // Expose for debugging
    renderHeader(character);
    const state = window.readActionState(character) || {};
    F.statusTrackers().innerHTML = ''; // Clear old toggles
    renderResourceTrackers(character, state);

    // Clear existing content before rendering new actions
    F.actionMove().innerHTML = '<h2>Move <span class="heading-helper"></span></h2>';
    F.actionStd().innerHTML = '<h2>Action <span class="heading-helper">(1 per turn)</span></h2>';
    F.actionBonus().innerHTML = '<h2>Bonus Action <span class="heading-helper">(Max. 1 per turn)</span></h2>';
    F.actionReact().innerHTML = '<h2>Reaction <span class="heading-helper">(Max. 1 per round)</span></h2>';

    // Update dynamic heading helper for speed
    const moveHelperEl = F.actionMove().querySelector('.heading-helper');
    if (moveHelperEl) {
      const calc = await window.CharCalculations.calculateSpeed(character, null);
      moveHelperEl.textContent = `(up to ${calc.total} ft)`;
    }

    if (typeof window.getCharacterActions !== 'function') {
      console.error('actions-logic.js is not loaded or getCharacterActions is not defined.');
      return;
    }

    const allActions = await window.getCharacterActions(character, state);
    const spellStateForSSI = window.readSpellState ? (window.readSpellState(character) || {}) : {};
    const ssi = (spellStateForSSI && typeof spellStateForSSI.spellStoringItem === 'object' && spellStateForSSI.spellStoringItem)
      ? spellStateForSSI.spellStoringItem
      : null;
    const ssiSpell = String(ssi?.spellName || '').trim();
    if (ssiSpell) {
      const itemName = String(ssi?.itemName || 'item').trim();
      const actionName = `Spell-Storing Item: ${ssiSpell} (${itemName})`;
      const exists = (Array.isArray(allActions?.action) ? allActions.action : [])
        .some(a => String(a?.name || '').toLowerCase() === actionName.toLowerCase());
      if (!exists) {
        if (!Array.isArray(allActions.action)) allActions.action = [];
        allActions.action.unshift({
          name: actionName,
          source: 'Class Feature',
          desc: `Cast ${ssiSpell} from ${itemName}.\n\nClick to spend 1 use. Shift-click refunds 1 use. Shift+Alt-click clears the stored spell/item.\n\nIf created through Arcane Firearm, these castings do not gain Arcane Firearm +1d8.`,
          ssiTracker: true
        });
      }
    }

    function chooseFromPicklist(title, options, defaultValue = '') {
      return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.background = 'rgba(0,0,0,0.55)';
        overlay.style.zIndex = '10000';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        const modal = document.createElement('div');
        modal.style.width = 'min(480px, 92vw)';
        modal.style.background = '#fff';
        modal.style.border = '1px solid #cfc9c1';
        modal.style.borderRadius = '8px';
        modal.style.boxShadow = '0 10px 30px rgba(0,0,0,0.25)';
        modal.style.padding = '14px';
        const opts = (Array.isArray(options) ? options : []).map(o => String(o || '')).filter(Boolean);
        const selected = opts.includes(defaultValue) ? defaultValue : (opts[0] || '');
        modal.innerHTML = `
          <h3 style="margin:0 0 10px 0; font-family: var(--font-display, serif); color:#5a2a12; font-size: 20px;">${title}</h3>
          <div style="padding: 4px 0 12px;">
            <select id="simple-picklist" style="width: 100%; font-size: 14px; padding: 8px;">
              ${opts.map(o => `<option value="${o}" ${o === selected ? 'selected' : ''}>${o}</option>`).join('')}
            </select>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:10px;">
            <button id="pick-cancel" style="padding:8px 14px; border:1px solid #b8b2aa; background:#f2f0ec; cursor:pointer;">Cancel</button>
            <button id="pick-save" style="padding:8px 14px; border:1px solid #2b5f94; background:#3a7ab8; color:#fff; cursor:pointer;">Choose</button>
          </div>
        `;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const close = (val = null) => {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          resolve(val);
        };
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(null); });
        modal.querySelector('#pick-cancel')?.addEventListener('click', () => close(null));
        modal.querySelector('#pick-save')?.addEventListener('click', () => {
          const value = String(modal.querySelector('#simple-picklist')?.value || '').trim();
          close(value || null);
        });
      });
    }

    function renderActionColumn(container, actions, character, bucket) {
      const escapeRegExp = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      for (const action of actions) {
        let desc = action.desc;
        let sourceText = String(action.source || '');
        const actionName = String(action.name || '').trim();
        if (actionName && sourceText) {
          const redundantTail = new RegExp(`\\s*\\(${escapeRegExp(actionName)}\\)\\s*$`, 'i');
          sourceText = sourceText.replace(redundantTail, '').trim();
        }

        // Dynamic placeholder replacement for specific actions
        if (action.name === 'Breath Weapon') {
          const pb = window.DDRules.proficiencyFromLevel(character.level);
          const conMod = window.DDRules.abilityMod(character?.abilities?.CON ?? 10);
          const dc = 8 + pb + conMod;
          const dmg = ((level) => {
            if (level >= 16) return '5d6';
            if (level >= 11) return '4d6';
            if (level >= 6) return '3d6';
            return '2d6';
          })(character.level);

          const race = String(character?.race || '').toLowerCase();
          const ancKey = String(character?.draconic_ancestry || character?.race_detail?.ancestry || '').toLowerCase();
          const DRAGONBORN_ANCESTRY = {
            black:  { dmg: 'acid',      save: 'DEX', area: '5 by 30 ft. line' },
            blue:   { dmg: 'lightning', save: 'DEX', area: '5 by 30 ft. line' },
            brass:  { dmg: 'fire',      save: 'DEX', area: '5 by 30 ft. line' },
            bronze: { dmg: 'lightning', save: 'DEX', area: '5 by 30 ft. line' },
            copper: { dmg: 'acid',      save: 'DEX', area: '5 by 30 ft. line' },
            gold:   { dmg: 'fire',      save: 'DEX', area: '15 ft. cone' },
            green:  { dmg: 'poison',    save: 'CON', area: '15 ft. cone' },
            red:    { dmg: 'fire',      save: 'DEX', area: '15 ft. cone' },
            silver: { dmg: 'cold',      save: 'CON', area: '15 ft. cone' },
            white:  { dmg: 'cold',      save: 'CON', area: '15 ft. cone' }
          };
          const anc = DRAGONBORN_ANCESTRY[ancKey];
          const base = String(desc || '').replace('{DC}', dc).replace('{DMG}', dmg);

          if (race.includes('dragonborn') && anc) {
            const calcTip = `Dragonborn Breath Weapon (${ancKey})\nArea: ${anc.area}\nSave DC: 8 + CON mod (${window.DDRules.fmtMod(conMod)}) + PB (+${pb}) = ${dc}\nDamage: ${dmg} ${anc.dmg} (${anc.save} save)`;
            desc = `${base}${base ? '\n\n' : ''}${calcTip}`;
          } else {
            desc = `${base}${base ? '\n\n' : ''}Save DC: 8 + CON mod (${window.DDRules.fmtMod(conMod)}) + PB (+${pb}) = ${dc}\nDamage: ${dmg}`;
          }
        } else if (action.name === 'Activate Eldritch Cannon') {
          const damageDice = (character.level || 1) >= 9 ? '3d8' : '2d8';
          const intMod = window.DDRules.abilityMod(character?.abilities?.INT ?? 10);
          const protectorHP = `1d8${window.DDRules.fmtMod(intMod)}`;
          desc = desc.replace(/{DMG}/g, damageDice).replace('{HP}', protectorHP);
        }

        const rawActionName = String(action.name || '');
        const lowerActionName = rawActionName.toLowerCase();
        const cannonList = getActiveCannons(state);
        const cannonTypeLabel = cannonTypeSummary(cannonList);
        const cannonTypeOptionLabel = cannonTypeSummary(cannonList, ' OR ');
        const cannonActive = cannonList.length > 0;
        const cannonCap = eldritchCannonCapacity(character);
        const isCannonCreate = lowerActionName === 'create eldritch cannon';
        const isCannonDismiss = lowerActionName === 'dismiss eldritch cannon';
        const isCannonUse = (
          lowerActionName === 'activate eldritch cannon' ||
          lowerActionName === 'move eldritch cannon' ||
          lowerActionName === 'detonate eldritch cannon'
        );
        let displayActionName = rawActionName;
        if (lowerActionName.includes("nature's veil")) {
          displayActionName = "Nature's Veil";
          sourceText = "Tasha's Cauldron of Everything p. 57";
        }
        if (isCannonUse && cannonActive && cannonTypeOptionLabel) {
          displayActionName = `${rawActionName} (${cannonTypeOptionLabel})`;
        }
        if (isCannonDismiss && cannonActive && cannonTypeLabel) {
          displayActionName = `Dismiss Eldritch Cannon (${cannonTypeLabel}${cannonList.length > 1 ? `, ${cannonList.length}/${cannonCap}` : ''})`;
        }

        const el = document.createElement('div');
        el.className = 'action-item tooltip';
        el.setAttribute('data-tooltip', desc);
        el.innerHTML = `<div class="action-name">${displayActionName}</div><div class="action-source">${sourceText}</div>`;
        if (
          String(character?.class || '').toLowerCase() === 'monk' &&
          (lowerActionName === 'quickened healing' || lowerActionName === 'quickened healing (optional)' || lowerActionName === 'quickened healing (2 ki)')
        ) {
          const monkLevel = Number(character?.level || 1);
          const die = monkLevel <= 4 ? '1d4' : (monkLevel <= 10 ? '1d6' : (monkLevel <= 16 ? '1d8' : '1d10'));
          const tip = String(el.getAttribute('data-tooltip') || '');
          if (!tip.toLowerCase().includes('current martial arts die:')) {
            el.setAttribute('data-tooltip', `${tip}${tip ? '\n\n' : ''}Current Martial Arts Die: ${die}.`);
          }
        }
        const isAttackAction = bucket === 'action'
          && (lowerActionName === 'attack' || /^attack\s*\(/i.test(rawActionName));
        if (isAttackAction) {
          el.classList.add('action-toggle');
          const tip = String(el.getAttribute('data-tooltip') || '');
          const helper = 'Click to open pre-roll and on-hit rider options (for example: Precision Attack, Trip Attack, Divine Smite, Sneak Attack, Stunning Strike).';
          if (!tip.toLowerCase().includes('pre-roll and on-hit rider options')) {
            el.setAttribute('data-tooltip', `${tip}${tip ? '\n\n' : ''}${helper}`);
          }
          el.addEventListener('click', () => {
            openAttackOptionsModal(character, render);
          });
        }
        const cls = String(character?.class || '').toLowerCase();
        const level = Number(character?.level || 1);
        const traits = Array.isArray(character?.traits) ? character.traits : [];
        const hasBeastSpells = (
          (cls === 'druid' && level >= 18) ||
          traits.some(t => String(t?.name || t || '').toLowerCase().includes('beast spells'))
        );
        const isWildShapedNow = !!state?.isWildShaped;
        const isSpellBlockedByWildShape = isWildShapedNow && !hasBeastSpells
          && (lowerActionName === 'cast a spell' || lowerActionName === 'hellish rebuke');
        const sourceLower = String(action?.source || '').toLowerCase();
        const isSpellLikeAction = (
          sourceLower.startsWith('spell') ||
          sourceLower.includes('infernal legacy') ||
          lowerActionName === 'cast a spell' ||
          lowerActionName === 'hellish rebuke'
        );
        const bonusSpellTurnLocked = !!state?.bonusSpellCastThisTurn;
        const isSpellBlockedByBonusSpellRule = bonusSpellTurnLocked && (
          (bucket === 'reaction' && isSpellLikeAction) ||
          (bucket === 'bonus' && isSpellLikeAction) ||
          (lowerActionName === 'hellish rebuke')
        );
        if (isSpellBlockedByWildShape) {
          el.classList.add('no-resource');
          const tip = String(el.getAttribute('data-tooltip') || '');
          const blockText = 'Unavailable while Wild Shape is active (re-enabled by Beast Spells).';
          if (!tip.toLowerCase().includes('unavailable while wild shape is active')) {
            el.setAttribute('data-tooltip', `${tip}${tip ? '\n\n' : ''}${blockText}`);
          }
        }
        if (isSpellBlockedByBonusSpellRule) {
          el.classList.add('no-resource');
          const tip = String(el.getAttribute('data-tooltip') || '');
          const blockText = 'Bonus-action spell rule: after casting a bonus-action spell this turn, you cannot cast additional spells this turn except a cantrip with casting time of 1 action.';
          if (!tip.toLowerCase().includes('bonus-action spell rule')) {
            el.setAttribute('data-tooltip', `${tip}${tip ? '\n\n' : ''}${blockText}`);
          }
        } else if (bonusSpellTurnLocked && bucket === 'action' && lowerActionName === 'cast a spell') {
          const tip = String(el.getAttribute('data-tooltip') || '');
          const reminderText = 'Bonus-action spell rule is active this turn: only a cantrip with casting time of 1 action is allowed.';
          if (!tip.toLowerCase().includes('bonus-action spell rule is active this turn')) {
            el.setAttribute('data-tooltip', `${tip}${tip ? '\n\n' : ''}${reminderText}`);
          }
        }
        if (isCannonUse && !cannonActive) {
          el.classList.add('no-resource');
          const tip = String(el.getAttribute('data-tooltip') || '');
          const blockText = 'Unavailable: no Eldritch Cannon is currently active. Use "Create Eldritch Cannon" first.';
          if (!tip.toLowerCase().includes('no eldritch cannon is currently active')) {
            el.setAttribute('data-tooltip', `${tip}${tip ? '\n\n' : ''}${blockText}`);
          }
        }
        if (isCannonDismiss && !cannonActive) {
          el.classList.add('no-resource');
          const tip = String(el.getAttribute('data-tooltip') || '');
          const blockText = 'Unavailable: no Eldritch Cannon is currently active.';
          if (!tip.toLowerCase().includes('no eldritch cannon is currently active')) {
            el.setAttribute('data-tooltip', `${tip}${tip ? '\n\n' : ''}${blockText}`);
          }
        }
        if (lowerActionName === 'call bolt of lightning') {
          el.classList.add('lightning-action');
        }
        if (isCannonCreate) {
          const freeUsed = getEldritchCannonFreeUsed(state);
          const freeText = `${freeUsed}/1 free use used`;
          const eligible = getEligibleCannonSlotLevels(character);
          const activeText = `${cannonList.length}/${cannonCap} active`;
          const slotText = eligible.length
            ? `Can also create by expending a spell slot (${eligible.join(', ')} available).`
            : 'No spell slots currently available for additional creation.';
          const tip = String(el.getAttribute('data-tooltip') || '');
          const helper = `\n\nEldritch Cannon: ${freeText} (recharges on long rest).\nActive cannons: ${activeText}.\n${slotText}`;
          if (!tip.toLowerCase().includes('recharges on long rest')) {
            el.setAttribute('data-tooltip', `${tip}${helper}`);
          }
        }
        const spellStateNow = window.readSpellState(character) || {};
        if (action?.ssiTracker) {
          const row = (spellStateNow && typeof spellStateNow.spellStoringItem === 'object' && spellStateNow.spellStoringItem)
            ? spellStateNow.spellStoringItem
            : null;
          if (!row || !String(row?.spellName || '').trim()) {
            continue;
          }
          const maxUses = spellStoringMaxUses(character);
          const used = Math.max(0, Math.min(maxUses, Number(row?.usesSpent || 0)));
          const itemName = String(row?.itemName || 'item').trim();
          const nameEl = el.querySelector('.action-name');
          if (nameEl) nameEl.textContent = `Spell-Storing Item: ${row.spellName} (${itemName}) (${used}/${maxUses})`;
          el.classList.add('action-toggle');
          if (used >= maxUses) el.classList.add('no-resource');
          const tip = String(el.getAttribute('data-tooltip') || '');
          const helper = `\n\nUses: ${used}/${maxUses}.\nClick to spend 1 use. Shift-click refunds 1 use. Shift+Alt-click clears the stored spell/item.${row?.viaArcaneFirearm ? '\nSSI castings do not gain Arcane Firearm +1d8.' : ''}`;
          if (!tip.toLowerCase().includes('shift+alt-click clears')) {
            el.setAttribute('data-tooltip', `${tip}${helper}`);
          }
          el.addEventListener('click', (ev) => {
            const st = window.readSpellState ? (window.readSpellState(character) || {}) : {};
            const curr = (st && typeof st.spellStoringItem === 'object' && st.spellStoringItem) ? st.spellStoringItem : null;
            if (!curr || !String(curr?.spellName || '').trim()) return;
            if (ev.shiftKey && ev.altKey) {
              st.spellStoringItem = null;
              if (window.writeSpellState) window.writeSpellState(character, st);
              if (F.status()) {
                F.status().textContent = 'Spell-Storing Item cleared.';
                setTimeout(() => { if (F.status()?.textContent === 'Spell-Storing Item cleared.') F.status().textContent = ''; }, 1400);
              }
              render(character);
              return;
            }
            const currMax = spellStoringMaxUses(character);
            const currUsed = Math.max(0, Math.min(currMax, Number(curr?.usesSpent || 0)));
            curr.usesSpent = ev.shiftKey ? Math.max(0, currUsed - 1) : Math.min(currMax, currUsed + 1);
            curr.maxUses = currMax;
            st.spellStoringItem = curr;
            if (window.writeSpellState) window.writeSpellState(character, st);
            render(character);
          });
        }

        // Monk Ki actions can be clicked to spend Ki directly.
        const isMonk = String(character?.class || '').toLowerCase() === 'monk';
        const monkKiCosts = new Map([
          ['flurry of blows', 1],
          ['flurry of blows (1 ki)', 1],
          ['patient defense', 1],
          ['patient defense (1 ki)', 1],
          ['step of the wind', 1],
          ['step of the wind (1 ki)', 1],
          ['stunning strike', 1],
          ['stunning strike (1 ki)', 1],
          ['stunning strike - on hit', 1],
          ['stunning strike - on hit (1 ki)', 1],
          ['quickened healing', 2],
          ['quickened healing (optional)', 2],
          ['quickened healing (2 ki)', 2],
          ['shadow arts: darkness (2 ki)', 2],
          ['shadow arts: darkvision (2 ki)', 2],
          ['shadow arts: pass without trace (2 ki)', 2],
          ['shadow arts: silence (2 ki)', 2],
          ['empty body: invisibility (4 ki)', 4],
          ['empty body: astral projection (8 ki)', 8]
        ]);
        const kiCost = monkKiCosts.get(lowerActionName);
        if (isMonk && Number.isFinite(kiCost)) {
          const maxKi = Math.max(0, Number(character?.level || 1));
          const spellState = window.readSpellState(character) || {};
          const usedKi = Number(spellState.kiSpent || 0);
          const remainingKi = Math.max(0, maxKi - usedKi);
          el.classList.add('action-toggle', 'ki-action');
          if (remainingKi < kiCost) el.classList.add('no-resource');
          el.title = `Click to spend ${kiCost} Ki. Shift-click refunds ${kiCost} Ki.`;
          if (remainingKi < kiCost) {
            const tip = String(el.getAttribute('data-tooltip') || '');
            const outText = `Not enough Ki points remaining (need ${kiCost}).`;
            if (!tip.toLowerCase().includes('not enough ki points')) {
              el.setAttribute('data-tooltip', `${tip}${tip ? '\n\n' : ''}${outText}`);
            }
          }
          el.addEventListener('click', (ev) => {
            const st = window.readSpellState(character) || {};
            const curr = Number(st.kiSpent || 0);
            if (ev.shiftKey) {
              st.kiSpent = Math.max(0, curr - kiCost);
            } else {
              if ((maxKi - curr) < kiCost) {
                F.status().textContent = `Not enough Ki points (need ${kiCost}).`;
                setTimeout(() => { F.status().textContent = ''; }, 1600);
                return;
              }
              st.kiSpent = curr + kiCost;
            }
            window.writeSpellState(character, st);
            render(character);
          });
        }

        // Generic feat resource actions (pilot: Lucky).
        const featResourceId = String(action?.featResourceId || '').trim();
        if (featResourceId && window.FeatRuntime?.getResourceUsage && window.FeatRuntime?.spendResource) {
          const usage = window.FeatRuntime.getResourceUsage(character, featResourceId);
          const cost = Math.max(1, Number(action?.featResourceCost || 1));
          if (usage) {
            el.classList.add('action-toggle');
            if (usage.remaining < cost) el.classList.add('no-resource');
            const used = Math.max(0, Number(usage.max || 0) - Number(usage.remaining || 0));
            const nameEl = el.querySelector('.action-name');
            if (nameEl) nameEl.textContent = `${displayActionName} (${used}/${usage.max})`;
            const tip = String(el.getAttribute('data-tooltip') || '');
            const extra = `\n\nResource: ${usage.resource?.name || 'Feat Resource'} (${usage.remaining}/${usage.max} remaining)\nClick to spend ${cost}. Shift-click refunds ${cost}.`;
            if (!tip.includes('Resource:')) el.setAttribute('data-tooltip', `${tip}${extra}`);
            el.addEventListener('click', (ev) => {
              const result = window.FeatRuntime.spendResource(character, featResourceId, cost, !!ev.shiftKey);
              if (!result?.ok && result?.reason === 'insufficient_resource') {
                F.status().textContent = `Not enough ${usage.resource?.name || 'resource'} remaining.`;
                setTimeout(() => { F.status().textContent = ''; }, 1600);
                return;
              }
              render(character);
            });
          }
        }

        // Generic per-action usage tracker (used by infusion actions, etc.).
        const stateKey = String(action?.stateKey || '').trim();
        const maxUses = Number(action?.maxUses || 0);
        if (stateKey && Number.isFinite(maxUses) && maxUses > 0) {
          const actionState = window.readActionState(character) || {};
          const used = Math.max(0, Number(actionState[stateKey] || 0));
          const remaining = Math.max(0, maxUses - used);
          el.classList.add('action-toggle');
          if (remaining <= 0) el.classList.add('no-resource');
          const nameEl = el.querySelector('.action-name');
          if (nameEl) nameEl.textContent = `${displayActionName} (${used}/${maxUses})`;

          const label = String(action?.resourceLabel || 'Uses');
          const tip = String(el.getAttribute('data-tooltip') || '');
          const tracker = `\n\n${label}: ${used}/${maxUses} used.\nClick to spend 1 use. Shift-click refunds 1 use.`;
          if (!tip.includes(`${label}:`)) {
            el.setAttribute('data-tooltip', `${tip}${tracker}`);
          }

          el.addEventListener('click', (ev) => {
            const st = window.readActionState(character) || {};
            const curr = Math.max(0, Number(st[stateKey] || 0));

            if (ev.shiftKey) {
              st[stateKey] = Math.max(0, curr - 1);
              window.writeActionState(character, st);
              render(character);
              return;
            }

            if (curr >= maxUses) {
              F.status().textContent = `No ${label.toLowerCase()} remaining.`;
              setTimeout(() => { F.status().textContent = ''; }, 1600);
              return;
            }

            // Optional action behavior: recover a spell slot (e.g., Spell-Refueling Ring).
            if (action?.recoverSpellSlot) {
              const sp = window.readSpellState(character) || {};
              const spent = sp.slotsSpent || {};
              const eligible = Object.keys(spent)
                .map(k => Number(k))
                .filter(lvl => Number.isFinite(lvl) && lvl > 0 && lvl <= 3 && Number(spent[String(lvl)] || 0) > 0)
                .sort((a, b) => a - b);

              if (!eligible.length) {
                F.status().textContent = 'No spent spell slots (1st-3rd) to recover.';
                setTimeout(() => { F.status().textContent = ''; }, 1800);
                return;
              }

              let pick = eligible[eligible.length - 1];
              if (eligible.length > 1) {
                const input = window.prompt(`Recover which spell slot level? Eligible: ${eligible.join(', ')}`, String(pick));
                if (input == null) return;
                const parsed = Number(input);
                if (!eligible.includes(parsed)) {
                  F.status().textContent = `Invalid slot level. Choose one of: ${eligible.join(', ')}.`;
                  setTimeout(() => { F.status().textContent = ''; }, 2000);
                  return;
                }
                pick = parsed;
              }

              spent[String(pick)] = Math.max(0, Number(spent[String(pick)] || 0) - 1);
              sp.slotsSpent = spent;
              window.writeSpellState(character, sp);
            }

            st[stateKey] = curr + 1;
            window.writeActionState(character, st);
            render(character);
          });
        }

        if (lowerActionName.startsWith('channel divinity:') || lowerActionName === 'harness divine power') {
          const clsLower = String(character?.class || '').toLowerCase();
          const levelVal = Number(character?.level || 1);
          if ((clsLower === 'cleric' || clsLower === 'paladin') && levelVal >= 2) {
            const maxCD = levelVal >= 18 ? 3 : (levelVal >= 6 ? 2 : 1);
            const spellState = window.readSpellState(character) || {};
            const usedCD = Math.max(0, Number(spellState.channelDivinityUsed || 0));
            const cdNameEl = el.querySelector('.action-name');
            if (cdNameEl) cdNameEl.textContent = `${displayActionName} (${usedCD}/${maxCD})`;
            const tip = String(el.getAttribute('data-tooltip') || '');
            const helper = `\n\nChannel Divinity uses: ${usedCD}/${maxCD}.`;
            if (!tip.toLowerCase().includes('channel divinity uses:')) {
              el.setAttribute('data-tooltip', `${tip}${helper}`);
            }
          }
        }

        // Perfect Self helper (Monk 20): trigger when initiative is rolled and Ki is 0.
        if (String(action.name || '').toLowerCase() === 'perfect self (on initiative)') {
          const maxKi = Math.max(0, Number(character?.level || 1));
          const st = window.readSpellState(character) || {};
          const usedKi = Math.max(0, Number(st.kiSpent || 0));
          const remainingKi = Math.max(0, maxKi - usedKi);
          const actionState = window.readActionState(character) || {};
          const alreadyTriggered = !!actionState.perfectSelfTriggered;
          const eligible = remainingKi === 0 && !alreadyTriggered;
          el.classList.add('action-toggle', 'ki-action');
          if (!eligible) el.classList.add('no-resource');
          const tip = String(el.getAttribute('data-tooltip') || '');
          const helper = [
            '',
            `Ki remaining: ${remainingKi}/${maxKi}.`,
            alreadyTriggered
              ? 'Already applied for this initiative. Shift-click to reset for the next initiative roll.'
              : (remainingKi === 0
                ? 'Click to apply Perfect Self and regain 4 Ki. Shift-click resets trigger state.'
                : 'Only eligible when Ki remaining is 0.'),
          ].join('\n');
          if (!tip.includes('Ki remaining:')) {
            el.setAttribute('data-tooltip', `${tip}${helper}`);
          }
          el.addEventListener('click', (ev) => {
            const act = window.readActionState(character) || {};
            if (ev.shiftKey) {
              act.perfectSelfTriggered = false;
              window.writeActionState(character, act);
              render(character);
              return;
            }
            const sp = window.readSpellState(character) || {};
            const max = Math.max(0, Number(character?.level || 1));
            const used = Math.max(0, Number(sp.kiSpent || 0));
            const remain = Math.max(0, max - used);
            if (remain !== 0) {
              F.status().textContent = 'Perfect Self applies only when you have 0 Ki remaining.';
              setTimeout(() => { F.status().textContent = ''; }, 1800);
              return;
            }
            if (act.perfectSelfTriggered) {
              F.status().textContent = 'Perfect Self already applied for this initiative.';
              setTimeout(() => { F.status().textContent = ''; }, 1800);
              return;
            }
            sp.kiSpent = Math.max(0, used - 4);
            act.perfectSelfTriggered = true;
            window.writeSpellState(character, sp);
            window.writeActionState(character, act);
            render(character);
          });
        }

        // Special handling for the Rage toggle
        if (action.name === 'Rage') {
          el.classList.add('action-toggle');
          const nameEl = el.querySelector('.action-name');
          const level = character.level || 1;
          let maxRages = 2;
          if (level >= 20) maxRages = 99;
          else if (level >= 17) maxRages = 6;
          else if (level >= 12) maxRages = 5;
          else if (level >= 6) maxRages = 4;
          else if (level >= 3) maxRages = 3;
          const usedRages = Number(state.rageUsed || 0);
          const maxLabel = maxRages === 99 ? '∞' : String(maxRages);
          if (nameEl) nameEl.textContent = `Rage (${usedRages}/${maxLabel})`;
          if (state.isRaging) {
            el.classList.add('raging');
            if (nameEl) nameEl.textContent = `RAGING (${usedRages}/${maxLabel})`;
          }
          el.addEventListener('click', () => {
            const currentState = window.readActionState(character);
            const isTurningOn = !currentState.isRaging;

            if (isTurningOn) {
              const usedRages = currentState.rageUsed || 0;
              if (usedRages >= maxRages) {
                F.status().textContent = 'No rages remaining.';
                setTimeout(() => { F.status().textContent = ''; }, 2000);
                return;
              }
              currentState.rageUsed = usedRages + 1;
            }
            currentState.isRaging = !currentState.isRaging;
            window.writeActionState(character, currentState);
            render(character); // Re-render the page with the new state
          });
        }

        // Keep Zealous Presence action and resource tracker in sync.
        if (String(action.name || '').toLowerCase() === 'zealous presence') {
          el.classList.add('action-toggle');
          const usedCount = Number(state.zealousPresenceUsed || 0) > 0 ? 1 : 0;
          const nameEl = el.querySelector('.action-name');
          if (nameEl) nameEl.textContent = `Zealous Presence (${usedCount}/1)`;
          if (usedCount > 0) {
            el.classList.add('raging');
          }
          el.addEventListener('click', () => {
            const currentState = window.readActionState(character);
            currentState.zealousPresenceUsed = (Number(currentState.zealousPresenceUsed || 0) > 0) ? 0 : 1;
            window.writeActionState(character, currentState);
            render(character);
          });
        }

        if (String(action.name || '').toLowerCase() === 'create eldritch cannon') {
          el.classList.add('action-toggle');
          el.addEventListener('click', async () => {
            const currentState = window.readActionState(character) || {};
            const activeCannons = getActiveCannons(currentState);
            const capacity = eldritchCannonCapacity(character);
            if (activeCannons.length >= capacity) {
              F.status().textContent = `Maximum active cannons reached (${capacity}/${capacity}).`;
              setTimeout(() => { F.status().textContent = ''; }, 2000);
              return;
            }
            let creationCost = 'free';
            const freeUsed = getEldritchCannonFreeUsed(currentState);
            if (freeUsed >= 1) {
              const spent = spendCannonSpellSlot(character);
              if (!spent.ok) {
                if (spent.reason === 'invalid_slot') {
                  F.status().textContent = `Invalid slot level. Choose one of: ${(spent.eligible || []).join(', ')}.`;
                } else if (spent.reason === 'no_slots') {
                  F.status().textContent = 'No spell slots available to create an additional Eldritch Cannon.';
                } else {
                  // cancelled
                  return;
                }
                setTimeout(() => { F.status().textContent = ''; }, 2200);
                return;
              }
              creationCost = `slot ${spent.slotLevel}`;
            }
            const picked = await chooseFromPicklist(
              'Choose Eldritch Cannon Type',
              ['Flamethrower', 'Force Ballista', 'Protector'],
              'Force Ballista'
            );
            if (!picked) return;
            const chosen = String(picked || '').trim();
            activeCannons.push(chosen);
            setActiveCannons(currentState, activeCannons);
            if (creationCost === 'free') setEldritchCannonFreeUsed(currentState, 1);
            window.writeActionState(character, currentState);
            F.status().textContent = creationCost === 'free'
              ? `Created ${chosen} cannon (free use). Active: ${activeCannons.length}/${capacity}.`
              : `Created ${chosen} cannon (expended ${creationCost}). Active: ${activeCannons.length}/${capacity}.`;
            setTimeout(() => { if (F.status().textContent.startsWith('Created')) F.status().textContent = ''; }, 1800);
            render(character);
          });
        }

        if (lowerActionName === 'dismiss eldritch cannon' || lowerActionName === 'detonate eldritch cannon') {
          el.classList.add('action-toggle');
          el.addEventListener('click', async () => {
            const currentState = window.readActionState(character) || {};
            const activeCannons = getActiveCannons(currentState);
            if (!activeCannons.length) {
              F.status().textContent = 'No Eldritch Cannon is currently active.';
              setTimeout(() => { F.status().textContent = ''; }, 1700);
              return;
            }

            let pickIdx = 0;
            if (activeCannons.length > 1) {
              const options = activeCannons.map((t, i) => `${i + 1}. ${t}`);
              const picked = await chooseFromPicklist(
                lowerActionName === 'detonate eldritch cannon' ? 'Choose Cannon to Detonate' : 'Choose Cannon to Dismiss',
                options,
                options[options.length - 1]
              );
              if (!picked) return;
              const m = String(picked).match(/^(\d+)\./);
              const idx = Number(m?.[1] || 1) - 1;
              if (!Number.isFinite(idx) || idx < 0 || idx >= activeCannons.length) return;
              pickIdx = idx;
            }

            const [removed] = activeCannons.splice(pickIdx, 1);
            setActiveCannons(currentState, activeCannons);
            window.writeActionState(character, currentState);
            const actionWord = lowerActionName === 'detonate eldritch cannon' ? 'Detonated' : 'Dismissed';
            F.status().textContent = `${actionWord} ${removed || 'cannon'}. Active: ${activeCannons.length}/${eldritchCannonCapacity(character)}.`;
            setTimeout(() => { if (F.status().textContent.startsWith(actionWord)) F.status().textContent = ''; }, 1800);
            render(character);
          });
        }

        if (String(action.name || '').toLowerCase() === 'harness divine power') {
          el.classList.add('action-toggle');
          el.addEventListener('click', () => {
            const cls = String(character?.class || '').toLowerCase();
            const level = Number(character?.level || 1);
            if (!(cls === 'cleric' || cls === 'paladin') || level < 2) return;

            const maxCD = level >= 18 ? 3 : (level >= 6 ? 2 : 1);
            const pb = window.DDRules.proficiencyFromLevel(level);
            const maxRecoverLevel = Math.ceil(pb / 2);
            const st = window.readSpellState(character);
            const usedCD = Number(st.channelDivinityUsed || 0);
            if (usedCD >= maxCD) {
              F.status().textContent = 'No Channel Divinity uses remaining.';
              setTimeout(() => { F.status().textContent = ''; }, 1800);
              return;
            }

            const spent = st.slotsSpent || {};
            const eligible = Object.keys(spent)
              .map(k => Number(k))
              .filter(lvl => Number.isFinite(lvl) && lvl > 0 && lvl <= maxRecoverLevel && Number(spent[String(lvl)] || 0) > 0)
              .sort((a, b) => a - b);

            if (!eligible.length) {
              F.status().textContent = `No spent spell slots up to level ${maxRecoverLevel} to recover.`;
              setTimeout(() => { F.status().textContent = ''; }, 2200);
              return;
            }

            let chosenLevel = eligible[eligible.length - 1];
            if (eligible.length > 1) {
              const input = window.prompt(`Recover which spell slot level? Eligible: ${eligible.join(', ')}`, String(chosenLevel));
              if (input == null) return;
              const parsed = Number(input);
              if (!eligible.includes(parsed)) {
                F.status().textContent = `Invalid slot level. Choose one of: ${eligible.join(', ')}.`;
                setTimeout(() => { F.status().textContent = ''; }, 2200);
                return;
              }
              chosenLevel = parsed;
            }

            st.channelDivinityUsed = usedCD + 1;
            const key = String(chosenLevel);
            st.slotsSpent = { ...spent, [key]: Math.max(0, Number(spent[key] || 0) - 1) };
            window.writeSpellState(character, st);
            F.status().textContent = `Recovered one level ${chosenLevel} spell slot (Harness Divine Power).`;
            setTimeout(() => { F.status().textContent = ''; }, 1800);
            render(character);
          });
        }

        if (String(action.name || '').toLowerCase() === 'spiritual weapon') {
          el.classList.add('action-toggle');
          const active = !!state.spiritualWeaponActive;
          if (active) {
            el.classList.add('divine-active');
            const nameEl = el.querySelector('.action-name');
            if (nameEl) nameEl.textContent = 'Spiritual Weapon (Summoned)';
          }
          el.addEventListener('click', () => {
            const currentState = window.readActionState(character) || {};
            currentState.spiritualWeaponActive = !currentState.spiritualWeaponActive;
            window.writeActionState(character, currentState);
            render(character);
          });
        }

        if (String(action.name || '').toLowerCase() === 'wild shape') {
          el.classList.add('action-toggle');
          const wsState = window.readActionState(character) || {};
          if (wsState.isWildShaped) {
            const form = String(wsState.wildShapeForm || 'Beast Form');
            const nameEl = el.querySelector('.action-name');
            if (nameEl) nameEl.textContent = `Wild Shape: ${form}`;
            const existingTip = String(el.getAttribute('data-tooltip') || '');
            if (!existingTip.toLowerCase().includes('click to revert')) {
              el.setAttribute('data-tooltip', `${existingTip}${existingTip ? '\n\n' : ''}You are currently transformed. Click to revert.`);
            }
          }
          el.addEventListener('click', async () => {
            const current = window.readActionState(character) || {};
            if (current.isWildShaped) {
              if (!window.WildShapeUI?.revert) return;
              window.WildShapeUI.revert(character, { onChange: () => render(character) });
              return;
            }
            if (!window.WildShapeUI?.open) return;
            await window.WildShapeUI.open(character, {
              setStatus: (msg) => {
                F.status().textContent = msg;
                if (msg) setTimeout(() => { F.status().textContent = ''; }, 1800);
              },
              onChange: () => render(character)
            });
          });
        }

        if (String(action.name || '').toLowerCase() === 'symbiotic entity') {
          const cls = String(character?.class || '').toLowerCase();
          const build = String(character?.build || '').toLowerCase();
          const level = Number(character?.level || 1);
          const isSporesDruid = cls === 'druid' && build.includes('spores');
          if (isSporesDruid) {
            el.classList.add('action-toggle');
            const active = !!spellStateNow.symbioticActive;
            const nameEl = el.querySelector('.action-name');
            if (active) {
              el.classList.add('divine-active');
              if (nameEl) nameEl.textContent = 'Symbiotic Entity (Active)';
            }

            const wildMax = window.WildShapeUI?.getMaxUses ? window.WildShapeUI.getMaxUses(character) : 0;
            const wildUsed = Number(spellStateNow.wildShapeUsed || 0);
            const wildRemaining = Number.isFinite(wildMax) ? Math.max(0, wildMax - wildUsed) : Number.POSITIVE_INFINITY;
            const tempGain = Math.max(0, level * 4);
            const tip = String(el.getAttribute('data-tooltip') || '');
            const helper = [
              '',
              `Wild Shape uses remaining: ${Number.isFinite(wildRemaining) ? wildRemaining : '∞'}.`,
              `Symbiotic temp HP on activation: ${tempGain}.`,
              active
                ? 'Click to end Symbiotic Entity.'
                : 'Click to activate (expends 1 Wild Shape use).'
            ].join('\n');
            el.setAttribute('data-tooltip', `${tip}${helper}`);

            el.addEventListener('click', () => {
              const st = window.readSpellState(character) || {};
              const act = window.readActionState(character) || {};
              const isActive = !!st.symbioticActive;
              if (isActive) {
                st.symbioticActive = false;
                act.spreadingSporesActive = false;
                const granted = Math.max(0, Number(act.symbioticTempHpGranted || 0));
                if (granted > 0 && Number(character.tempHP || 0) <= granted) {
                  character.tempHP = 0;
                }
                delete act.symbioticTempHpGranted;
                window.writeSpellState(character, st);
                window.writeActionState(character, act);
                persistCharacterOverride(character);
                render(character);
                return;
              }

              const maxUses = window.WildShapeUI?.getMaxUses ? window.WildShapeUI.getMaxUses(character) : 0;
              const used = Math.max(0, Number(st.wildShapeUsed || 0));
              if (Number.isFinite(maxUses) && used >= maxUses) {
                F.status().textContent = 'No Wild Shape uses remaining for Symbiotic Entity.';
                setTimeout(() => { F.status().textContent = ''; }, 1800);
                return;
              }

              if (Number.isFinite(maxUses)) st.wildShapeUsed = used + 1;
              st.symbioticActive = true;
              const gain = Math.max(0, Number(character.level || 1) * 4);
              character.tempHP = Math.max(Number(character.tempHP || 0), gain); // temp HP keep highest source
              act.symbioticTempHpGranted = gain;
              window.writeSpellState(character, st);
              window.writeActionState(character, act);
              persistCharacterOverride(character);
              render(character);
            });
          }
        }

        if (String(action.name || '').toLowerCase() === 'spreading spores') {
          const level = Math.max(1, Number(character?.level || 1));
          const die = level >= 14 ? 10 : (level >= 10 ? 8 : (level >= 6 ? 6 : 4));
          const baseHalo = `1d${die}`;
          const boostedHalo = `2d${die}`;
          const symbioticActive = !!spellStateNow.symbioticActive;
          const sporesActive = symbioticActive && !!state.spreadingSporesActive;
          el.classList.add('action-toggle');
          if (sporesActive) {
            el.classList.add('divine-active');
            const nameEl = el.querySelector('.action-name');
            if (nameEl) nameEl.textContent = 'Spreading Spores (Active)';
          }
          if (!symbioticActive) {
            el.classList.add('no-resource');
          }
          const tip = String(el.getAttribute('data-tooltip') || '');
          const helper = [
            '',
            `Spreading Spores damage uses your Halo of Spores damage die.`,
            `Current Halo at level ${level}: ${baseHalo} necrotic; with Symbiotic Entity active: ${boostedHalo}.`,
            sporesActive
              ? 'Spreading Spores is active. Click to end it.'
              : 'Click to activate while Symbiotic Entity is active.',
            'While active, you cannot use the Halo of Spores reaction.'
          ].join('\n');
          if (!tip.toLowerCase().includes('while active, you cannot use the halo of spores reaction')) {
            el.setAttribute('data-tooltip', `${tip}${helper}`);
          }
          el.addEventListener('click', () => {
            const currentState = window.readActionState(character) || {};
            const spellState = window.readSpellState(character) || {};
            const canActivate = !!spellState.symbioticActive;
            const onNow = !!currentState.spreadingSporesActive;
            if (!onNow && !canActivate) {
              F.status().textContent = 'Spreading Spores requires Symbiotic Entity to be active.';
              setTimeout(() => { F.status().textContent = ''; }, 1800);
              return;
            }
            currentState.spreadingSporesActive = !onNow;
            window.writeActionState(character, currentState);
            render(character);
          });
        }

        if (String(action.name || '').toLowerCase() === 'halo of spores') {
          const tip = String(el.getAttribute('data-tooltip') || '');
          const level = Math.max(1, Number(character?.level || 1));
          const die = level >= 14 ? 10 : (level >= 10 ? 8 : (level >= 6 ? 6 : 4));
          const baseDiceText = `1d${die}`;
          const activeDiceText = `2d${die}`;
          const active = !!spellStateNow.symbioticActive;
          const scaleText = `Current Halo of Spores damage at level ${level}: ${baseDiceText} necrotic (Con save negates).`;
          const symbioticText = `Symbiotic Entity active: Halo of Spores deals ${activeDiceText} necrotic instead of ${baseDiceText}.`;
          let nextTip = tip;
          if (!tip.toLowerCase().includes('current halo of spores damage')) {
            nextTip = `${nextTip}${nextTip ? '\n\n' : ''}${scaleText}`;
          }
          if (active && !nextTip.toLowerCase().includes('symbiotic entity active: halo of spores deals')) {
            nextTip = `${nextTip}${nextTip ? '\n\n' : ''}${symbioticText}`;
          }
          if (nextTip !== tip) {
            el.setAttribute('data-tooltip', nextTip);
          }
          if (spellStateNow.symbioticActive && state.spreadingSporesActive) {
            el.classList.add('no-resource');
            const nameEl = el.querySelector('.action-name');
            if (nameEl) nameEl.textContent = 'Unavailable: Spreading Spores Active';
            const blockText = 'Spreading Spores is active: you cannot use Halo of Spores reaction.';
            const after = String(el.getAttribute('data-tooltip') || '');
            if (!after.toLowerCase().includes('cannot use halo of spores reaction')) {
              el.setAttribute('data-tooltip', `${after}${after ? '\n\n' : ''}${blockText}`);
            }
          }
        }

        if (String(action.name || '').toLowerCase() === 'fungal infestation') {
          const wisScore = Number(character?.abilities?.WIS ?? character?.abilities?.wis ?? 10);
          const wisMod = (window.DDRules && typeof window.DDRules.abilityMod === 'function')
            ? window.DDRules.abilityMod(wisScore)
            : Math.floor((wisScore - 10) / 2);
          const maxUses = Math.max(1, Number.isFinite(wisMod) ? wisMod : 0);
          const used = Math.max(0, Number(state.fungalInfestationUsed || 0));

          el.classList.add('action-toggle');
          if (used >= maxUses) el.classList.add('no-resource');

          const nameEl = el.querySelector('.action-name');
          if (nameEl) nameEl.textContent = `Fungal Infestation (${used}/${maxUses})`;

          const tip = String(el.getAttribute('data-tooltip') || '');
          const helper = `\n\nUses: ${used}/${maxUses} (based on WIS modifier).\nClick to spend 1 use. Shift-click refunds 1 use.\nResets on long rest.`;
          if (!tip.toLowerCase().includes('resets on long rest')) {
            el.setAttribute('data-tooltip', `${tip}${helper}`);
          }

          el.addEventListener('click', (ev) => {
            const st = window.readActionState(character) || {};
            const curr = Math.max(0, Number(st.fungalInfestationUsed || 0));
            if (ev.shiftKey) {
              st.fungalInfestationUsed = Math.max(0, curr - 1);
            } else {
              if (curr >= maxUses) {
                F.status().textContent = 'No Fungal Infestation uses remaining.';
                setTimeout(() => { F.status().textContent = ''; }, 1800);
                return;
              }
              st.fungalInfestationUsed = curr + 1;
            }
            window.writeActionState(character, st);
            render(character);
          });
        }

        if (String(action.name || '').toLowerCase() === 'channel divinity: charm animals and plants') {
          const cls = String(character?.class || '').toLowerCase();
          const build = String(character?.build || '').toLowerCase();
          const level = Number(character?.level || 1);
          const supportsMasterOfNature = cls === 'cleric' && build.includes('nature domain') && level >= 17;
          if (supportsMasterOfNature) {
            el.classList.add('action-toggle');
            const active = !!state.natureCharmActive;
            if (active) {
              el.classList.add('divine-active');
              const nameEl = el.querySelector('.action-name');
              if (nameEl) nameEl.textContent = 'Channel Divinity: Charm Animals and Plants (Active)';
            }
            el.addEventListener('click', () => {
              const currentState = window.readActionState(character) || {};
              currentState.natureCharmActive = !currentState.natureCharmActive;
              window.writeActionState(character, currentState);
              render(character);
            });
          }
        }

        if (String(action.name || '').toLowerCase() === 'hellish rebuke') {
          const used = Math.max(0, Number(state.hellishRebukeUsed || 0));
          const maxUses = 1;
          const pb = window.DDRules.proficiencyFromLevel(Number(character?.level || 1));
          const chaScore = Number(character?.abilities?.CHA ?? character?.abilities?.cha ?? 10);
          const chaMod = window.DDRules.abilityMod(chaScore);
          const saveDC = 8 + pb + chaMod;
          el.classList.add('action-toggle');
          if (used >= maxUses) el.classList.add('no-resource');
          const nameEl = el.querySelector('.action-name');
          if (nameEl) nameEl.textContent = `Hellish Rebuke (${used}/${maxUses})`;
          const tip = String(el.getAttribute('data-tooltip') || '');
          const helper = `\n\nSpell Save DC (Charisma): 8 + PB (+${pb}) + CHA mod (${window.DDRules.fmtMod(chaMod)}) = ${saveDC}\nInfernal Legacy use: once per long rest.\nClick to expend the free cast. Shift-click refunds the use.`;
          if (!tip.toLowerCase().includes('infernal legacy use: once per long rest')) {
            el.setAttribute('data-tooltip', `${tip}${helper}`);
          }
          el.addEventListener('click', (ev) => {
            if (isSpellBlockedByWildShape) {
              F.status().textContent = 'Hellish Rebuke is unavailable while Wild Shape is active.';
              setTimeout(() => { F.status().textContent = ''; }, 1800);
              return;
            }
            if (isSpellBlockedByBonusSpellRule) {
              F.status().textContent = 'Bonus-action spell rule: only a 1-action cantrip can still be cast this turn.';
              setTimeout(() => { F.status().textContent = ''; }, 2200);
              return;
            }
            const st = window.readActionState(character) || {};
            const curr = Math.max(0, Number(st.hellishRebukeUsed || 0));
            if (ev.shiftKey) {
              st.hellishRebukeUsed = 0;
            } else {
              if (curr >= maxUses) {
                F.status().textContent = 'Hellish Rebuke is unavailable until long rest.';
                setTimeout(() => { F.status().textContent = ''; }, 1800);
                return;
              }
              st.hellishRebukeUsed = 1;
            }
            window.writeActionState(character, st);
            render(character);
          });
        }

        if (String(action.name || '').toLowerCase() === 'rabbit hop') {
          const pb = Math.max(1, Number(window.DDRules.proficiencyFromLevel(Number(character?.level || 1)) || 2));
          const used = Math.max(0, Number(state.rabbitHopUsed || 0));
          const maxUses = pb;
          el.classList.add('action-toggle');
          if (used >= maxUses) el.classList.add('no-resource');
          const nameEl = el.querySelector('.action-name');
          if (nameEl) nameEl.textContent = `Rabbit Hop (${used}/${maxUses})`;
          const tip = String(el.getAttribute('data-tooltip') || '');
          const helper = `\n\nUses: ${used}/${maxUses} (based on proficiency bonus).\nRecharge: long rest.\nClick to spend 1 use. Shift-click refunds 1 use.`;
          if (!tip.toLowerCase().includes('recharge: long rest')) {
            el.setAttribute('data-tooltip', `${tip}${helper}`);
          }
          el.addEventListener('click', (ev) => {
            const st = window.readActionState(character) || {};
            const curr = Math.max(0, Number(st.rabbitHopUsed || 0));
            if (ev.shiftKey) {
              st.rabbitHopUsed = Math.max(0, curr - 1);
            } else {
              if (curr >= maxUses) {
                F.status().textContent = 'No Rabbit Hop uses remaining.';
                setTimeout(() => { F.status().textContent = ''; }, 1800);
                return;
              }
              st.rabbitHopUsed = curr + 1;
            }
            window.writeActionState(character, st);
            render(character);
          });
        }

        if (String(action.name || '').toLowerCase().includes("nature's veil")) {
          const pb = Math.max(1, Number(window.DDRules.proficiencyFromLevel(Number(character?.level || 1)) || 2));
          const used = Math.max(0, Number(state.naturesVeilUsed || 0));
          const maxUses = pb;
          el.classList.add('action-toggle');
          if (used >= maxUses) el.classList.add('no-resource');
          const nameEl = el.querySelector('.action-name');
          if (nameEl) nameEl.textContent = `Nature's Veil (${used}/${maxUses})`;
          const tip = String(el.getAttribute('data-tooltip') || '');
          const helper = `\n\nUses: ${used}/${maxUses} (based on proficiency bonus).\nRecharge: long rest.\nClick to spend 1 use. Shift-click refunds 1 use.`;
          if (!tip.toLowerCase().includes('uses:') || !tip.toLowerCase().includes('recharge: long rest')) {
            el.setAttribute('data-tooltip', `${tip}${helper}`);
          }
          el.addEventListener('click', (ev) => {
            const st = window.readActionState(character) || {};
            const curr = Math.max(0, Number(st.naturesVeilUsed || 0));
            if (ev.shiftKey) {
              st.naturesVeilUsed = Math.max(0, curr - 1);
            } else {
              if (curr >= maxUses) {
                F.status().textContent = "No Nature's Veil uses remaining.";
                setTimeout(() => { F.status().textContent = ''; }, 1800);
                return;
              }
              st.naturesVeilUsed = curr + 1;
            }
            window.writeActionState(character, st);
            render(character);
          });
        }

        if (String(action.name || '').toLowerCase().startsWith('foe slayer')) {
          const key = 'foeSlayerUsedTurn';
          const used = Math.max(0, Number(state[key] || 0));
          const maxUses = 1;
          el.classList.add('action-toggle');
          if (used >= maxUses) el.classList.add('no-resource');
          const nameEl = el.querySelector('.action-name');
          if (nameEl) nameEl.textContent = `Foe Slayer (${used}/${maxUses} turn)`;
          const tip = String(el.getAttribute('data-tooltip') || '');
          const helper = `\n\nManual turn tracker.\nOnce on each of your turns, add WIS modifier to one attack roll OR one damage roll against a favored enemy.\nClick to mark used this turn. Shift-click resets.`;
          if (!tip.toLowerCase().includes('manual turn tracker')) {
            el.setAttribute('data-tooltip', `${tip}${helper}`);
          }
          el.addEventListener('click', (ev) => {
            const st = window.readActionState(character) || {};
            st[key] = ev.shiftKey ? 0 : (Number(st[key] || 0) >= 1 ? 0 : 1);
            window.writeActionState(character, st);
            render(character);
          });
        }

        container.appendChild(el);
      }
    }

    renderActionColumn(F.actionMove(), allActions.move, character, 'move');
    renderActionColumn(F.actionStd(), allActions.action, character, 'action');
    renderActionColumn(F.actionBonus(), allActions.bonus, character, 'bonus');
    renderActionColumn(F.actionReact(), allActions.reaction, character, 'reaction');

    const hasBonusActionSpell = (Array.isArray(allActions?.bonus) ? allActions.bonus : []).some(a =>
      String(a?.source || '').toLowerCase().startsWith('spell')
    );
    if (hasBonusActionSpell) {
      const reminder = document.createElement('div');
      reminder.className = 'bonus-spell-reminder';
      reminder.textContent = 'Reminder: If you cast a bonus-action spell this turn, the only other spell you can cast this turn is a cantrip with casting time of 1 action.';
      reminder.style.margin = '8px 8px 2px';
      reminder.style.padding = '6px 8px';
      reminder.style.fontSize = '12px';
      reminder.style.lineHeight = '1.35';
      reminder.style.border = '1px solid rgba(124,85,48,0.35)';
      reminder.style.background = 'rgba(255,245,229,0.85)';
      reminder.style.borderRadius = '6px';
      reminder.style.color = '#5a2a12';
      F.actionBonus().appendChild(reminder);

      const lockOn = !!state.bonusSpellCastThisTurn;
      const lockToggle = document.createElement('div');
      lockToggle.className = 'bonus-spell-reminder action-toggle';
      lockToggle.style.margin = '6px 8px 2px';
      lockToggle.style.padding = '6px 8px';
      lockToggle.style.fontSize = '12px';
      lockToggle.style.lineHeight = '1.35';
      lockToggle.style.border = '1px solid rgba(124,85,48,0.35)';
      lockToggle.style.background = lockOn ? 'rgba(255,232,197,0.95)' : 'rgba(248,246,242,0.9)';
      lockToggle.style.borderRadius = '6px';
      lockToggle.style.color = '#5a2a12';
      lockToggle.style.cursor = 'pointer';
      lockToggle.textContent = `Bonus-action spell cast this turn: ${lockOn ? 'ON' : 'OFF'} (click to toggle, shift-click to reset).`;
      lockToggle.title = 'Manual turn marker for bonus-action spell casting restriction.';
      lockToggle.addEventListener('click', (ev) => {
        const st = window.readActionState(character) || {};
        if (ev.shiftKey) {
          st.bonusSpellCastThisTurn = false;
        } else {
          st.bonusSpellCastThisTurn = !st.bonusSpellCastThisTurn;
        }
        window.writeActionState(character, st);
        render(character);
      });
      F.actionBonus().appendChild(lockToggle);
    }
  }

  // --- Public Entry Point ---
  async function renderFromCharacterFile(file) {
    const clean = String(file || '').replace(/^\/?data\//, '');
    const char = await global.loadCharacter(clean);
    if (!char) {
      const st = F.status();
      if (st) st.textContent = `Could not load ${clean}`;
      return;
    }

    // Set the character in the global state so other scripts can access it.
    if (typeof global.setCurrentCharacter === 'function') {
      global.setCurrentCharacter(clean, char);
    }

    global.STORAGE.set('dd:lastChar', clean);
    global.setURLParam('char', clean);

    await render(char);

    const st = F.status();
    if (st) st.textContent = `Loaded ${char.name || clean}`;
  }

  // --- Boot & Toolbar Wiring ---
  function boot() {
    if (typeof global.initToolbar === 'function') {
      global.initToolbar({
        onLoadCharacter: renderFromCharacterFile,
        onSaveCharacter: () => {
          const st = F.status();
          if (st) { st.textContent = 'Save not implemented on this page.'; setTimeout(() => { st.textContent = ''; }, 2000); }
        }
      });
    }

    const url = new URL(location.href);
    const want = url.searchParams.get('char') || global.STORAGE.get('dd:lastChar') || 'direcris-zzzxaaxthroth-new.json';
    renderFromCharacterFile(want);

    if (typeof createRibbonButton === 'function') {
      createRibbonButton({
        id: "to-character", container: "#sheet", top: 6, left: 5, width: 110, height: 52,
        label: "Sheet →",
        d: "M 12 19 C 10.3333 19.6667 20 17 25 15 L 30 22 L 30 15 L 32 16 L 32 13 C 34.6667 11 64 20 98 2 C 97 14 88 18 89 23 Q 93 30 106 34 C 94 44 87 44 74 40 L 71 34 L 71 40 C 68.6667 39.6667 66.3333 39.3333 64 39 L 62 36 L 61 39 C 62 38 41 41 9 56 C 11 48 18 43 20 34 C 10 30 11 29 2 21 Z",
        onClick: () => { location.href = `charactersheet.html${location.search}`; }
      });

      createRibbonButton({
        id: "to-spells", container: "#sheet", top: 6, left: 676, width: 110, height: 52,
        label: "← Spells",
        mirrored: true,
        d: "M 12 19 C 10.3333 19.6667 20 17 25 15 L 30 22 L 30 15 L 32 16 L 32 13 C 34.6667 11 64 20 98 2 C 97 14 88 18 89 23 Q 93 30 106 34 C 94 44 87 44 74 40 L 71 34 L 71 40 C 68.6667 39.6667 66.3333 39.3333 64 39 L 62 36 L 61 39 C 62 38 41 41 9 56 C 11 48 18 43 20 34 C 10 30 11 29 2 21 Z",
        onClick: () => { location.href = `spells.html${location.search}`; }
      });
    }
  }

  // Expose & start
  global.renderFromCharacterFile = renderFromCharacterFile;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})(window);
