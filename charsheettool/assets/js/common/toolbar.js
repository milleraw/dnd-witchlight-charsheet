// toolbar.js — centralized toolbar initialization
(function(global) {
  'use strict';

  function initToolbar(opts = {}) {
    const {
      onLoadCharacter = () => {},
      onSaveCharacter = () => {}
    } = opts;

    const sel = document.getElementById('char-select');
    const input = document.getElementById('char-input');
    const loadBtn = document.getElementById('char-load');
    const saveBtn = document.getElementById('save-char');

    if (!sel || !input || !loadBtn || !saveBtn) {
      console.warn('[toolbar] Could not find all required elements.');
      return;
    }

    // Add party controls (scope + assignment) once.
    let scopeSel = document.getElementById('party-scope');
    let assignBtn = document.getElementById('party-assign');
    if (!scopeSel) {
      const label = document.createElement('strong');
      label.textContent = 'Party:';
      label.style.marginLeft = '8px';
      scopeSel = document.createElement('select');
      scopeSel.id = 'party-scope';
      scopeSel.title = 'Active party scope (used by party-aware tools like infusion targeting)';
      scopeSel.style.minWidth = '140px';
      const scopes = (typeof global.getPartyScopes === 'function')
        ? global.getPartyScopes()
        : ['All Parties', 'Witchlight', 'Witchlight-Test', 'One-Shots'];
      scopeSel.innerHTML = scopes.map(s => `<option value="${s}">${s}</option>`).join('');
      const currentScope = (typeof global.getActivePartyScope === 'function')
        ? global.getActivePartyScope()
        : 'All Parties';
      if (scopes.includes(currentScope)) scopeSel.value = currentScope;

      assignBtn = document.createElement('button');
      assignBtn.id = 'party-assign';
      assignBtn.type = 'button';
      assignBtn.textContent = 'Assign Party';
      assignBtn.title = 'Assign selected character file to currently selected party scope';
      assignBtn.style.marginLeft = '4px';

      const statusEl = document.getElementById('status');
      const anchor = statusEl || saveBtn.nextSibling;
      saveBtn.parentNode.insertBefore(label, anchor);
      saveBtn.parentNode.insertBefore(scopeSel, anchor);
      saveBtn.parentNode.insertBefore(assignBtn, anchor);
    }

    // Populate dropdown from storage
    if (typeof global.getCharacterList === 'function') {
        const charList = global.getCharacterList();
        if (charList.length) {
            sel.innerHTML = charList.map(f => `<option value="${f}">${f}</option>`).join('');
        }
    }

    // Event listeners
    const doLoad = () => {
      const file = input.value.trim() || sel.value;
      if (file) onLoadCharacter(file);
    };

    // Keep global scope in sync.
    scopeSel.addEventListener('change', () => {
      if (typeof global.setActivePartyScope === 'function') {
        global.setActivePartyScope(scopeSel.value);
      }
    });

    // Assign selected character file to selected party scope.
    assignBtn.addEventListener('click', () => {
      const file = input.value.trim() || sel.value;
      const scope = scopeSel.value;
      if (!file) return;
      if (typeof global.setCharacterParty === 'function') {
        global.setCharacterParty(file, scope);
      }
      const status = document.getElementById('status');
      if (status) {
        status.textContent = `Assigned ${file} to ${scope}.`;
        setTimeout(() => { if (status.textContent.includes('Assigned')) status.textContent = ''; }, 1800);
      }
    });

    loadBtn.addEventListener('click', doLoad);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLoad(); });
    sel.addEventListener('change', () => {
      input.value = sel.value;
      doLoad();
    });
    saveBtn.addEventListener('click', onSaveCharacter);
  }

  global.initToolbar = initToolbar;

})(window);
