'use client';

import { useState } from 'react';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { duesLine } from '@/shared/duesLabel';
import { formatCents } from '@/shared/money';
import { ButtonRow } from '@/components/layout/PageFrame';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

const CheckoutPanel = styled('div')(({ theme }) => ({
  width: '100%',
  maxWidth: 560,
  marginTop: theme.spacing(1),
}));

const formatWhen = (iso) => {
  if (!iso) {
    return 'Date not recorded';
  }
  return new Date(iso).toLocaleDateString();
};

export const StatementDetails = ({ statement, onPay, isPaying }) => {
  const [clientSecret, setClientSecret] = useState('');

  const handlePay = async () => {
    const result = await onPay();
    if (result && result.clientSecret) {
      setClientSecret(result.clientSecret);
    }
  };

  const renderFees = () => {
    if (statement.openFees.length === 0) {
      return <Typography>Nothing is due right now.</Typography>;
    }
    return (
      <ul>
        {statement.openFees.map((fee) => (
          <li key={fee.id}>
            {duesLine(fee.year, fee.description)}: {formatCents(fee.remainingCents)} remaining
          </li>
        ))}
      </ul>
    );
  };

  const renderPay = () => {
    if (statement.openFees.length === 0) {
      return null;
    }
    if (!statement.stripeConfigured || !stripePromise) {
      return (
        <Typography>
          Card payments are not configured yet. A check can still be recorded by the board.
        </Typography>
      );
    }
    if (clientSecret) {
      return null;
    }
    return (
      <Button variant="contained" onClick={handlePay} disabled={isPaying}>
        Pay {formatCents(statement.totalOwedCents)}
      </Button>
    );
  };

  const renderCheckout = () => {
    if (!clientSecret || !stripePromise) {
      return null;
    }
    return (
      <CheckoutPanel>
        <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </CheckoutPanel>
    );
  };

  const renderPayments = () => {
    if (statement.payments.length === 0) {
      return <Typography>No payments recorded yet.</Typography>;
    }
    return (
      <ul>
        {statement.payments.map((payment) => (
          <li key={payment.id}>
            {formatWhen(payment.paidAt)} — {formatCents(payment.amountCents)} by {payment.method}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <>
      <Typography variant="h4" component="h1">
        {statement.household.mailingAddress}
      </Typography>
      <Typography>{statement.household.occupantName}</Typography>
      <Typography variant="h5">Total due {formatCents(statement.totalOwedCents)}</Typography>
      <Typography>
        Every open fee is listed below. The payment covers that full total, oldest year first.
      </Typography>
      {renderFees()}
      <ButtonRow>{renderPay()}</ButtonRow>
      {renderCheckout()}
      <Typography variant="h6" component="h2">
        Payment history
      </Typography>
      {renderPayments()}
    </>
  );
};
