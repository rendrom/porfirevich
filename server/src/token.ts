import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import config from './config';

const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '30d';
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const REFRESH_TOKEN_COOKIE = 'porfirevich_refresh_token';

function getTokenConfig() {
  return {
    audience: config.get('auth.token.audience'),
    issuer: config.get('auth.token.issuer'),
    secret: config.get('auth.token.secret'),
  };
}

export function generateAccessToken(userId: string) {
  const { audience, issuer, secret } = getTokenConfig();

  return jwt.sign({ type: 'access' }, secret, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    audience,
    issuer,
    subject: userId,
  });
}

export function generateRefreshToken(userId: string) {
  const { audience, issuer, secret } = getTokenConfig();

  return jwt.sign({ type: 'refresh' }, secret, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    audience,
    issuer,
    subject: userId,
  });
}

export function verifyRefreshToken(token: string) {
  const { audience, issuer, secret } = getTokenConfig();
  const payload = jwt.verify(token, secret, { audience, issuer });

  if (
    typeof payload === 'string' ||
    payload.type !== 'refresh' ||
    !payload.sub
  ) {
    throw new Error('Invalid refresh token');
  }

  return payload.sub;
}

function useSecureCookies() {
  return String(config.get('site')).startsWith('https://');
}

export function setRefreshTokenCookie(res: Response, userId: string) {
  res.cookie(REFRESH_TOKEN_COOKIE, generateRefreshToken(userId), {
    httpOnly: true,
    secure: useSecureCookies(),
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_MAX_AGE,
    path: '/auth',
  });
}

export function clearRefreshTokenCookie(res: Response) {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: useSecureCookies(),
    sameSite: 'lax',
    path: '/auth',
  });
}

export function getRefreshToken(req: Request) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) {
    return null;
  }

  for (const cookie of cookieHeader.split(';')) {
    const [name, ...valueParts] = cookie.trim().split('=');
    if (name === REFRESH_TOKEN_COOKIE) {
      return decodeURIComponent(valueParts.join('='));
    }
  }

  return null;
}
