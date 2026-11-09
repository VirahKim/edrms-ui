import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import ViewNotificationTemplates from "./notifications/ViewNotificationTemplates";
import ViewNotificationSenders from "./notifications/ViewNotificationSenders";
import ViewNotifications from "./notifications/ViewNotifications";
import ViewWABAs from "./whatsapp/ViewWABAs";
import ViewWhatsAppTemplates from "./whatsapp/ViewWhatsAppTemplates";

export default function CommunicationSettingsTabs() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab based on current path
  const getActiveTab = () => {
    const path = location.pathname;
    
    if (path.includes('/senders')) {
      return 'senders';
    }
    if (path.includes('/history')) {
      return 'history';
    }
    if (path.includes('/wabas')) {
      return 'wabas';
    }
    if (path.includes('/whatsapp-templates')) {
      return 'whatsapp-templates';
    }
    if (path.includes('/templates')) {
      return 'templates';
    }
    
    return 'templates'; // Default tab
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());

  const handleTabChange = (tab, path) => {
    setActiveTab(tab);
    navigate(path);
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'templates':
        return <ViewNotificationTemplates />;
      case 'senders':
        return <ViewNotificationSenders />;
      case 'history':
        return <ViewNotifications />;
      case 'wabas':
        return <ViewWABAs />;
      case 'whatsapp-templates':
        return <ViewWhatsAppTemplates />;
      default:
        return <ViewNotificationTemplates />;
    }
  };

  return (
    <DashboardLayout>
      <div className="px-3">
      <div className="row">
        <div className="col-12">
          {/* Page Header */}
          <div className="page-header mb-3">
            <div className="page-block">
              <div className="row align-items-center">
                <div className="col-md-12">
                  <div className="page-header-title">
                    <h2 className="mb-0">
                      <i className="ti ti-messages me-2"></i>
                      Communication Settings
                    </h2>
                  </div>
                  <p className="text-muted mt-2 mb-0">
                    Manage notifications, WhatsApp accounts, templates, and communication history
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="card mb-3">
            <div className="card-body p-0">
              <ul className="nav nav-tabs nav-tabs-custom" role="tablist">
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'templates' ? 'active' : ''}`}
                    onClick={() => handleTabChange('templates', '/communication/notifications/templates')}
                    type="button"
                    role="tab"
                  >
                    <i className="ti ti-template me-2"></i>
                    Templates
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'senders' ? 'active' : ''}`}
                    onClick={() => handleTabChange('senders', '/communication/notifications/senders')}
                    type="button"
                    role="tab"
                  >
                    <i className="ti ti-send me-2"></i>
                    Senders
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => handleTabChange('history', '/communication/notifications/history')}
                    type="button"
                    role="tab"
                  >
                    <i className="ti ti-history me-2"></i>
                    Notification History
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'wabas' ? 'active' : ''}`}
                    onClick={() => handleTabChange('wabas', '/communication/notifications/wabas')}
                    type="button"
                    role="tab"
                  >
                    <i className="ti ti-brand-whatsapp me-2"></i>
                    WhatsApp Accounts
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'whatsapp-templates' ? 'active' : ''}`}
                    onClick={() => handleTabChange('whatsapp-templates', '/communication/notifications/whatsapp-templates')}
                    type="button"
                    role="tab"
                  >
                    <i className="ti ti-message-2 me-2"></i>
                    WhatsApp Templates
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {renderActiveTabContent()}
          </div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}
