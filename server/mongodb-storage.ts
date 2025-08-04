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

    // Add connection options for MongoDB Atlas
    this.client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      maxPoolSize: 10,
      retryWrites: true
    });
    this.db = this.client.db('posSystems');
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
      receiptFooter: 'Thank you for your business!\nPlease come again',
      taxRate: '0'
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

  async updatePOSSystem(id: string, updates: Partial<POSSystem>): Promise<POSSystem | undefined> {
    const result = await this.posSystems.findOneAndUpdate(
      { id },
      { $set: updates },
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
      id: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: product.name,
      posId: product.posId,
      price: product.price,
      category: product.category || 'General',
      stock: product.stock || 0,
      image: product.image || null,
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

  // Additional methods needed by routes.ts
  async getDailySales(posId: string, date: Date): Promise<any> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const transactions = await this.transactions.find({
      posId,
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).toArray();

    const totalSales = transactions.reduce((sum, t) => sum + parseFloat(t.total), 0);
    return {
      date: date.toISOString().split('T')[0],
      totalSales,
      transactionCount: transactions.length,
      transactions
    };
  }

  async getSalesByDateRange(posId: string, startDate: Date, endDate: Date): Promise<Transaction[]> {
    return await this.transactions.find({
      posId,
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ createdAt: -1 }).toArray();
  }

  // Legacy methods for compatibility with old storage system
  loadData(): any {
    // This is a legacy method - MongoDB operations don't need this
    return {};
  }

  saveData(data: any): void {
    // This is a legacy method - MongoDB operations don't need this
    return;
  }
}

let _mongoStorage: MongoDBStorage | null = null;

export const mongoStorage = {
  get instance(): MongoDBStorage {
    if (!_mongoStorage) {
      _mongoStorage = new MongoDBStorage();
    }
    return _mongoStorage;
  },

  // Proxy all methods to the actual instance
  async connect() { return this.instance.connect(); },
  async disconnect() { return this.instance.disconnect(); },
  async getAdminUser(id: string) { return this.instance.getAdminUser(id); },
  async getAdminUserByUsername(username: string) { return this.instance.getAdminUserByUsername(username); },
  async createAdminUser(user: InsertAdminUser) { return this.instance.createAdminUser(user); },
  async getPOSSystem(id: string) { return this.instance.getPOSSystem(id); },
  async getPOSSystemByUsername(username: string) { return this.instance.getPOSSystemByUsername(username); },
  async createPOSSystem(system: InsertPOSSystem) { return this.instance.createPOSSystem(system); },
  async updatePOSSystemStatus(id: string, status: string, approvedBy?: string) { return this.instance.updatePOSSystemStatus(id, status, approvedBy); },
  async updatePOSSystem(id: string, updates: Partial<POSSystem>) { return this.instance.updatePOSSystem(id, updates); },
  async getAllPOSSystems() { return this.instance.getAllPOSSystems(); },
  async getPOSSystemsByStatus(status: string) { return this.instance.getPOSSystemsByStatus(status); },
  async deletePOSSystem(id: string) { return this.instance.deletePOSSystem(id); },
  async getProductsByPOSId(posId: string) { return this.instance.getProductsByPOSId(posId); },
  async createProduct(product: InsertProduct) { return this.instance.createProduct(product); },
  async getProduct(id: string) { return this.instance.getProduct(id); },
  async updateProduct(id: string, updates: Partial<Product>) { return this.instance.updateProduct(id, updates); },
  async deleteProduct(id: string) { return this.instance.deleteProduct(id); },
  async updateProductStock(productId: string, newStock: number) { return this.instance.updateProductStock(productId, newStock); },
  async reduceProductStock(productId: string, quantity: number) { return this.instance.reduceProductStock(productId, quantity); },
  async createTransaction(transaction: InsertTransaction) { return this.instance.createTransaction(transaction); },
  async getTransactionsByPOSId(posId: string) { return this.instance.getTransactionsByPOSId(posId); },
  async getTransaction(id: string) { return this.instance.getTransaction(id); },
  async getAdminStats() { return this.instance.getAdminStats(); },
  async getPOSAnalytics(posId: string) { return this.instance.getPOSAnalytics(posId); },
  async getDailySales(posId: string, date: Date) { return this.instance.getDailySales(posId, date); },
  async getSalesByDateRange(posId: string, startDate: Date, endDate: Date) { return this.instance.getSalesByDateRange(posId, startDate, endDate); },
  loadData() { return this.instance.loadData(); },
  saveData(data: any) { return this.instance.saveData(data); }
};

export { MongoDBStorage };