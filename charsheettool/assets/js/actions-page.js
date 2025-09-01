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
      raceTextEl.querySelector('textPath').textContent = String(raceInfo.displayName || '').trim();
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
    const isBarbarian = String(character.class || '').toLowerCase() === 'barbarian';
    const isZealot = isBarbarian && String(character.build || '').toLowerCase().includes('zealot');
    const isHarengon = String(character.race || '').toLowerCase() === 'harengon';
    const isArtillerist = String(character.class || '').toLowerCase() === 'artificer' && String(character.build || '').toLowerCase() === 'artillerist';

    if (isBarbarian) {
        const level = character.level || 1;
        let maxRages = 2;
        if (level >= 20) maxRages = 99; // "Unlimited"
        else if (level >= 17) maxRages = 6;
        else if (level >= 12) maxRages = 5;
        else if (level >= 6) maxRages = 4;
        else if (level >= 3) maxRages = 3;

        const usedRages = state.rageUsed || 0;

        const pill = document.createElement('div');
        pill.className = 'status-toggle';
        
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'resource-dots';

        const limit = maxRages === 99 ? 6 : maxRages;
        for (let i = 0; i < limit; i++) {
            const dot = document.createElement('div');
            dot.className = 'resource-dot' + (i < usedRages ? ' spent' : '');
            dot.title = 'Rage Use (Shift-click to reset)';
            dot.addEventListener('click', (e) => {
                const currentState = window.readActionState(character);
                const currentUsed = currentState.rageUsed || 0;
                currentState.rageUsed = !e.shiftKey ? ((i < currentUsed) ? i : (i + 1)) : 0;
                window.writeActionState(character, currentState);
                render(character);
            });
            dotsContainer.appendChild(dot);
        }

        pill.innerHTML = `<span>Rages (${maxRages === 99 ? '∞' : maxRages})</span>`;
        pill.appendChild(dotsContainer);
        container.appendChild(pill);
    }

    if (isZealot && character.level >= 10) {
        const used = state.zealousPresenceUsed || 0;
        const pill = document.createElement('div');
        pill.className = 'status-toggle';
        
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'resource-dots';

        const dot = document.createElement('div');
        dot.className = 'resource-dot' + (used ? ' spent' : '');
        dot.title = 'Zealous Presence (1/long rest)';
        dot.addEventListener('click', (e) => {
            const currentState = window.readActionState(character);
            currentState.zealousPresenceUsed = (currentState.zealousPresenceUsed || 0) ? 0 : 1;
            window.writeActionState(character, currentState);
            render(character);
        });
        dotsContainer.appendChild(dot);

        pill.innerHTML = `<span>Zealous Presence</span>`;
        pill.appendChild(dotsContainer);
        container.appendChild(pill);
    }

    if (isArtillerist && character.level >= 3) {
        const maxUses = window.DDRules.proficiencyFromLevel(character.level);
        const usedCount = state.eldritchCannonUsed || 0;

        const pill = document.createElement('div');
        pill.className = 'status-toggle';
        
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'resource-dots';

        for (let i = 0; i < maxUses; i++) {
            const dot = document.createElement('div');
            dot.className = 'resource-dot' + (i < usedCount ? ' spent' : '');
            dot.title = 'Eldritch Cannon Use (Shift-click to reset)';
            dot.addEventListener('click', (e) => {
                const currentState = window.readActionState(character);
                const currentUsed = currentState.eldritchCannonUsed || 0;
                currentState.eldritchCannonUsed = !e.shiftKey ? ((i < currentUsed) ? i : (i + 1)) : 0;
                window.writeActionState(character, currentState);
                render(character);
            });
            dotsContainer.appendChild(dot);
        }
        pill.innerHTML = `<span>Eldritch Cannon</span>`;
        pill.appendChild(dotsContainer);
        container.appendChild(pill);
    }

    if (isHarengon) {
        const maxUses = window.DDRules.proficiencyFromLevel(character.level);
        const usedCount = state.rabbitHopUsed || 0;

        const pill = document.createElement('div');
        pill.className = 'status-toggle';
        
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'resource-dots';

        for (let i = 0; i < maxUses; i++) {
            const dot = document.createElement('div');
            dot.className = 'resource-dot' + (i < usedCount ? ' spent' : '');
            dot.title = 'Rabbit Hop Use (Shift-click to reset)';
            dot.addEventListener('click', (e) => {
                const currentState = window.readActionState(character);
                const currentUsed = currentState.rabbitHopUsed || 0;
                currentState.rabbitHopUsed = !e.shiftKey ? ((i < currentUsed) ? i : (i + 1)) : 0;
                window.writeActionState(character, currentState);
                render(character); // Re-render the page
            });
            dotsContainer.appendChild(dot);
        }
        pill.innerHTML = `<span>Rabbit Hop</span>`;
        pill.appendChild(dotsContainer);
        container.appendChild(pill);
    }
  }

  async function render(character) {
    global._currentCharacter = character; // Expose for debugging
    renderHeader(character);
    const state = window.readActionState(character);
    F.statusTrackers().innerHTML = ''; // Clear old toggles
    renderResourceTrackers(character, state);

    // Clear existing content before rendering new actions
    F.actionMove().innerHTML = '<h2>Move <span class="heading-helper"></span></h2>';
    F.actionStd().innerHTML = '<h2>Action <span class="heading-helper">(1 per turn)</span></h2>';
    F.actionBonus().innerHTML = '<h2>Bonus Action <span class="heading-helper">(Max. 1 per turn)</span></h2>';
    F.actionReact().innerHTML = '<h2>Reaction <span class="heading-helper">(Max. 1 per round)</span></h2>';

    // --- Speed Calculation (local to this page) ---
    // This logic is copied from sheet-character.js to avoid cross-dependencies
    async function calculateSpeed(character) {
      function monkUnarmoredBonus(level) {
        if (level >= 18) return 30; if (level >= 14) return 25; if (level >= 10) return 20;
        if (level >= 6)  return 15; if (level >= 2)  return 10; return 0;
      }
      function isWearingArmor(armor) { return Boolean(armor && (armor.category || armor.type)); }
      function safeArmorCtx(ctx) { return ctx && typeof ctx === 'object' ? { armor: ctx.armor || null, shield: !!ctx.shield } : { armor: null, shield: false }; }

      const armorCtx = safeArmorCtx(null); // Assuming no armor context for simplicity on this page
      const { speed: base } = await window.getRaceBaseSpeed(character);
      let total = base;
      const cls = (character?.class || '').trim().toLowerCase();
      const lvl = Number(character?.level || 1);
      if (cls === 'monk' && lvl >= 2 && !isWearingArmor(armorCtx.armor) && !armorCtx.shield) {
        total += monkUnarmoredBonus(lvl);
      }
      return Math.max(0, total);
    }

    // Update dynamic heading helper for speed
    const moveHelperEl = F.actionMove().querySelector('.heading-helper');
    if (moveHelperEl) {
      const speed = await calculateSpeed(character);
      moveHelperEl.textContent = `(up to ${speed} ft)`;
    }

    if (typeof window.getCharacterActions !== 'function') {
      console.error('actions-logic.js is not loaded or getCharacterActions is not defined.');
      return;
    }

    const allActions = await window.getCharacterActions(character, state);

    function renderActionColumn(container, actions, character) {
      for (const action of actions) {
        let desc = action.desc;

        // Dynamic placeholder replacement for specific actions
        if (action.name === 'Breath Weapon') {
          const pb = window.DDRules.proficiencyFromLevel(character.level);
          const conMod = window.DDRules.abilityMod(character?.abilities?.CON ?? 10);
          const dc = 8 + pb + conMod;
          const dmg = ((level) => {
            if (level >= 16) return "5d6";
            if (level >= 11) return "4d6";
            if (level >= 6) return "3d6";
            return "2d6";
          })(character.level);
          desc = desc.replace('{DC}', dc).replace('{DMG}', dmg);
        } else if (action.name === 'Activate Eldritch Cannon') {
          const damageDice = (character.level || 1) >= 9 ? '3d8' : '2d8';
          const intMod = window.DDRules.abilityMod(character?.abilities?.INT ?? 10);
          const protectorHP = `1d8${window.DDRules.fmtMod(intMod)}`;
          desc = desc.replace(/{DMG}/g, damageDice).replace('{HP}', protectorHP);
        }

        const el = document.createElement('div');
        el.className = 'action-item tooltip';
        el.setAttribute('data-tooltip', desc);
        el.innerHTML = `<div class="action-name">${action.name}</div><div class="action-source">${action.source}</div>`;

        // Special handling for the Rage toggle
        if (action.name === 'Rage') {
          el.classList.add('action-toggle');
          const nameEl = el.querySelector('.action-name');
          if (state.isRaging) {
            el.classList.add('raging');
            nameEl.textContent = 'RAGING';
          }
          el.addEventListener('click', () => {
            const currentState = window.readActionState(character);
            const isTurningOn = !currentState.isRaging;

            if (isTurningOn) {
              const level = character.level || 1;
              let maxRages = 2;
              if (level >= 20) maxRages = 99; else if (level >= 17) maxRages = 6; else if (level >= 12) maxRages = 5; else if (level >= 6) maxRages = 4; else if (level >= 3) maxRages = 3;
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

        container.appendChild(el);
      }
    }

    renderActionColumn(F.actionMove(), allActions.move, character);
    renderActionColumn(F.actionStd(), allActions.action, character);
    renderActionColumn(F.actionBonus(), allActions.bonus, character);
    renderActionColumn(F.actionReact(), allActions.reaction, character);
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
    const want = url.searchParams.get('char') || global.STORAGE.get('dd:lastChar') || 'direcris.json';
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