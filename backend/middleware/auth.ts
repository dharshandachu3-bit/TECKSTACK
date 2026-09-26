import { Request, Response, NextFunction } from 'express';
import { db } from '../../database/store.js';
import { DEMO_USER_ID } from '../../database/seedData.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: any;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    // 1. Check local session store
    const session = db.getSession(token);
    if (session) {
      req.userId = session.userId;
      req.user = db.getUserById(session.userId);
      return next();
    }

    // 2. Check if token is a Firebase ID Token (JWT: header.payload.signature)
    if (token.startsWith('ey') && token.includes('.')) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf-8');
          const payload = JSON.parse(payloadJson);
          if (payload && (payload.sub || payload.user_id)) {
            const uid = payload.sub || payload.user_id;
            let existingUser = db.getUserById(uid);
            if (!existingUser) {
              existingUser = db.createUser({
                id: uid,
                email: payload.email || `${uid}@firebase.user`,
                name: payload.name || payload.email?.split('@')[0] || 'Firebase User',
                role: payload.email === 'dharshandachu3@gmail.com' ? 'ADMIN' : 'OPERATOR',
                avatarUrl: payload.picture,
                passwordHash: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            }
            req.userId = uid;
            req.user = existingUser;
            return next();
          }
        }
      } catch (err) {
        console.warn('Failed parsing Firebase ID Token in authMiddleware:', err);
      }
    }
  }

  // Fallback to active demo user for seamless prototyping
  req.userId = DEMO_USER_ID;
  req.user = db.getUserById(DEMO_USER_ID);
  return next();
}
