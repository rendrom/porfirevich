import '../auth/jwt';
import '../auth/google';

import type { Request, Response } from 'express';
import { Router } from 'express';
import passport from 'passport';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';

import AuthController from '../controllers/AuthController';
import {
  clearRefreshTokenCookie,
  generateAccessToken,
  getRefreshToken,
  setRefreshTokenCookie,
  verifyRefreshToken,
} from '../token';

passport.use(new AnonymousStrategy());

// Generate the Token for the user authenticated in the request
function generateUserToken(req: Request, res: Response) {
  // @ts-ignore
  const userId = req.user && req.user.uid;
  if (userId) {
    const accessToken = generateAccessToken(userId);
    setRefreshTokenCookie(res, userId);
    res.redirect('/auth-redirect?token=' + encodeURIComponent(accessToken));
    // res.redirect('http://localhost:3001/auth-redirect?token=' + accessToken);
  } else {
    res.status(401).send();
  }
}

function refreshSession(req: Request, res: Response) {
  const refreshToken = getRefreshToken(req);
  if (!refreshToken) {
    res.status(401).json({ message: 'Refresh token is missing' });
    return;
  }

  try {
    const userId = verifyRefreshToken(refreshToken);
    setRefreshTokenCookie(res, userId);
    res.status(200).json({ token: generateAccessToken(userId) });
  } catch {
    clearRefreshTokenCookie(res);
    res.status(401).json({ message: 'Refresh token is invalid' });
  }
}

const router = Router();
//Login route
router.post('/login', AuthController.login);
router.post('/refresh', refreshSession);
router.post('/logout', (req, res) => {
  clearRefreshTokenCookie(res);
  res.status(204).send();
});

//Change my password
router.post('/change-password', [], AuthController.changePassword);

router.get(
  '/google/start',
  passport.authenticate('google', {
    session: false,
    scope: ['openid', 'profile', 'email'],
  }),
);
router.get(
  '/google/redirect',
  passport.authenticate('google', { session: false }),
  generateUserToken,
);

router.get(
  '/facebook/start',
  passport.authenticate('facebook', {
    session: false,
    scope: ['public_profile'],
  }),
);
router.get(
  '/facebook/redirect',
  passport.authenticate('facebook', { session: false }),
  generateUserToken,
);

export default router;
