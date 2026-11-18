import mongoose from 'mongoose';

const assessmentSchema = new mongoose.Schema(
  {
    householdId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Household',
      required: true,
    },
    year: { type: Number, required: true },
    kind: { type: String, enum: ['annual'], required: true, default: 'annual' },
    description: { type: String, required: true },
    amountCents: { type: Number, required: true },
    status: {
      type: String,
      enum: ['open', 'paid', 'void'],
      required: true,
      default: 'open',
    },
  },
  { timestamps: true },
);

assessmentSchema.index({ householdId: 1, year: 1, kind: 1 }, { unique: true });

export const Assessment =
  mongoose.models.Assessment || mongoose.model('Assessment', assessmentSchema);
