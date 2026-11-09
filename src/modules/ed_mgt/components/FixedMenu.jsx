import React, { useState, useEffect, useRef } from "react";

/* ── FixedMenu: pure-React dropdown, escapes all overflow ── */
const FixedMenu = ({ trigger, children }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const toggle = (e) => {
    e.stopPropagation();
    if (!open) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: Math.max(8, r.right - 174) });
    }
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          btnRef.current && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", () => setOpen(false), { passive: true, capture: true });
    return () => {
      document.removeEventListener("mousedown", close);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <button ref={btnRef} className="btn btn-link btn-sm p-0 text-muted" onClick={toggle}>
        {trigger}
      </button>
      {open && (
        <ul
          ref={menuRef}
          className="dropdown-menu show shadow"
          style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999, minWidth: 174, fontSize: "0.82rem" }}
        >
          {typeof children === "function" ? children(close) : children}
        </ul>
      )}
    </div>
  );
};

export default FixedMenu;
