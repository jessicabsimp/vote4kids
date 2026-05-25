// ===================== CANDIDATE DATA =====================
// Candidate data — embedded in tn2026.html
// Each candidate has: slug, name, party, race, district, primary_label, role_subtitle, bio, frontrunner, status_line,
// photo_url, photo_credit, campaign_url, official_url, twitter, and three policy sections.

// ===================== CANDIDATE DATA =====================
// Loaded at runtime from data/*.json — see loadData() below.
// Schema documented in: vote4kids-technical-specs-data-structures.md (in agent reference files).

let CANDIDATES = [];
let RACE_PULSE = {};
let EVENTS = [];

async function loadData() {
  const fetchJson = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    return res.json();
  };
  // Candidates are split by race (governor/senate/house-1/house-2/local) so
  // auto-update streams can edit one scope-narrow file at a time and keep
  // PR diffs small. House is split into TN-1..5 and TN-6..9 to keep each
  // file under ~50KB.
  const [gov, sen, house1, house2, local, r, e] = await Promise.all([
    fetchJson('data/candidates-governor.json'),
    fetchJson('data/candidates-senate.json'),
    fetchJson('data/candidates-house-1.json'),
    fetchJson('data/candidates-house-2.json'),
    fetchJson('data/candidates-local.json'),
    fetchJson('data/race-pulse.json'),
    fetchJson('data/events.json')
  ]);
  CANDIDATES = [...gov, ...sen, ...house1, ...house2, ...local];
  RACE_PULSE = r;
  EVENTS = e;
}

// ===================== RACE PULSE DATA =====================
// RACE PULSE data — keyed by candidate slug
// All data factual; no subjective rankings.
// ===================== RACE PULSE (polling/cash/endorsements) =====================
// Loaded at runtime from data/race-pulse.json — see loadData() above.


// ===================== DISTRICT METADATA =====================
const DISTRICTS = [
  { id: "TN-1", num: "TN-01", title: "Northeast Tennessee · Tri-Cities", geography: "Bristol · Kingsport · Johnson City · Sullivan, Washington, Greene counties", rating: "Solid R", ratingClass: "" },
  { id: "TN-2", num: "TN-02", title: "East Tennessee · Knoxville", geography: "Knoxville · Maryville · Knox, Blount, Loudon, Anderson counties", rating: "Solid R", ratingClass: "" },
  { id: "TN-3", num: "TN-03", title: "Southeast Tennessee · Chattanooga", geography: "Chattanooga · Hamilton County and surrounding rural East TN", rating: "Solid R", ratingClass: "" },
  { id: "TN-4", num: "TN-04", title: "South-Central Tennessee · SE Davidson to Alabama", geography: "SE Davidson County · Rutherford · Coffee · Franklin · Lincoln · Cannon · Van Buren · Grundy · Warren · Bledsoe · Sequatchie · Marion · new map signed May 7", rating: "Solid R", ratingClass: "" },
  { id: "TN-5", num: "TN-05", title: "Middle TN to Downtown Memphis", geography: "W. Williamson · half Maury · Lewis · Hickman · Humphreys · Houston · Stewart · Fort Campbell · W. TN counties · downtown Memphis (Shelby Co.) · radically redrawn May 7", rating: "Toss-up ⚠", ratingClass: "toss" },
  { id: "TN-6", num: "TN-06", title: "Cumberland Plateau · Upper Cumberland", geography: "Slice of Davidson · Wilson · Smith · DeKalb · Putnam · White · Overton · Cumberland · Fentress · Scott · Morgan · part Campbell · OPEN SEAT (Rose running for Gov.)", rating: "Open · R", ratingClass: "lean" },
  { id: "TN-7", num: "TN-07", title: "Clarksville · Greater Nashville Suburbs", geography: "More of Davidson County · Sumner · Trousdale · Macon · Robertson · Cheatham · Dickson · most of Montgomery County · redrawn May 7", rating: "Lean R", ratingClass: "lean" },
  { id: "TN-8", num: "TN-08", title: "West Tennessee · Jackson to Germantown", geography: "Largely West TN: Bartlett · Germantown · Collierville · Jackson · Dyersburg · adds Perry County under new map", rating: "Solid R", ratingClass: "" },
  { id: "TN-9", num: "TN-09", title: "Rural South Tennessee · Alabama Border", geography: "Portion of Shelby Co. · Fayette · Hardeman · Hardin · Wayne · Lawrence · Giles · Lincoln · Moore · Bedford · Marshall · half Maury · half Williamson — old Memphis district eliminated May 7 · lawsuits pending", rating: "Solid R ⚠", ratingClass: "" }
];

