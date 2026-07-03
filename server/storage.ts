import { type User, type InsertUser, type Staff, type City, type Newspaper, type AdType, type Category, type Edition, type EditionCity, type Package, type Booking, type Payment, type Bill, type InsertBill, type Rate, type AdMatter, type InsertAdMatter, type StaffRole, type Permission, type RolePermission, type StaffExtended, type Faq, type Language, type RateCard, type Subcategory, type PreferredClassification, type SubClassification, type AdEnchantment, type NewspaperEnchantmentRate, type InsertNewspaperEnchantmentRate, type StaffLogin, type InsertStaffLogin, type ManualRO, type InsertManualRO, type EditionCombo } from "../shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { users, staff, cities, newspapers, adTypes, categories, subcategories, preferredClassifications, subClassifications, adEnchantments, newspaperEnchantmentRates, editions, editionCities, packages, bookings, payments, bills, rates, adMatters, staffRoles, permissions, rolePermissions, staffExtended, faqs, languages, rateCards, staffLogins, manualROs, editionCombos, editionComboEditions } from "../shared/schema";
import { eq, and, or, isNull, inArray, count } from "drizzle-orm";

// ── Simple TTL cache ──────────────────────────────────────────────────────────
const cache = new Map<string, { data: any; expiresAt: number }>();
function getCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.data as T;
}
function setCache(key: string, data: any, ttlMs = 60_000) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}
export function invalidateCache(prefix?: string) {
  if (!prefix) { cache.clear(); return; }
  for (const k of cache.keys()) { if (k.startsWith(prefix)) cache.delete(k); }
}

// Booking model
export interface BookingResponse {
  id: string;
  userId: string;
  newspaper: string;
  city: string;
  language: string;
  adType: "classified" | "display" | "statutory";
  category: string;
  size: {
    unit: "line" | "cm2" | "column_inch";
    value: number;
  };
  publishDates: string[]; // ISO format
  pricing: {
    baseRate: number;
    estimatedTotal: number;
  };
  paymentMethod?: string;
  status: "draft" | "submitted" | "approved" | "published";
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Booking methods
  createBooking(booking: Omit<Booking, "id" | "createdAt" | "updatedAt">): Promise<Booking>;
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingsByUser(userId: string): Promise<Booking[]>;
  getAllBookings(): Promise<Booking[]>;
  updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | undefined>;
  deleteBooking(id: string): Promise<boolean>;

  // Newspaper methods
  createNewspaper(newspaper: Omit<Newspaper, "id">): Promise<Newspaper>;
  getNewspaper(id: string): Promise<Newspaper | undefined>;
  getAllNewspapers(): Promise<Newspaper[]>;
  updateNewspaper(id: string, updates: Partial<Newspaper>): Promise<Newspaper | undefined>;
  deleteNewspaper(id: string): Promise<boolean>;

  // Edition methods
  createEdition(edition: Omit<Edition, "id">): Promise<Edition>;
  getEdition(id: string): Promise<Edition | undefined>;
  getEditionsByNewspaper(newspaperId: string): Promise<Edition[]>;
  getAllEditions(): Promise<Edition[]>;
  updateEdition(id: string, updates: Partial<Edition>): Promise<Edition | undefined>;
  deleteEdition(id: string): Promise<boolean>;
  getEditionCombosByNewspaper(newspaperId: string): Promise<(EditionCombo & { editions: Edition[] })[]>;

  // City methods
  createCity(city: Omit<City, "id">): Promise<City>;
  getCity(id: string): Promise<City | undefined>;
  getCityByName(name: string): Promise<City | undefined>;
  getAllCities(): Promise<City[]>;
  updateCity(id: string, updates: Partial<City>): Promise<City | undefined>;
  deleteCity(id: string): Promise<boolean>;

  // Newspaper location queries (optimized)
  getNewspaperIdsByCity(cityId: string): Promise<string[]>;
  getNewspaperIdsByState(state: string): Promise<string[]>;
  getNewspapersByIds(ids: string[]): Promise<Newspaper[]>;

  // Edition-City relation
  addCityToEdition(editionId: string, cityId: string): Promise<void>;
  removeCityFromEdition(editionId: string, cityId: string): Promise<void>;
  getCitiesByEdition(editionId: string): Promise<City[]>;
  getEditionsByCity(cityId: string): Promise<Edition[]>;

  // Staff methods
  getStaff(id: string): Promise<Staff | undefined>;
  getStaffByUsername(username: string): Promise<Staff | undefined>;
  getAllStaff(): Promise<Staff[]>;
  createStaff(staff: Omit<Staff, "id">): Promise<Staff>;

  // AdType methods
  createAdType(adType: Omit<AdType, "id">): Promise<AdType>;
  getAdType(id: string): Promise<AdType | undefined>;
  getAdTypesByNewspaper(newspaperId: string): Promise<AdType[]>;
  getAllAdTypes(): Promise<AdType[]>;
  updateAdType(id: string, updates: Partial<AdType>): Promise<AdType | undefined>;
  deleteAdType(id: string): Promise<boolean>;

