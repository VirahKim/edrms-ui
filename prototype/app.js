/* EDRMS prototype — core: state, helpers, shell, routing, modal, toasts, journey actions. Views live in views.js. */
window.App = (function () {
  var E = window.EDRMS, KEY = 'edrms-journeys-v1';
  var S = { role: 'registry', view: 'dashboard', arg: '', outage: false, q: '', data: null, ui: {} };

  /* ---------- storage ---------- */
  function load() { try { var r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch (e) {} return null; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ data: S.data, outage: S.outage, signedIn: S.signedIn })); } catch (e) {} }
  var saved = load();
  S.data = saved && saved.data ? saved.data : E.seed();
  S.outage = !!(saved && saved.outage);
  S.signedIn = saved ? saved.signedIn !== false : false;

  /* ---------- helpers ---------- */
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmtDate(d) { if (!d) return ''; var p = d.slice(0, 10).split('-'); return (+p[2]) + ' ' + MON[+p[1] - 1] + ' ' + p[0]; }
  function fmtDT(d) { return d ? fmtDate(d) + ', ' + d.slice(11, 16) : ''; }
  function now() { var t = new Date(); return E.TODAY + 'T' + String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0'); }
  function addDays(d, n) { var t = new Date(d + 'T12:00:00'); t.setDate(t.getDate() + n); return t.toISOString().slice(0, 10); }
  function daysUntil(d) { return Math.round((new Date(d + 'T12:00:00') - new Date(E.TODAY + 'T12:00:00')) / 864e5); }
  function person(id) { return E.PEOPLE[id] || { name: id, title: '' }; }
  function stage(key) { for (var i = 0; i < E.STAGES.length; i++) if (E.STAGES[i].key === key) return E.STAGES[i]; return E.STAGES[0]; }
  function me() { return E.USERS[S.role]; }
  function file(id) { return S.data.files.filter(function (f) { return f.id === id; })[0]; }
  function files(fn) { return S.data.files.filter(fn || function () { return true; }); }
  function byStage(k) { return files(function (f) { return f.stage === k; }); }
  function stageBadge(f) { var s = stage(f.stage); return '<span class="stage-pill s-' + s.key + '"><span class="dot"></span>' + esc(s.label) + '</span>'; }
  function dueBadge(f) {
    if (!f.due || f.stage === 'filed') return '<span class="muted">No due date</span>';
    var n = daysUntil(f.due);
    if (n < 0) return '<span class="qb-badge qb-badge--danger">Overdue · ' + fmtDate(f.due) + '</span>';
    if (n <= 2) return '<span class="qb-badge qb-badge--warning">Due ' + fmtDate(f.due) + '</span>';
    return '<span class="tnum">' + fmtDate(f.due) + '</span>';
  }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  var ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
    send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    tasks: '<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    archive: '<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    users: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7.5M22 21a7 7 0 0 0-4-6.3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    arrowL: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
    collapse: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 10l-2 2 2 2"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    chevronR: '<path d="m9 6 6 6-6 6"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
    arrowR: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    flag: '<path d="M4 22V4a1 1 0 0 1 1-1h12l-2 4 2 4H5"/>'
  };
  function icon(n) { return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[n] || '') + '</svg>'; }
  var MARK = '<svg class="qb-mark-svg qb-side-ai__mark" viewBox="100 140 1770 1240" fill="none" stroke-width="44" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M800 1355H135V168H1071V772" stroke="#b7e4df"/><circle cx="1313" cy="772" r="242" stroke="#b7e4df"/><path d="M1157 168H1850V1355H913V772" stroke="#187f7b"/><circle cx="669" cy="772" r="242" stroke="#187f7b"/></svg>';

  /* ---------- queues: what is waiting on whom ---------- */
  function queue(role) {
    var u = E.USERS[role || S.role].id;
    if ((role || S.role) === 'registry') return files(function (f) { return f.stage === 'registry' || f.stage === 'returned-marking' || f.stage === 'returned-action'; });
    if ((role || S.role) === 'marking') return files(function (f) { return f.stage === 'marking' && f.holder === u; });
    return files(function (f) { return f.stage === 'action' && f.holder === u; });
  }
  function myTasks() { var u = me().id; return S.data.tasks.filter(function (t) { return t.waitingOn === u && t.status === 'waiting'; }); }

  /* ---------- toasts ---------- */
  function toast(msg, kind) {
    var host = document.getElementById('toasts'), el = document.createElement('div');
    el.className = 'qb-toast' + (kind === 'error' ? ' is-error' : '');
    el.setAttribute('role', 'status');
    el.innerHTML = icon(kind === 'error' ? 'alert' : kind === 'info' ? 'info' : 'check') + '<span>' + esc(msg) + '</span>';
    host.appendChild(el);
    setTimeout(function () { el.remove(); }, 5200);
  }

  /* ---------- modal ---------- */
  var lastFocus = null;
  function openModal(opts) {
    closeModal(true);
    lastFocus = document.activeElement;
    var root = document.getElementById('modal-root');
    root.innerHTML = '<div class="modal-layer"><div class="qb-overlay" data-close-scrim><div class="qb-modal' + (opts.wide ? ' wide' : '') + '" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
      '<div class="qb-modal__head"><h3 id="modal-title">' + esc(opts.title) + '</h3><button type="button" class="qb-btn qb-btn--ghost qb-btn--sm qb-btn--icon" data-close aria-label="Close">' + icon('x') + '</button></div>' +
      '<div class="qb-modal__body" id="modal-body"></div><div class="qb-modal__foot" id="modal-foot"></div></div></div></div>';
    var body = root.querySelector('#modal-body'), foot = root.querySelector('#modal-foot');
    root.querySelector('[data-close]').onclick = function () { closeModal(); };
    root.querySelector('[data-close-scrim]').addEventListener('mousedown', function (e) { if (e.target === e.currentTarget) closeModal(); });
    opts.render(body, foot);
    var first = root.querySelector('.qb-modal__body input, .qb-modal__body select, .qb-modal__body textarea, .qb-modal__foot .qb-btn--primary');
    (first || root.querySelector('[data-close]')).focus();
  }
  function closeModal(silent) {
    var root = document.getElementById('modal-root');
    if (!root.innerHTML) return;
    root.innerHTML = '';
    if (!silent && lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function modalOpen() { return !!document.getElementById('modal-root').innerHTML; }

  /* ---------- journey actions (every change leaves a history line) ---------- */
  function log(f, what, note) { f.history.push({ at: now(), by: me().id, what: what, note: note || '' }); }
  function move(f, stageKey, holder) { f.stage = stageKey; f.holder = holder; f.since = now(); }
  var act = {
    recordMail: function (m) {
      var d = S.data, f;
      if (m.fileMode === 'new') {
        f = { id: 'f' + (d.seq.fileId++), ref: m.newRef, subject: m.newSubject, dept: m.newDept, stage: 'registry', holder: 'henry', since: now(), due: null, docs: [], history: [] };
        d.files.unshift(f);
        log(f, 'Opened file ' + f.ref);
      } else f = file(m.fileId);
      var dc = { id: 'd' + (d.seq.doc++), title: m.subject, from: m.from, letterRef: m.letterRef, letterDate: m.letterDate, received: m.received, kind: m.kind, body: m.summary || '' };
      f.docs.unshift(dc);
      var no = 'IN/2026/' + String(d.seq.in++).padStart(4, '0');
      d.inward.unshift({ no: no, received: m.received, file: f.id, doc: dc.id });
      log(f, 'Received and recorded as ' + no, m.subject);
      if (f.stage === 'filed') log(f, 'File taken out of storage for new correspondence');
      if (m.sendTo) { move(f, 'marking', m.sendTo); f.marking = null; f.action = null; f.due = null; log(f, 'Sent to ' + person(m.sendTo).name + ' for marking'); }
      else move(f, 'registry', 'henry');
      save(); return { file: f, no: no };
    },
    createFile: function (m) {
      var d = S.data, f = { id: 'f' + (d.seq.fileId++), ref: m.ref, subject: m.subject, dept: m.dept, stage: 'registry', holder: 'henry', since: now(), due: null, docs: [], history: [] };
      d.files.unshift(f); log(f, 'Opened file ' + f.ref); save(); return f;
    },
    sendForMarking: function (f, to) { move(f, 'marking', to); log(f, 'Sent to ' + person(to).name + ' for marking'); save(); },
    mark: function (f, m) {
      f.marking = { by: me().id, at: now(), to: m.to, instruction: m.instruction, due: m.due, remarks: m.remarks };
      f.due = m.due; f.action = null;
      move(f, 'returned-marking', 'henry');
      log(f, 'Marked to ' + person(m.to).name + ': ' + m.instruction + (m.due ? ', due ' + fmtDate(m.due) : ''), m.remarks);
      save();
    },
    dispatch: function (f) { move(f, 'action', f.marking.to); log(f, 'Dispatched to ' + person(f.marking.to).name); save(); },
    recordAction: function (f, m) {
      f.action = { by: me().id, at: now(), outcome: m.outcome, note: m.note, replyTo: m.replyTo, replySubject: m.replySubject };
      f.delegatedBy = null;
      move(f, 'returned-action', 'henry');
      log(f, 'Returned to Registry: ' + ({ reply: 'reply ready to send', done: 'action completed', none: 'no action needed' })[m.outcome], m.note);
      save();
    },
    delegate: function (f, m) { f.delegatedBy = me().id; f.holder = m.to; f.since = now(); if (m.due) f.due = m.due; log(f, 'Delegated to ' + person(m.to).name, m.note); save(); },
    takeBack: function (f) { var from = person(f.holder).name; f.holder = f.delegatedBy; f.delegatedBy = null; f.since = now(); log(f, 'Took the file back from ' + from); save(); },
    fileAway: function (f, m) {
      var out = null;
      if (m.sendReply && f.action && f.action.outcome === 'reply') {
        out = 'OUT/2026/' + String(S.data.seq.out++).padStart(4, '0');
        S.data.outward.unshift({ no: out, sent: E.TODAY, to: f.action.replyTo, subject: f.action.replySubject, file: f.id });
      }
      f.location = m.location; move(f, 'filed', 'henry');
      log(f, (out ? 'Reply sent as ' + out + ' and file put away' : 'File put away'), m.location);
      save(); return out;
    },
    approveTask: function (t, ok) { t.status = ok ? 'approved' : 'sent back'; t.doneAt = E.TODAY; save(); }
  };

  /* ---------- routing: #role-view-arg ---------- */
  function hashFor(role, view, arg) { return '#' + role + '-' + view + (arg ? '-' + arg : ''); }
  function parse() {
    var h = (location.hash || '').slice(1).split('-');
    var role = E.USERS[h[0]] ? h[0] : S.role;
    var view = h[1] || 'dashboard', arg = h.slice(2).join('-');
    var views = App.views[role] || {};
    if (!views[view]) { view = 'dashboard'; arg = ''; }
    S.role = role; S.view = view; S.arg = arg;
  }
  function go(view, arg, role) {
    var h = hashFor(role || S.role, view, arg);
    if (location.hash === h) render(); else location.hash = h;
  }

  /* ---------- shell ---------- */
  var NAV = {
    registry: [['§', 'Navigation'], ['dashboard', 'Overview', 'home'], ['routing', 'File Routing', 'route', function () { return queue().length; }], ['inward', 'Inward mail', 'inbox'], ['outward', 'Outward mail', 'send'], ['files', 'Files', 'folder'], ['tasks', 'My tasks', 'tasks', function () { return myTasks().length; }], ['guide', 'User guide', 'book']],
    marking: [['§', 'Navigation'], ['dashboard', 'Overview', 'home'], ['routing', 'File Routing', 'route', function () { return queue().length; }], ['queue', 'Files to mark', 'pen'], ['marked', 'Marked by me', 'check'], ['files', 'Files', 'folder'], ['tasks', 'My tasks', 'tasks', function () { return myTasks().length; }], ['guide', 'User guide', 'book']],
    action: [['§', 'Navigation'], ['dashboard', 'Overview', 'home'], ['routing', 'File Routing', 'route', function () { return queue().length; }], ['queue', 'Files to act on', 'inbox'], ['delegated', 'Delegated by me', 'users'], ['acted', 'Acted on', 'check'], ['files', 'Files', 'folder'], ['tasks', 'My tasks', 'tasks', function () { return myTasks().length; }], ['guide', 'User guide', 'book']]
  };
  function navActive(item) { return S.view === item || (S.view === 'file' && S.ui.from === item); }
  function ago(at) { var n = -daysUntil(at.slice(0, 10)); return n <= 0 ? 'Today' : n === 1 ? 'Yesterday' : n + 'd ago'; }
  function notifications() {
    var out = queue().map(function (f) {
      var h = f.history[f.history.length - 1] || { by: f.holder, at: f.since };
      var what = { registry: 'New file, waiting to be sent for marking.', 'returned-marking': 'Marked, waiting to be dispatched.', 'returned-action': 'File returned from action.', marking: 'Sent to you for marking.', action: f.delegatedBy ? 'Delegated to you for action.' : 'Marked to you for action.' }[f.stage];
      return { file: f.id, title: f.subject, text: what, by: h.by, at: f.since };
    });
    myTasks().forEach(function (t) { out.push({ go: 'tasks', title: t.title, text: 'Waiting for your approval.', by: t.raisedBy, at: t.at || E.TODAY }); });
    return out.sort(function (x, y) { return x.at < y.at ? 1 : -1; });
  }
  function notifCard(n) {
    var p = person(n.by);
    return '<button type="button" class="notif-card"' + (n.file ? ' data-open-file="' + n.file + '"' : ' data-go="' + n.go + '"') + '><span class="top"><span>' + esc(n.title) + '</span><span class="view">View</span></span><span class="ago">' + ago(n.at) + '</span><span class="txt">' + esc(n.text) + '</span>' + (n.by && n.by !== me().id ? '<span class="from">from ' + esc(p.name) + (p.title ? ' – ' + esc(p.title) : '') + '</span>' : '') + '</button>';
  }
  function renderSidebar() {
    var u = me(), side = document.getElementById('sidebar');
    var html = '<div class="side-top"><div class="side-logo"><div class="logo-disc"><img src="assets/moh-crest.png" alt="Republic of Kenya, Ministry of Health"></div><button type="button" class="ph-ic ph-ic--glass" data-side-mini aria-label="Collapse menu" title="Collapse menu">' + icon('collapse') + '</button></div>' +
      '<form class="side-search" role="search" id="search-form">' + icon('search') + '<label class="sr" for="search-q">Search files and letters</label><input id="search-q" type="search" placeholder="Search" value="' + esc(S.q) + '"></form></div>' +
      '<a class="qb-side-ai" href="#" data-ai title="Q-BITS AI"><span class="qb-side-ai__rim" aria-hidden="true"></span>' + MARK + '<span class="qb-side-ai__label">Q-BITS AI</span></a>' +
      '<div class="side-scroll"><nav class="nav" aria-label="Main">';
    NAV[S.role].forEach(function (n) {
      if (n[0] === '§') { html += '<div class="side-h">' + esc(n[1]) + '</div>'; return; }
      var c = n[3] && !S.outage ? n[3]() : 0;
      html += '<a href="' + hashFor(S.role, n[0]) + '"' + (navActive(n[0]) ? ' class="on" aria-current="page"' : '') + ' title="' + esc(n[1]) + '">' + icon(n[2]) + '<span>' + esc(n[1]) + '</span>' + (c ? '<span class="count" aria-label="' + c + ' waiting">' + c + '</span>' : '') + '</a>';
    });
    html += '</nav><div class="side-h">Recent notifications</div>';
    if (S.outage) html += '<p class="side-note">Couldn’t load notifications.</p>';
    else { var ns = notifications().slice(0, 2); html += ns.length ? ns.map(notifCard).join('') : '<p class="side-note">You’re all caught up.</p>'; }
    html += '</div><div class="side-user"><span class="av">' + u.initials + '</span><div><b>' + esc(u.name) + '</b><span>' + esc(u.title) + '</span></div><a class="ph-ic ph-ic--glass' + (S.view === 'settings' ? ' on' : '') + '" href="' + hashFor(S.role, 'settings') + '" title="Settings" aria-label="Settings">' + icon('settings') + '</a><button type="button" class="ph-ic ph-ic--glass" data-signout title="Sign out" aria-label="Sign out">' + icon('logout') + '</button></div>';
    side.innerHTML = html;
  }
  /* The teal band at the top of every page: breadcrumb and tools, then the page title */
  function headHTML(v) {
    var h = App.head || {}, u = me(), q = S.outage ? [] : notifications(), n = q.length;
    var crumbs = (v.crumb || '').split(' / ').filter(Boolean);
    var topnav = '<nav class="topnav" aria-label="Main">' + NAV[S.role].filter(function (n) { return n[0] !== '§'; }).concat([['settings', 'Settings']]).map(function (n) {
      var c = n[3] && !S.outage ? n[3]() : 0;
      return '<a href="' + hashFor(S.role, n[0]) + '"' + (navActive(n[0]) ? ' class="on" aria-current="page"' : '') + '>' + esc(n[1]) + (c ? '<span class="count" aria-label="' + c + ' waiting">' + c + '</span>' : '') + '</a>';
    }).join('') + '</nav>';
    var top = '<div class="phead-top"><button type="button" class="ph-ic menu-toggle" id="nav-open" aria-label="Open menu">' + icon('menu') + '</button>' + topnav +
      '<div class="ph-icons">' +
        '<div class="pop"><button type="button" class="ph-ic" data-pop="search" aria-haspopup="dialog" aria-expanded="false" aria-label="Search files and letters">' + icon('search') + '</button>' +
          '<div class="qb-menu search-pop" data-menu="search" hidden><form role="search" id="search-form-top"><label class="sr" for="search-q-top">Search files and letters</label><span class="rt-search">' + icon('search') + '<input id="search-q-top" type="search" placeholder="Search files and letters" value="' + esc(S.q) + '"></span><button class="qb-btn qb-btn--primary qb-btn--sm" type="submit">Search</button></form></div></div>' +
        '<button class="qb-theme-toggle" role="switch" aria-checked="false" aria-label="Dark mode" data-qb-theme-toggle><span class="qb-tt-stars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><span class="qb-tt-clouds" aria-hidden="true"><i></i><i></i></span><span class="qb-tt-knob" aria-hidden="true"><span class="qb-tt-crater"></span><span class="qb-tt-crater"></span><span class="qb-tt-crater"></span></span></button>' +
        '<div class="pop"><button type="button" class="ph-ic" data-pop="bell" aria-haspopup="menu" aria-expanded="false" aria-label="Notifications' + (n ? ', ' + n + ' waiting' : '') + '">' + icon('bell') + (n ? '<span class="badge" aria-hidden="true">' + n + '</span>' : '') + '</button>' +
          '<div class="qb-menu" role="menu" data-menu="bell" hidden><div class="qb-menu__title">Waiting on you</div>' +
          (S.outage ? '<div class="menu-empty">Couldn’t load notifications.</div>' : (n ? q.slice(0, 8).map(function (x) { return '<button class="qb-menu__item" role="menuitem"' + (x.file ? ' data-open-file="' + x.file + '"' : ' data-go="' + x.go + '"') + '><span>' + esc(x.title) + '<small>' + esc(x.text) + '</small></span></button>'; }).join('') : '<div class="menu-empty">Nothing is waiting on you.</div>')) +
          '</div></div>' +
        '<div class="pop"><button type="button" class="ph-ic" data-pop="sys" aria-haspopup="menu" aria-expanded="false" aria-label="Switch Q-BITS system">' + icon('grid') + '</button>' +
          '<div class="qb-menu" role="menu" data-menu="sys" hidden><div class="qb-menu__title">Q-BITS systems</div>' +
          '<button class="qb-menu__item" role="menuitem" aria-current="true"><span class="qb-switcher__mark">' + icon('file') + '</span><span>EDRMS<small>Records and documents</small></span></button>' +
          '<button class="qb-menu__item" role="menuitem" data-sys><span class="qb-switcher__mark">' + icon('users') + '</span><span>ERM<small>Employee records</small></span></button>' +
          '<button class="qb-menu__item" role="menuitem" data-sys><span class="qb-switcher__mark">' + icon('grid') + '</span><span>ERP<small>Finance, payroll and approvals</small></span></button></div></div>' +
        '<div class="pop"><button type="button" class="ph-ic me" data-pop="me" aria-haspopup="menu" aria-expanded="false" aria-label="Your account: ' + esc(u.name) + '">' + u.initials + '</button>' +
          '<div class="qb-menu" role="menu" data-menu="me" hidden><div class="qb-menu__item" style="cursor:default"><span>' + esc(u.name) + '<small>' + esc(u.title) + ' · Ministry of Health, State Department for Medical Services</small></span></div>' +
          '<button class="qb-menu__item" role="menuitem" data-go="settings">' + icon('settings') + '<span>Settings</span></button><div class="qb-menu__title">Switch demo account</div>' + LOGIN_ROLES.filter(function (r) { return r[0] !== S.role; }).map(function (r) { return '<button class="qb-menu__item" role="menuitem" data-demo-role="' + r[0] + '"><span class="av av-sm">' + E.USERS[r[0]].initials + '</span><span>' + esc(E.USERS[r[0]].name) + '<small>' + r[1] + '</small></span></button>'; }).join('') + '<button class="qb-menu__item" role="menuitem" data-signout>' + icon('logout') + '<span>Sign out</span></button></div></div>' +
      '</div></div>';
    if (h.heroHTML) return '<section class="phead is-hero">' + top + h.heroHTML + '</section>';
    var main = '<div class="phead-main">' + '<div class="logo-disc logo-disc--head"><img src="assets/moh-crest.png" alt="Republic of Kenya, Ministry of Health"></div>' +
      '<div class="phead-titles">' + (h.back ? '<button type="button" class="back" data-go="' + h.back[1] + '">' + icon('arrowL') + ' ' + esc(h.back[0]) + '</button>' : '') + (h.over ? '<div class="over">' + esc(h.over) + '</div>' : '') +
      '<h1>' + esc(h.title || v.title || '') + '</h1>' + (h.sub ? '<p>' + esc(h.sub) + '</p>' : '') + (h.meta ? '<div class="meta">' + h.meta + '</div>' : '') + '</div>' +
      (h.right ? '<div class="phead-right">' + h.right + '</div>' : '') + '</div>';
    return '<section class="phead' + (h.hero ? ' is-hero' : '') + '">' + top + main + '</section>';
  }
  function closeMenus() {
    document.querySelectorAll('[data-menu]').forEach(function (m) { m.hidden = true; });
    document.querySelectorAll('[data-pop]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
  }
  function setNav(open) {
    document.getElementById('sidebar').classList.toggle('is-open', open);
    document.getElementById('nav-scrim').hidden = !open;
  }

  /* ---------- sign-in (mock: the account picker decides the role) ---------- */
  var LOGIN_ROLES = [['registry', 'Registry Officer', 'Records mail, routes and files'], ['marking', 'Marking Officer', 'Marks files to an officer'], ['action', 'Action Officer', 'Acts on or delegates files']];
  function demoEmail(r) { return E.USERS[r].name.toLowerCase().replace(/\s+/g, '.') + '@health.go.ke'; }
  function renderLogin() {
    var el = document.getElementById('login');
    el.innerHTML = '<div class="login-frame">' +
      '<section class="login-brand"><div class="crest">REPUBLIC OF KENYA<img src="assets/coat-of-arms.png" alt="Coat of arms of Kenya">MINISTRY OF HEALTH</div>' +
        '<h1>Electronic Document and Records Management System</h1><p>EDRMS uses your Q-BITS ERP account. Your role, department and data scope come from the ERP.</p>' +
        '<div class="foot"><span class="qb-tag"><img src="qbits-mark-on-mint.png" alt="">Q-BITS</span><span>Powered by CodexAI Kenya</span></div></section>' +
      '<section class="login-form"><h2>Sign in to EDRMS</h2><p>EDRMS uses your Q-BITS ERP account. Your role, department and data scope come from the ERP.</p>' +
        '<form class="login-stack" id="login-form" novalidate>' +
          '<label class="login-input">' + icon('mail') + '<span class="sr">Work email</span><input type="email" id="login-email" autocomplete="username" placeholder="Work email" aria-describedby="login-err"></label>' +
          '<label class="login-input">' + icon('lock') + '<span class="sr">Password</span><input type="password" autocomplete="current-password" placeholder="Password"></label>' +
          '<p class="login-err" id="login-err" role="alert" hidden></p>' +
          '<button class="login-btn" type="submit">Sign in ' + icon('arrowR') + '</button>' +
          '<div class="or">or</div>' +
          '<button class="login-btn" type="button" data-ms>' + '<span class="ms-logo" aria-hidden="true"><i style="background:#f25022"></i><i style="background:#7fba00"></i><i style="background:#00a4ef"></i><i style="background:#ffb900"></i></span> Continue with Microsoft</button>' +
        '</form>' +
        '<div class="demo-roles"><span class="label">Try a demo journey: sign in as</span><div class="row">' +
          LOGIN_ROLES.map(function (r) { return '<button type="button" data-login-role="' + r[0] + '"><b>' + r[1] + '</b><span>' + esc(E.USERS[r[0]].name) + '</span><small>' + r[2] + '</small></button>'; }).join('') + '</div></div>' +
      '</section></div>';
    el.querySelectorAll('[data-login-role]').forEach(function (b) { b.onclick = function () { signIn(b.dataset.loginRole); toast('Signed in as ' + E.USERS[b.dataset.loginRole].name + ' (demo)'); }; });
    el.querySelector('[data-ms]').onclick = function () { var err = el.querySelector('#login-err'); err.hidden = false; err.textContent = 'Microsoft sign-in isn’t connected in the demo. Choose a demo account below.'; };
    el.querySelector('#login-form').onsubmit = function (e) {
      e.preventDefault();
      var v = el.querySelector('#login-email').value.trim().toLowerCase(), err = el.querySelector('#login-err');
      var r = LOGIN_ROLES.map(function (x) { return x[0]; }).filter(function (k) { return demoEmail(k) === v; })[0];
      if (r) { signIn(r); return; }
      err.hidden = false; err.textContent = v ? 'That email isn’t a demo account. Use ' + demoEmail('registry') + ', or choose a demo account below.' : 'Enter your work email, or choose a demo account below.';
      el.querySelector('#login-email').focus();
    };
  }
  function signIn(role) { S.signedIn = true; S.ui = {}; save(); var h = hashFor(role, 'dashboard'); if (location.hash === h) render(); else location.hash = h; }
  function signOut() { if (App.tutorial) App.tutorial.stop(); S.signedIn = false; S.ui = { loginRole: S.role }; save(); render(); }
  function showLogin(on) {
    document.getElementById('login').hidden = !on;
    document.getElementById('shell').hidden = on;
    document.getElementById('hub').hidden = on;
    document.querySelector('.app').classList.toggle('is-login', on);
  }

  /* ---------- render ---------- */
  function render() {
    parse(); closeMenus(); setNav(false);
    showLogin(!S.signedIn);
    if (!S.signedIn) { renderLogin(); document.title = 'Sign in · EDRMS File Journeys'; return; }
    App.head = null;
    var v = App.views[S.role][S.view](S.arg) || {};
    renderSidebar();
    var view = document.getElementById('view');
    document.body.classList.add('is-overview'); /* every page uses the overview layout: menu in the header band */
    view.innerHTML = headHTML(v) + (v.html || '');
    QBits.init(view);
    if (v.mount) v.mount(view);
    document.title = (v.title ? v.title + ' · ' : '') + 'EDRMS File Journeys';
  }
  function rerender() { var y = window.scrollY; render(); window.scrollTo(0, y); }

  /* ---------- global events ---------- */
  function boot() {
    /* Follow the system theme until the viewer picks one with the toggle */
    var mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
    function chosen() { try { return localStorage.getItem('qb-theme'); } catch (e) { return null; } }
    function followSystem() { if (mq && !chosen()) { document.documentElement.setAttribute('data-theme', mq.matches ? 'dark' : 'light'); document.querySelectorAll('[data-qb-theme-toggle]').forEach(function (b) { b.classList.toggle('is-dark', mq.matches); b.setAttribute('aria-checked', String(mq.matches)); }); } }
    followSystem();
    try { if (localStorage.getItem('edrms-side-mini')) document.body.classList.add('side-mini'); } catch (x) {}
    if (mq && mq.addEventListener) mq.addEventListener('change', followSystem);
    App.resetDemo = function () {
      openModal({ title: 'Reset the demo data?', render: function (body, foot) {
        body.innerHTML = '<p>Every file, register entry and approval goes back to the starting example. Changes you made in the demo are cleared from this browser.</p>';
        foot.innerHTML = '<button class="qb-btn qb-btn--secondary" data-x>Keep my changes</button><button class="qb-btn qb-btn--danger" data-ok>Reset demo data</button>';
        foot.querySelector('[data-x]').onclick = function () { closeModal(); };
        foot.querySelector('[data-ok]').onclick = function () { S.data = E.seed(); S.outage = false; save(); closeModal(); go('dashboard'); toast('Demo data reset'); };
      } });
    };
    App.setOutage = function (on) { S.outage = on; save(); rerender(); };
    document.addEventListener('click', function (e) {
      var pop = e.target.closest('[data-pop]');
      if (pop) {
        var m = document.querySelector('[data-menu="' + pop.dataset.pop + '"]'), was = m.hidden;
        closeMenus(); m.hidden = !was; pop.setAttribute('aria-expanded', String(was));
        if (was) { var it = m.querySelector('input') || m.querySelector('button'); if (it) it.focus(); }
        return;
      }
      if (!e.target.closest('.qb-menu')) closeMenus();
      var of = e.target.closest('[data-open-file]');
      if (of) { e.preventDefault(); S.ui.from = S.view === 'file' ? S.ui.from : S.view; closeModal(true); go('file', of.dataset.openFile); return; }
      var g = e.target.closest('[data-go]');
      if (g) { e.preventDefault(); var tab = g.dataset.tab === 'active' ? '' : g.dataset.tab; if (g.dataset.go === 'routing') go('routing', tab || ''); else { if (tab) S.ui.tab = tab; go(g.dataset.go, g.dataset.arg || ''); } return; }
      if (e.target.closest('[data-ai]')) { e.preventDefault(); toast('Q-BITS AI is not connected in the demo', 'info'); return; }
      if (e.target.closest('[data-sys]')) { closeMenus(); toast('Switching systems is not part of the demo', 'info'); return; }
      if (e.target.closest('#nav-open')) { setNav(true); document.querySelector('#sidebar .nav a').focus(); return; }
      var dr = e.target.closest('[data-demo-role]'); if (dr) { closeMenus(); if (App.tutorial) App.tutorial.stop(); S.q = ''; S.ui = {}; go('dashboard', '', dr.dataset.demoRole); toast('Signed in as ' + E.USERS[dr.dataset.demoRole].name); return; }
      if (e.target.closest('[data-signout]')) { closeMenus(); signOut(); return; }
      if (e.target.closest('[data-side-mini]')) { var mini = document.body.classList.toggle('side-mini'); try { localStorage.setItem('edrms-side-mini', mini ? '1' : ''); } catch (x) {} return; }
      if (e.target.id === 'nav-scrim') setNav(false);
      var hubBtn = e.target.closest('[data-hub]');
      if (hubBtn) { if (hubBtn.dataset.hub === 'guide') App.guide(); else toast('Q-BITS AI is not connected in the demo', 'info'); }
    });
    document.addEventListener('submit', function (e) {
      if (e.target.id === 'search-form' || e.target.id === 'search-form-top') { e.preventDefault(); S.q = e.target.querySelector('input').value.trim(); go('search'); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (modalOpen()) { closeModal(); return; }
      var open = document.querySelector('[data-menu]:not([hidden])');
      if (open) { var b = document.querySelector('[data-pop="' + open.dataset.menu + '"]'); closeMenus(); if (b) b.focus(); return; }
      if (document.getElementById('sidebar').classList.contains('is-open')) setNav(false);
    });
    window.addEventListener('hashchange', function () { render(); window.scrollTo(0, 0); document.getElementById('view').focus({ preventScroll: true }); });
    if (!location.hash) history.replaceState(null, '', hashFor('registry', 'dashboard'));
    render();
  }

  return {
    S: S, E: E, views: { registry: {}, marking: {}, action: {} }, esc: esc, notifications: notifications, notifCard: notifCard, hashFor: hashFor, NAV: function () { return NAV[S.role]; }, fmtDate: fmtDate, fmtDT: fmtDT, addDays: addDays, daysUntil: daysUntil, person: person, stage: stage, me: me,
    file: file, files: files, byStage: byStage, stageBadge: stageBadge, dueBadge: dueBadge, plural: plural, icon: icon, queue: queue, myTasks: myTasks,
    toast: toast, openModal: openModal, closeModal: closeModal, act: act, go: go, render: render, rerender: rerender, boot: boot, save: save
  };
})();
