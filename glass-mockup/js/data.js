/* ==========================================================================
   Q-BITS EDRMS — glass UI mockup
   Seed data. Mirrors the files, people and routing trail of the live system
   (edrms.qbits.africa) so the journeys behave the same way.
   ========================================================================== */

const TODAY = new Date('2026-11-01T16:30:00+03:00');
const daysAgo = (d, h = 10, m = 0) => {
  const t = new Date(TODAY); t.setDate(t.getDate() - d); t.setHours(h, m, 0, 0); return t.toISOString();
};
const daysAhead = d => daysAgo(-d, 9);

/* ---- People ------------------------------------------------------------ */
const PEOPLE = {
  john:     { id: 'john',     name: 'John Kimani',     title: 'Registry Officer',                    role: 'registry', registry: 'main', dept: 'Main Registry' },
  vera:     { id: 'vera',     name: 'Vera Wambui',     title: 'Principal Secretary',                 role: 'marking',  registry: 'main', dept: 'Ministry of Health - State Department for Medical Services' },
  virah:    { id: 'virah',    name: 'Virah Creates',   title: 'Head, National Vaccination Services', role: 'action',   registry: 'main', dept: 'National Vaccines and Immunization Programme' },
  henry:    { id: 'henry',    name: 'Henry Kiprotich', title: 'Registry Officer',                    role: 'registry', registry: 'main', dept: 'Main Registry' },
  erickson: { id: 'erickson', name: 'Erickson Maluki', title: 'Head, ICT',                           role: 'action',   registry: 'main', dept: 'Directorate of ICT' },
  rachael:  { id: 'rachael',  name: 'Rachael Nyagah',  title: 'Registry Officer',                    role: 'registry', registry: 'hr',   dept: 'HR Registry' },
  dalizu:   { id: 'dalizu',   name: 'John Dalizu',     title: 'Director General for Health',         role: 'marking',  registry: 'main', dept: 'Office of the Director General' },
  achieng:  { id: 'achieng',  name: 'Mercy Achieng',   title: 'Head, Supply Chain Management',       role: 'action',   registry: 'hr',   dept: 'Supply Chain Management Services' },
  otieno:   { id: 'otieno',   name: 'Brian Otieno',    title: 'Head, Public Communication',          role: 'action',   registry: 'main', dept: 'Public Communication' },
};
const ACCOUNTS = { registry: 'john', marking: 'vera', action: 'virah' };
/* Mockup sign-in: work email -> account. Every account uses the same demo password. */
const LOGINS = { 'john.kimani@health.go.ke': 'registry', 'vera.wambui@health.go.ke': 'marking', 'virah.creates@health.go.ke': 'action' };
const DEMO_PASSWORD = 'Edrms@2026';
const ROLE_LABEL = { registry: 'Registry Officer', marking: 'Marking Officer', action: 'Action Officer' };

/* ---- Registries -------------------------------------------------------- */
const REGISTRIES = [
  { id: 'main', name: 'Main Registry', tint: 'lilac', officer: 'john' },
  { id: 'hr',   name: 'HR Registry',   tint: 'sky',   officer: 'rachael' },
];

/* ---- Routing stages (as the live File Movement tabs) -------------------- */
const STAGES = {
  registry:         { label: 'In Registry',              short: 'In Registry',           tone: 'neutral' },
  marking:          { label: 'With the Marking Officer', short: 'With Marking Officer',  tone: 'amber' },
  returned_marking: { label: 'Returned from marking',    short: 'Returned from marking', tone: 'violet' },
  action:           { label: 'With the Action Officer',  short: 'With Action Officer',   tone: 'teal' },
  returned_action:  { label: 'Returned from action',     short: 'Returned from action',  tone: 'blue' },
  filed:            { label: 'Filed away',               short: 'Filed away',            tone: 'green' },
};
const STAGE_ORDER = ['marking', 'returned_marking', 'action', 'returned_action', 'filed'];

/* ---- File cover (the paper file, as in the live New File form) --------- */
const COVER_COLOURS = [
  { id: 'blue',   name: 'Blue',   bg: '#4f8bdc', ink: '#0f2445' },
  { id: 'green',  name: 'Green',  bg: '#5fa66f', ink: '#0f2b17' },
  { id: 'yellow', name: 'Yellow', bg: '#ebd05c', ink: '#2e2608' },
  { id: 'red',    name: 'Red',    bg: '#c85b50', ink: '#fff6f3' },
  { id: 'orange', name: 'Orange', bg: '#e3933f', ink: '#2c1703' },
  { id: 'pink',   name: 'Pink',   bg: '#dc89ae', ink: '#33101f' },
  { id: 'purple', name: 'Purple', bg: '#7d5ec2', ink: '#fbf8ff' },
  { id: 'grey',   name: 'Grey',   bg: '#a1a8b3', ink: '#151a22' },
  { id: 'manila', name: 'Manila', bg: '#e3d09f', ink: '#2b2110' },
  { id: 'white',  name: 'White',  bg: '#f4f3ef', ink: '#1b2233' },
];
const coverColour = id => COVER_COLOURS.find(c => c.id === id) || COVER_COLOURS[0];

