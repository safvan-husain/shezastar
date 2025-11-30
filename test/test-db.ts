import { MongoClient, ObjectId } from 'mongodb';

let mongoClient: MongoClient;

const TEST_DB_NAME = 'shazstar_test';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';

export async function connect() {
    mongoClient = await MongoClient.connect(MONGODB_URI);
}

export async function close() {
    if (mongoClient) await mongoClient.close();
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
    return { client: mongoClient, db: mongoClient.db(TEST_DB_NAME) };
}

export async function getCollection(name: string) {
    const { db } = await connectToDatabase();
    return db.collection(name);
}

export { ObjectId };
