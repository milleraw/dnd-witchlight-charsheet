// assets/js/common/ribbon-button.js
(function (global) {
  const NS = 'http://www.w3.org/2000/svg';

  function resolveContainer(c) {
    if (!c) return document.body;
    if (typeof c === 'string') return document.querySelector(c) || document.body;
    return c;
  }

  function makeGrad(svg, id, a, b) {
    const defs = svg.querySelector('defs') || svg.appendChild(document.createElementNS(NS, 'defs'));
    const g = document.createElementNS(NS, 'linearGradient');
    g.setAttribute('id', id);
    g.setAttribute('x1', '0'); g.setAttribute('y1', '0');
    g.setAttribute('x2', '1'); g.setAttribute('y2', '1');
    const s1 = document.createElementNS(NS, 'stop'); s1.setAttribute('offset', '0%');   s1.setAttribute('stop-color', a);
    const s2 = document.createElementNS(NS, 'stop'); s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', b);
    g.appendChild(s1); g.appendChild(s2); defs.appendChild(g);
    return `url(#${id})`;
  }

  function computeRibbonPath(w, h, bulge = 0.48, endR = 10) {
    const r = Math.min(endR, h / 2);
    const cx = w * 0.5, rise = h * bulge;

    // left rounded end
    const p = [
      `M ${r},0`,
      `H ${cx - 8}`,
      // gentle bow up
      `C ${cx - w*0.18},0  ${cx - w*0.18},${rise}  ${cx},${rise}`,
      // gentle bow down
      `C ${cx + w*0.18},${rise}  ${cx + w*0.18},0  ${cx + 8},0`,
      `H ${w - r}`,
      // right cap
      `A ${r} ${r} 0 0 1 ${w - r},${h}`,
      `H ${r}`,
      // left cap
      `A ${r} ${r} 0 0 1 ${r},0`,
      'Z'
    ];
    return p.join(' ');
  }

  function createRibbonButton(opts = {}) {
    const {
      id = 'ribbon-' + Math.random().toString(36).slice(2),
      top = 0, left = 0, width = 120, height = 50, mirrored = false,
      label = 'Button', container = document.body, 
      onClick = null, bulge = 0.48, endRadius = 10
    } = opts;

    const host = resolveContainer(container);

    // SVG shell
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('id', id);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('width',  `${width}`);
    svg.setAttribute('height', `${height}`);
    Object.assign(svg.style, {
      position: 'absolute',
      left: left + 'px',
      top:  top  + 'px',
      width:  width + 'px',
      height: height + 'px',
      zIndex: 40,                 // above the paper art, below tooltips
      cursor: 'pointer',
      pointerEvents: 'auto'
    });

    // Gradients (fall back if CSS vars missing)
    const cs = getComputedStyle(document.documentElement);
    const parch1 = cs.getPropertyValue('--rb-parch-1').trim() || '#f8f1df';
    const parch2 = cs.getPropertyValue('--rb-parch-2').trim() || '#ecd9b8';
    const acc1   = cs.getPropertyValue('--rb-accent-1').trim() || '#f6e27a';
    const acc2   = cs.getPropertyValue('--rb-accent-2').trim() || '#f1c14f';

    const fillNorm  = makeGrad(svg, id + '-parch', parch1, parch2);
    const fillHover = makeGrad(svg, id + '-hover', acc1, acc2);

    // Ribbon shape
const path = document.createElementNS(NS, 'path');

// Default shape (in case you don’t override)
let d = computeRibbonPath(width, height, bulge, endRadius);

// If the caller gave us a custom path string, use it
if (opts.d) {
  d = opts.d;
}

path.setAttribute('d', d);
path.setAttribute('fill', fillNorm);
path.setAttribute('stroke', 'rgba(0,0,0,0.25)');
path.setAttribute('stroke-width', '1');

    // Soft inner shadow/highlight
    const gloss = document.createElementNS(NS, 'path');
    gloss.setAttribute('d', computeRibbonPath(width, height, bulge * 0.9, endRadius));
    gloss.setAttribute('fill', 'rgba(255,255,255,0.07)');

    // Group the path and gloss so they can be transformed together
    const g = document.createElementNS(NS, 'g');
    if (mirrored) {
      g.setAttribute('transform', `scale(-1, 1) translate(-${width}, 0)`);
    }
    g.appendChild(path);
    g.appendChild(gloss);

    // Label
    const txt = document.createElementNS(NS, 'text');
    txt.setAttribute('x', width / 2);
    txt.setAttribute('y', height / 2 + 1);
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('dominant-baseline', 'middle');
    txt.setAttribute('class', 'rb-label');
    txt.textContent = label;

    svg.appendChild(g);
    svg.appendChild(txt);
    host.appendChild(svg);

    // Interactions
    svg.addEventListener('mouseenter', () => {
      path.setAttribute('fill', fillHover);
      svg.style.filter = 'drop-shadow(0 2px 2px rgba(0,0,0,0.25))';
    });
    svg.addEventListener('mouseleave', () => {
      path.setAttribute('fill', fillNorm);
      svg.style.filter = '';
    });
    if (typeof onClick === 'function') svg.addEventListener('click', onClick);

    return svg;
  }

  // Expose BOTH names so your existing boot() keeps working
  global.RibbonButton = global.RibbonButton || {};
  global.RibbonButton.create = createRibbonButton;
  global.createRibbonButton = createRibbonButton;
})(window);
