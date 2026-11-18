'use client';

import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

export const PageMain = styled('main')(({ theme }) => ({
  width: '100%',
  maxWidth: 1040,
  margin: '0 auto',
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
}));

export const FormStack = styled('form')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  maxWidth: 520,
}));

export const ButtonRow = styled('div')(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1.5),
  alignItems: 'center',
}));

export const FormHint = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(1, 1.25),
  borderLeft: `3px solid ${theme.vars.palette.primary.main}`,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.vars.palette.action.hover,
  color: theme.vars.palette.text.secondary,
}));

export const ErrorAlert = ({ message }) => {
  if (!message) {
    return null;
  }
  return <Alert severity="error">{message}</Alert>;
};

export const NoticeAlert = ({ message }) => {
  if (!message) {
    return null;
  }
  return <Alert severity="success">{message}</Alert>;
};

export const LoadingState = ({ label }) => {
  return (
    <ButtonRow>
      <CircularProgress size={22} />
      <Typography>{label}</Typography>
    </ButtonRow>
  );
};
