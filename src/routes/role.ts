// auth.js (route file)
import express, {Router} from "express";
import { signin } from "../controllers/auth";
import { getAllRoles } from "../controllers/role";
import { verifyPermissions, verifyToken } from "../controllers/jwt";



const router : Router = express.Router();

const SUPER_ADMIN = ["read:roles"]


router.get("/", verifyToken, verifyPermissions(SUPER_ADMIN), getAllRoles);


export default router;
