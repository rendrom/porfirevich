import passport from 'passport';
import passportJwt from 'passport-jwt';
// import config from '../config';
import { User } from '../entity/user';
import { getRepository } from 'typeorm';

const jwtOptions = {
  jwtFromRequest: passportJwt.ExtractJwt.fromAuthHeader(),
  secretOrKey: 'secretone',
  issuer: 'knight3rrant',
  audience: 'public'
};

passport.use(
  new passportJwt.Strategy(jwtOptions, async (payload, done) => {
    console.log(payload);
    const userRepository = getRepository(User);
    try {
      const user = await userRepository.findOneOrFail(parseInt(payload.sub), {
        select: ['id', 'username'] //We dont want to send the password on response
      });
      return done(null, user, payload);
    } catch (error) {
      return done(error);
    }
  })
);
