import mongoose, { Document, Model, Schema } from 'mongoose';

// Define the Role interface extending Document
export interface IRole extends Document {
  name: string;
  permissions: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the RoleSchema
const RoleSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    permissions: [
      {
        type: String,
        required: true,
      }
    ],
  },
  { timestamps: true }  // Automatically adds `createdAt` and `updatedAt` fields
);

// Create the Role model using the IRole interface

const Role: Model<IRole> = mongoose.model<IRole>('Role', RoleSchema);
export default Role
