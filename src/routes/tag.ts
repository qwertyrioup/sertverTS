import express from "express";

import {verifyToken} from "../controllers/jwt";
import { getTags, insertTags } from "../controllers/tag";
import verifyPermissions from "../controllers/verifyPermissions";


const router = express.Router();

// TAGS
const permissions = {
  create: ['create:tags'],
  read: ['read:tags'],
  update: ['update:tags'],
  delete: ['delete:tags']
};

////////////////////////                //////////////////
///////////////////////    DASH        //////////////////
/////////////////////                //////////////////
router.get("/getall", verifyToken, verifyPermissions(permissions.read), getTags);
// @ts-ignore
router.post("/insert", verifyToken, verifyPermissions(permissions.create), insertTags);
export default router;
