# Sample documents for testing

Nine dummy letters and reports to upload into the EDRMS registries. All senders are fictional, and every page carries the footer *SAMPLE DOCUMENT FOR EDRMS TESTING – fictional sender, not an official communication*.

| File | Kind | Pages | From |
|---|---|---|---|
| 01-Kilima-County-Cold-Chain-Request.pdf | Letter | 1 | Kilima County Department of Health |
| 02-Afya-Bora-Quotation-Vaccine-Carriers.pdf | Quotation | 1 | Afya Bora Medical Supplies Ltd |
| 03-Mwangaza-Hospital-Quarterly-Report.pdf | Report | 2 | Mwangaza Teaching and Referral Hospital |
| 04-Internal-Memo-ICT-System-Maintenance.pdf | Internal memo | 1 | Directorate of ICT (sample) |
| 05-Pamoja-Health-Workers-Union-Meeting-Request.pdf | Letter with annex | 2 | Pamoja Health Workers Association |
| 06-Kilima-County-Measles-Campaign-Plan.pdf | Letter with plan | 2 | Kilima County Department of Health |
| 07-Afya-Bora-Invoice-INV-2026-0937.pdf | Invoice | 1 | Afya Bora Medical Supplies Ltd |
| 08-Health-Sector-Forum-Invitation.pdf | Invitation | 1 | Health Sector Partners Forum (sample) |
| 09-Mwangaza-Hospital-Staff-Establishment-Returns.pdf | Returns | 2 | Mwangaza Teaching and Referral Hospital |

Some letters refer to each other (06 cites 01; 07 follows 02), so they can be tested as cross-references. Rebuild them with `python3 make_samples.py` (needs reportlab).
