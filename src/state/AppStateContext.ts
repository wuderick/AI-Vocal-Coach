import { createContext, useContext } from 'react';
import { AppState, AppStateActions } from './types';

export interface AppStateContextValue {
  state: AppState;
  actions: AppStateActions;
}

export const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

export function useAppStateContext(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppStateContext must be used within AppStateProvider');
  }
  return context;
}
