import { Schema, model, Document } from "mongoose";

interface ICategory extends Document {
  brand: string;
  category: string;
  sub_category: string;
  meta_data: Schema.Types.ObjectId;
}

const CategorySchema = new Schema<ICategory>(
  {
    brand: {
      type: String,
    },
    category: {
      type: String,
    },
    sub_category: {
      type: String,
    },
    meta_data: { 
      type: Schema.Types.ObjectId, 
      ref: "MetaData" 
    },
  },
  { timestamps: true }
);

export default model<ICategory>("Category", CategorySchema);
