import { getRepository } from 'typeorm';

import type { NextFunction, Request, Response } from 'express';
import type { ObjectType } from 'typeorm';

import type { ModelWithUser } from '../interfaces';

export const isOwner = <T extends ModelWithUser>(model: ObjectType<T>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    //Get the user ID from previous midleware
    const userId = res.locals.jwtPayload.userId;
    const id: string = req.params.id;

    const repository = getRepository<T>(model);
    let obj: T | undefined;
    try {
      obj = await repository.findOneOrFail(id);
    } catch {
      res.status(401).send();
    }

    //Check if array of authorized roles includes the user's role
    if (obj && obj.user && obj.user.uid === userId) {
      next();
    } else {
      res.status(401).send();
    }
  };
};
