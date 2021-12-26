import { auth } from 'firebase-admin';
import { UserFormat } from '../interfaces/UserFormat.interface';

export const format = (user: auth.UserRecord) => {
  const userFormat: UserFormat = {
    firstName: user.displayName?.split(' ')[0]
      ? user.displayName?.split(' ')[0]
      : '',
    lastName: user.displayName?.split(' ')[1]
      ? user.displayName?.split(' ')[1]
      : '',
    role: user.customClaims?.role ? user.customClaims?.role : '',
    email: user.email ? user.email : '',
  };
  return userFormat;
};
