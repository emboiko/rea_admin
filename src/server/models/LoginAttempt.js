import mongoose from 'mongoose';

const loginAttemptSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    failureCount: { type: Number, required: true, default: 0 },
    windowStartedAt: { type: Date, required: true },
    lockedUntil: { type: Date, default: null },
  },
  { timestamps: true },
);

export const LoginAttempt =
  mongoose.models.LoginAttempt || mongoose.model('LoginAttempt', loginAttemptSchema);
