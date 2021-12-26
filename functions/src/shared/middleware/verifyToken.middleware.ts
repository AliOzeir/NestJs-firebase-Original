import * as functions from 'firebase-functions';
import { admin } from '../../config/firebaseConnection';
import { Request, Response, NextFunction } from 'express';
import {
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
  Req,
} from '@nestjs/common';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  // --- Middleware for checking Bearer Token
  async use(@Req() req: Request, res: Response, next: NextFunction) {
    functions.logger.log(
      'Check if request is authorized with Firebase ID token',
    );
    if (
      !req.headers.authorization ||
      !req.headers.authorization.startsWith('Bearer ')
    ) {
      functions.logger.error(
        'No Firebase ID token was passed as a Bearer token in the Authorization header.',
        'Make sure you authorize your request by providing the following HTTP header:',
        'Authorization: Bearer <Firebase ID Token>',
      );
      throw new HttpException('Not authorized.', HttpStatus.UNAUTHORIZED);
    }

    let idToken: string;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      functions.logger.log('Found "Authorization" header');
      idToken = req.headers.authorization.split('Bearer ')[1];
    } else {
      throw new HttpException('Not authorized.', HttpStatus.UNAUTHORIZED);
    }

    try {
      const decodedIdToken = await admin.auth().verifyIdToken(idToken);
      functions.logger.log('ID Token correctly decoded', decodedIdToken);
      (<any>req).user = decodedIdToken;

      next();
      return;
    } catch (error) {
      functions.logger.error('Error while verifying Firebase ID token:', error);
      throw new HttpException('Not authorized.', HttpStatus.UNAUTHORIZED);
    }
  }
}
