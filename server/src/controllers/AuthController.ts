import { randomUUID } from 'node:crypto';

import { validate } from 'class-validator';
import type { Request, Response } from 'express';

import dataSource from '../data-source';
import { User } from '../entity/User';
import { generateAccessToken, setRefreshTokenCookie } from '../token';

class AuthController {
  static login = async (req: Request, res: Response) => {
    //Check if username and password are set
    const { username, password } = req.body;
    if (
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      !username ||
      !password
    ) {
      res.status(400).send();
      return;
    }

    //Get user from database
    const userRepository = dataSource.getRepository(User);
    let user: User;
    try {
      user = await userRepository.findOneOrFail({ where: { username } });
    } catch {
      res.status(401).send();
      return;
    }

    //Check if encrypted password match
    if (!user.checkIfUnencryptedPasswordIsValid(password)) {
      res.status(401).send();
      return;
    }

    if (!user.uid) {
      user.uid = randomUUID();
      await userRepository.save(user);
    }
    // Sign a short-lived access token; the refresh token stays in HttpOnly cookie.
    const token = generateAccessToken(user.uid);
    setRefreshTokenCookie(res, user.uid);

    //Send the jwt in the response
    res.send(token);
  };

  static changePassword = async (req: Request, res: Response) => {
    //Get ID from JWT
    const id = (req.user as User | undefined)?.id;
    if (!id) {
      res.status(401).send();
      return;
    }

    //Get parameters from the body
    const { oldPassword, newPassword } = req.body;
    if (
      typeof oldPassword !== 'string' ||
      typeof newPassword !== 'string' ||
      !oldPassword ||
      !newPassword
    ) {
      res.status(400).send();
      return;
    }

    //Get user from the database
    const userRepository = dataSource.getRepository(User);
    let user: User;
    try {
      user = await userRepository.findOneByOrFail({ id });
    } catch {
      res.status(401).send();
      return;
    }
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
    await userRepository.save(user);

    res.status(204).send();
  };
}
export default AuthController;
