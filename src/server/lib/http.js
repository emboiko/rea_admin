import { MoneyError } from '@/shared/money';
import { connectDb } from '@/server/services/db';

export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

export const readJsonBody = async (request) => {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, 'Request body must be JSON.');
  }
};

export const handleRoute = (handler) => {
  return async (request, context) => {
    try {
      await connectDb();
      return await handler(request, context);
    } catch (error) {
      if (error instanceof HttpError) {
        return Response.json({ error: error.message }, { status: error.statusCode });
      }
      if (error instanceof MoneyError) {
        return Response.json({ error: error.message }, { status: 400 });
      }
      if (error instanceof Error && error.message.includes('is not configured')) {
        return Response.json({ error: error.message }, { status: 500 });
      }
      if (error && error.code === 11000) {
        return Response.json({ error: 'That record already exists.' }, { status: 409 });
      }
      console.error(error);
      return Response.json({ error: 'Something went wrong.' }, { status: 500 });
    }
  };
};
