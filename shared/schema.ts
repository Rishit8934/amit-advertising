import { sql } from "drizzle-orm";
import { pgTable, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const staff = pgTable("staff", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("editor"),
});

export const cities = pgTable("cities", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  state: text("state").notNull(),
});

export const newspapers = pgTable("newspapers", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  language: text("language").notNull(),
  type: text("type").notNull(),
  pricingUnit: text("pricing_unit").notNull().default("line"),
  active: boolean("active").default(true).notNull(),
});

export const adTypes = pgTable("ad_types", {
  id: text("id").primaryKey(),
  newspaperId: text("newspaper_id").notNull().references(() => newspapers.id),
  name: text("name").notNull(),
  active: boolean("active").default(true).notNull(),
});

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  adTypeId: text("ad_type_id").notNull().references(() => adTypes.id),
  name: text("name").notNull(),
  active: boolean("active").default(true).notNull(),
});

export const subcategories = pgTable("subcategories", {
  id: text("id").primaryKey(),
  categoryId: text("category_id").notNull().references(() => categories.id),
  name: text("name").notNull(),
  active: boolean("active").default(true).notNull(),
});

export const preferredClassifications = pgTable("preferred_classifications", {
  id: text("id").primaryKey(),
  subcategoryId: text("subcategory_id").notNull().references(() => subcategories.id),
  name: text("name").notNull(),
  active: boolean("active").default(true).notNull(),
});

export const subClassifications = pgTable("sub_classifications", {
  id: text("id").primaryKey(),
  preferredClassificationId: text("preferred_classification_id").notNull().references(() => preferredClassifications.id),
  name: text("name").notNull(),
  active: boolean("active").default(true).notNull(),
});

export const adEnchantments = pgTable("ad_enchantments", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  previewHtml: text("preview_html"),
  price: integer("price").notNull(),
  active: boolean("active").default(true).notNull(),
});

export const newspaperEnchantmentRates = pgTable("newspaper_enchantment_rates", {
  id: text("id").primaryKey(),
  newspaperId: text("newspaper_id").notNull().references(() => newspapers.id),
  enchantmentId: text("enchantment_id").notNull().references(() => adEnchantments.id),
  price: integer("price").notNull(),
  active: boolean("active").default(true).notNull(),
});

export const editions = pgTable("editions", {
  id: text("id").primaryKey(),
  newspaperId: text("newspaper_id").notNull().references(() => newspapers.id),
  editionName: text("edition_name").notNull(),
  state: text("state").notNull(),
  active: boolean("active").default(true).notNull(),
});

export const editionCities = pgTable("edition_cities", {
  id: text("id").primaryKey(),
  editionId: text("edition_id").notNull().references(() => editions.id),
  cityId: text("city_id").notNull().references(() => cities.id),
});

export const packages = pgTable("packages", {
  id: text("id").primaryKey(),
  newspaperId: text("newspaper_id").notNull().references(() => newspapers.id),
  categoryId: text("category_id").references(() => categories.id),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  discount: integer("discount").default(0).notNull(),
  pricingType: text("pricing_type").default("per_line").notNull(),
  packageType: text("package_type").default("standard").notNull(),
  buyQuantity: integer("buy_quantity"),
  getQuantity: integer("get_quantity"),
  expiryDate: timestamp("expiry_date"),
  active: boolean("active").default(true).notNull(),
});

