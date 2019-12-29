import { Router } from 'express';
import StoryController from '../controller/StoryController';

const router = Router();

const idDef = '/:id([0-9A-z_\-]+)'

//Get all users
router.get('/', [], StoryController.all);

// Get one user
router.get(
  idDef,
  [],
  StoryController.one
);

//Create a new user
router.post('/', StoryController.create);

//Edit one user
router.patch(
  idDef,
  [],
  StoryController.edit
);

//Delete one user
router.delete(
  idDef,
  [],
  StoryController.delete
);

export default router;
