import { useEffect, useState } from "react";
import Select from "react-select";
import { getRegistries } from "../../../../api/edmsApi";

const TYPE_LABEL = { CENTRAL: "Central", HR: "HR", SECRET: "Secret", TECHNICAL: "Technical", OTHER: "Sub-registry" };

/**
 * Which registries a user works in - optional, and more than one is allowed. A person tied to a sub-registry
 * (HR, Secret, Technical ...) sees only that registry's files and lands on its dashboard; a person in the
 * Central Registry sees every file; a person with no registry is not limited. Registries are kept in the EDMS.
 *   value     array of registry ids
 *   onChange  called with the new array of ids
 */
export default function UserRegistrySelect({ value, onChange, disabled = false }) {
    const [registries, setRegistries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        getRegistries()
            .then((r) => {
                if (cancelled) return;
                const list = r?.data?.items || r?.data || (Array.isArray(r) ? r : []);
                setRegistries(Array.isArray(list) ? list.filter((x) => x.is_active !== false) : []);
            })
            .catch(() => { if (!cancelled) setFailed(true); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const options = registries.map((r) => ({ value: r.id, label: `${r.name} (${TYPE_LABEL[r.registry_type] || "Central"})` }));
    const selected = options.filter((o) => (value || []).includes(o.value));

    return (
        <div className="mb-3">
            <label className="form-label">Registry <span className="text-muted fw-normal">(optional)</span></label>
            <Select
                isMulti
                isDisabled={disabled}
                isLoading={loading}
                options={options}
                value={selected}
                onChange={(opts) => onChange((opts || []).map((o) => o.value))}
                placeholder="Not tied to a registry"
                noOptionsMessage={() => (failed ? "The registries could not be loaded" : "No registries set up yet")}
                menuPortalTarget={document.body}
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
            />
            <small className="text-muted">
                Only for people who work in a registry. Someone in a sub-registry (HR, Secret, Technical) sees only that registry's
                files and gets its dashboard; the Central Registry sees all files. Leave empty for everyone else.
            </small>
        </div>
    );
}
