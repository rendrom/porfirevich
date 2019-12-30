
import path from  'path';
import fs from 'fs';
import express, { Application } from 'express';


export function appConfig(app: Application) {

  const mediaPath = path.resolve(__dirname, '../media');

  if (!fs.existsSync(mediaPath)) {
    fs.mkdirSync(mediaPath);
  }

  app.use('/media', express.static(mediaPath));

}
