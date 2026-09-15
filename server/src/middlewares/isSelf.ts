import type { NextFunction, Request, Response } from 'express';

import type { User } from '../entity/User';

export const isSelf = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    //Get the user ID from previous midleware
    const user = req.user as User | undefined;
    if (!user) {
      res.status(401).send();
      return;
    }

    //Check if array of authorized roles includes the user's role
    if (user.id === Number(req.params.id)) {
      next();
    } else {
      res.status(403).send();
    }
  };
};
