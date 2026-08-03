const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, requireGlobalAdmin } = require('../middleware/auth');

router.get('/', protect, requireGlobalAdmin, async (req, res) => {
  try { res.json(await User.find().select('-password').sort('name')); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/search', protect, async (req, res) => {
  try {
    const q = req.query.q || '';
    if (q.length < 2) return res.json([]);
    const users = await User.find({ $or: [{ name: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }], _id: { $ne: req.user._id } }).select('name email avatar').limit(10);
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/profile', protect, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (avatar !== undefined) updates.avatar = avatar;
    res.json(await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password'));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
