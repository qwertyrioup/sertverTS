import mongoose, { Document, Schema } from "mongoose";

interface IPopular extends Document {
    product_name: string;
    cat_affigen: string;
    product_data: mongoose.Schema.Types.ObjectId;
}

const PopularSchema: Schema<IPopular> = new mongoose.Schema(
    {
        product_name: {
            type: String,
            required: true,
        },
        cat_affigen: {
            type: String,
            required: true,
        },
        product_data: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Odoo",
        },
    },
    { timestamps: true }
);

export default mongoose.model<IPopular>("Popular", PopularSchema);
