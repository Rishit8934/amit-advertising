import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { db } from './db.js';
import {
  newspapers, adTypes, categories, subcategories, preferredClassifications, editions, rates, adEnchantments, packages, adMatters, editionCombos, editionComboEditions,
} from '../shared/schema.js';
import { nanoid } from 'nanoid';
import { eq, inArray, isNotNull, and } from 'drizzle-orm';

const uid = () => nanoid(12);

// ── Enchantments ──────────────────────────────────────────────────────────────

const ENCHANTMENTS = [
  { name: 'Bold Text', description: 'Make your ad text bold for better visibility', icon: 'B', price: 15 },
  { name: 'Colour Background', description: 'Add a colour background to your ad', icon: '🎨', price: 25 },
  { name: 'Border / Frame', description: 'Add a decorative border around your ad', icon: '□', price: 10 },
  { name: 'Tick Mark', description: 'Add a tick mark symbol beside your ad', icon: '✓', price: 5 },
];

// ── Categories (master list, created under TOI's "Classified Text Ad") ────────

const CATEGORIES_LIST = [
  'Matrimonial',
  'Property',
  'Recruitment & Jobs',
  'Business Opportunities',
  'Personal Messages',
  'Vehicles',
  'Public Announcements',
  'Astrology & Horoscope',
  'Change of Name',
  'Education & Admissions',
  'Loss of Documents',
  'Lost & Found',
  'Obituary & Memorial',
  'Legal Notices',
  'Court Notices',
  'Tender Notices',
  'Auction Notices',
  'Board Meeting Notices',
  'Travel & Tourism',
  'Services Offered',
  'Retail & Shopping',
  'Computers & Technology',
  'Situation Wanted',
  'To Let / Rent',
  'Wedding Services',
  'Health & Wellness',
  'Financial Services',
  'Entertainment & Events',
];

// ── Newspaper data ─────────────────────────────────────────────────────────────

type EditionData = { city: string; state: string };
type NewspaperData = {
  name: string;
  language: string;
  type: string;
  pricingUnit: string;
  classifiedRate: number;
  displayRate: number;
  premiumRate: number;
  editions: EditionData[];
};

