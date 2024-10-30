// import express from "express";
// import {
//     applyLogicForAll,
//     deleteParentFilter,
//     deleteSubFilter,
//     getAll,
//     getAllFiltersElastic,
//     getFilter,
//     insertParentFilter,
//     insertSubFilter,
//     updateFilterChildValueAndLogic
// } from "../controllers/filter.js";

import express, {Router} from "express";
import { verifyPermissions, verifyToken } from "../controllers/jwt";
import { applyLogicForAll, deleteParentFilter, deleteSubFilter, getAll, getAllFiltersElastic, getFilter, insertParentFilter, insertSubFilter, updateFilterChildLogic } from "../controllers/affigen_filter";
const router: Router = express.Router()

// // Define roles
const ADMIN_SUPERADMIN = ['read:filters'];







// ////////////////////////                //////////////////
// ///////////////////////    DASH        //////////////////
// /////////////////////                //////////////////
router.post('/insert-parent-filter', verifyToken, verifyPermissions(ADMIN_SUPERADMIN), insertParentFilter)
router.post('/insert-sub-filter/:id', verifyToken, verifyPermissions(ADMIN_SUPERADMIN), insertSubFilter)
router.delete('/delete-parent-filter/:id', verifyToken, verifyPermissions(ADMIN_SUPERADMIN), deleteParentFilter);
router.delete('/delete-sub-filter/:parentId/subfilter/:subFilterId', verifyToken, verifyPermissions(ADMIN_SUPERADMIN), deleteSubFilter);
router.put('/update-filter-child-and-logic', verifyToken, verifyPermissions(ADMIN_SUPERADMIN), updateFilterChildLogic)
router.get("/", verifyToken, verifyPermissions(ADMIN_SUPERADMIN), getAll);
router.get("/:id", verifyToken, verifyPermissions(ADMIN_SUPERADMIN), getFilter);
router.get('/logic/apply',verifyToken, verifyPermissions(ADMIN_SUPERADMIN), applyLogicForAll);








// ////////////////////////////////////////////////////////////
// ///////////////////////    FRONTS        //////////////////
// //////////////////////////////////////////////////////////
router.get('/get/in-elastic',getAllFiltersElastic );







export default router;
