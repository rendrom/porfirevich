import bodyParser from 'body-parser';
import cors from 'cors';
import type { Application } from 'express';
// import helmet from 'helmet';
import passport from 'passport';

import routes from './routers';

export function api(app: Application) {
  app.use(passport.initialize());
  app.use(cors());
  // helmet({
  //   contentSecurityPolicy: false,
  // });
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.get('/health', (_request, response) => {
    response.json({ status: 'ok' });
  });
  // app.use(appendOgImage);

  // Set all routes from routes folder
  app.use('/', routes);
}
