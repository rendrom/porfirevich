import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { getRepository } from 'typeorm';

import { Story } from '../entity/Story';


export async function appendOgImage(req: Request, res: Response, next: NextFunction) {

  const id: string = req.params.id;
  let htmlPath = path.resolve(__dirname, '../../dist/index.html');
  const repository = getRepository(Story);
  try {
    const story = await repository.findOneOrFail(id, {
      select: ['id', 'content']
    });

    let html = fs.readFileSync(htmlPath, 'utf8');
    const ogImage = req.protocol + '://' + req.hostname + '/media/' + story.id + '.png';
    html = html.replace('<!-- META -->', `<meta property="og:image" content="${ogImage}" />`);
    res.send(html);
  } catch (error) {
    res.sendFile(htmlPath);
  }

};
