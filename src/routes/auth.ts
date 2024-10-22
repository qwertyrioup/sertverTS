// auth.js (route file)
import express, {Router} from "express";
import { signin } from "../controllers/auth";



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


export default router;
