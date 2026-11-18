'use client';

import { useCallback, useEffect, useState } from 'react';
import { accountService } from '@/client/services/accountService';

export const useAccount = () => {
  const [statement, setStatement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const reload = useCallback(async () => {
    const nextStatement = await accountService.getStatement();
    setStatement(nextStatement);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        await reload();
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [reload]);

  const pay = async () => {
    setErrorMessage('');
    try {
      return await accountService.startCheckout();
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  return { statement, isLoading, errorMessage, pay };
};
