// name-curves.js — path-based text fitting (no modules; attaches to window.NameCurves)
(function (global) {
  const NS = (global.NameCurves = global.NameCurves || {});

  /**
   * Grow font-size until text nearly fills the SVG path length or max height.
   * @param {SVGTextElement} textEl - <text> element
   * @param {SVGPathElement} pathEl - <path> whose length we target
   * @param {number} maxH - maximum allowed text bbox height (px)
   * @param {number} startSize - starting font-size (px)
   * @param {number} minSize - lower bound (px)
   */
  function growFitTextToPath(textEl, pathEl, maxH, startSize, minSize) {
    if (!textEl || !pathEl) return;
    const pathLen = pathEl.getTotalLength();
    let size = startSize;

    const tooBig = () => {
      let overLen = false, overH = false;
      try { overLen = textEl.getComputedTextLength() > pathLen * 0.985; } catch {}
      try { overH   = textEl.getBBox().height > maxH; } catch {}
      return overLen || overH;
    };

    // increase, then ratchet down if needed
    for (let i = 0; i < 80; i++) {
      if (tooBig()) break;
      size += 1;
      textEl.setAttribute("font-size", String(size));
      if (size > 300) break;
    }
    while (tooBig() && size > (minSize ?? 6)) {
      size -= 1;
      textEl.setAttribute("font-size", String(size));
    }
  }

  /**
   * Generic ribbon/title fitter used by race/background renderers.
   * Expects an accessor bundle F: { titlePath(), titleText(), bgPathEl(), bgBox() }
   */
  function fitTitleOnBgPath(F, text) {
    const tp     = F?.titlePath?.();
    const textEl = F?.titleText?.();
    const pathEl = F?.bgPathEl?.();
    const box    = F?.bgBox?.();
    if (!tp || !textEl || !pathEl || !box) return;

    tp.textContent = String(text ?? "");
    let size = 36;
    textEl.setAttribute("font-size", String(size));

    const pathLen = pathEl.getTotalLength();
    const maxH    = box.clientHeight || 93;
    const pad     = 2;

    for (let i = 0; i < 60; i++) {
      let tooLong = false, tooTall = false;
      try { tooLong = textEl.getComputedTextLength() > pathLen * 0.985; } catch {}
      try { tooTall = textEl.getBBox().height > (maxH - pad); } catch {}
      if (!tooLong && !tooTall) break;
      size -= 1;
      if (size < 9) break;
      textEl.setAttribute("font-size", String(size));
    }
  }
// --- Render class and level boxes ---------------------------------
function renderClassAndLevel(character) {
  // Class (string, e.g. "Druid")
  const cls = String(character?.class || '');
  autoFit(F.classBox(), cls, {
    max: 40, min: 12,
    letterSpacing: -0.2,
    fontFamily: '"Saber-Regular","Saber",Georgia,serif',
    className: 'base-text', centerAbsolute: true
  });

  // Level (number → string)
  const lvl = String(character?.level ?? '');
  autoFit(F.levelBox(), lvl, {
    max: 24, min: 10,
    className: 'base-text', centerAbsolute: true
  });
}

// expose globally so sheet-character.js / storage.js can call it
window.renderClassAndLevel = renderClassAndLevel;

  /**
   * Curved name renderer (top = first word, bottom = rest).
   * Hides top line for single-word names; fits both lines to their paths.
   */
  function renderCurvedName(fullName) {
    // If your sheet provides F.nameBox(), use it; otherwise fall back to #field-name
    const svgBox = (typeof F !== "undefined" && F?.nameBox) ? F.nameBox() : document.getElementById("field-name");
    const maxH   = svgBox ? svgBox.clientHeight : 85;

    const topText = document.getElementById("name-top");
    const botText = document.getElementById("name-bottom");
    const topPath = document.getElementById("name-curve-top");
    const botPath = document.getElementById("name-curve-bottom");
    const topTP   = document.getElementById("name-top-tp");
    const botTP   = document.getElementById("name-bottom-tp");

    const parts = String(fullName || "").trim().split(/\s+/);

    if (parts.length >= 2) {
      if (topTP) topTP.textContent = parts[0];
      if (topText) {
        topText.style.display = "";
        topText.style.letterSpacing = "-0.2px";
        topText.setAttribute("font-size", "14");
      }

      if (botTP) botTP.textContent = parts.slice(1).join(" ");
      if (botText) {
        botText.style.display = "";
        botText.style.letterSpacing = "-0.5px";
        botText.setAttribute("font-size", "26");
      }

      try { if (botText && botPath) growFitTextToPath(botText, botPath, maxH * 0.62, 26, 12); } catch {}
      try { if (topText && topPath) growFitTextToPath(topText, topPath, maxH * 0.45, 14,  9); } catch {}

      const bottomSize = parseFloat(botText?.getAttribute("font-size") || "26");
      const topSize    = parseFloat(topText?.getAttribute("font-size") || "14");
      const maxTop     = Math.floor(bottomSize * 0.70);
      if (topText && topSize > maxTop) topText.setAttribute("font-size", String(maxTop));
    } else {
      if (topText) topText.style.display = "none";
      if (botTP) botTP.textContent = parts[0] || "";
      if (botText) {
        botText.style.display = "";
        botText.style.letterSpacing = "-0.5px";
        botText.setAttribute("font-size", "28");
      }
      try { if (botText && botPath) growFitTextToPath(botText, botPath, maxH * 0.90, 28, 12); } catch {}
    }
  }

  // Expose
  NS.growFitTextToPath = growFitTextToPath;
  NS.fitTitleOnBgPath  = fitTitleOnBgPath;   // needed by renderRace/renderBackground
  NS.renderCurvedName  = renderCurvedName;

  // Back-compat global
  global.renderCurvedName = renderCurvedName;
  
  // keep legacy global for older callers
window.growFitTextToPath = (window.NameCurves && window.NameCurves.growFitTextToPath) || window.growFitTextToPath;

  /**
   * Two-arc name renderer.
   * Splits the name into first word (top arc) and remainder (bottom arc).
   * Fits both using growFitTextToPath.
   */
  function renderTwoArcName(F, fullName) {
    const box     = F?.nameBox?.()      || document.getElementById('field-name');
    const topText = F?.nameTop?.()      || document.getElementById('name-top');
    const botText = F?.nameBottom?.()   || document.getElementById('name-bottom');
    const topPath = F?.nameTopPath?.()  || document.getElementById('name-curve-top');
    const botPath = F?.nameBottomPath?.()|| document.getElementById('name-curve-bottom');
    const topTP   = F?.nameTopTP?.()    || document.getElementById('name-top-tp');
    const botTP   = F?.nameBottomTP?.() || document.getElementById('name-bottom-tp');

    if (!botText || !botPath || !botTP) return;
    const maxH = (box?.clientHeight) || 85;
    const parts = String(fullName || '').trim().split(/\s+/);

    if (parts.length >= 2 && topText && topPath && topTP) {
      topTP.textContent = parts[0];
      topText.style.display = '';
      topText.style.letterSpacing = '-0.2px';
      topText.setAttribute('font-size', '14');

      botTP.textContent = parts.slice(1).join(' ');
      botText.style.display = '';
      botText.style.letterSpacing = '-0.5px';
      botText.setAttribute('font-size', '26');

      NS.growFitTextToPath(botText, botPath, maxH * 0.62, 26, 12);
      NS.growFitTextToPath(topText, topPath, maxH * 0.45, 14, 9);

      const bottomSize = parseFloat(botText.getAttribute('font-size')) || 26;
      const topSize    = parseFloat(topText.getAttribute('font-size')) || 14;
      const maxTop     = Math.floor(bottomSize * 0.70);
      if (topSize > maxTop) topText.setAttribute('font-size', String(maxTop));
    } else {
      if (topText) topText.style.display = 'none';
      botText.style.display = '';
      botTP.textContent = parts[0] || '';
      botText.style.letterSpacing = '-0.5px';
      botText.setAttribute('font-size', '28');
      NS.growFitTextToPath(botText, botPath, maxH * 0.90, 28, 12);
    }
  }

  NS.renderTwoArcName = renderTwoArcName;


})(window);
