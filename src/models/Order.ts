import mongoose, { Document, Schema } from "mongoose";

interface IOrder extends Document {
  clientId: mongoose.Schema.Types.ObjectId;
  cart: Record<string, any>; // Adjust based on the structure of cart
  comment?: string; // Optional field
  platform: string;
  status: "pending" | "in progress" | "shipped" | "delivered" | "canceled" | "refunded";
}

const OrderSchema: Schema<IOrder> = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    cart: {
      type: Object,
      required: true,
    },
    comment: {
      type: String,
    },
    platform: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "in progress", "shipped", "delivered", "canceled", "refunded"],
      default: "pending", // Default value is 'pending'
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>("Order", OrderSchema);
