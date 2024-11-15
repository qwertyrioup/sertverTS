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



export const getSupplierById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Access the id directly from req.params
    const { id } = req.params;

    // Find the supplier by id
    const supplier = await Supplier.findOne({ id });

    // Check if the supplier is found, if not, send a 404 response and stop further execution
    if (!supplier) {
      return next(createError(404, 'Supplier not found'));
    }

    // If supplier is found, send it as the response
    res.status(200).json(supplier);
  } catch (err) {
    // In case of any error, pass it to the error-handling middleware
    next(err);
  }
};
export const updateSupplierById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Access the id directly from req.params
    const { id } = req.params;

    // Find the supplier by id
    const supplier = await Supplier.findOneAndUpdate({ id: id }, {$set: {...req.body}}, {new: true});

    // Check if the supplier is found, if not, send a 404 response and stop further execution
    if (!supplier) {
      return next(createError(404, 'Supplier not updated'));
    }

    // If supplier is found, send it as the response
    res.status(200).json('supplier updated successfully');
  } catch (err) {
    // In case of any error, pass it to the error-handling middleware
    next(err);
  }
};
