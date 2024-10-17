import express from 'express';
import { resolve } from 'path';
import { createConnection } from 'typeorm';

import { appendOgImage } from './middlewares/appendOgImage';
import { idDef } from './routers/story';
import { api } from './api';
import { appConfig } from './appConfig';
import config from './config';

createConnection()
  .then(async () => {
    const app = express();
    appConfig(app);
    api(app);

    const publicPath = resolve(__dirname, '../../client/dist');

    const staticConf = { maxAge: '1y', etag: false };

    app.use(express.static(publicPath, staticConf));
    app.use(idDef, appendOgImage);
    const port = config.get('http.port');
    app.listen(port, () => {
      console.log('Server started on port ' + port + '!');
    });
  })
  .catch((error) => console.log(error));
