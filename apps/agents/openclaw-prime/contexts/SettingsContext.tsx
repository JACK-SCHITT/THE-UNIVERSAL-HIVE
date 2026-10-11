import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Storage } from '@/constants/storage';
import { EntryFlow } from '@/constants/config';

interface SettingsContextType {
  entryFlow: EntryFlow;
  setEntryFlow: (flow: EntryFlow) => Promise<void>;
  isLoaded: boolean;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [entryFlow, setEntryFlowState] = useState<EntryFlow>('dashboard');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    Storage.getEntryFlow().then(flow => {
      setEntryFlowState(flow);
      setIsLoaded(true);
    });
  }, []);

  const setEntryFlow = async (flow: EntryFlow) => {
    setEntryFlowState(flow);
    await Storage.setEntryFlow(flow);
  };

  return (
    <SettingsContext.Provider value={{ entryFlow, setEntryFlow, isLoaded }}>
      {children}
    </SettingsContext.Provider>
  );
}
