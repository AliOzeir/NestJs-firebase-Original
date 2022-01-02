import { Module } from '@nestjs/common';
import { UserModule } from './shared/users/users.module';
import { SecurityModule } from './shared/security/security.module';

@Module({
  imports: [UserModule, SecurityModule],
})
export class AppModule {}
