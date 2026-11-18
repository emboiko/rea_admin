'use client';

import { useEffect, useState } from 'react';
import { statementService } from '@/client/services/statementService';

export const useReceipt = (receiptSecret) => {
  const [receipt, setReceipt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let stopped = false;
    let attempts = 0;

    const load = async () => {
      try {
        const nextReceipt = await statementService.getReceipt(receiptSecret);
        if (stopped) {
          return;
        }
        setReceipt(nextReceipt);
        setIsLoading(false);
        if (nextReceipt.status === 'pending' && attempts < 15) {
          attempts += 1;
          window.setTimeout(() => {
            load();
          }, 2000);
        }
      } catch (error) {
        if (stopped) {
          return;
        }
        const isNotConfirmedYet = error && error.statusCode === 404;
        if (isNotConfirmedYet && attempts < 15) {
          attempts += 1;
          window.setTimeout(() => {
            load();
          }, 2000);
          return;
        }
        if (isNotConfirmedYet) {
          setErrorMessage('The payment has not been confirmed yet.');
        } else {
          setErrorMessage(error.message);
        }
        setIsLoading(false);
      }
    };

    load();
    return () => {
      stopped = true;
    };
  }, [receiptSecret]);

  return { receipt, isLoading, errorMessage };
};
