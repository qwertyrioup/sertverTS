import { Request, Response, NextFunction } from "express";
import User, { IUser } from "../models/User";
import { createError } from "../error";
import bcrypt from "bcryptjs";
import { generateToken } from "./jwt";





export const signin = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const user: IUser|null = await User.findOne({email: req.body.email}).populate("role")

        if (!user) {
          console.error("User not found");
          return next(createError(404, "User not found!"));
        }

        const isCorrect = await bcrypt.compare(req.body.password, user.password);
        if (!isCorrect) {
          console.error("Wrong Credentials");
          return next(createError(400, "Wrong Credentials!"));
        }

        const accessToken = generateToken(user);
        res.cookie('accessToken', String(accessToken), { httpOnly: true });
        // @ts-ignore
        if (!user._doc) {
          console.error("User document is null");
          return next(createError(500, "User document is null"));
        }
        // @ts-ignore
        const { password, ...others } = user._doc;
        res.status(200).json({ ...others });
      } catch (err) {
        console.error("Error during sign in:", err);
        next(err);
      }
  };
