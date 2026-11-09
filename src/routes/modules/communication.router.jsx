import { lazy } from "react";
const CommunicationSettingsTabs = lazy(() => import("../../modules/communication/CommunicationSettingsTabs"));
const CreateNotificationTemplate = lazy(() => import("../../modules/communication/notifications/CreateNotificationTemplate"));
const AddNotificationSender = lazy(() => import("../../modules/communication/notifications/AddNotificationSender"));
const ViewNotificationDetails = lazy(() => import("../../modules/communication/notifications/ViewNotificationDetails"));
const ProviderConfigsMgt = lazy(() => import("../../modules/communication/notifications/ProviderConfigsMgt"));
const InboxPageWrapper = lazy(() => import("../../modules/communication/notifications/InboxPageWrapper"));

// Messages Module (direct user-to-user messages/requests)
const MessagesPageWrapper = lazy(() => import("../../modules/communication/messages/MessagesPageWrapper"));

// WhatsApp Module
const WhatsAppChatInterface = lazy(() => import("../../modules/communication/whatsapp/WhatsAppChatInterface"));
const CreateWhatsAppTemplate = lazy(() => import("../../modules/communication/whatsapp/CreateWhatsAppTemplate"));
const ViewWhatsAppTemplates = lazy(() => import("../../modules/communication/whatsapp/ViewWhatsAppTemplates"));

const CommunicationRoutes = () => {
  return [
    // Communication Settings Tabs (includes notifications and WhatsApp)
    {
      path: "/communication/notifications/templates",
      element: <CommunicationSettingsTabs />
    },
    {
      path: "/communication/notifications/senders",
      element: <CommunicationSettingsTabs />
    },
    {
      path: "/communication/notifications/history",
      element: <CommunicationSettingsTabs />
    },
    {
      path: "/communication/notifications/my-inbox",
      element: <InboxPageWrapper />
    },
    {
      path: "/communication/notifications/wabas",
      element: <CommunicationSettingsTabs />
    },
    {
      path: "/communication/notifications/whatsapp-templates",
      element: <CommunicationSettingsTabs />
    },
    
    // Notification CRUD Routes
    {
      path: "/communication/notifications/templates/create",
      element: <CreateNotificationTemplate />
    },
    {
      path: "/communication/notifications/templates/edit/:id",
      element: <CreateNotificationTemplate />
    },
    {
      path: "/communication/notifications/senders/add",
      element: <AddNotificationSender />
    },
    {
      path: "/communication/notifications/senders/edit/:id",
      element: <AddNotificationSender />
    },
    {
      path: "/communication/notifications/senders/:id/configs",
      element: <ProviderConfigsMgt />
    },
    {
      path: "/communication/notifications/details/:id",
      element: <ViewNotificationDetails />
    },

    // Standalone inbox page (opened from the navbar bell — no settings tabs)
    {
      path: "/communication/notifications/inbox",
      element: <InboxPageWrapper />
    },

    // Standalone messages page (opened from the navbar messages bell)
    {
      path: "/communication/messages/inbox",
      element: <MessagesPageWrapper />
    },

    // WhatsApp Routes
    {
      path: "/communication/whatsapp/chat",
      element: <WhatsAppChatInterface />
    }
    ,
    {
      path: "/communication/whatsapp/templates/create",
      element: <CreateWhatsAppTemplate />
    },
    {
      path: "/communication/whatsapp/templates/send/:id",
      element: <ViewWhatsAppTemplates />
    },
    {
      path: "/communication/whatsapp/templates",
      element: <ViewWhatsAppTemplates />
    }
  ];
};

export default CommunicationRoutes;
