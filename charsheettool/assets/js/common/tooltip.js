// tooltip.clean.js — spells‑style tooltips (+ gear/pack helpers)
// No modules; attaches to window.Tooltips

(function (global) {
  const NS = (global.Tooltips = global.Tooltips || {});

  // -------------------------
  // 1) Single global tooltip
  // -------------------------
  let el; // <div id="tt">
  function ensure() {
    if (el) return el;
    el = document.createElement('div');
    el.id = 'tt';
    // viewport‑anchored, never clipped
    el.style.position = 'fixed';
    el.style.inset = 'auto auto auto auto';
    el.style.zIndex = '2147483000';
    el.style.display = 'none';
    el.style.pointerEvents = 'none';
    
    //newline function
    
    el.style.whiteSpace = 'pre-line'; // show \n as actual new lines

    // visual
    el.style.background = 'rgba(0,0,0,0.85)';
    el.style.color = '#fff';
    el.style.padding = '6px 10px';
    el.style.borderRadius = '8px';
    el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
    el.style.fontFamily = 'var(--base-text, "IM Fell DW Pica SC", serif)';
    el.style.fontSize = '12px';
    el.style.lineHeight = '1.25';
    el.style.whiteSpace = 'pre-wrap';
    el.style.maxWidth = '360px';
    el.style.transform = 'translate3d(0,0,0)'; // create layer

    document.body.appendChild(el);
    return el;
  }

  // -------------------------
  // 2) Core show/hide/move
  // -------------------------
  const OFFSET = 14; // cursor gap
  let shownFor = null; // element currently showing tooltip for

  function setText(t) {
  const tip = ensure();

  // 1) Normalize: turn CRLF -> LF and literal "\n" -> real newlines
  const s = t == null ? '' : String(t);
  const normalized = s.replace(/\r\n?/g, '\n').replace(/\\n/g, '\n');

  // 2) Render lines explicitly as text nodes + <br>, so CSS can't interfere
  while (tip.firstChild) tip.removeChild(tip.firstChild);
  const lines = normalized.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (i) tip.appendChild(document.createElement('br'));
    tip.appendChild(document.createTextNode(lines[i]));
  }

  // 3) Show (same measuring dance you already had)
  tip.style.visibility = 'hidden';
  tip.style.display = 'block';
  // force layout so width/height are accurate
  // eslint-disable-next-line no-unused-expressions
  tip.offsetWidth;
  tip.style.visibility = 'visible';
}


  function place(clientX, clientY) {
    const tip = ensure();
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    const vw = global.innerWidth;
    const vh = global.innerHeight;

    // start to the right & below the cursor
    let x = clientX + OFFSET;
    let y = clientY + OFFSET;

    // clamp to right/bottom edges
    if (x + w + 6 > vw) x = Math.max(6, vw - w - 6);
    if (y + h + 6 > vh) {
      // flip above the cursor if needed
      const above = clientY - h - OFFSET;
      y = above >= 6 ? above : Math.max(6, vh - h - 6);
    }

    tip.style.left = Math.round(x) + 'px';
    tip.style.top  = Math.round(y) + 'px';
  }

  function showFor(target, txt, e) {
    shownFor = target;
    setText(txt);
    place(e.clientX, e.clientY);
    ensure().style.display = 'block';
  }
  function hide() {
    shownFor = null;
    ensure().style.display = 'none';
  }

  // -------------------------
  // 3) Event wiring (spells‑style)
  //    Reads text from data-tooltip; does not touch title/tooltips on pips.
  // -------------------------
  function resolveText(node) {
    if (!node) return null;
    // prefer explicit dataset
    if (node.dataset && node.dataset.tooltip) return node.dataset.tooltip;
    // some renderers mark with .tooltip and also stash text there
    if (node.classList && node.classList.contains('tooltip') && node.dataset?.tooltip) {
      return node.dataset.tooltip;
    }
    return null;
  }

  function onMove(e) {
    // walk up from the hovered node to the closest element with data-tooltip
    let t = e.target instanceof Element ? e.target : null;
    while (t && t !== document.body) {
      const txt = resolveText(t);
      if (txt) {
        if (shownFor !== t) showFor(t, txt, e);
        else place(e.clientX, e.clientY);
        return;
      }
      t = t.parentElement;
    }
    hide();
  }

  function onLeave(e) {
    if (!e.relatedTarget || !ensure().contains(e.relatedTarget)) hide();
  }

  function enableGlobalHover() {
    // idempotent
    if (enableGlobalHover._wired) return;
    enableGlobalHover._wired = true;
    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave, { passive: true });
  }

  // expose a convenience for places that want to imperatively add tooltips
  function attach(el, text) {
    if (!el) return;
    el.classList.add('tooltip');
    el.dataset.tooltip = String(text ?? '');
  }

  // -------------------------
  // 4) Gear / packs helpers
  // -------------------------
  function packTooltip(packObj) {
    const list = (packObj?.contents || packObj?.items || [])
      .map(x =>
        typeof x === 'string'
          ? `• ${x}`
          : (x?.name ? `• ${x.name}${x.qty ? ` (x${x.qty})` : ''}` : null)
      )
      .filter(Boolean)
      .join('\n');

    return list
      ? `${packObj?.name || 'Pack'}\n\nContents:\n${list}`
      : (packObj?.name || '');
  }

  // Builds tooltip text for anything in the Gear/Weapons/Armor lists
