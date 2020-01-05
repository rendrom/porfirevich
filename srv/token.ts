import jwt from 'jsonwebtoken';
import config from './../config';

// Generate an Access Token for the given User ID
export function generateAccessToken(userId: number) {
  const expiresIn = '7d';
  const audience = 'public';
  const issuer = 'knight3rrant';
  const secret = config.jwtSecret;

  const token = jwt.sign({}, secret, {
    expiresIn,
    audience,
    issuer,
    subject: userId.toString()
  });

  return token;
}
