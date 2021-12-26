export class UpdateUserDto {
  readonly email?: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly phoneNumber?: string;
  readonly disabled?: boolean;
  readonly role?: string;
}
