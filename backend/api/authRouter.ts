import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../../database/store.js';
import { hashPassword } from '../../database/seedData.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const hashed = hashPassword(password);
  if (hashed !== user.passwordHash) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = `tok_${crypto.randomBytes(32).toString('hex')}`;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const session = db.createSession({
    id: `sess_${Date.now()}`,
    userId: user.id,
    token,
    expiresAt,
    userAgent: req.headers['user-agent'] as string,
    createdAt: new Date().toISOString(),
  });

  const { passwordHash, ...safeUser } = user;
  return res.json({
    token: session.token,
    expiresAt: session.expiresAt,
    user: safeUser,
  });
});

// POST /api/auth/register
authRouter.post('/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const newUser = db.createUser({
    id: `usr_${Date.now()}`,
    email,
    passwordHash: hashPassword(password),
    name,
    role: 'OPERATOR',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const token = `tok_${crypto.randomBytes(32).toString('hex')}`;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const session = db.createSession({
    id: `sess_${Date.now()}`,
    userId: newUser.id,
    token,
    expiresAt,
    userAgent: req.headers['user-agent'] as string,
    createdAt: new Date().toISOString(),
  });

  const { passwordHash, ...safeUser } = newUser;
  return res.status(201).json({
    token: session.token,
    expiresAt: session.expiresAt,
    user: safeUser,
  });
});

// GET /api/auth/me
authRouter.get('/me', authMiddleware, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { passwordHash, ...safeUser } = req.user;
  return res.json({ user: safeUser });
});

// POST /api/auth/logout
authRouter.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    db.deleteSession(token);
  }
  return res.json({ success: true });
});
