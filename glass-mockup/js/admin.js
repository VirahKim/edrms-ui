/* ==========================================================================
   Settings › Admin Console sections (as in edrms.qbits.africa/ed-mgt/admin)
   All Documents · Document Types · Retention Rules · Physical Locations ·
   Correspondence Templates · File Covers — plus Preferences (theme, font size)
   ========================================================================== */
function ensureAdmin() {
  if (S.admin) return;
  S.admin = {
    types: [
      { id: 'dt1', name: 'Inward Correspondence', code: 'INW', fields: ['Received from', 'Reference number', 'Reference date', 'Subject'], ocr: true, wf: 'REG-MARK-ACT', ret: 'rr1' },
      { id: 'dt2', name: 'Reply / Attachment Letter', code: 'REP', fields: ['To', 'Subject', 'Signed by'], ocr: false, wf: 'ACT-REG', ret: 'rr1' },
      { id: 'dt3', name: 'Internal Memo', code: 'MEM', fields: ['To', 'From', 'Subject'], ocr: true, wf: 'REG-MARK-ACT', ret: 'rr1' },
      { id: 'dt4', name: 'Circular', code: 'CIR', fields: ['Reference', 'Addressees', 'Subject'], ocr: true, wf: 'REG-ONLY', ret: 'rr2' },
      { id: 'dt5', name: 'Invoice', code: 'INV', fields: ['Supplier', 'Invoice number', 'Amount', 'Due date'], ocr: true, wf: 'FIN-APPROVE', ret: 'rr3' },
      { id: 'dt6', name: 'Contract', code: 'CON', fields: ['Party', 'Start date', 'End date', 'Value'], ocr: true, wf: 'LEGAL-REVIEW', ret: 'rr4' },
      { id: 'dt7', name: 'Minutes of Meeting', code: 'MIN', fields: ['Meeting', 'Date', 'Chair'], ocr: false, wf: 'REG-ONLY', ret: 'rr2' },
    ],
    rules: [
      { id: 'rr1', name: 'General correspondence', years: 7, trigger: 'File closed', method: 'Review, then destroy' },
      { id: 'rr2', name: 'Policy and circulars', years: 25, trigger: 'Document date', method: 'Transfer to National Archives' },
      { id: 'rr3', name: 'Financial records', years: 7, trigger: 'End of financial year', method: 'Destroy (shred)' },
      { id: 'rr4', name: 'Contracts', years: 10, trigger: 'Contract end date', method: 'Review, then destroy' },
      { id: 'rr5', name: 'Personnel files', years: 50, trigger: 'Officer leaves service', method: 'Permanent – transfer to Archives' },
    ],
    locs: [
      { id: 'pl1', registry: 'main', cabinet: 'Cabinet A', shelves: ['Shelf 1', 'Shelf 2', 'Shelf 3'] },
      { id: 'pl2', registry: 'main', cabinet: 'Cabinet B', shelves: ['Shelf 1', 'Shelf 2'] },
      { id: 'pl3', registry: 'hr', cabinet: 'Personnel cabinet', shelves: ['Drawer 1', 'Drawer 2', 'Drawer 3', 'Drawer 4'] },
    ],
    tpls: { letter: { logo: true, letterhead: true, signature: true, stamp: true }, memo: { logo: true, letterhead: true, signature: true, stamp: false }, circular: { logo: true, letterhead: true, signature: true, stamp: true }, notice: { logo: true, letterhead: false, signature: true, stamp: false }, minutes: { logo: true, letterhead: true, signature: false, stamp: false } },
    cover: { h1: 'Republic of Kenya', h2: 'Ministry of Health', color: COVER_COLOURS[0].id },
  };
}
ensureAdmin();

