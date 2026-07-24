import { validate } from 'class-validator';
import type { Request, Response } from 'express';
import { getRepository } from 'typeorm';

import type {
  AdminUserListResponse,
  AdminUserSummary,
} from '../../../shared/types/AdminUser';
import { Like } from '../entity/Like';
import { User } from '../entity/User';
// import { Story } from '../entity/Story';

class UserController {
  static listAdminUsers = async (req: Request, res: Response) => {
    const requestedPage = Number(req.query.page);
    const requestedPageSize = Number(req.query.pageSize);
    const page =
      Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const pageSize =
      Number.isInteger(requestedPageSize) && requestedPageSize > 0
        ? Math.min(requestedPageSize, 50)
        : 20;
    const search =
      typeof req.query.search === 'string'
        ? req.query.search.trim().slice(0, 100)
        : '';
    const role = req.query.role;
    const status = req.query.status;

    const userRepository = getRepository(User);
    const query = userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.username',
        'user.email',
        'user.isBanned',
        'user.isSuperuser',
      ])
      .orderBy('user.id', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (search) {
      const escapedSearch = search.replace(/[\\%_]/g, '\\$&');
      query.andWhere(
        "(user.username ILIKE :search ESCAPE '\\' OR user.email ILIKE :search ESCAPE '\\')",
        {
          search: `%${escapedSearch}%`,
        },
      );
    }
    if (role === 'admin') {
      query.andWhere('user.isSuperuser = :isSuperuser', {
        isSuperuser: true,
      });
    } else if (role === 'user') {
      query.andWhere('user.isSuperuser = :isSuperuser', {
        isSuperuser: false,
      });
    }
    if (status === 'banned') {
      query.andWhere('user.isBanned = :isBanned', { isBanned: true });
    } else if (status === 'active') {
      query.andWhere('user.isBanned = :isBanned', { isBanned: false });
    }

    const [users, total] = await query.getManyAndCount();
    const response: AdminUserListResponse = {
      items: users.map(
        (user): AdminUserSummary => ({
          id: user.id,
          username: user.username,
          email: user.email || null,
          isBanned: user.isBanned,
          isSuperuser: user.isSuperuser,
        }),
      ),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };

    res.json(response);
  };

  static setBanStatus = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { isBanned } = req.body as { isBanned?: unknown };

    if (!Number.isInteger(id) || id <= 0 || typeof isBanned !== 'boolean') {
      res.status(400).json({ message: 'Invalid user or ban status' });
      return;
    }

    const userRepository = getRepository(User);
    const user = await userRepository.findOne(id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    user.isBanned = isBanned;
    await userRepository.save(user);

    const response: AdminUserSummary = {
      id: user.id,
      username: user.username,
      email: user.email || null,
      isBanned: user.isBanned,
      isSuperuser: user.isSuperuser,
    };
    res.json(response);
  };

  static getOneById = async (req: Request, res: Response) => {
    //Get the ID from the url
    const id = Number(req.params.id);

    //Get the user from database
    const userRepository = getRepository(User);
    try {
      await userRepository.findOneOrFail(id, {
        select: ['uid', 'username', 'isSuperuser'], //We dont want to send the password on response
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
          userId,
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
    // @ts-ignore
    const isSuperuser = req.user && req.user.isSuperuser;
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

    const isOwner = user && userId === user.id;
    if (!isSuperuser && !isOwner) {
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
    const response: AdminUserSummary = {
      id: user.id,
      username: user.username,
      email: user.email || null,
      isBanned: user.isBanned,
      isSuperuser: user.isSuperuser,
    };
    res.status(200).json(response);
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
