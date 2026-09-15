import { Router } from 'express';
import passport from 'passport';

import StoryController from '../controllers/StoryController';

const router = Router();

export const idDef = '/:id';

router.param('id', (req, res, next, id: string) => {
  if (!/^[0-9A-Za-z_-]+$/.test(id)) {
    res.status(404).send('Story not found');
    return;
  }
  next();
});

router.get(
  '/',
  [passport.authenticate(['jwt', 'anonymous'], { session: false })],
  StoryController.all,
);
router.get(
  idDef,
  [passport.authenticate(['jwt', 'anonymous'], { session: false })],
  StoryController.one,
);
router.get(idDef + '/postcard', [], StoryController.postcard);

router.post(
  '/',
  [passport.authenticate(['jwt', 'anonymous'], { session: false })],
  StoryController.create,
);

router.post(
  idDef + '/like',
  [passport.authenticate(['jwt'], { session: false })],
  StoryController.like,
);

router.post(
  idDef + '/violation',
  [passport.authenticate(['jwt', 'anonymous'], { session: false })],
  StoryController.violation,
);

router.post(
  idDef + '/dislike',
  [passport.authenticate(['jwt'], { session: false })],
  StoryController.dislike,
);

router.patch(
  idDef,
  [passport.authenticate(['jwt', 'anonymous'], { session: false })],
  StoryController.edit,
);

// router.delete(idDef, [], StoryController.delete);

export default router;
