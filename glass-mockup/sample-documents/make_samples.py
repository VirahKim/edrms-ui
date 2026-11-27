"""Sample registry documents for testing the EDRMS (all senders are fictional)."""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether)

import os
OUT = os.path.dirname(os.path.abspath(__file__)) + '/'
INK = colors.HexColor('#1b2530')
TEAL = colors.HexColor('#00625f')
GREY = colors.HexColor('#5b6570')

body = ParagraphStyle('b', fontName='Times-Roman', fontSize=11.5, leading=16, textColor=INK, spaceAfter=9, alignment=4)
small = ParagraphStyle('s', parent=body, fontSize=10, leading=13, alignment=0, spaceAfter=2)
subj = ParagraphStyle('h', parent=body, fontName='Times-Bold', fontSize=11.5, alignment=0, spaceBefore=6, spaceAfter=10)
h2 = ParagraphStyle('h2', parent=body, fontName='Times-Bold', fontSize=11.5, alignment=0, spaceBefore=8, spaceAfter=6)
cell = ParagraphStyle('c', parent=body, fontSize=10, leading=13, alignment=0, spaceAfter=0)
cellb = ParagraphStyle('cb', parent=cell, fontName='Times-Bold')

TO_PS = 'The Principal Secretary<br/>State Department for Medical Services<br/>Ministry of Health<br/>P.O. Box 30016 – 00100<br/>NAIROBI'


