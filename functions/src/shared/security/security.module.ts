import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AdminMiddleware } from '../middleware/verifyAdmin.middleware';
import { APIkeyMiddleware } from '../middleware/verifyApiKey.middleware';
import { AuthMiddleware } from '../middleware/verifyToken.middleware';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';

@Module({
  controllers: [SecurityController],
  providers: [SecurityService],
})
export class SecurityModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(SecurityController);
    consumer.apply(APIkeyMiddleware).forRoutes(SecurityController);
    consumer.apply(AdminMiddleware).forRoutes({
      path: '/disableInactiveUsers',
      method: RequestMethod.POST,
    });
  }
}
