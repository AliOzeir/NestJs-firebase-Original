import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AuthMiddleware } from '../middleware/verifyToken.middleware';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';

@Module({
  controllers: [SecurityController],
  providers: [SecurityService],
})
export class SecurityModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(
      { path: 'admin/sendPasswordResetEmail', method: RequestMethod.POST },
      { path: 'admin/hashPassword', method: RequestMethod.POST },
      { path: 'admin/checkPasswords', method: RequestMethod.POST },
      {
        path: 'admin/addChangingPasswordDate',
        method: RequestMethod.POST,
      },
    );
  }
}
