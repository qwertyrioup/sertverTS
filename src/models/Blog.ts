import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBlog extends Document {
  userId: string;
  title: string;
  description?: string;
  content: string;
  cover: string;
  tags: string[];
  publish: boolean;
  comments: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords: string[];
  platform: "both" | "affitechbio" | "affigen";
  createdAt?: Date;
  updatedAt?: Date;
}

const BlogSchema = new Schema<IBlog>(
  {
    userId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
    content: {
      type: String,
      required: true,
    },
    cover: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      default: [''],
    },
    publish: {
      type: Boolean,
      default: true,
    },
    comments: {
      type: Boolean,
      default: false,
    },
    metaTitle: {
      type: String,
      default: '',
    },
    metaDescription: {
      type: String,
      default: '',
    },
    metaKeywords: {
      type: [String],
      default: [''],
    },
    platform: {
      type: String,
      enum: ['both', 'affitechbio', 'affigen'],
      required: true,
      default: 'both',
    },
  },
  { timestamps: true }
);

const Blog: Model<IBlog> = mongoose.model<IBlog>('Blog', BlogSchema);
export default Blog
