import type { NextFunction, Request, Response } from 'express';

import { User } from '../entity/User';

export const isSuperuser = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as User | undefined;

    if (!user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    if (!user.isSuperuser) {
      res.status(403).json({ message: 'Administrator access required' });
      return;
    }

    next();
  };
};
