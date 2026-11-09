import { useState } from "react";

// Drop-in replacement for <input type="password" className="form-control" />
// with a show/hide toggle. All other props (value, onChange, placeholder,
// autoComplete, required, disabled, autoFocus, id, ...) pass through to the
// underlying <input>.
const PasswordInput = ({ className = "", style, ...props }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="position-relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={`form-control${className ? ` ${className}` : ""}`}
        style={{ paddingRight: "2.5rem", ...style }}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        className="btn btn-link position-absolute p-0 text-muted"
        style={{ top: "50%", right: "0.75rem", transform: "translateY(-50%)", lineHeight: 1, zIndex: 5 }}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        <i className={`ti ${visible ? "ti-eye-off" : "ti-eye"} f-16`} />
      </button>
    </div>
  );
};

export default PasswordInput;
