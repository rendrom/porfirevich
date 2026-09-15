import { validate } from 'class-validator';
import type { NextFunction, Request, Response } from 'express';
import type { SelectQueryBuilder } from 'typeorm';
import { MoreThan } from 'typeorm';

import type { StoriesResponse } from '../../../shared/types/Story';
import { isScheme } from '../../../shared/utils/isScheme';
import dataSource from '../data-source';
import { Like } from '../entity/Like';
import { Story } from '../entity/Story';
import { User } from '../entity/User';
import { Violation } from '../entity/Violation';
import { postcard } from '../postcard/postcard';

const select: (keyof Story)[] = [
  'id',
  'content',
  'createdAt',
  'viewsCount',
  'postcard',
  'userId',
  'likesCount',
  'isPublic',
  'violationsCount',
];

function validContent(content: unknown): content is string {
  if (typeof content !== 'string') return false;
  try {
    const parsed: unknown = JSON.parse(content);
    return isScheme(parsed) && parsed.some(([text]) => text.trim().length > 0);
  } catch {
    return false;
  }
}

const updateQuery = (
  queryBuilder: SelectQueryBuilder<Story | Violation>,
  opt: {
    afterDate?: string;
    isPublic?: boolean;
    isDeleted?: boolean;
  } = {},
) => {
  const where: Record<string, any> = {};

  if (opt.afterDate) {
    where.createdAt = MoreThan(new Date(Number(opt.afterDate)).toISOString());
  }
  where.isPublic = true;
  where.isDeleted = false;
  where.isBanned = false;
  if (opt.isPublic !== undefined && !opt.isPublic) {
    delete where.isPublic;
  }
  queryBuilder
    .where(where)
    .addSelect(select.map((x) => `s.${x}`))
    .leftJoin('s.user', 'u')
    .andWhere('u.isBanned = :isBanned', { isBanned: false })
    .addSelect(['u.isBanned']);
  return queryBuilder;
};

export default class StoryController {
  static all = async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const userId = req.user && req.user.id;
    const offset = Number(req.query.offset || 0);
    const queryParam = req.query.query as string;
    const tagsParam = req.query.tags as string;

    const filter = req.query.filter;
    const my = filter === 'my';

