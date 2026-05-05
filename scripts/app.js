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
  { id: "TN-4", num: "TN-04", title: "South-Central Tennessee · Murfreesboro", geography: "Murfreesboro · Rutherford, Coffee, Franklin, Lincoln counties", rating: "Solid R", ratingClass: "" },
  { id: "TN-5", num: "TN-05", title: "Nashville Suburbs · Columbia", geography: "South Davidson · Williamson, Maury, Wilson · the most competitive race in Tennessee", rating: "Toss-up", ratingClass: "toss" },
  { id: "TN-6", num: "TN-06", title: "North Nashville Suburbs · Cumberland Plateau", geography: "Hendersonville · Cookeville · 19 counties · OPEN SEAT (Rose retiring)", rating: "Open · R", ratingClass: "lean" },
  { id: "TN-7", num: "TN-07", title: "Clarksville · West Nashville Suburbs", geography: "Clarksville · Franklin · Dickson · Springfield · Cheatham County", rating: "Lean R", ratingClass: "lean" },
  { id: "TN-8", num: "TN-08", title: "West Tennessee · Memphis Suburbs", geography: "Bartlett · Germantown · Collierville · Jackson · Dyersburg", rating: "Solid R", ratingClass: "" },
  { id: "TN-9", num: "TN-09", title: "Memphis · Shelby County", geography: "Most of Memphis · the lone Democratic-held seat in TN", rating: "Solid D", ratingClass: "" }
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
  const frontClass = c.frontrunner ? 'frontrunner' : '';
  return `
    <a class="candidate-card ${frontClass}" href="#/candidate/${escapeHtml(c.slug)}">
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
        <span>View Profile</span>
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

  // Local races
  const knoxMayor = document.getElementById('local-knox-mayor');
  if (knoxMayor) {
    const localCandidates = CANDIDATES.filter(c => c.race === 'local' && c.district === 'Knox County Mayor');
    knoxMayor.innerHTML = localCandidates.map(candidateCard).join('');
  }
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

// ===================== COMPARE =====================
const compareState = {
  pool: 'primary',         // 'primary' | 'all'
  race: null,              // null (no race picked yet) | 'governor' | 'senate' | 'TN-1' ... 'TN-9'
  selected: new Set(),     // candidate slugs (persists across race switches)
  MAX: 4
};

function isPrimaryCandidate(c) {
  // Primary candidate = competing in the Aug 6 primary (not general-only).
  // General-only candidates: Federalist Senate (Mixon), Independents (Pinkston, Moses, Taylor).
  // Treat R and D candidates as primary candidates (they're all in primaries).
  return c.party === 'R' || c.party === 'D';
}

function getCompareCandidates() {
  if (compareState.race === null) return [];
  return CANDIDATES.filter(c => {
    if (compareState.pool === 'primary' && !isPrimaryCandidate(c)) return false;
    if (compareState.race === 'governor') return c.race === 'governor';
    if (compareState.race === 'senate') return c.race === 'senate';
    // District filter (TN-1, TN-2, etc.)
    if (compareState.race.startsWith('TN-')) return c.district === compareState.race;
    // Local races
    if (compareState.race === 'knox-mayor') return c.race === 'local' && c.district === 'Knox County Mayor';
    return false;
  });
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

function renderCompareSelector() {
  const grid = document.getElementById('compare-selector');
  if (!grid) return;
  // Empty state: no race picked yet
  if (compareState.race === null) {
    grid.classList.remove('compare-selector');
    grid.innerHTML = `
      <div class="selector-empty">
        <div class="selector-empty-icon">★ ★ ★</div>
        <div class="selector-empty-text"><strong>Pick a race above</strong> to see its candidates.<br>Your selections will carry over if you switch races.</div>
      </div>
    `;
    return;
  }
  // Restore grid class for active rendering
  grid.classList.add('compare-selector');
  const candidates = getCompareCandidates();
  const limitReached = compareState.selected.size >= compareState.MAX;
  if (candidates.length === 0) {
    grid.innerHTML = '<div class="compare-empty">No candidates match these filters. Try switching to "All Candidates" to include Independents and Federalist candidates.</div>';
    return;
  }
  grid.innerHTML = candidates.map(c => {
    const isSelected = compareState.selected.has(c.slug);
    const isDisabled = !isSelected && limitReached;
    return pickCard(c, isSelected, isDisabled);
  }).join('');
  // Attach click handlers
  grid.querySelectorAll('.pick-card').forEach(card => {
    card.addEventListener('click', () => {
      if (card.classList.contains('disabled')) return;
      const slug = card.dataset.slug;
      if (compareState.selected.has(slug)) {
        compareState.selected.delete(slug);
      } else {
        if (compareState.selected.size >= compareState.MAX) return;
        compareState.selected.add(slug);
      }
      updateCompareUI();
    });
  });
}

function updateRaceButtons() {
  document.querySelectorAll('.race-btn').forEach(btn => {
    if (btn.dataset.race === compareState.race) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function updateCompareUI() {
  // Status text
  const status = document.getElementById('compare-status');
  if (status) {
    status.innerHTML = `<strong>${compareState.selected.size} of ${compareState.MAX}</strong> selected`;
  }
  // Compare button
  const btn = document.getElementById('btn-run-compare');
  if (btn) btn.disabled = compareState.selected.size < 2;
  // Re-render selector to reflect selection state and disabled cards
  renderCompareSelector();
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

function clearCompare() {
  compareState.selected.clear();
  const results = document.getElementById('compare-results');
  if (results) {
    results.classList.remove('active');
    results.innerHTML = '';
  }
  updateCompareUI();
}

function setupCompare() {
  // Pool filter (segmented buttons)
  document.querySelectorAll('#filter-pool button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#filter-pool button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      compareState.pool = btn.dataset.pool;
      // When switching pool, drop any non-primary selections if pool became 'primary'
      if (compareState.pool === 'primary') {
        Array.from(compareState.selected).forEach(slug => {
          const c = CANDIDATES.find(x => x.slug === slug);
          if (c && !isPrimaryCandidate(c)) compareState.selected.delete(slug);
        });
      }
      updateCompareUI();
    });
  });
  // Race buttons
  document.querySelectorAll('.race-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      compareState.race = btn.dataset.race;
      updateRaceButtons();
      // Selection persists across race switches so users can compare across races.
      renderCompareSelector();
      updateCompareUI();
    });
  });
  // Compare button
  const runBtn = document.getElementById('btn-run-compare');
  if (runBtn) runBtn.addEventListener('click', runCompare);
  // Clear button
  const clearBtn = document.getElementById('btn-clear-compare');
  if (clearBtn) clearBtn.addEventListener('click', clearCompare);
  // Initial render (empty state until a race is picked)
  renderCompareSelector();
  updateCompareUI();
}

// ===================== SUGGEST FORM =====================
// Submissions auto-forwarded to robertsbjess@gmail.com via Web3Forms.com.
// Web3Forms supports CORS and works in sandboxed iframes (Formsubmit didn't).
const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

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

    // Honeypot check (Web3Forms style)
    if (form.querySelector('input[name="botcheck"]').checked) {
      successEl.style.display = 'block';
      form.reset();
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Suggestion →';
      return;
    }

    // Build payload from form data
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    // If the submitter provided an email, set it as reply-to
    const submitterEmail = (payload['Submitter Email'] || '').trim();
    if (submitterEmail) payload.replyto = submitterEmail;

    try {
      const response = await fetch(WEB3FORMS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.success) {
        successEl.style.display = 'block';
        form.reset();
        submitBtn.textContent = 'Submit Another →';
      } else {
        const msg = result.message || (response.status >= 400 ? `Server returned ${response.status}` : 'Unknown error');
        throw new Error(msg);
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

// ===================== INIT =====================
// ===================== EVENTS RENDERING =====================
function renderEvents() {
  const container = document.getElementById('event-list');
  if (!container) return;
  if (!EVENTS || !EVENTS.length) {
    container.innerHTML = '<p style="text-align:center;opacity:0.7;padding:2em">No upcoming events listed.</p>';
    return;
  }
  // Sort by date_iso ascending so upcoming events appear in chronological order.
  const sorted = [...EVENTS].sort((a, b) => (a.date_iso || '').localeCompare(b.date_iso || ''));
  container.innerHTML = sorted.map(e => {
    const placeholderClass = e.is_placeholder ? ' placeholder' : '';
    const ctaHref = e.link_url ? e.link_url : '#';
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
  }).join('\n');
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
  setupCompare();
  setupMobileMenu();
  handleRoute();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
