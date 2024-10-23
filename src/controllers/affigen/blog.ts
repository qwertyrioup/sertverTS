import { Request, Response, NextFunction } from "express";
import { parseJSON, uploadFile } from "../../helpers";
import Blog, { IBlog } from "../../models/affigen/Blog";
import { createError } from "../../error";


// Helper to validate required fields
const validateRequiredFields = (data: any, next: NextFunction): boolean => {
  if (!data.title || !data.userId || !data.content) {
    next(createError(400, "missing required fields"));
    return false;
  }
  return true;
};

// Create Blog
export const createBlog = async (req: Request, res: Response, next: NextFunction) => {
  let data = req.body.data ? parseJSON(req.body.data, next) : {};
  if (!data || !validateRequiredFields(data, next)) return;

  if (!req.file) {
    next(createError(400, "please upload a cover for your blog"))
  }

  try {
    const coverUrl = await uploadFile(req.file);
    const newBlog = new Blog({ ...data, cover: coverUrl });
    await newBlog.save();
    res.status(200).json("blog saved successfully");
  } catch (err) {
    next(err);
  }
};

// Delete Blog
export const deleteBlog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deletedBlog = await Blog.findByIdAndDelete(String(req.params.id));
    if (!deletedBlog) {
      next(createError(404, "blog not found"));
    }
    res.status(200).json("blog has been deleted.");
  } catch (err) {
    next(err);
  }
};

// Update Blog
export const updateBlog = async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id;
  const data = req.body.data ? parseJSON(req.body.data, next) : {};
  if (!data) return;

  try {
    const existingBlog: IBlog | null = await Blog.findById(id);
    if (!existingBlog) {
      next(createError(404, "blog not found"));
    }

    let coverUrl: string = existingBlog?.cover ?? '';
    if (req.file) {
      coverUrl = await uploadFile(req.file)
    }

    const updateData = {
        title: data.title || existingBlog?.title || '',
        content: data.content || existingBlog?.content || '',
        description: data.description || existingBlog?.description || '',
        userId: data.userId || existingBlog?.userId || '',
        cover: coverUrl,
        platform: data.platform || existingBlog?.platform || 'both',
        tags: data.tags && data.tags.length ? data.tags : existingBlog?.tags || [],
        metaTitle: data.metaTitle || existingBlog?.metaTitle || '',
        metaDescription: data.metaDescription || existingBlog?.metaDescription || '',
        metaKeywords: data.metaKeywords && data.metaKeywords.length ? data.metaKeywords : existingBlog?.metaKeywords || [],
        publish: data.publish !== undefined ? data.publish : existingBlog?.publish || false,
        comments: data.comments !== undefined ? data.comments : existingBlog?.comments || false,
      };

    await Blog.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    res.status(200).json("blog successfully updated");
  } catch (err) {
    next(createError(500, "error updating blog"));
  }
};

// Get Blog by ID
export const getBlogById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const blog: IBlog | null = await Blog.findById(req.params.id);
    if (!blog) {
      next(createError(404, "blog not found"));
    }
    res.status(200).json(blog);
  } catch (err) {
    next(err);
  }
};

// Get All Blogs with Domain Filtering
export const getAllBlogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const domain = req.headers['x-domain'];
    let filter = {};

    if (domain && domain !== 'dash') {
      filter = { platform: { $in: [domain, 'both'] } };
    } else if (!domain || domain === 'dash') {
      filter = {};
    } else {
      res.status(200).json([]);
    }

    const blogs: IBlog[] = await Blog.find(filter).sort({ updatedAt: -1 });
    res.status(200).json(blogs);
  } catch (err) {
    next(err);
  }
};

// Get Blog by Title
export const getBlog = async (req: Request, res: Response, next: NextFunction) => {
  const title = req.query.title as string;
  if (!title) next(createError(400, "title is required"));

  try {
    const blog: IBlog | null = await Blog.findOne({ title });
    if (!blog) {
      next(createError(404, "blog not found"));
    }
    res.status(200).json(blog);
  } catch (err) {
    next(err);
  }
};
