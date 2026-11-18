import mongoose from 'mongoose';
import '@/server/models/index';

const globalCache = globalThis;

export const connectDb = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured.');
  }
  if (globalCache.reaMongooseConnection) {
    return globalCache.reaMongooseConnection;
  }
  if (!globalCache.reaMongoosePromise) {
    globalCache.reaMongoosePromise = mongoose.connect(process.env.MONGODB_URI);
  }
  try {
    globalCache.reaMongooseConnection = await globalCache.reaMongoosePromise;
  } catch (error) {
    globalCache.reaMongoosePromise = null;
    throw error;
  }
  return globalCache.reaMongooseConnection;
};