const NEWSPAPERS_DATA: NewspaperData[] = [
  // ── English nationals ──────────────────────────────────────────────────────
  {
    name: 'Times of India',
    language: 'English',
    type: 'National',
    pricingUnit: 'line',
    classifiedRate: 1200,
    displayRate: 2400,
    premiumRate: 5000,
    editions: [
      { city: 'Delhi', state: 'Delhi' },
      { city: 'Mumbai', state: 'Maharashtra' },
      { city: 'Kolkata', state: 'West Bengal' },
      { city: 'Chennai', state: 'Tamil Nadu' },
      { city: 'Bangalore', state: 'Karnataka' },
      { city: 'Hyderabad', state: 'Telangana' },
      { city: 'Ahmedabad', state: 'Gujarat' },
      { city: 'Pune', state: 'Maharashtra' },
      { city: 'Jaipur', state: 'Rajasthan' },
      { city: 'Lucknow', state: 'Uttar Pradesh' },
      { city: 'Chandigarh', state: 'Punjab' },
      { city: 'Bhopal', state: 'Madhya Pradesh' },
      { city: 'Indore', state: 'Madhya Pradesh' },
      { city: 'Nagpur', state: 'Maharashtra' },
      { city: 'Kochi', state: 'Kerala' },
      { city: 'Patna', state: 'Bihar' },
      { city: 'Ranchi', state: 'Jharkhand' },
      { city: 'Surat', state: 'Gujarat' },
      { city: 'Coimbatore', state: 'Tamil Nadu' },
      { city: 'Mysore', state: 'Karnataka' },
      { city: 'Nashik', state: 'Maharashtra' },
      { city: 'Aurangabad', state: 'Maharashtra' },
      { city: 'Goa', state: 'Goa' },
      { city: 'Mangalore', state: 'Karnataka' },
      { city: 'Kanpur', state: 'Uttar Pradesh' },
      { city: 'Dehradun', state: 'Uttarakhand' },
      { city: 'Varanasi', state: 'Uttar Pradesh' },
    ],
  },
  {
    name: 'Hindustan Times',
    language: 'English',
    type: 'National',
    pricingUnit: 'line',
    classifiedRate: 900,
    displayRate: 1800,
    premiumRate: 4000,
    editions: [
      { city: 'Delhi', state: 'Delhi' },
      { city: 'Mumbai', state: 'Maharashtra' },
      { city: 'Lucknow', state: 'Uttar Pradesh' },
      { city: 'Chandigarh', state: 'Punjab' },
      { city: 'Kolkata', state: 'West Bengal' },
      { city: 'Patna', state: 'Bihar' },
      { city: 'Ranchi', state: 'Jharkhand' },
      { city: 'Bhopal', state: 'Madhya Pradesh' },
    ],
  },
  {
    name: 'The Hindu',
    language: 'English',
    type: 'National',
    pricingUnit: 'line',
    classifiedRate: 700,
    displayRate: 1400,
    premiumRate: 3500,
    editions: [
      { city: 'Chennai', state: 'Tamil Nadu' },
      { city: 'Bangalore', state: 'Karnataka' },
      { city: 'Hyderabad', state: 'Telangana' },
      { city: 'Delhi', state: 'Delhi' },
      { city: 'Mumbai', state: 'Maharashtra' },
      { city: 'Kochi', state: 'Kerala' },
      { city: 'Coimbatore', state: 'Tamil Nadu' },
      { city: 'Madurai', state: 'Tamil Nadu' },
      { city: 'Thiruvananthapuram', state: 'Kerala' },
    ],
  },
  {
    name: 'The Indian Express',
    language: 'English',
    type: 'National',
    pricingUnit: 'line',
    classifiedRate: 750,
    displayRate: 1500,
    premiumRate: 3500,
    editions: [
      { city: 'Delhi', state: 'Delhi' },
      { city: 'Mumbai', state: 'Maharashtra' },
      { city: 'Pune', state: 'Maharashtra' },
      { city: 'Ahmedabad', state: 'Gujarat' },
      { city: 'Lucknow', state: 'Uttar Pradesh' },
      { city: 'Chandigarh', state: 'Punjab' },
      { city: 'Kolkata', state: 'West Bengal' },
    ],
  },
  {
    name: 'Economic Times',
    language: 'English',
    type: 'National',
    pricingUnit: 'line',
    classifiedRate: 850,
    displayRate: 1700,
    premiumRate: 4000,
    editions: [
      { city: 'Delhi', state: 'Delhi' },
      { city: 'Mumbai', state: 'Maharashtra' },
      { city: 'Kolkata', state: 'West Bengal' },
      { city: 'Chennai', state: 'Tamil Nadu' },
      { city: 'Bangalore', state: 'Karnataka' },
      { city: 'Ahmedabad', state: 'Gujarat' },
    ],
  },
  {
    name: 'Business Standard',
    language: 'English',
    type: 'National',
    pricingUnit: 'line',
    classifiedRate: 800,
    displayRate: 1600,
    premiumRate: 3800,
    editions: [
      { city: 'Delhi', state: 'Delhi' },
      { city: 'Mumbai', state: 'Maharashtra' },
      { city: 'Kolkata', state: 'West Bengal' },
      { city: 'Chennai', state: 'Tamil Nadu' },
      { city: 'Bangalore', state: 'Karnataka' },
    ],
  },
  {
    name: 'Financial Express',
    language: 'English',
    type: 'National',
    pricingUnit: 'line',
    classifiedRate: 750,
    displayRate: 1500,
    premiumRate: 3500,
    editions: [
      { city: 'Delhi', state: 'Delhi' },
      { city: 'Mumbai', state: 'Maharashtra' },
      { city: 'Kolkata', state: 'West Bengal' },
      { city: 'Bangalore', state: 'Karnataka' },
    ],
  },
  {
    name: 'The Business Line',
    language: 'English',
    type: 'National',
    pricingUnit: 'line',
    classifiedRate: 700,
    displayRate: 1400,
    premiumRate: 3200,
    editions: [
      { city: 'Chennai', state: 'Tamil Nadu' },
      { city: 'Delhi', state: 'Delhi' },
      { city: 'Mumbai', state: 'Maharashtra' },
      { city: 'Bangalore', state: 'Karnataka' },
      { city: 'Hyderabad', state: 'Telangana' },
    ],
  },
  {
    name: 'Mint',
    language: 'English',
    type: 'National',
    pricingUnit: 'line',
    classifiedRate: 800,
    displayRate: 1600,
    premiumRate: 3800,
    editions: [
      { city: 'Delhi', state: 'Delhi' },
      { city: 'Mumbai', state: 'Maharashtra' },
      { city: 'Bangalore', state: 'Karnataka' },
      { city: 'Chennai', state: 'Tamil Nadu' },
      { city: 'Kolkata', state: 'West Bengal' },
    ],
  },
  {
    name: 'Deccan Herald',
    language: 'English',
    type: 'Regional',
    pricingUnit: 'line',
    classifiedRate: 500,
    displayRate: 1000,
    premiumRate: 2500,
    editions: [
      { city: 'Bangalore', state: 'Karnataka' },
      { city: 'Mysore', state: 'Karnataka' },
      { city: 'Mangalore', state: 'Karnataka' },
      { city: 'Hubli', state: 'Karnataka' },
    ],
  },
  {
    name: 'Deccan Chronicle',
    language: 'English',
    type: 'Regional',
    pricingUnit: 'line',
    classifiedRate: 450,
    displayRate: 900,
    premiumRate: 2200,
    editions: [
      { city: 'Hyderabad', state: 'Telangana' },
      { city: 'Bangalore', state: 'Karnataka' },
      { city: 'Chennai', state: 'Tamil Nadu' },
    ],
  },
  {
    name: 'New Indian Express',
    language: 'English',
    type: 'Regional',
    pricingUnit: 'line',
    classifiedRate: 450,
    displayRate: 900,
    premiumRate: 2000,
    editions: [
      { city: 'Chennai', state: 'Tamil Nadu' },
      { city: 'Bangalore', state: 'Karnataka' },
      { city: 'Hyderabad', state: 'Telangana' },
      { city: 'Kochi', state: 'Kerala' },
      { city: 'Thiruvananthapuram', state: 'Kerala' },
    ],
  },
  {
    name: 'The Pioneer',
    language: 'English',
    type: 'National',
    pricingUnit: 'line',
    classifiedRate: 400,
    displayRate: 800,
    premiumRate: 2000,
    editions: [
      { city: 'Delhi', state: 'Delhi' },
      { city: 'Lucknow', state: 'Uttar Pradesh' },
      { city: 'Chandigarh', state: 'Punjab' },
      { city: 'Bhopal', state: 'Madhya Pradesh' },
    ],
  },
  {
    name: 'The Statesman',
    language: 'English',
    type: 'Regional',
    pricingUnit: 'line',
    classifiedRate: 350,
    displayRate: 700,
    premiumRate: 1800,
    editions: [
      { city: 'Kolkata', state: 'West Bengal' },
      { city: 'Delhi', state: 'Delhi' },
    ],
  },
  {
    name: 'The Telegraph',
    language: 'English',
    type: 'Regional',
    pricingUnit: 'line',
    classifiedRate: 450,
    displayRate: 900,
    premiumRate: 2200,
    editions: [
      { city: 'Kolkata', state: 'West Bengal' },
      { city: 'Siliguri', state: 'West Bengal' },
    ],
  },
  {
    name: 'Mid-Day',
    language: 'English',
    type: 'Regional',
    pricingUnit: 'line',
    classifiedRate: 600,
    displayRate: 1200,
    premiumRate: 2800,
    editions: [
      { city: 'Mumbai', state: 'Maharashtra' },
    ],
  },
  {
    name: 'Mumbai Mirror',
    language: 'English',
    type: 'Regional',
    pricingUnit: 'line',
    classifiedRate: 550,
    displayRate: 1100,
    premiumRate: 2500,
    editions: [
      { city: 'Mumbai', state: 'Maharashtra' },
    ],
  },
  {
    name: 'The Tribune',
    language: 'English',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 48,
    displayRate: 96,
    premiumRate: 480,
    editions: [
      { city: 'Chandigarh', state: 'Punjab' },
      { city: 'Delhi', state: 'Delhi' },
      { city: 'Jalandhar', state: 'Punjab' },
      { city: 'Ludhiana', state: 'Punjab' },
      { city: 'Amritsar', state: 'Punjab' },
      { city: 'Bathinda', state: 'Punjab' },
      { city: 'Ambala', state: 'Haryana' },
      { city: 'Shimla', state: 'Himachal Pradesh' },
      { city: 'Jammu', state: 'Jammu and Kashmir' },
    ],
  },
  {
    name: 'Dainik Tribune',
    language: 'Hindi',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 60,
    displayRate: 120,
    premiumRate: 600,
    editions: [
      { city: 'Chandigarh', state: 'Punjab' },
      { city: 'Delhi', state: 'Delhi' },
      { city: 'Jalandhar', state: 'Punjab' },
      { city: 'Ludhiana', state: 'Punjab' },
      { city: 'Ambala', state: 'Haryana' },
      { city: 'Dehradun', state: 'Uttarakhand' },
    ],
  },

  // ── Hindi nationals/regionals ──────────────────────────────────────────────
  {
    name: 'Dainik Jagran',
    language: 'Hindi',
    type: 'National',
    pricingUnit: 'word',
    classifiedRate: 100,
    displayRate: 200,
    premiumRate: 1000,
    editions: [
      { city: 'Delhi', state: 'Delhi' },
      { city: 'Lucknow', state: 'Uttar Pradesh' },
      { city: 'Varanasi', state: 'Uttar Pradesh' },
      { city: 'Agra', state: 'Uttar Pradesh' },
      { city: 'Meerut', state: 'Uttar Pradesh' },
      { city: 'Allahabad', state: 'Uttar Pradesh' },
      { city: 'Kanpur', state: 'Uttar Pradesh' },
      { city: 'Patna', state: 'Bihar' },
      { city: 'Ranchi', state: 'Jharkhand' },
      { city: 'Dehradun', state: 'Uttarakhand' },
      { city: 'Chandigarh', state: 'Punjab' },
      { city: 'Jalandhar', state: 'Punjab' },
      { city: 'Bhopal', state: 'Madhya Pradesh' },
    ],
  },
  {
    name: 'Dainik Bhaskar',
    language: 'Hindi',
    type: 'National',
    pricingUnit: 'word',
    classifiedRate: 90,
    displayRate: 180,
    premiumRate: 900,
    editions: [
      { city: 'Jaipur', state: 'Rajasthan' },
      { city: 'Indore', state: 'Madhya Pradesh' },
      { city: 'Bhopal', state: 'Madhya Pradesh' },
      { city: 'Chandigarh', state: 'Punjab' },
      { city: 'Delhi', state: 'Delhi' },
      { city: 'Ahmedabad', state: 'Gujarat' },
      { city: 'Surat', state: 'Gujarat' },
      { city: 'Mumbai', state: 'Maharashtra' },
      { city: 'Raipur', state: 'Chhattisgarh' },
      { city: 'Ranchi', state: 'Jharkhand' },
      { city: 'Patna', state: 'Bihar' },
      { city: 'Jodhpur', state: 'Rajasthan' },
      { city: 'Nagpur', state: 'Maharashtra' },
    ],
  },
  {
    name: 'Amar Ujala',
    language: 'Hindi',
    type: 'National',
    pricingUnit: 'word',
    classifiedRate: 80,
    displayRate: 160,
    premiumRate: 800,
    editions: [
      { city: 'Agra', state: 'Uttar Pradesh' },
      { city: 'Meerut', state: 'Uttar Pradesh' },
      { city: 'Lucknow', state: 'Uttar Pradesh' },
      { city: 'Kanpur', state: 'Uttar Pradesh' },
      { city: 'Dehradun', state: 'Uttarakhand' },
      { city: 'Chandigarh', state: 'Punjab' },
      { city: 'Jalandhar', state: 'Punjab' },
      { city: 'Delhi', state: 'Delhi' },
    ],
  },
  {
    name: 'Navbharat Times',
    language: 'Hindi',
    type: 'National',
    pricingUnit: 'word',
    classifiedRate: 85,
    displayRate: 170,
    premiumRate: 850,
    editions: [
      { city: 'Delhi', state: 'Delhi' },
      { city: 'Mumbai', state: 'Maharashtra' },
      { city: 'Lucknow', state: 'Uttar Pradesh' },
      { city: 'Patna', state: 'Bihar' },
    ],
  },
  {
    name: 'Hindustan (Hindi)',
    language: 'Hindi',
    type: 'National',
    pricingUnit: 'word',
    classifiedRate: 75,
    displayRate: 150,
    premiumRate: 750,
    editions: [
      { city: 'Delhi', state: 'Delhi' },
      { city: 'Lucknow', state: 'Uttar Pradesh' },
      { city: 'Patna', state: 'Bihar' },
      { city: 'Ranchi', state: 'Jharkhand' },
    ],
  },
  {
    name: 'Rajasthan Patrika',
    language: 'Hindi',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 65,
    displayRate: 130,
    premiumRate: 650,
    editions: [
      { city: 'Jaipur', state: 'Rajasthan' },
      { city: 'Jodhpur', state: 'Rajasthan' },
      { city: 'Kota', state: 'Rajasthan' },
      { city: 'Udaipur', state: 'Rajasthan' },
      { city: 'Bikaner', state: 'Rajasthan' },
      { city: 'Delhi', state: 'Delhi' },
    ],
  },
  {
    name: 'Prabhat Khabar',
    language: 'Hindi',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 60,
    displayRate: 120,
    premiumRate: 600,
    editions: [
      { city: 'Patna', state: 'Bihar' },
      { city: 'Ranchi', state: 'Jharkhand' },
      { city: 'Dhanbad', state: 'Jharkhand' },
    ],
  },
  {
    name: 'Nai Dunia',
    language: 'Hindi',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 55,
    displayRate: 110,
    premiumRate: 550,
    editions: [
      { city: 'Indore', state: 'Madhya Pradesh' },
      { city: 'Bhopal', state: 'Madhya Pradesh' },
    ],
  },

  // ── Punjabi ────────────────────────────────────────────────────────────────
  {
    name: 'Punjab Kesari',
    language: 'Hindi/Punjabi',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 60,
    displayRate: 120,
    premiumRate: 600,
    editions: [
      { city: 'Jalandhar', state: 'Punjab' },
      { city: 'Delhi', state: 'Delhi' },
      { city: 'Chandigarh', state: 'Punjab' },
      { city: 'Dehradun', state: 'Uttarakhand' },
      { city: 'Ambala', state: 'Haryana' },
      { city: 'Ludhiana', state: 'Punjab' },
      { city: 'Amritsar', state: 'Punjab' },
    ],
  },
  {
    name: 'Punjabi Tribune',
    language: 'Punjabi',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 55,
    displayRate: 110,
    premiumRate: 550,
    editions: [
      { city: 'Chandigarh', state: 'Punjab' },
      { city: 'Jalandhar', state: 'Punjab' },
      { city: 'Amritsar', state: 'Punjab' },
      { city: 'Delhi', state: 'Delhi' },
      { city: 'Ludhiana', state: 'Punjab' },
    ],
  },
  {
    name: 'Jagbani',
    language: 'Punjabi',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 45,
    displayRate: 90,
    premiumRate: 450,
    editions: [
      { city: 'Jalandhar', state: 'Punjab' },
      { city: 'Amritsar', state: 'Punjab' },
      { city: 'Ludhiana', state: 'Punjab' },
      { city: 'Chandigarh', state: 'Punjab' },
      { city: 'Delhi', state: 'Delhi' },
    ],
  },
  {
    name: 'Punjabi Jagran',
    language: 'Punjabi',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 50,
    displayRate: 100,
    premiumRate: 500,
    editions: [
      { city: 'Jalandhar', state: 'Punjab' },
      { city: 'Amritsar', state: 'Punjab' },
      { city: 'Ludhiana', state: 'Punjab' },
    ],
  },

  // ── Bengali ────────────────────────────────────────────────────────────────
  {
    name: 'Anandabazar Patrika',
    language: 'Bengali',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 70,
    displayRate: 140,
    premiumRate: 700,
    editions: [
      { city: 'Kolkata', state: 'West Bengal' },
      { city: 'Delhi', state: 'Delhi' },
      { city: 'Mumbai', state: 'Maharashtra' },
    ],
  },
  {
    name: 'Bartaman',
    language: 'Bengali',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 55,
    displayRate: 110,
    premiumRate: 550,
    editions: [
      { city: 'Kolkata', state: 'West Bengal' },
    ],
  },
  {
    name: 'Ei Samay',
    language: 'Bengali',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 60,
    displayRate: 120,
    premiumRate: 600,
    editions: [
      { city: 'Kolkata', state: 'West Bengal' },
    ],
  },
  {
    name: 'Aajkaal',
    language: 'Bengali',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 50,
    displayRate: 100,
    premiumRate: 500,
    editions: [
      { city: 'Kolkata', state: 'West Bengal' },
    ],
  },

  // ── Marathi ────────────────────────────────────────────────────────────────
  {
    name: 'Maharashtra Times',
    language: 'Marathi',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 70,
    displayRate: 140,
    premiumRate: 700,
    editions: [
      { city: 'Mumbai', state: 'Maharashtra' },
      { city: 'Pune', state: 'Maharashtra' },
      { city: 'Nagpur', state: 'Maharashtra' },
      { city: 'Nashik', state: 'Maharashtra' },
      { city: 'Aurangabad', state: 'Maharashtra' },
    ],
  },
  {
    name: 'Lokmat',
    language: 'Marathi',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 65,
    displayRate: 130,
    premiumRate: 650,
    editions: [
      { city: 'Pune', state: 'Maharashtra' },
      { city: 'Mumbai', state: 'Maharashtra' },
      { city: 'Nashik', state: 'Maharashtra' },
      { city: 'Nagpur', state: 'Maharashtra' },
      { city: 'Aurangabad', state: 'Maharashtra' },
      { city: 'Kolhapur', state: 'Maharashtra' },
    ],
  },
  {
    name: 'Sakal',
    language: 'Marathi',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 60,
    displayRate: 120,
    premiumRate: 600,
    editions: [
      { city: 'Pune', state: 'Maharashtra' },
      { city: 'Mumbai', state: 'Maharashtra' },
      { city: 'Nashik', state: 'Maharashtra' },
      { city: 'Kolhapur', state: 'Maharashtra' },
    ],
  },
  {
    name: 'Pudhari',
    language: 'Marathi',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 45,
    displayRate: 90,
    premiumRate: 450,
    editions: [
      { city: 'Kolhapur', state: 'Maharashtra' },
      { city: 'Pune', state: 'Maharashtra' },
    ],
  },
  {
    name: 'Loksatta',
    language: 'Marathi',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 55,
    displayRate: 110,
    premiumRate: 550,
    editions: [
      { city: 'Mumbai', state: 'Maharashtra' },
      { city: 'Pune', state: 'Maharashtra' },
      { city: 'Nagpur', state: 'Maharashtra' },
    ],
  },

  // ── Gujarati ───────────────────────────────────────────────────────────────
  {
    name: 'Gujarat Samachar',
    language: 'Gujarati',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 65,
    displayRate: 130,
    premiumRate: 650,
    editions: [
      { city: 'Ahmedabad', state: 'Gujarat' },
      { city: 'Surat', state: 'Gujarat' },
      { city: 'Vadodara', state: 'Gujarat' },
      { city: 'Rajkot', state: 'Gujarat' },
    ],
  },
  {
    name: 'Sandesh',
    language: 'Gujarati',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 60,
    displayRate: 120,
    premiumRate: 600,
    editions: [
      { city: 'Ahmedabad', state: 'Gujarat' },
      { city: 'Surat', state: 'Gujarat' },
      { city: 'Vadodara', state: 'Gujarat' },
      { city: 'Rajkot', state: 'Gujarat' },
    ],
  },
  {
    name: 'Divya Bhaskar',
    language: 'Gujarati',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 70,
    displayRate: 140,
    premiumRate: 700,
    editions: [
      { city: 'Ahmedabad', state: 'Gujarat' },
      { city: 'Surat', state: 'Gujarat' },
      { city: 'Vadodara', state: 'Gujarat' },
      { city: 'Rajkot', state: 'Gujarat' },
    ],
  },
  {
    name: 'Nav Gujarat Samay',
    language: 'Gujarati',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 45,
    displayRate: 90,
    premiumRate: 450,
    editions: [
      { city: 'Ahmedabad', state: 'Gujarat' },
    ],
  },

  // ── Tamil ──────────────────────────────────────────────────────────────────
  {
    name: 'Daily Thanthi',
    language: 'Tamil',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 55,
    displayRate: 110,
    premiumRate: 550,
    editions: [
      { city: 'Chennai', state: 'Tamil Nadu' },
      { city: 'Coimbatore', state: 'Tamil Nadu' },
      { city: 'Madurai', state: 'Tamil Nadu' },
      { city: 'Salem', state: 'Tamil Nadu' },
    ],
  },
  {
    name: 'Dinamalar',
    language: 'Tamil',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 50,
    displayRate: 100,
    premiumRate: 500,
    editions: [
      { city: 'Chennai', state: 'Tamil Nadu' },
      { city: 'Coimbatore', state: 'Tamil Nadu' },
      { city: 'Madurai', state: 'Tamil Nadu' },
      { city: 'Tirunelveli', state: 'Tamil Nadu' },
    ],
  },
  {
    name: 'Dinamani',
    language: 'Tamil',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 45,
    displayRate: 90,
    premiumRate: 450,
    editions: [
      { city: 'Chennai', state: 'Tamil Nadu' },
      { city: 'Madurai', state: 'Tamil Nadu' },
    ],
  },
  {
    name: 'Dinakaran',
    language: 'Tamil',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 40,
    displayRate: 80,
    premiumRate: 400,
    editions: [
      { city: 'Chennai', state: 'Tamil Nadu' },
      { city: 'Coimbatore', state: 'Tamil Nadu' },
    ],
  },

  // ── Telugu ─────────────────────────────────────────────────────────────────
  {
    name: 'Eenadu',
    language: 'Telugu',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 55,
    displayRate: 110,
    premiumRate: 550,
    editions: [
      { city: 'Hyderabad', state: 'Telangana' },
      { city: 'Vijayawada', state: 'Andhra Pradesh' },
      { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
      { city: 'Tirupati', state: 'Andhra Pradesh' },
    ],
  },
  {
    name: 'Andhra Jyothy',
    language: 'Telugu',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 45,
    displayRate: 90,
    premiumRate: 450,
    editions: [
      { city: 'Hyderabad', state: 'Telangana' },
      { city: 'Vijayawada', state: 'Andhra Pradesh' },
      { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
    ],
  },
  {
    name: 'Sakshi',
    language: 'Telugu',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 40,
    displayRate: 80,
    premiumRate: 400,
    editions: [
      { city: 'Hyderabad', state: 'Telangana' },
      { city: 'Vijayawada', state: 'Andhra Pradesh' },
    ],
  },
  {
    name: 'Vaartha',
    language: 'Telugu',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 35,
    displayRate: 70,
    premiumRate: 350,
    editions: [
      { city: 'Hyderabad', state: 'Telangana' },
    ],
  },

  // ── Kannada ────────────────────────────────────────────────────────────────
  {
    name: 'Vijay Karnataka',
    language: 'Kannada',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 50,
    displayRate: 100,
    premiumRate: 500,
    editions: [
      { city: 'Bangalore', state: 'Karnataka' },
      { city: 'Mangalore', state: 'Karnataka' },
      { city: 'Hubli', state: 'Karnataka' },
      { city: 'Mysore', state: 'Karnataka' },
    ],
  },
  {
    name: 'Prajavani',
    language: 'Kannada',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 45,
    displayRate: 90,
    premiumRate: 450,
    editions: [
      { city: 'Bangalore', state: 'Karnataka' },
      { city: 'Mysore', state: 'Karnataka' },
      { city: 'Mangalore', state: 'Karnataka' },
    ],
  },
  {
    name: 'Udayavani',
    language: 'Kannada',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 40,
    displayRate: 80,
    premiumRate: 400,
    editions: [
      { city: 'Mangalore', state: 'Karnataka' },
      { city: 'Bangalore', state: 'Karnataka' },
    ],
  },
  {
    name: 'Kannada Prabha',
    language: 'Kannada',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 35,
    displayRate: 70,
    premiumRate: 350,
    editions: [
      { city: 'Bangalore', state: 'Karnataka' },
    ],
  },

  // ── Malayalam ──────────────────────────────────────────────────────────────
  {
    name: 'Malayala Manorama',
    language: 'Malayalam',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 55,
    displayRate: 110,
    premiumRate: 550,
    editions: [
      { city: 'Thiruvananthapuram', state: 'Kerala' },
      { city: 'Kochi', state: 'Kerala' },
      { city: 'Kozhikode', state: 'Kerala' },
      { city: 'Thrissur', state: 'Kerala' },
      { city: 'Delhi', state: 'Delhi' },
      { city: 'Mumbai', state: 'Maharashtra' },
    ],
  },
  {
    name: 'Mathrubhumi',
    language: 'Malayalam',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 50,
    displayRate: 100,
    premiumRate: 500,
    editions: [
      { city: 'Thiruvananthapuram', state: 'Kerala' },
      { city: 'Kochi', state: 'Kerala' },
      { city: 'Kozhikode', state: 'Kerala' },
      { city: 'Thrissur', state: 'Kerala' },
    ],
  },
  {
    name: 'Kerala Kaumudi',
    language: 'Malayalam',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 40,
    displayRate: 80,
    premiumRate: 400,
    editions: [
      { city: 'Thiruvananthapuram', state: 'Kerala' },
      { city: 'Kochi', state: 'Kerala' },
    ],
  },
  {
    name: 'Deepika',
    language: 'Malayalam',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 35,
    displayRate: 70,
    premiumRate: 350,
    editions: [
      { city: 'Kochi', state: 'Kerala' },
      { city: 'Thiruvananthapuram', state: 'Kerala' },
    ],
  },

  // ── Odia ───────────────────────────────────────────────────────────────────
  {
    name: 'Sambad',
    language: 'Odia',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 40,
    displayRate: 80,
    premiumRate: 400,
    editions: [
      { city: 'Bhubaneswar', state: 'Odisha' },
      { city: 'Cuttack', state: 'Odisha' },
    ],
  },
  {
    name: 'Samaja',
    language: 'Odia',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 35,
    displayRate: 70,
    premiumRate: 350,
    editions: [
      { city: 'Bhubaneswar', state: 'Odisha' },
    ],
  },

  // ── Urdu ───────────────────────────────────────────────────────────────────
  {
    name: 'Siasat Daily',
    language: 'Urdu',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 45,
    displayRate: 90,
    premiumRate: 450,
    editions: [
      { city: 'Hyderabad', state: 'Telangana' },
    ],
  },
  {
    name: 'Inquilab',
    language: 'Urdu',
    type: 'Regional',
    pricingUnit: 'word',
    classifiedRate: 50,
    displayRate: 100,
    premiumRate: 500,
    editions: [
      { city: 'Mumbai', state: 'Maharashtra' },
      { city: 'Delhi', state: 'Delhi' },
    ],
  },
];

// ── Main seed function ─────────────────────────────────────────────────────────

async function seed() {
  // Insert enchantments (safe to re-run — names are unique in the table by convention)
  const existingEnchantments = await db.select().from(adEnchantments).limit(1);
  if (existingEnchantments.length === 0) {
    console.log('Inserting enchantments...');
    await db.insert(adEnchantments).values(
      ENCHANTMENTS.map(e => ({ id: uid(), name: e.name, description: e.description, icon: e.icon, price: e.price, active: true }))
    );
  } else {
    console.log('Enchantments already present, skipping.');
  }

  // For categories we need a master adType from the first new newspaper we insert
  // Check if categories already exist
  const existingCats = await db.select().from(categories).limit(1);
  let masterCatsCreated = existingCats.length > 0;

  let added = 0;
  let skipped = 0;

  console.log(`Processing ${NEWSPAPERS_DATA.length} newspapers...`);

  for (const np of NEWSPAPERS_DATA) {
    // Skip if newspaper with this name already exists
    const existing = await db.select().from(newspapers).where(eq(newspapers.name, np.name)).limit(1);
    if (existing.length > 0) {
      skipped++;
      continue;
    }

    const npId = uid();
    await db.insert(newspapers).values({
      id: npId,
      name: np.name,
      language: np.language,
      type: np.type,
      pricingUnit: np.pricingUnit,
      active: true,
    });

    const ctId = uid();
    const cdId = uid();
    const daId = uid();

    await db.insert(adTypes).values([
      { id: ctId, newspaperId: npId, name: 'Classified Text Ad', active: true },
      { id: cdId, newspaperId: npId, name: 'Classified Display Ad', active: true },
      { id: daId, newspaperId: npId, name: 'Display Ad', active: true },
    ]);

    const sizeUnit = np.pricingUnit === 'word' ? 'per_word' : 'per_line';
    const lang = np.language === 'English' ? 'EN' : 'HI';

    await db.insert(rates).values([
      {
        id: uid(),
        name: `${np.name} - Classified Text`,
        newspaperId: npId,
        adTypeId: ctId,
        categoryId: null,
        language: lang,
        sizeUnit: sizeUnit,
        baseRate: np.classifiedRate,
        minSize: 1,
        active: true,
      },
      {
        id: uid(),
        name: `${np.name} - Classified Display`,
        newspaperId: npId,
        adTypeId: cdId,
        categoryId: null,
        language: lang,
        sizeUnit: sizeUnit,
        baseRate: np.displayRate,
        minSize: 1,
        active: true,
      },
      {
        id: uid(),
        name: `${np.name} - Display Ad`,
        newspaperId: npId,
        adTypeId: daId,
        categoryId: null,
        language: lang,
        sizeUnit: 'per_line',
        baseRate: np.premiumRate,
        minSize: 1,
        active: true,
      },
    ]);

    if (np.editions.length > 0) {
      await db.insert(editions).values(
        np.editions.map(e => ({ id: uid(), newspaperId: npId, editionName: e.city, state: e.state, active: true }))
      );
    }

    // First newly-inserted newspaper becomes the master for categories
    if (!masterCatsCreated) {
      masterCatsCreated = true;
      console.log(`  Creating ${CATEGORIES_LIST.length} categories under "${np.name}"...`);
      await db.insert(categories).values(
        CATEGORIES_LIST.map(name => ({ id: uid(), adTypeId: ctId, name, active: true }))
      );
    }

    added++;
    console.log(`  + ${np.name}`);
  }

  console.log('\nSeed complete!');
  console.log(`  Added:   ${added} newspapers (${added * 3} ad types, ${added * 3} rates)`);
  console.log(`  Skipped: ${skipped} newspapers (already in DB)`);
}

// ── Subcategories & Preferred Classifications ──────────────────────────────────

// Exact community/caste classifications from releasemyad.com matrimonial section
const MATRIMONIAL_CLASSIFICATIONS = [
  'Agarwal', 'Ahluwalia', 'Arora', 'Backward Classes', 'Brahmin', 'Christian',
  'Divorcee', 'Doctors/Engineers', 'IAS Allied Services', 'Jain', 'Jat',
  'Jat Gurusikh', 'Jat Sikh', 'Kamboj', 'Khatri', 'Khatri/Arora', 'Kshatriya',
  'Lingayat', 'Maratha', 'Mehra', 'Muslim', 'NRI', 'OBC', 'Others', 'Punjabi',
  'Rajput', 'Ramgharia', 'SC/ST', 'Sikh', 'Sindhi', 'Vaishnav', 'Vaishya',
];

// Exact subcategory data sourced from releasemyad.com for each category
const SUBCATEGORY_DATA: Record<string, { name: string; classifications?: string[] }[]> = {

  // ── Matrimonial ── releasemyad: /classified-ads/matrimonial/
  'Matrimonial': [
    { name: 'Wanted Brides', classifications: MATRIMONIAL_CLASSIFICATIONS },
    { name: 'Wanted Grooms',  classifications: MATRIMONIAL_CLASSIFICATIONS },
  ],

  // ── Property ── exact subcategories from releasemyad.com screenshot
  'Property': [
    { name: 'Accommodation Available', classifications: [] },
    { name: 'Accommodation Wanted',    classifications: [] },
    { name: 'For Sale',                classifications: ['Chandigarh', 'Factory For Sale', 'Flat For Sale', 'Land for sale', 'Misc', 'Mohali', 'Panchkula', 'Plot For Sale', 'Shed/Godown'] },
    { name: 'Hotel and Restaurant',    classifications: [] },
    { name: 'Orchard',                 classifications: [] },
    { name: 'Paying Guest',            classifications: [] },
    { name: 'Property',                classifications: [] },
    { name: 'Property Wanted',         classifications: ['Flat Wanted', 'Land Wanted', 'Plot Wanted', 'Property Wanted'] },
    { name: 'Rent / Lease',            classifications: [] },
    { name: 'Sale or Purchase',        classifications: [] },
    { name: 'Sale / Rent / Lease',     classifications: [] },
    { name: 'Space Available',         classifications: [] },
    { name: 'To Let',                  classifications: ['Cabins', 'Chandigarh', 'Jalandhar', 'Kharar', 'Manimajra', 'Misc', 'Mohali', 'Panchkula', 'Patiala', 'Shed/Godown', 'Shimla', 'Zirakpur'] },
  ],

  // ── Recruitment & Jobs ── exact subcategories from releasemyad.com screenshot
  'Recruitment & Jobs': [
    { name: 'Acupressure',       classifications: [] },
    { name: 'Doctors / Engineers',classifications: [] },
    { name: 'Job Wanted',        classifications: [] },
    { name: 'Medical / Surgical',classifications: [] },
    { name: 'Sales & Marketing', classifications: [] },
    { name: 'Situation Abroad',  classifications: [] },
    { name: 'Situation Vacant',  classifications: [] },
    { name: 'Teachers',          classifications: [] },
  ],

  // ── Vehicles ── exact subcategories from releasemyad.com screenshot
  'Vehicles': [
    { name: 'Car For Sale',         classifications: [] },
    { name: 'Car Wanted',           classifications: [] },
    { name: 'For Rent',             classifications: [] },
    { name: 'Scooter/ Bike For Sale', classifications: [] },
    { name: 'Taxi On Hire',         classifications: [] },
    { name: 'Vehicle for Sale',     classifications: [] },
  ],

  // ── Education & Admissions ── releasemyad: /classified-ads/education/
  'Education & Admissions': [
    { name: 'Academic',          classifications: [] },
    { name: 'Coaching Classes',  classifications: [] },
    { name: 'Courses and Classes',classifications: [] },
    { name: 'Private Tuitions',  classifications: [] },
    { name: 'Vacancies',         classifications: [] },
  ],

  // ── Legal Notices ── releasemyad: "Court or Marriage Notice" category
  'Legal Notices': [
    { name: 'Court Notice',          classifications: [] },
    { name: 'Marriage Notice',       classifications: [] },
    { name: 'Property Notice',       classifications: [] },
    { name: 'Company / Firm Notice', classifications: [] },
    { name: 'Insolvency Notice',     classifications: [] },
    { name: 'Public Notice',         classifications: [] },
    { name: 'Caveat Notice',         classifications: [] },
    { name: 'Demand Notice',         classifications: [] },
  ],

  // ── Public Announcements ── releasemyad: /classified-ads/announcement/
  'Public Announcements': [
    { name: 'Cancellations and Postponement', classifications: [] },
    { name: 'Change Of Name',                 classifications: [] },
    { name: 'Church Notices',                 classifications: [] },
    { name: 'Lost And Found',                 classifications: [] },
    { name: 'Missing',                        classifications: [] },
    { name: 'Prayer Meetings',                classifications: [] },
    { name: 'Protest / Rally',                classifications: [] },
  ],

  // ── Business Opportunities ── releasemyad: /classified-ads/business/
  'Business Opportunities': [
    { name: 'Agents And Agencies',         classifications: [] },
    { name: 'Business Offers or Proposals',classifications: [] },
    { name: 'Consultancy',                 classifications: [] },
    { name: 'Machinery And Equipments',    classifications: [] },
    { name: 'Miscellaneous',               classifications: [] },
  ],

  // ── Obituary & Memorial ── releasemyad: /classified-ads/obituary/ (all 25 confirmed subcategories)
  'Obituary & Memorial': [
    { name: 'Besna',                 classifications: [] },
    { name: 'Bhog Ceremony',         classifications: [] },
    { name: 'Chautha and Uthamna',   classifications: [] },
    { name: 'Clarification',         classifications: [] },
    { name: 'Commemoration Havan',   classifications: [] },
    { name: 'Condolences',           classifications: [] },
    { name: 'Death',                 classifications: [] },
    { name: 'Death Acknowledgement', classifications: [] },
    { name: 'Death Anniversary',     classifications: [] },
    { name: 'Death Announcements',   classifications: [] },
    { name: 'Hashkaba',              classifications: [] },
    { name: 'In Memoriam',           classifications: [] },
    { name: 'Kriya',                 classifications: [] },
    { name: 'Marka',                 classifications: [] },
    { name: 'Mass and Services',     classifications: [] },
    { name: 'Memorial Services',     classifications: [] },
    { name: 'Months Mind',           classifications: [] },
    { name: 'Obituary Services',     classifications: [] },
    { name: 'Pets Obituary',         classifications: [] },
    { name: 'Prayer Meeting',        classifications: [] },
    { name: 'Rasam Pagdi',           classifications: [] },
    { name: 'Seventh Day Mass',      classifications: [] },
    { name: 'Tributes',              classifications: [] },
    { name: 'Uthala',                classifications: [] },
    { name: 'Vaikunta Samaradhana',  classifications: [] },
  ],

  // ── Lost & Found ── releasemyad: /classified-ads/lost-and-found/
  'Lost & Found': [
    { name: 'Lost and Found', classifications: [] },
  ],

  // ── Change of Name ── releasemyad: /classified-ads/change-of-name/
  'Change of Name': [
    { name: 'Change of Name', classifications: [] },
  ],

  // ── Tender Notices ── releasemyad: /classified-ads/tenders/
  'Tender Notices': [
    { name: 'Tenders', classifications: [] },
  ],

  // ── Auction Notices ── (mapped from bank/court auction classified ads)
  'Auction Notices': [
    { name: 'Bank / DRT Auction', classifications: [] },
    { name: 'Court Auction',      classifications: [] },
    { name: 'Government Auction', classifications: [] },
    { name: 'Private Auction',    classifications: [] },
    { name: 'E-Auction',          classifications: [] },
  ],

  // ── Services Offered ── releasemyad: /classified-ads/services/ — confirmed subcategory slugs
  'Services Offered': [
    { name: 'Astrology',                  classifications: [] },
    { name: 'Ayurveda',                   classifications: [] },
    { name: 'Beauty and Cosmetics',       classifications: [] },
    { name: 'Beauty Parlour',             classifications: [] },
    { name: 'Counselling',                classifications: [] },
    { name: 'Food and Nutrition',         classifications: [] },
    { name: 'General Services',           classifications: [] },
    { name: 'Gym / Aerobics',             classifications: [] },
    { name: 'Hearing Aids',               classifications: [] },
    { name: 'NGO Related',                classifications: [] },
    { name: 'Numerology',                 classifications: [] },
    { name: 'Old Age Homes',              classifications: [] },
    { name: 'Packers and Movers',         classifications: [] },
    { name: 'Personal',                   classifications: [] },
    { name: 'Pest Control',               classifications: [] },
    { name: 'Repairs or Waterproofing',   classifications: [] },
    { name: 'Security Services',          classifications: [] },
    { name: 'Translators',                classifications: [] },
    { name: 'Travel Guides',              classifications: [] },
  ],

  // ── Personal Messages ── releasemyad: /classified-ads/personal/
  'Personal Messages': [
    { name: 'Greetings and Celebrations', classifications: [] },
    { name: 'Personal',                   classifications: [] },
    { name: 'Wedding Related',            classifications: [] },
  ],
};

// Edition-specific rates sourced from releasemyad.com tariff pages.
// classifiedRate/displayRate are per-line (English papers) or per-word (regional papers)
// matching each newspaper's pricingUnit in NEWSPAPERS_DATA.
// English: tariff was "per 5 lines" → divide by 5.  Hindi/regional: "per 20–25 words" → divide accordingly.
const EDITION_RATES: { newspaper: string; editions: { city: string; classifiedRate: number; displayRate: number }[] }[] = [

  // ── English Nationals ──────────────────────────────────────────────────────
  {
    newspaper: 'Times of India',
    editions: [
      // rma-timesofindia.releasemyad.com tariff (per 5 lines → per line)
      { city: 'Delhi',       classifiedRate: 190, displayRate: 380 },
      { city: 'Mumbai',      classifiedRate: 200, displayRate: 400 },
      { city: 'Kolkata',     classifiedRate: 200, displayRate: 400 },
      { city: 'Chennai',     classifiedRate: 200, displayRate: 400 },
      { city: 'Bangalore',   classifiedRate: 168, displayRate: 336 },
      { city: 'Hyderabad',   classifiedRate: 140, displayRate: 280 },
      { city: 'Ahmedabad',   classifiedRate: 120, displayRate: 240 },
      { city: 'Pune',        classifiedRate:  65, displayRate: 130 },
      { city: 'Surat',       classifiedRate: 106, displayRate: 212 },
      { city: 'Jaipur',      classifiedRate:  68, displayRate: 136 },
      { city: 'Lucknow',     classifiedRate: 160, displayRate: 320 },
      { city: 'Chandigarh',  classifiedRate: 120, displayRate: 240 },
      { city: 'Bhopal',      classifiedRate:  45, displayRate:  90 },
      { city: 'Indore',      classifiedRate:  45, displayRate:  90 },
      { city: 'Nagpur',      classifiedRate:  40, displayRate:  80 },
      { city: 'Kochi',       classifiedRate: 100, displayRate: 200 },
      { city: 'Patna',       classifiedRate:  84, displayRate: 168 },
      { city: 'Ranchi',      classifiedRate:  35, displayRate:  70 },
      { city: 'Coimbatore',  classifiedRate:  85, displayRate: 170 },
      { city: 'Mysore',      classifiedRate:  40, displayRate:  80 },
      { city: 'Nashik',      classifiedRate:  35, displayRate:  70 },
      { city: 'Aurangabad',  classifiedRate:  30, displayRate:  60 },
      { city: 'Goa',         classifiedRate:  40, displayRate:  80 },
      { city: 'Mangalore',   classifiedRate:  35, displayRate:  70 },
      { city: 'Kanpur',      classifiedRate:  53, displayRate: 106 },
      { city: 'Dehradun',    classifiedRate:  40, displayRate:  80 },
      { city: 'Varanasi',    classifiedRate:  35, displayRate:  70 },
    ],
  },
  {
    newspaper: 'Hindustan Times',
    editions: [
      // hindustantimes.releasemyad.com tariff (per 5 lines → per line)
      { city: 'Delhi',      classifiedRate: 220, displayRate: 440 },
      { city: 'Mumbai',     classifiedRate: 180, displayRate: 360 },
      { city: 'Chandigarh', classifiedRate: 125, displayRate: 250 },
      { city: 'Lucknow',    classifiedRate: 100, displayRate: 200 },
      { city: 'Kolkata',    classifiedRate:  80, displayRate: 160 },
      { city: 'Patna',      classifiedRate:  80, displayRate: 160 },
      { city: 'Ranchi',     classifiedRate:  40, displayRate:  80 },
      { city: 'Bhopal',     classifiedRate:  50, displayRate: 100 },
    ],
  },
  {
    newspaper: 'The Hindu',
    editions: [
      { city: 'Chennai',            classifiedRate: 160, displayRate: 320 },
      { city: 'Bangalore',          classifiedRate: 150, displayRate: 300 },
      { city: 'Hyderabad',          classifiedRate: 130, displayRate: 260 },
      { city: 'Delhi',              classifiedRate: 170, displayRate: 340 },
      { city: 'Mumbai',             classifiedRate: 140, displayRate: 280 },
      { city: 'Kochi',              classifiedRate: 100, displayRate: 200 },
      { city: 'Coimbatore',         classifiedRate:  85, displayRate: 170 },
      { city: 'Madurai',            classifiedRate:  85, displayRate: 170 },
      { city: 'Thiruvananthapuram', classifiedRate:  80, displayRate: 160 },
    ],
  },
  {
    newspaper: 'The Indian Express',
    editions: [
      { city: 'Delhi',      classifiedRate: 150, displayRate: 300 },
      { city: 'Mumbai',     classifiedRate: 140, displayRate: 280 },
      { city: 'Pune',       classifiedRate:  90, displayRate: 180 },
      { city: 'Ahmedabad',  classifiedRate:  80, displayRate: 160 },
      { city: 'Lucknow',    classifiedRate:  70, displayRate: 140 },
      { city: 'Chandigarh', classifiedRate:  70, displayRate: 140 },
      { city: 'Kolkata',    classifiedRate:  80, displayRate: 160 },
    ],
  },
  {
    newspaper: 'Economic Times',
    editions: [
      { city: 'Delhi',     classifiedRate: 170, displayRate: 340 },
      { city: 'Mumbai',    classifiedRate: 160, displayRate: 320 },
      { city: 'Kolkata',   classifiedRate: 120, displayRate: 240 },
      { city: 'Chennai',   classifiedRate: 120, displayRate: 240 },
      { city: 'Bangalore', classifiedRate: 130, displayRate: 260 },
      { city: 'Ahmedabad', classifiedRate: 100, displayRate: 200 },
    ],
  },
  {
    newspaper: 'Business Standard',
    editions: [
      { city: 'Delhi',     classifiedRate: 160, displayRate: 320 },
      { city: 'Mumbai',    classifiedRate: 150, displayRate: 300 },
      { city: 'Kolkata',   classifiedRate: 110, displayRate: 220 },
      { city: 'Chennai',   classifiedRate: 110, displayRate: 220 },
      { city: 'Bangalore', classifiedRate: 120, displayRate: 240 },
    ],
  },
  {
    newspaper: 'Financial Express',
    editions: [
      { city: 'Delhi',     classifiedRate: 150, displayRate: 300 },
      { city: 'Mumbai',    classifiedRate: 140, displayRate: 280 },
      { city: 'Kolkata',   classifiedRate: 100, displayRate: 200 },
      { city: 'Bangalore', classifiedRate: 100, displayRate: 200 },
    ],
  },
  {
    newspaper: 'The Business Line',
    editions: [
      { city: 'Chennai',   classifiedRate: 140, displayRate: 280 },
      { city: 'Delhi',     classifiedRate: 130, displayRate: 260 },
      { city: 'Mumbai',    classifiedRate: 120, displayRate: 240 },
      { city: 'Bangalore', classifiedRate: 110, displayRate: 220 },
      { city: 'Hyderabad', classifiedRate: 100, displayRate: 200 },
    ],
  },
  {
    newspaper: 'Mint',
    editions: [
      { city: 'Delhi',     classifiedRate: 160, displayRate: 320 },
      { city: 'Mumbai',    classifiedRate: 150, displayRate: 300 },
      { city: 'Bangalore', classifiedRate: 120, displayRate: 240 },
      { city: 'Chennai',   classifiedRate: 110, displayRate: 220 },
      { city: 'Kolkata',   classifiedRate: 110, displayRate: 220 },
    ],
  },
  {
    newspaper: 'Deccan Herald',
    editions: [
      { city: 'Bangalore', classifiedRate: 100, displayRate: 200 },
      { city: 'Mysore',    classifiedRate:  65, displayRate: 130 },
      { city: 'Mangalore', classifiedRate:  60, displayRate: 120 },
      { city: 'Hubli',     classifiedRate:  55, displayRate: 110 },
    ],
  },
  {
    newspaper: 'Deccan Chronicle',
    editions: [
      { city: 'Hyderabad', classifiedRate: 90, displayRate: 180 },
      { city: 'Bangalore', classifiedRate: 75, displayRate: 150 },
      { city: 'Chennai',   classifiedRate: 65, displayRate: 130 },
    ],
  },
  {
    newspaper: 'New Indian Express',
    editions: [
      { city: 'Chennai',            classifiedRate: 90, displayRate: 180 },
      { city: 'Bangalore',          classifiedRate: 80, displayRate: 160 },
      { city: 'Hyderabad',          classifiedRate: 70, displayRate: 140 },
      { city: 'Kochi',              classifiedRate: 70, displayRate: 140 },
      { city: 'Thiruvananthapuram', classifiedRate: 65, displayRate: 130 },
    ],
  },
  {
    newspaper: 'The Pioneer',
    editions: [
      { city: 'Delhi',      classifiedRate: 80, displayRate: 160 },
      { city: 'Lucknow',    classifiedRate: 65, displayRate: 130 },
      { city: 'Chandigarh', classifiedRate: 60, displayRate: 120 },
      { city: 'Bhopal',     classifiedRate: 50, displayRate: 100 },
    ],
  },
  {
    newspaper: 'The Statesman',
    editions: [
      { city: 'Kolkata', classifiedRate: 70, displayRate: 140 },
      { city: 'Delhi',   classifiedRate: 60, displayRate: 120 },
    ],
  },
  {
    newspaper: 'The Telegraph',
    editions: [
      { city: 'Kolkata',  classifiedRate: 90, displayRate: 180 },
      { city: 'Siliguri', classifiedRate: 45, displayRate:  90 },
    ],
  },
  {
    newspaper: 'Mid-Day',
    editions: [{ city: 'Mumbai', classifiedRate: 120, displayRate: 240 }],
  },
  {
    newspaper: 'Mumbai Mirror',
    editions: [{ city: 'Mumbai', classifiedRate: 110, displayRate: 220 }],
  },
  {
    newspaper: 'The Tribune',
    editions: [
      // tribune.releasemyad.com tariff — Rs.720/15 words = Rs.48/word (all editions except Delhi)
      // Delhi: Rs.180/15 words = Rs.12/word
      { city: 'Chandigarh', classifiedRate: 48, displayRate: 96 },
      { city: 'Ludhiana',   classifiedRate: 48, displayRate: 96 },
      { city: 'Jalandhar',  classifiedRate: 48, displayRate: 96 },
      { city: 'Amritsar',   classifiedRate: 48, displayRate: 96 },
      { city: 'Bathinda',   classifiedRate: 48, displayRate: 96 },
      { city: 'Ambala',     classifiedRate: 48, displayRate: 96 },
      { city: 'Shimla',     classifiedRate: 48, displayRate: 96 },
      { city: 'Jammu',      classifiedRate: 48, displayRate: 96 },
      { city: 'Dehradun',   classifiedRate: 48, displayRate: 96 },
      { city: 'Delhi',      classifiedRate: 12, displayRate: 24 },
    ],
  },
  {
    newspaper: 'Dainik Tribune',
    editions: [
      // dainiktribune.releasemyad.com tariff (per word)
      { city: 'Chandigarh', classifiedRate: 25, displayRate: 50 },
      { city: 'Delhi',      classifiedRate: 30, displayRate: 60 },
      { city: 'Jalandhar',  classifiedRate: 20, displayRate: 40 },
      { city: 'Ludhiana',   classifiedRate: 18, displayRate: 36 },
      { city: 'Ambala',     classifiedRate: 15, displayRate: 30 },
      { city: 'Dehradun',   classifiedRate: 12, displayRate: 24 },
    ],
  },

  // ── Hindi Nationals ────────────────────────────────────────────────────────
  {
    newspaper: 'Dainik Jagran',
    editions: [
      // dainikjagran.releasemyad.com tariff (per 6 lines ÷ ~50 words → per word)
      { city: 'Delhi',      classifiedRate: 30, displayRate: 60 },
      { city: 'Lucknow',    classifiedRate: 28, displayRate: 56 },
      { city: 'Kanpur',     classifiedRate: 28, displayRate: 56 },
      { city: 'Varanasi',   classifiedRate: 24, displayRate: 48 },
      { city: 'Meerut',     classifiedRate: 24, displayRate: 48 },
      { city: 'Patna',      classifiedRate: 25, displayRate: 50 },
      { city: 'Agra',       classifiedRate: 20, displayRate: 40 },
      { city: 'Allahabad',  classifiedRate: 20, displayRate: 40 },
      { city: 'Chandigarh', classifiedRate: 15, displayRate: 30 },
      { city: 'Jalandhar',  classifiedRate: 12, displayRate: 24 },
      { city: 'Dehradun',   classifiedRate: 14, displayRate: 28 },
      { city: 'Bhopal',     classifiedRate: 12, displayRate: 24 },
      { city: 'Ranchi',     classifiedRate: 10, displayRate: 20 },
    ],
  },
  {
    newspaper: 'Dainik Bhaskar',
    editions: [
      // dainikbhaskar.releasemyad.com tariff (per 20 words → per word)
      { city: 'Jaipur',     classifiedRate: 127, displayRate: 254 },
      { city: 'Indore',     classifiedRate:  60, displayRate: 120 },
      { city: 'Bhopal',     classifiedRate:  70, displayRate: 140 },
      { city: 'Chandigarh', classifiedRate:  28, displayRate:  56 },
      { city: 'Delhi',      classifiedRate:  55, displayRate: 110 },
      { city: 'Raipur',     classifiedRate:  65, displayRate: 130 },
      { city: 'Ranchi',     classifiedRate:  27, displayRate:  54 },
      { city: 'Patna',      classifiedRate:  55, displayRate: 110 },
      { city: 'Jodhpur',    classifiedRate:  52, displayRate: 104 },
      { city: 'Nagpur',     classifiedRate:  10, displayRate:  20 },
      { city: 'Surat',      classifiedRate:  25, displayRate:  50 },
      { city: 'Ahmedabad',  classifiedRate:  25, displayRate:  50 },
      { city: 'Mumbai',     classifiedRate:  25, displayRate:  50 },
    ],
  },
  {
    newspaper: 'Amar Ujala',
    editions: [
      // amarujala.releasemyad.com tariff (per 25 words → per word)
      { city: 'Agra',       classifiedRate: 52, displayRate: 104 },
      { city: 'Meerut',     classifiedRate: 42, displayRate:  84 },
      { city: 'Lucknow',    classifiedRate: 42, displayRate:  84 },
      { city: 'Kanpur',     classifiedRate: 42, displayRate:  84 },
      { city: 'Dehradun',   classifiedRate: 40, displayRate:  80 },
      { city: 'Delhi',      classifiedRate: 40, displayRate:  80 },
      { city: 'Chandigarh', classifiedRate: 14, displayRate:  28 },
      { city: 'Jalandhar',  classifiedRate:  8, displayRate:  16 },
    ],
  },
  {
    newspaper: 'Navbharat Times',
    editions: [
      // navbharattimes.releasemyad.com tariff (per 5 lines ÷ 40 words → per word)
      { city: 'Delhi',   classifiedRate: 15, displayRate: 30 },
      { city: 'Mumbai',  classifiedRate:  8, displayRate: 16 },
      { city: 'Lucknow', classifiedRate:  7, displayRate: 14 },
      { city: 'Patna',   classifiedRate:  5, displayRate: 10 },
    ],
  },
  {
    newspaper: 'Hindustan (Hindi)',
    editions: [
      { city: 'Delhi',   classifiedRate: 35, displayRate:  70 },
      { city: 'Lucknow', classifiedRate: 30, displayRate:  60 },
      { city: 'Patna',   classifiedRate: 28, displayRate:  56 },
      { city: 'Ranchi',  classifiedRate: 22, displayRate:  44 },
    ],
  },
  {
    newspaper: 'Rajasthan Patrika',
    editions: [
      // rajasthanpatrika.releasemyad.com tariff (per 20 words → per word)
      { city: 'Jaipur',  classifiedRate: 122, displayRate: 244 },
      { city: 'Jodhpur', classifiedRate:  53, displayRate: 106 },
      { city: 'Kota',    classifiedRate:  28, displayRate:  56 },
      { city: 'Udaipur', classifiedRate:  30, displayRate:  60 },
      { city: 'Bikaner', classifiedRate:  22, displayRate:  44 },
      { city: 'Delhi',   classifiedRate:  25, displayRate:  50 },
    ],
  },
  {
    newspaper: 'Prabhat Khabar',
    editions: [
      { city: 'Patna',   classifiedRate: 30, displayRate: 60 },
      { city: 'Ranchi',  classifiedRate: 28, displayRate: 56 },
      { city: 'Dhanbad', classifiedRate: 20, displayRate: 40 },
    ],
  },
  {
    newspaper: 'Nai Dunia',
    editions: [
      { city: 'Indore', classifiedRate: 25, displayRate: 50 },
      { city: 'Bhopal', classifiedRate: 22, displayRate: 44 },
    ],
  },

  // ── Punjabi ────────────────────────────────────────────────────────────────
  {
    newspaper: 'Punjab Kesari',
    editions: [
      // punjabkesari.releasemyad.com tariff (per 25 words → per word)
      { city: 'Delhi',      classifiedRate: 36, displayRate:  72 },
      { city: 'Chandigarh', classifiedRate: 35, displayRate:  70 },
      { city: 'Jalandhar',  classifiedRate: 35, displayRate:  70 },
      { city: 'Ludhiana',   classifiedRate: 35, displayRate:  70 },
      { city: 'Amritsar',   classifiedRate: 35, displayRate:  70 },
      { city: 'Ambala',     classifiedRate: 35, displayRate:  70 },
      { city: 'Dehradun',   classifiedRate: 35, displayRate:  70 },
    ],
  },
  {
    newspaper: 'Punjabi Tribune',
    editions: [
      { city: 'Chandigarh', classifiedRate: 30, displayRate: 60 },
      { city: 'Jalandhar',  classifiedRate: 28, displayRate: 56 },
      { city: 'Amritsar',   classifiedRate: 25, displayRate: 50 },
      { city: 'Delhi',      classifiedRate: 28, displayRate: 56 },
      { city: 'Ludhiana',   classifiedRate: 25, displayRate: 50 },
    ],
  },
  {
    newspaper: 'Jagbani',
    editions: [
      { city: 'Jalandhar',  classifiedRate: 22, displayRate: 44 },
      { city: 'Amritsar',   classifiedRate: 20, displayRate: 40 },
      { city: 'Ludhiana',   classifiedRate: 20, displayRate: 40 },
      { city: 'Chandigarh', classifiedRate: 22, displayRate: 44 },
      { city: 'Delhi',      classifiedRate: 18, displayRate: 36 },
    ],
  },
  {
    newspaper: 'Punjabi Jagran',
    editions: [
      { city: 'Jalandhar', classifiedRate: 25, displayRate: 50 },
      { city: 'Amritsar',  classifiedRate: 22, displayRate: 44 },
      { city: 'Ludhiana',  classifiedRate: 22, displayRate: 44 },
    ],
  },

  // ── Bengali ────────────────────────────────────────────────────────────────
  {
    newspaper: 'Anandabazar Patrika',
    editions: [
      { city: 'Kolkata', classifiedRate: 40, displayRate: 80 },
      { city: 'Delhi',   classifiedRate: 25, displayRate: 50 },
      { city: 'Mumbai',  classifiedRate: 25, displayRate: 50 },
    ],
  },
  {
    newspaper: 'Bartaman',
    editions: [{ city: 'Kolkata', classifiedRate: 30, displayRate: 60 }],
  },
  {
    newspaper: 'Ei Samay',
    editions: [{ city: 'Kolkata', classifiedRate: 35, displayRate: 70 }],
  },
  {
    newspaper: 'Aajkaal',
    editions: [{ city: 'Kolkata', classifiedRate: 28, displayRate: 56 }],
  },

  // ── Marathi ────────────────────────────────────────────────────────────────
  {
    newspaper: 'Maharashtra Times',
    editions: [
      // maharashtratimes.releasemyad.com tariff (per 5 lines ÷ 40 words → per word)
      { city: 'Mumbai',     classifiedRate:  9, displayRate: 18 },
      { city: 'Pune',       classifiedRate: 56, displayRate: 112 },
      { city: 'Nagpur',     classifiedRate:  3, displayRate:   6 },
      { city: 'Nashik',     classifiedRate:  5, displayRate:  10 },
      { city: 'Aurangabad', classifiedRate:  3, displayRate:   6 },
    ],
  },
  {
    newspaper: 'Lokmat',
    editions: [
      { city: 'Pune',       classifiedRate: 35, displayRate:  70 },
      { city: 'Mumbai',     classifiedRate: 40, displayRate:  80 },
      { city: 'Nashik',     classifiedRate: 25, displayRate:  50 },
      { city: 'Nagpur',     classifiedRate: 28, displayRate:  56 },
      { city: 'Aurangabad', classifiedRate: 22, displayRate:  44 },
      { city: 'Kolhapur',   classifiedRate: 20, displayRate:  40 },
    ],
  },
  {
    newspaper: 'Sakal',
    editions: [
      { city: 'Pune',     classifiedRate: 32, displayRate: 64 },
      { city: 'Mumbai',   classifiedRate: 35, displayRate: 70 },
      { city: 'Nashik',   classifiedRate: 22, displayRate: 44 },
      { city: 'Kolhapur', classifiedRate: 18, displayRate: 36 },
    ],
  },
  {
    newspaper: 'Pudhari',
    editions: [
      { city: 'Kolhapur', classifiedRate: 20, displayRate: 40 },
      { city: 'Pune',     classifiedRate: 22, displayRate: 44 },
    ],
  },
  {
    newspaper: 'Loksatta',
    editions: [
      { city: 'Mumbai', classifiedRate: 28, displayRate: 56 },
      { city: 'Pune',   classifiedRate: 25, displayRate: 50 },
      { city: 'Nagpur', classifiedRate: 20, displayRate: 40 },
    ],
  },

  // ── Gujarati ───────────────────────────────────────────────────────────────
  {
    newspaper: 'Gujarat Samachar',
    editions: [
      // gujaratsamachar.releasemyad.com tariff (per 10 words → per word)
      { city: 'Ahmedabad', classifiedRate: 40, displayRate: 80 },
      { city: 'Surat',     classifiedRate: 21, displayRate: 42 },
      { city: 'Vadodara',  classifiedRate: 18, displayRate: 36 },
      { city: 'Rajkot',    classifiedRate: 18, displayRate: 36 },
    ],
  },
  {
    newspaper: 'Sandesh',
    editions: [
      { city: 'Ahmedabad', classifiedRate: 35, displayRate: 70 },
      { city: 'Surat',     classifiedRate: 18, displayRate: 36 },
      { city: 'Vadodara',  classifiedRate: 16, displayRate: 32 },
      { city: 'Rajkot',    classifiedRate: 16, displayRate: 32 },
    ],
  },
  {
    newspaper: 'Divya Bhaskar',
    editions: [
      { city: 'Ahmedabad', classifiedRate: 38, displayRate: 76 },
      { city: 'Surat',     classifiedRate: 20, displayRate: 40 },
      { city: 'Vadodara',  classifiedRate: 18, displayRate: 36 },
      { city: 'Rajkot',    classifiedRate: 18, displayRate: 36 },
    ],
  },
  {
    newspaper: 'Nav Gujarat Samay',
    editions: [{ city: 'Ahmedabad', classifiedRate: 22, displayRate: 44 }],
  },

  // ── Tamil ──────────────────────────────────────────────────────────────────
  {
    newspaper: 'Daily Thanthi',
    editions: [
      { city: 'Chennai',    classifiedRate: 28, displayRate: 56 },
      { city: 'Coimbatore', classifiedRate: 22, displayRate: 44 },
      { city: 'Madurai',    classifiedRate: 20, displayRate: 40 },
      { city: 'Salem',      classifiedRate: 18, displayRate: 36 },
    ],
  },
  {
    newspaper: 'Dinamalar',
    editions: [
      { city: 'Chennai',     classifiedRate: 25, displayRate: 50 },
      { city: 'Coimbatore',  classifiedRate: 20, displayRate: 40 },
      { city: 'Madurai',     classifiedRate: 18, displayRate: 36 },
      { city: 'Tirunelveli', classifiedRate: 15, displayRate: 30 },
    ],
  },
  {
    newspaper: 'Dinamani',
    editions: [
      { city: 'Chennai', classifiedRate: 22, displayRate: 44 },
      { city: 'Madurai', classifiedRate: 16, displayRate: 32 },
    ],
  },
  {
    newspaper: 'Dinakaran',
    editions: [
      { city: 'Chennai',    classifiedRate: 20, displayRate: 40 },
      { city: 'Coimbatore', classifiedRate: 14, displayRate: 28 },
    ],
  },

  // ── Telugu ─────────────────────────────────────────────────────────────────
  {
    newspaper: 'Eenadu',
    editions: [
      // eenadu.releasemyad.com tariff (per line; pricingUnit in DB is 'word' → divide by 8)
      { city: 'Hyderabad',     classifiedRate: 37, displayRate:  74 },
      { city: 'Visakhapatnam', classifiedRate: 13, displayRate:  26 },
      { city: 'Vijayawada',    classifiedRate: 11, displayRate:  22 },
      { city: 'Tirupati',      classifiedRate:  8, displayRate:  16 },
    ],
  },
  {
    newspaper: 'Andhra Jyothy',
    editions: [
      { city: 'Hyderabad',     classifiedRate: 18, displayRate: 36 },
      { city: 'Vijayawada',    classifiedRate: 14, displayRate: 28 },
      { city: 'Visakhapatnam', classifiedRate: 13, displayRate: 26 },
    ],
  },
  {
    newspaper: 'Sakshi',
    editions: [
      { city: 'Hyderabad',  classifiedRate: 16, displayRate: 32 },
      { city: 'Vijayawada', classifiedRate: 12, displayRate: 24 },
    ],
  },
  {
    newspaper: 'Vaartha',
    editions: [{ city: 'Hyderabad', classifiedRate: 14, displayRate: 28 }],
  },

  // ── Kannada ────────────────────────────────────────────────────────────────
  {
    newspaper: 'Vijay Karnataka',
    editions: [
      // vijaykarnataka.releasemyad.com tariff (per 5 lines ÷ 40 words → per word)
      { city: 'Bangalore', classifiedRate: 8, displayRate: 16 },
      { city: 'Hubli',     classifiedRate: 3, displayRate:  6 },
      { city: 'Mangalore', classifiedRate: 2, displayRate:  4 },
      { city: 'Mysore',    classifiedRate: 2, displayRate:  4 },
    ],
  },
  {
    newspaper: 'Prajavani',
    editions: [
      // prajavani.releasemyad.com tariff: Rs.1425 per 15 words → Rs.95 per word (uniform)
      { city: 'Bangalore', classifiedRate: 95, displayRate: 190 },
      { city: 'Mysore',    classifiedRate: 95, displayRate: 190 },
      { city: 'Mangalore', classifiedRate: 95, displayRate: 190 },
    ],
  },
  {
    newspaper: 'Udayavani',
    editions: [
      { city: 'Mangalore', classifiedRate: 20, displayRate: 40 },
      { city: 'Bangalore', classifiedRate: 22, displayRate: 44 },
    ],
  },
  {
    newspaper: 'Kannada Prabha',
    editions: [{ city: 'Bangalore', classifiedRate: 18, displayRate: 36 }],
  },

  // ── Malayalam ──────────────────────────────────────────────────────────────
  {
    newspaper: 'Malayala Manorama',
    editions: [
      // malayalamanorama.releasemyad.com tariff (per 11 words → per word)
      { city: 'Kochi',              classifiedRate: 174, displayRate: 348 },
      { city: 'Thrissur',           classifiedRate: 153, displayRate: 306 },
      { city: 'Kozhikode',          classifiedRate: 153, displayRate: 306 },
      { city: 'Thiruvananthapuram', classifiedRate: 153, displayRate: 306 },
      { city: 'Delhi',              classifiedRate:  82, displayRate: 164 },
      { city: 'Mumbai',             classifiedRate:  82, displayRate: 164 },
    ],
  },
  {
    newspaper: 'Mathrubhumi',
    editions: [
      { city: 'Thiruvananthapuram', classifiedRate: 140, displayRate: 280 },
      { city: 'Kochi',              classifiedRate: 155, displayRate: 310 },
      { city: 'Kozhikode',          classifiedRate: 140, displayRate: 280 },
      { city: 'Thrissur',           classifiedRate: 140, displayRate: 280 },
    ],
  },
  {
    newspaper: 'Kerala Kaumudi',
    editions: [
      { city: 'Thiruvananthapuram', classifiedRate: 80, displayRate: 160 },
      { city: 'Kochi',              classifiedRate: 90, displayRate: 180 },
    ],
  },
  {
    newspaper: 'Deepika',
    editions: [
      { city: 'Kochi',              classifiedRate: 70, displayRate: 140 },
      { city: 'Thiruvananthapuram', classifiedRate: 65, displayRate: 130 },
    ],
  },

  // ── Odia ───────────────────────────────────────────────────────────────────
  {
    newspaper: 'Sambad',
    editions: [
      { city: 'Bhubaneswar', classifiedRate: 22, displayRate: 44 },
      { city: 'Cuttack',     classifiedRate: 18, displayRate: 36 },
    ],
  },
  {
    newspaper: 'Samaja',
    editions: [{ city: 'Bhubaneswar', classifiedRate: 18, displayRate: 36 }],
  },

  // ── Urdu ───────────────────────────────────────────────────────────────────
  {
    newspaper: 'Siasat Daily',
    editions: [{ city: 'Hyderabad', classifiedRate: 25, displayRate: 50 }],
  },
  {
    newspaper: 'Inquilab',
    editions: [
      { city: 'Mumbai', classifiedRate: 28, displayRate: 56 },
      { city: 'Delhi',  classifiedRate: 30, displayRate: 60 },
    ],
  },
];

// Packages for all newspapers — standard buy-get and combo packages mirroring releasemyad.com
const PACKAGES_DATA: { newspaper: string; packages: { name: string; description: string; price: number; pricingType: string; packageType: string; buyQuantity?: number; getQuantity?: number; categoryName?: string }[] }[] = [
  // ── English Nationals ──────────────────────────────────────────────────────
  {
    newspaper: 'Times of India',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions get 1 free for matrimonial ads (Sunday edition)', price: 1200, pricingType: 'per_line', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Matrimonial 3+3 Free', description: 'Book 3 insertions get 3 free — Sunday matrimonial special', price: 1200, pricingType: 'per_line', packageType: 'buy_get', buyQuantity: 3, getQuantity: 3, categoryName: 'Matrimonial' },
      { name: 'Property 6+2 Free', description: 'Book 6 insertions and get 2 free for property ads', price: 1200, pricingType: 'per_line', packageType: 'buy_get', buyQuantity: 6, getQuantity: 2, categoryName: 'Property' },
      { name: 'Recruitment 3+1 Free', description: 'Book 3 insertions and get 1 free for recruitment ads', price: 1200, pricingType: 'per_line', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Recruitment & Jobs' },
      { name: '7-Day Combo Package', description: '7 consecutive day insertions at a discounted rate', price: 1000, pricingType: 'per_line', packageType: 'standard' },
    ],
  },
  {
    newspaper: 'Hindustan Times',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions and get 1 free for matrimonial ads', price: 900, pricingType: 'per_line', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Property 5+1 Free', description: 'Book 5 insertions and get 1 free for property ads', price: 900, pricingType: 'per_line', packageType: 'buy_get', buyQuantity: 5, getQuantity: 1, categoryName: 'Property' },
      { name: 'Recruitment 3+1 Free', description: 'Book 3 insertions get 1 free for recruitment ads', price: 900, pricingType: 'per_line', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Recruitment & Jobs' },
      { name: '7-Day Package', description: '7 consecutive day insertions at a special rate', price: 800, pricingType: 'per_line', packageType: 'standard' },
    ],
  },
  {
    newspaper: 'The Hindu',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 700, pricingType: 'per_line', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Property 5+1 Free', description: 'Book 5 insertions, get 1 free for property ads', price: 700, pricingType: 'per_line', packageType: 'buy_get', buyQuantity: 5, getQuantity: 1, categoryName: 'Property' },
      { name: 'Recruitment 3+1 Free', description: 'Book 3 insertions, get 1 free for recruitment ads', price: 700, pricingType: 'per_line', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Recruitment & Jobs' },
    ],
  },
  {
    newspaper: 'The Indian Express',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 750, pricingType: 'per_line', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Property 5+1 Free', description: 'Book 5 insertions, get 1 free for property ads', price: 750, pricingType: 'per_line', packageType: 'buy_get', buyQuantity: 5, getQuantity: 1, categoryName: 'Property' },
      { name: 'Recruitment 3+1 Free', description: 'Book 3 insertions, get 1 free for recruitment ads', price: 750, pricingType: 'per_line', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Recruitment & Jobs' },
    ],
  },
  {
    newspaper: 'Economic Times',
    packages: [
      { name: 'Recruitment 3+1 Free', description: 'Book 3 insertions, get 1 free for recruitment ads', price: 850, pricingType: 'per_line', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Recruitment & Jobs' },
      { name: '7-Day Package', description: '7 consecutive day insertions', price: 800, pricingType: 'per_line', packageType: 'standard' },
    ],
  },
  {
    newspaper: 'Business Standard',
    packages: [
      { name: 'Recruitment 3+1 Free', description: 'Book 3 insertions, get 1 free for recruitment ads', price: 800, pricingType: 'per_line', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Recruitment & Jobs' },
    ],
  },
  {
    newspaper: 'Financial Express',
    packages: [
      { name: 'Recruitment 3+1 Free', description: 'Book 3 insertions, get 1 free for recruitment ads', price: 750, pricingType: 'per_line', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Recruitment & Jobs' },
    ],
  },
  {
    newspaper: 'Deccan Herald',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 500, pricingType: 'per_line', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Property 5+1 Free', description: 'Book 5 insertions, get 1 free', price: 500, pricingType: 'per_line', packageType: 'buy_get', buyQuantity: 5, getQuantity: 1, categoryName: 'Property' },
    ],
  },
  {
    newspaper: 'Deccan Chronicle',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 450, pricingType: 'per_line', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
    ],
  },
  {
    newspaper: 'The Telegraph',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 450, pricingType: 'per_line', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
    ],
  },
  {
    newspaper: 'Mid-Day',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 600, pricingType: 'per_line', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
    ],
  },
  // ── Hindi Nationals ────────────────────────────────────────────────────────
  {
    newspaper: 'Dainik Jagran',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions and get 1 free', price: 100, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Property 5+1 Free', description: 'Book 5 insertions, get 1 free for property ads', price: 100, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 5, getQuantity: 1, categoryName: 'Property' },
      { name: 'Recruitment 5+2 Free', description: 'Book 5 insertions, get 2 free for recruitment ads', price: 100, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 5, getQuantity: 2, categoryName: 'Recruitment & Jobs' },
    ],
  },
  {
    newspaper: 'Dainik Bhaskar',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions and get 1 free', price: 90, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Property 5+1 Free', description: 'Book 5 insertions, get 1 free', price: 90, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 5, getQuantity: 1, categoryName: 'Property' },
      { name: 'Recruitment 3+1 Free', description: 'Book 3 insertions, get 1 free for recruitment ads', price: 90, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Recruitment & Jobs' },
    ],
  },
  {
    newspaper: 'Amar Ujala',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions and get 1 free', price: 80, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Property 5+1 Free', description: 'Book 5 insertions, get 1 free', price: 80, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 5, getQuantity: 1, categoryName: 'Property' },
    ],
  },
  {
    newspaper: 'Navbharat Times',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions and get 1 free', price: 85, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
    ],
  },
  {
    newspaper: 'Hindustan (Hindi)',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions and get 1 free', price: 75, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
    ],
  },
  {
    newspaper: 'Rajasthan Patrika',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions and get 1 free', price: 65, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Property 5+1 Free', description: 'Book 5 insertions, get 1 free', price: 65, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 5, getQuantity: 1, categoryName: 'Property' },
    ],
  },
  {
    newspaper: 'Prabhat Khabar',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions and get 1 free', price: 60, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
    ],
  },
  // ── Punjabi ────────────────────────────────────────────────────────────────
  {
    newspaper: 'Punjab Kesari',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions and get 1 free', price: 60, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Property 5+1 Free', description: 'Book 5 insertions, get 1 free', price: 60, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 5, getQuantity: 1, categoryName: 'Property' },
      { name: 'Recruitment 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 60, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Recruitment & Jobs' },
    ],
  },
  {
    newspaper: 'Punjabi Tribune',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions and get 1 free', price: 55, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
    ],
  },
  {
    newspaper: 'The Tribune',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions and get 1 free', price: 48, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Property 5+1 Free', description: 'Book 5 insertions, get 1 free', price: 48, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 5, getQuantity: 1, categoryName: 'Property' },
      { name: 'Recruitment 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 48, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Recruitment & Jobs' },
      { name: 'Obituary 2+1 Free', description: 'Book 2 insertions, get 1 free for obituary/memorial ads', price: 48, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 2, getQuantity: 1, categoryName: 'Obituary & Memorial' },
    ],
  },
  {
    newspaper: 'Dainik Tribune',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions and get 1 free', price: 60, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Property 5+1 Free', description: 'Book 5 insertions, get 1 free', price: 60, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 5, getQuantity: 1, categoryName: 'Property' },
      { name: 'Recruitment 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 60, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Recruitment & Jobs' },
    ],
  },
  {
    newspaper: 'Jagbani',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions and get 1 free', price: 45, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
    ],
  },
  // ── Bengali ────────────────────────────────────────────────────────────────
  {
    newspaper: 'Anandabazar Patrika',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions and get 1 free', price: 70, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Property 5+1 Free', description: 'Book 5 insertions, get 1 free', price: 70, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 5, getQuantity: 1, categoryName: 'Property' },
    ],
  },
  {
    newspaper: 'Ei Samay',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions and get 1 free', price: 60, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
    ],
  },
  // ── Marathi ────────────────────────────────────────────────────────────────
  {
    newspaper: 'Maharashtra Times',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions and get 1 free', price: 70, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Property 5+1 Free', description: 'Book 5 insertions, get 1 free', price: 70, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 5, getQuantity: 1, categoryName: 'Property' },
    ],
  },
  {
    newspaper: 'Lokmat',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions and get 1 free', price: 65, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Property 5+1 Free', description: 'Book 5 insertions, get 1 free', price: 65, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 5, getQuantity: 1, categoryName: 'Property' },
    ],
  },
  {
    newspaper: 'Sakal',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions and get 1 free', price: 60, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
    ],
  },
  // ── Gujarati ───────────────────────────────────────────────────────────────
  {
    newspaper: 'Gujarat Samachar',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions and get 1 free', price: 65, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Property 5+1 Free', description: 'Book 5 insertions, get 1 free', price: 65, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 5, getQuantity: 1, categoryName: 'Property' },
    ],
  },
  {
    newspaper: 'Sandesh',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions and get 1 free', price: 60, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
    ],
  },
  {
    newspaper: 'Divya Bhaskar',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions and get 1 free', price: 70, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Property 5+1 Free', description: 'Book 5 insertions, get 1 free', price: 70, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 5, getQuantity: 1, categoryName: 'Property' },
    ],
  },
  // ── Tamil ──────────────────────────────────────────────────────────────────
  {
    newspaper: 'Daily Thanthi',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions and get 1 free', price: 55, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
    ],
  },
  {
    newspaper: 'Dinamalar',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions and get 1 free', price: 50, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
    ],
  },
  // ── Telugu ─────────────────────────────────────────────────────────────────
  {
    newspaper: 'Eenadu',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions and get 1 free', price: 55, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Recruitment 3+1 Free', description: 'Book 3 insertions, get 1 free for recruitment ads', price: 55, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Recruitment & Jobs' },
    ],
  },
  {
    newspaper: 'Andhra Jyothy',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions and get 1 free', price: 45, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
    ],
  },
  // ── Kannada ────────────────────────────────────────────────────────────────
  {
    newspaper: 'Vijay Karnataka',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions and get 1 free', price: 50, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
    ],
  },
  {
    newspaper: 'Prajavani',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions and get 1 free', price: 45, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
    ],
  },
  // ── Malayalam ──────────────────────────────────────────────────────────────
  {
    newspaper: 'Malayala Manorama',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions and get 1 free', price: 55, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Property 5+1 Free', description: 'Book 5 insertions, get 1 free', price: 55, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 5, getQuantity: 1, categoryName: 'Property' },
    ],
  },
  {
    newspaper: 'Mathrubhumi',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions and get 1 free', price: 50, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
    ],
  },
  // ── English Business / Smaller Dailies ────────────────────────────────────
  {
    newspaper: 'The Business Line',
    packages: [
      { name: 'Recruitment 3+1 Free', description: 'Book 3 insertions, get 1 free for recruitment ads', price: 700, pricingType: 'per_line', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Recruitment & Jobs' },
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 700, pricingType: 'per_line', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
    ],
  },
  {
    newspaper: 'Mint',
    packages: [
      { name: 'Recruitment 3+1 Free', description: 'Book 3 insertions, get 1 free for recruitment ads', price: 750, pricingType: 'per_line', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Recruitment & Jobs' },
      { name: '7-Day Package', description: '7 consecutive day insertions at a special rate', price: 700, pricingType: 'per_line', packageType: 'standard' },
    ],
  },
  {
    newspaper: 'New Indian Express',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 500, pricingType: 'per_line', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Property 5+1 Free', description: 'Book 5 insertions, get 1 free for property ads', price: 500, pricingType: 'per_line', packageType: 'buy_get', buyQuantity: 5, getQuantity: 1, categoryName: 'Property' },
      { name: 'Recruitment 3+1 Free', description: 'Book 3 insertions, get 1 free for recruitment ads', price: 500, pricingType: 'per_line', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Recruitment & Jobs' },
    ],
  },
  {
    newspaper: 'The Pioneer',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 400, pricingType: 'per_line', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Recruitment 3+1 Free', description: 'Book 3 insertions, get 1 free for recruitment ads', price: 400, pricingType: 'per_line', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Recruitment & Jobs' },
    ],
  },
  {
    newspaper: 'The Statesman',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 400, pricingType: 'per_line', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Recruitment 3+1 Free', description: 'Book 3 insertions, get 1 free for recruitment ads', price: 400, pricingType: 'per_line', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Recruitment & Jobs' },
    ],
  },
  {
    newspaper: 'Mumbai Mirror',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 550, pricingType: 'per_line', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Property 5+1 Free', description: 'Book 5 insertions, get 1 free for property ads', price: 550, pricingType: 'per_line', packageType: 'buy_get', buyQuantity: 5, getQuantity: 1, categoryName: 'Property' },
    ],
  },
  // ── Hindi Regional ────────────────────────────────────────────────────────
  {
    newspaper: 'Nai Dunia',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 55, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Property 5+1 Free', description: 'Book 5 insertions, get 1 free', price: 55, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 5, getQuantity: 1, categoryName: 'Property' },
    ],
  },
  // ── Punjabi ───────────────────────────────────────────────────────────────
  {
    newspaper: 'Punjabi Jagran',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 50, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Property 5+1 Free', description: 'Book 5 insertions, get 1 free', price: 50, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 5, getQuantity: 1, categoryName: 'Property' },
    ],
  },
  // ── Bengali ───────────────────────────────────────────────────────────────
  {
    newspaper: 'Bartaman',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 50, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Property 5+1 Free', description: 'Book 5 insertions, get 1 free', price: 50, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 5, getQuantity: 1, categoryName: 'Property' },
    ],
  },
  {
    newspaper: 'Aajkaal',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 45, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
    ],
  },
  // ── Marathi ───────────────────────────────────────────────────────────────
  {
    newspaper: 'Pudhari',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 45, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Property 5+1 Free', description: 'Book 5 insertions, get 1 free', price: 45, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 5, getQuantity: 1, categoryName: 'Property' },
    ],
  },
  {
    newspaper: 'Loksatta',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 50, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Property 5+1 Free', description: 'Book 5 insertions, get 1 free', price: 50, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 5, getQuantity: 1, categoryName: 'Property' },
    ],
  },
  // ── Gujarati ──────────────────────────────────────────────────────────────
  {
    newspaper: 'Nav Gujarat Samay',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 45, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Property 5+1 Free', description: 'Book 5 insertions, get 1 free', price: 45, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 5, getQuantity: 1, categoryName: 'Property' },
    ],
  },
  // ── Tamil ─────────────────────────────────────────────────────────────────
  {
    newspaper: 'Dinamani',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 45, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
    ],
  },
  {
    newspaper: 'Dinakaran',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 40, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
    ],
  },
  // ── Telugu ────────────────────────────────────────────────────────────────
  {
    newspaper: 'Sakshi',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 55, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Property 5+1 Free', description: 'Book 5 insertions, get 1 free', price: 55, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 5, getQuantity: 1, categoryName: 'Property' },
      { name: 'Recruitment 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 55, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Recruitment & Jobs' },
    ],
  },
  {
    newspaper: 'Vaartha',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 45, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
    ],
  },
  // ── Kannada ───────────────────────────────────────────────────────────────
  {
    newspaper: 'Udayavani',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 55, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Property 5+1 Free', description: 'Book 5 insertions, get 1 free', price: 55, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 5, getQuantity: 1, categoryName: 'Property' },
    ],
  },
  {
    newspaper: 'Kannada Prabha',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 45, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Recruitment 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 45, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Recruitment & Jobs' },
    ],
  },
  // ── Malayalam ─────────────────────────────────────────────────────────────
  {
    newspaper: 'Kerala Kaumudi',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 55, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Property 5+1 Free', description: 'Book 5 insertions, get 1 free', price: 55, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 5, getQuantity: 1, categoryName: 'Property' },
    ],
  },
  {
    newspaper: 'Deepika',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 45, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
    ],
  },
  // ── Odia ──────────────────────────────────────────────────────────────────
  {
    newspaper: 'Sambad',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 45, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Property 5+1 Free', description: 'Book 5 insertions, get 1 free', price: 45, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 5, getQuantity: 1, categoryName: 'Property' },
    ],
  },
  {
    newspaper: 'Samaja',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 40, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
    ],
  },
  // ── Urdu ──────────────────────────────────────────────────────────────────
  {
    newspaper: 'Siasat Daily',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 40, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
    ],
  },
  {
    newspaper: 'Inquilab',
    packages: [
      { name: 'Matrimonial 3+1 Free', description: 'Book 3 insertions, get 1 free', price: 45, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 3, getQuantity: 1, categoryName: 'Matrimonial' },
      { name: 'Property 5+1 Free', description: 'Book 5 insertions, get 1 free', price: 45, pricingType: 'per_word', packageType: 'buy_get', buyQuantity: 5, getQuantity: 1, categoryName: 'Property' },
    ],
  },
];