// ===================== RENDER HELPERS =====================
function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getInitials(name) {
  const parts = name.replace(/[".]/g, '').trim().split(/\s+/).filter(p => p.length > 0 && p !== "Dr" && !/^[A-Z]\.$/.test(p));
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function partyName(p) { return p === 'R' ? 'Republican' : p === 'D' ? 'Democratic' : 'Independent'; }

function photoOrFallback(c, sizeClass) {
  if (c.photo_url) {
    return `<img class="${sizeClass}" src="${escapeHtml(c.photo_url)}" alt="${escapeHtml(c.name)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" /><div class="${sizeClass}-fallback" style="display:none;">${escapeHtml(getInitials(c.name))}</div>`;
  } else {
    return `<div class="${sizeClass}-fallback">${escapeHtml(getInitials(c.name))}</div>`;
  }
}

function candidateCard(c) {
  const isEliminated = c.primary_result === 'lost';
  const frontClass = (c.frontrunner && !isEliminated) ? 'frontrunner' : '';
  const elimClass = isEliminated ? 'eliminated' : '';
  return `
    <a class="candidate-card ${frontClass} ${elimClass}" href="#/candidate/${escapeHtml(c.slug)}">
      <div class="card-head">
        ${photoOrFallback(c, 'candidate-photo')}
        <div class="card-head-info">
          <div class="candidate-name">${escapeHtml(c.name)}</div>
          <div class="candidate-meta-row">
            <span class="party-badge ${c.party.toLowerCase()}">${escapeHtml(c.party)}</span>
            <span class="candidate-role">${escapeHtml(c.role_subtitle)}</span>
          </div>
        </div>
      </div>
      <p class="candidate-bio">${escapeHtml(c.bio)}</p>
      ${c.status_line ? `<div class="candidate-status-line">${escapeHtml(c.status_line)}</div>` : ''}
      <div class="card-footer">
        <span>${isEliminated ? 'Did not advance · May primary' : 'View Profile'}</span>
        <span>→</span>
      </div>
    </a>
  `;
}

function districtBlock(d) {
  const candidates = CANDIDATES.filter(c => c.district === d.id);
  const cardsHtml = candidates.map(candidateCard).join('');
  const openAttr = d.openByDefault ? 'open' : '';
  return `
    <details class="district" ${openAttr}>
      <summary class="district-summary">
        <div class="district-num">${escapeHtml(d.num)}</div>
        <div class="district-info-wrap">
          <div class="district-title">${escapeHtml(d.title)}</div>
          <div class="district-geography">${escapeHtml(d.geography)}</div>
        </div>
        <div class="district-rating ${d.ratingClass}">${escapeHtml(d.rating)}</div>
        <div class="chevron">→</div>
      </summary>
      <div class="district-body">
        <button class="compare-toggle-btn" data-compare-race="${escapeHtml(d.id)}">⇄ Compare candidates</button>
        <div class="inline-compare-wrap" data-compare-race="${escapeHtml(d.id)}"></div>
        <div class="candidates-grid">${cardsHtml}</div>
      </div>
    </details>
  `;
}

function policySection(c, key, title, eyebrow, altBg) {
  const data = c[key];
  if (!data) return '';
  const noPosition = data.summary && data.summary.toLowerCase().includes('no public position found');
  const summaryClass = noPosition ? 'policy-summary no-position' : 'policy-summary';
  const citationsHtml = data.citations && data.citations.length > 0
    ? `<span class="label">Sources:</span>${data.citations.map(url => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url.replace(/^https?:\/\//, '').replace(/\/$/, '').slice(0, 60) + (url.length > 67 ? '…' : ''))}</a>`).join('')}`
    : `<span class="empty">No sources cited — this typically reflects an absence of public statements.</span>`;
  return `
    <section class="sub-policy-section ${altBg ? 'alt' : ''}">
      <div class="sub-policy-inner">
        <div class="policy-header">
          <span class="policy-eyebrow">${escapeHtml(eyebrow)}</span>
          <h2 class="policy-title">${escapeHtml(title)}</h2>
        </div>
        <p class="${summaryClass}">${escapeHtml(data.summary)}</p>
        <div class="policy-details">${escapeHtml(data.details)}</div>
        <div class="policy-citations">${citationsHtml}</div>
      </div>
    </section>
  `;
}

function renderRacePulse(slug) {
  const data = RACE_PULSE && RACE_PULSE[slug];
  if (!data) return '';

  // Status / Incumbency cell
  const inc = data.incumbency || {};
  const statusCell = `
    <div class="pulse-cell">
      <div class="pulse-cell-label">Status</div>
      <div class="pulse-cell-value">${escapeHtml(inc.label || 'Not documented')}</div>
      ${inc.note ? `<div class="pulse-cell-note">${escapeHtml(inc.note)}</div>` : ''}
    </div>
  `;

  // Cash on hand cell
  const cash = data.cash || {};
  let cashCell;
  if (cash.amount) {
    const sourceLink = cash.source_url
      ? `<a href="${escapeHtml(cash.source_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(cash.as_of || 'FEC')} →</a>`
      : escapeHtml(cash.as_of || '');
    cashCell = `
      <div class="pulse-cell">
        <div class="pulse-cell-label">Cash on Hand</div>
        <div class="pulse-cell-value">${escapeHtml(cash.amount)}</div>
        <div class="pulse-cell-meta">${sourceLink}</div>
        ${cash.note ? `<div class="pulse-cell-note">${escapeHtml(cash.note)}</div>` : ''}
      </div>
    `;
  } else {
    cashCell = `
      <div class="pulse-cell">
        <div class="pulse-cell-label">Cash on Hand</div>
        <div class="pulse-cell-value muted">No public filing data</div>
        ${cash.note ? `<div class="pulse-cell-note">${escapeHtml(cash.note)}</div>` : ''}
      </div>
    `;
  }

  // Polling — full-width detail section listing every poll
  const polls = data.polls || [];
  let pollSection;
  if (polls.length === 0) {
    pollSection = `
      <div class="pulse-section">
        <div class="pulse-section-header">
          <span class="pulse-cell-label">Polling</span>
          <span class="pulse-section-count">0 polls</span>
        </div>
        <div class="pulse-empty">No public polls found for this race. Primary contests at this level rarely have published polling, especially House district primaries. Refer to FEC fundraising and endorsements as alternative competitiveness signals.</div>
      </div>
    `;
  } else {
    const pollRows = polls.map(p => {
      const sourceLink = p.url
        ? `<a href="${escapeHtml(p.url)}" target="_blank" rel="noopener noreferrer">View poll →</a>`
        : '';
      const partisanTag = p.partisan ? `<span class="poll-partisan">${escapeHtml(p.partisan)}</span>` : '';
      return `
        <div class="poll-row">
          <div class="poll-row-pollster">
            <span class="poll-name">${escapeHtml(p.pollster)}</span>
            ${partisanTag}
          </div>
          <div class="poll-row-date">${escapeHtml(p.date)}</div>
          <div class="poll-row-value">${escapeHtml(p.value)}</div>
          <div class="poll-row-context">${p.context ? escapeHtml(p.context) : '—'}</div>
          <div class="poll-row-source">${sourceLink}</div>
        </div>
      `;
    }).join('');
    pollSection = `
      <div class="pulse-section">
        <div class="pulse-section-header">
          <span class="pulse-cell-label">Polling</span>
          <span class="pulse-section-count">${polls.length} ${polls.length === 1 ? 'poll' : 'polls'}</span>
        </div>
        <div class="poll-table">
          <div class="poll-row poll-row-head">
            <div class="poll-row-pollster">Pollster</div>
            <div class="poll-row-date">Date</div>
            <div class="poll-row-value">Value</div>
            <div class="poll-row-context">Context</div>
            <div class="poll-row-source">Source</div>
          </div>
          ${pollRows}
        </div>
      </div>
    `;
  }

  // Endorsements — full-width with notes/dates surfaced
  const endos = data.endorsements || [];
  let endorseSection;
  if (endos.length === 0) {
    endorseSection = `
      <div class="pulse-section">
        <div class="pulse-section-header">
          <span class="pulse-cell-label">Notable Endorsements</span>
          <span class="pulse-section-count">0 documented</span>
        </div>
        <div class="pulse-empty">No major endorsements documented as of April 2026. This includes presidential, gubernatorial, party-caucus, major-PAC, and prominent-organizational endorsements based on public press releases and reporting.</div>
      </div>
    `;
  } else {
    const endorseRows = endos.map(e => {
      const nameLink = e.url
        ? `<a href="${escapeHtml(e.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(e.name)} ↗</a>`
        : escapeHtml(e.name);
      const typeBadge = e.type ? `<span class="endo-type">${escapeHtml(e.type)}</span>` : '';
      const dateBadge = e.date ? `<span class="endo-date">${escapeHtml(e.date)}</span>` : '';
      const noteHtml = e.note ? `<div class="endo-note">${escapeHtml(e.note)}</div>` : '';
      return `
        <div class="endorsement-row">
          <div class="endorsement-row-head">
            <span class="endorsement-name">${nameLink}</span>
            ${typeBadge}
            ${dateBadge}
          </div>
          ${noteHtml}
        </div>
      `;
    }).join('');
    endorseSection = `
      <div class="pulse-section">
        <div class="pulse-section-header">
          <span class="pulse-cell-label">Notable Endorsements</span>
          <span class="pulse-section-count">${endos.length} documented</span>
        </div>
        <div class="endorsement-rows">${endorseRows}</div>
      </div>
    `;
  }

  return `
    <section class="race-pulse">
      <div class="race-pulse-inner">
        <div class="race-pulse-header">Race Pulse · Factual Signals</div>
        <p class="race-pulse-subhead">Polling, fundraising, endorsements, and incumbency. No subjective tier rankings — just sourced data so you can judge competitiveness for yourself.</p>
        <div class="pulse-grid pulse-grid-2">
          ${statusCell}
          ${cashCell}
        </div>
        ${pollSection}
        ${endorseSection}
        <div class="pulse-disclaimer">All figures sourced from FEC.gov, public polls (where indicated), and reported endorsements. Last research pass: April 2026 · Data refreshes quarterly with FEC filings.</div>
      </div>
    </section>
  `;
}

