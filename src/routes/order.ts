import express from "express";
import {
    createOrder,
    deliverOrder,
    getAllOrders,
    getCountOrder,
    getFullOrder,
    getMyOrders,
    getOrder,
    // @ts-ignore
    getTopByCountry,
    topOrders
} from "../controllers/order";
import verifyPermissions from "../controllers/verifyPermissions";
import { verifyToken } from "../controllers/jwt";

const router = express.Router();

const permissions = {
    create: ['create:order'],
    read: ['read:order'],
    update: ['update:order'],
    delete: ['delete:order']
};

////////////////////////////////////////////////////////////
///////////////////////    DASH        //////////////////
//////////////////////////////////////////////////////////
router.get("/", verifyToken, verifyPermissions(permissions.read), getAllOrders);
router.put("/deliver/:id", verifyToken, verifyPermissions(permissions.update), deliverOrder);
router.get("/get/count", verifyToken, verifyPermissions(permissions.read), getCountOrder);
router.get("/get/top", verifyToken, verifyPermissions(permissions.read), topOrders);
// router.get("/countries/get", verifyToken, verifyPermissions(permissions.read), getTopByCountry);
router.get("/get/:id", verifyToken, verifyPermissions(permissions.read), getFullOrder);

////////////////////////////////////////////////////////////
///////////////////////    FRONTS        //////////////////
//////////////////////////////////////////////////////////
router.get("/:id", getOrder);
router.post("/create", createOrder);
router.get("/my/:id", getMyOrders);

export default router;
