import mongoose, { Document, Schema, Model } from "mongoose";
import { IGentaurProduct } from "./Gentaur_Product";

/**
 * Highlighted Product Document Interface
 */
export interface HighlightedProductDocument extends Document {
  product_id: mongoose.Types.ObjectId;
}

/**
 * Highlighted Product Schema
 */
const highlightedProductSchema: Schema = new Schema(
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
 * Highlighted Product Model
 */
const GentaurHighlightedProducts: Model<HighlightedProductDocument> = mongoose.model<HighlightedProductDocument>(
  "gentaur_highlighted_products",
  highlightedProductSchema
);

export default GentaurHighlightedProducts;
