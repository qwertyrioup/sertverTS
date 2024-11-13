import bcrypt from "bcryptjs";
import { NextFunction, Request, Response } from "express";
import { createError } from "../error";
import User, { IUser } from "../models/User";
import { generateToken } from "./jwt";

export const signin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findOne({
      email: req.body.email,
    }).populate("role");

    if (!user) {
      console.error("User not found");
      return next(createError(404, "User not found!"));
    }

    const isCorrect = await bcrypt.compare(req.body.password, user.password);
    if (!isCorrect) {
      console.error("Wrong Credentials");
      return next(createError(400, "Wrong Credentials!"));
    }

    // Generate the access token
    const accessToken = generateToken(user);

    // Extract the permissions from the user's role
    const permissions = user.role ? user.role : [];

    // Set the token as a cookie (optional)
    res.cookie("XYZ_TOKEN_ZYX", String(accessToken), {
      httpOnly: true,
    });

    // Return the response in the format expected by the frontend
    res.status(200).json({
      accessToken: accessToken,
      user: {
        id: user._id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        country: user.country,
        address: user.address
        // add other user properties if needed
      },
      permissions,
    });
  } catch (err) {
    next(err);
  }
};


export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // @ts-ignore
    const decoded = req.user

    if (!decoded) {
      return next(createError(403, "Invalid or expired token"));
    }

    const userId = decoded.id; // Extract user ID from the decoded token
    const user: IUser | null = await User.findById(userId).populate("role");

    if (!user) {
      return next(createError(404, "User not found!"));
    }

    // Exclude the password from the response
    const { password, ...userDetails } = user.toObject();
    console.error(userDetails);
    res.status(200).json(userDetails);
  } catch (err) {
    next(err);
  }
};

export const revalidateAuth = async (  req: Request,
                                       res: Response,
                                       next: NextFunction) => {

  try {
    // @ts-ignore

    console.log("userId",req.user)
    // @ts-ignore
    let userId = req.user.id;

    const user: IUser | null = await User.findById(userId).populate("role");

    if (!user) return next(createError(404, "User not found!"));
    const { password, ...userDetails } = user.toObject();

    res.status(200).json(userDetails);
  } catch (err) {
    next(err);
  }
};