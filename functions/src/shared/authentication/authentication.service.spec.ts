import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationService } from './authentication.service';
import * as dotenv from 'dotenv';
import { admin } from '../../config/firebaseConnection';
import { firebaseApp } from '../../config/firebaseConfig';

dotenv.config();
const email = process.env.EMAIL;
const password = process.env.PASSWORD;
const newEmail = 'ali-itxi@testing.com';
describe('AuthenticationService', () => {
  let service: AuthenticationService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthenticationService],
    }).compile();
    firebaseApp;
    service = module.get<AuthenticationService>(AuthenticationService);
  });

  afterAll(async () => {
    await admin
      .auth()
      .getUserByEmail(newEmail)
      .then(async (user) => {
        await admin.auth().deleteUser(user.uid);
      });
  });

  test('should check if it signs in', (done) => {
    service
      .signIn(email, password, '169.192.24.12')
      .then((response) => {
        expect(response.message).toEqual(`User Successfully Signed In`);
        expect(response.user.email).toEqual(email);
        done();
      })
      .catch(done);
  });

  test('should check if it signs up new User', (done) => {
    service
      .createUserByEmailAndPass(newEmail, password)
      .then((response) => {
        expect(response.message).toEqual(`User Successfully Signed Up`);
        expect(response.user.email).toEqual(newEmail);
        done();
      })
      .catch(done);
  });
});
