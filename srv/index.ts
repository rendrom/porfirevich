import { createConnection } from 'typeorm';
import { Application } from 'express';
import { api } from './api';
import { appConfig } from './appConfig';


export default (app: Application) => {

  createConnection()
    .then(async connection => {
      appConfig(app);
      api(app);

      app.listen(3000, () => {
        console.log('Development server started on port 3000!');
      });
    })
    .catch(error => console.log(error));
};
