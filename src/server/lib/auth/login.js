import { User } from '@/server/models/User';
import { HttpError } from '@/server/lib/http';
import { passwordsMatch } from '@/server/lib/auth/passwords';
import {
  assertLoginNotLocked,
  clearLoginFailures,
  recordLoginFailure,
} from '@/server/lib/auth/loginAttempts';
import { clearSessionCookie, writeSessionCookie } from '@/server/lib/auth/session';
import { readCurrentUser, toPublicUser } from '@/server/lib/auth/guards';
import { normalizeEmail } from '@/server/lib/validation';

export const login = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);
  const passwordText = typeof password === 'string' ? password : '';
  await assertLoginNotLocked(normalizedEmail);
  const user = await User.findOne({ email: normalizedEmail, status: 'active' });
  let passwordHash = '';
  if (user) {
    passwordHash = user.passwordHash;
  }
  const matches = await passwordsMatch(passwordText, passwordHash);
  if (!user || !matches) {
    await recordLoginFailure(normalizedEmail);
    throw new HttpError(401, 'Email or password is incorrect.');
  }
  await clearLoginFailures(normalizedEmail);
  await writeSessionCookie(user);
  return toPublicUser(user);
};

export const logout = async () => {
  await clearSessionCookie();
};

export const currentSession = async () => {
  const user = await readCurrentUser();
  if (!user) {
    return null;
  }
  return toPublicUser(user);
};
