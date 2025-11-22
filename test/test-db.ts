import { MongoClient, ObjectId } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;
let mongoClient: MongoClient;

export async function connect() {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    mongoClient = await MongoClient.connect(uri);
}

export async function close() {
    if (mongoClient) await mongoClient.close();
    if (mongoServer) await mongoServer.stop();
}

export async function clear() {
    if (mongoClient) {
        const collections = await mongoClient.db().collections();
        for (const collection of collections) {
            await collection.deleteMany({});
        }
    }
}

export async function connectToDatabase() {
    if (!mongoClient) {
        // If not explicitly connected (e.g. in a unit test without global setup), connect now
        await connect();
    }
    return { client: mongoClient, db: mongoClient.db() };
}

export async function getCollection(name: string) {
    const { db } = await connectToDatabase();
    return db.collection(name);
}

export { ObjectId };
