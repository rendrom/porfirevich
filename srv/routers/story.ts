import { Router } from 'express';
import passport from 'passport';
import StoryController from '../controllers/StoryController';

const router = Router();

export const idDef = '/:id([0-9A-z_-]+)';

router.get(
  '/',
  [passport.authenticate(['jwt', 'anonymous'], { session: false })],
  StoryController.all
);
router.get(
  idDef,
  [passport.authenticate(['jwt', 'anonymous'], { session: false })],
  StoryController.one
);
router.get(idDef + '/postcard', [], StoryController.postcard);

router.post(
  '/',
  [passport.authenticate(['jwt', 'anonymous'], { session: false })],
  StoryController.create
);

router.post(
  idDef + '/like',
  [passport.authenticate(['jwt'], { session: false })],
  StoryController.like
);

router.post(
  idDef + '/violation',
  [passport.authenticate(['jwt', 'anonymous'], { session: false })],
  StoryController.violation
);

router.post(
  idDef + '/dislike',
  [passport.authenticate(['jwt'], { session: false })],
  StoryController.dislike
);

router.patch(
  idDef,
  [passport.authenticate(['jwt', 'anonymous'], { session: false })],
  StoryController.edit
);

// router.delete(idDef, [], StoryController.delete);

export default router;
