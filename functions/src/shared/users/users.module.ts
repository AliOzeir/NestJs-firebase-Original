import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AuthMiddleware } from '../middleware/verifyToken.middleware';
import { UserController } from './users.controller';
import { UserService } from './users.service';

@Module({
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'users/getAllUsers', method: RequestMethod.GET },
        { path: 'users/getUser/:uid', method: RequestMethod.GET },
        { path: 'users/createUser', method: RequestMethod.POST },
        { path: 'users/updateUser/:uid', method: RequestMethod.PUT },
        { path: 'users/deleteUser/:uid', method: RequestMethod.DELETE },
      );
  }
}
