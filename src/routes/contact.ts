import express from "express";
import { create, getContact, getall } from "../controllers/contact";
import { verifyToken, verifyTokenAndRole } from "../controllers/jwt";
import verifyPermissions from "../controllers/verifyPermissions";

// Creating an Express router
const router = express.Router();

const permissions = {
  read: ['read:contact'],
};

////////////////////////////////////////////////////////////
///////////////////////    DASH        //////////////////
//////////////////////////////////////////////////////////
router.get("/get", verifyToken, verifyPermissions(permissions.read), getall);
router.get("/get/:id", verifyToken, verifyPermissions(permissions.read), getContact);

////////////////////////////////////////////////////////////
///////////////////////    FRONTS        //////////////////
//////////////////////////////////////////////////////////
router.post("/create", create);

export default router;
