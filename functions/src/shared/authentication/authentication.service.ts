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
          user.email ? user.email : '',
          'login_success',
          ipAddress,
          'User has Sign In Successfully',
        );
        return {
          status: HttpStatus.OK,
          message: `Hi ${user.email}, You have Successfully Signed In`,
          user,
        };
      })
      .catch((error) => {
        writeLogEntry(
          'ERROR',
          email,
          'login_failed',
          ipAddress,
          error.message,
        );
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
          return { status: 200, message: 'Email Verification sent', user };
        });
      })
      .catch((error) => {
        console.log(error);
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