  // Category methods
  createCategory(category: Omit<Category, "id">): Promise<Category>;
  getCategory(id: string): Promise<Category | undefined>;
  getCategoriesByAdType(adTypeId: string): Promise<Category[]>;
  getAllCategories(): Promise<Category[]>;
  updateCategory(id: string, updates: Partial<Category>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  // Subcategory methods (Ad Headings)
  createSubcategory(subcategory: Omit<Subcategory, "id">): Promise<Subcategory>;
  getSubcategory(id: string): Promise<Subcategory | undefined>;
  getSubcategoriesByCategory(categoryId: string): Promise<Subcategory[]>;
  getAllSubcategories(): Promise<Subcategory[]>;
  updateSubcategory(id: string, updates: Partial<Subcategory>): Promise<Subcategory | undefined>;
  deleteSubcategory(id: string): Promise<boolean>;

  // Preferred Classification methods
  createPreferredClassification(classification: Omit<PreferredClassification, "id">): Promise<PreferredClassification>;
  getPreferredClassification(id: string): Promise<PreferredClassification | undefined>;
  getPreferredClassificationsBySubcategory(subcategoryId: string): Promise<PreferredClassification[]>;
  getAllPreferredClassifications(): Promise<PreferredClassification[]>;
  updatePreferredClassification(id: string, updates: Partial<PreferredClassification>): Promise<PreferredClassification | undefined>;
  deletePreferredClassification(id: string): Promise<boolean>;

  // Sub Classification methods
  createSubClassification(classification: Omit<SubClassification, "id">): Promise<SubClassification>;
  getSubClassification(id: string): Promise<SubClassification | undefined>;
  getSubClassificationsByPreferredClassification(preferredClassificationId: string): Promise<SubClassification[]>;
  getAllSubClassifications(): Promise<SubClassification[]>;
  updateSubClassification(id: string, updates: Partial<SubClassification>): Promise<SubClassification | undefined>;
  deleteSubClassification(id: string): Promise<boolean>;

  // Ad Enchantment methods
  createAdEnchantment(enchantment: Omit<AdEnchantment, "id">): Promise<AdEnchantment>;
  getAdEnchantment(id: string): Promise<AdEnchantment | undefined>;
  getAllAdEnchantments(): Promise<AdEnchantment[]>;
  updateAdEnchantment(id: string, updates: Partial<AdEnchantment>): Promise<AdEnchantment | undefined>;
  deleteAdEnchantment(id: string): Promise<boolean>;

  // Newspaper Enchantment Rate methods
  createNewspaperEnchantmentRate(rate: Omit<NewspaperEnchantmentRate, "id">): Promise<NewspaperEnchantmentRate>;
  getNewspaperEnchantmentRate(id: string): Promise<NewspaperEnchantmentRate | undefined>;
  getEnchantmentRatesByNewspaper(newspaperId: string): Promise<NewspaperEnchantmentRate[]>;
  getEnchantmentRatesByEnchantment(enchantmentId: string): Promise<NewspaperEnchantmentRate[]>;
  getAllNewspaperEnchantmentRates(): Promise<NewspaperEnchantmentRate[]>;
  updateNewspaperEnchantmentRate(id: string, updates: Partial<NewspaperEnchantmentRate>): Promise<NewspaperEnchantmentRate | undefined>;
  deleteNewspaperEnchantmentRate(id: string): Promise<boolean>;

  // Package methods
  createPackage(pkg: Omit<Package, "id">): Promise<Package>;
  getPackage(id: string): Promise<Package | undefined>;
  getPackagesByNewspaper(newspaperId: string): Promise<Package[]>;
  getAllPackages(): Promise<Package[]>;
  updatePackage(id: string, updates: Partial<Package>): Promise<Package | undefined>;
  deletePackage(id: string): Promise<boolean>;

  // Payment methods
  createPayment(payment: Omit<Payment, "id" | "createdAt">): Promise<Payment>;
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentsByBooking(bookingId: string): Promise<Payment[]>;
  updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined>;

  // Bill methods
  createBill(bill: Omit<Bill, "id" | "createdAt" | "updatedAt">): Promise<Bill>;
  getBill(id: string): Promise<Bill | undefined>;
  getBillByBookingId(bookingId: string): Promise<Bill | undefined>;
  getAllBills(): Promise<Bill[]>;
  updateBill(id: string, updates: Partial<Bill>): Promise<Bill | undefined>;
  deleteBill(id: string): Promise<boolean>;

  // Rate methods
  createRate(rate: Omit<Rate, "id" | "createdAt" | "updatedAt">): Promise<Rate>;
  getRate(id: string): Promise<Rate | undefined>;
  getAllRates(): Promise<Rate[]>;
  getRatesByNewspaper(newspaperId: string): Promise<Rate[]>;
  getRatesByCriteria(criteria: {
    newspaperId?: string;
    adTypeId?: string;
    categoryId?: string;
    editionId?: string;
    cityId?: string;
    sizeUnit?: string;
  }): Promise<Rate[]>;
  updateRate(id: string, updates: Partial<Rate>): Promise<Rate | undefined>;
  deleteRate(id: string): Promise<boolean>;

  // Staff role and permission methods
  createStaffRole(role: Omit<StaffRole, "id">): Promise<StaffRole>;
  getStaffRole(id: string): Promise<StaffRole | undefined>;
  getAllStaffRoles(): Promise<StaffRole[]>;
  updateStaffRole(id: string, updates: Partial<StaffRole>): Promise<StaffRole | undefined>;
  deleteStaffRole(id: string): Promise<boolean>;

  createPermission(permission: Omit<Permission, "id">): Promise<Permission>;
  getPermission(id: string): Promise<Permission | undefined>;
  getAllPermissions(): Promise<Permission[]>;
  updatePermission(id: string, updates: Partial<Permission>): Promise<Permission | undefined>;
  deletePermission(id: string): Promise<boolean>;

  assignPermissionToRole(roleId: string, permissionId: string): Promise<void>;
  removePermissionFromRole(roleId: string, permissionId: string): Promise<void>;
  getPermissionsByRole(roleId: string): Promise<Permission[]>;

  createStaffExtended(staffExt: Omit<StaffExtended, "id" | "createdAt">): Promise<StaffExtended>;
  getStaffExtended(staffId: string): Promise<StaffExtended | undefined>;
  updateStaffExtended(staffId: string, updates: Partial<StaffExtended>): Promise<StaffExtended | undefined>;

  // FAQ methods
  createFaq(faq: Omit<Faq, "id" | "createdAt" | "updatedAt">): Promise<Faq>;
  getFaq(id: string): Promise<Faq | undefined>;
  getAllFaqs(): Promise<Faq[]>;
  getFaqsByType(type: string): Promise<Faq[]>;
  updateFaq(id: string, updates: Partial<Faq>): Promise<Faq | undefined>;
  deleteFaq(id: string): Promise<boolean>;

  // Language methods
  createLanguage(language: Omit<Language, "id">): Promise<Language>;
  getLanguage(id: string): Promise<Language | undefined>;
  getAllLanguages(): Promise<Language[]>;
  updateLanguage(id: string, updates: Partial<Language>): Promise<Language | undefined>;
  deleteLanguage(id: string): Promise<boolean>;

  // Rate card methods
  createRateCard(rateCard: Omit<RateCard, "id" | "uploadedAt">): Promise<RateCard>;
  getRateCard(id: string): Promise<RateCard | undefined>;
  getRateCardsByNewspaper(newspaperId: string): Promise<RateCard[]>;
  getAllRateCards(): Promise<RateCard[]>;
  updateRateCard(id: string, updates: Partial<RateCard>): Promise<RateCard | undefined>;
  deleteRateCard(id: string): Promise<boolean>;

  // Staff login history
  createStaffLogin(record: Omit<StaffLogin, "id" | "createdAt">): Promise<StaffLogin>;
  getRecentStaffLogins(limit?: number): Promise<StaffLogin[]>;

  // Manual RO methods
  createManualRO(record: InsertManualRO): Promise<ManualRO>;
  getManualRO(id: string): Promise<ManualRO | undefined>;
  getAllManualROs(): Promise<ManualRO[]>;
  getManualROsByNewspaper(newspaperId: string): Promise<ManualRO[]>;
  updateManualRO(id: string, updates: Partial<ManualRO>): Promise<ManualRO | undefined>;
  deleteManualRO(id: string): Promise<boolean>;

  // Ad matter methods
  createAdMatter(adMatter: InsertAdMatter): Promise<AdMatter>;
  getAdMatter(id: string): Promise<AdMatter | undefined>;
  getAllAdMatters(): Promise<AdMatter[]>;
  getAdMattersByNewspaper(newspaperId: string): Promise<AdMatter[]>;
  getAdMattersByRate(rateId: string): Promise<AdMatter[]>;
  updateAdMatter(id: string, updates: Partial<AdMatter>): Promise<AdMatter | undefined>;
  deleteAdMatter(id: string): Promise<boolean>;
}

// Database storage implementation
export class DBStorage implements IStorage {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCached(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
  async getAllBookings(): Promise<Booking[]> {
    // Original method for interface compliance
    return await db.select().from(bookings);
  }
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { id, ...insertUser };
    await db.insert(users).values(user);
    return user;
  }

  async getStaff(id: string): Promise<Staff | undefined> {
    const result = await db.select().from(staff).where(eq(staff.id, id)).limit(1);
    return result[0];
  }

  async getStaffByUsername(username: string): Promise<Staff | undefined> {
    const result = await db.select().from(staff).where(eq(staff.username, username)).limit(1);
    return result[0];
  }

  async getAllStaff(): Promise<Staff[]> {
    return await db.select().from(staff);
  }

  async createStaff(staffData: { username: string; password: string; role: string }): Promise<Staff> {
    const id = randomUUID();
    const staffMember: Staff = { id, ...staffData };
    await db.insert(staff).values(staffMember);
    return staffMember;
  }

  async createBooking(
    booking: Omit<Booking, "id" | "createdAt" | "updatedAt">
  ): Promise<Booking> {
    const id = randomUUID();
    const now = new Date();

    // Generate RO number - find the highest existing RO number and increment

    // Generate RO number - find the highest existing RO number and increment
    // Use Drizzle's sql tagged template for IS NOT NULL and orderBy array for DESC
    const { sql } = await import("drizzle-orm");
    const existingBookings = await db.select({ roNumber: bookings.roNumber })
      .from(bookings)
      .where(sql`${bookings.roNumber.name} IS NOT NULL`)
      .orderBy(sql`${bookings.roNumber.name} DESC`)
      .limit(1);

    const nextRoNumber = existingBookings.length > 0 && existingBookings[0].roNumber
      ? existingBookings[0].roNumber + 1
      : 1; // Start from 1 if no existing bookings

    const newBooking: Booking = {
      ...booking,
      id,
      roNumber: nextRoNumber,
      createdAt: now,
      updatedAt: now,
    };
    await db.insert(bookings).values(newBooking);
    return newBooking;
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const result = await db.select().from(bookings).where(eq(bookings.id, id));
    return result[0];
  }

