// lib/db/mongo-client.ts
import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'shezastar';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  let uri = MONGODB_URI;

  if (process.env.NODE_ENV === 'development') {
    try {
      // Try connecting to local mongo first with a short timeout
      const client = await MongoClient.connect(uri, { serverSelectionTimeoutMS: 1000 });
      await client.close();
    } catch (e) {
      console.log('Local MongoDB not found, starting MongoMemoryServer...');
      // Dynamic import to avoid bundling in production
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const memoryServer = await MongoMemoryServer.create();
      uri = memoryServer.getUri();
    }
  }

  const client = await MongoClient.connect(uri);
  const db = client.db(DB_NAME);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export async function getCollection<T = any>(collectionName: string): Promise<Collection<T>> {
  const { db } = await connectToDatabase();
  return db.collection<T>(collectionName);
}

export { ObjectId };
