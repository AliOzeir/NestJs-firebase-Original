import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './users.service';
import { admin } from '../../config/firebaseConnection';

const uid = 'RN93D6ieSwfZ7Lkn8Eeodr7BNfu2';
const ipAddress = '169.192.192.23';
const email = 'ali-oz@testing.com';
const createdUserEmail = 'aliozeir-testingaccount@test.net';

describe('UserService', () => {
  let service: UserService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterAll(async () => {
    await admin
      .auth()
      .getUserByEmail(createdUserEmail)
      .then(async (user) => {
        await service.deleteUser(user.uid, ipAddress, email);
      });
  });

  test('if it gets all users', (done) => {
    service
      .getAllUsers()
      .then((response) => {
        expect(response.message).toEqual('Fetched All Users Successfully!');
        expect.objectContaining(response.data);
        expect(response.data).toBeNull();
        done();
      })
      .catch(done);
  });

  test('if it gets a single user', (done) => {
    service
      .getUser(uid)
      .then((user) => {
        expect(user.message).toEqual('Fetched User Successfully!');
        expect(user.user.uid).toEqual(uid);
        expect(200);
        done();
      })
      .catch(done);
  });

  test('if it creates a user', (done) => {
    service
      .addUser({ email: createdUserEmail }, ipAddress, email)
      .then((user) => {
        expect(user.message).toEqual('User Successfully Created');
        expect(user.user.email).toEqual('aliozeir-testingaccount@test.net');
        done();
      })
      .catch(done);
  });

  test('if it updates a user', (done) => {
    service
      .updateUser({ role: 'Developer' }, uid, ipAddress, email)
      .then((user) => {
        expect(user.success).toEqual(true);
        expect(user.versionNumber).toEqual('0.1.0');
        expect(user.message).toEqual('success');
        expect(user.user.email).toEqual('alioz-testing@gmail.com');
        done();
      })
      .catch(done);
  });
});