    const afterDate = req.query.afterDate as string;
    let limit = Number(req.query.limit as string);
    limit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 20) : 20;
    const orderBy = req.query.orderBy as string;
    if ((my || filter === 'favorite') && !userId) {
      res.status(401).send();
      return;
    }
    const allowedOrder = [
      'createdAt',
      'likesCount',
      'viewsCount',
      'violationsCount',
      'RAND()',
    ];
    if (
      !Number.isInteger(offset) ||
      offset < 0 ||
      (orderBy !== undefined &&
        (typeof orderBy !== 'string' ||
          !orderBy.split(',').every((x) => allowedOrder.includes(x)))) ||
      (tagsParam !== undefined && typeof tagsParam !== 'string') ||
      (queryParam !== undefined && typeof queryParam !== 'string') ||
      (afterDate !== undefined &&
        (!Number.isFinite(Number(afterDate)) ||
          !Number.isFinite(new Date(Number(afterDate)).getTime())))
    ) {
      res.status(400).json({ message: 'Invalid story filters' });
      return;
    }
    // Get stories from database
    try {
      const repository = dataSource.getRepository(Story);
      const list = repository.createQueryBuilder('s');
      updateQuery(list, {
        afterDate,
        isPublic: !my,
      });
      list.limit(limit);
      if (offset) {
        list.offset(offset);
      }
      if (orderBy) {
        orderBy.split(',').forEach((x) => {
          if (x === 'RAND()') {
            list.addOrderBy('random()');
          } else {
            list.addOrderBy(`s.${x}`, 'DESC');
          }
        });
      } else {
        list.addOrderBy('s.createdAt', 'DESC');
      }
      if (userId !== undefined) {
        if (filter === 'my') {
          list.andWhere('s.userId = :userId', { userId });
        } else if (filter === 'favorite') {
          list
            .leftJoin('s.likes', 'l')
            .addSelect(['l.userId'])
            .andWhere('l.userId = :userId', { userId });
        }
      }
      if (queryParam) {
        list.andWhere('s.content like :query', {
          query: `%${queryParam}%`,
        });
      }
      if (tagsParam) {
        tagsParam.split(',').forEach((x, index) => {
          list.andWhere(`s.content LIKE :tag${index}`, {
            [`tag${index}`]: `%${x}%`,
          });
        });
      }

      const results = await list.getMany();

      if (req.accepts('json')) {
        const resp: StoriesResponse = {
          object: 'list',
          data: results,
        };
        res.json(resp);
      }
    } catch (err) {
      next(err);
    }
  };

  static one = async (req: Request, res: Response) => {
    // @ts-ignore
    const isSuperuser = req.user && req.user.isSuperuser;
    //Get the ID from the url
    const id: string = String(req.params.id);
    const repository = dataSource.getRepository(Story);
    try {
      const storyRep = repository
        .createQueryBuilder('story')
        .where({
          id,
        })
        .select(select.map((x) => `story.${x}`));

      if (isSuperuser) {
        storyRep
          .leftJoin('story.user', 'u')
          .addSelect([
            'u.id',
            'u.username',
            'u.email',
            'u.photoUrl',
            'u.isBanned',
          ]);
      }

      const story = await storyRep.getOne();
      if (story) {
        story.viewsCount = story.viewsCount + 1;
        await repository.increment({ id }, 'viewsCount', 1);
        res.send(story);
      } else {
        res.status(404).send('Story not found');
      }
    } catch (error) {
      res.status(500).send(error);
    }
  };

  static create = async (req: Request, res: Response) => {
    const { content, description } = req.body;
    if (
      !validContent(content) ||
      (description !== undefined &&
        (typeof description !== 'string' || description.length > 300))
    ) {
      res.status(400).json({ message: 'Invalid story content' });
      return;
    }
    const story = new Story();
    let newStory: Story | undefined;
    story.content = content;
    story.description = description;
    // @ts-ignore
    const userId = req.user && req.user.id;
    const repository = dataSource.getRepository(Story);
    if (userId) {
      const userRepository = dataSource.getRepository(User);
      const user = await userRepository.findOneBy({ id: userId });

      if (!user) {
        res.status(400).send();
        return;
      }
      story.user = user;

      if (user.isBanned) {
        res.status(403).send();
        return;
      }

      // Validate if the parameters are ok
      const errors = await validate(story);
      if (errors.length > 0) {
        res.status(400).send(errors);
        return;
      }

      const exist = await repository
        .createQueryBuilder('story')
        .where({
          userId,
          content,
          isPublic: true,
        })
        .getCount();

      if (exist) {
        if (exist < 20) {
          story.isDeleted = true;
        } else {
          // automatically ban users who save the same thing many times
          user.isBanned = true;
          await userRepository.save(user);

          // need for that banned user does not immediately guess that something is wrong
          res.send(story);
          return;
        }
      }
    }
    try {
      newStory = await repository.save(story);
    } catch (error) {
      res.status(500).send({ message: "can't save story", error });
      return;
    }
    try {
      // story after first save to get `id` for name
      const postcardPath = await postcard(newStory);
      story.postcard = postcardPath;
      newStory = await repository.save(story);
    } catch (error) {
      console.log(error);
      // res.status(500).send({ message: 'postcard create error', error });
      // return;
    }
    try {
      res.send(newStory);
    } catch (error) {
      res.status(500).send({ message: "can't save story", error });
    }
  };

  static like = async (req: Request, res: Response) => {
    const storyId = req.params.id;
    // @ts-ignore
    const userId = req.user && req.user.id;
    const storyRepository = dataSource.getRepository(Story);
    const likeReposytory = dataSource.getRepository(Like);
    const userReposytory = dataSource.getRepository(User);
    try {
      const existLike = await likeReposytory.findOneBy({
        userId,
        storyId: String(storyId),
      });
      if (existLike) {
        res.status(409).send('Like from this user already exists');
        return;
      }
      const story = await storyRepository.findOneByOrFail({
        id: String(storyId),
      });
      const user = await userReposytory.findOneByOrFail({ id: userId });

      const like = new Like();
      like.user = user;
      like.story = story;

      await likeReposytory.save(like);

      res.status(200).send();
    } catch (error) {
      res.status(500).send(error);
    }
  };

  static violation = async (req: Request, res: Response) => {
    const storyId = req.params.id;
    // @ts-ignore
    const isSuperuser = req.user && req.user.isSuperuser;
    // @ts-ignore
    const userId = req.user && req.user.id;
    const storyRepository = dataSource.getRepository(Story);
    const violationReposytory = dataSource.getRepository(Violation);
    const userReposytory = dataSource.getRepository(User);
    try {
      const story = await storyRepository.findOneByOrFail({
        id: String(storyId),
      });

      if (isSuperuser) {
        story.isBanned = true;
        await storyRepository.save(story);
      }

      const violation = new Violation();
      violation.story = story;

      if (userId) {
        const user = await userReposytory.findOneBy({ id: userId });
        violation.user = user || undefined;
      }
      await violationReposytory.save(violation);
      res.status(200).send();
    } catch (error) {
      res.status(500).send(error);
    }
  };

  static dislike = async (req: Request, res: Response) => {
    const storyId = req.params.id;
    // @ts-ignore
    const userId = req.user && req.user.id;
    const likeReposytory = dataSource.getRepository(Like);
    try {
      const existLike = await likeReposytory.findOneByOrFail({
        userId,
        storyId: String(storyId),
      });
      await likeReposytory.remove(existLike);
      res.send();
    } catch (error) {
      res.status(500).send(error);
    }
  };

  static edit = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const { editId, ...params } = req.body;
    // @ts-ignore
    const userId = req.user && req.user.id;
    let user: User | null = null;

    const repository = dataSource.getRepository(Story);
    let story: Story;
    try {
      story = await repository.findOneByOrFail({ id });
    } catch (error) {
      res.status(404).send('Story not found');
      return;
    }
    if (userId) {
      const userReposytory = dataSource.getRepository(User);
      user = await userReposytory.findOneBy({ id: userId });
    }
    const isSuperuser = user && user.isSuperuser;
    const isOwner = user && story.userId === user.id;
    if (!isSuperuser && !isOwner) {
      res.status(403).send('Not permitted');
      return;
    }
    // Validate the new values on model
    if ('content' in params && !validContent(params.content)) {
      res.status(400).json({ message: 'Invalid story content' });
      return;
    }
    const allowedFields = ['content', 'description', 'isPublic', 'isDeleted'];
    if (isSuperuser) allowedFields.push('isBanned');
    for (const key of Object.keys(params)) {
      if (
        !allowedFields.includes(key) ||
        (key.startsWith('is') && typeof params[key] !== 'boolean') ||
        (key === 'description' &&
          (typeof params[key] !== 'string' || params[key].length > 300))
      ) {
        res.status(400).json({ message: 'Invalid story fields' });
        return;
      }
    }
    Object.assign(story, params);
    const errors = await validate(story);
    if (errors.length > 0) {
      res.status(400).send(errors);
      return;
    }

    try {
      story = await repository.save(story);
    } catch (e) {
      res.status(409).send("can't save story");
      return;
    }
    res.send(story);
  };

  static delete = async (req: Request, res: Response) => {
    // Get the ID from the url
    const id = String(req.params.id);

    const repository = dataSource.getRepository(Story);
    try {
      await repository.findOneByOrFail({ id });
    } catch (error) {
      res.status(404).send('Story not found');
      return;
    }
    await repository.delete(id);

    // After all send a 204 (no content, but accepted) response
    res.status(204).send();
  };

  static postcard = async (req: Request, res: Response) => {
    //Get the ID from the url
    const id: string = String(req.params.id);

    const repository = dataSource.getRepository(Story);
    try {
      const story = await repository.findOneOrFail({
        where: { id },
        select: Object.fromEntries(select.map((key) => [key, true])),
      });
      if (!story.postcard) {
        res.status(404).send('Postcard not found');
        return;
      }
      res.redirect(story.postcard);
    } catch (error) {
      res.status(404).send('Story not found');
    }
  };
}
