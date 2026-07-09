import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { sendWhatsAppNotification } from "./notify";
import { randomUUID } from "crypto";
import multer from "multer";
import path from "path";
import fs from "fs";

// Simple password hashing (in production use bcrypt)
import * as crypto from "crypto";
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Configure multer for file uploads
// Use /tmp in serverless environments (Vercel), local path otherwise
const uploadDir = process.env.VERCEL
  ? "/tmp/rate_cards"
  : path.join(process.cwd(), "attached_assets", "rate_cards");
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch { /* read-only filesystem in serverless — uploads won't persist but won't crash */ }

function getUpload() {
  const storageConfig = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const uniqueName = `${randomUUID()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  });
  return multer({
    storage: storageConfig,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|pdf/;
      if (allowedTypes.test(path.extname(file.originalname).toLowerCase()) && allowedTypes.test(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Only JPEG, PNG or PDF files are allowed"));
      }
    }
  });
}

// Sample rate data for cost calculator
const RATE_DATA = {
  "Times of India": {
    "Delhi NCR": {
      classified: { baseRate: 50, lineRate: 15 },
      display: { baseRate: 200, cm2Rate: 2 },
    },
    "Mumbai": {
      classified: { baseRate: 60, lineRate: 18 },
      display: { baseRate: 250, cm2Rate: 2.5 },
    },
  },
  "Hindustan Times": {
    "Delhi NCR": {
      classified: { baseRate: 45, lineRate: 12 },
      display: { baseRate: 180, cm2Rate: 1.8 },
    },
    "Mumbai": {
      classified: { baseRate: 55, lineRate: 15 },
      display: { baseRate: 220, cm2Rate: 2.2 },
    },
  },
  "Dainik Jagran": {
    "Delhi NCR": {
      classified: { baseRate: 30, lineRate: 8 },
      display: { baseRate: 120, cm2Rate: 1 },
    },
  },
};

// Track logged-in users (session-like)
type SessionData = { userId: string; email: string; role?: string };
const sessions: Map<string, SessionData> = new Map();

// Admin credentials (hardcoded for demo)
const ADMIN_EMAIL = "admin@amitads.com";
const ADMIN_PASSWORD_HASH = hashPassword("admin123");
const STAFF_ADMIN_EMAILS = ["admin@staff.com", "admin@amitads.com"];

const isStaffAdminEmail = (email?: string) => {
  if (!email) return false;
  return STAFF_ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === email.toLowerCase());
};

export function registerRoutes(
  httpServer: Server,
  app: Express,
): Server {
  try {
    console.log("Registering routes...");

    // Simple test route
    app.get("/api/test", (req, res) => {
      console.log("Test route called");
      res.json({ message: "API is working", timestamp: new Date().toISOString() });
    });

    // Another simple route
    app.get("/api/ping", (req, res) => {
      console.log("Ping route called");
      res.json({ pong: true, time: Date.now() });
    });

  // POST /api/auth/signup
  app.post("/api/auth/signup", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Check if user exists
    const existing = await storage.getUserByUsername(email);
    if (existing) {
      return res.status(409).json({ error: "User already exists" });
    }

    try {
      const user = await storage.createUser({
        username: email,
        password: hashPassword(password),
      });

      // Create session
      const sessionToken = randomUUID();
      sessions.set(sessionToken, { userId: user.id, email });

      res.json({ sessionToken, user: { id: user.id, email: user.username } });
    } catch (error) {
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // POST /api/auth/login
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = await storage.getUserByUsername(email);
    if (!user || user.password !== hashPassword(password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const sessionToken = randomUUID();
    sessions.set(sessionToken, { userId: user.id, email });

    // Record this login for staff visibility (optional, don't block on failure)
    // try {
    //   await storage.createStaffLogin({ userEmail: email, userId: user.id });
    // } catch (err) {
    //   console.error("Failed to record login:", err);
    // }

    res.json({ sessionToken, user: { id: user.id, email: user.username } });
  });

  // POST /api/staff/login
  app.post("/api/staff/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const staff = await storage.getStaffByUsername(username);
    if (!staff || staff.password !== hashPassword(password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const sessionToken = randomUUID();
    const admin = staff.role === "admin" || isStaffAdminEmail(staff.username);
    sessions.set(sessionToken, { userId: staff.id, email: staff.username, role: admin ? "admin" : staff.role });

    res.json({
      sessionToken,
      staff: {
        id: staff.id,
        username: staff.username,
        role: admin ? "admin" : staff.role
      }
    });
  });

  // POST /api/staff/logout
  app.post("/api/staff/logout", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token) {
      sessions.delete(token);
    }
    res.json({ success: true });
  });

  // ============ PUBLIC ROUTES ============

  // GET /api/newspapers - Get all newspapers (public)
  app.get("/api/newspapers", (req, res) => {
    (async () => {
      try {
        const newspapers = await storage.getAllNewspapers();
        // Only return active newspapers for public API
        const activeNewspapers = newspapers.filter(n => n.active);
        res.json(activeNewspapers);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch newspapers" });
      }
    })();
  });

  // GET /api/newspapers/by-location - Get newspapers by state/city (public)
  app.get("/api/newspapers/by-location", (req, res) => {
    const { state, city } = req.query;
    console.log("by-location called with:", { state, city });

    (async () => {
      try {
        let newspapers: any[] = [];

        if (city) {
          console.log("Looking for city:", city);
          // Get city by ID
          const cityData = await storage.getCity(city as string);
          console.log("City data found:", cityData);
          if (cityData) {
            // Use optimized query to get newspapers with editions in the city
            const newspaperIds = await storage.getNewspaperIdsByCity(cityData.id);
            console.log("Newspaper IDs found:", newspaperIds);
            if (newspaperIds.length > 0) {
              newspapers = await storage.getNewspapersByIds(newspaperIds);
              newspapers = newspapers.filter(n => n && n.active);
            }
            console.log("Active newspapers found:", newspapers.length);
          } else {
            console.log("City not found");
          }
        } else if (state) {
          // Get all newspapers that have editions in the specified state
          const newspaperIds = await storage.getNewspaperIdsByState(state as string);
          console.log("Newspapers found for state:", newspaperIds.length);
          if (newspaperIds.length > 0) {
            newspapers = await storage.getNewspapersByIds(newspaperIds);
            newspapers = newspapers.filter(n => n && n.active);
          }
        }
        
        // If no newspapers found with location filter, return all active newspapers
        if (newspapers.length === 0) {
          console.log("No newspapers found with location filter, returning all active newspapers");
          newspapers = await storage.getAllNewspapers();
          newspapers = newspapers.filter(n => n.active);
        }

        console.log("Returning newspapers:", newspapers.length);
        res.json(newspapers);
      } catch (error) {
        console.error("Error fetching newspapers by location:", error);
        res.status(500).json({ error: "Failed to fetch newspapers by location" });
      }
    })();
  });

  // GET /api/newspapers/:id - Get single newspaper (public)
  app.get("/api/newspapers/:id", (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const newspaper = await storage.getNewspaper(id);
        if (!newspaper || !newspaper.active) {
          return res.status(404).json({ error: "Newspaper not found" });
        }
        res.json(newspaper);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch newspaper" });
      }
    })();
  });

  // GET /api/newspapers/:id/editions - Get editions for a newspaper (public)
  app.get("/api/newspapers/:id/editions", (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const editions = await storage.getEditionsByNewspaper(id);
        res.json(editions);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch editions" });
      }
    })();
  });

  // GET /api/newspapers/:id/ad-types - Get ad types for a newspaper (public)
  app.get("/api/newspapers/:id/ad-types", (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const adTypes = await storage.getAdTypesByNewspaper(id);
        // Only return active ad types
        const activeAdTypes = adTypes.filter(at => at.active);
        res.json(activeAdTypes);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch ad types" });
      }
    })();
  });

  // GET /api/ad-types/:id/categories - Get categories for an ad type (public)
  app.get("/api/ad-types/:id/categories", (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const categories = await storage.getCategoriesByAdType(id);
        // Only return active categories
        const activeCategories = categories.filter(c => c.active);
        res.json(activeCategories);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch categories" });
      }
    })();
  });

  // GET /api/cities - Get all cities (public)
  app.get("/api/cities", (req, res) => {
    (async () => {
      try {
        const cities = await storage.getAllCities();
        res.json(cities);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch cities" });
      }
    })();
  });

  // GET /api/newspapers/:id/packages - Get packages for a newspaper (public)
  app.get("/api/newspapers/:id/packages", (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const packages = await storage.getPackagesByNewspaper(id);
        // Only return active packages
        const activePackages = packages.filter(p => p.active);
        res.json(activePackages);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch packages" });
      }
    })();
  });

  // GET /api/editions/:id - Get single edition (public)
  app.get("/api/editions/:id", (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const edition = await storage.getEdition(id);
        if (!edition) {
          return res.status(404).json({ error: "Edition not found" });
        }
        res.json(edition);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch edition" });
      }
    })();
  });

  // GET /api/categories - Get all categories (public)
  app.get("/api/categories", (req, res) => {
    (async () => {
      try {
        const categories = await storage.getAllCategories();
        // Only return active categories and deduplicate by name
        const activeCategories = categories.filter(c => c.active);
        const uniqueCategories = Array.from(
          new Map(activeCategories.map(cat => [cat.name, cat])).values()
        );
        res.json(uniqueCategories);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch categories" });
      }
    })();
  });

  // GET /api/categories/:id - Get single category (public)
  app.get("/api/categories/:id", (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const category = await storage.getCategory(id);
        if (!category || !category.active) {
          return res.status(404).json({ error: "Category not found" });
        }
        res.json(category);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch category" });
      }
    })();
  });

  // GET /api/categories/:id/subcategories - Get subcategories for a category (public)
  app.get("/api/categories/:id/subcategories", (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        // Get all categories first
        const allCategories = await storage.getAllCategories();
        const activeCategories = allCategories.filter(c => c.active);
        
        // Find category by ID first
        let category = activeCategories.find(c => c.id === id);
        
        // If not found by ID, find by name
        if (!category) {
          category = activeCategories.find(c => c.name === id);
        }
        
        if (!category) {
          return res.status(404).json({ error: "Category not found" });
        }

        // Find all categories with the same name
        const categoriesWithSameName = activeCategories.filter(c => c.name === category.name);
        
        // Get subcategories for all categories with the same name
        const allSubcategories = [];
        for (const cat of categoriesWithSameName) {
          const subcategories = await storage.getSubcategoriesByCategory(cat.id);
          allSubcategories.push(...subcategories);
        }

        // Deduplicate subcategories by name and return only active ones
        const uniqueSubcategories = Array.from(
          new Map(allSubcategories.filter(s => s.active).map(sub => [sub.name, sub])).values()
        );
        res.json(uniqueSubcategories);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch subcategories" });
      }
    })();
  });

  // GET /api/subcategories/:id - Get single subcategory (public)
  app.get("/api/subcategories/:id", (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const subcategory = await storage.getSubcategory(id);
        if (!subcategory || !subcategory.active) {
          return res.status(404).json({ error: "Subcategory not found" });
        }
        res.json(subcategory);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch subcategory" });
      }
    })();
  });

  // GET /api/subcategories/:id/preferred-classifications - Get preferred classifications for a subcategory (public)
  app.get("/api/subcategories/:id/preferred-classifications", (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const classifications = await storage.getPreferredClassificationsBySubcategory(id);
        // Only return active classifications
        const activeClassifications = classifications.filter(c => c.active);
        res.json(activeClassifications);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch preferred classifications" });
      }
    })();
  });

  // GET /api/preferred-classifications/:id - Get single preferred classification (public)
  app.get("/api/preferred-classifications/:id", (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const classification = await storage.getPreferredClassification(id);
        if (!classification || !classification.active) {
          return res.status(404).json({ error: "Preferred classification not found" });
        }
        res.json(classification);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch preferred classification" });
      }
    })();
  });

  // GET /api/preferred-classifications/:id/sub-classifications - Get sub classifications for a preferred classification (public)
  app.get("/api/preferred-classifications/:id/sub-classifications", (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const classifications = await storage.getSubClassificationsByPreferredClassification(id);
        // Only return active classifications
        const activeClassifications = classifications.filter(c => c.active);
        res.json(activeClassifications);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch sub classifications" });
      }
    })();
  });

  // GET /api/sub-classifications/:id - Get single sub-classification (public)
  app.get("/api/sub-classifications/:id", (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const classification = await storage.getSubClassification(id);
        if (!classification || !classification.active) {
          return res.status(404).json({ error: "Sub-classification not found" });
        }
        res.json(classification);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch sub-classification" });
      }
    })();
  });

  // GET /api/ad-enchantments - Get all ad enchantments (public)
  app.get("/api/ad-enchantments", (req, res) => {
    (async () => {
      try {
        const enchantments = await storage.getAllAdEnchantments();
        // Only return active enchantments
        const activeEnchantments = enchantments.filter(e => e.active);
        res.json(activeEnchantments);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch ad enchantments" });
      }
    })();
  });

  // ============ STAFF-PROTECTED ROUTES ============

  // Middleware to check staff authentication
  const requireStaffAuth = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const session = sessions.get(token || "");

    if (!session || !session.userId) {
      return res.status(401).json({ error: "Staff authentication required" });
    }

    (req as any).staffId = session.userId;
    (req as any).staffEmail = session.email;
    (req as any).staffRole = session.role;
    next();
  };

  // Middleware to check public user authentication
  const requireUserAuth = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const session = sessions.get(token || "");

    if (!session || !session.userId) {
      return res.status(401).json({ error: "User authentication required" });
    }

    (req as any).userId = session.userId;
    (req as any).userEmail = session.email;
    next();
  };

  const requireAdminStaffAuth = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const session = sessions.get(token || "");

    if (!session || !session.userId) {
      return res.status(401).json({ error: "Staff authentication required" });
    }

    const admin = session.role === "admin" || isStaffAdminEmail(session.email);
    if (!admin) {
      return res.status(403).json({ error: "Admin staff access required" });
    }

    (req as any).staffId = session.userId;
    (req as any).staffEmail = session.email;
    (req as any).staffRole = session.role;
    next();
  };

  // ============ NEWSPAPERS ROUTES ============

  // GET /api/staff/newspapers - Get all newspapers for staff
  app.get("/api/staff/newspapers", requireStaffAuth, (req, res) => {
    (async () => {
      try {
        const newspapers = await storage.getAllNewspapers();
        res.json(newspapers);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch newspapers" });
      }
    })();
  });

  // POST /api/staff/newspapers - Create new newspaper
  app.post("/api/staff/newspapers", requireAdminStaffAuth, (req, res) => {
    const { name, language, type, pricingUnit } = req.body;

    if (!name || !language || !type) {
      return res.status(400).json({ error: "Name, language, and type are required" });
    }

    (async () => {
      try {
        const newspaper = await storage.createNewspaper({
          name,
          language,
          type,
          pricingUnit: pricingUnit || "line",
          active: true,
        });
        res.json(newspaper);
      } catch (error) {
        res.status(500).json({ error: "Failed to create newspaper" });
      }
    })();
  });

  // PUT /api/staff/newspapers/:id - Update newspaper
  app.put("/api/staff/newspapers/:id", requireAdminStaffAuth, (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    (async () => {
      try {
        const newspaper = await storage.updateNewspaper(id, updates);
        if (!newspaper) {
          return res.status(404).json({ error: "Newspaper not found" });
        }
        res.json(newspaper);
      } catch (error) {
        res.status(500).json({ error: "Failed to update newspaper" });
      }
    })();
  });

  // DELETE /api/staff/newspapers/:id - Delete newspaper
  app.delete("/api/staff/newspapers/:id", requireAdminStaffAuth, (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const success = await storage.deleteNewspaper(id);
        if (!success) {
          return res.status(404).json({ error: "Newspaper not found" });
        }
        res.json({ success: true });
      } catch (error) {
        if (error instanceof Error && error.message.includes("Cannot delete newspaper")) {
          return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: "Failed to delete newspaper" });
      }
    })();
  });

  // GET /api/staff/newspapers/:id/ad-types - Get ad types for a newspaper
  app.get("/api/staff/newspapers/:id/ad-types", requireAdminStaffAuth, (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const adTypes = await storage.getAdTypesByNewspaper(id);
        res.json(adTypes);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch ad types" });
      }
    })();
  });

  // ============ AD TYPES ROUTES ============

  // GET /api/staff/ad-types - Get all ad types
  app.get("/api/staff/ad-types", requireAdminStaffAuth, (req, res) => {
    (async () => {
      try {
        const adTypes = await storage.getAllAdTypes();
        res.json(adTypes);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch ad types" });
      }
    })();
  });

  // POST /api/staff/ad-types - Create new ad type
  app.post("/api/staff/ad-types", requireAdminStaffAuth, (req, res) => {
    const { newspaperId, name } = req.body;

    if (!newspaperId || !name) {
      return res.status(400).json({ error: "Newspaper ID and name are required" });
    }

    (async () => {
      try {
        const adType = await storage.createAdType({
          newspaperId,
          name,
          active: true,
        });
        res.json(adType);
      } catch (error) {
        res.status(500).json({ error: "Failed to create ad type" });
      }
    })();
  });

  // PUT /api/staff/ad-types/:id - Update ad type
  app.put("/api/staff/ad-types/:id", requireAdminStaffAuth, (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    (async () => {
      try {
        const adType = await storage.updateAdType(id, updates);
        if (!adType) {
          return res.status(404).json({ error: "Ad type not found" });
        }
        res.json(adType);
      } catch (error) {
        res.status(500).json({ error: "Failed to update ad type" });
      }
    })();
  });

  // DELETE /api/staff/ad-types/:id - Delete ad type
  app.delete("/api/staff/ad-types/:id", requireAdminStaffAuth, (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const success = await storage.deleteAdType(id);
        if (!success) {
          return res.status(404).json({ error: "Ad type not found" });
        }
        res.json({ success: true });
      } catch (error) {
        if (error instanceof Error && error.message.includes("Cannot delete ad type")) {
          return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: "Failed to delete ad type" });
      }
    })();
  });

  // GET /api/staff/ad-types/:id/categories - Get categories for an ad type
  app.get("/api/staff/ad-types/:id/categories", requireAdminStaffAuth, (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const categories = await storage.getCategoriesByAdType(id);
        res.json(categories);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch categories" });
      }
    })();
  });

  // POST /api/staff/ad-types/:id/categories - Create category for ad type
  app.post("/api/staff/ad-types/:id/categories", requireStaffAuth, (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    (async () => {
      try {
        const category = await storage.createCategory({
          adTypeId: id,
          name,
          active: true,
        });
        res.json(category);
      } catch (error) {
        res.status(500).json({ error: "Failed to create category" });
      }
    })();
  });

  // ============ CATEGORIES ROUTES ============

  // GET /api/staff/categories - Get all categories
  app.get("/api/staff/categories", requireAdminStaffAuth, (req, res) => {
    (async () => {
      try {
        const categories = await storage.getAllCategories();
        res.json(categories);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch categories" });
      }
    })();
  });

  // PUT /api/staff/categories/:id - Update category
  app.put("/api/staff/categories/:id", requireAdminStaffAuth, (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    (async () => {
      try {
        const category = await storage.updateCategory(id, updates);
        if (!category) {
          return res.status(404).json({ error: "Category not found" });
        }
        res.json(category);
      } catch (error) {
        res.status(500).json({ error: "Failed to update category" });
      }
    })();
  });

  // DELETE /api/staff/categories/:id - Delete category
  app.delete("/api/staff/categories/:id", requireAdminStaffAuth, (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const success = await storage.deleteCategory(id);
        if (!success) {
          return res.status(404).json({ error: "Category not found" });
        }
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to delete category" });
      }
    })();
  });

  // ============ SUBCATEGORIES ROUTES ============

  // GET /api/staff/subcategories - Get all subcategories
  app.get("/api/staff/subcategories", requireAdminStaffAuth, (req, res) => {
    (async () => {
      try {
        const subcategories = await storage.getAllSubcategories();
        res.json(subcategories);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch subcategories" });
      }
    })();
  });

  // POST /api/staff/subcategories - Create new subcategory
  app.post("/api/staff/subcategories", requireAdminStaffAuth, (req, res) => {
    const { name, categoryId } = req.body;

    if (!name || !categoryId) {
      return res.status(400).json({ error: "Name and categoryId are required" });
    }

    (async () => {
      try {
        const newSubcategory = await storage.createSubcategory({
          name,
          categoryId,
          active: true
        });
        res.status(201).json(newSubcategory);
      } catch (error) {
        res.status(500).json({ error: "Failed to create subcategory" });
      }
    })();
  });

  // PUT /api/staff/subcategories/:id - Update subcategory
  app.put("/api/staff/subcategories/:id", requireAdminStaffAuth, (req, res) => {
    const { id } = req.params;
    const { name, categoryId, active } = req.body;

    (async () => {
      try {
        const updatedSubcategory = await storage.updateSubcategory(id, {
          name,
          categoryId,
          active
        });
        if (!updatedSubcategory) {
          return res.status(404).json({ error: "Subcategory not found" });
        }
        res.json(updatedSubcategory);
      } catch (error) {
        res.status(500).json({ error: "Failed to update subcategory" });
      }
    })();
  });

  // DELETE /api/staff/subcategories/:id - Delete subcategory
  app.delete("/api/staff/subcategories/:id", requireAdminStaffAuth, (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const success = await storage.deleteSubcategory(id);
        if (!success) {
          return res.status(404).json({ error: "Subcategory not found" });
        }
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to delete subcategory" });
      }
    })();
  });

  // ============ EDITIONS ROUTES ============

  // GET /api/staff/editions - Get all editions
  app.get("/api/staff/editions", requireAdminStaffAuth, (req, res) => {
    (async () => {
      try {
        const editions = await storage.getAllEditions();
        res.json(editions);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch editions" });
      }
    })();
  });

  // POST /api/staff/editions - Create new edition
  app.post("/api/staff/editions", requireAdminStaffAuth, (req, res) => {
    const { newspaperId, editionName, state } = req.body;

    if (!newspaperId || !editionName || !state) {
      return res.status(400).json({ error: "Newspaper ID, edition name, and state are required" });
    }

    (async () => {
      try {
        const edition = await storage.createEdition({
          newspaperId,
          editionName,
          state,
          active: true,
        });
        res.json(edition);
      } catch (error) {
        res.status(500).json({ error: "Failed to create edition" });
      }
    })();
  });

  // PUT /api/staff/editions/:id - Update edition
  app.put("/api/staff/editions/:id", requireAdminStaffAuth, (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    (async () => {
      try {
        const edition = await storage.updateEdition(id, updates);
        if (!edition) {
          return res.status(404).json({ error: "Edition not found" });
        }
        res.json(edition);
      } catch (error) {
        res.status(500).json({ error: "Failed to update edition" });
      }
    })();
  });

  // DELETE /api/staff/editions/:id - Delete edition
  app.delete("/api/staff/editions/:id", requireAdminStaffAuth, (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const success = await storage.deleteEdition(id);
        if (!success) {
          return res.status(404).json({ error: "Edition not found" });
        }
        res.json({ success: true });
      } catch (error) {
        if (error instanceof Error && error.message.includes("Cannot delete edition")) {
          return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: "Failed to delete edition" });
      }
    })();
  });

  // ============ CITIES ROUTES ============

  // GET /api/staff/cities - Get all cities
  app.get("/api/staff/cities", requireStaffAuth, (req, res) => {
    (async () => {
      try {
        const cities = await storage.getAllCities();
        res.json(cities);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch cities" });
      }
    })();
  });

  // ============ PACKAGES ROUTES ============

  // GET /api/staff/packages - Get all packages
  app.get("/api/staff/packages", requireAdminStaffAuth, (req, res) => {
    (async () => {
      try {
        const packages = await storage.getAllPackages();
        res.json(packages);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch packages" });
      }
    })();
  });

  // GET /api/staff/newspapers/:id/packages - Get packages for a newspaper
  app.get("/api/staff/newspapers/:id/packages", requireAdminStaffAuth, (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const packages = await storage.getPackagesByNewspaper(id);
        res.json(packages);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch packages" });
      }
    })();
  });

  // POST /api/staff/packages - Create package
  app.post("/api/staff/packages", requireAdminStaffAuth, (req, res) => {
    const { newspaperId, categoryId, name, description, price, pricingType, discount, packageType, buyQuantity, getQuantity, active } = req.body;

    if (!newspaperId || !name || price === undefined || !pricingType) {
      return res.status(400).json({ error: "Newspaper ID, name, price, and pricing type are required" });
    }

    (async () => {
      try {
        const pkg = await storage.createPackage({
          newspaperId,
          categoryId,
          name,
          description,
          price,
          pricingType,
          discount: discount || 0,
          packageType: packageType || "standard",
          buyQuantity: buyQuantity ? parseInt(buyQuantity) : null,
          getQuantity: getQuantity ? parseInt(getQuantity) : null,
          expiryDate: null, // No expiry by default
          active: active !== undefined ? active : true,
        });
        res.json(pkg);
      } catch (error) {
        res.status(500).json({ error: "Failed to create package" });
      }
    })();
  });

  // PUT /api/staff/packages/:id - Update package
  app.put("/api/staff/packages/:id", requireAdminStaffAuth, (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    (async () => {
      try {
        const pkg = await storage.updatePackage(id, updates);
        if (!pkg) {
          return res.status(404).json({ error: "Package not found" });
        }
        res.json(pkg);
      } catch (error) {
        res.status(500).json({ error: "Failed to update package" });
      }
    })();
  });

  // DELETE /api/staff/packages/:id - Delete package
  app.delete("/api/staff/packages/:id", requireAdminStaffAuth, (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const success = await storage.deletePackage(id);
        if (!success) {
          return res.status(404).json({ error: "Package not found" });
        }
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to delete package" });
      }
    })();
  });

  // ============ BOOKINGS ROUTES ============

  // GET /api/staff/bookings - Get all bookings (populated)
  app.get("/api/staff/bookings", requireStaffAuth, (req, res) => {
    (async () => {
      try {
        const bookings = await storage.getAllBookingsPopulated();
        res.json(bookings);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch bookings" });
      }
    })();
  });

  // GET /api/staff/logins - Get recent user login events
  app.get("/api/staff/logins", requireStaffAuth, (req, res) => {
    (async () => {
      try {
        const logins = await storage.getRecentStaffLogins(100);
        res.json(logins);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch login history" });
      }
    })();
  });

  // GET /api/staff/bookings/:id - Get single booking
  app.get("/api/staff/bookings/:id", requireStaffAuth, (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const booking = await storage.getBookingPopulated(id);
        if (!booking) {
          return res.status(404).json({ error: "Booking not found" });
        }
        res.json(booking);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch booking" });
      }
    })();
  });

  // PUT /api/staff/bookings/:id - Update booking status
  app.put("/api/staff/bookings/:id", requireStaffAuth, (req, res) => {
    const { id } = req.params;
    const { status, adminNotes, publishDates, roNumber, edition, city, subcategory, classification, paymentDetails, remarks } = req.body;

    (async () => {
      try {
        const updates: any = { status, adminNotes };
        if (publishDates) {
          updates.publishDates = publishDates;
        }
        if (roNumber !== undefined) updates.roNumber = roNumber;
        if (edition !== undefined) updates.edition = edition;
        if (city !== undefined) updates.city = city;
        if (subcategory !== undefined) updates.subcategory = subcategory;
        if (classification !== undefined) updates.classification = classification;
        if (paymentDetails !== undefined) updates.paymentDetails = paymentDetails;
        if (remarks !== undefined) updates.remarks = remarks;
        const booking = await storage.updateBooking(id, updates);
        if (!booking) {
          return res.status(404).json({ error: "Booking not found" });
        }
        res.json(booking);
      } catch (error) {
        res.status(500).json({ error: "Failed to update booking" });
      }
    })();
  });

  // ============ NEWSPAPER ENCHANTMENT RATES ROUTES ============

  // GET /api/staff/newspaper-enchantment-rates - Get all newspaper enchantment rates
  app.get("/api/staff/newspaper-enchantment-rates", requireStaffAuth, (req, res) => {
    (async () => {
      try {
        const rates = await storage.getAllNewspaperEnchantmentRates();
        res.json(rates);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch newspaper enchantment rates" });
      }
    })();
  });

  // GET /api/staff/newspaper-enchantment-rates/:newspaperId - Get enchantment rates for a newspaper
  app.get("/api/staff/newspaper-enchantment-rates/:newspaperId", requireStaffAuth, (req, res) => {
    const { newspaperId } = req.params;

    (async () => {
      try {
        const rates = await storage.getEnchantmentRatesByNewspaper(newspaperId);
        res.json(rates);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch enchantment rates for newspaper" });
      }
    })();
  });

  // POST /api/staff/newspaper-enchantment-rates - Create new newspaper enchantment rate
  app.post("/api/staff/newspaper-enchantment-rates", requireStaffAuth, (req, res) => {
    const { newspaperId, enchantmentId, price } = req.body;

    if (!newspaperId || !enchantmentId || price === undefined) {
      return res.status(400).json({ error: "newspaperId, enchantmentId, and price are required" });
    }

    (async () => {
      try {
        // Price expected from UI in rupees (e.g., 500). Convert to paise for storage.
        const parsedPrice = Math.round(Number(price) * 100);
        if (isNaN(parsedPrice)) return res.status(400).json({ error: "Invalid price" });

        const rate = await storage.createNewspaperEnchantmentRate({
          newspaperId,
          enchantmentId,
          price: parsedPrice,
          active: true,
        });
        res.status(201).json(rate);
      } catch (error) {
        res.status(500).json({ error: "Failed to create newspaper enchantment rate" });
      }
    })();
  });

  // PUT /api/staff/newspaper-enchantment-rates/:id - Update newspaper enchantment rate
  app.put("/api/staff/newspaper-enchantment-rates/:id", requireStaffAuth, (req, res) => {
    const { id } = req.params;
    const { newspaperId, enchantmentId, price, active } = req.body;

    (async () => {
      try {
        const updates: any = { newspaperId, enchantmentId, active };
        if (price !== undefined) {
          const parsedPrice = Math.round(Number(price) * 100);
          if (isNaN(parsedPrice)) return res.status(400).json({ error: "Invalid price" });
          updates.price = parsedPrice;
        }

        const updatedRate = await storage.updateNewspaperEnchantmentRate(id, updates);
        if (!updatedRate) {
          return res.status(404).json({ error: "Newspaper enchantment rate not found" });
        }
        res.json(updatedRate);
      } catch (error) {
        res.status(500).json({ error: "Failed to update newspaper enchantment rate" });
      }
    })();
  });

  // DELETE /api/staff/newspaper-enchantment-rates/:id - Delete newspaper enchantment rate
  app.delete("/api/staff/newspaper-enchantment-rates/:id", requireStaffAuth, (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const success = await storage.deleteNewspaperEnchantmentRate(id);
        if (!success) {
          return res.status(404).json({ error: "Newspaper enchantment rate not found" });
        }
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to delete newspaper enchantment rate" });
      }
    })();
  });

  // ============ STAFF AD ENCHANTMENTS ROUTES ============

  // GET /api/staff/ad-enchantments - Get all ad enchantments
  app.get("/api/staff/ad-enchantments", requireStaffAuth, (req, res) => {
    (async () => {
      try {
        const enchs = await storage.getAllAdEnchantments();
        res.json(enchs);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch ad enchantments" });
      }
    })();
  });

  // POST /api/staff/ad-enchantments - Create ad enchantment
  app.post("/api/staff/ad-enchantments", requireStaffAuth, (req, res) => {
    const { name, description, icon, previewHtml, price } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: "Name and price are required" });
    }

    (async () => {
      try {
        const parsedPrice = Math.round(Number(price) * 100);
        if (isNaN(parsedPrice)) return res.status(400).json({ error: "Invalid price" });

        const ench = await storage.createAdEnchantment({
          name,
          description: description || null,
          icon: icon || null,
          previewHtml: previewHtml || null,
          price: parsedPrice,
          active: true,
        });
        res.status(201).json(ench);
      } catch (error) {
        console.error("Failed to create ad enchantment:", error);
        res.status(500).json({ error: "Failed to create ad enchantment" });
      }
    })();
  });

  // PUT /api/staff/ad-enchantments/:id - Update ad enchantment
  app.put("/api/staff/ad-enchantments/:id", requireStaffAuth, (req, res) => {
    const { id } = req.params;
    const { name, description, icon, previewHtml, price, active } = req.body;

    (async () => {
      try {
        const updates: any = { name, description, icon, previewHtml, active };
        if (price !== undefined) {
          const parsedPrice = Math.round(Number(price) * 100);
          if (isNaN(parsedPrice)) return res.status(400).json({ error: "Invalid price" });
          updates.price = parsedPrice;
        }

        const updated = await storage.updateAdEnchantment(id, updates);
        if (!updated) return res.status(404).json({ error: "Ad enchantment not found" });
        res.json(updated);
      } catch (error) {
        console.error("Failed to update ad enchantment:", error);
        res.status(500).json({ error: "Failed to update ad enchantment" });
      }
    })();
  });

  // DELETE /api/staff/ad-enchantments/:id - Delete ad enchantment
  app.delete("/api/staff/ad-enchantments/:id", requireStaffAuth, (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const success = await storage.deleteAdEnchantment(id);
        if (!success) return res.status(404).json({ error: "Ad enchantment not found" });
        res.json({ success: true });
      } catch (error) {
        console.error("Failed to delete ad enchantment:", error);
        res.status(500).json({ error: "Failed to delete ad enchantment" });
      }
    })();
  });

  // ============ ADMIN ROUTES ============

  // GET /api/admin/bookings - Get all bookings (admin only)
  app.get("/api/admin/bookings", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const session = sessions.get(token || "");

    if (!session || session.userId !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }

    (async () => {
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    })();
  });

  // PATCH /api/admin/bookings/:id - Update booking status (admin only)
  app.patch("/api/admin/bookings/:id", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const session = sessions.get(token || "");

    if (!session || session.userId !== "ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { id } = req.params;
    const { status } = req.body;

    (async () => {
      try {
        const booking = await storage.updateBooking(id, { status });
        if (!booking) {
          return res.status(404).json({ error: "Booking not found" });
        }
        res.json(booking);
      } catch (error) {
        res.status(500).json({ error: "Failed to update booking" });
      }
    })();
  });

  // ============ PUBLIC ROUTES ============

  // GET /api/newspapers - Get all active newspapers (public)
  app.get("/api/newspapers", (req, res) => {
    (async () => {
      try {
        const newspapers = await storage.getAllNewspapers();
        // Only return active newspapers for public access
        const activeNewspapers = newspapers.filter(n => n.active);
        res.json(activeNewspapers);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch newspapers" });
      }
    })();
  });

  // GET /api/newspapers/:id/editions - Get editions for a newspaper (public)
  app.get("/api/newspapers/:id/editions", (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const editions = await storage.getEditionsByNewspaper(id);
        res.json(editions);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch editions" });
      }
    })();
  });

  // GET /api/newspapers/:id/edition-combos - Get edition combo packages for a newspaper
  app.get("/api/newspapers/:id/edition-combos", (req, res) => {
    const { id } = req.params;
    (async () => {
      try {
        const combos = await storage.getEditionCombosByNewspaper(id);
        res.json(combos);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch edition combos" });
      }
    })();
  });

  // GET /api/newspapers/:id/ad-types - Get ad types for a newspaper (public)
  app.get("/api/newspapers/:id/ad-types", (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const adTypes = await storage.getAdTypesByNewspaper(id);
        // Only return active ad types
        const activeAdTypes = adTypes.filter(at => at.active);
        res.json(activeAdTypes);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch ad types" });
      }
    })();
  });

  // GET /api/ad-types/:id/categories - Get categories for an ad type (public)
  app.get("/api/ad-types/:id/categories", (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const categories = await storage.getCategoriesByAdType(id);
        // Only return active categories
        const activeCategories = categories.filter(c => c.active);
        res.json(activeCategories);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch categories" });
      }
    })();
  });

  // GET /api/cities - Get all cities (public)
  app.get("/api/cities", (req, res) => {
    (async () => {
      try {
        const cities = await storage.getAllCities();
        res.json(cities);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch cities" });
      }
    })();
  });


  // GET /api/cities/:id - Get single city (public)
  app.get("/api/cities/:id", (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const city = await storage.getCity(id);
        if (!city) {
          return res.status(404).json({ error: "City not found" });
        }
        res.json(city);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch city" });
      }
    })();
  });

  // GET /api/bookings/rates - Get rate data for cost calculator
  app.get("/api/bookings/rates", (req, res) => {
    res.json(RATE_DATA);
  });

  // POST /api/bookings/estimate - Calculate estimated cost
  app.post("/api/bookings/estimate", async (req, res) => {
    const { newspaper, package: packageId, city, adType, category, size, publishDates, edition, enchantments } = req.body;

    let baseRate = 0;
    let estimatedTotal = 0;

    try {
      // First check if a package is selected
      if (packageId) {
        const pkg = await storage.getPackage(packageId);
        if (pkg) {
          if (pkg.pricingType === 'per_word') {
            baseRate = pkg.price || 0;
            estimatedTotal = baseRate * size.value;
          } else if (pkg.pricingType === 'per_line') {
            baseRate = pkg.price || 0;
            estimatedTotal = baseRate * size.value;
          }
        }
      } else {
        // Query rates table for matching rates
        const matchingRates = await storage.getRatesByCriteria({
          newspaperId: newspaper,
          adTypeId: adType,
          categoryId: category,
          editionId: edition,
          cityId: city,
          sizeUnit: size.unit === 'word' ? 'per_word' : 'per_line'
        });

        if (matchingRates.length > 0) {
          // Use the most specific rate (prefer category-specific over general)
          const categoryRate = matchingRates.find(r => r.categoryId === category);
          const generalRate = matchingRates.find(r => !r.categoryId);

          const selectedRate = categoryRate || generalRate || matchingRates[0];
          baseRate = selectedRate.baseRate;
          estimatedTotal = baseRate * size.value;
        } else {
          // Fallback to default rates based on newspaper pricing unit
          const newspaperData = await storage.getNewspaper(newspaper);
          if (newspaperData) {
            if (newspaperData.pricingUnit === 'word') {
              baseRate = 5; // Default ₹5 per word
              estimatedTotal = baseRate * size.value;
            } else {
              baseRate = 50; // Default ₹50 per line
              estimatedTotal = baseRate * size.value;
            }
          }
        }
      }

      // Multiply by number of publish dates
      const datesCount = Array.isArray(publishDates) ? publishDates.length : 1;
      estimatedTotal *= datesCount;

      // Enchantments: per-matter addon
      let enchantmentTotal = 0;
      if (enchantments && Array.isArray(enchantments)) {
        for (const enchId of enchantments) {
          const newspaperRates = await storage.getEnchantmentRatesByNewspaper(newspaper);
          const match = newspaperRates.find(r => r.enchantmentId === enchId);
          if (match && match.price) {
            enchantmentTotal += (match.price / 100);
          } else {
            const allEnchs = await storage.getAllAdEnchantments();
            const def = allEnchs.find(e => e.id === enchId);
            if (def && def.price) enchantmentTotal += (def.price / 100);
          }
        }
      }

      const subtotal = estimatedTotal + enchantmentTotal;
      const gst = +(subtotal * 0.05).toFixed(2);
      const totalWithGst = +(subtotal + gst).toFixed(2);

      res.json({
        baseRate,
        estimatedTotal,
        enchantmentTotal,
        gst,
        totalWithGst,
        currency: "INR",
        breakdown: {
          baseRate,
          sizeMultiplier: size.value,
          dateMultiplier: datesCount,
          packageUsed: !!packageId,
        }
      });
    } catch (error) {
      console.error("Error calculating estimate:", error);
      res.status(500).json({ error: "Failed to calculate estimate" });
    }
  });

  // POST /api/bookings/public - Persist public booking record
  app.post("/api/bookings/public", async (req, res) => {
    const {
      adMatterId,
      edition: editionValue,
      city: cityValueRaw,
      cityName,
      newspaperId,
      package: packageId,
      options,
      publishDates,
      calculatedPricing,
    } = req.body;

    const token = req.headers.authorization?.replace("Bearer ", "");
    const session = sessions.get(token || "");
    const userId = session?.userId || null;

    if (!userId) {
      console.log('Booking creation denied: missing authentication');
      return res.status(401).json({ error: 'Authentication required to persist bookings' });
    }

    const cityValue = cityValueRaw || cityName || '';
    const publishDatesValue = Array.isArray(publishDates) ? publishDates : publishDates ? [publishDates] : [];

    if (!adMatterId || !cityValue || publishDatesValue.length === 0) {
      return res.status(400).json({ error: "Missing required booking fields" });
    }

    try {
      let city = await storage.getCity(cityValue);
      if (!city) {
        city = await storage.getCityByName(cityValue);
      }

      if (!city) {
        return res.status(400).json({ error: "Invalid city" });
      }

      const cityId = city.id;
      let editionId = editionValue;
      if (!editionId && newspaperId) {
        const editions = await storage.getEditionsByCity(city.id);
        const matchingEdition = editions.find((edition) => edition.newspaperId === newspaperId);
        if (matchingEdition) {
          editionId = matchingEdition.id;
        }
      }

      if (!editionId && newspaperId) {
        const editions = await storage.getEditionsByNewspaper(newspaperId);
        if (editions.length > 0) {
          editionId = editions[0].id;
        }
      }

      if (!editionId) {
        return res.status(400).json({ error: "Missing required booking fields" });
      }

      const edition = await storage.getEdition(editionId);

      const booking = await storage.createBooking({
        adMatterId,
        editionId,
        cityId,
        packageId: packageId || null,
        userId,
        roNumber: null,
        customAdText: "",
        options: JSON.stringify(options || {}),
        publishDates: JSON.stringify(Array.isArray(publishDates) ? publishDates : [publishDates]),
        calculatedPricing: JSON.stringify(calculatedPricing || { publishDates, createdAt: Date.now() }),
        paymentMethod: null,
        status: "submitted",
        adminNotes: null,
        edition: edition?.editionName || "",
        city: city?.name || "",
        subcategory: "",
        classification: "",
        paymentDetails: "",
        remarks: "",
      });

      res.json(booking);
    } catch (error) {
      console.error("Failed to persist booking record:", error);
      res.status(500).json({ error: "Failed to persist booking record" });
    }
  });

  // ============ PACKAGES ROUTES ============

  // GET /api/staff/packages - Get all packages
  app.get("/api/staff/packages", requireAdminStaffAuth, (req, res) => {
    (async () => {
      try {
        const packages = await storage.getAllPackages();
        res.json(packages);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch packages" });
      }
    })();
  });

  // POST /api/staff/packages - Create package
  app.post("/api/staff/packages", requireAdminStaffAuth, (req, res) => {
    const { newspaperId, categoryId, name, description } = req.body;
    if (!newspaperId || !name) {
      return res.status(400).json({ error: "Newspaper and name are required" });
    }

    (async () => {
      try {
        const pkg = await storage.createPackage({
          newspaperId,
          categoryId,
          name,
          description,
          price: 0, // default
          discount: 0, // default
          pricingType: "per_line", // default
          packageType: "standard", // default
          buyQuantity: null,
          getQuantity: null,
          expiryDate: null,
          active: true,
        });
        res.json(pkg);
      } catch (error) {
        console.error("Failed to create package:", error);
        res.status(500).json({ error: "Failed to create package" });
      }
    })();
  });

  // PUT /api/staff/packages/:id - Update package
  app.put("/api/staff/packages/:id", requireAdminStaffAuth, (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    (async () => {
      try {
        const pkg = await storage.updatePackage(id, updates);
        if (!pkg) {
          return res.status(404).json({ error: "Package not found" });
        }
        res.json(pkg);
      } catch (error) {
        res.status(500).json({ error: "Failed to update package" });
      }
    })();
  });

  // DELETE /api/staff/packages/:id - Delete package
  app.delete("/api/staff/packages/:id", requireAdminStaffAuth, (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const success = await storage.deletePackage(id);
        if (!success) {
          return res.status(404).json({ error: "Package not found" });
        }
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to delete package" });
      }
    })();
  });
  app.get("/api/staff/rates", requireStaffAuth, (req, res) => {
    (async () => {
      try {
        const rates = await storage.getAllRates();
        res.json(rates);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch rates" });
      }
    })();
  });

  // GET /api/rates - Get rates with optional filters (public)
  app.get("/api/rates", (req, res) => {
    (async () => {
      try {
        const { newspaperId, adTypeId, categoryId, editionId, cityId, sizeUnit } = req.query;

        const criteria: any = {};
        if (newspaperId) criteria.newspaperId = newspaperId as string;
        if (adTypeId) criteria.adTypeId = adTypeId as string;
        if (categoryId) criteria.categoryId = categoryId as string;
        if (editionId) criteria.editionId = editionId as string;
        if (cityId) criteria.cityId = cityId as string;
        if (sizeUnit) criteria.sizeUnit = sizeUnit as string;

        const rates = await storage.getRatesByCriteria(criteria);
        res.json(rates);
      } catch (error) {
        console.error("Error fetching rates:", error);
        res.status(500).json({ error: "Failed to fetch rates" });
      }
    })();
  });

  // POST /api/staff/rates - Create rate
  app.post("/api/staff/rates", requireStaffAuth, (req, res) => {
    const { newspaperId, adTypeId, categoryId, language, sizeUnit, baseRate, fixedRate, exactSize, minSize, maxSize, editionId, cityId, notes, name } = req.body;
    if (!newspaperId || !adTypeId || !language || !sizeUnit || baseRate === undefined) {
      return res.status(400).json({ error: "Newspaper, ad type, language, size unit, and base rate are required" });
    }

    (async () => {
      try {
        const rate = await storage.createRate({
          newspaperId,
          adTypeId,
          categoryId,
          language,
          sizeUnit,
          baseRate,
          fixedRate,
          exactSize: exactSize ? parseInt(exactSize) : null,
          minSize: minSize ? parseInt(minSize) : null,
          maxSize: maxSize ? parseInt(maxSize) : null,
          editionId,
          cityId,
          notes,
          name,
          active: true,
        });
        res.json(rate);
      } catch (error) {
        console.error("Failed to create rate:", error);
        res.status(500).json({ error: "Failed to create rate" });
      }
    })();
  });

  // PUT /api/staff/rates/:id - Update rate
  app.put("/api/staff/rates/:id", requireAdminStaffAuth, (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    (async () => {
      try {
        const rate = await storage.updateRate(id, updates);
        if (!rate) {
          return res.status(404).json({ error: "Rate not found" });
        }
        res.json(rate);
      } catch (error) {
        res.status(500).json({ error: "Failed to update rate" });
      }
    })();
  });

  // DELETE /api/staff/rates/:id - Delete rate
  app.delete("/api/staff/rates/:id", requireAdminStaffAuth, (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const success = await storage.deleteRate(id);
        if (!success) {
          return res.status(404).json({ error: "Rate not found" });
        }
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to delete rate" });
      }
    })();
  });

  // ============ BILL ROUTES ============

  // GET /api/staff/bills - Get all bills
  app.get("/api/staff/bills", requireStaffAuth, (req, res) => {
    (async () => {
      try {
        const bills = await storage.getAllBills();
        res.json(bills);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch bills" });
      }
    })();
  });

  // GET /api/staff/bills/suggestions - Get client suggestions for autocomplete
  app.get("/api/staff/bills/suggestions", requireStaffAuth, (req, res) => {
    const { search } = req.query;
    
    (async () => {
      try {
        const searchTerm = (search as string || "").toLowerCase();
        
        if (!searchTerm || searchTerm.length < 2) {
          return res.json([]);
        }
        
        const bills = await storage.getAllBills();
        
        // Get unique clients that match search term
        const suggestions: Array<{
          clientName: string;
          clientNumber: string;
          clientAddress: string;
          clientGST: string;
          clientState: string;
        }> = [];
        
        const seen = new Set<string>();
        
        for (const bill of bills) {
          if (bill.clientName && bill.clientName.toLowerCase().includes(searchTerm)) {
            const key = bill.clientName.toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              suggestions.push({
                clientName: bill.clientName,
                clientNumber: bill.clientNumber || "",
                clientAddress: bill.clientAddress || "",
                clientGST: bill.clientGST || "",
                clientState: bill.clientState || ""
              });
            }
          }
        }
        
        res.json(suggestions.slice(0, 10)); // Return top 10 suggestions
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        res.status(500).json({ error: "Failed to fetch suggestions" });
      }
    })();
  });

  // GET /api/staff/bills/:id - Get bill by ID
  app.get("/api/staff/bills/:id", requireStaffAuth, (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const bill = await storage.getBill(id);
        if (!bill) {
          return res.status(404).json({ error: "Bill not found" });
        }
        res.json(bill);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch bill" });
      }
    })();
  });

  // POST /api/staff/bills - Create new bill
  app.post("/api/staff/bills", requireStaffAuth, (req, res) => {
    const billData = req.body;
    console.log("Creating bill with data:", billData);

    (async () => {
      try {
        if (!billData.clientName || !billData.items) {
          return res.status(400).json({ error: "Missing required fields: clientName and items" });
        }
        const bill = await storage.createBill(billData);
        console.log("Bill created successfully:", bill);
        res.status(201).json(bill);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Failed to create bill:", errorMessage);
        res.status(500).json({ error: "Failed to create bill", details: errorMessage });
      }
    })();
  });

  // PUT /api/staff/bills/:id - Update bill
  app.put("/api/staff/bills/:id", requireStaffAuth, (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    (async () => {
      try {
        const bill = await storage.updateBill(id, updates);
        if (!bill) {
          return res.status(404).json({ error: "Bill not found" });
        }
        return res.json({ success: true, bill });
      } catch (error) {
        console.error('Error updating bill:', error);
        return res.status(500).json({ error: "Failed to update bill", details: String(error) });
      }
    })();
  });

  // DELETE /api/staff/bills/:id - Delete bill
  app.delete("/api/staff/bills/:id", requireStaffAuth, (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const success = await storage.deleteBill(id);
        if (!success) {
          return res.status(404).json({ error: "Bill not found" });
        }
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to delete bill" });
      }
    })();
  });

  // GET /api/bills/:id - Get bill by ID (public)
  app.get("/api/bills/:id", (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const bill = await storage.getBill(id);
        if (!bill) {
          return res.status(404).json({ error: "Bill not found" });
        }
        res.json(bill);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch bill" });
      }
    })();
  });

  // GET /api/bills/booking/:bookingId - Get bill by booking ID (public)
  app.get("/api/bills/booking/:bookingId", (req, res) => {
    const { bookingId } = req.params;

    (async () => {
      try {
        let bill = await storage.getBillByBookingId(bookingId);
        if (!bill) {
          // Auto-generate the bill
          bill = await generateBillForBooking(bookingId);
        }
        res.json(bill);
      } catch (error) {
        console.error('Error fetching or generating bill:', error);
        res.status(500).json({ error: "Failed to fetch or generate bill" });
      }
    })();
  });

  // Function to generate bill for a booking
  const generateBillForBooking = async (bookingId: string) => {
    // First check if bill already exists (double-check)
    const existingBill = await storage.getBillByBookingId(bookingId);
    if (existingBill) {
      return existingBill;
    }

    // Get the booking
    const booking = await storage.getBooking(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    // Default pricing.total to 0 if missing
    let pricing: any = {};
    try {
      pricing = JSON.parse(booking.calculatedPricing || '{}');
    } catch (parseError) {
      pricing = {};
    }
    const total = pricing.totalWithGst || pricing.total || 0;

    // Default clientName to booking.adMatter.name or 'Cash Client'
    let clientName = 'Cash Client';
    try {
      const populatedBooking = await storage.getBookingPopulated(booking.id);
      if (populatedBooking?.adMatter?.name) {
        clientName = populatedBooking.adMatter.name;
      }
    } catch (error) {
      // Keep default
    }

    // Calculate Tax (2.5% CGST, 2.5% SGST) based on the total
    const subtotal = total;
    const cgstAmount = subtotal * 0.025;
    const sgstAmount = subtotal * 0.025;
    const grandTotal = subtotal + cgstAmount + sgstAmount;

    // Create bill items (simplified)
    const billItems = [{
      description: 'Advertising Services',
      amount: total
    }];

    const bill = await storage.createBill({
      bookingId: booking.id,
      billDate: new Date(),
      billNumber: '',
      discount: 0,
      clientName,
      clientNumber: '',
      clientAddress: '',
      clientGST: '',
      clientState: '',
      items: JSON.stringify(billItems),
      totalAmount: subtotal,
      cgst: cgstAmount,
      sgst: sgstAmount,
      igst: 0,
      grandTotal: grandTotal,
    });

    return bill;
  }

  // POST /api/bills/generate - Generate bill for a booking (public)
  app.post("/api/bills/generate", (req, res) => {
    const { bookingId } = req.body;

    (async () => {
      try {
        const bill = await generateBillForBooking(bookingId);
        res.json(bill);
      } catch (error) {
        console.error('Bill generation failed:', error);
        res.status(404).json({ error: "Booking not found" });
      }
    })();
  });

  // ============ AD MATTER ROUTES ============

  // GET /api/ad-matters - Get ad matters with optional filters (public)
  app.get("/api/ad-matters", (req, res) => {
    (async () => {
      try {
        const { newspaperId, rateId } = req.query;
        const token = req.headers.authorization?.replace("Bearer ", "");
        const session = sessions.get(token || "");
        const userId = session?.userId;

        let adMatters;
        if (newspaperId) {
          adMatters = await storage.getAdMattersByNewspaper(newspaperId as string);
        } else if (rateId) {
          adMatters = await storage.getAdMattersByRate(rateId as string);
        } else {
          adMatters = await storage.getAllAdMatters();
        }

        // Filter by user if authenticated, otherwise show all active ad matters
        let filteredAdMatters = adMatters.filter(am => am.active);
        if (userId) {
          filteredAdMatters = filteredAdMatters.filter(am => am.userId === userId);
        }
        
        // Enrich with joined data
        const enrichedAdMatters = await Promise.all(
          filteredAdMatters.map(async (am) => {
            const [newspaper, adType, category, rate] = await Promise.all([
              am.newspaperId ? storage.getNewspaper(am.newspaperId) : null,
              am.adTypeId ? storage.getAdType(am.adTypeId) : null,
              am.categoryId ? storage.getCategory(am.categoryId) : null,
              am.rateId ? storage.getRate(am.rateId) : null,
            ]);

            return {
              ...am,
              newspaper: newspaper ? { name: newspaper.name } : null,
              adType: adType ? { name: adType.name } : null,
              category: category ? { name: category.name } : null,
              rate: rate ? { baseRate: rate.baseRate, sizeUnit: rate.sizeUnit, fixedRate: rate.fixedRate, exactSize: rate.exactSize } : null,
            };
          })
        );

        res.json(enrichedAdMatters);
      } catch (error) {
        console.error("Error fetching ad matters:", error);
        res.status(500).json({ error: "Failed to fetch ad matters" });
      }
    })();
  });

  // GET /api/user/ad-matters - Get authenticated user's ad matters only
  app.get("/api/user/ad-matters", requireUserAuth, (req, res) => {
    (async () => {
      try {
        const userId = (req as any).userId as string;
        const adMatters = await storage.getAdMattersByUser(userId);

        const enrichedAdMatters = await Promise.all(
          adMatters.map(async (am) => {
            const [newspaper, adType, category, rate] = await Promise.all([
              am.newspaperId ? storage.getNewspaper(am.newspaperId) : null,
              am.adTypeId ? storage.getAdType(am.adTypeId) : null,
              am.categoryId ? storage.getCategory(am.categoryId) : null,
              am.rateId ? storage.getRate(am.rateId) : null,
            ]);

            return {
              ...am,
              newspaper: newspaper ? { name: newspaper.name } : null,
              adType: adType ? { name: adType.name } : null,
              category: category ? { name: category.name } : null,
              rate: rate ? { baseRate: rate.baseRate, sizeUnit: rate.sizeUnit, fixedRate: rate.fixedRate, exactSize: rate.exactSize } : null,
            };
          })
        );

        res.json(enrichedAdMatters);
      } catch (error) {
        console.error("Error fetching user ad matters:", error);
        res.status(500).json({ error: "Failed to fetch user ad matters" });
      }
    })();
  });

  // GET /api/ad-matters/:id - Get specific ad matter (public)
  app.get("/api/ad-matters/:id", (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const adMatter = await storage.getAdMatter(id);
        if (!adMatter || !adMatter.active) {
          return res.status(404).json({ error: "Ad matter not found" });
        }
        res.json(adMatter);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch ad matter" });
      }
    })();
  });

  // POST /api/ad-matters - Create ad matter (public for user bookings)
  app.post("/api/ad-matters", (req, res) => {
    const { name, description, content, newspaperId, adTypeId, categoryId, subcategoryId, preferredClassificationId, subClassificationId, enchantments, rateId: rawRateId, packageId, size, language, tags } = req.body;
    const token = req.headers.authorization?.replace("Bearer ", "");
    const session = sessions.get(token || "");
    const userId = session?.userId;
    const explicitNoRate = rawRateId === 'none';
    const rateId = rawRateId === 'none' ? undefined : rawRateId;

    if (!userId) {
      console.log('Ad-matter creation denied: missing authentication');
      return res.status(401).json({ error: 'Authentication required to create ad matters' });
    }

    console.log('Ad-matter creation request:', {
      userId,
      name, content, newspaperId, adTypeId, size, rawRateId, packageId, explicitNoRate, rateId
    });

    // Detailed validation
    const missingFields = [];
    if (!name) missingFields.push("name");
    if (!content) missingFields.push("content");
    if (!newspaperId) missingFields.push("newspaperId");
    if (!adTypeId) missingFields.push("adTypeId");
    if (!size && size !== 0) missingFields.push("size");
    if (!rateId && !packageId && !explicitNoRate) missingFields.push("rateId/packageId");

    if (missingFields.length > 0) {
      console.log('Validation failed, missing fields:', missingFields);
      return res.status(400).json({ error: `Missing required fields: ${missingFields.join(", ")}` });
    }

    (async () => {
      try {
        let actualRateId = rateId;
        if (!actualRateId && packageId) {
          const pkg = await storage.getPackage(packageId);
          if (pkg) {
            const matchingRates = await storage.getRatesByCriteria({
              newspaperId,
              categoryId: pkg.categoryId || categoryId,
              sizeUnit: pkg.pricingType === 'per_word' ? 'per_word' : 'per_line',
            });
            if (matchingRates.length > 0) {
              actualRateId = matchingRates[0].id;
            }
          }
        }

        // Get any available rate for this newspaper
        if (!actualRateId) {
          const matchingRates = await storage.getRatesByCriteria({
            newspaperId,
            categoryId: categoryId || undefined,
          });
          if (matchingRates.length > 0) {
            actualRateId = matchingRates[0].id;
          } else {
            // If no specific rates found, use any rate for the newspaper
            const anyRates = await storage.getRatesByNewspaper(newspaperId);
            if (anyRates.length > 0) {
              actualRateId = anyRates[0].id;
            } else {
              // As a final fallback, create a rate or use a default
              return res.status(400).json({ error: `No rates available for newspaper. Please contact support.` });
            }
          }
        }

        const parsedSize = parseInt(size) || 1;
        const adMatter = await storage.createAdMatter({
          userId,
          name,
          description,
          content,
          newspaperId,
          adTypeId,
          categoryId,
          subcategoryId,
          preferredClassificationId,
          subClassificationId,
          enchantments: enchantments ? JSON.stringify(Array.isArray(enchantments) ? enchantments : [enchantments]) : null,
          rateId: actualRateId,
          size: parsedSize,
          language: language || "EN",
          tags: tags ? JSON.stringify(Array.isArray(tags) ? tags : [tags]) : null,
          active: true,
        });
        res.json(adMatter);
      } catch (error) {
        console.error("Error creating ad matter:", error);
        res.status(500).json({ error: "Failed to create ad matter: " + (error instanceof Error ? error.message : String(error)) });
      }
    })();
  });

  // POST /api/staff/ad-matters - Create ad matter (staff only)
  app.post("/api/staff/ad-matters", requireStaffAuth, (req, res) => {
    const { name, description, content, newspaperId, adTypeId, categoryId, rateId, size, language, tags } = req.body;

    if (!name || !content || !newspaperId || !adTypeId || !rateId || !size) {
      return res.status(400).json({ error: "Name, content, newspaper, ad type, rate, and size are required" });
    }

    (async () => {
      try {
        const adMatter = await storage.createAdMatter({
          name,
          description,
          content,
          newspaperId,
          adTypeId,
          categoryId,
          rateId,
          size,
          language: language || "EN",
          tags: tags ? JSON.stringify(tags) : null,
          active: true,
        });
        res.json(adMatter);
      } catch (error) {
        console.error("Error creating ad matter:", error);
        res.status(500).json({ error: "Failed to create ad matter" });
      }
    })();
  });

  // PUT /api/staff/ad-matters/:id - Update ad matter (staff only)
  app.put("/api/staff/ad-matters/:id", requireStaffAuth, (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    (async () => {
      try {
        const adMatter = await storage.updateAdMatter(id, updates);
        if (!adMatter) {
          return res.status(404).json({ error: "Ad matter not found" });
        }
        res.json(adMatter);
      } catch (error) {
        res.status(500).json({ error: "Failed to update ad matter" });
      }
    })();
  });

  // DELETE /api/staff/ad-matters/:id - Delete ad matter (staff only)
  app.delete("/api/staff/ad-matters/:id", requireStaffAuth, (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const success = await storage.deleteAdMatter(id);
        if (!success) {
          return res.status(404).json({ error: "Ad matter not found" });
        }
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to delete ad matter" });
      }
    })();
  });

  // ============ STAFF ROLES ROUTES ============

  // GET /api/staff/roles - Get all staff roles
  app.get("/api/staff/roles", requireStaffAuth, (req, res) => {
    (async () => {
      try {
        const roles = await storage.getAllStaffRoles();
        res.json(roles);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch staff roles" });
      }
    })();
  });

  // POST /api/staff/roles - Create staff role
  app.post("/api/staff/roles", requireStaffAuth, (req, res) => {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Role name is required" });
    }

    (async () => {
      try {
        const role = await storage.createStaffRole({
          name,
          description,
          active: true,
        });
        res.json(role);
      } catch (error) {
        res.status(500).json({ error: "Failed to create staff role" });
      }
    })();
  });

  // PUT /api/staff/roles/:id - Update staff role
  app.put("/api/staff/roles/:id", requireStaffAuth, (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    (async () => {
      try {
        const role = await storage.updateStaffRole(id, updates);
        if (!role) {
          return res.status(404).json({ error: "Staff role not found" });
        }
        res.json(role);
      } catch (error) {
        res.status(500).json({ error: "Failed to update staff role" });
      }
    })();
  });

  // DELETE /api/staff/roles/:id - Delete staff role
  app.delete("/api/staff/roles/:id", requireStaffAuth, (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const success = await storage.deleteStaffRole(id);
        if (!success) {
          return res.status(404).json({ error: "Staff role not found" });
        }
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to delete staff role" });
      }
    })();
  });

  // ============ PERMISSIONS ROUTES ============

  // GET /api/staff/permissions - Get all permissions
  app.get("/api/staff/permissions", requireStaffAuth, (req, res) => {
    (async () => {
      try {
        const permissions = await storage.getAllPermissions();
        res.json(permissions);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch permissions" });
      }
    })();
  });

  // POST /api/staff/permissions - Create permission
  app.post("/api/staff/permissions", requireStaffAuth, (req, res) => {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Permission name is required" });
    }

    (async () => {
      try {
        const permission = await storage.createPermission({
          name,
          description,
          active: true,
        });
        res.json(permission);
      } catch (error) {
        res.status(500).json({ error: "Failed to create permission" });
      }
    })();
  });

  // PUT /api/staff/permissions/:id - Update permission
  app.put("/api/staff/permissions/:id", requireStaffAuth, (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    (async () => {
      try {
        const permission = await storage.updatePermission(id, updates);
        if (!permission) {
          return res.status(404).json({ error: "Permission not found" });
        }
        res.json(permission);
      } catch (error) {
        res.status(500).json({ error: "Failed to update permission" });
      }
    })();
  });

  // DELETE /api/staff/permissions/:id - Delete permission
  app.delete("/api/staff/permissions/:id", requireStaffAuth, (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const success = await storage.deletePermission(id);
        if (!success) {
          return res.status(404).json({ error: "Permission not found" });
        }
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to delete permission" });
      }
    })();
  });

  // ============ ROLE-PERMISSIONS ROUTES ============

  // GET /api/staff/roles/:roleId/permissions - Get permissions for a role
  app.get("/api/staff/roles/:roleId/permissions", requireStaffAuth, (req, res) => {
    const { roleId } = req.params;

    (async () => {
      try {
        const permissions = await storage.getPermissionsByRole(roleId);
        res.json(permissions);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch role permissions" });
      }
    })();
  });

  // POST /api/staff/roles/:roleId/permissions - Assign permission to role
  app.post("/api/staff/roles/:roleId/permissions", requireStaffAuth, (req, res) => {
    const { roleId } = req.params;
    const { permissionId } = req.body;

    if (!permissionId) {
      return res.status(400).json({ error: "Permission ID is required" });
    }

    (async () => {
      try {
        await storage.assignPermissionToRole(roleId, permissionId);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to assign permission to role" });
      }
    })();
  });

  // DELETE /api/staff/roles/:roleId/permissions/:permissionId - Remove permission from role
  app.delete("/api/staff/roles/:roleId/permissions/:permissionId", requireStaffAuth, (req, res) => {
    const { roleId, permissionId } = req.params;

    (async () => {
      try {
        await storage.removePermissionFromRole(roleId, permissionId);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to remove permission from role" });
      }
    })();
  });

  // ============ STAFF EXTENDED ROUTES ============

  // GET /api/staff/extended - Get all staff extended info
  app.get("/api/staff/extended", requireStaffAuth, (req, res) => {
    (async () => {
      try {
        const staffExtended = await storage.getAllStaffExtended();
        res.json(staffExtended);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch staff extended info" });
      }
    })();
  });

  // PUT /api/staff/extended/:staffId - Update staff extended info
  app.put("/api/staff/extended/:staffId", requireStaffAuth, (req, res) => {
    const { staffId } = req.params;
    const updates = req.body;

    (async () => {
      try {
        const staffExtended = await storage.updateStaffExtended(staffId, updates);
        if (!staffExtended) {
          return res.status(404).json({ error: "Staff extended info not found" });
        }
        res.json(staffExtended);
      } catch (error) {
        res.status(500).json({ error: "Failed to update staff extended info" });
      }
    })();
  });

  // ============ FAQS ROUTES ============

  // GET /api/faqs - Get all FAQs (public)
  app.get("/api/faqs", (req, res) => {
    (async () => {
      try {
        const faqs = await storage.getAllFaqs();
        // Only return active FAQs for public API
        const activeFaqs = faqs.filter(f => f.active);
        res.json(activeFaqs);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch FAQs" });
      }
    })();
  });

  // GET /api/staff/faqs - Get all FAQs for staff
  app.get("/api/staff/faqs", requireStaffAuth, (req, res) => {
    (async () => {
      try {
        const faqs = await storage.getAllFaqs();
        res.json(faqs);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch FAQs" });
      }
    })();
  });

  // POST /api/staff/faqs - Create FAQ
  app.post("/api/staff/faqs", requireStaffAuth, (req, res) => {
    const { title, content, type, category, data, active } = req.body;

    if (!title || !type) {
      return res.status(400).json({ error: "Title and type are required" });
    }

    (async () => {
      try {
        const faq = await storage.createFaq({
          title,
          content,
          type,
          data,
          active: active !== undefined ? active : true,
        });
        res.json(faq);
      } catch (error) {
        res.status(500).json({ error: "Failed to create FAQ" });
      }
    })();
  });

  // PUT /api/staff/faqs/:id - Update FAQ
  app.put("/api/staff/faqs/:id", requireStaffAuth, (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    (async () => {
      try {
        const faq = await storage.updateFaq(id, updates);
        if (!faq) {
          return res.status(404).json({ error: "FAQ not found" });
        }
        res.json(faq);
      } catch (error) {
        res.status(500).json({ error: "Failed to update FAQ" });
      }
    })();
  });

  // DELETE /api/staff/faqs/:id - Delete FAQ
  app.delete("/api/staff/faqs/:id", requireStaffAuth, (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const success = await storage.deleteFaq(id);
        if (!success) {
          return res.status(404).json({ error: "FAQ not found" });
        }
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to delete FAQ" });
      }
    })();
  });

  // ============ LANGUAGES ROUTES ============

  // GET /api/languages - Get all languages (public)
  app.get("/api/languages", (req, res) => {
    (async () => {
      try {
        const languages = await storage.getAllLanguages();
        // Only return active languages for public API
        const activeLanguages = languages.filter(l => l.active);
        res.json(activeLanguages);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch languages" });
      }
    })();
  });

  // GET /api/staff/languages - Get all languages for staff
  app.get("/api/staff/languages", requireStaffAuth, (req, res) => {
    (async () => {
      try {
        const languages = await storage.getAllLanguages();
        res.json(languages);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch languages" });
      }
    })();
  });

  // POST /api/staff/languages - Create language
  app.post("/api/staff/languages", requireStaffAuth, (req, res) => {
    const { code, name, nativeName, active } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: "Code and name are required" });
    }

    (async () => {
      try {
        const language = await storage.createLanguage({
          code,
          name,
          nativeName,
          active: active !== undefined ? active : true,
        });
        res.json(language);
      } catch (error) {
        res.status(500).json({ error: "Failed to create language" });
      }
    })();
  });

  // PUT /api/staff/languages/:id - Update language
  app.put("/api/staff/languages/:id", requireStaffAuth, (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    (async () => {
      try {
        const language = await storage.updateLanguage(id, updates);
        if (!language) {
          return res.status(404).json({ error: "Language not found" });
        }
        res.json(language);
      } catch (error) {
        res.status(500).json({ error: "Failed to update language" });
      }
    })();
  });

  // DELETE /api/staff/languages/:id - Delete language
  app.delete("/api/staff/languages/:id", requireStaffAuth, (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const success = await storage.deleteLanguage(id);
        if (!success) {
          return res.status(404).json({ error: "Language not found" });
        }
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to delete language" });
      }
    })();
  });

  // ============ RATE CARD ROUTES ============

  // GET /api/staff/rate-cards - Get all rate cards
  app.get("/api/staff/rate-cards", requireStaffAuth, (req, res) => {
    (async () => {
      try {
        const rateCards = await storage.getAllRateCards();
        res.json(rateCards);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch rate cards" });
      }
    })();
  });

  // GET /api/staff/newspapers/:id/rate-cards - Get rate cards for a newspaper
  app.get("/api/staff/newspapers/:id/rate-cards", requireStaffAuth, (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const rateCards = await storage.getRateCardsByNewspaper(id);
        res.json(rateCards);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch rate cards" });
      }
    })();
  });

  // POST /api/staff/rate-cards - Upload rate card image
  app.post("/api/staff/rate-cards", requireStaffAuth, getUpload().single("image"), (req, res) => {
    const { newspaperId, imageName } = req.body;

    if (!newspaperId) {
      return res.status(400).json({ error: "Newspaper ID is required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    (async () => {
      try {
        const rateCard = await storage.createRateCard({
          newspaperId,
          imagePath: req.file!.path,
          imageName: imageName || req.file!.originalname,
          active: true,
        });
        res.json(rateCard);
      } catch (error) {
        // Clean up uploaded file if database operation fails
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: "Failed to create rate card" });
      }
    })();
  });

  // PUT /api/staff/rate-cards/:id - Update rate card
  app.put("/api/staff/rate-cards/:id", requireStaffAuth, (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    (async () => {
      try {
        const rateCard = await storage.updateRateCard(id, updates);
        if (!rateCard) {
          return res.status(404).json({ error: "Rate card not found" });
        }
        res.json(rateCard);
      } catch (error) {
        res.status(500).json({ error: "Failed to update rate card" });
      }
    })();
  });

  // DELETE /api/staff/rate-cards/:id - Delete rate card
  app.delete("/api/staff/rate-cards/:id", requireStaffAuth, (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        // Get the rate card first to get the file path
        const rateCard = await storage.getRateCard(id);
        if (!rateCard) {
          return res.status(404).json({ error: "Rate card not found" });
        }

        // Delete from database
        const success = await storage.deleteRateCard(id);
        if (!success) {
          return res.status(404).json({ error: "Rate card not found" });
        }

        // Delete the file
        if (fs.existsSync(rateCard.imagePath)) {
          fs.unlinkSync(rateCard.imagePath);
        }

        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to delete rate card" });
      }
    })();
  });

  // GET /api/rate-cards/:id/image - Serve rate card image (public access)
  app.get("/api/rate-cards/:id/image", (req, res) => {
    const { id } = req.params;

    (async () => {
      try {
        const rateCard = await storage.getRateCard(id);
        if (!rateCard || !rateCard.active) {
          return res.status(404).json({ error: "Rate card not found" });
        }

        if (!fs.existsSync(rateCard.imagePath)) {
          return res.status(404).json({ error: "Image file not found" });
        }

        // Set appropriate content type
        const ext = path.extname(rateCard.imagePath).toLowerCase();
        let contentType = "application/octet-stream";
        if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
        else if (ext === ".png") contentType = "image/png";
        else if (ext === ".pdf") contentType = "application/pdf";

        res.setHeader("Content-Type", contentType);
        res.sendFile(rateCard.imagePath);
      } catch (error) {
        res.status(500).json({ error: "Failed to serve image" });
      }
    })();
  });

  // GET /api/rate-cards - Get all active rate cards (public)
  app.get("/api/rate-cards", (req, res) => {
    (async () => {
      try {
        const rateCards = await storage.getAllRateCards();
        // Filter only active rate cards
        const activeRateCards = rateCards.filter((card: any) => card.active !== false);
        res.json(activeRateCards);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch rate cards" });
      }
    })();
  });

  // Manual RO routes
  app.post("/api/staff/manual-ros", requireStaffAuth, async (req, res) => {
    try {
      const {
        roNumber,
        newspaperId,
        clientName,
        clientPhone,
        clientAddress,
        amount,
        publishDates,
        description,
        roStatus,
        edition,
        city,
        category,
        subcategory,
        classification,
        adContent,
        baseRate,
        enchantmentTotal,
        gstAmount,
        grandTotal,
        paymentDetails,
        remarks
      } = req.body;
      const staffId = (req as any).staffId;

      if (!roNumber || !newspaperId || !clientName || !amount || !staffId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const existing = await storage.getManualROByNumber(roNumber);
      if (existing) {
        return res.status(400).json({ error: "RO number already exists. Please use a unique RO number." });
      }

      const record = await storage.createManualRO({
        roNumber,
        newspaperId,
        clientName,
        clientPhone: clientPhone || "",
        clientAddress: clientAddress || "",
        amount: parseInt(amount) || 0,
        publishDates: JSON.stringify(publishDates || []),
        description: description || "",
        roStatus: roStatus || "pending",
        linkedBookingId: null,
        createdBy: staffId,
        edition: edition || "",
        city: city || "",
        category: category || "",
        subcategory: subcategory || "",
        classification: classification || "",
        adContent: adContent || "",
        baseRate: baseRate ? parseInt(baseRate) : null,
        enchantmentTotal: enchantmentTotal ? parseInt(enchantmentTotal) : 0,
        gstAmount: gstAmount ? parseInt(gstAmount) : null,
        grandTotal: grandTotal ? parseInt(grandTotal) : null,
        paymentDetails: paymentDetails || "",
        remarks: remarks || ""
      } as any);

      res.json(record);
    } catch (error: any) {
      console.error("Error creating manual RO:", error);
      res.status(500).json({ error: error.message || "Failed to create manual RO" });
    }
  });

  app.get("/api/staff/manual-ros", requireStaffAuth, async (req, res) => {
    try {
      const records = await storage.getAllManualROs();
      res.json(records);
    } catch (error: any) {
      console.error("Error fetching manual ROs:", error);
      res.status(500).json({ error: error.message || "Failed to fetch manual ROs" });
    }
  });

  app.get("/api/staff/manual-ros/newspaper/:newspaperId", requireStaffAuth, async (req, res) => {
    try {
      const { newspaperId } = req.params;
      const records = await storage.getManualROsByNewspaper(newspaperId);
      res.json(records);
    } catch (error: any) {
      console.error("Error fetching manual ROs:", error);
      res.status(500).json({ error: error.message || "Failed to fetch manual ROs" });
    }
  });

  app.get("/api/staff/manual-ros/:id", requireStaffAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const record = await storage.getManualRO(id);

      if (!record) {
        return res.status(404).json({ error: "Manual RO not found" });
      }

      res.json(record);
    } catch (error: any) {
      console.error("Error fetching manual RO:", error);
      res.status(500).json({ error: error.message || "Failed to fetch manual RO" });
    }
  });

  app.put("/api/staff/manual-ros/:id", requireStaffAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const {
        roNumber,
        newspaperId,
        clientName,
        clientPhone,
        clientAddress,
        amount,
        publishDates,
        description,
        roStatus,
        linkedBookingId,
        edition,
        city,
        category,
        subcategory,
        classification,
        adContent,
        baseRate,
        enchantmentTotal,
        gstAmount,
        grandTotal,
        paymentDetails,
        remarks
      } = req.body;

      const updates: any = {};
      if (roNumber !== undefined) updates.roNumber = roNumber;
      if (newspaperId !== undefined) updates.newspaperId = newspaperId;
      if (clientName !== undefined) updates.clientName = clientName;
      if (clientPhone !== undefined) updates.clientPhone = clientPhone;
      if (clientAddress !== undefined) updates.clientAddress = clientAddress;
      if (amount !== undefined) updates.amount = amount;
      if (publishDates !== undefined) updates.publishDates = publishDates;
      if (description !== undefined) updates.description = description;
      if (roStatus !== undefined) updates.roStatus = roStatus;
      if (linkedBookingId !== undefined) updates.linkedBookingId = linkedBookingId;
      if (edition !== undefined) updates.edition = edition;
      if (city !== undefined) updates.city = city;
      if (category !== undefined) updates.category = category;
      if (subcategory !== undefined) updates.subcategory = subcategory;
      if (classification !== undefined) updates.classification = classification;
      if (adContent !== undefined) updates.adContent = adContent;
      if (baseRate !== undefined) updates.baseRate = baseRate;
      if (enchantmentTotal !== undefined) updates.enchantmentTotal = enchantmentTotal;
      if (gstAmount !== undefined) updates.gstAmount = gstAmount;
      if (grandTotal !== undefined) updates.grandTotal = grandTotal;
      if (paymentDetails !== undefined) updates.paymentDetails = paymentDetails;
      if (remarks !== undefined) updates.remarks = remarks;

      if (updates.roNumber !== undefined) {
        const existing = await storage.getManualROByNumber(updates.roNumber);
        if (existing && existing.id !== id) {
          return res.status(400).json({ error: "RO number already exists. Please use a unique RO number." });
        }
      }

      const record = await storage.updateManualRO(id, updates);

      if (!record) {
        return res.status(404).json({ error: "Manual RO not found" });
      }

      res.json(record);
    } catch (error: any) {
      console.error("Error updating manual RO:", error);
      res.status(500).json({ error: error.message || "Failed to update manual RO" });
    }
  });

  app.delete("/api/staff/manual-ros/:id", requireStaffAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteManualRO(id);

      if (!success) {
        return res.status(404).json({ error: "Manual RO not found" });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting manual RO:", error);
      res.status(500).json({ error: error.message || "Failed to delete manual RO" });
    }
  });

  console.log("Routes registered successfully");

  // Debug endpoint to check staff users
  app.get("/api/debug/staff-list", async (req, res) => {
    try {
      const allStaff = await storage.getAllStaff();
      res.json(allStaff.map((s: any) => ({ id: s.id, username: s.username, role: s.role })));
    } catch (error) {
      res.status(500).json({ error: (error as any).message });
    }
  });

  return httpServer;
} catch (error) {
  console.error("Error registering routes:", error);
  throw error;
}
}
