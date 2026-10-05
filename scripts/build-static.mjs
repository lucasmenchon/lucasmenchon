// Renders the hand-made SVGs that don't depend on GitHub data (hero, section headers,
// tech stack, footer) for both themes.
// Run: node scripts/build-static.mjs
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { themes, fonts, esc, reducedMotion, motionCss, comet, shine, rng } from './theme.mjs';

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

// After booting, the prompt keeps cycling through these, typed and erased in a loop.
const loopCommands = ['dotnet test   # ✔ all green', 'git commit -m "make it right"', 'studying --topic architecture'];

const CH = 8.7; // approx. advance of one monospace glyph at 14.5px

function hero(t) {
  const W = 1200;
  const H = 440;
  const tx = 630; // terminal x
  const ty = 50;
  const tw = 530;
  const th = 345;
  const lineH = 25;
  const typeChars = terminal[0][1].length;
  const typeDur = 1.6;
  const bootEnd = typeDur + 0.35 + (terminal.length - 1) * 0.32;

  const lines = terminal
    .map(([kind, text], i) => {
      const y = ty + 78 + i * lineH;
      if (kind === 'cmd') {
        return `
    <text x="${tx + 24}" y="${y}" class="mono" fill="${t.green}">❯</text>
    <text x="${tx + 46}" y="${y}" class="mono" fill="${t.text}">${esc(text)}</text>
    <rect class="typer" x="${tx + 44}" y="${y - 18}" width="${typeChars * CH + 12}" height="26" fill="${t.cardAlt}"/>`;
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

  // Looping prompt: each command owns a slot of the cycle; it is typed, held, then erased.
  const promptY = ty + 78 + terminal.length * lineH;
  const slot = 4.5;
  const cycle = slot * loopCommands.length;
  const pct = (s) => ((s / cycle) * 100).toFixed(2);
  const loopKeyframes = loopCommands
    .map((cmd, i) => {
      const n = cmd.length;
      const a = i * slot; // slot start (seconds into cycle)
      return `
    @keyframes show${i} { 0%, ${pct(a)}% { opacity: 0; } ${pct(a + 0.01)}%, ${pct(a + slot - 0.01)}% { opacity: 1; } ${pct(a + slot)}%, 100% { opacity: 0; } }
    @keyframes type${i} {
      0%, ${pct(a)}% { transform: translateX(0); animation-timing-function: steps(${n}); }
      ${pct(a + 1.4)}% { transform: translateX(${(n * CH + 14).toFixed(1)}px); }
      ${pct(a + slot - 0.7)}% { transform: translateX(${(n * CH + 14).toFixed(1)}px); animation-timing-function: steps(${n}); }
      ${pct(a + slot - 0.05)}%, 100% { transform: translateX(0); }
    }
    @keyframes caret${i} {
      0%, ${pct(a)}% { transform: translateX(0); animation-timing-function: steps(${n}); }
      ${pct(a + 1.4)}% { transform: translateX(${(n * CH).toFixed(1)}px); }
      ${pct(a + slot - 0.7)}% { transform: translateX(${(n * CH).toFixed(1)}px); animation-timing-function: steps(${n}); }
      ${pct(a + slot - 0.05)}%, 100% { transform: translateX(0); }
    }`;
    })
    .join('');
  const loopSvg = loopCommands
    .map((cmd, i) => {
      const anim = (name) => `animation: ${name}${i} ${cycle}s linear ${bootEnd.toFixed(2)}s infinite`;
      return `
    <g style="opacity:0;${anim('show')}">
      <text x="${tx + 46}" y="${promptY}" class="mono" fill="${t.text}">${esc(cmd).replace(/(#.*)$/, `<tspan fill="${t.muted}">$1</tspan>`)}</text>
      <rect style="${anim('type')}" x="${tx + 44}" y="${promptY - 18}" width="${cmd.length * CH + 14}" height="26" fill="${t.cardAlt}"/>
      <g style="${anim('caret')}"><rect class="blink" x="${tx + 46}" y="${promptY - 15}" width="9" height="19" fill="${t.accent}"/></g>
    </g>`;
    })
    .join('');

  const chips = [
    ['loc', 'São Paulo, Brazil'],
    ['work', 'Building at Olik'],
    ['spark', 'Open to collaborate'],
  ];
  let cx = 60;
  const chipSvg = chips
    .map(([icon, label], i) => {
      const w = label.length * 7.7 + 46;
      const ix = cx + 19;
      const iy = 335;
      const glyph = {
        loc: `<circle cx="${ix}" cy="${iy}" r="4" fill="${t.accent}"/><circle class="ping" cx="${ix}" cy="${iy}" r="4" fill="none" stroke="${t.accent}" stroke-width="1.5"/>`,
        work: `<rect class="spin" x="${ix - 4}" y="${iy - 4}" width="8" height="8" rx="1.5" fill="${t.accent2}"/>`,
        spark: `<path class="spin" d="M${ix} ${iy - 6}L${ix + 1.6} ${iy - 1.6}L${ix + 6} ${iy}L${ix + 1.6} ${iy + 1.6}L${ix} ${iy + 6}L${ix - 1.6} ${iy + 1.6}L${ix - 6} ${iy}L${ix - 1.6} ${iy - 1.6}Z" fill="${t.accent3}"/>`,
      }[icon];
      const out = `
    <g class="chip" style="animation-delay:${(0.5 + i * 0.12).toFixed(2)}s">
      <rect x="${cx}" y="318" width="${w}" height="34" rx="17" fill="${t.cardAlt}" stroke="${t.border}"/>
      ${glyph}
      <text x="${cx + 34}" y="340" class="sans" font-size="13.5" fill="${t.text}">${esc(label)}</text>
    </g>`;
      cx += w + 8;
      return out;
    })
    .join('');

  // Drifting "dust" particles rising through the banner.
  const rand = rng(42);
  const particles = Array.from({ length: 26 }, () => {
    const x = (rand() * W).toFixed(0);
    const y = (H * 0.4 + rand() * H * 0.7).toFixed(0);
    const r = (0.8 + rand() * 1.8).toFixed(1);
    const dur = (9 + rand() * 10).toFixed(1);
    const delay = (rand() * 12).toFixed(1);
    const color = [t.accent, t.accent2, t.accent3][Math.floor(rand() * 3)];
    return `<circle class="mote" style="animation-duration:${dur}s;animation-delay:-${delay}s" cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
  }).join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc">
  <title id="title">Lucas Menchon — Full Stack .NET Developer</title>
  <desc id="desc">Lucas Menchon, Full Stack .NET Developer from São Paulo, Brazil. A terminal boots his profile like an ASP.NET Core app.</desc>
  <defs>
    <linearGradient id="name" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${t.accent}"/>
      <stop offset="0.55" stop-color="${t.accent2}"/>
      <stop offset="1" stop-color="${t.accent3}"/>
    </linearGradient>
    <linearGradient id="nameShine" gradientUnits="userSpaceOnUse" x1="-260" y1="0" x2="0" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#fff" stop-opacity="${t === themes.dark ? 0.55 : 0.75}"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
      <animateTransform attributeName="gradientTransform" type="translate" values="0 0;760 0;760 0" keyTimes="0;.45;1" dur="6s" begin="1.2s" repeatCount="indefinite"/>
    </linearGradient>
    <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${t.accent}" stop-opacity="0.7"/>
      <stop offset="0.5" stop-color="${t.border}" stop-opacity="0.6"/>
      <stop offset="1" stop-color="${t.accent2}" stop-opacity="0.7"/>
    </linearGradient>
    <radialGradient id="orbA"><stop offset="0" stop-color="${t.orbA}" stop-opacity="${t.orbOpacity}"/><stop offset="1" stop-color="${t.orbA}" stop-opacity="0"/></radialGradient>
    <radialGradient id="orbB"><stop offset="0" stop-color="${t.orbB}" stop-opacity="${t.orbOpacity}"/><stop offset="1" stop-color="${t.orbB}" stop-opacity="0"/></radialGradient>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M32 0H0V32" fill="none" stroke="${t.grid}" stroke-width="1"/>
      <animateTransform attributeName="patternTransform" type="translate" from="0 0" to="32 32" dur="8s" repeatCount="indefinite"/>
    </pattern>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.9"/><stop offset="1" stop-color="#fff" stop-opacity="0.05"/>
    </linearGradient>
    <mask id="gridMask"><rect width="${W}" height="${H}" fill="url(#fade)"/></mask>
    <linearGradient id="scan" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${t.accent}" stop-opacity="0"/>
      <stop offset="1" stop-color="${t.accent}" stop-opacity="${t === themes.dark ? 0.09 : 0.07}"/>
    </linearGradient>
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
    .blink { animation: blink 1.1s step-end infinite; }
    .orbA { animation: driftA 14s ease-in-out infinite alternate; }
    .orbB { animation: driftB 18s ease-in-out infinite alternate; }
    .dot { animation: pulse 2.4s ease-in-out infinite; }
    .mote { opacity: 0; animation: float 14s linear infinite; }
    .ping { transform-box: fill-box; transform-origin: center; animation: ping 2.2s cubic-bezier(0,0,.2,1) infinite; }
    .spin { transform-box: fill-box; transform-origin: center; animation: spin 6s linear infinite; }
    .scan { animation: scan 5s ease-in-out ${bootEnd.toFixed(2)}s infinite; opacity: 0; }
    .underline { stroke-dasharray: 420; stroke-dashoffset: 420; animation: draw 1.2s cubic-bezier(.65,0,.35,1) .6s forwards; }
    @keyframes in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
    @keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
    @keyframes type { to { transform: translateX(${typeChars * CH + 12}px); } }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
    @keyframes driftA { to { transform: translate(90px, 40px); } }
    @keyframes driftB { to { transform: translate(-80px, -30px); } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
    @keyframes float { 0% { opacity: 0; transform: translateY(0); } 15% { opacity: .7; } 85% { opacity: .5; } 100% { opacity: 0; transform: translateY(-240px); } }
    @keyframes ping { 0% { transform: scale(1); opacity: .9; } 100% { transform: scale(3); opacity: 0; } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes scan { 0% { opacity: 0; transform: translateY(0); } 10% { opacity: 1; } 90% { opacity: 1; } 100% { opacity: 0; transform: translateY(${th - 80}px); } }
    @keyframes draw { to { stroke-dashoffset: 0; } }
    ${loopKeyframes}
    ${motionCss}
    ${reducedMotion}
  </style>

  <g clip-path="url(#frame)">
    <rect width="${W}" height="${H}" fill="${t.bg}"/>
    <rect width="${W}" height="${H}" fill="url(#grid)" mask="url(#gridMask)"/>
    <circle class="orbA" cx="220" cy="80" r="320" fill="url(#orbA)"/>
    <circle class="orbB" cx="1040" cy="420" r="340" fill="url(#orbB)"/>
    ${particles}
  </g>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="22" fill="none" stroke="url(#edge)" stroke-width="1.5"/>
  ${comet(t, { w: W - 2, h: H - 2, r: 22, dur: 12 })}

  <!-- identity -->
  <g class="rise">
    <text x="60" y="104" class="mono" font-size="15" fill="${t.muted}"><tspan fill="${t.accent}">public sealed class</tspan> Developer</text>
  </g>
  <g class="rise" style="animation-delay:.1s">
    <text x="56" y="182" class="sans" font-size="66" font-weight="800" letter-spacing="-2" fill="url(#name)">Lucas Menchon</text>
    <text x="56" y="182" class="sans" font-size="66" font-weight="800" letter-spacing="-2" fill="url(#nameShine)" aria-hidden="true">Lucas Menchon</text>
    <path class="underline" d="M60 198H470" stroke="url(#name)" stroke-width="3" stroke-linecap="round"/>
  </g>
  <g class="rise" style="animation-delay:.2s">
    <text x="60" y="236" class="sans" font-size="23" font-weight="600" fill="${t.text}">Full Stack .NET Developer</text>
    <text x="60" y="270" class="sans" font-size="16.5" fill="${t.muted}">Building fast, clean and reliable software —</text>
    <text x="60" y="294" class="sans" font-size="16.5" fill="${t.muted}">from the database all the way to the pixel.</text>
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
  <g clip-path="url(#term)">
    <rect class="scan" x="${tx}" y="${ty + 41}" width="${tw}" height="40" fill="url(#scan)"/>${lines}
    <text x="${tx + 24}" y="${promptY}" class="mono line" style="animation-delay:${bootEnd.toFixed(2)}s" fill="${t.green}">❯</text>${loopSvg}
  </g>
</svg>
`;
}

// ---------------------------------------------------------------- section headers
// A prompt that types its command, with a gradient rule drawing itself underneath.
const sections = [
  ['whoami', 'whoami', '// about me'],
  ['stack', 'stack --list', '// tools I use every day'],
  ['projects', 'git log --featured', '// selected C# projects'],
  ['stats', 'dotnet stats', '// live from the GitHub API'],
];

function section(t, cmd, comment) {
  const W = 1200;
  const H = 92;
  const cw = 18.1; // glyph advance at 30px mono
  const n = cmd.length;
  const typeDur = (0.35 + n * 0.06).toFixed(2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(cmd)} ${esc(comment)}">
  <defs>
    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${t.accent}"/>
      <stop offset=".5" stop-color="${t.accent2}"/>
      <stop offset="1" stop-color="${t.accent3}" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="typed"><rect class="reveal" x="42" y="10" width="${(n * cw + 8).toFixed(1)}" height="56"/></clipPath>
    <radialGradient id="glow"><stop offset="0" stop-color="${t.accent2}"/><stop offset="1" stop-color="${t.accent2}" stop-opacity="0"/></radialGradient>
  </defs>
  <style>
    .reveal { transform: translateX(-${(n * cw + 8).toFixed(1)}px); animation: reveal ${typeDur}s steps(${n}) .2s forwards; }
    .caret { animation: caret ${typeDur}s steps(${n}) .2s forwards; }
    .blink { animation: blink 1.1s step-end infinite; }
    .rule { stroke-dasharray: 1200; stroke-dashoffset: 1200; animation: draw 1.4s cubic-bezier(.65,0,.35,1) .3s forwards; }
    .note { opacity: 0; animation: in .7s ease-out ${(Number(typeDur) + 0.2).toFixed(2)}s forwards; }
    .runner { animation: run 6s cubic-bezier(.45,0,.55,1) 1.6s infinite; opacity: 0; }
    @keyframes reveal { to { transform: translateX(0); } }
    @keyframes caret { to { transform: translateX(${(n * cw).toFixed(1)}px); } }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
    @keyframes draw { to { stroke-dashoffset: 0; } }
    @keyframes in { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: none; } }
    @keyframes run { 0% { opacity: 0; transform: translateX(0); } 8% { opacity: 1; } 80% { opacity: .8; } 100% { opacity: 0; transform: translateX(1060px); } }
    ${reducedMotion}
  </style>
  <text x="8" y="50" font-family="${fonts.mono}" font-size="30" font-weight="700" fill="${t.green}">❯</text>
  <text x="44" y="50" clip-path="url(#typed)" font-family="${fonts.mono}" font-size="30" font-weight="700" fill="${t.text}">${esc(cmd)}</text>
  <g class="caret"><rect class="blink" x="48" y="24" width="15" height="32" rx="2" fill="${t.accent}"/></g>
  <text class="note" x="${W - 8}" y="48" text-anchor="end" font-family="${fonts.mono}" font-size="17" fill="${t.muted}">${esc(comment)}</text>
  <path d="M8 80H${W - 8}" stroke="${t.border}" stroke-width="1"/>
  <path class="rule" d="M8 80H${W - 8}" stroke="url(#rule)" stroke-width="2.5" stroke-linecap="round"/>
  <g class="runner"><circle cx="20" cy="80" r="14" fill="url(#glow)" opacity=".6"/><circle cx="20" cy="80" r="3" fill="${t.accent2}"/></g>
</svg>
`;
}

// ---------------------------------------------------------------- tech stack
const stack = [
  ['backend', ['dotnet', 'cs', 'c', 'rabbitmq']],
  ['frontend', ['angular', 'react', 'vue', 'ts', 'js', 'html', 'css', 'sass', 'bootstrap', 'tailwind']],
  ['tooling', ['git', 'github', 'githubactions', 'docker', 'linux', 'visualstudio', 'vscode']],
];
const ICON = 72;
const GAP = 16;

// Icons come from skillicons.dev (MIT) and are inlined, so the card has no runtime dependency.
async function icon(name, mode) {
  const res = await fetch(`https://skillicons.dev/icons?i=${name}&theme=${mode}`);
  if (!res.ok) throw new Error(`skillicons ${name}: ${res.status}`);
  const svg = await res.text();
  const inner = svg.match(/<g transform="translate\(0, 0\)">([\s\S]*)<\/g>\s*<\/svg>\s*$/);
  if (!inner) throw new Error(`unexpected skillicons markup for ${name}`);
  // Namespace ids so icons can't clash once they share one document.
  return inner[1]
    .replace(/id="([^"]+)"/g, `id="${name}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${name}-$1)`)
    .replace(/href="#([^"]+)"/g, `href="#${name}-$1"`);
}

async function stackCard(t, mode) {
  const W = 1200;
  const rowH = 118;
  const top = 34;
  const H = top + stack.length * rowH + 14;
  const ix0 = 270;
  let n = 0;
  const clips = [];
  const rows = [];
  for (const [r, [label, icons]] of stack.entries()) {
    const y = top + r * rowH;
    const cells = [];
    for (const [i, name] of icons.entries()) {
      const x = ix0 + i * (ICON + GAP);
      clips.push(`<rect x="${x}" y="${y + 8}" width="${ICON}" height="${ICON}" rx="17"/>`);
      cells.push(`
    <g class="pop" style="animation-delay:${(0.25 + n * 0.055).toFixed(3)}s">
      <g class="bob" style="animation-delay:-${((i * 0.35) % 4).toFixed(2)}s">
        <svg x="${x}" y="${y + 8}" width="${ICON}" height="${ICON}" viewBox="0 0 256 256">${await icon(name, mode)}</svg>
      </g>
    </g>`);
      n++;
    }
    rows.push(`
  <g class="pop" style="animation-delay:${(0.1 + r * 0.15).toFixed(2)}s">
    <text x="48" y="${y + 40}" font-family="${fonts.mono}" font-size="15" fill="${t.muted}">// ${String(icons.length).padStart(2, '0')} tools</text>
    <text x="48" y="${y + 68}" font-family="${fonts.sans}" font-size="25" font-weight="700" fill="${t.text}">${label[0].toUpperCase() + label.slice(1)}</text>
  </g>
  <path d="M48 ${y + 84}H${48 + 40}" stroke="${[t.accent, t.accent2, t.accent3][r]}" stroke-width="3" stroke-linecap="round"/>
  ${r < stack.length - 1 ? `<path d="M40 ${y + rowH - 6}H${W - 40}" stroke="${t.border}" stroke-dasharray="3 7"/>` : ''}
  ${cells.join('')}`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Tech stack: ${stack.map(([, i]) => i.join(', ')).join(', ')}">
  <style>
    .bob { animation: bob 4s ease-in-out infinite; }
    @keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
    ${motionCss}
    ${reducedMotion}
  </style>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="18" fill="${t.card}" stroke="${t.border}" stroke-width="1.5"/>
  ${comet(t, { w: W - 2, h: H - 2, dur: 14, delay: 3 })}
  ${rows.join('')}
  ${shine(t, { id: 'stk', w: W, h: H, dur: 6, delay: 1.8, clip: clips.join('') })}
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
    .msg { opacity: 0; animation: in 1s ease-out .4s forwards; }
    @keyframes wave { to { transform: translateX(-120px); } }
    @keyframes in { from { opacity: 0; letter-spacing: 4px; } to { opacity: 1; letter-spacing: 0; } }
    ${reducedMotion}
  </style>
  <path class="w" d="M0 60 Q 75 30 150 60 T 300 60 T 450 60 T 600 60 T 750 60 T 900 60 T 1050 60 T 1200 60 T 1350 60" fill="none" stroke="url(#g)" stroke-width="2"/>
  <path class="w2" d="M0 66 Q 100 96 200 66 T 400 66 T 600 66 T 800 66 T 1000 66 T 1200 66 T 1400 66" fill="none" stroke="url(#g)" stroke-width="1.2" opacity=".55"/>
  <text class="msg" x="600" y="112" text-anchor="middle" font-family="${fonts.mono}" font-size="14" fill="${t.muted}">// Thanks for stopping by — let's build something great.</text>
</svg>
`;
}

await mkdir(OUT, { recursive: true });
for (const [mode, t] of Object.entries(themes)) {
  await writeFile(new URL(`hero-${mode}.svg`, OUT), hero(t));
  await writeFile(new URL(`footer-${mode}.svg`, OUT), footer(t));
  for (const [slug, cmd, comment] of sections) {
    await writeFile(new URL(`section-${slug}-${mode}.svg`, OUT), section(t, cmd, comment));
  }
  try {
    await writeFile(new URL(`stack-${mode}.svg`, OUT), await stackCard(t, mode));
  } catch (e) {
    // Keep the last good stack card rather than failing the whole build on a network blip.
    console.warn(`stack-${mode}.svg not rebuilt: ${e.message}`);
    await readFile(new URL(`stack-${mode}.svg`, OUT)).catch(() => {
      throw e;
    });
  }
}
console.log('static assets written to assets/');
