/* ==========================================================================
   Q-BITS EDRMS — features carried over from the live system (edrms.qbits.africa)
   · Pending approvals (header button + page)        /workflows/approvals/pending
   · Messages (header button + chat inbox)             /communication/messages/inbox
   · Correspondence from officers (Registry)           /ed-mgt/correspondence-from-officers
   · Reports Dashboard                                 /ed-mgt/reports
   · Overview quick links, "Open Q-BITS AI", notification channel
   Loaded after app.js; uses its helpers and starts the first render.
   ========================================================================== */

/* ---------- seed data (added to saved state the first time) ---------- */
function ensureLive() {
  if (!S.approvals) S.approvals = [
    { id: 'ap22', no: 22, type: 'Document (EDMS) - HR Document', title: 'Staff establishment returns – October', approver: 'registry', by: 'virah', at: daysAgo(24, 10), due: daysAgo(23, 17), status: 'open', steps: 1, done: 0, fileId: 'f1' },
    { id: 'ap8', no: 8, type: 'Records - File opening request', title: 'Cold Chain Equipment Maintenance', approver: 'registry', by: 'henry', at: daysAgo(16, 9), due: daysAgo(15, 17), status: 'open', steps: 1, done: 0 },
    { id: 'ap11', no: 11, type: 'Records - File opening request', title: 'HR – Temporary personnel files', approver: 'registry', by: 'rachael', at: daysAgo(9, 11), due: daysAgo(8, 17), status: 'open', steps: 1, done: 0 },
    { id: 'ap13', no: 13, type: 'Document Upload Approval', title: 'Bulk upload – Supply Chain invoices (12 documents)', approver: 'registry', by: 'achieng', at: daysAgo(2, 14), due: daysAhead(1), status: 'open', steps: 2, done: 1, fileId: 'f11' },
    { id: 'ap14', no: 14, type: 'Records - File closing request', title: 'ICT Handover Report', approver: 'marking', by: 'john', at: daysAgo(1, 14), due: daysAhead(2), status: 'open', steps: 1, done: 0, fileId: 'f10' },
    { id: 'ap15', no: 15, type: 'Records - File disposal request', title: 'Q2 Invoices – retention ended', approver: 'marking', by: 'rachael', at: daysAgo(3, 10), due: daysAhead(4), status: 'open', steps: 2, done: 0, fileId: 'f11' },
    { id: 'ap31', no: 31, type: 'Document (EDMS) - Memo', title: 'ICT – Network upgrade schedule', approver: 'action', by: 'erickson', at: daysAgo(1, 9), due: daysAhead(3), status: 'open', steps: 1, done: 0 },
  ];
  if (!S.chats) S.chats = [
    { id: 'c1', title: 'Contract Document For NQCL-MOH', group: true, members: ['john', 'henry', 'virah'], msgs: [
      { by: 'john', at: daysAgo(26, 22, 21), text: 'Hello. Please share with me the contract document for NQCL-MOH.' },
      { sys: true, at: daysAgo(26, 22, 25), text: 'John Kimani added Brian Otieno' },
      { sys: true, at: daysAgo(26, 22, 26), text: 'John Kimani removed Brian Otieno' },
      { by: 'virah', at: daysAgo(25, 9, 4), text: 'Shared it in the IT Documents file, folio 3.' } ] },
    { id: 'c2', title: '', group: false, members: ['john', 'otieno'], msgs: [
      { by: 'otieno', at: daysAgo(40, 10, 2), text: 'Hi John, is the press statement file back with you?' },
      { by: 'john', at: daysAgo(40, 10, 9), text: 'Hello. How can I help you?' } ] },
    { id: 'c3', title: '', group: false, members: ['vera', 'john'], msgs: [
      { by: 'john', at: daysAgo(0, 9, 14), text: 'Senate of Kenya file is with you for marking. The hearing is on 6 Nov.' } ] },
    { id: 'c4', title: '', group: false, members: ['virah', 'erickson'], msgs: [
      { by: 'erickson', at: daysAgo(2, 15, 40), text: 'Can you confirm the vaccine stock figures for the memo?' } ] },
  ];
  if (!S.corr) S.corr = [
    { id: 'co1', subject: 'Correspondence', kind: 'letter', from: 'erickson', goes: 'External', to: 'The Director, KEMSA', at: daysAgo(0, 6, 2), status: 'waiting', body: 'Request for the delivery schedule of ICT equipment for the county vaccine stores.' },
    { id: 'co2', subject: 'Letter 1', kind: 'letter', from: 'erickson', goes: 'External', to: 'The Chief Executive Officer, KMPDC', at: daysAgo(0, 6, 50), status: 'waiting', body: 'Follow-up on the data-sharing agreement for practitioner records.' },
    { id: 'co3', subject: 'Staff meeting – Friday', kind: 'memo', from: 'virah', goes: 'Internal', to: 'All staff, National Vaccines and Immunization Programme', at: daysAgo(3, 11), status: 'recorded', fileId: 'f1', recordedAt: daysAgo(3, 14), body: 'All staff are requested to attend the monthly staff meeting on Friday at 10.00 a.m.' },
  ];
  S.chats.forEach(c => { c.read = c.read || {}; });
}
ensureLive();

/* The kinds offered under "What are you writing?" in the live Start new correspondence */
const CORR_KINDS = [
  ['letter', 'Official Letter', "A letter to a person or an office, in the ministry's letterhead."],
  ['forwarding', 'Forwarding Letter', 'Sends a document or a file on, with a short covering note.'],
  ['memo', 'Internal Memo', 'A memorandum between offices of the same organisation.'],
  ['savingram', 'Savingram', 'A routine internal message between government offices.'],
  ['circular', 'Circular', 'One message sent to many offices, on a stated reference.'],
  ['notice', 'Notice', 'A public or staff notice.'],
  ['minutes', 'Minutes of a Meeting', 'Attendance, agenda items and resolutions of a meeting.'],
];
const toParas = t => { const a = String(t || '').split(/\n+/).map(x => x.trim()).filter(Boolean); return a.length ? a : [' ']; };
const CORR_KIND = Object.fromEntries(CORR_KINDS.map(([k, l]) => [k, l]));
const CORR_TPL = k => ({ memo: 'memo', savingram: 'memo', circular: 'circular' }[k] || 'letter');
const myApprovals = () => S.approvals.filter(a => a.approver === role() && a.status === 'open');
const myChats = () => S.chats.filter(c => c.members.includes(meId())).sort((a, b) => lastAt(b).localeCompare(lastAt(a)));
const lastAt = c => (c.msgs[c.msgs.length - 1] || {}).at || '';
const chatUnread = c => c.msgs.filter(m => !m.sys && m.by !== meId() && m.at > (c.read[meId()] || '')).length;
const msgUnread = () => myChats().reduce((n, c) => n + chatUnread(c), 0);
const corrWaiting = () => S.corr.filter(c => c.status === 'waiting');
const chatName = c => c.group ? c.title : esc(person(c.members.find(m => m !== meId()) || meId()).name);

