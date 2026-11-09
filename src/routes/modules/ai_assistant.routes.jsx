import { lazy } from "react";
const ChatInterface = lazy(() => import("../../modules/ai_assistant/AiChatInterface"));
const AiAdminConsole = lazy(() => import("../../modules/ai_assistant/admin/AiAdminConsole"));
const ModelPolicies = lazy(() => import("../../modules/ai_assistant/admin/ModelPolicies"));
const AiErrorLogs = lazy(() => import("../../modules/ai_assistant/admin/AiErrorLogs"));
const AiMonitoringDashboard = lazy(() => import("../../modules/ai_assistant/monitoring/AiMonitoringDashboard"));

const AiAssistantRoutes = () => [
  { path: "/ai-assistant/chat",              element: <ChatInterface /> },

  { path: "/ai-assistant/admin",             element: <AiAdminConsole /> },
  { path: "/ai-assistant/admin/policies",    element: <ModelPolicies /> },
  { path: "/ai-assistant/admin/error-logs",  element: <AiErrorLogs /> },

  { path: "/ai-assistant/monitoring",        element: <AiMonitoringDashboard /> },
];

export default AiAssistantRoutes;
