import { Schema, model, Document } from "mongoose";

interface IBrand extends Document {
  brand_name: string;
  images: string[];
  in_home: boolean;

}

const BrandSchema = new Schema<IBrand>(
  {
    brand_name: {
      type: String,
      required: true,
    },
    images: [String],
    in_home: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default model<IBrand>("Brand", BrandSchema);
