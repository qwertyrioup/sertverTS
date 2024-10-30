// auth.js (route file)
import express, { Router } from "express";

import { Multer } from "../affigen_helpers";
import { APPLY_FILTER_AND_CHILDRENS_FOR_ALL_GENTAUR_PRODUCTS, createProduct, deleteProduct, downloadBackup, editProduct, getAllProducts, getCountsForAllBrands, getProduct, getProductsByIds } from "../controllers/gentaur_product";
import { verifyPermissions, verifyToken } from "../controllers/jwt";



const router: Router = express.Router()


const permissions = {
    create: ['create:odoo', 'create_filters'],
    read: ['read:odoo'],
    update: ['update:odoo'],
    delete: ['delete:odoo'],
    backup: ['backup:odoo'],
};


////////////////////////                //////////////////
///////////////////////    DASH        //////////////////
/////////////////////                //////////////////
router.get("/count/brands", verifyToken, verifyPermissions(permissions.read), getCountsForAllBrands);
router.post('/create', verifyToken, verifyPermissions(permissions.create), Multer.array("files", 10), createProduct);
router.put('/edit/:id', verifyToken, verifyPermissions(permissions.update), Multer.array("files", 10), editProduct);
router.delete("/delete/:id", verifyToken, verifyPermissions(permissions.delete), deleteProduct);
router.post("/add-filter-and-childrens", verifyToken, verifyPermissions(permissions.create), APPLY_FILTER_AND_CHILDRENS_FOR_ALL_GENTAUR_PRODUCTS);
router.post("/bulk-download-products", verifyToken, verifyPermissions(permissions.read), getProductsByIds);
router.get('/backup-products', verifyToken, verifyPermissions(permissions.backup), downloadBackup);
///////////////////////////////////////////////////////
//////////////////////////////////////////////////////
/////////////////////////////////////////////////////





// ////////////////////////////////////////////////////////////
// ///////////////////////    FRONTS        //////////////////
// //////////////////////////////////////////////////////////
router.get("/:id", getProduct);
router.get("/", getAllProducts);
///////////////////////////////////////////////////////
//////////////////////////////////////////////////////
/////////////////////////////////////////////////////




export default router;
