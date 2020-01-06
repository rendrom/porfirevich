import passport from 'passport';
import { OAuth2Strategy, IOAuth2StrategyOption } from 'passport-google-oauth';
import { getRepository } from 'typeorm';
import { validate } from 'class-validator';
import config from '../config';
import { User } from '../entity/user';

const clientID = config.get('auth.google.clientID');
const clientSecret = config.get('auth.google.clientSecret');

const passportConfig: IOAuth2StrategyOption = {
  clientID,
  clientSecret,
  callbackURL: 'http://localhost:3000/api/auth/google/redirect'
};

if (passportConfig.clientID) {
  passport.use(
    new OAuth2Strategy(
      passportConfig,
      async (accessToken, refreshToken, profile, done) => {
        const userRepository = getRepository(User);

        const user = await userRepository.findOne(profile.id, {
          select: ['uid', 'username'] //We dont want to send the password on response
        });
        if (!user) {
          try {
            const user = new User();
            user.username = profile.displayName;
            user.uid = profile.id;
            const photo =
              profile.photos && profile.photos[0] && profile.photos[0].value;
            if (photo) {
              user.photoUrl = photo;
            }
            // user.password = password;

            //Validade if the parameters are ok
            const errors = await validate(user);
            if (errors.length > 0) {
              return done(errors);
            }
            //Hash the password, to securely store on DB
            user.hashPassword();
          } catch (error) {
            return done(error);
          }
        }
        return done(null, user);
      }
    )
  );
}
