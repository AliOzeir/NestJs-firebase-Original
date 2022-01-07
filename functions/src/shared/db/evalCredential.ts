import { HttpException, HttpStatus } from '@nestjs/common';
import * as cors from 'cors';
import * as bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { admin } from 'src/config/firebaseConnection';
import { validateFirebaseIdToken } from '../middleware/verifyToken.express';

const db = admin.firestore();

export const evalCredential = (req: Request, res: Response) => {
  cors()(req, res, () => {
    validateFirebaseIdToken(req, res, async () => {
      if (req.method !== 'POST') {
        res.status(404).json({
          statusCode: 404,
          message: `Cannot ${req.method} /evalCredential`,
          error: 'Not Found',
        });
      }
      const uid = (<any>req).user.uid;
      const option = req.body.option;
      const newPassword = req.body.password;
      if (option === 'CHECK') {
        return await db
          .collection('U-Pass')
          .doc(uid)
          .get()
          .then(async (docShot) => {
            if (docShot.exists) {
              const passwords = docShot?.data()?.passwords;
              if (passwords !== undefined || passwords.length !== 0) {
                const responses = [];
                for (const i in passwords) {
                  const response = checkPasswords(passwords[i], newPassword);
                  responses.push(response);
                }
                const responsesArray = await Promise.all(responses);
                for (let i = 0; i < responsesArray.length; i++) {
                  if (responsesArray[i] === true) {
                    res.status(200).json({ success: false, message: "The New Password matches one of the Previous Passwords!" });
                  }
                }
                res
                  .status(200)
                  .json({
                    success: true,
                    message:
                      "The New Password doesn't match any Previous Password!",
                  });
              } else {
                throw new Error('No Passwords in Firestore!');
              }
            }
          })
          .catch((error) => {
            if (error.message === 'No Passwords in Firestore!') {
              res.status(404).json({
                status: HttpStatus.NOT_FOUND,
                message: 'No Passwords in Firestore!',
              });
            }
            res.status(500).json({ status: 500, error });
          });
      } else if (option === 'SAVE') {
        try {
          const salt = await bcrypt.genSalt(10);
          const hashPassword = await bcrypt.hash(newPassword, salt);
          const doc = db.collection('U-Pass').doc(uid);
          return await doc
            .get()
            .then(async (docShot) => {
              if (docShot.exists) {
                const passwords = docShot.get('passwords');
                if (passwords.length === 24) {
                  await doc
                    .update({
                      passwords: admin.firestore.FieldValue.arrayRemove(
                        passwords[0],
                      ),
                    })
                    .catch((error) => {
                      res.status(500).json({ status: 500, error });
                    });
                }
                return await doc
                  .update({
                    passwords:
                      admin.firestore.FieldValue.arrayUnion(hashPassword),
                  })
                  .then(async () => {
                    return await admin
                      .auth()
                      .setCustomUserClaims(uid, {
                        lastChangedPassword: new Date(),
                      })
                      .then(() => {
                        res.status(201).json({
                          message:
                            'Hashed Password has been Successfully added to Firestore!',
                        });
                      })
                      .catch((error) => {
                        res.status(500).json({ status: 500, error });
                      });
                  })
                  .catch((error) => {
                    res.status(500).json({ status: 500, error });
                  });
              } else {
                return await doc
                  .set({
                    passwords: [hashPassword],
                  })
                  .then(async () => {
                    res.status(201).json({
                      message:
                        'Hashed Password has been Successfully added to Firestore!',
                    });
                  })
                  .catch((error) => {
                    res.status(500).json({ status: 500, error });
                  });
              }
            })
            .catch((error) => {
              res.status(500).json({ status: 500, error });
            });
        } catch (error) {
          res.status(500).json({ status: 500, error });
        }
      } else {
        res.status(400).json({
          status: 400,
          message: `Invalid Option. ${option} is not valid!`,
        });
      }
    });
  });
};

// --- Check if the passwords are equal
const checkPasswords = async (encryptedPassword: string, password: string) => {
  try {
    const result = await bcrypt.compare(password, encryptedPassword);
    if (result) {
      return true;
    } else {
      return false;
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
