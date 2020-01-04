import { Request, Response, NextFunction } from "express";
import { getRepository, ObjectType, EntitySchema } from "typeorm";

// import { User } from "../entity/User";
import { ModelWithUser } from '../interfaces';

export const isOwner = <T extends ModelWithUser>(model: EntitySchema<T>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    //Get the user ID from previous midleware
    const userId = res.locals.jwtPayload.userId;
    const id: string = req.params.id;

    const repository = getRepository<T>(model);
    let obj: T | undefined;
    try {
      obj = await repository.findOneOrFail(id);
    } catch (id) {
      res.status(401).send();
    }

    //Check if array of authorized roles includes the user's role
    if (obj && obj.user && obj.user.id === userId) {
      next();
    } else { res.status(401).send(); }
  };
};
