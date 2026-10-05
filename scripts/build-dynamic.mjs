// Pulls live data from GitHub and renders the stats SVGs (both themes) into assets/generated/.
// Runs daily in .github/workflows/profile.yml. Locally it works without a token too
// (falls back to the public contributions page), just with fewer numbers.
// Run: node scripts/build-dynamic.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import { themes, fonts, esc, fmt, langColor, reducedMotion, motionCss, comet, shine, countUp } from './theme.mjs';

const USER = process.env.GH_USER || 'lucasmenchon';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const OUT = new URL('../assets/generated/', import.meta.url);

// Repos shown as cards, in order. Descriptions live here so they can be richer than the repo blurb.
const FEATURED = [
  {
    repo: 'fundamentals-cqrs',
    desc: 'Layered ASP.NET Core API (Domain, Application, Infra, CrossCutting) exploring CQRS fundamentals.',
    tags: ['C#', 'CQRS', 'Layers', 'Docker'],
  },
  {
    repo: 'clean-minimal-api',
    desc: 'Minimal API with FastEndpoints: validated contracts, value objects, mappers and repositories.',
    tags: ['C#', 'FastEndpoints', 'Minimal API'],
  },
  {
    repo: 'mycontacts-api',
    desc: 'REST API with JWT authentication, password reset by email and EF Core migrations, built on ASP.NET Core.',
    tags: ['C#', 'JWT', 'EF Core', 'REST'],
  },
  {
    repo: 'contacts-manage',
    desc: 'ASP.NET MVC contact manager with admin and user roles, login, registration and session-based authentication.',
    tags: ['C#', 'MVC', 'Auth', 'EF Core'],
  },
];

// ---------------------------------------------------------------- data
async function rest(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': `${USER}-profile`,
      ...(TOKEN && { Authorization: `Bearer ${TOKEN}` }),
    },
  });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return res.json();
}

async function graphqlCalendar() {
  const query = `query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        totalCommitContributions
        totalPullRequestContributions
        contributionCalendar {
          totalContributions
          weeks { contributionDays { date contributionCount contributionLevel } }
        }
      }
    }
  }`;
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': `${USER}-profile` },
    body: JSON.stringify({ query, variables: { login: USER } }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  const c = json.data.user.contributionsCollection;
  const levelOf = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };
  const days = c.contributionCalendar.weeks.flatMap((w) =>
    w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount, level: levelOf[d.contributionLevel] })),
  );
  return { days, commits: c.totalCommitContributions, prs: c.totalPullRequestContributions };
}

async function scrapedCalendar() {
  const html = await (await fetch(`https://github.com/users/${USER}/contributions`)).text();
  const counts = {};
  for (const m of html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]*)/g)) {
    const n = m[2].match(/^(\d[\d,]*) contribution/);
    counts[m[1]] = n ? Number(n[1].replace(/,/g, '')) : 0;
  }
  const days = [];
  for (const m of html.matchAll(/data-date="([^"]+)"\s+id="([^"]+)"\s+data-level="(\d)"/g)) {
    days.push({ date: m[1], count: counts[m[2]] ?? 0, level: Number(m[3]) });
  }
  if (!days.length) throw new Error('could not parse contributions page');
  days.sort((a, b) => a.date.localeCompare(b.date));
  return { days };
}

function streaks(days) {
  let longest = 0;
  let run = 0;
  for (const d of days) {
    run = d.count > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  // Today may simply not have contributions *yet* — don't break the streak for it.
  let i = days.length - 1;
  if (i >= 0 && days[i].count === 0) i--;
  let current = 0;
  while (i >= 0 && days[i].count > 0) {
    current++;
    i--;
  }
  return { longest, current };
}

// ---------------------------------------------------------------- helpers
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s) => Math.round(((n >> s) & 255) * f);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

function wrap(text, max) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    if ((line + ' ' + word).trim().length > max) {
      lines.push(line);
      line = word;
    } else line = (line + ' ' + word).trim();
  }
  if (line) lines.push(line);
  return lines;
}

