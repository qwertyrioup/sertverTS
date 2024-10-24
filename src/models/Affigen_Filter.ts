import mongoose, { Document, Schema, Model } from "mongoose";

// Define the TypeScript interface
export interface IAffigenFilter extends Document {
    filter: string;
    counts: Array<{
        filter_value: string;
        logic: Record<string, any>;
    }>;
    createdAt?: Date;
    updatedAt?: Date;
}

// Create the Mongoose schema
const AffigenFilterSchema: Schema = new Schema(
    {
        filter: {
            type: String,
            required: true,
        },
        counts: [
            {
                filter_value: String,
                logic: {
                    type: Object,
                    default: {},
                },
            },
        ],
    },
    { timestamps: true }
);

// Create and export the Mongoose model
const AffigenFilter: Model<IAffigenFilter> = mongoose.model<IAffigenFilter>("Affigen_Filter", AffigenFilterSchema);
export default AffigenFilter;
