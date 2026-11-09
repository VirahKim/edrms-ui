import React, { useEffect, useState } from "react";
import AppRoutes from "./routes/AppRoutes";
import Preloader from "./components/Preloader";
import SessionExpiredOverlay from "./components/SessionExpiredOverlay";
import { ModuleSidebarProvider } from "./contexts/ModuleSidebarContext";
import { PageHeaderProvider } from "./contexts/PageHeaderContext";

const App = () => {
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    // Simulate page load delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Check session expiration on mount and periodically
    const checkSessionExpiration = () => {
      const expiresAt = localStorage.getItem("expires_at");
      if (expiresAt) {
        const expirationTime = new Date(expiresAt).getTime();
        const currentTime = new Date().getTime();
        if (currentTime >= expirationTime && !sessionExpired) {
          setSessionExpired(true);
        }
      }
    };

    checkSessionExpiration();
    const interval = setInterval(checkSessionExpiration, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [sessionExpired]);

  return (
    <PageHeaderProvider>
      <ModuleSidebarProvider>
        {loading ? <Preloader /> : <AppRoutes />}
        {sessionExpired && <SessionExpiredOverlay onReauthenticated={() => setSessionExpired(false)} />}
      </ModuleSidebarProvider>
    </PageHeaderProvider>
  );
};

export default App;