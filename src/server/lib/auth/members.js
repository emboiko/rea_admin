import { User } from '@/server/models/User';
import { HttpError } from '@/server/lib/http';
import { requireLedgerAccess, requirePresident, toPublicUser } from '@/server/lib/auth/guards';
import { optionalText, requireObjectId } from '@/server/lib/validation';
import { sessionOption, withTransaction } from '@/server/lib/withTransaction';

const requireActiveTarget = async (userId) => {
  const target = await User.findOne({ _id: userId, status: 'active' });
  if (!target) {
    throw new HttpError(404, 'That account is not active.');
  }
  return target;
};

export const listMembers = async () => {
  await requireLedgerAccess();
  const users = await User.find({ status: 'active' }).sort({ role: 1, email: 1 });
  return users.map((user) => toPublicUser(user));
};

export const listArchivedMembers = async () => {
  await requireLedgerAccess();
  const users = await User.find({ status: 'archived' }).sort({ role: 1, email: 1 });
  return users.map((user) => toPublicUser(user));
};

export const promoteMember = async ({ userId }) => {
  const actor = await requirePresident();
  const targetId = requireObjectId(userId, 'account');
  if (String(actor._id) === targetId) {
    throw new HttpError(400, 'Choose a different account.');
  }
  const target = await requireActiveTarget(targetId);
  if (target.role !== 'resident') {
    throw new HttpError(409, 'That account is already on the board.');
  }
  target.role = 'board';
  await target.save();
  return toPublicUser(target);
};

export const demoteMember = async ({ userId }) => {
  await requirePresident();
  const targetId = requireObjectId(userId, 'account');
  const target = await requireActiveTarget(targetId);
  if (target.role !== 'board') {
    throw new HttpError(409, 'Only a board member can be demoted. Transfer the presidency first.');
  }
  target.role = 'resident';
  target.officeLabel = '';
  await target.save();
  return toPublicUser(target);
};

export const transferPresidency = async ({ userId, confirmation }) => {
  const actor = await requirePresident();
  if (confirmation !== 'TRANSFER') {
    throw new HttpError(400, 'Type TRANSFER to confirm.');
  }
  const targetId = requireObjectId(userId, 'account');
  if (String(actor._id) === targetId) {
    throw new HttpError(400, 'Choose a different account.');
  }
  const target = await requireActiveTarget(targetId);
  await withTransaction(async (session) => {
    actor.role = 'board';
    await actor.save(sessionOption(session));
    target.role = 'president';
    target.officeLabel = '';
    await target.save(sessionOption(session));
  });
  return toPublicUser(target);
};

export const archiveMember = async ({ userId }) => {
  await requireLedgerAccess();
  const targetId = requireObjectId(userId, 'account');
  const target = await requireActiveTarget(targetId);
  if (target.role === 'president') {
    throw new HttpError(409, 'Transfer the presidency before archiving this login.');
  }
  target.status = 'archived';
  await target.save();
  return toPublicUser(target);
};

const requireArchivedTarget = async (userId) => {
  const target = await User.findOne({ _id: userId, status: 'archived' });
  if (!target) {
    throw new HttpError(404, 'That account is not archived.');
  }
  return target;
};

const throwIfActiveLoginTaken = (error) => {
  if (!error || error.code !== 11000) {
    return;
  }
  const keyPattern = error.keyPattern || {};
  if (keyPattern.email) {
    throw new HttpError(409, 'That email is already in use by an active login.');
  }
  if (keyPattern.householdId) {
    throw new HttpError(409, 'That house already has an active login.');
  }
  throw new HttpError(409, 'That login cannot be restored.');
};

export const unarchiveMember = async ({ userId }) => {
  await requireLedgerAccess();
  const targetId = requireObjectId(userId, 'account');
  const target = await requireArchivedTarget(targetId);
  if (target.role === 'president') {
    throw new HttpError(409, 'An archived president login cannot be restored.');
  }
  const emailTaken = await User.findOne({ email: target.email, status: 'active' });
  if (emailTaken) {
    throw new HttpError(409, 'That email is already in use by an active login.');
  }
  if (target.householdId) {
    const houseTaken = await User.findOne({
      householdId: target.householdId,
      status: 'active',
    });
    if (houseTaken) {
      throw new HttpError(409, 'That house already has an active login.');
    }
  }
  if (target.role !== 'board') {
    target.officeLabel = '';
  }
  target.status = 'active';
  try {
    await target.save();
  } catch (error) {
    throwIfActiveLoginTaken(error);
    throw error;
  }
  return toPublicUser(target);
};

export const setOfficeLabel = async ({ userId, officeLabel }) => {
  await requirePresident();
  const targetId = requireObjectId(userId, 'account');
  const target = await requireActiveTarget(targetId);
  if (target.role !== 'board') {
    throw new HttpError(409, 'Office labels are only for board members.');
  }
  target.officeLabel = optionalText(officeLabel, 40);
  await target.save();
  return toPublicUser(target);
};
