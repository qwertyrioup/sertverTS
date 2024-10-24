// auth.js (route file)
import express, { Router } from "express";
import { verifyPermissions, verifyToken } from "../controllers/jwt";
import { getAllRoles } from "../controllers/role";



const router : Router = express.Router();

const SUPER_ADMIN = ["read:roles"]


router.get("/", verifyToken, verifyPermissions(SUPER_ADMIN), getAllRoles);


export default router;
