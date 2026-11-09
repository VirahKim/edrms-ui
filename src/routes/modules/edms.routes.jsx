import { lazy } from "react";
const RegistryHome = lazy(() => import("../../modules/ed_mgt/dashboards/RegistryHome"));
const FilesBrowser = lazy(() => import("../../modules/ed_mgt/files/FilesBrowser"));
const FileView = lazy(() => import("../../modules/ed_mgt/files/FileView"));
const DocumentUpload = lazy(() => import("../../modules/ed_mgt/files/documents/DocumentUpload"));
const DocumentValidation = lazy(() => import("../../modules/ed_mgt/files/documents/DocumentValidation"));
const MyQueue = lazy(() => import("../../modules/ed_mgt/files/documents/MyQueue"));
const RecentDocuments = lazy(() => import("../../modules/ed_mgt/files/documents/RecentDocuments"));
const StarredDocuments = lazy(() => import("../../modules/ed_mgt/files/documents/StarredDocuments"));
const BulkUpload = lazy(() => import("../../modules/ed_mgt/files/documents/BulkUpload"));
const ImportFromEmail = lazy(() => import("../../modules/ed_mgt/files/documents/ImportFromEmail"));
const DuplicateCheck = lazy(() => import("../../modules/ed_mgt/files/documents/DuplicateCheck"));
const ReportsDashboard = lazy(() => import("../../modules/ed_mgt/reporting/ReportsDashboard"));
const SLADashboard = lazy(() => import("../../modules/ed_mgt/reporting/sla/SLADashboard"));
const RecordsDashboard = lazy(() => import("../../modules/ed_mgt/records/RecordsDashboard"));
const RetentionSchedules = lazy(() => import("../../modules/ed_mgt/records/RetentionSchedules"));
const LegalHolds = lazy(() => import("../../modules/ed_mgt/records/LegalHolds"));
const DueForAction = lazy(() => import("../../modules/ed_mgt/records/DueForAction"));
const AuditLog = lazy(() => import("../../modules/ed_mgt/reporting/audit/AuditLog"));
const AdminConsole = lazy(() => import("../../modules/ed_mgt/admin/AdminConsole"));
const AdminDocumentList = lazy(() => import("../../modules/ed_mgt/admin/DocumentList"));
const AdminDocumentDetail = lazy(() => import("../../modules/ed_mgt/admin/DocumentDetail"));
const DocumentTypeList = lazy(() => import("../../modules/ed_mgt/admin/DocumentTypeList"));
const DocumentTypeDetail = lazy(() => import("../../modules/ed_mgt/admin/DocumentTypeDetail"));
const RetentionRuleList = lazy(() => import("../../modules/ed_mgt/admin/RetentionRuleList"));
const RegistryList = lazy(() => import("../../modules/ed_mgt/admin/RegistryList"));
const RegistryDetail = lazy(() => import("../../modules/ed_mgt/admin/RegistryDetail"));
const OCRJobList = lazy(() => import("../../modules/ed_mgt/ocr/OCRJobList"));
const OCRReviewQueue = lazy(() => import("../../modules/ed_mgt/ocr/OCRReviewQueue"));
const OCRJobDetail = lazy(() => import("../../modules/ed_mgt/ocr/OCRJobDetail"));
const ExternalAccounts = lazy(() => import("../../modules/ed_mgt/settings/ExternalAccounts"));
const OrgStamps = lazy(() => import("../../modules/ed_mgt/settings/OrgStamps"));
const FileCoverSetup = lazy(() => import("../../modules/ed_mgt/settings/FileCoverSetup"));
const EsignSecuritySettings = lazy(() => import("../../modules/ed_mgt/settings/EsignSecuritySettings"));
const OutwardMailRegister = lazy(() => import("../../modules/ed_mgt/registers/OutwardMailRegister"));
const AccessRequestsPage = lazy(() => import("../../modules/ed_mgt/routing/AccessRequestsPage"));
const LetterTemplatesPage = lazy(() => import("../../modules/ed_mgt/routing/LetterTemplatesPage"));
const FileRoutingList = lazy(() => import("../../modules/ed_mgt/routing/FileRoutingList"));
const FileRoutingDetail = lazy(() => import("../../modules/ed_mgt/routing/FileRoutingDetail"));
const FileRoutingSubmit = lazy(() => import("../../modules/ed_mgt/routing/FileRoutingSubmit"));
const MailSenders = lazy(() => import("../../modules/ed_mgt/registers/MailSenders"));
const InwardMailRegister = lazy(() => import("../../modules/ed_mgt/registers/InwardMailRegister"));
const PhysicalFilesPage = lazy(() => import("../../modules/ed_mgt/registers/PhysicalFilesPage"));
const RecordsFilesPage = lazy(() => import("../../modules/ed_mgt/records/RecordsFilesPage"));
const CensusPage = lazy(() => import("../../modules/ed_mgt/records/CensusPage"));
const BringUpPage = lazy(() => import("../../modules/ed_mgt/records/BringUpPage"));
const MarkGridPage = lazy(() => import("../../modules/ed_mgt/records/MarkGridPage"));
const HrRecordsPage = lazy(() => import("../../modules/ed_mgt/hr/HrRecordsPage"));

