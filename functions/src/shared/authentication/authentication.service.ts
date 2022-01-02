import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { getAuth } from '@firebase/auth';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from '@firebase/auth';
import { writeLogEntry } from '../logs/logs';

@Injectable()
export class AuthenticationService {
  // --- User Sign In Using Email and Password
  async signIn(email: string, password: string, ip) {
    const auth = getAuth();
    let ipAddress: string = ip || '';
    if (ipAddress) {
      if (ipAddress.substr(0, 7) == '::ffff:') {
        ipAddress = ipAddress.substr(7);
      }
    }
    return await signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user;
        writeLogEntry(
          'INFO',
          user.email,
          'login_success',
          ipAddress,
          'User has Sign In Successfully',
        );
        return {
          message: 'User Successfully Signed In',
          user,
        };
      })
      .catch((error) => {
        writeLogEntry('ERROR', email, 'login_failed', ipAddress, error.message);
        if (
          error.code === 'auth/user-not-found' ||
          error.code === 'auth/wrong-password'
        ) {
          throw new HttpException(
            {
              status: HttpStatus.UNAUTHORIZED,
              error: error,
            },
            HttpStatus.UNAUTHORIZED,
          );
        }
        if (error.code === 'auth/multi-factor-auth-required') {
          throw new HttpException(
            {
              status: HttpStatus.PRECONDITION_REQUIRED,
              error: error,
            },
            HttpStatus.PRECONDITION_REQUIRED,
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

  // --- User Sign Up Using Email and Password
  async createUserByEmailAndPass(email: string, password: string) {
    const auth = getAuth();
    return await createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user;
        return sendEmailVerification(user).then(() => {
          return { message: 'User Successfully Signed Up', user };
        });
      })
      .catch((error) => {
        if (error.code === 'auth/email-already-in-use') {
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
}
