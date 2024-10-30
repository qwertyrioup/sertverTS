import mongoose, { Document, Model, Schema } from 'mongoose';

// Define the Role interface extending Document
export interface ICount extends Document {
  name: string;
  affigen: number;
  gentaur: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the CountSchema
const CountSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    affigen: {
        type: Number
    },
    gentaur: {
        type: Number
    }
  },
  { timestamps: true }  // Automatically adds `createdAt` and `updatedAt` fields
);

// Create the Count model using the ICount interface

const Count: Model<ICount> = mongoose.model<ICount>('Count', CountSchema);
export default Count
