import mongoose, { Document, Schema, Model } from "mongoose";
import { IGentaurProduct } from "./Gentaur_Product";

/**
 * Bestseller Document Interface
 */
export interface BestsellerDocument extends Document {
  product_id: mongoose.Types.ObjectId;
}

/**
 * Bestseller Schema
 */
const bestsellerSchema: Schema = new Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gentaur_Product", // Reference to the GentaurProduct model
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

/**
 * Bestseller Model
 */
const GentaurBestsellerProducts: Model<BestsellerDocument> = mongoose.model<BestsellerDocument>(
  "gentaur_bestseller_products", // Collection name
  bestsellerSchema
);

export default GentaurBestsellerProducts;
