const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_key_for_dev_only';

// Register
router.post('/register', (req, res) => {
  const { username, password, fullName } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  db.run('INSERT INTO users (username, password, full_name) VALUES (?, ?, ?)', [username, hash, fullName || null], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      return res.status(500).json({ error: 'Database error' });
    }
    const token = jwt.sign({ userId: this.lastID }, JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ 
      message: 'User registered successfully', 
      token,
      userId: this.lastID, 
      username, 
      fullName: fullName || 'User' 
    });
  });
});

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, userId: user.id, username: user.username, fullName: user.full_name });
  });
});

module.exports = router;
module.exports.JWT_SECRET = JWT_SECRET;
