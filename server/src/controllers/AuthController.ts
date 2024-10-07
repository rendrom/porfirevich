import { validate } from 'class-validator';
import { getRepository } from 'typeorm';

import { User } from '../entity/User';
import { generateAccessToken } from '../token';

import type { Request, Response } from 'express';

class AuthController {
  static login = async (req: Request, res: Response) => {
    //Check if username and password are set
    const { username, password } = req.body;
    if (!(username && password)) {
      res.status(400).send();
    }

    //Get user from database
    const userRepository = getRepository(User);
    let user: User | undefined;
    try {
      user = await userRepository.findOneOrFail({ where: { username } });
    } catch (error) {
      res.status(401).send();
    }

    if (user) {
      //Check if encrypted password match
      if (!user.checkIfUnencryptedPasswordIsValid(password)) {
        res.status(401).send();
        return;
      }

      //Sing JWT, valid for 1 hour
      const token = generateAccessToken(user.uid);

      //Send the jwt in the response
      res.send(token);
    } else {
      res.status(401).send();
      return;
    }
  };

  static changePassword = async (req: Request, res: Response) => {
    //Get ID from JWT
    const id = res.locals.jwtPayload.userId;

    //Get parameters from the body
    const { oldPassword, newPassword } = req.body;
    if (!(oldPassword && newPassword)) {
      res.status(400).send();
    }

    //Get user from the database
    const userRepository = getRepository(User);
    let user: User | undefined;
    try {
      user = await userRepository.findOneOrFail(id);
    } catch (id) {
      res.status(401).send();
    }
    if (user) {
      //Check if old password matchs
      if (!user.checkIfUnencryptedPasswordIsValid(oldPassword)) {
        res.status(401).send();
        return;
      }

      //Validate de model (password lenght)
      user.password = newPassword;
      const errors = await validate(user);
      if (errors.length > 0) {
        res.status(400).send(errors);
        return;
      }
      //Hash the new password and save
      user.hashPassword();
      userRepository.save(user);

      res.status(204).send();
    } else {
      res.status(401).send();
    }
  };
}
export default AuthController;
