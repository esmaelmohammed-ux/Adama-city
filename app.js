/**
 * Adama City Infrastructure Health Dashboard — Core Script
 * localStorage persistence · health index math · filter engine · official mode · tooltips
 */

// ── Seed Data ──────────────────────────────────────────────────────────────
const SEED = [
  {
    id: 'bole', name: 'Bole',
    services: {
      water: { status: 'Green', note: 'Supply pressure optimal. No pipeline issues reported.' },
      lights: { status: 'Yellow', note: 'LED replacements underway on main commercial avenue.' },
      roads: { status: 'Green', note: 'Asphalt paving completed on Ring Road segment.' },
      waste: { status: 'Green', note: 'Collection schedule operating on time.' }
    }
  },
  {
    id: 'melka-adama', name: 'Melka Adama',
    services: {
      water: { status: 'Red', note: 'Main trunk-line burst near Adama University — crew dispatched.' },
      lights: { status: 'Green', note: 'Grid fully operational. All zone lights active.' },
      roads: { status: 'Yellow', note: 'Pothole patching near central market crossing.' },
      waste: { status: 'Green', note: 'Routine collection completed on schedule.' }
    }
  },
  {
    id: 'gadaa', name: 'Gadaa',
    services: {
      water: { status: 'Green', note: 'Pumping station running at normal capacity.' },
      lights: { status: 'Red', note: 'Transformer failure on Block 3 — maintenance crew en route.' },
      roads: { status: 'Green', note: 'No road alerts active.' },
      waste: { status: 'Green', note: 'Sanitation operations fully active.' }
    }
  },
  {
    id: 'dambala', name: 'Dambala',
    services: {
      water: { status: 'Green', note: 'Optimal supply-line levels.' },
      lights: { status: 'Green', note: 'LED replacement program completed last week.' },
      roads: { status: 'Green', note: 'No active road reports.' },
      waste: { status: 'Yellow', note: 'Truck breakdown — Zone B collection rescheduled for tomorrow.' }
    }
  },
  {
    id: 'biftu', name: 'Biftu',
    services: {
      water: { status: 'Green', note: 'Supply normal.' },
      lights: { status: 'Green', note: 'Operational.' },
      roads: { status: 'Green', note: 'All corridors open.' },
      waste: { status: 'Green', note: 'Routine garbage disposal running.' }
    }
  },
  {
    id: 'abbaa-gadaa', name: 'Abbaa Gadaa',
    services: {
      water: { status: 'Yellow', note: 'Lower pressure in high-altitude zones — under investigation.' },
      lights: { status: 'Green', note: 'Standard grid operational.' },
      roads: { status: 'Red', note: 'Main river bridge structural inspection — one lane closed.' },
      waste: { status: 'Green', note: 'Operational.' }
    }
  }
];

const SVC_META = {
  water: { icon: '💧', label: 'Water Supply' },
  lights: { icon: '💡', label: 'Streetlights' },
  roads: { icon: '🛣️', label: 'Roads' },
  waste: { icon: '🗑️', label: 'Waste Mgmt' }
};

const DB_KEY = 'adama_infra_v1';
const THEME_KEY = 'adama_theme';

const State = {
  cities: [],
  official: false,
  theme: 'light',
  filter: 'All',
  search: '',

  load() {
    const raw = localStorage.getItem(DB_KEY);
    try { this.cities = raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(SEED)); }
    catch { this.cities = JSON.parse(JSON.stringify(SEED)); }
    this.theme = localStorage.getItem(THEME_KEY) || 'light';
  },

  save() { localStorage.setItem(DB_KEY, JSON.stringify(this.cities)); },

  getCity(id) { return this.cities.find(c => c.id === id); },

  updateService(cityId, svcKey, status, note) {
    const city = this.getCity(cityId);
    if (!city) return false;
    city.services[svcKey] = { status, note: note || 'No details provided.' };
    this.save();
    return true;
  }
};

// ── DOM References ─────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const D = {
  grid: $('cards-grid'),
  ringFill: $('ring-fill'),
  ringPct: $('ring-pct'),
  gaugeDesc: $('gauge-desc'),
  cntGreen: $('count-green'),
  cntYellow: $('count-yellow'),
  cntRed: $('count-red'),
  modeBadge: $('mode-badge'),
  officialBtn: $('official-btn'),
  officialLbl: $('official-btn-label'),
  themeBtn: $('theme-btn'),
  sunIcon: $('sun-icon'),
  moonIcon: $('moon-icon'),
  searchInput: $('search-input'),
  filterBtns: document.querySelectorAll('.filter-btn'),
  toastStack: $('toast-stack'),

  passcodeModal: $('passcode-modal'),
  closePasscode: $('close-passcode'),
  passcodeForm: $('passcode-form'),
  passcodeInput: $('passcode-input'),
  passcodeErr: $('passcode-err'),

  updateModal: $('update-modal'),
  closeUpdate: $('close-update'),
  updateForm: $('update-form'),
  uCityId: $('u-city-id'),
  uSvcId: $('u-svc-id'),
  uSubtitle: $('update-subtitle'),
  uNote: $('u-note'),
};

