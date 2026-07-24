import { Router } from 'express';
import passport from 'passport';

import UserController from '../controllers/UserController';
import { isSelf } from '../middlewares/isSelf';
import { isSuperuser } from '../middlewares/isSuperuser';

const router = Router();

// Get one user
router.get(
  '/',
  passport.authenticate(['jwt'], { session: false }),
  (req, res) => {
    res.status(200).json(req.user);
  },
);

router.get(
  '/likes',
  passport.authenticate(['jwt'], { session: false }),
  UserController.likes,
);

router.get(
  '/secure',
  passport.authenticate(['jwt'], { session: false }),
  (req, res) => {
    res.send(req.user);
  },
);

router.get(
  '/admin',
  passport.authenticate(['jwt'], { session: false }),
  isSuperuser(),
  UserController.listAdminUsers,
);

router.patch(
  '/admin/:id([0-9]+)/ban',
  passport.authenticate(['jwt'], { session: false }),
  isSuperuser(),
  UserController.setBanStatus,
);

//Create a new user
router.post('/', UserController.newUser);

//Edit one user
router.patch(
  '/:id([0-9]+)',
  passport.authenticate(['jwt'], { session: false }),
  // [isSelf(), isSuperuser()],
  UserController.editUser,
);

//Delete one user
router.delete('/:id([0-9]+)', [isSelf()], UserController.deleteUser);

export default router;
