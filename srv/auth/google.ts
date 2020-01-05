// import passport from 'passport';
// import passportGoogle from 'passport-google-oauth';
// import config from '../config';
// import { User } from '../entity/user';

// const passportConfig = {
//   clientID:
//     '459875133220-6b57t8jq619cnaab7v99f4ru16308u7m.apps.googleusercontent.com',
//   clientSecret: 'dnTpZD6lCvAQkFms8efrdJbG',
//   callbackURL: 'http://localhost:3000/api/authentication/google/redirect'
// };

// if (passportConfig.clientID) {
//   passport.use(
//     new passportGoogle.OAuth2Strategy(
//       passportConfig,
//       async (request, accessToken, refreshToken, profile, done) => {
//         const userRepository = getRepository(User);
//         try {
//           const user = await userRepository.findOneOrFail(
//             parseInt(payload.sub),
//             {
//               select: ['id', 'username'] //We dont want to send the password on response
//             }
//           );
//           // const newUser = await User.create({
//           //   name: profile.displayName,
//           //   provider: 'google',
//           //   uid: profile.id,
//           //   photoUrl: profile.photos[0]
//           // })
//           return done(null, user);
//         } catch (error) {
//           return done(error);
//         }
//       }
//     )
//   );
// }
