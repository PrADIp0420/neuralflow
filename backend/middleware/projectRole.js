const Project = require('../models/Project');

exports.attachProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId || req.body.project)
      .populate('members.user', 'name email avatar');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const memberEntry = project.members.find(m => m.user._id.toString() === req.user._id.toString());
    if (!memberEntry && req.user.globalRole !== 'admin') return res.status(403).json({ message: 'Not a project member' });
    req.project = project;
    req.projectRole = memberEntry?.role || (req.user.globalRole === 'admin' ? 'admin' : null);
    next();
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.requireProjectAdmin = (req, res, next) => {
  if (req.projectRole !== 'admin' && req.user.globalRole !== 'admin') return res.status(403).json({ message: 'Project admin required' });
  next();
};
