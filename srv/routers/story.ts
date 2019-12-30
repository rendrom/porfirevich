import { Router } from 'express';
import StoryController from '../controller/StoryController';

const router = Router();

export const idDef = '/:id([0-9A-z_\-]+)'


router.get('/', [], StoryController.all);
router.get(
  idDef,
  [],
  StoryController.one
);
router.get(idDef + '/postcard', [], StoryController.postcard);


router.post('/', StoryController.create);

router.patch(
  idDef,
  [],
  StoryController.edit
);

router.delete(
  idDef,
  [],
  StoryController.delete
);

export default router;
