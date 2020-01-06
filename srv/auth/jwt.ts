import passport from 'passport';
import passportJwt from 'passport-jwt';
import { getRepository } from 'typeorm';
import { User } from '../entity/user';
import config from '../config';

const audience = config.get('auth.token.audience');
const issuer = config.get('auth.token.issuer');
const secretOrKey = config.get('auth.token.secret');

const jwtOptions = {
  jwtFromRequest: passportJwt.ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey,
  issuer,
  audience
};

passport.use(
  new passportJwt.Strategy(jwtOptions, async (payload: any, done) => {
    console.log(payload);
    const userRepository = getRepository(User);
    try {
      const user = await userRepository.findOneOrFail(parseInt(payload.sub), {
        select: ['uid', 'username'] //We dont want to send the password on response
      });
      return done(null, user, payload);
    } catch (error) {
      return done(error);
    }
  })
);
