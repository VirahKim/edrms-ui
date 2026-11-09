// Hides inline error alerts (Bootstrap ".alert-danger") 30 seconds after they
// appear, so a stale error does not sit on the page. Error toasts do the same
// in EDMSToast. If an alert's text changes, it is shown again and the timer
// restarts.

const ERROR_TTL_MS = 30000;
const SELECTOR = ".alert-danger";

const timers = new WeakMap();

const arm = (el) => {
  clearTimeout(timers.get(el));
  el.classList.remove("d-none");
  timers.set(el, setTimeout(() => el.classList.add("d-none"), ERROR_TTL_MS));
};

const alertsIn = (node) => {
  if (node.nodeType !== 1) return [];
  const found = Array.from(node.querySelectorAll(SELECTOR));
  if (node.matches(SELECTOR)) found.push(node);
  return found;
};

export const startAutoDismissErrors = () => {
  if (typeof document === "undefined" || typeof MutationObserver === "undefined") return;

  const observer = new MutationObserver((mutations) => {
    const touched = new Set();
    for (const m of mutations) {
      if (m.type === "childList") {
        m.addedNodes.forEach((n) => alertsIn(n).forEach((el) => touched.add(el)));
        // Text changed inside an alert that is already on the page.
        const host = m.target.nodeType === 1 ? m.target.closest(SELECTOR) : null;
        if (host) touched.add(host);
      } else if (m.type === "characterData") {
        const host = m.target.parentElement?.closest(SELECTOR);
        if (host) touched.add(host);
      }
    }
    touched.forEach(arm);
  });

  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
};
