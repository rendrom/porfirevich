import { Request, Response, NextFunction } from 'express';
import { getRepository } from 'typeorm';
import { User } from '../entity/User';

export const isSelf = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    //Get the user ID from previous midleware
    const userId = res.locals.jwtPayload.userId;
    const id: string = req.params.id;

    const repository = getRepository(User);
    let obj: User | undefined;
    try {
      obj = await repository.findOneOrFail(id);
    } catch (id) {
      res.status(401).send();
    }

    //Check if array of authorized roles includes the user's role
    if (obj && obj.uid === userId) {
      next();
    } else {
      res.status(401).send();
    }
  };
};
