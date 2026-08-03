const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { attachProject, requireProjectAdmin } = require('../middleware/projectRole');

router.get('/', protect, async (req, res) => {
  try {
    const projects = await Project.find({ 'members.user': req.user._id })
      .populate('owner', 'name email').populate('members.user', 'name email avatar').sort('-createdAt');
    res.json(projects);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', protect, [body('name').trim().notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { name, description, color, dueDate } = req.body;
    const project = await Project.create({ name, description, color, dueDate, owner: req.user._id, members: [{ user: req.user._id, role: 'admin' }] });
    await project.populate('owner', 'name email');
    await project.populate('members.user', 'name email avatar');
    res.status(201).json(project);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:projectId', protect, attachProject, async (req, res) => {
  const taskStats = await Task.aggregate([{ $match: { project: req.project._id } }, { $group: { _id: '$status', count: { $sum: 1 } } }]);
  res.json({ ...req.project.toJSON(), taskStats, userRole: req.projectRole });
});

router.put('/:projectId', protect, attachProject, requireProjectAdmin, async (req, res) => {
  try {
    const { name, description, color, status, dueDate } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (color !== undefined) updates.color = color;
    if (status !== undefined) updates.status = status;
    if (dueDate !== undefined) updates.dueDate = dueDate;
    const project = await Project.findByIdAndUpdate(req.project._id, updates, { new: true, runValidators: true })
      .populate('owner', 'name email').populate('members.user', 'name email avatar');
    res.json(project);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:projectId', protect, attachProject, requireProjectAdmin, async (req, res) => {
  try {
    await Task.deleteMany({ project: req.project._id });
    await Project.findByIdAndDelete(req.project._id);
    res.json({ message: 'Project deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/:projectId/members', protect, attachProject, requireProjectAdmin, [body('email').isEmail()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { email, role = 'member' } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found. They must sign up first.' });
    if (req.project.members.find(m => m.user._id.toString() === user._id.toString())) return res.status(400).json({ message: 'Already a member' });
    req.project.members.push({ user: user._id, role });
    await req.project.save();
    await req.project.populate('members.user', 'name email avatar');
    res.json(req.project.members);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:projectId/members/:userId', protect, attachProject, requireProjectAdmin, async (req, res) => {
  try {
    if (req.params.userId === req.project.owner.toString()) return res.status(400).json({ message: 'Cannot remove owner' });
    req.project.members = req.project.members.filter(m => m.user._id.toString() !== req.params.userId);
    await req.project.save();
    res.json({ message: 'Member removed' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/:projectId/members/:userId/role', protect, attachProject, requireProjectAdmin, [body('role').isIn(['admin', 'member'])], async (req, res) => {
  try {
    const member = req.project.members.find(m => m.user._id.toString() === req.params.userId);
    if (!member) return res.status(404).json({ message: 'Member not found' });
    member.role = req.body.role;
    await req.project.save();
    res.json({ message: 'Role updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
