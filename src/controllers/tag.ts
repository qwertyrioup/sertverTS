import { Request, Response, NextFunction } from "express";
import Tag from "../models/Tag";

export const getTags = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tags = await Tag.find();
        res.status(200).json(tags);
    } catch (error) {
        next(error);
    }
};

export const insertTags = async (req: Request, res: Response, next: NextFunction) => {
    const { tags } = req.body; // Expecting an array of tags in the request body

    if (!Array.isArray(tags)) {
        return res.status(400).json({ error: "Tags should be an array" });
    }

    try {
        const existingTags = await Tag.find({ name: { $in: tags } });
        const existingTagNames = existingTags.map(tag => tag.name);
        const newTags = tags.filter(tag => !existingTagNames.includes(tag));

        if (newTags.length > 0) {
            const newTagDocs = newTags.map(tag => ({ name: tag }));
            await Tag.insertMany(newTagDocs);
        }

        res.status(200).json({ message: "Tags processed successfully" });
    } catch (error) {
        next(error);
    }
};
