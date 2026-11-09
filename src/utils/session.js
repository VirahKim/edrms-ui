// Shared by every page that calls /api/auth/login or /api/auth/complete-first-login
// (Login.jsx, FirstLoginPasswordChange.jsx) — those endpoints all return one
// of the same three shapes, so the response is handled identically no matter
// which page triggered it.
export function applySessionResponse(data, fallbackEmail, fallbackPassword) {
    if (data.must_change_password) {
        // Stash the identifier (and the password just typed, so the next
        // page can pre-fill "Current Password" instead of asking the user
        // to retype what they just entered) for FirstLoginPasswordChange.
        sessionStorage.setItem("first_login_email", fallbackEmail || "");
        if (fallbackPassword) sessionStorage.setItem("first_login_password", fallbackPassword);
        window.location.href = "/first-login-password-change";
        return;
    }

    if (data.requires_2fa) {
        sessionStorage.setItem("2fa_email", fallbackEmail || "");
        window.location.href = "/user-verification";
        return;
    }

    localStorage.setItem("token", data.access_token);
    localStorage.setItem("refresh", data.refresh_token);
    localStorage.setItem("expires_at", data.expires_at);
    localStorage.setItem("user", JSON.stringify(data.user_profile));
    window.location.href = "/dashboard";
}
