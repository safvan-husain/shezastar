// lib/db/mongo-client.ts
import { loadEnvConfig } from '@next/env';
import { MongoClient, Db, Collection, ObjectId, Document } from 'mongodb';
import { connection } from 'next/server';
import { logger } from '@/lib/logging/logger';

loadEnvConfig(process.cwd());

export function getMongoUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  throw new Error('MONGODB_URI nor found enviourment.')
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase() {
  await connection();

  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const uri = getMongoUri();

  await logger.debug('Connecting to MongoDB', {
    sourceUri: uri.replace(/:([^@]+)@/, ':****@'),
    hasMongoUri: Boolean(process.env.MONGODB_URI),
  });

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
