import { Request, Response, NextFunction } from "express";
import User from "../models/User.js";
import { createError } from "../error.js";

const verifyPermissions = (requiredPermissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await User.findById(req.user.id).populate("role");
      if (!user) {
        return next(createError(404, "User not found"));
      }
      if (!user.role || !user.role.permissions) {
        return next(createError(403, "Role or permissions not defined"));
      }
      const userPermissions: string[] = user.role.permissions;
      const hasPermission = requiredPermissions.every((permission) =>
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

export default verifyPermissions;
// brand;
// categorie;
// contact;
// mailcontact;
// order;
// popular;
// tag;