  async getBookingPopulated(id: string): Promise<any | undefined> {
    const booking = await this.getBooking(id);
    if (!booking) return undefined;

    // Get related entities
    const [edition, city, pkg, adMatter] = await Promise.all([
      db.select().from(editions).where(eq(editions.id, booking.editionId)).limit(1),
      db.select().from(cities).where(eq(cities.id, booking.cityId)).limit(1),
      booking.packageId ? db.select().from(packages).where(eq(packages.id, booking.packageId)).limit(1) : Promise.resolve([]),
      db.select().from(adMatters).where(eq(adMatters.id, booking.adMatterId)).limit(1),
    ]);

    const adMatterData = adMatter[0];
    let newspaper, adType, category, subcategory, preferredClassification, subClassification;

    if (adMatterData) {
      [newspaper, adType, category] = await Promise.all([
        db.select().from(newspapers).where(eq(newspapers.id, adMatterData.newspaperId)).limit(1),
        db.select().from(adTypes).where(eq(adTypes.id, adMatterData.adTypeId)).limit(1),
        adMatterData.categoryId ? db.select().from(categories).where(eq(categories.id, adMatterData.categoryId)).limit(1) : Promise.resolve([]),
      ]);

      // Get sub-entities if they exist
      if (adMatterData.subcategoryId) {
        subcategory = await db.select().from(subcategories).where(eq(subcategories.id, adMatterData.subcategoryId)).limit(1);
      }
      if (adMatterData.preferredClassificationId) {
        preferredClassification = await db.select().from(preferredClassifications).where(eq(preferredClassifications.id, adMatterData.preferredClassificationId)).limit(1);
      }
      if (adMatterData.subClassificationId) {
        subClassification = await db.select().from(subClassifications).where(eq(subClassifications.id, adMatterData.subClassificationId)).limit(1);
      }
    }

    return {
      ...booking,
      edition: edition[0] || null,
      city: city[0] || null,
      package: pkg[0] || null,
      adMatter: adMatterData ? {
        ...adMatterData,
        newspaper: newspaper?.[0] || null,
        category: category?.[0] || null,
        subcategory: subcategory?.[0] || null,
        preferredClassification: preferredClassification?.[0] || null,
        subClassification: subClassification?.[0] || null,
        adType: adType?.[0] || null,
      } : null,
    };
  }

