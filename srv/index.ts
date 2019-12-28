import 'reflect-metadata';
import { createConnection } from 'typeorm';
import { Application } from 'express';
import * as bodyParser from 'body-parser';
import * as helmet from 'helmet';
import * as cors from 'cors';
import routes from './routers';

export default (app: Application) => {

  createConnection()
    .then(async connection => {

      // Call midlewares
      app.use(cors());
      app.use(helmet());
      app.use(bodyParser.json());

      //Set all routes from routes folder
      app.use("/", routes);

      app.listen(3000, () => {
        console.log("Server started on port 3000!");
      });
    })
    .catch(error => console.log(error));
};
