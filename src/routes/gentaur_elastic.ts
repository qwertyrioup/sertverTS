import express, { Router } from "express";
import { verifyPermissions, verifyToken } from "../controllers/jwt";
import { SEARCH_WITH_CUSTOM_FILTERS, SEARCH_WITH_FILTERS } from "../controllers/gentaur_elastic";

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
router.post("/search-with-filters", SEARCH_WITH_FILTERS);












export default router;
