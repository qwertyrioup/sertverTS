import * as jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { createError } from "../error";
import * as dotenv from "dotenv";
import User, { IUser } from "../models/User";
import { json } from "body-parser";

dotenv.config();

export const generateToken = (user: IUser) => {
  return jwt.sign(
    {
      id: String(user._id),
      //   @ts-ignore
      role: user.role.name,
      //   @ts-ignore
      permissions: user.role.permissions,
    },
    String(process.env.JWT_SEC),
    { expiresIn: "3d" }
  );
};

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token;
  //   @ts-ignore
  const authHeader: string = String(req.headers["cookie"]);

  if (authHeader) {
    token = authHeader.split("XYZ_TOKEN_ZYX=")[1]
  } else {
    token = String(req.query.token);
  }

  if (token) {
    const decoded = jwt.verify(token, String(process.env.JWT_SEC))

    jwt.verify(token, String(process.env.JWT_SEC), (err, user) => {
      if (err) return next(createError(403, "Token is not valid!"));
      //   @ts-ignore
      req.user = user;
      next();
    });
  } else {
    return next(createError(401, "You are not authenticated!"));
  }
};

export const verifyPermissions = (requiredPermissions: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // @ts-ignore
      const user: IUser | null = await User.findById(
        // @ts-ignore
        String(req.user.id)
      ).populate("role");
      if (!user) {
        return next(createError(404, "User not found"));
      }
      //   @ts-ignore
      if (!user.role || !user.role.permissions) {
        return next(createError(403, "Role or permissions not defined"));
      }
      //   @ts-ignore
      const userPermissions = user.role.permissions;
      const hasPermission = requiredPermissions.every((permission: any) =>
        userPermissions.includes(permission)
      );
      if (!hasPermission) {
        return next(
          createError(403, "You do not have permission to perform this action")
        );
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