/* ---- Preferences: theme and font size (this browser only) ---- */
const FONT_SIZES = [['90', 'Small'], ['100', 'Default'], ['112', 'Large'], ['125', 'Extra large']];
let fontPref = '100', themePref = 'light';
try { fontPref = localStorage.getItem('edrms-font') || '100'; themePref = localStorage.getItem('edrms-theme-pref') || localStorage.getItem('edrms-theme') || 'light'; } catch (e) { /* storage blocked */ }
function applyFont() { document.documentElement.style.setProperty('--ui-zoom', +fontPref / 100); document.documentElement.dataset.fz = fontPref; }
function applyThemePref() {
  const dark = themePref === 'system' ? matchMedia('(prefers-color-scheme: dark)').matches : themePref === 'dark';
  theme = dark ? 'dark' : 'light'; document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('edrms-theme', theme); localStorage.setItem('edrms-theme-pref', themePref); } catch (e) { /* storage blocked */ }
  $$('.qb-theme-toggle').forEach(b => { b.classList.toggle('is-dark', dark); b.setAttribute('aria-checked', dark); });
}
applyFont();
if (themePref === 'system') applyThemePref();
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (themePref === 'system') applyThemePref(); });

const ADMIN_TABS = [
  ['alldocs', 'file', 'All Documents'], ['types', 'fileEdit', 'Document Types'], ['retention', 'calendar', 'Retention Rules'],
  ['locations', 'building', 'Physical Locations'], ['templates', 'pen', 'Correspondence Templates'], ['covers', 'book', 'File Covers'],
];
const retName = id => (S.admin.rules.find(r => r.id === id) || {}).name || '—';

