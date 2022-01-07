import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { SecurityService } from './security.service';

@Controller('')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  // @Post('sendPasswordResetEmail')
  // @HttpCode(200)
  // sendPasswordEmailReset(
  //   @Req() req: Request,
  //   @Body('email') email: string,
  // ): object {
  //   const ipAddress: string = req.socket.remoteAddress;
  //   const userEmail: string = (<any>req).user.email;
  //   return this.securityService.sendPasswordEmailReset(
  //     email,
  //     ipAddress,
  //     userEmail,
  //   );
  // }

  // @Post('setPasswordInDB')
  // setPasswordInDB(
  //   @Req() req: Request,
  //   @Body('password') password: string,
  // ): object {
  //   const uid: string = (<any>req).user.uid;
  //   return this.securityService.setPasswordInDB(uid, password);
  // }

  // @Post('addChangingPasswordDate')
  // @HttpCode(201)
  // addChangingPasswordDate(@Req() req: Request): object {
  //   const userID: string = (<any>req).user.uid;
  //   return this.securityService.addChangingPasswordDate(userID);
  // }

  // @Post('checkPreviousPasswords')
  // @HttpCode(200)
  // checkPreviousPasswords(
  //   @Req() req: Request,
  //   @Body('password') password: string,
  // ): object {
  //   const uid: string = (<any>req).user.uid;
  //   return this.securityService.checkPreviousPasswords(uid, password);
  // }

  @Post('disableInactiveUsers')
  @HttpCode(200)
  disableInactiveUsers(@Body('NumDays') numDays: number): object {
    return this.securityService.disableInactiveUsers(numDays);
  }

  
}
