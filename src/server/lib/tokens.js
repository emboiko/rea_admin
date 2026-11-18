import { randomBytes } from 'node:crypto';

const PAY_ALPHABET = '0123456789abcdefghjkmnpqrstvwxyz';

const CONFUSABLE_CHARACTERS = {
  o: '0',
  i: '1',
  l: '1',
  u: 'v',
};

export const createSecretToken = () => {
  return randomBytes(32).toString('base64url');
};

export const createPayToken = () => {
  const bytes = randomBytes(12);
  let compact = '';
  for (const byte of bytes) {
    compact += PAY_ALPHABET[byte % PAY_ALPHABET.length];
  }
  return `${compact.slice(0, 4)}-${compact.slice(4, 8)}-${compact.slice(8, 12)}`;
};

export const normalizePayToken = (value) => {
  if (typeof value !== 'string') {
    return '';
  }
  const compact = value.trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (compact.length !== 12) {
    return '';
  }
  let normalized = '';
  for (const character of compact) {
    const mappedCharacter = CONFUSABLE_CHARACTERS[character] || character;
    if (!PAY_ALPHABET.includes(mappedCharacter)) {
      return '';
    }
    normalized += mappedCharacter;
  }
  return `${normalized.slice(0, 4)}-${normalized.slice(4, 8)}-${normalized.slice(8, 12)}`;
};

export const payTokenLookupValues = (value) => {
  if (typeof value !== 'string') {
    return [];
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 128) {
    return [];
  }
  const lookupValues = [];
  if (trimmed.length >= 20) {
    lookupValues.push(trimmed);
  }
  const normalized = normalizePayToken(trimmed);
  if (normalized && !lookupValues.includes(normalized)) {
    lookupValues.push(normalized);
  }
  return lookupValues;
};
