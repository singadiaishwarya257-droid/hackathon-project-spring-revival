const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

/**
 * GET /api/users
 */
router.get('/', authorize('admin', 'officer'), async (req, res) => {
  const { page = 1, limit = 20, role, search } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = {};
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const users = await User.find(query)
    .select('-password_hash')
    .sort({ created_at: -1 })
    .skip(offset)
    .limit(parseInt(limit))
    .lean();

  const total = await User.countDocuments(query);

  res.json({
    users,
    total,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

/**
 * GET /api/users/:id
 */
router.get('/:id', async (req, res) => {
  if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const user = await User.findById(req.params.id).select('-password_hash').lean();
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({ user });
});

/**
 * PUT /api/users/:id
 */
router.put('/:id', [
  body('name').optional().trim().notEmpty(),
  body('phone').optional().matches(/^\+?[\d\s-]{7,15}$/),
  body('district').optional().trim(),
  body('state').optional().trim(),
], async (req, res) => {
  if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, phone, district, state, avatar_url } = req.body;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        name: name || undefined,
        phone: phone || undefined,
        district: district || undefined,
        state: state || undefined,
        avatar_url: avatar_url || undefined,
        updated_at: new Date()
      }
    },
    { new: true }
  ).select('-password_hash').lean();

  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({ user });
});

/**
 * PATCH /api/users/:id/password
 */
router.patch('/:id/password', [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
], async (req, res) => {
  if (req.user.id !== req.params.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.params.id);

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) return res.status(400).json({ error: 'Current password incorrect' });

  const hash = await bcrypt.hash(newPassword, 12);
  await User.updateOne({ _id: req.params.id }, { password_hash: hash, updated_at: new Date() });

  res.json({ message: 'Password updated successfully' });
});

/**
 * PATCH /api/users/:id/status  (Admin only)
 */
router.patch('/:id/status', authorize('admin'), async (req, res) => {
  const { is_active } = req.body;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: { is_active, updated_at: new Date() } },
    { new: true }
  ).select('_id name is_active').lean();

  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({ user });
});

/**
 * DELETE /api/users/:id  (Admin only)
 */
router.delete('/:id', authorize('admin'), async (req, res) => {
  if (req.user.id === req.params.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({ message: 'User deleted', user: { id: user._id, name: user.name } });
});

module.exports = router;
