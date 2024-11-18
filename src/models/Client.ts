import mongoose, { Document, Schema, Model } from 'mongoose';

// Define the Client interface extending Document
export interface IClient extends Document {
  firstname: string;
  lastname: string;
  email: string;
  phoneNumber?: string;
  country?: string;
  address?: string;
  state?: string;
  city?: string;
  zipCode?: string;
  isPublic?: boolean;
  isVerified?: boolean;
  isBnned?: boolean;
  isEmilVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the ClientSchema
const ClientSchema: Schema<IClient> = new Schema(
  {
    firstname: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNumber: {
      type: String,
    },
    country: {
      type: String,
    },
    address: {
      type: String,
    },
    state: {
      type: String,
    },
    city: {
      type: String,
    },
    zipCode: {
      type: String,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isBnned: {
      type: Boolean,
      default: false,
    },
    isEmilVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Create the Client model using the IClient interface
const Client: Model<IClient> = mongoose.model<IClient>('Client', ClientSchema);

export default Client;
