// Shared design tokens for every SVG in this profile.
// Each asset is rendered twice (dark + light) and swapped in the README via <picture>.

export const themes = {
  dark: {
    bg: '#0d1117',
    card: '#161b22',
    cardAlt: '#0f141b',
    border: '#30363d',
    grid: '#21262d',
    text: '#e6edf3',
    muted: '#8b949e',
    faint: '#484f58',
    accent: '#a78bfa',
    accent2: '#58a6ff',
    accent3: '#22d3ee',
    green: '#3fb950',
    yellow: '#d29922',
    pink: '#f778ba',
    orbA: '#7c3aed',
    orbB: '#2563eb',
    orbOpacity: 0.35,
    shine: '#ffffff',
    shineOpacity: 0.07,
    // contribution levels 0..4
    levels: ['#1f242c', '#3b2a6b', '#5b3fb0', '#8b5cf6', '#c4b5fd'],
  },
  light: {
    bg: '#ffffff',
    card: '#ffffff',
    cardAlt: '#f6f8fa',
    border: '#d0d7de',
    grid: '#eaeef2',
    text: '#1f2328',
    muted: '#59636e',
    faint: '#afb8c1',
    accent: '#6d28d9',
    accent2: '#0969da',
    accent3: '#0e7490',
    green: '#1a7f37',
    yellow: '#9a6700',
    pink: '#bf3989',
    orbA: '#a78bfa',
    orbB: '#60a5fa',
    orbOpacity: 0.28,
    shine: '#8b5cf6',
    shineOpacity: 0.1,
    levels: ['#eceff3', '#ddd6fe', '#a78bfa', '#7c3aed', '#4c1d95'],
  },
};

export const fonts = {
  sans: "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif",
  mono: "'Cascadia Code', 'JetBrains Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
};

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const fmt = (n) => new Intl.NumberFormat('en-US').format(n);

// GitHub linguist colors, with a few nudged so they stay visible on dark backgrounds.
export const langColors = {
  'C#': '#178600',
  C: '#a8b9cc',
  'C++': '#f34b7d',
  Vue: '#41b883',
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  HTML: '#e34c26',
  CSS: '#663399',
  SCSS: '#c6538c',
  Dockerfile: '#4d8fa8',
  Shell: '#89e051',
  PowerShell: '#4a8ad8',
  Makefile: '#427819',
  'ASP.NET': '#9400ff',
  Python: '#3572a5',
  Go: '#00add8',
  Java: '#b07219',
};

export const langColor = (name) => {
  if (langColors[name]) return langColors[name];
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${h} 55% 55%)`;
};

// Respect users who ask the OS for less motion: jump every animation to its end state.
export const reducedMotion = `
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; animation-iteration-count: 1 !important; }
  }`;

// ---------------------------------------------------------------- motion kit
// Pure-CSS motion shared by every card, so the whole profile moves with one language.
// (CSS rather than SMIL so the reduced-motion rule above can freeze it.)
export const motionCss = `
    .comet { animation: orbit var(--dur, 9s) linear infinite; }
    .shine { animation: sweep var(--dur, 7s) cubic-bezier(.4,0,.2,1) infinite; }
    .pop { opacity: 0; transform-box: fill-box; transform-origin: center; animation: pop .7s cubic-bezier(.34,1.56,.64,1) forwards; }
    .cu { opacity: 0; }
    @keyframes orbit { to { stroke-dashoffset: -1000; } }
    @keyframes sweep { 0% { transform: translateX(0); } 30%, 100% { transform: translateX(var(--to, 1600px)); } }
    @keyframes pop { 0% { opacity: 0; transform: scale(.4); } 100% { opacity: 1; transform: scale(1); } }
    @keyframes cuf { from, to { opacity: 1; } }
    @keyframes cul { to { opacity: 1; } }`;

// A short bright dash that keeps travelling around a rounded rectangle.
export const comet = (t, { x = 1, y = 1, w, h, r = 18, dur = 9, delay = 0 }) => `
  <rect class="comet" style="--dur:${dur}s;animation-delay:-${delay}s" x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="${t.accent}" stroke-width="2" stroke-linecap="round" pathLength="1000" stroke-dasharray="70 930" opacity=".95"/>
  <rect class="comet" style="--dur:${dur}s;animation-delay:-${(delay + dur / 2).toFixed(2)}s" x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="${t.accent2}" stroke-width="2" stroke-linecap="round" pathLength="1000" stroke-dasharray="45 955" opacity=".8"/>`;

// A soft diagonal light band that sweeps across a clipped area every few seconds.
export const shine = (t, { id, w, h, r = 18, dur = 7, delay = 0, clip }) => `
  <defs>
    <linearGradient id="${id}-g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${t.shine}" stop-opacity="0"/>
      <stop offset=".5" stop-color="${t.shine}" stop-opacity="${t.shineOpacity}"/>
      <stop offset="1" stop-color="${t.shine}" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="${id}-c">${clip ?? `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${r}"/>`}</clipPath>
  </defs>
  <g clip-path="url(#${id}-c)"><g transform="skewX(-18)">
    <rect class="shine" style="--dur:${dur}s;--to:${w + 600}px;animation-delay:${delay}s" x="-320" y="-20" width="220" height="${h + 40}" fill="url(#${id}-g)"/>
  </g></g>`;

// Odometer-style count-up: a stack of frames, each visible for a blink, the last one stays.
export function countUp(value, { x, y, delay = 0, dur = 1.1, cls = '', attrs = '' }) {
  const m = String(value).match(/^([\d,]+)(.*)$/);
  if (!m) return `<text class="${cls}" x="${x}" y="${y}" ${attrs}>${esc(value)}</text>`;
  const target = Number(m[1].replace(/,/g, ''));
  const suffix = m[2];
  const steps = Math.min(14, Math.max(1, target));
  const d = dur / steps;
  let out = '';
  for (let k = 1; k <= steps; k++) {
    const p = k / steps;
    const v = Math.round(target * (1 - (1 - p) ** 3));
    const start = (delay + (k - 1) * d).toFixed(3);
    const anim = k === steps ? `cul .01s linear ${start}s forwards` : `cuf ${(d + 0.02).toFixed(3)}s linear ${start}s`;
    out += `<text class="cu ${cls}" style="animation:${anim}" x="${x}" y="${y}" ${attrs}>${esc(fmt(v) + suffix)}</text>`;
  }
  return out;
}

// Deterministic PRNG so rebuilt SVGs only change when the data does.
export function rng(seed = 7) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}