/* ---- Annotation styles -------------------------------------------------- */
const INKS = [
  { id: 'blue',  name: 'Blue-black', c: '#1d2f7a' },
  { id: 'black', name: 'Black',      c: '#151515' },
  { id: 'red',   name: 'Red',        c: '#b3261e' },
  { id: 'green', name: 'Green',      c: '#1c6b40' },
];
const HANDS = [
  { id: 'neat',    name: 'Neat',    css: "'Caveat', cursive",         scale: 1.15 },
  { id: 'print',   name: 'Print',   css: "'Kalam', cursive",          scale: .92 },
  { id: 'cursive', name: 'Cursive', css: "'Homemade Apple', cursive", scale: .78 },
];
const STICKY_COLOURS = [
  { id: 'yellow', c: '#ffe27a' }, { id: 'pink', c: '#ffb3cf' }, { id: 'green', c: '#b9efb2' },
  { id: 'blue', c: '#a9d6ff' }, { id: 'orange', c: '#ffc58a' }, { id: 'lilac', c: '#d9c6ff' },
];

/* ---- Letter bodies ----------------------------------------------------- */
const LOREM = [
  'Reference is made to the above subject matter and our earlier correspondence on the same.',
  'The purpose of this letter is to request your office to review the attached documents and advise on the next course of action at your earliest convenience.',
  'Kindly note that the matter is time-bound and requires the attention of the relevant directorate before the close of the current financial quarter.',
  'We appreciate your continued support and cooperation.',
];

/* Default places for seeded minutes: two columns in the lower blank area */
function placeMinutes(list) {
  return list.map((m, i) => ({ x: i % 2 ? 51 : 7, y: 63 + Math.floor(i / 2) * 11, w: 40, ink: i % 3 === 2 ? 'red' : 'blue', font: ['neat', 'print', 'cursive'][i % 3], ...m }));
}
let _sid = 0;
const sticky = (text, by, d, h, m, extra = {}) => ({ id: 's' + (++_sid), text, by, at: daysAgo(d, h, m), x: 63, y: 13, color: 'yellow', to: 'public', folded: false, ...extra });

const doc = (id, folio, title, kind, from, d, extra = {}) => ({
  id, folio, title, kind, from, date: daysAgo(d, 9 + (folio.length % 5), 15),
  edms: 'EDMS-0001-2026-' + String(28 + Number(String(id).replace(/\D/g, ''))).padStart(7, '0'),
  pages: extra.pages || 1 + (id.length % 3), sizeKB: extra.sizeKB || (extra.pages || 2) * 140 + 60,
  signed: !!extra.signed, status: extra.status || 'filed', to: extra.to || 'The Principal Secretary, State Department for Medical Services',
  body: extra.body || LOREM, stickies: [], ...extra,
  minutes: placeMinutes(extra.minutes || []),
});
const minute = (n, text, by, d, h, m, extra = {}) => ({ n, text, by, at: daysAgo(d, h, m), ...extra });

