import express, { Router } from "express";
import { createOrder } from "../controllers/order";



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
router.post("/create", createOrder);






export default router;
