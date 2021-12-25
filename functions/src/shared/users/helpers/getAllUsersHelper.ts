import { admin } from '../../../config/firebaseConnection';

export const getAllUsersHelper = async (
  users: admin.auth.UserRecord[] = [],
  nextPageToken?: string,
): Promise<admin.auth.UserRecord[]> => {
  const result = await admin.auth().listUsers(1000, nextPageToken).catch(error => error);
  users = users.concat(result.users);
  if (result.pageToken) {
    return getAllUsersHelper(users, result.pageToken);
  }
  return users;
};
