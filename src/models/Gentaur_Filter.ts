import mongoose, { Document, Schema, Model } from "mongoose";

// Define the TypeScript interface
export interface IGentaurFilter extends Document {
    filter: string;
    counts: Array<{
        filter_value: string;
        logic: Record<string, any>;
    }>;
    createdAt?: Date;
    updatedAt?: Date;
}

// Create the Mongoose schema
const GentaurFilterSchema: Schema = new Schema(
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
const GentaurFilter: Model<IGentaurFilter> = mongoose.model<IGentaurFilter>("Gentaur_Filter", GentaurFilterSchema);
export default GentaurFilter;
