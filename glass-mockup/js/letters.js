/* ==========================================================================
   Letters (Registry journey, version 2)
   1. Upload a letter or document (no file chosen)   2. Details
   3. Send to the Marking Officer                     4. Marking Officer marks it and sends it back
   5. Registry files the letter                       6. Registry sends the file to the Action Officer
   Correspondence (Registry) shows the movement of letters and files to and from
   the Marking and Action Officers.
   ========================================================================== */
const LETTER_STAGE = {
  registry: ['Not sent yet', 't-grey'],
  marking: ['With Marking Officer', 't-blue'],
  marked: ['Marked – file it', 't-amber'],
  filed: ['Filed – send on', 't-teal'],
  action: ['Sent to Action Officer', 't-green'],
};
const getLetter = id => (S.letters || []).find(l => l.id === id);
const letterOpen = l => `#/letter?id=${l.id}`;
/* A letter, or another document (report, quotation, invoice, memo, returns…) going through the same journey */
const letterKind = l => l.kind || (/report|quotation|invoice|returns|minutes|memo|plan|budget|circular/i.test(l.title) ? 'Document' : 'Letter');
const letterNo = l => `IN/26/${String(l.serial).padStart(3, '0')}`;

function ensureLetters() {
  if (S.letters) return;
  const L = (id, serial, title, from, ref, d, stage, extra = {}) => ({ id, serial, title, from, senderRef: ref, received: daysAgo(d, 9, 5), pages: 2, conf: 'Internal', stage, uploadedBy: 'john', movements: [], ...extra });
  S.letters = [
    L('L1', 31, 'Quotation for Vaccine Carriers', 'Kenya Medical Supplies Authority', 'KEMSA/PROC/2026/118', 0, 'registry'),
    L('L2', 30, 'Request for Cold Chain Equipment', 'Kiambu County Department of Health', 'KBU/CDH/VOL.4/77', 1, 'marking',
      { movements: [{ date: daysAgo(1, 10, 40), from: 'john', to: 'vera' }] }),
    L('L3', 29, 'Invitation – Health Sector Working Group', 'Council of Governors', 'COG/HLTH/2026/52', 3, 'marked',
      { movements: [{ date: daysAgo(3, 10), from: 'john', to: 'vera' }, { date: daysAgo(2, 15, 20), from: 'vera', to: 'registry' }],
        marking: { to: 'virah', ins: 'Attend and brief the PS on vaccine financing.', by: 'vera', at: daysAgo(2, 15, 18) } }),
    L('L4', 28, 'Polio Outbreak Response Update', 'World Health Organization', 'WHO/KEN/EPI/2026/19', 4, 'marked',
      { movements: [{ date: daysAgo(4, 11), from: 'john', to: 'vera' }, { date: daysAgo(0, 9, 30), from: 'vera', to: 'registry' }],
        marking: { to: 'otieno', ins: 'Prepare a press statement on the polio response.', by: 'vera', at: daysAgo(0, 9, 28) } }),
  ];
  const add = n => { if (!S.notifications.some(x => x.id === n.id)) S.notifications.unshift({ read: false, fileId: null, ...n }); };
  add({ id: 'nl2', to: 'vera', kind: 'For marking', text: 'A new letter was sent to you for marking: Request for Cold Chain Equipment.', from: 'john', letterId: 'L2', href: '#/letter?id=L2', at: daysAgo(1, 10, 40) });
  add({ id: 'nl3', to: 'registry', kind: 'Marked', text: 'Invitation – Health Sector Working Group was marked to Virah Creates. File it, then send it on.', from: 'vera', letterId: 'L3', href: '#/letter?id=L3', at: daysAgo(2, 15, 20) });
  add({ id: 'nl4', to: 'registry', kind: 'Marked', text: 'Polio Outbreak Response Update was marked to Brian Otieno. File it, then send it on.', from: 'vera', letterId: 'L4', href: '#/letter?id=L4', at: daysAgo(0, 9, 30) });
  S.notifications.sort((a, b) => b.at.localeCompare(a.at));
  save();
}
ensureLetters();
/* Only letters go to the Marking Officer: files that were with her go back to the Registry */
(function onlyLettersToMarking() {
  if (S.lettersOnlyToMarking) return;
  S.files.forEach(f => { if (f.stage === 'marking') { f.stage = 'registry'; f.withUser = 'registry'; f.updated = now(); } });
  S.notifications = S.notifications.filter(n => !(n.to === 'vera' && n.fileId && !n.letterId && ['For marking', 'Sent back'].includes(n.kind)));
  S.lettersOnlyToMarking = true; save();
})();

