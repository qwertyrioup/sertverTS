import mongoose, { Document, Schema } from "mongoose";

interface IUserDetails {
    // Define the structure of user_details if needed
    // Example:
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    country: string;

    // Add other fields as necessary
}

interface IOrder extends Document {
    user_details: IUserDetails;
    cart: Record<string, any>; // Adjust based on the structure of cart
    comment?: string; // Optional field
    plateform: string;
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
        plateform: {
            type: String,
            required: true
        },

    },
    { timestamps: true }
);

export default mongoose.model<IOrder>("Order", OrderSchema);
