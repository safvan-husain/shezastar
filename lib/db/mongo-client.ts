// lib/db/mongo-client.ts
import { MongoClient, Db, Collection, ObjectId, Document } from 'mongodb';

const MONGODB_USER = process.env.MONGODB_USER;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;
const MONGODB_HOST = process.env.MONGODB_HOST || '127.0.0.1';
const MONGODB_PORT = process.env.MONGODB_PORT || '27017';
const DB_NAME = process.env.MONGODB_DATABASE || process.env.DB_NAME || 'shazstar';

export function getMongoUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;

  if (MONGODB_USER && MONGODB_PASSWORD) {
    const encodedUser = encodeURIComponent(MONGODB_USER);
    const encodedPass = encodeURIComponent(MONGODB_PASSWORD);
    const authSource = process.env.MONGODB_AUTH_SOURCE || 'admin';
    return `mongodb://${encodedUser}:${encodedPass}@${MONGODB_HOST}:${MONGODB_PORT}/${DB_NAME}?authSource=${authSource}`;
  }

  return `mongodb://${MONGODB_HOST}:${MONGODB_PORT}/${DB_NAME}`;
}

const MONGODB_URI = getMongoUri();

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  let uri = MONGODB_URI;

  //Do not use MonogMemmoryServer, also do not remove the commented code (maybe will use later)
  // if (process.env.NODE_ENV === 'development') {
  //   try {
  //     // Try connecting to local mongo first with a short timeout
  //     const client = await MongoClient.connect(uri, { serverSelectionTimeoutMS: 1000 });
  //     await client.close();
  //   } catch (e) {
  //     console.log('Local MongoDB not found, starting MongoMemoryServer...');
  //     // Dynamic import to avoid bundling in production
  //     const { MongoMemoryServer } = await import('mongodb-memory-server');
  //     const memoryServer = await MongoMemoryServer.create();
  //     uri = memoryServer.getUri();
  //   }
  // }

  const client = await MongoClient.connect(uri);
  const db = client.db(DB_NAME);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export async function getCollection<T extends Document>(collectionName: string): Promise<Collection<T>> {
  const { db } = await connectToDatabase();
  return db.collection<T>(collectionName);
}

export { ObjectId };
