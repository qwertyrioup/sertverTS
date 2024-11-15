import express, { Router } from "express";
import { getAllSuppliers, getSupplierById, updateSupplierById } from "../controllers/supplier";



const router: Router = express.Router()

const permissions = {
    // create: ['create:blog'],
    read: ['read:suppliers'],
    // update: ['update:blog'],
    // delete: ['delete:blog']
};



router.get("/", getAllSuppliers);
router.get("/:id", getSupplierById);
router.put("/:id", updateSupplierById);















export default router;
