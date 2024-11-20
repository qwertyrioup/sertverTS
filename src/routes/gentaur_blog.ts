import express from 'express';
import { addBlog, updateBlog, deleteBlog, getBlogs, getBlog } from '../controllers/gentaur_blog';
import { Multer } from '../gentaur_helpers'; // For image uploads

const router = express.Router();

router.post('/add', addBlog);
// @ts-ignore
router.put('/Update/:id', Multer.single('cover'), updateBlog);
// @ts-ignore
router.delete('/delete/:id', deleteBlog);

router.get('/get-blogs', getBlogs);
// @ts-ignore
router.get('/get-one-blogs/:id', getBlog);

export default router;
