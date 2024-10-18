import { validate } from 'class-validator';
import passport from 'passport';
import { OAuth2Strategy } from 'passport-google-oauth';
import shortid from 'shortid';
import { getRepository } from 'typeorm';

import config from '../config';
import { User } from '../entity/User';

import type { IOAuth2StrategyOption } from 'passport-google-oauth';

const clientID = config.get('auth.google.clientId');
const clientSecret = config.get('auth.google.clientSecret');

const callbackURL = config.get('site');
// const callbackURL =
//   process.env.NODE_ENV === 'development'
//     ? `http://localhost:${config.get('http.port')}`
//     : config.get('site');

const passportConfig: IOAuth2StrategyOption = {
  clientID,
  clientSecret,
  callbackURL: callbackURL + '/auth/google/redirect',
  // callbackURL: 'http://localhost:3000/auth/google/redirect',
};

if (passportConfig.clientID) {
  passport.use(
    new OAuth2Strategy(
      passportConfig,
      async (accessToken, refreshToken, profile, done) => {
        const userRepository = getRepository(User);
        let user: User | undefined;
        const verifiedEmail =
          // @ts-ignore
          profile.emails && profile.emails.find((x) => x.verified);
        const email = verifiedEmail && verifiedEmail.value;
        if (email) {
          user = await userRepository.findOne({
            where: { email: email },
            select: ['id', 'uid', 'username'], // We don't want to send the password on response
          });
        }
        if (!user) {
          user = await userRepository.findOne({
            where: { uid: profile.id },
            select: ['id', 'uid', 'username'], // We don't want to send the password on response
          });
        }
        if (!user) {
          try {
            user = new User();
            user.username = profile.displayName;
            user.uid = profile.id;
            user.password = shortid.generate();
            user.provider = 'google';
            const photo =
              profile.photos && profile.photos[0] && profile.photos[0].value;
            if (photo) {
              user.photoUrl = photo;
            }
            if (email) {
              user.email = email;
            }

            // Validate if the parameters are ok
            const errors = await validate(user);
            if (errors.length > 0) {
              return done(errors);
            }
            // Hash the password, to securely store on DB
            user.hashPassword();
            user = await userRepository.save(user);
          } catch (error) {
            return done(error);
          }
        }
        return done(null, user);
      },
    ),
  );
}
