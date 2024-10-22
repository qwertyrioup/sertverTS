"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// auth.js (route file)
const express_1 = __importDefault(require("express"));
const auth_1 = require("../controllers/auth");
const router = express_1.default.Router();
// const permissions = {
//   createAdmin: ["create:admin"],
//   readAdmin: ["read:admin"],
//   updateAdmin: ["update:admin"],
//   deleteAdmin: ["delete:admin"],
//   readUser: ["read:user"],
//   updateUser: ["update:user"],
//   deleteUser: ["delete:user"],
// };
router.post("/signin", auth_1.signin);
exports.default = router;
