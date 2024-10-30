import express, { Router } from "express";
import { verifyPermissions, verifyToken } from "../controllers/jwt";
import { getAllSuppliers } from "../controllers/supplier";



const router: Router = express.Router()

const permissions = {
    // create: ['create:blog'],
    read: ['read:suppliers'],
    // update: ['update:blog'],
    // delete: ['delete:blog']
};



router.get("/",verifyToken, verifyPermissions(permissions.read) ,getAllSuppliers);















export default router;
