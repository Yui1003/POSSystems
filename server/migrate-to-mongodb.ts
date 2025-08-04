
import { MongoStorage } from './mongodb-storage';
import { MemStorage } from './storage';

async function migrateData() {
  console.log('Starting data migration from JSON to MongoDB...');

  try {
    // Initialize both storage systems
    const jsonStorage = new MemStorage();
    const mongoStorage = new MongoStorage();

    // Connect to MongoDB
    await mongoStorage.connect();
    console.log('Connected to MongoDB Atlas');

    // Load existing data from JSON
    const data = jsonStorage.loadData();
    console.log(`Found ${data.adminUsers.length} admin users`);
    console.log(`Found ${data.posSystems.length} POS systems`);
    console.log(`Found ${data.products.length} products`);
    console.log(`Found ${data.transactions.length} transactions`);

    // Migrate admin users (skip if they already exist)
    for (const adminUser of data.adminUsers) {
      const existing = await mongoStorage.getAdminUser(adminUser.id);
      if (!existing) {
        await mongoStorage.createAdminUser({
          username: adminUser.username,
          password: adminUser.password
        });
        console.log(`Migrated admin user: ${adminUser.username}`);
      }
    }

    // Migrate POS systems
    for (const posSystem of data.posSystems) {
      const existing = await mongoStorage.getPOSSystem(posSystem.id);
      if (!existing) {
        // Create the POS system with all its properties
        const newSystem = await mongoStorage.createPOSSystem({
          businessName: posSystem.businessName,
          contactEmail: posSystem.contactEmail,
          username: posSystem.username,
          password: posSystem.password
        });

        // Update with additional properties
        await mongoStorage.updatePOSSystemStatus(
          newSystem.id, 
          posSystem.status, 
          posSystem.approvedBy || undefined
        );
        console.log(`Migrated POS system: ${posSystem.businessName}`);
      }
    }

    // Migrate products
    for (const product of data.products) {
      const existing = await mongoStorage.getProduct(product.id);
      if (!existing) {
        await mongoStorage.createProduct({
          posId: product.posId,
          name: product.name,
          price: product.price,
          category: product.category,
          stock: product.stock,
          image: product.image
        });
        console.log(`Migrated product: ${product.name}`);
      }
    }

    // Migrate transactions
    for (const transaction of data.transactions) {
      await mongoStorage.createTransaction({
        posId: transaction.posId,
        receiptNumber: transaction.receiptNumber,
        items: transaction.items,
        subtotal: transaction.subtotal,
        tax: transaction.tax,
        total: transaction.total,
        paymentMethod: transaction.paymentMethod
      });
    }
    console.log(`Migrated ${data.transactions.length} transactions`);

    console.log('Data migration completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateData();
