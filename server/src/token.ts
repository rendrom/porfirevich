import jwt from 'jsonwebtoken';

import config from './config';

// Generate an Access Token for the given User ID
export function generateAccessToken(userId: string) {
  const expiresIn = '7d';
  const audience = config.get('auth.token.audience');
  const issuer = config.get('auth.token.issuer');
  const secret = config.get('auth.token.secret');

  const token = jwt.sign({}, secret, {
    expiresIn,
    audience,
    issuer,
    subject: userId,
  });

  return token;
}
