import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import * as express from 'express';
import * as cors from 'cors';
import * as functions from 'firebase-functions';
import { disableInactiveUsers } from './shared/scheduled/disableUsers.scheduled';
import { firebaseApp } from './config/firebaseConfig';
import { signIn, signUp } from './shared/authentication/authentication';
import { admin } from './config/firebaseConnection';
import { evalCredential } from './shared/db/evalCredential';

const server = express();
server.use(express.json());
server.use(cors());
firebaseApp;
export const createNestServer = async (expressInstance) => {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
    // { logger: ['error', 'warn'] },
  );

  return app.init();
};

createNestServer(server)
  .then(() => console.log('Nest Ready'))
  .catch((err) => console.error('Nest broken', err));

// exports.admin = functions.https.onRequest(server);
exports.admin = functions.https.onRequest(server);
exports.disableInactiveUsers = functions.pubsub
  .schedule('0 0 * * *')
  .onRun(() => disableInactiveUsers(90));
exports.signin = functions.https.onRequest(signIn);
exports.signup = functions.https.onRequest(signUp);
exports.savePasswordsInfo = functions.auth.user().onCreate(async (user) => {
  return await admin
    .auth()
    .getUser(user.uid)
    .then(async (userRecord) => {
      if (!userRecord.customClaims.lastChangedPassword)
        return await admin
          .auth()
          .setCustomUserClaims(user.uid, { lastChangedPassword: new Date() });
    });
});
exports.evalCredential = functions.https.onRequest(evalCredential);
