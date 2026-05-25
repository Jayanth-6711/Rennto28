// src/context/TenantContext.js
import React, { createContext, useState } from "react";

export const TenantContext = createContext();

export const TenantProvider = ({ children }) => {
  const [tenantPhone, settenantPhone] = useState("");

  return (
    <TenantContext.Provider value={{ tenantPhone, settenantPhone }}>
      {children}
    </TenantContext.Provider>
  );
};

