import convict from 'convict';
import dotenv from 'dotenv';

dotenv.config();

const config = convict({
  http: {
    port: {
      doc: 'The port to listen on',
      default: 3000,
      env: 'PORT'
    }
  },
  auth: {
    google: {
      clientId: {
        doc: 'The Client ID from Google to use for authentication',
        default: '',
        env: 'GOOGLE_CLIENTID'
      },
      clientSecret: {
        doc: 'The Client Secret from Google to use for authentication',
        default: '',
        env: 'GOOGLE_CLIENTSECRET'
      }
    },
    facebook: {
      clientId: {
        doc: '1349052711830842',
        default: '',
        env: 'FACEBOOK_CLIENTID'
      },
      clientSecret: {
        doc: '47af6edaa2c4a2881a53a3d8ffb7ab09',
        default: '',
        env: 'FACEBOOK_CLIENTSECRET'
      }
    },
    token: {
      secret: {
        doc: 'The signing key for the JWT',
        default: 'mySuperSecretKey',
        env: 'JWT_SIGNING_KEY'
      },
      issuer: {
        doc: 'The issuer for the JWT',
        default: 'social-logins-spa'
      },
      audience: {
        doc: 'The audience for the JWT',
        default: 'social-logins-spa'
      }
    }
  }
});

config.validate();

export default config;
