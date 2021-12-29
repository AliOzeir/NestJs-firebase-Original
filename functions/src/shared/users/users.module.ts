import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
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
        { path: 'admin/getAllUsers', method: RequestMethod.GET },
        { path: 'admin/getUser/:uid', method: RequestMethod.GET },
        { path: 'admin/createUser', method: RequestMethod.POST },
        { path: 'admin/updateUser/:uid', method: RequestMethod.PUT },
        { path: 'admin/deleteUser/:uid', method: RequestMethod.DELETE },
      );
  }
}
