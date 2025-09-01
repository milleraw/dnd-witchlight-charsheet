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
