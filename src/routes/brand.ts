import express, { Router } from "express";
import { brandsPreview, createNewBrand, deleteBrand, getAllBrands_Sorted } from "../controllers/brand";
import { verifyPermissions, verifyToken } from "../controllers/jwt";



const router : Router = express.Router();


const permissions = {
  create: ['create:brand'],
  read: ['read:brand'],
  update: ['update:brand'],
  delete: ['delete:brand']
};







////////////////////////                //////////////////
///////////////////////    DASH        //////////////////
/////////////////////                //////////////////
router.post("/create", verifyToken, verifyPermissions(permissions.create), createNewBrand);
router.delete("/delete/:id", verifyToken, verifyPermissions(permissions.delete), deleteBrand);











////////////////////////////////////////////////////////////
///////////////////////    FRONTS        //////////////////
//////////////////////////////////////////////////////////
router.get("/sorted", getAllBrands_Sorted);
router.get("/preview", brandsPreview);










export default router;
