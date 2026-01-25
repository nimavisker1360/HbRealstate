import pkg from "@prisma/client";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

// MongoDB native client for raw queries
const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db = null;

const getMongoDb = async () => {
  if (!db) {
    await mongoClient.connect();
    db = mongoClient.db("CaseCentralYT");
  }
  return db;
};

export { prisma, getMongoDb };
