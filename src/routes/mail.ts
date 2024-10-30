import express, { Router } from "express";
import { create } from "../controllers/mail";


const router : Router = express.Router();


// const permissions = {
//   create: ['create:brand'],
//   read: ['read:brand'],
//   update: ['update:brand'],
//   delete: ['delete:brand']
// };







////////////////////////                //////////////////
///////////////////////    DASH        //////////////////
/////////////////////                //////////////////
router.post("/create", create);






export default router;
