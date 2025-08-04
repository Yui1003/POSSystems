import { drizzle } from 'drizzle-orm/neon-serverless';
import { AdminUser, POSSystem, Product, Transaction } from '@shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

export const db = drizzle(process.env.DATABASE_URL);

// Storage interface for compatibility
export interface IStorage {
  getAdminUser(id: string): Promise<AdminUser | undefined>;
  getAdminUserByUsername(username: string): Promise<AdminUser | undefined>;
  createAdminUser(user: any): Promise<AdminUser>;
  getPOSSystem(id: string): Promise<POSSystem | undefined>;
  getPOSSystemByUsername(username: string): Promise<POSSystem | undefined>;
  createPOSSystem(system: any): Promise<POSSystem>;
  getAllPOSSystems(): Promise<POSSystem[]>;
  updatePOSSystemStatus(id: string, status: string, approvedBy?: string): Promise<POSSystem | undefined>;
  deletePOSSystem(id: string): Promise<boolean>;
  getProductsByPOSId(posId: string): Promise<Product[]>;
  createProduct(product: any): Promise<Product>;
  getProduct(id: string): Promise<Product | undefined>;
  updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  updateProductStock(productId: string, newStock: number): Promise<Product | undefined>;
  reduceProductStock(productId: string, quantity: number): Promise<boolean>;
  createTransaction(transaction: any): Promise<Transaction>;
  getTransactionsByPOSId(posId: string): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  getDailySales(posId: string, date: Date): Promise<any>;
  getSalesByDateRange(posId: string, startDate: Date, endDate: Date): Promise<Transaction[]>;
  loadData(): any;
  saveData(data: any): void;
}


// Export the db instance as default for backward compatibility
export default db;