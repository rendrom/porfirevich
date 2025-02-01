import express from 'express';
import { resolve } from 'path';
import { createConnection } from 'typeorm';

import { appendOgImage } from './middlewares/appendOgImage';
import { idDef } from './routers/story';
import { api } from './api';
import { appConfig } from './appConfig';
import config from './config';
import { ormconfig } from '../orm';

createConnection(ormconfig)
  .then(async () => {
    const app = express();
    appConfig(app);
    api(app);

    const publicPath = resolve(__dirname, '../../client/dist');



    app.use(express.static(publicPath, {
      maxAge: '1y',
      etag: false,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      },
    }));
    app.use(idDef, appendOgImage);
    const port = config.get('http.port');
    app.listen(port, () => {
      console.log('Server started on port ' + port + '!');
    });
  })
  .catch((error) => console.log(error));
