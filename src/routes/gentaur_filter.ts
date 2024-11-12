
import express, {Router} from "express";
import { verifyPermissions, verifyToken } from "../controllers/jwt";
import { getAllFiltersElastic } from "../controllers/affigen_filter";
import { applyLogicForAll, deleteParentFilter, deleteSubFilter, getAll, getFilter, getSubFilter, insertParentFilter, insertSubFilter, removeLogic, updateFilterChildLogic, updateParentFilter, updateSubFilterName } from "../controllers/gentaur_filter";
const router: Router = express.Router()

// // Define roles
const ADMIN_SUPERADMIN = ['read:filters', 'update:filters', 'delete:filters', 'create:filters'];







// ////////////////////////                //////////////////
// ///////////////////////    DASH        //////////////////
// /////////////////////                //////////////////
router.post('/insert-parent-filter', insertParentFilter)
router.post('/insert-sub-filter/:id',  insertSubFilter)
router.delete('/delete-parent-filter/:id', deleteParentFilter);
router.put('/update-parent-filter/:id', updateParentFilter);
router.put('/parent/:id/child/:subId/rename', updateSubFilterName);
router.delete('/delete-sub-filter/:parentId/subfilter/:subFilterId', deleteSubFilter);
router.put('/update-filter-logic', updateFilterChildLogic)
// router.get("/", verifyToken, verifyPermissions(ADMIN_SUPERADMIN), getAll);
router.get("/", getAll);
router.get("/:id", getFilter);
router.get('/logic/reapply', applyLogicForAll);
router.get('/remove-logic/:parent/:sub', removeLogic);

router.get('/get-sub-filter/:parentId/subfilter/:subFilterId', getSubFilter);









// ////////////////////////////////////////////////////////////
// ///////////////////////    FRONTS        //////////////////
// //////////////////////////////////////////////////////////
router.get('/get/in-elastic',getAllFiltersElastic );







export default router;
