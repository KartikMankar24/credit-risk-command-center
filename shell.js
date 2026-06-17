// =============================================================================
//  shell.js — injects sidebar + topbar + global search + theme + notifications
//  into every page. Each page calls Shell.mount('pageKey').  Global `Shell`.
// =============================================================================
window.Shell = (function () {
  const ROOT = location.pathname.includes('/pages/') ? '../' : './';

  // --- inline icon set (Lucide-style, stroke) ---
  const I = {
    home:'<path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    queue:'<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.5 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.5A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.5z"/>',
    users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0 1 14 0v1"/>',
    engine:'<path d="M12 2v4m0 12v4M2 12h4m12 0h4M5 5l2.5 2.5M16.5 16.5 19 19M19 5l-2.5 2.5M7.5 16.5 5 19"/><circle cx="12" cy="12" r="3.2"/>',
    shield:'<path d="M12 2 4 5v6c0 5 3.4 8.3 8 10 4.6-1.7 8-5 8-10V5z"/>',
    fraud:'<path d="M12 2 4 5v6c0 5 3.4 8.3 8 10 4.6-1.7 8-5 8-10V5z"/><path d="M9.5 9.5 14.5 14.5M14.5 9.5 9.5 14.5"/>',
    collections:'<path d="M3 3v18h18"/><path d="M7 14l3-3 3 3 5-6"/>',
    portfolio:'<path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
    dataset:'<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
    admin:'<path d="M12 2 4 5v6c0 5 3.4 8.3 8 10 4.6-1.7 8-5 8-10V5z"/><circle cx="12" cy="10" r="2.5"/><path d="M8.5 17a3.5 3.5 0 0 1 7 0"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    sun:'<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/>',
    moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>',
    menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',
    chevron:'<path d="m9 18 6-6-6-6"/>',
    download:'<path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"/>',
    x:'<path d="M18 6 6 18M6 6l12 12"/>',
  };
  function svg(p, cls='') { return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`; }

  const NAV = [
    { sec: 'Overview', items: [
      { key:'home', label:'Command Center', icon:'home', href:'index.html' },
      { key:'work', label:'Work Queue', icon:'queue', href:'pages/work.html', badgeKey:'work' },
      { key:'customers', label:'Customers', icon:'users', href:'pages/customers.html' },
    ]},
    { sec: 'Risk & Credit', items: [
      { key:'decision', label:'Underwriting', icon:'engine', href:'pages/decision-engine.html' },
      { key:'fraud', label:'Fraud Center', icon:'fraud', href:'pages/fraud.html', badgeKey:'fraud' },
      { key:'collections', label:'Collections', icon:'collections', href:'pages/collections.html' },
      { key:'portfolio', label:'Portfolio Analytics', icon:'portfolio', href:'pages/portfolio.html' },
    ]},
    { sec: 'Data & Admin', items: [
      { key:'dataset', label:'Dataset Manager', icon:'dataset', href:'pages/dataset.html' },
      { key:'admin', label:'Admin & Audit', icon:'admin', href:'pages/admin.html' },
    ]},
  ];

  function href(h) { return ROOT + h; }

  function mount(activeKey) {
    Store.applyTheme();
    document.body.classList.add('app');

    // ---- Sidebar ----
    const aside = document.createElement('aside');
    aside.className = 'sidebar';
    let navHtml = `<div class="sidebar__brand">
        <div class="sidebar__logo">C</div>
        <div><h1>Credit Risk</h1><span>Command Center</span></div>
      </div><nav class="sidebar__nav">`;
    for (const g of NAV) {
      navHtml += `<div class="nav__section">${g.sec}</div>`;
      for (const it of g.items) {
        const badge = it.badgeKey
          ? `<span class="badge" data-badge="${it.badgeKey}" style="display:none"></span>`
          : (it.badge ? `<span class="badge">${it.badge}</span>` : '');
        navHtml += `<a class="nav__item ${it.key===activeKey?'active':''}" href="${href(it.href)}">
          ${svg(I[it.icon])}<span>${it.label}</span>${badge}</a>`;
      }
    }
    navHtml += `</nav>
      <div style="padding:14px;border-top:1px solid rgba(255,255,255,.06)">
        <div class="nav__item" id="sb-theme" style="justify-content:flex-start">${svg(I.moon)}<span id="sb-theme-label">Dark mode</span></div>
      </div>`;
    aside.innerHTML = navHtml;

    // ---- Main + topbar ----
    const main = document.createElement('div');
    main.className = 'main';
    const role = Store.ROLES[Store.getRole()];
    main.innerHTML = `
      <header class="topbar">
        <button class="icon-btn sidebar__toggle" id="sb-toggle" aria-label="Menu">${svg(I.menu)}</button>
        <div class="topbar__search">
          ${svg(I.search)}
          <input id="global-search" type="text" placeholder="Search customer ID, name, PAN, phone, city, risk band…" autocomplete="off"/>
          <kbd>Ctrl K</kbd>
          <div id="search-results" class="search-results"></div>
        </div>
        <div class="topbar__actions">
          <button class="icon-btn" id="tb-theme" data-tip="Toggle theme">${svg(I.sun)}</button>
          <button class="icon-btn" id="tb-bell" data-tip="Alerts"><span class="dot"></span>${svg(I.bell)}</button>
          <div class="user-chip" id="tb-role">
            <div class="user-chip__avatar">${F.initials(role.label)}</div>
            <div class="user-chip__meta"><b>${role.label}</b><span>Switch role</span></div>
            ${svg(I.chevron)}
          </div>
        </div>
      </header>
      <div id="page-root"></div>`;

    const backdrop = document.createElement('div');
    backdrop.className = 'backdrop'; backdrop.id = 'sb-backdrop';

    document.body.prepend(main);
    document.body.prepend(aside);
    document.body.appendChild(backdrop);

    wireEvents(aside, backdrop);
    pollBadges();
    return document.getElementById('page-root');
  }

  // Nav badges: "Work Queue" shows the count of open cases assigned to you;
  // "Fraud" shows critical alerts. Aggregates load after mount, so poll briefly.
  function refreshBadges() {
    if (!window.Cases) return;
    const m = Cases.metrics();
    const fb = (window.DATA && DATA.aggregates && DATA.aggregates.fraudBuckets) || {};
    const set = (key, n) => {
      const el = document.querySelector(`.badge[data-badge="${key}"]`);
      if (!el) return;
      if (n > 0) { el.textContent = n > 999 ? '999+' : n; el.style.display = ''; }
      else el.style.display = 'none';
    };
    set('work', m.myOpen);
    set('fraud', fb.Critical || 0);
  }
  let _badgeTries = 0;
  function pollBadges() {
    refreshBadges();
    const ready = window.DATA && DATA.aggregates;
    if (!ready && _badgeTries++ < 40) setTimeout(pollBadges, 120);
  }

  function wireEvents(aside, backdrop) {
    // theme toggles
    const applyThemeUi = () => {
      const dark = Store.getTheme() === 'dark';
      const lbl = document.getElementById('sb-theme-label'); if (lbl) lbl.textContent = dark ? 'Light mode' : 'Dark mode';
    };
    applyThemeUi();
    const toggleTheme = () => { Store.setTheme(Store.getTheme() === 'dark' ? 'light' : 'dark'); applyThemeUi(); };
    document.getElementById('tb-theme')?.addEventListener('click', toggleTheme);
    document.getElementById('sb-theme')?.addEventListener('click', toggleTheme);

    // mobile sidebar
    const tgl = document.getElementById('sb-toggle');
    tgl?.addEventListener('click', () => { aside.classList.toggle('open'); backdrop.classList.toggle('show'); });
    backdrop.addEventListener('click', () => { aside.classList.remove('open'); backdrop.classList.remove('show'); });

    // role switcher
    document.getElementById('tb-role')?.addEventListener('click', openRoleModal);
    // notifications
    document.getElementById('tb-bell')?.addEventListener('click', openNotes);

    // global search
    wireSearch();
  }

  // ---------- Global search ----------
  let searchTimer = null;
  function wireSearch() {
    const input = document.getElementById('global-search');
    const box = document.getElementById('search-results');
    if (!input) return;
    document.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); input.focus(); } });

    input.addEventListener('input', () => {
      clearTimeout(searchTimer);
      const t = input.value.trim();
      if (!t) { box.classList.remove('show'); box.innerHTML = ''; return; }
      box.classList.add('show');
      box.innerHTML = `<div class="sr-loading"><span class="spinner"></span> Searching ${ (DATA.manifest?.rows||0).toLocaleString() } records…</div>`;
      searchTimer = setTimeout(async () => {
        try {
          const res = await IDB.search(t, 8);
          if (!res.length) { box.innerHTML = `<div class="sr-empty">No matches for “${t}”</div>`; return; }
          box.innerHTML = res.map((c) => {
            const rl = F.riskLevel(c.defaultProb);
            return `<a class="sr-item" href="${href('pages/profile.html')}?id=${c.id}">
              <div class="avatar-sm">${F.initials(c.name)}</div>
              <div class="sr-meta"><b>${c.name}</b><span class="mono">#${c.id} · ${c.city} · ${c.employmentType}</span></div>
              <span class="badge-pill ${rl.cls}">${c.riskBand}</span></a>`;
          }).join('');
        } catch (e) { box.innerHTML = `<div class="sr-empty">Search needs the dataset loaded. Open the Command Center first.</div>`; }
      }, 180);
    });
    document.addEventListener('click', (e) => { if (!e.target.closest('.topbar__search')) box.classList.remove('show'); });
  }

  // ---------- Role modal ----------
  function openRoleModal() {
    const cur = Store.getRole();
    const opts = Object.entries(Store.ROLES).map(([k, v]) =>
      `<label class="role-opt ${k===cur?'sel':''}"><input type="radio" name="role" value="${k}" ${k===cur?'checked':''}/>
        <div><b>${v.label}</b><span>${v.can.includes('*')?'Full access':v.can.join(' · ')}</span></div></label>`).join('');
    Modal.open({
      title: 'Switch Role — Access Control',
      body: `<p class="muted" style="margin-bottom:14px">Role-based access controls which actions are available. Changes are recorded in the audit trail.</p><div class="role-list">${opts}</div>`,
      okText: 'Apply role',
      onOk: () => {
        const v = document.querySelector('input[name=role]:checked')?.value;
        if (v) { Store.setRole(v); Store.toast('Role updated', `Now acting as ${Store.ROLES[v].label}`, 'ok'); setTimeout(() => location.reload(), 600); }
        return true;
      },
    });
  }

  // ---------- Notifications ----------
  function openNotes() {
    const notes = Store.getNotes();
    const rel = (ts) => { const m = Math.round((Date.now() - ts) / 60000); return m < 60 ? `${m}m ago` : `${Math.round(m/60)}h ago`; };
    const body = `<div class="note-list">${notes.map((n) => `
      <div class="note-item ${n.type}">
        <div class="note-bar"></div>
        <div><b>${n.title}</b><p>${n.msg}</p><span class="note-time">${rel(n.ts)}</span></div>
      </div>`).join('')}</div>`;
    Modal.open({ title: 'Risk Alerts & Notifications', body, okText: 'Mark all read', onOk: () => { document.querySelector('#tb-bell .dot')?.remove(); return true; } });
  }

  return { mount, svg, I, icon: (k, cls) => svg(I[k] || '', cls), refreshBadges };
})();
