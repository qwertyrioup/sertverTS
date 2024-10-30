import { Schema, Document, Model, model } from "mongoose";

/**
 * Supplier Company Interface
 */
interface SupplierCompany {
    name: string;
    address1: string;
    address2: string;
    city: string;
    country: string;
}

/**
 * Supplier Interface
 */
export interface ISupplier extends Document {
    id: number;
    name: string;
    company: SupplierCompany;
    discount: number;
    shipping_cost: number;
    shipping_cost_dry_ice: number;
    bank_fee: number;
    invoice_surcharges: number;
    margin: number;
    flat_rate: number;
    links: string[];
    featured_image: string[];
    images: string[];
    notes: string;
}



/**
 * Supplier Company Schema
 */
const SupplierCompanySchema: Schema = new Schema(
    {
        name: { type: String, default: "" },
        address1: { type: String, default: "" },
        address2: { type: String, default: "" },
        city: { type: String, default: "" },
        country: { type: String, default: "" },
    },
    { _id: false }
);

/**
 * Supplier Schema
 */
const SupplierSchema: Schema = new Schema<ISupplier>(
    {
        id: { type: Number, required: true, unique: true },
        name: { type: String, required: true },
        company: { type: SupplierCompanySchema, required: true },
        discount: { type: Number, default: 0 },
        shipping_cost: { type: Number, default: 0 },
        shipping_cost_dry_ice: { type: Number, default: 0 },
        bank_fee: { type: Number, default: 0 },
        invoice_surcharges: { type: Number, default: 0 },
        margin: { type: Number, required: true },
        flat_rate: { type: Number, default: 0 },
        links: { type: [String], default: [] },
        featured_image: { type: [String], default: [] },
        images: { type: [String], default: [] },
        notes: { type: String, default: "" },
    },
    { timestamps: true }
);

/**
 * Supplier Model
 */
const Supplier: Model<ISupplier> = model<ISupplier>("Supplier", SupplierSchema);

export default Supplier;
