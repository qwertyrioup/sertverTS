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
exports.checkPythonConnection = exports.checkElasticsearchConnection = exports.searchClient = exports.connectToDB = void 0;
const elasticsearch_1 = require("@elastic/elasticsearch");
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const connectToDB = () => __awaiter(void 0, void 0, void 0, function* () {
    mongoose_1.default
        .connect(String(process.env.MONGO_DB_CONNECTION_STRING))
        .then(() => console.log("Connected successfully to MONGODB"))
        .catch((err) => console.error("Connection to MongoDB failed", err.message));
});
exports.connectToDB = connectToDB;
const elasticsearchHost = process.env.ELASTICSEARCH_HOST;
if (!elasticsearchHost) {
    throw new Error('ELASTICSEARCH_HOST is not defined in the .env file');
}
exports.searchClient = new elasticsearch_1.Client({
    node: elasticsearchHost, // Pass the environment variable to the Client
});
const checkElasticsearchConnection = () => __awaiter(void 0, void 0, void 0, function* () {
    let isConnected = false;
    while (!isConnected) {
        try {
            yield exports.searchClient.cluster.health({});
            console.log("Connected successfully to Elasticsearch");
            isConnected = true;
        }
        catch (error) {
            console.log("Connection to Elasticsearch failed, retrying...", error.message);
            yield new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }
});
exports.checkElasticsearchConnection = checkElasticsearchConnection;
const checkPythonConnection = () => __awaiter(void 0, void 0, void 0, function* () {
    let isConnected = false;
    while (!isConnected) {
        try {
            const response = yield fetch(String(process.env.CLUSTERING_HOST));
            console.log("Connected successfully to Python Server");
            if (response && response.ok)
                isConnected = true;
        }
        catch (error) {
            console.log("Connection to Python failed, retrying...", error.message);
            yield new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }
});
exports.checkPythonConnection = checkPythonConnection;