function renderSubpage(slug) {
  const c = CANDIDATES.find(x => x.slug === slug);
  if (!c) {
    return `<div style="padding:6rem 2rem;text-align:center;font-family:'Lato',sans-serif;"><h2 style="font-family:'Montserrat',sans-serif;color:var(--navy);margin-bottom:1rem;">Candidate not found</h2><p><a href="#" onclick="goHome();return false;" style="color:var(--sage);">← Return to home</a></p></div>`;
  }
  const linkCards = [];
  if (c.campaign_url) linkCards.push({ label: 'Campaign Site', url: c.campaign_url });
  if (c.official_url) linkCards.push({ label: 'Official Site', url: c.official_url });
  if (c.twitter) {
    const handle = c.twitter.startsWith('@') ? c.twitter : '@' + c.twitter;
    const url = c.twitter.startsWith('http') ? c.twitter : `https://twitter.com/${handle.replace('@','')}`;
    linkCards.push({ label: 'Twitter / X', url, displayText: handle });
  }
  const linksHtml = linkCards.map(l =>
    `<div class="sub-link-card"><span class="label">${escapeHtml(l.label)}</span><a href="${escapeHtml(l.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(l.displayText || l.url.replace(/^https?:\/\//, '').replace(/\/$/, ''))} ↗</a></div>`
  ).join('');

  return `
    <div class="sub-back">
      <div class="sub-back-inner">
        <a href="#" onclick="goHome();return false;">← Back to TN 2026</a>
      </div>
    </div>
    <header class="sub-hero">
      <div class="sub-hero-inner">
        <div style="display:flex;flex-direction:column;align-items:center;">
          ${photoOrFallback(c, 'sub-photo')}
          ${c.photo_credit ? `<div class="photo-credit">${escapeHtml(c.photo_credit)}</div>` : ''}
        </div>
        <div>
          <div class="sub-hero-eyebrow">${escapeHtml(c.primary_label)}</div>
          <h1>${escapeHtml(c.name)}</h1>
          <div class="sub-hero-meta">
            <span class="party-badge ${c.party.toLowerCase()}">${escapeHtml(partyName(c.party))}</span>
            <span class="candidate-role">${escapeHtml(c.role_subtitle)}</span>
          </div>
          <p class="sub-hero-bio">${escapeHtml(c.bio)}</p>
          ${c.status_line ? `<div class="sub-status-line">${escapeHtml(c.status_line)}</div>` : ''}
        </div>
      </div>
    </header>
    ${policySection(c, 'early_childhood_ed', 'Early Childhood Education', 'Issue 01', false)}
    ${policySection(c, 'child_hunger', 'Child Hunger', 'Issue 02', true)}
    ${policySection(c, 'parental_support', 'Parental Support', 'Issue 03', false)}
    ${renderRacePulse(slug)}
    ${linksHtml ? `<section class="sub-links-section"><div class="sub-links-inner">${linksHtml}</div></section>` : ''}
  `;
}

