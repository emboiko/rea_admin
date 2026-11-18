import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { HttpError } from '@/server/lib/http';

const SESSION_COOKIE = 'rea_session';
const STATEMENT_COOKIE = 'rea_statement';
const ISSUER = 'rea-admin';
const SESSION_AUDIENCE = 'rea-session';
const STATEMENT_AUDIENCE = 'rea-statement';

const getKey = () => {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new HttpError(500, 'SESSION_SECRET is not configured.');
  }
  return new TextEncoder().encode(secret);
};

const signPayload = async (payload, audience, expiration) => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(ISSUER)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(getKey());
};

const readPayload = async (token, audience) => {
  if (!token) {
    return null;
  }
  try {
    const result = await jwtVerify(token, getKey(), {
      issuer: ISSUER,
      audience,
    });
    return result.payload;
  } catch {
    return null;
  }
};

const cookieBase = () => {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
};

export const readSessionPayload = async () => {
  const cookieStore = await cookies();
  return readPayload(cookieStore.get(SESSION_COOKIE)?.value, SESSION_AUDIENCE);
};

export const readStatementPayload = async () => {
  const cookieStore = await cookies();
  return readPayload(cookieStore.get(STATEMENT_COOKIE)?.value, STATEMENT_AUDIENCE);
};

export const writeSessionCookie = async (user) => {
  const token = await signPayload(
    {
      purpose: 'session',
      userId: String(user._id),
      role: user.role,
      householdId: user.householdId ? String(user.householdId) : '',
    },
    SESSION_AUDIENCE,
    '14d',
  );
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    ...cookieBase(),
    maxAge: 60 * 60 * 24 * 14,
  });
};

export const clearSessionCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
};

export const writeStatementCookie = async (household) => {
  const token = await signPayload(
    {
      purpose: 'statement',
      householdId: String(household._id),
      payTokenVersion: household.payTokenVersion,
    },
    STATEMENT_AUDIENCE,
    '12h',
  );
  const cookieStore = await cookies();
  cookieStore.set(STATEMENT_COOKIE, token, cookieBase());
};
