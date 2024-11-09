
import express, {Router} from "express";
import { verifyPermissions, verifyToken } from "../controllers/jwt";
import { applyLogicForAll, getAllFiltersElastic, insertParentFilter, updateFilterChildLogic } from "../controllers/affigen_filter";
import { deleteParentFilter, deleteSubFilter, getAll, getFilter, insertSubFilter, updateParentFilter, updateSubFilterName } from "../controllers/gentaur_filter";
const router: Router = express.Router()

// // Define roles
const ADMIN_SUPERADMIN = ['read:filters', 'update:filters', 'delete:filters', 'create:filters'];







// ////////////////////////                //////////////////
// ///////////////////////    DASH        //////////////////
// /////////////////////                //////////////////
router.post('/insert-parent-filter', verifyToken, verifyPermissions(ADMIN_SUPERADMIN), insertParentFilter)
router.post('/insert-sub-filter/:id',  insertSubFilter)
router.delete('/delete-parent-filter/:id', deleteParentFilter);
router.put('/update-parent-filter/:id', updateParentFilter);
router.put('/parent/:id/child/:subId/rename', updateSubFilterName);
router.delete('/delete-sub-filter/:parentId/subfilter/:subFilterId', deleteSubFilter);
router.put('/update-filter-child-and-logic', verifyToken, verifyPermissions(ADMIN_SUPERADMIN), updateFilterChildLogic)
// router.get("/", verifyToken, verifyPermissions(ADMIN_SUPERADMIN), getAll);
router.get("/", getAll);
router.get("/:id", getFilter);
router.get('/logic/apply',verifyToken, verifyPermissions(ADMIN_SUPERADMIN), applyLogicForAll);








// ////////////////////////////////////////////////////////////
// ///////////////////////    FRONTS        //////////////////
// //////////////////////////////////////////////////////////
router.get('/get/in-elastic',getAllFiltersElastic );







export default router;
