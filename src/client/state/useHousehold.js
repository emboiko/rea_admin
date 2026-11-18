'use client';

import { useCallback, useEffect, useState } from 'react';
import { householdService } from '@/client/services/householdService';

export const useHousehold = (householdId) => {
  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');

  const reload = useCallback(async () => {
    const nextDetail = await householdService.getDetail(householdId);
    setDetail(nextDetail);
  }, [householdId]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setErrorMessage('');
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

  const runAction = async (action, successNotice) => {
    setErrorMessage('');
    setNotice('');
    try {
      await action();
      await reload();
      if (successNotice) {
        setNotice(successNotice);
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  return {
    detail,
    isLoading,
    errorMessage,
    notice,
    saveDetails: (body) => runAction(() => householdService.updateDetails(householdId, body), 'House details saved.'),
    addAssessment: (body) => runAction(() => householdService.addAssessment(householdId, body), 'Dues record added.'),
    voidAssessment: (assessmentId) => runAction(() => householdService.voidAssessment(householdId, assessmentId), 'Dues voided.'),
    recordPayment: (body) => runAction(() => householdService.recordPayment(householdId, body), 'Payment recorded.'),
    rotateLink: () => runAction(() => householdService.rotateLink(householdId), 'Pay link replaced. Old letters no longer work.'),
    archiveLogin: () => runAction(() => householdService.archiveLogin(householdId), 'Login archived.'),
    resendEmail: () => runAction(() => householdService.resendEmail(householdId), 'Email sent.'),
  };
};