const frame = (t, W, H, body, extraStyle = '', label = '', m = {}) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
  <style>
    .sans { font-family: ${fonts.sans}; }
    .mono { font-family: ${fonts.mono}; }
    .fade { opacity: 0; animation: fade .6s ease-out forwards; }
    @keyframes fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
    ${extraStyle}
    ${motionCss}
    ${reducedMotion}
  </style>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="18" fill="${t.card}" stroke="${t.border}" stroke-width="1.5"/>
  ${comet(t, { w: W - 2, h: H - 2, dur: m.cometDur ?? 10, delay: m.cometDelay ?? 0 })}
${body}
  ${shine(t, { id: 'card', w: W, h: H, dur: m.shineDur ?? 8, delay: m.shineDelay ?? 1.5 })}
</svg>
`;

const kpi = (t, x, y, value, label, color, delay = 0) => `
  ${countUp(value, { x, y, delay: delay + 0.15, cls: 'sans', attrs: `font-size="36" font-weight="800" fill="${color}"` })}
  <text x="${x}" y="${y + 26}" class="sans" font-size="15.5" fill="${t.muted}">${esc(label)}</text>`;

// ---------------------------------------------------------------- skyline
function skyline(t, cal, s) {
  const W = 1200;
  const H = 600;
  const days = cal.days;
  const first = new Date(days[0].date + 'T00:00:00Z');
  const max = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((a, d) => a + d.count, 0);
  const best = days.reduce((a, d) => (d.count > a.count ? d : a), days[0]);

  // Isometric-ish projection: weeks run right/down gently, weekdays run left/down.
  const U = [17, 3.4];
  const V = [-11, 6.6];
  const maxH = 130;
  const gap = 0.8;
  const cells = days.map((d) => {
    const date = new Date(d.date + 'T00:00:00Z');
    const offset = Math.round((date - first) / 864e5) + first.getUTCDay();
    return { ...d, w: Math.floor(offset / 7), dow: date.getUTCDay() };
  });
  const weeks = Math.max(...cells.map((c) => c.w)) + 1;

  const project = (w, d) => [w * U[0] + d * V[0], w * U[1] + d * V[1]];
  // Fit the city inside the area between the header rule and the legend.
  const xs = [project(0, 7)[0], project(weeks, 0)[0]];
  const ys = [project(0, 0)[1] - maxH, project(weeks, 7)[1] + 22];
  const ox = (W - (xs[1] - xs[0])) / 2 - xs[0];
  const oy = 140 + (H - 70 - 140 - (ys[1] - ys[0])) / 2 - ys[0];
  const P = (w, d) => {
    const [x, y] = project(w, d);
    return [ox + x, oy + y];
  };
  const pt = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;

  // Paint back-to-front so nearer towers overlap farther ones.
  const sorted = [...cells].sort((a, b) => a.w * U[1] + a.dow * V[1] - (b.w * U[1] + b.dow * V[1]) || a.w - b.w);

  const towers = sorted
    .map((c) => {
      const h = c.count === 0 ? 1.5 : 5 + Math.sqrt(c.count / max) * (maxH - 5);
      const A = P(c.w, c.dow);
      const B = P(c.w + gap, c.dow);
      const C = P(c.w + gap, c.dow + gap);
      const D = P(c.w, c.dow + gap);
      const up = (p) => [p[0], p[1] - h];
      const color = t.levels[c.level] ?? t.levels[0];
      const top = `<polygon points="${pt(up(A))} ${pt(up(B))} ${pt(up(C))} ${pt(up(D))}" fill="${color}"/>`;
      const right = `<polygon points="${pt(up(B))} ${pt(up(C))} ${pt(C)} ${pt(B)}" fill="${shade(color, 0.78)}"/>`;
      const front = `<polygon points="${pt(up(D))} ${pt(up(C))} ${pt(C)} ${pt(D)}" fill="${shade(color, 0.62)}"/>`;
      const delay = (0.3 + c.w * 0.022 + c.dow * 0.03).toFixed(2);
      const tip = c.count ? `<title>${c.count} contribution${c.count > 1 ? 's' : ''} on ${c.date}</title>` : '';
      return `<g class="rise" style="animation-delay:${delay}s">${tip}${right}${front}${top}</g>`;
    })
    .join('\n  ');

  // Month labels along the front edge.
  const months = [];
  let lastMonth = -1;
  for (const c of cells) {
    const m = new Date(c.date + 'T00:00:00Z').getUTCMonth();
    if (c.dow === 0 && m !== lastMonth && c.w > 0) {
      const [x, y] = P(c.w, 7.9);
      months.push(
        `<text x="${x.toFixed(1)}" y="${(y + 14).toFixed(1)}" class="mono" font-size="12.5" fill="${t.muted}">${new Date(c.date + 'T00:00:00Z').toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })}</text>`,
      );
      lastMonth = m;
    } else if (lastMonth === -1) lastMonth = m;
  }

  const bestLabel = new Date(best.date + 'T00:00:00Z').toLocaleString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const legend = t.levels
    .map((c, i) => `<rect x="${1004 + i * 22}" y="${H - 42}" width="16" height="16" rx="4" fill="${c}"/>`)
    .join('');

  const body = `
  <text x="44" y="62" class="sans" font-size="25" font-weight="700" fill="${t.text}">Contribution skyline</text>
  <text x="44" y="90" class="mono" font-size="14" fill="${t.muted}">// last 12 months · rebuilt daily by GitHub Actions</text>
  <g class="fade" style="animation-delay:.1s">${kpi(t, 560, 66, fmt(total), 'contributions', t.accent, 0.1)}</g>
  <g class="fade" style="animation-delay:.2s">${kpi(t, 735, 66, `${s.current}d`, 'current streak', t.accent2, 0.2)}</g>
  <g class="fade" style="animation-delay:.3s">${kpi(t, 900, 66, `${s.longest}d`, 'longest streak', t.accent3, 0.3)}</g>
  <g class="fade" style="animation-delay:.4s">${kpi(t, 1060, 66, fmt(best.count), `best · ${bestLabel}`, t.pink, 0.4)}</g>
  <path d="M44 126H${W - 44}" stroke="${t.border}" stroke-dasharray="3 6"/>
  ${towers}
  ${months.join('\n  ')}
  <text x="994" y="${H - 29}" text-anchor="end" class="mono" font-size="12.5" fill="${t.muted}">less</text>
  ${legend}
  <text x="1120" y="${H - 29}" class="mono" font-size="12.5" fill="${t.muted}">more</text>`;

  const style = `.rise { transform-box: fill-box; transform-origin: 50% 100%; transform: scaleY(0); animation: rise .9s cubic-bezier(.34,1.4,.64,1) forwards; }
    @keyframes rise { to { transform: scaleY(1); } }`;
  return frame(t, W, H, body, style, `${USER}'s contribution skyline: ${total} contributions in the last year`, { cometDur: 16, shineDur: 9, shineDelay: 2.5 });
}

