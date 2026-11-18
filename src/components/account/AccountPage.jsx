'use client';

import { useState } from 'react';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';
import { useAccount } from '@/client/state/useAccount';
import { useSession } from '@/client/state/SessionProvider';
import { ErrorAlert, LoadingState, PageMain } from '@/components/layout/PageFrame';
import { StatementDetails } from '@/components/pay/StatementDetails';

export const AccountPage = () => {
  const { user, isReady } = useSession();
  const { statement, isLoading, errorMessage, pay } = useAccount();
  const [isPaying, setIsPaying] = useState(false);

  const handlePay = async () => {
    setIsPaying(true);
    const result = await pay();
    setIsPaying(false);
    return result;
  };

  const renderBody = () => {
    if (!isReady || isLoading) {
      return <LoadingState label="Loading your dues" />;
    }
    if (!user) {
      return (
        <Typography>
          <NextLink href="/login">Sign in</NextLink> to see the house linked to your login.
        </Typography>
      );
    }
    if (!statement) {
      return null;
    }
    return <StatementDetails statement={statement} onPay={handlePay} isPaying={isPaying} />;
  };

  return (
    <PageMain>
      <ErrorAlert message={errorMessage} />
      {renderBody()}
    </PageMain>
  );
};