function notifyL(to, kind, text, l) {
  S.notifications.unshift({ id: nid('n'), to, kind, text, from: meId(), fileId: l.fileId || null, letterId: l.id, href: letterOpen(l), at: new Date().toISOString(), read: false });
}

/* ---------- Letter page ---------- */
function letterCtx(l) {
  return { ref: l.senderRef, date: l.received, to: 'The Principal Secretary, State Department for Medical Services', subject: l.title.toUpperCase(), body: LOREM.slice(0, 3),
    signer: { name: 'Authorised Officer', title: 'For: ' + l.from }, signed: false, org: l.from };
}
const inRegistryFiles = () => S.files.filter(f => !f.draft && ['registry', 'filed'].includes(f.stage) && f.state !== 'Disposed');
function viewLetter(q) {
  const l = getLetter(q.id);
  const r = role(), back = r === 'registry' ? ['Back to Correspondence', '#/correspondence'] : ['Back to My Queue', '#/queue'];
  if (!l) return pageHead({ crumbs: [['Correspondence', '#/correspondence'], ['Letter']], title: 'Letter not found', back }) + `<section class="panel glass"><p class="muted">This letter no longer exists.</p></section>`;
  const [stLabel, stTone] = LETTER_STAGE[l.stage];
  const f = getFile(l.fileId), mk = l.marking;
  let act = '';
  if (r === 'registry' && l.stage === 'registry') act = `<h3>Next: send it to a Marking Officer</h3><p class="muted">Choose who marks it. They read it, say what should be done and by whom, and send it back to you.</p>
      <button class="btn btn-primary" data-act="letterSendMark" data-id="${l.id}">${ic('send')} Send to Marking Officer</button>`;
  else if (r === 'marking' && l.stage === 'marking') act = `<h3>Mark this ${letterKind(l).toLowerCase()}</h3><p class="muted">Say who should act on it and what they should do. It goes back to the Registry to be filed and sent on.</p>
      <div class="field"><label for="lm-to">Action Officer</label><select class="select" id="lm-to">${peopleOpts(p => p.role === 'action', 'virah')}</select></div>
      <div class="field"><label for="lm-ins">Instruction <span class="req">*</span></label><textarea class="textarea" id="lm-ins" placeholder="e.g. Head NVS – please prepare a response by Friday"></textarea></div>
      <button class="btn btn-primary" data-act="letterMark" data-id="${l.id}">${ic('undo')} Mark and send back to Registry</button>`;
  else if (r === 'registry' && l.stage === 'marked') {
    const files = inRegistryFiles();
    act = `<h3>Next: file this ${letterKind(l).toLowerCase()}</h3><p class="muted">Choose the file it belongs in. It becomes the next folio there, with the marking as its first minute.</p>
      <div class="field"><label for="lf-file">File <span class="req">*</span></label><select class="select" id="lf-file" data-change="letterFilePick"><option value="">Search or select file…</option>${files.map(ff => `<option value="${ff.id}" ${ui.lfFile === ff.id ? 'selected' : ''}>${esc(ff.name)} — ${esc(ff.ref)}</option>`).join('')}</select>
        <span class="hint">${ui.lfFile && getFile(ui.lfFile) ? `It will be folio ${nextFolio(getFile(ui.lfFile))} in ${esc(getFile(ui.lfFile).name)}.` : 'Only files that are in the Registry are listed.'}</span></div>
      <button class="btn btn-primary" data-act="letterFile" data-id="${l.id}">${ic('archive')} File this ${letterKind(l).toLowerCase()}</button>`;
  } else if (r === 'registry' && l.stage === 'filed') act = `<h3>Next: send it to the Action Officer</h3><p class="muted">Filed as folio ${esc(l.folio)} in ${f ? esc(f.name) : 'the file'}. It was marked to ${esc(person(mk.to).name)}; choose the Action Officer the whole file goes to.</p>
      <div class="lt-btns"><button class="btn btn-primary" data-act="letterSendAction" data-id="${l.id}">${ic('send')} Send to Action Officer</button>${f ? `<a class="btn btn-light" href="#/file/${f.id}/doc/${l.docId}">${ic('folder')} Open in file</a>` : ''}</div>`;
  else if (l.stage === 'action') act = `<h3>Sent to the Action Officer</h3><p class="muted">The file is with ${esc(person(l.actionTo || mk.to).name)}. Follow it on Correspondence › To Action Officer.</p>${f ? `<a class="btn btn-light" href="#/file/${f.id}/doc/${l.docId}">${ic('folder')} Open in ${esc(f.name)}</a>` : ''}`;
  else act = `<h3>${esc(stLabel)}</h3><p class="muted">${l.stage === 'marking' ? `Waiting for ${esc(person(l.withUser || 'vera').name)} to mark it.` : 'Nothing for you to do on this letter right now.'}</p>`;
  const who = id => id === 'registry' ? 'Registry' : person(id).name;
  return pageHead({ crumbs: [[r === 'registry' ? 'Correspondence' : 'My Queue', r === 'registry' ? '#/correspondence' : '#/queue'], [l.title]], back, title: esc(l.title),
      sub: `From ${esc(l.from)} · ${esc(l.senderRef || 'No reference')} · Received ${fmtDay(l.received)}`,
      meta: `<span class="chip ${stTone}">${stLabel}</span><span class="chip t-neutral">${ic('lock')} ${esc(l.conf)}</span><span class="chip t-neutral">${letterNo(l)}</span>${f ? `<span class="chip t-neutral">${ic('folder')} ${esc(f.name)} · F.${esc(l.folio)}</span>` : ''}` }) + `
    <div class="lt">
      <section class="lt-doc card"><div class="viewer"><div class="viewer-bar"><span class="vb-name">${esc(l.title)} · ${plural(l.pages, 'page')}</span></div>
        <div class="viewer-page"><div class="page"><div class="content">${tplHTML('letter', letterCtx(l))}</div></div></div></div></section>
      <div class="lt-side">
        <section class="panel glass lt-act">${act}</section>
        ${mk ? `<section class="instruction">${ic('sticky')}<div><b>Marking instruction</b> – ${esc(mk.ins)} <span class="muted">(marked to ${esc(person(mk.to).name)} by ${esc(person(mk.by).name)}, ${fmtDT(mk.at)})</span></div></section>` : ''}
        <section class="panel glass"><div class="panel-h"><h2>Movement</h2></div>
          <ol class="lt-moves"><li><span class="dot"></span><div><b>Uploaded by ${esc(person(l.uploadedBy).name)}</b><small>${fmtDT(l.received)}</small></div></li>
          ${l.movements.map(m => `<li><span class="dot"></span><div><b>${esc(who(m.from))} → ${esc(who(m.to))}</b><small>${fmtDT(m.date)}${m.note ? ' · ' + esc(m.note) : ''}</small></div></li>`).join('')}</ol></section>
      </div>
    </div>`;
}

