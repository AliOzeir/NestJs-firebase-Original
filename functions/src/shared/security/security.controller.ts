import { Body, Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { SecurityService } from './security.service';

@Controller('security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Post('sendPasswordResetEmail')
  sendPasswordEmailReset(
    @Req() req: Request,
    @Body('email') email: string,
  ): object {
    const ipAddress: string = req.socket.remoteAddress;
    const userEmail: string = (<any>req).user.email;
    return this.securityService.sendPasswordEmailReset(
      email,
      ipAddress,
      userEmail,
    );
  }

  @Post('hashPassword')
  hashPassword(@Body('password') password: string): object {
    return this.securityService.hashPassword(password);
  }

  @Post('checkPasswords')
  checkPasswords(
    @Body('password') password: string,
    @Body('EncryptedPassword') encryptedPassword: string,
  ): object {
    return this.securityService.checkPasswords(password, encryptedPassword);
  }

  @Post('addChangingPasswordDate')
  addChangingPasswordDate(@Req() req: Request): object {
    const userID: string = (<any>req).user.uid;
    return this.securityService.addChangingPasswordDate(userID);
  }

  @Post('setNewPassword')
  setNewPassword(
    @Body('uid') uid: string,
    @Body('hashPassword') hashPassword: string,
  ): object {
    return this.securityService.setNewPassword(uid, hashPassword);
  }

  @Post('getHashedPasswords')
  getUsersHashedPasswords(@Body('uid') uid: string): object {
    return this.securityService.getUsersHashedPasswords(uid);
  }
}
