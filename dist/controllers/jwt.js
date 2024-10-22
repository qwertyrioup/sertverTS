"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPermissions = exports.verifyToken = exports.generateToken = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const error_1 = require("../error");
const dotenv = __importStar(require("dotenv"));
const User_1 = __importDefault(require("../models/User"));
dotenv.config();
const generateToken = (user) => {
    return jwt.sign({
        id: user._id,
        //   @ts-ignore
        role: user.role.name,
        //   @ts-ignore
        permissions: user.role.permissions,
    }, String(process.env.JWT_SEC), { expiresIn: "3d" });
};
exports.generateToken = generateToken;
const verifyToken = (req, res, next) => {
    let token;
    //   @ts-ignore
    const authHeader = String(req.headers['cookie']);
    if (authHeader) {
        token = authHeader.split("accessToken=")[1];
    }
    else {
        token = String(req.query.token);
    }
    if (token) {
        jwt.verify(token, String(process.env.JWT_SEC), (err, user) => {
            if (err)
                return next((0, error_1.createError)(403, "Token is not valid!"));
            //   @ts-ignore
            req.user = user;
            next();
        });
    }
    else {
        return next((0, error_1.createError)(401, "You are not authenticated!"));
    }
};
exports.verifyToken = verifyToken;
const verifyPermissions = (requiredPermissions) => {
    console.log('income', requiredPermissions);
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // @ts-ignore
            const user = yield User_1.default.findById(String(req.user.id)).populate("role");
            if (!user) {
                return next((0, error_1.createError)(404, "User not found"));
            }
            //   @ts-ignore
            if (!user.role || !user.role.permissions) {
                return next((0, error_1.createError)(403, "Role or permissions not defined"));
            }
            //   @ts-ignore
            const userPermissions = user.role.permissions;
            console.log(userPermissions);
            const hasPermission = requiredPermissions.every((permission) => userPermissions.includes(permission));
            if (!hasPermission) {
                return next((0, error_1.createError)(403, "You do not have permission to perform this action"));
            }
            next();
        }
        catch (error) {
            next(error);
        }
    });
};
exports.verifyPermissions = verifyPermissions;
