import mongoose from 'mongoose';

const householdSchema = new mongoose.Schema(
  {
    streetAddress: { type: String, required: true, trim: true },
    lotNumber: { type: String, default: '', trim: true },
    occupantName: { type: String, default: '', trim: true },
    billingEmail: { type: String, default: '', trim: true, lowercase: true },
    addressKey: { type: String, required: true },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    payToken: { type: String, required: true },
    payTokenVersion: { type: Number, required: true, default: 1 },
  },
  { timestamps: true },
);

householdSchema.index({ payToken: 1 }, { unique: true });
householdSchema.index({ addressKey: 1 }, { unique: true });

export const Household =
  mongoose.models.Household || mongoose.model('Household', householdSchema);
