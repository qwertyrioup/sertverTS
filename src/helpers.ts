import { Client } from "@elastic/elasticsearch";
import mongoose from "mongoose";
import * as dotenv from 'dotenv';
dotenv.config();


export const connectToDB = async() => {
    mongoose
      .connect(String(process.env.MONGO_DB_CONNECTION_STRING))
      .then(() => console.log("Connected successfully to MONGODB"))
      .catch((err) => console.error("Connection to MongoDB failed", err.message));
  };


  const elasticsearchHost = process.env.ELASTICSEARCH_HOST;

  if (!elasticsearchHost) {
    throw new Error('ELASTICSEARCH_HOST is not defined in the .env file');
  }

  export const searchClient = new Client({
    node: elasticsearchHost,  // Pass the environment variable to the Client
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