/* ---- Files ------------------------------------------------------------- */
function seedFiles() {
  _sid = 0;
  const it = [
    minute('I', 'Hello, Kindly Work on this', 'henry', 14, 23, 17),
    minute('II', 'Approved', 'vera', 14, 23, 45),
    minute('III', 'Follow instructions from the Marking Officer', 'henry', 14, 23, 49),
    minute('IV', 'This Letter is coming with an attachment', 'henry', 13, 10, 0),
    minute('V', 'Send it to Verah', 'vera', 13, 10, 6),
  ];
  const files = [
    {
      id: 'f1', name: 'IT Documents', ref: 'IT/2026/2024', vol: '1', registry: 'main', type: 'ordinary', priority: true,
      cover: { color: 'blue', dept: 'Directorate of ICT' }, createdBy: 'henry', created: daysAgo(16),
      visibility: 'organization', confidentiality: 'Internal',
      description: 'ICT systems documentation, user lists and correspondence on the EDRMS roll-out.',
      stage: 'action', withUser: 'virah', sentBy: 'henry', markedTo: 'virah', updated: daysAgo(13, 10, 32), starred: true,
      instruction: 'Send it to Verah', cabinet: 'Cabinet 4', shelf: 'Shelf B',
      movements: [
        { date: daysAgo(14, 9), from: 'henry', to: 'erickson' }, { date: daysAgo(14, 15), from: 'erickson', to: 'registry' },
        { date: daysAgo(14, 16), from: 'henry', to: 'erickson' }, { date: daysAgo(13, 8), from: 'erickson', to: 'registry' },
        { date: daysAgo(13, 9), from: 'henry', to: 'vera' }, { date: daysAgo(13, 10, 6), from: 'vera', to: 'registry' },
        { date: daysAgo(13, 10, 32), from: 'henry', to: 'virah' },
      ],
      docs: [
        doc('d1', '1', 'System Users-ECM', 'letter', 'Directorate of ICT', 15, { minutes: it.slice(0, 3), subject: 'SYSTEM USERS – ELECTRONIC CONTENT MANAGEMENT', note: 'Its Urgent' }),
        doc('d2', '1a', 'Reply Better', 'response', 'Virah Creates', 14, { template: 'letter', minutes: [it[3]] }),
        doc('d3', '1b', 'Reply Better', 'response', 'Virah Creates', 14, { template: 'memo' }),
        doc('d4', '1c', 'Reply Better', 'response', 'Virah Creates', 14, { template: 'ack' }),
        doc('d5', '2', 'System Design Document', 'attachment', 'CodexAI Company Limited', 14, { pages: 24, mime: 'PDF', sizeKB: 3480 }),
        doc('d6', '3', 'Qbits EDMS User Manual', 'attachment', 'CodexAI Company Limited', 14, { pages: 32, mime: 'PDF', sizeKB: 5120 }),
        doc('d7', '4', 'System Users', 'memo', 'Directorate of ICT', 14, { minutes: it.slice(0, 3) }),
        doc('d8', '5', 'National Youth Service of Kenya', 'letter', 'National Youth Service', 13, { minutes: it.slice(3), ref17: true, subject: 'CIRCULATION OF STAFF LIST – MARKING AND ACTION OFFICERS' }),
      ],
    },
    {
      id: 'f2', name: 'Admin Letters', ref: 'ADMIN/10/2026', vol: '1', registry: 'main', type: 'ordinary',
      cover: { color: 'manila', dept: 'HQS - Administration' }, createdBy: 'henry', created: daysAgo(12),
      visibility: 'department', confidentiality: 'Internal', description: 'General administration correspondence.',
      stage: 'action', withUser: 'erickson', sentBy: 'henry', markedTo: 'erickson', updated: daysAgo(9, 9, 26),
      movements: [{ date: daysAgo(10, 9), from: 'henry', to: 'vera' }, { date: daysAgo(10, 12), from: 'vera', to: 'registry' }, { date: daysAgo(9, 9, 26), from: 'henry', to: 'erickson' }],
      docs: [
        doc('d9', '1', 'Request for Office Space', 'letter', 'Department of Administration', 11, { minutes: [minute('I', 'PS to see', 'henry', 10, 9, 5), minute('II', 'Head ICT – please advise on space for the server room', 'vera', 10, 11, 50)] }),
        doc('d10', '2', 'Office Partitioning Quotation', 'attachment', 'Supply Chain Management', 10, { mime: 'PDF', pages: 3 }),
        doc('d11', '3', 'Internal Memo – Staff Relocation', 'memo', 'Human Resource Management', 10),
        doc('d12', '4', 'Acknowledgement', 'response', 'Erickson Maluki', 9, { template: 'ack' }),
      ],
    },
    {
      id: 'f3', name: 'CodexAI', ref: 'MOH/ADM/1/1/200/1', vol: '1', registry: 'main', type: 'ordinary',
      cover: { color: 'purple', dept: 'HQS - Administration' }, createdBy: 'henry', created: daysAgo(9),
      visibility: 'organization', confidentiality: 'Confidential', description: 'Vendor file – CodexAI Company Limited.',
      stage: 'returned_action', withUser: 'registry', sentBy: 'otieno', markedTo: 'otieno', updated: daysAgo(4, 5, 56),
      movements: [{ date: daysAgo(7, 9), from: 'henry', to: 'vera' }, { date: daysAgo(6, 10), from: 'vera', to: 'registry' }, { date: daysAgo(6, 11), from: 'henry', to: 'otieno' }, { date: daysAgo(4, 5, 56), from: 'otieno', to: 'registry' }],
      docs: [
        doc('d13', '1', 'Proposal – EDRMS Implementation', 'letter', 'CodexAI Company Limited', 8, { minutes: [minute('I', 'Head Public Communication to prepare a press statement', 'vera', 6, 9, 40)] }),
        doc('d14', '2', 'Press Statement – EDRMS Launch', 'response', 'Brian Otieno', 4, { signed: true, template: 'circular' }),
      ],
    },
    {
      id: 'f4', name: 'EDRMS Documents', ref: 'MOH/ADMIN/EDRMS1/1', vol: '1', registry: 'main', type: 'ordinary',
      cover: { color: 'green', dept: 'Records Management Unit' }, createdBy: 'henry', created: daysAgo(9),
      visibility: 'organization', confidentiality: 'Internal',
      description: 'Project documents for the Electronic Document and Records Management System.',
      stage: 'action', withUser: 'virah', sentBy: 'henry', markedTo: 'virah', updated: daysAgo(6, 2, 21),
      instruction: 'Review the training schedule and respond to the vendor.',
      movements: [{ date: daysAgo(7, 9), from: 'henry', to: 'vera' }, { date: daysAgo(7, 14), from: 'vera', to: 'registry' }, { date: daysAgo(6, 2, 21), from: 'henry', to: 'virah' }],
      docs: [
        doc('d15', '1', 'EDRMS Training Schedule', 'letter', 'CodexAI Company Limited', 8, { minutes: [minute('I', 'PS to see', 'henry', 7, 9, 2), minute('II', 'Head NVS – review the training schedule and respond to the vendor', 'vera', 7, 13, 58)] }),
        doc('d16', '2', 'Training Venue Booking', 'memo', 'Department of Administration', 7),
        doc('d17', '3', 'List of Trainees', 'attachment', 'Human Resource Management', 7, { mime: 'XLSX', sizeKB: 96 }),
        doc('d18', '4', 'Change Request – Folio Numbering', 'letter', 'Records Management Unit', 6, { status: 'landing' }),
      ],
    },
    {
      id: 'f5', name: 'Mbagathi Hospital', ref: 'MOH/MGT/001', vol: '1', registry: 'main', type: 'ordinary',
      cover: { color: 'yellow', dept: 'Directorate of Curative Services' }, createdBy: 'john', created: daysAgo(3),
      visibility: 'organization', confidentiality: 'Internal', description: 'Correspondence with Mbagathi County Referral Hospital.',
      stage: 'registry', withUser: 'registry', sentBy: 'john', updated: daysAgo(1, 11, 4), movements: [],
      docs: [
        doc('d19', '1', 'Request for Additional Vaccines', 'letter', 'Mbagathi Hospital', 1, { subject: 'REQUEST FOR ADDITIONAL MEASLES-RUBELLA VACCINE DOSES' }),
        doc('d20', '2', 'Vaccine Stock Report – October', 'attachment', 'Mbagathi Hospital', 1, { mime: 'PDF', pages: 6 }),
      ],
    },
    {
      id: 'f6', name: 'Senate of Kenya', ref: 'MOH/ADM/005', vol: '1', registry: 'main', type: 'ordinary', priority: true,
      cover: { color: 'red', dept: 'Office of the Principal Secretary' }, createdBy: 'john', created: daysAgo(4),
      visibility: 'organization', confidentiality: 'Internal', description: 'Parliamentary questions and Senate committee correspondence.',
      stage: 'marking', withUser: 'vera', sentBy: 'john', updated: daysAgo(0, 9, 12),
      movements: [{ date: daysAgo(0, 9, 12), from: 'john', to: 'vera' }],
      docs: [
        doc('d21', '1', 'Invitation – Senate Health Committee', 'letter', 'Clerk of the Senate', 2, { subject: 'INVITATION TO APPEAR BEFORE THE STANDING COMMITTEE ON HEALTH', minutes: [minute('I', 'PS to see', 'john', 0, 9, 10)] }),
        doc('d22', '2', 'Statement Request – Vaccine Supply', 'letter', 'Clerk of the Senate', 2),
      ],
    },
    {
      id: 'f7', name: 'ACME Company Ltd', ref: 'MOH/ADM/011', vol: '1', registry: 'main', type: 'ordinary',
      cover: { color: 'orange', dept: 'Supply Chain Management' }, createdBy: 'john', created: daysAgo(5),
      visibility: 'department', confidentiality: 'Internal', description: 'Supplier file.',
      stage: 'registry', withUser: 'registry', sentBy: 'john', updated: daysAgo(2, 14), movements: [],
      docs: [doc('d23', '1', 'Delivery Note – Cold Chain Boxes', 'attachment', 'ACME Company Ltd', 2, { mime: 'PDF' })],
    },
    {
      id: 'f8', name: '2026 Contracts', ref: 'MOH/CONTRACTS/2026/001/1', vol: '1', registry: 'hr', type: 'ordinary',
      cover: { color: 'pink', dept: 'Human Resource Management' }, createdBy: 'rachael', created: daysAgo(14),
      visibility: 'department', confidentiality: 'Confidential', description: 'Staff contracts for 2026.',
      stage: 'filed', withUser: 'registry', sentBy: 'achieng', updated: daysAgo(5, 10),
      movements: [{ date: daysAgo(12, 9), from: 'rachael', to: 'vera' }, { date: daysAgo(11, 9), from: 'vera', to: 'registry' }, { date: daysAgo(10, 9), from: 'rachael', to: 'achieng' }, { date: daysAgo(6, 9), from: 'achieng', to: 'registry' }],
      docs: [doc('d24', '1', 'Contract Renewal – Nurses Cohort 4', 'letter', 'Human Resource Management', 12, { signed: true }), doc('d25', '2', 'Signed Contracts Schedule', 'attachment', 'Supply Chain Management', 6, { mime: 'PDF', pages: 14, sizeKB: 2200 })],
    },
    {
      id: 'f9', name: 'Q4 Documents', ref: 'Testing', vol: '1', registry: 'main', type: 'ty',
      cover: { color: 'grey', dept: 'Planning Unit' }, createdBy: 'john', created: daysAgo(6),
      visibility: 'personal', confidentiality: 'Internal', description: 'Temporary file for Q4 working papers.',
      stage: 'registry', withUser: 'registry', sentBy: 'john', updated: daysAgo(5, 12), movements: [],
      docs: [doc('d26', '1', 'Q4 Workplan', 'memo', 'Planning Unit', 5)],
    },
    {
      id: 'f10', name: 'Minutes of the EDRMS Overview Meeting', ref: 'CDX/MOH-MIN/1910.2026', vol: '1', registry: 'main', type: 'ordinary',
      cover: { color: 'white', dept: 'Records Management Unit' }, createdBy: 'henry', created: daysAgo(10),
      visibility: 'organization', confidentiality: 'Internal', description: 'Minutes of the 19 October EDRMS overview meeting.',
      stage: 'filed', withUser: 'registry', sentBy: 'henry', updated: daysAgo(8, 10), movements: [],
      docs: [doc('d27', '1', 'Minutes – 19 Oct 2026', 'memo', 'Records Management Unit', 8, { pages: 4 })],
    },
    {
      id: 'f11', name: 'Q2 Invoices', ref: 'HR 2026', vol: '1', registry: 'hr', type: 'ordinary',
      cover: { color: 'manila', dept: 'Finance' }, createdBy: 'rachael', created: daysAgo(40),
      visibility: 'department', confidentiality: 'Internal', description: 'Supplier invoices for Q2.',
      stage: 'registry', withUser: 'registry', sentBy: 'rachael', updated: daysAgo(19, 10), movements: [],
      docs: [doc('d28', '1', 'Invoice 0042 – Printing', 'attachment', 'ACME Company Ltd', 19, { mime: 'PDF' })],
    },
    {
      id: 'f12', name: 'Health Products and Technologies Bill 2026', ref: 'MOH/LEG/2026/4', vol: '1', registry: 'main', type: 'ordinary', draft: true,
      cover: { color: 'blue', dept: 'Directorate of Health Products and Technologies' }, createdBy: 'john', created: daysAgo(1, 16),
      visibility: 'department', confidentiality: 'Confidential', description: 'Drafting notes and stakeholder comments on the Bill.',
      stage: 'registry', withUser: 'registry', sentBy: 'john', updated: daysAgo(1, 16), movements: [], docs: [],
    },
    {
      id: 'f13', name: 'Staff Welfare Committee', ref: '', vol: '1', registry: 'hr', type: 'ty', draft: true,
      cover: { color: 'green', dept: 'Human Resource Management' }, createdBy: 'rachael', created: daysAgo(3, 11),
      visibility: 'department', confidentiality: 'Internal', description: 'Temporary file for committee minutes.',
      stage: 'registry', withUser: 'registry', sentBy: 'rachael', updated: daysAgo(3, 11), movements: [], docs: [],
    },
  ];
  /* Sticky notes, as they were on the live file */
  const f = id => files.find(x => x.id === id), d = (fid, did) => f(fid).docs.find(x => x.id === did);
  d('f1', 'd1').stickies.push(sticky('Approved', 'vera', 14, 23, 45), sticky('Work on it urgently', 'henry', 14, 23, 49, { color: 'pink', to: 'virah', x: 63, y: 25 }));
  d('f1', 'd8').stickies.push(sticky('Check', 'henry', 13, 10, 0, { to: 'virah' }));
  d('f4', 'd15').stickies.push(sticky('Due Friday', 'vera', 7, 13, 58, { color: 'orange', to: 'virah' }));
  d('f6', 'd21').stickies.push(sticky('Hearing is on 6 Nov – please mark quickly', 'john', 0, 9, 11, { color: 'blue', to: 'vera' }));
  return files;
}

