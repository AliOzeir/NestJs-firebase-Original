import * as functions from 'firebase-functions';
import { writeLogEntry } from '../logs/logs';
import { admin } from '../../config/firebaseConnection';

export const disableInactiveUsers = async () => {
  const inactiveUsers: admin.auth.UserRecord[] = await getInactiveUsers();
  const promises = [];
  for (const i in inactiveUsers) {
    const p = disableUser(inactiveUsers[i]);
    promises.push(p);
  }
  await Promise.all(promises);
  functions.logger.log('User cleanup finished');
};

// --- Disable one inactive user from the list.
function disableUser(user: admin.auth.UserRecord) {
  // Disable the inactive user.
  return admin
    .auth()
    .updateUser(user.uid, { disabled: true })
    .then(() => {
      const email = user.email || 'No Email Detected!';
      writeLogEntry(
        'INFO',
        email,
        'account_disabled',
        'No Detected IP Address',
        'User has been Disabled',
        'Inactive for 90 Days',
        '/disableInactiveUsers',
      );
      return functions.logger.log(
        'Disable user account',
        user.uid,
        'because of inactivity',
      );
    })
    .catch((error) => {
      return functions.logger.error(
        'Disable of inactive user account',
        user.uid,
        'failed:',
        error,
      );
    });
}

// --- Returns the list of all inactive users.
async function getInactiveUsers(
  users: admin.auth.UserRecord[] = [],
  nextPageToken?: string,
): Promise<admin.auth.UserRecord[]> {
  const result = await admin.auth().listUsers(1000, nextPageToken);
  // Find users that have not signed in in the last 90 days.
  const inactiveUsers: admin.auth.UserRecord[] = result.users.filter(
    (user) =>
      user.disabled === false &&
      Date.parse(user.metadata.lastSignInTime) <
        Date.now() - 90 * 24 * 60 * 60 * 1000,
  );
  users = users.concat(inactiveUsers);
  if (result.pageToken) {
    return getInactiveUsers(users, result.pageToken);
  }
  return users;
}
