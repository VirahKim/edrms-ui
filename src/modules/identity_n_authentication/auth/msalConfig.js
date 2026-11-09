// src/modules/auth/msalConfig.js
import { PublicClientApplication } from "@azure/msal-browser";

// Must match the Entra ID app registration the Auth API validates against
// (AzureAd:TenantId / AzureAd:ClientId in the API's appsettings.json).
const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_AD_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_AD_TENANT_ID}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

// Must resolve before any other MSAL API call, but loginPopup() itself must be
// called with nothing awaited ahead of it in the click handler (any await there
// can break the browser's popup/user-gesture tracking) — so initialize once
// here at module load instead of inside the button's onClick.
export const msalReady = msalInstance.initialize();

export const loginRequest = {
  scopes: ["openid", "profile", "email"],
};
