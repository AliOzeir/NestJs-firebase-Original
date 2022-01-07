import * as functions from 'firebase-functions';
import { writeLogEntry } from '../logs/logs';
import { admin } from '../../config/firebaseConnection';
import { HttpException, HttpStatus } from '@nestjs/common';

export const disableInactiveUsers = async (numDays: number) => {
  try {
    const inactiveUsers: admin.auth.UserRecord[] = await getInactiveUsers(
      numDays,
    );
    if (inactiveUsers.length === 0) {
      return {
        message: 'No Inactive users to disable!',
        disabledUsersEmails: [],
      };
    } else {
      const promises = [];
      const UsersEmails = [];
      for (const i in inactiveUsers) {
        UsersEmails.push(inactiveUsers[i].email);
        const p = disableUser(inactiveUsers[i]);
        promises.push(p);
      }
      await Promise.all(promises);
      return {
        message: 'Some Users have been disabled Successfully',
        disabledUsersEmails: UsersEmails,
      };
    }
  } catch (error) {
    throw new HttpException(
      {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
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
  numDays,
  users: admin.auth.UserRecord[] = [],
  nextPageToken?: string,
): Promise<admin.auth.UserRecord[]> {
  const result = await admin.auth().listUsers(1000, nextPageToken);
  // Find users that have not signed in in the last 90 days.
  const inactiveUsers: admin.auth.UserRecord[] = result.users.filter(
    (user) =>
      user.disabled === false &&
      Date.parse(user.metadata.lastSignInTime) <
        Date.now() - numDays * 24 * 60 * 60 * 1000,
  );
  users = users.concat(inactiveUsers);
  if (result.pageToken) {
    return getInactiveUsers(numDays, users, result.pageToken);
  }

  return users;
}
