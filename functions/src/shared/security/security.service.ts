import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { admin } from '../../config/firebaseConnection';
import * as bcrypt from 'bcrypt';
import { getAuth, sendPasswordResetEmail } from '@firebase/auth';
import { writeLogEntry } from '../logs/logs';
import { disableInactiveUsers } from '../scheduled/disableUsers.scheduled';
@Injectable()
export class SecurityService {
  db = admin.firestore();

  // --- Send a Password Reset Email
  sendPasswordEmailReset(email: string, userIP: string, userEmail: string) {
    const auth = getAuth();
    let ipAddress: string = userIP || '';
    if (userIP) {
      if (ipAddress.substr(0, 7) == '::ffff:') {
        ipAddress = ipAddress.substr(7);
      }
    }
    return sendPasswordResetEmail(auth, email)
      .then(() => {
        // Signed in
        writeLogEntry(
          'INFO',
          email,
          'reset_password_email',
          ipAddress,
          'Reset Password Email has been Sent',
          userEmail,
        );
        return {
          message: `Hi ${email}, You have Successfully Received Password Reset Email`,
        };
      })
      .catch((error) => {
        writeLogEntry(
          'ERROR',
          email,
          'reset_password_email_failed',
          ipAddress,
          error.message,
          userEmail,
        );
        if (error.code === 'auth/user-not-found') {
          throw new HttpException(
            {
              status: HttpStatus.NOT_FOUND,
              error: {
                code: error.code,
                message: "This email doesn't belong to any user!",
              },
            },
            HttpStatus.NOT_FOUND,
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

  // --- Hash Password
  async setPasswordInDB(uid: string, password: string) {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(password, salt);
      const doc = this.db.collection('U-Pass').doc(uid);
      return await doc
        .get()
        .then(async (docShot) => {
          if (docShot.exists) {
            const passwords = docShot.get('passwords');
            if (passwords.length === 24) {
              await doc
                .update({
                  passwords: admin.firestore.FieldValue.arrayRemove(
                    passwords[0],
                  ),
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
            return await doc
              .update({
                passwords: admin.firestore.FieldValue.arrayUnion(hashPassword),
              })
              .then(async() => {
                return await admin
                  .auth()
                  .setCustomUserClaims(uid, {
                    lastChangedPassword: new Date(),
                  })
                  .then(() => {
                    return {
                      message:
                        'Hashed Password has been Successfully added to Firestore!',
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
          } else {
            return await doc
              .set({
                passwords: [hashPassword],
              })
              .then(async () => {
                return await admin
                  .auth()
                  .setCustomUserClaims(uid, {
                    lastChangedPassword: new Date(),
                  })
                  .then(() => {
                    return {
                      message:
                        'Hashed Password has been Successfully added to Firestore!',
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
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // --- Check if the passwords are equal
  async checkPasswords(encryptedPassword: string, password: string) {
    try {
      const result = await bcrypt.compare(password, encryptedPassword);
      if (result) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // --- Adding Last Changed Password Date to the User's Claims
  addChangingPasswordDate(userID: string) {
    return admin
      .auth()
      .setCustomUserClaims(userID, {
        lastChangedPassword: new Date(),
      })
      .then(() => {
        return {
          message:
            'Last Changed Password Date added Successfully to the Custom Claims!',
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

  // --- Get Users Hash Passwords
  checkPreviousPasswords(uid: string, newPassword: string) {
    return this.db
      .collection('U-Pass')
      .doc(uid)
      .get()
      .then(async (docShot) => {
        if (docShot.exists) {
          const passwords = docShot?.data()?.passwords;
          if (passwords !== undefined || passwords.length !== 0) {
            const responses = [];
            for (const i in passwords) {
              const response = this.checkPasswords(passwords[i], newPassword);
              responses.push(response);
            }
            const responsesArray = await Promise.all(responses);
            for (let i = 0; i < responsesArray.length; i++) {
              if (responsesArray[i] === true) {
                throw new Error('Passwords Match!');
              }
            }
            return {
              message: "New Password doesn't Match any Previous Password!",
            };
          } else {
            throw new Error('No Passwords in Firestore!');
          }
        }
      })
      .catch((error) => {
        if (error.message === 'Passwords Match!') {
          throw new HttpException(
            {
              status: HttpStatus.NO_CONTENT,
              message: 'Passwords Match!',
            },
            HttpStatus.NO_CONTENT,
          );
        }
        if (error.message === 'No Passwords in Firestore!') {
          throw new HttpException(
            {
              status: HttpStatus.NOT_FOUND,
              message: 'No Passwords in Firestore!',
            },
            HttpStatus.NOT_FOUND,
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

  // --- Disable Inactive Users
  disableInactiveUsers(numDays: number) {
    return disableInactiveUsers(numDays);
  }
}
