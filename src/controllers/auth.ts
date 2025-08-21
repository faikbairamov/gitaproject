import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '1h',
  });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, companyName } = req.body;

    if (!email || !password || !companyName) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'email, password and companyName are required',
      });
      return;
    }

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ error: 'ValidationError', message: 'Email already used' });
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    const user: IUser = await User.create({ email, password: hashed, companyName });
    const token = generateToken(user._id.toString());

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
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'ValidationError', message: 'email and password are required' });
      return;
    }

    const user: IUser | null = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ error: 'ValidationError', message: 'Invalid credentials' });
      return;
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      res.status(400).json({ error: 'ValidationError', message: 'Invalid credentials' });
      return;
    }

    const token = generateToken(user._id.toString());

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
  } catch (err: any) {
    res.status(500).json({ error: 'ServerError', message: err.message });
  }
};
