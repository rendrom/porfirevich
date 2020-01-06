import passport from 'passport';
import { OAuth2Strategy, IOAuth2StrategyOption } from 'passport-google-oauth';
import { getRepository } from 'typeorm';
import { validate } from 'class-validator';
import config from '../config';
import { User } from '../entity/user';
import shortid from 'shortid';

const clientID = config.get('auth.google.clientId');
const clientSecret = config.get('auth.google.clientSecret');

const passportConfig: IOAuth2StrategyOption = {
  clientID,
  clientSecret,
  callbackURL: 'http://localhost:3000/auth/google/redirect'
};

if (passportConfig.clientID) {
  passport.use(
    new OAuth2Strategy(
      passportConfig,
      async (accessToken, refreshToken, profile, done) => {
        const userRepository = getRepository(User);

        const user = await userRepository.findOne({
          where: { uid: profile.id },
          select: ['id', 'uid', 'username'] //We dont want to send the password on response
        });
        if (!user) {
          try {
            const user = new User();
            user.username = profile.displayName;
            user.uid = profile.id;
            user.password = shortid.generate();
            user.provider = 'google';
            const photo =
              profile.photos && profile.photos[0] && profile.photos[0].value;
            if (photo) {
              user.photoUrl = photo;
            }
            const email =
              profile.emails && profile.emails[0] && profile.emails[0].value;
            if (email) {
              user.email = email;
            }

            //Validade if the parameters are ok
            const errors = await validate(user);
            if (errors.length > 0) {
              return done(errors);
            }
            //Hash the password, to securely store on DB
            user.hashPassword();
            await userRepository.save(user);
          } catch (error) {
            return done(error);
          }
        }
        return done(null, user);
      }
    )
  );
}
