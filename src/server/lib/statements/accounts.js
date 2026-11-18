import { Household } from '@/server/models/Household';
import { User } from '@/server/models/User';
import { HttpError } from '@/server/lib/http';
import { hashPassword } from '@/server/lib/auth/passwords';
import { writeSessionCookie } from '@/server/lib/auth/session';
import { requireUser, toPublicUser } from '@/server/lib/auth/guards';
import { normalizeEmail, requirePassword } from '@/server/lib/validation';
import { readStatementHousehold, buildStatement } from '@/server/lib/statements/statements';

export const claimHouseholdAccount = async (input) => {
  const household = await readStatementHousehold();
  const email = normalizeEmail(input.email);
  const password = requirePassword(input.password);
  const existingLogin = await User.findOne({
    householdId: household._id,
    status: 'active',
  });
  if (existingLogin) {
    throw new HttpError(409, 'This house already has a login.');
  }
  const emailTaken = await User.findOne({ email, status: 'active' });
  if (emailTaken) {
    throw new HttpError(409, 'That email is already in use.');
  }
  const user = await User.create({
    email,
    passwordHash: await hashPassword(password),
    role: 'resident',
    officeLabel: '',
    householdId: household._id,
    status: 'active',
  });
  if (!household.billingEmail) {
    household.billingEmail = email;
    await household.save();
  }
  await writeSessionCookie(user);
  return toPublicUser(user);
};

export const accountStatement = async () => {
  const user = await requireUser();
  if (!user.householdId) {
    throw new HttpError(404, 'No house is linked to this login.');
  }
  const household = await Household.findOne({
    _id: user.householdId,
    status: 'active',
  });
  if (!household) {
    throw new HttpError(404, 'No house is linked to this login.');
  }
  return buildStatement(household);
};
