import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AuthMiddleware } from '../middleware/verifyToken.middleware';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';

@Module({
  controllers: [SecurityController],
  providers: [SecurityService],
})
export class SecurityModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'security/sendPasswordResetEmail', method: RequestMethod.POST },
        { path: 'security/hashPassword', method: RequestMethod.POST },
        { path: 'security/checkPasswords', method: RequestMethod.POST },
        {
          path: 'security/addChangingPasswordDate',
          method: RequestMethod.POST,
        }
      );
  }
}

