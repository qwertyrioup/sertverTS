import { Client } from "@elastic/elasticsearch";
import { Storage } from "@google-cloud/storage";
import mongoose from "mongoose";
import {NextFunction} from "express"
import * as dotenv from 'dotenv';
import multer from "multer";
import { format } from "util";
import { createError } from "./error";


dotenv.config();


export const connectToDB = async() => {
    mongoose
      .connect(String(process.env.MONGO_DB_CONNECTION_STRING))
      .then(() => console.log("Connected successfully to MONGODB"))
      .catch((err) => console.error("Connection to MongoDB failed", err.message));
  };


  export const storage = new Storage({
    projectId: "affigen-ui",
    keyFilename: String(process.env.KeyFilename),
  })

  export const bucket = storage.bucket("images-upload-affigen-admin");


  export const Multer = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 25 * 1024 * 1024,
    },
  });



  export const uploadFile = (f: any): Promise<string> => {
    return new Promise((resolve, reject) => {
      const { originalname, buffer } = f;
      const filename = Date.now() + originalname;

      const blob = bucket.file(filename);

      const blobStream = blob.createWriteStream({
        resumable: false,
      });

      blobStream.on("error", (err) => {
        reject(err);
      });

      blobStream.on("finish", () => {
        const publicUrl: string = format(
          `https://storage.googleapis.com/${bucket.name}/${blob.name}`
        );
        resolve(publicUrl);
      });

      blobStream.end(buffer);
    });
  };


export const parseJSON = (data: string, next: NextFunction): any | void => {
    try {
      return JSON.parse(data);
    } catch (error) {
      next(createError(400, "Invalid JSON data"));
      return;
    }
  };




  export const searchClient = new Client({
    node: String(process.env.ELASTICSEARCH_HOST),  // Pass the environment variable to the Client
  });



  export const checkElasticsearchConnection = async () => {
    let isConnected = false;
    while (!isConnected) {
      try {
        await searchClient.cluster.health({});
        console.log("Connected successfully to Elasticsearch");
        isConnected = true;
      } catch (error: any) {
        console.log(
          "Connection to Elasticsearch failed, retrying...",
          error.message
        );
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  };


  export const checkPythonConnection = async () => {
    let isConnected = false;
    while (!isConnected) {
      try {
        const response = await fetch(String(process.env.CLUSTERING_HOST));
        console.log("Connected successfully to Python Server");
        if (response && response.ok) isConnected = true;
      } catch (error: any) {
        console.log("Connection to Python failed, retrying...", error.message);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  };
