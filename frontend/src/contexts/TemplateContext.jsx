import React, { createContext, useContext } from 'react';
import { useTemplates } from '../hooks/useTemplates';

const TemplateContext = createContext();

export const TemplateProvider = ({ children }) => {
  const templateHook = useTemplates();
  
  return (
    <TemplateContext.Provider value={templateHook}>
      {children}
    </TemplateContext.Provider>
  );
};

export const useTemplateContext = () => {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useTemplateContext must be used within a TemplateProvider');
  }
  return context;
};