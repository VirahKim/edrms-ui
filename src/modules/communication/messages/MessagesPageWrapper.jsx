import React from "react";
import DashboardLayout from "../../../layout/DashboardLayout";
import MyMessagesInbox from "./MyMessagesInbox";

/**
 * Standalone page for the signed-in user's messages (inbox + sent) — opened
 * directly from the navbar messages bell.
 */
export default function MessagesPageWrapper() {
  return (
    <DashboardLayout>
      <div className="px-3">
        <div className="row">
          <div className="col-12">
            <div className="page-header mb-2">
              <div style={{ display: "flex", flexDirection: "column" }}>
                <h4 style={{ marginBottom: "4px" }}>Messages</h4>
                <p className="text-muted mb-0">
                  Direct messages and requests from other users
                </p>
              </div>
            </div>
            <MyMessagesInbox />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
