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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// Create the schema
const ProductSchema = new mongoose_1.Schema({
    product_name: { type: String },
    cluster_name: { type: String },
    brand_name: { type: String },
    is_published: { type: Boolean },
    cat_affigen: { type: String, unique: true },
    website_name: { type: String },
    supplier: { type: String },
    internal_note: { type: String },
    buy_price: { type: Number },
    sell_price: { type: Number },
    size: { type: String },
    product_type: { type: String },
    product_category: { type: String },
    slug: { type: String },
    is_indexed: { type: Boolean },
    website_sequence: { type: String },
    variations: { type: String },
    description: { type: String },
    meta_title: { type: String },
    url: { type: String },
    url_redirect: { type: String },
    url_redirect_status: { type: Boolean },
    meta_description: { type: String },
    meta_keywords: [{ type: String }],
    reviews_count: { type: Number, default: 0 },
    reviews: [
        {
            client_name: String,
            message: String,
            stars: Number,
            userId: String
        }
    ],
    images: [String],
    filters: [
        {
            filter: String,
            value: String
        }
    ],
    sync: { type: Boolean, default: false },
    thumbnail: { type: String }
}, { timestamps: true });
// Create the model
const Product = mongoose_1.default.model('Product', ProductSchema);
exports.default = Product;
