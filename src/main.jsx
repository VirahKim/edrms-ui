const savedTheme = localStorage.getItem("theme") || "light";
document.body.setAttribute("data-pc-theme", savedTheme);
// Bootstrap's own dark-mode variables (bg-*-subtle, *-text-emphasis, table/
// form/link colors) are gated behind data-bs-theme, a different attribute
// from the template's own data-pc-theme above — set both together so
// Bootstrap's dark palette isn't dead code (see global-theme.css for the
// handful of properties both attributes define, re-asserted there so the
// app's custom navy palette keeps winning over Bootstrap's plain grey).
document.body.setAttribute("data-bs-theme", savedTheme);

import React from 'react';
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global-theme.css';
import { startAutoDismissErrors } from './utils/autoDismissErrors';

startAutoDismissErrors();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);