// ---------------------------------------------------------------- languages
function languages(t, langs) {
  const W = 590;
  const H = 330;
  const total = langs.reduce((a, l) => a + l.bytes, 0) || 1;
  const top = langs.slice(0, 6);
  const rest = langs.slice(6).reduce((a, l) => a + l.bytes, 0);
  if (rest > 0) top.push({ name: 'Other', bytes: rest });

  const barX = 40;
  const barW = W - 80;
  let x = barX;
  const segs = top
    .map((l, i) => {
      const w = (l.bytes / total) * barW;
      const color = l.name === 'Other' ? t.faint : langColor(l.name);
      const out = `<rect class="grow" style="animation-delay:${(0.2 + i * 0.08).toFixed(2)}s" x="${x.toFixed(1)}" y="104" width="${Math.max(w - 2, 1).toFixed(1)}" height="14" fill="${color}"/>`;
      x += w;
      return out;
    })
    .join('');

  const legend = top
    .map((l, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const lx = 44 + col * 265;
      const ly = 166 + row * 40;
      const pct = ((l.bytes / total) * 100).toFixed(1);
      const color = l.name === 'Other' ? t.faint : langColor(l.name);
      return `<g class="fade" style="animation-delay:${(0.3 + i * 0.07).toFixed(2)}s">
    <circle cx="${lx + 7}" cy="${ly - 6}" r="7" fill="${color}"/>
    <text x="${lx + 24}" y="${ly}" class="sans" font-size="18" font-weight="600" fill="${t.text}">${esc(l.name)}</text>
    <text x="${lx + 230}" y="${ly}" text-anchor="end" class="mono" font-size="15" fill="${t.muted}">${pct}%</text>
  </g>`;
    })
    .join('\n  ');

  const body = `
  <text x="40" y="58" class="sans" font-size="23" font-weight="700" fill="${t.text}">Languages</text>
  <text x="40" y="82" class="mono" font-size="13.5" fill="${t.muted}">// by bytes across original repos</text>
  <defs><linearGradient id="glint" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
  <clipPath id="bar"><rect x="${barX}" y="104" width="${barW}" height="14" rx="7"/></clipPath>
  <g clip-path="url(#bar)"><rect x="${barX}" y="104" width="${barW}" height="14" fill="${t.levels[0]}"/>${segs}<rect class="glint" x="${barX - 90}" y="104" width="90" height="14" fill="url(#glint)"/></g>
  ${legend}`;

  const style = `.grow { transform-box: fill-box; transform-origin: left; transform: scaleX(0); animation: grow .7s cubic-bezier(.2,.8,.2,1) forwards; }
    @keyframes grow { to { transform: scaleX(1); } }
    .glint { animation: glint 4s ease-in-out 1.4s infinite; }
    @keyframes glint { 0% { transform: translateX(0); } 45%, 100% { transform: translateX(${barW + 180}px); } }`;
  return frame(t, W, H, body, style, `Most used languages: ${top.map((l) => l.name).join(', ')}`, { cometDelay: 3, shineDelay: 2 });
}

