import mongoose from "mongoose";
import GentaurProduct from "./Gentaur_Product";

const HighlightedProduct = mongoose.model(
  "BestsellerProduct",
  GentaurProduct.schema,
  "gentaur_highlighted_products"
);

export default HighlightedProduct;