/* ---------- header buttons: Pending approvals and Messages (as in the live top bar) ---------- */
const headerExtras = () => {
  const ap = myApprovals().length, mu = msgUnread();
  return `<a class="ph-ic" href="#/approvals" aria-label="${plural(ap, 'pending approval')}" title="Pending approvals">${ic('listChecks')}${ap ? `<span class="badge">${ap}</span>` : ''}</a>
    <a class="ph-ic" href="#/messages" aria-label="Messages${mu ? `, ${mu} unread` : ''}" title="Messages">${ic('mail')}${mu ? `<span class="badge">${mu}</span>` : ''}</a>`;
};
/* put them between Search and Notifications on every page header */
function addHeaderExtras(root) {
  root.querySelectorAll('.ph-icons').forEach(box => {
    if (box.querySelector('[href="#/approvals"]')) return;
    const bell = box.querySelector('[data-act=openNotifs]');
    if (bell) bell.insertAdjacentHTML('beforebegin', headerExtras());
  });
}

/* ---------- Pending approvals ---------- */
function viewApprovals() {
  const all = S.approvals.filter(a => a.approver === role());
  const mine = all.filter(a => a.status === 'open');
  const done = all.filter(a => a.status !== 'open');
  const due = a => new Date(a.due) < new Date() && a.status === 'open';
  const rows = list => list.map(a => `<tr><td><b>${esc(a.type.replace(/^Document \(EDMS\) - /, ''))} #${a.no}</b><small class="sub">${esc(a.title)}</small></td>
      <td>${esc(a.type)}</td>
      <td data-v="${a.status === 'open' ? 'In Progress' : a.status === 'approved' ? 'Approved' : 'Rejected'}"><span class="chip ${a.status === 'open' ? 't-blue' : a.status === 'approved' ? 't-green' : 't-red'}">${a.status === 'open' ? 'In Progress' : a.status === 'approved' ? 'Approved' : 'Rejected'}</span></td>
      <td><div class="ap-prog"><span style="width:${Math.round((a.done + (a.status === 'open' ? 0 : 1)) / a.steps * 100)}%"></span></div><small class="sub">${a.status === 'open' ? `${a.steps - a.done} pending / ${a.steps}` : `${a.steps} / ${a.steps} done`}</small></td>
      <td data-d="${a.due}">${fmtDay(a.due)}${due(a) ? ' <span class="chip t-red">Overdue</span>' : ''}</td>
      <td data-d="${a.at}">${fmtDay(a.at)}</td>
      <td>${esc(person(a.by).name)}</td>
      <td>${a.status === 'open' ? `<button class="btn btn-primary btn-xs" data-act="apReview" data-id="${a.id}">${ic('eye')} Review</button>` : `<button class="btn btn-light btn-xs" data-act="apReview" data-id="${a.id}">${ic('eye')} View</button>`}</td></tr>`);
  const head = ['Details', 'Type', 'Status', 'Progress', 'Due date', 'Started', 'Started by', ''];
  const tab = (parseHash().q.tab) || 'open';
  return pageHead({ crumbs: [['My Pending Approvals']], title: 'My Pending Approvals', sub: 'Requests waiting for your approval: file opening, closing and disposal, document uploads and documents sent for review.' }) +
    `<section class="panel glass"><div class="tabs">
      <button class="${tab === 'open' ? 'on' : ''}" data-href="#/approvals">Awaiting your approval <span class="n">${mine.length}</span></button>
      <button class="${tab === 'done' ? 'on' : ''}" data-href="#/approvals?tab=done">Decided <span class="n">${done.length}</span></button></div>
      ${simpleTable(head, rows(tab === 'done' ? done : mine), tab === 'done' ? 'You have not decided anything yet.' : 'Nothing is waiting for your approval.',
        { key: 'approvals-' + tab, search: 'Search approvals – title, type or officer', date: [4, 'Due from', 'Due to'], facets: [[1, 'Entity type'], [2, 'Status'], [6, 'Started by']] })}
    </section>`;
}
function apModal(a) {
  const f = a.fileId && getFile(a.fileId);
  modal(`${mHead('listChecks', `${esc(a.type.replace(/^Document \(EDMS\) - /, ''))} #${a.no}`, esc(a.type))}
    <div class="modal-b">
      <dl class="ap-facts"><dt>Subject</dt><dd>${esc(a.title)}</dd><dt>Started by</dt><dd>${esc(person(a.by).name)} — ${esc(person(a.by).title)}</dd>
        <dt>Started</dt><dd>${fmtDT(a.at)}</dd><dt>Due</dt><dd>${fmtDT(a.due)}</dd>${f ? `<dt>File</dt><dd><a href="#/file/${f.id}" data-act="close">${esc(f.name)}</a> <span class="mono">${esc(f.ref)}</span></dd>` : ''}
        <dt>Progress</dt><dd>Step ${Math.min(a.done + 1, a.steps)} of ${a.steps}${a.steps > 1 ? ' — after you, it goes to the next approver' : ''}</dd>
        ${a.status !== 'open' ? `<dt>Decision</dt><dd>${a.status === 'approved' ? 'Approved' : 'Rejected'} by ${esc(person(a.decidedBy).name)}, ${fmtDT(a.decidedAt)}${a.note ? ` — “${esc(a.note)}”` : ''}</dd>` : ''}</dl>
      ${a.status === 'open' ? `<div class="field"><label for="ap-note">Comment <span class="muted">(required to reject)</span></label><textarea class="input" id="ap-note" rows="3" placeholder="Add a note for ${esc(person(a.by).name)}"></textarea><p class="form-err" id="ap-err" role="alert" hidden></p></div>` : ''}
    </div>
    <div class="modal-f"><button class="btn btn-light" data-act="close">Close</button>${a.status === 'open' ? `<button class="btn btn-outline danger" data-act="apDecide" data-id="${a.id}" data-k="rejected">${ic('x')} Reject</button><button class="btn btn-primary" data-act="apDecide" data-id="${a.id}" data-k="approved">${ic('check')} Approve</button>` : ''}</div>`, '', '#ap-note');
}

/* ---------- Messages ---------- */
ui.chat = ui.chat || { id: null, q: '' };
function viewMessages(q) {
  const list = myChats();
  if (q.c && list.some(c => c.id === q.c)) ui.chat.id = q.c;
  const cur = list.find(c => c.id === ui.chat.id);
  if (cur) { cur.read[meId()] = new Date().toISOString(); save(); }
  const term = (ui.chat.q || '').trim().toLowerCase();
  const shown = list.filter(c => !term || (chatName(c) + ' ' + c.msgs.map(m => m.text).join(' ')).toLowerCase().includes(term));
  const preview = c => { const m = c.msgs[c.msgs.length - 1]; if (!m) return 'No messages yet'; return (m.by === meId() ? 'You: ' : m.sys ? '' : (c.group ? person(m.by).name.split(' ')[0] + ': ' : '')) + m.text; };
  const day = iso => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const item = c => { const u = chatUnread(c); return `<button class="chat-it ${cur && cur.id === c.id ? 'on' : ''}" data-act="chatOpen" data-id="${c.id}">
      <span class="chat-av">${c.group ? ic('users') : avatar(c.members.find(m => m !== meId()))}</span>
      <span class="chat-t"><b>${chatName(c)}</b><small>${esc(preview(c))}</small></span>
      <span class="chat-m"><small>${lastAt(c) ? day(lastAt(c)) : ''}</small>${u ? `<span class="count">${u}</span>` : ''}</span></button>`; };
  const bubble = m => m.sys ? `<div class="chat-sys">${ic('users')} ${esc(m.text)}</div>`
    : `<div class="chat-b ${m.by === meId() ? 'me' : ''}">${m.by !== meId() && cur.group ? `<b>${esc(person(m.by).name)}</b>` : ''}<p>${esc(m.text)}</p><time>${new Date(m.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}${m.by === meId() ? ' ' + ic('check') : ''}</time></div>`;
  return pageHead({ crumbs: [['Messages']], title: 'Messages', sub: 'Direct messages and requests from other users.' }) +
    `<section class="chat glass ${cur ? 'has-cur' : ''}">
      <aside class="chat-list">
        <div class="chat-lh"><h2>Messages</h2><button class="btn btn-primary btn-sm" data-act="chatNew">${ic('plus')} New</button></div>
        <label class="input-icon">${ic('search')}<input class="input" id="chat-q" value="${esc(ui.chat.q)}" placeholder="Search conversations…" data-input="chatQ" autocomplete="off"><span class="sr">Search conversations</span></label>
        <div class="chat-items" id="chat-items">${shown.map(item).join('') || '<p class="muted" style="padding:12px">No conversations match.</p>'}</div>
      </aside>
      <div class="chat-pane">${cur ? `
        <div class="chat-ph"><button class="btn btn-light btn-icon btn-sm chat-back" data-act="chatOpen" data-id="" aria-label="Back to conversations">${ic('chevL')}</button>
          <span class="chat-av">${cur.group ? ic('users') : avatar(cur.members.find(m => m !== meId()))}</span>
          <div><b>${chatName(cur)}</b><small>${cur.group ? `${cur.members.length} people: ${cur.members.map(m => m === meId() ? 'You' : esc(person(m).name)).join(', ')}` : esc(person(cur.members.find(m => m !== meId())).title)}</small></div>
          <span class="sp"></span>${cur.group ? `<button class="btn btn-light btn-sm" data-act="chatAdd" data-id="${cur.id}">${ic('user')} Add</button>` : ''}<button class="btn btn-light btn-icon btn-sm" data-act="chatInfo" data-id="${cur.id}" aria-label="Conversation details">${ic('info')}</button></div>
        <div class="chat-msgs" id="chat-msgs">${cur.msgs.map(bubble).join('')}</div>
        <form class="chat-send" data-chat="${cur.id}"><label class="sr" for="chat-in">Message</label><input class="input" id="chat-in" placeholder="Type a message…" autocomplete="off"><button class="btn btn-primary btn-icon" aria-label="Send">${ic('send')}</button></form>`
      : `<div class="empty chat-empty">${ic('chat')}<div>Select a conversation, or start a new one.</div></div>`}</div>
    </section>`;
}
function chatNewModal(addTo) {
  const c = addTo && S.chats.find(x => x.id === addTo);
  const opts = Object.values(PEOPLE).filter(p => p.id !== meId() && !(c && c.members.includes(p.id)));
  modal(`${mHead(c ? 'user' : 'chat', c ? 'Add people' : 'New message', c ? esc(c.title) : 'Choose one person for a direct message, or several for a group.')}
    <div class="modal-b">
      ${c ? '' : `<div class="field"><label for="cn-title">Group name <span class="muted">(only for groups)</span></label><input class="input" id="cn-title" placeholder="e.g. Contract Document For NQCL-MOH"></div>`}
      <fieldset class="field cn-people"><legend class="label">People</legend>${opts.map(p => `<label class="cn-p"><input type="checkbox" value="${p.id}"> ${avatar(p.id)} <span><b>${esc(p.name)}</b><small>${esc(p.title)}</small></span></label>`).join('')}</fieldset>
      ${c ? '' : `<div class="field"><label for="cn-msg">Message</label><textarea class="input" id="cn-msg" rows="3"></textarea></div>`}
      <p class="form-err" id="cn-err" role="alert" hidden></p>
    </div>
    <div class="modal-f"><button class="btn btn-light" data-act="close">Cancel</button><button class="btn btn-primary" data-act="${c ? 'chatAddSave' : 'chatCreate'}" data-id="${c ? c.id : ''}">${ic(c ? 'user' : 'send')} ${c ? 'Add to group' : 'Start conversation'}</button></div>`, '', c ? '' : '#cn-title');
}

/* ---------- Correspondence from officers (Registry) ---------- */
function viewCorrespondence() {
  const w = corrWaiting(), rec = S.corr.filter(c => c.status === 'recorded'), past = S.corr.filter(c => ['sent', 'returned'].includes(c.status));
  const row = (c, acts) => `<tr><td><b>${esc(c.subject)}</b><small class="sub">To: ${esc(c.to)}</small></td><td>${esc(person(c.from).name)}</td><td>${CORR_KIND[c.kind]}</td>
      <td data-v="${c.goes}"><span class="chip ${c.goes === 'External' ? 't-violet' : 't-teal'}">${c.goes}</span></td><td data-d="${c.at}">${fmtDT(c.at)}</td><td><div class="row-acts">${acts}</div></td></tr>`;
  const read = c => `<button class="btn btn-light btn-xs" data-act="corrRead" data-id="${c.id}">${ic('eye')} Read</button>`;
  const head = ['Subject', 'From', 'Kind', 'Goes to', 'Sent', ''];
  const spec = k => ({ key: 'corr-' + k, search: 'Search – subject, officer or recipient', date: [4, 'Sent from', 'Sent to'], facets: [[1, 'From'], [2, 'Kind'], [3, 'Goes to']] });
  return pageHead({ crumbs: [['Correspondence from officers']], title: 'Correspondence from officers', sub: 'Letters, memos, circulars and notices officers have started. Record each in the Inward Register and file it, then send it on.' }) +
    `<section class="panel glass"><div class="panel-h"><h2>Waiting to be recorded <span class="n-pill">${w.length}</span></h2></div>
      ${simpleTable(head, w.map(c => row(c, `${read(c)}<button class="btn btn-light btn-xs" data-act="corrReturn" data-id="${c.id}">${ic('undo')} Return</button><button class="btn btn-primary btn-xs" data-act="corrRecord" data-id="${c.id}">${ic('archive')} Record and file</button>`)), 'Nothing is waiting to be recorded.', spec('w'))}</section>
    <section class="panel glass"><div class="panel-h"><h2>Recorded – to send on <span class="n-pill">${rec.length}</span></h2></div>
      ${simpleTable([...head.slice(0, 5), 'Filed in', ''], rec.map(c => { const f = getFile(c.fileId); return row(c, `${read(c)}<button class="btn btn-primary btn-xs" data-act="corrSend" data-id="${c.id}">${ic('send')} Send on</button>`).replace('<td><div class="row-acts">', `<td>${f ? fileLink(f) : '—'}</td><td><div class="row-acts">`); }), 'Nothing is waiting to be sent on.', { ...spec('r'), date: [4, 'Sent from', 'Sent to'] })}</section>
    ${past.length ? `<section class="panel glass"><div class="panel-h"><h2>Sent on or returned <span class="n-pill">${past.length}</span></h2></div>
      ${simpleTable([...head.slice(0, 5), 'Outcome'], past.map(c => row(c, c.status === 'sent' ? `<span class="chip t-green">${ic('check')} Sent ${fmtDay(c.sentAt)}${c.how ? ' · ' + esc(c.how) : ''}</span>` : `<span class="chip t-amber">Returned to officer</span>`)), '', { ...spec('p') })}</section>` : ''}`;
}
function corrReadModal(c) {
  const p = person(c.from);
  const ctx = { ref: c.status === 'recorded' || c.status === 'sent' ? 'Recorded' : 'Draft', date: c.at, to: c.to, subject: c.subject.toUpperCase(), body: toParas(c.body), signer: { name: p.name, title: p.title }, signed: c.status === 'recorded' || c.status === 'sent', org: '' };
  modal(`${mHead('eye', esc(c.subject), `${CORR_KIND[c.kind]} from ${esc(p.name)} · ${c.goes}`)}
    <div class="modal-b"><div class="page corr-page"><div class="content">${tplHTML(CORR_TPL(c.kind), ctx)}</div></div></div>
    <div class="modal-f"><button class="btn btn-light" data-act="close">Close</button>${c.status === 'waiting' && role() === 'registry' ? `<button class="btn btn-light" data-act="corrReturn" data-id="${c.id}">${ic('undo')} Return</button><button class="btn btn-primary" data-act="corrRecord" data-id="${c.id}">${ic('archive')} Record and file</button>` : ''}</div>`, 'wide');
}
function corrRecordModal(c) {
  modal(`${mHead('archive', 'Record and file', `${esc(c.subject)} — ${CORR_KIND[c.kind]} from ${esc(person(c.from).name)}`)}
    <div class="modal-b"><p class="muted" style="margin-top:0">It is added to the Inward Register and filed as the next folio in the file you choose.</p>
      <div class="field"><label for="cr-file">File <span class="req">*</span></label><select class="select" id="cr-file"><option value="">Select a file…</option>${S.files.filter(f => !f.draft && f.state !== 'Disposed').map(f => `<option value="${f.id}">${esc(f.ref)} — ${esc(f.name)}</option>`).join('')}</select></div>
      <p class="form-err" id="cr-err" role="alert" hidden></p></div>
    <div class="modal-f"><button class="btn btn-light" data-act="close">Cancel</button><button class="btn btn-primary" data-act="corrRecordSave" data-id="${c.id}">${ic('archive')} Record and file</button></div>`, '', '#cr-file');
}
function corrReturnModal(c) {
  modal(`${mHead('undo', 'Return to officer', `${esc(c.subject)} goes back to ${esc(person(c.from).name)}.`)}
    <div class="modal-b"><div class="field"><label for="crt">What needs to change <span class="req">*</span></label><textarea class="input" id="crt" rows="3"></textarea></div><p class="form-err" id="crt-err" role="alert" hidden></p></div>
    <div class="modal-f"><button class="btn btn-light" data-act="close">Cancel</button><button class="btn btn-primary" data-act="corrReturnSave" data-id="${c.id}">${ic('undo')} Return</button></div>`, '', '#crt');
}
function corrSendModal(c) {
  modal(`${mHead('send', 'Send on', `${esc(c.subject)} to ${esc(c.to)}`)}
    <div class="modal-b">${c.goes === 'External'
      ? `<div class="field"><label for="cs-how">How</label><select class="select" id="cs-how"><option>Courier</option><option>Email</option><option>Hand delivery</option><option>Registered post</option></select></div>`
      : `<div class="field"><label for="cs-to">Send to</label><select class="select" id="cs-to"><option value="">Everyone named in “To”</option>${peopleOpts(p => p.id !== meId())}</select></div>`}</div>
    <div class="modal-f"><button class="btn btn-light" data-act="close">Cancel</button><button class="btn btn-primary" data-act="corrSendSave" data-id="${c.id}">${ic('send')} Send on</button></div>`);
}

/* ---------- My correspondence (Marking and Action Officers) ---------- */
const CORR_STATUS = { draft: ['Draft', 't-neutral'], waiting: ['With the Registry', 't-amber'], recorded: ['Recorded and filed', 't-blue'], sent: ['Sent', 't-green'], returned: ['Returned to you', 't-red'] };
function viewMyCorrespondence(q) {
  const list = S.corr.filter(c => c.from === meId()).sort((a, b) => (b.at || '').localeCompare(a.at || ''));
  if (q.new && !ui.corrAsked) { ui.corrAsked = true; setTimeout(() => corrStartModal(), 0); }
  if (!q.new) ui.corrAsked = false;
  const rows = list.map(c => { const [st, tone] = CORR_STATUS[c.status]; const f = c.fileId && getFile(c.fileId);
    return `<tr><td><b>${esc(c.subject)}</b><small class="sub">To: ${esc(c.to || '—')}</small></td><td>${CORR_KIND[c.kind]}</td><td data-v="${c.goes}">${c.goes}</td>
      <td data-d="${c.at}">${fmtDT(c.at)}</td><td data-v="${st}"><span class="chip ${tone}">${st}</span>${c.status === 'returned' && c.returnNote ? `<small class="sub">“${esc(c.returnNote)}”</small>` : ''}${c.status === 'sent' ? `<small class="sub">${fmtDay(c.sentAt)}${c.how ? ' · ' + esc(c.how) : ''}</small>` : ''}</td>
      <td>${f ? fileLink(f) : '—'}</td>
      <td><div class="row-acts">${['draft', 'returned'].includes(c.status) ? `<button class="btn btn-primary btn-xs" data-act="corrEdit" data-id="${c.id}">${ic('pen')} ${c.status === 'draft' ? 'Continue writing' : 'Fix and resend'}</button>` : `<button class="btn btn-light btn-xs" data-act="corrRead" data-id="${c.id}">${ic('eye')} Read</button>`}</div></td></tr>`; });
  return pageHead({ crumbs: [['My correspondence']], title: 'My correspondence', sub: 'Letters, memos, circulars and notices you start yourself. You write them, the Registry Officer records them in the Inward Register and files them, then they are sent, printed or posted.', right: `<button class="btn btn-white" data-act="corrStart">${ic('fileEdit')} Start new correspondence</button>` }) +
    `<section class="panel glass">${list.length ? simpleTable(['Subject', 'Kind', 'Goes to', 'Started', 'Status', 'Filed in', ''], rows, '', { key: 'mycorr', search: 'Search – subject or recipient', date: [3, 'Started from', 'Started to'], facets: [[1, 'Kind'], [2, 'Goes to'], [4, 'Status']] })
      : `<div class="empty">${ic('fileEdit')}<div>You have not started any letters yet.</div><button class="btn btn-primary btn-sm" data-act="corrStart">${ic('fileEdit')} Start new correspondence</button></div>`}</section>`;
}
function corrStartModal() {
  ui.cw = { kind: 'letter', subject: '' };
  modal(`${mHead('fileEdit', 'Start new correspondence', '')}
    <div class="modal-b"><fieldset class="field kind-pick"><legend class="label">What are you writing?</legend>
      ${CORR_KINDS.map(([k, l, d], i) => `<label class="kind-opt"><input type="radio" name="cw-kind" value="${k}" ${i === 0 ? 'checked' : ''}><span><b>${l}</b><small>${d}</small></span></label>`).join('')}</fieldset>
      <div class="field"><label for="cw-subj">Subject</label><input class="input" id="cw-subj" placeholder="What is it about?"></div><p class="form-err" id="cw-err" role="alert" hidden></p></div>
    <div class="modal-f"><button class="btn btn-light" data-act="close">Cancel</button><button class="btn btn-primary" data-act="corrStartGo">${ic('pen')} Start writing</button></div>`, '', '#cw-subj');
}
function corrWriteModal(c) {
  const p = me();
  const ctx = { ref: 'Draft', date: new Date().toISOString(), to: c.to || 'Recipient', subject: (c.subject || '').toUpperCase(), body: toParas(c.body), signer: { name: p.name, title: p.title }, signed: false, org: '' };
  modal(`${mHead('pen', esc(c.subject), `${CORR_KIND[c.kind]} · you write it, the Registry records, files and sends it`)}
    <div class="modal-b cw-grid">
      <div class="cw-form">
        <fieldset class="field radios"><legend class="label">Goes to</legend>
          <label><input type="radio" name="cw-goes" value="Internal" ${c.goes !== 'External' ? 'checked' : ''}> Inside the ministry</label>
          <label><input type="radio" name="cw-goes" value="External" ${c.goes === 'External' ? 'checked' : ''}> Outside the ministry</label></fieldset>
        <div class="field"><label for="cw-to">To <span class="req">*</span></label><input class="input" id="cw-to" value="${esc(c.to || '')}" placeholder="${c.kind === 'circular' ? 'All Heads of Departments / Directorates' : 'e.g. The Director, KEMSA'}" data-cw="to"></div>
        <div class="field"><label for="cw-subj2">Subject</label><input class="input" id="cw-subj2" value="${esc(c.subject)}" data-cw="subject"></div>
        <div class="field"><label for="cw-body">${c.kind === 'minutes' ? 'Attendance, agenda and resolutions' : 'Text'} <span class="req">*</span></label><textarea class="input" id="cw-body" rows="9" data-cw="body">${esc(c.body || '')}</textarea></div>
        ${c.status === 'returned' && c.returnNote ? `<div class="instruction">${ic('undo')} <b>Returned by the Registry:</b> ${esc(c.returnNote)}</div>` : ''}
        <p class="form-err" id="cw-err2" role="alert" hidden></p>
      </div>
      <div class="cw-prev"><div class="page"><div class="content" id="cw-prev">${tplHTML(CORR_TPL(c.kind), ctx)}</div></div></div>
    </div>
    <div class="modal-f"><button class="btn btn-light" data-act="close">Close</button><button class="btn btn-outline" data-act="corrSave" data-id="${c.id}">${ic('fileEdit')} Save draft</button><button class="btn btn-primary" data-act="corrSubmit" data-id="${c.id}">${ic('send')} Send to Registry</button></div>`, 'xwide', '#cw-to');
}
function corrFromForm(c) {
  c.to = $('#cw-to').value.trim(); c.subject = $('#cw-subj2').value.trim() || c.subject; c.body = $('#cw-body').value.trim();
  c.goes = ($$('[name=cw-goes]').find(i => i.checked) || {}).value || 'Internal';
}

/* ---------- Request Files (Marking and Action Officers) ---------- */
function rqResults() {
  const term = (ui.rqTerm || '').trim().toLowerCase();
  const mineIds = new Set(S.files.filter(f => f.movements.some(m => m.to === meId())).map(f => f.id));
  const found = term ? S.files.filter(f => !f.draft && !mineIds.has(f.id) && [f.name, f.ref, ...f.docs.map(d => d.title + ' ' + d.folio)].join(' ').toLowerCase().includes(term)) : [];
  const asking = new Set(S.access.filter(a => a.by === meId() && a.status === 'open').map(a => a.fileId));
  return term ? (found.length ? `<div class="results" style="margin-top:14px">${found.map(f => `<div class="result card" style="cursor:default"><span class="pg">${ic('lock')}</span><div><b>${esc(f.name)}</b><small><span class="mono">${esc(f.ref)}</span> · ${esc(regName(f.registry))} · ${plural(liveDocs(f).length, 'document')}</small></div><span style="margin-left:auto">${asking.has(f.id) ? '<span class="chip t-amber">Asked – waiting</span>' : `<button class="btn btn-primary btn-sm" data-act="rqAsk" data-id="${f.id}">${ic('lock')} Request access</button>`}</span></div>`).join('')}</div>` : `<p class="muted" style="margin:10px 4px 0">Nothing found for “${esc(ui.rqTerm.trim())}”.</p>`) : '';
}
function viewRequestFiles() {
  const term = (ui.rqTerm || '').trim().toLowerCase();
  const mineIds = new Set(S.files.filter(f => f.movements.some(m => m.to === meId())).map(f => f.id));
  const found = term ? S.files.filter(f => !f.draft && !mineIds.has(f.id) && [f.name, f.ref, ...f.docs.map(d => d.title + ' ' + d.folio)].join(' ').toLowerCase().includes(term)) : [];
  const asked = S.access.filter(a => a.by === meId());
  const asking = new Set(asked.filter(a => a.status === 'open').map(a => a.fileId));
  return pageHead({ crumbs: [['Request Files']], title: 'Request Files', sub: 'You see the files sent to you and the ones you have worked on. For any other file or letter, ask the Registry Officer.' }) +
    `<section class="panel glass"><label class="input-icon rq-search">${ic('search')}<input class="input" id="rq-q" value="${esc(ui.rqTerm || '')}" placeholder="Search by subject, reference number, file name or folio…" autocomplete="off"><span class="sr">Search files</span></label>
      <p class="muted" style="margin:10px 4px 0">You see only what it is. To read it, request access and say why.</p>
      <div id="rq-res">${rqResults()}</div></section>
    <section class="panel glass"><div class="panel-h"><h2>My requests</h2></div>${asked.length ? simpleTable(['File', 'Reason', 'Duration', 'Asked', 'Status'], asked.map(a => { const f = getFile(a.fileId); const st = { open: ['Waiting', 't-amber'], approved: ['Approved', 't-green'], declined: ['Declined', 't-red'] }[a.status] || ['—', ''];
        return `<tr><td>${a.status === 'approved' ? fileLink(f) : `<b>${esc(f.name)}</b><small class="sub mono">${esc(f.ref)}</small>`}</td><td>${esc(a.reason)}</td><td>${plural(a.days, 'day')}</td><td data-d="${a.at}">${ago(a.at)}</td><td data-v="${st[0]}"><span class="chip ${st[1]}">${st[0]}</span>${a.status === 'approved' && a.expires ? `<small class="sub">Until ${fmtDay(a.expires)}</small>` : ''}</td></tr>`; }), '', { key: 'myreqs', search: 'Search my requests', date: [3, 'Asked from', 'Asked to'], facets: [[4, 'Status']] }) : '<p class="muted" style="margin:0">You have not asked for anything yet.</p>'}</section>`;
}
function rqModal(f) {
  modal(`${mHead('lock', 'Request access', `${esc(f.name)} · ${esc(f.ref)}`)}
    <div class="modal-b"><div class="field"><label for="rq-why">Why do you need it? <span class="req">*</span></label><textarea class="input" id="rq-why" rows="3"></textarea></div>
      <div class="field"><label for="rq-days">For how long</label><select class="select" id="rq-days"><option value="3">3 days</option><option value="7" selected>7 days</option><option value="14">14 days</option><option value="30">30 days</option></select></div>
      <p class="form-err" id="rq-err" role="alert" hidden></p></div>
    <div class="modal-f"><button class="btn btn-light" data-act="close">Cancel</button><button class="btn btn-primary" data-act="rqSend" data-id="${f.id}">${ic('send')} Send request</button></div>`, '', '#rq-why');
}

/* ---------- Reports Dashboard ---------- */
function viewReports() {
  const files = S.files.filter(f => !f.draft), docs = files.flatMap(f => f.docs);
  const pending = files.filter(f => ['marking', 'action', 'returned_marking', 'returned_action'].includes(f.stage));
  const sla = pending.filter(f => daysSince(f.updated) > 7);
  const expiring = S.access.filter(a => a.status === 'approved' && a.expires && (new Date(a.expires) - Date.now()) / 864e5 <= 30);
  const missing = (S.censuses || []).flatMap(c => c.items || []).filter(i => i.status === 'MISSING');
  const disposal = S.recReqs.filter(q => q.type === 'DISPOSE' && q.status !== 'Rejected');
  const ocrReview = landingDocs();
  const cards = [
    ['folders', files.length, 'Total Files', 'View files', '#/files', 'teal'],
    ['file', docs.length, 'Total Documents', 'View documents', '#/files?show=letters', 'blue'],
    ['listChecks', pending.length + myApprovals().length, 'Pending Tasks', 'View tasks', '#/queue', 'amber'],
    ['clock', sla.length, 'SLA Breaches', 'View SLA', '#/routing', 'red'],
    ['calendar', expiring.length, 'Expiring Soon', 'Within 30 days', '#/access', 'sky'],
    ['scan', missing.length, 'Missing Documents', 'View documents', '#/census', 'grey'],
    ['lock', 0, 'Under Legal Hold', 'View legal holds', '#/records?tab=files', 'red'],
    ['trash', disposal.length, 'Awaiting Disposal', 'View schedules', '#/records', 'grey'],
    ['eye', ocrReview.length, 'OCR Review', 'Review OCR', '#/queue?tab=landing', 'violet'],
    ['scan', ocrReview.length + 1, 'OCR Jobs', 'View OCR jobs', '#/queue?tab=landing', 'sky'],
  ];
  const t = new Date().toLocaleTimeString('en-GB');
  return pageHead({ crumbs: [['Reports Dashboard']], title: 'Reports', sub: `Updated ${t}`, right: `<button class="btn btn-white" data-act="repRefresh">${ic('refresh')} Refresh</button>` }) +
    `<section class="rep-grid">${cards.map(([i, n, l, cta, h, tone]) => `<a class="rep-card glass" href="${h}"><span class="rep-ic t-${tone}">${ic(i)}</span><b class="rep-n">${n}</b><span class="rep-l">${l}</span><span class="rep-cta">${cta} ${ic('arrowR')}</span></a>`).join('')}</section>`;
}

/* ---------- Overview extras: quick links, Open Q-BITS AI, notification channel ---------- */
const quickLinks = () => role() === 'registry' ? [
  ['folderPlus', 'Create File', 'newFile'], ['search', 'Search Documents', 'palette'], ['inboxIn', 'Correspondence from officers', '#/correspondence', corrWaiting().length],
  ['layers', 'Files & Records', '#/records'], ['scan', 'File Census', '#/census'], ['zap', 'Reports Dashboard', '#/reports']]
  : [['search', 'Search Documents', 'palette'], ['fileEdit', 'My correspondence', '#/mycorrespondence'], ['mail', 'Messages', '#/messages', msgUnread()], ['listChecks', 'Pending approvals', '#/approvals', myApprovals().length], ['zap', 'Reports Dashboard', '#/reports']];
function decorateOverview(root) {
  const tiles = root.querySelector('.dash-stack > .tiles');
  if (tiles && !root.querySelector('.qlinks')) tiles.insertAdjacentHTML('afterend', `<nav class="qlinks" aria-label="Quick links">${quickLinks().map(([i, l, t, n]) =>
    t.startsWith('#') ? `<a class="qlink" href="${t}">${ic(i)} ${l}${n ? `<span class="count">${n}</span>` : ''}</a>` : `<button class="qlink" data-act="${t}">${ic(i)} ${l}${n ? `<span class="count">${n}</span>` : ''}</button>`).join('')}</nav>`);
  root.querySelectorAll('.ai-sugg').forEach(a => { if (!a.querySelector('.ai-open')) a.insertAdjacentHTML('beforeend', `<a class="ai-open" href="#/ai">${ic('sparkles')} Open Q-BITS AI ${ic('chevR')}</a>`); });
  const emp = root.querySelector('.dash-main .empty');
  if (emp && role() !== 'registry' && !emp.querySelector('.ask-link')) emp.insertAdjacentHTML('beforeend', `<p class="muted" style="margin:6px 0 0">You see the files sent to you and the ones you have worked on. To see any other file, ask the Registry Officer for access.</p><a class="btn btn-light btn-sm ask-link" href="#/requestfiles">${ic('search')} Find a file and ask for access</a>`);
  root.querySelectorAll('.notif-card').forEach(n => { if (!n.querySelector('.ch')) n.insertAdjacentHTML('beforeend', '<span class="ch">Email</span>'); });
}
/* Registry side navigation: the live Correspondence and Reports pages */
function decorateSide(root) {
  const reg = root.querySelector('.sidebar nav[aria-label="Registry pages"]');
  const cur = parseHash().parts[0];
  const link = (k, h, l, i, n) => `<a href="${h}" class="${cur === k ? 'on' : ''}" ${cur === k ? 'aria-current="page"' : ''}>${ic(i)} ${l}${n ? `<span class="count">${n}</span>` : ''}</a>`;
  if (reg && !reg.querySelector('[href="#/correspondence"]')) reg.insertAdjacentHTML('beforeend', link('correspondence', '#/correspondence', 'Correspondence', 'mail', corrWaiting().length) + link('reports', '#/reports', 'Reports Dashboard', 'zap'));
  const main = root.querySelector('.sidebar nav.nav');
  if (main && role() !== 'registry' && !main.querySelector('[href="#/reports"]')) {
    main.querySelector('[data-act=requestAny]')?.remove();
    main.insertAdjacentHTML('beforeend', link('mycorrespondence', '#/mycorrespondence', 'My correspondence', 'fileEdit', S.corr.filter(c => c.from === meId() && c.status === 'returned').length) + link('requestfiles', '#/requestfiles', 'Request files', 'filePlus') + link('reports', '#/reports', 'Reports Dashboard', 'zap'));
  }
  if (['approvals', 'messages', 'correspondence', 'reports', 'mycorrespondence', 'requestfiles'].includes(cur)) root.querySelectorAll('.sidebar nav a.on').forEach(a => { if (!a.getAttribute('href').includes(cur)) { a.classList.remove('on'); a.removeAttribute('aria-current'); } });
}

/* ---------- routes, actions and inputs ---------- */
LIVE_ROUTES = { approvals: viewApprovals, messages: viewMessages, correspondence: viewCorrespondence, reports: viewReports, 'mycorrespondence': viewMyCorrespondence, 'requestfiles': viewRequestFiles };
Object.assign(SCREEN_NAME, { approvals: 'Pending Approvals', messages: 'Messages', correspondence: 'Correspondence from officers', reports: 'Reports Dashboard', 'mycorrespondence': 'My correspondence', 'requestfiles': 'Request Files' });
LIVE_AFTER = root => { addHeaderExtras(root); decorateOverview(root); decorateSide(root); const m = $('#chat-msgs'); if (m) m.scrollTop = m.scrollHeight; };

Object.assign(ACT, {
  apReview: el => apModal(S.approvals.find(a => a.id === el.dataset.id)),
  apDecide: el => {
    const a = S.approvals.find(x => x.id === el.dataset.id), note = ($('#ap-note')?.value || '').trim(), k = el.dataset.k;
    if (k === 'rejected' && !note) { const e = $('#ap-err'); e.textContent = 'Write why you are rejecting it, so the officer knows what to change.'; e.hidden = false; $('#ap-note').focus(); return; }
    Object.assign(a, { status: k, decidedBy: meId(), decidedAt: new Date().toISOString(), note });
    notify(a.by, `${a.type.replace(/^Document \(EDMS\) - /, '')} #${a.no} was ${k}.`, meId(), a.fileId || null);
    save(); closeModal(); render(); toast(`${a.type.replace(/^Document \(EDMS\) - /, '')} #${a.no} ${k}`);
  },
  chatOpen: el => { ui.chat.id = el.dataset.id || null; if (location.hash !== '#messages' && !location.hash.startsWith('#messages')) go('#/messages'); else render(); setTimeout(() => $('#chat-in')?.focus(), 0); },
  chatNew: () => chatNewModal(),
  chatAdd: el => chatNewModal(el.dataset.id),
  chatInfo: el => { const c = S.chats.find(x => x.id === el.dataset.id); modal(`${mHead('info', chatName(c), c.group ? 'Group conversation' : 'Direct message')}<div class="modal-b"><ul class="cn-members">${c.members.map(m => `<li>${avatar(m)} <span><b>${esc(person(m).name)}</b><small>${esc(person(m).title)}</small></span></li>`).join('')}</ul></div><div class="modal-f"><button class="btn btn-light" data-act="close">Close</button></div>`); },
  chatCreate: () => {
    const ids = $$('.cn-people input:checked').map(i => i.value), title = $('#cn-title').value.trim(), msg = $('#cn-msg').value.trim(), err = $('#cn-err');
    if (!ids.length) { err.textContent = 'Choose at least one person.'; err.hidden = false; return; }
    if (ids.length > 1 && !title) { err.textContent = 'Give the group a name.'; err.hidden = false; $('#cn-title').focus(); return; }
    let c = ids.length === 1 && S.chats.find(x => !x.group && x.members.includes(meId()) && x.members.includes(ids[0]));
    if (!c) { c = { id: nid('c'), title: ids.length > 1 ? title : '', group: ids.length > 1, members: [meId(), ...ids], msgs: [], read: {} }; S.chats.unshift(c); }
    if (msg) c.msgs.push({ by: meId(), at: new Date().toISOString(), text: msg });
    ui.chat.id = c.id; save(); closeModal(); go('#/messages');
  },
  chatAddSave: el => {
    const c = S.chats.find(x => x.id === el.dataset.id), ids = $$('.cn-people input:checked').map(i => i.value);
    if (!ids.length) { const e = $('#cn-err'); e.textContent = 'Choose at least one person.'; e.hidden = false; return; }
    ids.forEach(id => { c.members.push(id); c.msgs.push({ sys: true, at: new Date().toISOString(), text: `${me().name} added ${person(id).name}` }); });
    save(); closeModal(); render();
  },
  corrRead: el => corrReadModal(S.corr.find(c => c.id === el.dataset.id)),
  corrRecord: el => corrRecordModal(S.corr.find(c => c.id === el.dataset.id)),
  corrRecordSave: el => {
    const c = S.corr.find(x => x.id === el.dataset.id), f = getFile($('#cr-file').value);
    if (!f) { const e = $('#cr-err'); e.textContent = 'Choose the file to put it in.'; e.hidden = false; return; }
    const p = person(c.from), serial = S.files.flatMap(ff => ff.docs).filter(d => d.kind !== 'response').length + 1;
    const d = { id: nid('d'), folio: String(nextFolio(f)), title: c.subject, kind: CORR_TPL(c.kind) === 'memo' ? 'memo' : 'letter', mime: 'PDF', from: p.name, date: new Date().toISOString(), edms: 'EDMS-0001-2026-' + String(S.seq + 40).padStart(7, '0'),
      pages: 1, sizeKB: 120, minutes: [], stickies: [], signed: true, status: 'filed', to: c.to, subject: c.subject.toUpperCase(), body: toParas(c.body), uploadedBy: meId(), serial, confidentiality: 'Internal', crossRefs: [], enclosures: [] };
    f.docs.push(d); f.updated = new Date().toISOString();
    Object.assign(c, { status: 'recorded', fileId: f.id, docId: d.id, recordedAt: d.date });
    notify(c.from, `Your ${CORR_KIND[c.kind].toLowerCase()} “${c.subject}” was recorded and filed.`, meId(), f.id);
    save(); closeModal(); render(); toast(`Recorded as IN/26/${String(serial).padStart(3, '0')} and filed in ${f.name}`);
  },
  corrReturn: el => corrReturnModal(S.corr.find(c => c.id === el.dataset.id)),
  corrReturnSave: el => {
    const c = S.corr.find(x => x.id === el.dataset.id), why = $('#crt').value.trim();
    if (!why) { const e = $('#crt-err'); e.textContent = 'Say what needs to change.'; e.hidden = false; $('#crt').focus(); return; }
    Object.assign(c, { status: 'returned', returnNote: why, returnedAt: new Date().toISOString() });
    notify(c.from, `“${c.subject}” was returned to you: ${why}`, meId(), null);
    save(); closeModal(); render(); toast(`Returned to ${person(c.from).name}`);
  },
  corrSend: el => corrSendModal(S.corr.find(c => c.id === el.dataset.id)),
  corrSendSave: el => {
    const c = S.corr.find(x => x.id === el.dataset.id), how = $('#cs-how')?.value || '', to = $('#cs-to')?.value || '';
    Object.assign(c, { status: 'sent', sentAt: new Date().toISOString(), how: how || (to ? 'to ' + person(to).name : 'Internal') });
    if (to) notify(to, `${CORR_KIND[c.kind]}: ${c.subject}`, c.from, c.fileId);
    if (c.goes === 'External' && c.docId) S.dispatch[c.docId] = c.sentAt;
    save(); closeModal(); render(); toast(`${c.subject} sent on`);
  },
  repRefresh: () => { render(); toast('Reports refreshed'); },
  corrStart: () => corrStartModal(),
  corrStartGo: () => {
    const subj = $('#cw-subj').value.trim(), kind = ($$('[name=cw-kind]').find(i => i.checked) || {}).value || 'letter';
    if (!subj) { const e = $('#cw-err'); e.textContent = 'Write the subject first.'; e.hidden = false; $('#cw-subj').focus(); return; }
    const c = { id: nid('co'), subject: subj, kind, from: meId(), goes: kind === 'letter' || kind === 'forwarding' ? 'External' : 'Internal', to: '', at: new Date().toISOString(), status: 'draft', body: '' };
    S.corr.unshift(c); save(); if (!location.hash.startsWith('#mycorrespondence')) go('#/mycorrespondence'); else render(); corrWriteModal(c);
  },
  corrEdit: el => corrWriteModal(S.corr.find(c => c.id === el.dataset.id)),
  corrSave: el => { const c = S.corr.find(x => x.id === el.dataset.id); corrFromForm(c); if (c.status !== 'returned') c.status = 'draft'; save(); closeModal(); render(); toast('Draft saved'); },
  corrSubmit: el => {
    const c = S.corr.find(x => x.id === el.dataset.id); corrFromForm(c);
    const e = $('#cw-err2');
    if (!c.to) { e.textContent = 'Say who it goes to.'; e.hidden = false; $('#cw-to').focus(); return; }
    if (!c.body) { e.textContent = 'Write the text before sending it to the Registry.'; e.hidden = false; $('#cw-body').focus(); return; }
    Object.assign(c, { status: 'waiting', at: new Date().toISOString(), returnNote: '' });
    notify('registry', `${CORR_KIND[c.kind]} from ${me().name}: ${c.subject}`, meId(), null);
    save(); closeModal(); render(); toast('Sent to the Registry to record and file');
  },
  rqAsk: el => rqModal(getFile(el.dataset.id)),
  rqSend: el => {
    const why = $('#rq-why').value.trim();
    if (!why) { const e = $('#rq-err'); e.textContent = 'Say why you need it.'; e.hidden = false; $('#rq-why').focus(); return; }
    S.access.unshift({ id: nid('a'), by: meId(), fileId: el.dataset.id, reason: why, days: +$('#rq-days').value, at: new Date().toISOString(), status: 'open' });
    notify('registry', 'Requested a file.', meId(), el.dataset.id);
    save(); closeModal(); render(); toast('Request sent to the Registry');
  },
});
document.addEventListener('input', e => {
  if (e.target.id !== 'chat-q') return;
  ui.chat.q = e.target.value;
  const box = $('#chat-items'); if (!box) return;
  const t = ui.chat.q.trim().toLowerCase();
  box.querySelectorAll('.chat-it').forEach(b => { b.hidden = !!t && !b.textContent.toLowerCase().includes(t); });
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'rq-q') { ui.rqTerm = t.value; const r = $('#rq-res'); if (r) r.innerHTML = rqResults(); return; }
  if (t.dataset.cw && $('#cw-prev')) {
    const p = me(), kind = (S.corr.find(c => c.id === $('[data-act=corrSubmit]')?.dataset.id) || {}).kind || 'letter';
    $('#cw-prev').innerHTML = tplHTML(CORR_TPL(kind), { ref: 'Draft', date: new Date().toISOString(), to: $('#cw-to').value || 'Recipient', subject: ($('#cw-subj2').value || '').toUpperCase(), body: toParas($('#cw-body').value), signer: { name: p.name, title: p.title }, signed: false, org: '' });
  }
});
document.addEventListener('submit', e => {
  const f = e.target.closest('.chat-send'); if (!f) return; e.preventDefault();
  const inp = f.querySelector('#chat-in'), text = inp.value.trim(); if (!text) return;
  const c = S.chats.find(x => x.id === f.dataset.chat);
  c.msgs.push({ by: meId(), at: new Date().toISOString(), text }); c.read[meId()] = new Date().toISOString();
  save(); render(); setTimeout(() => $('#chat-in')?.focus(), 0);
});

render();
