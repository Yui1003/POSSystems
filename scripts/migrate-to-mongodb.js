
import { MongoClient } from 'mongodb';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the parent directory
config({ path: join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

console.log('🔍 Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI exists:', !!MONGODB_URI);
console.log('MONGODB_URI starts with mongodb:', MONGODB_URI?.startsWith('mongodb'));

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  console.log('Make sure your .env file is in the root directory and contains:');
  console.log('MONGODB_URI=mongodb+srv://...');
  process.exit(1);
}

if (!MONGODB_URI.startsWith('mongodb://') && !MONGODB_URI.startsWith('mongodb+srv://')) {
  console.error('❌ Invalid MongoDB URI format');
  console.log('Expected format: mongodb+srv://username:password@cluster.mongodb.net/database');
  console.log('Current value:', MONGODB_URI);
  process.exit(1);
}

console.log('🔗 Connecting to MongoDB Atlas...');

async function migrateData() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const db = client.db('posSystems');
    
    // Test the connection by listing collections
    const collections = await db.listCollections().toArray();
    console.log('📊 Existing collections:', collections.map(c => c.name));
    
    // Read existing data.json
    const dataPath = join(__dirname, '..', 'data.json');
    console.log('📁 Reading data from:', dataPath);
    
    const jsonData = JSON.parse(readFileSync(dataPath, 'utf-8'));

    console.log('📊 Data loaded from data.json:');
    console.log(`- Admin Users: ${jsonData.adminUsers?.length || 0}`);
    console.log(`- POS Systems: ${jsonData.posSystems?.length || 0}`);
    console.log(`- Products: ${jsonData.products?.length || 0}`);
    console.log(`- Transactions: ${jsonData.transactions?.length || 0}`);

    // Migrate adminUsers
    if (jsonData.adminUsers && jsonData.adminUsers.length > 0) {
      const adminUsersCollection = db.collection('adminUsers');
      await adminUsersCollection.deleteMany({}); // Clear existing
      const result = await adminUsersCollection.insertMany(jsonData.adminUsers);
      console.log(`✅ Migrated ${result.insertedCount} admin users`);
    }

    // Migrate posSystems
    if (jsonData.posSystems && jsonData.posSystems.length > 0) {
      const posSystemsCollection = db.collection('posSystems');
      await posSystemsCollection.deleteMany({}); // Clear existing
      const result = await posSystemsCollection.insertMany(jsonData.posSystems);
      console.log(`✅ Migrated ${result.insertedCount} POS systems`);
    }

    // Migrate products
    if (jsonData.products && jsonData.products.length > 0) {
      const productsCollection = db.collection('products');
      await productsCollection.deleteMany({}); // Clear existing
      const result = await productsCollection.insertMany(jsonData.products);
      console.log(`✅ Migrated ${result.insertedCount} products`);
    }

    // Migrate transactions
    if (jsonData.transactions && jsonData.transactions.length > 0) {
      const transactionsCollection = db.collection('transactions');
      await transactionsCollection.deleteMany({}); // Clear existing
      const result = await transactionsCollection.insertMany(jsonData.transactions);
      console.log(`✅ Migrated ${result.insertedCount} transactions`);
    }

    console.log('🎉 Migration completed successfully!');

    // Verify the migration
    const adminCount = await db.collection('adminUsers').countDocuments();
    const posCount = await db.collection('posSystems').countDocuments();
    const productsCount = await db.collection('products').countDocuments();
    const transactionsCount = await db.collection('transactions').countDocuments();

    console.log('📈 Verification:');
    console.log(`- Admin Users in DB: ${adminCount}`);
    console.log(`- POS Systems in DB: ${posCount}`);
    console.log(`- Products in DB: ${productsCount}`);
    console.log(`- Transactions in DB: ${transactionsCount}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

migrateData().catch(console.error);