  async getBookingsByUser(userId: string): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.userId, userId));
  }

  /**
   * Returns all bookings with related fields populated (for staff/admin views)
   */
  async getAllBookingsPopulated(): Promise<any[]> {
    // Get all bookings
    const allBookings = await db.select().from(bookings);
    if (allBookings.length === 0) return [];

    // Get all related entities in bulk for efficiency
    const [allEditions, allCities, allPackages, allAdMatters, allNewspapers, allAdTypes, allCategories] = await Promise.all([
      db.select().from(editions),
      db.select().from(cities),
      db.select().from(packages),
      db.select().from(adMatters),
      db.select().from(newspapers),
      db.select().from(adTypes),
      db.select().from(categories),
    ]);

    // Helper maps for quick lookup
    const editionMap = Object.fromEntries(allEditions.map(e => [e.id, e]));
    const cityMap = Object.fromEntries(allCities.map(c => [c.id, c]));
    const packageMap = Object.fromEntries(allPackages.map(p => [p.id, p]));
    const adMatterMap = Object.fromEntries(allAdMatters.map(a => [a.id, a]));
    const newspaperMap = Object.fromEntries(allNewspapers.map(n => [n.id, n]));
    const adTypeMap = Object.fromEntries(allAdTypes.map(a => [a.id, a]));
    const categoryMap = Object.fromEntries(allCategories.map(c => [c.id, c]));

    // Compose populated booking objects
    return allBookings.map(b => {
      const edition = editionMap[b.editionId];
      const city = cityMap[b.cityId];
      const pkg = b.packageId ? packageMap[b.packageId] : undefined;
      const adMatter = adMatterMap[b.adMatterId];
      // adMatter may have newspaperId, adTypeId, categoryId
      const newspaper = adMatter ? newspaperMap[adMatter.newspaperId] : undefined;
      const adType = adMatter ? adTypeMap[adMatter.adTypeId] : undefined;
      const category = adMatter && adMatter.categoryId ? categoryMap[adMatter.categoryId] : undefined;

      return {
        ...b,
        edition: edition || null,
        city: city || null,
        package: pkg || null,
        adMatter: adMatter || null,
        newspaper: newspaper || null,
        adType: adType || null,
        category: category || null,
      };
    });
  }

  async updateBooking(
    id: string,
    updates: Partial<Booking>,
  ): Promise<Booking | undefined> {
    console.log("updateBooking called with id:", id, "updates:", updates);
    const updateData = { ...updates, updatedAt: new Date() };
    console.log("updateData:", updateData);
    await db.update(bookings).set(updateData).where(eq(bookings.id, id));
    const result = await db.select().from(bookings).where(eq(bookings.id, id));
    console.log("Updated booking result:", result[0]);
    return result[0];
  }

  async deleteBooking(id: string): Promise<boolean> {
    const result = await db.delete(bookings).where(eq(bookings.id, id));
    return (result?.rowCount ?? result?.length ?? 1) > 0;
  }

  // Newspaper methods
  async createNewspaper(newspaper: Omit<Newspaper, "id">): Promise<Newspaper> {
    const id = randomUUID();
    const newNewspaper: Newspaper = { ...newspaper, id };
    await db.insert(newspapers).values(newNewspaper);
    invalidateCache("all_newspapers");
    return newNewspaper;
  }

  async getNewspaper(id: string): Promise<Newspaper | undefined> {
    const result = await db.select().from(newspapers).where(eq(newspapers.id, id));
    return result[0];
  }

  async getAllNewspapers(): Promise<Newspaper[]> {
    const cached = getCache<Newspaper[]>("all_newspapers");
    if (cached) return cached;
    const newspapersList = await db.select().from(newspapers);
    setCache("all_newspapers", newspapersList);
    return newspapersList;
  }

  async updateNewspaper(id: string, updates: Partial<Newspaper>): Promise<Newspaper | undefined> {
    await db.update(newspapers).set(updates).where(eq(newspapers.id, id));
    invalidateCache("all_newspapers");
    const result = await db.select().from(newspapers).where(eq(newspapers.id, id));
    return result[0];
  }

  async deleteNewspaper(id: string): Promise<boolean> {
    // Check for dependent records
    const adTypesCount = await db.select({ count: count() }).from(adTypes).where(eq(adTypes.newspaperId, id).then(r => r[0].count));
    const editionsCount = await db.select({ count: count() }).from(editions).where(eq(editions.newspaperId, id).then(r => r[0].count));
    const packagesCount = await db.select({ count: count() }).from(packages).where(eq(packages.newspaperId, id).then(r => r[0].count));
    const ratesCount = await db.select({ count: count() }).from(rates).where(eq(rates.newspaperId, id).then(r => r[0].count));
    const adMattersCount = await db.select({ count: count() }).from(adMatters).where(eq(adMatters.newspaperId, id).then(r => r[0].count));

    if (adTypesCount > 0 || editionsCount > 0 || packagesCount > 0 || ratesCount > 0 || adMattersCount > 0) {
      throw new Error(`Cannot delete newspaper: it has ${adTypesCount} ad types, ${editionsCount} editions, ${packagesCount} packages, ${ratesCount} rates, and ${adMattersCount} ad matters associated with it. Please delete these dependencies first.`);
    }

    const result = await db.delete(newspapers).where(eq(newspapers.id, id));
    return (result?.rowCount ?? result?.length ?? 1) > 0;
  }

  // Edition methods
  async createEdition(edition: Omit<Edition, "id">): Promise<Edition> {
    const id = randomUUID();
    const newEdition: Edition = { ...edition, id };
    await db.insert(editions).values(newEdition);
    invalidateCache(`editions_${edition.newspaperId}`);
    return newEdition;
  }

  async getEdition(id: string): Promise<Edition | undefined> {
    const result = await db.select().from(editions).where(eq(editions.id, id));
    return result[0];
  }

  async getEditionsByNewspaper(newspaperId: string): Promise<Edition[]> {
    const key = `editions_${newspaperId}`;
    const cached = getCache<Edition[]>(key);
    if (cached) return cached;
    const result = await db.select().from(editions).where(eq(editions.newspaperId, newspaperId));
    setCache(key, result);
    return result;
  }

  async getEditionCombosByNewspaper(newspaperId: string): Promise<(EditionCombo & { editions: Edition[] })[]> {
    const combos = await db.select().from(editionCombos).where(eq(editionCombos.newspaperId, newspaperId));
    const result: (EditionCombo & { editions: Edition[] })[] = [];
    for (const combo of combos) {
      const links = await db.select({ edition: editions })
        .from(editionComboEditions)
        .innerJoin(editions, eq(editionComboEditions.editionId, editions.id))
        .where(eq(editionComboEditions.comboId, combo.id));
      result.push({ ...combo, editions: links.map(l => l.edition) });
    }
    return result;
  }

  async getAllEditions(): Promise<Edition[]> {
    return await db.select().from(editions);
  }

  async updateEdition(id: string, updates: Partial<Edition>): Promise<Edition | undefined> {
    await db.update(editions).set(updates).where(eq(editions.id, id));
    invalidateCache("editions_");
    const result = await db.select().from(editions).where(eq(editions.id, id));
    return result[0];
  }

  async deleteEdition(id: string): Promise<boolean> {
    // Check for dependent records
    const editionCitiesCount = await db.select({ count: count() }).from(editionCities).where(eq(editionCities.editionId, id).then(r => r[0].count));
    const bookingsCount = await db.select({ count: count() }).from(bookings).where(eq(bookings.editionId, id).then(r => r[0].count));
    const ratesCount = await db.select({ count: count() }).from(rates).where(eq(rates.editionId, id).then(r => r[0].count));

    if (editionCitiesCount > 0 || bookingsCount > 0 || ratesCount > 0) {
      throw new Error(`Cannot delete edition: it has ${editionCitiesCount} city associations, ${bookingsCount} bookings, and ${ratesCount} rates associated with it. Please delete these dependencies first.`);
    }

    const result = await db.delete(editions).where(eq(editions.id, id));
    return (result?.rowCount ?? result?.length ?? 1) > 0;
  }

  // City methods
  async createCity(city: Omit<City, "id">): Promise<City> {
    const id = randomUUID();
    const newCity: City = { ...city, id };
    await db.insert(cities).values(newCity);
    return newCity;
  }

  async getCity(id: string): Promise<City | undefined> {
    const result = await db.select().from(cities).where(eq(cities.id, id));
    return result[0];
  }

  async getCityByName(name: string): Promise<City | undefined> {
    const result = await db.select().from(cities).where(eq(cities.name, name));
    return result[0];
  }

  async getAllCities(): Promise<City[]> {
    // const cached = this.getCached<City[]>("all_cities");
    // if (cached) return cached;

    const citiesList = await db.select().from(cities);
    // this.setCached("all_cities", citiesList);
    return citiesList;

    // Temporary workaround: use raw SQL
    // try {
    //   const { default: Database } = await import('better-sqlite3');
    //   const sqlite = Database("data.db");
    //   const result = sqlite.prepare('SELECT * FROM cities').all();
    //   sqlite.close();
    //   return result as City[];
    // } catch (error) {
    //   console.error('getAllCities error:', error);
    //   throw error;
    // }
  }

  async getNewspaperIdsByCity(cityId: string): Promise<string[]> {
    const result = await db
      .select({ newspaperId: editions.newspaperId })
      .from(editionCities)
      .innerJoin(editions, eq(editionCities.editionId, editions.id))
      .where(eq(editionCities.cityId, cityId));
    return result.map(r => r.newspaperId);
  }

  async getNewspaperIdsByState(state: string): Promise<string[]> {
    const result = await db
      .select({ newspaperId: editions.newspaperId })
      .from(editions)
      .where(eq(editions.state, state));
    return Array.from(new Set(result.map(r => r.newspaperId)));
  }

  async getNewspapersByIds(ids: string[]): Promise<Newspaper[]> {
    if (ids.length === 0) return [];

    const cacheKey = `newspapers_${ids.sort().join(',')}`;
    const cached = this.getCached<Newspaper[]>(cacheKey);
    if (cached) return cached;

    const result = await db
      .select()
      .from(newspapers)
      .where(inArray(newspapers.id, ids));
    this.setCached(cacheKey, result);
    return result;
  }

  async updateCity(id: string, updates: Partial<City>): Promise<City | undefined> {
    await db.update(cities).set(updates).where(eq(cities.id, id));
    const result = await db.select().from(cities).where(eq(cities.id, id));
    return result[0];
  }

  async deleteCity(id: string): Promise<boolean> {
    const result = await db.delete(cities).where(eq(cities.id, id));
    return (result?.rowCount ?? result?.length ?? 1) > 0;
  }

  // Edition-City relation
  async addCityToEdition(editionId: string, cityId: string): Promise<void> {
    const existing = await db.select().from(editionCities).where(and(eq(editionCities.editionId, editionId), eq(editionCities.cityId, cityId)));
    if (existing.length === 0) {
      const id = randomUUID();
      await db.insert(editionCities).values({ id, editionId, cityId });
    }
  }

  async removeCityFromEdition(editionId: string, cityId: string): Promise<void> {
    await db.delete(editionCities).where(and(eq(editionCities.editionId, editionId), eq(editionCities.cityId, cityId)));
  }

  async getCitiesByEdition(editionId: string): Promise<City[]> {
    const result = await db.select({
      city: cities
    }).from(editionCities)
      .innerJoin(cities, eq(editionCities.cityId, cities.id))
      .where(eq(editionCities.editionId, editionId));
    return result.map(r => r.city);
  }

  async getEditionsByCity(cityId: string): Promise<Edition[]> {
    const result = await db.select({
      edition: editions
    }).from(editionCities)
      .innerJoin(editions, eq(editionCities.editionId, editions.id))
      .where(eq(editionCities.cityId, cityId));
    return result.map(r => r.edition);
  }

  // AdType methods
  async createAdType(adType: Omit<AdType, "id">): Promise<AdType> {
    const id = randomUUID();
    const newAdType: AdType = { ...adType, id };
    await db.insert(adTypes).values(newAdType);
    return newAdType;
  }

  async getAdType(id: string): Promise<AdType | undefined> {
    const result = await db.select().from(adTypes).where(eq(adTypes.id, id));
    return result[0];
  }

  async getAdTypesByNewspaper(newspaperId: string): Promise<AdType[]> {
    return await db.select().from(adTypes).where(eq(adTypes.newspaperId, newspaperId));
  }

  async getAllAdTypes(): Promise<AdType[]> {
    return await db.select().from(adTypes);
  }

  async updateAdType(id: string, updates: Partial<AdType>): Promise<AdType | undefined> {
    await db.update(adTypes).set(updates).where(eq(adTypes.id, id));
    const result = await db.select().from(adTypes).where(eq(adTypes.id, id));
    return result[0];
  }

  async deleteAdType(id: string): Promise<boolean> {
    // Check for dependent records
    const categoriesCount = await db.select({ count: count() }).from(categories).where(eq(categories.adTypeId, id).then(r => r[0].count));
    const ratesCount = await db.select({ count: count() }).from(rates).where(eq(rates.adTypeId, id).then(r => r[0].count));
    const adMattersCount = await db.select({ count: count() }).from(adMatters).where(eq(adMatters.adTypeId, id).then(r => r[0].count));

    if (categoriesCount > 0 || ratesCount > 0 || adMattersCount > 0) {
      throw new Error(`Cannot delete ad type: it has ${categoriesCount} categories, ${ratesCount} rates, and ${adMattersCount} ad matters associated with it. Please delete these dependencies first.`);
    }

    const result = await db.delete(adTypes).where(eq(adTypes.id, id));
    return (result?.rowCount ?? result?.length ?? 1) > 0;
  }

  // Category methods
  async createCategory(category: Omit<Category, "id">): Promise<Category> {
    const id = randomUUID();
    const newCategory: Category = { ...category, id };
    await db.insert(categories).values(newCategory);
    return newCategory;
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.id, id));
    return result[0];
  }

  async getCategoriesByAdType(adTypeId: string): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.adTypeId, adTypeId));
  }

  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | undefined> {
    await db.update(categories).set(updates).where(eq(categories.id, id));
    const result = await db.select().from(categories).where(eq(categories.id, id));
    return result[0];
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result?.rowCount ?? result?.length ?? 1) > 0;
  }

  // Subcategory methods (Ad Headings)
  async createSubcategory(subcategory: Omit<Subcategory, "id">): Promise<Subcategory> {
    const id = randomUUID();
    const newSubcategory: Subcategory = { ...subcategory, id };
    await db.insert(subcategories).values(newSubcategory);
    return newSubcategory;
  }

  async getSubcategory(id: string): Promise<Subcategory | undefined> {
    const result = await db.select().from(subcategories).where(eq(subcategories.id, id));
    return result[0];
  }

  async getSubcategoriesByCategory(categoryId: string): Promise<Subcategory[]> {
    return await db.select().from(subcategories).where(eq(subcategories.categoryId, categoryId));
  }

  async getAllSubcategories(): Promise<Subcategory[]> {
    return await db.select().from(subcategories);
  }

  async updateSubcategory(id: string, updates: Partial<Subcategory>): Promise<Subcategory | undefined> {
    await db.update(subcategories).set(updates).where(eq(subcategories.id, id));
    const result = await db.select().from(subcategories).where(eq(subcategories.id, id));
    return result[0];
  }

  async deleteSubcategory(id: string): Promise<boolean> {
    const result = await db.delete(subcategories).where(eq(subcategories.id, id));
    return (result?.rowCount ?? result?.length ?? 1) > 0;
  }

  // Preferred Classification methods
  async createPreferredClassification(classification: Omit<PreferredClassification, "id">): Promise<PreferredClassification> {
    const id = randomUUID();
    const newClassification: PreferredClassification = { ...classification, id };
    await db.insert(preferredClassifications).values(newClassification);
    return newClassification;
  }

  async getPreferredClassification(id: string): Promise<PreferredClassification | undefined> {
    const result = await db.select().from(preferredClassifications).where(eq(preferredClassifications.id, id));
    return result[0];
  }

  async getPreferredClassificationsBySubcategory(subcategoryId: string): Promise<PreferredClassification[]> {
    return await db.select().from(preferredClassifications).where(eq(preferredClassifications.subcategoryId, subcategoryId));
  }

  async getAllPreferredClassifications(): Promise<PreferredClassification[]> {
    return await db.select().from(preferredClassifications);
  }

  async updatePreferredClassification(id: string, updates: Partial<PreferredClassification>): Promise<PreferredClassification | undefined> {
    await db.update(preferredClassifications).set(updates).where(eq(preferredClassifications.id, id));
    const result = await db.select().from(preferredClassifications).where(eq(preferredClassifications.id, id));
    return result[0];
  }

  async deletePreferredClassification(id: string): Promise<boolean> {
    const result = await db.delete(preferredClassifications).where(eq(preferredClassifications.id, id));
    return (result?.rowCount ?? result?.length ?? 1) > 0;
  }

  // Sub Classification methods
  async createSubClassification(classification: Omit<SubClassification, "id">): Promise<SubClassification> {
    const id = randomUUID();
    const newClassification: SubClassification = { ...classification, id };
    await db.insert(subClassifications).values(newClassification);
    return newClassification;
  }

  async getSubClassification(id: string): Promise<SubClassification | undefined> {
    const result = await db.select().from(subClassifications).where(eq(subClassifications.id, id));
    return result[0];
  }

  async getSubClassificationsByPreferredClassification(preferredClassificationId: string): Promise<SubClassification[]> {
    return await db.select().from(subClassifications).where(eq(subClassifications.preferredClassificationId, preferredClassificationId));
  }

  async getAllSubClassifications(): Promise<SubClassification[]> {
    return await db.select().from(subClassifications);
  }

  async updateSubClassification(id: string, updates: Partial<SubClassification>): Promise<SubClassification | undefined> {
    await db.update(subClassifications).set(updates).where(eq(subClassifications.id, id));
    const result = await db.select().from(subClassifications).where(eq(subClassifications.id, id));
    return result[0];
  }

  async deleteSubClassification(id: string): Promise<boolean> {
    const result = await db.delete(subClassifications).where(eq(subClassifications.id, id));
    return (result?.rowCount ?? result?.length ?? 1) > 0;
  }

  // Ad Enchantment methods
  async createAdEnchantment(enchantment: Omit<AdEnchantment, "id">): Promise<AdEnchantment> {
    const id = randomUUID();
    const newEnchantment: AdEnchantment = { ...enchantment, id };
    await db.insert(adEnchantments).values(newEnchantment);
    return newEnchantment;
  }

  async getAdEnchantment(id: string): Promise<AdEnchantment | undefined> {
    const result = await db.select().from(adEnchantments).where(eq(adEnchantments.id, id));
    return result[0];
  }

  async getAllAdEnchantments(): Promise<AdEnchantment[]> {
    return await db.select().from(adEnchantments);
  }

  async updateAdEnchantment(id: string, updates: Partial<AdEnchantment>): Promise<AdEnchantment | undefined> {
    await db.update(adEnchantments).set(updates).where(eq(adEnchantments.id, id));
    const result = await db.select().from(adEnchantments).where(eq(adEnchantments.id, id));
    return result[0];
  }

  async deleteAdEnchantment(id: string): Promise<boolean> {
    const result = await db.delete(adEnchantments).where(eq(adEnchantments.id, id));
    return (result?.rowCount ?? result?.length ?? 1) > 0;
  }

  // Newspaper Enchantment Rate methods
  async createNewspaperEnchantmentRate(rate: Omit<NewspaperEnchantmentRate, "id">): Promise<NewspaperEnchantmentRate> {
    const id = randomUUID();
    const newRate: NewspaperEnchantmentRate = { ...rate, id };
    await db.insert(newspaperEnchantmentRates).values(newRate);
    return newRate;
  }

  async getNewspaperEnchantmentRate(id: string): Promise<NewspaperEnchantmentRate | undefined> {
    const result = await db.select().from(newspaperEnchantmentRates).where(eq(newspaperEnchantmentRates.id, id));
    return result[0];
  }

  async getEnchantmentRatesByNewspaper(newspaperId: string): Promise<NewspaperEnchantmentRate[]> {
    return await db.select().from(newspaperEnchantmentRates).where(eq(newspaperEnchantmentRates.newspaperId, newspaperId));
  }

  async getEnchantmentRatesByEnchantment(enchantmentId: string): Promise<NewspaperEnchantmentRate[]> {
    return await db.select().from(newspaperEnchantmentRates).where(eq(newspaperEnchantmentRates.enchantmentId, enchantmentId));
  }

  async getAllNewspaperEnchantmentRates(): Promise<NewspaperEnchantmentRate[]> {
    return await db.select().from(newspaperEnchantmentRates);
  }

  async updateNewspaperEnchantmentRate(id: string, updates: Partial<NewspaperEnchantmentRate>): Promise<NewspaperEnchantmentRate | undefined> {
    await db.update(newspaperEnchantmentRates).set(updates).where(eq(newspaperEnchantmentRates.id, id));
    const result = await db.select().from(newspaperEnchantmentRates).where(eq(newspaperEnchantmentRates.id, id));
    return result[0];
  }

  async deleteNewspaperEnchantmentRate(id: string): Promise<boolean> {
    const result = await db.delete(newspaperEnchantmentRates).where(eq(newspaperEnchantmentRates.id, id));
    return (result?.rowCount ?? result?.length ?? 1) > 0;
  }

  // Package methods
  async createPackage(pkg: Omit<Package, "id">): Promise<Package> {
    const id = randomUUID();
    const newPackage: Package = { ...pkg, id };
    await db.insert(packages).values(newPackage);
    invalidateCache(`packages_${pkg.newspaperId}`);
    return newPackage;
  }

  async getPackage(id: string): Promise<Package | undefined> {
    const result = await db.select().from(packages).where(eq(packages.id, id));
    return result[0];
  }

  async getPackagesByNewspaper(newspaperId: string): Promise<Package[]> {
    const key = `packages_${newspaperId}`;
    const cached = getCache<Package[]>(key);
    if (cached) return cached;
    const result = await db.select().from(packages).where(eq(packages.newspaperId, newspaperId));
    setCache(key, result);
    return result;
  }

  async getAllPackages(): Promise<Package[]> {
    return await db.select().from(packages);
  }

  async updatePackage(id: string, updates: Partial<Package>): Promise<Package | undefined> {
    await db.update(packages).set(updates).where(eq(packages.id, id));
    invalidateCache("packages_");
    const result = await db.select().from(packages).where(eq(packages.id, id));
    return result[0];
  }

  async deletePackage(id: string): Promise<boolean> {
    invalidateCache("packages_");
    const result = await db.delete(packages).where(eq(packages.id, id));
    return (result?.rowCount ?? result?.length ?? 1) > 0;
  }

  // Payment methods
  async createPayment(payment: Omit<Payment, "id" | "createdAt">): Promise<Payment> {
    const id = randomUUID();
    const newPayment: Payment = { ...payment, id, createdAt: new Date() };
    await db.insert(payments).values(newPayment);
    return newPayment;
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const result = await db.select().from(payments).where(eq(payments.id, id));
    return result[0];
  }

  async getPaymentsByBooking(bookingId: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.bookingId, bookingId));
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    await db.update(payments).set(updates).where(eq(payments.id, id));
    const result = await db.select().from(payments).where(eq(payments.id, id));
    return result[0];
  }

  // Bill methods
  async createBill(bill: Omit<Bill, "id" | "createdAt" | "updatedAt">): Promise<Bill> {
    console.log("createBill called with data:", bill);
    const id = randomUUID();
    const now = new Date();

    const toPaise = (v: any) => {
      if (v === null || v === undefined || v === "") return 0;
      const n = Number(v);
      if (Number.isNaN(n)) throw new Error(`Invalid numeric value for bill amount: ${v}`);
      return Math.round(n * 100);
    };

    const totalAmountPaise = toPaise((bill as any).totalAmount);
    const cgstPaise = toPaise((bill as any).cgst || 0);
    const sgstPaise = toPaise((bill as any).sgst || 0);
    const igstPaise = toPaise((bill as any).igst || 0);
    // If grandTotal provided, use it; otherwise calculate from components
    const grandTotalPaise = (bill as any).grandTotal != null 
      ? toPaise((bill as any).grandTotal)
      : (totalAmountPaise + cgstPaise + sgstPaise + igstPaise);

    // Ensure items is a string in DB (existing callers sometimes pass objects)
    const itemsString = typeof (bill as any).items === 'string' ? (bill as any).items : JSON.stringify((bill as any).items || []);

    let billDateValue: Date | undefined;
    if (bill.billDate) {
      const billTime = new Date(bill.billDate);
      if (!isNaN(billTime.getTime())) {
        billDateValue = billTime;
      }
    }

    let billNumber = (bill as any).billNumber;
    if (!billNumber) {
      const existingBills = await db.select().from(bills);
      const numericBillNumbers = existingBills
        .map((existingBill: any) => parseInt(existingBill.billNumber, 10))
        .filter((value: number) => Number.isFinite(value));
      const maxBillNumber = numericBillNumbers.length > 0 ? Math.max(...numericBillNumbers) : 0;
      billNumber = String(maxBillNumber + 1);
    }

    const newBill: any = {
      id,
      billNumber,
      clientName: bill.clientName,
      clientNumber: bill.clientNumber || "",
      clientAddress: bill.clientAddress || "",
      clientGST: bill.clientGST || "",
      clientState: bill.clientState || "",
      items: itemsString,
      totalAmount: totalAmountPaise,
      cgst: cgstPaise,
      sgst: sgstPaise,
      igst: igstPaise,
      grandTotal: grandTotalPaise,
      discount: Math.round(parseFloat((bill as any).discount || 0))
    };

    if (billDateValue) {
      newBill.billDate = billDateValue;
    }

    if ((bill as any).bookingId) {
      newBill.bookingId = (bill as any).bookingId;
    }

    // Do not set createdAt/updatedAt manually; sqlite defaults handle it.
    const newBillTyped: any = newBill;

    console.log("Inserting bill:", { ...newBillTyped, items: itemsString });
    // Attempt insert; if DB schema is older and missing a column (e.g. igst),
    // remove that property and retry once to remain backwards-compatible.
    const insertData: any = { ...newBillTyped };
    try {
      await db.insert(bills).values(insertData);
    } catch (e: any) {
      // Detect 'no column named <col>' errors from sqlite
      const message = String(e && (e.message || e));
      const m = message.match(/no column named\s+([a-zA-Z0-9_]+)/i);
      if (m && m[1]) {
        const col = m[1];
        console.warn(`Insert failed due to missing column '${col}', removing it and retrying`);
        delete insertData[col];
        await db.insert(bills).values(insertData);
      } else {
        console.error("createBill failed - invalid data or DB error:", e);
        throw e;
      }
    }
    console.log("Bill inserted successfully");
    // Return the bill with timestamps - these will be set by the database
    return {
      ...newBillTyped,
      createdAt: now as any,
      updatedAt: now as any,
    } as any as Bill;
  }

  async getBill(id: string): Promise<Bill | undefined> {
    const result = await db.select().from(bills).where(eq(bills.id, id));
    return result[0];
  }

  async getBillByBookingId(bookingId: string): Promise<Bill | undefined> {
    const result = await db.select().from(bills).where(eq(bills.bookingId, bookingId));
    return result[0];
  }

  async getAllBills(): Promise<Bill[]> {
    return await db.select().from(bills).orderBy(bills.createdAt);
  }

  async updateBill(id: string, updates: Partial<Bill>): Promise<Bill | undefined> {
    const now = new Date();
    
    // Handle date conversions - convert string dates to proper Date objects
    const processedUpdates: any = { ...updates };
    
    if (processedUpdates.billDate) {
      if (typeof processedUpdates.billDate === 'string') {
        const dateObj = new Date(processedUpdates.billDate);
        processedUpdates.billDate = !isNaN(dateObj.getTime()) ? dateObj : now;
      } else if (processedUpdates.billDate instanceof Date) {
        processedUpdates.billDate = processedUpdates.billDate;
      } else {
        processedUpdates.billDate = now;
      }
    }
    
    await db.update(bills).set({ ...processedUpdates, updatedAt: now }).where(eq(bills.id, id));
    const result = await db.select().from(bills).where(eq(bills.id, id));
    return result[0];
  }

  async deleteBill(id: string): Promise<boolean> {
    const result = await db.delete(bills).where(eq(bills.id, id));
    return (result?.rowCount ?? result?.length ?? 1) > 0;
  }

  // Rate methods
  async createRate(rate: Omit<Rate, "id" | "createdAt" | "updatedAt">): Promise<Rate> {
    const id = randomUUID();
    const now = new Date();
    const newRate: Rate = { ...rate, id, createdAt: now, updatedAt: now };
    await db.insert(rates).values(newRate);
    invalidateCache("rates_");
    return newRate;
  }

  async getRate(id: string): Promise<Rate | undefined> {
    const result = await db.select().from(rates).where(eq(rates.id, id));
    return result[0];
  }

  async getAllRates(): Promise<Rate[]> {
    return await db.select().from(rates);
  }

  async getRatesByNewspaper(newspaperId: string): Promise<Rate[]> {
    const key = `rates_${newspaperId}`;
    const cached = getCache<Rate[]>(key);
    if (cached) return cached;
    const result = await db.select().from(rates).where(eq(rates.newspaperId, newspaperId));
    setCache(key, result);
    return result;
  }

  async getRatesByCriteria(criteria: {
    newspaperId?: string;
    adTypeId?: string;
    categoryId?: string;
    editionId?: string;
    cityId?: string;
    sizeUnit?: string;
  }): Promise<Rate[]> {
    const key = `rates_criteria_${JSON.stringify(criteria)}`;
    const cached = getCache<Rate[]>(key);
    if (cached) return cached;
    console.log("getRatesByCriteria called with criteria:", criteria);
    const conditions = [];

    if (criteria.newspaperId) {
      conditions.push(eq(rates.newspaperId, criteria.newspaperId));
    }
    if (criteria.adTypeId) {
      conditions.push(eq(rates.adTypeId, criteria.adTypeId));
    }
    if (criteria.categoryId) {
      conditions.push(or(eq(rates.categoryId, criteria.categoryId), isNull(rates.categoryId))!);
    }
    if (criteria.editionId) {
      conditions.push(eq(rates.editionId, criteria.editionId));
    }
    if (criteria.cityId) {
      conditions.push(eq(rates.cityId, criteria.cityId));
    }
    if (criteria.sizeUnit) {
      conditions.push(eq(rates.sizeUnit, criteria.sizeUnit));
    }

    console.log("Conditions:", conditions.length);
    let result: Rate[];
    if (conditions.length === 0) {
      result = await db.select().from(rates).where(eq(rates.active, true));
      console.log("Returning all active rates, count:", result.length);
    } else if (conditions.length === 1) {
      result = await db.select().from(rates).where(and(eq(rates.active, true), conditions[0]));
      console.log("Returning filtered rates (1 condition), count:", result.length);
    } else {
      let combinedCondition = and(eq(rates.active, true), conditions[0]);
      for (let i = 1; i < conditions.length; i++) {
        combinedCondition = and(combinedCondition, conditions[i]);
      }
      result = await db.select().from(rates).where(combinedCondition);
      console.log("Returning filtered rates (multiple conditions), count:", result.length);
    }
    setCache(key, result);
    return result;
  }

  async updateRate(id: string, updates: Partial<Rate>): Promise<Rate | undefined> {
    const now = new Date();
    await db.update(rates).set({ ...updates, updatedAt: now }).where(eq(rates.id, id));
    invalidateCache("rates_");
    const result = await db.select().from(rates).where(eq(rates.id, id));
    return result[0];
  }

  async deleteRate(id: string): Promise<boolean> {
    const result = await db.delete(rates).where(eq(rates.id, id));
    return (result?.rowCount ?? result?.length ?? 1) > 0;
  }

  // Staff role methods
  async createStaffRole(role: Omit<StaffRole, "id">): Promise<StaffRole> {
    const id = randomUUID();
    const newRole: StaffRole = { ...role, id };
    await db.insert(staffRoles).values(newRole);
    return newRole;
  }

  async getStaffRole(id: string): Promise<StaffRole | undefined> {
    const result = await db.select().from(staffRoles).where(eq(staffRoles.id, id));
    return result[0];
  }

  async getAllStaffRoles(): Promise<StaffRole[]> {
    return await db.select().from(staffRoles);
  }

  async updateStaffRole(id: string, updates: Partial<StaffRole>): Promise<StaffRole | undefined> {
    await db.update(staffRoles).set(updates).where(eq(staffRoles.id, id));
    const result = await db.select().from(staffRoles).where(eq(staffRoles.id, id));
    return result[0];
  }

  async deleteStaffRole(id: string): Promise<boolean> {
    const result = await db.delete(staffRoles).where(eq(staffRoles.id, id));
    return (result?.rowCount ?? result?.length ?? 1) > 0;
  }

  // Permission methods
  async createPermission(permission: Omit<Permission, "id">): Promise<Permission> {
    const id = randomUUID();
    const newPermission: Permission = { ...permission, id };
    await db.insert(permissions).values(newPermission);
    return newPermission;
  }

  async getPermission(id: string): Promise<Permission | undefined> {
    const result = await db.select().from(permissions).where(eq(permissions.id, id));
    return result[0];
  }

  async getAllPermissions(): Promise<Permission[]> {
    return await db.select().from(permissions);
  }

  async updatePermission(id: string, updates: Partial<Permission>): Promise<Permission | undefined> {
    await db.update(permissions).set(updates).where(eq(permissions.id, id));
    const result = await db.select().from(permissions).where(eq(permissions.id, id));
    return result[0];
  }

  async deletePermission(id: string): Promise<boolean> {
    const result = await db.delete(permissions).where(eq(permissions.id, id));
    return (result?.rowCount ?? result?.length ?? 1) > 0;
  }

  // Role-Permission methods
  async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    const id = randomUUID();
    await db.insert(rolePermissions).values({ id, roleId, permissionId });
  }

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    await db.delete(rolePermissions).where(
      and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.permissionId, permissionId))
    );
  }

  async getPermissionsByRole(roleId: string): Promise<Permission[]> {
    const result = await db
      .select()
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));
    return result.map(row => row.permissions);
  }

  // Staff extended methods
  async createStaffExtended(staffExt: Omit<StaffExtended, "id" | "createdAt">): Promise<StaffExtended> {
    const id = randomUUID();
    const now = new Date();
    const newStaffExt: StaffExtended = { ...staffExt, id, createdAt: now };
    await db.insert(staffExtended).values(newStaffExt);
    return newStaffExt;
  }

  async getStaffExtended(staffId: string): Promise<StaffExtended | undefined> {
    const result = await db.select().from(staffExtended).where(eq(staffExtended.staffId, staffId));
    return result[0];
  }

  async getAllStaffExtended(): Promise<StaffExtended[]> {
    return await db.select().from(staffExtended);
  }

  async updateStaffExtended(staffId: string, updates: Partial<StaffExtended>): Promise<StaffExtended | undefined> {
    await db.update(staffExtended).set(updates).where(eq(staffExtended.staffId, staffId));
    const result = await db.select().from(staffExtended).where(eq(staffExtended.staffId, staffId));
    return result[0];
  }

  // FAQ methods
  async createFaq(faq: Omit<Faq, "id" | "createdAt" | "updatedAt">): Promise<Faq> {
    const id = randomUUID();
    const now = new Date();
    const newFaq: Faq = { ...faq, id, createdAt: now, updatedAt: now };
    await db.insert(faqs).values(newFaq);
    return newFaq;
  }

  async getFaq(id: string): Promise<Faq | undefined> {
    const result = await db.select().from(faqs).where(eq(faqs.id, id));
    return result[0];
  }

  async getAllFaqs(): Promise<Faq[]> {
    return await db.select().from(faqs);
  }

  async getFaqsByType(type: string): Promise<Faq[]> {
    return await db.select().from(faqs).where(eq(faqs.type, type));
  }

  async updateFaq(id: string, updates: Partial<Faq>): Promise<Faq | undefined> {
    const now = new Date();
    await db.update(faqs).set({ ...updates, updatedAt: now }).where(eq(faqs.id, id));
    const result = await db.select().from(faqs).where(eq(faqs.id, id));
    return result[0];
  }

  async deleteFaq(id: string): Promise<boolean> {
    const result = await db.delete(faqs).where(eq(faqs.id, id));
    return (result?.rowCount ?? result?.length ?? 1) > 0;
  }

  // Language methods
  async createLanguage(language: Omit<Language, "id">): Promise<Language> {
    const id = randomUUID();
    const newLanguage: Language = { ...language, id };
    await db.insert(languages).values(newLanguage);
    return newLanguage;
  }

  async getLanguage(id: string): Promise<Language | undefined> {
    const result = await db.select().from(languages).where(eq(languages.id, id));
    return result[0];
  }

  async getAllLanguages(): Promise<Language[]> {
    return await db.select().from(languages);
  }

  async updateLanguage(id: string, updates: Partial<Language>): Promise<Language | undefined> {
    await db.update(languages).set(updates).where(eq(languages.id, id));
    const result = await db.select().from(languages).where(eq(languages.id, id));
    return result[0];
  }

  async deleteLanguage(id: string): Promise<boolean> {
    const result = await db.delete(languages).where(eq(languages.id, id));
    return (result?.rowCount ?? result?.length ?? 1) > 0;
  }

  // Rate card methods
  async createRateCard(rateCard: Omit<RateCard, "id" | "uploadedAt">): Promise<RateCard> {
    const id = randomUUID();
    const now = new Date();
    const newRateCard: RateCard = { ...rateCard, id, uploadedAt: now };
    await db.insert(rateCards).values(newRateCard);
    return newRateCard;
  }

  async getRateCard(id: string): Promise<RateCard | undefined> {
    const result = await db.select().from(rateCards).where(eq(rateCards.id, id));
    return result[0];
  }

  async getRateCardsByNewspaper(newspaperId: string): Promise<RateCard[]> {
    return await db.select().from(rateCards).where(eq(rateCards.newspaperId, newspaperId));
  }

  async getAllRateCards(): Promise<RateCard[]> {
    return await db.select().from(rateCards);
  }

  async updateRateCard(id: string, updates: Partial<RateCard>): Promise<RateCard | undefined> {
    await db.update(rateCards).set(updates).where(eq(rateCards.id, id));
    const result = await db.select().from(rateCards).where(eq(rateCards.id, id));
    return result[0];
  }

  async deleteRateCard(id: string): Promise<boolean> {
    const result = await db.delete(rateCards).where(eq(rateCards.id, id));
    return (result?.rowCount ?? result?.length ?? 1) > 0;
  }

  // Staff login history methods
  async createStaffLogin(record: Omit<StaffLogin, "id" | "createdAt">): Promise<StaffLogin> {
    const id = randomUUID();
    const now = new Date();
    const item: StaffLogin = { id, ...record, createdAt: now } as unknown as StaffLogin;
    await db.insert(staffLogins).values(item as any);
    return item;
  }

  async getRecentStaffLogins(limit = 50): Promise<StaffLogin[]> {
    const rows = await db.select().from(staffLogins);
    rows.sort((a: any, b: any) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
    return rows.slice(0, limit) as StaffLogin[];
  }

  // Manual RO methods
  async createManualRO(record: InsertManualRO): Promise<ManualRO> {
    const id = randomUUID();
    const item: any = {
      id,
      ...record,
      // createdAt/updatedAt are handled by DB defaults
    };
    await db.insert(manualROs).values(item);

    // Return item with id, but createdAt/updatedAt are from DB defaults
    return item as ManualRO;
  }

  async getManualRO(id: string): Promise<ManualRO | undefined> {
    const result = await db.select().from(manualROs).where(eq(manualROs.id, id)).limit(1);
    return result[0];
  }

  async getManualROByNumber(roNumber: string): Promise<ManualRO | undefined> {
    const result = await db.select().from(manualROs).where(eq(manualROs.roNumber, roNumber)).limit(1);
    return result[0];
  }

  async getAllManualROs(): Promise<ManualRO[]> {
    const result = await db.select().from(manualROs);
    return result;
  }

  async getManualROsByNewspaper(newspaperId: string): Promise<ManualRO[]> {
    const result = await db.select().from(manualROs).where(eq(manualROs.newspaperId, newspaperId));
    return result;
  }

  async updateManualRO(id: string, updates: Partial<ManualRO>): Promise<ManualRO | undefined> {
    const now = new Date();
    await db.update(manualROs).set({ ...updates, updatedAt: now as any }).where(eq(manualROs.id, id));
    return this.getManualRO(id);
  }

  async deleteManualRO(id: string): Promise<boolean> {
    const result = await db.delete(manualROs).where(eq(manualROs.id, id));
    return !!result;
  }

  // Ad matter methods
  async createAdMatter(insertAdMatter: InsertAdMatter): Promise<AdMatter> {
    const id = randomUUID();
    const now = new Date();
    const adMatter: AdMatter = {
      id,
      userId: insertAdMatter.userId || null,
      name: insertAdMatter.name,
      description: insertAdMatter.description || null,
      content: insertAdMatter.content,
      newspaperId: insertAdMatter.newspaperId,
      adTypeId: insertAdMatter.adTypeId,
      categoryId: insertAdMatter.categoryId || null,
      subcategoryId: insertAdMatter.subcategoryId || null,
      preferredClassificationId: insertAdMatter.preferredClassificationId || null,
      subClassificationId: insertAdMatter.subClassificationId || null,
      enchantments: insertAdMatter.enchantments || null,
      rateId: insertAdMatter.rateId,
      size: insertAdMatter.size,
      language: insertAdMatter.language || "EN",
      tags: insertAdMatter.tags || null,
      active: insertAdMatter.active ?? true,
      createdAt: now,
      updatedAt: now,
    };
    await db.insert(adMatters).values(adMatter);
    return adMatter;
  }

  async getAdMatter(id: string): Promise<AdMatter | undefined> {
    const result = await db.select().from(adMatters).where(eq(adMatters.id, id)).limit(1);
    return result[0];
  }

  async getAdMattersByUser(userId: string): Promise<AdMatter[]> {
    return await db.select().from(adMatters).where(eq(adMatters.userId, userId));
  }

  async getAllAdMatters(): Promise<AdMatter[]> {
    return await db.select().from(adMatters);
  }

  async getAdMattersByNewspaper(newspaperId: string): Promise<AdMatter[]> {
    return await db.select().from(adMatters).where(eq(adMatters.newspaperId, newspaperId));
  }

  async getAdMattersByRate(rateId: string): Promise<AdMatter[]> {
    return await db.select().from(adMatters).where(eq(adMatters.rateId, rateId));
  }

  async updateAdMatter(id: string, updates: Partial<AdMatter>): Promise<AdMatter | undefined> {
    await db.update(adMatters).set(updates).where(eq(adMatters.id, id));
    const result = await db.select().from(adMatters).where(eq(adMatters.id, id));
    return result[0];
  }

  async deleteAdMatter(id: string): Promise<boolean> {
    const result = await db.delete(adMatters).where(eq(adMatters.id, id));
    return (result?.rowCount ?? result?.length ?? 1) > 0;
  }
}

export const storage = new DBStorage();

// Pre-warm the cache on server startup so the first user request is fast
export async function warmCache(): Promise<void> {
  try {
    console.log("[cache] Warming up cache...");
    const start = Date.now();
    const [nps] = await Promise.all([
      storage.getAllNewspapers(),
      storage.getAllCategories(),
    ]);
    await Promise.all([
      ...nps.map(np => storage.getEditionsByNewspaper(np.id)),
      ...nps.map(np => storage.getRatesByNewspaper(np.id)),
      ...nps.map(np => storage.getPackagesByNewspaper(np.id)),
    ]);
    console.log(`[cache] Warm-up complete in ${Date.now() - start}ms (${nps.length} newspapers)`);
  } catch (err) {
    console.warn("[cache] Warm-up failed (non-fatal):", (err as Error).message);
  }
}