async function gearTooltipFor(item) {
  if (!item || typeof item !== 'object') return '';

  // --- If a description is provided inline, show it right under the name ---
  const descLine = (typeof item.desc === 'string' && item.desc.trim())
    ? item.desc.trim()
    : '';

  // --- If contents/items already exist, render as a pack right away ---
  if (Array.isArray(item.contents) || Array.isArray(item.items)) {
    const contents = (item.contents || item.items)
      .map(x => typeof x === 'string'
        ? `• ${x}`
        : (x?.name ? `• ${x.name}${x.qty ? ` (x${x.qty})` : ''}` : null))
      .filter(Boolean)
      .join('\n');

    return [item.name, contents ? `Contents:\n${contents}` : null, descLine]
      .filter(Boolean)
      .join('\n\n');
  }

  // --- Try to resolve packs by name/ref from /data/packs.json ---
  const name = String(item.name || '');
  const ref  = String(item.ref  || '');
  const looksLikePack = /\b(pack|kit)\b/i.test(name) || /\b(pack|kit)\b/i.test(ref);

  if (looksLikePack && typeof window.loadPacksCatalog === 'function') {
    const toKey = s => String(s || '')
      .toLowerCase()
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const catalog = await window.loadPacksCatalog().catch(() => ({}));
    const kA = [name, ref, toKey(name), toKey(ref)].filter(Boolean);
    let packObj = null;

    for (const k of kA) {
      if (!k) continue;
      if (catalog[k]) { packObj = catalog[k]; break; }
      if (catalog.packs && catalog.packs[k]) { packObj = catalog.packs[k]; break; }
      // array-shaped catalog support
      if (Array.isArray(catalog)) {
        packObj = catalog.find(p =>
          toKey(p.index) === toKey(k) || toKey(p.name) === toKey(k)
        ) || null;
        if (packObj) break;
      }
    }

    if (packObj && (packObj.contents?.length || packObj.items?.length)) {
      const contents = (packObj.contents || packObj.items)
        .map(x => typeof x === 'string'
          ? `• ${x}`
          : (x?.name ? `• ${x.name}${x.qty ? ` (x${x.qty})` : ''}` : null))
        .filter(Boolean)
        .join('\n');

      return [
        item.name || packObj.name || 'Pack',
        contents ? `Contents:\n${contents}` : null,
        descLine
      ].filter(Boolean).join('\n\n');
    }
  }

  // --- Weapon-like ---
  if (item.damage || item.range || (Array.isArray(item.properties) && item.properties.length)) {
    const parts = [];
    if (item.damage) parts.push(`${item.damage}${item.damageType ? ' ' + item.damageType : ''}`);
    if (item.range)  parts.push(`range ${item.range}`);
    if (item.properties?.length) parts.push(item.properties.join(', '));
    return [name, parts.join(' · '), descLine || item.notes || ''].filter(Boolean).join('\n');
  }

  // --- Armor-like ---
  if (item.ac) {
    const parts = [`AC ${item.ac}`];
    if (item.stealthDisadvantage) parts.push('Stealth disadvantage');
    if (item.strReq) parts.push(`STR ${item.strReq} required`);
    return [name, parts.join(' · '), descLine || item.notes || ''].filter(Boolean).join('\n');
  }

  // --- Default ---
  const base = item?.qty > 1 ? `${name} (x${item.qty})` : name;
  return [base, descLine].filter(Boolean).join('\n\n');
}


  // -------------------------
  // 5) Public API + boot
  // -------------------------
  NS.attach         = attach;         // Tooltips.attach(el, "text")
  NS.packTooltip    = packTooltip;    // Tooltips.packTooltip(obj)
  NS.gearTooltipFor = gearTooltipFor; // await Tooltips.gearTooltipFor(item)
  NS.enable         = enableGlobalHover;

  // auto‑enable on DOM ready
  if (document.readyState !== 'loading') enableGlobalHover();
  else document.addEventListener('DOMContentLoaded', enableGlobalHover);
})(window);
