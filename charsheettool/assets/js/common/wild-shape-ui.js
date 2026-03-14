(function(global) {
  'use strict';

  function statusWriter(customStatusFn) {
    if (typeof customStatusFn === 'function') return customStatusFn;
    return (msg) => {
      const el = document.querySelector('#status');
      if (!el) return;
      el.textContent = String(msg || '');
      if (msg) setTimeout(() => { if (el.textContent === msg) el.textContent = ''; }, 1800);
    };
  }

  function candidateCharacters(character) {
    const list = [character, global.__char_original, global.__char];
    if (typeof global.getCurrentCharacter === 'function') {
      list.push(global.getCurrentCharacter());
    }
    const out = [];
    const seen = new Set();
    for (const c of list) {
      if (!c || typeof c !== 'object') continue;
      const key = String(c.name || '').trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(c);
    }
    return out;
  }

  function readSpellStateSync(character) {
    if (typeof global.readSpellState !== 'function') return {};
    const chars = candidateCharacters(character);
    const merged = {};
    for (const c of chars) {
      const st = global.readSpellState(c) || {};
      Object.assign(merged, st);
      if (Number.isFinite(Number(st.wildShapeUsed))) {
        merged.wildShapeUsed = Number(st.wildShapeUsed);
      }
    }
    return merged;
  }

  function writeSpellStateSync(character, state) {
    if (typeof global.writeSpellState !== 'function') return;
    for (const c of candidateCharacters(character)) {
      global.writeSpellState(c, state);
    }
  }

  function getMaxUses(character) {
    const cls = String(character?.class || '').toLowerCase();
    const level = Number(character?.level || 1);
    if (cls !== 'druid' || level < 2) return 0;
    if (level >= 20) return Number.POSITIVE_INFINITY; // Archdruid
    return 2;
  }

  function getUsesUsed(character) {
    const st = readSpellStateSync(character);
    return Math.max(0, Number(st.wildShapeUsed || 0));
  }

  function getUsesRemaining(character) {
    const max = getMaxUses(character);
    const used = getUsesUsed(character);
    if (!Number.isFinite(max)) return Number.POSITIVE_INFINITY;
    return Math.max(0, max - used);
  }

  function renderBeastStatBlock(beast, container) {
    if (!container) return;
    if (!beast) {
      container.innerHTML = '<p style="text-align:center;color:#666;margin-top:2em;">Select a beast to view its stats.</p>';
      return;
    }

    const s = beast;
    const metaParts = String(s.meta || '').split(',').map(part => part.trim());
    const sizeAndType = metaParts[0] || '';
    const alignment = metaParts[1] || '';

    const imageHTML = s.img_url ? `
      <div class="stat-block-image-container">
        <img src="${s.img_url}" alt="${s.name}" loading="lazy">
      </div>
    ` : '';

    const abilityScoresHTML = `
      <div class="ability-scores">
        <div><strong>STR</strong><span>${s.STR} (${s.STR_mod})</span></div>
        <div><strong>DEX</strong><span>${s.DEX} (${s.DEX_mod})</span></div>
        <div><strong>CON</strong><span>${s.CON} (${s.CON_mod})</span></div>
        <div><strong>INT</strong><span>${s.INT} (${s.INT_mod})</span></div>
        <div><strong>WIS</strong><span>${s.WIS} (${s.WIS_mod})</span></div>
        <div><strong>CHA</strong><span>${s.CHA} (${s.CHA_mod})</span></div>
      </div>
    `;

    const secondaryStatsHTML = `
      <div class="stat-block-secondary-stats">
        ${s.Skills ? `<div><strong>Skills</strong> ${s.Skills}</div>` : ''}
        ${s.Senses ? `<div><strong>Senses</strong> ${s.Senses}</div>` : ''}
        ${s.Languages ? `<div><strong>Languages</strong> ${s.Languages}</div>` : ''}
        ${s.Challenge ? `<div><strong>Challenge</strong> ${s.Challenge}</div>` : ''}
      </div>
    `;

    const traitsHTML = s.Traits ? `<div class="injected-html">${s.Traits}</div>` : '';
    const actionsHTML = s.Actions ? `<h3 class="actions-header">Actions</h3><div class="injected-html">${s.Actions}</div>` : '';

    container.innerHTML = `
      <div class="stat-block">
        <div class="bar"></div>
        <div class="stat-block-content">
          ${imageHTML}
          <div class="stat-block-header">
            <div class="stat-block-name">${s.name}</div>
          </div>
          <div class="stat-block-subtitle">${sizeAndType}, ${alignment}</div>
          <div class="bar"></div>
          <div class="stat-block-stats">
            <div><strong>AC</strong> ${s['Armor Class']}</div>
            <div><strong>HP</strong> ${s['Hit Points']}</div>
            <div><strong>Speed</strong> ${s.Speed}</div>
          </div>
          <div class="bar"></div>
          ${abilityScoresHTML}
          <div class="bar"></div>
          ${secondaryStatsHTML}
          ${traitsHTML}
          ${actionsHTML}
        </div>
      </div>
    `;
  }

  function parseHP(raw) {
    const n = parseInt(String(raw || '').match(/\d+/)?.[0] || '0', 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }

  async function open(character, opts = {}) {
    const setStatus = statusWriter(opts.setStatus);
    const modal = document.getElementById('wild-shape-modal');
    const backdrop = document.getElementById('modal-backdrop');
    const listEl = document.getElementById('ws-beast-list');
    const statBlockEl = document.getElementById('ws-stat-block-container');
    const searchEl = document.getElementById('ws-search');
    const transformBtn = document.getElementById('ws-modal-transform-btn');
    const closeBtn = document.getElementById('ws-modal-close-btn');
    if (!modal || !backdrop || !listEl || !statBlockEl || !searchEl || !transformBtn || !closeBtn) {
      return { ok: false, reason: 'missing_modal_dom' };
    }

    if (getUsesRemaining(character) <= 0) {
      setStatus('No Wild Shape uses remaining.');
      return { ok: false, reason: 'no_uses' };
    }

    let options = [];
    try {
      options = await global.CharCalculations.getWildShapeOptions(character);
    } catch (err) {
      setStatus('Could not load Wild Shape options.');
      return { ok: false, reason: 'options_error', error: err };
    }
    let selectedBeast = null;

    const renderList = (filter = '') => {
      listEl.innerHTML = '';
      const q = String(filter || '').toLowerCase().trim();
      const filteredOptions = q ? options.filter(o => String(o.name || '').toLowerCase().includes(q)) : options;
      for (const beast of filteredOptions) {
        const item = document.createElement('div');
        item.className = 'ws-beast-item';
        item.textContent = beast.name;
        item.onclick = () => {
          selectedBeast = beast;
          renderBeastStatBlock(beast, statBlockEl);
          document.querySelectorAll('.ws-beast-item.selected').forEach(el => el.classList.remove('selected'));
          item.classList.add('selected');
          transformBtn.disabled = false;
        };
        listEl.appendChild(item);
      }
    };

    searchEl.oninput = () => renderList(searchEl.value);
    renderList();
    renderBeastStatBlock(null, statBlockEl);
    transformBtn.disabled = true;

    modal.classList.remove('hidden');
    backdrop.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    const close = () => {
      modal.classList.add('hidden');
      backdrop.classList.add('hidden');
      document.body.style.overflow = '';
      transformBtn.onclick = null;
      closeBtn.onclick = null;
      backdrop.onclick = null;
      searchEl.oninput = null;
    };

    closeBtn.onclick = close;
    backdrop.onclick = close;

    transformBtn.onclick = () => {
      if (!selectedBeast) return;
      if (getUsesRemaining(character) <= 0) {
        setStatus('No Wild Shape uses remaining.');
        close();
        return;
      }

      const actionState = global.readActionState(character) || {};
      const spellState = readSpellStateSync(character);
      const maxUses = getMaxUses(character);
      if (Number.isFinite(maxUses)) {
        spellState.wildShapeUsed = Math.max(0, Number(spellState.wildShapeUsed || 0)) + 1;
      }
      if (spellState.symbioticActive) {
        spellState.symbioticActive = false;
        const granted = Math.max(0, Number(actionState.symbioticTempHpGranted || 0));
        if (granted > 0 && Number(character.tempHP || 0) <= granted) {
          character.tempHP = 0;
        }
        delete actionState.symbioticTempHpGranted;
      }

      actionState.isWildShaped = true;
      actionState.wildShapeForm = selectedBeast.name;
      actionState.wildShapeCurrentHP = parseHP(selectedBeast['Hit Points']);
      actionState.druidPreShapeHP = Number(character.currentHP || character.maxHP || 1);

      writeSpellStateSync(character, spellState);
      global.writeActionState(character, actionState);
      close();
      if (typeof opts.onChange === 'function') opts.onChange();
    };

    return { ok: true };
  }

  function revert(character, opts = {}) {
    const setStatus = statusWriter(opts.setStatus);
    const state = global.readActionState(character) || {};
    if (!state.isWildShaped) return { ok: false, reason: 'not_wild_shaped' };

    if (opts.confirm !== false) {
      const yes = global.confirm ? global.confirm('Revert from Wild Shape?') : true;
      if (!yes) return { ok: false, reason: 'cancelled' };
    }

    const beastHP = Number(state.wildShapeCurrentHP || 0);
    if (beastHP <= 0) {
      const excessDamage = Math.abs(beastHP);
      character.currentHP = Math.max(0, Number((state.druidPreShapeHP ?? character.maxHP) - excessDamage));
    } else {
      character.currentHP = Number(state.druidPreShapeHP ?? character.maxHP ?? character.currentHP ?? 1);
    }

    delete state.isWildShaped;
    delete state.wildShapeForm;
    delete state.wildShapeCurrentHP;
    delete state.druidPreShapeHP;
    global.writeActionState(character, state);
    if (typeof opts.onChange === 'function') opts.onChange();
    if (opts.notice) setStatus(String(opts.notice));
    return { ok: true };
  }

  global.WildShapeUI = {
    getMaxUses,
    getUsesUsed,
    getUsesRemaining,
    renderBeastStatBlock,
    open,
    revert
  };
})(window);
