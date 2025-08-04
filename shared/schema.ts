import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Admin users table
export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// POS systems table
export const posSystems = pgTable("pos_systems", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessName: text("business_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  currencySymbol: text("currency_symbol").notNull().default("$"),
  businessAddress: text("business_address").default("123 Main Street, City, ST 12345"),
  businessPhone: text("business_phone").default("(555) 123-4567"),
  receiptFooter: text("receipt_footer").default("Thank you for your business!\nPlease come again"),
  taxRate: text("tax_rate").notNull().default("8.5"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by").references(() => adminUsers.id),
});

// Products table
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  posId: varchar("pos_id").notNull().references(() => posSystems.id),
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull().default("general"),
  stock: integer("stock").notNull().default(0),
  image: text("image"), // Image URL
  isActive: text("is_active").notNull().default("true"),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  posId: varchar("pos_id").notNull().references(() => posSystems.id),
  receiptNumber: text("receipt_number").notNull(),
  items: jsonb("items").notNull(), // Array of {productId, name, price, quantity}
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // cash, card
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Schema definitions for validation
export const insertAdminUserSchema = createInsertSchema(adminUsers).pick({
  username: true,
  password: true,
});

export const insertPOSSystemSchema = createInsertSchema(posSystems).pick({
  businessName: true,
  contactEmail: true,
  username: true,
  password: true,
});

export const insertProductSchema = createInsertSchema(products).pick({
  posId: true,
  name: true,
  price: true,
  category: true,
  stock: true,
  image: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  posId: true,
  receiptNumber: true,
  items: true,
  subtotal: true,
  tax: true,
  total: true,
  paymentMethod: true,
});

// Extended schemas for forms
export const posCreationSchema = insertPOSSystemSchema.extend({
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const posLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const adminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Type exports
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertPOSSystem = z.infer<typeof insertPOSSystemSchema>;
export type POSSystem = typeof posSystems.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type POSCreationData = z.infer<typeof posCreationSchema>;
export type POSLoginData = z.infer<typeof posLoginSchema>;
export type AdminLoginData = z.infer<typeof adminLoginSchema>;