async function seedSubcategories() {
  // Find a "Classified Text Ad" adType to attach new categories to
  const allAdTypes = await db.select().from(adTypes);
  const ctAdType = allAdTypes.find(a => a.name === 'Classified Text Ad');
  if (!ctAdType) {
    console.log('  No "Classified Text Ad" adType found. Skipping subcategories.');
    return;
  }

  // Build a name → category map (use last occurrence so new seeded cats win)
  const allCats = await db.select().from(categories);
  const catMap = new Map<string, string>(); // name → id
  for (const cat of allCats) {
    catMap.set(cat.name, cat.id);  // last wins
  }

  // Ensure all target categories exist, creating missing ones
  for (const catName of Object.keys(SUBCATEGORY_DATA)) {
    if (!catMap.has(catName)) {
      const newCatId = uid();
      await db.insert(categories).values({ id: newCatId, adTypeId: ctAdType.id, name: catName, active: true });
      catMap.set(catName, newCatId);
      console.log(`  Created missing category: ${catName}`);
    }
  }

  // Check which categories already have subcategories
  const existingSubs = await db.select().from(subcategories);
  const catIdsWithSubs = new Set(existingSubs.map(s => s.categoryId));

  let subCount = 0;
  let classCount = 0;

  for (const [catName, subList] of Object.entries(SUBCATEGORY_DATA)) {
    const catId = catMap.get(catName);
    if (!catId) continue;

    // Skip if this category already has subcategories
    if (catIdsWithSubs.has(catId)) continue;

    for (const sub of subList) {
      const subId = uid();
      await db.insert(subcategories).values({ id: subId, categoryId: catId, name: sub.name, active: true });
      subCount++;

      if (sub.classifications && sub.classifications.length > 0) {
        for (const clf of sub.classifications) {
          const clfId = uid();
          await db.insert(preferredClassifications).values({ id: clfId, subcategoryId: subId, name: clf, active: true });
          classCount++;
        }
      }
    }
  }

  console.log(`  Created ${subCount} subcategories and ${classCount} preferred classifications.`);
}

