import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});


/* -------------------- HELPERS -------------------- */

const isTokenExpiringSoon = () => {
  const expiresAt = localStorage.getItem("expires_at");
  if (!expiresAt) return true;

  const expMs = new Date(expiresAt).getTime(); // ISO → ms
  const nowMs = Date.now();

  return expMs - nowMs <= 5000; // 5 seconds
};

let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, token = null) => {
  refreshQueue.forEach(promise => {
    if (error) promise.reject(error);
    else promise.resolve(token);
  });
  refreshQueue = [];
};

// Coalesces concurrent refresh attempts (from the proactive pre-request check
// and from 401 recovery below) into a single in-flight call, so a burst of
// simultaneous requests doesn't each fire its own refresh-token call.
const doRefresh = async () => {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      refreshQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;
  try {
    const newToken = await refreshToken();
    processQueue(null, newToken);
    return newToken;
  } catch (err) {
    processQueue(err, null);
    throw err;
  } finally {
    isRefreshing = false;
  }
};

// Single canonical logout for the whole app — clears every auth/session key
// any part of the app has ever stored and hard-redirects to "/". Exported so
// Navbar, SessionExpiredOverlay, UserContext, etc. all funnel through this
// instead of each keeping their own (previously drifting) copy.
export const logout = () => {
  ["token", "refresh", "expires_at", "2fa", "user", "stock_location", "sales_station"].forEach((k) =>
    localStorage.removeItem(k)
  );
  ["stock_location", "sales_station"].forEach((k) =>
    sessionStorage.removeItem(k)
  );
  window.location.href = "/";
};

const refreshToken = async () => {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) throw new Error("No refresh token");

  const res = await axios.post(
    `${import.meta.env.VITE_API_BASE_URL || ""}/IAmAPI/api/auth/refresh-token`,
    { refresh_token: refresh }
  );

  const { access_token, refresh_token, expires_at } = res.data;

  localStorage.setItem("token", access_token);
  localStorage.setItem("refresh", refresh_token);
  localStorage.setItem("expires_at", expires_at);

  return access_token;
};


/* -------------------- SHARED TOKEN ACCESS --------------------
   Exported so other API clients that hit different hosts (e.g. the AI
   Gateway) can authenticate with the same bearer JWT and refresh flow
   instead of duplicating it. */

export const getValidAccessToken = async () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  if (!isTokenExpiringSoon()) return token;

  try {
    return await doRefresh();
  } catch (err) {
    logout();
    throw err;
  }
};

/* -------------------- REQUEST INTERCEPTOR -------------------- */

apiClient.interceptors.request.use(async (config) => {
  const token = await getValidAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* -------------------- RESPONSE INTERCEPTOR -------------------- */
// A 401 doesn't necessarily mean the session is dead — the proactive
// pre-request refresh (above) only fires when the access token is close to
// its own expiry, so a token that's merely stale for other reasons (or any
// other cause of a 401) reaches here first. Try one silent refresh before
// concluding the session is actually gone; only a failed refresh logs out.
// Without this, a single unrelated 401 on any request — not just an
// actually-expired session — nuked the whole session immediately.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error.config;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newToken = await doRefresh();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        logout();
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;