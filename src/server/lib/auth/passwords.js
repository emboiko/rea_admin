import { compare, hash } from 'bcryptjs';

const BCRYPT_COST = 10;
const DUMMY_PASSWORD_HASH = '$2b$10$nfDCzBxSKu8fq4QAOEPAWuqoPCjTBD/7mMB3FZH339V29GeoV26Di';

export const hashPassword = async (password) => {
  return hash(password, BCRYPT_COST);
};

export const passwordsMatch = async (password, passwordHash) => {
  const hashToCompare = passwordHash || DUMMY_PASSWORD_HASH;
  const matches = await compare(password, hashToCompare);
  if (!passwordHash) {
    return false;
  }
  return matches;
};
