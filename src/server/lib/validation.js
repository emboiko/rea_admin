import { HttpError } from '@/server/lib/http';
import { MoneyError, parseDollarsToCents } from '@/shared/money';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeEmail = (value) => {
  if (typeof value !== 'string') {
    throw new HttpError(400, 'Enter a valid email address.');
  }
  const email = value.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email) || email.length > 200) {
    throw new HttpError(400, 'Enter a valid email address.');
  }
  return email;
};

export const optionalEmail = (value) => {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  return normalizeEmail(trimmed);
};

export const requireYear = (value) => {
  const year = Number(value);
  if (!Number.isInteger(year) || year < 1990 || year > 2100) {
    throw new HttpError(400, 'Enter a valid year.');
  }
  return year;
};

export const currentCalendarYear = () => {
  return new Date().getFullYear();
};

export const requireCurrentYear = (value) => {
  const year = requireYear(value);
  if (year !== currentCalendarYear()) {
    throw new HttpError(400, 'Annual dues can only be set for the current year.');
  }
  return year;
};

export const requirePositiveMoney = (value) => {
  if (typeof value !== 'string') {
    throw new HttpError(400, 'Enter an amount like 120.25.');
  }
  let cents = 0;
  try {
    cents = parseDollarsToCents(value);
  } catch (error) {
    if (error instanceof MoneyError) {
      throw new HttpError(400, error.message);
    }
    throw error;
  }
  if (cents <= 0) {
    throw new HttpError(400, 'Amount must be greater than zero.');
  }
  return cents;
};

export const requireText = (value, label, maxLength) => {
  if (typeof value !== 'string') {
    throw new HttpError(400, `Enter a ${label}.`);
  }
  const text = value.trim().replace(/\s+/g, ' ');
  if (!text) {
    throw new HttpError(400, `Enter a ${label}.`);
  }
  if (text.length > maxLength) {
    throw new HttpError(400, `${label} is too long.`);
  }
  return text;
};

export const optionalText = (value, maxLength) => {
  if (typeof value !== 'string') {
    return '';
  }
  const text = value.trim().replace(/\s+/g, ' ');
  if (text.length > maxLength) {
    throw new HttpError(400, 'That value is too long.');
  }
  return text;
};

export const requirePassword = (value) => {
  if (typeof value !== 'string' || value.length < 10 || value.length > 200) {
    throw new HttpError(400, 'Password must be at least 10 characters.');
  }
  return value;
};

export const requireObjectId = (value, label) => {
  if (typeof value !== 'string' || !/^[a-f0-9]{24}$/i.test(value)) {
    throw new HttpError(400, `Choose a valid ${label}.`);
  }
  return value;
};
