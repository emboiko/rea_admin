'use client';

import { useState } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { householdService } from '@/client/services/householdService';
import { BoardGate } from '@/components/board/BoardGate';
import { ErrorAlert, FormStack, PageMain } from '@/components/layout/PageFrame';

export const NewHouseholdPage = () => {
  const router = useRouter();
  const [streetAddress, setStreetAddress] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [occupantName, setOccupantName] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const household = await householdService.create({
        streetAddress,
        lotNumber,
        occupantName,
        billingEmail,
      });
      router.push(`/board/households/${household.id}`);
    } catch (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
    }
  };

  return (
    <BoardGate>
      <PageMain>
        <Typography variant="h4" component="h1">
          Add a house
        </Typography>
        <Typography>
          Use this for paper records. Street address and lot are a guess at the fields the association keeps. Past dues are added on the next screen.
        </Typography>
        <ErrorAlert message={errorMessage} />
        <FormStack onSubmit={handleSubmit}>
          <TextField label="Street address" value={streetAddress} onChange={(event) => setStreetAddress(event.target.value)} required />
          <TextField label="Lot" value={lotNumber} onChange={(event) => setLotNumber(event.target.value)} />
          <TextField label="Occupant name" value={occupantName} onChange={(event) => setOccupantName(event.target.value)} />
          <TextField label="Billing email" type="email" value={billingEmail} onChange={(event) => setBillingEmail(event.target.value)} />
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            Save house
          </Button>
        </FormStack>
      </PageMain>
    </BoardGate>
  );
};
