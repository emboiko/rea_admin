import { createTransport } from 'nodemailer';
import { HttpError } from '@/server/lib/http';

let transporter;

const getTransporter = () => {
  if (!process.env.SMTP_URL || !process.env.MAIL_FROM) {
    throw new HttpError(503, 'Email is not configured.');
  }
  if (!transporter) {
    transporter = createTransport(process.env.SMTP_URL);
  }
  return transporter;
};

export const emailAdapter = {
  isConfigured: () => {
    return Boolean(process.env.SMTP_URL && process.env.MAIL_FROM);
  },
  send: async ({ to, subject, text }) => {
    const transport = getTransporter();
    await transport.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject,
      text,
    });
  },
};
