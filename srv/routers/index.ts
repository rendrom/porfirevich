import { Router } from 'express';
import auth from './auth';
import user from './user';
import story from './story';

const routes = Router();

routes.use('/api/story', story);
routes.use('/auth', auth);
routes.use('/api/user', user);

export default routes;
