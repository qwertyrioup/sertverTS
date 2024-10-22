import { Schema, model, Document } from "mongoose";

interface IBrand extends Document {
  brand_name: string;
  images: string[];
  in_home: boolean;
  meta_data: Schema.Types.ObjectId;
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
    meta_data: { type: Schema.Types.ObjectId, ref: "MetaData" },
  },
  { timestamps: true }
);

export default model<IBrand>("Brand", BrandSchema);
