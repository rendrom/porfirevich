import type { Application } from 'express';

import { ormconfig } from '../ormconfig';
import { api } from './api';
import { appConfig } from './appConfig';
import config from './config';
import { connectDatabase } from './database';

export default async (app: Application): Promise<void> => {
  await connectDatabase(ormconfig);

  appConfig(app);
  api(app);

  const port = config.get('http.port');
  app.listen(port, () => {
    console.log(`Development server started on port ${port}!`);
  });
};
