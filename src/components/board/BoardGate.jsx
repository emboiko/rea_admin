'use client';

import Typography from '@mui/material/Typography';
import NextLink from 'next/link';
import { useSession } from '@/client/state/SessionProvider';
import { LoadingState, PageMain } from '@/components/layout/PageFrame';

export const BoardGate = ({ children, presidentOnly }) => {
  const { user, isReady } = useSession();
  if (!isReady) {
    return (
      <PageMain>
        <LoadingState label="Checking access" />
      </PageMain>
    );
  }
  const allowedBoard = user && (user.role === 'board' || user.role === 'president');
  const allowed = presidentOnly ? user && user.role === 'president' : allowedBoard;
  if (!allowed) {
    return (
      <PageMain>
        <Typography>
          This page is for the board. <NextLink href="/login">Sign in</NextLink> with a board account.
        </Typography>
      </PageMain>
    );
  }
  return children;
};
