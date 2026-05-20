const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const supabase = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const { data: user, error } = await supabase
      .from('users')
      .insert({ email: email.toLowerCase(), password_hash, name: name.trim() })
      .select('id, email, name, created_at')
      .single();

    if (error) throw error;

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, password_hash, created_at')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, created_at')
      .eq('id', req.user.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/auth/profile  — update display name
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({ name: name.trim() })
      .eq('id', req.user.userId)
      .select('id, email, name, created_at')
      .single();

    if (error) throw error;
    res.json({ user });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/auth/password  — change password
router.put('/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    // Fetch current hash
    const { data: user, error } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', req.user.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const password_hash = await bcrypt.hash(newPassword, 12);
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash })
      .eq('id', req.user.userId);

    if (updateError) throw updateError;
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/auth/account  — permanently delete account and all links
router.delete('/account', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Delete all URLs (clicks cascade via FK if set, or delete manually)
    await supabase.from('clicks').delete().in(
      'url_id',
      (await supabase.from('urls').select('id').eq('user_id', userId)).data?.map(u => u.id) || []
    );
    await supabase.from('urls').delete().eq('user_id', userId);
    await supabase.from('users').delete().eq('id', userId);

    res.json({ message: 'Account deleted' });
  } catch (err) {
    console.error('Account delete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
