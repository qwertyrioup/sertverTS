import mongoose, { Document, Schema, Model } from 'mongoose';

// Define the User interface extending Document
export interface IUser extends Document {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  photoURL?: string;
  role: mongoose.Types.ObjectId;  // Reference to the 'Role' collection
  displayName?: string;
  phoneNumber?: string;
  country?: string;
  address?: string;
  state?: string;
  city?: string;
  zipCode?: string;
  about?: string;
  isPublic?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the UserSchema
const UserSchema: Schema<IUser> = new Schema(
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
    password: {
      type: String,
      required: true,
    },
    photoURL: {
      type: String,
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
    displayName: {
      type: String,
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
    about: {
      type: String,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Create the User model using the IUser interface
const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

export default User;
