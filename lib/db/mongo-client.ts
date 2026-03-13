// lib/db/mongo-client.ts
import { loadEnvConfig } from '@next/env';
import { MongoClient, Db, Collection, ObjectId, Document } from 'mongodb';

loadEnvConfig(process.cwd());

export function getMongoUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  throw new Error('MONGODB_URI nor found enviourment.')
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const uri = getMongoUri();

  console.log('--- MongoDB Connection Info ---');
  console.log('Source URI:', uri.replace(/:([^@]+)@/, ':****@'));
  console.log('process.env.MONGODB_URI:', process.env.MONGODB_URI ? 'Present' : 'Missing');
  console.log('-------------------------------');

  const client = await MongoClient.connect(uri);
  const db = client.db('shezastar');

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export async function getCollection<T extends Document>(collectionName: string): Promise<Collection<T>> {
  const { db } = await connectToDatabase();
  return db.collection<T>(collectionName);
}

export { ObjectId };
