// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Switch to the shezastar database
db = db.getSiblingDB('shezastar');

// Create a user for the application
db.createUser({
  user: 'shezastar_user',
  pwd: 'shezastar_password',
  roles: [
    {
      role: 'readWrite',
      db: 'shezastar'
    }
  ]
});

// Create initial collections (optional - MongoDB creates them automatically when first document is inserted)
db.createCollection('products');
db.createCollection('categories');
db.createCollection('users');
db.createCollection('orders');

print('Database initialized successfully');