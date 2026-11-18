import mongoose from 'mongoose';
import { hash } from 'bcryptjs';

const email = process.env.BOOTSTRAP_PRESIDENT_EMAIL || '';
const password = process.env.BOOTSTRAP_PRESIDENT_PASSWORD || '';
const mongoUri = process.env.MONGODB_URI || '';

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

if (!mongoUri) {
  fail('Set MONGODB_URI before creating the president.');
}

if (!email.trim() || !email.includes('@')) {
  fail('Set BOOTSTRAP_PRESIDENT_EMAIL to the first president email.');
}

if (password.length < 10) {
  fail('Set BOOTSTRAP_PRESIDENT_PASSWORD to at least 10 characters.');
}

const normalizedEmail = email.trim().toLowerCase();
const passwordHash = await hash(password, 10);

await mongoose.connect(mongoUri);
const users = mongoose.connection.collection('users');
const existing = await users.findOne({ role: 'president', status: 'active' });

if (existing) {
  console.log('A president already exists. Nothing was changed.');
  await mongoose.disconnect();
  process.exit(0);
}

await users.insertOne({
  email: normalizedEmail,
  passwordHash,
  role: 'president',
  officeLabel: '',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
  __v: 0,
});

console.log(`President created for ${normalizedEmail}. Remove the bootstrap password from the environment.`);
await mongoose.disconnect();
