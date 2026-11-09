import { useEffect, useState } from "react";
import { getFileRoutingMe } from "../../../api/fileRoutingApi";

// One request shared by every caller on the page.
let pending = null;
const load = () => {
  if (!pending) {
    pending = getFileRoutingMe()
      .then((r) => !!r?.data?.is_registry_officer)
      .catch(() => { pending = null; return false; });
  }
  return pending;
};

/** True when the signed-in user holds the Registry Officer routing role. */
export default function useIsRegistryOfficer() {
  const [isRegistry, setIsRegistry] = useState(false);
  useEffect(() => {
    let cancelled = false;
    load().then((v) => { if (!cancelled) setIsRegistry(v); });
    return () => { cancelled = true; };
  }, []);
  return isRegistry;
}
