import mongoose, { Document, Schema, Model } from "mongoose";

// Define the TypeScript interface
export interface IGentaurCategory extends Document {
  category: string;
  counts: Array<{
    category_value: string;
    logic: Record<string, any>;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

// Create the Mongoose schema
const GentaurCategorySchema: Schema = new Schema(
  {
    category: {
      type: String,
      required: true,
    },
    counts: [
      {
        category_value: String,
        logic: {
          type: Object,
          default: {},
        },
      },
    ],
  },
  { timestamps: true }
);

// Create and export the Mongoose model
const GentaurCategory: Model<IGentaurCategory> = mongoose.model<IGentaurCategory>("Gentaur_Category", GentaurCategorySchema);
export default GentaurCategory;
