const { resolve } = require('path')
import express, { Application } from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import cors from 'cors';
import routes from './routers';

export function api (app: Application) {

  const mediaPath = resolve(__dirname, '../media');
  app.use('/media',express.static(mediaPath));
  app.use(cors());
  app.use(helmet());
  app.use(bodyParser.json());
  // app.use(appendOgImage);

  //Set all routes from routes folder
  app.use('/', routes);
}
