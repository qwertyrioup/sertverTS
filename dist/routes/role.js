"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// auth.js (route file)
const express_1 = __importDefault(require("express"));
const role_1 = require("../controllers/role");
const jwt_1 = require("../controllers/jwt");
const router = express_1.default.Router();
const SUPER_ADMIN = ["dfgdgdg:roles"];
router.get("/", jwt_1.verifyToken, (0, jwt_1.verifyPermissions)(SUPER_ADMIN), role_1.getAllRoles);
exports.default = router;
