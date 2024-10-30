import mongoose, { Document, Schema } from "mongoose";



interface IContact extends Document {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    message:string;
    plateform:string
}

const ContactSchema: Schema<IContact> = new mongoose.Schema(
    {
        first_name: {
            type: String,
            required: true,
        },
        last_name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        plateform: {
            type: String,
            required: true
        },

    },
    { timestamps: true }
);

export default mongoose.model<IContact>("Contact", ContactSchema);
