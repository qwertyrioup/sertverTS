import { Request, Response, NextFunction } from "express";
import Category from "../models/Category";

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await Category.find().distinct("category");
    res.status(200).json(categories);
  } catch (err) {
    next(err);
  }
};
