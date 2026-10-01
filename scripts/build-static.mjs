// Renders the hand-made, static SVGs (hero banner + footer) for both themes.
// Run: node scripts/build-static.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import { themes, fonts, esc, reducedMotion } from './theme.mjs';

const OUT = new URL('../assets/', import.meta.url);

// ---------------------------------------------------------------- hero
// Left: name + pitch. Right: a terminal "booting" Lucas like an ASP.NET Core app.
const terminal = [
  // [kind, text]  kind drives colour; `cmd` is typed, the rest fade in one by one
  ['cmd', 'dotnet run --project LucasMenchon'],
  ['dim', '  Building...'],
  ['info', 'Microsoft.Hosting.Lifetime[14]'],
  ['body', '      Now listening on: https://lucas.ee'],
  ['info', 'Lucas.Menchon.Profile[0]'],
  ['body', '      Role: Full Stack .NET Developer'],
  ['body', '      Stack: C# · ASP.NET Core · Angular · React · Vue'],
  ['info', 'Microsoft.Hosting.Lifetime[0]'],
  ['body', '      Application started. Ready to build together.'],
];

function hero(t) {
  const W = 1200;
  const H = 440;
  const tx = 630; // terminal x
  const ty = 60;
  const tw = 530;
  const th = 320;
  const lineH = 25;
  const typeChars = terminal[0][1].length;
  const typeDur = 1.6;

  const lines = terminal
    .map(([kind, text], i) => {
      const y = ty + 78 + i * lineH;
      if (kind === 'cmd') {
        return `
    <text x="${tx + 24}" y="${y}" class="mono" fill="${t.green}">❯</text>
    <text x="${tx + 46}" y="${y}" class="mono" fill="${t.text}">${esc(text)}</text>
    <rect class="typer" x="${tx + 44}" y="${y - 18}" width="${typeChars * 8.6 + 12}" height="26" fill="${t.cardAlt}"/>`;
      }
      const delay = (typeDur + 0.35 + (i - 1) * 0.32).toFixed(2);
      let content;
      if (kind === 'info') {
        content = `<tspan fill="${t.green}" font-weight="700">info</tspan><tspan fill="${t.muted}">: ${esc(text)}</tspan>`;
      } else if (kind === 'dim') {
        content = `<tspan fill="${t.muted}">${esc(text)}</tspan>`;
      } else {
        const [label, ...rest] = text.split(': ');
        content = rest.length
          ? `<tspan fill="${t.text}">${esc(label)}: </tspan><tspan fill="${t.accent}">${esc(rest.join(': '))}</tspan>`
          : `<tspan fill="${t.text}">${esc(text)}</tspan>`;
      }
      return `
    <text x="${tx + 24}" y="${y}" class="mono line" style="animation-delay:${delay}s">${content}</text>`;
    })
    .join('');

  const lastY = ty + 78 + terminal.length * lineH;
  const cursorDelay = (typeDur + 0.35 + (terminal.length - 1) * 0.32).toFixed(2);

  const chips = [
    ['◉', 'São Paulo, Brazil'],
    ['◆', 'Building at Olik'],
    ['✦', 'Open to collaborate'],
  ];
  let cx = 60;
  const chipSvg = chips
    .map(([icon, label], i) => {
      const w = label.length * 7.7 + 44;
      const out = `
    <g class="chip" style="animation-delay:${(0.5 + i * 0.12).toFixed(2)}s">
      <rect x="${cx}" y="318" width="${w}" height="34" rx="17" fill="${t.cardAlt}" stroke="${t.border}"/>
      <text x="${cx + 16}" y="340" font-size="13" fill="${t.accent}">${icon}</text>
      <text x="${cx + 32}" y="340" class="sans" font-size="13.5" fill="${t.text}">${esc(label)}</text>
    </g>`;
      cx += w + 8;
      return out;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc">
  <title id="title">Lucas Menchon — Full Stack .NET Developer</title>
  <desc id="desc">Lucas Menchon, Full Stack .NET Developer from São Paulo, Brazil. A terminal boots his profile like an ASP.NET Core app.</desc>
  <defs>
    <linearGradient id="name" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${t.accent}"/>
      <stop offset="0.55" stop-color="${t.accent2}"/>
      <stop offset="1" stop-color="${t.accent3}"/>
    </linearGradient>
    <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${t.accent}" stop-opacity="0.9"/>
      <stop offset="0.5" stop-color="${t.border}" stop-opacity="0.6"/>
      <stop offset="1" stop-color="${t.accent2}" stop-opacity="0.9"/>
    </linearGradient>
    <radialGradient id="orbA"><stop offset="0" stop-color="${t.orbA}" stop-opacity="${t.orbOpacity}"/><stop offset="1" stop-color="${t.orbA}" stop-opacity="0"/></radialGradient>
    <radialGradient id="orbB"><stop offset="0" stop-color="${t.orbB}" stop-opacity="${t.orbOpacity}"/><stop offset="1" stop-color="${t.orbB}" stop-opacity="0"/></radialGradient>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M32 0H0V32" fill="none" stroke="${t.grid}" stroke-width="1"/>
    </pattern>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.9"/><stop offset="1" stop-color="#fff" stop-opacity="0.05"/>
    </linearGradient>
    <mask id="gridMask"><rect width="${W}" height="${H}" fill="url(#fade)"/></mask>
    <clipPath id="term"><rect x="${tx + 1}" y="${ty + 41}" width="${tw - 2}" height="${th - 42}" rx="12"/></clipPath>
    <clipPath id="frame"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="22"/></clipPath>
  </defs>
  <style>
    .sans { font-family: ${fonts.sans}; }
    .mono { font-family: ${fonts.mono}; font-size: 14.5px; }
    .line { opacity: 0; animation: in .45s ease-out forwards; }
    .chip { opacity: 0; animation: in .6s ease-out forwards; }
    .rise { opacity: 0; animation: rise .8s cubic-bezier(.2,.8,.2,1) forwards; }
    .typer { animation: type ${typeDur}s steps(${typeChars}) .3s forwards; }
    .cursor { opacity: 0; animation: blink 1.1s step-end ${cursorDelay}s infinite; }
    .orbA { animation: driftA 14s ease-in-out infinite alternate; }
    .orbB { animation: driftB 18s ease-in-out infinite alternate; }
    .dot { animation: pulse 2.4s ease-in-out infinite; }
    @keyframes in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
    @keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
    @keyframes type { to { transform: translateX(${typeChars * 8.6 + 12}px); } }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
    @keyframes driftA { to { transform: translate(90px, 40px); } }
    @keyframes driftB { to { transform: translate(-80px, -30px); } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
    ${reducedMotion}
  </style>

  <g clip-path="url(#frame)">
    <rect width="${W}" height="${H}" fill="${t.bg}"/>
    <rect width="${W}" height="${H}" fill="url(#grid)" mask="url(#gridMask)"/>
    <circle class="orbA" cx="220" cy="80" r="320" fill="url(#orbA)"/>
    <circle class="orbB" cx="1040" cy="420" r="340" fill="url(#orbB)"/>
  </g>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="22" fill="none" stroke="url(#edge)" stroke-width="1.5"/>

  <!-- identity -->
  <g class="rise">
    <text x="60" y="104" class="mono" font-size="15" fill="${t.muted}"><tspan fill="${t.accent}">public sealed class</tspan> Developer</text>
  </g>
  <g class="rise" style="animation-delay:.1s">
    <text x="56" y="182" class="sans" font-size="66" font-weight="800" letter-spacing="-2" fill="url(#name)">Lucas Menchon</text>
  </g>
  <g class="rise" style="animation-delay:.2s">
    <text x="60" y="226" class="sans" font-size="23" font-weight="600" fill="${t.text}">Full Stack .NET Developer</text>
    <text x="60" y="264" class="sans" font-size="16.5" fill="${t.muted}">Building fast, clean and reliable software —</text>
    <text x="60" y="288" class="sans" font-size="16.5" fill="${t.muted}">from the database all the way to the pixel.</text>
  </g>
  ${chipSvg}

  <!-- terminal -->
  <g class="rise" style="animation-delay:.15s">
    <rect x="${tx}" y="${ty}" width="${tw}" height="${th}" rx="14" fill="${t.cardAlt}" stroke="${t.border}"/>
    <path d="M${tx} ${ty + 40}H${tx + tw}" stroke="${t.border}"/>
    <circle cx="${tx + 22}" cy="${ty + 20}" r="6" fill="#ff5f57"/>
    <circle cx="${tx + 42}" cy="${ty + 20}" r="6" fill="#febc2e"/>
    <circle cx="${tx + 62}" cy="${ty + 20}" r="6" fill="#28c840"/>
    <text x="${tx + tw / 2}" y="${ty + 25}" text-anchor="middle" class="mono" font-size="12.5" fill="${t.muted}">~/lucasmenchon — dotnet</text>
    <circle class="dot" cx="${tx + tw - 26}" cy="${ty + 20}" r="4" fill="${t.green}"/>
  </g>
  <g clip-path="url(#term)">${lines}
  </g>
    <rect class="cursor" x="${tx + 24}" y="${lastY - 16}" width="9" height="19" fill="${t.accent}"/>
</svg>
`;
}

// ---------------------------------------------------------------- footer
function footer(t) {
  const W = 1200;
  const H = 120;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Thanks for stopping by">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${t.accent}" stop-opacity="0"/>
      <stop offset="0.5" stop-color="${t.accent}"/>
      <stop offset="1" stop-color="${t.accent2}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <style>
    .w { animation: wave 6s ease-in-out infinite alternate; }
    .w2 { animation: wave 8s ease-in-out infinite alternate-reverse; }
    @keyframes wave { to { transform: translateX(-120px); } }
    ${reducedMotion}
  </style>
  <path class="w" d="M0 60 Q 75 30 150 60 T 300 60 T 450 60 T 600 60 T 750 60 T 900 60 T 1050 60 T 1200 60 T 1350 60" fill="none" stroke="url(#g)" stroke-width="2"/>
  <path class="w2" d="M0 66 Q 100 96 200 66 T 400 66 T 600 66 T 800 66 T 1000 66 T 1200 66 T 1400 66" fill="none" stroke="url(#g)" stroke-width="1.2" opacity=".55"/>
  <text x="600" y="112" text-anchor="middle" font-family="${fonts.mono}" font-size="14" fill="${t.muted}">// Thanks for stopping by — let's build something great.</text>
</svg>
`;
}

await mkdir(OUT, { recursive: true });
for (const [mode, t] of Object.entries(themes)) {
  await writeFile(new URL(`hero-${mode}.svg`, OUT), hero(t));
  await writeFile(new URL(`footer-${mode}.svg`, OUT), footer(t));
}
console.log('static assets written to assets/');
