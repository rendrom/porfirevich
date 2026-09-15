import fs from 'node:fs';
import path from 'node:path';

import type { Request, Response } from 'express';

import type { Scheme } from '../../../shared/types/Scheme';
import { escapeHtml } from '../../../shared/utils/escapeHtml';
import dataSource from '../data-source';
import { Story } from '../entity/Story';

export async function appendOgImage(req: Request, res: Response) {
  const id: string = String(req.params.id);
  const htmlPath = path.resolve(
    process.cwd(),
    '../client/dist/index.html',
  );
  const repository = dataSource.getRepository(Story);
  try {
    const story = await repository.findOneOrFail({
      where: { id },
      select: { id: true, content: true },
    });

    let html = fs.readFileSync(htmlPath, 'utf8');
    const ogImage =
      req.protocol + '://' + req.hostname + '/media/' + story.id + '.png';
    let description = (JSON.parse(story.content) as Scheme)
      .map((x) => x[0])
      .join('');
    description =
      description.length > 197 ? description.slice(0, 197) + '...' : description;
    const addMeta = [
      `<meta property="og:image" content="${escapeHtml(ogImage)}" />`,
      `<meta property="og:description" content="${escapeHtml(description)}" />`,
    ];

    html = html.replace(
      /<meta charset=["']?utf-8["']?\s*\/?>/i,
      (charsetMeta) => `${charsetMeta}${addMeta.join('')}`,
    );
    res.setHeader('Cache-Control', 'no-store');
    res.send(html);
  } catch {
    res.sendFile(htmlPath);
  }
}
