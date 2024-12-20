
import express, {Router} from "express";
import { verifyPermissions, verifyToken } from "../controllers/jwt";
import {
  applyLogicForAllCategories,
  getAllCategoriesElastic, getSubCategory,
  insertParentCategory,
  updateCategoryChildLogic
} from "../controllers/gentaur_category";
import { deleteParentCategory, deleteSubCategory, getAllCategories, getCategory, insertSubCategory, updateParentCategory, updateSubCategoryName } from "../controllers/gentaur_category";
import { getSubFilter } from "../controllers/gentaur_filter";
const  router: Router = express.Router()

// // Define roles
const ADMIN_SUPERADMIN = ['read:filters', 'update:filters', 'delete:filters', 'create:filters'];







// ////////////////////////                //////////////////
// ///////////////////////    DASH        //////////////////
// /////////////////////                //////////////////
router.post('/insert-parent-category', insertParentCategory)
// router.post('/insert-parent-filter', verifyToken, verifyPermissions(ADMIN_SUPERADMIN), insertParentCategory)
router.post('/insert-sub-category/:id',  insertSubCategory)
router.delete('/delete-parent-category/:id', deleteParentCategory);
router.put('/update-parent-category/:id', updateParentCategory);
router.put('/parent/:id/child/:subId/rename', updateSubCategoryName);
router.delete('/delete-sub-category/:parentId/subCategory/:subCategoryId', deleteSubCategory);
router.put('/update-category-child-and-logic', updateCategoryChildLogic)
// router.get("/", verifyToken, verifyPermissions(ADMIN_SUPERADMIN), getAll);
router.get("/", getAllCategories);
router.get("/:id", getCategory);
router.get('/logic/apply', applyLogicForAllCategories);
router.get('/get-sub-category/:parentId/subCategory/:subCategoryId', getSubCategory);








// ////////////////////////////////////////////////////////////
// ///////////////////////    FRONTS        //////////////////
// //////////////////////////////////////////////////////////
router.get('/get/in-elastic',getAllCategoriesElastic );







export default router;
