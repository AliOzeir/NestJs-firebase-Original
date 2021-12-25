import { Module } from '@nestjs/common';
import { UserModule } from './shared/users/users.module';
import { SecurityModule } from './shared/security/security.module';
import { AuthenticationModule } from './shared/authentication/authentication.module';

@Module({
  imports: [UserModule, SecurityModule, AuthenticationModule],
})
export class AppModule {}
