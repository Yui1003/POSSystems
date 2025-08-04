
import { MongoClient, Db, Collection } from 'mongodb';
import { AdminUser, POSSystem, Product, Transaction, InsertAdminUser, InsertPOSSystem, InsertProduct, InsertTransaction } from '@shared/schema';
import { IStorage } from './storage';

class MongoDBStorage implements IStorage {
  private client: MongoClient;
  private db: Db;
  private adminUsers: Collection<AdminUser>;
  private posSystems: Collection<POSSystem>;
  private products: Collection<Product>;
  private transactions: Collection<Transaction>;

  constructor() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    
    this.client = new MongoClient(uri);
    this.db = this.client.db('possystems');
    this.adminUsers = this.db.collection('adminUsers');
    this.posSystems = this.db.collection('posSystems');
    this.products = this.db.collection('products');
    this.transactions = this.db.collection('transactions');
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    await this.client.close();
  }

  // Admin operations
  async getAdminUser(id: string): Promise<AdminUser | undefined> {
    const user = await this.adminUsers.findOne({ id });
    return user || undefined;
  }

  async getAdminUserByUsername(username: string): Promise<AdminUser | undefined> {
    const user = await this.adminUsers.findOne({ username });
    return user || undefined;
  }

  async createAdminUser(user: InsertAdminUser): Promise<AdminUser> {
    const newUser: AdminUser = {
      ...user,
      id: `admin-${Date.now()}`,
      createdAt: new Date()
    };
    await this.adminUsers.insertOne(newUser);
    return newUser;
  }

  // POS System operations
  async getPOSSystem(id: string): Promise<POSSystem | undefined> {
    const system = await this.posSystems.findOne({ id });
    return system || undefined;
  }

  async getPOSSystemByUsername(username: string): Promise<POSSystem | undefined> {
    const system = await this.posSystems.findOne({ username });
    return system || undefined;
  }

  async createPOSSystem(system: InsertPOSSystem): Promise<POSSystem> {
    const newSystem: POSSystem = {
      ...system,
      id: `pos-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      currencySymbol: '₱',
      createdAt: new Date(),
      approvedAt: null,
      approvedBy: null,
      businessAddress: '',
      businessPhone: '',
      receiptFooter: 'Thank you for your business!\nPlease come again'
    };
    await this.posSystems.insertOne(newSystem);
    return newSystem;
  }

  async updatePOSSystemStatus(id: string, status: string, approvedBy?: string): Promise<POSSystem | undefined> {
    const update: any = { status };
    if (status === 'approved') {
      update.approvedAt = new Date();
      update.approvedBy = approvedBy;
    } else if (status === 'rejected') {
      update.approvedAt = null;
      update.approvedBy = null;
    }

    const result = await this.posSystems.findOneAndUpdate(
      { id },
      { $set: update },
      { returnDocument: 'after' }
    );
    return result || undefined;
  }

  async getAllPOSSystems(): Promise<POSSystem[]> {
    return await this.posSystems.find({}).toArray();
  }

  async getPOSSystemsByStatus(status: string): Promise<POSSystem[]> {
    return await this.posSystems.find({ status }).toArray();
  }

  async deletePOSSystem(id: string): Promise<boolean> {
    const result = await this.posSystems.deleteOne({ id });
    return result.deletedCount > 0;
  }

  // Product operations
  async getProductsByPOSId(posId: string): Promise<Product[]> {
    return await this.products.find({ posId }).toArray();
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const newProduct: Product = {
      ...product,
      id: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isActive: 'true'
    };
    await this.products.insertOne(newProduct);
    return newProduct;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const product = await this.products.findOne({ id });
    return product || undefined;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    const result = await this.products.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: 'after' }
    );
    return result || undefined;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await this.products.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async updateProductStock(productId: string, newStock: number): Promise<Product | undefined> {
    const result = await this.products.findOneAndUpdate(
      { id: productId },
      { $set: { stock: newStock } },
      { returnDocument: 'after' }
    );
    return result || undefined;
  }

  async reduceProductStock(productId: string, quantity: number): Promise<boolean> {
    const result = await this.products.updateOne(
      { id: productId, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } }
    );
    return result.modifiedCount > 0;
  }

  // Transaction operations
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const newTransaction: Transaction = {
      ...transaction,
      id: `trans-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };
    await this.transactions.insertOne(newTransaction);
    return newTransaction;
  }

  async getTransactionsByPOSId(posId: string): Promise<Transaction[]> {
    return await this.transactions.find({ posId }).sort({ createdAt: -1 }).toArray();
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const transaction = await this.transactions.findOne({ id });
    return transaction || undefined;
  }

  // Analytics operations
  async getAdminStats(): Promise<any> {
    const totalPOS = await this.posSystems.countDocuments();
    const pendingPOS = await this.posSystems.countDocuments({ status: 'pending' });
    const approvedPOS = await this.posSystems.countDocuments({ status: 'approved' });
    const rejectedPOS = await this.posSystems.countDocuments({ status: 'rejected' });

    return {
      totalPOS,
      pendingPOS,
      approvedPOS,
      rejectedPOS
    };
  }

  async getPOSAnalytics(posId: string): Promise<any> {
    const transactions = await this.transactions.find({ posId }).toArray();
    const totalSales = transactions.reduce((sum, t) => sum + parseFloat(t.total), 0);
    const totalTransactions = transactions.length;

    return {
      totalSales,
      totalTransactions,
      recentTransactions: transactions.slice(0, 5)
    };
  }
}

export const mongoStorage = new MongoDBStorage();
