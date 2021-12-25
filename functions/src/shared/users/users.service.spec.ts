import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './users.service';
import { admin } from '../../config/firebaseConnection';

const uid: string = 'RN93D6ieSwfZ7Lkn8Eeodr7BNfu2';
const ipAddress: string = '169.192.192.23';
const email: string = 'ali-oz@testing.com';
const createdUserEmail: string = 'aliozeir-testingaccount@test.net';
const uidDelete: string = 'gNfNTpbStnPqz4fwJFpM9I5x1Lj2';

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
      .then((users) => {
        expect(users.message).toEqual('Fetched All Users Successfully!');
        expect(users.data).not.toBeNull();
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
        expect(user.status).toEqual(200);
        done();
      })
      .catch(done);
  });

  test('if it creates a user', (done) => {
    service
      .addUser({ email: createdUserEmail }, ipAddress, email)
      .then((user) => {
        expect(user.status).toEqual(201);
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
        expect(user.status).toEqual(200);
        expect(user.success).toEqual(true);
        expect(user.versionNumber).toEqual('0.1.0');
        expect(user.message).toEqual('success');
        expect(user.user.email).toEqual('alioz-testing@gmail.com');
        done();
      })
      .catch(done);
  });

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
});
