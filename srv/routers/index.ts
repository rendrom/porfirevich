import { Router } from 'express';

import story from './story';

const routes = Router();

routes.use('/api/story', story);

export default routes;
