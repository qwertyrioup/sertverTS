// auth.js (route file)
import express, {Router} from "express";
import { getUser, signin } from "../controllers/olde_auth";
import { verifyToken } from "../controllers/jwt";



const router : Router = express.Router();

// const permissions = {
//   createAdmin: ["create:admin"],
//   readAdmin: ["read:admin"],
//   updateAdmin: ["update:admin"],
//   deleteAdmin: ["delete:admin"],
//   readUser: ["read:user"],
//   updateUser: ["update:user"],
//   deleteUser: ["delete:user"],
// };


router.post("/signin", signin);
router.get("/me", verifyToken, getUser);


export default router;