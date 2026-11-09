import React from "react";
import DashboardLayout from "../../../layout/DashboardLayout";
import MyNotificationsInbox from "./MyNotificationsInbox";

/**
 * Standalone page for the signed-in user's notification inbox.
 * Renders on its own (no Communication Settings tabs) so it can be
 * opened directly from the navbar notification bell.
 */
export default function InboxPageWrapper() {
  return (
    <DashboardLayout>
      <div className="px-3">
        <div className="row">
          <div className="col-12">
            <div className="page-header mb-2">
              <div style={{ display: "flex", flexDirection: "column" }}>
                <h4 style={{ marginBottom: "4px" }}>My Notifications</h4>
                <p className="text-muted mb-0">
                  Messages and alerts sent directly to you
                </p>
              </div>
            </div>
            <MyNotificationsInbox />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
