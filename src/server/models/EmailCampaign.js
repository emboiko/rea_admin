import mongoose from 'mongoose';

const emailCampaignSchema = new mongoose.Schema(
  {
    year: { type: Number, required: true, unique: true },
    sentAt: { type: Date, required: true },
    sentByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sentCount: { type: Number, required: true, default: 0 },
    skippedCount: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

export const EmailCampaign =
  mongoose.models.EmailCampaign || mongoose.model('EmailCampaign', emailCampaignSchema);
