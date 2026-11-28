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
/* Before it is filed, a letter is annotated on its own page: l.doc holds its minutes, sticky notes and comments.
   letterFile() is a stand-in file (never listed anywhere) so the same comment and sticky-note tools work on it. */
function letterDoc(l) {
  if (!l.doc) l.doc = { id: 'd' + l.id, folio: '—', title: l.title, kind: 'letter', mime: 'PDF', from: l.from, date: l.received, edms: `IN/26/${String(l.serial).padStart(3, '0')}`, pages: l.pages, sizeKB: 240,
    minutes: [], stickies: [], comments: [], signed: false, status: 'filed', to: 'The Principal Secretary, State Department for Medical Services', subject: l.title.toUpperCase(), body: LOREM, senderRef: l.senderRef, confidentiality: l.conf };
  if (isSampleDoc(l.fileName)) l.doc.imgs = extPages({ files: [l.fileName] }); else delete l.doc.imgs;
  return l.doc;
}
/* The sample PDFs that have page images in sample-documents/pages */
const SAMPLE_DOCS = ["01-Kilima-County-Cold-Chain-Request", "02-Afya-Bora-Quotation-Vaccine-Carriers", "03-Mwangaza-Hospital-Quarterly-Report", "04-Internal-Memo-ICT-System-Maintenance", "05-Pamoja-Health-Workers-Union-Meeting-Request", "06-Kilima-County-Measles-Campaign-Plan", "07-Afya-Bora-Invoice-INV-2026-0937", "08-Health-Sector-Forum-Invitation", "09-Mwangaza-Hospital-Staff-Establishment-Returns"];
const isSampleDoc = n => !!n && SAMPLE_DOCS.includes(String(n).replace(/\.pdf$/i, ''));
const LETTER_FILES = {};
function letterFile(l) {
  if (!l) return undefined;
  const vf = LETTER_FILES[l.id] || (LETTER_FILES[l.id] = { id: l.id, virtual: true, ref: `IN/26/${String(l.serial).padStart(3, '0')}`, registry: 'main', type: 'ordinary', cover: { color: 'teal' }, movements: [], createdBy: l.uploadedBy, created: l.received });
  Object.assign(vf, { name: l.title, docs: [letterDoc(l)], confidentiality: l.conf, updated: l.received,
    stage: l.stage === 'marking' ? 'marking' : l.stage === 'registry' || l.stage === 'marked' ? 'registry' : 'filed', withUser: l.stage === 'marking' ? (l.withUser || 'vera') : 'registry' });
  return vf;
}
const letterNo = l => `IN/26/${String(l.serial).padStart(3, '0')}`;

function ensureLetters() {
  if (S.letters) return;
  const L = (id, serial, title, from, ref, d, stage, extra = {}) => ({ id, serial, title, from, senderRef: ref, received: daysAgo(d, 9, 5), pages: 2, conf: 'Internal', stage, uploadedBy: 'john', movements: [], ...extra });
  S.letters = [
    L('L1', 31, 'Quotation for Vaccine Carriers', 'Afya Bora Medical Supplies Ltd', 'ABMS/Q/2026/1184', 0, 'registry', { fileName: '02-Afya-Bora-Quotation-Vaccine-Carriers.pdf', pages: 1 }),
    L('L2', 30, 'Request for Cold Chain Equipment', 'Kilima County Department of Health', 'KCDH/CC/2026/041', 1, 'marking', { fileName: '01-Kilima-County-Cold-Chain-Request.pdf', pages: 1,
      movements: [{ date: daysAgo(1, 10, 40), from: 'john', to: 'vera' }] }),
    L('L3', 29, 'Invitation – Health Sector Working Group', 'Health Sector Partners Forum', 'HSPF/SEC/2026/52', 3, 'marked',
      { fileName: '08-Health-Sector-Forum-Invitation.pdf', pages: 1, movements: [{ date: daysAgo(3, 10), from: 'john', to: 'vera' }, { date: daysAgo(2, 15, 20), from: 'vera', to: 'registry' }],
        marking: { to: 'virah', ins: 'Attend and brief the PS on vaccine financing.', by: 'vera', at: daysAgo(2, 15, 18) } }),
    L('L4', 28, 'Polio Outbreak Response Update', 'World Health Organization', 'WHO/KEN/EPI/2026/19', 4, 'marked',
      { movements: [{ date: daysAgo(4, 11), from: 'john', to: 'vera' }, { date: daysAgo(0, 9, 30), from: 'vera', to: 'registry' }],
        marking: { to: 'otieno', ins: 'Prepare a press statement on the polio response.', by: 'vera', at: daysAgo(0, 9, 28) } }),
  ];
  const add = n => { if (!S.notifications.some(x => x.id === n.id)) S.notifications.unshift({ read: false, fileId: null, ...n }); };
  add({ id: 'nl2', to: 'vera', kind: 'For marking', text: 'A new letter was sent to you for marking: Request for Cold Chain Equipment.', from: 'john', letterId: 'L2', href: '#/letter?id=L2', at: daysAgo(1, 10, 40) });
  add({ id: 'nl3', to: 'registry', kind: 'Marked', text: 'Invitation – Health Sector Working Group was marked to Virah Creates. File it, then send it on.', from: 'vera', letterId: 'L3', href: '#/letter?id=L3', at: daysAgo(2, 15, 20) });
  add({ id: 'nl4', to: 'registry', kind: 'Marked', text: 'Polio Outbreak Response Update has been marked to the Head, Public Communication. File it, then send the file on.', from: 'vera', letterId: 'L4', href: '#/letter?id=L4', at: daysAgo(0, 9, 30) });
  S.notifications.sort((a, b) => b.at.localeCompare(a.at));
  save();
}
ensureLetters();
/* Seeded letters use the sample documents, so officers see the real pages */
if (S.letters && !S.lettersSampleDocs) {
  const SD = { L1: ['02-Afya-Bora-Quotation-Vaccine-Carriers.pdf', 'Afya Bora Medical Supplies Ltd', 'ABMS/Q/2026/1184'], L2: ['01-Kilima-County-Cold-Chain-Request.pdf', 'Kilima County Department of Health', 'KCDH/CC/2026/041'], L3: ['08-Health-Sector-Forum-Invitation.pdf', 'Health Sector Partners Forum', 'HSPF/SEC/2026/52'] };
  S.letters.forEach(l => { const d = SD[l.id]; if (d && !l.fileName) { l.fileName = d[0]; l.from = d[1]; l.senderRef = d[2]; l.pages = 1; if (l.doc) { l.doc.from = d[1]; l.doc.senderRef = d[2]; l.doc.pages = 1; } } });
  S.lettersSampleDocs = true; save();
}
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
/* Any open file can take the letter – also one that is with an Action Officer at the moment */
const inRegistryFiles = () => S.files.filter(f => !f.draft && f.state !== 'Disposed' && f.state !== 'Closed');
function viewLetterItem(q) {
  const l = getLetter(q.id);
  const r = role(), back = r === 'registry' ? ['Back to Correspondence', '#/correspondence'] : ['Back to My Queue', '#/queue'];
  if (!l) return pageHead({ crumbs: [['Correspondence', '#/correspondence'], ['Letter']], title: 'Letter not found', back }) + `<section class="panel glass"><p class="muted">This letter no longer exists.</p></section>`;
  const [stLabel, stTone] = LETTER_STAGE[l.stage];
  const f = getFile(l.fileId), mk = l.marking;
  let act = '';
  if (r === 'registry' && l.stage === 'registry') { const stamped = normMarks(letterDoc(l).marks)?.stamp.on, ss = signState(letterDoc(l).marks);
    act = `<h3>Next: stamp it and send it to a Marking Officer</h3><p class="muted">Stamp the letter first. Then choose who marks it: they say what should be done and by whom, and send it back to you.</p>
      <p class="lt-stamp-state ${stamped ? 'ok' : ''}">${ic(stamped ? 'checkCircle' : 'stamp')} ${stamped ? 'Stamped' : 'Not stamped yet'}</p>
      <div class="row-btns">${ss.can ? `<button class="btn btn-primary" data-act="letterStamp" data-id="${l.id}">${ic('stamp')} Stamp and sign</button>` : ''}<button class="btn ${stamped ? 'btn-primary' : 'btn-outline'}" data-act="letterSendMark" data-id="${l.id}">${ic('send')} Send to Marking Officer</button></div>`; }
  else if (r === 'marking' && l.stage === 'marking') act = `<h3>Mark this ${letterKind(l).toLowerCase()}</h3><p class="muted">Say who should act on it and what they should do. It goes back to the Registry to be filed and sent on.</p>
      <div class="field"><label for="lm-to">Action Officer</label><select class="select" id="lm-to">${peopleOpts(p => p.role === 'action', 'virah')}</select></div>
      <div class="field"><label for="lm-ins">Instruction <span class="req">*</span></label><textarea class="textarea" id="lm-ins" placeholder="e.g. Head NVS – please prepare a response by Friday"></textarea></div>
      <button class="btn btn-primary" data-act="letterMark" data-id="${l.id}">${ic('undo')} Mark and send back to Registry</button>`;
  else if (r === 'registry' && l.stage === 'marked') {
    const files = inRegistryFiles();
    act = `<h3>Next: file this ${letterKind(l).toLowerCase()}</h3><p class="muted">Choose the file it belongs in. It becomes the next folio there, with the marking as its first minute.</p>
      <div class="field"><label for="lf-file">File <span class="req">*</span></label><select class="select" id="lf-file" data-change="letterFilePick"><option value="">Search or select file…</option>${files.map(ff => `<option value="${ff.id}" ${ui.lfFile === ff.id ? 'selected' : ''}>${esc(ff.name)} — ${esc(ff.ref)}${['action', 'delegated'].includes(ff.stage) && ff.withUser ? ` (now with the ${esc(person(ff.withUser).name)})` : ''}</option>`).join('')}</select>
      ${(() => { const ff = getFile(ui.lfFile); return ff && ['action', 'delegated', 'marking'].includes(ff.stage) ? `<span class="hint">${ic('info')} This file is with the ${esc(person(ff.withUser).name)} at the moment. The letter is still filed in it as the next folio, and they are told.</span>` : ''; })()}
        <span class="hint">${ui.lfFile && getFile(ui.lfFile) ? `It will be folio ${nextFolio(getFile(ui.lfFile))} in ${esc(getFile(ui.lfFile).name)}.` : 'Every open file is listed, including files that are with an Action Officer.'}</span></div>
      <button class="btn btn-primary" data-act="letterFile" data-id="${l.id}">${ic('archive')} File this ${letterKind(l).toLowerCase()}</button>`;
  } else if (r === 'registry' && l.stage === 'filed') act = `<h3>Next: send it to the Action Officer</h3><p class="muted">Filed as folio ${esc(l.folio)} in ${f ? esc(f.name) : 'the file'}. It was marked to ${esc(person(mk.to).name)}; choose the Action Officer the whole file goes to.</p>
      <div class="lt-btns"><button class="btn btn-primary" data-act="letterSendAction" data-id="${l.id}">${ic('send')} Send to Action Officer</button>${f ? `<a class="btn btn-light" href="#/file/${f.id}/doc/${l.docId}">${ic('folder')} Open in file</a>` : ''}</div>`;
  else if (l.stage === 'action') act = `<h3>Sent to the Action Officer</h3><p class="muted">The file is with ${esc(person(l.actionTo || mk.to).name)}. Follow it on Correspondence › Action Officer.</p>${f ? `<a class="btn btn-light" href="#/file/${f.id}/doc/${l.docId}">${ic('folder')} Open in ${esc(f.name)}</a>` : ''}`;
  else act = `<h3>${esc(stLabel)}</h3><p class="muted">${l.stage === 'marking' ? `Waiting for ${esc(person(l.withUser || 'vera').name)} to mark it.` : 'Nothing for you to do on this letter right now.'}</p>`;
  const who = id => id === 'registry' ? 'Registry' : person(id).name;
  return pageHead({ crumbs: [[r === 'registry' ? 'Correspondence' : 'My Queue', r === 'registry' ? '#/correspondence' : '#/queue'], [l.title]], back, title: esc(l.title),
      sub: `From ${esc(l.from)} · ${esc(l.senderRef || 'No reference')} · Received ${fmtDay(l.received)}`,
      meta: `<span class="chip ${stTone}">${stLabel}</span><span class="chip t-neutral">${ic('lock')} ${esc(l.conf)}</span><span class="chip t-neutral">${letterNo(l)}</span>${f ? `<span class="chip t-neutral">${ic('folder')} ${esc(f.name)} · F.${esc(l.folio)}</span>` : ''}` }) + `
    <div class="lt">
      <section class="lt-doc">${(() => { if (l.fileId && getFile(l.fileId) && getDoc(getFile(l.fileId), l.docId)) { const ff = getFile(l.fileId), dd = getDoc(ff, l.docId); return `<div class="lt-filed-note">${ic('folder')} Filed as folio ${esc(dd.folio)} in <a href="#/file/${ff.id}/doc/${dd.id}">${esc(ff.name)}</a>. Comments and sticky notes moved with it.</div><div class="pages lt-pages">${folioBar(ff, dd)}${pageHTML(ff, dd)}</div>`; }
          const vf = letterFile(l), d = letterDoc(l); return `<div class="pages lt-pages is-unfiled">${folioBar(vf, d)}${pageHTML(vf, d)}</div>`; })()}</section>
      <div class="lt-side">
        <section class="panel glass lt-act">${act}</section>
        ${mk ? `<section class="instruction">${ic('sticky')}<div><b>Marking instruction</b> – ${esc(mk.ins)} <span class="muted">(marked to ${esc(person(mk.to).name)} by ${esc(person(mk.by).name)}, ${fmtDT(mk.at)})</span></div></section>` : ''}
        ${r === 'marking' ? letterNotesPanel(l) : ''}
        <section class="panel glass"><div class="panel-h"><h2>Movement</h2></div>
          <ol class="lt-moves"><li><span class="dot"></span><div><b>Uploaded by ${esc(person(l.uploadedBy).name)}</b><small>${fmtDT(l.received)}</small></div></li>
          ${l.movements.map(m => `<li><span class="dot"></span><div><b>${esc(who(m.from))} → ${esc(who(m.to))}</b><small>${fmtDT(m.date)}${m.note ? ' · ' + esc(m.note) : ''}</small></div></li>`).join('')}</ol></section>
      </div>
    </div>`;
}