// ---------------------------------------------------------------- numbers
function numbers(t, n) {
  const W = 590;
  const H = 330;
  const items = n.map(([value, label], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const colors = [t.accent, t.accent2, t.accent3, t.pink, t.green, t.yellow];
    return `<g class="fade" style="animation-delay:${(0.15 + i * 0.08).toFixed(2)}s">${kpi(t, 40 + col * 180, 158 + row * 104, value, label, colors[i], 0.15 + i * 0.08)}</g>`;
  });
  const body = `
  <text x="40" y="58" class="sans" font-size="23" font-weight="700" fill="${t.text}">GitHub in numbers</text>
  <text x="40" y="82" class="mono" font-size="13.5" fill="${t.muted}">// live from the GitHub API</text>
  ${items.join('\n  ')}`;
  return frame(t, W, H, body, '', 'GitHub statistics', { cometDelay: 6, shineDelay: 2.6 });
}

// ---------------------------------------------------------------- project card
const forkIcon =
  'M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z';

function project(t, p, repo, index) {
  const W = 590;
  const H = 236;
  const all = wrap(p.desc, 54);
  const lines = all.length > 2 ? [all[0], all[1].replace(/[ ,.;:]*$/, '…')] : all;
  const lang = repo.language || p.tags[0];
  let tx = 40;
  const tags = p.tags
    .map((tag, i) => {
      const w = tag.length * 8.6 + 24;
      const out = `<g class="pop" style="animation-delay:${(0.35 + i * 0.08).toFixed(2)}s"><rect x="${tx}" y="140" width="${w}" height="28" rx="14" fill="${t.cardAlt}" stroke="${t.border}"/>
    <text x="${tx + w / 2}" y="159" text-anchor="middle" class="mono" font-size="13.5" fill="${t.accent}">${esc(tag)}</text></g>`;
      tx += w + 8;
      return out;
    })
    .join('\n    ');

  const meta = [`<circle class="ping" cx="47" cy="203" r="7" fill="none" stroke="${langColor(lang)}" stroke-width="1.5"/>
    <circle cx="47" cy="203" r="7" fill="${langColor(lang)}"/>
    <text x="62" y="209" class="sans" font-size="16" fill="${t.muted}">${esc(lang)}</text>`];
  if (repo.stargazers_count > 0) {
    meta.push(`<text x="${62 + lang.length * 9 + 26}" y="209" class="sans" font-size="16" fill="${t.muted}">★ ${repo.stargazers_count}</text>`);
  }
  if (repo.fork) {
    meta.push(`<path transform="translate(${W - 158} 195) scale(1)" d="${forkIcon}" fill="${t.muted}"/>
    <text x="${W - 40}" y="209" text-anchor="end" class="mono" font-size="14" fill="${t.muted}">forked study</text>`);
  } else if (repo.homepage) {
    meta.push(`<text x="${W - 40}" y="209" text-anchor="end" class="sans" font-size="16" font-weight="600" fill="${t.accent2}">live demo ↗</text>`);
  }

  const book =
    'M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z';

  const body = `
  <g class="fade">
    <path transform="translate(40 30) scale(1.4)" d="${book}" fill="${t.muted}"/>
    <text x="72" y="50" class="mono" font-size="22" font-weight="700" fill="${t.accent2}">${esc(p.title || p.repo)}</text>
  </g>
  <g class="fade" style="animation-delay:.1s">
    ${lines.map((l, i) => `<text x="40" y="${90 + i * 26}" class="sans" font-size="17.5" fill="${t.text}">${esc(l)}</text>`).join('\n    ')}
  </g>
  ${tags}
  <g class="fade" style="animation-delay:.3s">
    ${meta.join('\n    ')}
  </g>`;
  const style = `.ping { transform-box: fill-box; transform-origin: center; animation: ping 2.4s cubic-bezier(0,0,.2,1) infinite; }
    @keyframes ping { 0% { transform: scale(1); opacity: .9; } 100% { transform: scale(2.6); opacity: 0; } }`;
  return frame(t, W, H, body, style, `${p.repo}: ${p.desc}`, { cometDelay: index * 2.5, shineDelay: 1.2 + index * 0.9 });
}