// ===================== MAIN PAGE RENDER =====================
function renderMainPage() {
  document.querySelectorAll('.candidates-grid[data-race]').forEach(grid => {
    const race = grid.dataset.race;
    const primary = grid.dataset.primary;
    const filtered = primary
      ? CANDIDATES.filter(c => c.race === race && c.party === primary)
      : CANDIDATES.filter(c => c.race === race);
    grid.innerHTML = filtered.map(candidateCard).join('');
  });

  const districtsList = document.getElementById('districts-list');
  if (districtsList) {
    districtsList.innerHTML = DISTRICTS.map(districtBlock).join('');
  }

  // Local races — render each race into its respective grid
  const localRaces = [
    { id: 'local-knox-mayor',          district: 'Knox County Mayor' },
    { id: 'local-knox-sheriff',        district: 'Knox County Sheriff' },
    { id: 'local-knox-trustee',        district: 'Knox County Trustee' },
    { id: 'local-knox-commission-d3',  district: 'Knox County Commission District 3' },
    { id: 'local-knox-commission-d7',  district: 'Knox County Commission District 7' },
    { id: 'local-knox-commission-al10',district: 'Knox County Commission At-Large 10' },
    { id: 'local-knox-commission-al11',district: 'Knox County Commission At-Large 11' },
    { id: 'local-knox-school-d1',      district: 'Knox County School Board District 1' },
    { id: 'local-knox-school-d4',      district: 'Knox County School Board District 4' },
    { id: 'local-knox-school-d6',      district: 'Knox County School Board District 6' },
    { id: 'local-knox-school-d7',      district: 'Knox County School Board District 7' },
    { id: 'local-knox-school-d9',      district: 'Knox County School Board District 9' },
  ];
  localRaces.forEach(({ id, district }) => {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = CANDIDATES
        .filter(c => c.race === 'local' && c.district === district)
        .map(candidateCard).join('');
    }
  });
}

