import mongoose, { Document } from "mongoose";
import bcrypt from "bcryptjs";
import { generateToken } from "./jwt";

import Role, { IRole } from "../models/Role";
import { createError } from "../error";
// import { uploadFile } from "./multer";
import { Request, Response, NextFunction } from "express";
import User, { IUser } from "../models/User";


// Utility function to generate JWT


export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt);

    // Check if a role is provided, if not, find the default role
    let roleId;
    if (req.body.role) {
      roleId = req.body.role; // Use the role provided from the frontend
    } else {
      const defaultRole = await Role.findOne({ name: "CLIENT" });
      if (!defaultRole) return next(createError(404, "Default role not found"));
      roleId = defaultRole._id; // Use the default role ID
    }

    const newUser = new User({
      ...req.body,
      password: hash,
      role: roleId, // Set the role
    });

    const savedUser = await newUser.save();
    if (!savedUser) return next(createError(404, "Cannot create user"));

    const user = await User.findById(savedUser._id).populate("role");
    const accessToken = generateToken(user as IUser & Document);

    const { ...others } = user;
    res.status(200).json({ ...others, accessToken });
  } catch (err) {
    console.log("error", err);
    next(err);
  }
};


export const updateUserPassword = async (req: Request, res: Response, next: NextFunction) => {
  let { oldPassword, newPassword } = req.body;
  let id  = req.params.id;

  try {
    const user = await User.findById(id);
    if (!user) return next(createError(404, "User not found!"));

    const isCorrect = await bcrypt.compare(oldPassword, user.password);

    if (!isCorrect) return next(createError(400, "Old password is wrong!"));

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(newPassword, salt);

    user.password = hash;

    const savedUser = await user.save();
    const { password, ...others } = savedUser;
    res.status(200).json({ ...others });
  } catch (err) {
    next(err);
  }
};
export const updateUserPasswordByAdmin = async (req: Request, res: Response, next: NextFunction) => {
  let { notify ,Password } = req.body;
  let id  = req.params.id;

  try {
    const user = await User.findById(id);
    if (!user) return next(createError(404, "User not found!"));

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(Password, salt);

    user.password = hash;

    const savedUser = await user.save();
    const { password, ...others } = savedUser;
    if (notify){
      //@TODO: we put the mailing service hear and we send the non encripted password
    }
    res.status(200).json({ ...others });
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  let fieldsANDvalues: Record<string, any> = {};

  // Parse JSON data directly from request body
  console.log('boddy',req.body);
  if (req.body) {
    fieldsANDvalues = req.body.payload; // assuming `req.body` already contains the parsed JSON object
  } else {
    console.error("Request body is empty or improperly formatted");
    return next(new Error("Invalid request body"));
  }

  // Convert `role` to ObjectId if it is a string
  if (fieldsANDvalues.role && typeof fieldsANDvalues.role === "string") {
    try {
      fieldsANDvalues.role = new mongoose.Types.ObjectId(fieldsANDvalues.role);
    } catch (error) {
      console.error("Invalid role ObjectId format:", error);
      return next(new Error("Invalid role ID format"));
    }
  }

  // Ensure password field is not included in updates
  delete fieldsANDvalues.password;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: fieldsANDvalues },
      { new: true, runValidators: true } // Use runValidators to enforce schema validation
    )
      .populate("role")
      .lean();

    if (!updatedUser) {
      console.error("User not found for the given ID:", req.params.id);
      return res.status(404).json({ message: "User not found" });
    }

    // Remove password from the response for security
    const { password, ...userWithoutPassword } = updatedUser;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Error updating user:", error);
    next(error);
  }
};
export const createByAdmin = async (req: Request, res: Response, next: NextFunction) => {
  let fieldsANDvalues: any = {};

  if (req.body.data) {
    try {
      const data = JSON.parse(req.body.data);
      const { password, ...others } = data;
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      fieldsANDvalues = { ...others, password: hash };

      if (fieldsANDvalues.role && typeof fieldsANDvalues.role === "string") {
        fieldsANDvalues.role = new mongoose.Types.ObjectId(fieldsANDvalues.role);
      }
    } catch (error) {
      return next(new Error("Invalid JSON data"));
    }
  }

  // if (req.file) {
  //   try {
  //     const publicUrl = await uploadFile(req.file);
  //     fieldsANDvalues.photoURL = publicUrl;
  //   } catch (error) {
  //     return next(error);
  //   }
  // }

  try {
    const newUser = new User({ ...fieldsANDvalues });
    const savedUser = await newUser.save();

    if (!savedUser) {
      return res.status(404).json({ message: "Cannot create user" });
    }

    const { password, ...others } = savedUser.toObject();
    res.status(200).json(others);
  } catch (error) {
    next(error);
  }
};

export const findAll = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.params.id;
  try {
    const users = await User.find({ _id: { $ne: userId } })
      .select("_id firstname lastname email phoneNumber address role")
      .populate("role");
    if (!users) return next(createError(404, "No users!"));

    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};

export const getUserCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await User.countDocuments();
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};

export const getSimpleUserCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const viewerRole = await Role.findOne({ name: "VIEWER" });
    if (!viewerRole) return next(createError(404, "Viewer role not found!"));
    const users = await User.countDocuments({ role: viewerRole._id });
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};

export const getAdminUserCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminRole = await Role.findOne({ name: "ADMIN" });
    const superAdminRole = await Role.findOne({ name: "SUPERADMIN" });
    if (!adminRole || !superAdminRole) return next(createError(404, "Admin roles not found!"));
    const users = await User.countDocuments({
      role: { $in: [adminRole._id, superAdminRole._id] },
    });
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  let id = req.params.id;
  try {
    await User.findByIdAndDelete(id);
    res.status(200).json("User Deleted Successfully!");
  } catch (err) {
    next(err);
  }
};

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  let id = req.params.id;
  try {
    const user = await User.findById(id).populate("role");
    if (!user) return next(createError(404, "User not found!"));
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};
