import React, { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../../layout/DashboardLayout";
import EDMSToastProvider, { toast } from "../../ed_mgt/components/EDMSToast";
import { getGatewayHealth, getBudgetSummary } from "../../../api/aiGatewayApi";

const REFRESH_MS = 30_000;

const StatTile = ({ icon, label, value, gradient }) => (
  <div className="card border-0 shadow-sm overflow-hidden" style={{ background: gradient }}>
    <div className="card-body py-2 px-3">
      <div className="d-flex align-items-center gap-1 mb-1">
        <i className={`ti ${icon} text-white`} style={{ fontSize: "0.95rem", marginTop: 1 }} />
        <p className="mb-0 text-white opacity-75" style={{ fontSize: "0.68rem", lineHeight: 1.3 }}>{label}</p>
      </div>
      <h5 className="mb-0 text-white fw-bold lh-1">{value ?? "—"}</h5>
    </div>
  </div>
);

// GET /v1/budget response fields (API_GUIDE.md §4.4) — organization_id is
// read from the caller's JWT, not user-supplied, so there's nothing to pick
// a tenant for.
const KNOWN_BUDGET_FIELDS = [
  { key: "budget_usd", label: "Monthly budget", icon: "ti-wallet" },
  { key: "spent_usd", label: "Spent", icon: "ti-trending-up" },
  { key: "remaining_usd", label: "Remaining", icon: "ti-pig-money" },
  { key: "utilization_pct", label: "% used", icon: "ti-percentage" },
];

const BudgetPanel = ({ data, loading, error }) => {
  const knownEntries = KNOWN_BUDGET_FIELDS.filter((f) => data && data[f.key] !== undefined);
  const hasKnownShape = knownEntries.length > 0;

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-transparent border-bottom py-2 px-3">
        <h6 className="mb-0 fw-semibold" style={{ fontSize: "0.85rem" }}>
          <i className="ti ti-report-money me-2 text-primary" />
          Budget — organization "{data?.organization_id ?? "…"}"
        </h6>
      </div>
      <div className="card-body">
        {loading ? (
          <div className="placeholder-glow">
            <span className="placeholder col-12 rounded" style={{ height: 60, display: "block" }} />
          </div>
        ) : error ? (
          <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
            <i className="ti ti-alert-triangle me-1 text-warning" />
            Couldn't load budget data for your organization.
          </p>
        ) : hasKnownShape ? (
          <>
            <div className="row g-2">
              {knownEntries.map((f) => (
                <div key={f.key} className="col-6 col-md-3">
                  <div className="border rounded-3 p-2 text-center">
                    <i className={`ti ${f.icon} text-primary d-block mb-1`} style={{ fontSize: "1.1rem" }} />
                    <div className="fw-bold">{typeof data[f.key] === "number" ? data[f.key].toLocaleString() : String(data[f.key])}</div>
                    <small className="text-muted">{f.label}</small>
                  </div>
                </div>
              ))}
            </div>
            {data.budget_usd === 0 && (
              <p className="text-muted mb-0 mt-2" style={{ fontSize: "0.78rem" }}>
                <i className="ti ti-info-circle me-1" />
                Reports zero until this organization has a budget configured server-side — expected for now (API_GUIDE.md §8).
              </p>
            )}
          </>
        ) : (
          <pre className="mb-0 bg-light p-2 rounded" style={{ fontSize: "0.78rem", whiteSpace: "pre-wrap" }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};

const AiMonitoringDashboard = () => {
  const [health, setHealth] = useState(null);
  const [healthError, setHealthError] = useState(false);
  const [healthLoading, setHealthLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);

  const [budget, setBudget] = useState(null);
  const [budgetLoading, setBudgetLoading] = useState(true);
  const [budgetError, setBudgetError] = useState(false);

  const loadHealth = useCallback(() => {
    getGatewayHealth()
      .then((data) => {
        setHealth(data);
        setHealthError(false);
        setLastChecked(new Date());
      })
      .catch(() => setHealthError(true))
      .finally(() => setHealthLoading(false));
  }, []);

  const loadBudget = useCallback(() => {
    getBudgetSummary()
      .then((data) => {
        setBudget(data);
        setBudgetError(false);
      })
      .catch(() => {
        setBudgetError(true);
        toast.error("Couldn't load budget for your organization.");
      })
      .finally(() => setBudgetLoading(false));
  }, []);

  const handleRefreshHealth = () => {
    setHealthLoading(true);
    loadHealth();
  };

  const handleRefreshBudget = () => {
    setBudgetLoading(true);
    loadBudget();
  };

  useEffect(() => {
    loadHealth();
    const id = setInterval(loadHealth, REFRESH_MS);
    return () => clearInterval(id);
  }, [loadHealth]);

  useEffect(() => {
    loadBudget();
  }, [loadBudget]);

  const isUp = health?.status === "ok";

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content">
        <div className="d-flex align-items-center mb-3">
          <div className="flex-grow-1">
            <h5 className="mb-0">AI Gateway Monitoring</h5>
            <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
              Live status pulled straight from the gateway — refreshes every 30 seconds.
            </p>
          </div>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleRefreshHealth} disabled={healthLoading}>
            <i className={`ti ti-refresh me-1 ${healthLoading ? "spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-md-3 col-6">
            <StatTile
              icon={isUp ? "ti-circle-check" : "ti-circle-x"}
              label="Gateway status"
              value={healthError ? "Unreachable" : isUp ? "Healthy" : health ? "Degraded" : "—"}
              gradient={healthError ? "linear-gradient(135deg,#e35d6a,#c0392b)" : isUp ? "linear-gradient(135deg, #007bff, #003d80)" : "linear-gradient(135deg,#f7971e,#c47f00)"}
            />
          </div>
          <div className="col-md-3 col-6">
            <StatTile icon="ti-server-2" label="Gateway" value={health?.gateway || "—"} gradient="linear-gradient(135deg, #3395ff, #0069d9)" />
          </div>
          <div className="col-md-3 col-6">
            <StatTile icon="ti-cpu" label="Providers available" value={health?.providers_available ?? "—"} gradient="linear-gradient(135deg,#667eea,#764ba2)" />
          </div>
          <div className="col-md-3 col-6">
            <StatTile
              icon="ti-clock"
              label="Last checked"
              value={lastChecked ? lastChecked.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}
              gradient="linear-gradient(135deg,#556270,#3a3f47)"
            />
          </div>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-lg-6">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-header bg-transparent border-bottom py-2 px-3">
                <h6 className="mb-0 fw-semibold" style={{ fontSize: "0.85rem" }}>
                  <i className="ti ti-plug-connected me-2 text-primary" />
                  Providers
                </h6>
              </div>
              <div className="card-body">
                {healthError ? (
                  <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
                    <i className="ti ti-alert-triangle me-1 text-warning" />
                    Couldn't reach {import.meta.env.VITE_AI_GATEWAY_BASE_URL || "the gateway"}.
                  </p>
                ) : health?.providers?.length > 0 ? (
                  <div className="d-flex flex-wrap gap-2">
                    {health.providers.map((p) => (
                      <span key={p} className="badge bg-light text-dark border" style={{ fontSize: "0.78rem" }}>
                        <i className="ti ti-point-filled text-success me-1" style={{ fontSize: "0.6rem" }} />
                        {p}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>No providers reported.</p>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-header bg-transparent border-bottom py-2 px-3 d-flex align-items-center gap-2">
                <h6 className="mb-0 fw-semibold flex-grow-1" style={{ fontSize: "0.85rem" }}>
                  <i className="ti ti-info-circle me-2 text-primary" />
                  Known limitations
                </h6>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleRefreshBudget} disabled={budgetLoading}>
                  <i className={`ti ti-refresh me-1 ${budgetLoading ? "spin" : ""}`} />
                  Refresh budget
                </button>
              </div>
              <div className="card-body">
                <ul className="mb-0 ps-3" style={{ fontSize: "0.8rem" }}>
                  <li>No streaming — every chat response is a single complete reply.</li>
                  <li>Budget/rate-limit counters reset on every gateway restart (not yet persisted).</li>
                  <li>No per-policy RBAC — any authenticated caller can use any routing policy.</li>
                  <li>The budget below is always <em>your</em> organization — the gateway reads it from your token, there's no way to inspect another org's.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <BudgetPanel data={budget} loading={budgetLoading} error={budgetError} />
      </div>
    </DashboardLayout>
  );
};

export default AiMonitoringDashboard;
