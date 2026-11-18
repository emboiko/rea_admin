'use client';

import { useEffect, useState } from 'react';
import { annualService } from '@/client/services/annualService';

export const useAnnual = () => {
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');

  const loadStatus = async () => {
    const nextStatus = await annualService.getStatus();
    setStatus(nextStatus);
    return nextStatus;
  };

  useEffect(() => {
    let isCurrent = true;
    const load = async () => {
      setErrorMessage('');
      setNotice('');
      setIsLoading(true);
      setStatus(null);
      try {
        const nextStatus = await annualService.getStatus();
        if (!isCurrent) {
          return;
        }
        setStatus(nextStatus);
      } catch (error) {
        if (!isCurrent) {
          return;
        }
        setErrorMessage(error.message);
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    };
    load();
    return () => {
      isCurrent = false;
    };
  }, []);

  const saveAmount = async (amount) => {
    setErrorMessage('');
    setNotice('');
    if (!status) {
      setErrorMessage('The current year is still loading.');
      return;
    }
    const requestedYear = status.year;
    try {
      await annualService.setAmount({ year: requestedYear, amount });
      const nextStatus = await loadStatus();
      if (nextStatus.year !== requestedYear) {
        return;
      }
      setNotice('Dues amount saved.');
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const generate = async (confirmationYear) => {
    setErrorMessage('');
    setNotice('');
    if (!status) {
      setErrorMessage('The current year is still loading.');
      return;
    }
    const requestedYear = status.year;
    try {
      const result = await annualService.generate({
        year: requestedYear,
        confirmationYear,
      });
      const nextStatus = await loadStatus();
      if (nextStatus.year !== requestedYear) {
        return;
      }
      let noticeText = `Generated dues for ${result.householdCount} houses.`;
      if (result.skippedHouseholdCount === 1) {
        noticeText = `${noticeText} 1 house already had dues for this year and was left unchanged.`;
      } else if (result.skippedHouseholdCount > 1) {
        noticeText = `${noticeText} ${result.skippedHouseholdCount} houses already had dues for this year and were left unchanged.`;
      }
      setNotice(noticeText);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const sendEmail = async () => {
    setErrorMessage('');
    setNotice('');
    if (!status) {
      setErrorMessage('The current year is still loading.');
      return;
    }
    const requestedYear = status.year;
    try {
      const result = await annualService.sendEmail(requestedYear);
      const nextStatus = await loadStatus();
      if (nextStatus.year !== requestedYear) {
        return;
      }
      setNotice(`Sent ${result.sentCount} emails. ${result.skippedHouseholds.length} houses were skipped.`);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  return { status, isLoading, errorMessage, notice, saveAmount, generate, sendEmail };
};
