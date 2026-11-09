import axios from "axios";

const authClient = axios.create({
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

/* -------------------- REFRESH LOGIC -------------------- */

let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, token = null) => {
  refreshQueue.forEach(promise => {
    if (error) promise.reject(error);
    else promise.resolve(token);
  });
  refreshQueue = [];
};

/* -------------------- REQUEST INTERCEPTOR -------------------- */

// authClient.interceptors.request.use(async (config) => {
//   const token = localStorage.getItem("token");

//   if (!token) return config;

//   if (isTokenExpiringSoon()) {
//     if (isRefreshing) {
//       return new Promise((resolve, reject) => {
//         refreshQueue.push({
//           resolve: (newToken) => {
//             config.headers.Authorization = `Bearer ${newToken}`;
//             resolve(config);
//           },
//           reject
//         });
//       });
//     }

//     isRefreshing = true;

//     try {
//       const newToken = await refreshToken();
//       processQueue(null, newToken);
//       config.headers.Authorization = `Bearer ${newToken}`;
//     } catch (err) {
//       processQueue(err, null);
//       logout();
//       return Promise.reject(err);
//     } finally {
//       isRefreshing = false;
//     }
//   } else {
//     config.headers.Authorization = `Bearer ${token}`;
//   }

//   return config;
// });

/* -------------------- RESPONSE INTERCEPTOR -------------------- */
// Intercept 401 errors globally
// authClient.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     const status = error?.response?.status;

//     if (status === 401) {
//       // Token expired → Logout
//       ["token", "refresh", "expires_at", "2fa", "user"].forEach((k) =>
//         localStorage.removeItem(k)
//       );
//       window.location.href = "/";
//     }

//     return Promise.reject(error);
//   }
// );

export default authClient;