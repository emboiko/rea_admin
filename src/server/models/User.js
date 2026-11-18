import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['resident', 'board', 'president'],
      required: true,
    },
    officeLabel: { type: String, default: '', trim: true },
    householdId: { type: mongoose.Schema.Types.ObjectId, ref: 'Household' },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
  },
  { timestamps: true },
);

userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } },
);

userSchema.index(
  { role: 1 },
  {
    unique: true,
    partialFilterExpression: { role: 'president', status: 'active' },
  },
);

userSchema.index(
  { householdId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: 'active',
      householdId: { $type: 'objectId' },
    },
  },
);

export const User = mongoose.models.User || mongoose.model('User', userSchema);
