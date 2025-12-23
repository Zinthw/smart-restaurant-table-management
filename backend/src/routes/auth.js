const express = require('express');
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Register new staff (Roles: staff, waiter, kitchen)
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    // Validate Input
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password, and role are required' });
    }

    // CHẶN ĐĂNG KÝ ADMIN
    if (role === 'admin') {
      return res.status(403).json({ 
        message: 'Registration for admin role is restricted. Please use the pre-configured admin account.' 
      });
    }

    // Validate Role 
    const validRoles = ['staff', 'waiter', 'kitchen'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        message: 'Invalid role. Allowed roles: staff, waiter, kitchen' 
      });
    }

    // Check Email exists
    const userCheck = await db.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (userCheck.rowCount > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash Password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert DB
    const newUser = await db.query(
      `INSERT INTO users (email, password_hash, role, status) 
       VALUES ($1, $2, $3, 'active') 
       RETURNING id, email, role, status, created_at`,
      [email, passwordHash, role]
    );

    res.status(201).json({ 
      message: 'User created successfully', 
      user: newUser.rows[0] 
    });

  } catch (err) {
    next(err);
  }
});

// Login (For all roles including Admin)
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    // Check password
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check status
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Account is inactive' });
    }

    // Generate Token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;