def make(fname, org, address, ref, date, to, subject, paras, signer, extra=None, kind='letter', cc=None):
    def frame_page(c, doc):
        w, h = A4
        c.saveState()
        # letterhead
        c.setFillColor(TEAL); c.rect(0, h - 6 * mm, w, 6 * mm, stroke=0, fill=1)
        c.setFillColor(INK); c.setFont('Times-Bold', 15); c.drawCentredString(w / 2, h - 20 * mm, org.upper())
        c.setFont('Times-Roman', 9.5); c.setFillColor(GREY); c.drawCentredString(w / 2, h - 25.5 * mm, address)
        c.setStrokeColor(TEAL); c.setLineWidth(1.2); c.line(22 * mm, h - 29 * mm, w - 22 * mm, h - 29 * mm)
        if kind != 'letter':
            c.setFont('Helvetica-Bold', 9); c.setFillColor(TEAL); c.drawRightString(w - 22 * mm, h - 35 * mm, kind.upper())
        # footer
        c.setFont('Helvetica', 7.5); c.setFillColor(GREY)
        c.drawString(22 * mm, 12 * mm, 'SAMPLE DOCUMENT FOR EDRMS TESTING – fictional sender, not an official communication')
        c.drawRightString(w - 22 * mm, 12 * mm, f'Page {doc.page} of {doc._pages}')
        c.restoreState()

    class Doc(BaseDocTemplate):
        def __init__(self, *a, **k):
            super().__init__(*a, **k)
            self._pages = 1
            f = Frame(22 * mm, 20 * mm, A4[0] - 44 * mm, A4[1] - 62 * mm, id='f')
            self.addPageTemplates([PageTemplate(id='p', frames=[f], onPage=frame_page)])

    story = [Table([[Paragraph(f'Ref: {ref}', small), Paragraph(date, ParagraphStyle('r', parent=small, alignment=2))]], colWidths=['60%', '40%'],
                   style=[('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (0, 0), (-1, -1), 0)]),
             Spacer(1, 10), Paragraph(to, small), Spacer(1, 12),
             Paragraph('Dear Sir/Madam,' if kind == 'letter' else '', small) if kind == 'letter' else Spacer(1, 0),
             Paragraph(f'<u>RE: {subject.upper()}</u>', subj)]
    for p in paras:
        if p == '<pb>':
            story.append(PageBreak())
        elif isinstance(p, tuple) and p[0] == 'h':
            story.append(Paragraph(p[1], h2))
        elif isinstance(p, tuple) and p[0] == 'table':
            rows = [[Paragraph(str(x), cellb if i == 0 else cell) for x in r] for i, r in enumerate(p[1])]
            t = Table(rows, colWidths=p[2], repeatRows=1)
            t.setStyle(TableStyle([('GRID', (0, 0), (-1, -1), .5, colors.HexColor('#9aa7b0')), ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e3f1f0')),
                                   ('VALIGN', (0, 0), (-1, -1), 'TOP'), ('TOPPADDING', (0, 0), (-1, -1), 4), ('BOTTOMPADDING', (0, 0), (-1, -1), 4)]))
            story += [t, Spacer(1, 10)]
        else:
            story.append(Paragraph(p, body))
    sig = [Spacer(1, 8), Paragraph('Yours faithfully,' if kind == 'letter' else '', small), Spacer(1, 26),
           Paragraph(f'<b>{signer[0]}</b>', small), Paragraph(signer[1], small)]
    if cc:
        sig += [Spacer(1, 10), Paragraph('Copy to: ' + '; '.join(cc), small)]
    story.append(KeepTogether(sig))
    # two passes so "Page x of y" is right
    for _ in range(2):
        d = Doc(OUT + fname, pagesize=A4, title=subject, author=org, subject='Sample document for EDRMS testing')
        d.build(list(story))
        n = d.page
        Doc._pages_total = n
        story_pages = n
        def setp(doc_obj, n=n): doc_obj._pages = n
        Doc.__init__.__defaults__  # noqa
        d2 = Doc(OUT + fname, pagesize=A4, title=subject, author=org, subject='Sample document for EDRMS testing'); d2._pages = n
        d2.build(list(story))
        break
    return fname


L = []
L.append(make('01-Kilima-County-Cold-Chain-Request.pdf', 'Kilima County Government – Department of Health', 'P.O. Box 214 – 20300, Kilima Town  ·  health@kilima.example', 'KLM/CDH/VOL.4/77', '17 November 2026', TO_PS,
    'Request for Cold Chain Equipment',
    ['The County Department of Health requests support from the State Department for the replacement of cold chain equipment in five sub-county vaccine stores, following an assessment carried out in October 2026.',
     'Three solar direct-drive refrigerators have stopped working and two ice-lined refrigerators no longer hold temperature for the recommended period. This has reduced the vaccine storage capacity of the county by an estimated 40 per cent ahead of the planned measles–rubella campaign.',
     'We kindly request your office to consider allocating replacement equipment from the national stock, or to advise on the procedure for applying under the current cold chain support programme.',
     'We look forward to your favourable consideration.'],
    ('Dr. Amina Wekesa', 'County Executive Committee Member – Health'), cc=['County Pharmacist, Kilima County']))

L.append(make('02-Afya-Bora-Quotation-Vaccine-Carriers.pdf', 'Afya Bora Medical Supplies Ltd', 'Mombasa Road, Plot 118  ·  P.O. Box 50411 – 00200, Nairobi  ·  sales@afyabora.example', 'ABMS/Q/2026/1184', '14 November 2026', TO_PS,
    'Quotation for Vaccine Carriers and Cold Boxes',
    ['Further to your request for quotation dated 3 November 2026, we are pleased to submit our prices for the items listed below. Prices include delivery to the Central Vaccine Stores, Kitengela.',
     ('table', [['Item', 'Description', 'Qty', 'Unit price (KES)', 'Total (KES)'],
                ['1', 'Vaccine carrier, 1.7 L, WHO PQS', '400', '3,850', '1,540,000'],
                ['2', 'Cold box, 20 L, long range', '60', '24,500', '1,470,000'],
                ['3', 'Conditioned ice packs, 0.4 L', '2,000', '180', '360,000'],
                ['4', 'Freeze indicator, electronic', '300', '1,250', '375,000'],
                ['', '<b>Total</b>', '', '', '<b>3,745,000</b>']], [12 * mm, 70 * mm, 16 * mm, 32 * mm, 32 * mm]),
     'This quotation is valid for 60 days from the date above. Delivery can be made within 21 days of receipt of a Local Purchase Order.'],
    ('Joseph Mutua', 'Sales Manager, Public Sector'), kind='quotation'))

L.append(make('03-Mwangaza-Hospital-Quarterly-Report.pdf', 'Mwangaza Teaching and Referral Hospital', 'P.O. Box 1900 – 40100, Mwangaza  ·  ceo@mwangaza-hospital.example', 'MTRH/ADM/QR/2026/3', '10 November 2026', TO_PS,
    'Quarterly Service Delivery Report – July to September 2026',
    ['We forward the hospital’s service delivery report for the quarter July to September 2026, as required under the performance contract.',
     ('h', '1. Summary'),
     'Outpatient attendance rose by 8 per cent compared with the previous quarter, to 46,210 visits. Inpatient admissions were 5,384, with an average length of stay of 4.6 days. Bed occupancy averaged 91 per cent.',
     ('h', '2. Key indicators'),
     ('table', [['Indicator', 'Target', 'Achieved', 'Remarks'],
                ['Outpatient visits', '45,000', '46,210', 'Above target'],
                ['Deliveries in facility', '1,500', '1,612', 'Above target'],
                ['Children fully immunised', '1,200', '1,104', '8 per cent below target'],
                ['Theatre operations', '2,100', '1,986', 'One theatre closed for repairs'],
                ['Average waiting time (minutes)', '60', '74', 'Staff shortage in pharmacy']], [62 * mm, 26 * mm, 26 * mm, 52 * mm]),
     '<pb>',
     ('h', '3. Challenges'),
     'The main challenges in the quarter were shortages of nursing staff in the paediatric ward, intermittent supply of some essential medicines, and the closure of one operating theatre for three weeks for repairs to the air-handling system.',
     'Immunisation coverage fell below target because of a two-week stock-out of the pentavalent vaccine in August. The stock-out was resolved after a redistribution from the regional store.',
     ('h', '4. Requests to the State Department'),
     'The hospital requests (a) the deployment of twelve additional nurses under the contract scheme, (b) priority allocation of pentavalent and measles–rubella vaccines for the next quarter, and (c) support for the replacement of two autoclaves in the central sterile services department.',
     'The detailed tables for each department are available on request.'],
    ('Dr. Peter Kiprono', 'Chief Executive Officer'), kind='report', cc=['Director General for Health']))

L.append(make('04-Internal-Memo-ICT-System-Maintenance.pdf', 'Ministry of Health – Directorate of ICT (sample)', 'Afya House, Cathedral Road  ·  Internal memo', 'MOH/ICT/MEMO/2026/41', '18 November 2026',
    'To: All Heads of Departments<br/>From: Head, ICT<br/>Through: The Principal Secretary',
    'Scheduled Maintenance of the EDRMS',
    ['This is to inform you that the Electronic Document and Records Management System will be unavailable on Saturday, 28 November 2026, from 8.00 a.m. to 2.00 p.m. for scheduled maintenance and a version upgrade.',
     'Please ensure that all urgent correspondence is registered before Friday evening. Paper files may be moved as usual during the maintenance window and recorded in the system afterwards.',
     'For any questions, contact the ICT help desk on extension 2214.'],
    ('Erickson Maluki (sample signatory)', 'Head, ICT'), kind='internal memo'))

L.append(make('05-Pamoja-Health-Workers-Union-Meeting-Request.pdf', 'Pamoja Health Workers Association', 'Ufanisi Plaza, 3rd Floor  ·  P.O. Box 7720 – 00100, Nairobi  ·  info@pamoja-hwa.example', 'PHWA/SG/2026/63', '12 November 2026', TO_PS,
    'Request for a Consultative Meeting on Staff Deployment',
    ['The Association requests a consultative meeting with your office on the deployment of health workers recruited under the 2026 contract scheme.',
     'Our members have raised concerns about delays in the issue of deployment letters and the payment of arrears for the months of August and September 2026. We believe a meeting would help to resolve these matters before the end of the financial quarter.',
     'We propose a meeting in the week of 30 November 2026 at a time convenient to your office. A summary of the cases reported to the Association is attached as Annex 1.',
     '<pb>',
     ('h', 'Annex 1: Cases reported to the Association'),
     ('table', [['No.', 'Cadre', 'County of deployment', 'Issue', 'Months pending'],
                ['1', 'Nursing officer', 'Kilima', 'Deployment letter not issued', '3'], ['2', 'Clinical officer', 'Mto Mweupe', 'Arrears for Aug–Sep', '2'],
                ['3', 'Pharmaceutical technologist', 'Milimani', 'Deployment letter not issued', '3'], ['4', 'Nursing officer', 'Pwani Ndogo', 'Arrears for Aug–Sep', '2'],
                ['5', 'Laboratory technologist', 'Kati', 'Posting changed without notice', '1'], ['6', 'Nutritionist', 'Juu', 'Arrears for Aug–Sep', '2'],
                ['7', 'Nursing officer', 'Kilima', 'Contract not renewed', '1'], ['8', 'Clinical officer', 'Milimani', 'Deployment letter not issued', '3']],
      [12 * mm, 40 * mm, 34 * mm, 54 * mm, 26 * mm]),
     'The Association has 214 similar cases on record. The full list will be shared at the proposed meeting.'],
    ('Grace Achieng Otieno', 'Secretary General')))

L.append(make('09-Mwangaza-Hospital-Staff-Establishment-Returns.pdf', 'Mwangaza Teaching and Referral Hospital', 'P.O. Box 1900 – 40100, Mwangaza  ·  hr@mwangaza-hospital.example', 'MTRH/HR/EST/2026/11', '20 November 2026', TO_PS,
    'Staff Establishment Returns – October 2026',
    ['We submit the staff establishment returns of the hospital as at 31 October 2026.',
     ('table', [['Cadre', 'Approved', 'In post', 'Variance'],
                ['Medical officers', '64', '51', '-13'], ['Specialists', '38', '29', '-9'], ['Nursing officers', '420', '356', '-64'],
                ['Clinical officers', '72', '68', '-4'], ['Pharmaceutical staff', '34', '27', '-7'], ['Laboratory staff', '46', '41', '-5'],
                ['Radiographers', '18', '14', '-4'], ['Support staff', '310', '298', '-12'], ['<b>Total</b>', '<b>1,002</b>', '<b>884</b>', '<b>-118</b>']],
      [70 * mm, 30 * mm, 30 * mm, 30 * mm]),
     'The largest gap is in nursing, where the paediatric and critical care units are most affected.',
     '<pb>',
     ('h', 'Movements during the month'),
     'During October 2026 the hospital recorded eleven exits (four retirements, five resignations, one death and one transfer) and seven new appointments under the contract scheme.',
     ('h', 'Requests'),
     'We request approval to fill the 64 nursing vacancies, and the release of the 2026/27 recruitment budget so that the specialist vacancies in anaesthesia and paediatrics can be advertised.',
     'The returns have been checked against the payroll and the human resource information system.'],
    ('Ann Chebet', 'Head, Human Resource Management'), kind='returns'))

L.append(make('06-Kilima-County-Measles-Campaign-Plan.pdf', 'Kilima County Government – Department of Health', 'P.O. Box 214 – 20300, Kilima Town  ·  health@kilima.example', 'KLM/CDH/EPI/2026/19', '19 November 2026', TO_PS,
    'Measles–Rubella Campaign: County Micro-plan and Vaccine Requirements',
    ['Further to the national guidelines for the measles–rubella follow-up campaign, the county submits its micro-plan and vaccine requirements for your approval.',
     ('h', '1. Target population'),
     'The campaign will target 186,400 children aged 9 to 59 months across six sub-counties, using fixed, outreach and mobile vaccination posts over a period of ten days.',
     ('table', [['Sub-county', 'Target children', 'Vaccination posts', 'Teams'],
                ['Kilima Central', '42,300', '38', '24'], ['Mto Mweupe', '31,900', '29', '18'], ['Milimani', '28,700', '31', '17'],
                ['Pwani Ndogo', '30,100', '27', '18'], ['Kati', '27,800', '25', '16'], ['Juu', '25,600', '30', '15'],
                ['<b>Total</b>', '<b>186,400</b>', '<b>180</b>', '<b>108</b>']], [50 * mm, 38 * mm, 40 * mm, 30 * mm]),
     '<pb>',
     ('h', '2. Vaccine and supply requirements'),
     'Allowing for a wastage factor of 1.11, the county requires 207,000 doses of measles–rubella vaccine, 209,000 auto-disable syringes and 2,100 safety boxes. Diluent and reconstitution syringes should be supplied in matching quantities.',
     ('h', '3. Cold chain'),
     'The county’s cold chain capacity is not enough for the full allocation at once. We request that vaccines be delivered in two lots, one week apart, and refer you to our letter KLM/CDH/VOL.4/77 on the replacement of faulty refrigerators.',
     ('h', '4. Budget'),
     'The county will meet the cost of transport and allowances for vaccination teams. We request national support for social mobilisation materials, estimated at KES 1.2 million.'],
    ('Dr. Amina Wekesa', 'County Executive Committee Member – Health'), cc=['Head, National Vaccines and Immunization Programme']))

L.append(make('07-Afya-Bora-Invoice-INV-2026-0937.pdf', 'Afya Bora Medical Supplies Ltd', 'Mombasa Road, Plot 118  ·  P.O. Box 50411 – 00200, Nairobi  ·  accounts@afyabora.example', 'INV-2026-0937', '16 November 2026',
    'Bill to: The Principal Secretary, State Department for Medical Services<br/>LPO No. MOH/LPO/2026/442',
    'Invoice for Delivery of Vaccine Carriers',
    ['Please find below our invoice for goods delivered to the Central Vaccine Stores, Kitengela, on 13 November 2026 against the above LPO.',
     ('table', [['Item', 'Description', 'Qty', 'Unit price (KES)', 'Total (KES)'],
                ['1', 'Vaccine carrier, 1.7 L, WHO PQS', '400', '3,850', '1,540,000'],
                ['2', 'Conditioned ice packs, 0.4 L', '2,000', '180', '360,000'],
                ['', 'Subtotal', '', '', '1,900,000'], ['', 'VAT (exempt – medical supplies)', '', '', '0'],
                ['', '<b>Amount due</b>', '', '', '<b>1,900,000</b>']], [12 * mm, 70 * mm, 16 * mm, 32 * mm, 32 * mm]),
     'Payment is due within 30 days. Please quote the invoice number with your payment.'],
    ('Mary Njeri', 'Accounts Officer'), kind='invoice'))

L.append(make('08-Health-Sector-Forum-Invitation.pdf', 'Health Sector Partners Forum (sample)', 'Secretariat, Upper Hill  ·  P.O. Box 3301 – 00100, Nairobi  ·  secretariat@hspf.example', 'HSPF/SEC/2026/52', '9 November 2026', TO_PS,
    'Invitation to the Health Sector Partners Forum',
    ['You are invited to the quarterly Health Sector Partners Forum to be held on Thursday, 3 December 2026, from 9.00 a.m. at the Forum Secretariat, Upper Hill.',
     'The forum will review progress on immunisation financing and the integration of county health information systems. Your office is requested to make a ten-minute presentation on the measles–rubella campaign preparations.',
     'Kindly confirm attendance and the name of your representative by 26 November 2026.'],
    ('Ruth Wanjiru', 'Coordinator, Forum Secretariat')))
print('\n'.join(L))
