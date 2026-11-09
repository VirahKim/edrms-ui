import { useEffect, useState } from "react";
import Select from "react-select";
import apiClient from "../../../api/apiClient";

// Shared across every <UserSelect> on the page — the org's user list is the
// same regardless of which field is being edited, so one fetch serves every
// instance instead of each dropdown hitting /IAmAPI/api/users on its own.
let usersCache = null;
let usersPromise = null;

// The display name of a user the list has loaded, or null.
export const userLabelFor = (id) =>
    (usersCache || []).find((o) => String(o.value) === String(id))?.label || null;

function loadUserOptions() {
    if (usersCache) return Promise.resolve(usersCache);
    if (usersPromise) return usersPromise;

    usersPromise = apiClient
        .get("/IAmAPI/api/users", { params: { limit: 1000 } })
        .then((res) => {
            const list = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
            usersCache = list.map((u) => ({
                value: u.id,
                label: `${u.first_name || ""} ${u.other_name || ""}`.trim() || u.user_name || u.email_address || `User #${u.id}`,
                email: u.email_address,
                role: u.role_name || "",
                roleId: u.role_id ?? null,
            }));
            return usersCache;
        })
        .finally(() => {
            usersPromise = null;
        });

    return usersPromise;
}

const formatOptionLabel = (opt) => (
    <div>
        <div>{opt.label}</div>
        {opt.role && (
            <div className="text-primary fw-semibold" style={{ fontSize: "0.75rem" }}>{opt.role}</div>
        )}
        {opt.email && (
            <div className="text-muted" style={{ fontSize: "0.75rem" }}>{opt.email}</div>
        )}
    </div>
);

// Search by name, role/title or email, so "Director" or "Finance" finds the right person.
const filterOption = (option, input) => {
    const q = input.trim().toLowerCase();
    if (!q) return true;
    const { label, role, email } = option.data;
    return [label, role, email].some((v) => (v || "").toLowerCase().includes(q));
};

const selectStyles = {
    control: (base) => ({ ...base, minHeight: 38 }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};

// A searchable "pick a user" dropdown backed by /IAmAPI/api/users. `value` is
// the user's id (number, string, or null/empty); `onChange` is called with
// the selected user's id (or null when cleared) — never the whole option —
// so it drops straight into existing `..._user_id` form state. With `isMulti`,
// `value` is an array of ids and `onChange` receives the array of ids.
// `excludeIds` hides users who shouldn't be offered (e.g. yourself, or people
// already in a conversation).
export default function UserSelect({
    value,
    onChange,
    placeholder = "Search and select a user…",
    isClearable = true,
    isDisabled = false,
    isMulti = false,
    excludeIds = [],
    roleIds = null,   // when given, only users whose role is one of these (e.g. the Marking Officer roles)
    onCount = null,   // told how many people are on offer (after the role restriction), once loaded
}) {
    const [options, setOptions] = useState(usersCache || []);
    const [loading, setLoading] = useState(!usersCache);

    useEffect(() => {
        if (usersCache) return;
        let cancelled = false;
        loadUserOptions().then((opts) => {
            if (!cancelled) {
                setOptions(opts);
                setLoading(false);
            }
        });
        return () => { cancelled = true; };
    }, []);

    const excluded = new Set(excludeIds.map(String));
    const allowedRoles = roleIds ? new Set(roleIds.map(String)) : null;
    const available = options.filter((o) =>
        !excluded.has(String(o.value)) && (!allowedRoles || allowedRoles.has(String(o.roleId))));

    const offered = available.length;
    useEffect(() => { if (!loading) onCount?.(offered); }, [loading, offered]); // eslint-disable-line react-hooks/exhaustive-deps

    const selected = isMulti
        ? options.filter((o) => (value || []).some((v) => String(v) === String(o.value)))
        : value != null && value !== ""
            ? options.find((o) => String(o.value) === String(value)) || null
            : null;

    return (
        <Select
            classNamePrefix="qs-select"
            options={available}
            value={selected}
            isMulti={isMulti}
            closeMenuOnSelect={!isMulti}
            onChange={(opt) =>
                onChange(isMulti ? (opt || []).map((o) => o.value) : opt ? opt.value : null)
            }
            formatOptionLabel={formatOptionLabel}
            filterOption={filterOption}
            isClearable={isClearable}
            isDisabled={isDisabled}
            isLoading={loading}
            isSearchable
            placeholder={placeholder}
            styles={selectStyles}
            menuPortalTarget={document.body}
            noOptionsMessage={() => (loading ? "Loading users…" : "No users found")}
        />
    );
}
