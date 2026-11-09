/* EDRMS prototype — views for the three roles. */
(function (A) {
  var E = A.E, S = A.S, esc = A.esc, icon = A.icon, fmtDate = A.fmtDate, fmtDT = A.fmtDT, person = A.person;
  var PER_PAGE = 8;

  /* ---------- shared building blocks ---------- */
  function errorState(what) {
    return '<div class="qb-card"><div class="state state--error" role="alert">' + icon('alert') + '<b>Couldn’t load ' + esc(what) + '</b><p>The records service didn’t respond. Nothing you saved is lost. Try again in a minute; if it keeps happening, contact ICT support on extension 4400.</p><button class="qb-btn qb-btn--secondary qb-btn--sm" data-retry>' + icon('refresh') + ' Try again</button></div></div>';
  }
  function emptyState(title, text, ico) { return '<div class="state">' + icon(ico || 'check') + '<b>' + esc(title) + '</b>' + (text ? '<p>' + esc(text) + '</p>' : '') + '</div>'; }
  function mountRetry(root) { root.querySelectorAll('[data-retry]').forEach(function (b) { b.onclick = function () { A.toast(S.outage ? 'Still can’t reach the records service' : 'Loaded', S.outage ? 'error' : ''); A.rerender(); }; }); }
  /* The page title lives in the teal band (app.js headHTML); views only describe it */
  function pageHead(title, text, actions, extra) { A.head = Object.assign({ title: title, sub: text, right: actions }, extra || {}); return ''; }
  /* key → page index, so each list keeps its own page */
  function paged(key, list) {
    var pages = Math.max(1, Math.ceil(list.length / PER_PAGE)), p = Math.min(S.ui['p_' + key] || 0, pages - 1);
    var rows = list.slice(p * PER_PAGE, p * PER_PAGE + PER_PAGE);
    var foot = list.length ? '<div class="pager"><span class="tnum">Showing ' + (p * PER_PAGE + 1) + '–' + (p * PER_PAGE + rows.length) + ' of ' + list.length + '</span>' +
      (pages > 1 ? '<div class="qb-seg"><button data-page="' + key + '" data-p="' + (p - 1) + '"' + (p === 0 ? ' disabled' : '') + '>Previous</button><button data-page="' + key + '" data-p="' + (p + 1) + '"' + (p >= pages - 1 ? ' disabled' : '') + '>Next</button></div>' : '') + '</div>' : '';
    return { rows: rows, foot: foot };
  }
  function mountPager(root) { root.querySelectorAll('[data-page]').forEach(function (b) { b.onclick = function () { S.ui['p_' + b.dataset.page] = +b.dataset.p; A.rerender(); }; }); }
  function fileRows(list, cols) {
    return list.map(function (f) {
      return '<tr class="is-link" data-open-file="' + f.id + '">' + cols.map(function (c) { return '<td' + (c.cls ? ' class="' + c.cls + '"' : '') + '>' + c.cell(f) + '</td>'; }).join('') + '</tr>';
    }).join('');
  }
  var COL = {
    ref: { h: 'File', cell: function (f) { return '<div class="fname">' + thumb(f) + '<div><a href="#" data-open-file="' + f.id + '"><b>' + esc(f.subject) + '</b></a>' + (f.due && f.stage !== 'filed' && A.daysUntil(f.due) < 0 ? ' <span class="flag" title="Overdue">' + icon('flag') + '</span>' : '') + '<small class="mono">' + esc(f.ref) + '</small></div></div>'; } },
    pill: { h: 'Stage', cell: function (f) { return A.stageBadge(f); } },
    with: { h: 'With', cell: function (f) { return esc(holderText(f)); } },
    docs: { h: 'Letters', cls: 'tnum', cell: function (f) { return f.docs.length; } },
    open: { h: '<span class="sr">Open</span>', cls: 'right', cell: function (f) { return '<button type="button" class="btn-open" data-open-file="' + f.id + '">Open</button>'; } },
    from: { h: 'Latest letter', cell: function (f) { var d = f.docs[0]; return d ? esc(d.title) + '<span class="sub">From ' + esc(d.from) + '</span>' : '<span class="muted">No letters yet</span>'; } },
    stage: { h: 'Where it is', cell: function (f) { return A.stageBadge(f) + '<span class="sub">' + esc(holderText(f)) + '</span>'; } },
    since: { h: 'Since', cls: 'tnum', cell: function (f) { return fmtDT(f.since); } },
    due: { h: 'Due', cell: function (f) { return A.dueBadge(f); } },
    marking: { h: 'Marking', cell: function (f) { return f.marking ? esc(f.marking.instruction) + '<span class="sub">To ' + esc(person(f.marking.to).name) + '</span>' : '<span class="muted">Not marked</span>'; } },
    outcome: { h: 'Outcome', cell: function (f) { return f.action ? esc(outcomeText(f.action.outcome)) + '<span class="sub">' + fmtDT(f.action.at) + '</span>' : ''; } }
  };
  var COVERS = ['#c8665f', '#e3c35a', '#d98a3d', '#7b63c9', '#8b8f99', '#5aa36a', '#4f8fc0'];
  function coverColour(f) { var n = 0; for (var i = 0; i < f.ref.length; i++) n += f.ref.charCodeAt(i); return COVERS[n % COVERS.length]; }
  function thumb(f) { return '<span class="thumb" style="--cv:' + coverColour(f) + '" aria-hidden="true"><i></i><i></i><i></i></span>'; }
  function holderText(f) {
    if (f.stage === 'filed') return f.location || 'Registry';
    if (f.stage === 'registry' || f.stage === 'returned-marking' || f.stage === 'returned-action') return 'Central Registry';
    return person(f.holder).name + (f.delegatedBy ? ' (delegated by ' + (f.delegatedBy === A.me().id ? 'you' : person(f.delegatedBy).name) + ')' : '');
  }
  function whereText(f) {
    var m = f.marking;
    switch (f.stage) {
      case 'filed': return 'It’s filed away at ' + (f.location || 'the Central Registry') + '.';
      case 'registry': return 'It’s in the Central Registry, waiting to be sent for marking.';
      case 'marking': return person(f.holder).name + ' has it for marking.';
      case 'returned-marking': return 'It’s in the Central Registry, waiting to be dispatched to ' + person(m.to).name + '.';
      case 'action': return person(f.holder).name + ' has it for action' + (f.delegatedBy ? ', delegated by ' + person(f.delegatedBy).name : '') + '.';
      case 'returned-action': return 'It’s in the Central Registry, waiting to be filed away.';
    }
    return '';
  }
  function outcomeText(o) { return { reply: 'Reply ready to send', done: 'Action completed', none: 'No action needed' }[o] || ''; }
  function fileTable(key, list, cols, empty) {
    if (!list.length) return '<div class="qb-table-wrap">' + empty + '</div>';
    var pg = paged(key, list);
    return '<div class="qb-table-wrap"><table class="qb-table"><thead><tr>' + cols.map(function (c) { return '<th scope="col">' + c.h + '</th>'; }).join('') + '</tr></thead><tbody>' + fileRows(pg.rows, cols) + '</tbody></table>' + pg.foot + '</div>';
  }
  /* ---------- Overview (from the EDRMS Glass #overview design) ---------- */
  function hero() {
    var u = A.me(), where = { registry: 'Central Registry', marking: u.title, action: 'National Vaccination Services' }[S.role];
    var role = { registry: 'Registry Officer', marking: 'Marking Officer', action: 'Action Officer' }[S.role];
    var recent = A.files(function (f) { return f.stage !== 'filed'; }).sort(function (x, y) { return x.since < y.since ? 1 : -1; }).slice(0, 3);
    A.head = { hero: true, title: 'Hello, ' + u.name, heroHTML: '<div class="dash-hero">' +
      '<div class="disc-big"><img src="assets/moh-crest.png" alt="Republic of Kenya, Ministry of Health"></div>' +
      '<div class="dash-hello"><h1>Hello, ' + esc(u.name) + '</h1><p>' + esc(where) + ' <span class="sep" aria-hidden="true"></span> ' + role + '</p></div>' +
      (S.outage ? '' : '<div class="cover-stack" aria-label="Latest files">' + recent.map(function (f, k) { return '<button type="button" class="cs cs' + k + '" data-open-file="' + f.id + '" style="--cv:' + coverColour(f) + '" aria-label="Open ' + esc(f.subject) + '"><span class="cv-no">' + esc(f.ref) + '</span><span class="cv-rep">Republic of Kenya</span><span class="cv-min">MINISTRY OF HEALTH</span><span class="cv-lbl">Subject</span><span class="cv-subj">' + esc(f.subject) + '</span><span class="cv-rows"><i></i><i></i><i></i></span></button>'; }).reverse().join('') + '</div>') +
      '</div>' };
    return '';
  }
  function tile(o) {
    var badge = !S.outage && o.badge ? '<span class="badge tile-badge" aria-label="' + o.badge + ' waiting">' + o.badge + '</span>' : '';
    var ic = o.art ? '<span class="tile-ic art"><img src="assets/tiles/' + o.art + '.svg" alt=""></span>' : '<span class="tile-ic"><i></i><span>' + icon(o.ico) + '</span></span>';
    var attrs = o.attr || ('data-go="' + o.go + '"' + (o.tab ? ' data-tab="' + o.tab + '"' : ''));
    return '<button type="button" class="tile" ' + attrs + '>' + ic + badge + '<b>' + esc(o.title) + '</b><span class="sub">' + esc(S.outage && o.counted ? 'Couldn’t load' : o.sub) + '</span></button>';
  }
  /* Suggestions worked out from the files themselves */
  function insights() {
    var out = [], u = A.me().id;
    function add(text, tag, cta, go, arg) { out.push({ text: text, tag: tag, cta: cta, go: go, arg: arg }); }
    var overdue = A.files(function (f) { return f.stage === 'action' && f.due && A.daysUntil(f.due) < 0; });
    if (S.role === 'registry') {
      var back = A.byStage('returned-action'), disp = A.byStage('returned-marking'), toMark = A.byStage('registry');
      if (back.length) add(A.plural(back.length, 'file came back from action and is', 'files came back from action and are') + ' waiting to be filed', 'Urgent', 'File away', 'routing', 'returned-action');
      if (disp.length) add(A.plural(disp.length, 'marked file is', 'marked files are') + ' waiting to be dispatched', 'Today', 'Dispatch', 'routing', 'returned-marking');
      if (toMark.length) add(A.plural(toMark.length, 'new file is', 'new files are') + ' waiting to be sent for marking', 'Today', 'Send for marking', 'routing', 'registry');
      if (overdue.length) add(overdue[0].subject + ' is overdue with ' + person(overdue[0].holder).name, 'Urgent', 'Open file', 'file', overdue[0].id);
    } else if (S.role === 'marking') {
      var q = A.queue(); if (q.length) add(A.plural(q.length, 'file is', 'files are') + ' waiting for your marking', 'Today', 'Mark files', 'queue');
      var od = overdue.filter(function (f) { return f.marking && f.marking.by === u; }); if (od.length) add(od[0].subject + ' is past the due date you set', 'Urgent', 'Open file', 'file', od[0].id);
    } else {
      var aq = A.queue(), soon = aq.filter(function (f) { return f.due && A.daysUntil(f.due) <= 3; });
      if (aq.length) add(A.plural(aq.length, 'file was', 'files were') + ' routed to you for action', soon.length ? 'Urgent' : 'Today', 'Act on files', 'queue');
      if (soon.length) add(soon[0].subject + ' is due ' + fmtDate(soon[0].due), 'Urgent', 'Open file', 'file', soon[0].id);
      var dl = A.files(function (f) { return f.delegatedBy === u && f.stage === 'action'; }); if (dl.length) add(A.plural(dl.length, 'file is', 'files are') + ' with your team', 'Review', 'See delegated', 'delegated');
    }
    var t = A.myTasks(); if (t.length) add(A.plural(t.length, 'approval is', 'approvals are') + ' waiting on you', 'Review', 'Open my tasks', 'tasks');
    if (!out.length) add('You’re up to date. Nothing needs your attention right now.', 'Info', 'Open the user guide', 'guide');
    return out;
  }
  function aiCard() {
    if (S.outage) return '<section class="ai-sugg"><div class="ai-sugg-h">' + icon('zap') + '<h2>AI suggestions</h2></div><p class="ai-sugg-sub">Couldn’t load suggestions while the records service is down.</p></section>';
    var list = insights(), i = Math.min(S.ui.ai || 0, list.length - 1), x = list[i];
    return '<section class="ai-sugg" aria-label="AI suggestions"><div class="ai-sugg-h">' + icon('zap') + '<h2>AI suggestions</h2><span class="pill">' + A.plural(list.length, 'insight', 'insights') + '</span></div>' +
      '<p class="ai-sugg-sub">Recommendations based on your files</p>' +
      '<div class="ai-sugg-item" aria-live="polite"><div class="t"><span>' + esc(x.text) + '</span><span class="tag ' + x.tag.toLowerCase() + '">' + x.tag + '</span></div>' +
      '<button type="button" class="btn-white btn-sm" ' + (x.go === 'file' ? 'data-open-file="' + x.arg + '"' : 'data-go="' + x.go + '"' + (x.arg ? ' data-tab="' + x.arg + '"' : '')) + '>' + esc(x.cta) + ' ' + icon('chevronR') + '</button></div>' +
      (list.length > 1 ? '<div class="dots" role="group" aria-label="Choose suggestion">' + list.map(function (_, k) { return '<button type="button" class="' + (k === i ? 'on' : '') + '" data-ai-i="' + k + '" aria-label="Suggestion ' + (k + 1) + ' of ' + list.length + '"' + (k === i ? ' aria-current="true"' : '') + '></button>'; }).join('') + '</div>' : '') + '</section>';
  }
  function overview(tiles, panel) {
    var ns = S.outage ? [] : A.notifications().slice(0, 3);
    return '<div class="dash2"><aside class="dash-left">' +
      '<section class="notif-panel"><div class="np-h"><h2>Recent notifications</h2></div>' +
        (S.outage ? '<p class="side-note">Couldn’t load notifications.</p>' : ns.length ? ns.map(A.notifCard).join('') : '<p class="side-note">You’re all caught up.</p>') + '</section>' +
      aiCard() + '</aside>' +
      '<div class="dash-main"><section class="tiles" aria-label="Quick actions">' + tiles.join('') + '</section>' + panel + '</div></div>';
  }
  /* File movements: collapsed bar that opens the latest moves (reference #overview) */
  function movementsPanel() {
    var open = !!S.ui.showMv;
    var rows = [];
    A.files().forEach(function (f) { f.history.forEach(function (h) { rows.push({ f: f, h: h }); }); });
    rows.sort(function (x, y) { return x.h.at < y.h.at ? 1 : -1; }); rows = rows.slice(0, 8);
    return '<section class="qb-glass qb-panel mv-panel"><div class="qb-panel__head"><div><h2>File movements</h2><p class="muted panel-sub">Track each file sent to the Marking Officer and Action Officers, and whether action has been taken.</p></div>' +
      '<div class="qb-right"><button class="mv-toggle' + (open ? ' is-open' : '') + '" data-mv aria-expanded="' + open + '" aria-controls="mv-body">' + icon(open ? 'chevron' : 'route') + ' ' + (open ? 'Hide movements' : 'Show movements') + '</button></div></div>' +
      (open ? '<div id="mv-body">' + (S.outage ? errorState('file movements') : '<div class="qb-table-wrap"><table class="qb-table"><thead><tr><th scope="col">Date</th><th scope="col">File</th><th scope="col">What happened</th><th scope="col">By</th><th scope="col">Where it is now</th></tr></thead><tbody>' +
        rows.map(function (r) { return '<tr class="is-link" data-open-file="' + r.f.id + '"><td class="tnum">' + fmtDT(r.h.at) + '</td><td>' + COL.ref.cell(r.f) + '</td><td>' + esc(r.h.what) + '</td><td>' + esc(person(r.h.by).name) + '</td><td>' + A.stageBadge(r.f) + '</td></tr>'; }).join('') +
        '</tbody></table></div><div class="mv-foot"><button class="btn-open" data-go="routing" data-tab="active">See every file in File Routing ' + icon('chevronR') + '</button></div>') + '</div>' : '') + '</section>';
  }
  function mountOverview(root) {
    var mv = root.querySelector('[data-mv]'); if (mv) mv.onclick = function () { S.ui.showMv = !S.ui.showMv; A.rerender(); var b = document.querySelector('[data-mv]'); if (b) b.focus(); };
    root.querySelectorAll('[data-ai-i]').forEach(function (b) { b.onclick = function () { S.ui.ai = +b.dataset.aiI; A.rerender(); var d = document.querySelector('[data-ai-i="' + b.dataset.aiI + '"]'); if (d) d.focus(); }; });
    var r = root.querySelector('[data-record]'); if (r) r.onclick = recordMail;
  }
  function outageBanner() { return S.outage ? errorState('your work queue') : ''; }
  function wrap(v) { var m = v.mount; v.mount = function (root) { mountRetry(root); mountPager(root); if (m) m(root); }; return v; }

  /* ---------- journey board (Registry dashboard + movements) ---------- */
  function board() {
    var lanes = [['registry', 'Henry Kiprotich, Registry'], ['marking', 'Marking Officer'], ['returned-marking', 'Registry: dispatch to Action Officer'], ['action', 'Action Officer'], ['returned-action', 'Registry: file away']];
    return '<div class="board">' + lanes.map(function (l) {
      var list = A.byStage(l[0]);
      return '<div class="lane"><div class="lane__head"><b>' + esc(A.stage(l[0]).label) + '</b><span class="lane__n">' + list.length + '</span></div><div class="lane__who">' + esc(l[1]) + '</div>' +
        (list.length ? list.slice(0, 3).map(function (f) { return '<button type="button" class="chip" data-open-file="' + f.id + '"><b>' + esc(f.ref) + '</b><span>' + esc(f.subject) + '</span>' + (f.due ? A.dueBadge(f) : '') + '</button>'; }).join('') : '<div class="lane__empty">Nothing here.</div>') +
        (list.length > 3 ? '<button type="button" class="lane__more" data-go="routing" data-tab="' + l[0] + '">Show all ' + list.length + '</button>' : '') + '</div>';
    }).join('') + '</div>';
  }

  /* ================= REGISTRY ================= */
  var R = A.views.registry;
  R.dashboard = function () {
    var todayIn = S.data.inward.filter(function (i) { return i.received === E.TODAY; }).length, q = A.queue();
    return wrap({
      title: 'Overview', crumb: '',
      html: hero() + overview([
        tile({ art: 'upload', title: 'Record incoming mail', sub: 'Register a letter and file it', attr: 'data-record' }),
        tile({ art: 'files', title: 'Registries and files', sub: 'View and open files', go: 'files' }),
        tile({ art: 'tasks', title: 'My tasks', sub: 'Approvals waiting on you', go: 'tasks', badge: A.myTasks().length }),
        tile({ art: 'movements', title: 'File routing', sub: 'Where every file is', go: 'routing', tab: 'active', badge: q.length, counted: true }),
        tile({ art: 'outward', title: 'Outward register', sub: 'Letters sent out', go: 'outward' }),
        tile({ art: 'inward', title: 'Inward register', sub: todayIn ? A.plural(todayIn, 'letter', 'letters') + ' received today' : 'Letters received', go: 'inward', counted: true }),
        tile({ art: 'requested', title: 'To send for marking', sub: 'Recorded, not yet sent', go: 'routing', tab: 'registry', badge: A.byStage('registry').length, counted: true }),
        tile({ art: 'physical', title: 'To dispatch', sub: 'Marked, waiting to go out', go: 'routing', tab: 'returned-marking', badge: A.byStage('returned-marking').length, counted: true }),
        tile({ ico: 'archive', title: 'To file away', sub: 'Back from action', go: 'routing', tab: 'returned-action', badge: A.byStage('returned-action').length, counted: true })
      ], movementsPanel()),
      mount: mountOverview
    });
  };
  /* File Routing: every file the viewer is involved in, filtered by stage (same screen for all three roles) */
  function routing() {
    var u = A.me().id, reg = S.role === 'registry';
    function mine(f) { return reg || f.holder === u || f.delegatedBy === u || (f.marking && (f.marking.by === u || f.marking.to === u)); }
    var all = A.files(mine).sort(function (x, y) { return x.since < y.since ? 1 : -1; });
    var tabs = [['active', 'All active']].concat(E.STAGES.map(function (st) { return [st.key, st.label]; }));
    var cur = S.arg || 'active'; if (!tabs.some(function (t) { return t[0] === cur; })) cur = 'active';
    function listFor(k) { return all.filter(function (f) { return k === 'active' ? f.stage !== 'filed' : f.stage === k; }); }
    var q = (S.ui.rq || '').trim().toLowerCase();
    function match(f) { return !q || (f.subject + ' ' + f.ref + ' ' + holderText(f) + ' ' + f.docs.map(function (d) { return d.title + ' ' + d.from; }).join(' ')).toLowerCase().indexOf(q) >= 0; }
    var list = listFor(cur).filter(match);
    var empty = q ? emptyState('No files match “' + S.ui.rq + '”', 'Try a file number, subject, sender or officer, or choose another stage.', 'search') : emptyState('No files at this stage', 'Files appear here as they move.', 'route');
    return wrap({
      title: 'File Routing', crumb: '',
      html: pageHead('File Routing', reg ? 'Every file and where it is now.' : 'Files that have been sent to you, and where they went next.', '<button class="btn-white" data-go="files">' + icon('folder') + ' Files</button>') +
        '<section class="qb-glass qb-panel"><div class="route-tools" role="search">' +
          '<label class="rt-search">' + icon('search') + '<span class="sr">Search files</span><input type="search" id="rt-q" placeholder="Search files, senders or officers" value="' + esc(S.ui.rq || '') + '"></label>' +
          '<label class="rt-filter">' + icon('filter') + '<span class="sr">Filter by stage</span><select id="rt-stage">' + tabs.map(function (t) { return '<option value="' + t[0] + '"' + (t[0] === cur ? ' selected' : '') + '>' + esc(t[1]) + (S.outage ? '' : ' (' + listFor(t[0]).length + ')') + '</option>'; }).join('') + '</select>' + icon('chevron') + '</label>' +
        '</div>' +
        (S.outage ? errorState('file routing') : '<p class="rt-count" aria-live="polite">' + A.plural(list.length, 'file', 'files') + (q ? ' match' + (list.length === 1 ? 'es' : '') + ' “' + esc(S.ui.rq) + '”' : '') + ' · ' + esc(tabs.filter(function (t) { return t[0] === cur; })[0][1]) + '</p>' +
          fileTable('rt_' + cur, list, [COL.ref, COL.pill, COL.with, COL.docs, COL.since, COL.open], empty)) + '</section>',
      mount: function (root) {
        var sel = root.querySelector('#rt-stage'), inp = root.querySelector('#rt-q');
        sel.onchange = function () { S.ui['p_rt_' + sel.value] = 0; A.go('routing', sel.value === 'active' ? '' : sel.value); };
        inp.oninput = function () { S.ui.rq = inp.value; S.ui['p_rt_' + cur] = 0; A.rerender(); var n = document.getElementById('rt-q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
      }
    });
  }
  R.routing = routing;
  R.outward = function () {
    var list = S.data.outward, body;
    if (S.outage) body = errorState('the outward register');
    else if (!list.length) body = '<div class="qb-table-wrap">' + emptyState('Nothing sent yet', 'Replies are added here when you file away a file with a reply ready to send.', 'send') + '</div>';
    else {
      var pg = paged('out', list);
      body = '<div class="qb-table-wrap"><table class="qb-table"><thead><tr><th scope="col">Entry</th><th scope="col">Sent</th><th scope="col">To</th><th scope="col">Subject</th><th scope="col">From file</th></tr></thead><tbody>' +
        pg.rows.map(function (o) { var f = A.file(o.file); return '<tr class="is-link" data-open-file="' + o.file + '"><td><b class="tnum">' + esc(o.no) + '</b></td><td class="tnum">' + fmtDate(o.sent) + '</td><td>' + esc(o.to) + '</td><td>' + esc(o.subject) + '</td><td class="tnum">' + esc(f ? f.ref : '') + '</td></tr>'; }).join('') + '</tbody></table>' + pg.foot + '</div>';
    }
    return wrap({ title: 'Outward mail', crumb: 'Registry / Registers', html: pageHead('Outward mail register', 'Letters sent out of the Ministry. Entries are created when a reply is dispatched from a file.') + '<section class="qb-glass qb-panel">' + body + '</section>' });
  };

  /* ================= MARKING OFFICER ================= */
  var M = A.views.marking;
  M.routing = routing;
  function markedByMe() { var u = A.me().id; return A.files(function (f) { return f.marking && f.marking.by === u; }).sort(function (a, b) { return a.marking.at < b.marking.at ? 1 : -1; }); }
  M.dashboard = function () {
    var q = A.queue(), mk = markedByMe();
    return wrap({
      title: 'Overview', crumb: '',
      html: hero() + overview([
        tile({ art: 'movements', title: 'Files sent to me', sub: 'Every file you marked or have', go: 'routing', tab: 'active' }),
        tile({ ico: 'pen', title: 'Files to mark', sub: q.length ? A.plural(q.length, 'file', 'files') + ' waiting' : 'You’re up to date', go: 'queue', badge: q.length, counted: true }),
        tile({ ico: 'check', title: 'Marked by me', sub: A.plural(mk.length, 'file', 'files'), go: 'marked', counted: true }),
        tile({ art: 'tasks', title: 'My tasks', sub: 'Approvals waiting on you', go: 'tasks', badge: A.myTasks().length }),
        tile({ art: 'files', title: 'All files', sub: 'Browse files and letters', go: 'files' })
      ], '<section class="qb-glass qb-panel"><div class="qb-panel__head"><h2>Files to mark</h2><span class="qb-badge">' + (S.outage ? '—' : q.length) + '</span></div>' +
        (S.outage ? errorState('files to mark') : fileTable('mq', q, [COL.ref, COL.from, COL.since, COL.open], emptyState('Nothing to mark', 'New files from the Registry will appear here.'))) + '</section>'),
      mount: mountOverview
    });
  };
  M.queue = function () {
    return wrap({ title: 'Files to mark', crumb: 'Marking Officer', html: pageHead('Files to mark', 'Open a file, read the letter and mark it to an Action Officer. It goes back to the Registry for dispatch.') +
      '<section class="qb-glass qb-panel">' + (S.outage ? errorState('files to mark') : fileTable('mq2', A.queue(), [COL.ref, COL.from, COL.since], emptyState('Nothing to mark', 'New files from the Registry will appear here.'))) + '</section>' });
  };
  M.marked = function () {
    return wrap({ title: 'Marked by me', crumb: 'Marking Officer', html: pageHead('Marked by me', 'Follow each file you marked until it is acted on and filed.') +
      '<section class="qb-glass qb-panel">' + (S.outage ? errorState('marked files') : fileTable('mk', markedByMe(), [COL.ref, COL.marking, COL.stage, COL.due], emptyState('You haven’t marked any files yet', '', 'pen'))) + '</section>' });
  };

  /* ================= ACTION OFFICER ================= */
  var X = A.views.action;
  X.routing = routing;
  function delegated() { var u = A.me().id; return A.files(function (f) { return f.delegatedBy === u && f.stage === 'action'; }); }
  function actedOn() { var u = A.me().id; return A.files(function (f) { return f.action && f.action.by === u; }).sort(function (a, b) { return a.action.at < b.action.at ? 1 : -1; }); }
  X.dashboard = function () {
    var q = A.queue();
    return wrap({
      title: 'Overview', crumb: '',
      html: hero() + overview([
        tile({ art: 'movements', title: 'Files sent to me', sub: 'Every file marked to you', go: 'routing', tab: 'active' }),
        tile({ ico: 'inbox', title: 'Files to act on', sub: q.length ? A.plural(q.length, 'file', 'files') + ' waiting' : 'You’re up to date', go: 'queue', badge: q.length, counted: true }),
        tile({ ico: 'users', title: 'Delegated by me', sub: A.plural(delegated().length, 'file', 'files') + ' with your team', go: 'delegated', counted: true }),
        tile({ ico: 'check', title: 'Acted on', sub: A.plural(actedOn().length, 'file', 'files') + ' returned', go: 'acted', counted: true }),
        tile({ art: 'tasks', title: 'My tasks', sub: 'Approvals waiting on you', go: 'tasks', badge: A.myTasks().length }),
        tile({ art: 'files', title: 'All files', sub: 'Browse files and letters', go: 'files' })
      ], '<section class="qb-glass qb-panel"><div class="qb-panel__head"><h2>Files to act on</h2><span class="qb-badge">' + (S.outage ? '—' : q.length) + '</span></div>' +
        (S.outage ? errorState('files to act on') : fileTable('aq', q, [COL.ref, COL.marking, COL.due, COL.open], emptyState('Nothing to act on', 'Files marked to you appear here once the Registry dispatches them.'))) + '</section>'),
      mount: mountOverview
    });
  };
  function plural(n, one, many) { return A.plural(n, one, many); }
  X.queue = function () {
    return wrap({ title: 'Files to act on', crumb: 'Action Officer', html: pageHead('Files to act on', 'Record what you did, or delegate the file to someone in your team.') +
      '<section class="qb-glass qb-panel">' + (S.outage ? errorState('files to act on') : fileTable('aq2', A.queue(), [COL.ref, COL.marking, COL.since, COL.due], emptyState('Nothing to act on', 'Files marked to you appear here once the Registry dispatches them.'))) + '</section>' });
  };
  X.delegated = function () {
    return wrap({ title: 'Delegated by me', crumb: 'Action Officer', html: pageHead('Delegated by me', 'Files a member of your team is working on for you. You stay responsible for returning them.') +
      '<section class="qb-glass qb-panel">' + (S.outage ? errorState('delegated files') : fileTable('dl', delegated(), [COL.ref, COL.stage, COL.since, COL.due], emptyState('Nothing delegated', 'Use Delegate on a file to hand it to someone in your team.', 'users'))) + '</section>' });
  };
  X.acted = function () {
    return wrap({ title: 'Acted on', crumb: 'Action Officer', html: pageHead('Acted on', 'Files you returned to the Registry, newest first.') +
      '<section class="qb-glass qb-panel">' + (S.outage ? errorState('files you acted on') : fileTable('ac', actedOn(), [COL.ref, COL.outcome, COL.stage], emptyState('Nothing returned yet', '', 'check'))) + '</section>' });
  };

  /* ================= SHARED: files, search, tasks, settings ================= */
  function filesView() {
    var seg = S.ui.fseg || 'active', isReg = S.role === 'registry';
    var list = A.files(function (f) { return seg === 'all' || (seg === 'filed' ? f.stage === 'filed' : f.stage !== 'filed'); });
    return wrap({
      title: 'Files', crumb: 'Files',
      html: pageHead('Files', isReg ? 'Every file in the registry.' : 'Files you can open. Only the Registry opens files and records mail.', isReg ? '<button class="qb-btn qb-btn--primary" data-newfile>' + icon('plus') + ' Open a file</button>' : '') +
        '<section class="qb-glass qb-panel"><div class="toolbar"><div class="qb-seg" role="group" aria-label="Show">' + [['active', 'Active'], ['filed', 'Filed away'], ['all', 'All']].map(function (s) { return '<button aria-pressed="' + (s[0] === seg) + '" data-seg="' + s[0] + '">' + s[1] + '</button>'; }).join('') + '</div></div>' +
        (S.outage ? errorState('files') : fileTable('fl_' + seg, list, [COL.ref, COL.from, COL.stage, COL.due], emptyState('No files', '', 'folder'))) + '</section>',
      mount: function (root) {
        root.querySelectorAll('[data-seg]').forEach(function (b) { b.onclick = function () { S.ui.fseg = b.dataset.seg; A.rerender(); }; });
        var nf = root.querySelector('[data-newfile]'); if (nf) nf.onclick = createFile;
      }
    });
  }
  function searchView() {
    var q = S.q.toLowerCase();
    var list = q ? A.files(function (f) { return (f.ref + ' ' + f.subject + ' ' + f.docs.map(function (d) { return d.title + ' ' + d.from + ' ' + d.letterRef; }).join(' ')).toLowerCase().indexOf(q) >= 0; }) : [];
    return wrap({ title: 'Search', crumb: 'Search', html: pageHead(q ? 'Results for “' + S.q + '”' : 'Search', q ? A.plural(list.length, 'file matches', 'files match') + ' by reference, subject, sender or letter reference.' : 'Type in the search box above and press Enter.') +
      '<section class="qb-glass qb-panel">' + (S.outage ? errorState('search results') : fileTable('sr', list, [COL.ref, COL.from, COL.stage], emptyState(q ? 'Nothing matches' : 'Search files and letters', q ? 'Check the spelling, or search by file reference such as MOH/SDMS/NVS/4/12.' : '', 'search'))) + '</section>' });
  }
  function tasksView() {
    var u = A.me().id;
    var mine = S.data.tasks.filter(function (t) { return t.waitingOn === u; }), raised = S.data.tasks.filter(function (t) { return t.raisedBy === u; });
    function rows(list, canAct) {
      if (!list.length) return emptyState(canAct ? 'Nothing waiting on you' : 'You haven’t raised any requests', '', 'tasks');
      return '<table class="qb-table"><thead><tr><th scope="col">Request</th><th scope="col">Raised</th><th scope="col">' + (canAct ? 'Raised by' : 'Waiting on') + '</th><th scope="col">Status</th>' + (canAct ? '<th scope="col"><span class="sr">Actions</span></th>' : '') + '</tr></thead><tbody>' + list.map(function (t) {
        var over = t.status === 'waiting' && A.daysUntil(t.due) < 0;
        var st = t.status === 'waiting' ? (over ? '<span class="qb-badge qb-badge--danger">Overdue · ' + fmtDate(t.due) + '</span>' : '<span class="qb-badge qb-badge--warning">Due ' + fmtDate(t.due) + '</span>') : t.status === 'approved' ? '<span class="qb-badge qb-badge--success">Approved</span>' : '<span class="qb-badge qb-badge--danger">Sent back</span>';
        var who = person(canAct ? t.raisedBy : t.waitingOn);
        return '<tr><td><b>' + esc(t.title) + '</b><span class="sub">' + esc(t.type) + '</span></td><td class="tnum">' + fmtDate(t.at) + '</td><td>' + esc(who.name) + '<span class="sub">' + esc(who.title) + '</span></td><td>' + st + '</td>' +
          (canAct ? '<td>' + (t.status === 'waiting' ? '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="qb-btn qb-btn--primary qb-btn--sm" data-approve="' + t.id + '">Approve</button><button class="qb-btn qb-btn--secondary qb-btn--sm" data-sendback="' + t.id + '">Send back</button></div>' : '') + '</td>' : '') + '</tr>';
      }).join('') + '</tbody></table>';
    }
    return wrap({
      title: 'My tasks', crumb: 'Manage',
      html: pageHead('My tasks', 'Approvals waiting on you, and requests you raised.') +
        '<div class="qb-alert">' + icon('info') + '<div><b>Requests never come back to the person who raised them</b>Anything you raise goes to a different approver, so no one approves their own request.</div></div>' +
        (S.outage ? errorState('your tasks') :
        '<section class="qb-glass qb-panel"><div class="qb-panel__head"><h2>Waiting on you</h2></div><div class="qb-table-wrap">' + rows(mine, true) + '</div></section>' +
        '<section class="qb-glass qb-panel"><div class="qb-panel__head"><h2>Raised by you</h2></div><div class="qb-table-wrap">' + rows(raised, false) + '</div></section>'),
      mount: function (root) {
        root.querySelectorAll('[data-approve],[data-sendback]').forEach(function (b) {
          b.onclick = function () { var id = b.dataset.approve || b.dataset.sendback, t = S.data.tasks.filter(function (x) { return x.id === id; })[0]; A.act.approveTask(t, !!b.dataset.approve); A.toast(b.dataset.approve ? 'Approved: ' + t.title : 'Sent back to ' + person(t.raisedBy).name); A.rerender(); };
        });
      }
    });
  }
  function settingsView() {
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    return wrap({
      title: 'Settings', crumb: 'Manage',
      html: pageHead('Settings', 'Preferences for this browser.') +
        '<section class="qb-glass qb-panel"><div class="qb-card"><div class="form"><div><div class="h3">Appearance</div><p class="ink2" style="margin-top:4px">Choose light or dark. The toggle in the top bar does the same.</p></div>' +
        '<div class="qb-seg" role="group" aria-label="Theme"><button aria-pressed="' + !dark + '" data-theme-set="light">Light</button><button aria-pressed="' + dark + '" data-theme-set="dark">Dark</button></div></div></div></section>' +
        '<section class="qb-glass qb-panel"><div class="qb-card"><div class="form"><div><div class="h3">Demo</div><p class="ink2" style="margin-top:4px">These controls exist only in the demo.</p></div>' +
        '<label class="qb-switch"><input type="checkbox" id="set-outage"' + (S.outage ? ' checked' : '') + '> Simulate a records service outage</label>' +
        '<div><button class="qb-btn qb-btn--secondary" data-reset-demo>' + icon('refresh') + ' Reset demo data</button></div></div></div></section>',
      mount: function (root) {
        root.querySelectorAll('[data-theme-set]').forEach(function (b) { b.onclick = function () { QBits.setTheme(b.dataset.themeSet); A.rerender(); }; });
        root.querySelector('#set-outage').onchange = function (e) { A.setOutage(e.target.checked); };
        root.querySelector('[data-reset-demo]').onclick = function () { A.resetDemo(); };
      }
    });
  }
  ['registry', 'marking', 'action'].forEach(function (r) {
    A.views[r].files = filesView; A.views[r].search = searchView; A.views[r].tasks = tasksView; A.views[r].settings = settingsView; A.views[r].file = fileView;
  });

  /* ================= FILE PAGE ================= */
  var JOURNEY = ['Received', 'Marking', 'Back to Registry', 'Action', 'Back to Registry', 'Filed'];
  var IDX = { registry: 0, marking: 1, 'returned-marking': 2, action: 3, 'returned-action': 4, filed: 5 };
  function journey(f) {
    var cur = IDX[f.stage];
    return '<div class="journey-wrap"><ol class="qb-steps" aria-label="File journey">' + JOURNEY.map(function (s, i) {
      var done = i < cur || f.stage === 'filed';
      return '<li class="qb-step' + (done ? ' is-done' : i === cur ? ' is-current' : '') + '"' + (i === cur && !done ? ' aria-current="step"' : '') + '><span class="qb-step__n">' + (done ? '✓' : i + 1) + '</span>' + s + '</li>';
    }).join('') + '</ol></div>';
  }
  function fileView(id) {
    var f = A.file(id);
    if (S.outage) return wrap({ title: 'File', crumb: 'Files', html: errorState('this file') });
    if (!f) return wrap({ title: 'File not found', crumb: 'Files', html: '<div class="qb-card">' + emptyState('This file doesn’t exist', 'It may have been removed when the demo data was reset.', 'folder') + '</div>' });
    var back = S.ui.from && S.ui.from !== 'file' ? S.ui.from : 'dashboard';
    var panel = actionPanel(f);
    var m = f.marking, a = f.action;
    return wrap({
      title: f.ref, crumb: 'Files',
      html: pageHead(f.subject, f.dept, '', { back: ['Back', back], over: f.ref, meta: A.stageBadge(f) + A.dueBadge(f).replace('class="muted"', 'class="hchip"').replace('class="tnum"', 'class="hchip"') }) +
        '<section class="qb-glass qb-panel"><div class="qb-panel__head"><h2>Journey</h2></div>' + journey(f) + '</section>' +
        '<div class="grid-2"><div class="stack">' +
          (panel ? '<section class="qb-glass qb-panel" id="act-panel">' + panel.html + '</section>' : '<div class="qb-alert">' + icon('info') + '<div><b>Nothing for you to do on this file right now</b>' + esc(whereText(f)) + '</div></div>') +
          '<section class="qb-glass qb-panel"><div class="qb-panel__head"><h2>Letters on this file</h2><span class="qb-badge">' + f.docs.length + '</span></div><div class="qb-card" style="padding:4px 20px">' +
            (f.docs.length ? f.docs.map(function (d) { return '<div class="doc-row"><span class="doc-ico">' + icon('file') + '</span><div class="grow"><b>' + esc(d.title) + '</b><span>' + esc(d.kind) + ' from ' + esc(d.from) + ' · received ' + fmtDate(d.received) + '</span></div><button class="qb-btn qb-btn--secondary qb-btn--sm" data-read="' + d.id + '">Read</button></div>'; }).join('') : emptyState('No letters yet', 'Record incoming mail into this file.', 'file')) +
          '</div></section>' +
        '</div><div class="stack">' +
          '<section class="qb-glass qb-panel"><div class="qb-panel__head"><h2>Details</h2></div><div class="qb-card"><dl class="kv">' +
            '<dt>With</dt><dd>' + esc(holderText(f)) + '</dd><dt>Since</dt><dd class="tnum">' + fmtDT(f.since) + '</dd>' +
            (m ? '<dt>Marked by</dt><dd>' + esc(person(m.by).name) + ', ' + fmtDate(m.at) + '</dd><dt>Marked to</dt><dd>' + esc(person(m.to).name) + '</dd><dt>Instruction</dt><dd>' + esc(m.instruction) + '</dd>' : '') +
            (a ? '<dt>Outcome</dt><dd>' + esc(outcomeText(a.outcome)) + '</dd>' : '') +
            (f.location ? '<dt>Stored at</dt><dd>' + esc(f.location) + '</dd>' : '') + '</dl>' +
            (m && m.remarks ? '<div class="quote" style="margin-top:14px"><span class="overline">Marking remarks</span>' + esc(m.remarks) + '</div>' : '') +
            (a ? '<div class="quote" style="margin-top:10px"><span class="overline">Action taken</span>' + esc(a.note) + '</div>' : '') +
          '</div></section>' +
          '<section class="qb-glass qb-panel"><div class="qb-panel__head"><h2>Movement history</h2></div><div class="qb-card"><ol class="timeline">' +
            f.history.slice().reverse().map(function (x) { return '<li><span></span><div><div class="t-what">' + esc(x.what) + '</div><div class="t-meta">' + esc(person(x.by).name) + ' · ' + fmtDT(x.at) + '</div>' + (x.note ? '<div class="t-note">' + esc(x.note) + '</div>' : '') + '</div></li>'; }).join('') +
          '</ol></div></section>' +
        '</div></div>',
      mount: function (root) {
        root.querySelectorAll('[data-read]').forEach(function (b) { b.onclick = function () { readLetter(f, b.dataset.read); }; });
        if (panel && panel.mount) panel.mount(root.querySelector('#act-panel'));
      }
    });
  }
  function readLetter(f, did) {
    var d = f.docs.filter(function (x) { return x.id === did; })[0];
    A.openModal({ title: d.title, wide: true, render: function (body, foot) {
      body.innerHTML = '<div class="letter"><div class="lh">' + esc(d.from) + ' · Ref ' + esc(d.letterRef || 'none') + ' · ' + fmtDate(d.letterDate) + '</div><div>' + esc(d.body || 'No summary recorded.') + '</div></div><p class="muted" style="margin-top:10px">Example letter text for this prototype.</p>';
      foot.innerHTML = '<button class="qb-btn qb-btn--secondary" data-x>Close</button>'; foot.querySelector('[data-x]').onclick = function () { A.closeModal(); };
    } });
  }

  /* ---------- the one thing each role does next on a file ---------- */
  function opts(ids, sel) { return ids.map(function (id) { var p = person(id); return '<option value="' + id + '"' + (id === sel ? ' selected' : '') + '>' + esc(p.name) + ' — ' + esc(p.title) + '</option>'; }).join(''); }
  function done(msg, f) { A.toast(msg); S.ui.from = S.ui.from || 'dashboard'; A.rerender(); }

  function actionPanel(f) {
    var role = S.role, u = A.me().id;
    if (role === 'registry' && f.stage === 'registry') return {
      html: '<div class="qb-panel__head"><h2>Send for marking</h2></div><div class="qb-card form"><p class="ink2">The file is in the Registry. Send it to a Marking Officer, who decides who acts on it.</p>' +
        '<label class="qb-field"><span class="qb-label">Marking Officer</span><select class="qb-select" id="mk-to">' + opts(E.MARKING_OFFICERS, 'vera') + '</select></label>' +
        '<div class="form-actions"><button class="qb-btn qb-btn--primary" data-do>' + icon('send') + ' Send for marking</button></div></div>',
      mount: function (p) { p.querySelector('[data-do]').onclick = function () { var to = p.querySelector('#mk-to').value; A.act.sendForMarking(f, to); done(f.ref + ' sent to ' + person(to).name + ' for marking'); }; }
    };
    if (role === 'registry' && f.stage === 'returned-marking') return {
      html: '<div class="qb-panel__head"><h2>Dispatch to the Action Officer</h2></div><div class="qb-card form"><div class="quote"><span class="overline">Marked by ' + esc(person(f.marking.by).name) + '</span>' + esc(f.marking.instruction) + ' → ' + esc(person(f.marking.to).name) + (f.marking.due ? ', due ' + fmtDate(f.marking.due) : '') + (f.marking.remarks ? '<br>' + esc(f.marking.remarks) : '') + '</div>' +
        '<label class="qb-check"><input type="checkbox" id="handover" checked> The physical file goes with it and is signed for on receipt</label>' +
        '<div class="form-actions"><button class="qb-btn qb-btn--primary" data-do>' + icon('route') + ' Dispatch to ' + esc(person(f.marking.to).name) + '</button></div></div>',
      mount: function (p) { p.querySelector('[data-do]').onclick = function () { A.act.dispatch(f); done(f.ref + ' dispatched to ' + person(f.marking.to).name); }; }
    };
    if (role === 'registry' && f.stage === 'returned-action') {
      var hasReply = f.action && f.action.outcome === 'reply';
      return {
        html: '<div class="qb-panel__head"><h2>File it away</h2></div><div class="qb-card form"><div class="quote"><span class="overline">' + esc(person(f.action.by).name) + ' · ' + esc(outcomeText(f.action.outcome)) + '</span>' + esc(f.action.note) + '</div>' +
          (hasReply ? '<label class="qb-check"><input type="checkbox" id="send-reply" checked> Send the reply to ' + esc(f.action.replyTo) + ' and add it to the outward register</label>' : '') +
          '<fieldset><legend class="qb-label">Where the file is stored</legend><div class="qb-form-grid">' +
          ['registry', 'cabinet', 'shelf'].map(function (k) { return '<label class="qb-field"><span class="qb-label">' + k.charAt(0).toUpperCase() + k.slice(1) + '</span><select class="qb-select" id="loc-' + k + '">' + E.LOCATIONS[k].map(function (o) { return '<option>' + o + '</option>'; }).join('') + '</select></label>'; }).join('') + '</div></fieldset>' +
          '<div class="form-actions"><button class="qb-btn qb-btn--primary" data-do>' + icon('archive') + ' File away</button></div></div>',
        mount: function (p) { p.querySelector('[data-do]').onclick = function () {
          var loc = ['registry', 'cabinet', 'shelf'].map(function (k) { return p.querySelector('#loc-' + k).value; }).join(' · ');
          var sr = p.querySelector('#send-reply'), out = A.act.fileAway(f, { location: loc, sendReply: sr && sr.checked });
          done(out ? 'Reply sent as ' + out + '. ' + f.ref + ' filed at ' + loc : f.ref + ' filed at ' + loc);
        }; }
      };
    }
    if (role === 'marking' && f.stage === 'marking' && f.holder === u) return {
      html: '<div class="qb-panel__head"><h2>Mark this file</h2></div><div class="qb-card"><form class="form" id="mark-form" novalidate>' +
        '<label class="qb-field"><span class="qb-label">Action Officer <span class="req">*</span></span><select class="qb-select" id="mk-officer">' + opts(E.ACTION_OFFICERS, 'virah') + '</select></label>' +
        '<fieldset><legend class="qb-label">Instruction <span class="req" style="color:var(--danger)">*</span></legend><div class="choices">' + E.INSTRUCTIONS.map(function (t, i) { return '<label class="qb-check"><input type="radio" name="mk-ins" value="' + esc(t) + '"' + (i === 0 ? ' checked' : '') + '> ' + esc(t) + '</label>'; }).join('') + '</div></fieldset>' +
        '<label class="qb-field" id="due-field"><span class="qb-label">Due date</span><input class="qb-input" type="date" id="mk-due" value="' + A.addDays(E.TODAY, 7) + '" min="' + E.TODAY + '"><span class="qb-hint">Leave a date even for “Please advise” so the file doesn’t stall.</span></label>' +
        '<label class="qb-field"><span class="qb-label">Remarks</span><textarea class="qb-textarea" id="mk-rem" placeholder="What should the officer do? This appears on the file."></textarea></label>' +
        '<div class="form-actions"><button class="qb-btn qb-btn--primary" type="submit">' + icon('pen') + ' Mark and return to Registry</button></div></form></div>',
      mount: function (p) {
        p.querySelector('#mark-form').onsubmit = function (e) {
          e.preventDefault();
          var ins = p.querySelector('input[name=mk-ins]:checked').value, due = p.querySelector('#mk-due').value, fld = p.querySelector('#due-field');
          var info = ins === 'For information and filing';
          if (!info && (!due || due < E.TODAY)) { fld.classList.add('is-error'); fld.querySelector('.qb-hint').textContent = 'Choose a due date from today onwards.'; p.querySelector('#mk-due').focus(); return; }
          var to = p.querySelector('#mk-officer').value;
          A.act.mark(f, { to: to, instruction: ins, due: info ? null : due, remarks: p.querySelector('#mk-rem').value.trim() });
          done(f.ref + ' marked to ' + person(to).name + ' and returned to the Registry');
        };
      }
    };
    if (role === 'action' && f.stage === 'action' && f.delegatedBy === u) return {
      html: '<div class="qb-panel__head"><h2>Delegated to ' + esc(person(f.holder).name) + '</h2></div><div class="qb-card form"><p class="ink2">' + esc(person(f.holder).name) + ' is working on this for you. Take the file back to finish it yourself and return it to the Registry.</p><div class="form-actions"><button class="qb-btn qb-btn--secondary" data-do>Take the file back</button></div></div>',
      mount: function (p) { p.querySelector('[data-do]').onclick = function () { var who = person(f.holder).name; A.act.takeBack(f); done('You took ' + f.ref + ' back from ' + who); }; }
    };
    if (role === 'action' && f.stage === 'action' && f.holder === u) {
      var mode = S.ui.amode || 'act', sender = f.docs[0] ? f.docs[0].from : '';
      return {
        html: '<div class="qb-panel__head"><h2>Act on this file</h2></div>' +
          '<div class="quote" style="margin-bottom:16px"><span class="overline">' + esc(f.marking.instruction) + ' · from ' + esc(person(f.marking.by).name) + '</span>' + esc(f.marking.remarks || 'No remarks.') + '</div>' +
          '<div class="qb-seg" role="group" aria-label="What do you want to do" style="margin-bottom:16px"><button aria-pressed="' + (mode === 'act') + '" data-mode="act">Record action</button><button aria-pressed="' + (mode === 'del') + '" data-mode="del">Delegate</button></div>' +
          '<div class="qb-card">' + (mode === 'act' ?
            '<form class="form" id="act-form" novalidate><label class="qb-field" id="note-field"><span class="qb-label">What did you do? <span class="req">*</span></span><textarea class="qb-textarea" id="ac-note" placeholder="e.g. Prepared the allocation plan with KEMSA delivery dates; draft reply attached for the PS."></textarea><span class="qb-hint">This is recorded on the file for the Registry and the Marking Officer.</span></label>' +
            '<fieldset><legend class="qb-label">Outcome</legend><div class="choices"><label class="qb-check"><input type="radio" name="ac-out" value="reply" checked> Reply is ready to send</label><label class="qb-check"><input type="radio" name="ac-out" value="done"> Action completed, nothing to send</label><label class="qb-check"><input type="radio" name="ac-out" value="none"> No action needed</label></div></fieldset>' +
            '<div class="qb-form-grid" id="reply-fields"><label class="qb-field"><span class="qb-label">Reply to</span><input class="qb-input" id="ac-to" value="' + esc(sender) + '"></label><label class="qb-field"><span class="qb-label">Reply subject</span><input class="qb-input" id="ac-subj" value="Re: ' + esc(f.docs[0] ? f.docs[0].title : f.subject) + '"></label></div>' +
            '<div class="form-actions"><button class="qb-btn qb-btn--primary" type="submit">' + icon('check') + ' Return to Registry</button></div></form>'
            :
            '<form class="form" id="del-form" novalidate><label class="qb-field"><span class="qb-label">Delegate to</span><select class="qb-select" id="dl-to">' + opts(E.DELEGATES[u] || [], '') + '</select></label>' +
            '<label class="qb-field"><span class="qb-label">Due back to you</span><input class="qb-input" type="date" id="dl-due" value="' + (f.due || A.addDays(E.TODAY, 3)) + '" min="' + E.TODAY + '"></label>' +
            '<label class="qb-field"><span class="qb-label">Note</span><textarea class="qb-textarea" id="dl-note" placeholder="What should they do?"></textarea></label>' +
            '<div class="form-actions"><button class="qb-btn qb-btn--primary" type="submit">' + icon('users') + ' Delegate file</button></div></form>') + '</div>',
        mount: function (p) {
          p.querySelectorAll('[data-mode]').forEach(function (b) { b.onclick = function () { S.ui.amode = b.dataset.mode; A.rerender(); }; });
          var af = p.querySelector('#act-form');
          if (af) {
            var rf = p.querySelector('#reply-fields');
            p.querySelectorAll('input[name=ac-out]').forEach(function (r) { r.onchange = function () { rf.hidden = p.querySelector('input[name=ac-out]:checked').value !== 'reply'; }; });
            af.onsubmit = function (e) {
              e.preventDefault();
              var note = p.querySelector('#ac-note').value.trim(), fld = p.querySelector('#note-field');
              if (!note) { fld.classList.add('is-error'); fld.querySelector('.qb-hint').textContent = 'Say what you did so the Registry can file it correctly.'; p.querySelector('#ac-note').focus(); return; }
              var out = p.querySelector('input[name=ac-out]:checked').value;
              A.act.recordAction(f, { outcome: out, note: note, replyTo: p.querySelector('#ac-to').value.trim(), replySubject: p.querySelector('#ac-subj').value.trim() });
              S.ui.amode = 'act'; done(f.ref + ' returned to the Registry');
            };
          }
          var df = p.querySelector('#del-form');
          if (df) df.onsubmit = function (e) {
            e.preventDefault(); var to = p.querySelector('#dl-to').value;
            A.act.delegate(f, { to: to, due: p.querySelector('#dl-due').value, note: p.querySelector('#dl-note').value.trim() });
            S.ui.amode = 'act'; done(f.ref + ' delegated to ' + person(to).name);
          };
        }
      };
    }
    return null;
  }

  /* ================= REGISTRY FLOWS ================= */
  function field(id, label, input, hint, req) { return '<label class="qb-field" id="fld-' + id + '"><span class="qb-label">' + label + (req ? ' <span class="req">*</span>' : '') + '</span>' + input + '<span class="qb-hint">' + (hint || '') + '</span></label>'; }
  function setErr(root, id, msg) {
    var f = root.querySelector('#fld-' + id), h = f.querySelector('.qb-hint'), inp = f.querySelector('input,select,textarea');
    if (!f.dataset.hint) f.dataset.hint = h.textContent;
    f.classList.add('is-error'); h.textContent = msg; h.id = 'hint-' + id; inp.setAttribute('aria-invalid', 'true'); inp.setAttribute('aria-describedby', h.id);
    return inp;
  }
  function clearErr(f) { f.classList.remove('is-error'); var h = f.querySelector('.qb-hint'); h.textContent = f.dataset.hint || ''; var i = f.querySelector('input,select,textarea'); if (i) i.removeAttribute('aria-invalid'); }
  function refTaken(ref) { return A.files(function (f) { return f.ref.toLowerCase() === ref.toLowerCase(); })[0]; }

  function recordMail() {
    var m = { from: '', subject: '', letterRef: '', letterDate: '', received: E.TODAY, kind: 'Letter', summary: '', fileMode: 'existing', fileId: '', newRef: '', newSubject: '', newDept: 'National Vaccination Services', sendTo: 'vera' }, step = 0;
    var steps = ['Letter', 'File', 'Send', 'Check'];
    A.openModal({ title: 'Record incoming mail', wide: true, render: function (body, foot) {
      function draw() {
        var html = '<ol class="qb-steps">' + steps.map(function (s, i) { return '<li class="qb-step' + (i < step ? ' is-done' : i === step ? ' is-current' : '') + '"' + (i === step ? ' aria-current="step"' : '') + '><span class="qb-step__n">' + (i < step ? '✓' : i + 1) + '</span>' + s + '</li>'; }).join('') + '</ol>';
        if (step === 0) html += '<div class="qb-form-grid">' + field('from', 'From', '<input class="qb-input" id="m-from" value="' + esc(m.from) + '" placeholder="e.g. County Director of Health, Nyeri">', '', true) +
          field('subject', 'Subject', '<input class="qb-input" id="m-subject" value="' + esc(m.subject) + '" placeholder="What the letter is about">', '', true) +
          field('letterRef', 'Their reference', '<input class="qb-input" id="m-letterRef" value="' + esc(m.letterRef) + '" placeholder="e.g. NYR/CDH/14/26">', 'As printed on the letter') +
          field('letterDate', 'Letter date', '<input class="qb-input" type="date" id="m-letterDate" value="' + esc(m.letterDate) + '" max="' + E.TODAY + '">') +
          field('received', 'Received', '<input class="qb-input" type="date" id="m-received" value="' + esc(m.received) + '" max="' + E.TODAY + '">', '', true) +
          field('kind', 'Type', '<select class="qb-select" id="m-kind">' + ['Letter', 'Memo', 'Circular', 'Report', 'Invoice'].map(function (k) { return '<option' + (k === m.kind ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select>') + '</div>' +
          '<div style="height:16px"></div>' + field('summary', 'Summary', '<textarea class="qb-textarea" id="m-summary" placeholder="One or two lines so the Marking Officer can see what it is about">' + esc(m.summary) + '</textarea>');
        if (step === 1) {
          var active = A.files().slice().sort(function (a, b) { return a.ref < b.ref ? -1 : 1; });
          html += '<fieldset><legend class="qb-label">Which file does this letter go into?</legend><div class="choices--row"><label class="qb-check"><input type="radio" name="fm" value="existing"' + (m.fileMode === 'existing' ? ' checked' : '') + '> An existing file</label><label class="qb-check"><input type="radio" name="fm" value="new"' + (m.fileMode === 'new' ? ' checked' : '') + '> Open a new file</label></div></fieldset><div style="height:16px"></div>' +
            (m.fileMode === 'existing' ? field('fileId', 'File', '<select class="qb-select" id="m-fileId"><option value="">Choose a file</option>' + active.map(function (f) { return '<option value="' + f.id + '"' + (f.id === m.fileId ? ' selected' : '') + '>' + esc(f.ref + ' — ' + f.subject) + (f.stage !== 'registry' && f.stage !== 'filed' ? ' (' + A.stage(f.stage).label + ')' : '') + '</option>'; }).join('') + '</select>', 'Files away from the Registry are listed with where they are.', true)
            : '<div class="qb-form-grid">' + field('newSubject', 'File subject', '<input class="qb-input" id="m-newSubject" value="' + esc(m.newSubject || m.subject) + '">', '', true) + field('newRef', 'File reference', '<input class="qb-input" id="m-newRef" value="' + esc(m.newRef) + '" placeholder="MOH/SDMS/NVS/4/' + S.data.seq.file + '">', 'Must be unique in the registry', true) +
              field('newDept', 'Department', '<select class="qb-select" id="m-newDept">' + ['National Vaccination Services', 'Health Products and Technologies', 'Medical Services', 'Administration'].map(function (d) { return '<option' + (d === m.newDept ? ' selected' : '') + '>' + d + '</option>'; }).join('') + '</select>') + '</div>');
        }
        if (step === 2) {
          var ef = m.fileMode === 'existing' && A.file(m.fileId), away = ef && ef.stage !== 'registry' && ef.stage !== 'filed';
          html += (away ? '<div class="qb-alert qb-alert--warning" style="margin-bottom:16px">' + icon('alert') + '<div><b>' + esc(ef.ref) + ' is ' + esc(A.stage(ef.stage).label.toLowerCase()) + '</b>The letter is added to the file and the officer holding it is told. It isn’t sent for marking again.</div></div>' : '') +
            '<fieldset' + (away ? ' disabled' : '') + '><legend class="qb-label">What happens next</legend><div class="choices"><label class="qb-check"><input type="radio" name="st" value="send"' + (m.sendTo && !away ? ' checked' : '') + '> Send for marking now</label><label class="qb-check"><input type="radio" name="st" value="keep"' + (!m.sendTo || away ? ' checked' : '') + '> Keep in the Registry for now</label></div></fieldset><div style="height:16px"></div>' +
            (away ? '' : field('sendTo', 'Marking Officer', '<select class="qb-select" id="m-sendTo">' + opts(E.MARKING_OFFICERS, m.sendTo || 'vera') + '</select>'));
        }
        if (step === 3) {
          var tf = m.fileMode === 'new' ? m.newRef + ' (new file)' : A.file(m.fileId).ref, nx = S.data.seq.in;
          html += '<div class="qb-card"><dl class="kv"><dt>Entry number</dt><dd class="tnum">IN/2026/' + String(nx).padStart(4, '0') + '</dd><dt>From</dt><dd>' + esc(m.from) + '</dd><dt>Subject</dt><dd>' + esc(m.subject) + '</dd><dt>Received</dt><dd>' + fmtDate(m.received) + '</dd><dt>Into file</dt><dd>' + esc(tf) + '</dd><dt>Next</dt><dd>' + (m.sendTo ? 'Sent to ' + esc(person(m.sendTo).name) + ' for marking' : 'Stays in the Registry') + '</dd></dl></div>';
        }
        body.innerHTML = html;
        foot.innerHTML = (step ? '<button class="qb-btn qb-btn--secondary" data-back>Back</button>' : '<button class="qb-btn qb-btn--secondary" data-x>Cancel</button>') + '<button class="qb-btn qb-btn--primary" data-next>' + (step === 3 ? 'Record mail' : 'Continue') + '</button>';
        var bk = foot.querySelector('[data-back]'); if (bk) bk.onclick = function () { read(); step--; draw(); };
        var x = foot.querySelector('[data-x]'); if (x) x.onclick = function () { A.closeModal(); };
        foot.querySelector('[data-next]').onclick = next;
        body.querySelectorAll('input[name=fm]').forEach(function (r) { r.onchange = function () { read(); m.fileMode = r.value; draw(); }; });
        body.querySelectorAll('input[name=st]').forEach(function (r) { r.onchange = function () { var s = body.querySelector('#fld-sendTo'); if (s) s.hidden = r.value === 'keep'; }; });
        var stK = body.querySelector('input[name=st][value=keep]'); if (stK && stK.checked) { var s2 = body.querySelector('#fld-sendTo'); if (s2) s2.hidden = true; }
        var firstI = body.querySelector('input:not([type=radio]),select,textarea'); if (firstI) firstI.focus();
      }
      function val(id) { var el = body.querySelector('#m-' + id); return el ? el.value.trim() : m[id]; }
      function read() {
        ['from', 'subject', 'letterRef', 'letterDate', 'received', 'kind', 'summary', 'fileId', 'newRef', 'newSubject', 'newDept', 'sendTo'].forEach(function (k) { if (body.querySelector('#m-' + k)) m[k] = val(k); });
        var st = body.querySelector('input[name=st]:checked');
        if (st) { if (st.value === 'keep' || st.closest('fieldset').disabled) m.sendTo = ''; else if (!m.sendTo) m.sendTo = 'vera'; }
      }
      function next() {
        read(); var bad = null;
        function err(id, msg) { var el = setErr(body, id, msg); bad = bad || el; }
        body.querySelectorAll('.qb-field.is-error').forEach(clearErr);
        if (step === 0) {
          if (!m.from) err('from', 'Enter who sent the letter.');
          if (!m.subject) err('subject', 'Enter the subject so the file can be found later.');
          if (!m.received || m.received > E.TODAY) err('received', 'Enter the date it reached the Registry, today or earlier.');
        }
        if (step === 1) {
          if (m.fileMode === 'existing' && !m.fileId) err('fileId', 'Choose the file, or open a new one.');
          if (m.fileMode === 'new') {
            if (!m.newSubject) err('newSubject', 'Enter the file subject.');
            var t = m.newRef && refTaken(m.newRef);
            if (!m.newRef) err('newRef', 'Enter a file reference such as MOH/SDMS/NVS/4/' + S.data.seq.file + '.');
            else if (t) err('newRef', m.newRef + ' is already used by “' + t.subject + '”. Choose another number.');
          }
        }
        if (step === 2) { var ef = m.fileMode === 'existing' && A.file(m.fileId); if (ef && ef.stage !== 'registry' && ef.stage !== 'filed') m.sendTo = ''; }
        if (bad) { bad.focus(); return; }
        if (step < 3) { step++; draw(); return; }
        if (m.fileMode === 'new') S.data.seq.file++;
        var ex = m.fileMode === 'existing' && A.file(m.fileId), away = ex && ex.stage !== 'registry' && ex.stage !== 'filed';
        if (away) { var hold = ex.stage, holder = ex.holder; }
        var r = A.act.recordMail(m);
        if (away) { r.file.stage = hold; r.file.holder = holder; A.save(); }
        A.closeModal(true); S.ui.from = 'inward';
        A.toast('Recorded ' + r.no + (m.sendTo ? ' and sent ' + r.file.ref + ' to ' + person(m.sendTo).name : ' into ' + r.file.ref));
        A.go('file', r.file.id);
      }
      draw();
    } });
  }
  function createFile() {
    A.openModal({ title: 'Open a file', render: function (body, foot) {
      body.innerHTML = '<div class="form">' + field('subject', 'Subject', '<input class="qb-input" id="nf-subject" placeholder="e.g. Measles outbreak response, Mandera">', '', true) +
        field('ref', 'File reference', '<input class="qb-input" id="nf-ref" placeholder="MOH/SDMS/NVS/4/' + S.data.seq.file + '">', 'Must be unique in the registry', true) +
        field('dept', 'Department', '<select class="qb-select" id="nf-dept"><option>National Vaccination Services</option><option>Health Products and Technologies</option><option>Medical Services</option><option>Administration</option></select>') +
        '<div class="qb-alert">' + icon('info') + '<div>Ordinary files open straight away. Temporary and personnel files go to the Records Manager for approval.</div></div></div>';
      foot.innerHTML = '<button class="qb-btn qb-btn--secondary" data-x>Cancel</button><button class="qb-btn qb-btn--primary" data-ok>Open file</button>';
      foot.querySelector('[data-x]').onclick = function () { A.closeModal(); };
      foot.querySelector('[data-ok]').onclick = function () {
        var s = body.querySelector('#nf-subject').value.trim(), r = body.querySelector('#nf-ref').value.trim(), bad = null, t = r && refTaken(r);
        function err(id, msg) { var el = setErr(body, id, msg); bad = bad || el; }
        body.querySelectorAll('.qb-field.is-error').forEach(clearErr);
        if (!s) err('subject', 'Enter what the file is about.');
        if (!r) err('ref', 'Enter a file reference.');
        else if (t) err('ref', r + ' is already used by “' + t.subject + '”. Choose another number.');
        if (bad) { bad.focus(); return; }
        S.data.seq.file++;
        var f = A.act.createFile({ subject: s, ref: r, dept: body.querySelector('#nf-dept').value });
        A.closeModal(true); A.toast('Opened ' + f.ref); A.go('file', f.id);
      };
    } });
  }

  /* ================= USER MANUAL (AI hub) ================= */
  /* ================= USER GUIDE + TUTORIAL MODE ================= */
  var GUIDE = [
    { id: 'start', title: 'Getting started', role: 'All roles', steps: [
      { img: '01-sign-in', h: 'Sign in', t: 'Use your Q-BITS ERP work email and password, or Continue with Microsoft. Your role, department and the files you can see come from the ERP.' },
      { img: '02-registry-overview', h: 'Your overview', t: 'The menu runs along the top. Tiles open your daily work and show how many items are waiting. Recent notifications and AI suggestions sit on the left. Every page has search, notifications and light or dark mode at the top right.', role: 'registry', view: 'dashboard' }
    ] },
    { id: 'registry', title: 'Registry Officer: receive and route', role: 'Registry Officer', steps: [
      { img: '03-record-mail', h: 'Record incoming mail', t: 'Choose Record incoming mail. Enter who sent the letter and what it is about, pick the file it belongs to (or open a new one), choose the Marking Officer, then check and save. The letter gets an inward number such as IN/2026/0423.', role: 'registry', view: 'inward' },
      { img: '05-send-for-marking', h: 'Send a file for marking', t: 'A file waiting in the Registry shows Send for marking. Pick the Marking Officer and send it. The journey bar at the top of the file shows where it is.', role: 'registry', view: 'routing', arg: 'registry' },
      { img: '04-file-routing', h: 'Track every file', t: 'File Routing lists every file and who has it. Search by file number, subject, sender or officer, and use the stage dropdown to see only files in the Registry, with the Marking Officer, back from marking, with an Action Officer, back from action or filed away.', role: 'registry', view: 'routing' }
    ] },
    { id: 'marking', title: 'Marking Officer: mark the file', role: 'Marking Officer', steps: [
      { img: '06-mark-file', h: 'Mark a file to an Action Officer', t: 'Open a file from Files to mark and read the letter. Choose the Action Officer, the instruction and a due date, and add remarks. Mark and return to Registry sends it back for dispatch.', role: 'marking', view: 'queue' }
    ] },
    { id: 'dispatch', title: 'Registry Officer: dispatch', role: 'Registry Officer', steps: [
      { img: '07-dispatch', h: 'Dispatch to the Action Officer', t: 'Files back from marking show the marking instruction. Confirm the physical file goes with it, then dispatch it to the officer named in the marking.', role: 'registry', view: 'routing', arg: 'returned-marking' }
    ] },
    { id: 'action', title: 'Action Officer: act or delegate', role: 'Action Officer', steps: [
      { img: '08-act-on-file', h: 'Record what you did', t: 'Open a file from Files to act on. Record what you did and the outcome: a reply is ready, the action is complete, or no action is needed. Return to Registry sends it back. Use Delegate to hand it to someone in your team; you can take it back at any time.', role: 'action', view: 'queue' }
    ] },
    { id: 'close', title: 'Registry Officer: file it away', role: 'Registry Officer', steps: [
      { img: '09-file-away', h: 'Send the reply and file it away', t: 'When a file comes back from action, send any reply (it is added to the outward register as OUT/2026/…) and record the registry, cabinet and shelf where the file is stored.', role: 'registry', view: 'routing', arg: 'returned-action' },
      { img: '10-my-tasks', h: 'Approvals in My tasks', t: 'Approvals waiting on you are listed first, with Approve and Send back. Requests you raise always go to someone else, so nobody approves their own request.', role: 'registry', view: 'tasks' }
    ] }
  ];
  function guideView() {
    var n = 0;
    return wrap({
      title: 'User guide', crumb: '',
      html: pageHead('User guide', 'How a letter moves through EDRMS, from the Registry to the Marking Officer and the Action Officer and back, with pictures of each screen.',
        '<button class="btn-white" data-tutorial>' + icon('play') + ' Start tutorial mode</button>') +
        '<section class="qb-glass qb-panel guide-intro"><div class="tut-banner"><span class="tut-ic">' + icon('play') + '</span><div><b>Tutorial mode</b><p>Walks you through the real screens one step at a time, switching roles as the file moves. Nothing is saved or sent while you follow it.</p></div><button class="qb-btn qb-btn--primary" data-tutorial>Start tutorial mode</button></div>' +
        '<nav class="guide-toc" aria-label="Guide sections">' + GUIDE.map(function (g) { return '<a href="#" data-gjump="' + g.id + '">' + esc(g.title) + '</a>'; }).join('') + '</nav></section>' +
        GUIDE.map(function (g) {
          return '<section class="qb-glass qb-panel guide-sec" id="g-' + g.id + '"><div class="qb-panel__head"><h2>' + esc(g.title) + '</h2><span class="qb-badge">' + esc(g.role) + '</span></div>' +
            g.steps.map(function (st) { n++;
              return '<article class="g-step"><div class="g-text"><span class="g-n">' + n + '</span><div><h3>' + esc(st.h) + '</h3><p>' + esc(st.t) + '</p>' +
                (st.view ? '<button class="btn-open" data-try="' + st.role + '|' + st.view + '|' + (st.arg || '') + '">Open this screen ' + icon('chevronR') + '</button>' : '') + '</div></div>' +
                '<button type="button" class="g-shot" data-zoom="' + st.img + '" data-alt="' + esc(st.h) + '" aria-label="Enlarge screenshot: ' + esc(st.h) + '"><img src="assets/guide/' + st.img + '.jpg" alt="Screenshot: ' + esc(st.h) + '" loading="lazy"></button></article>';
            }).join('') + '</section>';
        }).join(''),
      mount: function (root) {
        root.querySelectorAll('[data-tutorial]').forEach(function (b) { b.onclick = function () { tutorial.start(); }; });
        root.querySelectorAll('[data-gjump]').forEach(function (b) { b.onclick = function (e) { e.preventDefault(); var t = document.getElementById('g-' + b.dataset.gjump); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }; });
        root.querySelectorAll('[data-try]').forEach(function (b) { b.onclick = function () { var p = b.dataset.try.split('|'); A.go(p[1], p[2], p[0]); }; });
        root.querySelectorAll('[data-zoom]').forEach(function (b) { b.onclick = function () {
          A.openModal({ title: b.dataset.alt, wide: true, render: function (body, foot) { body.innerHTML = '<img class="zoom-img" src="assets/guide/' + b.dataset.zoom + '.jpg" alt="Screenshot: ' + esc(b.dataset.alt) + '">'; foot.innerHTML = '<button class="qb-btn qb-btn--primary" data-x>Close</button>'; foot.querySelector('[data-x]').onclick = function () { A.closeModal(); }; } });
        }; });
      }
    });
  }
  ['registry', 'marking', 'action'].forEach(function (r) { A.views[r].guide = guideView; });

  /* Tutorial mode: spotlight one element on the live screen with a step card beside it */
  function firstOf(stage, holder) { var f = A.files(function (x) { return x.stage === stage && (!holder || x.holder === holder); })[0]; return f && f.id; }
  var TOUR = [
    { role: 'registry', view: 'dashboard', sel: '.dash-hello', h: 'Welcome to EDRMS', t: 'This tour follows one file from the Registry to the Marking Officer and the Action Officer and back. You’re starting as Henry, the Registry Officer.' },
    { role: 'registry', view: 'dashboard', sel: '.topnav', h: 'The menu', t: 'Everything you do lives here. Red numbers show work waiting for you.' },
    { role: 'registry', view: 'dashboard', sel: '[data-record]', h: 'Record incoming mail', t: 'Every letter starts here. You enter the letter, pick its file and choose a Marking Officer.' },
    { role: 'registry', view: 'routing', sel: '.route-tools', h: 'File Routing', t: 'See every file and who has it. Search by file, subject or officer, and use the stage dropdown to filter the list.' },
    { role: 'registry', view: 'file', arg: function () { return firstOf('registry'); }, sel: '#act-panel', h: 'Send for marking', t: 'A file in the Registry is sent to a Marking Officer from here.' },
    { role: 'marking', view: 'dashboard', sel: '.tiles', h: 'The Marking Officer’s overview', t: 'Now you’re Vera, the Marking Officer. Files to mark shows what the Registry sent.' },
    { role: 'marking', view: 'file', arg: function () { return firstOf('marking', 'vera'); }, sel: '#act-panel', h: 'Mark the file', t: 'Choose the Action Officer, the instruction and a due date, then return the file to the Registry.' },
    { role: 'registry', view: 'file', arg: function () { return firstOf('returned-marking'); }, sel: '#act-panel', h: 'Dispatch it', t: 'Back with Henry: the marked file is dispatched to the Action Officer named in the marking.' },
    { role: 'action', view: 'file', arg: function () { return firstOf('action', 'virah'); }, sel: '#act-panel', h: 'Act or delegate', t: 'Now you’re Virah, the Action Officer. Record what you did, or delegate the file to your team.' },
    { role: 'registry', view: 'file', arg: function () { return firstOf('returned-action'); }, sel: '#act-panel', h: 'File it away', t: 'The Registry sends any reply out and records where the file is stored. The journey is complete.' },
    { role: 'registry', view: 'tasks', sel: '#view .qb-panel', h: 'My tasks', t: 'Approvals waiting on you. Requests never come back to the person who raised them.' },
    { role: 'registry', view: 'guide', sel: '.guide-toc', h: 'That’s the tour', t: 'Come back to the User guide any time from the menu or the Q-BITS AI button. You can restart the tour from here.' }
  ];
  var tutorial = (function () {
    var i = -1, layer = null;
    function stop() { i = -1; if (layer) layer.remove(); layer = null; window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); A.tutorialActive = false; }
    function show(k) {
      i = Math.max(0, Math.min(k, TOUR.length - 1)); A.tutorialActive = true;
      var st = TOUR[i], arg = typeof st.arg === 'function' ? st.arg() : (st.arg || '');
      if (st.view === 'file' && !arg) { st = Object.assign({}, st, { view: 'routing', sel: '.route-tools', t: st.t + ' (No file is at this stage right now, so here is File Routing instead.)' }); arg = ''; }
      if (layer) layer.target = null;
      A.go(st.view, arg, st.role);
      setTimeout(function () { draw(st); }, 60);
    }
    function draw(st) {
      if (!layer) { layer = document.createElement('div'); layer.className = 'tut-layer'; document.body.appendChild(layer); window.addEventListener('resize', place); window.addEventListener('scroll', place, true); }
      var target = document.querySelector(st.sel) || document.querySelector('.phead');
      layer.innerHTML = '<div class="tut-spot" aria-hidden="true"></div><div class="tut-card" role="dialog" aria-modal="false" aria-labelledby="tut-h"><div class="tut-step">Tutorial · step ' + (i + 1) + ' of ' + TOUR.length + '</div><h3 id="tut-h">' + esc(st.h) + '</h3><p>' + esc(st.t) + '</p>' +
        '<div class="tut-bar"><button class="btn-open" data-tx>Exit tutorial</button><span class="tut-dots" aria-hidden="true">' + TOUR.map(function (_, k) { return '<i' + (k === i ? ' class="on"' : '') + '></i>'; }).join('') + '</span>' +
        '<button class="qb-btn qb-btn--secondary qb-btn--sm" data-tb' + (i === 0 ? ' disabled' : '') + '>Back</button><button class="qb-btn qb-btn--primary qb-btn--sm" data-tn>' + (i === TOUR.length - 1 ? 'Finish' : 'Next') + '</button></div></div>';
      layer.target = target;
      layer.querySelector('[data-tx]').onclick = stop;
      layer.querySelector('[data-tb]').onclick = function () { show(i - 1); };
      layer.querySelector('[data-tn]').onclick = function () { if (i === TOUR.length - 1) { stop(); A.toast('Tutorial finished'); } else show(i + 1); };
      target.scrollIntoView({ block: 'center' });
      place();
      layer.querySelector('[data-tn]').focus();
    }
    function place() {
      if (!layer || !layer.target) return;
      if (!document.body.contains(layer.target)) { stop(); return; } /* the viewer moved to another page */
      var r = layer.target.getBoundingClientRect(), spot = layer.querySelector('.tut-spot'), card = layer.querySelector('.tut-card'), pad = 8;
      spot.style.cssText = 'top:' + (r.top - pad) + 'px;left:' + (r.left - pad) + 'px;width:' + (r.width + pad * 2) + 'px;height:' + (r.height + pad * 2) + 'px';
      var cw = card.offsetWidth, ch = card.offsetHeight, vw = innerWidth, vh = innerHeight, top, left;
      if (vw < 640) { card.style.cssText = 'left:12px;right:12px;bottom:12px;top:auto;width:auto'; return; }
      left = Math.min(Math.max(16, r.left), vw - cw - 16);
      if (r.bottom + 16 + ch < vh) top = r.bottom + 16;
      else if (r.top - 16 - ch > 0) top = r.top - 16 - ch;
      else { top = Math.min(Math.max(16, r.top), vh - ch - 16); if (r.right + 16 + cw < vw) left = r.right + 16; else if (r.left - 16 - cw > 0) left = r.left - 16 - cw; else top = Math.max(16, vh - ch - 16); }
      card.style.cssText = 'top:' + top + 'px;left:' + left + 'px';
    }
    document.addEventListener('keydown', function (e) { if (i < 0) return; if (e.key === 'Escape') { stop(); } });
    return { start: function () { show(0); }, stop: stop };
  })();
  A.tutorial = tutorial;
  A.guide = function () { A.go('guide'); };

  A.boot();
})(window.App);
