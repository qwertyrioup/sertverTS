import express, { Router } from "express";
import { getAll } from "../controllers/popular";

// Creating an Express router
const router: Router = express.Router();

////////////////////////////////////////////////////////////
///////////////////////    FRONTS        //////////////////
//////////////////////////////////////////////////////////
router.get("/getall", getAll);

export default router;
