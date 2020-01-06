import { resolve } from 'path';
import { createConnection } from 'typeorm';
import express from 'express';
import { api } from './api';
import { idDef } from './routers/story';
import { appendOgImage } from './middlewares/appendOgImage';
import { appConfig } from './appConfig';
import config from './config';

createConnection()
  .then(async connection => {
    const app = express();
    appConfig(app);
    api(app);

    const publicPath = resolve(__dirname, '../dist');

    const staticConf = { maxAge: '1y', etag: false };

    app.use(express.static(publicPath, staticConf));
    app.use(idDef, appendOgImage);

    app.listen(config.get('http.port'), () => {
      console.log('Server started on port 3000!');
    });
  })
  .catch(error => console.log(error));
