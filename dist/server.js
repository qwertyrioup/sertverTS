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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser")); // Import body-parser
const consts_1 = require("./consts");
const helpers_1 = require("./helpers");
const cookie_parser_1 = __importDefault(require("cookie-parser")); // Import cookie-parser
const auth_1 = __importDefault(require("./routes/auth"));
const role_1 = __importDefault(require("./routes/role"));
// Load environment variables from .env file
dotenv.config();
// Get the port from environment variables or default to 8800
const port = Number(process.env.PORT) || 8800;
// Create an Express application
const app = (0, express_1.default)();
app.use((0, cors_1.default)(consts_1.corsOptions));
app.use(body_parser_1.default.json({ limit: '512mb' })); // Body parser for JSON data
app.use(body_parser_1.default.urlencoded({ limit: '512mb', extended: true })); // For handling URL-encoded data
app.use((0, cookie_parser_1.default)());
(0, helpers_1.connectToDB)();
(0, helpers_1.checkElasticsearchConnection)();
// checkPythonConnection()
app.get('/', (req, res, next) => {
    res.json('Hello, TypeScript + Node.js + Express!');
});
app.use('/auth', auth_1.default);
app.use('/roles', role_1.default);
// error handler
app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || "Something went wrong!";
    const JSON = res.status(Number(status)).json({
        success: false,
        sattus: Number(status),
        message: String(message)
    });
    return JSON;
});
// Start the server
app.listen(port, () => {
    // Log a message when the server is successfully running
    console.log(`Server is running on http://localhost:${port}`);
});
