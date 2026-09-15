import { Router } from 'express';
import passport from 'passport';

import UserController from '../controllers/UserController';
import { isSelf } from '../middlewares/isSelf';
import { isSuperuser } from '../middlewares/isSuperuser';

const router = Router();

router.param('id', (_req, res, next, id: string) => {
  if (!/^[1-9][0-9]*$/.test(id)) {
    res.status(404).send('User not found');
    return;
  }
  next();
});

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
  '/admin/:id/ban',
  passport.authenticate(['jwt'], { session: false }),
  isSuperuser(),
  UserController.setBanStatus,
);

//Create a new user
router.post('/', UserController.newUser);

//Edit one user
router.patch(
  '/:id',
  passport.authenticate(['jwt'], { session: false }),
  // [isSelf(), isSuperuser()],
  UserController.editUser,
);

//Delete one user
router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  isSelf(),
  UserController.deleteUser,
);

export default router;
