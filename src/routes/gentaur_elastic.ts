import express, { Router } from "express";
import { verifyPermissions, verifyToken } from "../controllers/jwt";
import {
  APPLY_CATEGORY_AND_CHILDRENS_FOR_ALL_GENTAUR_PRODUCTS,
  APPLY_FILTER_AND_CHILDRENS_FOR_ALL_GENTAUR_PRODUCTS,
  SEARCH_WITH_CUSTOM_FILTERS,
  SEARCH_WITH_FILTERS,
  SEARCH_WITH_FILTERS_FIXED_CLUSTER,
  SIMILARS
} from "../controllers/gentaur_elastic";

const router: Router = express.Router();

const permissions = {
  searchWithFilters: ["searchWithFilters"],
  create: ["create:elastic"],
};

////////////////////////                //////////////////
///////////////////////    DASH        //////////////////
/////////////////////                //////////////////
router.post("/with-custom-filters", SEARCH_WITH_CUSTOM_FILTERS);

router.post(
  "/add-filter-with-childs-to-products",
  APPLY_FILTER_AND_CHILDRENS_FOR_ALL_GENTAUR_PRODUCTS
);router.post(
  "/add-category-with-childs-to-products",
  APPLY_CATEGORY_AND_CHILDRENS_FOR_ALL_GENTAUR_PRODUCTS
);

////////////////////////////////////////////////////////////
///////////////////////    FRONTS        //////////////////
//////////////////////////////////////////////////////////
router.post("/search-with-filters", SEARCH_WITH_FILTERS);
router.get("/similars", SIMILARS);
// router.post("/brand/:id/search-with-filters", SEARCH_WITH_FILTERS_FIXED_BRAND)
// router.get("/similars/:id", SIMILARS_BY_BRAND)
router.post(
  "/cluster/:id/search-with-filters",
  SEARCH_WITH_FILTERS_FIXED_CLUSTER
);

export default router;
