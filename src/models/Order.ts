import mongoose, { Document, Schema } from "mongoose";

interface IUserDetails {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
}

interface IOrder extends Document {
  user_details: IUserDetails;
  cart: Record<string, any>; // Adjust based on the structure of cart
  comment?: string; // Optional field
  platform: string;
  status: "pending" | "in progress" | "shipped" | "delivered" | "canceled" | "refunded";
}

const OrderSchema: Schema<IOrder> = new mongoose.Schema(
  {
    user_details: {
      type: Object,
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
