import mongoose, { Document, Schema } from "mongoose";

interface IMailContact extends Document {
    mail: string;
}

const MailContactSchema: Schema<IMailContact> = new mongoose.Schema(
    {
        mail: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model<IMailContact>("MailContact", MailContactSchema);