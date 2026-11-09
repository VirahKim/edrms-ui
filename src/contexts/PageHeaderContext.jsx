import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

const PageHeaderContext = createContext(null);

export const usePageHeaderContext = () => {
  const context = useContext(PageHeaderContext);
  if (!context) {
    throw new Error("usePageHeaderContext must be used within a PageHeaderProvider");
  }
  return context;
};

export const PageHeaderProvider = ({ children }) => {
  const [header, setHeader] = useState({ title: null, subtitle: null, breadcrumb: null, actions: null });

  const setPageHeader = useCallback((next) => {
    setHeader({
      title: next?.title ?? null,
      subtitle: next?.subtitle ?? null,
      breadcrumb: next?.breadcrumb ?? null,
      actions: next?.actions ?? null,
    });
  }, []);

  const clearPageHeader = useCallback(() => {
    setHeader({ title: null, subtitle: null, breadcrumb: null, actions: null });
  }, []);

  return (
    <PageHeaderContext.Provider value={{ header, setPageHeader, clearPageHeader }}>
      {children}
    </PageHeaderContext.Provider>
  );
};

// Lets a page register its title, breadcrumb trail, and action buttons into
// the Navbar, which is a layout sibling rather than a parent of the page.
// `deps` follows useEffect rules — pass the values the header content
// depends on (e.g. a record name once it loads) so it stays in sync.
export const usePageHeader = ({ title, subtitle, breadcrumb, actions } = {}, deps = []) => {
  const { setPageHeader, clearPageHeader } = usePageHeaderContext();

  useEffect(() => {
    setPageHeader({ title, subtitle, breadcrumb, actions });
    return () => clearPageHeader();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

export default PageHeaderContext;