export const bookings = pgTable("bookings", {
  id: text("id").primaryKey(),
  roNumber: integer("ro_number"),
  userId: text("user_id").references(() => users.id),
  adMatterId: text("ad_matter_id").notNull().references(() => adMatters.id),
  editionId: text("edition_id").notNull().references(() => editions.id),
  cityId: text("city_id").notNull().references(() => cities.id),
  packageId: text("package_id").references(() => packages.id),
  customAdText: text("custom_ad_text"),
  options: text("options").notNull(),
  publishDates: text("publish_dates").notNull(),
  calculatedPricing: text("calculated_pricing").notNull(),
  paymentMethod: text("payment_method"),
  status: text("status").notNull().default("draft"),
  adminNotes: text("admin_notes"),
  edition: text("edition"),
  city: text("city"),
  subcategory: text("subcategory"),
  classification: text("classification"),
  paymentDetails: text("payment_details"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").notNull().references(() => bookings.id),
  amount: integer("amount").notNull(),
  method: text("method").notNull(),
  transactionId: text("transaction_id"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const bills = pgTable("bills", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").references(() => bookings.id),
  billNumber: text("bill_number"),
  billDate: timestamp("bill_date"),
  clientName: text("client_name").notNull(),
  clientNumber: text("client_number"),
  clientAddress: text("client_address"),
  clientGST: text("client_gst"),
  clientState: text("client_state"),
  items: text("items").notNull(),
  totalAmount: integer("total_amount").notNull(),
  discount: integer("discount").default(0).notNull(),
  cgst: integer("cgst"),
  sgst: integer("sgst"),
  igst: integer("igst"),
  grandTotal: integer("grand_total").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const rates = pgTable("rates", {
  id: text("id").primaryKey(),
  name: text("name"),
  newspaperId: text("newspaper_id").notNull().references(() => newspapers.id),
  adTypeId: text("ad_type_id").notNull().references(() => adTypes.id),
  categoryId: text("category_id").references(() => categories.id),
  language: text("language").notNull().default("EN"),
  sizeUnit: text("size_unit").notNull(),
  baseRate: integer("base_rate").notNull(),
  fixedRate: integer("fixed_rate"),
  exactSize: integer("exact_size"),
  minSize: integer("min_size"),
  maxSize: integer("max_size"),
  editionId: text("edition_id").references(() => editions.id),
  cityId: text("city_id").references(() => cities.id),
  notes: text("notes"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const adMatters = pgTable("ad_matters", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  content: text("content").notNull(),
  newspaperId: text("newspaper_id").notNull().references(() => newspapers.id),
  adTypeId: text("ad_type_id").notNull().references(() => adTypes.id),
  categoryId: text("category_id").references(() => categories.id),
  subcategoryId: text("subcategory_id").references(() => subcategories.id),
  preferredClassificationId: text("preferred_classification_id").references(() => preferredClassifications.id),
  subClassificationId: text("sub_classification_id").references(() => subClassifications.id),
  enchantments: text("enchantments"),
  rateId: text("rate_id").notNull().references(() => rates.id),
  size: integer("size").notNull(),
  language: text("language").notNull().default("EN"),
  tags: text("tags"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const staffRoles = pgTable("staff_roles", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  active: boolean("active").default(true).notNull(),
});

export const permissions = pgTable("permissions", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  active: boolean("active").default(true).notNull(),
});

export const rolePermissions = pgTable("role_permissions", {
  id: text("id").primaryKey(),
  roleId: text("role_id").notNull().references(() => staffRoles.id),
  permissionId: text("permission_id").notNull().references(() => permissions.id),
});

export const staffExtended = pgTable("staff_extended", {
  id: text("id").primaryKey(),
  staffId: text("staff_id").notNull().references(() => staff.id),
  roleId: text("role_id").notNull().references(() => staffRoles.id),
  permissions: text("permissions"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const faqs = pgTable("faqs", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  data: text("data"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const languages = pgTable("languages", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  nativeName: text("native_name").notNull(),
  active: boolean("active").default(true).notNull(),
});

export const rateCards = pgTable("rate_cards", {
  id: text("id").primaryKey(),
  newspaperId: text("newspaper_id").notNull().references(() => newspapers.id),
  imagePath: text("image_path").notNull(),
  imageName: text("image_name").notNull(),
  active: boolean("active").default(true).notNull(),
  uploadedAt: timestamp("uploaded_at").default(sql`now()`).notNull(),
});

export const staffLogins = pgTable("staff_logins", {
  id: text("id").primaryKey(),
  userEmail: text("user_email").notNull(),
  userId: text("user_id").references(() => users.id),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const manualROs = pgTable("manual_ros", {
  id: text("id").primaryKey(),
  roNumber: text("ro_number").notNull().unique(),
  newspaperId: text("newspaper_id").notNull().references(() => newspapers.id),
  clientName: text("client_name").notNull(),
  clientPhone: text("client_phone"),
  clientAddress: text("client_address"),
  amount: integer("amount").notNull(),
  publishDates: text("publish_dates").notNull(),
  description: text("description"),
  roStatus: text("ro_status").notNull().default("pending"),
  linkedBookingId: text("linked_booking_id").references(() => bookings.id),
  createdBy: text("created_by").notNull().references(() => staff.id),
  edition: text("edition"),
  city: text("city"),
  category: text("category"),
  subcategory: text("subcategory"),
  classification: text("classification"),
  adContent: text("ad_content"),
  baseRate: integer("base_rate"),
  enchantmentTotal: integer("enchantment_total"),
  gstAmount: integer("gst_amount"),
  grandTotal: integer("grand_total"),
  paymentDetails: text("payment_details"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const editionCombos = pgTable("edition_combos", {
  id: text("id").primaryKey(),
  newspaperId: text("newspaper_id").notNull().references(() => newspapers.id),
  name: text("name").notNull(),
  description: text("description"),
  totalPrice: integer("total_price").notNull(),
  active: boolean("active").default(true).notNull(),
});

export const editionComboEditions = pgTable("edition_combo_editions", {
  id: text("id").primaryKey(),
  comboId: text("combo_id").notNull().references(() => editionCombos.id),
  editionId: text("edition_id").notNull().references(() => editions.id),
});

// ---- Schemas & Types (unchanged) ----
export const insertUserSchema = createInsertSchema(users).pick({ username: true, password: true });
export const insertStaffSchema = createInsertSchema(staff).pick({ username: true, password: true, role: true });
export const insertCitySchema = createInsertSchema(cities);
export const insertNewspaperSchema = createInsertSchema(newspapers).omit({ id: true });
export const insertAdTypeSchema = createInsertSchema(adTypes).omit({ id: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertEditionSchema = createInsertSchema(editions).omit({ id: true });
export const insertEditionCitySchema = createInsertSchema(editionCities).omit({ id: true });
export const insertPackageSchema = createInsertSchema(packages).omit({ id: true });
export const insertAdMatterSchema = createInsertSchema(adMatters).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true });
export const insertBillSchema = createInsertSchema(bills).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRateSchema = createInsertSchema(rates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertStaffRoleSchema = createInsertSchema(staffRoles).omit({ id: true });
export const insertPermissionSchema = createInsertSchema(permissions).omit({ id: true });
export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({ id: true });
export const insertStaffExtendedSchema = createInsertSchema(staffExtended).omit({ id: true, createdAt: true });
export const insertFaqSchema = createInsertSchema(faqs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLanguageSchema = createInsertSchema(languages).omit({ id: true });
export const insertSubcategorySchema = createInsertSchema(subcategories).omit({ id: true });
export const insertPreferredClassificationSchema = createInsertSchema(preferredClassifications).omit({ id: true });
export const insertSubClassificationSchema = createInsertSchema(subClassifications).omit({ id: true });
export const insertAdEnchantmentSchema = createInsertSchema(adEnchantments).omit({ id: true });
export const insertNewspaperEnchantmentRateSchema = createInsertSchema(newspaperEnchantmentRates).omit({ id: true });
export const insertStaffLoginSchema = createInsertSchema(staffLogins).omit({ id: true, createdAt: true });
export const insertManualROSchema = createInsertSchema(manualROs).omit({ id: true, createdAt: true, updatedAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type InsertCity = z.infer<typeof insertCitySchema>;
export type InsertNewspaper = z.infer<typeof insertNewspaperSchema>;
export type InsertAdType = z.infer<typeof insertAdTypeSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertEdition = z.infer<typeof insertEditionSchema>;
export type InsertEditionCity = z.infer<typeof insertEditionCitySchema>;
export type InsertPackage = z.infer<typeof insertPackageSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertRate = z.infer<typeof insertRateSchema>;
export type InsertAdMatter = z.infer<typeof insertAdMatterSchema>;
export type InsertStaffRole = z.infer<typeof insertStaffRoleSchema>;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type InsertStaffExtended = z.infer<typeof insertStaffExtendedSchema>;
export type InsertFaq = z.infer<typeof insertFaqSchema>;
export type InsertLanguage = z.infer<typeof insertLanguageSchema>;
export type InsertSubcategory = z.infer<typeof insertSubcategorySchema>;
export type InsertPreferredClassification = z.infer<typeof insertPreferredClassificationSchema>;
export type InsertSubClassification = z.infer<typeof insertSubClassificationSchema>;
export type InsertAdEnchantment = z.infer<typeof insertAdEnchantmentSchema>;
export type InsertNewspaperEnchantmentRate = z.infer<typeof insertNewspaperEnchantmentRateSchema>;
export type Subcategory = typeof subcategories.$inferSelect;
export type PreferredClassification = typeof preferredClassifications.$inferSelect;
export type SubClassification = typeof subClassifications.$inferSelect;
export type AdEnchantment = typeof adEnchantments.$inferSelect;
export type NewspaperEnchantmentRate = typeof newspaperEnchantmentRates.$inferSelect;
export type Staff = typeof staff.$inferSelect;
export type City = typeof cities.$inferSelect;
export type Newspaper = typeof newspapers.$inferSelect;
export type AdType = typeof adTypes.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Edition = typeof editions.$inferSelect;
export type EditionCity = typeof editionCities.$inferSelect;
export type Package = typeof packages.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Bill = typeof bills.$inferSelect;
export type InsertBill = z.infer<typeof insertBillSchema>;
export type Rate = typeof rates.$inferSelect;
export type AdMatter = typeof adMatters.$inferSelect;
export type StaffRole = typeof staffRoles.$inferSelect;
export type Permission = typeof permissions.$inferSelect;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type StaffExtended = typeof staffExtended.$inferSelect;
export type Faq = typeof faqs.$inferSelect;
export type Language = typeof languages.$inferSelect;
export type RateCard = typeof rateCards.$inferSelect;
export type StaffLogin = typeof staffLogins.$inferSelect;
export type InsertStaffLogin = z.infer<typeof insertStaffLoginSchema>;
export type EditionCombo = typeof editionCombos.$inferSelect;
export type EditionComboEdition = typeof editionComboEditions.$inferSelect;
export type ManualRO = typeof manualROs.$inferSelect;
export type InsertManualRO = z.infer<typeof insertManualROSchema>;