import { Test, TestingModule } from '@nestjs/testing';
import { firebaseApp } from '../../config/firebaseConfig';
import { admin } from '../../config/firebaseConnection';
import { SecurityService } from './security.service';
const email = 'alioz-testing@gmail.com';
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
    firebaseApp
    service = module.get<SecurityService>(SecurityService);
  });

  afterAll(async () => {
    const doc = admin.firestore().collection('U-Pass').doc(fakeUID);
    await doc.delete();
  });

  test('should check if it sends password email reset', (done) => {
    service
      .sendPasswordEmailReset(email, ipAddress, logEmail)
      .then((response) => {
        expect(response.message).toEqual(
          `Hi ${email}, You have Successfully Received Password Reset Email`,
        );
        done();
      })
      .catch(done);
  });

  test('should check if the passwords matches', (done) => {
    service
      .checkPreviousPasswords(uid, 'password123454')
      .then((result) => {
        expect(result.message).toEqual(
          "New Password doesn't Match any Previous Password!",
        );
        done();
      })
      .catch(done);
  });

  test('should check if it set new password in firestore', (done) => {
    service
      .setPasswordInDB(uid, "password123")
      .then((response) => {
        expect(response.message).toEqual(
          'Hashed Password has been Successfully added to Firestore!',
        );
        done();
      })
      .catch(done);
  });
});
