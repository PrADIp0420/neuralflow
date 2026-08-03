const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 50 },
  email: { type: String, required: true, unique: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, 'Invalid email'] },
  password: { type: String, required: true, minlength: 6, select: false },
  avatar: { type: String, default: '' },
  globalRole: { type: String, enum: ['admin', 'user'], default: 'user' }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.methods.matchPassword = async function(p) { return await bcrypt.compare(p, this.password); };
module.exports = mongoose.model('User', userSchema);
