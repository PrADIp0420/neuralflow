const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const signToken = id => jwt.sign({ id }, process.env.JWT_SECRET || 'neuralflow_secret_2024', { expiresIn: '7d' });

router.post('/signup', [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { name, email, password } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already registered' });
    const count = await User.countDocuments();
    const user = await User.create({ name, email, password, globalRole: count === 0 ? 'admin' : 'user' });
    res.status(201).json({ token: signToken(user._id), user: { id: user._id, name: user.name, email: user.email, globalRole: user.globalRole } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) return res.status(401).json({ message: 'Invalid credentials' });
    res.json({ token: signToken(user._id), user: { id: user._id, name: user.name, email: user.email, globalRole: user.globalRole } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/me', protect, (req, res) => {
  res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email, globalRole: req.user.globalRole } });
});

module.exports = router;