function adminTab(tab, head) {
  const A = S.admin, reg = role() === 'registry';
  if (tab === 'alldocs') {
    const rows = S.files.filter(f => !f.draft).flatMap(f => f.docs.map(d => ({ f, d }))).sort((a, b) => (b.d.date || '').localeCompare(a.d.date || ''));
    const st = docStatus;
    return head('file', 'All Documents', `<a class="btn btn-primary btn-sm" href="#/upload">${ic('upload')} Upload</a>`) + `<p class="set-note">Every document in every file, with governance actions: approvals, locking, retention, access grants, OCR and AI assist.</p>`
      + simpleTable(['Title', 'File', 'Folio', 'Type', 'Status', 'Confidentiality', 'Retention', 'OCR', 'Received', ''], rows.map(({ f, d }) => { const [sl, sc] = st(d);
        return `<tr><td><b>${esc(d.title)}</b><small class="sub mono">${esc(d.edms)}</small></td><td>${esc(f.name)}</td><td class="mono">${esc(d.folio)}</td><td>${KIND[d.kind]?.[0] || 'Letter'}</td><td data-v="${sl}"><span class="chip ${sc}">${sl}</span></td>
          <td>${esc(d.confidentiality || f.confidentiality || 'Internal')}</td><td>${esc(retName(d.retention || 'rr1'))}</td><td>${d.status === 'landing' ? 'Waiting' : 'Read'}</td><td data-d="${d.date}">${fmtDay(d.date)}</td>
          <td><div class="row-acts"><a class="btn btn-light btn-xs" href="#/file/${f.id}/letter/${d.id}">${ic('eye')} Open</a>${reg ? `<button class="btn btn-light btn-xs" data-act="adLock" data-f="${f.id}" data-d="${d.id}">${ic('lock')} ${d.locked ? 'Unlock' : 'Lock'}</button><button class="btn btn-light btn-xs" data-act="adRet" data-f="${f.id}" data-d="${d.id}">${ic('calendar')} Retention</button>` : ''}</div></td></tr>`; }),
        'No documents yet.', { key: 'ad-docs', paged: true, search: 'Search documents – title, reference, file or folio', date: [8, 'Received from', 'Received to'], facets: [[1, 'File'], [3, 'Type'], [4, 'Status'], [5, 'Confidentiality'], [6, 'Retention']] });
  }
  if (tab === 'types') return head('fileEdit', 'Document Types', reg ? `<button class="btn btn-primary btn-sm" data-act="adTypeEdit">${ic('plus')} New type</button>` : '')
    + `<p class="set-note">Document types, the metadata fields each one asks for, whether OCR reads it, and the workflow it follows.</p>`
    + simpleTable(['Type', 'Code', 'Metadata fields', 'OCR', 'Workflow', 'Retention', ''], A.types.map(t => `<tr><td><b>${esc(t.name)}</b></td><td class="mono">${esc(t.code)}</td><td>${t.fields.map(x => `<span class="chip ghost">${esc(x)}</span>`).join(' ')}</td>
      <td data-v="${t.ocr ? 'On' : 'Off'}"><span class="chip ${t.ocr ? 't-green' : 't-neutral'}">${t.ocr ? 'On' : 'Off'}</span></td><td class="mono">${esc(t.wf)}</td><td>${esc(retName(t.ret))}</td>
      <td>${reg ? `<button class="btn btn-light btn-xs" data-act="adTypeEdit" data-id="${t.id}">${ic('pen')} Edit</button>` : ''}</td></tr>`), 'No types.', { key: 'ad-types', search: 'Search types', facets: [[3, 'OCR'], [4, 'Workflow']] });
  if (tab === 'retention') return head('calendar', 'Retention Rules', reg ? `<button class="btn btn-primary btn-sm" data-act="adRuleEdit">${ic('plus')} New rule</button>` : '')
    + `<p class="set-note">How long documents are kept, what starts the clock, and what happens at the end. Rules are assigned to document types and can be changed on a single document.</p>`
    + `<div class="user-grid">${A.rules.map(r => `<div class="user-card rule-card"><span class="rc-ic">${ic('calendar')}</span><div><b>${esc(r.name)}</b><small>${r.years} years from <b>${esc(r.trigger.toLowerCase())}</b></small><span class="chip ghost">${esc(r.method)}</span><small>${plural(A.types.filter(t => t.ret === r.id).length, 'document type')}</small></div>${reg ? `<button class="btn btn-light btn-icon btn-xs" data-act="adRuleEdit" data-id="${r.id}" aria-label="Edit ${esc(r.name)}">${ic('pen')}</button>` : ''}</div>`).join('')}</div>`;
  if (tab === 'locations') return head('building', 'Physical Locations', reg ? `<button class="btn btn-primary btn-sm" data-act="adLocAdd">${ic('plus')} New cabinet</button>` : '')
    + `<p class="set-note">The Registries, Cabinets and Shelves used to track where paper files are physically stored.</p>`
    + REGISTRIES.map(r => { const cabs = A.locs.filter(l => l.registry === r.id); return `<div class="loc-reg"><h3>${ic('building')} ${esc(r.name)} <span class="muted">· ${plural(cabs.length, 'cabinet')}</span></h3>
      <div class="user-grid">${cabs.map(c => `<div class="user-card loc-card"><span class="rc-ic">${ic('archive')}</span><div><b>${esc(c.cabinet)}</b><div class="loc-shelves">${c.shelves.map(sh => `<span class="chip ghost">${esc(sh)}</span>`).join('')}</div></div>${reg ? `<button class="btn btn-light btn-xs" data-act="adShelfAdd" data-id="${c.id}">${ic('plus')} Shelf</button>` : ''}</div>`).join('') || '<p class="muted">No cabinets yet.</p>'}</div></div>`; }).join('');
  if (tab === 'templates') {
    const kinds = [['letter', 'Official Letter'], ['memo', 'Internal Memo'], ['circular', 'Circular'], ['notice', 'Notice'], ['minutes', 'Minutes of a Meeting']];
    const cur = kinds.some(k => k[0] === ui.tplK) ? ui.tplK : 'letter', o = A.tpls[cur];
    const ctx = { ref: 'MOH/ADM/001/2026', date: new Date().toISOString(), to: 'The Director, Kenya Medical Supplies Authority', subject: 'SAMPLE SUBJECT LINE', body: ['This is how the body of the letter will look.', 'Officers write their reply here; the logo, letterhead, signature and stamp come from this template.'], signer: o.signature ? { name: 'Authorised Officer', title: 'For: Principal Secretary' } : { name: '', title: '' }, signed: o.stamp, org: '' };
    return head('pen', 'Correspondence Templates', reg ? `<button class="btn btn-light btn-sm" data-act="adTplUpload">${ic('upload')} Upload a template</button>` : '')
      + `<p class="set-note">The templates officers write replies on – official letters, memos, circulars, notices and minutes – with the logo, letterhead, signature and stamp sections.</p>
      <div class="tpl-wrap"><div class="tpl-side"><div class="tpl-kinds" role="tablist">${kinds.map(([k, l]) => `<button role="tab" aria-selected="${k === cur}" class="${k === cur ? 'on' : ''}" data-act="adTplKind" data-k="${k}">${l}</button>`).join('')}</div>
        <fieldset class="tpl-opts"><legend>Sections on the ${kinds.find(k => k[0] === cur)[1].toLowerCase()}</legend>${[['logo', 'Coat of arms and logo'], ['letterhead', 'Letterhead (address and contacts)'], ['signature', 'Signature block'], ['stamp', 'Official stamp']].map(([k, l]) => `<label class="sw-row"><span>${l}</span><input type="checkbox" role="switch" data-tplopt="${cur}:${k}" ${o[k] ? 'checked' : ''} ${reg ? '' : 'disabled'}></label>`).join('')}</fieldset></div>
      <div class="tpl-prev"><div class="page${o.logo ? '' : ' no-logo'}${o.letterhead ? '' : ' no-lh'}"><div class="content">${tplHTML(cur === 'minutes' || cur === 'notice' ? 'memo' : cur, ctx)}</div></div></div></div>`;
  }
  if (tab === 'covers') {
    const c = A.cover, sample = { id: 'cover-sample', ref: 'MOH/ADM/001/2026', vol: '1', name: 'Sample file subject', cover: { h1: c.h1, h2: c.h2, dept: 'Directorate of Administration', color: c.color }, movements: [] };
    return head('book', 'File Covers') + `<p class="set-note">The wording printed on every file cover and the default cover colour for new files.</p>
      <div class="cover-admin"><div class="det2"><div class="field"><label for="cv-h1">Top line</label><input class="input" id="cv-h1" data-cv="h1" value="${esc(c.h1)}" ${reg ? '' : 'disabled'}></div>
        <div class="field"><label for="cv-h2">Ministry</label><input class="input" id="cv-h2" data-cv="h2" value="${esc(c.h2)}" ${reg ? '' : 'disabled'}></div>
        <div class="field"><span class="label">Default cover colour</span><div class="swatches">${swatches(c.color, reg ? 'adCoverCol' : '')}</div></div>
        ${reg ? `<button class="btn btn-primary" style="justify-self:start" data-act="adCoverSave">${ic('check')} Save cover wording</button>` : ''}</div>
      <div class="cover-prev" id="cv-prev">${coverHTML(sample, 6)}</div></div>`;
  }
  return '';
}
function prefsTab(head) {
  const t = themePref;
  return head('settings', 'Preferences') + `<p class="set-note">These apply to you, in this browser.</p>
    <div class="pref"><h3>Theme</h3><div class="pref-opts" role="radiogroup" aria-label="Theme">${[['light', 'Light', 'sun'], ['dark', 'Dark', 'moon'], ['system', 'Match my device', 'settings']].map(([k, l, i]) => `<button role="radio" aria-checked="${t === k}" class="pref-opt th-${k} ${t === k ? 'on' : ''}" data-act="prefTheme" data-k="${k}"><span class="po-prev"></span><span class="po-l">${l}</span></button>`).join('')}</div></div>
    <div class="pref"><h3>Font size</h3><div class="pref-opts" role="radiogroup" aria-label="Font size">${FONT_SIZES.map(([k, l]) => `<button role="radio" aria-checked="${fontPref === k}" class="pref-opt fz ${fontPref === k ? 'on' : ''}" data-act="prefFont" data-k="${k}"><span class="po-aa" style="font-size:${Math.round(+k * .22)}px">Aa</span><span class="po-l">${l}</span></button>`).join('')}</div>
      <p class="muted" style="margin:10px 0 0;font-size:14px">Makes everything on the page larger or smaller, including buttons and tables.</p></div>`;
}

