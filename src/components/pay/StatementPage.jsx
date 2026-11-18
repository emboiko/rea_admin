'use client';

import { useState } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';
import { useSession } from '@/client/state/SessionProvider';
import { useStatement } from '@/client/state/useStatement';
import { ErrorAlert, FormStack, LoadingState, NoticeAlert, PageMain } from '@/components/layout/PageFrame';
import { StatementDetails } from '@/components/pay/StatementDetails';

export const StatementPage = ({ payToken }) => {
  const { refreshSession } = useSession();
  const { statement, isLoading, errorMessage, notice, pay, claimAccount, setErrorMessage } = useStatement(payToken);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handlePay = async () => {
    setIsPaying(true);
    const result = await pay();
    setIsPaying(false);
    return result;
  };

  const handleClaim = async (event) => {
    event.preventDefault();
    if (password !== passwordAgain) {
      setErrorMessage('Those passwords do not match.');
      return;
    }
    setIsSaving(true);
    try {
      await claimAccount({ email, password });
      await refreshSession();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const renderAccountOffer = () => {
    if (!statement) {
      return null;
    }
    if (statement.hasActiveLogin) {
      return (
        <Typography>
          This house already has a login. <NextLink href="/login">Sign in</NextLink> to come back without the letter.
        </Typography>
      );
    }
    return (
      <FormStack onSubmit={handleClaim}>
        <Typography variant="h6" component="h2">
          Optional login
        </Typography>
        <Typography>Save an email and password if you want to open this house later without the letter. Paying does not require it.</Typography>
        <TextField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <TextField label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        <TextField label="Password again" type="password" value={passwordAgain} onChange={(event) => setPasswordAgain(event.target.value)} required />
        <Button type="submit" variant="outlined" disabled={isSaving}>
          Create login
        </Button>
      </FormStack>
    );
  };

  const renderBody = () => {
    if (isLoading) {
      return <LoadingState label="Opening the statement" />;
    }
    if (!statement) {
      return null;
    }
    return (
      <>
        <StatementDetails statement={statement} onPay={handlePay} isPaying={isPaying} />
        {renderAccountOffer()}
      </>
    );
  };

  return (
    <PageMain>
      <ErrorAlert message={errorMessage} />
      <NoticeAlert message={notice} />
      {renderBody()}
    </PageMain>
  );
};
