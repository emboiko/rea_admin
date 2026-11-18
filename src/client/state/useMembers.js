'use client';

import { useCallback, useEffect, useState } from 'react';
import { memberService } from '@/client/services/memberService';

export const useMembers = () => {
  const [members, setMembers] = useState([]);
  const [archivedMembers, setArchivedMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');

  const reload = useCallback(async () => {
    const roster = await memberService.list();
    setMembers(roster.members);
    setArchivedMembers(roster.archivedMembers);
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

  const run = async (action, successNotice) => {
    setErrorMessage('');
    setNotice('');
    try {
      await action();
      await reload();
      setNotice(successNotice);
      return true;
    } catch (error) {
      setErrorMessage(error.message);
      return false;
    }
  };

  return {
    members,
    archivedMembers,
    isLoading,
    errorMessage,
    notice,
    promote: (userId) => run(() => memberService.promote(userId), 'Promoted to the board.'),
    demote: (userId) => run(() => memberService.demote(userId), 'Removed from the board.'),
    transfer: (userId, confirmation) => run(() => memberService.transfer(userId, confirmation), 'Presidency transferred. Sign in again if this was your account.'),
    archive: (userId) => run(() => memberService.archive(userId), 'Login archived.'),
    unarchive: (userId) => run(() => memberService.unarchive(userId), 'Login restored.'),
    setOfficeLabel: (userId, officeLabel) => run(() => memberService.setOfficeLabel(userId, officeLabel), 'Office label saved.'),
  };
};
