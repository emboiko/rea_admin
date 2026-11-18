'use client';

import { useState } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { useSession } from '@/client/state/SessionProvider';
import { ErrorAlert, FormStack, PageMain } from '@/components/layout/PageFrame';

export const LoginPage = () => {
  const router = useRouter();
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const user = await signIn({ email, password });
      if (user.role === 'resident') {
        router.push('/account');
        return;
      }
      router.push('/board');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageMain>
      <Typography variant="h4" component="h1">
        Sign in
      </Typography>
      <Typography>
        Board members and homeowners who created a login use this page. Paying from a mailed letter
        does not require a sign-in.
      </Typography>
      <ErrorAlert message={errorMessage} />
      <FormStack onSubmit={handleSubmit}>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="username"
          required
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          Sign in
        </Button>
      </FormStack>
    </PageMain>
  );
};