function letterNotesPanel(l) {
  const ff = l.fileId && getFile(l.fileId), d = ff ? getDoc(ff, l.docId) : letterDoc(l);
  if (!d) return '';
  const minutes = d.minutes.filter(m => m.n), sticks = d.stickies.filter(seesSticky), comments = d.comments || [];
  const n = minutes.length + sticks.length + comments.length;
  return `<section class="panel glass lt-notes"><div class="panel-h"><h2>${ic('chat')} Comments and notes</h2><span class="n-pill">${n}</span></div>
    ${minutes.map(m => `<div class="note-item" style="cursor:default"><span class="n">${m.n}.</span>${esc(m.text)}<div class="by">${avatar(m.by)} ${esc(person(m.by).name)} · ${fmtDT(m.at)}</div></div>`).join('')}
    ${sticks.map(x => `<div class="note-item sticky" style="--sn:${stickyCol(x.color)};cursor:default">${ic('sticky')} ${esc(x.text)}<div class="by">${avatar(x.by)} ${esc(person(x.by).name)} → ${esc(x.to === 'public' ? 'Everyone' : x.to === 'registry' ? 'Registry' : person(x.to).name)}</div></div>`).join('')}
    ${comments.map(c => `<div class="note-item" style="cursor:default">${esc(c.text)}<div class="by">${avatar(c.by)} ${esc(person(c.by).name)} · ${ago(c.at)}</div></div>`).join('')}
    ${n ? '' : '<p class="muted" style="margin:0 0 10px">No comments yet. Use <b>Add comment</b> to write a minute on the page, or <b>Sticky note</b> to leave a note for someone.</p>'}
    ${ff ? '' : `<div class="field" style="margin-top:10px"><label for="lt-lcm">Add a comment</label><textarea class="textarea" id="lt-lcm" rows="2" placeholder="Write a comment…"></textarea></div>
    <button class="btn btn-light btn-sm" data-act="letterComment" data-id="${l.id}" style="margin-top:8px">${ic('send')} Post comment</button>`}</section>`;
}
/* ---------- Correspondence (Registry): movement to and from the officers ---------- */
const CORR_TABS = { received: 'Received', marking: 'Marking Officer', action: 'Action Officer' };
const CORR_SUB = {
  marking: {
    all: 'All letters sent for marking, and the ones that came back.',
    sent: 'Letters waiting to be marked.',
    received: 'Marked letters that came back to you. Next: file each one, then send the file to the Action Officer.',
  },
  action: {
    all: 'All files sent to Action Officers, and the ones that came back.',
    sent: 'Files the Action Officers are still working on.',
    received: 'Finished files that came back to you. Next: send out the reply or file it away.',
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
  const [main, show] = (() => { const t = q.tab || 'received'; if (t === 'received') return ['received', 'all']; const m = t.startsWith('action') ? 'action' : 'marking'; const s = t.slice(m.length) || 'all'; return [m, ['all', 'sent', 'received'].includes(s) ? s : 'all']; })();
  const recv = (S.letters || []).filter(l => l.stage === 'registry');
  const items = main === 'marking' ? markingItems() : main === 'action' ? actionItems() : [];
  const count = s => items.filter(x => s === 'all' || x.state === s).length;
  const list = items.filter(x => show === 'all' || x.state === show);
  const mCount = markingItems().filter(x => x.state === 'received').length, aCount = actionItems().filter(x => x.state === 'received').length;
  const nTab = k => k === 'received' ? recv.length : k === 'marking' ? mCount : aCount;
  const head = pageHead({ crumbs: [['Correspondence']], title: 'Correspondence', sub: 'View movement of letters and files from marking and action officers' }) + `
    <div class="ct-head"><nav class="set-tabs" aria-label="Correspondence">${Object.entries(CORR_TABS).map(([k, l]) => `<a class="set-tab ${k === main ? 'on' : ''}" href="#/correspondence?tab=${k}" ${k === main ? 'aria-current="page"' : ''}>${ic(k === 'received' ? 'inboxIn' : k === 'marking' ? 'pen' : 'user')} ${l}${nTab(k) ? `<span class="count">${nTab(k)}</span>` : ''}</a>`).join('')}</nav>
      <a class="btn btn-primary" href="#/upload">${ic('upload')} Upload a letter or document</a></div>`;
  if (main === 'received') return head + `<section class="panel glass ct-panel"><p class="ct-sub" style="margin-top:0">Letters and documents received and recorded, waiting to be sent to a Marking Officer.</p>
      ${simpleTable(['Letter or document', 'From', 'Received', 'Uploaded by', ''], recv.map(l => `<tr data-s="${esc(letterNo(l))}"><td data-v="${letterKind(l)}"><span class="lt-kind is-letter">${ic(letterKind(l) === 'Letter' ? 'mail' : 'file')}</span><a href="${letterOpen(l)}"><b>${esc(l.title)}</b></a> <span class="chip t-neutral lt-kchip">${letterKind(l)}</span><small class="sub mono">${letterNo(l)} · ${esc(l.senderRef || '')}</small></td>
        <td>${esc(l.from)}</td><td data-d="${l.received}">${fmtDT(l.received)}</td><td>${esc(person(l.uploadedBy).name)}</td><td><div class="row-btns"><button class="btn btn-primary btn-xs" data-act="letterSendMark" data-id="${l.id}">${ic('send')} Send to Marking Officer</button></div></td></tr>`),
        'Nothing received and waiting. Upload a letter to start.', { key: 'ct-received', search: 'Search letters and documents – subject, sender or reference', date: [2, 'Received from', 'Received to'], facets: [[0, 'Letter or document'], [1, 'From']] })}</section>`;
  const isM = main === 'marking';
  const thead = isM ? ['Letter or document', 'From', 'Status', 'Sent', 'Returned', 'Marked to', ''] : ['File', 'Officer', 'Status', 'Sent', 'Returned', 'Instruction', ''];
  const rows = list.map(x => `<tr data-s="${esc(x.sub)}"><td data-v="${x.kind}"><span class="lt-kind ${x.kind === 'File' ? '' : 'is-letter'}" title="${x.kind}">${ic(x.kind === 'Letter' ? 'mail' : x.kind === 'Document' ? 'file' : 'folder')}</span><a href="${x.href}"><b>${esc(x.title)}</b></a>${isM ? ` <span class="chip t-neutral lt-kchip">${x.kind}</span>` : ''}<small class="sub mono">${esc(x.sub)}</small></td>
      <td>${esc(x.from)}</td><td data-v="${x.status[0]}"><span class="chip ${x.status[1]}">${x.status[0]}</span>${x.withName ? `<small class="sub">${isM ? 'Marking Officer' : 'Officer'}: ${esc(x.withName)}</small>` : ''}</td><td data-d="${x.sent || ''}">${x.sent ? fmtDT(x.sent) : '—'}</td><td data-d="${x.back || ''}">${x.back ? fmtDT(x.back) : '—'}</td>
      <td>${isM ? esc(x.to) : `<span class="lt-ins">${esc(x.to)}</span>`}</td><td><div class="row-btns">${x.btn}</div></td></tr>`);
  const showLabel = { all: 'All', sent: 'Sent', received: 'Returned' };
  return head + `
    <section class="panel glass ct-panel">
      <div class="ct-seg" role="tablist" aria-label="${CORR_TABS[main]}">${['all', 'sent', 'received'].map(s => `<a role="tab" class="${s === show ? 'on' : ''}" aria-selected="${s === show}" href="#/correspondence?tab=${main}${s === 'all' ? '' : s}">${showLabel[s]} <span class="n">${count(s)}</span></a>`).join('')}</div>
      <p class="ct-sub">${CORR_SUB[main][show]}</p>
      ${simpleTable(thead, rows, show === 'received' ? (isM ? 'No letters or documents have come back from the Marking Officer yet.' : 'Nothing has come back from Action Officers yet.') : 'Nothing here yet.',
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
  letterSendMark: el => { const ids = (el.dataset.ids || el.dataset.id).split(',');
    /* A letter must carry the Registry stamp before it goes for marking */
    const bare = ids.map(getLetter).filter(l => l && !normMarks(letterDoc(l).marks)?.stamp.on);
    if (bare.length) {
      if (ids.length === 1) { const l = bare[0]; modal(`${mHead('stamp', 'Stamp the letter first', esc(l.title))}<div class="modal-b"><p class="form-err" role="alert" style="margin:0">You cannot send this letter until it is stamped.</p><p style="margin:0">Open the stamp and signature tool, place the Registry stamp on the letter, then send it to a Marking Officer.</p></div>
        <div class="modal-f"><button class="btn btn-light" data-act="close">Cancel</button><button class="btn btn-primary" data-act="letterStamp" data-id="${l.id}" data-then="send">${ic('stamp')} Stamp and sign now</button></div>`); }
      else toast(`Stamp each letter before you send it. Not stamped yet: ${bare.map(l => letterNo(l)).join(', ')}.`);
      return; }
    letterSendModal(ids, 'marking'); },
  letterStamp: el => { const l = getLetter(el.dataset.id); letterDoc(l); if (!signState(l.doc.marks).can) { toast('This letter is already stamped and signed. It cannot be signed again.'); return; } stampEditorDoc(letterFile(l), l.doc, el.dataset.then === 'send' ? () => setTimeout(() => letterSendModal([l.id], 'marking'), 60) : null); },
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
    /* The Marking Officer's signature goes on automatically when they mark */
    const ld = letterDoc(l), mm = normMarks(ld.marks) || { page: 0, stamp: { on: false, x: 0, y: 0, w: 28 }, sign: { on: false } };
    if (!mm.msign) { mm.msign = { on: true, x: 56, y: 84, w: 30, by: meId(), at: now() }; ld.marks = mm; }
    notifyL('registry', 'Marked', `${l.title} has been marked to the ${person(to).name}. File it, then send the file on.`, l);
    save(); go('#/queue'); toast('Marked, signed and sent back to the Registry.');
  },
  letterFile: el => {
    const l = getLetter(el.dataset.id), f = getFile(val('lf-file'));
    if (!l) return;
    if (!f) { toast('Choose the file this letter goes into.'); $('#lf-file')?.focus(); return; }
    const folio = nextFolio(f);
    const d = { id: nid('d'), folio, title: l.title, kind: 'letter', mime: 'PDF', from: l.from, date: l.received, edms: 'EDMS-0001-2026-' + String(S.seq + 40).padStart(7, '0'), pages: l.pages, sizeKB: 240,
      minutes: [], stickies: [], signed: false, status: 'filed', to: 'The Principal Secretary, State Department for Medical Services', subject: l.title.toUpperCase(), body: LOREM,
      uploadedBy: l.uploadedBy, senderRef: l.senderRef, serial: l.serial, confidentiality: l.conf, restricted: [], crossRefs: [], enclosures: [] };
    const ld = letterDoc(l);   // what was written on the letter before filing comes with it
    d.minutes = ld.minutes.map(m => ({ ...m })); d.stickies = ld.stickies.map(x => ({ ...x })); d.comments = (ld.comments || []).map(c => ({ ...c })); d.signed = ld.signed; if (ld.imgs) d.imgs = [...ld.imgs]; if (ld.marks) d.marks = JSON.parse(JSON.stringify(ld.marks)); if (l.xrefsTyped) d.xrefsTyped = l.xrefsTyped.map(x => ({ ...x })); if (l.enclosures?.length) d.enclosures = l.enclosures.map(e => ({ description: e, quantity: '', kept_at: '' }));
    f.docs.push(d);
    addMinute(f, d, `${person(l.marking.to).title} – ${l.marking.ins}`, l.marking.by, { ink: 'red' });
    f.markedTo = l.marking.to; f.instruction = l.marking.ins; f.updated = now();
    Object.assign(l, { stage: 'filed', fileId: f.id, docId: d.id, folio });
    l.movements.push({ date: now(), from: 'registry', to: 'registry', note: `Filed as folio ${folio} in ${f.name}` });
    if (['action', 'delegated', 'marking'].includes(f.stage) && f.withUser && PEOPLE[f.withUser]) S.notifications.unshift({ id: nid('n'), to: f.withUser, kind: 'For action', text: `A new letter, “${l.title}”, was filed in ${f.name} as folio ${folio} while the file is with you.`, from: meId(), fileId: f.id, docId: d.id, at: now(), read: false });
    ui.lfFile = ''; save(); render(); toast(`Filed as folio ${folio} in ${f.name}.`);
  },
  letterSendAction: el => letterSendModal([el.dataset.id], 'action'),
  letterComment: el => { const l = getLetter(el.dataset.id), t = val('lt-lcm'); if (!l) return; if (!t) { toast('Write a comment first.'); $('#lt-lcm')?.focus(); return; }
    (letterDoc(l).comments = letterDoc(l).comments || []).push({ text: t, by: meId(), at: now() }); save(); render(); toast('Comment posted'); },
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
        <select class="select" id="ls-to"><option value="">Choose the office…</option>${peopleOpts(p => p.role === (mk ? 'marking' : 'action'), mk ? '' : l.marking.to)}</select>
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
/* On a letter's own page, refresh the Comments and notes panel after writing on the page */
['mnSave', 'confirmSticky', 'snDel', 'mnDelete', 'mnDel', 'sign'].forEach(k => {
  const orig = ACT[k]; if (!orig) return;
  ACT[k] = (...a) => { const r = orig(...a); if (parseHash().parts[0] === 'letter') { const p = $('.lt-notes'), l = getLetter(parseHash().q.id); if (p && l) p.outerHTML = letterNotesPanel(l); } return r; };
});

/* ---------- Notification pop-up: the message and the actions it asks for ---------- */
const NOTIF_HEAD = { 'For marking': 'Please mark this', 'For action': 'Please act on this', 'Sent back': 'Sent back to you', Marked: 'Marked and back with you',
  Returned: 'Back in the Registry', Done: 'Work finished', Delegated: 'Passed to another officer', Requested: 'A request is waiting', Approved: 'Request approved', Declined: 'Request declined',
  Approval: 'Approval needed', 'Bring up': 'Due today', Correspondence: 'New letter' };
/* Plain wording for the seeded notifications (applied once to saved data) */
const NOTIF_PLAIN = { n1: 'A file was sent to you to act on.', n2: 'A file was sent to you to act on.', n3: 'A file was sent to you to mark.', n4: 'The Action Officer sent the file back.',
  n16: 'The Action Officer sent the file back with a signed reply. Send out the reply or file it away.', n17: 'ACME Company Ltd is marked for the Head, National Vaccination Services. Send the file there next.',
  n12: 'Q4 Documents came back to you to mark again: mark it to one officer only.', n13: 'The Head, National Vaccination Services finished the file you marked and sent back a signed reply.',
  n20: 'A new letter from the Head, ICT is waiting to be recorded.', n9: 'The Head, Supply Chain Management sent Q2 Invoices back to the Registry.', nl4: 'Polio Outbreak Response Update has been marked to the Head, Public Communication. File it, then send the file on.' };
if (!S.plainText3) { (S.notifications || []).forEach(n => { if (NOTIF_PLAIN[n.id]) n.text = NOTIF_PLAIN[n.id]; }); S.plainText3 = true; save(); }
/* Where a file or letter is in its journey, and where it goes next */
function moveTrack(f, l) {
  const steps = [['Registry', 'inboxIn'], ['Marking Officer', 'pen'], ['Registry', 'archive'], ['Action Officer', 'user'], ['Registry', 'checkCircle']];
  const at = l ? ({ registry: 0, marking: 1, marked: 2, filed: 2, action: 3 })[l.stage] : ({ registry: 0, marking: 1, returned_marking: 2, action: 3, delegated: 3, returned_action: 4, filed: 4 })[f?.stage];
  if (at === undefined) return '';
  const who = i => { const id = i === 1 ? (l ? (l.movements || []).filter(m => isMarkingOfficer(m.to)).pop()?.to || l.withUser : (f.movements || []).filter(m => isMarkingOfficer(m.to)).pop()?.to || (f.stage === 'marking' ? f.withUser : null)) : i === 3 ? (l ? l.actionTo : f.markedTo || (['action', 'delegated'].includes(f.stage) ? f.withUser : null)) : null; return id && PEOPLE[id] ? person(id).name : ''; };
  const sub = ['Received', 'Marks it', 'Files it', 'Acts on it', 'Files it away'];
  return `<ol class="nm-track" aria-label="How it moves">${steps.map(([lbl, icn], i) => `<li class="${i < at ? 'done' : i === at ? 'now' : ''}" ${i === at ? 'aria-current="step"' : ''}><span class="dot">${ic(i < at ? 'check' : icn)}</span><b>${lbl}</b><small>${i === at ? 'Now' : esc(who(i) || sub[i])}</small></li>`).join('')}</ol>`;
}
/* A small picture of the document, click to view it */
function docPreview(f, d, l, href) {
  let page = '';
  if (l && !l.fileId && isSampleDoc(l.fileName)) page = `<img src="${extPages({ files: [l.fileName] })[0]}" alt="">`;
  else if (l) { const ff = l.fileId && getFile(l.fileId), dd = ff && getDoc(ff, l.docId); page = ff && dd ? pageHTML(ff, dd) : pageHTML(letterFile(l), letterDoc(l)); }
  else if (f && d) page = pageHTML(f, d);
  if (!page) return '';
  return `<button type="button" class="nm-prev" data-act="notifGo" data-to="${href}" aria-label="View the document"><span class="nm-prev-page" aria-hidden="true">${page}</span><span class="nm-prev-cta">${ic('eye')} View document</span></button>`;
}
function notifModal(n) {
  const f = n.fileId && getFile(n.fileId), l = n.letterId && getLetter(n.letterId), p = person(n.from);
  const xs = n.extId && S.outside?.items.find(y => y.id === n.extId);
  const subject = (l && l.title) || (f && f.name) || (xs && xs.subject) || (/corr/.test(n.href || '') ? 'Correspondence' : 'Notification');
  const doc = f && ((n.docId && f.docs.find(x => x.id === n.docId)) || [...f.docs].sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0]);
  let act = notifAction(n);
  if (/>\s*(?:<svg[\s\S]*?<\/svg>)?\s*Open (letter|document)\s*</.test(act)) act = '';
  const btn = (to, label, icon, primary) => `<button type="button" class="btn ${primary ? 'btn-primary' : 'btn-light'}" data-act="notifGo" data-id="${n.id}" data-to="${to}">${ic(icon)} ${label}</button>`;
  const docHref = l ? letterOpen(l) : f && !f.virtual && doc ? `#/file/${f.id}/doc/${doc.id}` : '';
  const opens = [l ? btn(letterOpen(l), `View ${letterKind(l).toLowerCase()}`, 'eye', !act) : '',
    f && !f.virtual ? btn(`#/file/${f.id}`, 'View file', 'folder', !act && !doc) : '',
    f && !f.virtual && doc ? btn(docHref, 'View document', 'eye', !act) : '',
    !f && !l && n.href && !act ? btn(n.href, ({ '#/incoming': 'Open Incoming for me', '#/queue': 'Open My Queue', '#/bringup': 'Open the Bring Up Diary', '#/correspondence': 'Open Correspondence', '#/access': 'Open Access Requests' })[n.href.split('?')[0]] || 'Open', 'arrowR', true) : ''].join('');
  const prev = docHref ? docPreview(f && !f.virtual ? f : null, doc, l, docHref) : '';
  const xi = n.extId && S.outside?.items.find(y => y.id === n.extId);
  const prevX = !prev && xi ? `<button type="button" class="nm-prev" data-act="stpView" data-id="${xi.id}" aria-label="View the document"><span class="nm-prev-page" aria-hidden="true"><img src="${extPages(xi)[0]}" alt=""></span><span class="nm-prev-cta">${ic('eye')} View document</span></button>` : '';
  modal(`${mHead('bell', 'Notification')}
    <div class="modal-b nm">
      <div class="nm-row"><span class="nm-ic">${ic(l ? 'mail' : f ? 'folder' : 'bell')}</span><div><b>${esc(xs ? 'Letter from ' + xs.org : n.kind || 'Notification')}: ${esc(subject)}</b><small>In the EDRMS · from ${esc(p.name)}</small></div><span class="chip t-green">Delivered</span></div>
      <div class="nm-body ${prev || prevX ? '' : 'no-prev'}"><div class="nm-card"><h3>${xi ? esc(n.kind === 'Returned' ? `Returned to ${xi.org}` : `Letter for you from ${xi.org}`) : esc(NOTIF_HEAD[n.kind] || n.kind || 'Notification')}</h3>
        ${l ? `<p><b>${letterKind(l)}:</b> ${esc(l.title)} <span class="muted">(${letterNo(l)})</span></p>` : ''}
        ${f && !f.virtual ? `<p><b>File:</b> ${esc(f.name)} <span class="muted mono">${esc(f.ref)}</span></p>` : ''}
        ${doc && f && !f.virtual ? `<p><b>Document:</b> Folio ${esc(doc.folio)} – ${esc(doc.title)}</p>` : ''}
        <p>${esc(n.text)}</p></div>${prev || prevX}</div>
      <p class="nm-at">${ic('clock')} Delivered ${fmtDT(n.at)}</p>
    </div>
    <div class="modal-f nm-f"><button type="button" class="btn btn-light left" data-act="notifUnread" data-id="${n.id}">${ic('mail')} Mark as unread</button>${opens}${act.replace(/btn-xs/g, '')}</div>`, 'notif-modal');
}
ACT.notifUnread = el => { const n = S.notifications.find(x => x.id === el.dataset.id); if (n) { n.read = false; save(); } closeModal(); render(); toast('Marked as unread'); };

/* ---------- Upload › From SAGAS: documents sent in by SAGAS (semi-autonomous government agencies) and others outside the ministry ---------- */
const EXT_STATUS = { new: ['New', 't-blue'], received: ['Received', 't-teal'], toregister: ['Being registered', 't-amber'], registered: ['Registered', 't-green'], returned: ['Returned', 't-red'] };
function ensureOutside() {
  if (S.outside) return;
  S.outside = {
    on: true, shownAs: 'Ministry of Health – State Department for Medical Services', token: 'eb2e1ffba1e8434c831effc7e074c013',
    items: [
      { id: 'x4', ref: 'EXT-2026-000004', at: daysAgo(0, 8, 12), org: 'Afya Bora Medical Supplies Ltd', person: 'Joseph Mutua', email: 'sales@afyabora.example', subject: 'Quotation for Vaccine Carriers and Cold Boxes', files: ['02-Afya-Bora-Quotation-Vaccine-Carriers.pdf'], forWho: 'john', status: 'new', note: 'Please find our quotation as requested.' },
      { id: 'x3', ref: 'EXT-2026-000003', at: daysAgo(0, 4, 51), org: 'Kilima County Department of Health', person: 'Dr. Amina Wekesa', email: 'health@kilima.example', subject: 'Measles–Rubella Campaign Micro-plan', files: ['06-Kilima-County-Measles-Campaign-Plan.pdf'], forWho: 'henry', status: 'toregister', stamped: daysAgo(0, 5, 10) },
      { id: 'x2', ref: 'EXT-2026-000002', at: daysAgo(2, 16, 12), org: 'Mwangaza Teaching and Referral Hospital', person: 'Dr. Peter Kiprono', email: 'ceo@mwangaza-hospital.example', subject: 'Quarterly Service Delivery Report', files: ['03-Mwangaza-Hospital-Quarterly-Report.pdf'], forWho: 'john', status: 'received', stamped: daysAgo(2, 16, 40) },
      { id: 'x1', ref: 'EXT-2026-000001', at: daysAgo(2, 8, 29), org: 'Pamoja Health Workers Association', person: 'Grace Achieng Otieno', email: 'info@pamoja-hwa.example', subject: 'Request for a Consultative Meeting', files: ['05-Pamoja-Health-Workers-Union-Meeting-Request.pdf'], forWho: 'john', status: 'registered', letterId: null, stamped: daysAgo(2, 9, 0) },
      { id: 'x0', ref: 'EXT-2026-000000', at: daysAgo(4, 11, 2), org: 'Health Sector Partners Forum', person: 'Ruth Wanjiru', email: 'secretariat@hspf.example', subject: 'Invitation (unsigned copy)', files: ['08-Health-Sector-Forum-Invitation.pdf'], forWho: 'john', status: 'returned', returnNote: 'The copy is not signed. Please send a signed copy.' },
    ],
  };
  save();
}
ensureOutside();
if (S.outside && !S.outside.stampMig) { S.outside.items.forEach(x => { if (x.status !== 'new' && x.status !== 'returned' && !x.stamped) x.stamped = x.at; }); S.outside.stampMig = true; save(); }
const EXT_TABS = [['all', 'All'], ['new', 'New'], ['received', 'Received'], ['toregister', 'To register'], ['registered', 'Registered'], ['returned', 'Returned']];
function outsideView() {
  const O = S.outside, tab = ui.extTab || 'all', q = (ui.extQ || '').toLowerCase();
  const list = O.items.filter(x => (tab === 'all' || x.status === tab) && (!q || [x.ref, x.org, x.person, x.subject].join(' ').toLowerCase().includes(q)));
  const link = `https://edrms.qbits.africa/external/${O.token}`;
  const btns = x => ({
    new: `<button class="btn btn-primary btn-xs" data-act="extAccept" data-id="${x.id}">${ic('check')} Receive</button><button class="btn btn-light btn-xs" data-act="extReturn" data-id="${x.id}">${ic('undo')} Return</button>`,
    received: `<button class="btn btn-primary btn-xs" data-act="extRegister" data-id="${x.id}">${ic('archive')} Register</button><button class="btn btn-light btn-xs" data-act="extReturn" data-id="${x.id}">${ic('undo')} Return</button>`,
    toregister: `<button class="btn btn-primary btn-xs" data-act="extRegister" data-id="${x.id}">${ic('archive')} Finish registering</button>`,
    registered: x.letterId && getLetter(x.letterId) ? `<a class="btn btn-light btn-xs" href="${letterOpen(getLetter(x.letterId))}">${ic('mail')} Open in EDRMS</a>` : `<span class="muted">In the Inward Register</span>`,
    returned: `<span class="muted" title="${esc(x.returnNote || '')}">Returned to sender</span>`,
  })[x.status];
  return `<section class="up-card glass ext-top">
      <div class="ext-row"><label class="switch-row"><input type="checkbox" class="sr" data-change="extOn" ${O.on ? 'checked' : ''}><span class="sw" aria-hidden="true"></span><b>Accept submissions from SAGAS</b></label>
        <div class="ext-link"><span>Link</span><input class="input mono" id="ext-link" value="${link}" readonly aria-label="Submission link" ${O.on ? '' : 'disabled'}><button class="btn btn-light btn-sm" data-act="extCopy" ${O.on ? '' : 'disabled'}>${ic('copy')} Copy</button></div></div>
      <div class="ext-link ext-as"><span>Shown as</span><input class="input" id="ext-as" value="${esc(O.shownAs)}" data-change="extAs" aria-label="Name shown to people sending documents"></div>
      <p class="muted" style="margin:0">SAGAS send letters and documents through this link. For each one: view it, stamp and sign it, receive it, then register it. It then goes to a Marking Officer like any other letter.</p>
    </section>
    <section class="up-card glass ext-list">
      <div class="ext-bar"><div class="ct-seg" role="tablist" aria-label="Submissions">${EXT_TABS.map(([k, l]) => `<a role="tab" href="#" class="${tab === k ? 'on' : ''}" aria-selected="${tab === k}" data-act="extTab" data-k="${k}">${l} <span class="n">${O.items.filter(x => k === 'all' || x.status === k).length}</span></a>`).join('')}</div>
        <label class="input-icon ext-q">${ic('search')}<input class="input" id="ext-q" value="${esc(ui.extQ || '')}" placeholder="Search subject, reference, sender…" data-input="extQuery" autocomplete="off"><span class="sr">Search submissions</span></label></div>
      <div id="ext-table">${simpleTable(['Ref.', 'Received from', 'Subject', 'For', 'Status', ''], list.map(x => `<tr><td class="mono"><b>${esc(x.ref)}</b><small class="sub">${fmtDT(x.at)}</small></td>
          <td><b>${esc(x.org)}</b><small class="sub">${esc(x.person)}</small></td><td><a href="#" data-act="extRead" data-id="${x.id}"><b>${esc(x.subject)}</b></a><small class="sub">${plural(x.files.length, 'file')}</small></td>
          <td>${esc(person(x.forWho).name)}</td><td><span class="chip ${EXT_STATUS[x.status][1]}">${EXT_STATUS[x.status][0]}</span></td><td><div class="row-btns">${btns(x)}</div></td></tr>`), 'Nothing here.')}</div>
    </section>`;
}
function extReadModal(x, showErr) {
  modal(`${mHead('globe', esc(x.subject), `${esc(x.ref)} · sent ${fmtDT(x.at)}`)}
    <div class="modal-b">
      <dl class="lt-facts"><div><dt>Organisation</dt><dd>${esc(x.org)}</dd></div><div><dt>Sent by</dt><dd>${esc(x.person)}<small class="sub">${esc(x.email)}</small></dd></div>
        <div><dt>For</dt><dd>${esc(person(x.forWho).name)}</dd></div><div><dt>Status</dt><dd><span class="chip ${EXT_STATUS[x.status][1]}">${EXT_STATUS[x.status][0]}</span></dd></div></dl>
      ${x.note ? `<p><b>Message:</b> ${esc(x.note)}</p>` : ''}${x.returnNote ? `<div class="instruction sent-back">${ic('undo')}<div><b>Returned</b> – ${esc(x.returnNote)}</div></div>` : ''}
      <div class="ext-doc"><button type="button" class="nm-prev" data-act="stpView" data-id="${x.id}" aria-label="View the document"><img src="${extPages(x)[x.marks ? x.marks.page : 0]}" alt="">${x.marks ? marksOverlay(x.marks, 1, normMarks(x.marks).page) : ''}<span class="nm-prev-cta">${ic('eye')} View document</span></button>
        <div class="field"><span class="label">Attached</span>${x.files.map(fn => `<div class="file-chosen">${ic('file')}<div><b>${esc(fn)}</b><br><small class="muted">PDF · ${plural(extPages(x).length, 'page')}</small></div></div>`).join('')}
        ${role() === 'registry' && ['new', 'received', 'toregister'].includes(x.status) ? `<ol class="nm-steps"><li><b>View</b> it – press the page to read it.</li><li class="${x.stamped ? 'ok' : ''}"><b>Stamp and sign</b> it.</li><li class="${x.status !== 'new' ? 'ok' : ''}"><b>Receive</b> it into the EDRMS.</li><li><b>Register</b> it, then send it to a Marking Officer.</li></ol>` : ''}</div></div>
      ${x.stamped ? `<div class="ext-stamped">${x.marks ? stampedThumb(x) : ic('stamp')}<span><b>Stamped${x.marks?.sign?.on ? ' and signed' : ''} received</b><small>${fmtDT(x.stamped)}${x.marks ? ` · page ${normMarks(x.marks).page + 1} of ${extPages(x).length}` : ''}</small></span>${x.marks ? `<button class="btn btn-light btn-xs" data-act="stpView" data-id="${x.id}">${ic('eye')} View stamped copy</button>` : ''}</div>` : ''}
      ${role() === 'registry' && x.status === 'new' ? `<p class="form-err" id="ext-err" role="alert" ${showErr ? '' : 'hidden'}>You cannot continue without a stamp. Stamp the letter, then receive it.</p>` : ''}
    </div>
    <div class="modal-f"><button class="btn btn-light" data-act="close">Close</button>${role() !== 'registry' ? (x.letterId && getLetter(x.letterId) ? `<button class="btn btn-primary" data-act="notifGo" data-to="${letterOpen(getLetter(x.letterId))}">${ic('mail')} Open in EDRMS</button>` : `<span class="muted" style="align-self:center">${x.status === 'registered' ? 'Registered by the Registry.' : 'The Registry registers it and routes it to you.'}</span>`) : x.status === 'new' ? `<button class="btn btn-light" data-act="extReturn" data-id="${x.id}">${ic('undo')} Return</button>${x.stamped ? '' : `<button class="btn btn-outline" data-act="extStamp" data-id="${x.id}">${ic('stamp')} Stamp and sign</button>`}<button class="btn btn-primary" data-act="extAccept" data-id="${x.id}">${ic('check')} Receive</button>` : ['received', 'toregister'].includes(x.status) ? `<button class="btn btn-primary" data-act="extRegister" data-id="${x.id}">${ic('archive')} Register</button>` : ''}</div>`);
}
Object.assign(ACT, {
  extTab: (el, e) => { e?.preventDefault(); ui.extTab = el.dataset.k; render(); },
  extRead: (el, e) => { e?.preventDefault(); extReadModal(S.outside.items.find(x => x.id === el.dataset.id)); },
  extCopy: () => { const i = $('#ext-link'); i.select(); try { navigator.clipboard?.writeText(i.value).catch(() => {}); } catch (e) {} toast('Link copied'); },
  extStamp: el => stampEditor(S.outside.items.find(y => y.id === el.dataset.id)),
  extAccept: el => { const x = S.outside.items.find(y => y.id === el.dataset.id);
    if (!x.stamped) { const e = $('#ext-err'); if (e) { e.hidden = false; e.focus?.(); } else extReadModal(x, true); return; }
    x.status = 'received';
    if (x.forWho && PEOPLE[x.forWho]) S.notifications.unshift({ id: nid('n'), to: x.forWho, kind: 'Correspondence', extId: x.id, from: meId(), href: '#/incoming', at: new Date().toISOString(), read: false,
      text: `${x.org} sent you “${x.subject}” (${x.ref}). The Registry has received it and will register it and send it on to you. You can follow it under Incoming for me.` });
    save(); closeModal(); render(); toast(`${x.ref} has been received. Register it next.`); },
  extReturn: el => { const x = S.outside.items.find(y => y.id === el.dataset.id);
    modal(`${mHead('undo', 'Return to sender', esc(x.subject))}<div class="modal-b"><div class="field"><label for="ext-why">Reason <span class="req">*</span></label><textarea class="textarea" id="ext-why" placeholder="e.g. The copy is not signed. Please send a signed copy."></textarea></div></div>
      <div class="modal-f"><button class="btn btn-light" data-act="close">Cancel</button><button class="btn btn-primary" data-act="extReturnOk" data-id="${x.id}">${ic('undo')} Return</button></div>`, '', '#ext-why'); },
  extReturnOk: el => { const why = need('ext-why', 'Reason'); if (!why) return; const x = S.outside.items.find(y => y.id === el.dataset.id); x.status = 'returned'; x.returnNote = why;
    if (x.forWho && PEOPLE[x.forWho]) S.notifications.unshift({ id: nid('n'), to: x.forWho, kind: 'Returned', extId: x.id, from: meId(), href: '#/incoming', at: new Date().toISOString(), read: false, text: `The Registry returned “${x.subject}” (${x.ref}) to ${x.org} because: ${why}` }); save(); closeModal(); render(); toast(`Returned to ${x.person}`); },
  extRegister: el => { const x = S.outside.items.find(y => y.id === el.dataset.id);
    modal(`${mHead('archive', 'Register this letter', `${esc(x.org)} · ${esc(x.ref)}`)}
      <div class="modal-b">
        <p class="muted" style="margin:0">Check the details, then register it. It is added to the Inward Register and you choose the Marking Officer next.</p>
        <div class="two"><div class="field"><label for="xr-from">Received from</label><input class="input auto-val" id="xr-from" value="${esc(x.org)}" readonly aria-readonly="true"></div>
          <div class="field"><label for="xr-ref">Reference number ${ic('lock')}</label><input class="input auto-val" id="xr-ref" value="${esc(x.ref)}" readonly aria-readonly="true" aria-describedby="xr-ref-h"><span class="hint" id="xr-ref-h">Set when the SAGA sent it. It cannot be changed.</span></div></div>
        <div class="field"><label for="xr-subj">Subject <span class="req">*</span></label><input class="input" id="xr-subj" value="${esc(x.subject)}"></div>
        <div class="two"><div class="field"><label for="xr-date">Date received</label><input class="input auto-val" id="xr-date" value="${fmtDT(x.at)}" readonly aria-readonly="true"></div>
          <div class="field"><label for="xr-conf">Confidentiality</label><select class="select" id="xr-conf">${CONF_LEVELS.map(c => `<option ${c === 'Internal' ? 'selected' : ''}>${c}</option>`).join('')}</select></div></div>
        <div class="field"><label for="xr-enc">Enclosures <span class="muted" style="font-weight:500">(optional)</span></label><input class="input" id="xr-enc" placeholder="e.g. Annual report – 2 copies"></div>
        <div class="two"><div class="field"><label for="xr-xref">Cross-reference <span class="muted" style="font-weight:500">(optional)</span></label><input class="input" id="xr-xref" placeholder="Type a reference, e.g. MOH/ADM/1/23"></div>
          <div class="field"><label for="xr-xnote">Note on the cross-reference</label><input class="input" id="xr-xnote" placeholder="e.g. Earlier request on the same matter"></div></div>
        <p class="form-err" id="xr-err" role="alert" hidden></p>
      </div>
      <div class="modal-f"><button class="btn btn-light" data-act="close">Cancel</button><button class="btn btn-primary" data-act="extRegisterOk" data-id="${x.id}">${ic('archive')} Register and choose the Marking Officer</button></div>`, '', '#xr-subj'); },
  extRegisterOk: el => { const x = S.outside.items.find(y => y.id === el.dataset.id);
    const subj = val('xr-subj').trim(); if (!subj) { const e = $('#xr-err'); e.textContent = 'Enter the subject.'; e.hidden = false; return; }
    x.subject = subj;
    const serial = Math.max(0, ...(S.letters || []).map(l => l.serial), S.files.flatMap(ff => ff.docs).filter(d => d.kind !== 'response').length) + 1;
    const xr = val('xr-xref').trim(), enc = val('xr-enc').trim();
    const l = { id: nid('L'), serial, title: x.subject, from: x.org, senderRef: x.ref, received: x.at, pages: extPages(x).length, conf: val('xr-conf') || 'Internal', stage: 'registry', uploadedBy: meId(), movements: [], fileName: x.files[0], fromSaga: x.id, forWho: x.forWho,
      xrefsTyped: xr ? [{ ref: xr, note: val('xr-xnote').trim() }] : [], enclosures: enc ? [enc] : [] };
    letterDoc(l); if (x.marks) l.doc.marks = JSON.parse(JSON.stringify(x.marks));
    S.letters = [l, ...(S.letters || [])]; x.status = 'registered'; x.letterId = l.id;
    if (!S.senders.some(s => s.name.toLowerCase() === x.org.toLowerCase())) S.senders.push({ id: nid('ms'), name: x.org, as: 'sender', on: true });
    save(); closeModal(); go(letterOpen(l)); setTimeout(() => letterSendModal([l.id], 'marking'), 60); toast(`Registered as ${letterNo(l)}. Now choose the Marking Officer.`); },
});

/* ---------- Incoming for me: correspondence from outside sent to the signed-in officer ---------- */
(function moreOutside() {
  const add = x => { if (!S.outside.items.some(y => y.id === x.id)) S.outside.items.push(x); };
  add({ id: 'x5', ref: 'EXT-2026-000005', at: daysAgo(0, 9, 40), org: 'Kilima County Department of Health', person: 'Dr. Amina Wekesa', email: 'health@kilima.example', subject: 'Request for Cold Chain Equipment (copy for the PS)', files: ['01-Kilima-County-Cold-Chain-Request.pdf'], forWho: 'vera', status: 'received', note: 'Copy for the Principal Secretary.' });
  add({ id: 'x6', ref: 'EXT-2026-000006', at: daysAgo(1, 14, 5), org: 'Afya Bora Medical Supplies Ltd', person: 'Mary Njeri', email: 'accounts@afyabora.example', subject: 'Invoice INV-2026-0937', files: ['07-Afya-Bora-Invoice-INV-2026-0937.pdf'], forWho: 'virah', status: 'toregister', note: 'Invoice for the vaccine carriers delivered on 13 November.' });
  add({ id: 'x7', ref: 'EXT-2026-000007', at: daysAgo(3, 10, 20), org: 'Health Sector Partners Forum', person: 'Ruth Wanjiru', email: 'secretariat@hspf.example', subject: 'Invitation to the Health Sector Partners Forum', files: ['08-Health-Sector-Forum-Invitation.pdf'], forWho: 'virah', status: 'registered' });
  save();
})();
const incomingForMe = () => S.outside.items.filter(x => x.forWho === meId()).sort((a, b) => b.at.localeCompare(a.at));
function viewIncoming() {
  const list = incomingForMe();
  return pageHead({ crumbs: [['Incoming for me']], title: 'Incoming for Me', sub: 'Letters from SAGAS that are addressed to you. Open one to read it; the Registry registers it and routes it to you.' }) + `
    <section class="panel glass inc-list">${list.length ? list.map(x => `<div class="inc-row${x.seen ? '' : ' unseen'}">
      <div class="inc-main"><b>${esc(x.subject)}</b><small>From <b>${esc(x.org)}</b> · ${esc(x.ref)} · sent ${fmtDT(x.at)}</small></div>
      <span class="chip ${EXT_STATUS[x.status][1]}">${EXT_STATUS[x.status][0]}</span>
      <button class="btn btn-outline btn-sm" data-act="incOpen" data-id="${x.id}">${ic('eye')} Open</button></div>`).join('')
      : `<div class="empty">${ic('checkCircle')}<div>No letters from SAGAS are addressed to you yet.</div></div>`}</section>`;
}
ACT.incOpen = el => { const x = S.outside.items.find(y => y.id === el.dataset.id); if (!x) return; x.seen = true; save(); render(); extReadModal(x); };

/* ---------- Stamp and sign: see the document, place the stamp and signature (each moves on its own), resize, then confirm ----------
   Works on a SAGAS submission (x.marks) and on any letter or document (d.marks). The signature is always the signed-in officer's own. */
const SAMPLE_PAGES = { '03-Mwangaza-Hospital-Quarterly-Report': 2, '05-Pamoja-Health-Workers-Union-Meeting-Request': 2, '06-Kilima-County-Measles-Campaign-Plan': 2, '09-Mwangaza-Hospital-Staff-Establishment-Returns': 2 };
function extPages(x) { const b = (x.files[0] || '').replace(/\.pdf$/i, ''); return Array.from({ length: SAMPLE_PAGES[b] || 1 }, (_, i) => `sample-documents/pages/${b}-${i + 1}.jpg`); }
const STP_DEFAULT = () => ({ stamp: { on: true, x: 60, y: 70, w: 28 }, sign: { on: true, x: 8, y: 76, w: 32 } });
const stampLabelFor = id => PEOPLE[id]?.role === 'registry' ? 'REGISTRY' : (PEOPLE[id]?.title || 'REGISTRY').toUpperCase();
/* Old marks (one 'by' for both) become per-item marks */
function normMarks(m, at) {
  if (!m) return null;
  const by = m.by || 'john';
  const it = (o, k) => o ? { ...o, by: o.by || by, at: o.at || at || new Date().toISOString(), ...(k === 'stamp' ? { label: o.label || stampLabelFor(o.by || by) } : {}) } : { on: false, x: 0, y: 0, w: 28 };
  return { page: m.page || 0, stamp: it(m.stamp, 'stamp'), sign: it(m.sign, 'sign'), msign: m.msign && m.msign.on ? { ...m.msign } : null,
    /* once the Registry stamps and signs, it is fixed: it cannot be stamped or signed again */
    locked: m.locked !== false };
}
/* Who may still sign: the Registry only once; a Marking Officer adds their own signature once */
function signState(marks) {
  const m = normMarks(marks), r = role();
  if (!m || !m.stamp.on) return { can: r === 'registry', label: 'Stamp and sign' };
  if (r === 'marking') return m.msign ? { can: false, label: 'Signed' } : { can: true, label: 'Sign' };
  return { can: false, label: 'Stamped and signed' };
}
let stpN = 0;
function stampSVG(date, label) {
  const n = ++stpN, d = fmtDate(date || new Date().toISOString()).toUpperCase(), lab = label || 'REGISTRY', small = lab.length > 18;
  return `<svg viewBox="0 0 200 200" class="stp-svg" aria-hidden="true"><defs><path id="stp-top${n}" d="M 30 100 A 70 70 0 0 1 170 100"/><path id="stp-bot${n}" d="M 22 100 A 78 78 0 0 0 178 100"/></defs>
    <g fill="none" stroke="#b8323a"><circle cx="100" cy="100" r="96" stroke-width="5"/><circle cx="100" cy="100" r="88" stroke-width="2"/><circle cx="100" cy="100" r="56" stroke-width="2"/></g>
    <g fill="#b8323a" font-family="Urbanist, sans-serif" font-weight="800" text-anchor="middle">
      <text font-size="15" letter-spacing="2"><textPath href="#stp-top${n}" startOffset="50%">MINISTRY OF HEALTH</textPath></text>
      <text font-size="11.5" letter-spacing="1.2" dominant-baseline="hanging"><textPath href="#stp-bot${n}" startOffset="50%">STATE DEPT. FOR MEDICAL SERVICES</textPath></text>
      <text x="100" y="88" font-size="17" letter-spacing="1.5">RECEIVED</text><text x="100" y="110" font-size="13">${esc(d)}</text><text x="100" y="128" font-size="${small ? 7.5 : 10.5}">★ ${esc(lab)} ★</text></g></svg>`;
}
function signSVG(p) {
  const full = p.fullName || PEOPLE[p.id]?.name || p.name || '', parts = full.split(' ');
  return `<svg viewBox="0 0 260 110" class="stp-svg" aria-hidden="true"><text x="130" y="58" text-anchor="middle" font-family="'Mrs Saint Delafield','Homemade Apple',cursive" font-size="54" fill="#1d3a8a">${esc(parts[0])} ${esc((parts[parts.length - 1] || '')[0] || '')}.</text>
    <line x1="20" y1="72" x2="240" y2="72" stroke="#1d3a8a" stroke-width="1.5"/><text x="130" y="90" text-anchor="middle" font-family="Urbanist, sans-serif" font-weight="700" font-size="14" fill="#1b1b1b">${esc(full)}</text>
    <text x="130" y="106" text-anchor="middle" font-family="Urbanist, sans-serif" font-size="11.5" fill="#444">${esc(PEOPLE[p.id]?.title || p.title || '')}</text></svg>`;
}
/* One mark (stamp or signature) placed on a page. yOf maps the mark's top onto a page stack. */
function stpMark(k, it, edit, yOf) {
  if (!it || !it.on) return '';
  const top = yOf ? yOf(it.y) : it.y;
  const label = k === 'stamp' ? 'Stamp' : 'Signature';
  return `<div class="stp-item stp-${k}" data-k="${k}" style="left:${it.x}%;top:${top}%;width:${it.w}%" ${edit ? `tabindex="0" role="group" aria-label="${label}. Drag to move it, or drag the corner to resize it. Arrow keys move it; plus and minus resize it."` : ''}>${k === 'stamp' ? stampSVG(it.at, it.label) : signSVG(person(it.by))}${edit ? '<span class="stp-h" aria-hidden="true"></span>' : ''}</div>`;
}
/* Marks drawn on top of a finished page (or a stack of scanned pages) */
function marksOverlay(m, nPages, onlyPage) {
  m = normMarks(m); if (!m) return '';
  if (onlyPage !== undefined && onlyPage !== m.page) return '';
  const yOf = nPages > 1 && onlyPage === undefined ? y => (m.page + y / 100) / nPages * 100 : null;
  const w = it => yOf ? { ...it, w: it.w, x: it.x } : it;
  return `<div class="stp-layer" aria-hidden="true">${stpMark('stamp', w(m.stamp), false, yOf)}${stpMark('sign', w(m.sign), false, yOf)}${m.msign ? stpMark('sign', m.msign, false, yOf) : ''}</div>`;
}
function stampedThumb(x) { return `<span class="stp-thumb"><img src="${extPages(x)[normMarks(x.marks).page]}" alt="">${marksOverlay(x.marks, 1, normMarks(x.marks).page)}</span>`; }

/* The editor itself. T = { key, title, sub, pages: [html], marks, onConfirm(marks), onCancel() } */
let STP_T = null;
function stampEditorT(T) {
  STP_T = T;
  const pages = T.pages, now = new Date().toISOString(), meP = person(meId());
  const base = normMarks(T.marks), counter = !!(base && base.stamp.on && role() === 'marking');
  if (counter) return countersignEditor(T, base);
  if (!ui.stp || ui.stp.key !== T.key) {
    const m = normMarks(T.marks), d = STP_DEFAULT();
    ui.stp = { key: T.key, page: m ? m.page : 0, sel: 'stamp',
      stamp: m && m.stamp.on ? { ...m.stamp } : { ...d.stamp, by: meId(), at: now, label: stampLabelFor(meId()) },
      sign: m && m.sign.on ? { ...m.sign, by: meId(), at: now } : { ...d.sign, by: meId(), at: now } };
  }
  const st = ui.stp;
  const tool = (k, label, icon, sub) => { const it = st[k]; return `<div class="stp-tool ${st.sel === k && it.on ? 'on' : ''}">
      <label class="switch-row"><input type="checkbox" class="sr" data-stp-on="${k}" ${it.on ? 'checked' : ''}><span class="sw" aria-hidden="true"></span><span class="stp-tl">${ic(icon)} <span><b>${label}</b><small>${sub}</small></span></span></label>
      <label class="stp-size"><span>Size</span><input type="range" min="${k === 'stamp' ? 14 : 16}" max="${k === 'stamp' ? 48 : 60}" step="1" value="${it.w}" data-stp-size="${k}" ${it.on ? '' : 'disabled'} aria-label="${label} size"><output>${Math.round(it.w)}%</output></label></div>`; };
  modal(`${mHead('stamp', 'Stamp and sign', T.sub)}
    <div class="modal-b stp">
      <div class="stp-doc">
        ${pages.length > 1 ? `<div class="ct-seg stp-pages" role="tablist" aria-label="Page">${pages.map((_, i) => `<a href="#" role="tab" class="${st.page === i ? 'on' : ''}" aria-selected="${st.page === i}" data-stp-page="${i}">Page ${i + 1}</a>`).join('')}</div>` : ''}
        <div class="stp-page" id="stp-page">${pages[st.page]}${stpMark('stamp', st.stamp, true)}${stpMark('sign', st.sign, true)}</div>
      </div>
      <aside class="stp-tools">
        <p class="stp-hint">${ic('info')}<span>Drag the stamp and the signature separately to where each one goes. Drag a corner, or use Size, to resize.</span></p>
        ${tool('stamp', 'Stamp', 'stamp', esc(st.stamp.label || stampLabelFor(meId())).replace(/^./, c => c) + ' · ' + fmtDate(st.stamp.at || now))}
        ${tool('sign', 'Your signature', 'pen', `Added automatically · ${esc(meP.fullName || meP.name)}`)}
        <button class="btn btn-light btn-sm" data-stp-reset>${ic('refresh')} Reset positions</button>
        <p class="form-err" id="stp-err" role="alert" hidden>You cannot continue without a stamp. Switch on Stamp and place it on the page.</p>
      </aside>
    </div>
    <div class="modal-f"><button class="btn btn-light" data-act="stpCancel">Cancel</button><button class="btn btn-primary" data-act="stpConfirm">${ic('check')} Confirm stamped copy</button></div>`, 'xwide stamp-modal', '.stp-item');
  const root = $('#overlay .stp'), pg = $('#stp-page');
  const redraw = () => stampEditorT(T);
  const apply = k => { const el = pg.querySelector(`.stp-item[data-k="${k}"]`), it = st[k]; if (!el) return; el.style.left = it.x + '%'; el.style.top = it.y + '%'; el.style.width = it.w + '%'; const r = root.querySelector(`[data-stp-size="${k}"]`); if (r) { r.value = it.w; r.nextElementSibling.textContent = Math.round(it.w) + '%'; } };
  const clamp = k => { const it = st[k], el = pg.querySelector(`.stp-item[data-k="${k}"]`); const hPct = el ? el.offsetHeight / pg.offsetHeight * 100 : 10; it.w = Math.max(10, Math.min(65, it.w)); it.x = Math.max(0, Math.min(100 - it.w, it.x)); it.y = Math.max(0, Math.min(100 - hPct, it.y)); };
  const select = k => { st.sel = k; root.querySelectorAll('.stp-tool').forEach((t, i) => t.classList.toggle('on', ['stamp', 'sign'][i] === k && st[k].on)); pg.querySelectorAll('.stp-item').forEach(e => e.classList.toggle('sel', e.dataset.k === k)); };
  select(st.sel);
  pg.querySelectorAll('.stp-item').forEach(el => {
    const k = el.dataset.k;
    el.addEventListener('pointerdown', e => {
      e.preventDefault(); e.stopPropagation(); select(k); el.focus({ preventScroll: true });
      const box = pg.getBoundingClientRect(), it = st[k], sx = e.clientX, sy = e.clientY, o = { ...it }, resize = e.target.classList.contains('stp-h');
      el.setPointerCapture(e.pointerId); el.classList.add('moving');
      const mv = ev => { const dx = (ev.clientX - sx) / box.width * 100, dy = (ev.clientY - sy) / box.height * 100;
        if (resize) it.w = o.w + dx; else { it.x = o.x + dx; it.y = o.y + dy; } clamp(k); apply(k); };
      const up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); el.classList.remove('moving'); };
      el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    });
    el.addEventListener('focus', () => select(k));
    el.addEventListener('keydown', e => { const it = st[k], s = e.shiftKey ? 5 : 1;
      const m = { ArrowLeft: () => it.x -= s, ArrowRight: () => it.x += s, ArrowUp: () => it.y -= s, ArrowDown: () => it.y += s, '+': () => it.w += s, '=': () => it.w += s, '-': () => it.w -= s }[e.key];
      if (m) { e.preventDefault(); m(); clamp(k); apply(k); } });
  });
  root.querySelectorAll('[data-stp-size]').forEach(r => r.addEventListener('input', () => { const k = r.dataset.stpSize; st[k].w = +r.value; select(k); clamp(k); apply(k); }));
  root.querySelectorAll('[data-stp-on]').forEach(c => c.addEventListener('change', () => { const k = c.dataset.stpOn; st[k].on = c.checked; st.sel = k; redraw(); }));
  root.querySelectorAll('[data-stp-page]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); st.page = +a.dataset.stpPage; redraw(); }));
  root.querySelector('[data-stp-reset]').addEventListener('click', () => { const d = STP_DEFAULT(); ['stamp', 'sign'].forEach(k => Object.assign(st[k], { x: d[k].x, y: d[k].y, w: d[k].w })); redraw(); });
  pg.querySelectorAll('img').forEach(img => { if (!img.complete) img.addEventListener('load', () => ['stamp', 'sign'].forEach(k => { clamp(k); apply(k); }), { once: true }); });
}
/* A SAGAS submission */
function stampEditor(x) {
  stampEditorT({ key: 'x:' + x.id, sub: `${esc(x.subject)} · ${esc(x.ref)}`, pages: extPages(x).map((src, i) => `<img src="${src}" alt="Page ${i + 1} of ${esc(x.files[0])}" draggable="false">`), marks: x.marks,
    onConfirm: m => { x.marks = m; x.stamped = new Date().toISOString(); save(); extReadModal(x); toast(m.sign.on ? 'Stamped and signed. You can receive it now.' : 'Stamped. You can receive it now.'); },
    onCancel: () => extReadModal(x) });
}
/* Any letter or document (also used by the Marking Officer) */
function stampEditorDoc(f, d, after) {
  const pages = d.imgs && d.imgs.length ? d.imgs.map((src, i) => `<img src="${src}" alt="Page ${i + 1} of ${esc(d.title)}" draggable="false">`) : [`<div class="page stp-genpage"><div class="content">${docContent(f, d)}</div></div>`];
  stampEditorT({ key: 'd:' + d.id, sub: `${esc(d.title)}${d.folio && d.folio !== '—' ? ` · Folio ${esc(d.folio)}` : ''}`, pages, marks: d.marks,
    onConfirm: m => { d.marks = m; save(); closeModal(); render(); toast(m.sign.on && m.stamp.on ? 'Stamped and signed.' : m.stamp.on ? 'Stamped.' : 'Signed.'); after && after(); },
    onCancel: () => closeModal() });
}
function stampedCopyModal(x) {
  const m = normMarks(x.marks, x.stamped), pages = extPages(x);
  modal(`${mHead(m ? 'stamp' : 'file', m ? 'Stamped copy' : 'Document', `${esc(x.subject)} · ${esc(x.ref)} · ${plural(pages.length, 'page')}`)}
    <div class="modal-b"><div class="stp-view">${pages.map((src, i) => `<div class="stp-page"><img src="${src}" alt="Page ${i + 1}">${m ? marksOverlay(m, 1, i) : ''}</div>`).join('')}</div></div>
    <div class="modal-f"><button class="btn btn-light" data-act="stpBack" data-id="${x.id}">${ic('arrowL')} Back</button></div>`, 'wide stamp-modal');
}
Object.assign(ACT, {
  stpCancel: () => { const T = STP_T; ui.stp = null; STP_T = null; T ? T.onCancel() : closeModal(); },
  stpConfirm: () => { const st = ui.stp, T = STP_T;
    if (!st || !st.stamp.on) { const e = $('#stp-err'); if (e) e.hidden = false; return; }
    const m = { page: st.page, stamp: { ...st.stamp }, sign: { ...st.sign, by: meId() }, locked: true }; ui.stp = null; STP_T = null; T.onConfirm(m); },
  stpCounterOk: () => { const T = STP_T, st = ui.stp; const m = { ...normMarks(T.marks), msign: { ...st.msign, on: true, by: meId(), at: new Date().toISOString() } }; ui.stp = null; STP_T = null; T.onConfirm(m); },
  stpView: el => stampedCopyModal(S.outside.items.find(y => y.id === el.dataset.id)),
  stpBack: el => extReadModal(S.outside.items.find(y => y.id === el.dataset.id)),
});

