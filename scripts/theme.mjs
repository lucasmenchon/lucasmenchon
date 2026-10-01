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
