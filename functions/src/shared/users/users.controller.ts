import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './users.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('getAllUsers')
  getAllUsers(): object {
    return this.userService.getAllUsers();
  }

  @Get('getUser/:uid')
  getUser(@Param('uid') uid: string): object {
    return this.userService.getUser(uid);
  }

  @Post('createUser')
  addUser(@Req() req: Request, @Body() createUserDto: CreateUserDto): object {
    const ipAddress = req.socket.remoteAddress;
    const userEmail = (<any>req).user.email;
    return this.userService.addUser(createUserDto, ipAddress, userEmail);
  }

  @Put('updateUser/:uid')
  updateUser(
    @Req() req: Request,
    @Param('uid') uid: string,
    @Body() updateUserDto: UpdateUserDto,
  ): object {
    const ipAddress = req.socket.remoteAddress;
    const userEmail = (<any>req).user.email;
    return this.userService.updateUser(
      updateUserDto,
      uid,
      ipAddress,
      userEmail,
    );
  }

  @Delete('deleteUser/:uid')
  deleteUser(@Param('uid') uid: string, @Req() req: Request): object {
    const ipAddress = req.socket.remoteAddress;
    const userEmail = (<any>req).user.email;
    return this.userService.deleteUser(uid, ipAddress, userEmail);
  }
}
