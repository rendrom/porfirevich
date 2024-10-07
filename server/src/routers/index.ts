import { Router } from 'express';

import auth from './auth';
import story from './story';
import user from './user';

const routes = Router();

routes.use('/api/story', story);
routes.use('/auth', auth);
routes.use('/api/user', user);

export default routes;