// Edition combo packages (bundled multi-city deals).
// totalPrice = sum of per-edition base rates × 5 (English, per 5 lines)
//              or × 25 (Hindi/regional, per 25 words).
const EDITION_COMBOS_DATA: {
  newspaper: string;
  combos: { name: string; description: string; editions: string[]; totalPrice: number }[];
}[] = [
  {
    newspaper: 'Times of India',
    combos: [
      { name: 'National Selection (All Editions)', description: 'Advertise across all Times of India editions nationwide', editions: ['Delhi','Mumbai','Kolkata','Chennai','Bangalore','Hyderabad','Ahmedabad','Pune','Surat','Jaipur','Lucknow','Chandigarh','Bhopal','Indore','Nagpur','Kochi','Patna','Ranchi','Coimbatore','Mysore','Nashik','Aurangabad','Goa','Mangalore','Kanpur','Dehradun','Varanasi'], totalPrice: 12395 },
      { name: 'Metro Plus (6 Cities)', description: 'Delhi + Mumbai + Kolkata + Chennai + Bangalore + Hyderabad', editions: ['Delhi','Mumbai','Kolkata','Chennai','Bangalore','Hyderabad'], totalPrice: 5490 },
      { name: 'North India Combo', description: 'Delhi + Lucknow + Chandigarh + Jaipur + Kanpur + Dehradun + Varanasi', editions: ['Delhi','Lucknow','Chandigarh','Jaipur','Kanpur','Dehradun','Varanasi'], totalPrice: 3330 },
      { name: 'South India Combo', description: 'Chennai + Bangalore + Hyderabad + Kochi + Coimbatore', editions: ['Chennai','Bangalore','Hyderabad','Kochi','Coimbatore'], totalPrice: 3465 },
      { name: 'West India Combo', description: 'Mumbai + Pune + Ahmedabad + Surat + Goa', editions: ['Mumbai','Pune','Ahmedabad','Surat','Goa'], totalPrice: 2655 },
      { name: 'Maharashtra Combo', description: 'Mumbai + Pune + Nagpur + Nashik + Aurangabad', editions: ['Mumbai','Pune','Nagpur','Nashik','Aurangabad'], totalPrice: 1850 },
      { name: 'Karnataka Combo', description: 'Bangalore + Mysore + Mangalore', editions: ['Bangalore','Mysore','Mangalore'], totalPrice: 1215 },
      { name: 'East India Combo', description: 'Kolkata + Patna + Ranchi', editions: ['Kolkata','Patna','Ranchi'], totalPrice: 1595 },
      { name: 'Delhi + Mumbai', description: 'Top 2 metro editions', editions: ['Delhi','Mumbai'], totalPrice: 1950 },
      { name: 'Delhi + Mumbai + Bangalore', description: 'Top 3 metro & tech-hub editions', editions: ['Delhi','Mumbai','Bangalore'], totalPrice: 2790 },
    ],
  },
  {
    newspaper: 'Hindustan Times',
    combos: [
      { name: 'National Selection (All Editions)', description: 'All Hindustan Times editions nationwide', editions: ['Delhi','Mumbai','Chandigarh','Lucknow','Kolkata','Patna','Ranchi','Bhopal'], totalPrice: 4375 },
      { name: 'Metro Combo', description: 'Delhi + Mumbai + Kolkata', editions: ['Delhi','Mumbai','Kolkata'], totalPrice: 2400 },
      { name: 'North India Combo', description: 'Delhi + Lucknow + Chandigarh + Bhopal', editions: ['Delhi','Lucknow','Chandigarh','Bhopal'], totalPrice: 2475 },
    ],
  },
  {
    newspaper: 'The Hindu',
    combos: [
      { name: 'National Selection (All Editions)', description: 'All The Hindu editions nationwide', editions: ['Chennai','Bangalore','Hyderabad','Delhi','Mumbai','Kochi','Coimbatore','Madurai','Thiruvananthapuram'], totalPrice: 5500 },
      { name: 'South India Combo', description: 'Chennai + Bangalore + Hyderabad + Kochi', editions: ['Chennai','Bangalore','Hyderabad','Kochi'], totalPrice: 2700 },
      { name: 'Tamil Nadu Combo', description: 'Chennai + Coimbatore + Madurai', editions: ['Chennai','Coimbatore','Madurai'], totalPrice: 1650 },
    ],
  },
  {
    newspaper: 'Economic Times',
    combos: [
      { name: 'National Selection (All Editions)', description: 'All Economic Times editions', editions: ['Delhi','Mumbai','Kolkata','Chennai','Bangalore','Ahmedabad'], totalPrice: 4250 },
      { name: 'Metro Combo', description: 'Delhi + Mumbai + Kolkata', editions: ['Delhi','Mumbai','Kolkata'], totalPrice: 2250 },
    ],
  },
  {
    newspaper: 'Dainik Jagran',
    combos: [
      { name: 'National Selection (All Editions)', description: 'All Dainik Jagran editions', editions: ['Delhi','Lucknow','Kanpur','Varanasi','Meerut','Patna','Agra','Allahabad','Chandigarh','Jalandhar','Ranchi','Dehradun','Bhopal'], totalPrice: 8500 },
      { name: 'UP Combo', description: 'Delhi + Lucknow + Kanpur + Varanasi + Meerut + Agra + Allahabad', editions: ['Delhi','Lucknow','Kanpur','Varanasi','Meerut','Agra','Allahabad'], totalPrice: 4350 },
      { name: 'Punjab & Haryana Combo', description: 'Chandigarh + Jalandhar', editions: ['Chandigarh','Jalandhar'], totalPrice: 675 },
    ],
  },
  {
    newspaper: 'Dainik Bhaskar',
    combos: [
      { name: 'National Selection (All Editions)', description: 'All Dainik Bhaskar editions', editions: ['Jaipur','Indore','Bhopal','Chandigarh','Delhi','Raipur','Ranchi','Patna','Jodhpur','Nagpur','Surat','Ahmedabad','Mumbai'], totalPrice: 12500 },
      { name: 'MP + Rajasthan Combo', description: 'Indore + Bhopal + Jaipur + Jodhpur', editions: ['Indore','Bhopal','Jaipur','Jodhpur'], totalPrice: 7750 },
      { name: 'Gujarat Combo', description: 'Ahmedabad + Surat', editions: ['Ahmedabad','Surat'], totalPrice: 1250 },
    ],
  },
  {
    newspaper: 'Amar Ujala',
    combos: [
      { name: 'National Selection (All Editions)', description: 'All Amar Ujala editions', editions: ['Agra','Meerut','Lucknow','Kanpur','Dehradun','Chandigarh','Jalandhar','Delhi'], totalPrice: 5500 },
      { name: 'UP Combo', description: 'Agra + Meerut + Lucknow + Kanpur', editions: ['Agra','Meerut','Lucknow','Kanpur'], totalPrice: 4450 },
    ],
  },
  {
    newspaper: 'Rajasthan Patrika',
    combos: [
      { name: 'Rajasthan Selection (All Editions)', description: 'All Rajasthan Patrika editions', editions: ['Jaipur','Jodhpur','Kota','Udaipur','Bikaner','Delhi'], totalPrice: 9375 },
      { name: 'Rajasthan Combo', description: 'Jaipur + Jodhpur + Kota + Udaipur + Bikaner', editions: ['Jaipur','Jodhpur','Kota','Udaipur','Bikaner'], totalPrice: 8125 },
    ],
  },
  {
    newspaper: 'Punjab Kesari',
    combos: [
      { name: 'Punjab & Delhi Combo', description: 'Delhi + Chandigarh + Jalandhar + Ludhiana + Amritsar', editions: ['Delhi','Chandigarh','Jalandhar','Ludhiana','Amritsar'], totalPrice: 4375 },
    ],
  },
  {
    newspaper: 'Malayala Manorama',
    combos: [
      { name: 'Kerala Selection (All Editions)', description: 'All Kerala editions of Malayala Manorama', editions: ['Kochi','Kottayam','Kozhikode','Thiruvananthapuram','Thrissur'], totalPrice: 33750 },
      { name: 'North + Central Kerala', description: 'Kozhikode + Thrissur + Kochi', editions: ['Kozhikode','Thrissur','Kochi'], totalPrice: 12000 },
    ],
  },
  {
    newspaper: 'Prajavani',
    combos: [
      { name: 'Karnataka Selection', description: 'All Prajavani editions', editions: ['Bangalore','Mangalore','Mysore'], totalPrice: 7125 },
    ],
  },
  {
    newspaper: 'Vijay Karnataka',
    combos: [
      { name: 'Karnataka Selection', description: 'All Vijay Karnataka editions', editions: ['Bangalore','Hubli','Mangalore','Mysore'], totalPrice: 375 },
    ],
  },
  {
    newspaper: 'Lokmat',
    combos: [
      { name: 'Maharashtra Selection', description: 'All Lokmat editions', editions: ['Mumbai','Pune','Nagpur','Aurangabad'], totalPrice: 2250 },
    ],
  },
  {
    newspaper: 'Gujarat Samachar',
    combos: [
      { name: 'Gujarat Selection', description: 'All Gujarat Samachar editions', editions: ['Ahmedabad','Rajkot','Vadodara'], totalPrice: 1975 },
    ],
  },
];

