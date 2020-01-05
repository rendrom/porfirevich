import { Application } from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import cors from 'cors';
import routes from './routers';
import passport from 'passport';

export function api(app: Application) {
  app.use(passport.initialize());
  app.use(cors());
  app.use(helmet());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  // app.use(appendOgImage);

  // Set all routes from routes folder
  app.use('/', routes);
}
