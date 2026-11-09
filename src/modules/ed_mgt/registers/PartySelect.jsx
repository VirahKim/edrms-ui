import React, { useCallback, useEffect, useState } from "react";
import { createParty, listParties } from "../../../api/registersApi";
import { toast } from "../components/EDMSToast";

const ADD_NEW = "__add_new__";

/**
 * Picks a source ("received from") or destination ("sent to") for a register entry.
 * Choose a name from the list, or choose "Add new" to type one. A new name is saved
 * once and selected straight away, so it is in the list the next time.
 *
 * `kind` is SOURCE or DESTINATION. `onChange(id, name)` reports the selection.
 */
const PartySelect = ({ kind, value, onChange, label, required = false, disabled = false }) => {
  const [parties, setParties] = useState([]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    listParties(kind)
      .then((res) => setParties(Array.isArray(res?.data) ? res.data : res?.data?.data || []))
      .catch(() => toast.error("Could not load the list."));
  }, [kind]);

  useEffect(() => { load(); }, [load]);

  const handleSelect = (e) => {
    if (e.target.value === ADD_NEW) {
      setAdding(true);
      onChange(null, "");
      return;
    }
    const party = parties.find((p) => String(p.id) === e.target.value);
    setAdding(false);
    onChange(party ? party.id : null, party ? party.name : "");
  };

  const saveNew = async () => {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const res = await createParty({ name, party_kind: kind });
      const party = res?.data ?? res;
      await load();
      setAdding(false);
      setNewName("");
      onChange(party.id, party.name);
      toast.success(`Added “${party.name}”.`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not add the name.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {label && (
        <label className="form-label small fw-semibold">
          {label}{required && <span className="text-danger"> *</span>}
        </label>
      )}
      <select
        className="form-select form-select-sm"
        value={adding ? ADD_NEW : (value ?? "")}
        onChange={handleSelect}
        disabled={disabled}
      >
        <option value="">Select…</option>
        {parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        <option value={ADD_NEW}>+ Add new…</option>
      </select>

      {adding && (
        <div className="input-group input-group-sm mt-2">
          <input
            className="form-control"
            placeholder={kind === "SOURCE" ? "Name of the sender" : "Name of the recipient"}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={200}
            autoFocus
          />
          <button type="button" className="btn btn-primary" onClick={saveNew} disabled={saving || !newName.trim()}>
            {saving ? "Saving…" : "Add"}
          </button>
        </div>
      )}
    </div>
  );
};

export default PartySelect;
