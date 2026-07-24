import express from 'express';
import { resolve } from 'path';

import { ormconfig } from '../ormconfig';
import { api } from './api';
import { appConfig } from './appConfig';
import config from './config';
import { connectDatabase } from './database';
import { appendOgImage } from './middlewares/appendOgImage';
import { idDef } from './routers/story';

async function start(): Promise<void> {
  await connectDatabase(ormconfig);

  const app = express();
  appConfig(app);
  api(app);

  const publicPath = resolve(process.cwd(), '../client/dist');

  app.use(
    express.static(publicPath, {
      maxAge: '1y',
      etag: false,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      },
    }),
  );
  app.get(idDef, appendOgImage);
  app.get('*', (_request, response) => {
    response.sendFile(resolve(publicPath, 'index.html'));
  });

  const port = config.get('http.port');
  app.listen(port, () => {
    console.log('Server started on port ' + port + '!');
  });
}

start().catch((error) => {
  console.error('Unable to start server', error);
  process.exitCode = 1;
});