const EDMSRoutes = () => [
  { path: "/ed-mgt",                                   element: <RegistryHome /> },
  { path: "/ed-mgt/dashboard",                         element: <RegistryHome /> },

  { path: "/ed-mgt/documents",                         element: <FilesBrowser /> },
  { path: "/ed-mgt/documents/upload",                  element: <DocumentUpload /> },
  { path: "/ed-mgt/documents/bulk-upload",             element: <BulkUpload /> },
  { path: "/ed-mgt/documents/import-email",            element: <ImportFromEmail /> },
  { path: "/ed-mgt/documents/my-queue",                element: <MyQueue /> },
  { path: "/ed-mgt/registers/inward",                  element: <InwardMailRegister /> },
  { path: "/ed-mgt/access-requests",                  element: <AccessRequestsPage /> },
  { path: "/ed-mgt/letter-templates",                 element: <LetterTemplatesPage /> },
  { path: "/ed-mgt/file-routing",                      element: <FileRoutingList /> },
  { path: "/ed-mgt/file-routing/submit/:fileId",       element: <FileRoutingSubmit /> },
  { path: "/ed-mgt/file-routing/:id",                  element: <FileRoutingDetail /> },
  { path: "/ed-mgt/registers/senders",                 element: <MailSenders /> },
  { path: "/ed-mgt/registers/outward",                 element: <OutwardMailRegister /> },
  { path: "/ed-mgt/registers/physical-files",          element: <PhysicalFilesPage /> },
  { path: "/ed-mgt/records/files",                     element: <RecordsFilesPage /> },
  { path: "/ed-mgt/records/census",                    element: <CensusPage /> },
  { path: "/ed-mgt/records/bring-ups",                 element: <BringUpPage /> },
  { path: "/ed-mgt/records/files/:folderId/mark-grid", element: <MarkGridPage /> },
  { path: "/ed-mgt/hr-records",                         element: <HrRecordsPage /> },
  { path: "/ed-mgt/documents/recent",                  element: <RecentDocuments /> },
  { path: "/ed-mgt/documents/starred",                 element: <StarredDocuments /> },
  { path: "/ed-mgt/documents/duplicate-check",         element: <DuplicateCheck /> },
  { path: "/ed-mgt/documents/:id/validate",            element: <DocumentValidation /> },
  { path: "/ed-mgt/documents/:id",                     element: <FileView /> },

  { path: "/ed-mgt/settings/external-accounts",        element: <ExternalAccounts /> },
  { path: "/ed-mgt/settings/org-stamps",               element: <OrgStamps /> },
  { path: "/ed-mgt/settings/file-covers",              element: <FileCoverSetup /> },
  { path: "/ed-mgt/settings/esign-security",           element: <EsignSecuritySettings /> },

  { path: "/ed-mgt/reports",                           element: <ReportsDashboard /> },
  { path: "/ed-mgt/sla",                               element: <SLADashboard /> },

  { path: "/ed-mgt/files",                            element: <FilesBrowser /> },

  { path: "/ed-mgt/records",                           element: <RecordsDashboard /> },
  { path: "/ed-mgt/records/schedules",                 element: <RetentionSchedules /> },
  { path: "/ed-mgt/records/legal-holds",               element: <LegalHolds /> },
  { path: "/ed-mgt/records/due-for-action",            element: <DueForAction /> },

  { path: "/ed-mgt/audit",                             element: <AuditLog /> },

  { path: "/ed-mgt/ocr/jobs",                          element: <OCRJobList /> },
  { path: "/ed-mgt/ocr/review",                        element: <OCRReviewQueue /> },
  { path: "/ed-mgt/ocr/jobs/:jobId",                   element: <OCRJobDetail /> },

  { path: "/ed-mgt/admin",                              element: <AdminConsole /> },
  { path: "/ed-mgt/admin/documents",                   element: <AdminDocumentList /> },
  { path: "/ed-mgt/admin/documents/:id",                element: <AdminDocumentDetail /> },
  { path: "/ed-mgt/admin/document-types",              element: <DocumentTypeList /> },
  { path: "/ed-mgt/admin/document-types/:id",          element: <DocumentTypeDetail /> },
  { path: "/ed-mgt/admin/retention-rules",             element: <RetentionRuleList /> },
  { path: "/ed-mgt/admin/locations",                   element: <RegistryList /> },
  { path: "/ed-mgt/admin/locations/:id",               element: <RegistryDetail /> },
];

export default EDMSRoutes;
