const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '1h',
  });
};

exports.register = async (req, res) => {
  try {
    const { email, password, companyName } = req.body;
    if (!email || !password || !companyName) {
      return res.status(400).json({ error: 'ValidationError', message: 'email, password and companyName are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'ValidationError', message: 'Email already used' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed, companyName });
    const token = generateToken(user._id);
    res.status(201).json({
      message: 'Registered',
      token,
      user: {
        email: user.email,
        companyName: user.companyName,
        creditsUsed: user.creditsUsed,
        creditsLimit: user.creditsLimit,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'ValidationError', message: 'email and password are required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'ValidationError', message: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: 'ValidationError', message: 'Invalid credentials' });
    }
    const token = generateToken(user._id);
    res.json({
      message: 'LoggedIn',
      token,
      user: {
        email: user.email,
        companyName: user.companyName,
        creditsUsed: user.creditsUsed,
        creditsLimit: user.creditsLimit,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
};
