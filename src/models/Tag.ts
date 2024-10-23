import mongoose, { Document, Schema } from "mongoose";

interface ITag extends Document {
    name: string;
}

const TagSchema: Schema<ITag> = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model<ITag>("Tag", TagSchema);