/* ---------- Correspondence (Registry): movement to and from the officers ---------- */
const CORR_TABS = { marking: 'To Marking Officer', action: 'To Action Officer' };
const CORR_SUB = {
  marking: {
    all: 'Every letter or document sent to the Marking Officer, and what has come back.',
    sent: 'Letters and documents sent to the Marking Officer that are waiting to be marked.',
    received: 'Letters and documents the Marking Officer has marked and sent back. Next: file each one, then send the file to the Action Officer.',
  },
  action: {
    all: 'Every file sent to Action Officers – the whole file moves – and what has come back.',
    sent: 'Files sent to Action Officers that they are still working on.',
    received: 'Files Action Officers have finished and sent back to the Registry. Next: dispatch the reply or file it away.',
  },
};
const isActionOfficer = id => PEOPLE[id] && PEOPLE[id].role === 'action';
const isMarkingOfficer = id => PEOPLE[id] && PEOPLE[id].role === 'marking';
function markingItems() {
  const out = [];
  (S.letters || []).forEach(l => {
    const sent = [...l.movements].reverse().find(m => isMarkingOfficer(m.to)), back = [...l.movements].reverse().find(m => isMarkingOfficer(m.from));
    const state = l.stage === 'marking' ? 'sent' : l.stage === 'marked' ? 'received' : l.stage === 'registry' ? 'unsent' : 'done';
    let btn = `<a class="btn btn-light btn-xs" href="${letterOpen(l)}">${ic('eye')} Open</a>`;
    if (l.stage === 'registry') btn = `<button class="btn btn-primary btn-xs" data-act="letterSendMark" data-id="${l.id}">${ic('send')} Send to Marking Officer</button>`;
    if (l.stage === 'marked') btn = `<a class="btn btn-primary btn-xs" href="${letterOpen(l)}">${ic('archive')} File this ${letterKind(l).toLowerCase()}</a>`;
    if (l.stage === 'filed') btn = `<button class="btn btn-primary btn-xs" data-act="letterSendAction" data-id="${l.id}">${ic('send')} Send to Action Officer</button>`;
    out.push({ kind: letterKind(l), state, at: (back || sent || {}).date || l.received, title: l.title, sub: `${letterNo(l)} · ${l.senderRef || ''}`, href: letterOpen(l), from: l.from,
      status: LETTER_STAGE[l.stage], withName: sent ? person(sent.to).name : '', sent: sent && sent.date, back: back && back.date, to: l.marking ? person(l.marking.to).name : '—', btn });
  });
  return out.sort((a, b) => b.at.localeCompare(a.at));
}
function actionItems() {
  return S.files.filter(f => !f.draft && (f.movements.some(m => isActionOfficer(m.to)) || ['action', 'returned_action'].includes(f.stage))).map(f => {
    const sent = [...f.movements].reverse().find(m => isActionOfficer(m.to)) || { date: f.updated, to: f.withUser };
    const back = [...f.movements].reverse().find(m => isActionOfficer(m.from) && m.to === 'registry');
    const state = f.stage === 'action' ? 'sent' : f.stage === 'returned_action' ? 'received' : 'done';
    const status = state === 'sent' ? [f.delegatedBy ? 'Delegated' : 'With Action Officer', 't-blue'] : state === 'received' ? ['Returned from action', 't-amber'] : [STAGES[f.stage]?.short || 'In Registry', 't-grey'];
    const letter = (S.letters || []).find(l => l.fileId === f.id && l.stage === 'action');
    const btn = state === 'received' ? `<button class="btn btn-primary btn-xs" data-act="fileAway" data-id="${f.id}">${ic('archive')} File away</button><a class="btn btn-light btn-xs" href="#/file/${f.id}">${ic('folder')} Open</a>` : `<a class="btn btn-light btn-xs" href="#/file/${f.id}">${ic('folder')} Open</a>`;
    return { kind: 'File', state, at: (back || sent).date, title: f.name, sub: f.ref + (letter ? ` · Letter: ${letter.title}` : ''), href: `#/file/${f.id}`, from: person(f.withUser === 'registry' ? (back ? back.from : sent.to) : f.withUser).name || '—',
      status, sent: sent.date, back: back && back.date > sent.date ? back.date : null, to: f.instruction || '—', btn };
  }).sort((a, b) => b.at.localeCompare(a.at));
}
function viewCorrMovement(q) {
  const [main, show] = (() => { const t = q.tab || 'marking'; const m = t.startsWith('action') ? 'action' : 'marking'; const s = t.slice(m.length) || 'all'; return [m, ['all', 'sent', 'received'].includes(s) ? s : 'all']; })();
  const items = main === 'marking' ? markingItems() : actionItems();
  const count = s => items.filter(x => s === 'all' || x.state === s).length;
  const list = items.filter(x => show === 'all' || x.state === show);
  const mCount = markingItems().filter(x => x.state === 'received').length, aCount = actionItems().filter(x => x.state === 'received').length;
  const isM = main === 'marking';
  const head = isM ? ['Letter or document', 'From', 'Status', 'Sent', 'Returned', 'Marked to', ''] : ['File', 'Officer', 'Status', 'Sent', 'Returned', 'Instruction', ''];
  const rows = list.map(x => `<tr data-s="${esc(x.sub)}"><td data-v="${x.kind}"><span class="lt-kind ${x.kind === 'File' ? '' : 'is-letter'}" title="${x.kind}">${ic(x.kind === 'Letter' ? 'mail' : x.kind === 'Document' ? 'file' : 'folder')}</span><a href="${x.href}"><b>${esc(x.title)}</b></a>${isM ? ` <span class="chip t-neutral lt-kchip">${x.kind}</span>` : ''}<small class="sub mono">${esc(x.sub)}</small></td>
      <td>${esc(x.from)}</td><td data-v="${x.status[0]}"><span class="chip ${x.status[1]}">${x.status[0]}</span>${x.withName ? `<small class="sub">${isM ? 'Marking Officer' : 'Officer'}: ${esc(x.withName)}</small>` : ''}</td><td data-d="${x.sent || ''}">${x.sent ? fmtDT(x.sent) : '—'}</td><td data-d="${x.back || ''}">${x.back ? fmtDT(x.back) : '—'}</td>
      <td>${isM ? esc(x.to) : `<span class="lt-ins">${esc(x.to)}</span>`}</td><td><div class="row-btns">${x.btn}</div></td></tr>`);
  const showLabel = { all: 'All', sent: 'Sent', received: 'Received' };
  return pageHead({ crumbs: [['Correspondence']], title: 'Correspondence', sub: 'View movement of letters and files from marking and action officers',
      right: `<a class="btn btn-primary" href="#/upload">${ic('upload')} Upload a letter or document</a>` }) + `
    <nav class="set-tabs" aria-label="Correspondence">${Object.entries(CORR_TABS).map(([k, l]) => `<a class="set-tab ${k === main ? 'on' : ''}" href="#/correspondence?tab=${k}" ${k === main ? 'aria-current="page"' : ''}>${ic(k === 'marking' ? 'pen' : 'user')} ${l}${(k === 'marking' ? mCount : aCount) ? `<span class="count">${k === 'marking' ? mCount : aCount}</span>` : ''}</a>`).join('')}</nav>
    <section class="panel glass ct-panel">
      <div class="ct-seg" role="tablist" aria-label="${CORR_TABS[main]}">${['all', 'sent', 'received'].map(s => `<a role="tab" class="${s === show ? 'on' : ''}" aria-selected="${s === show}" href="#/correspondence?tab=${main}${s === 'all' ? '' : s}">${showLabel[s]} <span class="n">${count(s)}</span></a>`).join('')}</div>
      <p class="ct-sub">${CORR_SUB[main][show]}</p>
      ${simpleTable(head, rows, show === 'received' ? (isM ? 'No letters or documents have come back from the Marking Officer yet.' : 'Nothing has come back from Action Officers yet.') : 'Nothing here yet.',
        { key: `ct-${main}-${show}`, search: isM ? 'Search letters and documents – subject, sender or reference' : 'Search files – name, reference or officer', date: [3, 'Sent from', 'Sent to'], facets: isM ? [[0, 'Letter or document'], [1, 'From'], [2, 'Status']] : [[1, 'Officer'], [2, 'Status']], paged: true })}
    </section>`;
}
/* Letters waiting for the Registry (shown as the Correspondence count) */
const lettersWaiting = () => (S.letters || []).filter(l => ['marked', 'filed'].includes(l.stage)).length;
/* Letters waiting for the Marking Officer (her My Queue) */
const lettersToMark = () => (S.letters || []).filter(l => l.stage === 'marking' && (l.withUser || 'vera') === meId());
function lettersToMarkPanel() {
  const ls = lettersToMark(); if (!ls.length) return '';
  return `<section class="panel glass lt-tomark"><div class="panel-h"><h2>Letters to mark <span class="n-pill">${ls.length}</span></h2></div>
    <p class="muted" style="margin:-4px 0 12px">Letters the Registry sent you. Mark each one and it goes back to be filed.</p>
    ${simpleTable(['Letter or document', 'From', 'Received', ''], ls.map(l => `<tr data-href="${letterOpen(l)}"><td><b>${esc(l.title)}</b><small class="sub mono">${letterNo(l)} · ${esc(l.senderRef)}</small></td><td>${esc(l.from)}</td><td>${fmtDT(l.received)}</td><td><a class="btn btn-primary btn-xs" href="${letterOpen(l)}">${ic('pen')} Mark</a></td></tr>`), '')}</section>`;
}

