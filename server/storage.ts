import { type AdminUser, type InsertAdminUser, type POSSystem, type InsertPOSSystem, type Product, type InsertProduct, type Transaction, type InsertTransaction } from "@shared/schema";
import { randomUUID } from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const MemoryStore = createMemoryStore(session);

type DatabaseData = {
  adminUsers: AdminUser[];
  posSystems: POSSystem[];
  products: Product[];
  transactions: Transaction[];
};

export interface IStorage {
  // Admin operations
  getAdminUser(id: string): Promise<AdminUser | undefined>;
  getAdminUserByUsername(username: string): Promise<AdminUser | undefined>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;

  // POS System operations
  getPOSSystem(id: string): Promise<POSSystem | undefined>;
  getPOSSystemByUsername(username: string): Promise<POSSystem | undefined>;
  createPOSSystem(system: InsertPOSSystem): Promise<POSSystem>;
  updatePOSSystemStatus(id: string, status: string, approvedBy?: string): Promise<POSSystem | undefined>;
  getAllPOSSystems(): Promise<POSSystem[]>;
  getPOSSystemsByStatus(status: string): Promise<POSSystem[]>;

  // Product operations
  getProductsByPOSId(posId: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  getProduct(id: string): Promise<Product | undefined>;
  updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  updateProductStock(productId: string, newStock: number): Promise<Product | undefined>;
  reduceProductStock(productId: string, quantity: number): Promise<boolean>;

  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByPOSId(posId: string): Promise<Transaction[]>;
  getSalesByDateRange(posId: string, startDate: Date, endDate: Date): Promise<Transaction[]>;
  getDailySales(posId: string, date: Date): Promise<{ transactions: Transaction[], totalSales: number, totalTransactions: number }>;

  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private dataFilePath: string;
  public sessionStore: session.Store;

  constructor() {
    this.dataFilePath = join(process.cwd(), 'data.json');
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Ensure data file exists
    this.initializeDataFile();
  }

  private initializeDataFile() {
    if (!existsSync(this.dataFilePath)) {
      const initialData: DatabaseData = {
        adminUsers: [
          {
            id: randomUUID(),
            username: "superadmin",
            password: "cab708386cd92f7c0d40d2ce24427be9bc6f8de3179d3eac308f564528b9ad71ae98928bf390156fbc6547e9519f1ffc3ba120762880bc300d429b13e84fc07f.43975cbfd0f951ab630217b8aa9568f4", // "adminsuperaccess" hashed
            createdAt: new Date(),
          }
        ],
        posSystems: [],
        products: [],
        transactions: [],
      };
      this.saveData(initialData);
    }
  }

  public loadData(): DatabaseData {
    try {
      const data = readFileSync(this.dataFilePath, 'utf-8');
      const parsed = JSON.parse(data);

      // Convert date strings back to Date objects
      parsed.adminUsers = parsed.adminUsers.map((user: any) => ({
        ...user,
        createdAt: new Date(user.createdAt)
      }));

      parsed.posSystems = parsed.posSystems.map((system: any) => ({
        ...system,
        createdAt: new Date(system.createdAt),
        approvedAt: system.approvedAt ? new Date(system.approvedAt) : null
      }));

      parsed.transactions = parsed.transactions.map((transaction: any) => ({
        ...transaction,
        createdAt: new Date(transaction.createdAt)
      }));

      return parsed;
    } catch (error) {
      console.error('Error loading data file:', error);
      return {
        adminUsers: [],
        posSystems: [],
        products: [],
        transactions: [],
      };
    }
  }

  public saveData(data: DatabaseData) {
    try {
      writeFileSync(this.dataFilePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving data file:', error);
    }
  }

  async getAdminUser(id: string): Promise<AdminUser | undefined> {
    const data = this.loadData();
    return data.adminUsers.find(user => user.id === id);
  }

  async getAdminUserByUsername(username: string): Promise<AdminUser | undefined> {
    const data = this.loadData();
    return data.adminUsers.find(user => user.username === username);
  }

  async createAdminUser(insertUser: InsertAdminUser): Promise<AdminUser> {
    const data = this.loadData();
    const id = randomUUID();
    const user: AdminUser = { 
      ...insertUser, 
      id,
      createdAt: new Date(),
    };
    data.adminUsers.push(user);
    this.saveData(data);
    return user;
  }

  async getPOSSystem(id: string): Promise<POSSystem | undefined> {
    const data = this.loadData();
    return data.posSystems.find(system => system.id === id);
  }

  async getPOSSystemByUsername(username: string): Promise<POSSystem | undefined> {
    const data = this.loadData();
    return data.posSystems.find(system => system.username === username);
  }

  async createPOSSystem(system: InsertPOSSystem): Promise<POSSystem> {
    const data = this.loadData();
    const id = randomUUID();
    const newSystem: POSSystem = {
      ...system,
      id,
      status: "pending",
      currencySymbol: "$",
      businessAddress: "123 Main Street, City, ST 12345",
      businessPhone: "(555) 123-4567",
      receiptFooter: "Thank you for your business!\nPlease come again",
      taxRate: "8.5",
      createdAt: new Date(),
      approvedAt: null,
      approvedBy: null,
    };
    data.posSystems.push(newSystem);
    this.saveData(data);
    return newSystem;
  }

  private async createDefaultProducts(posId: string) {
    const defaultProducts = [
      { name: "Espresso", price: "3.50", category: "Beverages", stock: 50 },
      { name: "Latte", price: "4.00", category: "Beverages", stock: 30 },
      { name: "Cappuccino", price: "3.75", category: "Beverages", stock: 40 },
      { name: "Croissant", price: "4.25", category: "Food", stock: 20 },
      { name: "Bagel", price: "2.50", category: "Food", stock: 15 },
      { name: "Muffin", price: "3.00", category: "Desserts", stock: 25 },
    ];

    for (const product of defaultProducts) {
      await this.createProduct({
        posId,
        name: product.name,
        price: product.price,
        category: product.category,
        stock: product.stock,
      });
    }
  }

  async updatePOSSystemStatus(id: string, status: string, approvedBy?: string): Promise<POSSystem | undefined> {
    const data = this.loadData();
    const systemIndex = data.posSystems.findIndex(system => system.id === id);
    if (systemIndex === -1) return undefined;

    data.posSystems[systemIndex] = {
      ...data.posSystems[systemIndex],
      status,
      approvedAt: status === "approved" ? new Date() : null,
      approvedBy: approvedBy || null,
    };

    this.saveData(data);
    return data.posSystems[systemIndex];
  }

  deletePOSSystem(id: string): boolean {
    const data = this.loadData();
    const systemIndex = data.posSystems.findIndex(system => system.id === id);

    if (systemIndex === -1) {
      return false;
    }

    // Also delete all related products and transactions
    data.products = data.products.filter(product => product.posId !== id);
    data.transactions = data.transactions.filter(transaction => transaction.posId !== id);

    // Remove the POS system
    data.posSystems.splice(systemIndex, 1);

    this.saveData(data);
    return true;
  }

  async getAllPOSSystems(): Promise<POSSystem[]> {
    const data = this.loadData();
    return data.posSystems;
  }

  async getPOSSystemsByStatus(status: string): Promise<POSSystem[]> {
    const data = this.loadData();
    return data.posSystems.filter(system => system.status === status);
  }

  async getProductsByPOSId(posId: string): Promise<Product[]> {
    const data = this.loadData();
    return data.products.filter(product => product.posId === posId && product.isActive === "true");
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const data = this.loadData();
    const id = randomUUID();
    const product: Product = {
      ...insertProduct,
      id,
      category: insertProduct.category || "general",
      stock: insertProduct.stock ?? 0,
      isActive: "true",
    };
    data.products.push(product);
    this.saveData(data);
    return product;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const data = this.loadData();
    const id = randomUUID();
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      createdAt: new Date(),
    };
    data.transactions.push(transaction);
    this.saveData(data);
    return transaction;
  }

  async getTransactionsByPOSId(posId: string): Promise<Transaction[]> {
    const data = this.loadData();
    return data.transactions.filter(transaction => transaction.posId === posId);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const data = this.loadData();
    return data.products.find(product => product.id === id);
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    const data = this.loadData();
    const productIndex = data.products.findIndex(product => product.id === id);

    if (productIndex === -1) {
      return undefined;
    }

    data.products[productIndex] = { ...data.products[productIndex], ...updates };
    this.saveData(data);
    return data.products[productIndex];
  }

  async deleteProduct(id: string): Promise<boolean> {
    const data = this.loadData();
    const productIndex = data.products.findIndex(product => product.id === id);

    if (productIndex === -1) {
      return false;
    }

    data.products.splice(productIndex, 1);
    this.saveData(data);
    return true;
  }

  async updateProductStock(productId: string, newStock: number): Promise<Product | undefined> {
    const data = this.loadData();
    const productIndex = data.products.findIndex(product => product.id === productId);

    if (productIndex === -1) {
      return undefined;
    }

    data.products[productIndex].stock = newStock;
    this.saveData(data);
    return data.products[productIndex];
  }

  async reduceProductStock(productId: string, quantity: number): Promise<boolean> {
    const data = this.loadData();
    const productIndex = data.products.findIndex(product => product.id === productId);

    if (productIndex === -1) {
      return false;
    }

    const product = data.products[productIndex];
    if (product.stock < quantity) {
      return false; // Not enough stock
    }

    product.stock -= quantity;
    this.saveData(data);
    return true;
  }

  async getSalesByDateRange(posId: string, startDate: Date, endDate: Date): Promise<Transaction[]> {
    const data = this.loadData();
    return data.transactions.filter(transaction => 
      transaction.posId === posId &&
      transaction.createdAt >= startDate &&
      transaction.createdAt <= endDate
    );
  }

  async getDailySales(posId: string, date: Date): Promise<{ transactions: Transaction[], totalSales: number, totalTransactions: number }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const transactions = await this.getSalesByDateRange(posId, startOfDay, endOfDay);
    const totalSales = transactions.reduce((sum, transaction) => sum + parseFloat(transaction.total), 0);

    return {
      transactions,
      totalSales,
      totalTransactions: transactions.length
    };
  }
}

export const storage = new MemStorage();