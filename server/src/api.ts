import cors from 'cors';
import express, { type Application, type ErrorRequestHandler } from 'express';
import passport from 'passport';

import routes from './routers';

export function api(app: Application) {
  app.use(passport.initialize());
  app.use(cors());
  app.disable('x-powered-by');
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json({ limit: '1mb' }));
  app.use((req, _res, next) => {
    req.body ??= {};
    next();
  });
  app.get('/health', (_request, response) => {
    response.json({ status: 'ok' });
  });
  // app.use(appendOgImage);

  // Set all routes from routes folder
  app.use('/', routes);
  const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
    if (res.headersSent) return next(error);
    const status = Number(error.status);
    const clientError = status >= 400 && status < 500;
    if (!clientError) console.error('Request failed', error);
    res.status(clientError ? status : 500).json({
      message: clientError ? 'Invalid request' : 'Internal server error',
    });
  };
  app.use(errorHandler);
}
