import { Request, Response, NextFunction } from 'express';
import { getRepository } from 'typeorm';
import { validate } from 'class-validator';

import { Story } from '../entity/Story';
import { postcard } from '../utils/postcard';
// import { StoryResponseSelect } from '../../src/interfaces';

const select: (keyof Story)[] = ['id', 'content', 'createdAt', 'viewsCount', 'postcard'];

export default class StoryController {

  static all = async (req: Request, res: Response, next: NextFunction) => {
    // // Get stories from database
    // const repository = getRepository(Story);
    // const stories = await repository.find({
    //   select: ['id', 'content', 'postcard', 'viewsCount']
    // });

    // // Send the story object
    // res.send(stories);

    // This example assumes you've previously defined `Users`
    // as `const Users = db.model('Users')` if you are using `mongoose`
    // and that you are using Node v7.6.0+ which has async/await support
    try {
      const repository = getRepository(Story);
      const [results, itemCount] = await Promise.all([
        repository.createQueryBuilder()
        .take(req.query.limit)
        .skip(req.query.offset)
        .orderBy('createdAt', 'DESC')
        .getMany(),
        repository.count({})
      ]);

      // const pageCount = Math.ceil(itemCount / req.query.limit);
      const loaded = Number(req.query.offset) + Number(req.query.limit);
      if (req.accepts('json')) {
        // inspired by Stripe's API response for list objects
        res.json({
          object: 'list',
          hasMore: itemCount > loaded,
          count: itemCount,
          data: results
        });
      }

    } catch (err) {
      next(err);
    }


  };

  static one = async (req: Request, res: Response) => {
    //Get the ID from the url
    const id: string = req.params.id;
    const repository = getRepository(Story);
    try {
      const story = await repository.findOneOrFail(id, {
        select: select
      });
      story.viewsCount = story.viewsCount + 1;
      repository.save(story);
      res.send(story);
    } catch (error) {
      res.status(404).send('Story not found');
    }
  };

  static create = async (req: Request, res: Response) => {
    const { content, description } = req.body;
    const story = new Story();
    let newStory: Story | undefined;
    story.content = content;
    story.description = description;

    // Validate if the parameters are ok
    const errors = await validate(story);
    if (errors.length > 0) {
      res.status(400).send(errors);
      return;
    }

    const repository = getRepository(Story);
    try {
      newStory = await repository.save(story);
    } catch (e) {
      res.status(500).send(e);
      return;
    }
    try {
      const postcardPath = await postcard(newStory);
      story.postcard = postcardPath;
      newStory = await repository.save(story);
    } catch (e) {
      res.status(500).send(e);
      return;
    }
    if (newStory) {
      res.send(newStory);
    } else {
      res.status(500).send('can\'t save story');
    }
  };

  static edit = async (req: Request, res: Response) => {
    const id = req.params.id;
    const { content, description } = req.body;

    // Try to find story on database
    const repository = getRepository(Story);
    let story;
    try {
      story = await repository.findOneOrFail(id);
    } catch (error) {
      res.status(404).send('Story not found');
      return;
    }

    // Validate the new values on model
    story.content = content;
    story.description = description;
    const errors = await validate(story);
    if (errors.length > 0) {
      res.status(400).send(errors);
      return;
    }

    try {
      await repository.save(story);
    } catch (e) {
      res.status(409).send('can\'t save story');
      return;
    }
    res.send(story);
  };

  static delete = async (req: Request, res: Response) => {
    // Get the ID from the url
    const id = req.params.id;

    const repository = getRepository(Story);
    try {
      await repository.findOneOrFail(id);
    } catch (error) {
      res.status(404).send('Story not found');
      return;
    }
    repository.delete(id);

    // After all send a 204 (no content, but accepted) response
    res.status(204).send();
  };

  static postcard = async (req: Request, res: Response) => {
    //Get the ID from the url
    const id: string = req.params.id;

    const repository = getRepository(Story);
    try {
      const story = await repository.findOneOrFail(id, {
        select
      });
      story.viewsCount = story.viewsCount + 1;
      repository.save(story);
      // await postcard(story);
    } catch (error) {
      res.status(404).send('Story not found');
    }
  };
};
