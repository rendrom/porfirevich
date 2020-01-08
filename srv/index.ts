import { createConnection } from 'typeorm';
import { Application } from 'express';
import { api } from './api';
import { appConfig } from './appConfig';
import config from './config';

export default (app: Application) => {
  createConnection()
    .then(async connection => {
      appConfig(app);
      api(app);

      const port = config.get('http.port');
      app.listen(port, () => {
        console.log(`Development server started on port ${port}!`);
      });
    })
    .catch(error => console.log(error));
};
