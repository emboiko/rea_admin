import { LoginAttempt } from '@/server/models/LoginAttempt';
import { HttpError } from '@/server/lib/http';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

export const assertLoginNotLocked = async (email) => {
  const attempt = await LoginAttempt.findOne({ email });
  if (!attempt || !attempt.lockedUntil) {
    return;
  }
  if (attempt.lockedUntil.getTime() > Date.now()) {
    throw new HttpError(429, 'Too many sign-in attempts. Try again later.');
  }
};

export const recordLoginFailure = async (email) => {
  const now = new Date();
  let attempt = await LoginAttempt.findOne({ email });
  if (!attempt) {
    attempt = new LoginAttempt({
      email,
      failureCount: 0,
      windowStartedAt: now,
    });
  }
  const windowAge = now.getTime() - attempt.windowStartedAt.getTime();
  if (windowAge > WINDOW_MS) {
    attempt.failureCount = 0;
    attempt.windowStartedAt = now;
    attempt.lockedUntil = null;
  }
  attempt.failureCount += 1;
  if (attempt.failureCount >= MAX_FAILURES) {
    attempt.lockedUntil = new Date(now.getTime() + WINDOW_MS);
  }
  await attempt.save();
};

export const clearLoginFailures = async (email) => {
  await LoginAttempt.deleteOne({ email });
};
