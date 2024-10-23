import { Request, Response, NextFunction } from "express";
import Popular from "../models/Popular";

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const populars = await Popular.find()
            .populate("product_data")
            .sort({ createdAt: -1 });
        res.status(200).json(populars);
    } catch (err) {
        next(err);
    }
};

export const deletePopular = async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    try {
        await Popular.deleteOne({ cat_affigen: id });
        res.status(200).send("Popular deleted successfully");
    } catch (err) {
        next(err);
    }
};

export const createPopular = async (req: Request, res: Response, next: NextFunction) => {
    const popular = new Popular({
        product_name: req.body.product_name,
        cat_affigen: req.body.cat_affigen,
        product_data: req.body.product_id,
    });

    try {
        const savedPopular = await popular.save();
        res.status(200).json(savedPopular);
    } catch (err) {
        next(err);
    }
};

export const getPopular = async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;

    try {
        const popular = await Popular.find({ cat_affigen: id });
        res.status(200).json(popular);
    } catch (err) {
        next(err);
    }
};
