import { Request, Response } from 'express';
import Blog from '../models/Gentaur_blog';

// Add a new blog
export const addBlog = async (req: Request, res: Response) => {
  try {
    const { title, description, content, tags, metaTitle, metaDescription, metaKeywords, publish } = req.body;
    const coverUrl = req.file?.path || '';

    const blog = new Blog({
      title,
      description,
      content,
      coverUrl,
      tags,
      metaTitle,
      metaDescription,
      metaKeywords,
      publish,
    });
    await blog.save();
    res.status(201).json({ message: 'Blog created successfully', blog });
  } catch (error) {
    res.status(500).json({ message: 'Error creating blog', error });
  }
};

// Update a blog
export const updateBlog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, content, tags, metaTitle, metaDescription, metaKeywords, publish } = req.body;
    const coverUrl = req.file?.path || undefined;

    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      { title, description, content, coverUrl, tags, metaTitle, metaDescription, metaKeywords, publish },
      { new: true }
    );

    if (!updatedBlog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.status(200).json({ message: 'Blog updated successfully', blog: updatedBlog });
  } catch (error) {
    res.status(500).json({ message: 'Error updating blog', error });
  }
};

// Delete a blog
export const deleteBlog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findByIdAndDelete(id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.status(200).json({ message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting blog', error });
  }
};

// Get all blogs
export const getBlogs = async (req: Request, res: Response) => {
  try {
    const blogs = await Blog.find();
    res.status(200).json(blogs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blogs', error });
  }
};

// Get a single blog
export const getBlog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.status(200).json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blog', error });
  }
};
