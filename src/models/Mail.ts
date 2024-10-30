import mongoose, { Document, Schema } from "mongoose";

interface IMail extends Document {
    mail: string;
    plateform:string;
}

const MailSchema: Schema<IMail> = new mongoose.Schema(
    {
        mail: {
            type: String,
            required: true,
        },
        plateform: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model<IMail>("Mail", MailSchema);
