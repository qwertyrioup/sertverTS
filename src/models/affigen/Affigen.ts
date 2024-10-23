import mongoose, { Document, Model, Schema } from "mongoose";

// Define the schema interface
export interface IAffigen extends Document {
  product_name?: string;
  cluster_name?: string;
  brand_name?: string;
  is_published?: boolean;
  cat_affigen: string;  // unique identifier
  website_name?: string;
  supplier?: string;
  internal_note?: string;
  buy_price?: number;
  sell_price?: number;
  size?: string;
  product_type?: string;
  product_category?: string;
  slug?: string;
  is_indexed?: boolean;
  website_sequence?: string;
  variations?: string;
  description?: string;
  meta_title?: string;
  url?: string;
  url_redirect?: string;
  url_redirect_status?: boolean;
  meta_description?: string;
  meta_keywords?: string[];
  reviews_count?: number;
  reviews?: Array<{
    client_name?: string;
    message?: string;
    stars?: number;
    userId?: string;
  }>;
  images?: string[];
  filters?: Array<{
    filter: string;
    value: string;
  }>;
  sync?: boolean;
  thumbnail?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Create the schema
const AffigenSchema: Schema = new Schema(
  {
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
  },
  { timestamps: true }
);

// Create the model
const Affigen: Model<IAffigen> = mongoose.model<IAffigen>('Affigen', AffigenSchema);
export default Affigen
