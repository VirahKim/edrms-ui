import React, { useEffect, useState } from "react";
import DashboardLayout from "../../../layout/DashboardLayout";
import { FONT_FAMILY } from "../constants/fonts";
import EDMSToastProvider, { toast } from "../components/EDMSToast";
import FileCoverView from "../components/FileCoverView";
import CoverColorPicker from "../components/CoverColorPicker";
import { getCoverColors, getCoverSettings, saveCoverSettings } from "../../../api/fileCoversApi";

/**
 * Set up the wording that comes printed on every file cover (Republic of Kenya / Ministry of Health) and the default
 * colour. An individual file can still carry a different header (for example a county government) or colour.
 */
const FileCoverSetup = () => {
  const [form, setForm] = useState({ header_line1: "", header_line2: "", default_color: "BLUE" });
  const [colors, setColors] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getCoverSettings(), getCoverColors()])
      .then(([s, c]) => { if (s) setForm(s); setColors(c); })
      .catch(() => toast.error("Could not load the cover setup."))
      .finally(() => setLoaded(true));
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const paper = colors.find((c) => c.code === form.default_color) || { color_hex: "#1e88e5", ink_hex: "#0b2a4a" };

  const save = async () => {
    setSaving(true);
    try {
      await saveCoverSettings(form);
      toast.success("File cover setup saved.");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <EDMSToastProvider />
      <div className="pc-content" style={{ fontFamily: FONT_FAMILY }}>
        <h4 className="mb-1">File cover setup</h4>
        <p className="text-muted">The wording printed at the top of every file cover. Each file shows its own reference number, volume, department and subject beneath it.</p>
        <div className="row g-4">
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm"><div className="card-body">
              <label className="form-label fw-semibold">Top line</label>
              <input className="form-control mb-3" value={form.header_line1} maxLength={200} placeholder="Republic of Kenya"
                     onChange={(e) => set("header_line1", e.target.value)} disabled={!loaded} />
              <label className="form-label fw-semibold">Ministry / organisation</label>
              <input className="form-control mb-3" value={form.header_line2} maxLength={200} placeholder="Ministry of Health"
                     onChange={(e) => set("header_line2", e.target.value)} disabled={!loaded} />
              <label className="form-label fw-semibold">Default cover colour</label>
              <div className="mb-3"><CoverColorPicker value={form.default_color} onChange={(c) => set("default_color", c)} /></div>
              <div className="form-text mb-3">A file can be given another colour, or a different header (for example a county government), from its own cover.</div>
              <button className="btn btn-primary" onClick={save} disabled={saving || !loaded}>{saving ? "Saving…" : "Save"}</button>
            </div></div>
          </div>
          <div className="col-lg-7">
            <FileCoverView size="card" cover={{
              reference_no: "MOH/ADM/1/1/43", volume_no: "IV", header_line1: form.header_line1 || "Republic of Kenya",
              header_line2: form.header_line2, department: "HQS - Administration", subject: "Records management operations",
              color_hex: paper.color_hex, ink_hex: paper.ink_hex,
              movements: [{ date: new Date().toISOString(), from: "Registry", to: "Marking Officer" }],
            }} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FileCoverSetup;
