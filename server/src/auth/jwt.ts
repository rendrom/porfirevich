import passport from 'passport';
import passportJwt from 'passport-jwt';

import config from '../config';
import dataSource from '../data-source';
import { User } from '../entity/User';

const audience = config.get('auth.token.audience');
const issuer = config.get('auth.token.issuer');
const secretOrKey = config.get('auth.token.secret');

const jwtOptions = {
  jwtFromRequest: passportJwt.ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey,
  issuer,
  audience,
};

passport.use(
  new passportJwt.Strategy(jwtOptions, async (payload: any, done) => {
    if (
      typeof payload.sub !== 'string' ||
      !payload.sub ||
      (payload.type && payload.type !== 'access')
    ) {
      return done(null, false);
    }

    const userRepository = dataSource.getRepository(User);
    try {
      const user = await userRepository.findOne({
        where: { uid: payload.sub },
        select: {
          id: true,
          uid: true,
          username: true,
          photoUrl: true,
          isSuperuser: true,
          isBanned: true,
        },
      });
      return done(null, user || false, payload);
    } catch (error) {
      return done(error);
    }
  }),
);
