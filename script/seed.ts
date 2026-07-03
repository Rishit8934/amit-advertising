import { storage } from "../server/storage";
import { db } from "../server/db";
import { and, eq } from "drizzle-orm";
import { cities, subcategories, preferredClassifications, subClassifications, adMatters } from "../shared/schema";
import crypto from "crypto";

// Simple password hashing (in production use bcrypt)
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function seedDatabase() {
  console.log("Starting database seeding...");

  // Fast seed flag: either set FAST_SEED=1 in env or pass --fast as an argument
  const FAST_SEED = process.env.FAST_SEED === "1" || process.argv.includes("--fast");

  if (FAST_SEED) {
    console.log("FAST_SEED mode enabled: seeding minimal dataset for rapid iteration...");
    // Minimal sets for quick local development
    const citiesData = [
      { name: "TestCity1", state: "TestState" },
      { name: "TestCity2", state: "TestState" },
      { name: "TestCity3", state: "TestState" },
    ];

    const newspapersData = [
      { id: "paper-1", name: "Demo Times", language: "EN", type: "National", pricingUnit: "line", active: true },
      { id: "paper-2", name: "Local Herald", language: "EN", type: "City-based", pricingUnit: "line", active: true },
    ];

    const adTypesData = [
      { newspaperId: "paper-1", id: "adtype-1", name: "Classified", active: true },
      { newspaperId: "paper-1", id: "adtype-2", name: "Display", active: true },
    ];

    try {
      // Cities
      for (const c of citiesData) {
        try { await storage.createCity(c as any); } catch (e) { /* ignore duplicates */ }
      }

      // Newspapers
      for (const p of newspapersData) {
        try { await storage.createNewspaper({ name: p.name, language: p.language, type: p.type, pricingUnit: p.pricingUnit, active: true }); } catch (e) { /* ignore */ }
      }

      // Ad types (best-effort)
      for (const at of adTypesData) {
        try { await storage.createAdType({ newspaperId: at.newspaperId, name: at.name, active: true } as any); } catch (e) { }
      }

      // Small edition and package and rate
      try { await storage.createEdition({ newspaperId: newspapersData[0].id, editionName: "Main Edition", state: "TestState", active: true } as any); } catch (e) { }
      try { await storage.createPackage({ newspaperId: newspapersData[0].id, name: "Basic", description: "Quick package", price: 50000, pricingType: "per_line", discount: 0, active: true } as any); } catch (e) { }
      try { await storage.createRate({ newspaperId: newspapersData[0].id, adTypeId: adTypesData[0].id, language: "EN", sizeUnit: "per_line", baseRate: 15000, active: true } as any); } catch (e) { }

      console.log("FAST_SEED completed.");
    } catch (err) {
      console.error("FAST_SEED failed:", err);
    }

    return;
  }

  // Cities data
  const citiesData = [
    // Delhi NCR
    { name: "Delhi", state: "Delhi" },
    { name: "Noida", state: "Uttar Pradesh" },
    { name: "Gurugram", state: "Haryana" },
    { name: "Ghaziabad", state: "Uttar Pradesh" },
    { name: "Faridabad", state: "Haryana" },
    // Mumbai
    { name: "Mumbai", state: "Maharashtra" },
    { name: "Thane", state: "Maharashtra" },
    { name: "Navi Mumbai", state: "Maharashtra" },
    { name: "Pune", state: "Maharashtra" },
    // Kolkata
    { name: "Kolkata", state: "West Bengal" },
    { name: "Howrah", state: "West Bengal" },
    // Chennai
    { name: "Chennai", state: "Tamil Nadu" },
    { name: "Coimbatore", state: "Tamil Nadu" },
    // Bengaluru
    { name: "Bengaluru", state: "Karnataka" },
    { name: "Mysuru", state: "Karnataka" },
    // Hyderabad
    { name: "Hyderabad", state: "Telangana" },
    { name: "Secunderabad", state: "Telangana" },
    // Ahmedabad
    { name: "Ahmedabad", state: "Gujarat" },
    { name: "Surat", state: "Gujarat" },
    // Jaipur
    { name: "Jaipur", state: "Rajasthan" },
    { name: "Jodhpur", state: "Rajasthan" },
    // Chandigarh
    { name: "Chandigarh", state: "Chandigarh" },
    { name: "Mohali", state: "Punjab" },
    { name: "Panchkula", state: "Haryana" },
    // Kochi
    { name: "Kochi", state: "Kerala" },
    { name: "Aluva", state: "Kerala" },
    { name: "Thiruvananthapuram", state: "Kerala" },
    { name: "Kozhikode", state: "Kerala" },
    // Other major cities
    { name: "Lucknow", state: "Uttar Pradesh" },
    { name: "Kanpur", state: "Uttar Pradesh" },
    { name: "Nagpur", state: "Maharashtra" },
    { name: "Indore", state: "Madhya Pradesh" },
    { name: "Bhopal", state: "Madhya Pradesh" },
    { name: "Patna", state: "Bihar" },
    { name: "Ranchi", state: "Jharkhand" },
    { name: "Guwahati", state: "Assam" },
    { name: "Bhubaneswar", state: "Odisha" },
    { name: "Raipur", state: "Chhattisgarh" },
    { name: "Dehradun", state: "Uttarakhand" },
    { name: "Shimla", state: "Himachal Pradesh" },
    { name: "Srinagar", state: "Jammu and Kashmir" },
    { name: "Jammu", state: "Jammu and Kashmir" },
    { name: "Gangtok", state: "Sikkim" },
    { name: "Agartala", state: "Tripura" },
    { name: "Aizawl", state: "Mizoram" },
    { name: "Kohima", state: "Nagaland" },
    { name: "Imphal", state: "Manipur" },
    { name: "Itanagar", state: "Arunachal Pradesh" },
    { name: "Panaji", state: "Goa" },
    { name: "Port Blair", state: "Andaman and Nicobar Islands" },
    { name: "Puducherry", state: "Puducherry" },
    { name: "Chandigarh", state: "Chandigarh" }, // Already added
    { name: "Daman", state: "Dadra and Nagar Haveli and Daman and Diu" },
    { name: "Silvassa", state: "Dadra and Nagar Haveli and Daman and Diu" },
    { name: "Kavaratti", state: "Lakshadweep" },
    // Additional cities for broader state coverage
    { name: "Visakhapatnam", state: "Andhra Pradesh" },
    { name: "Vijayawada", state: "Andhra Pradesh" },
    { name: "Guntur", state: "Andhra Pradesh" },
    { name: "Nellore", state: "Andhra Pradesh" },
    { name: "Tirupati", state: "Andhra Pradesh" },
    { name: "Kakinada", state: "Andhra Pradesh" },
    { name: "Rajahmundry", state: "Andhra Pradesh" },
    { name: "Anantapur", state: "Andhra Pradesh" },
    { name: "Kadapa", state: "Andhra Pradesh" },
    { name: "Kurnool", state: "Andhra Pradesh" },
    { name: "Naharlagun", state: "Arunachal Pradesh" },
    { name: "Pasighat", state: "Arunachal Pradesh" },
    { name: "Tawang", state: "Arunachal Pradesh" },
    { name: "Ziro", state: "Arunachal Pradesh" },
    { name: "Dibrugarh", state: "Assam" },
    { name: "Jorhat", state: "Assam" },
    { name: "Silchar", state: "Assam" },
    { name: "Tezpur", state: "Assam" },
    { name: "Nagaon", state: "Assam" },
    { name: "Tinsukia", state: "Assam" },
    { name: "Gaya", state: "Bihar" },
    { name: "Muzaffarpur", state: "Bihar" },
    { name: "Bhagalpur", state: "Bihar" },
    { name: "Darbhanga", state: "Bihar" },
    { name: "Purnia", state: "Bihar" },
    { name: "Ara", state: "Bihar" },
    { name: "Begusarai", state: "Bihar" },
    { name: "Bilaspur", state: "Chhattisgarh" },
    { name: "Durg", state: "Chhattisgarh" },
    { name: "Bhilai", state: "Chhattisgarh" },
    { name: "Korba", state: "Chhattisgarh" },
    { name: "Raigarh", state: "Chhattisgarh" },
    { name: "Jagdalpur", state: "Chhattisgarh" },
    { name: "Margao", state: "Goa" },
    { name: "Vasco da Gama", state: "Goa" },
    { name: "Mapusa", state: "Goa" },
    { name: "Ponda", state: "Goa" },
    { name: "Vadodara", state: "Gujarat" },
    { name: "Rajkot", state: "Gujarat" },
    { name: "Bhavnagar", state: "Gujarat" },
    { name: "Jamnagar", state: "Gujarat" },
    { name: "Gandhinagar", state: "Gujarat" },
    { name: "Junagadh", state: "Gujarat" },
    { name: "Panipat", state: "Haryana" },
    { name: "Karnal", state: "Haryana" },
    { name: "Hisar", state: "Haryana" },
    { name: "Rohtak", state: "Haryana" },
    { name: "Sonipat", state: "Haryana" },
    { name: "Ambala", state: "Haryana" },
    { name: "Yamunanagar", state: "Haryana" },
    { name: "Dharamshala", state: "Himachal Pradesh" },
    { name: "Solan", state: "Himachal Pradesh" },
    { name: "Mandi", state: "Himachal Pradesh" },
    { name: "Hamirpur", state: "Himachal Pradesh" },
    { name: "Una", state: "Himachal Pradesh" },
    { name: "Jamshedpur", state: "Jharkhand" },
    { name: "Dhanbad", state: "Jharkhand" },
    { name: "Bokaro", state: "Jharkhand" },
    { name: "Hazaribagh", state: "Jharkhand" },
    { name: "Deoghar", state: "Jharkhand" },
    { name: "Mangaluru", state: "Karnataka" },
    { name: "Hubballi", state: "Karnataka" },
    { name: "Belagavi", state: "Karnataka" },
    { name: "Davanagere", state: "Karnataka" },
    { name: "Ballari", state: "Karnataka" },
    { name: "Shivamogga", state: "Karnataka" },
    { name: "Thrissur", state: "Kerala" },
    { name: "Kollam", state: "Kerala" },
    { name: "Kannur", state: "Kerala" },
    { name: "Alappuzha", state: "Kerala" },
    { name: "Kottayam", state: "Kerala" },
    { name: "Jabalpur", state: "Madhya Pradesh" },
    { name: "Gwalior", state: "Madhya Pradesh" },
    { name: "Ujjain", state: "Madhya Pradesh" },
    { name: "Sagar", state: "Madhya Pradesh" },
    { name: "Satna", state: "Madhya Pradesh" },
    { name: "Rewa", state: "Madhya Pradesh" },
    { name: "Nashik", state: "Maharashtra" },
    { name: "Aurangabad", state: "Maharashtra" },
    { name: "Kolhapur", state: "Maharashtra" },
    { name: "Solapur", state: "Maharashtra" },
    { name: "Amravati", state: "Maharashtra" },
    { name: "Akola", state: "Maharashtra" },
    { name: "Nanded", state: "Maharashtra" },
    { name: "Thoubal", state: "Manipur" },
    { name: "Bishnupur", state: "Manipur" },
    { name: "Churachandpur", state: "Manipur" },
    { name: "Shillong", state: "Meghalaya" },
    { name: "Tura", state: "Meghalaya" },
    { name: "Jowai", state: "Meghalaya" },
    { name: "Nongstoin", state: "Meghalaya" },
    { name: "Lunglei", state: "Mizoram" },
    { name: "Champhai", state: "Mizoram" },
    { name: "Kolasib", state: "Mizoram" },
    { name: "Dimapur", state: "Nagaland" },
    { name: "Mokokchung", state: "Nagaland" },
    { name: "Wokha", state: "Nagaland" },
    { name: "Cuttack", state: "Odisha" },
    { name: "Rourkela", state: "Odisha" },
    { name: "Sambalpur", state: "Odisha" },
    { name: "Balasore", state: "Odisha" },
    { name: "Berhampur", state: "Odisha" },
    { name: "Puri", state: "Odisha" },
    { name: "Ludhiana", state: "Punjab" },
    { name: "Amritsar", state: "Punjab" },
    { name: "Jalandhar", state: "Punjab" },
    { name: "Patiala", state: "Punjab" },
    { name: "Bathinda", state: "Punjab" },
    { name: "Hoshiarpur", state: "Punjab" },
    { name: "Pathankot", state: "Punjab" },
    { name: "Udaipur", state: "Rajasthan" },
    { name: "Kota", state: "Rajasthan" },
    { name: "Ajmer", state: "Rajasthan" },
    { name: "Bikaner", state: "Rajasthan" },
    { name: "Alwar", state: "Rajasthan" },
    { name: "Bharatpur", state: "Rajasthan" },
    { name: "Sikar", state: "Rajasthan" },
    { name: "Namchi", state: "Sikkim" },
    { name: "Gyalshing", state: "Sikkim" },
    { name: "Mangan", state: "Sikkim" },
    { name: "Madurai", state: "Tamil Nadu" },
    { name: "Salem", state: "Tamil Nadu" },
    { name: "Tiruchirappalli", state: "Tamil Nadu" },
    { name: "Vellore", state: "Tamil Nadu" },
    { name: "Tirunelveli", state: "Tamil Nadu" },
    { name: "Erode", state: "Tamil Nadu" },
    { name: "Thanjavur", state: "Tamil Nadu" },
    { name: "Warangal", state: "Telangana" },
    { name: "Karimnagar", state: "Telangana" },
    { name: "Nizamabad", state: "Telangana" },
    { name: "Khammam", state: "Telangana" },
    { name: "Ramagundam", state: "Telangana" },
    { name: "Udaipur", state: "Tripura" },
    { name: "Dharmanagar", state: "Tripura" },
    { name: "Kailasahar", state: "Tripura" },
    { name: "Agra", state: "Uttar Pradesh" },
    { name: "Varanasi", state: "Uttar Pradesh" },
    { name: "Prayagraj", state: "Uttar Pradesh" },
    { name: "Meerut", state: "Uttar Pradesh" },
    { name: "Gorakhpur", state: "Uttar Pradesh" },
    { name: "Bareilly", state: "Uttar Pradesh" },
    { name: "Aligarh", state: "Uttar Pradesh" },
    { name: "Moradabad", state: "Uttar Pradesh" },
    { name: "Mathura", state: "Uttar Pradesh" },
    { name: "Ayodhya", state: "Uttar Pradesh" },
    { name: "Jhansi", state: "Uttar Pradesh" },
    { name: "Haridwar", state: "Uttarakhand" },
    { name: "Roorkee", state: "Uttarakhand" },
    { name: "Haldwani", state: "Uttarakhand" },
    { name: "Rudrapur", state: "Uttarakhand" },
    { name: "Nainital", state: "Uttarakhand" },
    { name: "Durgapur", state: "West Bengal" },
    { name: "Asansol", state: "West Bengal" },
    { name: "Siliguri", state: "West Bengal" },
    { name: "Haldia", state: "West Bengal" },
    { name: "Kharagpur", state: "West Bengal" },
    { name: "Bardhaman", state: "West Bengal" },
    { name: "New Delhi", state: "Delhi" },
    { name: "Anantnag", state: "Jammu and Kashmir" },
    { name: "Baramulla", state: "Jammu and Kashmir" },
    { name: "Leh", state: "Ladakh" },
    { name: "Kargil", state: "Ladakh" },
    { name: "Karaikal", state: "Puducherry" },
    { name: "Mahe", state: "Puducherry" },
    { name: "Yanam", state: "Puducherry" },
    { name: "Diu", state: "Dadra and Nagar Haveli and Daman and Diu" },
  ];

  const cityMap = new Map<string, string>();

  for (const cityData of citiesData) {
    const existingCity = await db.select().from(cities).where(and(eq(cities.name, cityData.name), eq(cities.state, cityData.state)));
    if (existingCity.length > 0) {
      cityMap.set(`${cityData.name}-${cityData.state}`, existingCity[0].id);
      continue;
    }

    const city = await storage.createCity(cityData);
    cityMap.set(`${cityData.name}-${cityData.state}`, city.id);
  }

  console.log(`Seeded ${citiesData.length} cities`);

  // Newspapers data
  const newspapersData = [
    // National English
    { name: "The Times of India", language: "English", type: "National" },
    { name: "The Hindu", language: "English", type: "National" },
    { name: "Hindustan Times", language: "English", type: "National" },
    { name: "The Indian Express", language: "English", type: "National" },
    { name: "The Economic Times", language: "English", type: "National" },
    { name: "Business Standard", language: "English", type: "National" },
    { name: "Financial Express", language: "English", type: "National" },
    { name: "The Pioneer", language: "English", type: "National" },
    { name: "The Statesman", language: "English", type: "National" },
    // Hindi
    { name: "Dainik Jagran", language: "Hindi", type: "National" },
    { name: "Dainik Bhaskar", language: "Hindi", type: "National" },
    { name: "Amar Ujala", language: "Hindi", type: "National" },
    { name: "Navbharat Times", language: "Hindi", type: "National" },
    { name: "Rajasthan Patrika", language: "Hindi", type: "Regional" },
    { name: "Punjab Kesari", language: "Hindi", type: "Regional" },
    { name: "Hindustan", language: "Hindi", type: "National" },
    // Regional
    { name: "Malayala Manorama", language: "Malayalam", type: "Regional" },
    { name: "Mathrubhumi", language: "Malayalam", type: "Regional" },
    { name: "Eenadu", language: "Telugu", type: "Regional" },
    { name: "Sakshi", language: "Telugu", type: "Regional" },
    { name: "Anandabazar Patrika", language: "Bengali", type: "Regional" },
    { name: "Bartaman", language: "Bengali", type: "Regional" },
    { name: "Asomiya Pratidin", language: "Assamese", type: "Regional" },
    { name: "Gujarat Samachar", language: "Gujarati", type: "Regional" },
    { name: "Sandesh", language: "Gujarati", type: "Regional" },
    { name: "Lokmat", language: "Marathi", type: "Regional" },
    { name: "Loksatta", language: "Marathi", type: "Regional" },
    { name: "Vijayavani", language: "Kannada", type: "Regional" },
    { name: "Kannada Prabha", language: "Kannada", type: "Regional" },
    { name: "Daily Thanthi", language: "Tamil", type: "Regional" },
    { name: "Dinamalar", language: "Tamil", type: "Regional" },
  ];

  const newspaperMap = new Map<string, string>();

  for (const newspaperData of newspapersData) {
    try {
      const newspaper = await storage.createNewspaper(newspaperData);
      newspaperMap.set(newspaperData.name, newspaper.id);
    } catch (error) {
      // Newspaper already exists, get existing one
      const existing = await storage.getAllNewspapers();
      const existingNewspaper = existing.find(n => n.name === newspaperData.name);
      if (existingNewspaper) {
        newspaperMap.set(newspaperData.name, existingNewspaper.id);
      }
    }
  }

  console.log(`Seeded ${newspapersData.length} newspapers`);

  // Ad Types data
  const adTypesData = [
    { name: "Classified", newspaperName: "The Times of India" },
    { name: "Display", newspaperName: "The Times of India" },
    { name: "Classified", newspaperName: "The Hindu" },
    { name: "Display", newspaperName: "The Hindu" },
    { name: "Classified", newspaperName: "Hindustan Times" },
    { name: "Display", newspaperName: "Hindustan Times" },
    { name: "Classified", newspaperName: "The Indian Express" },
    { name: "Display", newspaperName: "The Indian Express" },
    { name: "Classified", newspaperName: "Dainik Jagran" },
    { name: "Display", newspaperName: "Dainik Jagran" },
    { name: "Classified", newspaperName: "Dainik Bhaskar" },
    { name: "Display", newspaperName: "Dainik Bhaskar" },
    { name: "Classified", newspaperName: "Malayala Manorama" },
    { name: "Display", newspaperName: "Malayala Manorama" },
    { name: "Classified", newspaperName: "Eenadu" },
    { name: "Display", newspaperName: "Eenadu" },
    { name: "Classified", newspaperName: "Anandabazar Patrika" },
    { name: "Display", newspaperName: "Anandabazar Patrika" },
    { name: "Classified", newspaperName: "Gujarat Samachar" },
    { name: "Display", newspaperName: "Gujarat Samachar" },
    { name: "Classified", newspaperName: "Lokmat" },
    { name: "Display", newspaperName: "Lokmat" },
    { name: "Classified", newspaperName: "Vijayavani" },
    { name: "Display", newspaperName: "Vijayavani" },
    { name: "Classified", newspaperName: "Daily Thanthi" },
    { name: "Display", newspaperName: "Daily Thanthi" },
  ];

  for (const adTypeData of adTypesData) {
    const newspaperId = newspaperMap.get(adTypeData.newspaperName);
    if (!newspaperId) continue;

    try {
      await storage.createAdType({
        newspaperId,
        name: adTypeData.name,
        active: true,
      });
    } catch (error) {
      // Ad type already exists
    }
  }

  console.log(`Seeded ${adTypesData.length} ad types`);

  // Editions data
  const editionsData = [
    // The Times of India
    { newspaperName: "The Times of India", editionName: "Delhi NCR", state: "Delhi", cities: ["Delhi-Delhi", "Noida-Uttar Pradesh", "Gurugram-Haryana", "Ghaziabad-Uttar Pradesh", "Faridabad-Haryana"] },
    { newspaperName: "The Times of India", editionName: "Mumbai", state: "Maharashtra", cities: ["Mumbai-Maharashtra", "Thane-Maharashtra", "Navi Mumbai-Maharashtra", "Pune-Maharashtra"] },
    { newspaperName: "The Times of India", editionName: "Kolkata", state: "West Bengal", cities: ["Kolkata-West Bengal", "Howrah-West Bengal"] },
    { newspaperName: "The Times of India", editionName: "Chennai", state: "Tamil Nadu", cities: ["Chennai-Tamil Nadu", "Coimbatore-Tamil Nadu"] },
    { newspaperName: "The Times of India", editionName: "Bengaluru", state: "Karnataka", cities: ["Bengaluru-Karnataka", "Mysuru-Karnataka"] },
    { newspaperName: "The Times of India", editionName: "Hyderabad", state: "Telangana", cities: ["Hyderabad-Telangana", "Secunderabad-Telangana"] },
    { newspaperName: "The Times of India", editionName: "Ahmedabad", state: "Gujarat", cities: ["Ahmedabad-Gujarat", "Surat-Gujarat"] },
    { newspaperName: "The Times of India", editionName: "Jaipur", state: "Rajasthan", cities: ["Jaipur-Rajasthan", "Jodhpur-Rajasthan"] },
    { newspaperName: "The Times of India", editionName: "Chandigarh", state: "Chandigarh", cities: ["Chandigarh-Chandigarh", "Mohali-Punjab", "Panchkula-Haryana"] },
    { newspaperName: "The Times of India", editionName: "Lucknow", state: "Uttar Pradesh", cities: ["Lucknow-Uttar Pradesh", "Kanpur-Uttar Pradesh"] },
    { newspaperName: "The Times of India", editionName: "Nagpur", state: "Maharashtra", cities: ["Nagpur-Maharashtra"] },
    { newspaperName: "The Times of India", editionName: "Indore", state: "Madhya Pradesh", cities: ["Indore-Madhya Pradesh", "Bhopal-Madhya Pradesh"] },
    { newspaperName: "The Times of India", editionName: "Patna", state: "Bihar", cities: ["Patna-Bihar", "Ranchi-Jharkhand"] },

    // Hindustan Times
    { newspaperName: "Hindustan Times", editionName: "Delhi NCR", state: "Delhi", cities: ["Delhi-Delhi", "Noida-Uttar Pradesh", "Gurugram-Haryana", "Ghaziabad-Uttar Pradesh", "Faridabad-Haryana"] },
    { newspaperName: "Hindustan Times", editionName: "Mumbai", state: "Maharashtra", cities: ["Mumbai-Maharashtra", "Thane-Maharashtra", "Navi Mumbai-Maharashtra"] },
    { newspaperName: "Hindustan Times", editionName: "Kolkata", state: "West Bengal", cities: ["Kolkata-West Bengal"] },
    { newspaperName: "Hindustan Times", editionName: "Chandigarh", state: "Chandigarh", cities: ["Chandigarh-Chandigarh", "Mohali-Punjab", "Panchkula-Haryana"] },
    { newspaperName: "Hindustan Times", editionName: "Lucknow", state: "Uttar Pradesh", cities: ["Lucknow-Uttar Pradesh"] },
    { newspaperName: "Hindustan Times", editionName: "Patna", state: "Bihar", cities: ["Patna-Bihar"] },
    { newspaperName: "Hindustan Times", editionName: "Ranchi", state: "Jharkhand", cities: ["Ranchi-Jharkhand"] },
    { newspaperName: "Hindustan Times", editionName: "Jaipur", state: "Rajasthan", cities: ["Jaipur-Rajasthan"] },
    { newspaperName: "Hindustan Times", editionName: "Dehradun", state: "Uttarakhand", cities: ["Dehradun-Uttarakhand"] },

    // Dainik Jagran
    { newspaperName: "Dainik Jagran", editionName: "Delhi NCR", state: "Delhi", cities: ["Delhi-Delhi", "Noida-Uttar Pradesh", "Gurugram-Haryana", "Ghaziabad-Uttar Pradesh"] },
    { newspaperName: "Dainik Jagran", editionName: "Mumbai", state: "Maharashtra", cities: ["Mumbai-Maharashtra", "Thane-Maharashtra", "Navi Mumbai-Maharashtra"] },
    { newspaperName: "Dainik Jagran", editionName: "Kolkata", state: "West Bengal", cities: ["Kolkata-West Bengal"] },
    { newspaperName: "Dainik Jagran", editionName: "Lucknow", state: "Uttar Pradesh", cities: ["Lucknow-Uttar Pradesh", "Kanpur-Uttar Pradesh"] },
    { newspaperName: "Dainik Jagran", editionName: "Kanpur", state: "Uttar Pradesh", cities: ["Kanpur-Uttar Pradesh"] },
    { newspaperName: "Dainik Jagran", editionName: "Patna", state: "Bihar", cities: ["Patna-Bihar"] },
    { newspaperName: "Dainik Jagran", editionName: "Ranchi", state: "Jharkhand", cities: ["Ranchi-Jharkhand"] },
    { newspaperName: "Dainik Jagran", editionName: "Jaipur", state: "Rajasthan", cities: ["Jaipur-Rajasthan", "Jodhpur-Rajasthan"] },
    { newspaperName: "Dainik Jagran", editionName: "Nagpur", state: "Maharashtra", cities: ["Nagpur-Maharashtra"] },
    { newspaperName: "Dainik Jagran", editionName: "Indore", state: "Madhya Pradesh", cities: ["Indore-Madhya Pradesh", "Bhopal-Madhya Pradesh"] },
    { newspaperName: "Dainik Jagran", editionName: "Chandigarh", state: "Chandigarh", cities: ["Chandigarh-Chandigarh", "Mohali-Punjab"] },

    // Malayala Manorama
    { newspaperName: "Malayala Manorama", editionName: "Kochi", state: "Kerala", cities: ["Kochi-Kerala", "Aluva-Kerala"] },
    { newspaperName: "Malayala Manorama", editionName: "Thiruvananthapuram", state: "Kerala", cities: ["Thiruvananthapuram-Kerala"] },
    { newspaperName: "Malayala Manorama", editionName: "Kozhikode", state: "Kerala", cities: ["Kozhikode-Kerala"] },
    { newspaperName: "Malayala Manorama", editionName: "Kottayam", state: "Kerala", cities: ["Kottayam-Kerala"] },
    { newspaperName: "Malayala Manorama", editionName: "Thrissur", state: "Kerala", cities: ["Thrissur-Kerala"] },

    // Anandabazar Patrika
    { newspaperName: "Anandabazar Patrika", editionName: "Kolkata", state: "West Bengal", cities: ["Kolkata-West Bengal", "Howrah-West Bengal"] },
    { newspaperName: "Anandabazar Patrika", editionName: "Siliguri", state: "West Bengal", cities: ["Siliguri-West Bengal"] },

    // Gujarat Samachar
    { newspaperName: "Gujarat Samachar", editionName: "Ahmedabad", state: "Gujarat", cities: ["Ahmedabad-Gujarat", "Surat-Gujarat"] },
    { newspaperName: "Gujarat Samachar", editionName: "Vadodara", state: "Gujarat", cities: ["Vadodara-Gujarat"] },
    { newspaperName: "Gujarat Samachar", editionName: "Rajkot", state: "Gujarat", cities: ["Rajkot-Gujarat"] },

    // Lokmat
    { newspaperName: "Lokmat", editionName: "Mumbai", state: "Maharashtra", cities: ["Mumbai-Maharashtra", "Thane-Maharashtra", "Navi Mumbai-Maharashtra"] },
    { newspaperName: "Lokmat", editionName: "Pune", state: "Maharashtra", cities: ["Pune-Maharashtra"] },
    { newspaperName: "Lokmat", editionName: "Nagpur", state: "Maharashtra", cities: ["Nagpur-Maharashtra"] },
    { newspaperName: "Lokmat", editionName: "Aurangabad", state: "Maharashtra", cities: ["Aurangabad-Maharashtra"] },

    // Vijayavani
    { newspaperName: "Vijayavani", editionName: "Bengaluru", state: "Karnataka", cities: ["Bengaluru-Karnataka", "Mysuru-Karnataka"] },
    { newspaperName: "Vijayavani", editionName: "Mysuru", state: "Karnataka", cities: ["Mysuru-Karnataka"] },
    { newspaperName: "Vijayavani", editionName: "Mangaluru", state: "Karnataka", cities: ["Mangaluru-Karnataka"] },

    // Daily Thanthi
    { newspaperName: "Daily Thanthi", editionName: "Chennai", state: "Tamil Nadu", cities: ["Chennai-Tamil Nadu", "Coimbatore-Tamil Nadu"] },
    { newspaperName: "Daily Thanthi", editionName: "Madurai", state: "Tamil Nadu", cities: ["Madurai-Tamil Nadu"] },
    { newspaperName: "Daily Thanthi", editionName: "Tiruchirappalli", state: "Tamil Nadu", cities: ["Tiruchirappalli-Tamil Nadu"] },
  ];

  for (const editionData of editionsData) {
    const newspaperId = newspaperMap.get(editionData.newspaperName);
    if (!newspaperId) continue;

    const edition = await storage.createEdition({
      newspaperId,
      editionName: editionData.editionName,
      state: editionData.state,
    });

    for (const cityKey of editionData.cities) {
      const cityId = cityMap.get(cityKey);
      if (cityId) {
        await storage.addCityToEdition(edition.id, cityId);
      }
    }
  }

  console.log(`Seeded ${editionsData.length} editions`);

  // Seed categories for ad types
  console.log("Seeding categories...");
  const categoryData = [
    // Classified categories
    { adTypeName: "Classified", newspaperName: "The Times of India", categories: ["Matrimonial", "Property", "Jobs", "Education", "Services", "Automobiles", "Electronics", "Furniture", "Pets", "Travel"] },
    { adTypeName: "Classified", newspaperName: "The Hindu", categories: ["Matrimonial", "Property", "Jobs", "Education", "Services", "Automobiles", "Electronics", "Furniture", "Pets", "Travel"] },
    { adTypeName: "Classified", newspaperName: "Hindustan Times", categories: ["Matrimonial", "Property", "Jobs", "Education", "Services", "Automobiles", "Electronics", "Furniture", "Pets", "Travel"] },
    { adTypeName: "Classified", newspaperName: "The Indian Express", categories: ["Matrimonial", "Property", "Jobs", "Education", "Services", "Automobiles", "Electronics", "Furniture", "Pets", "Travel"] },
    { adTypeName: "Classified", newspaperName: "Dainik Jagran", categories: ["Matrimonial", "Property", "Jobs", "Education", "Services", "Automobiles", "Electronics", "Furniture", "Pets", "Travel"] },
    { adTypeName: "Classified", newspaperName: "Dainik Bhaskar", categories: ["Matrimonial", "Property", "Jobs", "Education", "Services", "Automobiles", "Electronics", "Furniture", "Pets", "Travel"] },
    { adTypeName: "Classified", newspaperName: "Malayala Manorama", categories: ["Matrimonial", "Property", "Jobs", "Education", "Services", "Automobiles", "Electronics", "Furniture", "Pets", "Travel"] },
    { adTypeName: "Classified", newspaperName: "Eenadu", categories: ["Matrimonial", "Property", "Jobs", "Education", "Services", "Automobiles", "Electronics", "Furniture", "Pets", "Travel"] },
    { adTypeName: "Classified", newspaperName: "Anandabazar Patrika", categories: ["Matrimonial", "Property", "Jobs", "Education", "Services", "Automobiles", "Electronics", "Furniture", "Pets", "Travel"] },
    { adTypeName: "Classified", newspaperName: "Gujarat Samachar", categories: ["Matrimonial", "Property", "Jobs", "Education", "Services", "Automobiles", "Electronics", "Furniture", "Pets", "Travel"] },
    { adTypeName: "Classified", newspaperName: "Lokmat", categories: ["Matrimonial", "Property", "Jobs", "Education", "Services", "Automobiles", "Electronics", "Furniture", "Pets", "Travel"] },
    { adTypeName: "Classified", newspaperName: "Vijayavani", categories: ["Matrimonial", "Property", "Jobs", "Education", "Services", "Automobiles", "Electronics", "Furniture", "Pets", "Travel"] },
    { adTypeName: "Classified", newspaperName: "Daily Thanthi", categories: ["Matrimonial", "Property", "Jobs", "Education", "Services", "Automobiles", "Electronics", "Furniture", "Pets", "Travel"] },

    // Display categories
    { adTypeName: "Display", newspaperName: "The Times of India", categories: ["Corporate", "Retail", "Services", "Education", "Healthcare", "Real Estate", "Automotive", "Technology", "Entertainment", "Government"] },
    { adTypeName: "Display", newspaperName: "The Hindu", categories: ["Corporate", "Retail", "Services", "Education", "Healthcare", "Real Estate", "Automotive", "Technology", "Entertainment", "Government"] },
    { adTypeName: "Display", newspaperName: "Hindustan Times", categories: ["Corporate", "Retail", "Services", "Education", "Healthcare", "Real Estate", "Automotive", "Technology", "Entertainment", "Government"] },
    { adTypeName: "Display", newspaperName: "The Indian Express", categories: ["Corporate", "Retail", "Services", "Education", "Healthcare", "Real Estate", "Automotive", "Technology", "Entertainment", "Government"] },
    { adTypeName: "Display", newspaperName: "Dainik Jagran", categories: ["Corporate", "Retail", "Services", "Education", "Healthcare", "Real Estate", "Automotive", "Technology", "Entertainment", "Government"] },
    { adTypeName: "Display", newspaperName: "Dainik Bhaskar", categories: ["Corporate", "Retail", "Services", "Education", "Healthcare", "Real Estate", "Automotive", "Technology", "Entertainment", "Government"] },
    { adTypeName: "Display", newspaperName: "Malayala Manorama", categories: ["Corporate", "Retail", "Services", "Education", "Healthcare", "Real Estate", "Automotive", "Technology", "Entertainment", "Government"] },
    { adTypeName: "Display", newspaperName: "Eenadu", categories: ["Corporate", "Retail", "Services", "Education", "Healthcare", "Real Estate", "Automotive", "Technology", "Entertainment", "Government"] },
    { adTypeName: "Display", newspaperName: "Anandabazar Patrika", categories: ["Corporate", "Retail", "Services", "Education", "Healthcare", "Real Estate", "Automotive", "Technology", "Entertainment", "Government"] },
    { adTypeName: "Display", newspaperName: "Gujarat Samachar", categories: ["Corporate", "Retail", "Services", "Education", "Healthcare", "Real Estate", "Automotive", "Technology", "Entertainment", "Government"] },
    { adTypeName: "Display", newspaperName: "Lokmat", categories: ["Corporate", "Retail", "Services", "Education", "Healthcare", "Real Estate", "Automotive", "Technology", "Entertainment", "Government"] },
    { adTypeName: "Display", newspaperName: "Vijayavani", categories: ["Corporate", "Retail", "Services", "Education", "Healthcare", "Real Estate", "Automotive", "Technology", "Entertainment", "Government"] },
    { adTypeName: "Display", newspaperName: "Daily Thanthi", categories: ["Corporate", "Retail", "Services", "Education", "Healthcare", "Real Estate", "Automotive", "Technology", "Entertainment", "Government"] },
  ];

  for (const categoryGroup of categoryData) {
    const newspaper = await storage.getAllNewspapers().then(newspapers => 
      newspapers.find(n => n.name === categoryGroup.newspaperName)
    );
    if (!newspaper) continue;

    const adType = await storage.getAdTypesByNewspaper(newspaper.id).then(adTypes =>
      adTypes.find(at => at.name === categoryGroup.adTypeName)
    );
    if (!adType) continue;

    for (const categoryName of categoryGroup.categories) {
      try {
        await storage.createCategory({
          adTypeId: adType.id,
          name: categoryName,
          active: true,
        });
      } catch (error) {
        // Category already exists
      }
    }
  }

  console.log("Categories seeded successfully");

  // Seed hierarchical data for categories
  console.log("Seeding hierarchical category data...");

  // Get all categories and deduplicate by name to create hierarchical relationships
  const allCategories = await storage.getAllCategories();
  const uniqueCategories = Array.from(
    new Map(allCategories.map(cat => [cat.name, cat])).values()
  );

  // Create subcategories (ad headings) for each category
  const hierarchicalData = {
    "Matrimonial": {
      subcategories: ["Wanted Bride", "Wanted Groom", "Bride Wanted", "Groom Wanted", "Alliance", "Matchmaking"],
      preferredClassifications: {
        "Wanted Bride": ["Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist"],
        "Wanted Groom": ["Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist"],
        "Bride Wanted": ["Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist"],
        "Groom Wanted": ["Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist"],
        "Alliance": ["Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist"],
        "Matchmaking": ["Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist"]
      },
      subClassifications: {
        "Hindu": ["Brahmin", "Kshatriya", "Vaishya", "Shudra", "General"],
        "Muslim": ["Sunni", "Shia", "General"],
        "Christian": ["Catholic", "Protestant", "General"],
        "Sikh": ["Jat", "Ramgarhia", "General"],
        "Jain": ["Digambar", "Shwetambar", "General"],
        "Buddhist": ["Theravada", "Mahayana", "General"]
      }
    },
    "Property": {
      subcategories: ["For Sale", "For Rent", "Wanted", "Commercial", "Residential", "Land"],
      preferredClassifications: {
        "For Sale": ["Apartment", "House", "Villa", "Plot", "Commercial Space"],
        "For Rent": ["Apartment", "House", "Villa", "Office Space", "Shop"],
        "Wanted": ["Apartment", "House", "Villa", "Plot", "Commercial Space"],
        "Commercial": ["Office Space", "Shop", "Warehouse", "Showroom"],
        "Residential": ["Apartment", "House", "Villa", "Plot"],
        "Land": ["Agricultural", "Residential", "Commercial", "Industrial"]
      },
      subClassifications: {
        "Apartment": ["1BHK", "2BHK", "3BHK", "4BHK+", "Studio"],
        "House": ["Independent", "Row House", "Duplex", "Bungalow"],
        "Villa": ["Luxury", "Premium", "Standard"],
        "Plot": ["Corner", "Park Facing", "Main Road", "Interior"],
        "Commercial Space": ["Office", "Retail", "Warehouse", "Industrial"],
        "Office Space": ["Furnished", "Semi-furnished", "Bare"],
        "Shop": ["Street", "Mall", "Standalone"],
        "Warehouse": ["Cold Storage", "General", "Industrial"],
        "Showroom": ["Car", "Retail", "Commercial"],
        "Agricultural": ["Irrigated", "Non-irrigated", "Barren"],
        "Residential": ["Approved", "Non-approved", "Agricultural"],
        "Commercial": ["DTCP", "CMDA", "Local Body"],
        "Industrial": ["SEZ", "Non-SEZ", "General"]
      }
    },
    "Jobs": {
      subcategories: ["Wanted", "Available", "Vacancy", "Opening", "Requirement"],
      preferredClassifications: {
        "Wanted": ["IT", "Engineering", "Medical", "Teaching", "Management"],
        "Available": ["IT", "Engineering", "Medical", "Teaching", "Management"],
        "Vacancy": ["IT", "Engineering", "Medical", "Teaching", "Management"],
        "Opening": ["IT", "Engineering", "Medical", "Teaching", "Management"],
        "Requirement": ["IT", "Engineering", "Medical", "Teaching", "Management"]
      },
      subClassifications: {
        "IT": ["Software Engineer", "Web Developer", "Data Analyst", "System Admin"],
        "Engineering": ["Civil", "Mechanical", "Electrical", "Chemical"],
        "Medical": ["Doctor", "Nurse", "Pharmacist", "Lab Technician"],
        "Teaching": ["Professor", "Lecturer", "Teacher", "Tutor"],
        "Management": ["HR", "Finance", "Marketing", "Operations"]
      }
    },
    "Automobiles": {
      subcategories: ["For Sale", "Wanted", "Services", "Parts", "Rental"],
      preferredClassifications: {
        "For Sale": ["Car", "Bike", "Scooter", "Commercial Vehicle"],
        "Wanted": ["Car", "Bike", "Scooter", "Commercial Vehicle"],
        "Services": ["Repair", "Maintenance", "Insurance", "Finance"],
        "Parts": ["Engine", "Body", "Electrical", "Accessories"],
        "Rental": ["Car", "Bike", "Commercial Vehicle"]
      },
      subClassifications: {
        "Car": ["Sedan", "SUV", "Hatchback", "Luxury", "Electric"],
        "Bike": ["Sports", "Cruiser", "Standard", "Electric"],
        "Scooter": ["Gearless", "Geared", "Electric"],
        "Commercial Vehicle": ["Truck", "Bus", "Taxi", "Delivery Van"],
        "Repair": ["Engine", "Body Work", "Electrical", "AC"],
        "Maintenance": ["Periodic", "Breakdown", "Insurance Claim"],
        "Insurance": ["Third Party", "Comprehensive", "Zero Depreciation"],
        "Finance": ["Loan", "Lease", "Hire Purchase"],
        "Engine": ["Piston", "Valve", "Timing Belt", "Oil Filter"],
        "Body": ["Door", "Fender", "Bumper", "Windshield"],
        "Electrical": ["Battery", "Alternator", "Starter", "Lights"],
        "Accessories": ["Audio", "Security", "Comfort", "Performance"]
      }
    },
    "Services": {
      subcategories: ["Professional", "Home", "Business", "Educational", "Medical"],
      preferredClassifications: {
        "Professional": ["Legal", "Financial", "Consulting", "IT"],
        "Home": ["Cleaning", "Repair", "Maintenance", "Security"],
        "Business": ["Marketing", "Accounting", "Legal", "IT"],
        "Educational": ["Tuition", "Coaching", "Training", "Certification"],
        "Medical": ["Consultation", "Treatment", "Surgery", "Therapy"]
      },
      subClassifications: {
        "Legal": ["Advocate", "Notary", "Mediator", "Arbitrator"],
        "Financial": ["CA", "Tax Consultant", "Auditor", "Financial Planner"],
        "Consulting": ["Management", "Technical", "HR", "Strategy"],
        "IT": ["Development", "Support", "Security", "Training"],
        "Cleaning": ["House", "Office", "Carpet", "Pest Control"],
        "Repair": ["Electrical", "Plumbing", "Carpentry", "Painting"],
        "Maintenance": ["AMC", "Warranty", "Breakdown", "Preventive"],
        "Security": ["Guard", "CCTV", "Alarm", "Access Control"],
        "Marketing": ["Digital", "Print", "Event", "PR"],
        "Accounting": ["Bookkeeping", "Tax", "Audit", "Financial Reporting"],
        "Tuition": ["Math", "Science", "English", "Languages"],
        "Coaching": ["IIT-JEE", "NEET", "UPSC", "Banking"],
        "Training": ["Soft Skills", "Technical", "Management", "Certification"],
        "Certification": ["ISO", "Quality", "Safety", "Environmental"],
        "Consultation": ["General", "Specialist", "Telemedicine", "Home Visit"],
        "Treatment": ["Medical", "Surgical", "Dental", "Ayurvedic"],
        "Surgery": ["General", "Orthopedic", "Cardiac", "Neurosurgery"],
        "Therapy": ["Physiotherapy", "Psychotherapy", "Occupational", "Speech"]
      }
    }
  };

  // Process each category name that has hierarchical data
  console.log("Deleting existing subcategories, preferred classifications, and sub-classifications...");
  
  // Temporarily disable FK enforcement for cleanup, then re-enable it.
  try {
    await db.run("PRAGMA foreign_keys = OFF");
    await db.delete(adMatters);
    await db.delete(subClassifications);
    await db.delete(preferredClassifications);
    await db.delete(subcategories);
  } catch (error) {
    console.warn("Could not delete hierarchical category data due to foreign key constraints. Skipping cleanup and continuing seed.", error);
  } finally {
    await db.run("PRAGMA foreign_keys = ON");
  }

  // Get all categories grouped by name
  const categoriesByName = new Map<string, any[]>();
  for (const category of allCategories) {
    if (!categoriesByName.has(category.name)) {
      categoriesByName.set(category.name, []);
    }
    categoriesByName.get(category.name)!.push(category);
  }

  for (const [categoryName, categories] of categoriesByName) {
    const hierarchyData = hierarchicalData[categoryName as keyof typeof hierarchicalData];

    if (hierarchyData) {
      console.log(`Creating hierarchy for category: ${categoryName} (${categories.length} instances)`);

      // Create subcategories for ALL categories with this name
      for (const category of categories) {
        for (const subcategoryName of hierarchyData.subcategories) {
          const subcategory = await storage.createSubcategory({
            categoryId: category.id,
            name: subcategoryName,
            active: true
          });

          const prefClassifications = hierarchyData.preferredClassifications[subcategoryName as keyof typeof hierarchyData.preferredClassifications];

          if (prefClassifications) {
            // Create preferred classifications for this subcategory
            for (const prefClassName of prefClassifications) {
              const prefClassification = await storage.createPreferredClassification({
                subcategoryId: subcategory.id,
                name: prefClassName,
                active: true
              });

              const subClasses = hierarchyData.subClassifications[prefClassName as keyof typeof hierarchyData.subClassifications];

              if (subClasses) {
                // Create sub classifications for this preferred classification
                for (const subClassName of subClasses) {
                  await storage.createSubClassification({
                    preferredClassificationId: prefClassification.id,
                    name: subClassName,
                    active: true
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  console.log("Hierarchical data seeding completed!");

  // Seed staff users
  console.log("Seeding staff users...");
  const staffData = [
    { username: "admin", password: hashPassword("admin123"), role: "admin" },
    { username: "editor", password: hashPassword("editor123"), role: "editor" },
  ];

  for (const staff of staffData) {
    try {
      await storage.createStaff(staff);
      console.log(`Created staff user: ${staff.username}`);
    } catch (error) {
      console.log(`Staff user ${staff.username} already exists`);
    }
  }

  // Seed ad enchantments
  console.log("Seeding ad enchantments...");
  
  // First, delete all existing enchantments to ensure clean seeding
  try {
    const existingEnchantments = await storage.getAllAdEnchantments();
    for (const enchantment of existingEnchantments) {
      await storage.deleteAdEnchantment(enchantment.id);
    }
    console.log("Deleted existing enchantments");
  } catch (error) {
    console.log("No existing enchantments to delete");
  }
  
  const enchantmentsData = [
    { name: "Bold Text", description: "Make your ad text bold", price: 5000, previewHtml: "<strong>{text}</strong>", active: true }, // ₹50
    { name: "Color Background", description: "Add colored background to your ad", price: 10000, previewHtml: "<div style='background-color: #fef3c7; padding: 4px;'>{text}</div>", active: true }, // ₹100
    { name: "Border Frame", description: "Add a decorative border around your ad", price: 7500, previewHtml: "<div style='border: 2px solid #9ca3af; padding: 8px;'>{text}</div>", active: true }, // ₹75
  ];

  for (const enchantment of enchantmentsData) {
    try {
      await storage.createAdEnchantment(enchantment);
      console.log(`Created enchantment: ${enchantment.name}`);
    } catch (error) {
      console.log(`Failed to create enchantment ${enchantment.name}:`, error);
    }
  }

  // Seed packages for each newspaper
  console.log("Seeding packages...");
  for (const newspaper of newspapersData) {
    const newspaperId = newspaperMap.get(newspaper.name);
    if (!newspaperId) {
      console.log(`Skipping packages for unknown newspaper: ${newspaper.name}`);
      continue;
    }

    try {
      // Create a few basic packages for each newspaper
      const packagesData = [
        {
          newspaperId,
          name: "Basic Ad",
          description: "Standard classified advertisement",
          price: 50000, // ₹500
          pricingType: "per_line",
          discount: 0,
          minSize: 1,
          maxSize: 5,
          active: true
        },
        {
          newspaperId,
          name: "Premium Ad",
          description: "Enhanced advertisement with better placement",
          price: 100000, // ₹1000
          pricingType: "per_line",
          discount: 10,
          minSize: 5,
          maxSize: 10,
          active: true
        }
      ];

      for (const pkg of packagesData) {
        await storage.createPackage(pkg);
      }
      console.log(`Created packages for ${newspaper.name}`);
    } catch (error) {
      console.log(`Failed to create packages for ${newspaper.name}:`, error);
    }
  }

  // Seed rates for each newspaper and ad type combination
  console.log("Seeding rates...");
  for (const newspaper of newspapersData) {
    const newspaperId = newspaperMap.get(newspaper.name);
    if (!newspaperId) {
      console.log(`Skipping rates for unknown newspaper: ${newspaper.name}`);
      continue;
    }

    const newspaperAdTypes = await storage.getAdTypesByNewspaper(newspaperId);
    
    for (const adType of newspaperAdTypes) {
      try {
        // Create basic rates for each ad type
        const rateData = {
          newspaperId,
          adTypeId: adType.id,
          language: "EN",
          sizeUnit: newspaper.pricingUnit === "word" ? "per_word" : "per_line",
          baseRate: newspaper.pricingUnit === "word" ? 2000 : 15000, // ₹20 per word or ₹150 per line
          active: true
        };

        await storage.createRate(rateData);
        console.log(`Created rate for ${newspaper.name} - ${adType.name}`);
      } catch (error) {
        console.log(`Failed to create rate for ${newspaper.name} - ${adType.name}:`, error);
      }
    }
  }

  console.log("Database seeding completed!");
}

seedDatabase().catch(console.error);