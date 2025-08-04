import { MongoClient, Db, Collection } from 'mongodb';
import { AdminUser, POSSystem, Product, Transaction, TransactionItem } from '@shared/schema';

const MONGODB_URI = process.env.MONGODB_URI || 'your-mongodb-connection-string-here';
const DATABASE_NAME = 'possystems';

class MongoStorage {
  private client: MongoClient;
  private db: Db | null = null;
  private connected = false;

  constructor() {
    this.client = new MongoClient(MONGODB_URI);
  }

  async connect() {
    if (!this.connected) {
      await this.client.connect();
      this.db = this.client.db(DATABASE_NAME);
      this.connected = true;
      console.log('Connected to MongoDB Atlas');
    }
    return this.db!;
  }

  async disconnect() {
    if (this.connected) {
      await this.client.close();
      this.connected = false;
      console.log('Disconnected from MongoDB Atlas');
    }
  }

  private async getCollection(name: string): Promise<Collection> {
    const db = await this.connect();
    return db.collection(name);
  }

  // Admin Users
  async getAdminUsers(): Promise<AdminUser[]> {
    const collection = await this.getCollection('adminUsers');
    return await collection.find({}).toArray() as AdminUser[];
  }

  async getAdminByUsername(username: string): Promise<AdminUser | null> {
    const collection = await this.getCollection('adminUsers');
    return await collection.findOne({ username }) as AdminUser | null;
  }

  async createAdmin(admin: AdminUser): Promise<void> {
    const collection = await this.getCollection('adminUsers');
    await collection.insertOne(admin);
  }

  // POS Systems
  async getPosSystems(): Promise<POSSystem[]> {
    const collection = await this.getCollection('posSystems');
    return await collection.find({}).toArray() as POSSystem[];
  }

  async getPosSystemById(id: string): Promise<POSSystem | null> {
    const collection = await this.getCollection('posSystems');
    return await collection.findOne({ id }) as POSSystem | null;
  }

  async getPosSystemByUsername(username: string): Promise<POSSystem | null> {
    const collection = await this.getCollection('posSystems');
    return await collection.findOne({ username }) as POSSystem | null;
  }

  async createPosSystem(posSystem: POSSystem): Promise<void> {
    const collection = await this.getCollection('posSystems');
    await collection.insertOne(posSystem);
  }

  async updatePosSystem(id: string, updates: Partial<POSSystem>): Promise<void> {
    const collection = await this.getCollection('posSystems');
    await collection.updateOne({ id }, { $set: updates });
  }

  async deletePosSystem(id: string): Promise<void> {
    const collection = await this.getCollection('posSystems');
    await collection.deleteOne({ id });
  }

  // Products
  async getProducts(): Promise<Product[]> {
    const collection = await this.getCollection('products');
    return await collection.find({}).toArray() as Product[];
  }

  async getProductsByPosId(posId: string): Promise<Product[]> {
    const collection = await this.getCollection('products');
    return await collection.find({ posId }).toArray() as Product[];
  }

  async getProductById(id: string): Promise<Product | null> {
    const collection = await this.getCollection('products');
    return await collection.findOne({ id }) as Product | null;
  }

  async createProduct(product: Product): Promise<void> {
    const collection = await this.getCollection('products');
    await collection.insertOne(product);
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    const collection = await this.getCollection('products');
    await collection.updateOne({ id }, { $set: updates });
  }

  async deleteProduct(id: string): Promise<void> {
    const collection = await this.getCollection('products');
    await collection.deleteOne({ id });
  }

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    const collection = await this.getCollection('transactions');
    return await collection.find({}).toArray() as Transaction[];
  }

  async getTransactionsByPosId(posId: string): Promise<Transaction[]> {
    const collection = await this.getCollection('transactions');
    return await collection.find({ posId }).toArray() as Transaction[];
  }

  async getTransactionsByDateRange(posId: string, startDate: Date, endDate: Date): Promise<Transaction[]> {
    const collection = await this.getCollection('transactions');
    return await collection.find({
      posId,
      createdAt: {
        $gte: startDate.toISOString(),
        $lte: endDate.toISOString()
      }
    }).toArray() as Transaction[];
  }

  async createTransaction(transaction: Transaction): Promise<void> {
    const collection = await this.getCollection('transactions');
    await collection.insertOne(transaction);
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    const collection = await this.getCollection('transactions');
    return await collection.findOne({ id }) as Transaction | null;
  }
}

// Create a single instance to use throughout the application
const storage = new MongoStorage();

// Export the storage instance and connect on startup
export default storage;

// Connect when the module is imported
process.on('SIGINT', async () => {
  await storage.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await storage.disconnect();
  process.exit(0);
});