/* ---------- Sound, reminders and "you have had this file" ---------- */
let audioCtx = null;
function chime(kind) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const t = audioCtx.currentTime, notes = kind === 'reminder' ? [659.3, 880, 659.3] : [784, 1046.5];
    notes.forEach((f, i) => { const o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + i * 0.16); g.gain.exponentialRampToValueAtTime(0.18, t + i * 0.16 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.16 + 0.32);
      o.connect(g).connect(audioCtx.destination); o.start(t + i * 0.16); o.stop(t + i * 0.16 + 0.34); });
  } catch (e) {}
}
const soundOn = () => S.sound !== false;
/* Files an Action Officer has had for a while */
const HOLD_DAYS = 3;
function heldFiles() {
  if (role() !== 'action') return [];
  return S.files.filter(f => !f.draft && ['action', 'delegated'].includes(f.stage) && f.withUser === meId()).map(f => {
    const m = [...f.movements].reverse().find(x => x.to === meId()); const since = m ? m.date : f.updated;
    return { f, since, days: Math.max(0, Math.floor((Date.now() - new Date(since)) / 864e5)) };
  }).filter(x => x.days >= HOLD_DAYS).sort((a, b) => b.days - a.days);
}
function reminderItems() {
  const items = [], day = 864e5, today = new Date(); today.setHours(23, 59, 59, 999);
  myBringups().filter(b => !b.done).forEach(b => { const d = new Date(b.date), f = getFile(b.fileId); if (!f) return;
    const left = Math.ceil((d - Date.now()) / day);
    if (d <= today) items.push({ tone: d < Date.now() - day ? 'late' : 'due', icon: 'calendar', head: d < Date.now() - day ? 'Bring-up overdue' : 'Bring-up due today', text: `${f.name}: ${b.note}`, href: `#/file/${f.id}` });
    else if (left <= 5) items.push({ tone: 'soon', icon: 'clock', head: `Coming up in ${plural(left, 'day')}`, text: `${f.name}: ${b.note}`, href: `#/file/${f.id}` }); });
  heldFiles().forEach(({ f, days }) => items.push({ tone: days > 7 ? 'late' : 'due', icon: 'folder', head: `You have had this file for ${plural(days, 'day')}`, text: `${f.name}. Please act on it or send it back to the Registry.`, href: `#/file/${f.id}` }));
  if (role() === 'marking') { const n = lettersToMark().length; if (n) items.push({ tone: 'due', icon: 'pen', head: `${plural(n, 'letter')} waiting for you to mark`, text: 'The Registry sent them to you for marking.', href: '#/queue' }); }
  return items;
}
function reminderPop() {
  if (window.__noRem) return;
  const items = reminderItems(); document.querySelector('.rem-pop')?.remove(); if (!items.length) return;
  const el = document.createElement('section'); el.className = 'rem-pop glass'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Reminders');
  el.innerHTML = `<div class="rem-h">${ic('bell')}<h2>Reminders</h2><span class="n">${items.length}</span><button class="icon-btn" data-rem-close aria-label="Close reminders">${ic('x')}</button></div>
    <ul>${items.slice(0, 5).map(x => `<li class="rem-${x.tone}"><span class="ri">${ic(x.icon)}</span><span><b>${esc(x.head)}</b><small>${esc(x.text)}</small></span><a class="btn btn-light btn-xs" href="${x.href}" data-rem-go>Open</a></li>`).join('')}</ul>
    <div class="rem-f"><button class="btn btn-light btn-xs" data-rem-close>Remind me later</button></div>`;
  document.body.appendChild(el);
  el.addEventListener('click', e => { if (e.target.closest('[data-rem-close]') || e.target.closest('[data-rem-go]')) el.remove(); });
  if (soundOn()) chime('reminder');
}
/* New notifications: sound and a short pop-up */
function notifPing(n) {
  if (soundOn()) chime();
  document.querySelector('.n-ping')?.remove();
  const el = document.createElement('div'); el.className = 'n-ping glass'; el.setAttribute('role', 'status');
  el.innerHTML = `<span class="ri">${ic('bell')}</span><span><b>New notification</b><small>${esc(n.text)}</small></span><button class="btn btn-primary btn-xs" data-np-open>View</button><button class="icon-btn" data-np-x aria-label="Dismiss">${ic('x')}</button>`;
  document.body.appendChild(el);
  el.querySelector('[data-np-open]').addEventListener('click', () => { el.remove(); notifModal(n); });
  el.querySelector('[data-np-x]').addEventListener('click', () => el.remove());
  setTimeout(() => el.remove(), 9000);
}
const _renderBase = render;
render = function () {
  const was = ui.signedAs;
  _renderBase();
  if (!S.session) { ui.signedAs = null; ui.knownN = null; document.querySelector('.rem-pop')?.remove(); return; }
  const mine = myNotifs();
  if (was !== S.session + (S.as || '')) { ui.signedAs = S.session + (S.as || ''); ui.knownN = new Set(mine.map(n => n.id)); setTimeout(reminderPop, 900); }
  else if (ui.knownN) { const fresh = mine.filter(n => !ui.knownN.has(n.id) && !n.read); mine.forEach(n => ui.knownN.add(n.id)); if (fresh.length) notifPing(fresh[0]); }
  /* An Action Officer is told how long they have had the file they are looking at */
  const { parts } = parseHash();
  if (parts[0] === 'file' && role() === 'action') { const h = heldFiles().find(x => x.f.id === parts[1]); const bar = document.querySelector('.action-bar');
    if (h && bar && !document.querySelector('.held-note')) bar.insertAdjacentHTML('beforebegin', `<p class="held-note" role="status">${ic('clock')} You have had this file for <b>${plural(h.days, 'day')}</b> (since ${fmtDay(h.since)}). Please act on it or send it back to the Registry.</p>`); }
};

