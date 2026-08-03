const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  joinedAt: { type: Date, default: Date.now }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 500 },
  color: { type: String, default: '#00d4ff' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [memberSchema],
  status: { type: String, enum: ['active', 'on-hold', 'completed', 'archived'], default: 'active' },
  dueDate: Date
}, { timestamps: true });

projectSchema.pre('save', function(next) {
  const has = this.members.find(m => m.user.toString() === this.owner.toString());
  if (!has) this.members.push({ user: this.owner, role: 'admin' });
  next();
});
module.exports = mongoose.model('Project', projectSchema);
