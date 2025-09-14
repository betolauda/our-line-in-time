import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { FamilyRole } from '@our-line-in-time/shared';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: FamilyRole;
    is_active: boolean;
    generation_level: number;
  };
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (err: any, user: any) => {
    if (err) {
      return res.status(500).json({ error: 'Authentication error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.user = user;
    next();
  })(req, res, next);
};

export const requireRole = (allowedRoles: FamilyRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

export const requireAdmin = requireRole(['admin']);
export const requireContributor = requireRole(['admin', 'contributor']);