/* The Marking Officer adds only their own signature; the Registry stamp and signature stay where they are */
function countersignEditor(T, base) {
  STP_T = T;
  if (!ui.stp || ui.stp.key !== T.key + ':c') ui.stp = { key: T.key + ':c', page: base.page, msign: { on: true, x: 56, y: 84, w: 30, by: meId(), at: new Date().toISOString() } };
  const st = ui.stp, meP = person(meId());
  modal(`${mHead('pen', 'Sign', T.sub)}
    <div class="modal-b stp">
      <div class="stp-doc"><div class="stp-page" id="stp-page">${T.pages[base.page]}${stpMark('stamp', base.stamp)}${stpMark('sign', base.sign)}${stpMark('msign', { ...st.msign }, true).replace('stp-msign', 'stp-sign stp-msign')}</div></div>
      <aside class="stp-tools">
        <p class="stp-hint">${ic('info')}<span>The Registry has already stamped and signed this letter. Drag your signature to where it goes and resize it from the corner.</span></p>
        <div class="stp-tool on"><span class="stp-tl">${ic('pen')} <span><b>Your signature</b><small>Added automatically · ${esc(meP.fullName || meP.name)}</small></span></span>
          <label class="stp-size"><span>Size</span><input type="range" min="16" max="60" step="1" value="${st.msign.w}" data-stp-size="msign" aria-label="Signature size"><output>${Math.round(st.msign.w)}%</output></label></div>
        <p class="stp-locked">${ic('lock')} Registry stamp and signature: fixed</p>
      </aside>
    </div>
    <div class="modal-f"><button class="btn btn-light" data-act="stpCancel">Cancel</button><button class="btn btn-primary" data-act="stpCounterOk">${ic('check')} Confirm signature</button></div>`, 'xwide stamp-modal', '.stp-msign');
  const pg = $('#stp-page'), el = pg.querySelector('.stp-msign'), it = st.msign;
  const apply = () => { el.style.left = it.x + '%'; el.style.top = it.y + '%'; el.style.width = it.w + '%'; const rr = $('[data-stp-size="msign"]'); rr.value = it.w; rr.nextElementSibling.textContent = Math.round(it.w) + '%'; };
  const clamp = () => { const h = el.offsetHeight / pg.offsetHeight * 100; it.w = Math.max(10, Math.min(65, it.w)); it.x = Math.max(0, Math.min(100 - it.w, it.x)); it.y = Math.max(0, Math.min(100 - h, it.y)); };
  el.classList.add('sel');
  el.addEventListener('pointerdown', e => { e.preventDefault(); const box = pg.getBoundingClientRect(), sx = e.clientX, sy = e.clientY, o = { ...it }, rs = e.target.classList.contains('stp-h');
    el.setPointerCapture(e.pointerId); el.classList.add('moving');
    const mv = ev => { const dx = (ev.clientX - sx) / box.width * 100, dy = (ev.clientY - sy) / box.height * 100; if (rs) it.w = o.w + dx; else { it.x = o.x + dx; it.y = o.y + dy; } clamp(); apply(); };
    const up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.classList.remove('moving'); };
    el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); });
  el.addEventListener('keydown', e => { const s2 = e.shiftKey ? 5 : 1, m = { ArrowLeft: () => it.x -= s2, ArrowRight: () => it.x += s2, ArrowUp: () => it.y -= s2, ArrowDown: () => it.y += s2, '+': () => it.w += s2, '=': () => it.w += s2, '-': () => it.w -= s2 }[e.key]; if (m) { e.preventDefault(); m(); clamp(); apply(); } });
  $('[data-stp-size="msign"]').addEventListener('input', e => { it.w = +e.target.value; clamp(); apply(); });
}