// ---------------------------------------------------------------- main
const [user, repos] = await Promise.all([rest(`/users/${USER}`), rest(`/users/${USER}/repos?per_page=100&type=owner`)]);
const own = repos.filter((r) => !r.fork && r.name !== USER);

let cal;
if (TOKEN) {
  try {
    cal = await graphqlCalendar();
  } catch (e) {
    console.warn('GraphQL failed, falling back to scraping:', e.message);
  }
}
cal ??= await scrapedCalendar();
const s = streaks(cal.days);

const langBytes = {};
for (const r of own) {
  const l = await rest(`/repos/${USER}/${r.name}/languages`);
  for (const [k, v] of Object.entries(l)) langBytes[k] = (langBytes[k] || 0) + v;
}
const langs = Object.entries(langBytes)
  .map(([name, bytes]) => ({ name, bytes }))
  .sort((a, b) => b.bytes - a.bytes);

const stars = own.reduce((a, r) => a + r.stargazers_count, 0);
const years = new Date().getUTCFullYear() - new Date(user.created_at).getUTCFullYear();
const activeDays = cal.days.filter((d) => d.count > 0).length;
const nums = [
  [fmt(stars), 'stars earned'],
  [fmt(own.length), 'original repos'],
  [fmt(user.followers), 'followers'],
  cal.commits != null ? [fmt(cal.commits), 'commits (12 mo)'] : [fmt(activeDays), 'active days'],
  cal.prs != null ? [fmt(cal.prs), 'pull requests'] : [fmt(user.following), 'following'],
  [`${years}y+`, 'on GitHub'],
];

await mkdir(OUT, { recursive: true });
const byName = Object.fromEntries(repos.map((r) => [r.name, r]));
for (const [mode, t] of Object.entries(themes)) {
  await writeFile(new URL(`skyline-${mode}.svg`, OUT), skyline(t, cal, s));
  await writeFile(new URL(`languages-${mode}.svg`, OUT), languages(t, langs));
  await writeFile(new URL(`numbers-${mode}.svg`, OUT), numbers(t, nums));
  for (const [i, p] of FEATURED.entries()) {
    const repo = byName[p.repo];
    if (!repo) {
      console.warn(`featured repo not found: ${p.repo}`);
      continue;
    }
    await writeFile(new URL(`repo-${p.repo}-${mode}.svg`, OUT), project(t, p, repo, i));
  }
}
console.log(`generated: ${cal.days.length} days, ${langs.length} languages, ${own.length} repos (token: ${TOKEN ? 'yes' : 'no'})`);
