// auth.ts (route file)
import express, { Router } from "express";
import {
  createByAdmin,
  deleteUser,
  findAll,
  getAdminUserCount,
  getSimpleUserCount,
  getUser,
  getUserCount,
  signup,
  updateUser,
  updateUserPassword, updateUserPasswordByAdmin
} from "../controllers/users";


const router: Router = express.Router();

type Permissions = {
  createAdmin: string[];
  readAdmin: string[];
  updateAdmin: string[];
  deleteAdmin: string[];
  readUser: string[];
  updateUser: string[];
  deleteUser: string[];
};

const permissions: Permissions = {
  createAdmin: ["create:admin"],
  readAdmin: ["read:admin"],
  updateAdmin: ["update:admin"],
  deleteAdmin: ["delete:admin"],
  readUser: ["read:user"],
  updateUser: ["update:user"],
  deleteUser: ["delete:user"],
};

// AUTHENTICATION
router.post("/signup", signup);

////////////////////////                //////////////////
///////////////////////    DASH        //////////////////
/////////////////////                //////////////////

router.get("/count", getUserCount);
router.get("/count-admins",  getAdminUserCount);
router.get("/count-simple", getSimpleUserCount);
router.get("/findall", findAll);
// router.post("/createbyadmin", verifyToken, verifyPermissions(permissions.createAdmin), Multer.single("file"), createByAdmin);
router.delete("/:id", deleteUser);
// @ts-ignore
router.put("/updateunderuser/:id", updateUser);
router.delete("/deletebyadmin/:id", deleteUser);
router.get("/getuser/:id", getUser);
router.put("/update-password/:id", updateUserPassword);
router.put("/update-password-by-admin/:id", updateUserPasswordByAdmin);

////////////////////////////////////////////////////////////
///////////////////////    FRONTS        //////////////////
//////////////////////////////////////////////////////////
// router.put("/update/:id", Multer.single("file"), updateUser);

export default router;
