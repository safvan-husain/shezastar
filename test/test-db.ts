import { MongoClient, ObjectId } from 'mongodb';
// import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoClient: MongoClient;
// let mongoServer: MongoMemoryServer | undefined;

const TEST_DB_NAME = 'shazstar_test';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';

export async function connect() {
    if (mongoClient) return;

    if (MONGODB_URI) {
        try {
            mongoClient = await MongoClient.connect(MONGODB_URI);
            console.log(`Connected to DB: ${TEST_DB_NAME}`);
            return;
        } catch (error) {
            console.error(`Failed to connect to DB: ${TEST_DB_NAME}`);
            throw error;
        }
    }

    // mongoServer = await MongoMemoryServer.create({
    //     instance: { dbName: TEST_DB_NAME },
    // });
    // const uri = mongoServer.getUri();
    // mongoClient = await MongoClient.connect(uri);
}

export async function close() {
    if (mongoClient) await mongoClient.close();
    // if (mongoServer) {
    //     await mongoServer.stop();
    //     mongoServer = undefined;
    // }
}

export async function clear() {
    if (!mongoClient) {
        await connect();
    }

    const db = mongoClient.db(TEST_DB_NAME);
    const collections = await db.collections();
    for (const collection of collections) {
        await collection.deleteMany({});
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
