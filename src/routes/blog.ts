import express, {Router} from "express";
import { verifyPermissions, verifyToken } from "../controllers/jwt";
import { Multer } from "../helpers";
import { createBlog, deleteBlog, getAllBlogs, getBlog, getBlogById, updateBlog } from "../controllers/blog";



const router: Router = express.Router()

const permissions = {
    create: ['create:blog'],
    read: ['read:blog'],
    update: ['update:blog'],
    delete: ['delete:blog']
};


////////////////////////                //////////////////
///////////////////////    DASH        //////////////////
/////////////////////                //////////////////
router.post("/create", verifyToken, verifyPermissions(permissions.create), Multer.single("file"), createBlog);
router.delete("/delete/:id", verifyToken, verifyPermissions(permissions.delete), deleteBlog);
router.put("/updateBlog/:id", verifyToken, verifyPermissions(permissions.update), Multer.single("file"), updateBlog);
router.get("/getBlogById/:id", verifyToken, verifyPermissions(permissions.read), getBlogById);




////////////////////////////////////////////////////////////
///////////////////////    FRONTS        //////////////////
//////////////////////////////////////////////////////////
router.get("/getall", getAllBlogs);
router.get("/get", getBlog);














export default router;
