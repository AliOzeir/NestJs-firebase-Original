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
export class AdminMiddleware implements NestMiddleware {
  // --- Middleware for checking Bearer Token
  async use(@Req() req: Request, res: Response, next: NextFunction) {
    functions.logger.log('Check if request is authorized with admin role');
    const idToken = req.headers.authorization.split('Bearer ')[1];
    try {
      const decodedIdToken = await admin.auth().verifyIdToken(idToken);
      if (!decodedIdToken.role || decodedIdToken.role !== 'admin') {
        throw new HttpException(
          "You're not allowed to access this information",
          HttpStatus.FORBIDDEN,
        );
      }
      next();
      return;
    } catch (error) {
      functions.logger.error('Error while verifying admin role:', error);
      throw new HttpException(
        "You're not allowed to access this information",
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
