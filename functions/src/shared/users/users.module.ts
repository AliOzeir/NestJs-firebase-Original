import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AdminMiddleware } from '../middleware/verifyAdmin.middleware';
import { APIkeyMiddleware } from '../middleware/verifyApiKey.middleware';
import { AuthMiddleware } from '../middleware/verifyToken.middleware';
import { UserController } from './users.controller';
import { UserService } from './users.service';

@Module({
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(UserController);
    consumer.apply(APIkeyMiddleware).forRoutes(UserController);
    consumer.apply(AdminMiddleware).forRoutes(UserController);
  }
}
