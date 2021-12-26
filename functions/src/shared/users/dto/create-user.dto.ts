export class CreateUserDto {
  readonly email: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly password?: string;
  readonly phoneNumber?: string;
  readonly role?: string;
}
