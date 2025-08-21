import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: { id: string };
}

const auth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    res.status(401).json({ error: 'Unauthorized', message: 'Missing token' });
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'Unauthorized', message: 'Missing token' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: string };
    req.user = { id: decoded.id };
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
  }
};

export default auth;
