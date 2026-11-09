import React, { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../../layout/DashboardLayout";
import { FONT_FAMILY } from "../constants/fonts";
import EDMSToastProvider, { toast } from "../components/EDMSToast";
import ConfirmModal from "../components/ConfirmModal";
import { connectExternalAccount, listExternalAccounts, disconnectExternalAccount, setDefaultExternalAccount } from "../../../api/edmsApi";

const PROVIDERS = [
  { code: "MICROSOFT", label: "Microsoft (OneDrive / Office 365)", icon: "ti-brand-windows", color: "#0364b8" },
  { code: "GOOGLE", label: "Google (Drive / Docs)", icon: "ti-brand-google-drive", color: "#0f9d58" },
];

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString() : "—");

const ExternalAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(null);
  const [disconnectTarget, setDisconnectTarget] = useState(null);
  const [settingDefault, setSettingDefault] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    listExternalAccounts()
      .then((r) => setAccounts(r?.data || []))
      .catch(() => toast.error("Failed to load connected accounts."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleConnect = async (provider) => {
    setConnecting(provider);
    try {
      const res = await connectExternalAccount(provider);
      const url = res?.data?.redirect_url;
      if (!url) { toast.error("Could not start the connection."); return; }
      // Opens in a new tab — the OAuth consent flow ends on a static
      // "account connected" page served by the API, not back in the SPA, so
      // this tab stays put. The user clicks Refresh here once they're done.
      window.open(url, "_blank", "noopener,noreferrer");
      toast.success("Complete the sign-in in the new tab, then click Refresh below.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to start connection.");
    } finally {
      setConnecting(null);
    }
  };

  const handleSetDefault = async (account) => {
    setSettingDefault(account.id);
    try {
      await setDefaultExternalAccount(account.id);
      toast.success(`${account.provider_account_email} set as default.`);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to set default account.");
    } finally {
      setSettingDefault(null);
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectTarget) return;
    try {
      await disconnectExternalAccount(disconnectTarget.id);
      toast.success(`Disconnected ${disconnectTarget.provider_account_email || disconnectTarget.provider}.`);
      setDisconnectTarget(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to disconnect account.");
      setDisconnectTarget(null);
    }
  };

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="mb-0">Connected Accounts</h4>
            <small className="text-muted">
              Connect your Microsoft or Google account to co-edit documents in the cloud. Files always come back
              to this server when you finish — nothing stays in the cloud after an editing session ends.
            </small>
          </div>
          <button className="btn btn-sm btn-outline-primary" onClick={load}>
            <i className="ti ti-refresh me-1" />Refresh
          </button>
        </div>

        {accounts.length > 1 && (
          <p className="text-muted mb-2" style={{ fontSize: "0.82rem" }}>
            <i className="ti ti-star me-1" />
            Multiple accounts connected — pick a default below. It's used automatically wherever a mailbox is
            needed (like Import from Email), so you're not asked to choose each time.
          </p>
        )}

        <div className="row g-3 mb-4">
          {PROVIDERS.map((p) => {
            const connected = accounts.find((a) => a.provider === p.code);
            return (
              <div key={p.code} className="col-md-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: 46, height: 46, background: `${p.color}1a`, color: p.color }}
                    >
                      <i className={`ti ${p.icon}`} style={{ fontSize: "1.4rem" }} />
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-semibold d-flex align-items-center gap-2">
                        {p.label}
                        {connected?.is_default && (
                          <span className="badge bg-primary-subtle text-primary border" style={{ fontSize: "0.68rem" }}>
                            <i className="ti ti-star-filled me-1" />Default
                          </span>
                        )}
                      </div>
                      {connected ? (
                        <>
                          <div className="text-success small">
                            <i className="ti ti-circle-check me-1" />
                            Connected as {connected.provider_account_email}
                          </div>
                          <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                            Since {fmtDate(connected.connected_at)}
                          </div>
                        </>
                      ) : (
                        <div className="text-muted small">Not connected</div>
                      )}
                    </div>
                    {connected ? (
                      <div className="d-flex flex-column align-items-end gap-1 flex-shrink-0">
                        {accounts.length > 1 && !connected.is_default && (
                          <button
                            type="button"
                            className="btn btn-sm btn-link p-0 text-decoration-none"
                            style={{ fontSize: "0.78rem" }}
                            disabled={settingDefault === connected.id}
                            onClick={() => handleSetDefault(connected)}
                          >
                            {settingDefault === connected.id
                              ? <span className="spinner-border spinner-border-sm" />
                              : <><i className="ti ti-star me-1" />Set as default</>}
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => setDisconnectTarget(connected)}
                        >
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn btn-sm btn-primary flex-shrink-0"
                        disabled={connecting === p.code}
                        onClick={() => handleConnect(p.code)}
                      >
                        {connecting === p.code
                          ? <span className="spinner-border spinner-border-sm" />
                          : <>Connect</>}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {loading && (
          <div className="text-center text-muted py-3">
            <span className="spinner-border spinner-border-sm me-2" />Loading…
          </div>
        )}
      </div>

      <ConfirmModal
        show={!!disconnectTarget}
        title="Disconnect Account"
        message={`Disconnect ${disconnectTarget?.provider_account_email || "this account"}? Any cloud-edit session currently open with it will still need to be completed or abandoned separately.`}
        confirmLabel="Disconnect"
        danger
        onConfirm={handleDisconnect}
        onCancel={() => setDisconnectTarget(null)}
      />
    </DashboardLayout>
  );
};

export default ExternalAccounts;
