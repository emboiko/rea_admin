'use client';

import { useEffect, useState } from 'react';
import { billService } from '@/client/services/billService';

export const useBills = () => {
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const nextBills = await billService.getBills();
        setBills(nextBills);
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return { bills, isLoading, errorMessage };
};
