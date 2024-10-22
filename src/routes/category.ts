import express from "express";
import { getAll } from "../controllers/category";

const router = express.Router();

router.get("/getall", getAll);

export default router;
