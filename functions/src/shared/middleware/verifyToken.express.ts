import * as functions from "firebase-functions";
import { admin } from "../../config/firebaseConnection";
import { Request, Response, NextFunction } from "express";
import { HttpStatus } from "@nestjs/common";

const validateFirebaseIdToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  functions.logger.log("Check if request is authorized with Firebase ID token");
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer ")
  ) {
    functions.logger.error(
      "No Firebase ID token was passed as a Bearer token in the Authorization header.",
      "Make sure you authorize your request by providing the following HTTP header:",
      "Authorization: Bearer <Firebase ID Token>"
    );
    res.status(401).json({statusCode: HttpStatus.UNAUTHORIZED, message: 'Not authorized.'});
    return;
  }

  let idToken: string;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    functions.logger.log('Found "Authorization" header');
    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split("Bearer ")[1];
  } else {
   res
     .status(401)
     .json({ statusCode: HttpStatus.UNAUTHORIZED, message: 'Not authorized.' });
    return;
  }

  try {
    const decodedIdToken = await admin.auth().verifyIdToken(idToken);
    functions.logger.log("ID Token correctly decoded", decodedIdToken);
    (<any>req).user = decodedIdToken;
    next();
    return;
  } catch (error) {
    functions.logger.error("Error while verifying Firebase ID token:", error);
    res
      .status(401)
      .json({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Not authorized.',
      });
    return;
  }
};

export { validateFirebaseIdToken };