Object.assign(ACT, {
  letterFilePick: el => { ui.lfFile = el.value; render(); },
  letterSendMark: el => letterSendModal((el.dataset.ids || el.dataset.id).split(','), 'marking'),
  letterSendConfirm: el => {
    const ids = el.dataset.ids.split(','), to = val('ls-to'), note = val('ls-note'), mk = el.dataset.to === 'marking';
    if (!to) { const e = $('#ls-err'); e.textContent = `Choose the ${mk ? 'Marking' : 'Action'} Officer.`; e.hidden = false; return; }
    ids.forEach(id => {
      const l = getLetter(id); if (!l) return;
      if (mk) {
        l.stage = 'marking'; l.withUser = to; l.movements.push({ date: now(), from: meId(), to, note });
        notifyL(to, 'For marking', `A new letter was sent to you for marking: ${l.title}.`, l);
      } else {
        const f = getFile(l.fileId); if (!f) return;
        f.stage = 'action'; f.withUser = to; f.markedTo = to; f.instruction = l.marking.ins; f.sentBy = meId(); f.delegatedBy = null;
        if (note) addMinute(f, getDoc(f, l.docId), note, meId());
        move(f, meId(), to);
        S.notifications.unshift({ id: nid('n'), to, kind: 'For action', text: `File forwarded to you: ${l.title} (folio ${l.folio}).`, from: meId(), fileId: f.id, docId: l.docId, at: now(), read: false });
        l.stage = 'action'; l.actionTo = to; l.movements.push({ date: now(), from: 'registry', to, note: `Whole file ${f.name} sent` });
      }
    });
    save(); closeModal(); render(); refreshNotifDrawer();
    toast(`${ids.length > 1 ? plural(ids.length, 'letter') : 'Sent'}${ids.length > 1 ? ' sent' : ''} to ${person(to).name}`);
  },
  letterMark: el => {
    const l = getLetter(el.dataset.id), ins = need('lm-ins', 'Instruction'); if (!l || !ins) return;
    const to = val('lm-to');
    l.marking = { to, ins, by: meId(), at: now() }; l.stage = 'marked'; l.movements.push({ date: now(), from: meId(), to: 'registry' });
    notifyL('registry', 'Marked', `${l.title} was marked to ${person(to).name}. File it, then send it on.`, l);
    save(); go('#/queue'); toast('Marked and sent back to the Registry');
  },
  letterFile: el => {
    const l = getLetter(el.dataset.id), f = getFile(val('lf-file'));
    if (!l) return;
    if (!f) { toast('Choose the file this letter goes into.'); $('#lf-file')?.focus(); return; }
    const folio = nextFolio(f);
    const d = { id: nid('d'), folio, title: l.title, kind: 'letter', mime: 'PDF', from: l.from, date: l.received, edms: 'EDMS-0001-2026-' + String(S.seq + 40).padStart(7, '0'), pages: l.pages, sizeKB: 240,
      minutes: [], stickies: [], signed: false, status: 'filed', to: 'The Principal Secretary, State Department for Medical Services', subject: l.title.toUpperCase(), body: LOREM,
      uploadedBy: l.uploadedBy, senderRef: l.senderRef, serial: l.serial, confidentiality: l.conf, restricted: [], crossRefs: [], enclosures: [] };
    f.docs.push(d);
    addMinute(f, d, `${person(l.marking.to).title} – ${l.marking.ins}`, l.marking.by, { ink: 'red' });
    f.markedTo = l.marking.to; f.instruction = l.marking.ins; f.updated = now();
    Object.assign(l, { stage: 'filed', fileId: f.id, docId: d.id, folio });
    l.movements.push({ date: now(), from: 'registry', to: 'registry', note: `Filed as folio ${folio} in ${f.name}` });
    ui.lfFile = ''; save(); render(); toast(`Filed as folio ${folio} in ${f.name}`);
  },
  letterSendAction: el => letterSendModal([el.dataset.id], 'action'),
  notifRead: el => { const n = S.notifications.find(x => x.id === el.dataset.id); if (n) { n.read = !n.read; save(); refreshNotifDrawer(); render(); } },
});
/* Choose who a letter goes to: a Marking Officer, or (once filed) an Action Officer with the whole file */
function letterSendModal(ids, to) {
  const ls = ids.map(getLetter).filter(Boolean); if (!ls.length) return;
  const mk = to === 'marking', l = ls[0], f = !mk && getFile(l.fileId);
  modal(`${mHead('send', mk ? 'Send to a Marking Officer' : 'Send to an Action Officer', ls.length > 1 ? plural(ls.length, 'letter') : esc(l.title))}
    <div class="modal-b">
      ${mk ? '' : `<div class="instruction" style="margin:0">${ic('sticky')}<div><b>Marked to ${esc(person(l.marking.to).name)}</b> – ${esc(l.marking.ins)}</div></div>
        <p class="form-note">${ic('folder')} The whole file goes: ${f ? `<b>${esc(f.name)}</b> (${esc(f.ref)}), with this letter as folio ${esc(l.folio)}` : 'the file this letter is in'}.</p>`}
      <div class="field"><label for="ls-to">${mk ? 'Marking Officer' : 'Action Officer'} <span class="req">*</span></label>
        <select class="select" id="ls-to"><option value="">Choose who to send it to…</option>${peopleOpts(p => p.role === (mk ? 'marking' : 'action'), mk ? '' : l.marking.to)}</select>
        <span class="hint">${mk ? 'They mark it and send it back to the Registry to be filed.' : 'Usually the officer it was marked to. Choose another officer if it should go elsewhere.'}</span></div>
      <div class="field"><label for="ls-note">${mk ? 'Note' : 'Minute'} <span class="muted" style="font-weight:500">(optional)</span></label><textarea class="textarea" id="ls-note" placeholder="${mk ? 'e.g. Urgent – reply needed by Friday' : 'e.g. Follow the marking instruction'}"></textarea></div>
      <p class="form-err" id="ls-err" role="alert" hidden></p>
    </div>
    <div class="modal-f"><button class="btn btn-light" data-act="close">Cancel</button><button class="btn btn-primary" data-act="letterSendConfirm" data-to="${to}" data-ids="${ids.join(',')}">${ic('send')} Send</button></div>`, '', '#ls-to');
}
/* Keep the notification pop-up open after an action, with fresh contents */
function refreshNotifDrawer() {
  const list = document.querySelector('#drawer .list'); if (!list) return;
  list.innerHTML = myNotifs().map(notifCard).join('') || '<p class="muted">No notifications.</p>';
  const sub = document.querySelector('#drawer .modal-h small, #drawer .mh-sub'); if (sub) sub.textContent = `${unread()} unread`;
}
/* The action a notification asks for, as a button in the pop-up */
function notifAction(n) {
  const r = role(), B = (act, label, icon, extra = '') => `<button type="button" class="btn btn-primary btn-xs" data-act="${act}" ${extra}>${ic(icon)} ${label}</button>`;
  const G = (href, label, icon) => `<button type="button" class="btn btn-primary btn-xs" data-act="notifGo" data-id="${n.id}" data-to="${href}">${ic(icon)} ${label}</button>`;
  const l = n.letterId && getLetter(n.letterId);
  if (l) {
    if (r === 'registry' && l.stage === 'registry') return B('letterSendMark', 'Send to Marking Officer', 'send', `data-id="${l.id}"`);
    if (r === 'registry' && l.stage === 'marked') return G(letterOpen(l), `File this ${letterKind(l).toLowerCase()}`, 'archive');
    if (r === 'registry' && l.stage === 'filed') return B('letterSendAction', 'Send to Action Officer', 'send', `data-id="${l.id}"`);
    if (r === 'marking' && l.stage === 'marking') return G(letterOpen(l), `Mark this ${letterKind(l).toLowerCase()}`, 'pen');
    return G(letterOpen(l), 'Open letter', 'mail');
  }
  const f = n.fileId && getFile(n.fileId);
  if (f) {
    if (r === 'registry' && f.stage === 'returned_marking') return B('sendFile', 'Send to Action Officer', 'send', `data-id="${f.id}" data-to="action"`);
    if (r === 'registry' && f.stage === 'returned_action') return B('fileAway', 'File away', 'archive', `data-id="${f.id}"`);
    if (r === 'marking' && f.stage === 'marking' && f.withUser === meId()) return B('markFile', 'Mark file', 'pen', `data-id="${f.id}"`);
    if (r === 'action' && f.stage === 'action' && f.withUser === meId()) return G(`#/file/${f.id}`, 'Act on it', 'reply');
  }
  if (n.kind === 'Bring up') return G('#/bringup', 'Open Bring Up Diary', 'calendar');
  if (n.href && /approvals/.test(n.href)) return G(n.href, 'Review', 'checkCircle');
  if (n.href && /requestfiles/.test(n.href)) return G(n.href, 'My requests', 'filePlus');
  if (n.href && /access/.test(n.href)) return G(n.href, 'Review access', 'lock');
  if (n.href && /corr/.test(n.href)) return G(n.href, 'Open', 'mail');
  return '';
}
