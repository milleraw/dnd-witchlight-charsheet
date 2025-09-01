// assets/js/glue-spells.js
// Bridge the working spells page to shared libs without changing behavior.

// 1) Selectors ($ / $$) — your dom.cleaned.js already defines these.
window.$  = window.$  || (window.Dom && window.Dom.$);
window.$$ = window.$$ || (window.Dom && window.Dom.$$);

// 2) URL param helper
window.setURLParam = window.setURLParam || (window.Dom && window.Dom.setURLParam);

// 3) Spell DC math — use the exact shared calc
window.computeSpellSaveDC = window.computeSpellSaveDC || (window.Dom && window.Dom.computeSpellSaveDC);

// 4) Character + spells loaders (delegates to storage.cleaned.js)
window.loadCharacter = window.loadCharacter || (async function(file){
  // accept "/data/foo.json", "foo.json", or just "foo"
  const clean = String(file || '').replace(/^\/?data\//,'').replace(/^\.\//,'');
  const fname = clean.toLowerCase().endsWith('.json') ? clean : `${clean}.json`;
  return await (window.safeJSONMulti
    ? safeJSONMulti([`/data/${fname}`, `./data/${fname}`, `./${fname}`], null)
    : fetch(`/data/${fname}`).then(r => r.ok ? r.json() : null).catch(()=>null));
});

// 5) Text fitting — both TextFit.autoFit and global autofit exist
window.autoFit = window.autoFit || (window.TextFit && window.TextFit.autoFit);
window.autofit = window.autofit || (val => (window.TextFit && TextFit.measureAutoRows
  ? TextFit.measureAutoRows(val)
  : 0));


// 6) Tooltips — minimal auto-hook so your existing `class="tooltip" data-tooltip="..."`
(function(){
  if (window.__tooltip_delegate) return; // idempotent
  window.__tooltip_delegate = true;
  let tip;
  function ensureTip(){
    if (tip) return tip;
    tip = document.createElement('div');
    tip.id = 'global-tooltip';
    tip.style.position='absolute'; tip.style.display='none';
    tip.style.pointerEvents='none'; tip.style.padding='6px 8px';
    tip.style.borderRadius='6px'; tip.style.background='rgba(0,0,0,.9)';
    tip.style.color='#fff'; tip.style.fontSize='12px';
    tip.style.maxWidth='40ch'; tip.style.whiteSpace='pre-line';
    document.body.appendChild(tip);
    return tip;
  }
  document.addEventListener('mouseover', (e)=>{
    const el = e.target.closest('.tooltip, [data-tooltip], [data-desc]');
    if (!el) return;
    if (el.hasAttribute('title')) el.removeAttribute('title'); // suppress native bubble
    const t = ensureTip();
    t.textContent = el.getAttribute('data-tooltip')
               || el.getAttribute('data-desc')
               || el.getAttribute('title')
               || '';    if (!t.textContent) return;
    t.style.display='block';
  }, true);
  document.addEventListener('mousemove', (e)=>{
    if (!tip || tip.style.display==='none') return;
    tip.style.left = (e.pageX + 12) + 'px';
    tip.style.top  = (e.pageY + 12) + 'px';
  }, true);
  document.addEventListener('mouseout', (e)=>{
    if (!tip) return;
    const to = e.relatedTarget;
    if (!to || !to.closest || !to.closest('.tooltip, [data-tooltip], [data-desc]')) {
    tip.style.display='none';
    }
  }, true);
})();

// 7) DDData object shim (provides spell data loading for older inline scripts)
(function(global){
  if (global.DDData) return;

  // --- Caching -------------------------------------------------------------
  const SPELL_DESC_CACHE = new Map();
  function cacheGet(name){
    const key = `spell:desc:${name.toLowerCase()}`;
    if (SPELL_DESC_CACHE.has(key)) return SPELL_DESC_CACHE.get(key);
    try {
      const ls = localStorage.getItem(key);
      if (ls) { SPELL_DESC_CACHE.set(key, ls); return ls; }
    } catch {}
    return null;
  }
  function cacheSet(name, text){
    const key = `spell:desc:${name.toLowerCase()}`;
    SPELL_DESC_CACHE.set(key, text);
    try{ localStorage.setItem(key, text); }catch{}
  }

  // --- Networking ----------------------------------------------------------
  async function fetchJSON(url, {timeoutMs=7000} = {}){
    const ctrl = new AbortController();
    const t = setTimeout(()=>ctrl.abort(), timeoutMs);
    try{
      const r = await fetch(url, {signal: ctrl.signal});
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } finally { clearTimeout(t); }
  }

  // --- Spell Data Loading & Indexing ---------------------------------------
  let _spellsCache = null;
  let _spellIndex = null; // { className: { level: Spell[] } }

  function normalizeClassName(x=''){
    return String(x).trim().toLowerCase();
  }

  const SPELLS_URL_LOCAL =
    ((document.querySelector('meta[name="data-root"]')?.content?.trim()) || './data/') + 'spells.json';

  async function loadAllSpells() {
    if (_spellsCache) return _spellsCache;
    try {
      const r = await fetch(SPELLS_URL_LOCAL, { cache: 'no-store' });
      if (!r.ok) throw new Error(`Local spells.json not found (${r.status})`);
      _spellsCache = await r.json();
    } catch (e) {
      console.warn('[spells] local fetch failed:', e.message);
      _spellsCache = [];
    }
    buildSpellIndex(_spellsCache);
    return _spellsCache;
  }

  function buildSpellIndex(spells) {
    _spellIndex = {};
    const list = Array.isArray(spells) ? spells : Object.values(spells || {});
    for (const s of list) {
      const level = Number(s.level ?? s.level_int ?? 0) || 0;
      const clsList = Array.isArray(s.classes)
        ? s.classes
        : (typeof s.class === 'string' ? [s.class] : []);
      for (const c of clsList) {
        const key = normalizeClassName(c);
        _spellIndex[key] ??= {};
        _spellIndex[key][level] ??= [];
        _spellIndex[key][level].push(s);
      }
    }
  }

  async function getSpellsForClassLevel(className, minLevel=0, maxLevel=9, opts){
    await loadAllSpells();
    let cap = maxLevel;
    const ch = opts?.character ?? (window.currentCharacter || null);
    if (ch && typeof window.DDRules?.getMaxSpellLevelFor === 'function') {
      cap = Math.min(maxLevel, window.DDRules.getMaxSpellLevelFor(ch));
    }

    const key = normalizeClassName(className);
    const byLevel = _spellIndex?.[key] || {};
    const out = [];
    const start = Math.max(0, minLevel);
    for (let L = start; L <= cap; L++) {
      out.push(...(byLevel[L] || []));
    }
    out.sort((a,b) => (Number(a.level||0) - Number(b.level||0)) || String(a.name).localeCompare(b.name));
    return out;
  }

  const CLASS_LIST_CACHE = new Map();
  async function getClassSpellList(className){
    const key = String(className||'').toLowerCase();
    if (!key) return [];
    if (CLASS_LIST_CACHE.has(key)) return CLASS_LIST_CACHE.get(key);

    const base = await fetchJSON(`https://www.dnd5eapi.co/api/classes/${encodeURIComponent(key)}/spells`).catch(()=>null);
    if (!base || !Array.isArray(base.results)) { CLASS_LIST_CACHE.set(key, []); return []; }

    const out = [];
    for (const it of base.results) {
      const idx = it.index || it.url?.split('/').pop();
      if (!idx) continue;
      const d = await fetchJSON(`https://www.dnd5eapi.co/api/spells/${idx}`).catch(()=>null);
      if (d && d.name) out.push({ name: d.name, level: Number(d.level)||0 });
    }
    CLASS_LIST_CACHE.set(key, out);
    return out;
  }

  function spellSlug(name){
    return String(name||'').toLowerCase().replace(/[\u2019'’]/g,'').replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-');
  }

  async function getSpellDescription(name, localIndex){
    const n = String(name||'').trim();
    if (!n) return "";

    const local = localIndex && localIndex[n];
    const fromLocal = local && (local.desc || local.description || local.full || local.text);
    if (fromLocal) return String(Array.isArray(fromLocal) ? fromLocal.join('\n\n') : fromLocal);

    const cached = cacheGet(n);
    if (cached) return cached;

    try{
      const idx = spellSlug(n);
      const data = await fetchJSON(`https://www.dnd5eapi.co/api/spells/${idx}`);
      if (data && data.name){
        const descParts = [].concat(data.desc || []).concat((data.higher_level || []));
        const text = descParts.join('\n\n').trim();
        if (text) { cacheSet(n, text); return text; }
      }
    }catch(e){ /* ignore */ }

    return "";
  }

  // --- Expose the DDData object ---
  global.DDData = {
    loadAllSpells,
    getSpellsForClassLevel,
    getClassSpellList,
    getSpellDescription,
    loadInfusions: global.loadInfusions
  };

})(window);
