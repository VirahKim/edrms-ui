import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../layout/DashboardLayout";
import EDMSToastProvider, { toast } from "../../ed_mgt/components/EDMSToast";
import { getModelPolicies } from "../../../api/aiGatewayApi";

const ModelPolicies = () => {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    getModelPolicies()
      .then(setPolicies)
      .catch(() => toast.error("Couldn't reach the AI gateway to list routing policies."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleRefresh = () => {
    setLoading(true);
    load();
  };

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content">
        <div className="d-flex align-items-center mb-3">
          <div className="flex-grow-1">
            <h5 className="mb-0">Routing Policies</h5>
            <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
              GET /v1/models — each policy maps a name the frontend sends as <code>model</code> to a primary model and an ordered fallback chain.
            </p>
          </div>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleRefresh} disabled={loading}>
            <i className={`ti ti-refresh me-1 ${loading ? "spin" : ""}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="row g-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="col-md-6 col-lg-4">
                <div className="card border-0 shadow-sm placeholder-glow">
                  <div className="card-body">
                    <span className="placeholder col-6 mb-2 d-block" />
                    <span className="placeholder col-9 d-block" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : policies.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="ti ti-route-off" style={{ fontSize: 36, color: "#cbd5e1" }} />
            <p className="mt-2 mb-0">No routing policies returned by the gateway.</p>
          </div>
        ) : (
          <div className="row g-3">
            {policies.map((p) => (
              <div key={p.id} className="col-md-6 col-lg-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="badge bg-light text-dark border" style={{ fontSize: "0.78rem" }}>{p.id}</span>
                    </div>
                    <p className="text-muted mb-2" style={{ fontSize: "0.8rem", minHeight: "2.4em" }}>
                      {p.description || "No description provided."}
                    </p>
                    <div className="mb-2">
                      <small className="text-muted d-block mb-1">Primary model</small>
                      <span className="badge bg-success-subtle text-success-emphasis">{p.primary_model || "—"}</span>
                    </div>
                    {p.fallback_chain?.length > 0 && (
                      <div>
                        <small className="text-muted d-block mb-1">Fallback chain</small>
                        <div className="d-flex flex-wrap gap-1">
                          {p.fallback_chain.map((m, i) => (
                            <span key={m} className="badge bg-light text-dark border" style={{ fontSize: "0.72rem" }}>
                              {i + 1}. {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="card-footer bg-transparent border-top py-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-primary p-0"
                      style={{ fontSize: "0.78rem" }}
                      onClick={() => navigate(`/ai-assistant/chat?model=${encodeURIComponent(p.id)}`)}
                    >
                      <i className="ti ti-message-circle me-1" />
                      Try in chat
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ModelPolicies;
