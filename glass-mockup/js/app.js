/* ==========================================================================
   Q-BITS EDRMS — glass UI mockup
   Single-page app (hash routing, no build step) so it runs on GitHub Pages.

   Journeys kept from the live system:
     Registry  → sends file to Marking Officer
     Marking   → minutes the folios, marks to an Action Officer → back to Registry
     Registry  → sends file to the marked Action Officer
     Action    → Responses / Request files / Delegate / Done → back to Registry
     Registry  → files it away (or sends it round again)
   ========================================================================== */

/* ---------- helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const ICONS = {
  grid: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  gridView: '<rect width="7" height="7" x="3" y="3" rx="1.5"/><rect width="7" height="7" x="14" y="3" rx="1.5"/><rect width="7" height="7" x="14" y="14" rx="1.5"/><rect width="7" height="7" x="3" y="14" rx="1.5"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  folder: '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  folders: '<path d="M20 17a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.9a2 2 0 0 1-1.69-.9l-.81-1.2a2 2 0 0 0-1.67-.9H8a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2Z"/><path d="M2 8v11a2 2 0 0 0 2 2h14"/>',
  folderPlus: '<path d="M12 10v6"/><path d="M9 13h6"/><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  inboxIn: '<path d="M12 3v12"/><path d="m8 11 4 4 4-4"/><path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  scrollDown: '<path d="m7 6 5 5 5-5"/><path d="m7 13 5 5 5-5"/>',
  arrowUp: '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>',
  arrowR: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  filePlus: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M9 15h6"/><path d="M12 18v-6"/>',
  fileEdit: '<path d="M12.5 22H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v9.5"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M13.378 15.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/>',
  compass: '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  chevL: '<path d="m15 18-6-6 6-6"/>',
  chevR: '<path d="m9 18 6-6-6-6"/>',
  chevD: '<path d="m6 9 6 6 6-6"/>',
  sortUD: '<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>',
  filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>',
  star: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  reply: '<path d="M20 18v-2a4 4 0 0 0-4-4H4"/><path d="m9 17-5-5 5-5"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"/>',
  printer: '<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
  pen: '<path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>',
  stamp: '<path d="M5 22h14"/><path d="M19.27 13.73A2.5 2.5 0 0 0 17.5 13h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1.5c0-.66-.26-1.3-.73-1.77Z"/><path d="M14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-6 0c0 2 1 2 1 3.5V13"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  archive: '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  checkCircle: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  listChecks: '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
  sidebar: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m16 15-3-3 3-3"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
  building: '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  more: '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
  moreH: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  sticky: '<path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/>',
  fold: '<path d="M4 4h16v9l-7 7H4z"/><path d="M20 13h-7v7"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  paperclip: '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
  swap: '<path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M10.5 11.5H12v5"/><path d="M10 16.5h4"/><path d="M12 7.6h.01"/>',
  scan: '<rect x="2.5" y="2.5" width="19" height="19" rx="4.5"/><path d="M7 10V8a1 1 0 0 1 1-1h2M14 7h2a1 1 0 0 1 1 1v2M17 14v2a1 1 0 0 1-1 1h-2M10 17H8a1 1 0 0 1-1-1v-2"/>',
  chat: '<path d="M7 18.5 4.5 21v-3.2A3 3 0 0 1 3 15.2V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v9.2a3 3 0 0 1-3 3Z"/>',
  sparkles: '<path d="M14.5 3c.6 3.6 2.4 5.4 6 6-3.6.6-5.4 2.4-6 6-.6-3.6-2.4-5.4-6-6 3.6-.6 5.4-2.4 6-6Z"/><path d="M6 13.5c.35 2.1 1.4 3.15 3.5 3.5-2.1.35-3.15 1.4-3.5 3.5-.35-2.1-1.4-3.15-3.5-3.5 2.1-.35 3.15-1.4 3.5-3.5Z"/>',
  book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
};
const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

const ROMAN = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
const toRoman = n => ROMAN.reduce((s, [v, r]) => { while (n >= v) { s += r; n -= v; } return s; }, '');
const fromRoman = r => { const m = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }; let t = 0; for (let i = 0; i < (r || '').length; i++) { const a = m[r[i]], b = m[r[i + 1]] || 0; t += a < b ? -a : a; } return t; };

const fmtDate = iso => new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
const fmtDay = iso => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtLong = iso => new Date(iso).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fmtDT = iso => new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtSize = kb => kb >= 1024 ? (kb / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(kb)) + ' KB';
function ago(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + ' mins ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  const d = Math.floor(s / 86400); return d === 1 ? '1 day ago' : d + 'd ago';
}
const daysSince = iso => (Date.now() - new Date(iso)) / 864e5;
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const initials = n => n.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
const AV_COLORS = ['#007F7B', '#7c4dff', '#0d9488', '#e0712b', '#c2410c', '#be185d', '#0369a1', '#4d7c0f'];
const avColor = s => AV_COLORS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length];
const avatar = (pid, cls = '') => { const p = person(pid); return `<span class="av ${cls}" style="background:${avColor(p.name)}" title="${esc(p.name)}">${initials(p.name)}</span>`; };

/* ---------- state ---------- */
const KEY = 'qbits-edrms-glass-mock';
let S;
try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; }
if (!S || S.v !== 6) S = seedState();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage full or blocked: keep in memory */ } };
const nid = p => p + (++S.seq);
const ensureIds = () => { S.files.forEach(f => f.docs.forEach(d => { d.stickies = d.stickies || []; d.minutes.forEach(m => { if (!m.id) m.id = nid('m'); });
  d.minutes.filter(m => m.n).sort((a, b) => (a.at || '').localeCompare(b.at || '')).forEach((m, i) => { m.n = toRoman(i + 1); }); })); ensureRecords(); };
/* Physical custody, file opening/closing/disposal and census, as in the live Registry */
function ensureRecords() {
  S.files.forEach((f, i) => { f.state = f.state || 'Open'; f.location = f.location || `Registry Room ${f.registry === 'hr' ? 4 : 2} · Rack ${String.fromCharCode(65 + i % 4)} · Shelf ${1 + i % 5}`; });
  const doc1 = id => S.files.find(f => f.id === id)?.docs[0]?.id || null;
  S.handovers = S.handovers || [
    { id: 'h1', fileId: 'f6', what: 'file', docId: null, toKind: 'officer', to: 'vera', room: '', purpose: 'Briefing before the Senate hearing', status: 'RECEIVED', sent: daysAgo(1, 10), received: daysAgo(1, 11), by: 'john' },
    { id: 'h2', fileId: 'f2', what: 'document', docId: doc1('f2'), toKind: 'room', to: '', room: 'Board Room, 3rd floor', purpose: 'Audit inspection', status: 'SENT', sent: daysAgo(0, 9), by: 'john' },
    { id: 'h3', fileId: 'f3', what: 'file', docId: null, toKind: 'officer', to: 'otieno', room: '', purpose: 'Draft the press statement', status: 'RETURNED', sent: daysAgo(6, 9), received: daysAgo(6, 10), returned: daysAgo(0, 8), by: 'john' },
    { id: 'h4', fileId: 'f10', what: 'file', docId: null, toKind: 'officer', to: 'erickson', room: '', purpose: 'ICT handover report', status: 'CLOSED', sent: daysAgo(12, 9), received: daysAgo(12, 11), returned: daysAgo(8, 15), closed: daysAgo(8, 16), by: 'john' },
  ];
  S.recReqs = S.recReqs || [
    { id: 'q1', type: 'OPEN', series: 'MOH/ADM/1/1', subject: 'Cold Chain Equipment Maintenance', fileId: null, reason: 'New subject with no existing file', status: 'Approved', at: daysAgo(3, 11), decision: daysAgo(2, 9), decidedBy: 'vera', by: 'john' },
    { id: 'q2', type: 'CLOSE', fileId: 'f10', reason: 'Matter concluded', status: 'Awaiting approval', at: daysAgo(1, 14), by: 'john' },
    { id: 'q3', type: 'DISPOSE', fileId: 'f11', reason: 'Retention period has ended', status: 'Rejected', at: daysAgo(9, 10), decision: daysAgo(7, 12), decidedBy: 'vera', note: 'Audit query still open', by: 'john' },
  ];
  S.censuses = S.censuses || [];
  if (!S.senders) {
    const names = new Map();
    S.files.flatMap(f => f.docs).forEach(d => {
      if (d.kind !== 'response' && d.from && !/Directorate|Department|Unit|Management|Resource|Planning|Records|ICT/.test(d.from)) names.set(d.from, (names.get(d.from) || '') + 's');
      if (d.kind === 'response' && d.to) names.set(d.to.split(',')[0].trim(), (names.get(d.to.split(',')[0].trim()) || '') + 'r');
    });
    S.senders = [...names].map(([name, u], i) => ({ id: 'ms' + i, name, as: u.includes('s') && u.includes('r') ? 'both' : u.includes('r') ? 'recipient' : 'sender', on: true }));
  }
}
ensureIds();

let theme = 'light';
try { theme = localStorage.getItem('edrms-theme') || 'light'; } catch (e) { /* storage blocked */ }
document.documentElement.dataset.theme = theme;
try { if (localStorage.getItem('edrms-side-mini') === '1') document.body.classList.add('side-mini'); } catch (e) { /* storage blocked */ }
const freshUpload = () => ({ tab: 'single', step: 1, fileId: '', files: [], metas: [], idx: 0, err: '', phase: 0 });
const ui = { navStack: [location.hash || "#/"],
  loginRole: 'registry',
  files: { q: '', sort: 'recent', show: 'all', reg: 'all', view: 'grid' },
  dash: { tab: 'all', q: '', stage: '', filter: false, dir: 'desc' },
  upload: freshUpload(), newFile: null, resp: null, showMv: false,
  ho: null, rec: { type: 'OPEN', series: '', subject: '', fileId: '', reason: '', err: '', fstate: 'all' },
  senders: { q: '', off: false, edit: '' },
  census: { id: '', title: '', date: new Date().toISOString().slice(0, 10), covers: 'all', by: '' },
  sel: null, editing: null, fileTab: 'folios',
  fabOpen: false, aiSeen: false, chat: [], capRects: [],
  guideQ: '', mvFile: '', stickyColor: 'yellow',
};

const role = () => S.session;
const meId = () => ACCOUNTS[S.session];
const me = () => PEOPLE[meId()];
const inboxKey = () => role() === 'registry' ? 'registry' : meId();
function person(id) {
  if (id === 'registry') return { id: 'registry', name: 'Registry', title: 'Main Registry' };
  if (id === 'public') return { id: 'public', name: 'Everyone', title: '' };
  return PEOPLE[id] || { id, name: String(id), title: '' };
}
const byName = n => Object.values(PEOPLE).find(p => p.name === n);
const getFile = id => S.files.find(f => f.id === id);
const getDoc = (f, id) => f && f.docs.find(d => d.id === id);
const liveDocs = f => f.docs.filter(d => d.status !== 'landing');
const regName = id => (REGISTRIES.find(r => r.id === id) || {}).name || '—';
const byFolio = (a, b) => a.folio.localeCompare(b.folio, undefined, { numeric: true });
const stageChip = st => { const s = STAGES[st]; return `<span class="chip t-${s.tone}"><span class="dot"></span>${s.short}</span>`; };
const withLabel = f => f.withUser === 'registry' ? 'Registry Officer' : person(f.withUser).name;
const fileSizeKB = f => f.docs.reduce((a, d) => a + (d.sizeKB || 200), 0);
const lastDocDate = f => f.docs.reduce((a, d) => d.date > a ? d.date : a, f.created || f.updated);
const isAmber = f => f.stage !== 'filed' && daysSince(f.updated) > 5;
const confTone = c => ({ Public: 't-green', Internal: 't-blue', Confidential: 't-amber', Secret: 't-red' }[c] || 't-neutral');
const KIND = { letter: ['Letter', 't-blue'], memo: ['Memo', 't-violet'], response: ['Response', 't-teal'], attachment: ['Attachment', 't-neutral'] };

/* permissions */
function canAnnotate(f) {
  if (f.stage === 'filed') return false;
  if (role() === 'registry') return f.withUser === 'registry';
  return f.withUser === meId();
}
const seesSticky = s => s.to === 'public' || s.by === meId() || s.to === meId() || (s.to === 'registry' && role() === 'registry');
const canRemoveSticky = s => s.by === meId() || s.to === meId() || (s.to === 'registry' && role() === 'registry');

function notify(to, text, from, fileId) { S.notifications.unshift({ id: nid('n'), to, text, from, fileId, at: new Date().toISOString(), read: false }); }
const myNotifs = () => S.notifications.filter(n => n.to === inboxKey());
const unread = () => myNotifs().filter(n => !n.read).length;

/* Minutes are numbered per letter: every letter's first minute is I */
function nextMinuteNo(f, d) {
  let max = 0; (d ? [d] : f.docs).forEach(x => x.minutes.forEach(m => { if (m.n) max = Math.max(max, fromRoman(m.n)); }));
  return toRoman(max + 1);
}
function autoPlace(d) {
  const i = d.minutes.length; const y = 63 + Math.floor(i / 2) * 11;
  return y <= 88 ? { x: i % 2 ? 51 : 7, y } : { x: 8 + (i * 13) % 50, y: 8 + (i * 17) % 50 };
}
function addMinute(f, d, text, by, extra = {}) {
  if (!d) return;
  d.minutes.push({ id: nid('m'), n: nextMinuteNo(f, d), text, by, at: new Date().toISOString(), w: 40, ink: 'blue', font: 'neat', ...autoPlace(d), ...extra });
}
function nextFolio(f) {
  const nums = f.docs.map(d => parseInt(d.folio, 10)).filter(n => !isNaN(n));
  return String((nums.length ? Math.max(...nums) : 0) + 1);
}
function nextSubFolio(f, base) {
  const used = f.docs.filter(d => d.folio.startsWith(base) && d.folio !== base).map(d => d.folio.slice(base.length));
  let c = 'a'; while (used.includes(c)) c = String.fromCharCode(c.charCodeAt(0) + 1);
  return base + c;
}
function nextInSeries(series) {
  const s = series.replace(/\/+$/, '');
  const n = S.files.filter(f => f.ref.startsWith(s + '/')).map(f => parseInt(f.ref.slice(s.length + 1), 10)).filter(x => !isNaN(x));
  return `${s}/${(n.length ? Math.max(...n) : 0) + 1}`;
}
function move(f, from, to) { f.movements.push({ date: new Date().toISOString(), from, to }); f.updated = new Date().toISOString(); }

function involved(f) {
  if (role() === 'registry') return true;
  const id = meId();
  return f.withUser === id || f.markedTo === id || f.delegatedBy === id || f.movements.some(m => m.from === id || m.to === id);
}
const filesToMark = () => S.files.filter(f => f.stage === 'marking' && f.withUser === 'vera');
const filesMarked = () => S.files.filter(f => f.movements.some(m => m.from === 'vera'));
const filesToAct = () => S.files.filter(f => f.stage === 'action' && f.withUser === meId());
const filesActed = () => S.files.filter(f => f.movements.some(m => m.from === meId() && m.to === 'registry') && !(f.stage === 'action' && f.withUser === meId()));
const filesNeedRouting = () => S.files.filter(f => !f.draft && ['registry', 'returned_marking', 'returned_action'].includes(f.stage) && f.withUser === 'registry');
const landingDocs = () => S.files.flatMap(f => f.docs.filter(d => d.status === 'landing').map(d => ({ f, d })));
const notesForMe = () => S.files.flatMap(f => f.docs.flatMap(d => d.stickies.filter(s => s.by !== meId() && (s.to === meId() || (s.to === 'registry' && role() === 'registry'))).map(s => ({ f, d, s }))));
function myQueue() {
  if (role() === 'registry') return filesNeedRouting();
  if (role() === 'marking') return filesToMark();
  return filesToAct();
}
/* Dashboard scope: Registry and Action Officers see their own registry */
function dashFiles() {
  if (role() === 'marking') return S.files.filter(f => !f.draft && involved(f));
  const reg = me().registry;
  return S.files.filter(f => !f.draft && f.registry === reg && (role() === 'registry' || involved(f)));
}
function bringupsDue() {
  const end = new Date(); end.setHours(23, 59, 59);
  return S.bringups.filter(b => !b.done && new Date(b.date) <= end && (role() === 'registry' ? getFile(b.fileId)?.registry === me().registry : b.for === meId()));
}
const myBringups = () => S.bringups.filter(b => role() === 'registry' ? true : b.for === meId() || b.by === meId());

/* ---------- router ---------- */
/* Links are written as '#/path?key=value' in the code and turned into plain
   names in the address bar ('#file-f1-doc-d8', '#routing-returnedaction'),
   which is what the claude.ai preview allows. */
const ROUTE_PARAM = { routing: 'stage', queue: 'tab', guide: 's', upload: 'file', files: 'r' };
const ROUTE_ALIAS = { settings: 'profile' };
function encodeRoute(h) {
  const [path, qs] = String(h).replace(/^#\/?/, '').split('?');
  const parts = path.split('/').filter(Boolean), q = new URLSearchParams(qs || '');
  if (!parts.length) return '#overview';
  const seg = [ROUTE_ALIAS[parts[0]] || parts[0], ...parts.slice(1)];
  const key = ROUTE_PARAM[parts[0]]; if (key && q.get(key)) seg.push(q.get(key).replace(/_/g, ''));
  return '#' + seg.join('-');
}
/* Names used by Back links: "Back to Registries & Files" */
const SCREEN_NAME = { files: 'Registries & Files', routing: 'My Queue', queue: 'My Queue', bringup: 'Bring Up Diary', settings: 'Settings', guide: 'User Manual', upload: 'Upload Document', inward: 'Inward Mail Register', outward: 'Outward Mail Register', movements: 'Movement Sheets', physical: 'Physical Files', access: 'Files Requested', senders: 'Mail Senders', records: 'Files & Records', census: 'Physical Files', tutorial: 'Tutorial', grid: 'File grid', ai: 'Q-BITS AI', notifications: 'Notifications' };
function screenName(h) {
  const { parts } = parseHash(h);
  if (!parts.length) return 'Overview';
  if (parts[0] === 'file' || parts[0] === 'grid') { const f = getFile(parts[1]); if (f) { if (parts[2] === 'letter') { const d = getDoc(f, parts[3]); if (d) return `Folio ${d.folio} – ${d.title}`; } return parts[0] === 'grid' ? `File grid – ${f.name}` : f.name; } }
  return SCREEN_NAME[parts[0]] || 'previous page';
}
function unslug(v) { return Object.keys(STAGES).find(k => k.replace(/_/g, '') === v) || v; }
function parseHash(h) {
  const raw = (h == null ? location.hash : h).replace(/^#/, '');
  if (raw.startsWith('/')) { const [path, qs] = raw.split('?'); return { parts: path.split('/').filter(Boolean), q: Object.fromEntries(new URLSearchParams(qs || '')) }; }
  const seg = raw.split('-').filter(Boolean);
  let name = seg[0] || 'overview';
  if (name === 'overview') return { parts: [], q: {} };
  name = Object.keys(ROUTE_ALIAS).find(k => ROUTE_ALIAS[k] === name) || name;
  if (name === 'file') return { parts: ['doc', 'letter'].includes(seg[2]) ? ['file', seg[1], seg[2], seg[3]] : ['file', seg[1]], q: {} };
  const key = ROUTE_PARAM[name], q = {};
  if (key && seg[1]) q[key] = unslug(seg.slice(1).join('-'));
  return { parts: [name], q };
}
let lastPath = null, curNav = 'dashboard';
const go = h => { const e = encodeRoute(h); if (location.hash === e) render(); else location.hash = e; };

function render() {
  closeAcct();
  document.body.classList.remove('nav-open');
  const { parts, q } = parseHash();
  const root = $('#app');
  renderFab();
  if (!S.session) { root.innerHTML = viewLogin(); return; }
  if (parts[0] === 'login') { go('#/'); return; }
  if (!location.hash || location.hash.startsWith('#/')) { const e = encodeRoute(location.hash || '#/'); if (e !== location.hash) { history.replaceState(null, '', e); } }
  if (parts[0] !== 'file') ui.curFile = null; // entering a file again starts on the folio table
  let view, nav = 'dashboard', after = null;
  curNav = { files: 'files', file: 'files', routing: 'queue', queue: 'queue', upload: 'files', bringup: 'bringup', settings: 'settings', guide: 'settings', inward: 'inward', outward: 'outward', access: 'access', physical: 'physical', census: 'physical' }[parts[0]] || (parts.length ? 'more' : 'dashboard');
  switch (parts[0]) {
    case 'files': view = viewFiles(q); nav = 'files'; break;
    case 'file': {
      const f = getFile(parts[1]); nav = 'files';
      if (!f) { view = notFound(); break; }
      if (parts[2] === 'letter') { const d = getDoc(f, parts[3]); if (!d) { view = notFound(); break; } ui.curFile = f.id; view = viewLetter(f, d); break; }
      const target = parts[2] === 'doc' ? parts[3] : q.pg;
      view = viewFile(f, q, target);
      if (target) after = () => scrollToPage(target, true);
      break;
    }
    case 'routing': view = viewRouting(q); nav = 'queue'; break;
    case 'queue': view = viewQueue(q); nav = 'queue'; break;
    case 'upload': view = viewUpload(q); nav = 'upload'; break;
    case 'ai': view = viewAI(); nav = 'ai'; after = () => $('#aip-q')?.focus(); break;
    case 'inward': view = viewInward(); nav = 'inward'; break;
    case 'outward': view = viewOutward(); nav = 'outward'; break;
    case 'movements': view = viewMovements(); nav = 'more'; break;
    case 'bringup': view = viewBringup(); nav = 'bringup'; break;
    case 'access': view = viewAccess(); nav = 'access'; break;
    case 'physical': view = viewPhysical(q); nav = 'physical'; break;
    case 'records': view = viewRecords(q); nav = 'more'; break;
    case 'census': view = viewCensus(q); nav = 'physical'; break;
    case 'senders': view = viewSenders(); nav = 'more'; break;
    case 'grid': view = viewGrid({ id: parts[1] }); nav = 'files'; break;
    case 'tutorial': view = viewTutorial(parts[1]); nav = 'more'; break;
    case 'guide': view = viewGuide(); nav = 'guide'; if (q.s) after = () => $('#g-' + q.s)?.scrollIntoView({ block: 'start' }); break;
    case 'settings': view = viewSettings(); nav = 'settings'; break;
    default: view = viewDashboard();
  }
  root.innerHTML = parts.length ? `<div class="app">${sidebar(nav)}<main class="main">${view}</main></div>` : `<div class="app no-side"><main class="main">${view}</main></div>`;

  const path = location.hash;
  if (path !== lastPath) { lastPath = path; window.scrollTo(0, 0); }
  watchPages();
  tfInit(); tfWatch();
  if (after) requestAnimationFrame(after);
}
window.addEventListener('hashchange', () => { ui.sel = null; ui.editing = null; const st = ui.navStack || (ui.navStack = []), h = location.hash; if (st.length > 1 && st[st.length - 2] === h) st.pop(); else if (st[st.length - 1] !== h) { if (st.length && screenName(st[st.length - 1]) === screenName(h)) st[st.length - 1] = h; else st.push(h); } render(); });

/* ==========================================================================
   Login
   ========================================================================== */
function viewLogin() {
  const roles = [['registry', 'Registry', 'John Kimani'], ['marking', 'Marking Officer', 'Vera Wambui'], ['action', 'Action Officer', 'Virah Creates']];
  return `<div class="login"><div class="login-frame glass">
    <section class="login-brand">
      <div class="crest">REPUBLIC OF KENYA<img src="assets/coat-of-arms.png" alt="Coat of arms of Kenya">MINISTRY OF HEALTH<span class="dept-tab">State Department for Medical Services</span></div>
      <h1>Electronic Document and Records Management System</h1>
      <p>EDRMS uses your Q-BITS ERP account. Your role, department and data scope come from the ERP.</p>
      <div class="foot"><span class="qb-lockup">${QB_MARK('qb-lockup__mark')}<span><b>Q-BITS</b><small>AI POWERED ERP</small></span></span><span>Powered by CodexAI Kenya</span></div>
    </section>
    <section class="login-form">
      <h2>Sign in to EDRMS</h2>
      <p>EDRMS uses your Q-BITS ERP account. Your role, department and data scope come from the ERP.</p>
      <form class="stack" onsubmit="ACT.login();return false">
        <label class="input-icon">${ic('mail')}<input class="input" type="email" placeholder="Work Email" autocomplete="username" value="${esc(PEOPLE[ACCOUNTS[ui.loginRole]].name.toLowerCase().replace(/\s+/g, '.'))}@health.go.ke"><span class="sr">Work Email</span></label>
        <label class="input-icon">${ic('lock')}<input class="input" type="password" placeholder="Password" autocomplete="current-password" value="demo-password"><span class="sr">Password</span></label>
        <button class="btn btn-primary" data-act="login">Sign In ${ic('arrowR')}</button>
        <div class="or">or</div>
        <button type="button" class="btn btn-white" data-act="login"><span class="ms-logo"><i style="background:#f25022"></i><i style="background:#7fba00"></i><i style="background:#00a4ef"></i><i style="background:#ffb900"></i></span> Continue with Microsoft</button>
      </form>
      <div class="demo-roles">
        <span class="label">Mockup: choose which account to sign in as</span>
        <div class="row">${roles.map(([r, l, n]) => `<button type="button" class="${ui.loginRole === r ? 'on' : ''}" data-act="pickRole" data-role="${r}"><b>${l}</b>${n}</button>`).join('')}</div>
      </div>
    </section>
  </div></div>`;
}

/* ==========================================================================
   Shell: sidebar + the page header used on every screen
   ========================================================================== */
/* Vector qb mark, as given in the Q-BITS design skill (used inside the AI buttons) */
const QB_MARK = cls => `<svg class="qb-mark-svg ${cls}" viewBox="100 140 1770 1240" fill="none" stroke-width="44" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M800 1355H135V168H1071V772" stroke="#b7e4df"/><circle cx="1313" cy="772" r="242" stroke="#b7e4df"/><path d="M1157 168H1850V1355H913V772" stroke="#187f7b"/><circle cx="669" cy="772" r="242" stroke="#187f7b"/></svg>`;
/* Light / dark toggle from the Q-BITS design skill (sun & clouds <-> moon & stars) */
const themeToggle = (cls = '') => `<button class="qb-theme-toggle ${cls} ${theme === 'dark' ? 'is-dark' : ''}" role="switch" aria-checked="${theme === 'dark'}" aria-label="Dark mode" data-act="toggleTheme"><span class="qb-tt-stars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><span class="qb-tt-clouds" aria-hidden="true"><i></i><i></i></span><span class="qb-tt-knob" aria-hidden="true"><span class="qb-tt-crater"></span><span class="qb-tt-crater"></span><span class="qb-tt-crater"></span></span></button>`;
function sidebar(active) {
  const r = role();
  const items = navItems().filter(([k]) => k !== 'settings'); // Settings stays by your name at the bottom
  const recent = myNotifs().slice(0, 2);
  return `<aside class="sidebar glass" aria-label="Main navigation">
    <div class="side-top">
      <div class="side-logo"><div class="logo-disc">${MOH_LOCKUP}</div>
      <button class="btn btn-glass btn-icon btn-sm" data-act="closeNav" aria-label="Collapse menu" title="Collapse menu">${ic('sidebar')}</button></div>
      <button class="side-search" data-act="palette">${ic('search')} Search</button>
    </div>
    <a class="qb-side-ai ${active === 'ai' ? 'is-active' : ''}" href="#/ai" ${active === 'ai' ? 'aria-current="page"' : ''} title="Q-BITS AI"><span class="qb-side-ai__rim" aria-hidden="true"></span>${QB_MARK('qb-side-ai__mark')}<span class="qb-side-ai__label">Q-BITS AI</span></a>
    <div class="side-scroll">
      <div class="side-h">Navigation</div>
      <nav class="nav">${items.map(([k, h, l, c, i]) => k === 'request' ? `<button type="button" data-act="requestAny">${ic(i)} ${l}</button>` : `<a href="${h}" class="${active === k ? 'on' : ''}" ${active === k ? 'aria-current="page"' : ''}>${ic(i)} ${l}${c ? `<span class="count">${c}</span>` : ''}</a>`).join('')}</nav>
      ${r === 'registry' ? `<div class="side-h">Registry</div>
      <nav class="nav" aria-label="Registry pages">${REG_PAGES().map(([k, h, l, c, i]) => `<a href="${h}" class="${active === k ? 'on' : ''}" ${active === k ? 'aria-current="page"' : ''}>${ic(i)} ${l}${c ? `<span class="count">${c}</span>` : ''}</a>`).join('')}</nav>` : ''}
      <div class="side-h">Recent Notifications</div>
      ${recent.length ? recent.map(notifCard).join('') : '<p class="muted" style="margin:0 8px;font-size:14px">You are all caught up.</p>'}
    </div>
    <div class="side-bottom">
      <div class="side-user">${avatar(meId(), 'av-lg')}<div><b>${esc(me().name)}</b><span>${ROLE_LABEL[r]}</span></div>
        <a class="btn btn-glass btn-icon ${['settings', 'guide'].includes(active) ? 'on' : ''}" href="#/settings" title="Settings" aria-label="Settings">${ic('settings')}</a>
        <button class="btn btn-glass btn-icon" data-act="logout" title="Sign out" aria-label="Sign out">${ic('logout')}</button></div>
    </div>
  </aside>`;
}
function notifCard(n) {
  const f = getFile(n.fileId) || {}; const p = person(n.from);
  return `<div class="notif-card ${n.read ? '' : 'unread'}" data-act="openNotif" data-id="${n.id}">
    <div class="top"><span>${esc(f.name || 'File')}</span><a>View</a></div>
    <span class="ago">${ago(n.at)}</span><p>${esc(n.text)}</p>
    <div class="from">from ${esc(p.name)} - ${esc(p.title)}</div></div>`;
}
/* One navigation list for the Overview top nav and the side nav on every other page */
function navItems() {
  const reg = role() === 'registry';
  return [['dashboard', '#/', 'Overview', 0, 'grid'], ['files', '#/files', 'Registries & Files', 0, 'folders'],
    ['queue', '#/queue', 'My Queue', myQueue().length + notesForMe().length, 'listChecks'],
    reg ? ['bringup', '#/bringup', 'Bring Up Diary', bringupsDue().length, 'calendar'] : ['request', '', 'Request file', 0, 'filePlus'],
    ['settings', '#/settings', 'Settings', 0, 'settings']];
}
/* Registry pages in the side navigation (moved out of Settings) */
const REG_PAGES = () => [['inward', '#/inward', 'Inward Register', landingDocs().length, 'inboxIn'], ['outward', '#/outward', 'Outward Register', 0, 'send'],
  ['access', '#/access', 'Access Requests', S.access.filter(a => a.status === 'open').length, 'lock'], ['physical', '#/physical', 'Physical Files', 0, 'archive']];
function topNav() {
  const items = navItems();
  return `<nav class="topnav" aria-label="Main">${items.map(([k, h, l, c]) => k === 'request' ? '<button type="button" data-act="requestAny">Request file</button>' : `<a href="${h}" class="${curNav === k ? 'on' : ''}" ${curNav === k ? 'aria-current="page"' : ''}>${l}${c ? `<span class="count">${c}</span>` : ''}</a>`).join('')}</nav>`;
}
function pageHead({ crumbs = [], title, sub = '', lead = '', right = '', back = null, meta = '', hero = '' }) {
  return `<section class="phead glass ${hero ? 'is-hero' : ''}">
    <div class="phead-top">
      ${hero ? topNav() : `<button class="ph-ic menu-toggle" data-act="openNav" aria-label="Open menu">${ic('menu')}</button><nav class="crumbs" aria-label="Breadcrumb"><a href="#/">EDRMS</a>${crumbs.map(([t, h]) => `${ic('chevR')}${h ? `<a href="${h}">${esc(t)}</a>` : `<span>${esc(t)}</span>`}`).join('')}</nav>`}
      <div class="ph-icons">
        <button class="ph-ic" data-act="palette" aria-label="Search">${ic('search')}</button>
        ${themeToggle()}
        <button class="ph-ic" data-act="openNotifs" aria-label="Notifications">${ic('bell')}${unread() ? `<span class="badge">${unread()}</span>` : ''}</button>
        <button class="ph-ic me" data-act="acctMenu" aria-haspopup="menu" aria-expanded="false" aria-label="Account: ${esc(me().name)}" title="${esc(me().name)}">${avatar(meId())}</button>
      </div>
    </div>
    ${hero || ''}
    ${hero ? '' : `<div class="phead-main">${lead}
      <div class="phead-titles">${(() => { const st = ui.navStack || [], prev = st.length > 1 ? st[st.length - 2] : null, fb = back ? back[1] : (crumbs.filter(c => c[1]).pop() || [, '#/'])[1];
        const label = prev ? `Back to ${screenName(prev)}` : back ? back[0] : `Back to ${screenName(encodeRoute(fb))}`;
        return `<button type="button" class="back" data-act="goBack" data-fallback="${esc(fb)}">${ic('chevL')} ${esc(label)}</button>`; })()}<h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}${meta ? `<div class="meta">${meta}</div>` : ''}</div>
      ${right ? `<div class="phead-right">${right}</div>` : ''}
    </div>`}
  </section>`;
}
const notFound = () => pageHead({ title: 'Not found' }) + `<div class="panel glass empty">${ic('folder')}<p>That file could not be found.</p><a class="btn btn-primary btn-sm" href="#/files">Back to Registries &amp; Files</a></div>`;

/* ==========================================================================
   File cover — the paper cover from the live New File form
   ========================================================================== */
function coverHTML(f, rows = 14) {
  const c = f.cover || {}; const col = coverColour(c.color);
  const mv = (f.movements || []).slice(-rows);
  const body = Array.from({ length: Math.max(rows, mv.length) }, (_, i) => {
    const m = mv[i];
    return m ? `<tr><td>${fmtDate(m.date)}</td><td>${esc(person(m.from).name)}</td><td>${esc(person(m.to).name)}</td><td>${m.to === 'registry' ? '' : initials(person(m.to).name)}</td></tr>` : '<tr><td></td><td></td><td></td><td></td></tr>';
  }).join('');
  return `<div class="cover-sheet" data-cover-of="${esc(f.id || '')}" style="--cv:${col.bg};--cvink:${col.ink}">
    <div class="cv-bind"></div>${f.type === 'ty' ? '<div class="cv-ty">TY</div>' : ''}
    <div class="cv-fileno"><span class="hand">${esc(f.ref || '')}</span>${f.vol ? `<span class="cv-vol">VOL. ${esc(f.vol)}</span>` : ''}</div>
    <div class="cv-line"></div><div class="cv-lbl">File No.</div>
    <div class="cv-rep">${esc(c.h1 || 'Republic of Kenya')}</div>
    <div class="cv-min">${esc(c.h2 || 'Ministry of Health')}</div>
    <div class="cv-dept">${esc(c.dept || '')}</div><div class="cv-line"></div><div class="cv-lbl r">Department</div>
    <div class="cv-lbl c">SUBJECT</div><div class="cv-subj">${esc(f.name || '')}</div>
    <table class="cv-mv"><thead><tr><th>Date</th><th>From</th><th>Officer to see</th><th>Officer's initials</th></tr></thead><tbody>${body}</tbody></table>
  </div>`;
}
function repaintCovers(f) { $$(`[data-cover-of="${f.id}"]`).forEach(el => { const rows = el.querySelectorAll('tbody tr').length; el.outerHTML = coverHTML(f, rows); }); }

/* ==========================================================================
   Dashboard (R01 layout: Quick Actions left, numbers + File routing right)
   ========================================================================== */
const qa = (icon, title, sub, target, badge) => {
  const inner = `<span class="ic">${ic(icon)}</span><span class="txt"><b>${title}</b><span class="sub">${sub}</span></span>${badge ? `<span class="badge">${badge}</span>` : ''}`;
  return target.startsWith('#') ? `<a class="qa" href="${target}">${inner}</a>` : `<button class="qa" data-act="${target}">${inner}</button>`;
};
function quickActions() {
  const r = role();
  if (r === 'registry') return [
    qa('upload', 'Upload Document', 'Add new document', '#/upload'),
    qa('folderPlus', 'Create File', 'Organize files', 'newFile'),
    qa('search', 'Search Documents', 'Find Documents', 'palette'),
    qa('file', 'My Documents', 'View all my files', '#/queue?tab=subs'),
    qa('inboxIn', 'Inward Register', 'Receive and register mail', '#/inward', landingDocs().length),
    qa('refresh', 'Returned Files', 'Review returned work', '#/routing?stage=returned'),
    qa('swap', 'Movement Sheets', 'Track one routing per file', '#/movements'),
    qa('send', 'Outward Register', 'Dispatch completed letters', '#/outward'),
    qa('lock', 'Access Requests', 'Read-only, with expiry', '#/access', S.access.filter(a => a.status === 'open').length),
    qa('calendar', 'Bring-up Diary', 'Files needed again', '#/bringup'),
  ];
  return [];
}
/* Live RoutingDashboard: what is waiting for this officer, and what they have finished */
const roleQueue = () => role() === 'marking' ? filesToMark() : filesToAct();
const roleDone = () => S.files.filter(f => !f.draft && (role() === 'marking' ? ['returned_marking', 'action', 'returned_action', 'filed'] : ['returned_action', 'filed']).includes(f.stage) && f.movements.some(m => m.to === meId()));
/* Home-page tile artwork (supplied SVGs); other tiles fall back to the drawn icon */
const TILE_ART = { upload: 'upload', folders: 'files', listChecks: 'tasks', swap: 'movements', send: 'outward', inboxIn: 'inward', enter: 'requested', archive: 'physical', calendar: 'bringup', filePlus: 'request', pen: 'to-act', checkCircle: 'to-act', check: 'acted' };
const tile = (icon, title, sub, target, badge) => {
  const art = TILE_ART[icon];
  const inner = `${art ? `<span class="tile-ic art"><img src="assets/tiles/${art}.svg" alt=""></span>` : `<span class="tile-ic"><i></i><span>${ic(icon)}</span></span>`}${badge ? `<span class="badge tile-badge">${badge}</span>` : ''}<b>${title}</b><span class="sub">${sub}</span>`;
  return target.startsWith('#') ? `<a class="tile" href="${target}">${inner}</a>` : `<button class="tile" data-act="${target}">${inner}</button>`;
};
function tiles() {
  const r = role();
  const notes = notesForMe().length;
  if (r === 'registry') return [
    tile('upload', 'Upload Document', 'Add a file, letter or document', '#/upload'),
    tile('folders', 'Registries and Files', 'View all registries and files', '#/files'),
    tile('listChecks', 'My Tasks', 'View all my tasks', '#/queue', myQueue().length),
    tile('swap', 'File Movement', 'Track files', '#/routing'),
    tile('send', 'Outward Register', 'Dispatch completed letters', '#/outward', S.files.flatMap(f => f.docs).filter(d => d.kind === 'response' && !S.dispatch[d.id]).length),
    tile('inboxIn', 'Inward Register', 'Receive and register mail', '#/inward', landingDocs().length),
    tile('enter', 'Files Requested', 'Letter & File Access', '#/access', S.access.filter(a => a.status === 'open').length),
    tile('archive', 'Physical Files', 'File location', '#/physical', S.handovers.filter(h => h.status === 'SENT' || h.status === 'RETURNED').length),
    tile('calendar', 'Bring Up Diary', 'Files needed again', '#/bringup', bringupsDue().length),
  ];
  const mk = r === 'marking';
  return [
    tile('send', 'Files sent to me', 'Whole files for marking or action', '#/routing'),
    tile('listChecks', 'My tasks', 'Everything assigned to you', '#/queue', myQueue().length),
    tile('folders', 'All files', 'Browse files and letters', '#/files'),
    tile('filePlus', 'Request file', 'Ask the Registry for a file', 'requestAny'),
    tile(mk ? 'pen' : 'checkCircle', mk ? 'Files awaiting my marking' : 'Files to act on', `${plural(roleQueue().length, 'file')} waiting`, '#/routing', roleQueue().length),
    tile('check', mk ? 'Files I have marked' : 'Files I have acted on', `${plural(roleDone().length, 'file')}`, '#/routing'),
  ];
}
/* Suggestions worked out from the files themselves */
function insights() {
  const r = role(), out = [];
  const add = (text, tag, cta, target) => out.push({ text, tag, cta, target });
  if (r === 'registry') {
    const ret = dashFiles().filter(f => f.stage.startsWith('returned'));
    if (ret.length) add(`${plural(ret.length, 'file')} came back and ${ret.length === 1 ? 'is' : 'are'} waiting to be routed`, 'Urgent', 'Route files', '#/routing?stage=returned');
    const due = bringupsDue(); if (due.length) add(`Bring-up due today: ${getFile(due[0].fileId).name}`, 'Today', 'Open diary', '#/bringup');
    if (landingDocs().length) add(`${plural(landingDocs().length, 'document')} in the Landing Queue need${landingDocs().length === 1 ? 's' : ''} validating`, 'Today', 'Validate', '#/queue?tab=landing');
    const acc = S.access.filter(a => a.status === 'open').length; if (acc) add(`${plural(acc, 'access request')} waiting for a decision`, 'Review', 'Review requests', '#/access');
    const req = S.requests.filter(x => x.status === 'open').length; if (req) add(`${plural(req, 'officer')} asked for a file`, 'Review', 'Send files', '#/queue?tab=approvals');
    const dr = S.files.filter(f => f.draft).length; if (dr) add(`${plural(dr, 'draft file')} not opened yet`, 'Info', 'See drafts', 'showDrafts');
  } else if (r === 'marking') {
    const tm = filesToMark(); if (tm.length) add(`${plural(tm.length, 'file')} waiting for your marking${tm.some(f => f.priority) ? ', including a priority file' : ''}`, tm.some(f => f.priority) ? 'Urgent' : 'Today', 'Mark files', '#/routing?stage=marking');
    const n = notesForMe().length; if (n) add(`${plural(n, 'sticky note')} addressed to you`, 'Review', 'Read notes', '#/queue?tab=notes');
    const due = bringupsDue(); if (due.length) add(`Bring-up due today: ${getFile(due[0].fileId).name}`, 'Today', 'Open diary', '#/bringup');
  } else {
    const ta = filesToAct(); if (ta.length) add(`${plural(ta.length, 'file')} routed to you for action${ta.some(f => f.priority) ? ', one marked priority' : ''}`, ta.some(f => f.priority) ? 'Urgent' : 'Today', 'Act on files', '#/routing?stage=action');
    const n = notesForMe().length; if (n) add(`${plural(n, 'sticky note')} addressed to you`, 'Review', 'Read notes', '#/queue?tab=notes');
    const old = ta.filter(f => daysSince(f.updated) > 5); if (old.length) add(`${old[0].name} has been with you for ${Math.floor(daysSince(old[0].updated))} days`, 'Urgent', 'Open file', `#/file/${old[0].id}`);
    const due = bringupsDue(); if (due.length) add(`Bring-up due today: ${getFile(due[0].fileId).name}`, 'Today', 'Open diary', '#/bringup');
  }
  if (!out.length) add('You are up to date. Nothing needs your attention right now.', 'Info', 'Open the guide', '#/guide');
  return out;
}
function aiCard() {
  const list = insights(), i = clamp(ui.aiIdx || 0, 0, list.length - 1), x = list[i];
  const tagTone = { Urgent: 'urgent', Today: 'today', Review: 'review', Info: 'info' }[x.tag];
  return `<section class="ai-sugg" aria-label="AI suggestions">
    <div class="ai-sugg-h">${ic('zap')}<h2>AI Suggestions</h2><span class="pill">${plural(list.length, 'insight')}</span></div>
    <p class="ai-sugg-sub">Recommendations based on your files</p>
    <div class="ai-sugg-item" aria-live="polite"><div class="t"><span>${esc(x.text)}</span><span class="tag ${tagTone}">${x.tag}</span></div>
      ${x.target.startsWith('#') ? `<a class="btn btn-white btn-sm" href="${x.target}">${x.cta} ${ic('chevR')}</a>` : `<button class="btn btn-white btn-sm" data-act="${x.target}">${x.cta} ${ic('chevR')}</button>`}</div>
    ${list.length > 1 ? `<div class="dots" role="group" aria-label="Choose suggestion">${list.map((_, k) => `<button class="${k === i ? 'on' : ''}" data-act="aiIdx" data-i="${k}" aria-label="Suggestion ${k + 1} of ${list.length}"></button>`).join('')}</div>` : ''}
  </section>`;
}
function roleFilesPanel() {
  const mk = role() === 'marking', list = roleQueue();
  return `<section class="panel glass dense"><div class="panel-h"><h2>${mk ? 'Files to mark' : 'Files to act on'}</h2><span class="n">${list.length}</span></div>
    ${list.length ? simpleTable(['File', 'Stage', 'Documents', 'Sent by', 'Since', ''], list.map(f => { const m = f.movements[f.movements.length - 1] || {}; const n = liveDocs(f).length;
      return `<tr><td>${fileLink(f)}</td><td><span class="chip t-${STAGES[f.stage].tone}">${esc(STAGES[f.stage].short)}</span></td><td>${n} of ${n}</td><td>${m.from ? esc(person(m.from).name) : '—'}</td><td data-d="${m.date || ''}">${m.date ? fmtDT(m.date) : '—'}</td><td><a class="btn btn-primary btn-xs" href="#/file/${f.id}">${ic('folder')} Open</a></td></tr>`; }), '', { key: 'rolefiles', search: 'Search files – name, reference or sender', facets: [[1, 'Stage'], [3, 'Sent by']] })
      : `<p class="muted" style="margin:0">${mk ? 'No files waiting for your marking.' : 'No files waiting for you to act on.'}</p>`}
  </section>`;
}
function viewDashboard() {
  const r = role(), p = me();
  const dept = (p.dept || regName(p.registry)).replace(/^Ministry of Health\s*[-–]\s*/i, '');
  const line = [p.title, dept, 'Ministry of Health'].filter(Boolean).map(t => `<span class="hello-part">${esc(t)}</span>`).join('<span class="sep" aria-hidden="true"></span>');
  const recent = [...dashFiles()].sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 3);
  const hero = `<div class="dash-hero">
      <div class="disc-big">${MOH_LOCKUP}</div>
      <div class="dash-hello"><h1>Hello, ${esc(p.name)}</h1><p class="hello-line">${line}</p></div>
      <div class="cover-stack" aria-hidden="true">${recent.map((f, k) => `<a href="#/file/${f.id}" tabindex="-1" class="cs cs${k}">${coverHTML(f, 6)}</a>`).reverse().join('')}</div>
    </div>`;
  const notes = myNotifs().slice(0, 3);
  return pageHead({ hero }) + `<div class="dash2">
    <aside class="dash-left">
      <section class="notif-panel card"><div class="np-h"><h2>Recent Notifications</h2><button class="link-btn" data-act="openNotifs">View all</button></div>
        ${notes.length ? notes.map(notifCard).join('') : '<p class="muted">You are all caught up.</p>'}</section>
      ${aiCard()}
    </aside>
    <div class="dash-main">
      <section class="tiles" aria-label="Quick actions">${tiles().join('')}</section>
      ${r === 'registry' ? movementsPanel() : roleFilesPanel()}
    </div>
  </div>`;
}
function movementsPanel() {
  const rows = S.files.filter(f => !f.draft).flatMap(f => f.movements.map(m => ({ f, m }))).sort((a, b) => b.m.date.localeCompare(a.m.date)).slice(0, 8);
  const st = f => STAGES[f.stage] ? `<span class="chip t-${STAGES[f.stage].tone === 'neutral' ? 'neutral' : STAGES[f.stage].tone}">${esc(STAGES[f.stage].short || STAGES[f.stage].label)}</span>` : '';
  return `<section class="panel glass mv-panel"><div class="panel-h"><div><h2>File movements</h2><p class="muted" style="margin:2px 0 0">Track each file sent to the Marking Officer and Action Officers, and whether action has been taken.</p></div>
      <div class="right"><button class="btn ${ui.showMv ? 'btn-light' : 'btn-primary'} btn-sm" data-act="toggleMv" aria-expanded="${!!ui.showMv}">${ic(ui.showMv ? 'chevD' : 'swap')} ${ui.showMv ? 'Hide movements' : 'Show movements'}</button></div></div>
    ${ui.showMv ? simpleTable(['Date', 'File', 'From', 'Sent to', 'Where it is now'], rows.map(({ f, m }) => `<tr data-href="#/file/${f.id}"><td data-d="${m.date}">${fmtDT(m.date)}</td><td>${fileLink(f)}</td><td>${esc(person(m.from).name)}</td><td>${m.to === 'registry' ? 'Registry' : esc(person(m.to).name)}</td><td>${st(f)}</td></tr>`), 'No movements yet.', { key: 'dashmv', search: 'Search movements – file, reference or officer', facets: [[2, 'From'], [3, 'Sent to'], [4, 'Where it is now']] }) + `<a class="btn btn-light btn-sm" style="margin-top:12px" href="#/movements">${ic('swap')} All file movements</a>` : ''}
  </section>`;
}
function routePanel() {
  const D = ui.dash;
  let list = dashFiles();
  const counts = { all: list.length, priority: list.filter(f => f.priority).length, amber: list.filter(isAmber).length, done: list.filter(f => f.stage === 'filed').length };
  if (D.tab === 'priority') list = list.filter(f => f.priority);
  if (D.tab === 'amber') list = list.filter(isAmber);
  if (D.tab === 'done') list = list.filter(f => f.stage === 'filed');
  if (D.stage) list = list.filter(f => f.stage === D.stage);
  const t = D.q.trim().toLowerCase();
  if (t) list = list.filter(f => (f.name + ' ' + f.ref).toLowerCase().includes(t));
  list.sort((a, b) => (D.dir === 'desc' ? -1 : 1) * lastDocDate(a).localeCompare(lastDocDate(b)));
  return `<section class="route-panel glass">
    <div class="panel-h"><h2>File movement</h2><div class="right"><a href="#/routing">View All</a></div></div>
    <div class="route-tools">
      <div class="seg">${[['all', 'All'], ['priority', 'Priority'], ['amber', 'Amber'], ['done', 'Done']].map(([k, l]) => `<button class="${D.tab === k ? 'on' : ''}" data-act="dashTab" data-k="${k}" title="${plural(counts[k], 'file')}">${l}</button>`).join('')}</div>
      <label class="input-icon">${ic('search')}<input class="input" id="dash-q" data-input="dashQ" value="${esc(D.q)}" placeholder="Search..."><span class="sr">Search files</span></label>
      <button class="filter-btn ${D.filter || D.stage ? 'on' : ''}" data-act="dashFilter" aria-label="Filter by stage">${ic('filter')}</button>
      ${D.filter ? `<select class="select select-sm" style="width:auto" data-change="dashStage" aria-label="Stage"><option value="">Every stage</option>${Object.entries(STAGES).map(([k, s]) => `<option value="${k}" ${D.stage === k ? 'selected' : ''}>${s.short}</option>`).join('')}</select>` : ''}
    </div>
    ${list.length ? `<div class="tbl-wrap plain"><table class="tbl" style="min-width:520px"><thead><tr><th>Document Title</th><th><button data-act="dashSort" class="on">Uploaded date ${ic('sortUD')}</button></th><th>Status</th></tr></thead><tbody>
      ${list.map(f => `<tr data-href="#/file/${f.id}"><td><div class="fname"><div><b>${esc(f.name)} ${f.priority ? `<span class="flag" title="Priority">${ic('flag')}</span>` : ''}</b><small>${regName(f.registry).replace(' Registry', '')} Document · ${esc(f.ref)}</small></div></div></td><td>${fmtDay(lastDocDate(f))}</td><td>${stageChip(f.stage)}</td></tr>`).join('')}
    </tbody></table></div>` : `<div class="empty">${ic('checkCircle')}<div>No files here.</div></div>`}
  </section>`;
}

