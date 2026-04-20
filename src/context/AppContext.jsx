import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [uploadId, setUploadId] = useState(localStorage.getItem('scanify_upload_id'));
  const [reportData, setReportData] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('scanify_auth') === 'true');

  const login = () => {
    setIsAuthenticated(true);
    localStorage.setItem('scanify_auth', 'true');
  };
  
  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('scanify_auth');
    localStorage.removeItem('scanify_upload_id');
  };

  const handleSetUploadId = (id) => {
    setUploadId(id);
    if (id) localStorage.setItem('scanify_upload_id', id);
    else localStorage.removeItem('scanify_upload_id');
  };

  const resetState = () => {
    handleSetUploadId(null);
    setReportData(null);
  };

  return (
    <AppContext.Provider value={{
      uploadId, setUploadId: handleSetUploadId,
      reportData, setReportData,
      isAuthenticated, login, logout,
      resetState
    }}>
      {children}
    </AppContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => useContext(AppContext);