/* ---- Response templates (Action Officer → Responses) ------------------- */
const TEMPLATES = [
  { id: 'letter',   name: 'Official letter',  desc: 'Letterhead, reference, addressee and signature block.' },
  { id: 'memo',     name: 'Internal memo',    desc: 'To / From / Date / Ref grid for internal replies.' },
  { id: 'circular', name: 'Circular',         desc: 'Numbered circular to all heads of departments.' },
  { id: 'ack',      name: 'Acknowledgement',  desc: 'Short note confirming receipt; the matter is receiving attention.' },
];

/* ---- AI Support: FAQs --------------------------------------------------- */
const FAQS = [
  { q: 'How do I create a new file?', keys: ['create', 'new file', 'open a file', 'cover'], a: 'Go to <b>Registries &amp; Files</b> and press <b>New File</b>. Fill in the name, volume and reference, then pick a department and cover colour — the cover preview on the right updates as you type. Press <b>Create File</b>.', link: ['#/files', 'Open All Files'], guide: 'registry' },
  { q: 'How does a file move between officers?', keys: ['move', 'route', 'routing', 'journey', 'flow', 'registry'], a: 'Every move goes through the Registry: <b>Registry → Marking Officer → Registry → Action Officer → Registry → Filed away</b>. The movement sheet on the cover records each step.', guide: 'journey' },
  { q: 'What does "Returned from marking" mean?', keys: ['returned', 'marking', 'status', 'stage'], a: 'The Marking Officer has written instructions and sent the file back. The Registry now sends it to the Action Officer the file was marked to.', guide: 'journey' },
  { q: 'How do I add a comment on a letter?', keys: ['comment', 'minute', 'ink', 'font', 'resize', 'move'], a: 'Open the file, scroll to the folio and press <b>Add comment</b>. Type, pick an ink colour and hand, then press ✓. Drag it anywhere on the page and pull the corner to resize. It is numbered (I, II, III…), dated and signed for you.', guide: 'annotate' },
  { q: 'How do sticky notes work?', keys: ['sticky', 'note', 'fold', 'assign', 'remove'], a: 'Press <b>Sticky note</b> on a folio, choose a colour and who it is for (everyone, or one person). Drag it where you want. Fold it with the corner to read what is behind it, or remove it with ×.', guide: 'annotate' },
  { q: 'How do I respond using a template?', keys: ['respond', 'response', 'template', 'reply', 'download', 'send'], a: 'When a file is with you as Action Officer, press <b>Responses</b>. Pick a template, fill in the subject and body, then <b>View template</b> to check it. From the preview you can <b>Download</b> it or <b>Send</b> it into the file as the next sub-folio (1a, 1b…).', guide: 'action' },
  { q: 'Why can’t I see the Upload button?', keys: ['upload', 'button', 'missing', 'see'], a: 'Only Registry Officers upload letters into files. Marking and Action Officers add comments, sticky notes and responses instead.', guide: 'registry' },
  { q: 'How do I change a file cover?', keys: ['change cover', 'colour', 'color', 'department'], a: 'Open the file and choose the <b>Cover</b> tab on the right. Changing the colour, department or wording updates the real cover straight away.', guide: 'registry' },
  { q: 'What is a TY file?', keys: ['ty', 'temporary'], a: 'A Temporary (TY) file holds papers until a permanent file is opened. It shows a TY badge on its cover and card.', guide: 'glossary' },
  { q: 'How do I report a problem?', keys: ['report', 'issue', 'bug', 'problem', 'screenshot', 'capture'], a: 'Open <b>Q-BITS AI → Capture screen</b>. Highlight the problem on the screenshot, describe it and press <b>Submit</b>. Your reports are listed in Settings.', guide: 'support' },
];

