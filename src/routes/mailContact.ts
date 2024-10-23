import express, { Router } from "express";
import { verifyToken } from "../controllers/jwt";
import { create, getall } from "../controllers/mailContact";
import verifyPermissions from "../controllers/verifyPermissions";

const router: Router = express.Router();

const permissions = {
    read: ['read:mails'],
};

////////////////////////////////////////////////////////////
///////////////////////    DASH        //////////////////
//////////////////////////////////////////////////////////
router.get("/get", verifyToken, verifyPermissions(permissions.read), getall);

////////////////////////////////////////////////////////////
///////////////////////    FRONTS        //////////////////
//////////////////////////////////////////////////////////
router.post("/create", create);

export default router;
