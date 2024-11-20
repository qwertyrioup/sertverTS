import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHotProduct extends Document {
  productId: mongoose.Types.ObjectId; // Reference to GentaurProduct
  dateAdded: Date; // Track when it was marked as hot
}

const HotProductSchema: Schema = new Schema<IHotProduct>(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Affigen_Product', required: true },
    dateAdded: { type: Date, default: Date.now },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

const HotProduct: Model<IHotProduct> = mongoose.model<IHotProduct>('Affigen_Hot_Product', HotProductSchema);

export default HotProduct;
