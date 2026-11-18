import mongoose from 'mongoose';

const allocationSchema = new mongoose.Schema(
  {
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
      required: true,
    },
    amountCents: { type: Number, required: true },
  },
  { _id: false },
);

const paymentSchema = new mongoose.Schema(
  {
    householdId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Household',
      required: true,
    },
    amountCents: { type: Number, required: true },
    method: {
      type: String,
      enum: ['stripe', 'check', 'cash', 'other'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed'],
      required: true,
    },
    allocations: { type: [allocationSchema], default: [] },
    stripeCheckoutSessionId: { type: String },
    stripePaymentIntentId: { type: String },
    stripeEventId: { type: String },
    receiptSecret: { type: String },
    checkNumber: { type: String, default: '' },
    failureReason: { type: String, default: '' },
    recordedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    paidAt: { type: Date },
  },
  { timestamps: true },
);

paymentSchema.index({ householdId: 1, paidAt: -1 });
paymentSchema.index({ stripeEventId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ receiptSecret: 1 }, { unique: true, sparse: true });
paymentSchema.index({ stripeCheckoutSessionId: 1 }, { unique: true, sparse: true });

export const Payment =
  mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
