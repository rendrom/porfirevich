import passport from 'passport';
import passportJwt from 'passport-jwt';
import { getRepository } from 'typeorm';

import config from '../config';
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
    const userRepository = getRepository(User);
    try {
      const user = await userRepository.findOneOrFail({
        where: { uid: payload.sub },
        select: ['id', 'uid', 'username', 'photoUrl', 'isSuperuser'],
      });
      return done(null, user, payload);
    } catch (error) {
      return done(error);
    }
  }),
);
