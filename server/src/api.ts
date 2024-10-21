import bodyParser from 'body-parser';
import cors from 'cors';
// import helmet from 'helmet';
import passport from 'passport';

import routes from './routers';

import type { Application } from 'express';

export function api(app: Application) {
  app.use(passport.initialize());
  app.use(cors());
  // helmet({
  //   contentSecurityPolicy: false,
  // });
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  // app.use(appendOgImage);

  // Set all routes from routes folder
  app.use('/', routes);
}
