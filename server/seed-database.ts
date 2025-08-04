
import { MongoClient } from 'mongodb';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import * as dotenv from 'dotenv';

dotenv.config();

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seedDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    retryWrites: true,
    ssl: true
  });

  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('possystems');
    
    // Create admin user if it doesn't exist
    const adminUsers = db.collection('adminUsers');
    const existingAdmin = await adminUsers.findOne({ username: 'superadmin' });
    
    if (!existingAdmin) {
      const hashedPassword = await hashPassword('adminsuperaccess');
      await adminUsers.insertOne({
        id: 'admin-1',
        username: 'superadmin',
        password: hashedPassword,
        createdAt: new Date()
      });
      console.log('✅ Created default admin user');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    console.log('🎉 Database seeding completed!');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seedDatabase();
