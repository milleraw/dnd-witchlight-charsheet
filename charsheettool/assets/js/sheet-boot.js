// sheet-boot.js — glue that ties shared modules together

// Shims so we don’t blow up if a page loads out of order
(function ensureShims(){
  if (typeof window.autoFit !== 'function' && window.TextFit?.autoFit) {
    window.autoFit = window.TextFit.autoFit;
  }
})();

// Master render — calls all the individual renderers split across files
async function renderCharacter(character, state = {}) {
  if (!character) return;

  // keep around for HP buttons etc.
  window.__char = character;

  // Get condition effects once to pass to other renderers
  const conditionEffects = getActiveConditionEffects(character);

  // Top-of-sheet
  renderSimpleFields(character);        // uses renderCurvedName/renderRace/renderBackground
  renderAbilityFields(character, state, conditionEffects);

  // Combat cluster
  await renderArmorAndAC(character);
  renderInitiative(character);
  await renderPassivePerception(character, conditionEffects);
  renderSpellSaveDC(character);
  await renderSpeed(character);

  // Attacks/Gear/Currency
  await renderAttacks(character, state, conditionEffects);
  await renderGear(character);
  renderCurrency(character);

  // Languages/Proficiencies/Features
  renderLanguages(character);
  await renderProficiencies(character);
  await renderFeaturesBox(character);
  await renderConditionsTracker(character);
  renderDeathSaves(character);
  renderIncapacitatedOverlay(conditionEffects);

  // Proficiency pips overlay
  renderProficiencyPips(character);

  // HP cluster last (depends on window.__char)
  renderHPCluster(character);
}

// Load a character file (from /data) then render
async function renderFromCharacterFile(pathOrName) {
  const fileOnly = String(pathOrName || '').replace(/^.*\//,'');
  try {
    const data = await loadCharacter(fileOnly);              // from storage.cleaned.js
    if (!data) throw new Error(`Could not load ${fileOnly}`);

    // Apply saved HP snapshot before rendering
    if (typeof applyHPSnapshot === 'function') {
      applyHPSnapshot(data);
    }

    const state = window.readActionState ? window.readActionState(data) : {};
    setCurrentCharacter(fileOnly, data);                     // remember last loaded
    // reflect in URL (?char=...)
    if (typeof setURLParam === 'function') setURLParam('char', fileOnly);
    await renderCharacter(data, state);
    const st = document.getElementById('status'); if (st) st.textContent = `Loaded ${fileOnly}`;
  } catch (err) {
    console.error(err);
    const st = document.getElementById('status'); if (st) st.textContent = `Error: ${err.message || err}`;
    alert(`Failed to load character:\n${err.message || err}`);
  }
}

// Wire toolbar + boot choice
function bootSheet() {
  // toolbar from toolbar.clean.js
  if (typeof initToolbar === 'function') {
    initToolbar({
      onLoadCharacter: (chosen) => {
        // normalize to base filename for deep-linking
        const fileOnly = String(chosen || '').replace(/^.*\//,'').replace(/^\/?data\//,'');
        renderFromCharacterFile(fileOnly);
      },
      onSaveCharacter: () => {
        if (typeof saveHPSnapshot === 'function') {
          saveHPSnapshot();
          const st = document.getElementById('status');
          if (st) {
            st.textContent = 'HP saved.';
            setTimeout(() => { st.textContent = ''; }, 2000);
          }
        }
      }
    });
  }

  // HP + other UI controls from sheet-character-clean2.js
  if (typeof wireHPButtons === 'function') wireHPButtons();

  // initial pick: ?char=... or first option in #char-select
  const params = new URLSearchParams(location.search);
  const picked = params.get('char');
  const sel = document.querySelector('#char-select');

  if (picked) {
    renderFromCharacterFile(picked);
  } else if (sel && sel.value) {
    renderFromCharacterFile(sel.value);
  } else {
    // hard fallback so something renders
    renderFromCharacterFile('direcris.json');
  }

  // Add navigation ribbon button once sheet has rendered
  if (typeof createRibbonButton === 'function') {
    createRibbonButton({
      id: "to-actions", container: "#sheet", top: 6, left: 5, width: 110, height: 52,
      label: "Actions →",
      d: "M 12 19 C 10.3333 19.6667 20 17 25 15 L 30 22 L 30 15 L 32 16 L 32 13 C 34.6667 11 64 20 98 2 C 97 14 88 18 89 23 Q 93 30 106 34 C 94 44 87 44 74 40 L 71 34 L 71 40 C 68.6667 39.6667 66.3333 39.3333 64 39 L 62 36 L 61 39 C 62 38 41 41 9 56 C 11 48 18 43 20 34 C 10 30 11 29 2 21 Z",
      onClick: () => { location.href = `actions.html${location.search}`; }
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

// Expose the two globals other code (or console) expects
window.renderCharacter         = window.renderCharacter         || renderCharacter;
window.renderFromCharacterFile = window.renderFromCharacterFile || renderFromCharacterFile;

// Start after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootSheet);
} else {
  bootSheet();
}
