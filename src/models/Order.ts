import mongoose, { Document, Schema } from "mongoose";

interface IUserDetails {
    // Define the structure of user_details if needed
    // Example:
    name: string;
    email: string;
    // Add other fields as necessary
}

interface IOrder extends Document {
    user_details: IUserDetails;
    cart: Record<string, any>; // Adjust based on the structure of cart
    comment?: string; // Optional field
    userId: string;
    status: string;
    type: string;
    seen: boolean;
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
        userId: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            default: 'Processing',
        },
        type: {
            type: String,
            required: true,
        },
        seen: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

export default mongoose.model<IOrder>("Order", OrderSchema);
