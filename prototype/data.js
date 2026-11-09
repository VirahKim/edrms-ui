/* EDRMS prototype — people, stages and seed data. Example records only. */
window.EDRMS = (function () {
  var TODAY = '2026-11-06';

  var USERS = {
    registry: { id: 'henry', name: 'Henry Kiprotich', title: 'Registry Officer', initials: 'HK', unit: 'Central Registry' },
    marking: { id: 'vera', name: 'Vera Wambui', title: 'Principal Secretary', initials: 'VW', unit: 'Office of the PS' },
    action: { id: 'virah', name: 'Virah Creates', title: 'Head, National Vaccination Services', initials: 'VC', unit: 'National Vaccination Services' }
  };

  var PEOPLE = {
    henry: { name: 'Henry Kiprotich', title: 'Registry Officer' },
    vera: { name: 'Vera Wambui', title: 'Principal Secretary' },
    samuel: { name: 'Samuel Kariuki', title: 'Director General for Health' },
    virah: { name: 'Virah Creates', title: 'Head, National Vaccination Services' },
    amina: { name: 'Amina Odhiambo', title: 'Head, Health Products and Technologies' },
    james: { name: 'James Mwangi', title: 'Director, Medical Services' },
    peter: { name: 'Peter Otieno', title: 'Programme Officer, Immunisation' },
    faith: { name: 'Faith Chebet', title: 'Cold Chain Officer' },
    grace: { name: 'Grace Njeri', title: 'Records Manager' }
  };

  var MARKING_OFFICERS = ['vera', 'samuel'];
  var ACTION_OFFICERS = ['virah', 'amina', 'james'];
  var DELEGATES = { virah: ['peter', 'faith'] };

  /* The order a file moves in. `who` says whose desk the file is on. */
  var STAGES = [
    { key: 'registry', label: 'In Registry', short: 'In Registry', who: 'registry', badge: '' },
    { key: 'marking', label: 'With Marking Officer', short: 'Marking', who: 'marking', badge: 'qb-badge--primary' },
    { key: 'returned-marking', label: 'Back from marking', short: 'Back from marking', who: 'registry', badge: 'qb-badge--primary' },
    { key: 'action', label: 'With Action Officer', short: 'Action', who: 'action', badge: 'qb-badge--primary' },
    { key: 'returned-action', label: 'Back from action', short: 'Back from action', who: 'registry', badge: 'qb-badge--primary' },
    { key: 'filed', label: 'Filed away', short: 'Filed', who: 'registry', badge: 'qb-badge--success' }
  ];

  var INSTRUCTIONS = ['For action', 'Draft a reply for my signature', 'Please advise', 'For information and filing'];
  var LOCATIONS = { registry: ['Central Registry', 'NVS sub-registry'], cabinet: ['Cabinet 1', 'Cabinet 2', 'Cabinet 3', 'Cabinet 4'], shelf: ['Shelf A', 'Shelf B', 'Shelf C', 'Shelf D'] };

  function h(at, by, what, note) { return { at: at, by: by, what: what, note: note || '' }; }
  function doc(id, title, from, letterRef, letterDate, received, kind, body) {
    return { id: id, title: title, from: from, letterRef: letterRef, letterDate: letterDate, received: received, kind: kind, body: body };
  }

  function seed() {
    var files = [
      {
        id: 'f1', ref: 'MOH/SDMS/NVS/4/12', subject: 'Measles-rubella campaign: county vaccine allocations', dept: 'National Vaccination Services',
        stage: 'action', holder: 'virah', since: '2026-11-03T10:20', due: '2026-11-12',
        docs: [doc('d1', 'Request for MR vaccine allocation schedule', 'Council of Governors, Health Committee', 'COG/HC/112/26', '2026-10-28', '2026-10-30', 'Letter',
          'The Committee requests the Ministry to share the county-by-county allocation of measles-rubella vaccine for the December campaign, together with delivery dates to each county depot, so that counties can plan outreach sessions.')],
        marking: { by: 'vera', at: '2026-11-02T15:05', to: 'virah', instruction: 'For action', due: '2026-11-12', remarks: 'Prepare the allocation plan with KEMSA delivery dates and share a draft reply with me.' },
        history: [
          h('2026-10-30T09:12', 'henry', 'Received and recorded as IN/2026/0398'),
          h('2026-10-30T09:20', 'henry', 'Sent to Vera Wambui for marking'),
          h('2026-11-02T15:05', 'vera', 'Marked to Virah Creates: For action, due 12 Nov 2026', 'Prepare the allocation plan with KEMSA delivery dates and share a draft reply with me.'),
          h('2026-11-03T10:20', 'henry', 'Dispatched to Virah Creates')
        ]
      },
      {
        id: 'f2', ref: 'MOH/SDMS/NVS/4/15', subject: 'Cold chain equipment maintenance, Kisumu depot', dept: 'National Vaccination Services',
        stage: 'marking', holder: 'vera', since: '2026-11-06T08:40', due: null,
        docs: [doc('d2', 'Breakdown of walk-in cold room at Kisumu regional depot', 'County Director of Health, Kisumu', 'KSM/CDH/77/2026', '2026-11-04', '2026-11-06', 'Letter',
          'The walk-in cold room at the Kisumu regional vaccine depot has been out of service since 1 November. Vaccines have been moved to ice-lined refrigerators as a temporary measure. We request urgent support for repair or replacement.')],
        history: [h('2026-11-06T08:31', 'henry', 'Received and recorded as IN/2026/0421'), h('2026-11-06T08:40', 'henry', 'Sent to Vera Wambui for marking')]
      },
      {
        id: 'f3', ref: 'MOH/SDMS/ADM/1/43', subject: 'KEMRI request for HPV vaccination coverage data', dept: 'Administration',
        stage: 'returned-marking', holder: 'henry', since: '2026-11-04T16:10', due: '2026-11-13',
        docs: [doc('d3', 'Request for HPV coverage data, 2023 to 2026', 'Kenya Medical Research Institute', 'KEMRI/DIR/219', '2026-10-27', '2026-10-31', 'Letter',
          'KEMRI requests anonymised HPV vaccination coverage data by county for 2023 to 2026 to support an impact evaluation study. A data sharing agreement is attached for the Ministry’s review.')],
        marking: { by: 'vera', at: '2026-11-04T16:10', to: 'virah', instruction: 'Please advise', due: '2026-11-13', remarks: 'Advise whether we can share this under the data sharing agreement.' },
        history: [
          h('2026-10-31T11:02', 'henry', 'Received and recorded as IN/2026/0403'),
          h('2026-10-31T11:15', 'henry', 'Sent to Vera Wambui for marking'),
          h('2026-11-04T16:10', 'vera', 'Marked to Virah Creates: Please advise, due 13 Nov 2026', 'Advise whether we can share this under the data sharing agreement.')
        ]
      },
      {
        id: 'f4', ref: 'MOH/SDMS/HPT/7/3', subject: 'Pharmaceutical supply chain audit findings', dept: 'Health Products and Technologies',
        stage: 'action', holder: 'amina', since: '2026-10-27T09:00', due: '2026-11-03',
        docs: [doc('d4', 'Audit report on health product stock management', 'Office of the Auditor-General', 'OAG/HLTH/45/26', '2026-10-20', '2026-10-22', 'Report',
          'The audit noted gaps in stock reconciliation at three county stores. Management responses are requested within 14 days.')],
        marking: { by: 'vera', at: '2026-10-24T12:30', to: 'amina', instruction: 'For action', due: '2026-11-03', remarks: 'Prepare management responses.' },
        history: [
          h('2026-10-22T10:00', 'henry', 'Received and recorded as IN/2026/0371'),
          h('2026-10-22T10:10', 'henry', 'Sent to Vera Wambui for marking'),
          h('2026-10-24T12:30', 'vera', 'Marked to Amina Odhiambo: For action, due 3 Nov 2026', 'Prepare management responses.'),
          h('2026-10-27T09:00', 'henry', 'Dispatched to Amina Odhiambo')
        ]
      },
      {
        id: 'f5', ref: 'MOH/SDMS/NVS/4/9', subject: 'Gavi co-financing quarterly report', dept: 'National Vaccination Services',
        stage: 'returned-action', holder: 'henry', since: '2026-11-05T14:45', due: '2026-11-10',
        docs: [doc('d5', 'Reminder: Q3 co-financing report', 'Gavi, the Vaccine Alliance', 'GAVI/KEN/2026/88', '2026-10-21', '2026-10-23', 'Letter',
          'This is a reminder that the third-quarter co-financing report for Kenya is due. Please confirm the expected submission date.')],
        marking: { by: 'vera', at: '2026-10-26T09:40', to: 'virah', instruction: 'Draft a reply for my signature', due: '2026-11-10', remarks: '' },
        action: { by: 'virah', at: '2026-11-05T14:45', outcome: 'reply', note: 'Reviewed the Q3 figures with Finance. Drafted a reply confirming submission by 20 November; signed by the PS.', replyTo: 'Gavi, the Vaccine Alliance', replySubject: 'Re: Q3 co-financing report' },
        history: [
          h('2026-10-23T09:05', 'henry', 'Received and recorded as IN/2026/0365'),
          h('2026-10-23T09:12', 'henry', 'Sent to Vera Wambui for marking'),
          h('2026-10-26T09:40', 'vera', 'Marked to Virah Creates: Draft a reply for my signature, due 10 Nov 2026'),
          h('2026-10-27T08:30', 'henry', 'Dispatched to Virah Creates'),
          h('2026-11-05T14:45', 'virah', 'Returned to Registry: reply ready to send', 'Reviewed the Q3 figures with Finance. Drafted a reply confirming submission by 20 November; signed by the PS.')
        ]
      },
      {
        id: 'f6', ref: 'MOH/SDMS/ADM/1/40', subject: 'Immunisation supply chain training, Nakuru', dept: 'Administration',
        stage: 'filed', holder: 'henry', since: '2026-10-29T15:00', due: null, location: 'Central Registry · Cabinet 2 · Shelf B',
        docs: [doc('d6', 'Invitation to supply chain training', 'Rift Valley Regional Health Office', 'RVRHO/TR/12', '2026-10-10', '2026-10-13', 'Letter', 'Invitation for two officers to attend a five-day immunisation supply chain course in Nakuru.')],
        marking: { by: 'vera', at: '2026-10-15T10:00', to: 'virah', instruction: 'For action', due: '2026-10-24', remarks: 'Nominate two officers.' },
        action: { by: 'virah', at: '2026-10-28T11:00', outcome: 'reply', note: 'Nominated Peter Otieno and Faith Chebet.', replyTo: 'Rift Valley Regional Health Office', replySubject: 'Re: Supply chain training nominations' },
        history: [
          h('2026-10-13T09:00', 'henry', 'Received and recorded as IN/2026/0331'),
          h('2026-10-15T10:00', 'vera', 'Marked to Virah Creates: For action, due 24 Oct 2026'),
          h('2026-10-16T08:45', 'henry', 'Dispatched to Virah Creates'),
          h('2026-10-28T11:00', 'virah', 'Returned to Registry: reply ready to send'),
          h('2026-10-29T15:00', 'henry', 'Reply sent as OUT/2026/0197 and file put away', 'Central Registry · Cabinet 2 · Shelf B')
        ]
      },
      {
        id: 'f7', ref: 'MOH/SDMS/NVS/4/14', subject: 'Polio supplementary immunisation: micro-plans', dept: 'National Vaccination Services',
        stage: 'marking', holder: 'vera', since: '2026-11-05T12:05', due: null,
        docs: [doc('d7', 'Submission of sub-county micro-plans', 'WHO Kenya Country Office', 'WHO/KEN/EPI/301', '2026-11-03', '2026-11-05', 'Memo', 'Attached are the sub-county micro-plans for the polio supplementary immunisation activity in eight border counties, for the Ministry’s approval.')],
        history: [h('2026-11-05T11:58', 'henry', 'Received and recorded as IN/2026/0417'), h('2026-11-05T12:05', 'henry', 'Sent to Vera Wambui for marking')]
      },
      {
        id: 'f8', ref: 'MOH/SDMS/MS/2/21', subject: 'Kenyatta National Hospital: oxygen supply contract', dept: 'Medical Services',
        stage: 'filed', holder: 'henry', since: '2026-11-02T10:30', due: null, location: 'Central Registry · Cabinet 4 · Shelf A',
        docs: [doc('d8', 'Oxygen supply contract renewal', 'Kenyatta National Hospital', 'KNH/PROC/402', '2026-10-14', '2026-10-16', 'Letter', 'Request for the Ministry’s no-objection to renew the medical oxygen supply contract.')],
        marking: { by: 'vera', at: '2026-10-19T09:00', to: 'virah', instruction: 'For information and filing', due: null, remarks: '' },
        action: { by: 'virah', at: '2026-10-30T16:00', outcome: 'done', note: 'Noted. Medical Services is handling the contract; no action for NVS.' },
        history: [
          h('2026-10-16T10:00', 'henry', 'Received and recorded as IN/2026/0344'),
          h('2026-10-19T09:00', 'vera', 'Marked to Virah Creates: For information and filing'),
          h('2026-10-20T08:15', 'henry', 'Dispatched to Virah Creates'),
          h('2026-10-30T16:00', 'virah', 'Returned to Registry: action completed'),
          h('2026-11-02T10:30', 'henry', 'File put away', 'Central Registry · Cabinet 4 · Shelf A')
        ]
      },
      {
        id: 'f9', ref: 'MOH/SDMS/NVS/4/16', subject: 'Vaccine safety surveillance workshop', dept: 'National Vaccination Services',
        stage: 'registry', holder: 'henry', since: '2026-11-06T09:02', due: null,
        docs: [doc('d9', 'Invitation: AEFI surveillance workshop', 'Pharmacy and Poisons Board', 'PPB/PV/56/26', '2026-11-05', '2026-11-06', 'Letter', 'The Board invites the Ministry to nominate participants for a workshop on surveillance of adverse events following immunisation.')],
        history: [h('2026-11-06T09:02', 'henry', 'Received and recorded as IN/2026/0422')]
      },
      {
        id: 'f10', ref: 'MOH/SDMS/NVS/4/11', subject: 'Rotavirus vaccine stock-out reports', dept: 'National Vaccination Services',
        stage: 'action', holder: 'peter', delegatedBy: 'virah', since: '2026-11-04T09:30', due: '2026-11-09',
        docs: [doc('d10', 'Stock-out of rotavirus vaccine in four counties', 'County Pharmacists Forum', 'CPF/2026/14', '2026-10-29', '2026-10-31', 'Letter', 'Four counties report rotavirus vaccine stock-outs at facility level for more than two weeks.')],
        marking: { by: 'vera', at: '2026-11-01T10:00', to: 'virah', instruction: 'For action', due: '2026-11-09', remarks: 'Confirm stock position with KEMSA.' },
        history: [
          h('2026-10-31T10:30', 'henry', 'Received and recorded as IN/2026/0405'),
          h('2026-11-01T10:00', 'vera', 'Marked to Virah Creates: For action, due 9 Nov 2026', 'Confirm stock position with KEMSA.'),
          h('2026-11-02T08:20', 'henry', 'Dispatched to Virah Creates'),
          h('2026-11-04T09:30', 'virah', 'Delegated to Peter Otieno', 'Call KEMSA and the four county pharmacists; report back by Monday.')
        ]
      }
    ];
    var inward = [
      ['IN/2026/0422', '2026-11-06', 'f9', 'd9'], ['IN/2026/0421', '2026-11-06', 'f2', 'd2'], ['IN/2026/0417', '2026-11-05', 'f7', 'd7'],
      ['IN/2026/0405', '2026-10-31', 'f10', 'd10'], ['IN/2026/0403', '2026-10-31', 'f3', 'd3'], ['IN/2026/0398', '2026-10-30', 'f1', 'd1'],
      ['IN/2026/0371', '2026-10-22', 'f4', 'd4'], ['IN/2026/0365', '2026-10-23', 'f5', 'd5'], ['IN/2026/0344', '2026-10-16', 'f8', 'd8'], ['IN/2026/0331', '2026-10-13', 'f6', 'd6']
    ].map(function (r) { return { no: r[0], received: r[1], file: r[2], doc: r[3] }; });
    var outward = [{ no: 'OUT/2026/0197', sent: '2026-10-29', to: 'Rift Valley Regional Health Office', subject: 'Re: Supply chain training nominations', file: 'f6' }];
    var tasks = [
      { id: 't1', title: 'Document upload approval: Gavi report annex', type: 'Document approval', raisedBy: 'peter', waitingOn: 'henry', at: '2026-11-05', due: '2026-11-07', status: 'waiting' },
      { id: 't2', title: 'File opening request #13: Measles outbreak response', type: 'File opening', raisedBy: 'henry', waitingOn: 'grace', at: '2026-10-24', due: '2026-10-31', status: 'waiting' },
      { id: 't3', title: 'File opening request #9: Hepatitis B birth dose', type: 'File opening', raisedBy: 'henry', waitingOn: 'grace', at: '2026-10-17', due: '2026-10-24', status: 'waiting' },
      { id: 't4', title: 'File opening request #8: Yellow fever certificates', type: 'File opening', raisedBy: 'henry', waitingOn: 'grace', at: '2026-10-17', due: '2026-10-24', status: 'waiting' },
      { id: 't5', title: 'HR document #22: Contract for programme staff', type: 'HR document', raisedBy: 'virah', waitingOn: 'grace', at: '2026-10-08', due: '2026-10-15', status: 'waiting' }
    ];
    return { files: files, inward: inward, outward: outward, tasks: tasks, seq: { in: 423, out: 198, file: 17, doc: 11, fileId: 11 } };
  }

  return { TODAY: TODAY, USERS: USERS, PEOPLE: PEOPLE, MARKING_OFFICERS: MARKING_OFFICERS, ACTION_OFFICERS: ACTION_OFFICERS, DELEGATES: DELEGATES, STAGES: STAGES, INSTRUCTIONS: INSTRUCTIONS, LOCATIONS: LOCATIONS, seed: seed };
})();