/* ---- User guide --------------------------------------------------------- */
const GUIDE = [
  { id: 'start', title: 'Getting started', icon: 'info', body: `
    <p>EDRMS keeps the Ministry's files and letters the way the paper registry does, so every file has a cover, a movement sheet and numbered folios.</p>
    <h4>Signing in</h4><p>Sign in with your Q-BITS ERP account or Microsoft. Your role (Registry, Marking or Action Officer), department and what you can see come from the ERP.</p>
    <h4>Finding your way</h4><ul><li><b>Overview</b> – your tiles, Recent Notifications and AI Suggestions. It is the only page with the top navigation.</li><li><b>Side navigation</b> – Q-BITS AI, then the same items as the top navigation: Overview, Registries &amp; Files, My Queue, Bring Up Diary (Registry) or Request file (Marking and Action Officers) and Settings. The Registry also gets a <b>Registry</b> section: Inward Register, Outward Register, Access Requests and Physical Files (with File Census as a tab). Everything else is under <b>Settings › Pages and tools</b>.</li><li><b>Registries &amp; Files</b> – every registry and file, in grid or list view, with drafts.</li><li><b>My Queue</b> – two tabs: <b>My Queue</b> (everything assigned to you) and <b>File Movement</b> (files by stage).</li><li><b>Tutorial mode</b> – in this guide, a step-by-step walkthrough of the main journeys with screenshots.</li></ul>
    <h4>Help</h4><p>The <b>Q-BITS AI</b> button (bottom right) opens AI chat, screen capture for reporting problems, and this guide.</p>` },
  { id: 'journey', title: 'How a file moves', icon: 'route', body: `
    <p>Files always pass back through the Registry between officers:</p>
    <ol><li><b>Registry</b> sends the file to the Marking Officer.</li><li><b>Marking Officer</b> reads the folios, writes minutes and marks the file to an Action Officer. It returns to the Registry (<i>Returned from marking</i>).</li><li><b>Registry</b> sends it to the Action Officer it was marked to.</li><li><b>Action Officer</b> responds, requests files or delegates, then presses <b>Done</b> (<i>Returned from action</i>).</li><li><b>Registry</b> files it away, or sends it round again.</li></ol>
    <p>Each move is written on the movement sheet of the cover: Date, From, Officer to see and Officer's initials.</p>` },
  { id: 'registry', title: 'Registry Officer', icon: 'building', body: `
    <h4>Creating a file</h4><p>Press <b>New File</b>. Choose Ordinary or Temporary (TY), enter the name, volume and a unique reference (or leave it for the next number in the series). Under <b>File cover</b>, type the department and pick a colour – the preview on the right is the real cover that will appear on the file and in All Files.</p>
    <h4>Changing a cover</h4><p>Open the file and use the <b>Cover</b> tab. Changes show on the cover at the top of the file immediately.</p>
    <h4>Uploading letters</h4><p>Use <b>Upload</b> for a single document, bulk files or email attachments. Uploads go to the <b>Landing Queue</b> for checking; press <b>Validate</b> to add them to the file as the next folio.</p>
    <h4>Registers and diary</h4><ul><li><b>Inward Register</b> – mail received and where it was filed.</li><li><b>Outward Register</b> – responses ready to dispatch.</li><li><b>Bring-up Diary</b> – files that need to come back on a date.</li><li><b>Access Requests</b> – read-only access with an expiry date.</li></ul>` },
  { id: 'annotate', title: 'Comments and sticky notes', icon: 'pen', body: `
    <h4>Comments (minutes)</h4><p>When a file is with you, press <b>Add comment</b> on a folio. Write your comment, choose an <b>ink</b> (blue-black, black, red or green) and a <b>hand</b> (Neat, Print or Cursive), then press ✓.</p><ul><li>It is numbered automatically – I, II, III… across the whole file.</li><li>Your signature and the date are added underneath.</li><li><b>Drag</b> it anywhere on the page; <b>pull the corner</b> to make it bigger or smaller.</li><li>Click your comment again to change ink or hand, or to delete it.</li></ul>
    <h4>Sticky notes</h4><p>Press <b>Sticky note</b>, write the note, choose a colour and who it is for – <b>Everyone</b> or a specific person (only they and you will see it). Then:</p><ul><li><b>Drag</b> it to place it.</li><li><b>Fold</b> it with the corner button to read the letter behind it; click it to unfold.</li><li><b>Remove</b> it with ×.</li></ul>` },
  { id: 'marking', title: 'Marking Officer', icon: 'pen', body: `
    <p>Files sent to you appear under <b>Files awaiting my marking</b>. Open the file: the cover comes first, then every folio from the latest down.</p>
    <p>Add comments and sticky notes, then press <b>Mark file</b>. Choose the Action Officer and write the instruction. The file returns to the Registry with your instruction on it.</p>` },
  { id: 'action', title: 'Action Officer', icon: 'reply', body: `
    <p>Your dashboard shows files for your registry that are routed to you.</p>
    <h4>Responses</h4><p>Press <b>Responses</b>. Pick a template (Official letter, Internal memo, Circular or Acknowledgement), fill in the addressee, subject and body, then:</p><ul><li><b>View template</b> – preview the finished document.</li><li><b>Download</b> – save it as a Word document.</li><li><b>Send</b> – add it to the file as the next sub-folio (1a, 1b…), signed and stamped if you choose.</li></ul>
    <h4>Other actions</h4><ul><li><b>Request files</b> – ask the Registry for another file you need.</li><li><b>Delegate</b> – hand it to a colleague; they return it to the Registry when done.</li><li><b>Done – return to Registry</b> – use last, with a closing minute.</li></ul>` },
  { id: 'files', title: 'All Files', icon: 'folders', body: `
    <ul><li><b>Registries</b> – Main and HR registries at the top; click one to show only its files.</li><li><b>Sort</b> – most recent, oldest, largest or smallest, or name.</li><li><b>Show</b> – files and registries, only files, only registries, starred or TY files.</li><li><b>Grid / List</b> – the list is a table of Title, Reference, Folio, Type, Created by, Status, Confidentiality and Modified. Click a column heading to sort by it.</li></ul>` },
  { id: 'support', title: 'Reporting a problem', icon: 'scan', body: `
    <p>Open <b>Q-BITS AI → Capture screen</b>. A screenshot of the page you are on opens. Drag on it to highlight the problem, describe what went wrong and press <b>Submit</b>. You can also download the screenshot. Your reports are listed under <b>Settings</b>.</p>` },
  { id: 'glossary', title: 'Glossary', icon: 'book', body: `
    <dl class="gloss"><dt>Folio</dt><dd>A numbered document in a file. Responses to folio 1 are 1a, 1b…</dd><dt>Minute</dt><dd>A numbered, signed comment on a folio (I, II, III…).</dd><dt>Movement sheet</dt><dd>The table on the file cover recording every move.</dd><dt>TY file</dt><dd>A temporary file.</dd><dt>Landing Queue</dt><dd>Uploads waiting to be checked before they join a file.</dd><dt>Bring-up</dt><dd>A date when a file should be brought back to an officer.</dd></dl>` },
];