async function refreshEditionCombos() {
  const allNps = await db.select().from(newspapers);
  const npMap = new Map(allNps.map(n => [n.name, n.id]));

  // Clear existing combos
  const existingCombos = await db.select({ id: editionCombos.id }).from(editionCombos);
  if (existingCombos.length > 0) {
    const ids = existingCombos.map(c => c.id);
    await db.delete(editionComboEditions).where(inArray(editionComboEditions.comboId, ids));
    await db.delete(editionCombos).where(inArray(editionCombos.id, ids));
    console.log(`  Cleared ${ids.length} existing edition combos.`);
  }

  let comboCount = 0;
  let editionLinkCount = 0;
  for (const npData of EDITION_COMBOS_DATA) {
    const npId = npMap.get(npData.newspaper);
    if (!npId) { console.log(`  Newspaper not found: ${npData.newspaper}`); continue; }

    // Get all editions for this newspaper
    const npEditions = await db.select().from(editions).where(eq(editions.newspaperId, npId));
    const editionMap = new Map(npEditions.map(e => [e.editionName, e.id]));

    for (const combo of npData.combos) {
      const comboId = uid();
      await db.insert(editionCombos).values({
        id: comboId, newspaperId: npId, name: combo.name,
        description: combo.description, totalPrice: combo.totalPrice, active: true,
      });
      for (const city of combo.editions) {
        const edId = editionMap.get(city);
        if (!edId) { console.log(`  Edition not found for combo: ${city} in ${npData.newspaper}`); continue; }
        await db.insert(editionComboEditions).values({ id: uid(), comboId, editionId: edId });
        editionLinkCount++;
      }
      comboCount++;
    }
  }
  console.log(`  Created ${comboCount} combos with ${editionLinkCount} edition links across ${EDITION_COMBOS_DATA.length} newspapers.`);
}

