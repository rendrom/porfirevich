import fs from 'node:fs';
import path from 'node:path';

import type { Application } from 'express';
import express from 'express';

export function appConfig(app: Application) {
  const mediaPath = path.resolve(process.cwd(), '../media');

  if (!fs.existsSync(mediaPath)) {
    fs.mkdirSync(mediaPath, { recursive: true });
  }

  app.use('/media', express.static(mediaPath));
}
