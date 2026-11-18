import mongoose from 'mongoose';

const feeScheduleSchema = new mongoose.Schema(
  {
    year: { type: Number, required: true, unique: true },
    amountCents: { type: Number, required: true },
    lockedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const FeeSchedule =
  mongoose.models.FeeSchedule || mongoose.model('FeeSchedule', feeScheduleSchema);