async function refreshEditions() {
  // Fix known edition name mismatches from older seed data
  const renames: { npName: string; oldName: string; newName: string }[] = [
    { npName: 'Hindustan Times', oldName: 'Delhi NCR', newName: 'Delhi' },
    { npName: 'Dainik Jagran',   oldName: 'Delhi NCR', newName: 'Delhi' },
  ];
  let renamed = 0;
  for (const fix of renames) {
    const npRows = await db.select().from(newspapers).where(eq(newspapers.name, fix.npName));
    for (const np of npRows) {
      const result = await db.update(editions)
        .set({ editionName: fix.newName })
        .where(and(eq(editions.newspaperId, np.id), eq(editions.editionName, fix.oldName)));
      if ((result as any).rowCount > 0) renamed++;
    }
  }
  if (renamed > 0) console.log(`  Renamed ${renamed} edition(s) to correct names.`);

  // Insert missing editions from NEWSPAPERS_DATA for newspapers that already exist in DB
  let added = 0;
  for (const np of NEWSPAPERS_DATA) {
    if (np.editions.length === 0) continue;
    const npRows = await db.select().from(newspapers).where(eq(newspapers.name, np.name));
    if (npRows.length === 0) continue;
    for (const npRow of npRows) {
      const existing = await db.select({ editionName: editions.editionName })
        .from(editions).where(eq(editions.newspaperId, npRow.id));
      const existingNames = new Set(existing.map(e => e.editionName));
      for (const ed of np.editions) {
        if (!existingNames.has(ed.city)) {
          await db.insert(editions).values({
            id: uid(), newspaperId: npRow.id, editionName: ed.city, state: ed.state, active: true,
          });
          existingNames.add(ed.city);
          added++;
        }
      }
    }
  }
  console.log(`  Added ${added} missing editions across newspapers.`);
}

