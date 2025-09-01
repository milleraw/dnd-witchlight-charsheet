// textfit.js — robust autoFit used by the sheet (drop-in)
/* global window */
(function (global) {
  function ensureSpan(box, className) {
    let span = box.querySelector(':scope > .autofit');
    if (!span) {
      span = document.createElement('span');
      span.className = 'autofit';
      box.appendChild(span);
    }
    if (className) {
      for (const c of String(className).split(/\s+/)) {
        if (c) span.classList.add(c);
      }
    }
    return span;
  }

  /**
   * autoFit: put `text` into a child <span.autofit>, then size/align it to fit the box.
   * Options:
   *  - max, min (px) — font-size bounds
   *  - className — extra class(es) for the span (e.g. "base-text")
   *  - wrap (bool) — allow wrapping; otherwise keep on one line
   *  - lineHeight — number (e.g. 1.1) or CSS string
   *  - letterSpacing — number (px) or CSS string
   *  - centerAbsolute (bool) — absolutecenter the span inside the box
   */
  function autoFit(box, text, opts = {}) {
    if (!box) return null;

    const {
      max = 24,
      min = 8,
      className = '',
      wrap = false,
      lineHeight = null,
      letterSpacing = null,
      centerAbsolute = false
    } = opts;

    const span = ensureSpan(box, className);

    if (typeof text === 'string') {
      span.textContent = text;
    }

    // Layout styles
    span.style.whiteSpace   = wrap ? 'normal' : 'nowrap';
    span.style.wordBreak    = wrap ? 'break-word' : 'normal';
    span.style.lineHeight   = lineHeight == null
      ? ''
      : (typeof lineHeight === 'number' ? String(lineHeight) : String(lineHeight));
    span.style.letterSpacing = letterSpacing == null
      ? ''
      : (typeof letterSpacing === 'number' ? `${letterSpacing}px` : String(letterSpacing));

    if (centerAbsolute) {
      const cs = getComputedStyle(box);
      if (!cs.position || cs.position === 'static') box.style.position = 'relative';
      span.style.position = 'absolute';
      span.style.left = '50%';
      span.style.top = '50%';
      span.style.transform = 'translate(-50%, -50%)';
      span.style.width = wrap ? '100%' : 'auto';
      span.style.textAlign = 'center';
    } else {
      span.style.position = '';
      span.style.left = span.style.top = span.style.transform = '';
      if (wrap) span.style.width = '100%';
      else span.style.width = 'auto';
    }

    // Fit by shrinking/growing within bounds against BOTH width & height
    const boxW = box.clientWidth || box.offsetWidth;
    const boxH = box.clientHeight || box.offsetHeight;

    let size = Math.max(Number(max) || 24, Number(min) || 8);
    span.style.fontSize = size + 'px';

    const fits = () =>
      span.scrollWidth <= boxW && span.scrollHeight <= boxH;

    // First, shrink down until it fits
    let guard = 0;
    while (!fits() && size > min && guard < 300) {
      size -= 1;
      span.style.fontSize = size + 'px';
      guard++;
    }
    // Then, grow up to max if we have room
    while (fits() && size < max && guard < 600) {
      const next = size + 1;
      span.style.fontSize = next + 'px';
      if (span.scrollWidth <= boxW && span.scrollHeight <= boxH) {
        size = next;
      } else {
        // back off
        span.style.fontSize = size + 'px';
        break;
      }
      guard++;
    }

    return span;
  }

  // Rows helper (unchanged API)
  function measureAutoRows(box, { exclude = 0 } = {}) {
    const cs = getComputedStyle(box);
    const fs = parseFloat(cs.fontSize) || 11;
    const lh = (cs.lineHeight === 'normal' ? fs * 1.25 : parseFloat(cs.lineHeight)) || 14;
    const h  = box.clientHeight || parseFloat(cs.height) || 0;
    return Math.max(0, Math.floor(h / lh) - exclude);
  }

  // Expose (back-compat)
  global.TextFit = global.TextFit || {};
  global.TextFit.autoFit = autoFit;
  global.TextFit.measureAutoRows = measureAutoRows;

  global.autoFit = autoFit;                  // legacy alias many calls use
  if (!('autofit' in global)) {
    global.autofit = (box, opts) => measureAutoRows(box, opts);
  }
})(window);