/* ---- modals ---- */
function adTypeModal(t) {
  t = t || { name: '', code: '', fields: [], ocr: true, wf: 'REG-MARK-ACT', ret: 'rr1' };
  modal(`${mHead('fileEdit', t.id ? 'Edit document type' : 'New document type', '')}<div class="modal-b det2">
    <div class="two"><div class="field"><label for="ty-n">Name</label><input class="input" id="ty-n" value="${esc(t.name)}"></div><div class="field"><label for="ty-c">Code</label><input class="input" id="ty-c" value="${esc(t.code)}" maxlength="6"></div></div>
    <div class="field"><label for="ty-f">Metadata fields <span class="muted">(comma separated)</span></label><input class="input" id="ty-f" value="${esc(t.fields.join(', '))}"></div>
    <div class="two"><div class="field"><label for="ty-w">Workflow process code</label><select class="select" id="ty-w">${['REG-MARK-ACT', 'REG-ONLY', 'ACT-REG', 'FIN-APPROVE', 'LEGAL-REVIEW'].map(w => `<option ${w === t.wf ? 'selected' : ''}>${w}</option>`).join('')}</select></div>
      <div class="field"><label for="ty-r">Retention rule</label><select class="select" id="ty-r">${S.admin.rules.map(r => `<option value="${r.id}" ${r.id === t.ret ? 'selected' : ''}>${esc(r.name)}</option>`).join('')}</select></div></div>
    <label class="sw-row"><span>Read with OCR when uploaded</span><input type="checkbox" role="switch" id="ty-o" ${t.ocr ? 'checked' : ''}></label><p class="form-err" id="tm-err" role="alert" hidden></p></div>
    <div class="modal-f"><button class="btn btn-light" data-act="close">Cancel</button><button class="btn btn-primary" data-act="adTypeSave" data-id="${t.id || ''}">${ic('check')} Save</button></div>`, '', '#ty-n');
}
function adRuleModal(r) {
  r = r || { name: '', years: 7, trigger: 'File closed', method: 'Review, then destroy' };
  modal(`${mHead('calendar', r.id ? 'Edit retention rule' : 'New retention rule', '')}<div class="modal-b det2">
    <div class="field"><label for="rr-n">Name</label><input class="input" id="rr-n" value="${esc(r.name)}"></div>
    <div class="two"><div class="field"><label for="rr-y">Keep for (years)</label><input class="input" id="rr-y" type="number" min="1" max="100" value="${r.years}"></div>
      <div class="field"><label for="rr-t">Starting from</label><select class="select" id="rr-t">${['Document date', 'File closed', 'End of financial year', 'Contract end date', 'Officer leaves service'].map(x => `<option ${x === r.trigger ? 'selected' : ''}>${x}</option>`).join('')}</select></div></div>
    <div class="field"><label for="rr-m">Then</label><select class="select" id="rr-m">${['Review, then destroy', 'Destroy (shred)', 'Transfer to National Archives', 'Permanent – transfer to Archives'].map(x => `<option ${x === r.method ? 'selected' : ''}>${x}</option>`).join('')}</select></div><p class="form-err" id="tm-err" role="alert" hidden></p></div>
    <div class="modal-f"><button class="btn btn-light" data-act="close">Cancel</button><button class="btn btn-primary" data-act="adRuleSave" data-id="${r.id || ''}">${ic('check')} Save</button></div>`, '', '#rr-n');
}