async function refreshPackages() {
  // Clear existing packages and re-insert all from PACKAGES_DATA
  const existing = await db.select({ id: packages.id }).from(packages);
  if (existing.length > 0) {
    const ids = existing.map(p => p.id);
    await db.delete(packages).where(inArray(packages.id, ids));
    console.log(`  Cleared ${ids.length} existing packages.`);
  }

  const allCats = await db.select().from(categories);
  const catMap = new Map<string, string>();
  for (const cat of allCats) {
    if (!catMap.has(cat.name)) catMap.set(cat.name, cat.id);
  }

  let pkgCount = 0;

  for (const npData of PACKAGES_DATA) {
    const npRows = await db.select().from(newspapers).where(eq(newspapers.name, npData.newspaper));
    if (npRows.length === 0) { console.log(`  Newspaper not found: ${npData.newspaper}`); continue; }
    const npId = npRows[0].id;

    for (const pkg of npData.packages) {
      const catId = pkg.categoryName ? catMap.get(pkg.categoryName) ?? null : null;
      await db.insert(packages).values({
        id: uid(),
        newspaperId: npId,
        categoryId: catId,
        name: pkg.name,
        description: pkg.description,
        price: pkg.price,
        discount: 0,
        pricingType: pkg.pricingType,
        packageType: pkg.packageType,
        buyQuantity: pkg.buyQuantity ?? null,
        getQuantity: pkg.getQuantity ?? null,
        active: true,
      });
      pkgCount++;
    }
  }

  console.log(`  Created ${pkgCount} packages across ${PACKAGES_DATA.length} newspapers.`);
}

