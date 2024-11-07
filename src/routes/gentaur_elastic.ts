import express, { Router } from "express";
import { verifyPermissions, verifyToken } from "../controllers/jwt";
import { SEARCH_WITH_CUSTOM_FILTERS, SEARCH_WITH_FILTERS, SEARCH_WITH_FILTERS_FIXED_CLUSTER, SIMILARS } from "../controllers/gentaur_elastic";


const router: Router = express.Router()

const permissions = {
    searchWithFilters: ['searchWithFilters'],
    create: ['create:elastic']
};




////////////////////////                //////////////////
///////////////////////    DASH        //////////////////
/////////////////////                //////////////////
router.post("/with-custom-filters", verifyToken, verifyPermissions(permissions.searchWithFilters), SEARCH_WITH_CUSTOM_FILTERS);











////////////////////////////////////////////////////////////
///////////////////////    FRONTS        //////////////////
//////////////////////////////////////////////////////////
router.post("/search-with-filters", SEARCH_WITH_FILTERS)
router.get("/similars", SIMILARS)
// router.post("/brand/:id/search-with-filters", SEARCH_WITH_FILTERS_FIXED_BRAND)
// router.get("/similars/:id", SIMILARS_BY_BRAND)
router.post("/cluster/:id/search-with-filters", SEARCH_WITH_FILTERS_FIXED_CLUSTER)












export default router;
