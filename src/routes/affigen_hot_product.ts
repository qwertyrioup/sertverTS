// auth.js (route file)
import express, { Router } from "express";

import { Multer } from "../affigen_helpers";
import {
  toggleHotProduct,
  getHotProducts,
  toggleHotProductByCatalogNumber,
  deleteHotProductById
} from "../controllers/affigen_hot_product";
import { verifyPermissions, verifyToken } from "../controllers/jwt";

const router: Router = express.Router()
const permissions = {
  create: ['create:odoo', 'create_filters'],
  read: ['read:odoo'],
  update: ['update:odoo'],
  delete: ['delete:odoo'],
  backup: ['backup:odoo'],
};

router.get("/", getHotProducts)
// @ts-ignore
router.post("/add-hot-products-by-id/:productId", toggleHotProduct)
// @ts-ignore
router.post("/add-hot-products-by-cat/:catalogNumber", toggleHotProductByCatalogNumber)

// @ts-ignore
router.delete('/delete-hot-products/:id', deleteHotProductById);

export default router;
