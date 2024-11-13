// auth.js (route file)
import express, { Router } from "express";
import { verifyPermissions, verifyToken } from "../controllers/jwt";
import { getAllRoles } from "../controllers/role";



const router : Router = express.Router();

const SUPER_ADMIN = ["read:roles"]


router.get("/", getAllRoles);


export default router;
