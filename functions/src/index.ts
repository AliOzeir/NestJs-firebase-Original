import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import * as express from 'express';
import * as cors from 'cors';
import * as functions from 'firebase-functions';
import { disableInactiveUsers } from './shared/scheduled/disableUsers.scheduled';
import { firebaseApp } from './config/firebaseConfig';

const server = express();
server.use(express.json());
server.use(cors());
firebaseApp;
export const createNestServer = async (expressInstance) => {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
  );

  return app.init();
};

createNestServer(server)
  .then(() => console.log('Nest Ready'))
  .catch((err) => console.error('Nest broken', err));

export const app = functions.https.onRequest(server);
exports.disableInactiveUsers = functions.pubsub
  .schedule('0 0 * * *')
  .onRun(disableInactiveUsers);
  
// test('if it delete a user', (done) => {
  //   service
  //     .deleteUser(uidDelete, ipAddress, email)
  //     .then((user) => {
  //       expect(user.message).toEqual('User Successfully deleted');
  //       expect(user.user.uid).toEqual(uidDelete);
  //       expect(user.status).toEqual(200);
  //       done();
  //     })
  //     .catch(done);
  // });