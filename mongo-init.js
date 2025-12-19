// Use environment variables or defaults
const dbName = process.env.MONGO_INITDB_DATABASE || 'shezastar';
const appUser = process.env.MONGODB_APP_USER || 'shezastar_user';
const appPass = process.env.MONGODB_APP_PASSWORD || 'password';

// Switch to the target database
db = db.getSiblingDB(dbName);

// Create a user for the application
db.createUser({
  user: appUser,
  pwd: appPass,
  roles: [
    {
      role: 'readWrite',
      db: dbName
    }
  ]
});

// Create initial collections (optional - MongoDB creates them automatically when first document is inserted)
db.createCollection('products');
db.createCollection('categories');
db.createCollection('users');
db.createCollection('orders');

print('Database initialized successfully');