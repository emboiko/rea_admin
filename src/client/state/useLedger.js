'use client';

import { useCallback, useEffect, useState } from 'react';
import { ledgerService } from '@/client/services/ledgerService';

export const useLedger = () => {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const reload = useCallback(async () => {
    setErrorMessage('');
    const nextRows = await ledgerService.getLedger();
    setRows(nextRows);
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

  const downloadCsv = async () => {
    setErrorMessage('');
    try {
      await ledgerService.downloadCsv();
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  return { rows, isLoading, errorMessage, downloadCsv };
};