Object.assign(ACT, {
  prefTheme: el => { themePref = el.dataset.k; const root = document.documentElement; root.classList.add('qb-theme-transition'); applyThemePref(); setTimeout(() => root.classList.remove('qb-theme-transition'), 500); render(); },
  prefFont: el => { fontPref = el.dataset.k; try { localStorage.setItem('edrms-font', fontPref); } catch (e) { /* storage blocked */ } applyFont(); render(); toast(`Font size: ${FONT_SIZES.find(f => f[0] === fontPref)[1]}`); },
  adLock: el => { const d = getFile(el.dataset.f).docs.find(x => x.id === el.dataset.d); d.locked = !d.locked; save(); render(); toast(d.locked ? `${d.title} locked – it can no longer be edited` : `${d.title} unlocked`); },
  adRet: el => { const d = getFile(el.dataset.f).docs.find(x => x.id === el.dataset.d);
    modal(`${mHead('calendar', 'Retention', esc(d.title))}<div class="modal-b"><div class="field"><label for="ar-r">Retention rule</label><select class="select" id="ar-r">${S.admin.rules.map(r => `<option value="${r.id}" ${r.id === (d.retention || 'rr1') ? 'selected' : ''}>${esc(r.name)} – ${r.years} years</option>`).join('')}</select></div></div>
    <div class="modal-f"><button class="btn btn-light" data-act="close">Cancel</button><button class="btn btn-primary" data-act="adRetSave" data-f="${el.dataset.f}" data-d="${d.id}">${ic('check')} Save</button></div>`, '', '#ar-r'); },
  adRetSave: el => { const d = getFile(el.dataset.f).docs.find(x => x.id === el.dataset.d); d.retention = $('#ar-r').value; save(); closeModal(); render(); toast('Retention rule changed'); },
  adTypeEdit: el => adTypeModal(S.admin.types.find(t => t.id === el.dataset.id)),
  adTypeSave: el => { const n = $('#ty-n').value.trim(); if (!n) { const e = $('#tm-err'); e.textContent = 'Give the type a name.'; e.hidden = false; return; }
    const v = { name: n, code: ($('#ty-c').value.trim() || n.slice(0, 3)).toUpperCase(), fields: $('#ty-f').value.split(',').map(x => x.trim()).filter(Boolean), ocr: $('#ty-o').checked, wf: $('#ty-w').value, ret: $('#ty-r').value };
    const t = S.admin.types.find(x => x.id === el.dataset.id); if (t) Object.assign(t, v); else S.admin.types.push({ id: nid('dt'), ...v });
    save(); closeModal(); render(); toast('Document type saved'); },
  adRuleEdit: el => adRuleModal(S.admin.rules.find(r => r.id === el.dataset.id)),
  adRuleSave: el => { const n = $('#rr-n').value.trim(); if (!n) { const e = $('#tm-err'); e.textContent = 'Give the rule a name.'; e.hidden = false; return; }
    const v = { name: n, years: Math.max(1, +$('#rr-y').value || 1), trigger: $('#rr-t').value, method: $('#rr-m').value };
    const r = S.admin.rules.find(x => x.id === el.dataset.id); if (r) Object.assign(r, v); else S.admin.rules.push({ id: nid('rr'), ...v });
    save(); closeModal(); render(); toast('Retention rule saved'); },
  adLocAdd: () => modal(`${mHead('archive', 'New cabinet', '')}<div class="modal-b"><div class="field"><label for="lc-r">Registry</label><select class="select" id="lc-r">${REGISTRIES.map(r => `<option value="${r.id}">${esc(r.name)}</option>`).join('')}</select></div><div class="field"><label for="lc-n">Cabinet name</label><input class="input" id="lc-n" placeholder="e.g. Cabinet C"></div><p class="form-err" id="tm-err" role="alert" hidden></p></div>
    <div class="modal-f"><button class="btn btn-light" data-act="close">Cancel</button><button class="btn btn-primary" data-act="adLocSave">${ic('plus')} Add cabinet</button></div>`, '', '#lc-n'),
  adLocSave: () => { const n = $('#lc-n').value.trim(); if (!n) { const e = $('#tm-err'); e.textContent = 'Give the cabinet a name.'; e.hidden = false; return; } S.admin.locs.push({ id: nid('pl'), registry: $('#lc-r').value, cabinet: n, shelves: ['Shelf 1'] }); save(); closeModal(); render(); toast(`${n} added`); },
  adShelfAdd: el => { const c = S.admin.locs.find(x => x.id === el.dataset.id); const base = /drawer/i.test(c.shelves[0] || '') ? 'Drawer' : 'Shelf'; c.shelves.push(`${base} ${c.shelves.length + 1}`); save(); render(); },
  adTplKind: el => { ui.tplK = el.dataset.k; render(); },
  adTplUpload: () => toast('Choose a .docx with the letterhead – it becomes the template (mockup)'),
  adCoverCol: el => { S.admin.cover.color = el.dataset.v; render(); },
  adCoverSave: () => { S.admin.cover.h1 = $('#cv-h1').value.trim() || 'Republic of Kenya'; S.admin.cover.h2 = $('#cv-h2').value.trim() || 'Ministry of Health'; save(); render(); toast('Cover wording saved – used on every file cover'); },
});
document.addEventListener('change', e => { const k = e.target.dataset.tplopt; if (!k) return; const [kind, opt] = k.split(':'); S.admin.tpls[kind][opt] = e.target.checked; save(); render(); });
document.addEventListener('input', e => { const k = e.target.dataset.cv; if (!k) return; const s2 = { id: 'cover-sample', ref: 'MOH/ADM/001/2026', vol: '1', name: 'Sample file subject', cover: { h1: $('#cv-h1').value, h2: $('#cv-h2').value, dept: 'Directorate of Administration', color: S.admin.cover.color }, movements: [] }; $('#cv-prev').innerHTML = coverHTML(s2, 6); });