async function refreshEditionRates() {
  // Clear all edition-specific rates and re-insert from EDITION_RATES
  const existingEditionRates = await db.select({ id: rates.id }).from(rates).where(isNotNull(rates.editionId));
  if (existingEditionRates.length > 0) {
    const ids = existingEditionRates.map(r => r.id);
    await db.delete(rates).where(inArray(rates.id, ids));
    console.log(`  Cleared ${ids.length} existing edition-specific rates.`);
  }

  let rateCount = 0;

  for (const npData of EDITION_RATES) {
    const npRows = await db.select().from(newspapers).where(eq(newspapers.name, npData.newspaper));
    if (npRows.length === 0) { console.log(`  Newspaper not found: ${npData.newspaper}`); continue; }

    // Find the newspaper record that actually has adTypes (handles duplicate DB entries)
    let np = npRows[0];
    let resolvedAdTypes: { id: string; name: string; newspaperId: string; active: boolean | null }[] = [];
    for (const row of npRows) {
      resolvedAdTypes = await db.select().from(adTypes).where(eq(adTypes.newspaperId, row.id));
      if (resolvedAdTypes.some(a => a.name === 'Classified Text Ad')) { np = row; break; }
    }
    // If any required ad types are missing, create them now
    const missingTypes: { id: string; newspaperId: string; name: string; active: boolean }[] = [];
    if (!resolvedAdTypes.some(a => a.name === 'Classified Text Ad'))
      missingTypes.push({ id: uid(), newspaperId: np.id, name: 'Classified Text Ad', active: true });
    if (!resolvedAdTypes.some(a => a.name === 'Classified Display Ad'))
      missingTypes.push({ id: uid(), newspaperId: np.id, name: 'Classified Display Ad', active: true });
    if (!resolvedAdTypes.some(a => a.name === 'Display Ad'))
      missingTypes.push({ id: uid(), newspaperId: np.id, name: 'Display Ad', active: true });
    if (missingTypes.length > 0) {
      await db.insert(adTypes).values(missingTypes);
      resolvedAdTypes = await db.select().from(adTypes).where(eq(adTypes.newspaperId, np.id));
      console.log(`  Created ${missingTypes.length} missing adTypes for: ${npData.newspaper}`);
    }
    const ct = resolvedAdTypes.find(a => a.name === 'Classified Text Ad');
    const cd = resolvedAdTypes.find(a => a.name === 'Classified Display Ad');
    if (!ct || !cd) { console.log(`  Ad types still not found for: ${npData.newspaper}`); continue; }

    const npId = np.id;
    const sizeUnit = np.pricingUnit === 'word' ? 'per_word' : 'per_line';
    const lang = np.language === 'English' ? 'EN' : 'HI';
    const allEditions = await db.select().from(editions).where(eq(editions.newspaperId, npId));

    for (const edData of npData.editions) {
      const edition = allEditions.find(e => e.editionName === edData.city);
      if (!edition) { console.log(`  Edition not found: ${edData.city} in ${npData.newspaper}`); continue; }

      await db.insert(rates).values([
        {
          id: uid(),
          name: `${np.name} ${edData.city} - Classified Text`,
          newspaperId: npId,
          adTypeId: ct.id,
          categoryId: null,
          editionId: edition.id,
          language: lang,
          sizeUnit,
          baseRate: edData.classifiedRate,
          minSize: 1,
          active: true,
        },
        {
          id: uid(),
          name: `${np.name} ${edData.city} - Classified Display`,
          newspaperId: npId,
          adTypeId: cd.id,
          categoryId: null,
          editionId: edition.id,
          language: lang,
          sizeUnit,
          baseRate: edData.displayRate,
          minSize: 1,
          active: true,
        },
      ]);
      rateCount += 2;
    }
  }

  console.log(`  Created ${rateCount} edition-specific rates across ${EDITION_RATES.length} newspapers.`);
}

// Old category names to deactivate (replaced by proper classified ad categories)
const OLD_CATEGORIES_TO_DEACTIVATE = [
  'Jobs', 'Education', 'Services', 'Automobiles', 'Electronics', 'Furniture',
  'Pets', 'Travel', 'Corporate', 'Retail', 'Healthcare', 'Real Estate',
  'Automotive', 'Technology', 'Entertainment', 'Government',
];

async function deactivateOldCategories() {
  const { and: dbAnd } = await import('drizzle-orm');
  let count = 0;
  for (const name of OLD_CATEGORIES_TO_DEACTIVATE) {
    const rows = await db.select().from(categories)
      .where(dbAnd(eq(categories.name, name), eq(categories.active, true)));
    for (const row of rows) {
      await db.update(categories).set({ active: false }).where(eq(categories.id, row.id));
      count++;
    }
  }
  if (count > 0) console.log(`  Deactivated ${count} old/redundant categories.`);
  else console.log('  Old categories already clean.');
}

// Deactivate old newspapers whose "The X" name has a cleaner "X" duplicate from seed
const NEWSPAPER_ALIASES: Record<string, string> = {
  'The Times of India': 'Times of India',
};

async function deactivateDuplicateNewspapers() {
  let count = 0;
  for (const [oldName, newName] of Object.entries(NEWSPAPER_ALIASES)) {
    const newRows = await db.select().from(newspapers).where(eq(newspapers.name, newName));
    if (newRows.length === 0) continue; // new version not seeded, keep old
    const oldRows = await db.select().from(newspapers).where(eq(newspapers.name, oldName));
    for (const row of oldRows) {
      await db.update(newspapers).set({ active: false }).where(eq(newspapers.id, row.id));
      count++;
      console.log(`  Deactivated duplicate: "${oldName}" (keeping "${newName}")`);
    }
  }
  if (count === 0) console.log('  No duplicate newspapers to deactivate.');
}

// Delete all subcategories with any of the given names (across all categories)
async function deleteSubcategoriesByName(names: string[]) {
  const allSubs = await db.select().from(subcategories);
  const toDelete = allSubs.filter(s => names.includes(s.name));
  if (toDelete.length === 0) { console.log('  Nothing to delete.'); return; }
  const subIds = toDelete.map(s => s.id);

  // Get all preferred classifications under these subcategories
  const allPrefClfs = await db.select().from(preferredClassifications).where(inArray(preferredClassifications.subcategoryId, subIds));
  const clfIds = allPrefClfs.map(c => c.id);

  if (clfIds.length > 0) {
    // Null out references in ad_matters before deleting (all columns that may reference these)
    await db.update(adMatters).set({ preferredClassificationId: null }).where(inArray(adMatters.preferredClassificationId, clfIds));
    await db.delete(preferredClassifications).where(inArray(preferredClassifications.id, clfIds));
  }

  // Null out subcategory references in ad_matters
  await db.update(adMatters).set({ subcategoryId: null }).where(inArray(adMatters.subcategoryId, subIds));
  await db.delete(subcategories).where(inArray(subcategories.id, subIds));
  console.log(`  Deleted ${toDelete.length} subcategories (and ${clfIds.length} classifications): ${names.join(', ')}`);
}

// Refresh subcategories for a specific category — deletes ALL subs across every matching category, then re-inserts on the active one
async function refreshCategorySubcategories(catName: string) {
  const allCats = await db.select().from(categories);
  // Find ALL categories with this name (there can be duplicates from old seeds)
  const matchingCats = allCats.filter(c => c.name === catName);
  if (matchingCats.length === 0) { console.log(`  Category "${catName}" not found, skipping refresh.`); return; }

  // Wipe subs from every duplicate
  for (const cat of matchingCats) {
    const existingSubs = await db.select().from(subcategories).where(eq(subcategories.categoryId, cat.id));
    if (existingSubs.length > 0) {
      const subIds = existingSubs.map(s => s.id);
      // Get preferred classifications under these subs
      const allPrefClfs = await db.select().from(preferredClassifications).where(inArray(preferredClassifications.subcategoryId, subIds));
      const clfIds = allPrefClfs.map(c => c.id);
      if (clfIds.length > 0) {
        await db.update(adMatters).set({ preferredClassificationId: null }).where(inArray(adMatters.preferredClassificationId, clfIds));
        await db.delete(preferredClassifications).where(inArray(preferredClassifications.id, clfIds));
      }
      await db.update(adMatters).set({ subcategoryId: null }).where(inArray(adMatters.subcategoryId, subIds));
      await db.delete(subcategories).where(eq(subcategories.categoryId, cat.id));
      console.log(`  Cleared ${existingSubs.length} subcategories from category id=${cat.id} ("${catName}")`);
    }
  }

  // Re-insert only on the active canonical category (prefer active, else first)
  const canonical = matchingCats.find(c => c.active !== false) || matchingCats[0];
  const subList = SUBCATEGORY_DATA[catName];
  if (!subList) { console.log(`  No data for "${catName}" in SUBCATEGORY_DATA.`); return; }

  let subCount = 0;
  let classCount = 0;
  for (const sub of subList) {
    const subId = uid();
    await db.insert(subcategories).values({ id: subId, categoryId: canonical.id, name: sub.name, active: true });
    subCount++;
    if (sub.classifications && sub.classifications.length > 0) {
      for (const clf of sub.classifications) {
        const clfId = uid();
        await db.insert(preferredClassifications).values({ id: clfId, subcategoryId: subId, name: clf, active: true });
        classCount++;
      }
    }
  }
  console.log(`  Inserted ${subCount} subcategories and ${classCount} classifications for "${catName}".`);
}

async function runAllSeeds() {
  console.log('\n[1/9] Newspapers & base data...');
  await seed();

  console.log('\n[2/9] Editions (refresh missing + fix names)...');
  await refreshEditions();

  console.log('\n[3/9] Subcategories & preferred classifications...');
  await seedSubcategories();

  console.log('\n[4/9] Packages (refresh)...');
  await refreshPackages();

  console.log('\n[5/9] Edition-specific rates (refresh)...');
  await refreshEditionRates();

  console.log('\n[6/9] Edition combo packages (refresh)...');
  await refreshEditionCombos();

  console.log('\n[7/9] Deactivating old/irrelevant categories...');
  await deactivateOldCategories();

  console.log('\n[8/9] Deactivating duplicate newspapers...');
  await deactivateDuplicateNewspapers();

  console.log('\n[9/9] Refreshing all subcategories & preferred classifications...');
  await deleteSubcategoriesByName([
    'Hindu Matrimonial', 'Muslim Matrimonial', 'Christian Matrimonial',
    'Sikh Matrimonial', 'Jain Matrimonial', 'Buddhist Matrimonial',
    'Inter-caste Matrimonial', 'Other Matrimonial',
  ]);
  for (const catName of Object.keys(SUBCATEGORY_DATA)) {
    await refreshCategorySubcategories(catName);
  }

  console.log('\nAll done!');
}

runAllSeeds().catch(err => { console.error(err); process.exit(1); }).finally(() => process.exit(0));
