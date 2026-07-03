import { storage } from "../server/storage";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function seedUsers() {
  console.log("Creating/checking test users...");

  try {
    // Create Staff user - access to bookings and bills only (if doesn't exist)
    try {
      const staffUser = await storage.createStaff({
        username: "staff@staff.com",
        password: hashPassword("staff123"),
        role: "staff",
      });
      console.log("✅ Created staff user: staff@staff.com / staff123 (Role: Staff - Bookings & Bills only)");
    } catch (e: any) {
      if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        console.log("✓ Staff user already exists: staff@staff.com");
      } else {
        throw e;
      }
    }

    // Create Admin user - full access (if doesn't exist)
    try {
      const adminUser = await storage.createStaff({
        username: "admin@staff.com",
        password: hashPassword("admin123"),
        role: "admin",
      });
      console.log("✅ Created admin user: admin@staff.com / admin123 (Role: Admin - Full Access)");
    } catch (e: any) {
      if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        console.log("✓ Admin user already exists: admin@staff.com");
      } else {
        throw e;
      }
    }

    console.log("\nTest users ready for use!");
  } catch (error) {
    console.error("Error creating users:", error);
    process.exit(1);
  }
}

seedUsers();
