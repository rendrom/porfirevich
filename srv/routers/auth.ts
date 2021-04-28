import { Router, Request, Response } from 'express';
import AuthController from '../controllers/AuthController';
import passport from 'passport';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import { generateAccessToken } from '../token';

import '../auth/jwt';
import '../auth/google';

passport.use(new AnonymousStrategy());

// Generate the Token for the user authenticated in the request
function generateUserToken(req: Request, res: Response) {
  // @ts-ignore
  const userId = req.user && req.user.uid;
  if (userId) {
    const accessToken = generateAccessToken(userId);
    res.redirect('/auth-redirect?token=' + accessToken);
    // res.redirect('http://localhost:3001/auth-redirect?token=' + accessToken);
  }
}

const router = Router();
//Login route
router.post('/login', AuthController.login);

//Change my password
router.post('/change-password', [], AuthController.changePassword);

router.get(
  '/google/start',
  passport.authenticate('google', {
    session: false,
    scope: ['openid', 'profile', 'email']
  })
);
router.get(
  '/google/redirect',
  passport.authenticate('google', { session: false }),
  generateUserToken
);

router.get(
  '/facebook/start',
  passport.authenticate('facebook', {
    session: false,
    scope: ['public_profile']
  })
);
router.get(
  '/facebook/redirect',
  passport.authenticate('facebook', { session: false }),
  generateUserToken
);

export default router;
