import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { admin } from '../../config/firebaseConnection';
import { format } from './helpers/format';
import { getAllUsersHelper } from './helpers/getAllUsersHelper';
import { writeLogEntry } from '../logs/logs';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  // --- Get All Users
  async getAllUsers() {
    const data: { [uid: string]: any } = {};
    return getAllUsersHelper()
      .then((listUsersResult: admin.auth.UserRecord[]) => {
        if (listUsersResult.length === 0) {
          throw new HttpException(
            {
              status: HttpStatus.NOT_FOUND,
              message: 'No Users Found!',
            },
            HttpStatus.NOT_FOUND,
          );
        }
        listUsersResult.forEach((userRecord) => {
          const additionalData: { [data: string]: any } = {};
          additionalData['data'] = format(userRecord);
          additionalData['disabled'] = userRecord.disabled;
          data[userRecord.uid] = additionalData;
        });
        return {
          status: HttpStatus.OK,
          message: 'Fetched All Users Successfully!',
          data,
        };
      })
      .catch((error) => {
        throw new HttpException(
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: error,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
  }

  // --- Get Single User
  getUser(uid: string) {
    return admin
      .auth()
      .getUser(uid)
      .then((user) => {
        return {
          status: HttpStatus.OK,
          message: 'Fetched User Successfully!',
          user,
        };
      })
      .catch((error) => {
        if (error.code === 'auth/user-not-found')
          throw new HttpException(
            {
              status: HttpStatus.NOT_FOUND,
              error: error,
            },
            HttpStatus.NOT_FOUND,
          );
        else
          throw new HttpException(
            {
              status: HttpStatus.INTERNAL_SERVER_ERROR,
              error: error,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
      });
  }

  // --- Create A User
  addUser(userBody: CreateUserDto, userIP: string, userEmail: string) {
    let ipAddress: string = userIP || '';
    if (userIP) {
      if (ipAddress.substr(0, 7) == '::ffff:') {
        ipAddress = ipAddress.substr(7);
      }
    }
    return admin
      .auth()
      .createUser({
        email: userBody.email,
        emailVerified: false,
        phoneNumber: userBody.phoneNumber ? userBody.phoneNumber : undefined,
        password: userBody.password,
        displayName: `${userBody.firstName || ''} ${userBody.lastName || ''}`,
        disabled: false,
      })
      .then(async (user) => {
        if (userBody.role?.trim()) {
          await admin
            .auth()
            .setCustomUserClaims(user.uid, { role: userBody.role });
        }
        writeLogEntry(
          'INFO',
          user.email ? user.email : "The user doesn't have email address",
          'account_created',
          ipAddress,
          'New User has been Created',
          userEmail,
          '/addUser',
        );
        return {
          status: HttpStatus.CREATED,
          message: 'User Successfully Created',
          user,
        };
      })
      .catch((error) => {
        writeLogEntry(
          'ERROR',
          '',
          'account_creation_failed',
          ipAddress,
          error.message,
          userEmail,
          '/addUser',
        );
        if (error.code === 'auth/invalid-password') {
          throw new HttpException(
            {
              status: HttpStatus.BAD_REQUEST,
              error: error,
            },
            HttpStatus.BAD_REQUEST,
          );
        }
        if (error.code === 'auth/email-already-exists') {
          throw new HttpException(
            {
              status: HttpStatus.CONFLICT,
              error: error,
            },
            HttpStatus.CONFLICT,
          );
        }
        throw new HttpException(
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: error,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
  }

  // --- Update A User
  updateUser(
    updatedBody: UpdateUserDto,
    uid: string,
    userIP: string,
    userEmail: string,
  ) {
    return admin
      .auth()
      .getUser(uid)
      .then(async (userData) => {
        let ipAddress: string = userIP || '';
        if (ipAddress) {
          if (ipAddress.substr(0, 7) == '::ffff:') {
            ipAddress = ipAddress.substr(7);
          }
        }
        const formattedUser = format(userData);
        if (updatedBody.role?.trim()) {
          await admin
            .auth()
            .setCustomUserClaims(uid, { role: updatedBody.role });
        }
        return await admin
          .auth()
          .updateUser(uid, {
            phoneNumber: updatedBody.phoneNumber || userData.phoneNumber,
            displayName: `${
              updatedBody.firstName
                ? updatedBody.firstName.trim()
                : formattedUser.firstName
                ? formattedUser.firstName
                : ''
            }`
              ? `${
                  updatedBody.firstName
                    ? updatedBody.firstName.trim()
                    : formattedUser.firstName
                    ? formattedUser.firstName
                    : ''
                } ${
                  updatedBody.lastName
                    ? updatedBody.lastName.trim()
                    : formattedUser.lastName
                    ? formattedUser.lastName
                    : ''
                }`
              : undefined,
            disabled:
              updatedBody.disabled === false || true
                ? updatedBody.disabled
                : userData.disabled,
          })
          .then((user) => {
            if (
              updatedBody.role?.trim() &&
              updatedBody.role !== formattedUser.role
            ) {
              writeLogEntry(
                'INFO',
                user.email ? user.email : "The user doesn't have email address",
                'role_changed',
                ipAddress,
                "User's Role has been Changed",
                userEmail,
                '/updateUser',
              );
            }
            if (updatedBody.disabled === true) {
              writeLogEntry(
                'INFO',
                user.email ? user.email : "The user doesn't have email address",
                'account_disabled',
                ipAddress,
                'User has been Disabled',
                userEmail,
                '/updateUser',
              );
            }
            const finalUserFormat = format(user);
            return {
              status: HttpStatus.OK,
              user: finalUserFormat,
              message: 'success',
              success: true,
              versionNumber: '0.1.0',
            };
          })
          .catch((error) => {
            if (
              updatedBody.role?.trim() &&
              updatedBody.role !== formattedUser.role
            ) {
              writeLogEntry(
                'ERROR',
                userData.email
                  ? userData.email
                  : "The user doesn't have email address",
                'role_changing_failed',
                ipAddress,
                error.message,
                userEmail,
                '/updateUser',
              );
            }
            if (updatedBody.disabled === true) {
              writeLogEntry(
                'ERROR',
                userData.email
                  ? userData.email
                  : "The user doesn't have email address",
                'account_disabling_failed',
                ipAddress,
                error.message,
                userEmail,
                '/updateUser',
              );
            }
            throw new HttpException(
              {
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: error,
              },
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          })
          .catch((error) => {
            throw new HttpException(
              {
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: error,
              },
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          });
      });
  }

  // --- Delete A User
  deleteUser(uid: string, userIP: string, userEmail: string) {
    let ipAddress: string = userIP;
    if (ipAddress) {
      if (ipAddress.substr(0, 7) == '::ffff:') {
        ipAddress = ipAddress.substr(7);
      }
    }
    return admin
      .auth()
      .getUser(uid)
      .then((user) => {
        return admin
          .auth()
          .deleteUser(uid)
          .then(() => {
            writeLogEntry(
              'INFO',
              user.email ? user.email : "The user doesn't have email address",
              'account_deleted',
              ipAddress,
              'User has been Deleted',
              userEmail,
              '/deleteUser',
            );
            return { status: 200, message: 'User Successfully deleted', user };
          })
          .catch((error) => {
            writeLogEntry(
              'ERROR',
              user.email ? user.email : "The user doesn't have email address",
              'account_deletion_failed',
              ipAddress,
              error.message,
              userEmail,
              '/deleteUser',
            );
            throw new HttpException(
              {
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: error,
              },
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          })
          .catch((error) => {
            writeLogEntry(
              'ERROR',
              '',
              'account_deletion_failed',
              ipAddress,
              error.message,
              userEmail,
              '/deleteUser',
            );
            if (error.code === 'auth/user-not-found')
              throw new HttpException(
                {
                  status: HttpStatus.NOT_FOUND,
                  error: error,
                },
                HttpStatus.NOT_FOUND,
              );
            throw new HttpException(
              {
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                error: error,
              },
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          });
      });
  }
}
