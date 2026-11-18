'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { sessionService } from '@/client/services/sessionService';

const SessionContext = createContext(null);

export const SessionProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);

  const refreshSession = useCallback(async () => {
    try {
      const nextUser = await sessionService.getCurrentUser();
      setUser(nextUser);
      return nextUser;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await refreshSession();
      setIsReady(true);
    };
    load();
  }, [refreshSession]);

  const signIn = async ({ email, password }) => {
    const nextUser = await sessionService.login({ email, password });
    setUser(nextUser);
    return nextUser;
  };

  const signOut = async () => {
    await sessionService.logout();
    setUser(null);
  };

  return (
    <SessionContext.Provider value={{ user, isReady, refreshSession, signIn, signOut }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSession must be used within SessionProvider.');
  }
  return value;
};
