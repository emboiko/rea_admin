'use client';

import Typography from '@mui/material/Typography';
import { formatCents } from '@/shared/money';
import { useReceipt } from '@/client/state/useReceipt';
import { ErrorAlert, LoadingState, PageMain } from '@/components/layout/PageFrame';

export const ReceiptPage = ({ receiptSecret }) => {
  const { receipt, isLoading, errorMessage } = useReceipt(receiptSecret);

  const renderReceipt = () => {
    if (isLoading) {
      return <LoadingState label="Checking the payment" />;
    }
    if (!receipt) {
      return null;
    }
    let address = 'your house';
    if (receipt.household) {
      address = receipt.household.mailingAddress;
    }
    if (receipt.status === 'pending') {
      return <Typography>The card payment for {address} is still being confirmed. This page will update.</Typography>;
    }
    if (receipt.status === 'failed') {
      return (
        <Typography>
          The payment for {address} was not applied. {receipt.failureReason}
        </Typography>
      );
    }
    return (
      <>
        <Typography variant="h4" component="h1">
          Payment received
        </Typography>
        <Typography>
          {formatCents(receipt.amountCents)} was recorded for {address}.
        </Typography>
      </>
    );
  };

  return (
    <PageMain>
      <ErrorAlert message={errorMessage} />
      {renderReceipt()}
    </PageMain>
  );
};
