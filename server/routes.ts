import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { mongoStorage } from "./mongodb-storage";
import { insertPOSSystemSchema, insertTransactionSchema, posCreationSchema } from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Middleware to check if user is authenticated admin
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || req.user?.userType !== "admin") {
      return res.status(401).json({ message: "Admin access required" });
    }
    next();
  };

  // Middleware to check if user is authenticated POS
  const requirePOS = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || req.user?.userType !== "pos") {
      return res.status(401).json({ message: "POS access required" });
    }
    next();
  };

  // Get all approved POS systems (for selection)
  app.get("/api/pos/systems", async (req, res) => {
    try {
      const systems = await mongoStorage.getAllPOSSystems();
      const approvedSystems = systems.filter((system: any) => system.status === "approved");
      res.json(approvedSystems);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch POS systems" });
    }
  });

  // Get specific POS system by ID
  app.get("/api/pos/systems/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const system = await mongoStorage.getPOSSystem(id);
      if (!system) {
        return res.status(404).json({ message: "POS system not found" });
      }
      res.json(system);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch POS system" });
    }
  });

  // POS Creation endpoint
  app.post("/api/pos/create", async (req, res) => {
    try {
      const data = posCreationSchema.parse(req.body);

      // Check if username already exists
      const existingSystem = await mongoStorage.getPOSSystemByUsername(data.username);
      if (existingSystem) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await hashPassword(data.password);
      const system = await mongoStorage.createPOSSystem({
        businessName: data.businessName,
        contactEmail: data.contactEmail,
        username: data.username,
        password: hashedPassword,
      });

      res.status(201).json({
        message: "POS system request submitted successfully. Awaiting admin approval.",
        systemId: system.id,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create POS system" });
    }
  });

  // Admin: Get all POS systems
  app.get("/api/admin/pos-systems", requireAdmin, async (req, res) => {
    try {
      const systems = await mongoStorage.getAllPOSSystems();
      res.json(systems);
    } catch (error) {
      console.error("Error fetching POS systems:", error);
      res.status(500).json({ error: "Failed to fetch POS systems" });
    }
  });

  // Admin: Approve POS system
  app.post("/api/admin/pos-systems/:id/approve", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updatedSystem = await mongoStorage.updatePOSSystemStatus(id, "approved", req.user?.id);

      if (!updatedSystem) {
        return res.status(404).json({ message: "POS system not found" });
      }

      res.json({ message: "POS system approved successfully", system: updatedSystem });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to approve POS system" });
    }
  });

  // Admin: Reject POS system
  app.post("/api/admin/pos-systems/:id/reject", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updatedSystem = await mongoStorage.updatePOSSystemStatus(id, "rejected", req.user?.id);

      if (!updatedSystem) {
        return res.status(404).json({ message: "POS system not found" });
      }

      res.json({ message: "POS system rejected successfully", system: updatedSystem });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to reject POS system" });
    }
  });

  // Admin: Delete POS system
  app.delete("/api/admin/pos-systems/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await mongoStorage.deletePOSSystem(id);

      if (!deleted) {
        return res.status(404).json({ message: "POS system not found" });
      }

      res.json({ message: "POS system deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete POS system" });
    }
  });

  // Admin: Get dashboard stats
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await mongoStorage.getAdminStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch stats" });
    }
  });

  // POS: Get products
  app.get("/api/pos/products", requirePOS, async (req, res) => {
    try {
      const products = await mongoStorage.getProductsByPOSId(req.user?.id!);
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch products" });
    }
  });

  // POS: Create product
  app.post("/api/pos/products", requirePOS, async (req, res) => {
    try {
      const posId = req.user?.id!;
      const productData = { ...req.body, posId };
      const product = await mongoStorage.createProduct(productData);
      res.status(201).json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create product" });
    }
  });

  // POS: Update product
  app.put("/api/pos/products/:id", requirePOS, async (req, res) => {
    try {
      const posId = req.user?.id!;
      const productId = req.params.id;

      // Verify the product belongs to the authenticated POS
      const existingProduct = await mongoStorage.getProduct(productId);
      if (!existingProduct || existingProduct.posId !== posId) {
        return res.status(404).json({ message: "Product not found" });
      }

      const product = await mongoStorage.updateProduct(productId, req.body);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update product" });
    }
  });

  // POS: Delete product
  app.delete("/api/pos/products/:id", requirePOS, async (req, res) => {
    try {
      const posId = req.user?.id!;
      const productId = req.params.id;

      // Verify the product belongs to the authenticated POS
      const existingProduct = await mongoStorage.getProduct(productId);
      if (!existingProduct || existingProduct.posId !== posId) {
        return res.status(404).json({ message: "Product not found" });
      }

      await mongoStorage.deleteProduct(productId);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to delete product" });
    }
  });

  // POS: Update product stock
  app.put("/api/pos/products/:id/stock", requirePOS, async (req, res) => {
    try {
      const posId = req.user?.id!;
      const productId = req.params.id;
      const { stock } = req.body;

      // Verify the product belongs to the authenticated POS
      const existingProduct = await mongoStorage.getProduct(productId);
      if (!existingProduct || existingProduct.posId !== posId) {
        return res.status(404).json({ message: "Product not found" });
      }

      const updatedProduct = await mongoStorage.updateProductStock(productId, parseInt(stock));
      res.json(updatedProduct);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to update stock" });
    }
  });

  // POS: Get daily sales
  app.get("/api/pos/sales/daily", requirePOS, async (req, res) => {
    try {
      const posId = req.user?.id!;
      const date = req.query.date ? new Date(req.query.date as string) : new Date();

      const salesData = await mongoStorage.getDailySales(posId, date);
      res.json(salesData);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch daily sales" });
    }
  });

  // POS: Get sales by date range
  app.get("/api/pos/sales/range", requirePOS, async (req, res) => {
    try {
      const posId = req.user?.id!;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      const transactions = await mongoStorage.getSalesByDateRange(
        posId, 
        new Date(startDate as string), 
        new Date(endDate as string)
      );

      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch sales data" });
    }
  });

  // POS: Create transaction
  app.post("/api/pos/transactions", requirePOS, async (req, res) => {
    try {
      const data = insertTransactionSchema.parse({
        ...req.body,
        posId: req.user?.id,
      });

      // Check stock availability and reduce stock for each item
      const items = Array.isArray(data.items) ? data.items : [];
      for (const item of items) {
        const stockReductionSuccess = await mongoStorage.reduceProductStock(item.productId, item.quantity);
        if (!stockReductionSuccess) {
          return res.status(400).json({ 
            message: `Insufficient stock for product: ${item.name}` 
          });
        }
      }

      const transaction = await mongoStorage.createTransaction(data);
      res.status(201).json(transaction);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create transaction" });
    }
  });

  // POS: Get transaction history
  app.get("/api/pos/transactions", requirePOS, async (req, res) => {
    try {
      const transactions = await mongoStorage.getTransactionsByPOSId(req.user?.id!);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch transactions" });
    }
  });

  // POS: Update currency symbol
  app.put("/api/pos/currency", requirePOS, async (req, res) => {
    try {
      const posId = req.user?.id!;
      const { currencySymbol } = req.body;

      if (!currencySymbol || currencySymbol.trim() === "") {
        return res.status(400).json({ message: "Currency symbol is required" });
      }

      const system = await mongoStorage.getPOSSystem(posId);

      if (!system) {
        return res.status(404).json({ message: "POS system not found" });
      }

      await mongoStorage.updatePOSSystemStatus(posId, system.status);

      res.json({ message: "Currency symbol updated successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update currency symbol" });
    }
  });

  // POS: Update business information
  app.put("/api/pos/business-info", requirePOS, async (req, res) => {
    try {
      const posId = req.user?.id!;
      const { businessName, businessAddress, businessPhone, receiptFooter, taxRate } = req.body;

      const system = await mongoStorage.getPOSSystem(posId);

      if (!system) {
        return res.status(404).json({ message: "POS system not found" });
      }

      const updates: any = {};
      if (businessName) updates.businessName = businessName.trim();
      if (businessAddress) updates.businessAddress = businessAddress.trim();
      if (businessPhone) updates.businessPhone = businessPhone.trim();
      if (receiptFooter) updates.receiptFooter = receiptFooter.trim();
      if (taxRate !== undefined) {
        const parsedTaxRate = parseFloat(taxRate);
        if (isNaN(parsedTaxRate) || parsedTaxRate < 0 || parsedTaxRate > 100) {
          return res.status(400).json({ message: "Tax rate must be a valid number between 0 and 100" });
        }
        updates.taxRate = parsedTaxRate.toString();
      }

      if (Object.keys(updates).length > 0) {
        await mongoStorage.updatePOSSystem(posId, updates);
      }

      res.json({ message: "Business information updated successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update business information" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}