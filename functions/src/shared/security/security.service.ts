import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { admin } from '../../config/firebaseConnection';
import * as bcrypt from 'bcrypt';
import { getAuth, sendPasswordResetEmail } from '@firebase/auth';
import { writeLogEntry } from '../logs/logs';
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
          status: HttpStatus.OK,
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
              error: error,
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
  async hashPassword(password: string) {
    try {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      return {
        status: HttpStatus.OK,
        message: 'Password Hashed Successfully!',
        hash,
      };
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
  async checkPasswords(password: string, encryptedPassword: string) {
    try {
      const result = await bcrypt.compare(password, encryptedPassword);
      if (result) {
        return { status: 204, message: 'Passwords Matched!' };
      } else {
        return { status: 200, message: "Passwords Doesn't Match!" };
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
          status: HttpStatus.OK,
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

  // --- Set Password in Firestore
  async setNewPassword(uid: string, hashPassword: string) {
    const doc = this.db.collection('U-Pass').doc(uid);
    return await doc
      .get()
      .then(async (docShot) => {
        if (docShot.exists) {
          const passwords = docShot.get('passwords');
          if (passwords.length === 24) {
            await doc
              .update({
                passwords: admin.firestore.FieldValue.arrayRemove(passwords[0]),
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
            .then(() => {
              return {
                status: HttpStatus.CREATED,
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
        } else {
          return await doc
            .set({
              passwords: [hashPassword],
            })
            .then(() => {
              return {
                status: HttpStatus.CREATED,
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
  }

  // --- Get Users Hash Passwords
  getUsersHashedPasswords(uid: string) {
    return this.db
      .collection('U-Pass')
      .doc(uid)
      .get()
      .then((docShot) => {
        if (docShot.exists) {
          const passwords = docShot?.data()?.passwords;
          if (passwords !== undefined || passwords.length !== 0) {
            return {
              status: HttpStatus.OK,
              message: 'Hashed Passwords Fetched Successfully!',
              passwords,
            };
          } else {
            throw new HttpException(
              {
                status: HttpStatus.NOT_FOUND,
                message: 'No Passwords in Firestore!',
              },
              HttpStatus.NOT_FOUND,
            );
          }
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
  }
}
