const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

const getRole = async (userId, projectId) => {
  const project = await Project.findById(projectId);
  if (!project) return null;
  return project.members.find(m => m.user.toString() === userId.toString())?.role || null;
};

router.get('/', protect, async (req, res) => {
  try {
    const { project, assignee, status, priority, overdue } = req.query;
    const filter = {};
    if (project) {
      const role = await getRole(req.user._id, project);
      if (!role && req.user.globalRole !== 'admin') return res.status(403).json({ message: 'Not a member' });
      filter.project = project;
    } else {
      const projects = await Project.find({ 'members.user': req.user._id }).select('_id');
      filter.project = { $in: projects.map(p => p._id) };
    }
    if (assignee) filter.assignee = assignee;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (overdue === 'true') { filter.dueDate = { $lt: new Date() }; filter.status = { $ne: 'done' }; }
    const tasks = await Task.find(filter)
      .populate('assignee', 'name email avatar').populate('createdBy', 'name email')
      .populate('project', 'name color').sort('-createdAt');
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', protect, [body('title').trim().notEmpty(), body('project').notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const role = await getRole(req.user._id, req.body.project);
    if (!role && req.user.globalRole !== 'admin') return res.status(403).json({ message: 'Not a member' });
    const { title, description, project, assignee, status, priority, dueDate, tags } = req.body;
    const task = await Task.create({ title, description, project, assignee, status, priority, dueDate, tags, createdBy: req.user._id });
    await task.populate('assignee', 'name email avatar');
    await task.populate('createdBy', 'name email');
    await task.populate('project', 'name color');
    res.status(201).json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email avatar').populate('createdBy', 'name email')
      .populate('project', 'name color members').populate('comments.user', 'name email avatar');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const role = await getRole(req.user._id, task.project._id);
    if (!role && req.user.globalRole !== 'admin') return res.status(403).json({ message: 'Access denied' });
    res.json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const role = await getRole(req.user._id, task.project);
    if (!role && req.user.globalRole !== 'admin') return res.status(403).json({ message: 'Access denied' });
    ['title','description','assignee','status','priority','dueDate','tags'].forEach(f => { if (req.body[f] !== undefined) task[f] = req.body[f]; });
    await task.save();
    await task.populate('assignee', 'name email avatar');
    await task.populate('createdBy', 'name email');
    await task.populate('project', 'name color');
    res.json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const role = await getRole(req.user._id, task.project);
    if (!role && req.user.globalRole !== 'admin') return res.status(403).json({ message: 'Access denied' });
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    if (role !== 'admin' && !isCreator && req.user.globalRole !== 'admin') return res.status(403).json({ message: 'Only creator or admin can delete' });
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/:id/comments', protect, [body('text').trim().notEmpty()], async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    task.comments.push({ user: req.user._id, text: req.body.text });
    await task.save();
    await task.populate('comments.user', 'name email avatar');
    res.json(task.comments[task.comments.length - 1]);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/dashboard/stats', protect, async (req, res) => {
  try {
    const projects = await Project.find({ 'members.user': req.user._id }).select('_id');
    const ids = projects.map(p => p._id);
    const [statusStats, priorityStats, overdueCount, myTasks] = await Promise.all([
      Task.aggregate([{ $match: { project: { $in: ids } } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Task.aggregate([{ $match: { project: { $in: ids } } }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Task.countDocuments({ project: { $in: ids }, dueDate: { $lt: new Date() }, status: { $ne: 'done' } }),
      Task.find({ project: { $in: ids }, assignee: req.user._id, status: { $ne: 'done' } }).populate('project', 'name color').sort('dueDate').limit(5)
    ]);
    res.json({ statusStats, priorityStats, overdueCount, myTasks, projectCount: projects.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
