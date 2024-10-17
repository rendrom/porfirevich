import fs from 'node:fs';
import path from 'node:path';

import express from 'express';

import type { Application } from 'express';

export function appConfig(app: Application) {
  const mediaPath = path.resolve(__dirname, '../media');

  if (!fs.existsSync(mediaPath)) {
    fs.mkdirSync(mediaPath);
  }

  app.use('/media', express.static(mediaPath));
}
