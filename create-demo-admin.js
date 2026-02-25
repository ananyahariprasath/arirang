import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import 'dotenv/config'; // Load env vars if run standalone

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("❌ ERROR: Missing MONGODB_URI in your environment variables.");
  console.error("Please add MONGODB_URI to your .env.local file and try again.");
  process.exit(1);
}

async function createAdmin() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB.");

    const db = client.db(process.env.MONGODB_DB_NAME || "lavender_cb");
    const usersCollection = db.collection("users");

    // Demo Admin Credentials
    const demoEmail = "admin@arirang.com";
    const demoUsername = "ArirangAdmin";
    const demoPassword = "AdminPassword123!";

    // Check if it already exists
    const existing = await usersCollection.findOne({ email: demoEmail });
    if (existing) {
      console.log(`⚠️  Admin user ${demoEmail} already exists! You can log in with your existing password.`);
      process.exit(0);
    }

    // Hash the password and insert
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(demoPassword, salt);

    await usersCollection.insertOne({
      email: demoEmail,
      username: demoUsername,
      password: hashedPassword,
      role: "admin", 
      createdAt: new Date()
    });

    console.log("\n🎉 Demo Admin created successfully!");
    console.log("-----------------------------------------");
    console.log(`Email:    ${demoEmail}`);
    console.log(`Password: ${demoPassword}`);
    console.log("-----------------------------------------");
    console.log("You can now login on the main page with these credentials.");

  } catch (error) {
    console.error("❌ Database Error:", error);
  } finally {
    await client.close();
  }
}

createAdmin();
