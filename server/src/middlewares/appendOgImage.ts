import fs from 'node:fs';
import path from 'node:path';

import type { Request, Response } from 'express';
import { getRepository } from 'typeorm';

import type { Scheme } from '../../../shared/types/Scheme';
import { Story } from '../entity/Story';

export async function appendOgImage(req: Request, res: Response) {
  const id: string = req.params.id;
  const htmlPath = path.resolve(
    process.cwd(),
    '../client/dist/index.html',
  );
  const repository = getRepository(Story);
  try {
    const story = await repository.findOneOrFail(id, {
      select: ['id', 'content'],
    });

    let html = fs.readFileSync(htmlPath, 'utf8');
    const ogImage =
      req.protocol + '://' + req.hostname + '/media/' + story.id + '.png';
    let description = (JSON.parse(story.content) as Scheme)
      .map((x) => x[0])
      .join('');
    description =
      description.length > 197 ? description.slice(0, 197) + '...' : '';
    const addMeta = [
      `<meta property="og:image" content="${ogImage}" />`,
      `<meta property="og:description" content="${description}" />`,
    ];

    html = html.replace(
      /<meta charset=["']?utf-8["']?\s*\/?>/i,
      (charsetMeta) => `${charsetMeta}${addMeta.join('')}`,
    );
    res.send(html);
  } catch {
    res.sendFile(htmlPath);
  }
}
