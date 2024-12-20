import { createConnection } from 'typeorm';

import { api } from './api';
import { appConfig } from './appConfig';
import config from './config';
import { ormconfig } from '../orm';

import type { Application } from 'express';

export default (app: Application) => {
  createConnection(ormconfig)
    .then(async () => {
      appConfig(app);
      api(app);

      const port = config.get('http.port');
      app.listen(port, () => {
        console.log(`Development server started on port ${port}!`);
      });
    })
    .catch((error) => console.log(error));
};
