import { NextFunction, Request, Response } from "express";
import { createError } from "../error";
import Supplier from "../models/Supplier";



export const getAllSuppliers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const suppliers = await Supplier.find();
    if (!suppliers) {
      next(createError(404, "suppliers not found"));
    }
    res.status(200).json(suppliers);
  } catch (err) {
    next(err);
  }
};
