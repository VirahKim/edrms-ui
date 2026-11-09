import { lazy } from "react";
const WorkflowDashboard = lazy(() => import("../../modules/workflows/WorkflowDashboard"));
const WorkflowDefinitionsList = lazy(() => import("../../modules/workflows/definitions/WorkflowDefinitionsList"));
const CreateWorkflowDefinition = lazy(() => import("../../modules/workflows/definitions/CreateWorkflowDefinition"));
const ViewWorkflowDefinition = lazy(() => import("../../modules/workflows/definitions/ViewWorkflowDefinition"));
const EditWorkflowDefinition = lazy(() => import("../../modules/workflows/definitions/EditWorkflowDefinition"));
const WorkflowInstancesList = lazy(() => import("../../modules/workflows/instances/WorkflowInstancesList"));
const PendingApprovals = lazy(() => import("../../modules/workflows/approvals/PendingApprovals"));
const ApprovalWindow = lazy(() => import("../../modules/workflows/approvals/ApprovalWindow"));
const WorkflowDelegations = lazy(() => import("../../modules/workflows/delegations/WorkflowDelegations"));

const workflowRoutes = [
    // Main Dashboard
    {
        path: "/workflows",
        element: <WorkflowDashboard />
    },
    {
        path: "/org-settings/workflows",
        element: <WorkflowDashboard />
    },
    
    // Workflow Definitions
    {
        path: "/workflows/definitions",
        element: <WorkflowDefinitionsList />
    },
    {
        path: "/workflows/definitions/create",
        element: <CreateWorkflowDefinition />
    },
    {
        path: "/workflows/definitions/edit/:id",
        element: <EditWorkflowDefinition />
    },
    {
        path: "/workflows/definitions/:id",
        element: <ViewWorkflowDefinition />
    },
    
    // Workflow Instances
    {
        path: "/workflows/instances",
        element: <WorkflowInstancesList />
    },
    {
        path: "/workflows/instances/:id",
        element: <ApprovalWindow />
    },
    
    // Workflow Approvals
    {
        path: "/workflows/approvals/pending",
        element: <PendingApprovals />
    },
    
    // Workflow Delegations
    {
        path: "/workflows/delegations",
        element: <WorkflowDelegations />
    }
];

export default workflowRoutes;
