import { createConnection } from 'typeorm';
import { Application } from 'express';
import { api } from './api';


export default (app: Application) => {

  createConnection()
    .then(async connection => {

      api(app);

      app.listen(3000, () => {
        console.log('Development server started on port 3000!');
      });
    })
    .catch(error => console.log(error));
};