// ===================== ROUTER =====================
function handleRoute() {
  const hash = window.location.hash;
  const match = hash.match(/^#\/candidate\/(.+)$/);
  if (match) {
    const slug = match[1];
    document.body.classList.add('subpage');
    document.getElementById('subpage-view').innerHTML = renderSubpage(slug);
    window.scrollTo(0, 0);
  } else {
    document.body.classList.remove('subpage');
    document.getElementById('subpage-view').innerHTML = '';
    // For section-anchor hashes (governor, senate, etc.), let the browser scroll naturally.
  }
}

// ===================== MOBILE MENU =====================
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  if (menu) menu.classList.toggle('open');
}
function closeMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  if (menu) menu.classList.remove('open');
}
function setupMobileMenu() {
  const btn = document.getElementById('hamburger-btn');
  if (btn) btn.addEventListener('click', toggleMobileMenu);
}

function goHome() {
  closeMobileMenu();
  if (window.location.hash.startsWith('#/candidate/')) {
    history.pushState('', document.title, window.location.pathname + window.location.search);
    handleRoute();
  } else {
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  return false;
}

function navigateMain(event) {
  // For section-anchor links: ensure we're on the main view, then scroll to section.
  if (document.body.classList.contains('subpage')) {
    event.preventDefault();
    const targetId = event.currentTarget.getAttribute('href').replace('#', '');
    document.body.classList.remove('subpage');
    document.getElementById('subpage-view').innerHTML = '';
    history.pushState('', document.title, window.location.pathname + window.location.search + '#' + targetId);
    setTimeout(() => {
      const el = document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }
  // Otherwise let the default anchor behavior handle it.
}

window.addEventListener('hashchange', handleRoute);
window.addEventListener('popstate', handleRoute);

// ===================== COUNTDOWN =====================
function updateCountdown() {
  const now = new Date();
  const primary = new Date('2026-08-06T00:00:00');
  const general = new Date('2026-11-03T00:00:00');
  const dayMs = 1000 * 60 * 60 * 24;
  const dPri = Math.max(0, Math.ceil((primary - now) / dayMs));
  const dGen = Math.max(0, Math.ceil((general - now) / dayMs));
  const elPri = document.getElementById('cd-primary');
  const elGen = document.getElementById('cd-general');
  if (elPri) elPri.textContent = dPri;
  if (elGen) elGen.textContent = dGen;
}

// ===================== INLINE COMPARE =====================
let activeCompareRace = null;
const inlineSelected = new Set();
const INLINE_MAX = 4;

function getCandidatesForRace(raceKey) {
  if (raceKey === 'governor')   return CANDIDATES.filter(c => c.race === 'governor');
  if (raceKey === 'senate')     return CANDIDATES.filter(c => c.race === 'senate');
  if (raceKey.startsWith('TN-')) return CANDIDATES.filter(c => c.district === raceKey);
  // Local race key → district name mapping
  const localRaceMap = {
    'knox-mayor':          'Knox County Mayor',
    'knox-sheriff':        'Knox County Sheriff',
    'knox-trustee':        'Knox County Trustee',
    'knox-commission-d3':  'Knox County Commission District 3',
    'knox-commission-d7':  'Knox County Commission District 7',
    'knox-commission-al10':'Knox County Commission At-Large 10',
    'knox-commission-al11':'Knox County Commission At-Large 11',
    'knox-school-d1':      'Knox County School Board District 1',
    'knox-school-d4':      'Knox County School Board District 4',
    'knox-school-d6':      'Knox County School Board District 6',
    'knox-school-d7':      'Knox County School Board District 7',
    'knox-school-d9':      'Knox County School Board District 9',
  };
  if (localRaceMap[raceKey]) return CANDIDATES.filter(c => c.district === localRaceMap[raceKey]);
  return [];
}

function pickCard(c, isSelected, isDisabled) {
  const photoHtml = c.photo_url
    ? `<img class="pick-photo" src="${escapeHtml(c.photo_url)}" alt="${escapeHtml(c.name)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" /><div class="pick-photo-fallback" style="display:none;">${escapeHtml(getInitials(c.name))}</div>`
    : `<div class="pick-photo-fallback">${escapeHtml(getInitials(c.name))}</div>`;
  const classNames = ['pick-card'];
  if (isSelected) classNames.push('selected');
  if (isDisabled) classNames.push('disabled');
  return `
    <div class="${classNames.join(' ')}" data-slug="${escapeHtml(c.slug)}">
      ${photoHtml}
      <div class="pick-info">
        <div class="pick-name">${escapeHtml(c.name)}</div>
        <div class="pick-meta"><span class="party-badge ${c.party.toLowerCase()}">${escapeHtml(c.party)}</span></div>
      </div>
      <div class="pick-check"></div>
    </div>
  `;
}

function renderInlineCompare(raceKey) {
  const wrap = document.querySelector(`.inline-compare-wrap[data-compare-race="${raceKey}"]`);
  if (!wrap) return;
  const candidates = getCandidatesForRace(raceKey);
  const limitReached = inlineSelected.size >= INLINE_MAX;
  const pickerHtml = candidates.map(c =>
    pickCard(c, inlineSelected.has(c.slug), !inlineSelected.has(c.slug) && limitReached)
  ).join('');
  wrap.innerHTML = `
    <div class="inline-compare">
      <div class="inline-compare-header">
        <span class="inline-compare-label">Select up to ${INLINE_MAX} candidates to compare</span>
        <button class="inline-compare-close" onclick="closeInlineCompare()">✕ Close</button>
      </div>
      <div class="inline-compare-picker">${pickerHtml}</div>
      <div class="inline-compare-actions">
        <span class="inline-compare-count">${inlineSelected.size} of ${INLINE_MAX} selected</span>
        <button class="btn-clear" onclick="clearInlineCompare('${raceKey}')">Clear</button>
        <button class="btn-compare" ${inlineSelected.size < 2 ? 'disabled' : ''} onclick="runInlineCompare('${raceKey}')">Compare →</button>
      </div>
      <div class="inline-compare-results" id="inline-compare-results-${raceKey}"></div>
    </div>
  `;
  wrap.querySelectorAll('.pick-card').forEach(card => {
    card.addEventListener('click', () => {
      if (card.classList.contains('disabled')) return;
      const slug = card.dataset.slug;
      if (inlineSelected.has(slug)) { inlineSelected.delete(slug); }
      else { if (inlineSelected.size >= INLINE_MAX) return; inlineSelected.add(slug); }
      renderInlineCompare(raceKey);
    });
  });
}

function updateCompareToggleButtons() {
  document.querySelectorAll('.compare-toggle-btn').forEach(btn => {
    const isActive = btn.dataset.compareRace === activeCompareRace;
    btn.classList.toggle('active', isActive);
    btn.textContent = isActive ? '✕ Close compare' : '⇄ Compare candidates';
  });
}

function openInlineCompare(raceKey) {
  if (activeCompareRace === raceKey) { closeInlineCompare(); return; }
  closeInlineCompare();
  activeCompareRace = raceKey;
  inlineSelected.clear();
  renderInlineCompare(raceKey);
  updateCompareToggleButtons();
}

function closeInlineCompare() {
  if (!activeCompareRace) return;
  const wrap = document.querySelector(`.inline-compare-wrap[data-compare-race="${activeCompareRace}"]`);
  if (wrap) wrap.innerHTML = '';
  activeCompareRace = null;
  updateCompareToggleButtons();
}

function clearInlineCompare(raceKey) {
  inlineSelected.clear();
  renderInlineCompare(raceKey);
}

function runInlineCompare(raceKey) {
  const candidates = Array.from(inlineSelected).map(s => CANDIDATES.find(c => c.slug === s)).filter(Boolean);
  if (candidates.length < 2) return;
  const el = document.getElementById('inline-compare-results-' + raceKey);
  if (!el) return;
  el.innerHTML = `<div class="compare-grid cols-${candidates.length}">${candidates.map(compareColumn).join('')}</div>`;
  el.classList.add('active');
  setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
}

function compareIssueRow(c, key, label) {
  const data = c[key];
  const noPosition = data.summary && data.summary.toLowerCase().includes('no public position found');
  const cls = noPosition ? 'compare-issue-summary no-position' : 'compare-issue-summary';
  return `
    <div class="compare-issue">
      <div class="compare-issue-label">${escapeHtml(label)}</div>
      <div class="${cls}">${escapeHtml(data.summary)}</div>
    </div>
  `;
}

function comparePollingBlock(c) {
  const data = RACE_PULSE && RACE_PULSE[c.slug];
  const polls = (data && data.polls) || [];
  if (polls.length === 0) {
    // Skip — keeps the column shorter for races with no polling
    return '';
  }
  // Show up to 3 most recent polls compactly
  const top3 = polls.slice(0, 3).map(p => {
    const partisanTag = p.partisan ? ` <span class="cmp-poll-partisan">(${escapeHtml(p.partisan)})</span>` : '';
    const sourceLink = p.url
      ? `<a href="${escapeHtml(p.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(p.pollster)}</a>`
      : escapeHtml(p.pollster);
    return `
      <div class="cmp-poll-row">
        <span class="cmp-poll-value">${escapeHtml(p.value)}</span>
        <span class="cmp-poll-meta">${sourceLink}${partisanTag} · ${escapeHtml(p.date)}</span>
      </div>
    `;
  }).join('');
  const morePollsNote = polls.length > 3
    ? `<div class="cmp-poll-more">+ ${polls.length - 3} more on profile →</div>`
    : '';
  return `
    <div class="compare-issue compare-polling">
      <div class="compare-issue-label">Current Polling</div>
      <div class="cmp-polls">${top3}${morePollsNote}</div>
    </div>
  `;
}

function compareColumn(c) {
  const photoHtml = c.photo_url
    ? `<img class="compare-photo" src="${escapeHtml(c.photo_url)}" alt="${escapeHtml(c.name)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" /><div class="compare-photo-fallback" style="display:none;">${escapeHtml(getInitials(c.name))}</div>`
    : `<div class="compare-photo-fallback">${escapeHtml(getInitials(c.name))}</div>`;
  return `
    <div class="compare-col">
      <div class="compare-col-head">
        ${photoHtml}
        <div class="compare-name"><a href="#/candidate/${escapeHtml(c.slug)}">${escapeHtml(c.name)}</a></div>
        <div class="meta-row">
          <span class="party-badge ${c.party.toLowerCase()}">${escapeHtml(c.party)}</span>
        </div>
        <div class="compare-role">${escapeHtml(c.role_subtitle)}</div>
      </div>
      ${comparePollingBlock(c)}
      ${compareIssueRow(c, 'early_childhood_ed', 'Early Childhood Education')}
      ${compareIssueRow(c, 'child_hunger', 'Child Hunger')}
      ${compareIssueRow(c, 'parental_support', 'Parental Support')}
    </div>
  `;
}

function runCompare() {
  const slugs = Array.from(compareState.selected);
  const candidates = slugs.map(s => CANDIDATES.find(c => c.slug === s)).filter(Boolean);
  if (candidates.length < 2) return;
  const results = document.getElementById('compare-results');
  if (!results) return;
  const colsClass = `cols-${candidates.length}`;
  results.innerHTML = `
    <div class="compare-grid ${colsClass}">
      ${candidates.map(compareColumn).join('')}
    </div>
  `;
  results.classList.add('active');
  setTimeout(() => results.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
}

function setupInlineCompare() {
  document.querySelectorAll('.compare-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => openInlineCompare(btn.dataset.compareRace));
  });
}

// ===================== SUGGEST / EVENT FORMS =====================
// Submissions auto-forwarded to robertsbjess@gmail.com via Web3Forms.com.
// Web3Forms supports CORS and works in sandboxed iframes (Formsubmit didn't).
const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

// Generic form setup helper — used for both suggest forms.
async function submitToWeb3Forms(form) {
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  const submitterEmail = (payload['Submitter Email'] || '').trim();
  if (submitterEmail) payload.replyto = submitterEmail;
  // Honeypot check
  if (formData.get('botcheck')) return { success: true, honeypot: true };
  const response = await fetch(WEB3FORMS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json().catch(() => ({}));
  if (response.ok && result.success) return { success: true };
  const msg = result.message || (response.status >= 400 ? `Server returned ${response.status}` : 'Unknown error');
  return { success: false, error: msg };
}

function setupForm() {
  const form = document.getElementById('suggestForm');
  if (!form) return;
  const submitBtn = document.getElementById('suggest-submit-btn');
  const successEl = document.getElementById('suggest-success');
  const errorEl = document.getElementById('suggest-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    successEl.style.display = 'none';
    errorEl.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    try {
      const result = await submitToWeb3Forms(form);
      if (result.honeypot || result.success) {
        successEl.style.display = 'block';
        form.reset();
        submitBtn.textContent = 'Submit Another →';
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      errorEl.textContent = `Submission failed: ${err.message || err}. Please try again, or email robertsbjess@gmail.com directly.`;
      errorEl.style.display = 'block';
      submitBtn.textContent = 'Submit Suggestion →';
    } finally {
      submitBtn.disabled = false;
    }
  });
}

function setupEventForm() {
  const form = document.getElementById('suggestEventForm');
  if (!form) return;
  const submitBtn = document.getElementById('suggest-event-submit-btn');
  const successEl = document.getElementById('suggest-event-success');
  const errorEl = document.getElementById('suggest-event-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    successEl.style.display = 'none';
    errorEl.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    try {
      const result = await submitToWeb3Forms(form);
      if (result.honeypot || result.success) {
        successEl.style.display = 'block';
        form.reset();
        submitBtn.textContent = 'Submit Another Tip →';
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      errorEl.textContent = `Submission failed: ${err.message || err}. Please try again, or email robertsbjess@gmail.com directly.`;
      errorEl.style.display = 'block';
      submitBtn.textContent = 'Submit Event Tip →';
    } finally {
      submitBtn.disabled = false;
    }
  });
}

// ===================== INIT =====================
// ===================== EVENTS RENDERING =====================
function renderEvents() {
  const container = document.getElementById('event-list');
  if (!container) return;
  if (!EVENTS || !EVENTS.length) {
    container.innerHTML = '<p style="text-align:center;opacity:0.7;padding:2em">No upcoming events listed.</p>';
    return;
  }

  const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const sorted = [...EVENTS].sort((a, b) => (a.date_iso || '').localeCompare(b.date_iso || ''));
  const upcoming = sorted.filter(e => (e.date_iso || '') >= todayStr);
  const past     = sorted.filter(e => (e.date_iso || '') < todayStr);

  function eventCard(e) {
    const placeholderClass = e.is_placeholder ? ' placeholder' : '';
    const ctaHref  = e.link_url ? e.link_url : '#';
    const ctaAttrs = e.link_url ? ' target="_blank" rel="noopener noreferrer"' : '';
    const ctaLabel = escapeHtml(e.link_label || 'Details');
    return `<div class="event${placeholderClass}">
      <div class="event-date"><div class="month">${escapeHtml(e.date_display.month)}</div><div class="day">${escapeHtml(e.date_display.day)}</div><div class="year">${escapeHtml(e.date_display.year)}</div></div>
      <div class="event-info">
        <h4>${escapeHtml(e.title)}</h4>
        <p>${escapeHtml(e.description)}</p>
        <div class="event-meta">${escapeHtml(e.meta || '')}</div>
      </div>
      <div class="event-cta"><a href="${escapeHtml(ctaHref)}"${ctaAttrs}>${ctaLabel}</a></div>
    </div>`;
  }

  let html = '';

  if (upcoming.length) {
    html += upcoming.map(eventCard).join('\n');
  } else {
    html += '<p style="text-align:center;opacity:0.7;padding:2em">No upcoming events listed. Check back soon.</p>';
  }

  if (past.length) {
    html += `<details class="events-past-toggle">
      <summary>Past events (${past.length})</summary>
      <div class="events-past-list">${past.map(eventCard).join('\n')}</div>
    </details>`;
  }

  container.innerHTML = html;
}

// ===================== INIT =====================
async function init() {
  try {
    await loadData();
  } catch (err) {
    console.error('Failed to load site data:', err);
    document.body.insertAdjacentHTML('afterbegin',
      '<div style="background:#fee2e2;color:#7f1d1d;padding:1em;text-align:center;font-family:system-ui;border-bottom:1px solid #fca5a5">' +
      'Failed to load candidate data. Please refresh the page.</div>');
    return;
  }
  renderMainPage();
  renderEvents();
  updateCountdown();
  setInterval(updateCountdown, 60 * 60 * 1000);
  setupForm();
  setupEventForm();
  setupInlineCompare();
  setupMobileMenu();
  handleRoute();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
