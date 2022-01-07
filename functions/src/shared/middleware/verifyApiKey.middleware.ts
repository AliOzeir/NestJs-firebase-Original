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
export class APIkeyMiddleware implements NestMiddleware {
  // --- Middleware for checking Bearer Token
  async use(@Req() req: Request, res: Response, next: NextFunction) {
    functions.logger.log('Check if request is authorized with API KEY');
    const API_KEY = 'AIzaSyC35-4v4l7Cio6iBMtwl2EGXYlV2Dvw52Q';
    if (!req.header('X-API-KEY') || req.header('x-api-key') !== API_KEY)
      throw new HttpException('Not Authorized.', HttpStatus.UNAUTHORIZED);

    next()
  }
}
