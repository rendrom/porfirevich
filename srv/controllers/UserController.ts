import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { validate } from 'class-validator';

import { User } from '../entity/User';
import { Like } from '../entity/Like';
// import { Story } from '../entity/Story';

class UserController {
  static listAll = async (req: Request, res: Response) => {
    //Get users from database
    const userRepository = getRepository(User);
    const users = await userRepository.find({
      select: ['uid', 'username', 'isSuperuser'] //We dont want to send the passwords on response
    });

    //Send the users object
    res.send(users);
  };

  static getOneById = async (req: Request, res: Response) => {
    //Get the ID from the url
    const id = Number(req.params.id);

    //Get the user from database
    const userRepository = getRepository(User);
    try {
      await userRepository.findOneOrFail(id, {
        select: ['uid', 'username', 'isSuperuser'] //We dont want to send the password on response
      });
    } catch (error) {
      res.status(404).send('User not found');
    }
  };

  static likes = async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user && req.user.id;

    //Get the user from database
    const likeRepository = getRepository(Like);
    try {
      const likes = await likeRepository
        .createQueryBuilder()
        .where({
          userId
        })
        .getMany();
      res.status(200).send(likes);
    } catch (error) {
      res.status(404).send('User not found');
    }
  };

  static newUser = async (req: Request, res: Response) => {
    //Get parameters from the body
    const { username, password } = req.body;
    const user = new User();
    user.username = username;
    user.password = password;

    //Validade if the parameters are ok
    const errors = await validate(user);
    if (errors.length > 0) {
      res.status(400).send(errors);
      return;
    }

    //Hash the password, to securely store on DB
    user.hashPassword();

    //Try to save. If fails, the username is already in use
    const userRepository = getRepository(User);
    try {
      await userRepository.save(user);
    } catch (e) {
      res.status(409).send('username already in use');
      return;
    }

    //If all ok, send 201 response
    res.status(201).send('User created');
  };

  static editUser = async (req: Request, res: Response) => {
    //Get the ID from the url
    const id = req.params.id;

    // @ts-ignore
    const userId = req.user && req.user.id;
    //Get values from the body
    const { username, isBanned } = req.body;

    //Try to find user on database
    const userRepository = getRepository(User);
    let user;
    try {
      user = await userRepository.findOneOrFail(id);
    } catch (error) {
      //If not found, send a 404 response
      res.status(404).send('User not found');
      return;
    }

    const isSuperuser = user && user.isSuperuser;
    const isOwner = user && userId === user.id;
    if (!user && !isSuperuser && !isOwner) {
      res.status(403).send('Not permitted');
      return;
    }

    if (isSuperuser && isBanned !== user.isBanned) {
      user.isBanned = isBanned;

      // if (isBanned) {
      //   await getRepository(Story)
      //     .createQueryBuilder('story')
      //     .where({
      //       userId: user.id
      //     })
      //     .update({ isDeleted: isBanned });
      // }
    }

    //Validate the new values on model
    user.username = username;
    const errors = await validate(user);
    if (errors.length > 0) {
      res.status(400).send(errors);
      return;
    }

    //Try to safe, if fails, that means username already in use
    try {
      await userRepository.save(user);
    } catch (e) {
      res.status(409).send('username already in use');
      return;
    }
    //After all send a 204 (no content, but accepted) response
    res.status(204).send();
  };

  static deleteUser = async (req: Request, res: Response) => {
    //Get the ID from the url
    const id = req.params.id;

    const userRepository = getRepository(User);
    let user: User;
    try {
      user = await userRepository.findOneOrFail(id);
    } catch (error) {
      res.status(404).send('User not found');
      return;
    }
    userRepository.delete(id);

    //After all send a 204 (no content, but accepted) response
    res.status(204).send();
  };
}

export default UserController;
