import { getAuth } from '@firebase/auth';
import * as cors from 'cors';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from '@firebase/auth';
import { writeLogEntry } from '../logs/logs';
import { Request, Response } from 'express';

// --- User Sign In Using Email and Password
export const signIn = (req: Request, res: Response) => {
  cors()(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(404).json({
        statusCode: 404,
        message: `Cannot ${req.method} /signin`,
        error: 'Not Found',
      });
    }
    const auth = getAuth();
    const email = req.body.email;
    const password = req.body.password;
    let ipAddress: string = req.socket.remoteAddress || '';
    if (ipAddress) {
      if (ipAddress.substr(0, 7) == '::ffff:') {
        ipAddress = ipAddress.substr(7);
      }
    }
    await signInWithEmailAndPassword(auth, email, password)
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
        res.status(200).json({
          message: 'User Successfully Signed In',
          user,
        });
      })
      .catch((error) => {
        writeLogEntry('ERROR', email, 'login_failed', ipAddress, error.message);
        if (error.code === 'auth/user-not-found') {
          res.status(401).json({
            status: 401,
            error: {
              code: error.code,
              message: 'Invalid Email. Please check it, and try again!',
            },
          });
        }
        if (error.code === 'auth/wrong-password') {
          res.status(401).json({
            status: 401,
            error: {
              code: error.code,
              message: 'Wrong Password!',
            },
          });
        }
        if (error.code === 'auth/multi-factor-auth-required') {
          res.status(428).json({ status: 428, error });
        }
        res.status(500).json({ status: 500, error });
      });
  });
};

// --- User Sign Up Using Email and Password
export const signUp = (req: Request, res: Response) => {
  cors()(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(404).json({
        statusCode: 404,
        message: `Cannot ${req.method} /signup`,
        error: 'Not Found',
      });
    }
    const email = req.body.email;
    const password = req.body.password;
    const auth = getAuth();
    return await createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user;
        return sendEmailVerification(user).then(() => {
          res
            .status(201)
            .json({ message: 'User Successfully Signed Up', user });
        });
      })
      .catch((error) => {
        if (error.code === 'auth/email-already-in-use') {
          res.status(409).json({
            status: 409,
            error: {
              code: 'auth/email-already-in-use',
              message:
                'The email address is already in use by another account.',
            },
          });
        }
        res.status(500).json({ status: 500, error });
      });
  });
};
