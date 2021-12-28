import { Body, Controller, Ip, Post } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';

@Controller('')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Post('signIn')
  signIn(
    @Body('email') email: string,
    @Body('password') password: string,
    @Ip() ipAddress: string,
  ): object {
    return this.authenticationService.signIn(email, password, ipAddress);
  }

  @Post('signUp')
  createUserByEmailAndPass(
    @Body('email') email: string,
    @Body('password') password: string,
  ): object {
    return this.authenticationService.createUserByEmailAndPass(email, password);
  }
}