// ── Toast Utility ──────────────────────────────────────────────────────────
const ICONS = {
  success: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="var(--green)"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
  warning: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="var(--yellow)"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>`,
  danger: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="var(--red)"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
};

function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `${ICONS[type]}<span>${msg}</span>`;
  D.toastStack.appendChild(el);
  setTimeout(() => {
    el.style.transition = '0.3s ease';
    el.style.opacity = '0';
    el.style.transform = 'translateX(80px)';
    setTimeout(() => el.remove(), 320);
  }, 3400);
}

// ── Theme ──────────────────────────────────────────────────────────────────
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  State.theme = t;
  localStorage.setItem(THEME_KEY, t);
  D.sunIcon.style.display = t === 'dark' ? 'block' : 'none';
  D.moonIcon.style.display = t === 'dark' ? 'none' : 'block';
}

// ── Health Calculation ─────────────────────────────────────────────────────
function calcHealth(services) {
  const vals = { Green: 1, Yellow: 0.5, Red: 0 };
  const keys = Object.keys(services);
  const score = keys.reduce((acc, k) => acc + (vals[services[k].status] ?? 0), 0);
  return Math.round((score / keys.length) * 100);
}

// ── Dashboard Metrics ──────────────────────────────────────────────────────
function refreshMetrics() {
  let green = 0, yellow = 0, red = 0, total = 0;
  State.cities.forEach(c => {
    Object.values(c.services).forEach(s => {
      total++;
      if (s.status === 'Green') green++;
      if (s.status === 'Yellow') yellow++;
      if (s.status === 'Red') red++;
    });
  });

  const pct = total ? Math.round((green + yellow * 0.5) / total * 100) : 0;

  D.cntGreen.textContent = green;
  D.cntYellow.textContent = yellow;
  D.cntRed.textContent = red;
  D.ringPct.textContent = `${pct}%`;

  // Ring: circumference for r=43 → 2π×43 ≈ 270.2
  const CIRC = 270.2;
  D.ringFill.style.strokeDashoffset = CIRC - (CIRC * pct / 100);
  D.ringFill.style.stroke = pct >= 80 ? 'var(--green)' : pct >= 55 ? 'var(--yellow)' : 'var(--red)';

  if (red === 0 && yellow === 0) {
    D.gaugeDesc.textContent = 'All services fully operational — no outages reported.';
  } else {
    D.gaugeDesc.textContent = `${green}/${total} services functional. ${red} active outage${red !== 1 ? 's' : ''} reported.`;
  }
}

// ── Render Grid ────────────────────────────────────────────────────────────
function renderGrid() {
  const search = State.search.toLowerCase().trim();
  const filter = State.filter;

  D.grid.innerHTML = '';

  const visible = State.cities.filter(c => {
    if (search && !c.name.toLowerCase().includes(search)) return false;
    const svcs = Object.values(c.services);
    if (filter === 'Red' && !svcs.some(s => s.status === 'Red')) return false;
    if (filter === 'Yellow' && !svcs.some(s => s.status === 'Yellow')) return false;
    if (filter === 'Green' && !svcs.every(s => s.status === 'Green')) return false;
    return true;
  });

  if (visible.length === 0) {
    D.grid.innerHTML = `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
        </svg>
        <p>No sub-cities match the current filter.</p>
      </div>`;
    return;
  }

  visible.forEach(city => {
    const svcs = city.services;
    const health = calcHealth(svcs);
    const hasRed = Object.values(svcs).some(s => s.status === 'Red');
    const hasYellow = Object.values(svcs).some(s => s.status === 'Yellow');

    const chipClass = health >= 90 ? 'good' : health >= 60 ? 'fair' : 'poor';
    const cardClass = hasRed ? 'has-outage' : hasYellow ? 'has-maintenance' : '';

    const svcBlocks = Object.keys(svcs).map(key => {
      const svc = svcs[key];
      const meta = SVC_META[key];
      const safeNote = svc.note.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `
        <div class="svc-block ${svc.status}"
             onclick="handleSvcClick('${city.id}','${key}')"
             role="button" tabindex="0"
             aria-label="${meta.label}: ${svc.status}">
          <div class="svc-top">
            <span class="svc-icon">${meta.icon}</span>
            <span class="svc-dot ${svc.status}"></span>
          </div>
          <span class="svc-label">${meta.label}</span>
          <div class="svc-tip"><strong>${meta.label}</strong><br>Status: ${svc.status}<br><em>${safeNote}</em></div>
        </div>`;
    }).join('');

    const card = document.createElement('div');
    card.className = `city-card ${cardClass}`;
    card.innerHTML = `
      <div class="card-head">
        <h3>${city.name} Sub-City</h3>
        <span class="health-chip ${chipClass}">${health}% Healthy</span>
      </div>
      <div class="services-grid">${svcBlocks}</div>`;
    D.grid.appendChild(card);
  });

  // Sync official-mode cursor class
  D.grid.classList.toggle('official-active', State.official);
}

// ── Service Click Handler ──────────────────────────────────────────────────
function handleSvcClick(cityId, svcKey) {
  if (!State.official) return;

  const city = State.getCity(cityId);
  if (!city) return;
  const svc = city.services[svcKey];
  const meta = SVC_META[svcKey];

  D.uCityId.value = cityId;
  D.uSvcId.value = svcKey;
  D.uSubtitle.textContent = `${city.name} Sub-City • ${meta.label}`;
  D.uNote.value = svc.note;

  // Select matching radio
  const radio = document.querySelector(`input[name="svc-status"][value="${svc.status}"]`);
  if (radio) radio.checked = true;

  D.updateModal.classList.add('open');
  setTimeout(() => D.uNote.focus(), 120);
}

// ── Official Mode ──────────────────────────────────────────────────────────
function enterOfficial() {
  State.official = true;
  D.modeBadge.textContent = 'Official Mode';
  D.modeBadge.className = 'mode-badge official';
  D.officialLbl.textContent = 'Exit Official Mode';
  D.officialBtn.className = 'btn-official logout';
  D.grid.classList.add('official-active');
  toast('Official editing access granted.', 'success');
}
function exitOfficial() {
  State.official = false;
  D.modeBadge.textContent = 'Public View';
  D.modeBadge.className = 'mode-badge public';
  D.officialLbl.textContent = 'Official Login';
  D.officialBtn.className = 'btn-official';
  D.grid.classList.remove('official-active');
  toast('Returned to public dashboard.', 'warning');
}

// ── Bind Events ────────────────────────────────────────────────────────────
function bindEvents() {

  // Theme
  D.themeBtn.addEventListener('click', () => applyTheme(State.theme === 'light' ? 'dark' : 'light'));

  // Official button
  D.officialBtn.addEventListener('click', () => {
    if (State.official) { exitOfficial(); }
    else {
      D.passcodeInput.value = '';
      D.passcodeErr.style.display = 'none';
      D.passcodeModal.classList.add('open');
      setTimeout(() => D.passcodeInput.focus(), 100);
    }
  });

  // Close passcode modal
  D.closePasscode.addEventListener('click', () => D.passcodeModal.classList.remove('open'));

  // Passcode submit
  D.passcodeForm.addEventListener('submit', e => {
    e.preventDefault();
    if (D.passcodeInput.value === 'adama2026') {
      D.passcodeModal.classList.remove('open');
      enterOfficial();
    } else {
      D.passcodeErr.style.display = 'block';
      D.passcodeInput.select();
    }
  });

  // Close update modal
  D.closeUpdate.addEventListener('click', () => D.updateModal.classList.remove('open'));

  // Update form submit
  D.updateForm.addEventListener('submit', e => {
    e.preventDefault();
    const status = document.querySelector('input[name="svc-status"]:checked').value;
    const note = D.uNote.value.trim() || 'No additional details.';
    State.updateService(D.uCityId.value, D.uSvcId.value, status, note);
    D.updateModal.classList.remove('open');
    toast(`Status updated to ${status}.`, status === 'Red' ? 'danger' : status === 'Yellow' ? 'warning' : 'success');
    refreshMetrics();
    renderGrid();
  });

  // Search
  D.searchInput.addEventListener('input', () => {
    State.search = D.searchInput.value;
    renderGrid();
  });

  // Filter buttons
  D.filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      D.filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.filter = btn.dataset.filter;
      renderGrid();
    });
  });

  // Keyboard accessibility for service blocks
  D.grid.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      const block = e.target.closest('.svc-block');
      if (block) { e.preventDefault(); block.click(); }
    }
  });

  // Close modals on backdrop click
  [D.passcodeModal, D.updateModal].forEach(modal => {
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });
  });
}

// ── Init ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  State.load();
  applyTheme(State.theme);
  bindEvents();
  refreshMetrics();
  renderGrid();
});

// expose for inline onclick (generated HTML)
window.handleSvcClick = handleSvcClick;