/* ==========================================================================
   All Files — registries, sort, show filter, grid or list
   ========================================================================== */
function fileCard(f) {
  return `<article class="fcard" data-href="#/file/${f.id}" tabindex="0" aria-label="${esc(f.name)}">
    <div class="cover">${coverHTML(f, 3)}
      <button class="star ${f.starred ? 'on' : ''}" data-act="star" data-id="${f.id}" aria-label="Star file">${ic('star')}</button>${f.draft ? '<span class="chip t-amber draft-chip">Draft</span>' : ''}
      <button class="menu" data-act="fileMenu" data-id="${f.id}" aria-label="File options">${ic('moreH')}</button>
    </div>
    <div class="body">
      <div class="when">${ago(f.updated)} · ${f.draft ? 'Draft – not opened yet' : STAGES[f.stage].short}</div>
      <h3 title="${esc(f.name)}">${esc(f.name)}</h3>
      <div class="ref">${esc(f.ref || 'No reference yet')} · Vol. ${esc(f.vol)}</div>
      <div class="foot"><span class="muted">${regName(f.registry)}${f.visibility && f.visibility !== 'organization' ? ` · ${VIS_LABEL[f.visibility]}` : ''}</span>
        <span class="docs">${ic('file')} ${plural(liveDocs(f).length, 'folio')} · ${fmtSize(fileSizeKB(f))}</span></div>
    </div>
  </article>`;
}
const COLS = [
  ['title', 'Title', f => f.name.toLowerCase()], ['ref', 'Reference', f => f.ref], ['folio', 'Folio', f => liveDocs(f).length],
  ['type', 'Type', f => f.type], ['created', 'Created by', f => person(f.createdBy).name], ['status', 'Status', f => STAGE_ORDER.indexOf(f.stage)],
  ['conf', 'Confidentiality', f => ['Public', 'Internal', 'Confidential', 'Secret'].indexOf(f.confidentiality)], ['modified', 'Modified', f => f.updated],
];
function sortFiles(list) {
  const s = ui.files.sort;
  const cmp = (a, b) => a < b ? -1 : a > b ? 1 : 0;
  if (s === 'recent') return list.sort((a, b) => cmp(b.updated, a.updated));
  if (s === 'oldest') return list.sort((a, b) => cmp(a.updated, b.updated));
  if (s === 'size_desc') return list.sort((a, b) => fileSizeKB(b) - fileSizeKB(a));
  if (s === 'size_asc') return list.sort((a, b) => fileSizeKB(a) - fileSizeKB(b));
  if (s === 'name') return list.sort((a, b) => a.name.localeCompare(b.name));
  const [, key, dir] = s.split(':'); const col = COLS.find(c => c[0] === key);
  return col ? list.sort((a, b) => (dir === 'desc' ? -1 : 1) * cmp(col[2](a), col[2](b))) : list;
}
function filesTable(files) {
  const [, key, dir] = ui.files.sort.split(':');
  return tfWrap({ key: 'files', search: false, date: [7, 'Modified from', 'Modified to'], facets: [[3, 'Type'], [4, 'Created by'], [5, 'Status'], [6, 'Confidentiality']] }, `<div class="tbl-wrap"><table class="tbl wide"><thead><tr>${COLS.map(([k, l]) => `<th><button data-act="colSort" data-k="${k}" class="${key === k ? 'on' : ''}" aria-label="Sort by ${l}">${l} ${ic(key === k ? (dir === 'desc' ? 'chevD' : 'arrowUp') : 'sortUD')}</button></th>`).join('')}</tr></thead><tbody>
    ${files.map(f => `<tr data-href="#/file/${f.id}">
      <td><div class="fname"><span class="thumb-cover">${coverHTML(f, 2)}</span><div><b>${esc(f.name)}</b><small>${regName(f.registry)}</small></div></div></td>
      <td class="mono" style="font-size:12.5px">${esc(f.ref)}</td>
      <td>${liveDocs(f).length ? `${liveDocs(f).length} <small class="sub">latest F.${esc([...liveDocs(f)].sort(byFolio).pop().folio)}</small>` : '0'}</td>
      <td>${f.type === 'ty' ? '<span class="chip t-amber">Temporary (TY)</span>' : 'Ordinary'}</td>
      <td>${esc(person(f.createdBy).name)}</td>
      <td>${f.draft ? '<span class="chip t-amber">Draft</span>' : stageChip(f.stage)}</td>
      <td><span class="chip ${confTone(f.confidentiality)}">${esc(f.confidentiality)}</span></td>
      <td data-d="${f.updated}">${fmtDay(f.updated)}<small class="sub">${ago(f.updated)}</small></td>
    </tr>`).join('')}
  </tbody></table></div>`);
}
function viewFiles(q) {
  const F = ui.files;
  if (q.r) { F.reg = q.r; history.replaceState(null, '', encodeRoute('#/files')); }
  const term = F.q.trim().toLowerCase();
  let files = S.files.filter(f => canSee(f) && (F.reg === 'all' || f.registry === F.reg) && (F.show === 'drafts' ? f.draft : !f.draft));
  if (F.show === 'starred') files = files.filter(f => f.starred);
  if (F.show === 'ty') files = files.filter(f => f.type === 'ty');
  if (term) files = files.filter(f => [f.name, f.ref, f.description, regName(f.registry), f.cover.dept].join(' ').toLowerCase().includes(term));
  sortFiles(files);
  const letters = term ? S.files.flatMap(f => f.docs.filter(d => [d.title, d.from, d.folio, d.edms, d.subject || ''].join(' ').toLowerCase().includes(term)).map(d => ({ f, d }))) : [];
  const total = S.files.reduce((a, f) => a + liveDocs(f).length, 0);
  const nFiles = S.files.filter(f => !f.draft).length;
  const regs = REGISTRIES.map(r => ({ ...r, files: S.files.filter(f => f.registry === r.id && !f.draft) })).filter(r => F.reg === 'all' || r.id === F.reg).filter(r => !term || r.name.toLowerCase().includes(term) || r.files.some(f => files.includes(f)));
  const showRegs = ['all', 'registries'].includes(F.show), showFiles = F.show !== 'registries';
  const isReg = role() === 'registry';
  const regsGrid = `<div class="folders">${regs.map(r => `<button class="folder tint-${r.tint} ${F.reg === r.id ? 'on' : ''}" data-act="pickReg" data-id="${r.id}">
      <span class="fmenu">${ic('more')}</span><h3>${esc(r.name)}</h3>
      <div class="meta"><span>${plural(r.files.length, 'file')}</span></div>
    </button>`).join('')}</div>`;
  const regsList = tfWrap({ key: 'regs', search: 'Find a registry', facets: [[3, 'Registry officer']] }, `<div class="tbl-wrap" style="margin-bottom:28px"><table class="tbl"><thead><tr><th>Registry</th><th>Files</th><th>Folios</th><th>Registry officer</th><th>Last activity</th></tr></thead><tbody>
    ${regs.map(r => `<tr data-act="pickReg" data-id="${r.id}" style="cursor:pointer;${F.reg === r.id ? 'background:var(--blue-100)' : ''}"><td><div class="fname"><span class="mh-ic" style="width:36px;height:36px;border-radius:10px">${ic('building')}</span><b>${esc(r.name)}</b></div></td><td>${r.files.length}</td><td>${r.files.reduce((a, f) => a + liveDocs(f).length, 0)}</td><td>${esc(person(r.officer).name)}</td><td>${r.files.length ? ago(r.files.map(f => f.updated).sort().pop()) : '—'}</td></tr>`).join('')}
  </tbody></table></div>`);
  return pageHead({
    crumbs: [['Registries & Files']], title: F.show === 'drafts' ? 'Draft files' : 'Registries & Files', sub: `${plural(nFiles, 'File')} · ${plural(total, 'Document')} · ${REGISTRIES.length} Registries`,
    right: `<a class="btn btn-glass" style="color:#fff" href="#/queue?tab=landing">${ic('inbox')} Landing Queue</a>${true ? `<a class="btn btn-white" href="#/upload">${ic('upload')} Upload</a><button class="btn btn-primary" data-act="newFile">${ic('folderPlus')} New File</button>` : ''}`,
  }) + `
    <div class="files-toolbar glass">
      <label class="input-icon">${ic('search')}<input class="input" id="files-q" value="${esc(F.q)}" placeholder="Search any letter or file in all registries - subject, reference, folio, sender…" data-input="filesQuery"><span class="sr">Search files</span></label>
      <label class="lbl-select">${ic('sortUD')} Sort<select data-change="filesSort" aria-label="Sort files">${[['recent', 'Most recent'], ['oldest', 'Oldest'], ['size_desc', 'Size – largest'], ['size_asc', 'Size – smallest'], ['name', 'Name A–Z']].map(([k, l]) => `<option value="${k}" ${F.sort === k ? 'selected' : ''}>${l}</option>`).join('')}${F.sort.startsWith('col:') ? `<option selected value="${F.sort}">Column: ${COLS.find(c => c[0] === F.sort.split(':')[1])[1]}</option>` : ''}</select></label>
      <label class="lbl-select">${ic('filter')} Show<select data-change="filesShow" aria-label="Show">${[['all', 'Files & registries'], ['files', 'Files only'], ['registries', 'Registries only'], ['starred', 'Starred files'], ['ty', 'Temporary (TY) files'], ['drafts', `Draft files (${S.files.filter(f => f.draft).length})`]].map(([k, l]) => `<option value="${k}" ${F.show === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label class="lbl-select">${ic('building')}<select data-change="filesReg" aria-label="Registry"><option value="all">All registries</option>${REGISTRIES.map(r => `<option value="${r.id}" ${F.reg === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}</select></label>
      <div class="seg icons" role="group" aria-label="View">${[['grid', 'gridView', 'Grid view'], ['list', 'list', 'List view']].map(([k, i, l]) => `<button class="${F.view === k ? 'on' : ''}" data-act="filesView" data-k="${k}" aria-label="${l}" title="${l}">${ic(i)}</button>`).join('')}</div>
    </div>
    ${showRegs ? `<div class="section-h"><h2>Registries</h2><span class="n">${regs.length}</span>${F.reg !== 'all' ? `<div class="right"><button class="btn btn-glass btn-sm" data-act="pickReg" data-id="all">${ic('folders')} View all registries</button></div>` : ''}</div>${F.view === 'grid' ? regsGrid : regsList}` : ''}
    ${letters.length && showFiles ? `<div class="section-h"><h2>Letters</h2><span class="n">${letters.length}</span></div>
      <div class="results" style="margin-bottom:28px">${letters.slice(0, 10).map(({ f, d }) => `<a class="result card" href="#/file/${f.id}/doc/${d.id}"><span class="pg">${ic('file')}</span><div><b>${esc(d.title)}</b><small>Folio ${esc(d.folio)} · ${esc(d.from)} · in <b style="display:inline">${esc(f.name)}</b></small></div><small class="mono" style="margin-left:auto">${esc(d.edms)}</small></a>`).join('')}</div>` : ''}
    ${showFiles ? `<div class="section-h"><h2>${F.show === 'drafts' ? 'Draft files' : F.reg === 'all' ? 'Files' : esc(regName(F.reg))}</h2><span class="n">${files.length}</span>
      ${F.reg !== 'all' && !showRegs ? `<div class="right"><button class="btn btn-glass btn-sm" data-act="pickReg" data-id="all">${ic('x')} All registries</button></div>` : ''}</div>
      ${files.length ? (F.view === 'grid' ? `<div class="fgrid">${files.map(fileCard).join('')}</div>` : filesTable(files)) : `<div class="card empty">${F.show === 'drafts' ? 'No draft files. Use <b>Save as draft</b> in New File to keep one for later.' : 'No files match.'}</div>`}` : ''}`;
}

/* ==========================================================================
   File overview — cover first, then every folio, one long scroll
   ========================================================================== */
function actionButtons(f) {
  const r = role(), b = [];
  if (f.draft) return r === 'registry' ? `<button class="btn btn-primary" data-act="openDraft" data-id="${f.id}">${ic('folder')} Open file</button><button class="btn btn-glass" data-act="fileTab" data-k="cover">${ic('pen')} Edit cover</button><button class="btn btn-danger-soft" data-act="deleteDraft" data-id="${f.id}">${ic('trash')} Delete draft</button>` : '';
  if (r === 'registry') {
    if (f.stage === 'registry') b.push(`<button class="btn btn-primary" data-act="sendFile" data-id="${f.id}" data-to="marking">${ic('send')} Send to Marking Officer</button>`);
    if (f.stage === 'returned_marking') b.push(`<button class="btn btn-primary" data-act="sendFile" data-id="${f.id}" data-to="action">${ic('send')} Send to Action Officer</button>`, `<button class="btn btn-glass" data-act="sendFile" data-id="${f.id}" data-to="marking">${ic('undo')} Back to Marking Officer</button>`);
    if (f.stage === 'returned_action') b.push(`<button class="btn btn-primary" data-act="fileAway" data-id="${f.id}">${ic('archive')} File away</button>`, `<button class="btn btn-glass" data-act="sendFile" data-id="${f.id}" data-to="marking">${ic('send')} Send to Marking Officer</button>`);
    if (f.stage === 'filed') b.push(`<button class="btn btn-glass" data-act="retrieve" data-id="${f.id}">${ic('refresh')} Retrieve from shelf</button>`);
    b.push(`<a class="btn btn-glass" href="#/upload?file=${f.id}">${ic('upload')} Add document</a>`, `<button class="btn btn-glass" data-act="addBringup" data-id="${f.id}">${ic('calendar')} Bring up</button>`);
    if (liveDocs(f).length) b.push(`<button class="btn btn-glass" data-act="sendOutside" data-id="${f.id}" title="Send letters outside the organisation. Recorded in the Outward Mail Register.">${ic('send')} Send outside</button>`);
  }
  if (r !== 'registry' && f.stage !== 'filed') b.push(`<a class="btn btn-glass" href="#/upload?file=${f.id}">${ic('upload')} Add document</a>`);
  if (r === 'marking' && f.stage === 'marking' && f.withUser === 'vera') b.push(`<button class="btn btn-primary" data-act="markFile" data-id="${f.id}" title="Record what should be done and to whom. The file goes back to the Registry.">${ic('pen')} Mark file</button>`);
  if (r === 'action' && f.stage === 'action' && f.withUser === meId()) b.push(
    `<button class="btn btn-primary" data-act="respond" data-id="${f.id}" title="Answer with a letter, memo or other document - write a new one or upload one.">${ic('reply')} Responses</button>`,
    `<button class="btn btn-glass" data-act="requestFiles" data-id="${f.id}" title="Ask the Registry for more files you need in order to take action.">${ic('filePlus')} Request files</button>`,
    `<button class="btn btn-glass" data-act="delegate" data-id="${f.id}" title="Hand the letter to someone else to act on. They send it back to the Registry when done.">${ic('users')} Delegate</button>`,
    `<button class="btn btn-dark" data-act="done" data-id="${f.id}" title="Use this last, when the work is finished. It goes back to the Registry with what you wrote.">${ic('undo')} Done – return to Registry</button>`);
  if (!f.draft && f.movements.length) b.push(`<a class="btn btn-glass" href="#/grid/${f.id}" title="What was marked on this file, step by step">${ic('list')} File grid</a>`);
  return b.join('');
}
function folioBar(f, d) {
  const can = canAnnotate(f) && d.status !== 'landing';
  const canAct = role() === 'action' && f.stage === 'action' && f.withUser === meId() && d.kind !== 'response';
  return `<div class="folio-bar glass"><span class="fn">${esc(d.folio)}</span><b title="${esc(d.title)}">${esc(d.title)}</b><span class="chip ${KIND[d.kind][1]}">${KIND[d.kind][0]}</span><span class="muted" style="font-size:13px">${fmtDay(d.date)}</span>
    <div class="tools">
      <a class="btn btn-light btn-xs" href="#/file/${f.id}/letter/${d.id}">${ic('info')} View letter details</a>
      ${can ? `<button class="btn btn-white btn-xs" data-act="addComment" data-f="${f.id}" data-d="${d.id}">${ic('pen')} Add comment</button><button class="btn btn-white btn-xs" data-act="addSticky" data-f="${f.id}" data-d="${d.id}">${ic('sticky')} Sticky note</button><button class="btn btn-light btn-xs" data-act="sign" data-f="${f.id}" data-d="${d.id}">${ic('stamp')} ${d.signed ? 'Unstamp' : 'Sign / stamp'}</button>` : ''}
      ${canAct ? `<button class="btn btn-primary btn-xs" data-act="respond" data-id="${f.id}" data-folio="${esc(d.folio)}">${ic('reply')} Respond</button>` : ''}
      ${d.status === 'landing' && role() === 'registry' ? `<button class="btn btn-primary btn-xs" data-act="validate" data-file="${f.id}" data-doc="${d.id}">${ic('check')} Validate</button>` : ''}
    </div></div>`;
}
function pageHTML(f, d) {
  return `<article class="page ${d.kind === 'attachment' ? 'attachment' : ''}" data-f="${f.id}" data-d="${d.id}">
    <div class="folio-box"><b>Folio ${esc(d.folio)}</b>${d.ref17 ? 'Ref: Folio 17' : esc(d.edms)}</div>
    <div class="content">${docContent(f, d)}</div>
    <div class="anno" id="anno-${d.id}">${annoHTML(f, d)}</div>
    ${d.status === 'landing' ? `<div class="landing-veil"><div><span class="chip t-violet" style="font-size:14px;height:32px">In the Landing Queue</span><p class="muted">Awaiting OCR and validation by the Registry.</p></div></div>` : ''}
  </article>`;
}
function viewFile(f, q, target) {
  if (ui.curFile !== f.id) { ui.curFile = f.id; ui.tf['folios-' + f.id] = { fac: {} }; ui.fileView = 'table'; }
  if (target) ui.fileView = 'pages';
  const pagesView = ui.fileView === 'pages';
  if (q.tab) ui.fileTab = q.tab;
  const docs = [...f.docs].filter(d => !(role() === 'marking' && f.stage === 'marking' && (f.keptBack || []).includes(d.id))).sort(byFolio).reverse();
  const meta = `${stageChip(f.stage)}<span class="chip ghost">${ic('building')} ${regName(f.registry)}</span><span class="chip ghost">${ic('lock')} ${esc(f.confidentiality)}</span>${f.type === 'ty' ? '<span class="chip t-amber">Temporary (TY)</span>' : ''}${f.priority ? `<span class="chip t-red">${ic('flag')} Priority</span>` : ''}`;
  const who = f.withUser === 'registry' ? '<span class="muted">In the Registry</span>' : `${avatar(f.withUser)}<span>With <b>${esc(person(f.withUser).name)}</b></span>`;
  const acts = actionButtons(f);
  return pageHead({ crumbs: [['Registries & Files', '#/files'], [f.name]], back: ['Back to Registries & Files', '#/files'], title: esc(f.name), sub: `<span class="mono">${esc(f.ref)} · Vol. ${esc(f.vol)}</span>`, meta }) + `
    <div class="action-bar glass">${acts || `<span style="padding-left:8px;color:var(--ink-2)">You can read this file. ${f.stage === 'filed' ? 'It has been filed away.' : 'Actions appear when the file is with you.'}</span>`}<div class="who">${pagesView ? `<button class="btn btn-light btn-sm" data-act="toggleNotes" aria-pressed="${ui.hideNotes}">${ic('eye')} ${ui.hideNotes ? 'Show notes' : 'Hide notes'}</button>` : ''}${who}</div></div>
    ${f.draft ? `<div class="instruction">${ic('fileEdit')}<div><b>This file is a draft.</b> Finish the cover and details, then press <b>Open file</b> to start using it. Draft files are only listed under <b>Show → Draft files</b>.</div></div>` : ''}
    ${f.instruction && ['returned_marking', 'action'].includes(f.stage) ? `<div class="instruction">${ic('sticky')}<div><b>Marking instruction</b> – ${esc(f.instruction)}${f.markedTo ? ` <span class="muted">(marked to ${esc(person(f.markedTo).name)})</span>` : ''}</div></div>` : ''}
    <section class="panel glass folio-panel" aria-labelledby="ft-h">
      <div class="panel-h"><h2 id="ft-h">Folios</h2><span class="n">${docs.length}</span>
        <div class="seg icons" role="group" aria-label="How to view the folios">${[['table', 'list', 'Folio table'], ['pages', 'scrollDown', 'Scroll through the pages']].map(([k, i, l]) => `<button class="${ui.fileView === k ? 'on' : ''}" data-act="fileView" data-k="${k}" aria-pressed="${ui.fileView === k}" aria-label="${l}" title="${l}">${ic(i)}</button>`).join('')}</div>
</div>
      ${pagesView ? '' : `<div id="folio-tbl">${folioTable(f, docs)}</div>`}
    </section>
    ${pagesView ? `<div class="fview">
      <div class="pages ${ui.hideNotes ? 'hide-notes' : ''}">
        <div class="pg-wrap" id="pg-cover">
          <div class="folio-bar glass"><span class="fn">Cover</span><b>${esc(f.name)}</b><span class="muted" style="font-size:13px">${plural(f.docs.length, 'folio')} · movement sheet</span>
            <div class="tools">${role() === 'registry' ? `<button class="btn btn-white btn-xs" data-act="fileTab" data-k="cover">${ic('pen')} Edit cover</button>` : ''}<button class="btn btn-light btn-xs" data-act="print">${ic('printer')} Print</button></div></div>
          ${coverHTML(f)}
        </div>
        ${docs.map(d => `<div class="pg-wrap" id="pg-${d.id}">${folioBar(f, d)}${pageHTML(f, d)}</div>`).join('') || `<div class="card empty">${ic('file')}<p>No folios yet. <a href="#/upload?file=${f.id}">Upload the first document</a>.</p></div>`}
      </div>
      <aside class="side-panel glass" id="side">${sidePanel(f)}</aside>
    </div>` : ''}`;
}
/* Folio table: the first thing on an open file. A row opens that folio in the pages below. */
const curLetter = () => { const { parts } = parseHash(); const f = getFile(parts[1]); return { f, d: getDoc(f, parts[3]) }; };
function folioTable(f, docs) {
  const by = d => d.uploadedBy ? person(d.uploadedBy).name : d.from;
  const st = d => d.status === 'landing' ? ['Landing', 't-violet'] : d.signed ? ['Signed', 't-teal'] : d.kind === 'response' && S.dispatch[d.id] ? ['Sent', 't-blue'] : ['Filed', 't-green'];
  const conf = d => d.confidentiality || f.confidentiality || 'Internal';
  const list = docs;
  if (!list.length) return `<div class="tbl-wrap"><div class="empty">${ic('file')}<div>No folios yet.</div></div></div>`;
  return tfWrap({ key: 'folios-' + f.id, search: 'Search folios – title, reference, folio, type or officer…', date: [8, 'Modified from', 'Modified to'], facets: [[3, 'Type'], [4, 'Created by'], [5, 'Status'], [6, 'Confidentiality']] }, `<div class="tbl-wrap"><table class="tbl folio-tbl"><thead><tr><th>Title</th><th>Reference</th><th>Folio</th><th>Type</th><th>Created by</th><th>Status</th><th>Confidentiality</th><th><abbr title="Version">v</abbr></th><th>Modified</th></tr></thead><tbody>
    ${list.map(d => { const [sl, sc] = st(d); return `<tr data-href="#/file/${f.id}/letter/${d.id}" data-pg="${d.id}" tabindex="0" title="Open folio ${esc(d.folio)}"><td><b>${esc(d.title)}</b></td><td class="mono">${esc(d.senderRef || d.edms)}</td><td class="mono">${esc(d.folio)}</td><td><span class="chip ${KIND[d.kind][1]}">${KIND[d.kind][0]}</span></td><td>${esc(by(d))}</td><td><span class="chip ${sc}">${sl}</span></td><td>${ic('lock')} ${esc(conf(d))}</td><td class="mono">${d.version || 1}</td><td data-d="${d.modified || d.date}">${fmtDT(d.modified || d.date)}</td></tr>`; }).join('')}</tbody></table></div>`);
}
/* Letter details: Overview · Metadata · Versions · Cross-references, with comments on the side */
const LT_TABS = [['overview', 'Overview', 'grid'], ['metadata', 'Metadata', 'fileEdit'], ['versions', 'Versions', 'layers'], ['xrefs', 'Cross-References', 'swap']];
const docStatus = d => d.status === 'landing' ? ['Landing', 't-violet'] : d.signed ? ['Signed', 't-teal'] : d.kind === 'response' && S.dispatch[d.id] ? ['Sent', 't-blue'] : ['Filed', 't-green'];
const docBy = d => d.uploadedBy ? person(d.uploadedBy).name : d.from;
const docVersions = d => d.versions || (d.versions = [{ v: 1, name: d.title.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase() + '.pdf', sizeKB: d.sizeKB, by: docBy(d), at: d.date, tier: 'Hot — Immediate', scan: 'Clean' }]);
function viewLetter(f, d) {
  const tab = LT_TABS.some(t => t[0] === ui.letterTab) ? ui.letterTab : 'overview';
  const [sl, sc] = docStatus(d), conf = d.confidentiality || f.confidentiality || 'Internal', reg = role() === 'registry';
  const meta = `<span class="chip ${sc}">${sl}</span><span class="chip ghost">${ic('lock')} ${esc(conf)}</span><span class="chip ghost">${KIND[d.kind][0]}</span><span class="chip ghost mono">${esc(d.edms)}</span>`;
  let body = '';
  if (tab === 'overview') body = `<dl class="lt-facts">
      <div><dt>Created by</dt><dd>${esc(docBy(d))}</dd></div><div><dt>Type</dt><dd>${KIND[d.kind][0]}</dd></div><div><dt>Created</dt><dd>${fmtDT(d.date)}</dd></div>
      <div><dt>Folio</dt><dd>${esc(d.folio)}</dd></div><div><dt>Expiry date</dt><dd>${d.expiry ? fmtDay(d.expiry) : 'None'}</dd></div>
      <div><dt>File</dt><dd><a class="chip t-amber" href="#/file/${f.id}">${ic('folder')} ${esc(f.name)}</a></dd></div>
      <div class="wide"><dt>Tags</dt><dd><div class="x-chips">${(d.tags || []).map((t, i) => `<span class="x-chip">${esc(t)}<button data-act="rmTag" data-i="${i}" aria-label="Remove tag ${esc(t)}">${ic('x')}</button></span>`).join('') || '<span class="muted">No tags</span>'}</div>
        <input class="input input-sm" id="lt-tag" placeholder="Add a tag and press Enter" aria-label="Add a tag" autocomplete="off"></dd></div></dl>
    <div class="lt-preview"><div class="lt-preview-h"><button class="btn btn-light btn-xs" data-act="print">${ic('printer')} Print</button><a class="btn btn-light btn-xs" href="#/file/${f.id}/doc/${d.id}">${ic('scrollDown')} Read in the file</a></div>${pageHTML(f, d)}</div>`;
  if (tab === 'metadata') { const dis = reg ? '' : 'disabled';
    body = `<p class="hint" style="margin-top:0">${reg ? 'The details captured when the letter was registered. Change them and save.' : 'The details captured by the Registry when the letter was registered.'}</p>
    <div class="lt-form">
      <div class="field"><label for="lm-from">From who</label><input class="input" id="lm-from" value="${esc(d.from || '')}" ${dis}></div>
      <div class="field"><label for="lm-ref">Reference number</label><input class="input mono" id="lm-ref" value="${esc(d.senderRef || '')}" placeholder="e.g. NYS/ADM/12/4" ${dis}></div>
      <div class="field"><label for="lm-rdate">Reference date</label><input class="input" type="date" id="lm-rdate" value="${esc((d.senderRefDate || '').slice(0, 10))}" ${dis}></div>
      <div class="field"><label for="lm-subj">Subject</label><input class="input" id="lm-subj" value="${esc(d.subject || d.title)}" ${dis}></div>
      <div class="field"><label for="lm-recv">Date received</label><input class="input" type="date" id="lm-recv" value="${esc((d.received || d.date || '').slice(0, 10))}" ${dis}></div>
      <div class="field"><label for="lm-conf">Confidentiality</label><select class="select" id="lm-conf" ${dis}>${['Public', 'Internal', 'Confidential', 'Secret'].map(c => `<option ${conf === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
    </div>${reg ? `<button class="btn btn-primary" data-act="saveLetterMeta">${ic('check')} Save metadata</button>` : ''}`; }
  if (tab === 'versions') body = `${reg ? `<button class="btn btn-primary btn-sm" data-act="newVersion" style="margin-bottom:14px">${ic('upload')} Upload new version</button>` : ''}
    ${tfWrap({ key: 'versions', search: 'Search versions – file name or officer', date: [5, 'Uploaded from', 'Uploaded to'], facets: [[3, 'Tier'], [4, 'Uploaded by'], [6, 'Scan']] }, `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Version</th><th>File name</th><th>Size</th><th>Tier</th><th>Uploaded by</th><th>Uploaded</th><th>Scan</th><th></th></tr></thead><tbody>
    ${[...docVersions(d)].reverse().map((v, i) => `<tr><td><span class="chip t-neutral mono">v${v.v}</span>${i === 0 ? ' <span class="chip t-blue">Current</span>' : ''}</td><td>${ic('file')} ${esc(v.name)}</td><td>${fmtSize(v.sizeKB)}</td><td><span class="chip t-teal">${esc(v.tier)}</span></td><td>${esc(v.by)}</td><td data-d="${v.at}">${ago(v.at)}</td><td><span class="chip ${v.scan === 'Clean' ? 't-green' : 't-neutral'}">${esc(v.scan)}</span></td><td><button class="btn btn-light btn-icon btn-xs" data-act="toastMsg" data-msg="This is a mockup, so nothing downloads." aria-label="Download v${v.v}">${ic('download')}</button></td></tr>`).join('')}</tbody></table></div>`)}`;
  if (tab === 'xrefs') { const refs = (d.crossRefs || []).map(docById).filter(Boolean), by = S.files.flatMap(ff => ff.docs.filter(x => (x.crossRefs || []).includes(d.id)).map(x => ({ f: ff, d: x })));
    const link = r => `<a class="result card" href="#/file/${r.f.id}/letter/${r.d.id}"><span class="pg">${ic('file')}</span><div><b>${esc(r.d.title)}</b><small>Folio ${esc(r.d.folio)} in ${esc(r.f.name)} · ${esc(r.d.edms)}</small></div></a>`;
    const pool = S.files.flatMap(ff => ff.docs.filter(x => x.id !== d.id && !(d.crossRefs || []).includes(x.id)).map(x => ({ ff, x })));
    body = `<h3 class="lt-h">This letter refers to</h3>${refs.length ? `<div class="results">${refs.map(link).join('')}</div>` : '<p class="muted">No cross-references.</p>'}
    <h3 class="lt-h">Referred to by</h3>${by.length ? `<div class="results">${by.map(link).join('')}</div>` : '<p class="muted">No other letter refers to this one.</p>'}
    ${reg ? `<div class="lt-add"><div class="field" style="flex:1"><label for="lx-doc">Add a cross-reference</label><select class="select" id="lx-doc"><option value="">Choose a letter…</option>${pool.map(({ ff, x }) => `<option value="${x.id}">${esc(ff.name)} · F.${esc(x.folio)} – ${esc(x.title)}</option>`).join('')}</select></div><button class="btn btn-primary" data-act="addXrefDoc">${ic('plus')} Add</button></div>` : ''}
    <h3 class="lt-h">Physical enclosures</h3><p class="hint" style="margin:0 0 8px">Items that came with this letter but are kept on paper.</p>
    ${(d.enclosures || []).length ? `<ul class="lt-list">${d.enclosures.map(e => `<li><b>${esc(e.description)}</b>${e.quantity ? ` · ${esc(e.quantity)}` : ''}${e.kept_at ? ` · kept at ${esc(e.kept_at)}` : ''}</li>`).join('')}</ul>` : '<p class="muted">None recorded.</p>'}
    ${reg ? `<div class="lt-add"><input class="input" id="lx-enc" placeholder="Title and number of copies, e.g. Annual Report – 3 copies" aria-label="Physical enclosure"><button class="btn btn-primary" data-act="addEncDoc">${ic('plus')} Add</button></div>` : ''}
    <h3 class="lt-h">Books and legal documents referenced</h3><p class="hint" style="margin:0 0 8px">A book, legal document or other source too big to scan. Give its subject and author, or a link to it.</p>
    ${(d.books || []).length ? `<ul class="lt-list">${d.books.map(b => `<li><b>${esc(b.title)}</b>${b.author ? ` · ${esc(b.author)}` : ''}${b.url ? ` · <a href="${esc(b.url)}" target="_blank" rel="noopener">link</a>` : ''}</li>`).join('')}</ul>` : '<p class="muted">None referenced.</p>'}
    ${reg ? `<div class="lt-add"><input class="input" id="lx-bt" placeholder="Subject / title" aria-label="Book subject or title"><input class="input" id="lx-ba" placeholder="Author" aria-label="Author"><input class="input" id="lx-bu" placeholder="Link (https://…) – optional" aria-label="Link"><button class="btn btn-primary" data-act="addBookDoc">${ic('plus')} Add</button></div>` : ''}`; }
  const minutes = d.minutes.filter(m => m.n), sticks = d.stickies.filter(seesSticky), comments = d.comments || [];
  const side = `<div class="np-h"><h2>${ic('chat')} Comments</h2><span class="n">${minutes.length + sticks.length + comments.length}</span></div>
    ${minutes.map(m => `<div class="note-item" style="cursor:default"><span class="n">${m.n}.</span>${esc(m.text)}<div class="by">${avatar(m.by)} ${esc(person(m.by).name)} · ${fmtDT(m.at)} · minute</div></div>`).join('')}
    ${sticks.map(s => `<div class="note-item sticky" style="--sn:${stickyCol(s.color)};cursor:default">${ic('sticky')} ${esc(s.text)}<div class="by">${avatar(s.by)} ${esc(person(s.by).name)} → ${esc(person(s.to).name)}</div></div>`).join('')}
    ${comments.map(c => `<div class="note-item" style="cursor:default">${esc(c.text)}<div class="by">${avatar(c.by)} ${esc(person(c.by).name)} · ${ago(c.at)}</div></div>`).join('')}
    ${minutes.length + sticks.length + comments.length ? '' : '<p class="muted" style="margin:0 0 12px">No comments yet.</p>'}
    <div class="field" style="margin-top:12px"><label for="lt-cm">Add a comment</label><textarea class="textarea" id="lt-cm" rows="3" placeholder="Write a comment…"></textarea></div>
    <button class="btn btn-primary btn-sm" data-act="postLetterComment" style="margin-top:10px">${ic('send')} Post comment</button>
    ${canAnnotate(f) && d.status !== 'landing' ? `<p class="hint">To write an official minute on the page, use <a href="#/file/${f.id}/doc/${d.id}">Read in the file</a>.</p>` : ''}`;
  return pageHead({ crumbs: [['Registries & Files', '#/files'], [f.name, `#/file/${f.id}`], [`Folio ${d.folio}`]], back: [`Back to ${f.name}`, `#/file/${f.id}`], title: `${esc(d.title)} <button class="star ${d.starred ? 'on' : ''}" data-act="starDoc" aria-label="Star letter" aria-pressed="${!!d.starred}">${ic('star')}</button>`, sub: `${KIND[d.kind][0]} · Folio ${esc(d.folio)} in ${esc(f.name)}`, meta }) + `
    <div class="queue-switch seg solid lt-tabs" role="tablist" aria-label="Letter details">${LT_TABS.map(([k, l, i]) => `<button role="tab" aria-selected="${tab === k}" class="${tab === k ? 'on' : ''}" data-act="letterTab" data-k="${k}">${ic(i)} ${l}</button>`).join('')}</div>
    <div class="lt-grid"><section class="panel glass lt-main">${body}</section><aside class="panel glass lt-side" aria-label="Comments">${side}</aside></div>`;
}
function sidePanel(f) {
  const tab = ui.fileTab === 'cover' && role() !== 'registry' ? 'folios' : ui.fileTab;
  const visibleStickies = f.docs.flatMap(d => d.stickies.filter(seesSticky).map(s => ({ s, d })));
  const minutes = [...f.docs].sort(byFolio).flatMap(d => d.minutes.filter(m => m.n).sort((a, b) => fromRoman(a.n) - fromRoman(b.n)).map(m => ({ m, d })));
  const tabs = [['folios', 'Folios'], ['notes', `Notes ${minutes.length + visibleStickies.length}`], ['movement', 'Movement'], ...(role() === 'registry' ? [['cover', 'Cover']] : []), ['details', 'Details']];
  let body = '';
  if (tab === 'folios') {
    body = `<div class="folio-list">
      <a href="#" data-act="goPage" data-pg="cover" class="on"><span class="mini-cv">${coverHTML(f, 2)}</span><span>Cover<small>Subject and movement sheet</small></span></a>
      ${[...f.docs].sort(byFolio).reverse().map(d => { const ns = d.stickies.filter(seesSticky).length; return `<a href="#" data-act="goPage" data-pg="${d.id}"><span class="fn">${esc(d.folio)}</span><span>${esc(d.title)}<small>${KIND[d.kind][0]}${d.minutes.length ? ` · ${plural(d.minutes.length, 'comment')}` : ''}${ns ? ` · ${plural(ns, 'note')}` : ''}${d.status === 'landing' ? ' · landing' : ''}</small></span></a>`; }).join('')}
    </div>`;
  } else if (tab === 'notes') {
    body = (minutes.map(({ m, d }) => `<div class="note-item" data-act="goPage" data-pg="${d.id}"><span class="n">${m.n}.</span>${esc(m.text)}<div class="by">${avatar(m.by)} ${esc(person(m.by).name)} · ${fmtDT(m.at)} · F.${esc(d.folio)}</div></div>`).join('') +
      visibleStickies.map(({ s, d }) => `<div class="note-item sticky" style="--sn:${stickyCol(s.color)}" data-act="goPage" data-pg="${d.id}">${ic('sticky')} ${esc(s.text)}<div class="by">${avatar(s.by)} ${esc(person(s.by).name)} → ${esc(person(s.to).name)} · F.${esc(d.folio)}</div></div>`).join('')) || '<p class="muted">No comments or sticky notes yet.</p>';
  } else if (tab === 'movement') {
    body = `<table class="mv"><thead><tr><th>Date</th><th>From</th><th>Officer to see</th></tr></thead><tbody>${f.movements.length ? f.movements.map(m => `<tr><td>${fmtDate(m.date)}</td><td>${esc(person(m.from).name)}</td><td>${esc(person(m.to).name)}</td></tr>`).join('') : '<tr><td colspan="3" class="muted">Not routed yet.</td></tr>'}</tbody></table>`;
  } else if (tab === 'cover') {
    body = `<p class="hint" style="margin-top:0">Changes show on the file's cover straight away.</p>
      <div style="display:grid;gap:14px">
        <div class="field"><label for="cv-name">Subject</label><input class="input" id="cv-name" data-cover="name" value="${esc(f.name)}"></div>
        <div class="field"><label for="cv-dept">Department</label><input class="input" id="cv-dept" data-cover="dept" value="${esc(f.cover.dept || '')}" placeholder="e.g., HQS - Administration"><span class="hint">Written on the "Department" line of the cover.</span></div>
        <div class="field"><span class="label">Cover colour</span><div class="swatches" id="cv-sw">${swatches(f.cover.color, 'coverColour')}</div><div class="sw-name">${coverColour(f.cover.color).name}</div></div>
        <div class="field"><label for="cv-h1">Header wording</label><input class="input" id="cv-h1" data-cover="h1" value="${esc(f.cover.h1 || '')}" placeholder="Republic of Kenya"><input class="input" data-cover="h2" value="${esc(f.cover.h2 || '')}" placeholder="Ministry of Health" aria-label="Second header line"><span class="hint">Leave empty to use the usual wording.</span></div>
        <label style="display:flex;gap:10px;align-items:center;font-size:14px"><input type="checkbox" data-change="coverPriority" ${f.priority ? 'checked' : ''}> Mark as priority</label>
      </div>`;
  } else {
    const reqs = S.requests.filter(x => x.fileId === f.id);
    body = `<dl class="kv">
        <dt>File No.</dt><dd class="mono">${esc(f.ref)}</dd><dt>Volume</dt><dd>${esc(f.vol)}</dd><dt>Registry</dt><dd>${regName(f.registry)}</dd>
        <dt>Stage</dt><dd>${STAGES[f.stage].short}</dd><dt>With</dt><dd>${esc(withLabel(f))}</dd><dt>Created by</dt><dd>${esc(person(f.createdBy).name)}</dd>
        <dt>Visible to</dt><dd style="text-transform:capitalize">${esc(f.visibility)}</dd><dt>Size</dt><dd>${fmtSize(fileSizeKB(f))}</dd>
        ${f.cabinet ? `<dt>Location</dt><dd>${esc(f.cabinet)}${f.shelf ? ', ' + esc(f.shelf) : ''}</dd>` : ''}<dt>Updated</dt><dd>${ago(f.updated)}</dd>
      </dl>${f.description ? `<div class="divider"></div><p style="margin:0;font-size:14px" class="muted">${esc(f.description)}</p>` : ''}
      ${reqs.length ? `<div class="divider"></div><h3>File requests</h3>${reqs.map(x => `<div class="note-item" style="cursor:default"><b>${esc(person(x.by).name)}</b> asked for <span class="mono">${esc(x.want)}</span><div class="by">${esc(x.reason)} · <span class="chip ${x.status === 'open' ? 't-amber' : 't-green'}">${x.status === 'open' ? 'Pending' : 'Sent'}</span></div></div>`).join('')}` : ''}`;
  }
  return `<div class="tabs">${tabs.map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-act="fileTab" data-k="${k}">${l}</button>`).join('')}</div>${body}`;
}
const swatches = (sel, act) => COVER_COLOURS.map(c => `<button class="sw ${sel === c.id ? 'on' : ''}" style="background:${c.bg}" data-act="${act}" data-v="${c.id}" title="${c.name}" aria-label="${c.name}">${sel === c.id ? ic('check') : ''}</button>`).join('');
function scrollToPage(id, flash) {
  const el = $('#pg-' + id); if (!el) return;
  el.scrollIntoView({ behavior: flash ? 'auto' : 'smooth', block: 'start' });
  if (flash) { el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1500); }
}
let io = null;
function watchPages() {
  if (io) io.disconnect();
  const items = $$('.pg-wrap'); if (!items.length || !('IntersectionObserver' in window)) return;
  io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { const id = e.target.id.slice(3); $$('.folio-list a').forEach(a => a.classList.toggle('on', a.dataset.pg === id)); }
  }), { rootMargin: '-35% 0px -60% 0px' });
  items.forEach(i => io.observe(i));
}

/* ---------- Document content & response templates ---------- */
const COAT = 'assets/coat-of-arms.png';
/* Republic of Kenya · Ministry of Health lockup: live text around the crest, so it stays sharp at any size */
const MOH_LOCKUP = `<span class="moh" role="img" aria-label="Republic of Kenya, Ministry of Health"><b>REPUBLIC OF KENYA</b><img src="${COAT}" alt=""><b>MINISTRY OF HEALTH</b></span>`;
const LH = () => `<div class="lh"><img src="${COAT}" alt=""><div class="t">REPUBLIC OF KENYA</div><div class="m">MINISTRY OF HEALTH</div><div class="s">STATE DEPARTMENT FOR MEDICAL SERVICES</div><div class="c">Telegraphic: "MINHEALTH", Nairobi · Tel: +254-20-2717077 · Email: ps@health.go.ke · Afya House, Cathedral Road · P.O. Box 30016-00100, NAIROBI</div></div><hr class="lh-rule">`;
const ORGHEAD = org => `<div class="lh"><div class="m">${esc(org.toUpperCase())}</div><div class="c">P.O. Box 30016 – 00100, Nairobi · info@${esc(org.toLowerCase().replace(/[^a-z]+/g, ''))}.go.ke</div></div><hr class="lh-rule">`;
const REFS = c => `<div class="refs"><span>Ref: ${esc(c.ref)}</span><span>${fmtLong(c.date)}</span></div>`;
const PARAS = c => c.body.map(p => `<p>${esc(p)}</p>`).join('');
const SIG = c => `<div class="sigblock"><div class="line">${c.signed ? esc(c.signer.name.split(' ')[0]) : ''}</div><b>${esc(c.signer.name)}</b><br>${esc(c.signer.title)}${c.signed ? `<div class="stamp">MINISTRY OF HEALTH<br>★ RECEIVED ★<br>${fmtDate(c.date)}<br>STATE DEPT. FOR MEDICAL SERVICES</div>` : ''}</div>`.replace('★ RECEIVED ★', c.outgoing ? '★ OFFICIAL ★' : '★ RECEIVED ★');
function tplHTML(id, c) {
  if (id === 'memo') return `<div class="memo-h"><img src="${COAT}" alt=""><div><b>MINISTRY OF HEALTH</b><span>State Department for Medical Services</span></div><div class="memo-t">MEMO</div></div>
    <table class="memo-grid"><tr><th>TO:</th><td>${esc(c.to)}</td><th>DATE:</th><td>${fmtDay(c.date)}</td></tr><tr><th>FROM:</th><td>${esc(c.signer.name)}${c.signer.title ? ', ' + esc(c.signer.title) : ''}</td><th>REF:</th><td>${esc(c.ref)}</td></tr><tr><th>SUBJECT:</th><td colspan="3"><b>${esc(c.subject)}</b></td></tr></table>${PARAS(c)}${SIG(c)}`;
  if (id === 'circular') return `${LH()}<div class="circ">CIRCULAR No. ${c.circNo || 7}/2026</div>${REFS(c)}<p>To: All Heads of Departments / Directorates</p><h4>${esc(c.subject)}</h4>${PARAS(c)}${SIG(c)}`;
  if (id === 'ack') return `${LH()}${REFS(c)}<p>${esc(c.to)}</p><h4>RE: ACKNOWLEDGEMENT – ${esc(c.subject)}</h4><p>We acknowledge receipt of your letter on the above subject. The matter is receiving attention and you will be advised accordingly.</p>${c.extra ? PARAS(c) : ''}${SIG(c)}`;
  return `${c.org ? ORGHEAD(c.org) : LH()}${REFS(c)}<p>${esc(c.to)}</p><h4>RE: ${esc(c.subject)}</h4>${PARAS(c)}${SIG(c)}`;
}
const INTERNAL = /Directorate|Department|Unit|Management|Resource|Planning|Records|ICT/;
function docCtx(f, d) {
  const p = byName(d.from);
  const internal = d.kind === 'response' || INTERNAL.test(d.from);
  return {
    ref: `${f.ref}/${d.folio}`, date: d.date, to: d.to, subject: d.subject || d.title.toUpperCase(), body: d.body || LOREM,
    signer: p ? { name: p.name, title: p.title } : { name: internal ? 'Head of ' + d.from : 'Authorised Officer', title: 'For: ' + d.from },
    signed: d.signed, org: internal ? '' : d.from, extra: d.kind === 'response' && d.body && d.body !== LOREM, outgoing: d.kind === 'response',
  };
}
function docContent(f, d) {
  if (d.kind === 'attachment') return `<div><span class="ext">${esc(d.mime || 'PDF')}</span><h2>${esc(d.title)}</h2><p class="muted">${plural(d.pages, 'page')} · ${fmtSize(d.sizeKB || 200)} · from ${esc(d.from)}<br>Received ${fmtLong(d.date)}</p></div>`;
  if (d.kind === 'response') return tplHTML(d.template || 'letter', docCtx(f, d));
  if (d.kind === 'memo') return tplHTML('memo', docCtx(f, d));
  return tplHTML('letter', docCtx(f, d));
}

/* ---------- Annotation layer: comments (minutes) and sticky notes ---------- */
const handOf = id => HANDS.find(h => h.id === id) || HANDS[0];
const inkOf = id => (INKS.find(i => i.id === id) || INKS[0]).c;
const minuteFs = m => (2.1 * handOf(m.font).scale * m.w / 40).toFixed(3);
const stickyCol = id => (STICKY_COLOURS.find(c => c.id === id) || STICKY_COLOURS[0]).c;
function annoHTML(f, d) {
  const can = canAnnotate(f);
  let h = d.minutes.map(m => minuteHTML(f, d, m, can)).join('') + d.stickies.filter(seesSticky).map(s => stickyHTML(f, d, s)).join('');
  if (ui.sel && ui.sel.d === d.id) { const m = d.minutes.find(x => x.id === ui.sel.id); if (m && can && m.by === meId()) h += toolsHTML(m); }
  return h;
}
function minuteHTML(f, d, m, can) {
  const mov = can && m.by === meId();
  const editing = ui.editing === m.id;
  return `<div class="mn ${mov ? 'movable' : ''} ${ui.sel?.id === m.id ? 'sel' : ''}" data-kind="minute" data-f="${f.id}" data-d="${d.id}" data-id="${m.id}" style="left:${m.x}%;top:${m.y}%;width:${m.w}%;--mnink:${inkOf(m.ink)};font-family:${handOf(m.font).css};font-size:${minuteFs(m)}cqw" ${mov ? 'title="Drag to move · corner to resize · click for ink and hand"' : ''}>
    ${editing ? `<span class="mn-n">${m.n || nextMinuteNo(f, d)}.</span><textarea id="mn-edit" placeholder="Write your comment…" aria-label="Comment text">${esc(m.text)}</textarea>` : `<span class="mn-n">${m.n}.</span>${esc(m.text)}`}
    <div class="mn-sig"><span class="sig">${esc(person(m.by).name)}</span><span>${fmtDate(m.at)}</span></div>
    ${mov ? '<span class="rz" aria-hidden="true"></span>' : ''}
  </div>`;
}
function toolsHTML(m) {
  return `<div class="anno-tools" style="left:${m.x}%;top:${m.y}%">
    ${INKS.map(i => `<button class="ink-dot ${m.ink === i.id ? 'on' : ''}" style="background:${i.c}" data-act="mnInk" data-v="${i.id}" title="${i.name} ink" aria-label="${i.name} ink"></button>`).join('')}
    <span class="sep"></span>
    ${HANDS.map(h => `<button class="hand-btn ${m.font === h.id ? 'on' : ''}" style="font-family:${h.css}" data-act="mnFont" data-v="${h.id}" title="${h.name} hand" aria-label="${h.name} hand">Aa</button>`).join('')}
    <span class="sep"></span>
    ${ui.editing === m.id ? `<button class="tool-btn ok" data-act="mnSave" title="Save comment" aria-label="Save comment">${ic('check')}</button><button class="tool-btn" data-act="mnCancel" title="Cancel" aria-label="Cancel">${ic('x')}</button>` : `<button class="tool-btn del" data-act="mnDel" title="Delete comment" aria-label="Delete comment">${ic('trash')}</button>`}
  </div>`;
}
function stickyHTML(f, d, s) {
  const pos = `left:${s.x}%;top:${s.y}%;--sn:${stickyCol(s.color)}`;
  const data = `data-kind="sticky" data-f="${f.id}" data-d="${d.id}" data-id="${s.id}"`;
  if (s.folded) return `<div class="sn folded" style="${pos}" ${data}><button class="sn-tab" data-act="snFold" title="Unfold note from ${esc(person(s.by).name)}" aria-label="Unfold sticky note">${initials(person(s.by).name)}</button></div>`;
  const mov = s.by === meId();
  return `<div class="sn ${mov ? 'movable' : ''}" style="${pos}" ${data}>
    <div class="sn-head"><span class="to">${s.to === 'public' ? 'Everyone' : 'To: ' + esc(person(s.to).name)}</span><button data-act="snFold" title="Fold to see behind it" aria-label="Fold sticky note">${ic('fold')}</button>${canRemoveSticky(s) ? `<button data-act="snDel" title="Remove" aria-label="Remove sticky note">${ic('x')}</button>` : ''}</div>
    <div class="sn-text">${esc(s.text)}</div>
    <div class="sn-foot">${esc(person(s.by).name)} · ${fmtDate(s.at)}</div>
  </div>`;
}
function repaintLayer(fid, did) {
  const f = getFile(fid), d = getDoc(f, did), el = $('#anno-' + did);
  if (el && d) el.innerHTML = annoHTML(f, d);
  if (ui.editing) { const t = $('#mn-edit'); if (t && document.activeElement !== t) { t.focus({ preventScroll: true }); t.setSelectionRange(t.value.length, t.value.length); } }
}
const refreshSide = f => { const s = $('#side'); if (s) s.innerHTML = sidePanel(f); };
function selMinute() {
  if (!ui.sel) return {};
  const f = getFile(ui.sel.f), d = getDoc(f, ui.sel.d); return { f, d, m: d?.minutes.find(x => x.id === ui.sel.id) };
}

/* Drag to move, drag the corner to resize */
let drag = null;
document.addEventListener('pointerdown', e => {
  const el = e.target.closest('.mn.movable, .sn.movable');
  if (!el) {
    if (ui.sel && !ui.editing && !e.target.closest('.anno-tools')) { const s = ui.sel; ui.sel = null; repaintLayer(s.f, s.d); }
    return;
  }
  if (e.target.closest('button, textarea')) return;
  const f = getFile(el.dataset.f), d = getDoc(f, el.dataset.d);
  const item = el.dataset.kind === 'minute' ? d.minutes.find(x => x.id === el.dataset.id) : d.stickies.find(x => x.id === el.dataset.id);
  const box = el.parentElement.getBoundingClientRect();
  drag = { el, kind: el.dataset.kind, f: f.id, d: d.id, id: item.id, item, rz: !!e.target.closest('.rz'), sx: e.clientX, sy: e.clientY, ox: item.x, oy: item.y, ow: item.w, lw: box.width, lh: box.height, moved: false };
  el.setPointerCapture?.(e.pointerId); el.classList.add('dragging'); e.preventDefault();
});
document.addEventListener('pointermove', e => {
  if (!drag) return;
  const dx = (e.clientX - drag.sx) / drag.lw * 100, dy = (e.clientY - drag.sy) / drag.lh * 100;
  if (Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) > 3) drag.moved = true;
  if (!drag.moved) return;
  drag.el.parentElement.querySelector('.anno-tools')?.style.setProperty('display', 'none');
  if (drag.rz) {
    drag.item.w = +clamp(drag.ow + dx, 16, 100 - drag.item.x).toFixed(2);
    drag.el.style.width = drag.item.w + '%'; drag.el.style.fontSize = minuteFs(drag.item) + 'cqw';
  } else {
    const w = drag.el.offsetWidth / drag.lw * 100, h = drag.el.offsetHeight / drag.lh * 100;
    drag.item.x = +clamp(drag.ox + dx, 0, 100 - w).toFixed(2); drag.item.y = +clamp(drag.oy + dy, 0, Math.max(0, 100 - h)).toFixed(2);
    drag.el.style.left = drag.item.x + '%'; drag.el.style.top = drag.item.y + '%';
  }
});
document.addEventListener('pointerup', () => {
  if (!drag) return;
  const g = drag; drag = null; g.el.classList.remove('dragging');
  if (g.moved) save();
  if (g.kind === 'minute') { ui.sel = { f: g.f, d: g.d, id: g.id }; repaintLayer(g.f, g.d); }
});

/* ==========================================================================
   File Movement / My Queue
   ========================================================================== */
function fileRow(f, cols) {
  return `<tr data-href="#/file/${f.id}" data-s="${esc([regName(f.registry), ...liveDocs(f).map(d => d.title + ' ' + (d.from || ''))].join(' '))}">
    <td><div class="fname"><span class="thumb-cover">${coverHTML(f, 2)}</span><div><b>${esc(f.name)} ${f.priority ? `<span class="flag">${ic('flag')}</span>` : ''}</b><small class="mono">${esc(f.ref)}</small></div></div></td>
    ${cols.includes('stage') ? `<td>${stageChip(f.stage)}</td>` : ''}
    ${cols.includes('with') ? `<td>${f.withUser === 'registry' ? 'Registry Officer' : esc(person(f.withUser).name)}${f.delegatedBy ? `<small class="sub">delegated by ${esc(person(f.delegatedBy).name)}</small>` : ''}</td>` : ''}
    ${cols.includes('docs') ? `<td>${liveDocs(f).length} of ${f.docs.length}</td>` : ''}
    ${cols.includes('sent') ? `<td>${esc(person(f.sentBy).name)}</td>` : ''}
    ${cols.includes('since') ? `<td data-d="${f.updated}">${fmtDT(f.updated)}</td>` : ''}
    <td style="text-align:right"><a class="btn btn-light btn-xs" href="#/file/${f.id}">Open</a></td>
  </tr>`;
}
function fileTable(files, cols, emptyText, key) {
  if (!files.length) return `<div class="tbl-wrap"><div class="empty">${ic('checkCircle')}<div>${emptyText}</div></div></div>`;
  const head = { stage: 'Stage', with: 'With', docs: 'Documents', sent: 'Sent by', since: 'Since' };
  const at = c => cols.indexOf(c) + 1;
  const spec = { key: key || 'filetable', search: 'Search files – name, reference, letter, sender or officer…', facets: ['stage', 'with', 'sent'].filter(c => cols.includes(c)).map(c => [at(c), head[c]]), date: cols.includes('since') ? [at('since'), 'Since', 'Until'] : null };
  return tfWrap(spec, `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>File</th>${cols.map(c => `<th>${head[c]}</th>`).join('')}<th></th></tr></thead><tbody>${files.map(f => fileRow(f, cols)).join('')}</tbody></table></div>`);
}
/* My Queue is one page with two tabs: My Queue and File Movement */
function queueHead(which, sub) {
  return pageHead({ crumbs: [['My Queue', which === 'routing' ? '#/queue' : ''], ...(which === 'routing' ? [['File Movement']] : [])], title: 'My Queue', sub, right: `<a class="btn btn-white" href="#/files">${ic('folders')} Files</a>` }) +
    `<div class="queue-switch seg solid" role="tablist" aria-label="My Queue">${[['queue', '#/queue', 'My Queue', 'listChecks', myQueue().length + notesForMe().length], ['routing', '#/routing', 'File Movement', 'route', 0]].map(([k, h, l, i, n]) => `<button role="tab" aria-selected="${which === k}" class="${which === k ? 'on' : ''}" data-href="${h}">${ic(i)} ${l}${n ? ` <span class="n">${n}</span>` : ''}</button>`).join('')}</div>`;
}
function viewRouting(q) {
  const stage = q.stage || 'active';
  const mine = S.files.filter(f => !f.draft && involved(f));
  const pick = st => st === 'active' ? mine.filter(f => f.stage !== 'filed') : st === 'returned' ? mine.filter(f => f.stage.startsWith('returned')) :
    st === 'marked' ? filesMarked() : st === 'delegated' ? mine.filter(f => f.delegatedBy === meId()) : mine.filter(f => f.stage === st);
  const tabs = [['active', 'All active'], ...STAGE_ORDER.map(k => [k, STAGES[k].short]), ...(role() === 'registry' ? [['registry', 'In Registry']] : [])];
  const extra = { returned: 'Returned files', marked: 'Files I have marked', delegated: 'Delegated files' }[stage];
  if (extra) tabs.push([stage, extra]);
  const list = pick(stage).sort((a, b) => b.updated.localeCompare(a.updated));
  const cur = tabs.find(([k]) => k === stage) || tabs[0];
  return queueHead('routing', role() === 'registry' ? 'Every file sent for marking or action. To send a file, open it and press Submit to Marking Officer.' : 'Where every file sent to you is now.') + `
    <section class="panel glass"><div class="tabs stage-tabs" role="tablist" aria-label="Stage">${tabs.map(([k, l]) => `<button role="tab" aria-selected="${stage === k}" class="${stage === k ? 'on' : ''}" data-href="#/routing?stage=${k}">${l} <span class="n">${pick(k).length}</span></button>`).join('')}</div>
      <div class="panel-h"><h2>${esc(cur[1])}</h2><span class="n">${list.length}</span></div>
      ${fileTable(list, ['stage', 'with', 'docs', 'sent', 'since'], 'No files at this stage.', 'routing')}
    </section>`;
}
function viewQueue(q) {
  const tab = q.tab || 'act';
  const r = role();
  const reqs = r === 'registry' ? S.requests.filter(x => x.status === 'open') : S.requests.filter(x => x.by === meId());
  const subs = r === 'registry' ? S.files.flatMap(f => f.docs.filter(d => d.uploadedBy === meId() || (f.createdBy === meId() && d.kind !== 'response')).map(d => ({ f, d })))
    : S.files.flatMap(f => f.docs.filter(d => d.kind === 'response' && d.from === me().name).map(d => ({ f, d })));
  const notes = notesForMe();
  const tabs = [['act', 'Files to Act On', myQueue().length], ['notes', 'Notes for Me', notes.length], ['approvals', 'Pending Approvals', reqs.filter(x => x.status === 'open').length], ['landing', 'Landing Queue', landingDocs().length], ['subs', 'My Submissions', subs.length]];
  let body = '';
  if (tab === 'act') body = `<p class="muted" style="margin:0 0 14px">Files sent to you that are waiting for your ${r === 'marking' ? 'marking' : r === 'action' ? 'action' : 'routing'}.</p>` + fileTable(myQueue(), ['stage', 'with', 'docs', 'sent', 'since'], 'Nothing waiting for you.', 'queue-act');
  if (tab === 'notes') body = notes.length ? `<div class="results">${notes.map(({ f, d, s }) => `<a class="result card" href="#/file/${f.id}/doc/${d.id}" style="border-left:8px solid ${stickyCol(s.color)}"><span class="pg">${ic('sticky')}</span><div><b>${esc(s.text)}</b><small>From ${esc(person(s.by).name)} · Folio ${esc(d.folio)} in ${esc(f.name)} · ${ago(s.at)}</small></div></a>`).join('')}</div>` : '<div class="card empty">No sticky notes addressed to you.</div>';
  if (tab === 'approvals') body = reqs.length ? `<div class="results">${reqs.map(x => { const f = getFile(x.fileId); return `<div class="result card" style="cursor:default"><span class="pg">${ic('filePlus')}</span><div><b>${esc(person(x.by).name)} requested <span class="mono">${esc(x.want)}</span></b><small>${f ? `For ${esc(f.name)} · ` : ''}${esc(x.reason)} · ${ago(x.at)}</small></div>
      <span style="margin-left:auto">${r === 'registry' && x.status === 'open' ? `<button class="btn btn-primary btn-sm" data-act="approveReq" data-id="${x.id}">${ic('send')} Send file</button>` : `<span class="chip ${x.status === 'open' ? 't-amber' : 't-green'}">${x.status === 'open' ? 'Pending' : 'Sent to you'}</span>`}</span></div>`; }).join('')}</div>` : `<div class="card empty">No requests.${r === 'action' ? ' Use <b>Request files</b> inside a file that is with you.' : ''}</div>`;
  if (tab === 'landing') body = `<p class="muted" style="margin:0 0 14px">Documents recently uploaded, still awaiting OCR/classification or validation.</p>` + (landingDocs().length ? `<div class="results">${landingDocs().map(({ f, d }) => `<div class="result card"><span class="pg">${ic('file')}</span><div data-href="#/file/${f.id}/doc/${d.id}" style="cursor:pointer"><b>${esc(d.title)}</b><small>Folio ${esc(d.folio)} · ${esc(d.from)} · into ${esc(f.name)} · ${ago(d.date)}</small></div><span style="margin-left:auto">${r === 'registry' ? `<button class="btn btn-primary btn-sm" data-act="validate" data-file="${f.id}" data-doc="${d.id}">${ic('check')} Validate &amp; add to file</button>` : '<span class="chip t-violet">Processing</span>'}</span></div>`).join('')}</div>` : '<div class="card empty">The landing queue is empty.</div>');
  if (tab === 'subs') body = subs.length ? `<div class="results">${subs.map(({ f, d }) => `<a class="result card" href="#/file/${f.id}/doc/${d.id}"><span class="pg">${ic('file')}</span><div><b>${esc(d.title)}</b><small>Folio ${esc(d.folio)} in ${esc(f.name)} · ${fmtDT(d.date)}</small></div><span style="margin-left:auto" class="chip ${KIND[d.kind][1]}">${KIND[d.kind][0]}</span></a>`).join('')}</div>` : '<div class="card empty">You have not submitted anything yet.</div>';
  return queueHead('queue', 'Everything assigned to you.') + `
    <section class="panel glass"><div class="tabs">${tabs.map(([k, l, n]) => `<button class="${tab === k ? 'on' : ''}" data-href="#/queue?tab=${k}">${l} <span class="n">${n}</span></button>`).join('')}</div>${body}</section>`;
}

/* ==========================================================================
   Registers, movements, bring-ups, access (Registry quick actions)
   ========================================================================== */
const simpleTable = (head, rows, empty, tf) => { if (!rows.length) return `<div class="tbl-wrap"><div class="empty">${ic('checkCircle')}<div>${empty}</div></div></div>`;
  const t = `<div class="tbl-wrap"><table class="tbl"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
  return tf ? tfWrap(tf, t) : t; };

/* --------------------------------------------------------------------------
   Table search and filters — the same bar above every table.
   spec: { key, search: placeholder | false, date: [col, 'From label', 'To label'], facets: [[col, 'Label'], …], extra: html }
   Rows are filtered in place (no re-render), so typing keeps its focus.
   A cell can give its filter value in data-v and its date in data-d (ISO);
   a row can add hidden search text in data-s.
   -------------------------------------------------------------------------- */
ui.tf = {};
function tfBar(s) {
  const id = `tf-${s.key}`, st = ui.tf[s.key] || {};
  const dates = s.date ? [['from', s.date[1] || 'From'], ['to', s.date[2] || 'To']].map(([k, l]) => `<div class="tf-f tf-d"><label for="${id}-${k}">${l}</label><input class="input" type="date" id="${id}-${k}" data-tf-${k} value="${esc(st[k] || '')}"></div>`).join('') : '';
  const q = s.search === false ? '' : `<div class="tf-f tf-q"><label for="${id}-q">Search</label><span class="input-icon">${ic('search')}<input class="input" id="${id}-q" data-tf-q value="${esc(st.q || '')}" placeholder="${esc(s.search || 'Search this table')}" autocomplete="off"></span></div>`;
  const fac = (s.facets || []).map(([c, l]) => `<div class="tf-f"><label for="${id}-c${c}">${l}</label><select class="select" id="${id}-c${c}" data-tf-col="${c}"><option value="">All</option></select></div>`).join('');
  return `<div class="tf" data-tf="${s.key}"${s.date ? ` data-tf-date="${s.date[0]}"` : ''}><div class="tf-row">${dates}${q}${fac}${s.extra || ''}</div>
    <div class="tf-meta"><span class="tf-count" aria-live="polite"></span><button class="link-btn tf-clear" data-act="tfClear" data-k="${s.key}" hidden>${ic('x')} Clear filters</button></div></div>`;
}
const tfWrap = (s, table) => `<div class="tf-block">${tfBar(s)}${table}</div>`;
function tfCell(td) {
  if (!td) return '';
  if (td.dataset.v !== undefined) return td.dataset.v;
  const chip = td.querySelector('.chip');
  let t;
  if (chip) t = chip.textContent;
  else { const c = td.cloneNode(true); c.querySelectorAll('.av, small, .sub, button, svg').forEach(x => x.remove()); t = c.textContent; }
  return t.replace(/\s+/g, ' ').trim();
}
function tfRows(block) { return [...block.querySelectorAll('table.tbl > tbody > tr')].filter(r => !r.classList.contains('tf-none')); }
function tfApply(block) {
  const bar = block.querySelector('.tf'); if (!bar) return;
  const st = ui.tf[bar.dataset.tf] || {}, rows = tfRows(block), dc = bar.dataset.tfDate;
  const q = (st.q || '').trim().toLowerCase(), fac = Object.entries(st.fac || {}).filter(([, v]) => v);
  let n = 0;
  rows.forEach(r => {
    const cells = r.children;
    let ok = !q || (r.textContent + ' ' + (r.dataset.s || '')).toLowerCase().includes(q);
    if (ok) ok = fac.every(([c, v]) => tfCell(cells[c]) === v);
    if (ok && dc !== undefined && (st.from || st.to)) { const d = ((cells[dc] && cells[dc].dataset.d) || '').slice(0, 10); ok = !!d && (!st.from || d >= st.from) && (!st.to || d <= st.to); }
    r.hidden = !ok; if (ok) n++;
  });
  const active = !!(q || fac.length || st.from || st.to);
  const body = block.querySelector('table.tbl > tbody');
  let none = body && body.querySelector('.tf-none');
  if (body && !n && rows.length) { if (!none) { none = document.createElement('tr'); none.className = 'tf-none'; none.innerHTML = `<td colspan="${rows[0].children.length}"><div class="empty">${ic('search')}<div>Nothing matches these filters. Try fewer filters or another word.</div></div></td>`; body.appendChild(none); } }
  else if (none) none.remove();
  const word = x => `${x} ${x === 1 ? 'entry' : 'entries'}`;
  bar.querySelector('.tf-count').textContent = active ? `${n} of ${word(rows.length)}` : word(rows.length);
  bar.querySelector('.tf-clear').hidden = !active;
}
let tfObs = null;
function tfInit() {
  if (tfObs) tfObs.disconnect();
  document.querySelectorAll('.tf-block').forEach(block => {
    const bar = block.querySelector('.tf'); if (!bar) return;
    const st = ui.tf[bar.dataset.tf] || (ui.tf[bar.dataset.tf] = { fac: {} }), rows = tfRows(block);
    bar.querySelectorAll('select[data-tf-col]').forEach(sel => {
      const c = sel.dataset.tfCol, cur = (st.fac || {})[c] || '';
      const vals = [...new Set(rows.map(r => tfCell(r.children[c])).filter(v => v && v !== '—'))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      if (cur && !vals.includes(cur)) vals.unshift(cur);
      const html = `<option value="">All</option>${vals.map(v => `<option ${v === cur ? 'selected' : ''}>${esc(v)}</option>`).join('')}`;
      if (sel.dataset.built !== html) { sel.innerHTML = html; sel.dataset.built = html; }
      sel.value = cur;
    });
    tfApply(block);
  });
  if (tfObs) tfObs.observe(document.body, { childList: true, subtree: true });
}
function tfWatch() {
  if (tfObs) return;
  let queued = false;
  tfObs = new MutationObserver(muts => {
    if (queued || !muts.some(m => [...m.addedNodes].some(n => n.nodeType === 1 && (n.matches?.('.tf-block, tr, .tbl-wrap, table') || n.querySelector?.('.tf-block, table.tbl'))))) return;
    queued = true; requestAnimationFrame(() => { queued = false; tfInit(); });
  });
  tfObs.observe(document.body, { childList: true, subtree: true });
}
function tfInput(t) {
  const bar = t.closest('.tf'); if (!bar) return false;
  const st = ui.tf[bar.dataset.tf] || (ui.tf[bar.dataset.tf] = { fac: {} });
  if (t.hasAttribute('data-tf-q')) st.q = t.value;
  else if (t.hasAttribute('data-tf-from')) st.from = t.value;
  else if (t.hasAttribute('data-tf-to')) st.to = t.value;
  else if (t.dataset.tfCol !== undefined) (st.fac || (st.fac = {}))[t.dataset.tfCol] = t.value;
  else return false;
  tfApply(bar.closest('.tf-block'));
  return true;
}
const fileLink = f => `<a href="#/file/${f.id}"><b>${esc(f.name)}</b></a><small class="sub mono">${esc(f.ref)}</small>`;
function viewInward() {
  const rows = S.files.flatMap(f => f.docs.filter(d => d.kind !== 'response').map(d => ({ f, d }))).sort((a, b) => b.d.date.localeCompare(a.d.date));
  return pageHead({ crumbs: [['Inward Register']], title: 'Inward Mail Register', sub: 'A report of every document filed through Upload — Single, Bulk and Email. To add an entry, upload the document and fill in its details.', right: `<a class="btn btn-glass" style="color:#fff" href="#/senders">${ic('users')} Mail Senders</a>${role() === 'registry' ? `<a class="btn btn-white" href="#/upload">${ic('upload')} Upload document</a>` : ''}` }) +
    `<section class="panel glass">${simpleTable(['No.', 'Received', 'From', 'Subject', 'File', 'Folio', 'Status'], rows.map(({ f, d }, i) => `<tr data-href="#/file/${f.id}/doc/${d.id}"><td class="mono">IN/26/${String(d.serial || rows.length - i).padStart(3, '0')}</td><td data-d="${d.date}">${fmtDay(d.date)}</td><td>${esc(d.from)}</td><td>${esc(d.title)}</td><td>${fileLink(f)}</td><td class="mono">${esc(d.folio)}</td><td>${d.status === 'landing' ? '<span class="chip t-violet">Landing</span>' : '<span class="chip t-green">Filed</span>'}</td></tr>`), 'No mail registered.', { key: 'inward', search: 'Received from, subject or reference', date: [1, 'Received from', 'Received to'], facets: [[2, 'From'], [4, 'File'], [6, 'Status']] })}</section>`;
}
function viewOutward() {
  const rows = S.files.flatMap(f => f.docs.filter(d => d.kind === 'response').map(d => ({ f, d }))).sort((a, b) => b.d.date.localeCompare(a.d.date));
  return pageHead({ crumbs: [['Outward Register']], title: 'Outward Mail Register', sub: 'A report of every file or letter sent outside the organisation. To add an entry, use Send outside on the file or letter.', right: `<a class="btn btn-white" href="#/senders">${ic('users')} Mail Senders</a>` }) +
    `<section class="panel glass">${simpleTable(['Date', 'To', 'Subject', 'Written by', 'File', 'Folio', 'Dispatch'], rows.map(({ f, d }) => `<tr><td data-d="${d.date}">${fmtDay(d.date)}</td><td>${esc(d.to)}</td><td><a href="#/file/${f.id}/doc/${d.id}">${esc(d.title)}</a></td><td>${esc(d.from)}</td><td>${fileLink(f)}</td><td class="mono">${esc(d.folio)}</td><td data-v="${S.dispatch[d.id] ? 'Sent' : 'Waiting'}">${S.dispatch[d.id] ? (x => `<span class="chip t-green">${ic('check')} Sent ${fmtDay(typeof x === 'string' ? x : x.at)}</span>${typeof x === 'object' && x.to ? `<small class="sub">${esc(x.how)} to ${esc(x.to)}${x.remarks ? ' · ' + esc(x.remarks) : ''}</small>` : ''}`)(S.dispatch[d.id]) : role() === 'registry' ? `<button class="btn btn-primary btn-xs" data-act="sendOutside" data-f="${f.id}" data-d="${d.id}">${ic('send')} Send outside</button>` : '<span class="chip t-amber">Waiting</span>'}</td></tr>`), 'Nothing to dispatch.', { key: 'outward', search: 'Sent to, subject or reference', date: [0, 'Sent from', 'Sent to'], facets: [[1, 'To'], [3, 'Written by'], [4, 'File'], [6, 'Dispatch']] })}</section>`;
}
function viewMovements() {
  const files = S.files.filter(involved);
  const rows = files.filter(f => !ui.mvFile || f.id === ui.mvFile).flatMap(f => f.movements.map(m => ({ f, m }))).sort((a, b) => b.m.date.localeCompare(a.m.date));
  return pageHead({ crumbs: [['Movement Sheets']], title: 'Movement Sheets', sub: 'Every move written on the movement sheets.', right: `<label class="lbl-select">${ic('folder')}<select data-change="mvFile" aria-label="File"><option value="">All files</option>${files.map(f => `<option value="${f.id}" ${ui.mvFile === f.id ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}</select></label>` }) +
    `<section class="panel glass">${simpleTable(['Date', 'File', 'From', 'Officer to see', "Officer's initials"], rows.map(({ f, m }) => `<tr data-href="#/file/${f.id}"><td data-d="${m.date}">${fmtDT(m.date)}</td><td>${fileLink(f)}</td><td>${esc(person(m.from).name)}</td><td>${m.to === 'registry' ? 'Registry' : `${avatar(m.to)} ${esc(person(m.to).name)}`}</td><td style="font-family:var(--hand);font-size:18px">${m.to === 'registry' ? '' : initials(person(m.to).name)}</td></tr>`), 'No movements yet.', { key: 'movements', search: 'Search movements – file, reference or officer', date: [0, 'Moved from', 'Moved to'], facets: [[1, 'File'], [2, 'From'], [3, 'Officer to see']] })}</section>`;
}
function viewBringup() {
  const list = myBringups().sort((a, b) => a.done - b.done || a.date.localeCompare(b.date));
  const end = new Date(); end.setHours(23, 59, 59);
  const when = iso => { const d = -daysSince(iso); return d > 0 ? `in ${plural(Math.ceil(d), 'day')}` : d > -1 ? 'today' : ago(iso); };
  return pageHead({ crumbs: [['Bring-up Diary']], title: 'Bring-up Diary', sub: 'Files that need to come back to an officer on a date.', right: role() === 'registry' ? `<button class="btn btn-white" data-act="addBringup">${ic('plus')} Add bring-up</button>` : '' }) +
    `<section class="panel glass">${simpleTable(['Due', 'File', 'Note', 'For', 'Set by', 'Status', ''], list.map(b => { const f = getFile(b.fileId); const due = new Date(b.date) <= end; return `<tr><td data-d="${b.date}" data-v="${fmtDay(b.date)}"><b>${fmtDay(b.date)}</b><small class="sub">${when(b.date)}</small></td><td>${fileLink(f)}</td><td>${esc(b.note)}</td><td>${esc(person(b.for).name)}</td><td>${esc(person(b.by).name)}</td><td>${b.done ? '<span class="chip t-green">Done</span>' : due ? '<span class="chip t-red">Due</span>' : '<span class="chip t-blue">Upcoming</span>'}</td><td>${!b.done && (role() === 'registry' || b.for === meId()) ? `<button class="btn btn-light btn-xs" data-act="bringupDone" data-id="${b.id}">${ic('check')} Done</button>` : ''}</td></tr>`; }), 'No bring-ups.', { key: 'bringup', search: 'Search bring-ups – file, note or officer', date: [0, 'Due from', 'Due to'], facets: [[1, 'File'], [3, 'For'], [4, 'Set by'], [5, 'Status']] })}</section>`;
}
function viewAccess() {
  const canDecide = ['registry', 'marking'].includes(role());
  const list = canDecide ? S.access : S.access.filter(a => a.by === meId());
  return pageHead({ crumbs: [['Access Requests']], title: 'Access Requests', sub: 'Read-only access to a file, with an expiry date.', right: `<button class="btn btn-white" data-act="requestAccess">${ic('lock')} Request access</button>` }) +
    `<section class="panel glass">${simpleTable(['Officer', 'File', 'Reason', 'Duration', 'Requested', 'Status', ''], list.map(a => { const f = getFile(a.fileId); return `<tr><td><div class="fname">${avatar(a.by)}<div><b>${esc(person(a.by).name)}</b><small>${esc(person(a.by).title)}</small></div></div></td><td>${fileLink(f)}</td><td>${esc(a.reason)}</td><td>${plural(a.days, 'day')}</td><td data-d="${a.at}">${ago(a.at)}</td><td data-v="${{ open: 'Pending', approved: 'Approved', declined: 'Declined' }[a.status] || a.status}">${a.status === 'open' ? '<span class="chip t-amber">Pending</span>' : a.status === 'approved' ? `<span class="chip t-green">Until ${fmtDay(a.expires)}</span>` : '<span class="chip t-red">Declined</span>'}</td><td style="white-space:nowrap">${canDecide && a.status === 'open' ? `<button class="btn btn-primary btn-xs" data-act="accessDecide" data-id="${a.id}" data-v="approved">Approve</button> <button class="btn btn-light btn-xs" data-act="accessDecide" data-id="${a.id}" data-v="declined">Decline</button>` : ''}</td></tr>`; }), 'No access requests.', { key: 'access', search: 'Search requests – officer, file or reason', date: [4, 'Requested from', 'Requested to'], facets: [[0, 'Officer'], [1, 'File'], [5, 'Status']] })}</section>`;
}

/* ==========================================================================
   Mail Senders: the names offered under "Received From" (live MailSenders)
   ========================================================================== */
const SENDER_AS = { sender: 'Sender', recipient: 'Recipient', both: 'Sender & recipient' };
function senderUses(name) { const n = name.toLowerCase(); return S.files.flatMap(f => f.docs).filter(d => (d.from || '').toLowerCase() === n || (d.kind === 'response' && (d.to || '').toLowerCase().startsWith(n))).length + Object.values(S.dispatch).filter(x => x && x.to && x.to.toLowerCase() === n).length; }
function viewSenders() {
  const M = ui.senders;
  const list = S.senders.filter(x => M.off || x.on).sort((a, b) => a.name.localeCompare(b.name));
  const reg = role() === 'registry';
  return pageHead({ crumbs: [['Inward Mail Register', '#/inward'], ['Mail Senders']], title: 'Mail Senders', sub: 'The names offered under Received From in the Inward Mail Register, and under Send to when letters are sent outside.' }) + `
    ${reg ? `<section class="panel glass add-row"><label class="sr" for="ms-new">Name of the person or office</label><input class="input" id="ms-new" placeholder="Name of the person or office"><button class="btn btn-primary" data-act="senderAdd">${ic('plus')} Add a sender</button></section>` : ''}
    <section class="panel glass">${simpleTable(['Name', 'Used as', 'Register entries', 'Status', ''], list.map(x => `<tr class="${x.on ? '' : 'is-off'}">
      <td>${M.edit === x.id ? `<div class="inline-edit"><input class="input" id="ms-edit" value="${esc(x.name)}" aria-label="Rename"><button class="btn btn-primary btn-xs" data-act="senderSave" data-id="${x.id}">Save</button><button class="btn btn-light btn-xs" data-act="senderEdit" data-id="">Cancel</button></div>` : `<b>${esc(x.name)}</b>`}</td>
      <td>${SENDER_AS[x.as]}</td><td>${senderUses(x.name)}</td><td><span class="chip ${x.on ? 't-green' : 't-neutral'}">${x.on ? 'In use' : 'Switched off'}</span></td>
      <td>${reg && M.edit !== x.id ? `<div class="row-btns"><button class="btn btn-light btn-xs" data-act="senderEdit" data-id="${x.id}">${ic('pen')} Edit</button><button class="btn btn-light btn-xs" data-act="senderToggle" data-id="${x.id}">${x.on ? 'Switch off' : 'Switch on'}</button></div>` : ''}</td></tr>`), 'No names found.', { key: 'senders', search: 'Find a name', facets: [[1, 'Used as'], [3, 'Status']], extra: `<label class="check-inline tf-check"><input type="checkbox" data-change="sendersOff" ${M.off ? 'checked' : ''}> Show switched-off names</label>` })}</section>`;
}
/* ==========================================================================
   File grid: what was marked on a file, step by step (live MarkGridPage)
   ========================================================================== */
function gridRows(f) {
  const docs = [...liveDocs(f)].sort(byFolio);
  const near = date => docs.filter(d => d.date <= date).pop() || docs[0];
  return f.movements.map((m, i) => { const d = near(m.date); const ack = f.movements[i + 1] && f.movements[i + 1].from === m.to;
    return { date: m.date, folio: d ? d.folio : '—', doc: d ? d.title : '—', step: i + 1, to: m.to === 'registry' ? 'Registry' : person(m.to).name, initials: m.to === 'registry' ? '—' : initials(person(m.to).name), ack: ack || f.stage === 'filed' ? 'Yes' : '—' }; });
}
function viewGrid(q) {
  const f = getFile(q.file || q.id) || S.files.find(x => !x.draft && x.movements.length);
  const rows = gridRows(f);
  return pageHead({ crumbs: [['Registries & Files', '#/files'], [f.name, `#/file/${f.id}`], ['File grid']], title: 'File grid', sub: `${esc(f.name)} · ${esc(f.ref)}`, back: [`Back to ${f.name}`, `#/file/${f.id}`], right: `<button class="btn btn-white" data-act="gridExcel" data-id="${f.id}">${ic('download')} Download Excel</button>` }) + `
    <section class="panel glass dense">${simpleTable(['Date', 'Folio', 'Document', 'Step', 'Officer to see', 'Initials', 'Acknowledged'], rows.map(r => `<tr><td data-d="${r.date}">${fmtDT(r.date)}</td><td class="mono">${esc(r.folio)}</td><td>${esc(r.doc)}</td><td>${r.step}</td><td>${esc(r.to)}</td><td class="mono">${esc(r.initials)}</td><td>${r.ack === 'Yes' ? `<span class="chip t-green">${ic('check')} Yes</span>` : '—'}</td></tr>`), 'Nothing has been marked on this file yet.', { key: 'grid-' + f.id, search: 'Search – folio, document or officer', date: [0, 'Marked from', 'Marked to'], facets: [[1, 'Folio'], [4, 'Officer to see'], [6, 'Acknowledged']] })}</section>`;
}

/* ==========================================================================
   Physical Files (File Movement Register) — live wording
   ========================================================================== */
const HO_STATUS = { SENT: ['Waiting for receipt', 't-amber'], RECEIVED: ['With holders', 't-blue'], RETURNED: ['Returned, to acknowledge', 't-violet'], CLOSED: ['Closed', 't-neutral'] };
const hoWith = h => h.toKind === 'room' ? esc(h.room) : `${avatar(h.to)} ${esc(person(h.to).name)}`;
/* Physical Files: one page with File location and File Census tabs */
function physHead(which, sub, right = '') {
  return pageHead({ crumbs: [['Physical Files', which === 'census' ? '#/physical' : ''], ...(which === 'census' ? [['File Census']] : [])], title: 'Physical Files', sub, right }) +
    `<div class="queue-switch seg solid" role="tablist" aria-label="Physical Files">${[['location', '#/physical', 'File location', 'archive'], ['census', '#/census', 'File Census', 'checkCircle']].map(([k, h, l, i]) => `<button role="tab" aria-selected="${which === k}" class="${which === k ? 'on' : ''}" data-href="${h}">${ic(i)} ${l}</button>`).join('')}</div>`;
}
function viewPhysical(q) {
  const tab = q.tab || 'open';
  const tabs = [['open', 'Open', x => x.status !== 'CLOSED'], ['SENT', 'Waiting for receipt', x => x.status === 'SENT'], ['RECEIVED', 'With holders', x => x.status === 'RECEIVED'], ['RETURNED', 'Returned, to acknowledge', x => x.status === 'RETURNED'], ['CLOSED', 'Closed', x => x.status === 'CLOSED']];
  const pick = tabs.find(t => t[0] === tab) || tabs[0];
  const list = S.handovers.filter(pick[2]).sort((a, b) => b.sent.localeCompare(a.sent));
  const act = h => h.status === 'SENT' ? `<button class="btn btn-primary btn-xs" data-act="hoReceive" data-id="${h.id}">${ic('check')} Acknowledge receipt</button>`
    : h.status === 'RECEIVED' ? `<button class="btn btn-light btn-xs" data-act="hoReturn" data-id="${h.id}">${ic('undo')} Return to records</button>`
    : h.status === 'RETURNED' ? `<button class="btn btn-primary btn-xs" data-act="hoAckReturn" data-id="${h.id}">${ic('checkCircle')} Acknowledge return</button>` : '';
  return physHead('location', 'Where every physical file, and any single document taken out of it, is now. Each handover is acknowledged by the person who receives it, and each return is acknowledged by the Registry Officer.', `<button class="btn btn-white" data-act="handOver">${ic('send')} Hand over</button>`) + `
    <section class="panel glass dense"><div class="tabs">${tabs.map(([k, l, fn]) => `<button class="${pick[0] === k ? 'on' : ''}" data-href="#/physical?tab=${k}">${l} <span class="n">${S.handovers.filter(fn).length}</span></button>`).join('')}</div>
    ${simpleTable(['Physical file', 'Moving', 'Document', 'Status', 'With', 'Sent', 'Returned'], list.map(h => { const f = getFile(h.fileId); const d = h.docId && getDoc(f, h.docId);
      return `<tr><td>${fileLink(f)}<small class="sub">${esc(f.location)}</small></td><td>${h.what === 'file' ? 'Whole file' : 'Single document'}</td><td>${d ? `Folio ${esc(d.folio)} · ${esc(d.title)}` : '<span class="muted">All documents in the file</span>'}</td>
        <td><span class="chip ${HO_STATUS[h.status][1]}">${HO_STATUS[h.status][0]}</span>${h.received ? `<small class="sub">Received ${fmtDT(h.received)}</small>` : ''}${h.closed ? `<small class="sub">Acknowledged ${fmtDT(h.closed)}</small>` : ''}${act(h) ? `<div style="margin-top:8px">${act(h)}</div>` : ''}</td>
        <td><div class="fname">${hoWith(h)}</div>${h.purpose ? `<small class="sub">${esc(h.purpose)}</small>` : ''}</td><td data-d="${h.sent}">${fmtDT(h.sent)}</td><td>${h.returned ? fmtDT(h.returned) : '—'}</td></tr>`; }), 'Nothing here.', { key: 'physical', search: 'Search – file, reference, document or holder', date: [5, 'Sent from', 'Sent to'], facets: [[0, 'Physical file'], [1, 'Moving'], [3, 'Status'], [4, 'With']] })}
    </section>`;
}
function handOverModal() {
  const o = ui.ho; const f = getFile(o.fileId);
  modal(`${mHead('send', 'Hand over', 'The receiver acknowledges the handover. The file stays on the register until it comes back.')}
    <div class="modal-b">
      <div class="field"><label for="ho-file">Physical file <span class="req">*</span></label><select class="select" id="ho-file" data-change="hoFile"><option value="">Select a file…</option>${S.files.filter(x => !x.draft && x.state !== 'Disposed').map(x => `<option value="${x.id}" ${x.id === o.fileId ? 'selected' : ''}>${esc(x.ref)} — ${esc(x.name)}</option>`).join('')}</select></div>
      <fieldset class="field radios"><legend class="label">What is being handed over</legend>
        <label><input type="radio" name="ho-what" value="file" data-change="hoWhat" ${o.what === 'file' ? 'checked' : ''}> Whole file, with all its documents</label>
        <label><input type="radio" name="ho-what" value="document" data-change="hoWhat" ${o.what === 'document' ? 'checked' : ''}> A single document</label></fieldset>
      ${o.what === 'document' ? `<div class="field"><label for="ho-doc">Document <span class="req">*</span></label><select class="select" id="ho-doc" data-change="hoDoc" ${f ? '' : 'disabled'}><option value="">${f ? 'Select a document in this file…' : 'Choose the file first'}</option>${f ? f.docs.map(d => `<option value="${d.id}" ${o.docId === d.id ? 'selected' : ''}>Folio ${esc(d.folio)} – ${esc(d.title)}</option>`).join('') : ''}</select></div>` : ''}
      <fieldset class="field radios"><legend class="label">Hand over to <span class="req">*</span></legend>
        <label><input type="radio" name="ho-to" value="officer" data-change="hoToKind" ${o.toKind === 'officer' ? 'checked' : ''}> An officer</label>
        <label><input type="radio" name="ho-to" value="room" data-change="hoToKind" ${o.toKind === 'room' ? 'checked' : ''}> A room or office</label></fieldset>
      ${o.toKind === 'officer' ? `<div class="field"><label for="ho-off" class="sr">Officer</label><select class="select" id="ho-off" data-change="hoTo"><option value="">Select an officer…</option>${peopleOpts(p => p.id !== meId(), o.to)}</select></div>`
        : `<div class="field"><label for="ho-room">Room or office</label><input class="input" id="ho-room" data-ho="room" value="${esc(o.room)}"></div>`}
      <div class="field"><label for="ho-purpose">Purpose</label><input class="input" id="ho-purpose" data-ho="purpose" value="${esc(o.purpose)}"></div>
      ${o.err ? `<p class="form-err" role="alert">${esc(o.err)}</p>` : ''}
    </div>
    <div class="modal-f"><button class="btn btn-light" data-act="close">Close</button><button class="btn btn-primary" data-act="hoSave">${ic('send')} Hand over</button></div>`, '', '#ho-file');
}
function rackModal(h) {
  const f = getFile(h.fileId);
  modal(`${mHead('checkCircle', 'Acknowledge return', `${esc(f.name)} is back with the Registry.`)}
    <div class="modal-b"><div class="field"><label for="rk">Rack or shelf where the file is kept (optional):</label><input class="input" id="rk" value="${esc(f.location)}"></div></div>
    <div class="modal-f"><button class="btn btn-light" data-act="close">Cancel</button><button class="btn btn-primary" data-act="hoAckSave" data-id="${h.id}">${ic('check')} Acknowledge return</button></div>`, '', '#rk');
}

/* ==========================================================================
   Files and records: open (TY), close, dispose — each approved first
   ========================================================================== */
const REC_TYPES = { OPEN: ['Open a new temporary file', 'File opening'], CLOSE: ['Close a file', 'File closing'], DISPOSE: ['Dispose of a closed file', 'File disposal'] };
const REC_REASONS = { OPEN: ['New subject with no existing file', 'Correspondence waiting for a permanent file', 'Existing file is full – new volume needed'], CLOSE: ['Matter concluded', 'File is full', 'Subject merged into another file', 'No action for over two years'], DISPOSE: ['Retention period has ended', 'Duplicate of another file', 'Transferred to the National Archives'] };
const REC_STATUS = { 'Awaiting approval': 't-amber', Approved: 't-green', Rejected: 't-red', Cancelled: 't-neutral', 'Could not be applied': 't-red' };
function viewRecords(q) {
  const tab = q.tab || 'requests', R = ui.rec;
  const tabs = [['requests', 'Requests'], ['files', 'Files'], ['registers', 'Registers'], ['stats', 'Statistics']];
  let body = '';
  if (tab === 'requests') {
    const pool = R.type === 'CLOSE' ? S.files.filter(f => !f.draft && f.state === 'Open') : S.files.filter(f => !f.draft && f.state === 'Closed');
    body = `<div class="rec-form card">
        <div class="field"><label for="rq-type">What do you want to do?</label><select class="select" id="rq-type" data-change="recType">${Object.entries(REC_TYPES).map(([k, [l]]) => `<option value="${k}" ${R.type === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        ${R.type === 'OPEN' ? `<div class="two"><div class="field"><label for="rq-series">Reference series <span class="req">*</span></label><input class="input mono" id="rq-series" placeholder="e.g. MOH/ADM/1/1" value="${esc(R.series)}" data-rec="series"><span class="hint">The next number in this series is given on approval.</span></div>
          <div class="field"><label for="rq-subj">Subject of the file <span class="req">*</span></label><input class="input" id="rq-subj" value="${esc(R.subject)}" data-rec="subject"></div></div>`
        : `<div class="field"><label for="rq-file">File <span class="req">*</span></label><select class="select" id="rq-file" data-change="recFile"><option value="">Select a file…</option>${pool.map(f => `<option value="${f.id}" ${R.fileId === f.id ? 'selected' : ''}>${esc(f.ref)} — ${esc(f.name)}</option>`).join('')}</select>${!pool.length ? `<span class="hint">${R.type === 'DISPOSE' ? 'Only closed files can be disposed of.' : 'No open files.'}</span>` : ''}</div>`}
        <div class="field"><label for="rq-reason">Reason <span class="req">*</span></label><select class="select" id="rq-reason" data-change="recReason"><option value="">Select a reason…</option>${REC_REASONS[R.type].map(x => `<option ${R.reason === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
        ${R.err ? `<p class="form-err" role="alert">${esc(R.err)}</p>` : ''}
        <button class="btn btn-primary" style="justify-self:start" data-act="recSend">${ic('send')} Send for approval</button>
      </div>
      ${simpleTable(['Request', 'File', 'Status', 'Submitted', 'Decision', ''], [...S.recReqs].sort((a, b) => b.at.localeCompare(a.at)).map(x => { const f = x.fileId && getFile(x.fileId);
        return `<tr><td><b>${REC_TYPES[x.type][1]}</b><small class="sub">${esc(x.reason)}</small></td><td>${f ? fileLink(f) : `<b>${esc(x.subject)}</b><small class="sub mono">${esc(x.series)}/…</small>`}</td>
          <td><span class="chip ${REC_STATUS[x.status]}">${x.status}</span>${x.type === 'OPEN' && x.status === 'Approved' ? `<small class="sub">${x.fileId ? 'File created' : 'Ready - create the file with New File'}</small>` : ''}</td><td data-d="${x.at}">${fmtDT(x.at)}</td>
          <td>${x.decision ? `${fmtDay(x.decision)}<small class="sub">${esc(person(x.decidedBy).name)}${x.note ? ' · ' + esc(x.note) : ''}</small>` : '—'}</td>
          <td>${x.status === 'Awaiting approval' ? `<button class="btn btn-light btn-xs" data-act="recCancel" data-id="${x.id}">${ic('x')} Cancel</button>` : x.type === 'OPEN' && x.status === 'Approved' ? (x.fileId ? `<a class="btn btn-light btn-xs" href="#/file/${x.fileId}">${ic('folder')} Open file</a>` : `<button class="btn btn-primary btn-xs" data-act="newFileTy" data-id="${x.id}">${ic('folderPlus')} New File</button>`) : ''}</td></tr>`; }), 'No requests yet.', { key: 'recreqs', search: 'Search requests – subject, file or reason', date: [3, 'Submitted from', 'Submitted to'], facets: [[0, 'Request'], [2, 'Status']] })}`;
  } else if (tab === 'files') {
    const fl = R.fstate || 'all';
    const list = S.files.filter(f => !f.draft && (fl === 'all' || f.state === fl));
    body = `<div class="tabs sub-tabs">${[['all', 'All files'], ['Open', 'Open'], ['Closed', 'Closed'], ['Disposed', 'Disposed']].map(([k, l]) => `<button class="${fl === k ? 'on' : ''}" data-act="recFState" data-k="${k}">${l} <span class="n">${S.files.filter(f => !f.draft && (k === 'all' || f.state === k)).length}</span></button>`).join('')}</div>
      ${simpleTable(['Reference', 'Subject', 'State', 'Location', 'Documents', 'Last folio', ''], list.map(f => `<tr><td class="mono">${esc(f.ref)}</td><td><a href="#/file/${f.id}"><b>${esc(f.name)}</b></a></td><td><span class="chip ${f.state === 'Open' ? 't-green' : f.state === 'Closed' ? 't-amber' : 't-neutral'}">${f.state}</span></td><td>${esc(f.location)}</td><td>${f.docs.length}</td><td class="mono">${f.docs.length ? esc(nextFolio(f) - 1) : '—'}</td><td><a class="btn btn-light btn-xs" href="#/file/${f.id}">${ic('folder')} Cover</a></td></tr>`), 'No files.', { key: 'recfiles', search: 'Search files – reference or subject', facets: [[2, 'State'], [3, 'Location']] })}`;
  } else if (tab === 'registers') {
    body = `<div class="more-grid">${[['inboxIn', 'Inward Mail Register', 'Every document filed through Upload — Single, Bulk and Email.', '#/inward'], ['send', 'Outward Mail Register', 'Every file or letter sent outside the organisation.', '#/outward'], ['archive', 'File Movement Register', 'Physical files and where they are.', '#/physical'], ['swap', 'Movement Sheets', 'Every move on the movement sheets.', '#/movements']].map(([i, l, sub, h]) => `<a class="more-it" href="${h}"><span class="mi">${ic(i)}</span><span><b>${l}</b><small>${sub}</small></span></a>`).join('')}</div>`;
  } else {
    const docs = S.files.flatMap(f => f.docs);
    const inward = docs.filter(d => d.kind !== 'response'), outward = docs.filter(d => d.kind === 'response');
    const internal = inward.filter(d => INTERNAL.test(d.from)).length;
    const now = new Date(); const end = new Date(); end.setHours(0, 0, 0, 0);
    const done = t => S.recReqs.filter(x => x.type === t && x.status === 'Approved').length;
    const stat = (l, v, sub) => `<div class="stat card"><span>${l}</span><b>${v}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;
    const months = [...Array(6)].map((_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1); return [d.toLocaleDateString('en-GB', { month: 'short' }), d.getMonth(), d.getFullYear()]; });
    const byMonth = list => months.map(([l, m, y]) => [l, list.filter(d => { const x = new Date(d.date); return x.getMonth() === m && x.getFullYear() === y; }).length]);
    const bars = (t, data) => { const max = Math.max(1, ...data.map(x => x[1])); return `<div class="card bars"><h3>${t}</h3>${data.map(([l, v]) => `<div class="bar-row"><span>${l}</span><i style="width:${(v / max) * 100}%"></i><b>${v}</b></div>`).join('')}</div>`; };
    body = `<div class="stats">${stat('Inward mail', inward.length, `${internal} internal · ${inward.length - internal} external`)}${stat('Inward uploaded to EDMS', inward.length)}${stat('Outward mail', outward.length)}${stat('Outward uploaded to EDMS', outward.length)}
      ${stat('Files opened', done('OPEN'))}${stat('Files closed', done('CLOSE'))}${stat('Files disposed', done('DISPOSE'))}${stat('Open files now', S.files.filter(f => !f.draft && f.state === 'Open').length)}${stat('Closed files now', S.files.filter(f => !f.draft && f.state === 'Closed').length)}${stat('Bring-ups overdue', S.bringups.filter(b => !b.done && new Date(b.date) < end).length)}</div>
      <div class="two" style="margin-top:16px">${bars('Inward mail by month', byMonth(inward))}${bars('Outward mail by month', byMonth(outward))}</div>`;
  }
  return pageHead({ crumbs: [['Files & Records']], title: 'Files and records', sub: 'Open, close and dispose of files. Each one is approved before it takes effect.', right: `<a class="btn btn-glass" style="color:#fff" href="#/census">${ic('checkCircle')} File census</a><a class="btn btn-white" href="#/bringup">${ic('calendar')} Bring-up diary</a>` }) + `
    <section class="panel glass"><div class="tabs">${tabs.map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-href="#/records?tab=${k}">${l}</button>`).join('')}</div>${body}</section>`;
}

/* ==========================================================================
   File census: check every physical file against its recorded location
   ========================================================================== */
const CEN_STATUS = { FOUND: ['Found', 't-green'], MISSING: ['Missing', 't-red'], NONE: ['Not checked', 't-neutral'] };
function viewCensus(q) {
  const C = ui.census; const cur = S.censuses.find(c => c.id === (q.id || C.id));
  const list = [...S.censuses].sort((a, b) => b.at.localeCompare(a.at));
  const detail = cur ? (() => {
    const n = k => cur.items.filter(i => i.status === k).length;
    return `<section class="panel glass dense"><div class="panel-h"><div><h2>${esc(cur.title)}</h2><p class="muted" style="margin:2px 0 0">${fmtDay(cur.date)} · ${cur.covers === 'hr' ? 'Personnel files only' : 'All files'} · ${esc(cur.by)}</p></div>
      <div class="right"><span class="chip t-green">${n('FOUND')} found</span><span class="chip t-red">${n('MISSING')} missing</span><span class="chip t-neutral">${n('NONE')} not checked</span>
      <button class="btn btn-light btn-sm" data-act="censusExcel" data-id="${cur.id}">${ic('download')} Download Excel</button>${cur.closed ? '' : `<button class="btn btn-primary btn-sm" data-act="censusClose" data-id="${cur.id}">${ic('lock')} Close census</button>`}</div></div>
      ${simpleTable(['File reference', 'Subject', 'Recorded location', 'Status', 'Found at', 'Officer', ''], cur.items.map((it, i) => { const f = getFile(it.fileId);
        return `<tr><td class="mono">${esc(f.ref)}</td><td><a href="#/file/${f.id}"><b>${esc(f.name)}</b></a></td><td>${esc(it.recorded)}</td><td><span class="chip ${CEN_STATUS[it.status][1]}">${CEN_STATUS[it.status][0]}</span>${it.remarks ? `<small class="sub">${esc(it.remarks)}</small>` : ''}</td><td>${esc(it.foundAt || '—')}</td><td>${esc(it.officer || '—')}</td>
          <td>${cur.closed ? '' : `<div class="row-btns"><button class="btn btn-light btn-xs" data-act="censusMark" data-c="${cur.id}" data-i="${i}" data-k="FOUND">${ic('check')} Found</button><button class="btn btn-light btn-xs" data-act="censusMark" data-c="${cur.id}" data-i="${i}" data-k="MISSING">${ic('x')} Missing</button></div>`}</td></tr>`; }), 'No files in this census.', { key: 'census-' + cur.id, search: 'Search – reference, subject or location', facets: [[2, 'Recorded location'], [3, 'Status'], [5, 'Officer']] })}</section>`;
  })() : `<section class="panel glass"><div class="empty">${ic('checkCircle')}<div>Choose a census to check files.</div></div></section>`;
  return physHead('census', 'Check every physical file against its recorded location. Missing files are reported.') + `
    <div class="census">
      <aside class="panel glass">
        <div class="field"><label for="cn-title">Title</label><input class="input" id="cn-title" placeholder="e.g. Room 3 census, October" value="${esc(C.title)}" data-cn="title"></div>
        <div class="two"><div class="field"><label for="cn-date">Census date</label><input class="input" type="date" id="cn-date" value="${esc(C.date)}" data-cn="date"></div>
          <div class="field"><label for="cn-cov">Covers</label><select class="select" id="cn-cov" data-change="cnCovers"><option value="all" ${C.covers === 'all' ? 'selected' : ''}>All files</option><option value="hr" ${C.covers === 'hr' ? 'selected' : ''}>Personnel files only</option></select></div></div>
        <div class="field"><label for="cn-by">Conducted by</label><input class="input" id="cn-by" placeholder="Office and P/NO" value="${esc(C.by)}" data-cn="by"></div>
        <button class="btn btn-primary" data-act="censusStart">${ic('plus')} Start a new census</button>
        <h3 style="margin:22px 0 10px">Censuses</h3>
        ${list.length ? `<div class="results">${list.map(c => `<button class="result card ${cur && cur.id === c.id ? 'on' : ''}" data-act="censusOpen" data-id="${c.id}"><span class="pg">${ic('checkCircle')}</span><div><b>${esc(c.title)}</b><small>${fmtDay(c.date)} · ${c.closed ? 'Closed' : 'Open for checking'}</small></div></button>`).join('')}</div>` : '<p class="muted">No censuses yet.</p>'}
      </aside>
      ${detail}
    </div>`;
}
function censusMarkModal(c, i, k) {
  const it = c.items[i], f = getFile(it.fileId);
  modal(`${mHead(k === 'FOUND' ? 'check' : 'x', k === 'FOUND' ? 'File found' : 'File missing', `${esc(f.ref)} — ${esc(f.name)}`)}
    <div class="modal-b">${k === 'FOUND' ? `<div class="field"><label for="cm-at">Where was the file found? (room, cabinet, shelf)</label><input class="input" id="cm-at" value="${esc(it.foundAt || it.recorded)}"></div>` : `<div class="field"><label for="cm-rem">Remarks (optional):</label><input class="input" id="cm-rem" value="${esc(it.remarks || '')}"></div>`}
      <div class="field"><label for="cm-off">Name of the inventory officer:</label><input class="input" id="cm-off" value="${esc(it.officer || me().name)}"></div></div>
    <div class="modal-f"><button class="btn btn-light" data-act="close">Cancel</button><button class="btn btn-primary" data-act="censusMarkSave" data-c="${c.id}" data-i="${i}" data-k="${k}">${ic('check')} Save</button></div>`, '', k === 'FOUND' ? '#cm-at' : '#cm-rem');
}

/* ==========================================================================
   Upload (Single / Bulk / From Email, two steps)
   ========================================================================== */
const MAILBOX = [
  { id: 'e1', from: 'Clerk of the Senate', subject: 'Follow-up: Senate Health Committee', att: 'Senate_followup.pdf' },
  { id: 'e2', from: 'Kenyatta National Hospital', subject: 'Request for cold-chain equipment', att: 'KNH_request.pdf' },
  { id: 'e3', from: 'CodexAI Company Limited', subject: 'EDRMS training attendance list', att: 'Attendance.xlsx' },
];
const CONF_LEVELS = ['Public', 'Internal', 'Confidential', 'Secret'];
const AI_PHASES = n => [`Importing ${n}`, 'Reading the text (OCR)', 'Finding the sender, reference, dates and subject (AI)', 'Checking for duplicates and related folios'];
const ORGS = [[/knh|kenyatta/i, 'Kenyatta National Hospital', 'KNH'], [/senate/i, 'Clerk of the Senate', 'SEN'], [/nys|youth/i, 'National Youth Service', 'NYS'], [/codex|attendance|edrms/i, 'CodexAI Company Limited', 'CDX'], [/invoice|acme|delivery/i, 'ACME Company Ltd', 'ACME'], [/mbagathi/i, 'Mbagathi Hospital', 'MBH'], [/kemsa|supplies/i, 'Kenya Medical Supplies Authority', 'KEMSA'], [/treasury|budget/i, 'The National Treasury', 'TNT'], [/who\b|world health/i, 'World Health Organization', 'WHO']];
const isoDay = d => new Date(Date.now() - d * 864e5).toISOString().slice(0, 10);
const sentence = t => t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : t;
/* Simulated OCR + AI: reads the file name, the email it came from and the file it is going into */
function aiExtract(x, f) {
  const h = [...x.name].reduce((a, c) => a + c.charCodeAt(0), 0);
  const mail = MAILBOX.find(m => m.id === x.id);
  const org = ORGS.find(o => o[0].test(x.name + ' ' + (mail?.from || '')));
  const base = x.name.replace(/\.[^.]+$/, '').replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
  let subj = mail?.subject || sentence(org ? base.replace(new RegExp(`\\b${org[2]}\\b`, 'i'), '').replace(/\s+/g, ' ').trim() || base : base);
  if (subj.split(' ').length < 2) subj = sentence(`${subj} – ${org ? 'letter from ' + org[1] : 'correspondence'}`);
  const source = mail?.from || org?.[1] || '';
  const abbr = org?.[2] || (source ? initials(source) : 'REF');
  const words = subj.toLowerCase().split(/\W+/).filter(w => w.length > 4);
  const xrefs = S.files.flatMap(ff => ff.docs.map(d => ({ ff, d }))).filter(({ d }) => words.some(w => (d.title + ' ' + (d.subject || '')).toLowerCase().includes(w))).slice(0, 2).map(({ d }) => d.id);
  const conf = /confidential|contract|salary|disciplin/i.test(x.name) ? 'Confidential' : (f?.confidentiality || 'Internal');
  const sugg = { subject: mail ? 97 : 86 + h % 10, sender_ref_no: 78 + h % 15, sender_ref_date: 74 + h % 18 };
  if (source) sugg.source_name = mail ? 98 : 88 + h % 9;
  if (xrefs.length) sugg.cross_refs = 70 + h % 20;
  if (conf !== (f?.confidentiality || 'Internal')) sugg.confidentiality_level = 72;
  const ext = (x.name.split('.').pop() || 'pdf').toUpperCase();
  return {
    serial_no: '', date_received: isoDay(0), source_name: source, sender_ref_no: `${abbr}/ADM/${10 + h % 80}/${1 + h % 30}`, sender_ref_date: isoDay(2 + h % 6),
    subject: subj, folio_no: '', confidentiality_level: conf, restricted: [], cross_refs: xrefs, enclosures: [],
    _suggested: sugg, _touched: {}, _ocr: 88 + h % 11, _pages: ext === 'PDF' ? 1 + h % 4 : 1, _ext: ext,
    _summary: `${ext === 'XLSX' ? 'A spreadsheet' : 'A letter'} from ${source || 'a sender the AI could not read'} about ${subj.toLowerCase()}.${xrefs.length ? ` It looks related to ${plural(xrefs.length, 'earlier folio')}.` : ''}`,
  };
}
/* The live system's own check, word for word */
function validateMeta(m) {
  if (!m.date_received) return 'Date Received is required.';
  if (!m.source_name.trim()) return 'Received From is required.';
  if (!m.subject.trim()) return 'Subject is required.';
  if (m.enclosures.some(e => !e.description.trim() && (e.quantity.trim() || e.kept_at.trim()))) return 'Give each physical enclosure a description, or remove it.';
  if (m.serial_no !== '' && !(Number(m.serial_no) >= 1)) return 'S/NO must be a positive number, or left blank to auto-generate.';
  return null;
}
const docById = id => { for (const f of S.files) { const d = f.docs.find(x => x.id === id); if (d) return { f, d }; } return null; };
function viewUpload(q) {
  const head = sub => pageHead({ crumbs: [['Upload File']], back: ['Back to Overview', '#/'], title: 'Upload Document', sub });
  const u = ui.upload;
  if (q.file && !u.fileId) u.fileId = q.file;
  const f = getFile(u.fileId);
  const total = S.files.reduce((a, ff) => a + ff.docs.length, 0);
  const fileOpts = `<option value="">Search or select file…</option>${S.files.filter(ff => !ff.draft).map(ff => `<option value="${ff.id}" ${u.fileId === ff.id ? 'selected' : ''}>${esc(ff.name)} — ${esc(ff.ref)}</option>`).join('')}`;
  let step, foot;
  if (u.step === 1) {
    step = `<div class="up-body">
      <div class="field"><label class="label" for="up-file">1. Select a File <span class="req">*</span></label><span class="hint" style="color:var(--ink-2)">Every document must be in a file</span>
        <div style="display:flex;gap:10px;flex-wrap:wrap"><select class="select" id="up-file" style="flex:1;min-width:220px" data-change="uploadFile">${fileOpts}</select><button class="btn btn-glass btn-sm" style="height:46px" data-act="newFile">${ic('folderPlus')} New File</button></div></div>
      ${u.tab === 'email' ? `<div class="field"><span class="label">2. Pick emails to import</span><span class="hint" style="color:var(--ink-2)">Attachments become documents in the file</span>
        <div class="results">${MAILBOX.map(m => `<label class="result card" style="cursor:pointer"><input type="checkbox" data-change="mailPick" value="${m.id}" ${u.files.some(x => x.id === m.id) ? 'checked' : ''}><span class="pg">${ic('mail')}</span><div><b>${esc(m.subject)}</b><small>${esc(m.from)} · ${esc(m.att)}</small></div></label>`).join('')}</div></div>`
      : `<div class="field"><span class="label">2. Add Document${u.tab === 'bulk' ? 's' : ''}</span><span class="hint" style="color:var(--ink-2)">${u.tab === 'bulk' ? 'Drop several files at once – each becomes its own folio' : 'OCR and AI start as soon as the import finishes.'}</span>
        <label class="dropzone" id="dropzone"><input type="file" class="sr" data-change="pickUpload" ${u.tab === 'bulk' ? 'multiple' : ''} accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,.txt">
          ${u.files.length ? `<div style="display:grid;gap:8px">${u.files.map(x => `<div class="file-chosen">${ic('file')}<div><b>${esc(x.name)}</b><br><small class="muted">${esc(x.size)}</small></div></div>`).join('')}<span class="hint">Click to choose different file${u.tab === 'bulk' ? 's' : ''}</span></div>`
          : `<div><div class="cloud"><span>${ic('arrowUp')}</span></div><p>Drop file here or click to browse</p><p class="muted">PDF, DOCX, XLSX, PNG, JPG up to 100 MB</p></div>`}
        </label></div>`}
      ${u.err ? `<p class="form-err" role="alert">${esc(u.err)}</p>` : ''}
    </div>`;
    foot = `<button class="btn btn-light" data-act="upCancel">Cancel</button><button class="btn btn-primary" data-act="upNext">Save &amp; Proceed ${ic('arrowR')}</button>`;
  } else if (u.step === 'ai') {
    const ph = AI_PHASES(u.files.length === 1 ? u.files[0].name : plural(u.files.length, 'document'));
    step = `<div class="ai-run" aria-live="polite"><div class="ai-orb">${ic('sparkles')}</div><h3>Reading your document${u.files.length > 1 ? 's' : ''}</h3><p class="muted" style="margin:0">OCR and AI start as soon as the import finishes. You can check everything on the next step.</p>
      <ol class="ai-steps">${ph.map((t, i) => `<li class="${i < u.phase ? 'done' : i === u.phase ? 'run' : ''}"><span class="st">${i < u.phase ? ic('check') : ''}</span>${esc(t)}</li>`).join('')}</ol></div>`;
    foot = `<button class="btn btn-light" data-act="upBack">${ic('chevL')} Back</button>`;
  } else {
    const m = u.metas[u.idx], x = u.files[u.idx], n = u.files.length;
    const ai = k => m._suggested[k] && !m._touched[k] ? `<span class="ai-chip" title="Suggested by AI from the document">${ic('sparkles')} AI · ${m._suggested[k]}%</span>` : '';
    const cls = k => m._suggested[k] && !m._touched[k] ? 'ai' : '';
    const nAi = Object.keys(m._suggested).filter(k => !m._touched[k]).length;
    const restrictedUi = ['Confidential', 'Secret'].includes(m.confidentiality_level);
    const allDocs = S.files.flatMap(ff => ff.docs.map(d => ({ ff, d }))).filter(({ d }) => !m.cross_refs.includes(d.id));
    step = `<div class="det">
      <aside class="det-prev">
        <div class="prev-card">${x.url ? `<img src="${x.url}" alt="Preview of ${esc(x.name)}">` : `<div class="page"><div class="folio-box"><b>Folio ${esc(m.folio_no || nextFolio(f))}</b>${esc(m._ext)}</div><div class="content">${tplHTML('letter', { ref: m.sender_ref_no, date: (m.sender_ref_date || m.date_received) + 'T09:00', to: 'The Principal Secretary, State Department for Medical Services', subject: (m.subject || '').toUpperCase(), body: LOREM.slice(0, 3), signer: { name: 'Authorised Officer', title: 'For: ' + (m.source_name || '—') }, signed: false, org: m.source_name || 'Sender' })}</div></div>`}
          <div class="cap"><span>${esc(x.name)}</span><span>${plural(m._pages, 'page')}</span></div></div>
        <div class="ai-box"><b>${ic('sparkles')} AI summary</b><p>${esc(m._summary)}</p><small>OCR confidence ${m._ocr}% · going into ${esc(f?.name || '')}</small></div>
      </aside>
      <div class="det-form">
        ${n > 1 ? `<div class="pager"><button class="btn btn-light btn-sm btn-icon" data-act="upDoc" data-d="-1" ${u.idx === 0 ? 'disabled' : ''} aria-label="Previous document">${ic('chevL')}</button>Document ${u.idx + 1} of ${n} <span class="muted">· ${esc(x.name)}</span><button class="btn btn-light btn-sm btn-icon" data-act="upDoc" data-d="1" ${u.idx === n - 1 ? 'disabled' : ''} aria-label="Next document">${ic('chevR')}</button></div>` : ''}
        ${nAi ? `<div class="ai-banner">${ic('sparkles')} AI filled ${plural(nAi, 'field')} from the document. Check ${nAi === 1 ? 'it' : 'them'} before saving.</div>` : ''}
        <div class="two"><div class="field"><label for="um-serial_no">S/NO</label><input class="input" id="um-serial_no" data-um="serial_no" inputmode="numeric" value="${esc(m.serial_no)}" placeholder="Auto"><span class="hint">Leave blank to auto-generate.</span></div>
          <div class="field"><label for="um-date_received">Date Received <span class="req">*</span></label><input class="input" type="date" id="um-date_received" data-um="date_received" value="${esc(m.date_received)}"></div></div>
        <div class="field"><label for="um-source_name">Received From <span class="req">*</span> ${ai('source_name')}</label><input class="input ${cls('source_name')}" id="um-source_name" data-um="source_name" value="${esc(m.source_name)}" placeholder="e.g. Kenyatta National Hospital" list="um-senders" autocomplete="off"><datalist id="um-senders">${S.senders.filter(x => x.on).map(x => `<option value="${esc(x.name)}"></option>`).join('')}</datalist></div>
        <div class="two"><div class="field"><label for="um-sender_ref_no">Sender's Ref No ${ai('sender_ref_no')}</label><input class="input ${cls('sender_ref_no')}" id="um-sender_ref_no" data-um="sender_ref_no" value="${esc(m.sender_ref_no)}" placeholder="e.g. KNH/ADM/22/14"></div>
          <div class="field"><label for="um-sender_ref_date">Sender's Ref Date ${ai('sender_ref_date')}</label><input class="input ${cls('sender_ref_date')}" type="date" id="um-sender_ref_date" data-um="sender_ref_date" value="${esc(m.sender_ref_date)}"></div></div>
        <div class="field"><label for="um-subject">Subject <span class="req">*</span> ${ai('subject')}</label><input class="input ${cls('subject')}" id="um-subject" data-um="subject" value="${esc(m.subject)}"></div>
        <div class="two"><div class="field"><label for="um-folio_no">Folio No</label><input class="input" id="um-folio_no" data-um="folio_no" inputmode="numeric" value="${esc(m.folio_no)}" placeholder="Next: ${esc(String(+nextFolio(f) + u.idx))}"></div>
          <div class="field"><label for="um-confidentiality_level">Confidentiality Level ${ai('confidentiality_level')}</label><select class="select ${cls('confidentiality_level')}" id="um-confidentiality_level" data-change="umConf">${CONF_LEVELS.map(c => `<option ${m.confidentiality_level === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div></div>
        ${restrictedUi ? `<div class="field"><span class="label">Restricted to <span class="muted" style="font-weight:500">(optional – only these people can open it)</span></span><div class="restrict">${Object.values(PEOPLE).map(pp => `<label><input type="checkbox" data-change="umRestrict" value="${pp.id}" ${m.restricted.includes(pp.id) ? 'checked' : ''}> ${esc(pp.name)}</label>`).join('')}</div></div>` : ''}
        <div class="field"><span class="label">Cross-references ${ai('cross_refs')}</span>
          <div class="x-chips">${m.cross_refs.map(id => { const r = docById(id); return r ? `<span class="x-chip ${cls('cross_refs')}">${esc(r.f.name)} · F.${esc(r.d.folio)} ${esc(r.d.title)}<button data-act="rmXref" data-id="${id}" aria-label="Remove cross-reference">${ic('x')}</button></span>` : ''; }).join('') || '<span class="hint">None yet.</span>'}</div>
          <select class="select" data-change="addXref" aria-label="Add a cross-reference"><option value="">Add a cross-reference to another document…</option>${allDocs.map(({ ff, d }) => `<option value="${d.id}">${esc(ff.name)} · F.${esc(d.folio)} – ${esc(d.title)}</option>`).join('')}</select></div>
        <div class="field"><span class="label">Physical enclosures</span>
          ${m.enclosures.map((e, i) => `<div class="enc-row"><input class="input" data-enc="${i}:description" value="${esc(e.description)}" placeholder="Description" aria-label="Enclosure ${i + 1} description"><input class="input" data-enc="${i}:quantity" value="${esc(e.quantity)}" placeholder="Quantity" aria-label="Enclosure ${i + 1} quantity"><input class="input" data-enc="${i}:kept_at" value="${esc(e.kept_at)}" placeholder="Kept at" aria-label="Enclosure ${i + 1} kept at"><button class="btn btn-light btn-sm btn-icon" data-act="rmEnc" data-i="${i}" aria-label="Remove enclosure">${ic('trash')}</button></div>`).join('')}
          <button class="btn btn-outline btn-sm" style="justify-self:start" data-act="addEnc">${ic('plus')} Add enclosure</button></div>
        ${u.err ? `<p class="form-err" role="alert">${esc(u.err)}</p>` : ''}
      </div>
    </div>`;
    foot = `<button class="btn btn-light" data-act="upBack">${ic('chevL')} Back</button><button class="btn btn-light" data-act="upCancel">Cancel</button><button class="btn btn-primary" data-act="upSave">${ic('check')} Save ${n > 1 ? plural(n, 'document') : 'document'}</button>`;
  }
  const s2 = u.step !== 1;
  return head(`${plural(S.files.length, 'File')} · ${plural(total, 'Document')}${S.drafts.length ? ` · <a style="color:#fff;text-decoration:underline" href="#" data-act="openDrafts">${plural(S.drafts.length, 'draft')}</a>` : ''}`) + `
    <div class="upload-wrap">
      <div class="up-tabs" role="tablist">${[['single', 'file', 'Single Document'], ['bulk', 'layers', 'Bulk Upload'], ['email', 'mail', 'Upload From Email']].map(([k, i, l]) => `<button class="${u.tab === k ? 'on' : ''}" data-act="upTab" data-k="${k}" ${s2 ? 'disabled' : ''}>${ic(i)} <span>${l}</span></button>`).join('')}</div>
      <section class="up-card glass">
        <div class="stepper"><span class="bar" style="width:${s2 ? 'calc(100% - 140px)' : '0'}"></span><div class="s on"><i>1</i>File &amp; Document</div><div class="s ${s2 ? 'on' : ''}"><i>2</i>Details</div></div>
        ${step}
        <div class="up-foot">${foot}</div>
      </section>
    </div>`;
}
function runAI() {
  const u = ui.upload; u.step = 'ai'; u.phase = 0; render();
  const tick = () => {
    if (ui.upload !== u || u.step !== 'ai') return;
    u.phase++;
    if (u.phase >= 4) { const f = getFile(u.fileId); u.metas = u.files.map(x => aiExtract(x, f)); u.idx = 0; u.err = ''; u.step = 2; render(); toast('Details filled in from the document – check them before saving'); return; }
    if (parseHash().parts[0] === 'upload') render();
    setTimeout(tick, 700);
  };
  setTimeout(tick, 700);
}
function filedModal(f, docs) {
  const one = docs.length === 1, d = docs[0];
  closeModal();
  const o = document.createElement('div'); o.className = 'overlay'; o.id = 'overlay';
  o.innerHTML = `<div class="modal confirm" role="dialog" aria-modal="true" aria-labelledby="fd-t"><span class="ic ok">${ic('check')}</span><h3 id="fd-t">Document${one ? '' : 's'} filed</h3>
    <p>${one ? `“${esc(d.title)}” is now folio ${esc(d.folio)} in ${esc(f.name)}.` : `${docs.length} documents are now folios ${esc(docs[0].folio)}–${esc(docs[docs.length - 1].folio)} in ${esc(f.name)}.`}</p>
    <div class="row"><button class="btn btn-outline" data-act="upDash">Back to dashboard</button><button class="btn btn-primary" data-act="upGoFile" data-f="${f.id}" data-d="${d.id}">${ic('folder')} Proceed to file</button></div>
    ${one ? `<button class="link-btn" data-act="upSign" data-f="${f.id}" data-d="${d.id}">${ic('stamp')} Sign or stamp it first</button>` : ''}</div>`;
  document.body.appendChild(o); o.querySelector('.btn-primary').focus();
}

/* ==========================================================================
   User guide & settings
   ========================================================================== */
function viewGuide() {
  const mode = ui.guideMode || 'guide';
  const sw = `<div class="qb qb-seg qb-manual-switch" role="group" aria-label="User Manual"><button type="button" aria-pressed="${mode === 'guide'}" data-act="guideMode" data-k="guide">${ic('book')} Guide</button><button type="button" aria-pressed="${mode === 'tour'}" data-act="guideMode" data-k="tour">${ic('play')} Tutorial mode</button></div>`;
  if (mode === 'tour') {
    return pageHead({ crumbs: [['User Manual']], title: 'User Manual', sub: 'Tutorial mode walks you through each journey on the real screens.' }) + `
      <div class="manual-wrap">${sw}
      <section class="tour-list">${TUTORIAL.map((j, n) => `<article class="tour-card glass">
        <button class="tour-thumb" data-act="tutPage" data-id="${j.id}" aria-label="Screenshots of ${esc(j.title)}"><img src="${tutShot(j.steps[0])}" alt="" loading="lazy"></button>
        <div class="tour-card__b"><span class="chip t-blue">${esc(j.who)}</span><h3>${esc(j.title)}</h3><p>${plural(j.steps.length, 'step')} · ${esc(j.summary)}</p>
          <div class="tour-card__btns"><button class="btn btn-primary btn-sm" data-act="tourStart" data-id="${j.id}">${ic('play')} Start</button><button class="btn btn-light btn-sm" data-act="tutPage" data-id="${j.id}">${ic('image')} Screenshots</button></div></div>
      </article>`).join('')}</section>
      <a class="btn btn-outline open-tut" href="#/tutorial">${ic('book')} Open the full tutorial</a></div>`;
  }
  const t = ui.guideQ.trim().toLowerCase();
  const strip = h => h.replace(/<[^>]+>/g, ' ').toLowerCase();
  const secs = GUIDE.filter(g => !t || g.title.toLowerCase().includes(t) || strip(g.body).includes(t));
  const re = t ? new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi') : null;
  const hl = h => re ? h.replace(/>([^<]+)</g, (m, txt) => '>' + txt.replace(re, x => `<mark>${x}</mark>`) + '<') : h;
  return pageHead({ crumbs: [['User Manual']], title: 'User Manual', sub: 'How to use EDRMS, role by role.', right: `<label class="input-icon" style="min-width:260px">${ic('search')}<input class="input" id="guide-q" data-input="guideQ" value="${esc(ui.guideQ)}" placeholder="Search the guide…"><span class="sr">Search the guide</span></label>` }) + `
    <div class="manual-wrap">${sw}
    <div class="guide">
      <nav class="guide-toc glass">${GUIDE.map(g => `<a href="#" data-act="guideGo" data-id="${g.id}">${ic(g.icon)} ${g.title}</a>`).join('')}</nav>
      <div class="guide-body glass">${secs.length ? secs.map(g => `<article id="g-${g.id}"><h2><span class="ic">${ic(g.icon)}</span>${g.title}</h2>${hl(g.body)}</article>`).join('') : '<p class="muted">Nothing in the guide matches that. Try Q-BITS AI → Chat.</p>'}</div>
    </div></div>`;
}
/* ==========================================================================
   Tutorial page (/tutorial): every journey, step by step, with screenshots
   ========================================================================== */
const tutShot = st => `assets/tutorial/${st.id}.webp`;
function viewTutorial(id) {
  const J = TUTORIAL.find(j => j.id === id) || TUTORIAL[0], n = TUTORIAL.indexOf(J), next = TUTORIAL[n + 1];
  return pageHead({ crumbs: [['User Manual', '#/guide'], ['User Tutorial']], title: 'User Tutorial', sub: 'The main journeys in EDRMS, with a screenshot of every step.', back: ['Back to User Manual', '#/guide'] }) + `
    <div class="tut-page">
      <nav class="tut-nav glass" aria-label="Journeys">${TUTORIAL.map(j => `<a href="#/tutorial/${j.id}" class="${j === J ? 'on' : ''}" ${j === J ? 'aria-current="page"' : ''}><span class="mi">${ic(j.icon)}</span><span><b>${esc(j.title)}</b><small>${esc(j.who)} · ${plural(j.steps.length, 'step')}</small></span></a>`).join('')}</nav>
      <div class="tut-main">
        <section class="tut-intro glass"><div><span class="chip t-blue">${esc(J.who)}</span><h2>${esc(J.title)}</h2><p>${plural(J.steps.length, 'step')} · ${esc(J.summary)}.${J.role && J.role !== role() ? ` Starting it signs you in as the ${esc(J.who)} demo account.` : ''}</p></div>
          <button class="btn btn-primary" data-act="tourStart" data-id="${J.id}">${ic('play')} Walk me through it</button></section>
        ${J.steps.map((st, k) => `<article class="tut-step card" id="ts-${st.id}">
          <div class="tut-step__t"><span class="n">${k + 1}</span><div><h3>${esc(st.title)}</h3><p>${esc(st.text)}</p>
            <button class="link-btn" data-act="tourStart" data-id="${J.id}" data-step="${k}">${ic('arrowR')} Try this step in the system</button></div></div>
          <button class="tut-step__shot" data-act="tutZoom" data-src="${tutShot(st)}" data-title="${esc(st.title)}" aria-label="Enlarge screenshot: ${esc(st.title)}"><img src="${tutShot(st)}" alt="Screenshot: ${esc(st.title)}" loading="lazy"></button>
        </article>`).join('')}
        ${next ? `<a class="tut-next glass" href="#/tutorial/${next.id}"><span>Next</span><b>${esc(next.title)} ${ic('arrowR')}</b></a>` : `<a class="tut-next glass" href="#/guide"><span>Finished</span><b>Back to the User Manual ${ic('arrowR')}</b></a>`}
      </div>
    </div>`;
}
/* Start the Q-BITS Tour on the live screens. Role journeys sign in as that demo account first. */
function startTour(id, step = 0) {
  const J = TUTORIAL.find(j => j.id === id); if (!J || !window.QBits) return;
  closeModal(); setFab(false);
  if (J.role && J.role !== role()) { S.session = J.role; save(); toast(`Signed in as ${person(ACCOUNTS[J.role]).name} (${ROLE_LABEL[J.role]}) for this tutorial`); }
  const by = st => S.files.find(f => !f.draft && f.stage === st && (st !== 'marking' || f.withUser === meId()) && (st !== 'action' || f.withUser === meId()))?.id || S.files.find(f => !f.draft && f.stage === st)?.id || S.files[0].id;
  const ids = { reg: by('registry'), mk: by('marking'), ac: by('action'), ra: by('returned_action') };
  const journey = { id: J.id, title: J.title, steps: J.steps.map(st => ({ ...st, shot: tutShot(st), path: st.path.replace(/\{(\w+)\}/g, (_, k) => ids[k]) })) };
  render();
  QBits.tour(journey, { step, navigate: p => go('#' + p), location: () => '/' + parseHash().parts.join('/') });
}

function viewSettings() {
  const p = me();
  const dark = theme === 'dark';
  const reg = role() === 'registry';
  const more = [
    ['listChecks', 'My Queue', 'Files and notes waiting for you', '#/queue', myQueue().length + notesForMe().length],
    ['upload', 'Upload Document', 'Add a file, letter or document', '#/upload'],
    ['calendar', 'Bring Up Diary', 'Files needed again on a date', '#/bringup', bringupsDue().length],
    ['bell', 'Notifications', 'Everything sent to you', 'openNotifs', unread()],
    ['book', 'User Guide', 'How the system works', '#/guide'],
    ['swap', 'Movement Sheets', 'Where every file has been', '#/movements'],
    ...(reg ? [['layers', 'Files & Records', 'Open, close, dispose', '#/records'], ['users', 'Mail Senders', 'Names used in the mail registers', '#/senders']] : []),
  ];
  return pageHead({ crumbs: [['Settings']], title: 'Settings', sub: 'Your tools, profile and appearance.' }) + `
  <section class="panel glass" style="max-width:820px">
    <div class="panel-h"><h2>Pages and tools</h2></div>
    <div class="more-grid">${more.map(([i, l, sub, h, c]) => `${h.startsWith('#') ? `<a class="more-it" href="${h}">` : `<button class="more-it" data-act="${h}">`}<span class="mi">${ic(i)}</span><span><b>${l}</b><small>${sub}</small></span>${c ? `<span class="count">${c}</span>` : ''}${h.startsWith('#') ? '</a>' : '</button>'}`).join('')}</div>
  </section>
  <section class="panel glass" style="max-width:820px">
    <div class="panel-h"><h2>Appearance</h2></div>
    <div class="appearance">
      ${themeToggle('qb-theme-toggle--lg')}
      <p class="muted">Switch between light and dark. Letters and file covers stay as they are on paper.</p>
    </div>
  </section>
  <section class="panel glass" style="max-width:820px">
    <div style="display:flex;gap:16px;align-items:center;margin-bottom:18px">${avatar(meId(), 'av-lg')}<div><b style="font-size:18px">${esc(p.name)}</b><div class="muted">${esc(p.title)} · ${ROLE_LABEL[role()]}</div></div></div>
    <dl class="kv"><dt>Department</dt><dd>${esc(p.dept)}</dd><dt>Registry</dt><dd>${regName(p.registry)}</dd><dt>Role (from ERP)</dt><dd>${ROLE_LABEL[role()]}</dd><dt>Data scope</dt><dd>${role() === 'registry' ? 'All registries' : role() === 'action' ? 'Your registry · files routed to you' : 'Files sent to you'}</dd></dl>
  </section>
  <section class="panel glass" style="max-width:820px">
    <div class="panel-h"><h2>Reported issues</h2><span class="n">${S.issues.length}</span><div class="right"><button class="btn btn-light btn-sm" data-act="fabCapture">${ic('scan')} Capture screen</button></div></div>
    ${S.issues.length ? S.issues.map(x => `<div class="card issue-row">${x.img ? `<img src="${x.img}" alt="Screenshot of the reported issue">` : ''}<div><span class="chip ${x.type === 'Error' ? 't-red' : x.type === 'Question' ? 't-blue' : 't-green'}">${esc(x.type)}</span> <small class="muted">${fmtDT(x.at)} · ${esc(x.page)}</small><p style="margin:6px 0 0">${esc(x.text)}</p></div></div>`).join('') : '<p class="muted" style="margin:0">Nothing reported yet. Use Q-BITS AI → Capture screen when something looks wrong.</p>'}
  </section>
  <section class="panel glass" style="max-width:820px">
    <h3 style="margin:0 0 6px">Mockup data</h3>
    <p class="muted" style="margin:0 0 14px;font-size:14px">Everything you do in this mockup is kept in this browser only. Reset to start the journeys again.</p>
    <button class="btn btn-light" data-act="reset">${ic('refresh')} Reset demo data</button>
  </section>`;
}

/* ==========================================================================
   Modals
   ========================================================================== */
function modal(html, cls = '', focus) {
  closeModal();
  const o = document.createElement('div'); o.className = 'overlay'; o.id = 'overlay';
  o.innerHTML = `<div class="modal ${cls}" role="dialog" aria-modal="true">${html}</div>`;
  o.addEventListener('mousedown', e => { if (e.target === o) closeModal(); });
  document.body.appendChild(o);
  const first = (focus && o.querySelector(focus)) || o.querySelector('input:not([type=hidden]):not([type=checkbox]):not(.sr), textarea');
  first?.focus({ preventScroll: true });
}
function closeModal() { $('#overlay')?.remove(); $('#drawer')?.remove(); }
const mHead = (icon, title, sub) => `<div class="modal-h">${icon ? `<span class="mh-ic">${ic(icon)}</span>` : ''}<div><h3>${title}</h3>${sub ? `<p>${sub}</p>` : ''}</div><button class="btn btn-light btn-icon btn-sm x" data-act="close" aria-label="Close">${ic('x')}</button></div>`;
const peopleOpts = (filter, sel) => Object.values(PEOPLE).filter(filter).map(p => `<option value="${p.id}" ${sel === p.id ? 'selected' : ''}>${esc(p.name)} — ${esc(p.title)}</option>`).join('');
function toast(text) {
  let w = $('.toast-wrap'); if (!w) { w = document.createElement('div'); w.className = 'toast-wrap'; document.body.appendChild(w); }
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.innerHTML = `${ic('checkCircle')} ${esc(text)}`;
  w.appendChild(t); while (w.children.length > 2) w.firstChild.remove(); setTimeout(() => t.remove(), 3200);
}

/* --- New File: form on the left, the real cover on the right --- */
function nfFile() {
  const nf = ui.newFile;
  return { id: 'nf', name: nf.name || 'Subject of the file', ref: nf.ref || (nf.series ? nextInSeries(nf.series) : ''), vol: nf.vol, type: nf.type, cover: { color: nf.color, dept: nf.dept, h1: nf.h1, h2: nf.h2 }, movements: [] };
}
const VIS_LABEL = { organization: 'Organization', department: 'Department', personal: 'Personal' };
/* Who can see a file, as set in New File: everyone, one department, or only the person who made it */
const canSee = f => f.visibility === 'personal' ? f.createdBy === meId() : f.visibility === 'department' ? (f.scopeDept || '') === me().dept || f.createdBy === meId() || role() === 'registry' : true;
function newFileModal() {
  const nf = ui.newFile || (ui.newFile = { type: 'ordinary', color: 'blue', visibility: 'organization', name: '', vol: '', ref: '', series: '', desc: '', dept: '', h1: '', h2: '', reg: me().registry || 'main', conf: 'Internal', cab: '', shelf: '', parent: '', scopeDept: me().dept || '', req: '', err: '' });
  const ty = nf.type === 'ty', parent = nf.parent && getFile(nf.parent);
  const reqs = S.recReqs.filter(q => q.type === 'OPEN' && q.status === 'Approved' && !q.fileId);
  const showSeries = !ty && nf.visibility !== 'personal' && !nf.ref.trim();
  const inp = (k, ph, label) => `<input class="input" id="nf-${k}" data-nf="${k}" value="${esc(nf[k])}" placeholder="${ph}" aria-label="${label}">`;
  modal(`${mHead('folderPlus', 'New File', 'Open a new file. The cover you set up here is the one used on the file.')}
    <div class="modal-b"><div class="nf"><div style="display:grid;gap:16px">
      <div class="mstep"><div class="mstep-h"><i>1</i> The file</div>
        <div class="seg solid" style="width:100%">${[['ordinary', 'Ordinary file', 'folder'], ['ty', 'Temporary file (TY)', 'clock']].map(([k, l, i]) => `<button style="flex:1" class="${nf.type === k ? 'on' : ''}" data-act="nfType" data-k="${k}">${ic(i)} ${l}</button>`).join('')}</div>
        <div class="two" style="grid-template-columns:2fr 1fr"><div class="field"><label for="nf-name">Name / Subject <span class="req">*</span></label>${inp('name', 'e.g., Records management operations', 'Name')}</div><div class="field"><label for="nf-vol">Volume</label>${inp('vol', 'e.g., 1 or IV', 'Volume')}</div></div>
        ${ty ? `<div class="field"><label for="nf-req">Approved temporary-file request <span class="req">*</span></label>${reqs.length ? `<select class="select" id="nf-req" data-change="nfReq"><option value="">Choose the approved request…</option>${reqs.map(q => `<option value="${q.id}" ${nf.req === q.id ? 'selected' : ''}>${esc(q.subject)} — ${esc(q.series)}</option>`).join('')}</select><span class="hint">Each request opens one file. It is Confidential, and the reference number is fixed by the request.</span>`
          : `<p class="form-note">There is no approved temporary-file request waiting for its file. Ask for one under <a href="#/records" data-act="close">Files and records → Requests</a> (Open a new temporary file).</p>`}</div>` : ''}
        <div class="two"><div class="field"><label for="nf-ref">Reference No.</label><input class="input" id="nf-ref" data-nf="ref" value="${esc(nf.ref)}" placeholder="${ty ? 'Given by the approved request' : 'e.g., MOH/ADM/1/1/43'}" aria-label="Reference number" ${ty ? 'readonly' : ''}><span class="hint">${ty ? 'Fixed when the request was approved.' : 'The registry number on the file. Must be unique.'}</span></div>
          <div class="field" id="nf-series-wrap" ${showSeries ? '' : 'hidden'}><label for="nf-series">…or the next number in a series</label>${inp('series', 'e.g., MOH/ADM/1/1', 'Series')}<span class="hint">No approval needed - you open the file yourself.</span></div></div>
        <div class="field"><label for="nf-desc">Description <span class="muted" style="font-weight:500">(optional)</span></label><textarea class="textarea" id="nf-desc" data-nf="desc" placeholder="What this file contains">${esc(nf.desc)}</textarea></div>
      </div>
      <div class="mstep"><div class="mstep-h"><i>2</i> File cover <small>See it take shape on the right</small></div>
        <div class="field"><label for="nf-dept">Department</label>${inp('dept', 'e.g., HQS - Administration', 'Department')}<span class="hint">Written on the "Department" line of the cover.</span></div>
        <div class="field"><span class="label">Cover colour</span><div class="swatches" id="nf-sw">${swatches(nf.color, 'nfColour')}</div><div class="sw-name" id="nf-swname">${coverColour(nf.color).name}</div></div>
        <div class="field"><span class="label">Header wording <span class="muted" style="font-weight:500">(optional)</span></span><div class="two">${inp('h1', 'Republic of Kenya', 'First header line')}${inp('h2', 'Ministry of Health', 'Second header line')}</div><span class="hint">Leave both empty to use the usual wording. Fill them only for a file that differs, for example a county government.</span></div>
      </div>
      <div class="mstep"><div class="mstep-h"><i>3</i> Where it sits and who can see it</div>
        <div class="field"><label for="nf-parent">Parent File <span class="muted" style="font-weight:500">(optional — leave empty to create at root)</span></label><select class="select" id="nf-parent" data-nf="parent"><option value="">Root (no parent)</option>${S.files.map(f => `<option value="${f.id}" ${nf.parent === f.id ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}</select></div>
        ${parent ? `<p class="form-note">${ic('info')} Scope inherited from parent: <span class="chip t-neutral">${esc(VIS_LABEL[parent.visibility || 'organization'])}</span></p>` : `<span class="label">Who can see it</span>
<div class="choice-row">${[['organization', 'Organization', 'Visible to everyone', 'building'], ['department', 'Department', 'Visible to your department', 'users'], ['personal', 'Personal', 'Visible only to you', 'user']].filter(([k]) => !(ty && k === 'personal')).map(([k, l, s, i]) => `<button class="choice ${nf.visibility === k ? 'on' : ''}" data-act="nfVis" data-k="${k}">${ic(i)}<b>${l}</b>${s}</button>`).join('')}</div>
        ${nf.visibility === 'department' ? `<div class="field"><label for="nf-sdept">Department <span class="req">*</span></label><select class="select" id="nf-sdept" data-change="nfScopeDept"><option value="">-- Select Department --</option>${DEPARTMENTS.map(d => `<option ${nf.scopeDept === d ? 'selected' : ''}>${esc(d)}</option>`).join('')}</select></div>` : ''}`}
        <div class="field"><label for="nf-conf">Confidentiality Level</label><select class="select" id="nf-conf" data-nf="conf" ${ty ? 'disabled' : ''}>${['Internal', 'Public', 'Confidential', 'Secret'].map(x => `<option ${nf.conf === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
      </div>
      <div class="mstep"><div class="mstep-h"><i>4</i> Physical location <small>(optional)</small></div>
        <div class="field"><label for="nf-reg">Registry</label><select class="select" id="nf-reg" data-nf="reg">${REGISTRIES.map(r => `<option value="${r.id}" ${nf.reg === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}</select></div>
        <div class="two">${inp('cab', 'Cabinet', 'Cabinet')}${inp('shelf', 'Shelf', 'Shelf')}</div>
      </div>
    </div>
    <aside class="nf-preview"><div class="h">${ic('book')} Cover preview<small>Check it before you create the file</small></div><div id="nf-cover">${coverHTML(nfFile())}</div>
      <p class="hint">${ic('info')} ${ty ? 'The reference number appears once you choose the approved request.' : 'The reference number appears once you type it or choose a series.'}</p></aside>
      ${nf.err ? `<p class="form-err" role="alert" style="grid-column:1/-1">${esc(nf.err)}</p>` : ''}
    </div></div>
    <div class="modal-f"><button class="btn btn-light" data-act="nfCancel">Cancel</button><button class="btn btn-outline" data-act="createFile" data-draft="1">${ic('fileEdit')} Save as draft</button><button class="btn btn-primary" data-act="createFile">${ic('folderPlus')} Create File</button></div>`, 'xwide', '#nf-name');
}
const paintNf = () => { const c = $('#nf-cover'); if (c) c.innerHTML = coverHTML(nfFile()); };

/* --- Registry: send file --- */
function sendModal(f, to) {
  const isMark = to === 'marking';
  if (isMark) return submitMarkingModal(f);
  modal(`${mHead('send', isMark ? 'Send to Marking Officer' : 'Send to Action Officer', `${esc(f.name)} · ${esc(f.ref)}`)}
    <div class="modal-b">
      ${!isMark && f.instruction ? `<div class="instruction" style="margin:0">${ic('sticky')}<div><b>Marked to ${esc(person(f.markedTo).name)}</b> – ${esc(f.instruction)}</div></div>` : ''}
      <div class="field"><label for="sd-to">Officer to see</label><select class="select" id="sd-to">${peopleOpts(p => p.role === (isMark ? 'marking' : 'action'), isMark ? 'vera' : (f.markedTo || 'virah'))}</select></div>
      <div class="field"><label for="sd-note">Minute <span class="muted" style="font-weight:500">(optional)</span></label><textarea class="textarea" id="sd-note" placeholder="${isMark ? 'e.g. PS to see' : 'e.g. Follow instructions from the Marking Officer'}"></textarea></div>
      <p class="hint" style="margin:0">The movement sheet on the cover will record today's date, you, and the officer to see.</p>
    </div>
    <div class="modal-f"><button class="btn btn-light" data-act="close">Cancel</button><button class="btn btn-primary" data-act="confirmSend" data-id="${f.id}" data-to="${to}">${ic('send')} Send file</button></div>`);
}
/* --- Registry: submit to the Marking Officer, choosing the letters they can see (live FileRoutingSubmit) --- */
function submitMarkingModal(f) {
  const docs = [...liveDocs(f)].sort(byFolio);
  const kept = new Set(f.keptBack || []);
  modal(`${mHead('send', 'Submit to Marking Officer', `${esc(f.name)} · ${esc(f.ref)}`)}
    <div class="modal-b">
      <p class="form-note">${ic('info')} Only the electronic file is sent - the paper file does not move with it.</p>
      <div class="field"><span class="label">Choose the letters <span class="muted" style="font-weight:500">– letters the Marking Officer can see</span></span>
        ${docs.length ? `<div class="pick-list">${docs.map(d => `<label class="pick ${kept.has(d.id) ? 'off' : ''}"><input type="checkbox" data-change="smPick" value="${d.id}" ${kept.has(d.id) ? '' : 'checked'}><span class="fno">F.${esc(d.folio)}</span><span><b>${esc(d.title)}</b><small>${esc(d.from || '')} · ${fmtDay(d.date)}</small><em>Kept back - the Marking Officer will not see it</em></span></label>`).join('')}</div>` : '<p class="muted">This file has no documents you can send.</p>'}</div>
      <div class="field"><label for="sd-to">Send to</label><select class="select" id="sd-to"><option value="">The Marking Officer role</option>${peopleOpts(p => p.role === 'marking', '')}</select><span class="hint">Leave blank to send it to the Marking Officer role.</span></div>
      <div class="field"><label for="sd-note">Comments <span class="muted" style="font-weight:500">(optional)</span></label><textarea class="textarea" id="sd-note" placeholder="e.g. PS to see"></textarea></div>
      <p class="form-err" id="sm-err" role="alert" hidden></p>
    </div>
    <div class="modal-f"><button class="btn btn-light" data-act="close">Cancel</button><button class="btn btn-primary" data-act="confirmSend" data-id="${f.id}" data-to="marking" ${docs.length ? '' : 'disabled'}>${ic('send')} Yes, send it</button></div>`, '', '#sd-to');
}
/* --- Registry: send letters outside the organisation (recorded in the Outward Mail Register) --- */
function sendOutsideModal(f, only) {
  const letters = [...liveDocs(f)].sort(byFolio).reverse();
  const pre = only ? [only] : letters.filter(d => d.kind === 'response' && !S.dispatch[d.id]).map(d => d.id);
  const recips = S.senders.filter(x => x.on);
  modal(`${mHead('send', 'Send outside the organisation', 'Recorded automatically in the Outward Mail Register.')}
    <div class="modal-b">
      <div class="field"><label for="so-to">Send to <span class="req">*</span></label><input class="input" id="so-to" list="so-senders" placeholder="Search the senders…" autocomplete="off"><datalist id="so-senders">${recips.map(x => `<option value="${esc(x.name)}"></option>`).join('')}</datalist>
        <span class="hint">Only people who are already senders in the Inward Mail Register. Add a name on <a href="#/senders" data-act="close">Mail Senders</a>.</span></div>
      <div class="three"><div class="field"><label for="so-date">Date sent</label><input class="input" type="date" id="so-date" value="${now().slice(0, 10)}"></div>
        <div class="field"><label for="so-ref">Our reference</label><input class="input mono" id="so-ref" value="${esc(f.ref)}"></div>
        <div class="field"><label for="so-how">How</label><select class="select" id="so-how">${['Hand delivery', 'Courier', 'Email', 'Post'].map(x => `<option>${x}</option>`).join('')}</select></div></div>
      <div class="field"><span class="label">Letters being sent</span>
        <div class="pick-list">${letters.map(d => `<label class="pick"><input type="checkbox" name="so-l" value="${d.id}" ${pre.includes(d.id) ? 'checked' : ''}><span class="fno">F.${esc(d.folio)}</span><span><b>${esc(d.title)}</b><small>${d.kind === 'response' ? 'Response' : esc(d.from || '')} · ${fmtDay(d.date)}${S.dispatch[d.id] ? ' · already sent' : ''}</small></span></label>`).join('')}</div></div>
      <div class="field"><label for="so-rem">Remarks <span class="muted" style="font-weight:500">(optional)</span></label><input class="input" id="so-rem"></div>
      <p class="form-err" id="so-err" role="alert" hidden></p>
    </div>
    <div class="modal-f"><button class="btn btn-light" data-act="close">Cancel</button><button class="btn btn-primary" data-act="sendOutsideSave" data-id="${f.id}">${ic('send')} Yes, send them</button></div>`, '', '#so-to');
}

/* --- Marking officer: mark file --- */
function markModal(f) {
  const lastDoc = [...liveDocs(f)].sort(byFolio).pop();
  modal(`${mHead('pen', 'Mark file', 'Record what should be done and to whom. The file goes back to the Registry.')}
    <div class="modal-b">
      <div class="field"><label for="mk-to">Action Officer</label><select class="select" id="mk-to">${peopleOpts(p => p.role === 'action', 'virah')}</select></div>
      <div class="field"><label for="mk-ins">Instruction <span class="req">*</span></label><textarea class="textarea" id="mk-ins" placeholder="e.g. Head NVS – please prepare a response by Friday"></textarea></div>
      <div class="field"><label for="mk-sticky">Sticky note for the officer <span class="muted" style="font-weight:500">(optional)</span></label><input class="input" id="mk-sticky" placeholder="e.g. Urgent"></div>
      <div class="field"><label for="mk-folio">Write the minute on</label><select class="select" id="mk-folio">${liveDocs(f).map(d => `<option value="${d.id}" ${lastDoc && d.id === lastDoc.id ? 'selected' : ''}>Folio ${esc(d.folio)} – ${esc(d.title)}</option>`).join('')}</select>
        <span class="hint">Saved with your signature as the next minute on that letter (each letter's minutes start at I). You can move it on the page afterwards.</span></div>
    </div>
    <div class="modal-f"><button class="btn btn-light" data-act="close">Cancel</button><button class="btn btn-primary" data-act="confirmMark" data-id="${f.id}">${ic('undo')} Return to Registry</button></div>`);
}
/* --- Sticky note --- */
const stickySwatches = () => STICKY_COLOURS.map(c => `<button class="sw ${ui.stickyColor === c.id ? 'on' : ''}" style="background:${c.c};color:#333" data-act="snColour" data-v="${c.id}" aria-label="${c.id}">${ui.stickyColor === c.id ? ic('check') : ''}</button>`).join('');
function stickyModal(f, d) {
  const others = Object.values(PEOPLE).filter(p => p.id !== meId());
  modal(`${mHead('sticky', 'Sticky note', `Folio ${esc(d.folio)} · ${esc(d.title)}`)}
    <div class="modal-b">
      <div class="field"><label for="sn-text">Note <span class="req">*</span></label><textarea class="textarea" id="sn-text" placeholder="e.g. Check the attachment before responding" style="font-family:'Kalam',cursive;font-size:17px;background:${stickyCol(ui.stickyColor)};border-radius:6px"></textarea></div>
      <div class="field"><span class="label">Colour</span><div class="swatches" id="sn-sw">${stickySwatches()}</div></div>
      <div class="field"><label for="sn-to">Who is it for?</label><select class="select" id="sn-to"><option value="public">Everyone who opens the file</option><option value="registry">The Registry</option>${others.map(p => `<option value="${p.id}" ${f.markedTo === p.id ? 'selected' : ''}>${esc(p.name)} — ${esc(p.title)}</option>`).join('')}</select><span class="hint">A note for one person is only shown to them and to you.</span></div>
    </div>
    <div class="modal-f"><span class="left hint">Drag it on the page afterwards to place it.</span><button class="btn btn-light" data-act="close">Cancel</button><button class="btn btn-primary" data-act="confirmSticky" data-f="${f.id}" data-d="${d.id}">${ic('sticky')} Add note</button></div>`);
}
/* --- Action officer: responses with templates --- */
function respDefaults(f, folio) {
  const latest = kinds => liveDocs(f).filter(d => kinds.includes(d.kind)).map(d => d.folio).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))[0];
  const base = folio || latest(['letter', 'memo']) || latest(['attachment']) || '1';
  return { fid: f.id, folio: base, tpl: 'letter', to: 'The Principal Secretary, State Department for Medical Services', subject: '', body: '', sign: true, mode: 'write', fname: '' };
}
function respCtx(f, R) {
  return { ref: `${f.ref}/${nextSubFolio(f, R.folio)}`, date: new Date().toISOString(), to: R.to, subject: (R.subject || 'Subject of your response').toUpperCase(),
    body: R.body.trim() ? R.body.trim().split(/\n+/) : ['Write the body of your response here.'], signer: { name: me().name, title: me().title }, signed: R.sign, extra: !!R.body.trim(), outgoing: true };
}
function respondModal(f, folio) {
  if (!ui.resp || ui.resp.fid !== f.id) ui.resp = respDefaults(f, folio);
  else if (folio) ui.resp.folio = folio;
  const R = ui.resp;
  const sources = liveDocs(f).filter(d => d.kind !== 'response');
  modal(`${mHead('reply', 'Responses', 'Answer with a letter, memo or other document - write a new one or upload one.')}
    <div class="modal-b">
      <div class="seg solid" style="justify-self:start">${[['write', 'Write from a template', 'fileEdit'], ['upload', 'Upload a document', 'upload']].map(([k, l, i]) => `<button class="${R.mode === k ? 'on' : ''}" data-act="respMode" data-k="${k}">${ic(i)} ${l}</button>`).join('')}</div>
      ${R.mode === 'write' ? `<div class="mstep"><div class="mstep-h"><i>1</i> Choose a template</div>
        <div class="tpl-grid">${TEMPLATES.map(t => `<button class="tpl ${R.tpl === t.id ? 'on' : ''}" data-act="pickTpl" data-v="${t.id}"><div class="page" style="overflow:hidden"><div class="content">${tplHTML(t.id, respCtx(f, R))}</div></div><b>${t.name}</b><small>${t.desc}</small></button>`).join('')}</div></div>` : ''}
      <div class="mstep"><div class="mstep-h"><i>${R.mode === 'write' ? 2 : 1}</i> ${R.mode === 'write' ? 'Write it' : 'Your document'}</div>
        <div class="two"><div class="field"><label for="rs-folio">Responding to</label><select class="select" id="rs-folio" data-resp="folio">${sources.map(d => `<option value="${esc(d.folio)}" ${d.folio === R.folio ? 'selected' : ''}>Folio ${esc(d.folio)} – ${esc(d.title)}</option>`).join('')}</select></div>
          <div class="field"><label for="rs-to">Addressed to</label><input class="input" id="rs-to" data-resp="to" value="${esc(R.to)}"></div></div>
        <div class="field"><label for="rs-subject">Subject <span class="req">*</span></label><input class="input" id="rs-subject" data-resp="subject" value="${esc(R.subject)}" placeholder="e.g. Response on the training schedule"></div>
        ${R.mode === 'write' ? `<div class="field"><label for="rs-body">Body</label><textarea class="textarea" id="rs-body" data-resp="body" style="min-height:150px" placeholder="Write your response… Each new line becomes a paragraph.">${esc(R.body)}</textarea></div>`
        : `<label class="dropzone" style="min-height:140px"><input type="file" class="sr" data-change="respFile"><div><div class="cloud" style="width:70px;height:70px"><span style="width:30px;height:30px">${ic('arrowUp')}</span></div><p>${R.fname ? `<b>${esc(R.fname)}</b>` : 'Drop file here or click to browse'}</p></div></label>`}
        <label style="display:flex;gap:10px;align-items:center;font-size:14px"><input type="checkbox" data-resp="sign" ${R.sign ? 'checked' : ''}> Sign and stamp this response</label>
      </div>
    </div>
    <div class="modal-f"><span class="left hint">Saved as folio <b id="rs-next">${esc(nextSubFolio(f, R.folio))}</b></span><button class="btn btn-light" data-act="close">Cancel</button>
      ${R.mode === 'write' ? `<button class="btn btn-light" data-act="viewTpl">${ic('eye')} View template</button>` : ''}<button class="btn btn-primary" data-act="sendResponse">${ic('send')} Send</button></div>`, 'xwide', R.subject ? '#rs-body' : '#rs-subject');
}
function tplPreview() {
  const R = ui.resp, f = getFile(R.fid), t = TEMPLATES.find(x => x.id === R.tpl);
  modal(`${mHead('eye', t.name, 'This is how the response will look in the file.')}
    <div class="modal-b"><div class="preview-page"><article class="page"><div class="folio-box"><b>Folio ${esc(nextSubFolio(f, R.folio))}</b>Draft</div><div class="content">${tplHTML(R.tpl, respCtx(f, R))}</div></article></div></div>
    <div class="modal-f"><button class="btn btn-light left" data-act="backToResp">${ic('chevL')} Back to edit</button><button class="btn btn-light" data-act="downloadTpl">${ic('download')} Download</button><button class="btn btn-primary" data-act="sendResponse">${ic('send')} Send</button></div>`, 'wide');
}
const inFrame = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
async function saveFile(filename, data, mime) {
  if (inFrame && window.claude?.use) {
    try {
      const dl = await window.claude.use('downloads');
      if (dl) { await dl.save({ filename, data }); return true; }
    } catch (e) { if (e?.code === 'declined') return false; toast('This preview could not save the file'); return false; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(data instanceof Blob ? data : new Blob([data], { type: mime }));
  a.download = filename; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  return true;
}
function docHTML(name, inner, extraCss = '') {
  const css = 'body{font-family:Georgia,serif;font-size:12pt;line-height:1.5;max-width:680px;margin:40px auto;color:#1b1b1b}.lh{text-align:center}.lh img{width:70px}.lh .t{font-weight:bold;letter-spacing:1px}.lh .m{font-weight:800;font-size:14pt}.lh .c{font-size:8pt;color:#444}.refs span{display:block}table{width:100%;border-collapse:collapse}th{text-align:left;width:15%}h4{text-decoration:underline}.stamp{border:2px solid #b8323a;color:#b8323a;padding:6px;display:inline-block;font:bold 8pt Arial}.memo-h img{width:50px}.memo-t{font-weight:900;letter-spacing:3px;font-size:16pt}.circ{text-align:center;font-weight:bold;letter-spacing:2px}.line{font-family:"Brush Script MT",cursive;font-size:22pt;color:#0a3a8c}' + extraCss;
  const abs = new URL(COAT, location.href).href;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(name)}</title><style>${css}</style></head><body>${inner.split(COAT).join(abs)}</body></html>`;
}
function downloadDoc(name, inner) {
  const base = name.replace(/[^\w\- ]+/g, '').trim().slice(0, 60) || 'response';
  return inFrame ? saveFile(base + '.html', docHTML(name, inner), 'text/html') : saveFile(base + '.doc', '\ufeff' + docHTML(name, inner), 'application/msword');
}
function printFile() {
  const f = currentFile();
  if (!inFrame || !f) { window.print(); return; }
  const pages = [...f.docs].sort(byFolio).reverse().filter(d => d.status !== 'landing').map(d => `<section style="page-break-before:always"><p style="text-align:right;font:bold 10pt Arial">Folio ${esc(d.folio)}</p>${docContent(f, d)}${d.minutes.length ? `<div style="margin-top:20px;font:10pt Arial;border-top:1px solid #ccc;padding-top:8px"><b>Minutes</b>${d.minutes.filter(m => m.n).map(m => `<p>${m.n}. ${esc(m.text)} — ${esc(person(m.by).name)}, ${fmtDate(m.at)}</p>`).join('')}</div>` : ''}</section>`).join('');
  const cover = `<h1 style="font:bold 20pt Arial">${esc(f.name)}</h1><p style="font:11pt Arial">${esc(f.ref)} · Vol. ${esc(f.vol)} · ${regName(f.registry)}</p><table border="1" cellpadding="6" style="font:10pt Arial"><tr><th>Date</th><th>From</th><th>Officer to see</th></tr>${f.movements.map(m => `<tr><td>${fmtDate(m.date)}</td><td>${esc(person(m.from).name)}</td><td>${esc(person(m.to).name)}</td></tr>`).join('')}</table>`;
  saveFile(`${f.name.replace(/[^\w\- ]+/g, '').trim() || 'file'}.html`, docHTML(f.name, cover + pages, '@media print{body{margin:0}}') .replace('</body>', '<script>window.onload=()=>window.print()<\/script></body>'), 'text/html')
    .then(ok => ok && toast('Saved a printable copy – open it to print'));
}
function _oldDownloadDoc(name, inner) {
  const css = 'body{font-family:Georgia,serif;font-size:12pt;line-height:1.5;max-width:640px;margin:40px auto;color:#1b1b1b}.lh{text-align:center}.lh img{width:70px}.lh .t{font-weight:bold;letter-spacing:1px}.lh .m{font-weight:800;font-size:14pt}.lh .c{font-size:8pt;color:#444}.refs span{display:block}table{width:100%;border-collapse:collapse}th{text-align:left;width:15%}h4{text-decoration:underline}.stamp{border:2px solid #b8323a;color:#b8323a;padding:6px;display:inline-block;font:bold 8pt Arial}.memo-h img{width:50px}.memo-t{font-weight:900;letter-spacing:3px;font-size:16pt}.circ{text-align:center;font-weight:bold;letter-spacing:2px}.line{font-family:"Brush Script MT",cursive;font-size:22pt;color:#0a3a8c}';
  const abs = new URL(COAT, location.href).href;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(name)}</title><style>${css}</style></head><body>${inner.split(COAT).join(abs)}</body></html>`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + html], { type: 'application/msword' }));
  a.download = (name.replace(/[^\w\- ]+/g, '').trim().slice(0, 60) || 'response') + '.doc';
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
}
/* Account menu on the top-right avatar */
const workEmail = p => `${p.name.toLowerCase().replace(/\s+/g, '.')}@health.go.ke`;
const deptLine = p => { const d = (p.dept || regName(p.registry)); return /ministry of health/i.test(d) ? d : `Ministry of Health - ${d}`; };
function openAcct(btn) {
  const p = me(), m = document.createElement('div');
  m.id = 'acct-menu'; m.className = 'acct-menu'; m.setAttribute('role', 'menu'); m.setAttribute('aria-label', 'Account');
  m.innerHTML = `<div class="acct-h">${avatar(meId(), 'av-xl')}<div><b>${esc(p.name)}</b><span>${esc(p.title)}</span><small>${ic('building')} ${esc(deptLine(p))}</small></div></div>
    <button role="menuitem" data-act="myProfile"><span class="i">${ic('user')}</span><span>My Profile</span></button>
    <button role="menuitem" data-act="changePw"><span class="i">${ic('settings')}</span><span>Change Password</span></button>
    <button role="menuitem" data-act="logout"><span class="i">${ic('lock')}</span><span>Logout</span></button>`;
  document.body.appendChild(m);
  const r = btn.getBoundingClientRect(); m.style.top = (r.bottom + 10) + 'px'; m.style.right = Math.max(12, innerWidth - r.right) + 'px';
  btn.setAttribute('aria-expanded', 'true'); m.querySelector('button').focus();
}
function closeAcct(focusBtn) { const m = $('#acct-menu'); if (!m) return; m.remove(); const b = $('.ph-ic.me'); if (b) { b.setAttribute('aria-expanded', 'false'); if (focusBtn) b.focus(); } }
function profileModal() {
  const p = me();
  modal(`${mHead('user', 'My Profile', 'Your details as other officers see them.')}
    <div class="modal-b"><div class="profile-card">${avatar(meId(), 'av-xl')}<div><b>${esc(p.name)}</b><span>${esc(p.title)}</span></div></div>
      <dl class="kv">${[['Department', deptLine(p)], ['Role', ROLE_LABEL[role()]], ['Registry', regName(p.registry)], ['Work email', workEmail(p)]].map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>
    <div class="modal-f"><button class="btn btn-primary" data-act="close">Done</button></div>`);
}
function passwordModal() {
  const f = (id, l, ac) => `<div class="field"><label for="${id}">${l}</label><input class="input" type="password" id="${id}" autocomplete="${ac}"><p class="field-err" id="${id}-err" role="alert" hidden></p></div>`;
  modal(`${mHead('lock', 'Change Password', 'Use at least 8 characters, with letters and a number.')}
    <div class="modal-b">${f('pw-cur', 'Current password', 'current-password')}${f('pw-new', 'New password', 'new-password')}${f('pw-conf', 'Confirm new password', 'new-password')}</div>
    <div class="modal-f"><button class="btn btn-light" data-act="close">Cancel</button><button class="btn btn-primary" data-act="savePw">${ic('lock')} Change password</button></div>`, '', '#pw-cur');
}
function requestAnyModal() {
  const opts = S.files.filter(x => !x.draft && canSee(x) && !myQueue().includes(x)).map(x => `<option value="${x.id}">${esc(x.name)} — ${esc(x.ref)}</option>`).join('');
  modal(`${mHead('filePlus', 'Request file', 'Ask the Registry to send you a file. They will see your reason.')}
    <div class="modal-b"><div class="field"><label for="ra-file">File you need</label><select class="select" id="ra-file">${opts}</select></div>
      <div class="field"><label for="ra-why">Why you need it <span class="req">*</span></label><textarea class="textarea" id="ra-why" placeholder="e.g. Need the earlier correspondence to respond to the Treasury"></textarea></div></div>
    <div class="modal-f"><button class="btn btn-light" data-act="close">Cancel</button><button class="btn btn-primary" data-act="confirmRequestAny">${ic('send')} Send request</button></div>`, '', '#ra-file');
}
function requestModal(f) {
  modal(`${mHead('filePlus', 'Request files', 'Ask the Registry for more files you need in order to take action.')}
    <div class="modal-b"><div class="field"><label for="rq-file">File you need</label><select class="select" id="rq-file">${S.files.filter(x => x.id !== f.id).map(x => `<option value="${esc(x.ref)}">${esc(x.name)} — ${esc(x.ref)}</option>`).join('')}</select></div>
      <div class="field"><label for="rq-why">Why you need it <span class="req">*</span></label><textarea class="textarea" id="rq-why" placeholder="e.g. Need the earlier correspondence to respond"></textarea></div></div>
    <div class="modal-f"><button class="btn btn-light" data-act="close">Cancel</button><button class="btn btn-primary" data-act="confirmRequest" data-id="${f.id}">${ic('send')} Send request</button></div>`);
}
function delegateModal(f) {
  modal(`${mHead('users', 'Delegate', 'Hand the letter to someone else to act on. They send it back to the Registry when done.')}
    <div class="modal-b"><div class="field"><label for="dl-to">Delegate to</label><select class="select" id="dl-to">${peopleOpts(p => p.role === 'action' && p.id !== meId())}</select></div>
      <div class="field"><label for="dl-note">Instruction <span class="req">*</span></label><textarea class="textarea" id="dl-note" placeholder="e.g. Please draft the response and share by Thursday"></textarea></div></div>
    <div class="modal-f"><button class="btn btn-light" data-act="close">Cancel</button><button class="btn btn-primary" data-act="confirmDelegate" data-id="${f.id}">${ic('users')} Delegate</button></div>`);
}
function doneModal(f) {
  const responses = f.docs.filter(d => d.kind === 'response' && d.from === me().name);
  modal(`${mHead('undo', 'Done – return to Registry', 'Use this last, when the work is finished.')}
    <div class="modal-b">
      ${responses.length ? `<div class="instruction" style="margin:0;background:#e8f7ef;border-color:#bfe8d1">${ic('checkCircle')}<div>You added ${plural(responses.length, 'response')}: ${responses.map(d => `Folio ${esc(d.folio)}`).join(', ')}</div></div>` : `<div class="instruction" style="margin:0">${ic('sticky')}<div>You have not added a response yet. You can still return the file with a minute.</div></div>`}
      <div class="field"><label for="dn-note">Closing minute <span class="req">*</span></label><textarea class="textarea" id="dn-note" placeholder="e.g. Response sent. File may be put away."></textarea></div>
    </div>
    <div class="modal-f"><button class="btn btn-light" data-act="close">Cancel</button><button class="btn btn-primary" data-act="confirmDone" data-id="${f.id}">${ic('undo')} Return to Registry</button></div>`);
}
function bringupModal(fileId) {
  modal(`${mHead('calendar', 'Add bring-up', 'Bring a file back to an officer on a date.')}
    <div class="modal-b">
      <div class="field"><label for="bu-file">File</label><select class="select" id="bu-file">${S.files.map(f => `<option value="${f.id}" ${f.id === fileId ? 'selected' : ''}>${esc(f.name)} — ${esc(f.ref)}</option>`).join('')}</select></div>
      <div class="two"><div class="field"><label for="bu-date">Bring up on</label><input class="input" type="date" id="bu-date" value="${new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10)}"></div>
        <div class="field"><label for="bu-for">For</label><select class="select" id="bu-for">${peopleOpts(p => p.role !== 'registry', 'vera')}</select></div></div>
      <div class="field"><label for="bu-note">Why <span class="req">*</span></label><input class="input" id="bu-note" placeholder="e.g. Follow up on the vendor reply"></div>
    </div>
    <div class="modal-f"><button class="btn btn-light" data-act="close">Cancel</button><button class="btn btn-primary" data-act="confirmBringup">${ic('calendar')} Add to diary</button></div>`);
}
function accessModal() {
  modal(`${mHead('lock', 'Request access', 'Read-only access to a file for a set number of days.')}
    <div class="modal-b">
      <div class="field"><label for="ac-file">File</label><select class="select" id="ac-file">${S.files.map(f => `<option value="${f.id}">${esc(f.name)} — ${esc(f.ref)}</option>`).join('')}</select></div>
      <div class="field"><label for="ac-days">For how long</label><select class="select" id="ac-days">${[3, 7, 14, 30].map(d => `<option value="${d}">${d} days</option>`).join('')}</select></div>
      <div class="field"><label for="ac-why">Reason <span class="req">*</span></label><textarea class="textarea" id="ac-why"></textarea></div>
    </div>
    <div class="modal-f"><button class="btn btn-light" data-act="close">Cancel</button><button class="btn btn-primary" data-act="confirmAccess">${ic('send')} Send request</button></div>`);
}
function confirmBox(title, text, noAct, noLabel, yesAct, yesLabel) {
  closeModal();
  const o = document.createElement('div'); o.className = 'overlay'; o.id = 'overlay';
  o.innerHTML = `<div class="modal confirm" role="dialog" aria-modal="true" aria-labelledby="cb-t"><span class="ic">${ic('fileEdit')}</span><h3 id="cb-t">${title}</h3><p>${text}</p>
    <div class="row"><button class="btn btn-danger-soft" data-act="${noAct}">${noLabel}</button><button class="btn btn-primary" data-act="${yesAct}">${yesLabel}</button></div></div>`;
  o.addEventListener('mousedown', e => { if (e.target === o) closeModal(); });
  document.body.appendChild(o); o.querySelector('.btn-primary').focus();
}
function draftModal() {
  closeModal();
  const o = document.createElement('div'); o.className = 'overlay'; o.id = 'overlay';
  o.innerHTML = `<div class="modal confirm" role="dialog" aria-modal="true"><span class="ic">${ic('fileEdit')}</span><h3>Save as draft?</h3><p>You want to cancel this progress would you like to save a draft</p>
    <div class="row"><button class="btn btn-danger-soft" data-act="draftDelete">Delete Progress</button><button class="btn btn-primary" data-act="draftSave">Save draft</button></div></div>`;
  o.addEventListener('mousedown', e => { if (e.target === o) closeModal(); });
  document.body.appendChild(o);
}
function myQueueFor(r) { const keep = S.session; S.session = r; const n = myQueue().length; S.session = keep; return n; }
function switchRoleModal() {
  modal(`${mHead('users', 'Switch account', 'In the live system each role is a separate login. The mockup lets you hop between them to follow a file.')}
    <div class="modal-b">${Object.entries(ACCOUNTS).map(([r, pid]) => { const p = PEOPLE[pid]; return `<button class="acct card ${role() === r ? 'on' : ''}" data-act="setRole" data-role="${r}">${avatar(pid, 'av-lg')}<div><b>${esc(p.name)}</b><br><small class="muted">${ROLE_LABEL[r]} · ${esc(p.title)}</small></div><span style="margin-left:auto" class="chip t-blue">${myQueueFor(r)} waiting</span></button>`; }).join('')}</div>
    <div class="modal-f"><button class="btn btn-light left" data-act="logout">${ic('logout')} Sign out</button><button class="btn btn-light" data-act="close">Close</button></div>`);
}
function notifDrawer() {
  closeModal();
  const d = document.createElement('div'); d.id = 'drawer';
  d.innerHTML = `<div class="overlay" style="background:rgba(10,26,60,.15)" data-act="close"></div><aside class="drawer glass" role="dialog" aria-label="Notifications">
    ${mHead('bell', 'Notifications', `${unread()} unread`)}<div class="list">${myNotifs().map(notifCard).join('') || '<p class="muted">No notifications.</p>'}</div>
    <div class="modal-f"><button class="btn btn-light btn-sm" data-act="readAll">${ic('check')} Mark all as read</button></div></aside>`;
  document.body.appendChild(d);
}
function paletteModal() {
  const navs = [['Overview', '#/', 'grid'], ['Registries & Files', '#/files', 'folders'], ['My Queue', '#/queue', 'listChecks'], ['File Movement', '#/routing', 'route'], ['User Guide', '#/guide', 'book'], ['Upload', '#/upload', 'upload'], ['Bring Up Diary', '#/bringup', 'calendar'], ['Settings', '#/settings', 'settings'], ...(role() === 'registry' ? [['Physical Files', '#/physical', 'archive'], ['Files & Records', '#/records', 'layers'], ['File Census', '#/census', 'checkCircle'], ['Inward Register', '#/inward', 'inboxIn'], ['Outward Register', '#/outward', 'send']] : [])];
  const items = [...navs.map(([l, h, i]) => ({ l, h, i, s: 'Go to' })), ...S.files.map(f => ({ l: f.name, h: `#/file/${f.id}`, i: 'folder', s: f.ref })), ...S.files.flatMap(f => f.docs.map(d => ({ l: d.title, h: `#/file/${f.id}/doc/${d.id}`, i: 'file', s: `Folio ${d.folio} · ${f.name}` })))];
  modal(`<div class="modal-b" style="padding:18px"><label class="input-icon">${ic('search')}<input class="input" id="pal-q" placeholder="Search files, letters and pages…" data-input="palette"></label><div class="list" id="pal-list"></div></div>`, 'palette');
  ui.paletteDraw = term => { const t = term.toLowerCase(); $('#pal-list').innerHTML = items.filter(x => (x.l + ' ' + x.s).toLowerCase().includes(t)).slice(0, 12).map((x, i) => `<a href="${x.h}" class="${i === 0 ? 'on' : ''}" data-act="close">${ic(x.i)}<span><b>${esc(x.l)}</b><br><small class="muted">${esc(x.s)}</small></span></a>`).join('') || '<p class="muted">No matches.</p>'; };
  ui.paletteDraw('');
}

/* ==========================================================================
   AI Support: glowing button → AI chat / Capture screen / User guide
   ========================================================================== */
function renderFab() {
  let el = $('#fab');
  if (!S.session) { el?.remove(); $('#ai-panel')?.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'fab'; document.body.appendChild(el); }
  el.className = ui.fabOpen ? 'open' : '';
  el.className = 'qb-hub' + (ui.fabOpen ? ' is-open' : '');
  const items = [['guide', 'fabGuide', 'User Manual', 'info'], ['report', 'fabCapture', 'Capture Screen', 'scan'], ['chat', 'fabChat', 'Chat', 'chat']];
  el.innerHTML = `<div class="qb-hub__items" aria-hidden="${!ui.fabOpen}">${items.map(([k, act, l, i], n) => `<button class="qb-hub__item qb-hub__item--${k}" data-act="${act}" tabindex="${ui.fabOpen ? 0 : -1}" style="transition-delay:${ui.fabOpen ? (items.length - 1 - n) * 60 : 0}ms"><span class="qb-hub__label">${l}</span><span class="qb-hub__dot">${ic(i)}</span></button>`).join('')}</div>
    <button class="qb-fab" data-act="fabToggle" aria-expanded="${ui.fabOpen}" aria-label="${ui.fabOpen ? 'Close Q-BITS menu' : 'Open Q-BITS AI'}"><span class="qb-fab__icon" aria-hidden="true">${QB_MARK('qb-fab__mark')}</span><span class="qb-fab__text qb-fab__text--closed">Q-BITS AI</span><span class="qb-fab__text qb-fab__text--opened">Ask Q-BITS</span></button>`;

}
function slide(btn, on) {
  btn.classList.toggle('on', on); btn.classList.remove('anim'); void btn.offsetWidth; btn.classList.add('anim');
  setTimeout(() => btn.classList.remove('anim'), 650);
}
function setFab(open) {
  ui.fabOpen = open; const el = $('#fab'); if (!el) return;
  el.classList.toggle('is-open', open);
  const fab = $('.qb-fab', el); fab.setAttribute('aria-expanded', open); fab.setAttribute('aria-label', open ? 'Close Q-BITS menu' : 'Open Q-BITS AI');
  const list = $$('.qb-hub__item', el); list.forEach((b, i) => { b.tabIndex = open ? 0 : -1; b.style.transitionDelay = open ? ((list.length - 1 - i) * 60) + 'ms' : '0ms'; });
  $('.qb-hub__items', el).setAttribute('aria-hidden', !open);
}
function openChat() {
  setFab(false);
  if ($('#ai-panel')) { $('#ai-panel').remove(); return; }
  ui.aiSeen = true; renderFab();
  if (!ui.chat.length) ui.chat.push({ bot: true, html: `Hi ${esc(me().name.split(' ')[0])}! I'm the Q-BITS assistant. Ask me anything about EDRMS, or pick one of the questions below.` });
  const p = document.createElement('section'); p.className = 'ai-panel glass'; p.id = 'ai-panel'; p.setAttribute('aria-label', 'AI chat');
  p.innerHTML = `${mHead('sparkles', 'Q-BITS AI', 'Answers from the EDRMS user guide')}<div class="ai-msgs" id="ai-msgs" aria-live="polite"></div><div class="faq-chips" id="ai-chips"></div>
    <form class="ai-input" onsubmit="ACT.aiSend();return false"><input class="input" id="ai-q" placeholder="Ask a question…" aria-label="Ask a question" autocomplete="off"><button class="btn btn-primary btn-icon" aria-label="Send">${ic('send')}</button></form>`;
  p.querySelector('[data-act=close]').dataset.act = 'closeChat';
  const hi = p.querySelector('.mh-ic'); if (hi) { hi.innerHTML = '<img src="assets/qbits-mark-on-mint.png" alt="Q-BITS">'; hi.classList.add('is-qbits'); }
  document.body.appendChild(p); drawChat(); setTimeout(() => $('#ai-q')?.focus(), 50);
}
function drawChat() {
  const m = $('#ai-msgs'); if (!m) return;
  m.innerHTML = ui.chat.map(c => `<div class="bubble ${c.bot ? 'bot' : 'me'} ${c.typing ? 'typing' : ''}">${c.html}</div>`).join('');
  m.scrollTop = m.scrollHeight;
  const asked = ui.chat.filter(c => !c.bot).map(c => c.q);
  $('#ai-chips').innerHTML = FAQS.filter(f => !asked.includes(f.q)).slice(0, 4).map(f => `<button data-act="aiFaq" data-q="${esc(f.q)}">${esc(f.q)}</button>`).join('');
}
function aiAnswer(q) {
  const t = q.toLowerCase();
  let best = FAQS.find(f => f.q.toLowerCase() === t), score = best ? 99 : 0;
  if (!best) FAQS.forEach(f => {
    const s = f.keys.reduce((a, k) => a + (t.includes(k) ? 3 : 0), 0) + f.q.toLowerCase().split(/\W+/).filter(w => w.length > 3 && t.includes(w)).length;
    if (s > score) { score = s; best = f; }
  });
  if (!best || score < 2) return `I couldn't find that in the guide. You can browse the User Guide, or capture the screen to report it to support.<div class="links"><a class="btn btn-light btn-xs" href="#/guide">${ic('book')} User guide</a><button class="btn btn-light btn-xs" data-act="fabCapture">${ic('scan')} Capture screen</button></div>`;
  return `${best.a}<div class="links">${best.link ? `<a class="btn btn-light btn-xs" href="${best.link[0]}">${best.link[1]}</a>` : ''}<a class="btn btn-light btn-xs" href="#/guide?s=${best.guide}">${ic('book')} Read in the guide</a></div>`;
}
function aipAsk(q) {
  if (!q || !q.trim()) return;
  if (!ui.chat.length) ui.chat.push({ bot: true, html: `Hi ${esc(me().name.split(' ')[0])}. Ask me anything about EDRMS.` });
  ui.chat.push({ html: esc(q), q }); ui.chat.push({ bot: true, typing: true, html: 'Thinking…' }); drawAIPage();
  setTimeout(() => { ui.chat.pop(); ui.chat.push({ bot: true, html: aiReply(q) }); if (parseHash().parts[0] === 'ai') { render(); $('#aip-q')?.focus(); } }, 450);
}
function aiAsk(q) {
  if (!q.trim()) return;
  ui.chat.push({ html: esc(q), q }); ui.chat.push({ bot: true, typing: true, html: 'Thinking…' }); drawChat();
  setTimeout(() => { ui.chat.pop(); ui.chat.push({ bot: true, html: aiReply(q) }); drawChat(); }, 450);
}
/* Q-BITS AI page (#/ai) — the side-nav Q-BITS AI button opens this, as in the Q-Bits ERM */
const AI_CAN = [['folder', 'Find files and letters', 'By name, reference, sender or folio'], ['route', 'Explain where a file is', 'Who has it, and what happens next'], ['book', 'Answer how-to questions', 'From the EDRMS user guide'], ['zap', 'Point out what needs you', 'Files waiting, notes and bring-ups']];
function aiAttention() {
  const list = insights();
  return `Here is what needs your attention:<ul class="ai-list">${list.map(x => `<li>${esc(x.text)} ${x.target.startsWith('#') ? `<a href="${x.target}">${x.cta}</a>` : ''}</li>`).join('')}</ul>`;
}
function aiReply(q) {
  return /attention|need(s)? me|waiting|today|to do|my files/i.test(q) ? aiAttention() : aiAnswer(q);
}
function aipMsgs() {
  if (!ui.chat.some(c => !c.bot)) return `<div class="aip-empty">
      <img src="assets/qbits-mark-on-mint.png" alt="" class="aip-mark">
      <h2>Ask Q-BITS</h2><p>Ask about files, letters and how EDRMS works. Answers come from the user guide and the files you can see.</p>
      <div class="aip-starters">${['What needs my attention today?', ...FAQS.slice(0, 3).map(f => f.q)].map(q => `<button class="aip-starter" data-act="aipAsk" data-q="${esc(q)}">${ic('chevR')}<span>${esc(q)}</span></button>`).join('')}</div>
    </div>`;
  return ui.chat.map(c => `<div class="bubble ${c.bot ? 'bot' : 'me'} ${c.typing ? 'typing' : ''}">${c.bot ? '<img src="assets/qbits-mark-on-mint.png" alt="" class="aip-av">' : ''}<div>${c.html}</div></div>`).join('');
}
function viewAI() {
  const asked = ui.chat.filter(c => !c.bot).map(c => c.q);
  return pageHead({ crumbs: [['Q-BITS AI']], title: 'Q-BITS AI', sub: 'Your assistant for EDRMS: find files, follow their movement and learn how things work.' }) + `
  <div class="aipage">
    <section class="aip-chat ai-panel-like" aria-label="Chat with Q-BITS AI">
      <div class="aip-msgs" id="aip-msgs" aria-live="polite">${aipMsgs()}</div>
      <form class="aip-input" onsubmit="ACT.aipSend();return false">
        <label class="sr" for="aip-q">Ask Q-BITS</label>
        <input class="input" id="aip-q" placeholder="Ask Q-BITS anything about your files…" autocomplete="off">
        <button class="btn btn-primary" type="submit">${ic('send')} Ask</button>
      </form>
    </section>
    <aside class="aip-side">
      <section class="aip-card"><div class="aip-card-h"><h2>Conversation</h2>${ui.chat.some(c => !c.bot) ? `<button class="btn btn-light btn-sm" data-act="aipNew">${ic('plus')} New chat</button>` : ''}</div>
        <p class="muted">${ui.chat.filter(c => !c.bot).length ? `${plural(ui.chat.filter(c => !c.bot).length, 'question')} so far. The chat pop-up from the Q-BITS AI button shares this conversation.` : 'Nothing asked yet. The chat pop-up from the Q-BITS AI button shares this conversation.'}</p></section>
      <section class="aip-card"><h2>Try asking</h2><div class="aip-sugg">${FAQS.filter(f => !asked.includes(f.q)).slice(0, 5).map(f => `<button data-act="aipAsk" data-q="${esc(f.q)}">${esc(f.q)}</button>`).join('')}</div></section>
      <section class="aip-card"><h2>What I can do</h2><ul class="aip-can">${AI_CAN.map(([i, t, d]) => `<li><span class="mh-ic">${ic(i)}</span><div><b>${t}</b><small>${d}</small></div></li>`).join('')}</ul></section>
    </aside>
  </div>`;
}
function drawAIPage() { const m = $('#aip-msgs'); if (!m) return; m.innerHTML = aipMsgs(); m.scrollTop = m.scrollHeight; }
/* Screen capture with highlights, for reporting issues */
async function captureScreen(keep) {
  setFab(false); $('#ai-panel')?.remove(); closeModal();
  if (!keep) ui.cap = { type: 'Error', text: '', attach: true };
  if (!window.html2canvas) { toast('Screen capture is not available here'); return; }
  const fab = $('#fab'); if (fab) fab.style.visibility = 'hidden';
  toast('Capturing this screen…');
  await new Promise(r => setTimeout(r, 120));
  $('.toast-wrap')?.remove();
  try {
    const canvas = await html2canvas(document.body, { x: scrollX, y: scrollY, width: innerWidth, height: innerHeight, windowWidth: innerWidth, windowHeight: innerHeight, scale: Math.min(2, devicePixelRatio || 1), useCORS: true, logging: false, ignoreElements: el => el.id === 'fab' || el.classList?.contains('toast-wrap') });
    ui.cap.src = canvas.toDataURL('image/png'); ui.capRects = [];
  } catch (e) { console.error(e); ui.cap.src = ''; ui.cap.attach = false; toast('Could not capture this screen – you can still send a report'); }
  finally { if (fab) fab.style.visibility = ''; }
  captureModal();
}
const pageName = () => { const { parts, q } = parseHash(); return '/' + (parts.length ? parts.join('/') + (Object.values(q)[0] ? '/' + Object.values(q)[0] : '') : 'home'); };
function captureModal() {
  const C = ui.cap;
  modal(`${mHead('scan', 'Report an issue', '')}
    <div class="modal-b">
      ${C.src ? `<div class="cap-stage ${C.attach ? '' : 'off'}"><img src="${C.src}" alt="Screenshot of the page you were on" id="cap-img"><canvas id="cap-cv" aria-label="Drag to highlight part of the screenshot"></canvas></div>` : ''}
      <div class="cap-row">
        ${C.src ? `<label class="check"><input type="checkbox" id="cap-attach" data-change="capAttach" ${C.attach ? 'checked' : ''}> Attach screenshot</label><span class="hint">Drag on the screenshot to highlight the problem</span>
        ${ui.capRects.length ? `<button class="btn btn-light btn-xs" data-act="capUndo">${ic('undo')} Undo highlight</button>` : ''}` : '<span class="hint">No screenshot attached.</span>'}
        <div class="right"><button class="btn btn-outline btn-sm" data-act="capRetake">${ic('refresh')} Retake</button>${C.src ? `<button class="btn btn-outline btn-sm" data-act="capDownload">${ic('download')} Download</button>` : ''}</div>
      </div>
      <div class="field"><span class="label" id="cap-type-l">Type</span><div class="type-seg" role="radiogroup" aria-labelledby="cap-type-l">${['Error', 'Question', 'Suggestion'].map(t => `<button role="radio" aria-checked="${C.type === t}" class="${C.type === t ? 'on' : ''}" data-act="capType" data-v="${t}">${t}</button>`).join('')}</div></div>
      <div class="field"><label for="cap-text">Describe the issue <span class="req">*</span></label><textarea class="textarea" id="cap-text" data-capt="1" rows="5" placeholder="What were you trying to do, and what happened?">${esc(C.text)}</textarea></div>
      <p class="hint" style="margin:0">Page: <span class="mono">${esc(pageName())}</span></p>
    </div>
    <div class="modal-f"><button class="btn btn-outline" data-act="close">Cancel</button><button class="btn btn-dark" data-act="capSubmit">${ic('send')} Send report</button></div>`, 'wide', '#cap-text');
  const img = $('#cap-img'), cv = $('#cap-cv'); if (!img) return;
  const setup = () => { cv.width = img.naturalWidth; cv.height = img.naturalHeight; drawCap(); };
  img.complete ? setup() : img.addEventListener('load', setup);
  let start = null;
  const pt = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * cv.width, y: (e.clientY - r.top) / r.height * cv.height }; };
  cv.addEventListener('pointerdown', e => { if (!ui.cap.attach) return; start = pt(e); cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (!start) return; const p = pt(e); drawCap({ x: start.x, y: start.y, w: p.x - start.x, h: p.y - start.y }); });
  cv.addEventListener('pointerup', e => { if (!start) return; const p = pt(e); const r = { x: start.x, y: start.y, w: p.x - start.x, h: p.y - start.y }; start = null; if (Math.abs(r.w) > 6 && Math.abs(r.h) > 6) { ui.capRects.push(r); if (ui.capRects.length === 1) { ui.cap.text = val('cap-text'); captureModal(); return; } } drawCap(); });
}
function drawCap(extra) {
  const cv = $('#cap-cv'); if (!cv) return; const g = cv.getContext('2d');
  g.clearRect(0, 0, cv.width, cv.height);
  const lw = Math.max(3, cv.width / 400);
  [...ui.capRects, ...(extra ? [extra] : [])].forEach(r => { g.fillStyle = 'rgba(229,56,59,.12)'; g.strokeStyle = '#e5383b'; g.lineWidth = lw; g.fillRect(r.x, r.y, r.w, r.h); g.strokeRect(r.x, r.y, r.w, r.h); });
}
function composeCap(maxW) {
  const img = $('#cap-img'), cv = $('#cap-cv'); const scale = Math.min(1, maxW / img.naturalWidth);
  const out = document.createElement('canvas'); out.width = img.naturalWidth * scale; out.height = img.naturalHeight * scale;
  const g = out.getContext('2d'); g.drawImage(img, 0, 0, out.width, out.height); g.drawImage(cv, 0, 0, out.width, out.height); return out;
}

/* ==========================================================================
   Actions (event delegation)
   ========================================================================== */
const val = id => ($('#' + id)?.value || '').trim();
function need(id, label) {
  const v = val(id);
  if (!v) { const el = $('#' + id); el?.focus(); el?.style.setProperty('box-shadow', '0 0 0 3px rgba(229,56,59,.35)'); toast(label + ' is required'); }
  return v;
}
const now = () => new Date().toISOString();
const currentFile = () => getFile(parseHash().parts[1]);

const ACT = {
  close: () => closeModal(),
  pickRole: el => { ui.loginRole = el.dataset.role; render(); },
  login: () => { S.session = ui.loginRole; save(); go('#/'); toast(`Signed in as ${me().name}`); },
  logout: () => { closeAcct(); S.session = null; save(); closeModal(); ui.fabOpen = false; history.replaceState(null, '', '#login'); render(); },
  switchRole: () => switchRoleModal(),
  acctMenu: el => { if ($('#acct-menu')) closeAcct(); else openAcct(el); },
  myProfile: () => { closeAcct(); profileModal(); },
  changePw: () => { closeAcct(); passwordModal(); },
  savePw: () => {
    const cur = $('#pw-cur').value, nw = $('#pw-new').value, cf = $('#pw-conf').value; const err = (id, m) => { const e = $('#' + id + '-err'); e.textContent = m; e.hidden = !m; return !!m; };
    let bad = err('pw-cur', cur ? '' : 'Enter your current password.');
    bad = err('pw-new', nw.length >= 8 && /\d/.test(nw) && /[A-Za-z]/.test(nw) ? '' : 'Use at least 8 characters, with letters and a number.') || bad;
    bad = err('pw-conf', cf && cf === nw ? '' : 'The two new passwords do not match.') || bad;
    if (bad) return; closeModal(); toast('Password changed. Use the new one next time you sign in.');
  },
  setRole: el => {
    S.session = el.dataset.role; save(); closeModal(); ui.upload = freshUpload(); ui.resp = null; ui.sel = null; ui.editing = null; ui.chat = [];
    $('#ai-panel')?.remove();
    if (parseHash().parts[0] === 'upload' && S.session !== 'registry') history.replaceState(null, '', '#overview');
    render(); toast(`Now signed in as ${me().name} (${ROLE_LABEL[S.session]})`);
  },
  openNav: () => document.body.classList.add('nav-open'),
  closeNav: () => {
    if (innerWidth <= 920) { document.body.classList.remove('nav-open'); return; }
    const mini = document.body.classList.toggle('side-mini');
    try { localStorage.setItem('edrms-side-mini', mini ? '1' : '0'); } catch (e) { /* storage blocked */ }
  },
  palette: () => paletteModal(),
  openNotifs: () => notifDrawer(),
  openNotif: el => { const n = S.notifications.find(x => x.id === el.dataset.id); if (n) { n.read = true; save(); closeModal(); go(`#/file/${n.fileId}`); } },
  readAll: () => { myNotifs().forEach(n => n.read = true); save(); closeModal(); render(); },
  reset: () => { const keep = S.session; S = seedState(); S.session = keep; ensureIds(); save(); render(); toast('Demo data reset'); },

  /* dashboard */
  dashTab: el => { ui.dash.tab = el.dataset.k; $('#route-panel').innerHTML = routePanel(); },
  dashFilter: () => { ui.dash.filter = !ui.dash.filter; if (!ui.dash.filter) ui.dash.stage = ''; $('#route-panel').innerHTML = routePanel(); },
  dashSort: () => { ui.dash.dir = ui.dash.dir === 'desc' ? 'asc' : 'desc'; $('#route-panel').innerHTML = routePanel(); },
  quickRespond: () => { const f = filesToAct()[0]; if (!f) { toast('No files are with you to respond to'); return; } go(`#/file/${f.id}`); setTimeout(() => respondModal(f), 60); },

  /* all files */
  pickReg: el => { const id = el.dataset.id; ui.files.reg = ui.files.reg === id || id === 'all' ? 'all' : id; if (ui.files.show === 'registries' && ui.files.reg !== 'all') ui.files.show = 'all'; render(); },
  filesView: el => { ui.files.view = el.dataset.k; render(); },
  colSort: el => { const k = el.dataset.k, [, key, dir] = ui.files.sort.split(':'); ui.files.sort = `col:${k}:${key === k && dir === 'asc' ? 'desc' : 'asc'}`; render(); },
  star: (el, e) => { e.stopPropagation(); const f = getFile(el.dataset.id); f.starred = !f.starred; save(); render(); },
  fileMenu: (el, e) => { e.stopPropagation(); ui.fileTab = role() === 'registry' ? 'cover' : 'details'; go(`#/file/${el.dataset.id}`); },

  /* new file */
  newFile: () => { ui.newFile = null; newFileModal(); },
  newFileTy: el => { const q = S.recReqs.find(x => x.id === el.dataset.id); ui.newFile = null; newFileModal(); Object.assign(ui.newFile, { type: 'ty', conf: 'Confidential', req: q.id, ref: nextInSeries(q.series), name: q.subject }); newFileModal(); },
  nfType: el => { const nf = ui.newFile; nf.type = el.dataset.k; nf.err = '';
    if (nf.type === 'ty') { nf.conf = 'Confidential'; if (nf.visibility === 'personal') nf.visibility = 'organization'; nf.ref = ''; nf.series = ''; } else { nf.req = ''; nf.ref = ''; nf.conf = 'Internal'; }
    newFileModal(); },
  nfVis: el => { ui.newFile.visibility = el.dataset.k; ui.newFile.err = ''; if (el.dataset.k === 'personal') ui.newFile.series = ''; newFileModal(); },
  nfColour: el => { ui.newFile.color = el.dataset.v; $('#nf-sw').innerHTML = swatches(ui.newFile.color, 'nfColour'); $('#nf-swname').textContent = coverColour(ui.newFile.color).name; paintNf(); },
  nfCancel: () => { const nf = ui.newFile; if (nf && (nf.name.trim() || nf.dept.trim() || nf.ref.trim())) confirmBox('Save as draft?', 'You have started a new file. Would you like to keep it as a draft?', 'nfDiscard', 'Delete Progress', 'nfKeep', 'Save draft'); else closeModal(); },
  nfDiscard: () => { ui.newFile = null; closeModal(); },
  nfKeep: () => { const nf = ui.newFile; if (!nf.name.trim()) nf.name = 'Untitled file'; ACT.createFile({ dataset: { draft: '1' } }); },
  createFile: el => {
    const nf = ui.newFile, asDraft = el?.dataset?.draft === '1';
    const fail = m => { nf.err = m; newFileModal(); };
    if (!nf.name.trim()) return fail('Name / Subject is required.');
    if (nf.type === 'ty' && !nf.req) return fail('Choose the approved temporary-file request this file is opened for.');
    if (nf.visibility === 'department' && !nf.parent && !nf.scopeDept) return fail('Please select a department.');
    if (!asDraft && nf.type !== 'ty' && nf.visibility !== 'personal' && !nf.ref.trim() && !nf.series.trim()) return fail('Give the reference number, or the reference series to take the next number from.');
    const ref = nf.ref.trim() || (nf.series.trim() ? nextInSeries(nf.series.trim()) : nf.visibility === 'personal' && !asDraft ? nextInSeries(`MOH/PERS/${me().id.toUpperCase()}`) : '');
    if (ref && S.files.some(f => f.ref.toLowerCase() === ref.toLowerCase())) { toast('That reference number is already in use'); $('#nf-ref')?.focus(); return; }
    const f = { id: nid('f'), name: nf.name.trim(), ref, vol: nf.vol.trim() || '1', registry: nf.reg, type: nf.type, cover: { color: nf.color, dept: nf.dept.trim(), h1: nf.h1.trim(), h2: nf.h2.trim() },
      createdBy: meId(), created: now(), visibility: nf.parent ? (getFile(nf.parent)?.visibility || 'organization') : nf.visibility, scopeDept: nf.visibility === 'department' ? (nf.parent ? getFile(nf.parent)?.scopeDept : nf.scopeDept) : '', confidentiality: nf.type === 'ty' ? 'Confidential' : nf.conf, description: nf.desc.trim(), stage: 'registry', withUser: 'registry', sentBy: meId(),
      updated: now(), movements: [], docs: [], cabinet: nf.cab.trim(), shelf: nf.shelf.trim(), parent: nf.parent, draft: asDraft };
    if (nf.type === 'ty') { const q = S.recReqs.find(x => x.id === nf.req); if (q) q.fileId = f.id; }
    S.files.unshift(f); save(); closeModal(); ui.newFile = null;
    if (asDraft) { ui.files.show = 'drafts'; go('#/files'); toast('Saved as a draft – find it under Show → Draft files'); return; }
    if (parseHash().parts[0] === 'upload') { ui.upload.fileId = f.id; render(); } else go(`#/file/${f.id}`);
    toast(`File "${f.name}" created.`);
  },

  /* file view */
  fileTab: el => { ui.fileTab = el.dataset.k; const f = currentFile(); refreshSide(f); if (ui.fileTab === 'cover' && $('#side')) { $('#side').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); scrollToPage('cover'); } },
  fileView: el => { ui.fileView = el.dataset.k; render(); if (ui.fileView === 'pages') requestAnimationFrame(() => $('.folio-panel')?.scrollIntoView({ block: 'start', behavior: 'smooth' })); },
  openFolio: el => { ui.fileView = 'pages'; render(); requestAnimationFrame(() => scrollToPage(el.dataset.pg, true)); },
  toastMsg: el => toast(el.dataset.msg),
  letterTab: el => { ui.letterTab = el.dataset.k; render(); },
  starDoc: () => { const { f, d } = curLetter(); d.starred = !d.starred; save(); render(); },
  rmTag: el => { const { d } = curLetter(); d.tags.splice(+el.dataset.i, 1); save(); render(); },
  saveLetterMeta: () => { const { f, d } = curLetter(); const v = id => $('#' + id).value.trim();
    if (!v('lm-subj')) { toast('Give the letter a subject.'); $('#lm-subj').focus(); return; }
    Object.assign(d, { from: v('lm-from'), senderRef: v('lm-ref'), senderRefDate: v('lm-rdate'), subject: v('lm-subj'), received: v('lm-recv') || d.received, confidentiality: v('lm-conf') }); d.modified = now(); f.updated = now(); save(); render(); toast('Metadata saved'); },
  newVersion: () => { const { d } = curLetter(); const vs = docVersions(d), last = vs[vs.length - 1]; vs.push({ ...last, v: last.v + 1, by: me().name, at: now(), scan: 'Clean' }); d.version = last.v + 1; d.modified = now(); save(); render(); toast(`Version ${last.v + 1} uploaded`); },
  addXrefDoc: () => { const { d } = curLetter(); const id = $('#lx-doc').value; if (!id) { toast('Choose a letter to cross-reference.'); return; } (d.crossRefs = d.crossRefs || []).push(id); save(); render(); toast('Cross-reference added'); },
  addEncDoc: () => { const { d } = curLetter(); const t = $('#lx-enc').value.trim(); if (!t) { toast('Describe the enclosure first.'); return; } (d.enclosures = d.enclosures || []).push({ description: t, quantity: '', kept_at: '' }); save(); render(); },
  addBookDoc: () => { const { d } = curLetter(); const t = $('#lx-bt').value.trim(), u = $('#lx-bu').value.trim(); if (!t) { toast('Give the subject or title.'); return; } if (u && !/^https?:\/\//.test(u)) { toast('Links start with http:// or https://'); return; } (d.books = d.books || []).push({ title: t, author: $('#lx-ba').value.trim(), url: u }); save(); render(); },
  postLetterComment: () => { const { d } = curLetter(); const t = $('#lt-cm').value.trim(); if (!t) { toast('Write a comment first.'); $('#lt-cm').focus(); return; } (d.comments = d.comments || []).push({ text: t, by: meId(), at: now() }); save(); render(); toast('Comment posted'); },
  goPage: (el, e) => { e.preventDefault(); scrollToPage(el.dataset.pg); },
  coverColour: el => { const f = currentFile(); f.cover.color = el.dataset.v; f.updated = now(); save(); repaintCovers(f); refreshSide(f); },
  print: () => printFile(),
  senderAdd: () => { const v = val('ms-new').trim(); if (!v) { $('#ms-new').focus(); return; }
    if (S.senders.some(x => x.name.toLowerCase() === v.toLowerCase())) { toast('That name is already on the list'); return; }
    S.senders.push({ id: nid('ms'), name: v, as: 'sender', on: true }); save(); render(); toast('Sender added.'); },
  senderEdit: el => { ui.senders.edit = el.dataset.id; render(); $('#ms-edit')?.focus(); },
  senderSave: el => { const x = S.senders.find(y => y.id === el.dataset.id), v = val('ms-edit').trim(); if (v) x.name = v; ui.senders.edit = ''; save(); render(); toast('Renamed.'); },
  senderToggle: el => { const x = S.senders.find(y => y.id === el.dataset.id); x.on = !x.on; save(); render(); },
  gridExcel: el => { const f = getFile(el.dataset.id), q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [['Date', 'Folio', 'Document', 'Step', 'Officer to see', 'Initials', 'Acknowledged'], ...gridRows(f).map(r => [fmtDT(r.date), r.folio, r.doc, r.step, r.to, r.initials, r.ack])];
    saveFile(`File grid – ${f.ref.replace(/\//g, '-')}.csv`, rows.map(r => r.map(q).join(',')).join('\n'), 'text/csv'); },
  tfClear: el => { ui.tf[el.dataset.k] = { fac: {} }; render(); },
  guideMode: el => { ui.guideMode = el.dataset.k; render(); },
  tutorial: () => { ui.guideMode = 'tour'; go('#/guide'); render(); },
  tutPage: el => go(`#/tutorial/${el.dataset.id}`),
  tourStart: el => startTour(el.dataset.id, +(el.dataset.step || 0)),
  tutZoom: el => { const z = document.createElement('div'); z.className = 'qb-tour-zoom'; z.setAttribute('role', 'dialog'); z.setAttribute('aria-label', 'Screenshot'); z.innerHTML = `<img src="${el.dataset.src}" alt="Screenshot: ${esc(el.dataset.title)}">`;
    const close = () => { z.remove(); removeEventListener('keydown', k); }; const k = e => { if (e.key === 'Escape') close(); };
    z.addEventListener('click', close); addEventListener('keydown', k); document.body.appendChild(z); },
  toggleMv: () => { ui.showMv = !ui.showMv; render(); },
  handOver: () => { ui.ho = { fileId: '', what: 'file', docId: '', toKind: 'officer', to: '', room: '', purpose: '', err: '' }; handOverModal(); },
  hoSave: () => {
    const o = ui.ho;
    o.err = !o.fileId ? 'Select the physical file.' : o.what === 'document' && !o.docId ? 'Select a document in this file.' : o.toKind === 'officer' && !o.to ? 'Choose who the file is handed over to.' : o.toKind === 'room' && !o.room.trim() ? 'Enter the room or office.' : '';
    if (o.err) { handOverModal(); return; }
    S.handovers.push({ id: nid('h'), fileId: o.fileId, what: o.what, docId: o.what === 'document' ? o.docId : null, toKind: o.toKind, to: o.toKind === 'officer' ? o.to : '', room: o.toKind === 'room' ? o.room.trim() : '', purpose: o.purpose.trim(), status: 'SENT', sent: now(), by: meId() });
    if (o.toKind === 'officer') notify(o.to, `${o.what === 'file' ? 'Physical file' : 'A document'} handed over to you – please acknowledge receipt.`, meId(), o.fileId);
    save(); closeModal(); go('#/physical?tab=SENT'); toast(o.what === 'file' ? 'File handed over. Waiting for receipt.' : 'Document handed over. Waiting for receipt.');
  },
  hoReceive: el => { const h = S.handovers.find(x => x.id === el.dataset.id); h.status = 'RECEIVED'; h.received = now(); save(); render(); toast('Receipt acknowledged.'); },
  hoReturn: el => { const h = S.handovers.find(x => x.id === el.dataset.id); h.status = 'RETURNED'; h.returned = now(); save(); render(); toast('Returned to records.'); },
  hoAckReturn: el => rackModal(S.handovers.find(x => x.id === el.dataset.id)),
  hoAckSave: el => { const h = S.handovers.find(x => x.id === el.dataset.id); const v = $('#rk').value.trim(); if (v) getFile(h.fileId).location = v; h.status = 'CLOSED'; h.closed = now(); save(); closeModal(); render(); toast('Return acknowledged.'); },
  recSend: () => {
    const R = ui.rec;
    R.err = R.type === 'OPEN' ? (!R.series.trim() ? 'Enter the reference series.' : !R.subject.trim() ? 'Enter the subject of the file.' : '') : (!R.fileId ? 'Select a file.' : '');
    if (!R.err && !R.reason) R.err = 'Select a reason.';
    if (R.err) { render(); return; }
    S.recReqs.push({ id: nid('q'), type: R.type, series: R.series.trim(), subject: R.subject.trim(), fileId: R.type === 'OPEN' ? null : R.fileId, reason: R.reason, status: 'Awaiting approval', at: now(), by: meId() });
    Object.assign(R, { series: '', subject: '', fileId: '', reason: '', err: '' }); save(); render(); toast('Sent for approval.');
  },
  recCancel: el => { const x = S.recReqs.find(r => r.id === el.dataset.id); x.status = 'Cancelled'; save(); render(); toast('Request cancelled.'); },
  recFState: el => { ui.rec.fstate = el.dataset.k; render(); },
  censusStart: () => {
    const C = ui.census;
    const title = C.title.trim() || `${C.covers === 'hr' ? 'Personnel files' : 'Registry'} census, ${new Date(C.date || Date.now()).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`;
    const files = S.files.filter(f => !f.draft && f.state !== 'Disposed' && (C.covers === 'all' || f.registry === 'hr'));
    const c = { id: nid('c'), title, date: C.date || now().slice(0, 10), covers: C.covers, by: C.by.trim() || `${me().title}, ${me().name}`, at: now(), closed: false, items: files.map(f => ({ fileId: f.id, recorded: f.location, status: 'NONE' })) };
    S.censuses.push(c); C.id = c.id; C.title = ''; C.by = ''; save(); render(); toast('Census started. Every file has been listed.');
  },
  censusOpen: el => { ui.census.id = el.dataset.id; go(`#/census?id=${el.dataset.id}`); },
  censusMark: el => censusMarkModal(S.censuses.find(c => c.id === el.dataset.c), +el.dataset.i, el.dataset.k),
  censusMarkSave: el => {
    const c = S.censuses.find(x => x.id === el.dataset.c), it = c.items[+el.dataset.i], k = el.dataset.k;
    it.status = k; it.officer = $('#cm-off').value.trim(); if (k === 'FOUND') { it.foundAt = $('#cm-at').value.trim(); it.remarks = ''; } else { it.remarks = $('#cm-rem').value.trim(); it.foundAt = ''; }
    save(); closeModal(); render();
  },
  censusClose: el => confirmBox('Close census', 'Close this census? You will not be able to change the checks after this.', 'close', 'Cancel', 'censusCloseYes" data-id="' + el.dataset.id, 'Close census'),
  censusCloseYes: el => { const c = S.censuses.find(x => x.id === el.dataset.id); c.closed = true; save(); closeModal(); render(); toast('Census closed.'); },
  censusExcel: el => {
    const c = S.censuses.find(x => x.id === el.dataset.id); const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [['File reference', 'Subject', 'Recorded location', 'Status', 'Found at', 'Officer', 'Remarks'], ...c.items.map(it => { const f = getFile(it.fileId); return [f.ref, f.name, it.recorded, CEN_STATUS[it.status][0], it.foundAt, it.officer, it.remarks]; })];
    saveFile(`${c.title.replace(/[^\w ,-]+/g, '')}.csv`, rows.map(r => r.map(q).join(',')).join('\n'), 'text/csv');
  },
  toggleTheme: () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('edrms-theme', theme); } catch (e) { /* storage blocked */ }
    const root = document.documentElement; root.classList.add('qb-theme-transition'); root.dataset.theme = theme;
    setTimeout(() => root.classList.remove('qb-theme-transition'), 500);
    $$('.qb-theme-toggle').forEach(b => { b.classList.toggle('is-dark', theme === 'dark'); b.setAttribute('aria-checked', theme === 'dark'); });
  },

  toggleNotes: el => { ui.hideNotes = !ui.hideNotes; $('.pages')?.classList.toggle('hide-notes', ui.hideNotes); el.innerHTML = `${ic('eye')} ${ui.hideNotes ? 'Show notes' : 'Hide notes'}`; el.setAttribute('aria-pressed', ui.hideNotes); },
  openDraft: el => {
    const f = getFile(el.dataset.id);
    if (!f.ref) { ui.fileTab = 'cover'; toast('Give the file a reference number first'); refreshSide(f); return; }
    f.draft = false; f.created = now(); f.updated = now(); save(); render(); toast(`${f.name} is now open in ${regName(f.registry)}`);
  },
  deleteDraft: el => { S.files = S.files.filter(x => x.id !== el.dataset.id); save(); go('#/files'); toast('Draft deleted'); },
  showDrafts: () => { ui.files.show = 'drafts'; go('#/files'); },
  aiIdx: el => { ui.aiIdx = +el.dataset.i; const c = $('.ai-sugg'); if (c) c.outerHTML = aiCard(); },
  sendFile: el => sendModal(getFile(el.dataset.id), el.dataset.to),
  confirmSend: el => {
    const f = getFile(el.dataset.id), isMark = el.dataset.to === 'marking', note = val('sd-note');
    let to = val('sd-to');
    if (isMark) {
      const picks = $$('[data-change=smPick]');
      if (!picks.some(c => c.checked)) { const e = $('#sm-err'); e.textContent = 'Tick at least one letter or document to send.'; e.hidden = false; return; }
      f.keptBack = picks.filter(c => !c.checked).map(c => c.value);
      if (!to) to = 'vera';
    }
    if (note) addMinute(f, [...liveDocs(f)].sort(byFolio).pop(), note, meId());
    f.stage = isMark ? 'marking' : 'action'; f.withUser = to; f.sentBy = meId(); f.delegatedBy = null;
    if (isMark) { f.markedTo = null; f.instruction = null; }
    move(f, meId(), to);
    notify(to, isMark ? 'File sent to you for marking.' : 'File forwarded to you.', meId(), f.id);
    save(); closeModal(); render(); toast(isMark ? 'File sent to the Marking Officer.' : `Sent to ${person(to).name}`);
  },
  sendOutside: el => { const f = getFile(el.dataset.f || el.dataset.id); sendOutsideModal(f, el.dataset.d); },
  sendOutsideSave: el => {
    const f = getFile(el.dataset.id), to = val('so-to').trim(), ids = $$('input[name=so-l]:checked').map(c => c.value);
    const err = m => { const e = $('#so-err'); e.textContent = m; e.hidden = false; };
    if (!to) return err('Choose who it is being sent to.');
    if (!S.senders.some(x => x.on && x.name.toLowerCase() === to.toLowerCase())) return err('Only people who are already senders in the Inward Mail Register can be chosen. Add the name on Mail Senders first.');
    if (!ids.length) return err('Tick at least one letter.');
    const ds = val('so-date'), rec = { at: ds ? new Date(ds + 'T12:00:00').toISOString() : now(), to, ref: val('so-ref'), how: val('so-how'), remarks: val('so-rem'), by: meId() };
    ids.forEach(id => { S.dispatch[id] = rec; });
    const sx = S.senders.find(x => x.name.toLowerCase() === to.toLowerCase()); if (sx.as === 'sender') sx.as = 'both';
    save(); closeModal(); render(); toast('Sent outside and recorded in the Outward Mail Register.');
  },
  fileAway: el => { const f = getFile(el.dataset.id); f.stage = 'filed'; f.updated = now(); save(); render(); toast(`${f.name} filed away`); },
  retrieve: el => { const f = getFile(el.dataset.id); f.stage = 'registry'; f.updated = now(); save(); render(); toast('File is back in the Registry'); },
  markFile: el => markModal(getFile(el.dataset.id)),
  confirmMark: el => {
    const f = getFile(el.dataset.id), ins = need('mk-ins', 'Instruction'); if (!ins) return;
    const to = val('mk-to'), d = getDoc(f, val('mk-folio')) || liveDocs(f).pop();
    addMinute(f, d, `${person(to).title} – ${ins}`, 'vera', { ink: 'red' });
    const st = val('mk-sticky'); if (st && d) d.stickies.push({ id: nid('s'), text: st, by: 'vera', at: now(), x: 63, y: 12, color: 'yellow', to, folded: false });
    f.stage = 'returned_marking'; f.withUser = 'registry'; f.markedTo = to; f.instruction = ins; f.sentBy = 'vera';
    move(f, 'vera', 'registry');
    notify('registry', `Marked to ${person(to).name}. Returned from marking.`, 'vera', f.id);
    save(); closeModal(); render(); toast('Marked and returned to the Registry');
  },
  sign: el => { const f = getFile(el.dataset.f), d = getDoc(f, el.dataset.d); d.signed = !d.signed; save(); render(); toast(d.signed ? 'Signed and stamped' : 'Stamp removed'); },
  validate: el => { const f = getFile(el.dataset.file), d = getDoc(f, el.dataset.doc); d.status = 'filed'; f.updated = now(); save(); render(); toast(`Folio ${d.folio} added to ${f.name}`); },

  /* comments */
  addComment: el => {
    const f = getFile(el.dataset.f), d = getDoc(f, el.dataset.d);
    if (ui.editing) ACT.mnCancel();
    const m = { id: nid('m'), n: null, text: '', by: meId(), at: now(), x: 30, y: 38, w: 40, ink: 'blue', font: 'neat' };
    d.minutes.push(m); ui.sel = { f: f.id, d: d.id, id: m.id }; ui.editing = m.id;
    repaintLayer(f.id, d.id);
    $('#mn-edit')?.closest('.mn').scrollIntoView({ behavior: 'smooth', block: 'center' });
  },
  mnInk: el => { const { f, d, m } = selMinute(); if (!m) return; if (ui.editing) m.text = $('#mn-edit')?.value ?? m.text; m.ink = el.dataset.v; if (!ui.editing) save(); repaintLayer(f.id, d.id); },
  mnFont: el => { const { f, d, m } = selMinute(); if (!m) return; if (ui.editing) m.text = $('#mn-edit')?.value ?? m.text; m.font = el.dataset.v; if (!ui.editing) save(); repaintLayer(f.id, d.id); },
  mnSave: () => {
    const { f, d, m } = selMinute(); if (!m) return;
    const text = ($('#mn-edit')?.value || '').trim(); if (!text) { toast('Write your comment first'); $('#mn-edit')?.focus(); return; }
    m.text = text; if (!m.n) m.n = nextMinuteNo(f, d); m.at = now(); ui.editing = null; f.updated = now();
    save(); repaintLayer(f.id, d.id); refreshSide(f); toast(`Minute ${m.n} added – drag it anywhere on the page`);
  },
  mnCancel: () => {
    const { f, d, m } = selMinute(); ui.editing = null;
    if (m && !m.n) d.minutes = d.minutes.filter(x => x.id !== m.id);
    ui.sel = null; if (f) repaintLayer(f.id, d.id);
  },
  mnDel: () => { const { f, d, m } = selMinute(); if (!m) return; d.minutes = d.minutes.filter(x => x.id !== m.id); ui.sel = null; save(); repaintLayer(f.id, d.id); refreshSide(f); toast(`Minute ${m.n} deleted`); },

  /* sticky notes */
  addSticky: el => { const f = getFile(el.dataset.f); stickyModal(f, getDoc(f, el.dataset.d)); },
  snColour: el => { ui.stickyColor = el.dataset.v; $('#sn-sw').innerHTML = stickySwatches(); $('#sn-text').style.background = stickyCol(ui.stickyColor); },
  confirmSticky: el => {
    const f = getFile(el.dataset.f), d = getDoc(f, el.dataset.d), text = need('sn-text', 'Note'); if (!text) return;
    const to = val('sn-to'), n = d.stickies.length;
    d.stickies.push({ id: nid('s'), text, by: meId(), at: now(), x: clamp(58 - n * 4, 4, 70), y: clamp(10 + n * 9, 4, 80), color: ui.stickyColor, to, folded: false });
    if (to !== 'public') notify(to, `Left you a sticky note: "${text.slice(0, 40)}"`, meId(), f.id);
    f.updated = now(); save(); closeModal(); repaintLayer(f.id, d.id); refreshSide(f); scrollToPage(d.id, true); toast('Sticky note added – drag it where you want it');
  },
  snFold: el => { const w = el.closest('[data-kind=sticky]'); const f = getFile(w.dataset.f), d = getDoc(f, w.dataset.d), s = d.stickies.find(x => x.id === w.dataset.id); s.folded = !s.folded; save(); repaintLayer(f.id, d.id); },
  snDel: el => { const w = el.closest('[data-kind=sticky]'); const f = getFile(w.dataset.f), d = getDoc(f, w.dataset.d); d.stickies = d.stickies.filter(x => x.id !== w.dataset.id); save(); repaintLayer(f.id, d.id); refreshSide(f); toast('Sticky note removed'); },

  /* responses */
  respond: el => respondModal(getFile(el.dataset.id), el.dataset.folio),
  respMode: el => { ui.resp.mode = el.dataset.k; respondModal(getFile(ui.resp.fid)); },
  pickTpl: el => { ui.resp.tpl = el.dataset.v; $$('.tpl').forEach(b => b.classList.toggle('on', b === el)); },
  viewTpl: () => { if (!ui.resp.subject.trim()) { need('rs-subject', 'Subject'); return; } tplPreview(); },
  backToResp: () => respondModal(getFile(ui.resp.fid)),
  downloadTpl: async () => { const R = ui.resp, f = getFile(R.fid); if (await downloadDoc(R.subject || 'Response', tplHTML(R.tpl, respCtx(f, R)))) toast(inFrame ? 'Saved – opens in Word or any browser' : 'Downloaded as a Word document'); },
  sendResponse: () => {
    const R = ui.resp, f = getFile(R.fid);
    if (!R.subject.trim()) { if ($('#rs-subject')) need('rs-subject', 'Subject'); else { respondModal(f); toast('Subject is required'); } return; }
    if (R.mode === 'upload' && !R.fname) { toast('Choose a file to upload'); return; }
    const c = respCtx(f, R);
    const d = { id: nid('d'), folio: nextSubFolio(f, R.folio), title: R.subject.trim(), kind: R.mode === 'upload' ? 'attachment' : 'response', template: R.tpl, from: me().name, date: now(),
      edms: 'EDMS-0001-2026-' + String(S.seq + 40).padStart(7, '0'), pages: 1, sizeKB: 120, minutes: [], stickies: [], signed: R.sign, status: 'filed', to: R.to,
      subject: c.subject, body: R.body.trim() ? c.body : LOREM.slice(0, 2), mime: R.mode === 'upload' ? R.fname.split('.').pop().toUpperCase() : undefined };
    f.docs.push(d); f.updated = d.date; ui.resp = null; ui.fileView = 'pages'; save(); closeModal(); render(); scrollToPage(d.id, true); toast(`Response sent as folio ${d.folio}`);
  },
  requestFiles: el => requestModal(getFile(el.dataset.id)),
  confirmRequest: el => {
    const f = getFile(el.dataset.id), why = need('rq-why', 'Reason'); if (!why) return;
    S.requests.unshift({ id: nid('r'), by: meId(), fileId: f.id, want: val('rq-file'), reason: why, at: now(), status: 'open' });
    notify('registry', 'Requested a file.', meId(), f.id); save(); closeModal(); render(); toast('Request sent to the Registry');
  },
  requestAny: () => requestAnyModal(),
  confirmRequestAny: () => {
    const f = getFile(val('ra-file')), why = need('ra-why', 'Reason'); if (!f || !why) return;
    S.requests.unshift({ id: nid('r'), by: meId(), fileId: null, wantId: f.id, want: f.ref, reason: why, at: now(), status: 'open' });
    notify('registry', `Requested file ${f.ref}.`, meId(), f.id); save(); closeModal(); render(); toast('Request sent to the Registry. You will be notified when the file is sent.');
  },
  goBack: el => { const st = ui.navStack || []; go(st.length > 1 ? st[st.length - 2] : (el.dataset.fallback || '#/')); },
  approveReq: el => { const x = S.requests.find(r => r.id === el.dataset.id); x.status = 'sent'; notify(x.by, `Requested file ${x.want} sent to you.`, meId(), x.fileId); save(); render(); toast(`Sent ${x.want} to ${person(x.by).name}`); },
  delegate: el => delegateModal(getFile(el.dataset.id)),
  confirmDelegate: el => {
    const f = getFile(el.dataset.id), note = need('dl-note', 'Instruction'); if (!note) return;
    const to = val('dl-to'); addMinute(f, [...liveDocs(f)].sort(byFolio).pop(), `${person(to).title} – ${note}`, meId());
    f.delegatedBy = meId(); f.withUser = to; move(f, meId(), to);
    notify(to, 'Letter delegated to you.', meId(), f.id); save(); closeModal(); go('#/'); toast(`Delegated to ${person(to).name}`);
  },
  done: el => doneModal(getFile(el.dataset.id)),
  confirmDone: el => {
    const f = getFile(el.dataset.id), note = need('dn-note', 'Closing minute'); if (!note) return;
    addMinute(f, [...liveDocs(f)].sort(byFolio).pop(), note, meId());
    f.stage = 'returned_action'; f.withUser = 'registry'; f.sentBy = meId(); move(f, meId(), 'registry');
    notify('registry', 'File returned from action.', meId(), f.id); save(); closeModal(); go('#/'); toast('Returned to the Registry');
  },

  /* registers */
  dispatch: el => { S.dispatch[el.dataset.id] = now(); save(); render(); toast('Marked as dispatched'); },
  addBringup: el => bringupModal(el?.dataset?.id),
  confirmBringup: () => { const note = need('bu-note', 'Reason'); if (!note) return; S.bringups.push({ id: nid('b'), fileId: val('bu-file'), date: new Date(val('bu-date') + 'T09:00').toISOString(), note, by: meId(), for: val('bu-for'), done: false }); save(); closeModal(); render(); toast('Added to the bring-up diary'); },
  bringupDone: el => { S.bringups.find(b => b.id === el.dataset.id).done = true; save(); render(); toast('Bring-up done'); },
  requestAccess: () => accessModal(),
  confirmAccess: () => { const why = need('ac-why', 'Reason'); if (!why) return; S.access.unshift({ id: nid('a'), by: meId(), fileId: val('ac-file'), reason: why, days: +val('ac-days'), at: now(), status: 'open' }); save(); closeModal(); render(); toast('Access requested'); },
  accessDecide: el => { const a = S.access.find(x => x.id === el.dataset.id); a.status = el.dataset.v; if (a.status === 'approved') a.expires = new Date(Date.now() + a.days * 864e5).toISOString(); notify(a.by, `Access ${a.status}.`, meId(), a.fileId); save(); render(); toast(`Request ${a.status}`); },

  /* upload */
  upTab: el => { ui.upload.tab = el.dataset.k; ui.upload.files = []; ui.upload.step = 1; ui.upload.err = ''; render(); },
  upNext: () => {
    const u = ui.upload;
    if (!u.fileId) { u.err = 'Select a File first – every document must be in a file.'; render(); $('#up-file')?.focus(); return; }
    if (!u.files.length) { u.err = u.tab === 'email' ? 'Pick at least one email to import.' : 'Add a document to upload.'; render(); return; }
    u.err = ''; runAI();
  },
  upBack: () => { const u = ui.upload; u.err = ''; u.step = 1; render(); },
  upDoc: el => { const u = ui.upload; u.idx = clamp(u.idx + +el.dataset.d, 0, u.files.length - 1); u.err = ''; render(); },
  addEnc: () => { ui.upload.metas[ui.upload.idx].enclosures.push({ description: '', quantity: '', kept_at: '' }); render(); $$('[data-enc]').slice(-3)[0]?.focus(); },
  rmEnc: el => { ui.upload.metas[ui.upload.idx].enclosures.splice(+el.dataset.i, 1); render(); },
  rmXref: el => { const m = ui.upload.metas[ui.upload.idx]; m.cross_refs = m.cross_refs.filter(x => x !== el.dataset.id); m._touched.cross_refs = true; render(); },
  upDash: () => { closeModal(); go('#/'); },
  upGoFile: el => { closeModal(); go(`#/file/${el.dataset.f}/doc/${el.dataset.d}`); },
  upSign: el => { const f = getFile(el.dataset.f), d = getDoc(f, el.dataset.d); d.signed = true; save(); closeModal(); go(`#/file/${f.id}/doc/${d.id}`); toast('Signed or stamped. The signed copy will be filed.'); },
  upCancel: () => { if (ui.upload.fileId || ui.upload.files.length) draftModal(); else go('#/'); },
  draftDelete: () => { ui.upload = freshUpload(); closeModal(); go('#/'); },
  draftSave: () => { const u = ui.upload; S.drafts.push({ ...u, step: u.step === 'ai' ? 1 : u.step, files: u.files.map(x => ({ ...x, url: '' })), err: '', at: now() }); save(); ui.upload = freshUpload(); closeModal(); go('#/'); toast('Draft saved'); },
  openDrafts: (el, e) => { e.preventDefault(); const d = S.drafts.pop(); if (d) { ui.upload = { ...d }; save(); render(); toast('Draft restored'); } },
  upSave: () => {
    const u = ui.upload, f = getFile(u.fileId);
    for (let i = 0; i < u.metas.length; i++) { const err = validateMeta(u.metas[i]); if (err) { u.idx = i; u.err = err; render(); return; } }
    let folio = parseInt(nextFolio(f), 10);
    let serial = S.files.flatMap(ff => ff.docs).filter(d => d.kind !== 'response').length;
    const added = u.files.map((x, i) => {
      const m = u.metas[i], ext = m._ext;
      const fno = m.folio_no ? String(m.folio_no) : String(folio++);
      const d = { id: nid('d'), folio: fno, title: m.subject.trim(), kind: ['PNG', 'JPG', 'JPEG', 'XLSX'].includes(ext) ? 'attachment' : 'letter', mime: ext,
        from: m.source_name.trim(), date: new Date(m.date_received + 'T09:00').toISOString(), edms: 'EDMS-0001-2026-' + String(S.seq + 40).padStart(7, '0'), pages: m._pages, sizeKB: x.kb || 240,
        minutes: [], stickies: [], signed: false, status: 'filed', to: 'The Principal Secretary, State Department for Medical Services', subject: m.subject.trim().toUpperCase(), body: LOREM,
        uploadedBy: meId(), senderRef: m.sender_ref_no.trim(), senderRefDate: m.sender_ref_date, serial: m.serial_no ? +m.serial_no : ++serial,
        confidentiality: m.confidentiality_level, restricted: m.restricted, crossRefs: m.cross_refs, enclosures: m.enclosures.filter(e => e.description.trim()) };
      f.docs.push(d); return d;
    });
    added.forEach(d => { if (d.from && !S.senders.some(x => x.name.toLowerCase() === d.from.toLowerCase())) S.senders.push({ id: nid('ms'), name: d.from, as: 'sender', on: true }); });
    f.updated = now(); save(); ui.upload = freshUpload(); render();
    filedModal(f, added);
  },

  /* guide */
  guideGo: (el, e) => { e.preventDefault(); if (ui.guideQ) { ui.guideQ = ''; render(); } $('#g-' + el.dataset.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); $$('.guide-toc a').forEach(a => a.classList.toggle('on', a.dataset.id === el.dataset.id)); },

  /* AI Support */
  fabToggle: () => setFab(!ui.fabOpen),
  fabGuide: () => { setFab(false); go('#/guide'); },
  fabChat: () => openChat(),
  aipAsk: el => aipAsk(el.dataset.q),
  aipSend: () => { const i = $('#aip-q'); const q = i.value; i.value = ''; aipAsk(q); },
  aipNew: () => { ui.chat = []; render(); },
  fabCapture: () => captureScreen(),
  closeChat: () => { $('#ai-panel')?.remove(); $('.qb-side-ai')?.classList.remove('is-active'); },
  aiFaq: el => aiAsk(el.dataset.q),
  aiSend: () => { const i = $('#ai-q'); aiAsk(i.value); i.value = ''; },
  capUndo: () => { ui.capRects.pop(); ui.cap.text = val('cap-text'); captureModal(); },
  capType: el => { ui.cap.type = el.dataset.v; $$('.type-seg button').forEach(b => { const on = b === el; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); }); },
  capRetake: () => { ui.cap.text = val('cap-text'); captureScreen(true); },
  capDownload: () => composeCap(2400).toBlob(b => saveFile(`edrms-issue-${new Date().toISOString().slice(0, 10)}.png`, b, 'image/png')),
  capSubmit: () => {
    const text = need('cap-text', 'Description'); if (!text) return;
    const C = ui.cap;
    const issue = { id: nid('i'), at: now(), page: pageName(), type: C.type, text, by: meId(), img: C.src && C.attach ? composeCap(900).toDataURL('image/jpeg', .7) : '' };
    S.issues.unshift(issue);
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { issue.img = ''; save(); }
    closeModal(); toast('Thanks – your report was sent to support');
    if (parseHash().parts[0] === 'settings') render();
  },
};


document.addEventListener('click', e => {
  const a = e.target.closest('[data-act]');
  if (a && ACT[a.dataset.act]) {
    if (a.tagName === 'A' && a.getAttribute('href') && a.dataset.act === 'close') { e.preventDefault(); closeModal(); go(a.getAttribute('href')); return; }
    e.preventDefault(); ACT[a.dataset.act](a, e); return;
  }
  if ($('#acct-menu') && !e.target.closest('#acct-menu')) closeAcct();
  if (ui.fabOpen && !e.target.closest('#fab')) setFab(false);
  const link = e.target.closest('a[href^="#/"]');
  if (link) { e.preventDefault(); if (link.closest('#overlay, #drawer')) closeModal(); go(link.getAttribute('href')); return; }
  const h = e.target.closest('[data-href]');
  if (h && (h.tagName === 'BUTTON' || !e.target.closest('a,button,input,select,label'))) go(h.dataset.href);
});
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && S.session) { e.preventDefault(); paletteModal(); }
  if (e.key === 'Escape' && $('#acct-menu')) { closeAcct(true); return; }
  if (e.key === 'Escape') { if (ui.editing) ACT.mnCancel(); else if (ui.fabOpen) setFab(false); else if ($('#ai-panel') && !$('#overlay')) $('#ai-panel').remove(); else closeModal(); }
  if (e.key === 'Enter' && e.target.classList?.contains('fcard')) go(e.target.dataset.href);
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('.folio-tbl tr[data-href]')) { e.preventDefault(); go(e.target.dataset.href); }
  if (e.key === 'Enter' && e.target.id === 'lt-tag') { const t = e.target.value.trim(); if (t) { const { d } = curLetter(); (d.tags = d.tags || []).push(t); save(); render(); $('#lt-tag')?.focus(); } }
  if (e.key === 'Enter' && e.target.id === 'pal-q') { const a = $('#pal-list a'); if (a) { closeModal(); go(a.getAttribute('href')); } }
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && e.target.id === 'mn-edit') ACT.mnSave();
});
const asUpload = f => ({ name: f.name, size: fmtSize(f.size / 1024), kb: f.size / 1024, url: /^image\//.test(f.type) ? URL.createObjectURL(f) : '' });
function refocus(id, pos) { const i = $('#' + id); if (i) { i.focus(); i.setSelectionRange(pos, pos); } }
document.addEventListener('input', e => {
  const t = e.target, k = t.dataset.input;
  if (tfInput(t)) return;
  if (k === 'filesQuery') { ui.files.q = t.value; const p = t.selectionStart; render(); refocus('files-q', p); }
  if (k === 'dashQ') { ui.dash.q = t.value; const p = t.selectionStart; $('#route-panel').innerHTML = routePanel(); refocus('dash-q', p); }
  if (k === 'guideQ') { ui.guideQ = t.value; const p = t.selectionStart; render(); refocus('guide-q', p); }
  if (k === 'palette') ui.paletteDraw?.(t.value);
  if (t.dataset.nf) {
    const nf = ui.newFile; nf[t.dataset.nf] = t.value; paintNf();
    if (t.dataset.nf === 'ref') { const w = $('#nf-series-wrap'); if (w) { const hide = !!t.value.trim() || nf.type === 'ty' || nf.visibility === 'personal'; w.hidden = hide; if (hide) nf.series = ''; } }
    if (t.dataset.nf === 'parent') { const p = getFile(t.value); if (p) nf.visibility = p.visibility || 'organization'; newFileModal(); }
  }
  if (t.dataset.resp && t.type !== 'checkbox') ui.resp[t.dataset.resp] = t.value;
  if (t.dataset.capt) ui.cap.text = t.value;
  if (t.dataset.ho) ui.ho[t.dataset.ho] = t.value;
  if (t.dataset.rec) ui.rec[t.dataset.rec] = t.value;
  if (t.dataset.cn) ui.census[t.dataset.cn] = t.value;
  if (t.dataset.um) { const m = ui.upload.metas[ui.upload.idx]; m[t.dataset.um] = t.value; if (m._suggested[t.dataset.um] && !m._touched[t.dataset.um]) { m._touched[t.dataset.um] = true; t.classList.remove('ai'); t.closest('.field')?.querySelector('.ai-chip')?.remove(); } }
  if (t.dataset.enc) { const [i, k] = t.dataset.enc.split(':'); ui.upload.metas[ui.upload.idx].enclosures[+i][k] = t.value; }
  if (t.dataset.cover) {
    const f = currentFile(); if (!f) return;
    if (t.dataset.cover === 'name') { if (!t.value.trim()) return; f.name = t.value; const h = $('.phead h1'); if (h) h.textContent = t.value; }
    else f.cover[t.dataset.cover] = t.value;
    f.updated = now(); save(); repaintCovers(f);
  }
});
document.addEventListener('change', e => {
  const t = e.target, k = t.dataset.change;
  if (tfInput(t)) return;
  if (t.dataset.resp === 'folio') { ui.resp.folio = t.value; const n = $('#rs-next'); if (n) n.textContent = nextSubFolio(getFile(ui.resp.fid), t.value); }
  if (t.dataset.resp === 'sign') ui.resp.sign = t.checked;
  if (!k) return;
  if (k === 'filesSort') { ui.files.sort = t.value; render(); }
  if (k === 'filesShow') { ui.files.show = t.value; render(); }
  if (k === 'filesReg') { ui.files.reg = t.value; render(); }
  if (k === 'dashStage') { ui.dash.stage = t.value; $('#route-panel').innerHTML = routePanel(); }
  if (k === 'mvFile') { ui.mvFile = t.value; render(); }
  if (k === 'coverPriority') { const f = currentFile(); f.priority = t.checked; save(); render(); }
  if (k === 'uploadFile') { ui.upload.fileId = t.value; render(); }
  if (k === 'sendersOff') { ui.senders.off = t.checked; render(); }
  if (k === 'smPick') t.closest('.pick')?.classList.toggle('off', !t.checked);
  if (k === 'routeStage') go(`#/routing?stage=${t.value}`);
  if (k === 'nfScopeDept') { ui.newFile.scopeDept = t.value; ui.newFile.err = ''; }
  if (k === 'nfReq') { const nf = ui.newFile, q = S.recReqs.find(x => x.id === t.value); nf.req = t.value; nf.err = '';
    nf.ref = q ? nextInSeries(q.series) : ''; if (q && !nf.name.trim()) nf.name = q.subject; newFileModal(); }
  if (k === 'hoFile') { ui.ho.fileId = t.value; ui.ho.docId = ''; handOverModal(); }
  if (k === 'hoWhat') { ui.ho.what = t.value; handOverModal(); }
  if (k === 'hoDoc') ui.ho.docId = t.value;
  if (k === 'hoToKind') { ui.ho.toKind = t.value; handOverModal(); }
  if (k === 'hoTo') ui.ho.to = t.value;
  if (k === 'recType') { Object.assign(ui.rec, { type: t.value, fileId: '', reason: '', err: '' }); render(); }
  if (k === 'recFile') ui.rec.fileId = t.value;
  if (k === 'recReason') ui.rec.reason = t.value;
  if (k === 'cnCovers') ui.census.covers = t.value;
  if (k === 'pickUpload') { ui.upload.files = [...t.files].map(asUpload); ui.upload.err = ''; render(); }
  if (k === 'umConf') { const m = ui.upload.metas[ui.upload.idx]; m.confidentiality_level = t.value; m._touched.confidentiality_level = true; render(); }
  if (k === 'umRestrict') { const m = ui.upload.metas[ui.upload.idx]; m.restricted = t.checked ? [...m.restricted, t.value] : m.restricted.filter(x => x !== t.value); }
  if (k === 'addXref' && t.value) { const m = ui.upload.metas[ui.upload.idx]; m.cross_refs.push(t.value); render(); }
  if (k === 'mailPick') { const m = MAILBOX.find(x => x.id === t.value); ui.upload.files = t.checked ? [...ui.upload.files, { id: m.id, name: m.att, size: 'from email', kb: 180 }] : ui.upload.files.filter(x => x.id !== m.id); ui.upload.err = ''; render(); }
  if (k === 'capAttach') { ui.cap.attach = t.checked; $('.cap-stage')?.classList.toggle('off', !t.checked); }
  if (k === 'respFile') { const f = t.files[0]; if (f) { ui.resp.fname = f.name; if (!ui.resp.subject) ui.resp.subject = f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '); respondModal(getFile(ui.resp.fid)); } }
});
document.addEventListener('dragover', e => { const z = e.target.closest?.('.dropzone'); if (z) { e.preventDefault(); z.classList.add('drag'); } });
document.addEventListener('dragleave', e => { e.target.closest?.('.dropzone')?.classList.remove('drag'); });
document.addEventListener('drop', e => {
  const z = e.target.closest?.('.dropzone'); if (!z || !$('#dropzone')) return; e.preventDefault();
  const files = [...e.dataTransfer.files]; if (!files.length) return;
  ui.upload.files = (ui.upload.tab === 'bulk' ? files : files.slice(0, 1)).map(asUpload); ui.upload.err = ''; render();
});

render();
