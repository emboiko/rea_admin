import { User } from '@/server/models/User';
import { HttpError } from '@/server/lib/http';
import { readSessionPayload } from '@/server/lib/auth/session';

export const toPublicUser = (user) => {
  return {
    id: String(user._id),
    email: user.email,
    role: user.role,
    officeLabel: user.officeLabel || '',
    householdId: user.householdId ? String(user.householdId) : null,
    status: user.status,
  };
};

export const readCurrentUser = async () => {
  const payload = await readSessionPayload();
  if (!payload || !payload.userId) {
    return null;
  }
  return User.findOne({ _id: payload.userId, status: 'active' });
};

export const requireUser = async () => {
  const user = await readCurrentUser();
  if (!user) {
    throw new HttpError(401, 'Sign in required.');
  }
  return user;
};

export const requireLedgerAccess = async () => {
  const user = await requireUser();
  if (user.role !== 'board' && user.role !== 'president') {
    throw new HttpError(403, 'Board access required.');
  }
  return user;
};

export const requirePresident = async () => {
  const user = await requireLedgerAccess();
  if (user.role !== 'president') {
    throw new HttpError(403, 'Only the president can do that.');
  }
  return user;
};