/* ---- Everything else ---------------------------------------------------- */
function seedState() {
  return {
    v: 6,
    session: null,
    files: seedFiles(),
    requests: [{ id: 'r1', by: 'virah', fileId: 'f4', want: 'MOH/ADM/1/1/200/1', reason: 'Need the vendor proposal to respond on the training schedule.', at: daysAgo(1, 15), status: 'open' }],
    access: [
      { id: 'a1', by: 'otieno', fileId: 'f6', reason: 'Prepare talking points for the Senate hearing.', days: 7, at: daysAgo(0, 8), status: 'open' },
      { id: 'a2', by: 'erickson', fileId: 'f10', reason: 'Reference for the ICT handover report.', days: 14, at: daysAgo(6, 11), status: 'approved', expires: daysAhead(8) },
    ],
    bringups: [
      { id: 'b1', fileId: 'f6', date: daysAgo(0, 9), note: 'Confirm attendance before the Senate hearing on 6 Nov.', by: 'john', for: 'vera', done: false },
      { id: 'b2', fileId: 'f4', date: daysAhead(4), note: 'Vendor reply on the training schedule due.', by: 'john', for: 'virah', done: false },
      { id: 'b3', fileId: 'f11', date: daysAhead(12), note: 'Q2 invoices – audit query follow-up.', by: 'rachael', for: 'rachael', done: false },
    ],
    dispatch: { d14: daysAgo(4, 15) },
    issues: [],
    drafts: [],
    notifications: [
      { id: 'n1', to: 'virah', text: 'File forwarded to you.', from: 'henry', fileId: 'f4', at: daysAgo(6, 2, 21), read: false },
      { id: 'n2', to: 'virah', text: 'File forwarded to you.', from: 'henry', fileId: 'f1', at: daysAgo(13, 10, 32), read: false },
      { id: 'n3', to: 'vera', text: 'File sent to you for marking.', from: 'john', fileId: 'f6', at: daysAgo(0, 9, 12), read: false },
      { id: 'n4', to: 'registry', text: 'File returned from action.', from: 'otieno', fileId: 'f3', at: daysAgo(4, 5, 56), read: false },
      { id: 'n5', to: 'registry', text: 'Requested a file.', from: 'virah', fileId: 'f4', at: daysAgo(1, 15), read: false },
    ],
    seq: 100,
  };
}

