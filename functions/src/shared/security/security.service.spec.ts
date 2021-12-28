import { Test, TestingModule } from '@nestjs/testing';
import { firebaseApp } from '../../config/firebaseConfig';
import { admin } from '../../config/firebaseConnection';
import { SecurityService } from './security.service';
const email = 'ali.ozeir@itxi.net';
const logEmail = 'ali-oz@testing.com';
const ipAddress = '169.192.24.1';
const uid = 'RN93D6ieSwfZ7Lkn8Eeodr7BNfu2';
const fakeUID = 'SG93D6ieSwfZ7Lkn8Eeodr7BNfu2';
const password123Hashed =
  '$2b$10$i/HPqyC5zlZ9oEW3fjt/8.FcMgPe5hTQIf/SGSOt42qMc0M/wwcqW';
describe('SecurityService', () => {
  let service: SecurityService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SecurityService],
    }).compile();
    firebaseApp;
    service = module.get<SecurityService>(SecurityService);
  });

  afterAll(async () => {
    const doc = admin.firestore().collection('U-Pass').doc(fakeUID);
    await doc.delete();
  });

  test('should check if it sends password email reset', (done) => {
    service
      .sendPasswordEmailReset('ali.ozeir@itxi.net', ipAddress, logEmail)
      .then((response) => {
        expect(response.message).toEqual(
          `Hi ${email}, You have Successfully Received Password Reset Email`,
        );
        expect(response.status).toEqual(201);
        done();
      })
      .catch(done);
  });

  test('should check if it hashes the password', (done) => {
    service
      .hashPassword('password123')
      .then((result) => {
        expect(result.status).toEqual(201);
        expect(result.message).toEqual('Password Hashed Successfully!');
        expect(result.hash.substr(0, 4)).toEqual('$2b$');
        done();
      })
      .catch(done);
  });

  test('should check if the passwords matches', (done) => {
    service
      .checkPasswords('password123', password123Hashed)
      .then((result) => {
        expect(result.status).toEqual(204);
        expect(result.message).toEqual('Passwords Matched!');
        done();
      })
      .catch(done);
  });

  test('should check if it added the lastTimeChanged password date', (done) => {
    service
      .addChangingPasswordDate(uid)
      .then((result) => {
        expect(result.status).toEqual(201);
        expect(result.message).toEqual(
          'Last Changed Password Date added Successfully to the Custom Claims!',
        );
        done();
      })
      .catch(done);
  });

  test('should check if it set new password in firestore', (done) => {
    service
      .setNewPassword(fakeUID, password123Hashed)
      .then((response) => {
        expect(response.message).toEqual(
          'Hashed Password has been Successfully added to Firestore!',
        );
        expect(response.status).toEqual(200);
        done();
      })
      .catch(done);
  });

  test("should check if it get all users' hashed passwords", (done) => {
    service
      .getUsersHashedPasswords(fakeUID)
      .then((result) => {
        expect(result.passwords[0]).toEqual(password123Hashed);
        expect(result.status).toEqual(200);
        expect(result.message).toEqual(
          'Hashed Passwords Fetched Successfully!',
        );
        done();
      })
      .catch(done);
  });
});
