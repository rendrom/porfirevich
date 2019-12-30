import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { validate } from 'class-validator';

import { Story } from '../entity/Story';
import { postcard } from '../utils/postcard';

export default class StoryController {

  static all = async (req: Request, res: Response) => {
    // Get stories from database
    const repository = getRepository(Story);
    const stories = await repository.find({
      select: ['id', 'content', 'postcard']
    });

    // Send the story object
    res.send(stories);
  };

  static one = async (req: Request, res: Response) => {
    //Get the ID from the url
    const id: string = req.params.id;
    const repository = getRepository(Story);
    try {
      const story = await repository.findOneOrFail(id, {
        select: ['id', 'content', 'postcard']
      });
      res.send(story);
    } catch (error) {
      res.status(404).send('Story not found');
    }
  };

  static create = async (req: Request, res: Response) => {
    const { content, description } = req.body;
    const story = new Story();
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
      let newStory = await repository.save(story);
      const postcardPath = await postcard(newStory);
      story.postcard = postcardPath;
      newStory = await repository.save(story);

      res.send(newStory);
    } catch (e) {
      res.status(409).send('can\'t save story');
      return;
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
        select: ['id', 'content', 'postcard']
      });
      // await postcard(story);
    } catch (error) {
      res.status(404).send('Story not found');
    }
  };
};