/* ---------- Tutorial mode (Q-BITS Tour): the main journeys, step by step, on the real screens ----------
   Each step: page (path), what the tooltip points at (target / button), and a screenshot (shot).
   {reg} {mk} {ac} {ra} are filled in at start with a file at that stage: in Registry, with the Marking
   Officer, with an Action Officer, returned from action. */
const TUTORIAL = [
  { id: 'start', icon: 'compass', title: 'Getting around', who: 'Everyone', role: null, summary: 'Overview, side navigation, search, theme and Q-BITS AI', steps: [
    { id: 's-overview', title: 'Your Overview', text: 'The tiles are the things you do most. The numbers show what is waiting for you.', path: '/', target: '.tiles' },
    { id: 's-notifs', title: 'What needs you today', text: 'Recent Notifications and AI Suggestions show what changed and what to look at first.', path: '/', target: '.notif-panel, .ai-sugg' },
    { id: 's-nav', title: 'Side navigation', text: 'Every other page has the side navigation, with the same items as the top navigation on the Overview. Everything else is under Settings.', path: '/files', target: '.sidebar .nav' },
    { id: 's-search', title: 'Search everything', text: 'Search finds files, letters and pages. Type a subject, reference, folio or sender.', path: '/files', target: '.side-search' },
    { id: 's-theme', title: 'Light or dark', text: 'Switch between light and dark mode here. Your choice is remembered.', path: '/files', target: '.ph-icons .qb-theme-toggle' },
    { id: 's-ai', title: 'Get help from Q-BITS AI', text: 'Q-BITS AI opens User Manual, Capture Screen and Chat. Capture Screen reports a problem with a screenshot of this page.', path: '/files', target: '#fab .qb-fab' },
  ] },
  { id: 'receive', icon: 'upload', title: 'Receive and file a letter', who: 'Registry Officer', role: 'registry', summary: 'Upload, OCR and AI, check the details, filed', steps: [
    { id: 'r-file', title: 'Choose the file', text: 'Open Upload Document and pick the file the letter belongs to. Every document must be in a file; use New File if it does not exist yet.', path: '/upload', target: '#up-file' },
    { id: 'r-drop', title: 'Add the document', text: 'Drop in the scanned letter, or use Bulk Upload or Upload From Email from the tabs above.', path: '/upload', target: '#dropzone' },
    { id: 'r-next', title: 'OCR and AI read it', text: 'Press Save & Proceed. OCR reads the text and AI finds the sender, reference, dates and subject, and checks for duplicates.', path: '/upload', button: 'Save & Proceed', open: 'upload' },
    { id: 'r-details', title: 'Check the details', text: 'Fields the AI filled carry an AI tag until you change them. Check Received From, Subject and the dates, then Save.', path: '/upload', target: '.det-form, .ai-run, #dropzone', open: 'details' },
    { id: 'r-inward', title: 'It is in the Inward Mail Register', text: 'Every document filed through Upload is listed here with its S/NO, sender and folio.', path: '/inward', target: '.panel .tbl' },
    { id: 'r-senders', title: 'Mail Senders', text: 'Names offered under Received From. Add a sender, rename one, or switch off a name you no longer use.', path: '/senders', target: '.panel .tbl' },
  ] },
  { id: 'route', icon: 'send', title: 'Submit a file for marking', who: 'Registry Officer', role: 'registry', summary: 'Open the file, choose the letters, send it', steps: [
    { id: 'm-open', title: 'Open the file', text: 'Every file opens on its cover. The side panel lists its folios and lets you update the cover.', path: '/file/{reg}', target: '.pages, .file-view' },
    { id: 'm-submit', title: 'Submit to the Marking Officer', text: 'Choose the letters the Marking Officer can see; the ones you untick are kept back. Leave Send to blank to send it to the Marking Officer role.', path: '/file/{reg}', button: 'Send to Marking Officer', open: 'click' },
    { id: 'm-track', title: 'Track it in File Movement', text: 'In My Queue, open the File Movement tab. Search by name, reference or sender, and use the stage tabs to see where every file is.', path: '/routing', target: '.route-toolbar' },
  ] },
  { id: 'mark', icon: 'pen', title: 'Mark a file', who: 'Marking Officer', role: 'marking', summary: 'Files to mark, record the instruction', steps: [
    { id: 'k-list', title: 'Files to mark', text: 'Your Overview lists the files the Registry has sent you, with who sent each one and when.', path: '/', target: '.dash-main .panel' },
    { id: 'k-mark', title: 'Record what should be done and to whom', text: 'Open the file and press Mark file. Choose the Action Officer and write the instruction. The file goes back to the Registry.', path: '/file/{mk}', button: 'Mark file', open: 'click' },
    { id: 'k-grid', title: 'The file grid', text: 'File grid shows every step on the file: who it went to, their initials and whether they acknowledged it.', path: '/file/{mk}', button: 'File grid' },
  ] },
  { id: 'act', icon: 'reply', title: 'Act on a file', who: 'Action Officer', role: 'action', summary: 'Respond, comment, ask for files, delegate, done', steps: [
    { id: 'a-list', title: 'Files to act on', text: 'Your Overview lists the files routed to you and the ones you have finished.', path: '/', target: '.dash-main .panel' },
    { id: 'a-marking', title: 'Read the marking', text: 'The Marking Officer’s instruction is shown at the top of the file.', path: '/file/{ac}', target: '.instruction' },
    { id: 'a-respond', title: 'Write a response', text: 'Pick a template – official letter, internal memo, circular or acknowledgement – then view, download or send it. You can also upload one.', path: '/file/{ac}', button: 'Responses', open: 'click' },
    { id: 'a-comment', title: 'Comment on a letter', text: 'Add comment places a minute on the page. Drag it, resize it, pick the ink and handwriting; it is numbered, dated and signed.', path: '/file/{ac}', button: 'Add comment' },
    { id: 'a-request', title: 'Need another file?', text: 'Request files asks the Registry for files or letters you need to finish this.', path: '/file/{ac}', button: 'Request files' },
    { id: 'a-done', title: 'Done – return to Registry', text: 'Use this last, when the work is finished. Write a closing minute; the file goes back to the Registry.', path: '/file/{ac}', button: 'Done', open: 'click' },
  ] },
  { id: 'close', icon: 'archive', title: 'Close the loop', who: 'Registry Officer', role: 'registry', summary: 'File away, send outside, Outward register', steps: [
    { id: 'c-away', title: 'File it away', text: 'When a file comes back from action, check the response and press File away.', path: '/file/{ra}', button: 'File away' },
    { id: 'c-outside', title: 'Send outside the organisation', text: 'Tick the letters, choose who they go to, the date and how. Each one is recorded in the Outward Mail Register.', path: '/file/{ra}', button: 'Send outside', open: 'click' },
    { id: 'c-outward', title: 'Outward Mail Register', text: 'Every letter sent outside, with the date, recipient and how it went.', path: '/outward', target: '.panel .tbl' },
  ] },
  { id: 'records', icon: 'layers', title: 'Paper files and records', who: 'Registry Officer', role: 'registry', summary: 'Hand over, bring-ups, access, open and close files, census', steps: [
    { id: 'p-hand', title: 'Hand over a paper file', text: 'Hand a paper file, or one document from it, to an officer or a room. The receiver acknowledges it.', path: '/physical', button: 'Hand over', open: 'click' },
    { id: 'p-bring', title: 'Bring Up Diary', text: 'Set a date for a file to come back to someone. Due and overdue bring-ups show on the Overview.', path: '/bringup', button: 'Add bring-up' },
    { id: 'p-access', title: 'Files Requested', text: 'Officers ask for files they cannot open. Grant read-only access with an expiry date, or decline.', path: '/access', target: '.panel .tbl' },
    { id: 'p-records', title: 'Open, close or dispose of a file', text: 'Each request is sent for approval before it takes effect.', path: '/records', target: '.rec-form' },
    { id: 'p-census', title: 'File census', text: 'In Physical Files, open the File Census tab. Check every paper file against where it should be and mark each one found or missing.', path: '/census', target: '.census > aside' },
  ] },
];

/* Departments offered when a file's scope is "Department" (from the ERP in the live system) */
const DEPARTMENTS = ['Main Registry', 'Ministry of Health - State Department for Medical Services', 'National Vaccines and Immunization Programme', 'Human Resource Management', 'ICT', 'Finance and Accounts', 'Supply Chain Management', 'Legal Services', 'Health Products and Technologies'];
