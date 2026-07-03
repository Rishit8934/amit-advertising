import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Newspaper,
  Users,
  MapPin,
  Package,
  FileText,
  Settings,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Star,
  Eye,
  CalendarIcon
} from "lucide-react";
import { format } from "date-fns";

interface Staff {
  id: string;
  username: string;
  role: string;
}

interface Newspaper {
  id: string;
  name: string;
  language: string;
  type: string;
  pricingUnit: string;
  active: boolean;
}

interface AdType {
  id: string;
  newspaperId: string;
  name: string;
  active: boolean;
}

interface Category {
  id: string;
  adTypeId: string;
  name: string;
  active: boolean;
}

interface Edition {
  id: string;
  newspaperId: string;
  editionName: string;
  state: string;
}

interface City {
  id: string;
  name: string;
  state: string;
}

interface Package {
  id: string;
  newspaperId: string;
  categoryId?: string;
  name: string;
  description?: string;
  price: number;
  pricingType: string;
  discount: number;
  active: boolean;
  expiryDate?: Date | null;
  minSize?: number;
  maxSize?: number;
  packageType?: string;
  buyQuantity?: number;
  getQuantity?: number;
}

interface Rate {
  id: string;
  newspaperId: string;
  adTypeId: string;
  categoryId?: string;
  language: string;
  sizeUnit: string;
  baseRate: number;
  fixedRate?: number;
  exactSize?: number;
  minSize?: number;
  maxSize?: number;
  editionId?: string;
  cityId?: string;
  notes?: string;
  name?: string;
  readOnly?: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Booking {
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
  publishDates: string[];
  pricing: {
    baseRate: number;
    estimatedTotal: number;
  };
  status: "draft" | "submitted" | "approved" | "published";
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function StaffDashboard() {
  const [location, setLocation] = useLocation();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [activeTab, setActiveTab] = useState<string>("bookings");
  const [newspapers, setNewspapers] = useState<Newspaper[]>([]);
  const [adTypes, setAdTypes] = useState<AdType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [editions, setEditions] = useState<Edition[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [adEnchantments, setAdEnchantments] = useState<any[]>([]);
  const [newspaperEnchantmentRates, setNewspaperEnchantmentRates] = useState<any[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [recentLogins, setRecentLogins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewspaperDialog, setShowNewspaperDialog] = useState(false);
  const [editingNewspaper, setEditingNewspaper] = useState<Newspaper | null>(null);
  const [newspaperForm, setNewspaperForm] = useState({
    name: "",
    language: [] as string[],
    type: "National",
    pricingUnit: "line"
  });
  const [selectedNewspaper, setSelectedNewspaper] = useState<string>("");
  const [selectedAdType, setSelectedAdType] = useState<string>("");
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    adTypeId: ""
  });
  const [showSubcategoryDialog, setShowSubcategoryDialog] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<any | null>(null);
  const [subcategoryForm, setSubcategoryForm] = useState({
    name: "",
    categoryId: ""
  });
  const [showEditionDialog, setShowEditionDialog] = useState(false);
  const [editingEdition, setEditingEdition] = useState<Edition | null>(null);
  const [editionForm, setEditionForm] = useState({
    newspaperId: "",
    editionName: "",
    state: ""
  });
  const [showPackageDialog, setShowPackageDialog] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [packageForm, setPackageForm] = useState({
    newspaperId: "",
    name: "",
    description: "",
    price: "",
    pricingType: "per_line",
    discount: "",
    categoryId: "",
    minSize: "",
    maxSize: "",
    packageType: "standard",
    buyQuantity: "",
    getQuantity: ""
  });
  const [showRateDialog, setShowRateDialog] = useState(false);
  const [editingRate, setEditingRate] = useState<Rate | null>(null);
  const [rateForm, setRateForm] = useState<{
    name: string;
    newspaperId: string;
    adTypeId: string;
    categoryId: string;
    language: string;
    sizeUnit: string;
    baseRate: string;
    fixedRate: string;
    exactSize: string;
    minSize: string;
    maxSize: string;
    editionId: string;
    cityId: string;
    notes: string;
    readOnly: boolean;
  }>({
    name: "",
    newspaperId: "",
    adTypeId: "",
    categoryId: "all",
    language: "EN",
    sizeUnit: "per_line",
    baseRate: "",
    fixedRate: "",
    exactSize: "",
    minSize: "",
    maxSize: "",
    editionId: "all",
    cityId: "all",
    notes: "",
    readOnly: false
  });
  const [managingNewspaper, setManagingNewspaper] = useState<Newspaper | null>(null);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [showEnchantmentRateDialog, setShowEnchantmentRateDialog] = useState(false);
  const [editingEnchantmentRate, setEditingEnchantmentRate] = useState<any | null>(null);
  const [inlineEditingRate, setInlineEditingRate] = useState<string | null>(null);
  const [inlineEditingPrice, setInlineEditingPrice] = useState("");
  const [enchantmentRateForm, setEnchantmentRateForm] = useState({
    newspaperId: "",
    enchantmentId: "",
    price: ""
  });

  // Role-based access
  const [staffRole, setStaffRole] = useState<string | null>(null);
  const [staffEmail, setStaffEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showEnchantmentDialog, setShowEnchantmentDialog] = useState(false);
  const [editingEnchantment, setEditingEnchantment] = useState<any | null>(null);
  const [enchantmentForm, setEnchantmentForm] = useState({ name: "", description: "", icon: "", previewHtml: "", price: "" });
  const [adTypeForm, setAdTypeForm] = useState({
    name: ""
  });
  const [bills, setBills] = useState<any[]>([]);
  const [billSearch, setBillSearch] = useState("");
  const [bookingSearch, setBookingSearch] = useState("");
  const [excelExporting, setExcelExporting] = useState(false);
  const [showBillDialog, setShowBillDialog] = useState(false);
  const [showBillViewerDialog, setShowBillViewerDialog] = useState(false);
  const [viewingBillId, setViewingBillId] = useState<string | null>(null);
  const [showManualROViewDialog, setShowManualROViewDialog] = useState(false);
  const [viewingManualRO, setViewingManualRO] = useState<any | null>(null);
  const [clientSuggestions, setClientSuggestions] = useState<any[]>([]);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [newspaperSuggestions, setNewspaperSuggestions] = useState<any[]>([]);
  const [showNewspaperSuggestions, setShowNewspaperSuggestions] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingBill, setEditingBill] = useState<any | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [manualROs, setManualROs] = useState<any[]>([]);
  const [showManualRODialog, setShowManualRODialog] = useState(false);
  const [editingManualRO, setEditingManualRO] = useState<any | null>(null);
  const [manualROForm, setManualROForm] = useState({
    roNumber: "",
    newspaperId: "",
    clientName: "",
    clientPhone: "",
    clientAddress: "",
    amount: "",
    publishDates: [] as Date[],
    description: "",
    roStatus: "pending",
    // RO Edit fields
    edition: "",
    city: "",
    category: "",
    subcategory: "",
    classification: "",
    adContent: "",
    baseRate: "",
    enchantmentTotal: "",
    gstAmount: "",
    grandTotal: "",
    paymentDetails: "",
    remarks: ""
  });
  interface BillItem {
    id: string;
    publication: string;
    publishDates: Date[];
    size: string;
    words: string;
    totalSpace: string;
    rate: number;
    extraPositionPercentage: number;
    packageOffer?: string;
  }

  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [currentBillItem, setCurrentBillItem] = useState<Partial<BillItem>>({
    publication: "",
    publishDates: [],
    size: "",
    words: "",
    totalSpace: "",
    rate: undefined,
    extraPositionPercentage: 0,
    packageOffer: "",
  });

  const [newBill, setNewBill] = useState({
    clientName: "",
    clientNumber: "",
    clientAddress: "",
    clientGST: "",
    clientState: "Haryana",
    billDate: "",
    discount: "",
    totalAmount: "",
    cgst: "",
    sgst: "",
    igst: "",
    grandTotal: ""
  });

  // Calculate taxes based on bill items
  const calculateTaxes = useCallback(() => {
    let subtotal = 0;

    // Calculate total amount from all items (including multiple dates)
    billItems.forEach(item => {
      subtotal += calculateItemAmount(item);
    });

    // Apply discount
    const discountPercentage = parseFloat(newBill.discount) || 0;
    const discountAmount = (subtotal * discountPercentage) / 100;
    const totalAmount = subtotal - discountAmount;

    if (totalAmount > 0) {
      if (newBill.clientState === "Haryana") {
        const cgst = totalAmount * 0.025;
        const sgst = totalAmount * 0.025;
        const grandTotal = totalAmount + cgst + sgst;
        setNewBill(prev => ({
          ...prev,
          totalAmount: totalAmount.toFixed(2),
          cgst: cgst.toFixed(2),
          sgst: sgst.toFixed(2),
          igst: "",
          grandTotal: grandTotal.toFixed(2)
        }));
      } else {
        const igst = totalAmount * 0.05;
        const grandTotal = totalAmount + igst;
        setNewBill(prev => ({
          ...prev,
          totalAmount: totalAmount.toFixed(2),
          cgst: "",
          sgst: "",
          igst: igst.toFixed(2),
          grandTotal: grandTotal.toFixed(2)
        }));
      }
    } else {
      setNewBill(prev => ({
        ...prev,
        totalAmount: "0",
        cgst: "",
        sgst: "",
        igst: "",
        grandTotal: "0"
      }));
    }
  }, [billItems, newBill.clientState, newBill.discount]);

  const formatPublishDatesForExport = (dates: any) => {
    if (!dates) return "";
    if (typeof dates === 'string') {
      try {
        dates = JSON.parse(dates);
      } catch {
        return dates;
      }
    }
    if (Array.isArray(dates)) {
      return dates.map((d: any) => {
        if (typeof d === 'string') {
          const dateValue = new Date(d);
          return isNaN(dateValue.getTime()) ? d : dateValue.toLocaleDateString('en-IN');
        }
        return d;
      }).join('; ');
    }
    return String(dates);
  };

  const exportBillsAsExcel = async () => {
    if (excelExporting) return;
    setExcelExporting(true);

    const escapeCsvValue = (value: any) => {
      const text = value === null || value === undefined ? '' : String(value);
      return `"${text.replace(/"/g, '""')}"`;
    };

    const parseBillItems = (items: any) => {
      if (!items) return [];
      if (typeof items === 'string') {
        try {
          const parsed = JSON.parse(items);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return Array.isArray(items) ? items : [];
    };

    try {
      const rows: string[][] = [
        [
          'Bill Number',
          'Bill Date',
          'Client Name',
          'Client Address',
          'GSTIN',
          'State',
          'Discount %',
          'Total Amount (₹)',
          'CGST (₹)',
          'SGST (₹)',
          'IGST (₹)',
          'Grand Total (₹)',
          'Items'
        ]
      ];

      bills.forEach((bill) => {
        const billDate = bill.billDate ? formatPublishDatesForExport(bill.billDate) : '';
        const items = parseBillItems(bill.items);
        const itemDetails = items.map((item: any) => {
          const publication = item.publication || item.publicationName || item.description || '';
          const dates = formatPublishDatesForExport(item.publishDates);
          const size = item.size || '';
          const totalSpace = item.totalSpace || '';
          const rate = item.rate || '';
          const packageOffer = item.packageOffer || '';
          const extra = item.extraPositionPercentage ?? item.extraPosition ?? 0;
          const amount = (item.amount || 0) / 100;
          return `${publication} [${dates}] ${size} ${totalSpace} Rate:${rate} Package:${packageOffer} Extra:${extra}% Amount:₹${amount.toFixed(2)}`;
        }).join(' | ');

        rows.push([
          bill.billNumber || bill.id || '',
          billDate,
          bill.clientName || '',
          bill.clientAddress || '',
          bill.clientGST || '',
          bill.clientState || '',
          bill.discount != null ? String(bill.discount) : '',
          ((bill.totalAmount || 0) / 100).toFixed(2),
          ((bill.cgst || 0) / 100).toFixed(2),
          ((bill.sgst || 0) / 100).toFixed(2),
          ((bill.igst || 0) / 100).toFixed(2),
          ((bill.grandTotal || bill.totalAmount || 0) / 100).toFixed(2),
          itemDetails,
        ]);
      });

      const csvContent = rows.map((row) => row.map(escapeCsvValue).join(',')).join('\r\n');
      const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'AmitAdvertising_Bills.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export bill sheet:', error);
      alert('Failed to export Excel sheet. Please try again.');
    } finally {
      setExcelExporting(false);
    }
  };

  // Handle client name input and fetch suggestions
  const handleClientNameChange = async (value: string) => {
    setNewBill(prev => ({ ...prev, clientName: value }));
    
    if (value.length > 1) {
      try {
        const response = await fetch(`/api/staff/bills/suggestions?search=${encodeURIComponent(value)}`, {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
          },
        });
        if (response.ok) {
          const suggestions = await response.json();
          setClientSuggestions(suggestions);
          setShowClientSuggestions(true);
        }
      } catch (error) {
        console.error("Error fetching client suggestions:", error);
      }
    } else {
      setShowClientSuggestions(false);
    }
  };

  // Handle client selection from suggestions
  const handleSelectClient = (client: any) => {
    setNewBill(prev => ({
      ...prev,
      clientName: client.clientName,
      clientNumber: client.clientNumber,
      clientAddress: client.clientAddress,
      clientGST: client.clientGST,
      clientState: client.clientState
    }));
    setShowClientSuggestions(false);
  };

  // Handle newspaper name change and show suggestions
  const handleNewspaperNameChange = (value: string) => {
    setCurrentBillItem({...currentBillItem, publication: value});

    if (value.length > 0) {
      const suggestions = newspapers
        .filter(newspaper => newspaper.name.toLowerCase().startsWith(value.toLowerCase()))
        .slice(0, 10);
      setNewspaperSuggestions(suggestions);
      setShowNewspaperSuggestions(suggestions.length > 0);
    } else {
      const suggestions = newspapers.slice(0, 10);
      setNewspaperSuggestions(suggestions);
      setShowNewspaperSuggestions(suggestions.length > 0);
    }
  };

  const handlePublicationFocus = () => {
    if (!(currentBillItem.publication || '').trim()) {
      const suggestions = newspapers.slice(0, 10);
      setNewspaperSuggestions(suggestions);
      setShowNewspaperSuggestions(suggestions.length > 0);
    }
  };

  const handlePublicationKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Tab" && showNewspaperSuggestions && newspaperSuggestions.length > 0) {
      event.preventDefault();
      handleSelectNewspaper(newspaperSuggestions[0]);
    }
  };

  // Handle newspaper selection from suggestions
  const handleSelectNewspaper = (newspaper: any) => {
    setCurrentBillItem({...currentBillItem, publication: newspaper.name});
    setShowNewspaperSuggestions(false);
  };

  // Handle editing a bill item
  const handleEditBillItem = (itemId: string) => {
    const item = billItems.find(item => item.id === itemId);
    if (item) {
      setCurrentBillItem({
        publication: item.publication,
        publishDates: item.publishDates,
        size: item.size,
        words: item.words,
        totalSpace: item.totalSpace,
        rate: item.rate,
        extraPositionPercentage: item.extraPositionPercentage,
        packageOffer: item.packageOffer,
      });
      setEditingItemId(itemId);
    }
  };

  // Handle updating a bill item
  const handleUpdateBillItem = () => {
    if (!currentBillItem.publication || !currentBillItem.rate) {
      alert("Please fill publication and rate fields");
      return;
    }

    const updatedItems = billItems.map(item =>
      item.id === editingItemId
        ? {
            ...item,
            publication: currentBillItem.publication || "",
            publishDates: currentBillItem.publishDates || [],
            size: currentBillItem.size || "",
            words: currentBillItem.words || "",
            totalSpace: currentBillItem.totalSpace || "",
            rate: currentBillItem.rate || 0,
            extraPositionPercentage: currentBillItem.extraPositionPercentage || 0,
            packageOffer: currentBillItem.packageOffer || "",
          }
        : item
    );

    setBillItems(updatedItems);
    setCurrentBillItem({
      publication: "",
      publishDates: [],
      size: "",
      words: "",
      totalSpace: "",
      rate: undefined,
      extraPositionPercentage: 0,
      packageOffer: "",
    });
    setEditingItemId(null);
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setCurrentBillItem({
      publication: "",
      publishDates: [],
      size: "",
      totalSpace: "",
      rate: undefined,
      extraPositionPercentage: 0,
      packageOffer: "",
    });
    setEditingItemId(null);
  };

  // Add item to bill
  const handleAddBillItem = () => {
    if (!currentBillItem.publication || !currentBillItem.rate) {
      alert("Please fill publication and rate fields");
      return;
    }
    const newItem: BillItem = {
      id: Math.random().toString(),
      publication: currentBillItem.publication || "",
      publishDates: currentBillItem.publishDates || [],
      size: currentBillItem.size || "",
      words: currentBillItem.words || "",
      totalSpace: currentBillItem.totalSpace || "",
      rate: currentBillItem.rate || 0,
      extraPositionPercentage: currentBillItem.extraPositionPercentage || 0,
      packageOffer: currentBillItem.packageOffer || "",
    };
    setBillItems([...billItems, newItem]);
    setCurrentBillItem({
      publication: "",
      publishDates: [],
      size: "",
      words: "",
      totalSpace: "",
      rate: undefined,
      extraPositionPercentage: 0,
      packageOffer: "",
    });
  };

  // Remove item from bill
  const handleRemoveBillItem = (itemId: string) => {
    setBillItems(billItems.filter(item => item.id !== itemId));
  };

  const parseWordsValue = (wordsValue: string): number => {
    if (!wordsValue || !wordsValue.trim()) {
      return 1;
    }

    const cleaned = wordsValue.trim();
    const parts = cleaned.split("+").map(part => part.trim()).filter(Boolean);
    if (parts.length > 1) {
      let sum = 0;
      for (const part of parts) {
        const num = parseFloat(part);
        if (Number.isFinite(num)) {
          sum += num;
        } else {
          return parseFloat(cleaned) || 1;
        }
      }
      return sum || 1;
    }

    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 1;
  };

  // Calculate item amount
  const calculateItemAmount = (item: BillItem) => {
    // Parse size field - can be like "5x3" or just "5"
    let sizeMultiplier = 1;
    if (item.size) {
      const sizeMatch = item.size.toLowerCase().match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/);
      if (sizeMatch) {
        // If format is like "5x3", multiply the numbers
        sizeMultiplier = parseFloat(sizeMatch[1]) * parseFloat(sizeMatch[2]);
      } else {
        // If it's just a single number, use it directly
        sizeMultiplier = parseFloat(item.size) || 1;
      }
    }

    // Parse words field, handling additive entries like "15+16+17"
    const wordsMultiplier = item.words ? parseWordsValue(item.words) : 1;

    // Calculate base amount using both size and words
    const baseAmount = sizeMultiplier * wordsMultiplier * item.rate;
    const extraAmount = (baseAmount * item.extraPositionPercentage) / 100;
    const singleDayAmount = baseAmount + extraAmount;
    const days = item.publishDates?.length || 1;

    if (item.packageOffer) {
      const match = item.packageOffer.trim().match(/^(\d+)\s*\+\s*(\d+)$/);
      if (match) {
        const paidDays = parseInt(match[1], 10);
        const freeDays = parseInt(match[2], 10);
        const cycle = paidDays + freeDays;
        if (paidDays > 0 && cycle > 0) {
          const fullCycles = Math.floor(days / cycle);
          const remainder = days % cycle;
          const remainderPaid = Math.min(remainder, paidDays);
          const billableDays = fullCycles * paidDays + remainderPaid;
          return singleDayAmount * billableDays;
        }
      }
    }

    return singleDayAmount * days;
  };

  // Calculate taxes when bill items, state, or discount changes
  useEffect(() => {
    calculateTaxes();
  }, [calculateTaxes]);

  useEffect(() => {
    setLoading(true);
    checkAuth();
  }, []);

  useEffect(() => {
    if (staff) {
      setLoading(false);
      loadData();
      fetchBookings();
      const interval = setInterval(fetchBookings, 60000);
      return () => clearInterval(interval);
    }
  }, [staff]);

  useEffect(() => {
    const query = new URLSearchParams(location.split("?")[1] || "");
    const tab = query.get("tab");
    if (tab) {
      setActiveTab(tab);
    } else {
      setActiveTab(isAdmin ? "newspapers" : "bookings");
    }
  }, [location, isAdmin]);

  const updateTab = (tab: string) => {
    setActiveTab(tab);
    setLocation(`/staff?tab=${encodeURIComponent(tab)}`);
  };

  const checkAuth = async () => {
    const token = localStorage.getItem("staffSessionToken");
    const staffData = localStorage.getItem("staff");

    if (!token || !staffData) {
      // Don't update state, just redirect - will return null from component
      setLocation("/stafflogin");
      return;
    }

    try {
      const parsed = JSON.parse(staffData);
      setStaff(parsed);
      setStaffRole(parsed.role || null);
      setStaffEmail(parsed.username || null);
      const admin = parsed.role === "admin";
      setIsAdmin(admin);
      console.log("Staff loaded:", parsed, "isAdmin:", admin);
    } catch (e) {
      console.error("Failed to parse staff:", e);
      setLocation("/stafflogin");
    }
  };

  const loadData = async () => {
    try {
      // Load critical data first (for immediate UI)
      const [newspapersRes, adTypesRes, categoriesRes, subcategoriesRes, editionsRes, citiesRes, packagesRes, ratesRes] = await Promise.all([
        fetch("/api/staff/newspapers", {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
          },
        }),
        fetch("/api/staff/ad-types", {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
          },
        }),
        fetch("/api/staff/categories", {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
          },
        }),
        fetch("/api/staff/subcategories", {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
          },
        }),
        fetch("/api/staff/editions", {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
          },
        }),
        fetch("/api/staff/cities", {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
          },
        }),
        fetch("/api/staff/packages", {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
          },
        }),
        fetch("/api/staff/rates", {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
          },
        })
      ]);

      // Check for authentication errors in critical data
      const criticalResponses = [newspapersRes, adTypesRes, categoriesRes, subcategoriesRes, editionsRes, citiesRes, packagesRes, ratesRes];
      const hasAuthError = criticalResponses.some(res => res.status === 401);

      if (hasAuthError) {
        // Clear invalid tokens and redirect to login
        localStorage.removeItem("staffSessionToken");
        localStorage.removeItem("staff");
        setLocation("/stafflogin");
        return;
      }

      // Process critical data
      if (newspapersRes.ok) {
        try {
          const data = await newspapersRes.json();
          setNewspapers(Array.isArray(data) ? data : []);
        } catch (e) {
          console.error("Failed to parse newspapers:", e);
          setNewspapers([]);
        }
      } else {
        console.error("Failed to load newspapers:", newspapersRes.status);
        setNewspapers([]);
      }

      if (adTypesRes.ok) {
        try {
          const data = await adTypesRes.json();
          setAdTypes(Array.isArray(data) ? data : []);
        } catch (e) {
          console.error("Failed to parse ad types:", e);
          setAdTypes([]);
        }
      } else {
        console.error("Failed to load ad types:", adTypesRes.status);
        setAdTypes([]);
      }

      if (categoriesRes.ok) {
        try {
          const data = await categoriesRes.json();
          const categoriesArray = Array.isArray(data) ? data : [];
          setCategories(categoriesArray.filter((category, index, array) =>
            category.id && array.findIndex(item => item.id === category.id) === index
          ));
        } catch (e) {
          console.error("Failed to parse categories:", e);
          setCategories([]);
        }
      } else {
        console.error("Failed to load categories:", categoriesRes.status);
        setCategories([]);
      }

      if (subcategoriesRes.ok) {
        try {
          const data = await subcategoriesRes.json();
          setSubcategories(Array.isArray(data) ? data : []);
        } catch (e) {
          console.error("Failed to parse subcategories:", e);
          setSubcategories([]);
        }
      } else {
        console.error("Failed to load subcategories:", subcategoriesRes.status);
        setSubcategories([]);
      }

      if (editionsRes.ok) {
        try {
          const data = await editionsRes.json();
          setEditions(Array.isArray(data) ? data : []);
        } catch (e) {
          console.error("Failed to parse editions:", e);
          setEditions([]);
        }
      } else {
        console.error("Failed to load editions:", editionsRes.status);
        setEditions([]);
      }

      if (citiesRes.ok) {
        try {
          const data = await citiesRes.json();
          setCities(Array.isArray(data) ? data : []);
        } catch (e) {
          console.error("Failed to parse cities:", e);
          setCities([]);
        }
      } else {
        console.error("Failed to load cities:", citiesRes.status);
        setCities([]);
      }

      if (packagesRes.ok) {
        try {
          const data = await packagesRes.json();
          setPackages(Array.isArray(data) ? data : []);
        } catch (e) {
          console.error("Failed to parse packages:", e);
          setPackages([]);
        }
      } else {
        console.error("Failed to load packages:", packagesRes.status);
        setPackages([]);
      }

      if (ratesRes.ok) {
        try {
          const data = await ratesRes.json();
          setRates(Array.isArray(data) ? data : []);
        } catch (e) {
          console.error("Failed to parse rates:", e);
          setRates([]);
        }
      } else {
        console.error("Failed to load rates:", ratesRes.status);
        setRates([]);
      }

      // Set loading to false after critical data is loaded
      setLoading(false);

      // Load non-critical data in background
      setTimeout(async () => {
        console.log('Loading non-critical data...');
        try {
          const [adEnchantmentsRes, newspaperEnchantmentRatesRes, bookingsRes, recentLoginsRes, billsRes, manualROsRes] = await Promise.all([
            fetch("/api/ad-enchantments", {
              headers: {
                "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
              },
            }),
            fetch("/api/staff/newspaper-enchantment-rates", {
              headers: {
                "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
              },
            }),
            fetch("/api/staff/bookings", {
              headers: {
                "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
              },
            }),
            fetch("/api/staff/logins", {
              headers: {
                "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
              },
            }),
            fetch("/api/staff/bills", {
              headers: {
                "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
              },
            }),
            fetch("/api/staff/manual-ros", {
              headers: {
                "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
              },
            })
          ]);

          console.log('Non-critical API responses:', {
            adEnchantments: adEnchantmentsRes.status,
            newspaperEnchantmentRates: newspaperEnchantmentRatesRes.status,
            bookings: bookingsRes.status,
            recentLogins: recentLoginsRes.status,
            bills: billsRes.status,
            manualROs: manualROsRes.status
          });

          if (adEnchantmentsRes.ok) {
            try {
              const data = await adEnchantmentsRes.json();
              setAdEnchantments(Array.isArray(data) ? data : []);
            } catch (e) {
              console.error("Failed to parse ad enchantments:", e);
              setAdEnchantments([]);
            }
          }

          if (newspaperEnchantmentRatesRes.ok) {
            try {
              const data = await newspaperEnchantmentRatesRes.json();
              setNewspaperEnchantmentRates(Array.isArray(data) ? data : []);
            } catch (e) {
              console.error("Failed to parse newspaper enchantment rates:", e);
              setNewspaperEnchantmentRates([]);
            }
          }

          if (bookingsRes.ok) {
            try {
              const data = await bookingsRes.json();
              console.log('Setting bookings, count:', Array.isArray(data) ? data.length : 'not array');
              setBookings(Array.isArray(data) ? data : []);
              setBookingsError(null);
            } catch (e) {
              console.error("Failed to parse bookings:", e);
              setBookings([]);
            }
          } else if (bookingsRes.status === 401 || bookingsRes.status === 403) {
            setBookingsError("session_expired");
          } else {
            setBookingsError("fetch_failed");
          }

          if (recentLoginsRes && recentLoginsRes.ok) {
            try {
              const data = await recentLoginsRes.json();
              console.log('Setting recent logins, count:', Array.isArray(data) ? data.length : 'not array');
              setRecentLogins(Array.isArray(data) ? data : []);
            } catch (e) {
              console.error("Failed to parse recent logins:", e);
              setRecentLogins([]);
            }
          }

          if (billsRes && billsRes.ok) {
            try {
              const data = await billsRes.json();
              console.log('Setting bills, count:', Array.isArray(data) ? data.length : 'not array');
              setBills(Array.isArray(data) ? data : []);
            } catch (e) {
              console.error("Failed to parse bills:", e);
              setBills([]);
            }
          }

          if (manualROsRes && manualROsRes.ok) {
            try {
              const data = await manualROsRes.json();
              console.log('Setting manual ROs, count:', Array.isArray(data) ? data.length : 'not array');
              setManualROs(Array.isArray(data) ? data : []);
            } catch (e) {
              console.error("Failed to parse manual ROs:", e);
              setManualROs([]);
            }
          }
        } catch (error) {
          console.error("Failed to load non-critical data:", error);
        }
      }, 100); // Small delay to ensure UI renders first

    } catch (error) {
      console.error("Failed to load critical data:", error);
      setError("Failed to load dashboard data. Please try again.");
      setLoading(false);
    }
  };

  // Standalone bookings refresh — called on mount and every 60s
  const fetchBookings = async () => {
    const token = localStorage.getItem("staffSessionToken");
    if (!token) return;
    try {
      const res = await fetch("/api/staff/bookings", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(Array.isArray(data) ? data : []);
        setBookingsError(null);
      } else if (res.status === 401 || res.status === 403) {
        setBookingsError("session_expired");
      } else {
        setBookingsError("fetch_failed");
      }
    } catch (e) {
      console.error("fetchBookings error:", e);
    }
  };

  // Safe fetch and parse helper
  const safeFetch = async (url: string, token: string) => {
    try {
      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) {
        console.warn(`API ${url} returned ${res.status}`);
        return null;
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error(`Error fetching ${url}:`, e);
      return [];
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/staff/logout", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
        },
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    localStorage.removeItem("staffSessionToken");
    localStorage.removeItem("staff");
    setLocation("/");
  };

  // Helper functions
  const getAdTypesForNewspaper = (newspaperId: string) => {
    return adTypes.filter(adType => adType.newspaperId === newspaperId);
  };

  const getCategoriesForAdType = (adTypeId: string) => {
    const categoriesForAdType = categories.filter(category => category.adTypeId === adTypeId);
    return categoriesForAdType.filter((category, index, array) =>
      category.id && array.findIndex(item => item.id === category.id) === index
    );
  };

  const getNewspaperName = (newspaperId: string) => {
    const newspaper = newspapers.find(n => n.id === newspaperId);
    return newspaper ? newspaper.name : "Unknown Newspaper";
  };

  const getEditionsForNewspaper = (newspaperId: string) => {
    return editions.filter(edition => edition.newspaperId === newspaperId);
  };

  const getPackagesByNewspaper = (newspaperId: string) => {
    return packages.filter(pkg => pkg.newspaperId === newspaperId);
  };

  const getAdTypeName = (adTypeId: string) => {
    const adType = adTypes.find(at => at.id === adTypeId);
    return adType ? adType.name : "Unknown Ad Type";
  };

  const getSubcategoriesForCategory = (categoryId: string) => {
    return subcategories.filter(subcategory => subcategory.categoryId === categoryId);
  };

  const getEnchantmentRatesForNewspaper = (newspaperId: string) => {
    return newspaperEnchantmentRates.filter(rate => rate.newspaperId === newspaperId);
  };

  const getEnchantmentName = (enchantmentId: string) => {
    const enchantment = adEnchantments.find(e => e.id === enchantmentId);
    return enchantment ? enchantment.name : "Unknown Enchantment";
  };

  const handleCreateNewspaper = async () => {
    try {
      const response = await fetch("/api/staff/newspapers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
        },
        body: JSON.stringify({ ...newspaperForm, language: newspaperForm.language.join(", ") }),
      });

      if (response.ok) {
        const data = await response.json();
        const newNewspaper = data.newspaper || data;
        setNewspapers([...newspapers, newNewspaper]);
        setShowNewspaperDialog(false);
        setNewspaperForm({ name: "", language: [], type: "National", pricingUnit: "line" });
      } else {
        const error = await response.json();
        alert(`Failed to create newspaper: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to create newspaper:", error);
      alert("Failed to create newspaper. Please try again.");
    }
  };

  const handleUpdateNewspaper = async () => {
    if (!editingNewspaper) return;

    try {
      const response = await fetch(`/api/staff/newspapers/${editingNewspaper.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
        },
        body: JSON.stringify({ ...newspaperForm, language: newspaperForm.language.join(", ") }),
      });

      if (response.ok) {
        const updatedNewspaper = await response.json();
        setNewspapers(newspapers.map(n => n.id === editingNewspaper.id ? updatedNewspaper : n));
        setEditingNewspaper(null);
        setNewspaperForm({ name: "", language: [], type: "National", pricingUnit: "line" });
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(errData.error || `Update failed (${response.status}). Please log out and log back in if the issue persists.`);
      }
    } catch (error) {
      console.error("Failed to update newspaper:", error);
      alert("Network error. Please try again.");
    }
  };

  const handleDeleteNewspaper = async (id: string) => {
    if (!confirm("Are you sure you want to delete this newspaper?")) return;

    try {
      const response = await fetch(`/api/staff/newspapers/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
        },
      });

      if (response.ok) {
        setNewspapers(newspapers.filter(n => n.id !== id));
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(response.status === 401 || response.status === 403
          ? "Session expired or insufficient permissions. Please log out and log back in."
          : (errData.error || `Delete failed (${response.status})`));
      }
    } catch (error) {
      console.error("Failed to delete newspaper:", error);
      alert("Network error while deleting. Please try again.");
    }
  };

  const handleManageNewspaper = (newspaper: Newspaper) => {
    setManagingNewspaper(newspaper);
    setShowManageDialog(true);
  };

  const handleCreateAdType = async (newspaperId: string) => {
    if (!adTypeForm.name) return;

    try {
      const response = await fetch("/api/staff/ad-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
        },
        body: JSON.stringify({
          newspaperId,
          name: adTypeForm.name,
          active: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newAdType = data.adType || data;
        setAdTypes([...adTypes, newAdType]);
        setAdTypeForm({ name: "" });
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(errData.error || `Failed to create ad type (${response.status}). Please log out and log back in if the issue persists.`);
      }
    } catch (error) {
      console.error("Failed to create ad type:", error);
      alert("Network error. Please try again.");
    }
  };

  const handleDeleteAdType = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ad type?")) return;

    try {
      const response = await fetch(`/api/staff/ad-types/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
        },
      });

      if (response.ok) {
        setAdTypes(adTypes.filter(adType => adType.id !== id));
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(response.status === 401 || response.status === 403
          ? "Session expired or insufficient permissions. Please log out and log back in."
          : (errData.error || `Delete failed (${response.status})`));
      }
    } catch (error) {
      console.error("Failed to delete ad type:", error);
      alert("Network error while deleting. Please try again.");
    }
  };

  const openEditDialog = (newspaper: Newspaper) => {
    setEditingNewspaper(newspaper);
    setNewspaperForm({
      name: newspaper.name,
      language: newspaper.language ? newspaper.language.split(",").map(l => l.trim()).filter(Boolean) : [],
      type: newspaper.type,
      pricingUnit: newspaper.pricingUnit
    });
  };

  const closeDialog = () => {
    setShowNewspaperDialog(false);
    setEditingNewspaper(null);
    setNewspaperForm({ name: "", language: [], type: "National", pricingUnit: "line" });
  };

  const handleCreateCategory = async () => {
    if (!categoryForm.adTypeId) return;

    try {
      const response = await fetch(`/api/staff/ad-types/${categoryForm.adTypeId}/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
        },
        body: JSON.stringify({ name: categoryForm.name }),
      });

      if (response.ok) {
        const data = await response.json();
        const newCategory = data.category || data;
        setCategories([...categories, newCategory]);
        setShowCategoryDialog(false);
        setCategoryForm({ name: "", adTypeId: "" });
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(errData.error || `Failed to create category (${response.status}). Please log out and log back in if the issue persists.`);
      }
    } catch (error) {
      console.error("Failed to create category:", error);
      alert("Network error. Please try again.");
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    try {
      const response = await fetch(`/api/staff/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
        },
        body: JSON.stringify({ name: categoryForm.name }),
      });

      if (response.ok) {
        const updatedCategory = await response.json();
        setCategories(categories.map(c => c.id === editingCategory.id ? updatedCategory : c));
        setEditingCategory(null);
        setCategoryForm({ name: "", adTypeId: "" });
      }
    } catch (error) {
      console.error("Failed to update category:", error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const response = await fetch(`/api/staff/categories/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
        },
      });

      if (response.ok) {
        setCategories(categories.filter(c => c.id !== id));
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(response.status === 401 || response.status === 403
          ? "Session expired or insufficient permissions. Please log out and log back in."
          : (errData.error || `Delete failed (${response.status})`));
      }
    } catch (error) {
      console.error("Failed to delete category:", error);
      alert("Network error while deleting. Please try again.");
    }
  };

  const openEditCategoryDialog = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      adTypeId: category.adTypeId
    });
  };

  const handleCreateSubcategory = async () => {
    try {
      const response = await fetch("/api/staff/subcategories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
        },
        body: JSON.stringify(subcategoryForm),
      });

      if (response.ok) {
        const data = await response.json();
        const newSubcategory = data.subcategory || data;
        setSubcategories([...subcategories, newSubcategory]);
        setShowSubcategoryDialog(false);
        setSubcategoryForm({ name: "", categoryId: "" });
      }
    } catch (error) {
      console.error("Failed to create subcategory:", error);
    }
  };

  const handleUpdateSubcategory = async () => {
    if (!editingSubcategory) return;

    try {
      const response = await fetch(`/api/staff/subcategories/${editingSubcategory.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
        },
        body: JSON.stringify(subcategoryForm),
      });

      if (response.ok) {
        const updatedSubcategory = await response.json();
        setSubcategories(subcategories.map(s => s.id === editingSubcategory.id ? updatedSubcategory : s));
        setShowSubcategoryDialog(false);
        setEditingSubcategory(null);
        setSubcategoryForm({ name: "", categoryId: "" });
      }
    } catch (error) {
      console.error("Failed to update subcategory:", error);
    }
  };

  const handleDeleteSubcategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subcategory?")) return;

    try {
      const response = await fetch(`/api/staff/subcategories/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
        },
      });

      if (response.ok) {
        setSubcategories(subcategories.filter(s => s.id !== id));
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(response.status === 401 || response.status === 403
          ? "Session expired or insufficient permissions. Please log out and log back in."
          : (errData.error || `Delete failed (${response.status})`));
      }
    } catch (error) {
      console.error("Failed to delete subcategory:", error);
      alert("Network error while deleting. Please try again.");
    }
  };

  const openEditSubcategoryDialog = (subcategory: any) => {
    setEditingSubcategory(subcategory);
    setSubcategoryForm({
      name: subcategory.name,
      categoryId: subcategory.categoryId
    });
  };

  const closeCategoryDialog = () => {
    setShowCategoryDialog(false);
    setEditingCategory(null);
    setCategoryForm({ name: "", adTypeId: "" });
  };

  const closeSubcategoryDialog = () => {
    setShowSubcategoryDialog(false);
    setEditingSubcategory(null);
    setSubcategoryForm({ name: "", categoryId: "" });
  };

  const handleCreateEnchantmentRate = async () => {
    try {
      const response = await fetch("/api/staff/newspaper-enchantment-rates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
        },
        body: JSON.stringify(enchantmentRateForm),
      });

      if (response.ok) {
        const data = await response.json();
        const newRate = data.enchantmentRate || data;
        setNewspaperEnchantmentRates([...newspaperEnchantmentRates, newRate]);
        setShowEnchantmentRateDialog(false);
        setEnchantmentRateForm({ newspaperId: "", enchantmentId: "", price: "" });
      }
    } catch (error) {
      console.error("Failed to create enchantment rate:", error);
    }
  };

  const handleCreateEnchantment = async () => {
    try {
      const response = await fetch('/api/staff/ad-enchantments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('staffSessionToken')}`,
        },
        body: JSON.stringify({
          name: enchantmentForm.name,
          description: enchantmentForm.description || null,
          icon: enchantmentForm.icon || null,
          previewHtml: enchantmentForm.previewHtml || null,
          price: enchantmentForm.price,
          active: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newEnch = data.enchantment || data;
        setAdEnchantments([...adEnchantments, newEnch]);
        setShowEnchantmentDialog(false);
        setEnchantmentForm({ name: '', description: '', icon: '', previewHtml: '', price: '' });
      } else {
        const err = await response.json().catch(() => ({ error: 'Unknown' }));
        alert('Failed to create enchantment: ' + (err.error || 'Unknown'));
      }
    } catch (err) {
      console.error('Failed to create enchantment:', err);
      alert('Failed to create enchantment');
    }
  };

  const handleUpdateEnchantment = async () => {
    if (!editingEnchantment) return;

    try {
      const response = await fetch(`/api/staff/ad-enchantments/${editingEnchantment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('staffSessionToken')}`,
        },
        body: JSON.stringify({
          name: enchantmentForm.name,
          description: enchantmentForm.description || null,
          icon: enchantmentForm.icon || null,
          previewHtml: enchantmentForm.previewHtml || null,
          price: enchantmentForm.price,
          active: true,
        }),
      });

      if (response.ok) {
        const updatedEnch = await response.json();
        setAdEnchantments(adEnchantments.map(e => e.id === editingEnchantment.id ? updatedEnch : e));
        setShowEnchantmentDialog(false);
        setEditingEnchantment(null);
        setEnchantmentForm({ name: '', description: '', icon: '', previewHtml: '', price: '' });
      } else {
        const err = await response.json().catch(() => ({ error: 'Unknown' }));
        alert('Failed to update enchantment: ' + (err.error || 'Unknown'));
      }
    } catch (err) {
      console.error('Failed to update enchantment:', err);
      alert('Failed to update enchantment');
    }
  };

  const handleDeleteEnchantment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this enchantment?')) return;

    try {
      const response = await fetch(`/api/staff/ad-enchantments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('staffSessionToken')}`,
        },
      });

      if (response.ok) {
        setAdEnchantments(adEnchantments.filter(e => e.id !== id));
      } else {
        const err = await response.json().catch(() => ({ error: 'Unknown' }));
        alert('Failed to delete enchantment: ' + (err.error || 'Unknown'));
      }
    } catch (err) {
      console.error('Failed to delete enchantment:', err);
      alert('Failed to delete enchantment');
    }
  };

  const handleUpdateEnchantmentRate = async () => {
    if (!editingEnchantmentRate) return;

    try {
      const response = await fetch(`/api/staff/newspaper-enchantment-rates/${editingEnchantmentRate.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
        },
        body: JSON.stringify(enchantmentRateForm),
      });

      if (response.ok) {
        const updatedRate = await response.json();
        setNewspaperEnchantmentRates(newspaperEnchantmentRates.map(r => r.id === editingEnchantmentRate.id ? updatedRate : r));
        setShowEnchantmentRateDialog(false);
        setEditingEnchantmentRate(null);
        setEnchantmentRateForm({ newspaperId: "", enchantmentId: "", price: "" });
      }
    } catch (error) {
      console.error("Failed to update enchantment rate:", error);
    }
  };

  const handleDeleteEnchantmentRate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this enchantment rate?")) return;

    try {
      const response = await fetch(`/api/staff/newspaper-enchantment-rates/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
        },
      });

      if (response.ok) {
        setNewspaperEnchantmentRates(newspaperEnchantmentRates.filter(r => r.id !== id));
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(response.status === 401 || response.status === 403
          ? "Session expired or insufficient permissions. Please log out and log back in."
          : (errData.error || `Delete failed (${response.status})`));
      }
    } catch (error) {
      console.error("Failed to delete enchantment rate:", error);
      alert("Network error while deleting. Please try again.");
    }
  };

  const openEditEnchantmentRateDialog = (rate: any) => {
    setEditingEnchantmentRate(rate);
    setEnchantmentRateForm({
      newspaperId: rate.newspaperId,
      enchantmentId: rate.enchantmentId,
      price: rate.price.toString()
    });
  };

  const closeEnchantmentRateDialog = () => {
    setShowEnchantmentRateDialog(false);
    setEditingEnchantmentRate(null);
    setEnchantmentRateForm({ newspaperId: "", enchantmentId: "", price: "" });
  };

  const openEditEnchantmentDialog = (enchantment: any) => {
    setEditingEnchantment(enchantment);
    setEnchantmentForm({ name: enchantment.name, description: enchantment.description, icon: enchantment.icon, previewHtml: enchantment.previewHtml, price: "" });
    setShowEnchantmentDialog(true);
  };

  const closeEnchantmentDialog = () => {
    setShowEnchantmentDialog(false);
    setEditingEnchantment(null);
    setEnchantmentForm({ name: "", description: "", icon: "", previewHtml: "", price: "" });
  };

  const startInlineEditing = (rate: any) => {
    setInlineEditingRate(rate.id);
    setInlineEditingPrice(rate.price);
  };

  const saveInlineEditing = async (rateId: string) => {
    try {
      const response = await fetch(`/api/staff/newspaper-enchantment-rates/${rateId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
        },
        body: JSON.stringify({ price: inlineEditingPrice }),
      });

      if (response.ok) {
        const updatedRate = await response.json();
        setNewspaperEnchantmentRates(newspaperEnchantmentRates.map(r => r.id === rateId ? updatedRate : r));
        setInlineEditingRate(null);
        setInlineEditingPrice("");
      }
    } catch (error) {
      console.error("Failed to update enchantment rate:", error);
    }
  };

  const cancelInlineEditing = () => {
    setInlineEditingRate(null);
    setInlineEditingPrice("");
  };

  const handleCreateEdition = async () => {
    const formData = managingNewspaper ? { ...editionForm, newspaperId: managingNewspaper.id } : editionForm;
    if (!formData.newspaperId) return;

    try {
      const response = await fetch("/api/staff/editions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        const newEdition = data.edition || data;
        setEditions([...editions, newEdition]);
        setShowEditionDialog(false);
        setEditionForm({ newspaperId: "", editionName: "", state: "" });
      }
    } catch (error) {
      console.error("Failed to create edition:", error);
    }
  };

  const handleUpdateEdition = async () => {
    if (!editingEdition) return;

    try {
      const response = await fetch(`/api/staff/editions/${editingEdition.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
        },
        body: JSON.stringify(editionForm),
      });

      if (response.ok) {
        const updatedEdition = await response.json();
        setEditions(editions.map(e => e.id === editingEdition.id ? updatedEdition : e));
        setEditingEdition(null);
        setEditionForm({ newspaperId: "", editionName: "", state: "" });
      }
    } catch (error) {
      console.error("Failed to update edition:", error);
    }
  };

  const handleDeleteEdition = async (id: string) => {
    if (!confirm("Are you sure you want to delete this edition?")) return;

    try {
      const response = await fetch(`/api/staff/editions/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
        },
      });

      if (response.ok) {
        setEditions(editions.filter(e => e.id !== id));
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(response.status === 401 || response.status === 403
          ? "Session expired or insufficient permissions. Please log out and log back in."
          : (errData.error || `Delete failed (${response.status})`));
      }
    } catch (error) {
      console.error("Failed to delete edition:", error);
      alert("Network error while deleting. Please try again.");
    }
  };

  const openEditEditionDialog = (edition: Edition) => {
    setEditingEdition(edition);
    setEditionForm({
      newspaperId: edition.newspaperId,
      editionName: edition.editionName,
      state: edition.state
    });
  };

  const closeEditionDialog = () => {
    setShowEditionDialog(false);
    setEditingEdition(null);
    setEditionForm({ newspaperId: "", editionName: "", state: "" });
  };

  const handleCreatePackage = async () => {
    const formData = managingNewspaper ? { ...packageForm, newspaperId: managingNewspaper.id } : packageForm;
    if (!formData.newspaperId || !formData.name || !formData.price) return;

    try {
      const response = await fetch("/api/staff/packages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
        },
        body: JSON.stringify({
          newspaperId: formData.newspaperId,
          categoryId: formData.categoryId === "none" ? undefined : formData.categoryId || undefined,
          name: formData.name,
          description: formData.description || undefined,
          price: parseFloat(formData.price),
          pricingType: formData.pricingType,
          discount: formData.discount ? parseFloat(formData.discount) : 0,
          packageType: formData.packageType,
          buyQuantity: formData.buyQuantity ? parseInt(formData.buyQuantity) : undefined,
          getQuantity: formData.getQuantity ? parseInt(formData.getQuantity) : undefined,
          active: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newPackage = data.package || data;
        setPackages([...packages, newPackage]);
        setShowPackageDialog(false);
        setPackageForm({ newspaperId: "", categoryId: "", name: "", description: "", price: "", pricingType: "per_line", discount: "", minSize: "", maxSize: "", packageType: "standard", buyQuantity: "", getQuantity: "" });
      }
    } catch (error) {
      console.error("Failed to create package:", error);
    }
  };

  const handleUpdatePackage = async () => {
    if (!editingPackage) return;

    try {
      const response = await fetch(`/api/staff/packages/${editingPackage.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
        },
        body: JSON.stringify({
          name: packageForm.name,
          description: packageForm.description || undefined,
          price: parseFloat(packageForm.price),
          pricingType: packageForm.pricingType,
          discount: packageForm.discount ? parseFloat(packageForm.discount) : 0,
          packageType: packageForm.packageType,
          buyQuantity: packageForm.buyQuantity ? parseInt(packageForm.buyQuantity) : undefined,
          getQuantity: packageForm.getQuantity ? parseInt(packageForm.getQuantity) : undefined,
        }),
      });

      if (response.ok) {
        const updatedPackage = await response.json();
        setPackages(packages.map(p => p.id === editingPackage.id ? updatedPackage : p));
        setEditingPackage(null);
        setPackageForm({ newspaperId: "", categoryId: "", name: "", description: "", price: "", pricingType: "per_line", discount: "", minSize: "", maxSize: "", packageType: "standard", buyQuantity: "", getQuantity: "" });
      }
    } catch (error) {
      console.error("Failed to update package:", error);
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this package?")) return;

    try {
      const response = await fetch(`/api/staff/packages/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
        },
      });

      if (response.ok) {
        setPackages(packages.filter(p => p.id !== id));
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(response.status === 401 || response.status === 403
          ? "Session expired or insufficient permissions. Please log out and log back in."
          : (errData.error || `Delete failed (${response.status})`));
      }
    } catch (error) {
      console.error("Failed to delete package:", error);
      alert("Network error while deleting. Please try again.");
    }
  };

  const openEditPackageDialog = (pkg: Package) => {
    setEditingPackage(pkg);
    setPackageForm({
      newspaperId: pkg.newspaperId,
      categoryId: pkg.categoryId || "",
      name: pkg.name,
      description: pkg.description || "",
      price: pkg.price.toString(),
      pricingType: pkg.pricingType,
      discount: pkg.discount.toString(),
      minSize: pkg.minSize?.toString() || "",
      maxSize: pkg.maxSize?.toString() || "",
      packageType: pkg.packageType || "standard",
      buyQuantity: pkg.buyQuantity?.toString() || "",
      getQuantity: pkg.getQuantity?.toString() || "",
    });
  };

  const closePackageDialog = () => {
    setShowPackageDialog(false);
    setEditingPackage(null);
    setPackageForm({ newspaperId: "", categoryId: "", name: "", description: "", price: "", pricingType: "per_line", discount: "", minSize: "", maxSize: "", packageType: "standard", buyQuantity: "", getQuantity: "" });
  };

  const handleCreateRate = async () => {
    if (!rateForm.newspaperId || !rateForm.adTypeId || !rateForm.baseRate) return;

    const baseRateValue = parseFloat(rateForm.baseRate);
    if (isNaN(baseRateValue) || baseRateValue <= 0) {
      alert("Please enter a valid base rate");
      return;
    }

    let fixedRateValue;
    if (rateForm.fixedRate && rateForm.fixedRate.trim()) {
      fixedRateValue = parseFloat(rateForm.fixedRate);
      if (isNaN(fixedRateValue) || fixedRateValue <= 0) {
        alert("Please enter a valid fixed rate");
        return;
      }
    }

    try {
      const response = await fetch("/api/staff/rates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
        },
        body: JSON.stringify({
          newspaperId: rateForm.newspaperId,
          adTypeId: rateForm.adTypeId,
          categoryId: rateForm.categoryId === "all" ? undefined : rateForm.categoryId,
          language: rateForm.language,
          sizeUnit: rateForm.sizeUnit,
          baseRate: baseRateValue,
          fixedRate: fixedRateValue,
          exactSize: rateForm.exactSize && rateForm.exactSize.trim() ? parseInt(rateForm.exactSize) : undefined,
          minSize: rateForm.minSize && rateForm.minSize.trim() ? parseInt(rateForm.minSize) : undefined,
          maxSize: rateForm.maxSize && rateForm.maxSize.trim() ? parseInt(rateForm.maxSize) : undefined,
          editionId: rateForm.editionId === "all" ? undefined : rateForm.editionId,
          cityId: rateForm.cityId === "all" ? undefined : rateForm.cityId,
          notes: rateForm.notes || undefined,
          active: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newRate = data.rate || data;
        setRates([...rates, newRate]);
        setShowRateDialog(false);
        setRateForm({ name: "", newspaperId: "", adTypeId: "", categoryId: "all", language: "EN", sizeUnit: "per_line", baseRate: "", fixedRate: "", exactSize: "", minSize: "", maxSize: "", editionId: "all", cityId: "all", notes: "", readOnly: false });
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        alert(`Failed to create rate: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Failed to create rate:", error);
    }
  };

  const handleUpdateRate = async () => {
    if (!editingRate) return;

    const baseRateValue = parseFloat(rateForm.baseRate);
    if (isNaN(baseRateValue) || baseRateValue <= 0) {
      alert("Please enter a valid base rate");
      return;
    }

    let fixedRateValue;
    if (rateForm.fixedRate && rateForm.fixedRate.trim()) {
      fixedRateValue = parseFloat(rateForm.fixedRate);
      if (isNaN(fixedRateValue) || fixedRateValue <= 0) {
        alert("Please enter a valid fixed rate");
        return;
      }
    }

    try {
      const response = await fetch(`/api/staff/rates/${editingRate.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
        },
        body: JSON.stringify({
          newspaperId: rateForm.newspaperId,
          adTypeId: rateForm.adTypeId,
          categoryId: rateForm.categoryId === "all" ? undefined : rateForm.categoryId,
          language: rateForm.language,
          sizeUnit: rateForm.sizeUnit,
          baseRate: baseRateValue,
          fixedRate: fixedRateValue,
          exactSize: rateForm.exactSize ? parseInt(rateForm.exactSize) : undefined,
          minSize: rateForm.minSize ? parseInt(rateForm.minSize) : undefined,
          maxSize: rateForm.maxSize ? parseInt(rateForm.maxSize) : undefined,
          editionId: rateForm.editionId === "all" ? undefined : rateForm.editionId,
          cityId: rateForm.cityId === "all" ? undefined : rateForm.cityId,
          notes: rateForm.notes || undefined,
        }),
      });

      if (response.ok) {
        const updatedRate = await response.json();
        setRates(rates.map(r => r.id === editingRate.id ? updatedRate : r));
        setEditingRate(null);
        setRateForm({ name: "", newspaperId: "", adTypeId: "", categoryId: "all", language: "EN", sizeUnit: "per_line", baseRate: "", fixedRate: "", exactSize: "", minSize: "", maxSize: "", editionId: "all", cityId: "all", notes: "", readOnly: false });
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        alert(`Failed to update rate: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Failed to update rate:", error);
    }
  };

  const handleDeleteRate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this rate?")) return;

    try {
      const response = await fetch(`/api/staff/rates/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
        },
      });

      if (response.ok) {
        setRates(rates.filter(r => r.id !== id));
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(response.status === 401 || response.status === 403
          ? "Session expired or insufficient permissions. Please log out and log back in."
          : (errData.error || `Delete failed (${response.status})`));
      }
    } catch (error) {
      console.error("Failed to delete rate:", error);
      alert("Network error while deleting. Please try again.");
    }
  };

  const openEditRateDialog = (rate: Rate) => {
    setEditingRate(rate);
    setRateForm({
      name: rate.name || "",
      newspaperId: rate.newspaperId,
      adTypeId: rate.adTypeId,
      categoryId: rate.categoryId || "",
      language: rate.language,
      sizeUnit: rate.sizeUnit,
      baseRate: rate.baseRate?.toString() || "",
      fixedRate: rate.fixedRate?.toString() || "",
      exactSize: rate.exactSize?.toString() || "",
      minSize: rate.minSize?.toString() || "",
      maxSize: rate.maxSize?.toString() || "",
      editionId: rate.editionId || "all",
      cityId: rate.cityId || "all",
      notes: rate.notes || "",
      readOnly: rate.readOnly || false
    });
  };

  const closeRateDialog = () => {
    setShowRateDialog(false);
    setEditingRate(null);
    setRateForm({ name: "", newspaperId: "", adTypeId: "", categoryId: "all", language: "EN", sizeUnit: "per_line", baseRate: "", fixedRate: "", exactSize: "", minSize: "", maxSize: "", editionId: "all", cityId: "all", notes: "", readOnly: false });
  };

  const handleCreateRateForNewspaper = async (newspaperId: string) => {
    if (!rateForm.adTypeId || !rateForm.baseRate) {
      alert("Please fill in all required fields (Ad Type and Base Rate)");
      return;
    }

    const baseRateValue = parseFloat(rateForm.baseRate);
    if (isNaN(baseRateValue) || baseRateValue <= 0) {
      alert("Please enter a valid base rate");
      return;
    }

    let fixedRateValue;
    if (rateForm.fixedRate && rateForm.fixedRate.trim()) {
      fixedRateValue = parseFloat(rateForm.fixedRate);
      if (isNaN(fixedRateValue) || fixedRateValue <= 0) {
        alert("Please enter a valid fixed rate");
        return;
      }
    }

    try {
      const response = await fetch("/api/staff/rates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
        },
        body: JSON.stringify({
          name: rateForm.name || undefined,
          newspaperId,
          adTypeId: rateForm.adTypeId,
          categoryId: rateForm.categoryId === "all" ? undefined : rateForm.categoryId,
          language: rateForm.language,
          sizeUnit: rateForm.sizeUnit,
          baseRate: baseRateValue,
          fixedRate: fixedRateValue,
          exactSize: rateForm.exactSize && rateForm.exactSize.trim() ? parseInt(rateForm.exactSize) : undefined,
          minSize: rateForm.minSize && rateForm.minSize.trim() ? parseInt(rateForm.minSize) : undefined,
          maxSize: rateForm.maxSize && rateForm.maxSize.trim() ? parseInt(rateForm.maxSize) : undefined,
          editionId: rateForm.editionId === "all" ? undefined : rateForm.editionId,
          cityId: rateForm.cityId === "all" ? undefined : rateForm.cityId,
          notes: rateForm.notes || undefined,
          readOnly: rateForm.readOnly || false,
          active: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newRate = data.rate || data;
        setRates([...rates, newRate]);
        setRateForm({ name: "", newspaperId: "", adTypeId: "", categoryId: "all", language: "EN", sizeUnit: "per_line", baseRate: "", fixedRate: "", exactSize: "", minSize: "", maxSize: "", editionId: "all", cityId: "all", notes: "", readOnly: false });
        alert("Rate created successfully!");
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        alert(`Failed to create rate: ${errorData.error || errorData.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to create rate:", error);
      alert(`Failed to create rate: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: Booking['status'], adminNotes?: string) => {
    try {
      const response = await fetch(`/api/staff/bookings/${bookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
        },
        body: JSON.stringify({ status: newStatus, adminNotes }),
      });

      if (response.ok) {
        const updatedBooking = await response.json();
        setBookings(bookings.map(b => b.id === bookingId ? updatedBooking : b));
      }
    } catch (error) {
      console.error("Failed to update booking status:", error);
    }
  };

  const handleCreateBill = async () => {
    if (!newBill.clientName || billItems.length === 0) {
      alert("Please add at least one item to the bill");
      return;
    }

    try {
      console.log('Creating bill with items:', billItems);
      const selectedBillDate = newBill.billDate ? new Date(newBill.billDate) : null;
      const firstDate = billItems?.[0]?.publishDates?.[0] || null;
      const billDateValue = selectedBillDate && !isNaN(selectedBillDate.getTime()) 
        ? selectedBillDate.toISOString() 
        : (firstDate ? (firstDate instanceof Date && !isNaN(firstDate.getTime()) ? firstDate.toISOString() : new Date().toISOString()) : new Date().toISOString());
      const billData = {
        clientName: newBill.clientName,
        clientNumber: newBill.clientNumber,
        clientAddress: newBill.clientAddress,
        clientGST: newBill.clientGST,
        clientState: newBill.clientState,
        billDate: billDateValue,
        discount: parseFloat(newBill.discount) || 0,
        items: JSON.stringify(billItems.map(item => ({
          publication: item.publication,
          publishDates: item.publishDates.map(d => {
            if (d instanceof Date && !isNaN(d.getTime())) {
              return d.toISOString().split('T')[0];
            } else if (typeof d === 'string') {
              const dateObj = new Date(d);
              return !isNaN(dateObj.getTime()) ? dateObj.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            } else {
              return new Date().toISOString().split('T')[0];
            }
          }),
          size: item.size,
          words: item.words,
          totalSpace: item.totalSpace,
          rate: item.rate,
          extraPositionPercentage: item.extraPositionPercentage,
          packageOffer: item.packageOffer || "",
          amount: calculateItemAmount(item)
        }))),
        totalAmount: Number(newBill.totalAmount),
        cgst: Number(newBill.cgst) || 0,
        sgst: Number(newBill.sgst) || 0,
        igst: Number(newBill.igst) || 0,
        grandTotal: Number(newBill.grandTotal ? newBill.grandTotal : newBill.totalAmount),
      };
      console.log('Sending bill data:', billData);

      const method = editingBill ? "PUT" : "POST";
      const url = editingBill ? `/api/staff/bills/${editingBill.id}` : "/api/staff/bills";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
        },
        body: JSON.stringify(billData),
      });

      console.log('Bill response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        const resultBill = data.bill || data;
        console.log('Bill operation successful:', resultBill);
        
        if (editingBill) {
          setBills(bills.map(b => b.id === editingBill.id ? resultBill : b));
          setEditingBill(null);
        } else {
          setBills([...bills, resultBill]);
        }
        
        // Reset form and close dialog
        setShowBillDialog(false);
        setNewBill({
          clientName: "",
          clientNumber: "",
          clientAddress: "",
          clientGST: "",
          clientState: "Haryana",
          billDate: "",
          discount: "",
          totalAmount: "",
          cgst: "",
          sgst: "",
          igst: "",
          grandTotal: ""
        });
        setBillItems([]);
        setCurrentBillItem({
          publication: "",
          publishDates: [],
          size: "",
          totalSpace: "",
          rate: 0,
          extraPositionPercentage: 0,
          packageOffer: "",
        });
        
        // Open the created/updated bill in design view
        alert(`Bill ${editingBill ? 'updated' : 'created'} successfully!`);
        setLocation(`/bill?billId=${resultBill.id}`);
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error('Bill operation failed:', errorData);
        alert(`Failed to save bill: ${errorData.details || errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Failed to save bill:", error);
      alert("Failed to save bill. Please check the console for details.");
    }
  };

  const handleEditBill = (bill: any) => {
    setEditingBill(bill);
    let items;
    try {
      items = typeof bill.items === 'string' ? JSON.parse(bill.items) : bill.items;
    } catch (error) {
      console.warn('Failed to parse bill items:', error);
      items = [];
    }
    
    // Handle both old and new formats
    const billItemsArray = items.map((item: any, index: number) => {
      if (item.publication && item.size) {
        // New format
        return {
          id: `${index}`,
          publication: item.publication,
          publishDates: Array.isArray(item.publishDates) ? item.publishDates.map((d: any) => {
            // Handle different date formats: Date objects, ISO strings, or date strings
            if (d instanceof Date && !isNaN(d.getTime())) {
              return d;
            }
            if (typeof d === 'string') {
              // Try parsing as ISO string first, then as date string
              let dateObj = new Date(d);
              if (isNaN(dateObj.getTime())) {
                // If it's just a date string like "2026-04-20", create date at midnight
                dateObj = new Date(d + 'T00:00:00');
              }
              return !isNaN(dateObj.getTime()) ? dateObj : new Date();
            }
            return new Date();
          }) : [],
          size: item.size,
          words: item.words || '',
          totalSpace: item.totalSpace || '',
          rate: parseFloat(item.rate) || 0,
          extraPositionPercentage: item.extraPositionPercentage || 0,
          packageOffer: item.packageOffer || ''
        };
      } else {
        // Old format
        return {
          id: `${index}`,
          publication: item.description || 'Legacy Item',
          publishDates: [],
          size: '1',
          words: '',
          totalSpace: '',
          rate: parseFloat(item.amount) || 0,
          extraPositionPercentage: 0,
          packageOffer: ''
        };
      }
    });
    
    setBillItems(billItemsArray);
    setNewBill({
      clientName: bill.clientName,
      clientNumber: bill.clientNumber,
      clientAddress: bill.clientAddress,
      clientGST: bill.clientGST,
      clientState: bill.clientState,
      billDate: bill.billDate ? (() => {
        try {
          const date = new Date(bill.billDate);
          return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : "";
        } catch {
          return "";
        }
      })() : "",
      discount: bill.discount ? bill.discount.toString() : "",
      totalAmount: bill.totalAmount ? bill.totalAmount.toString() : "",
      cgst: bill.cgst ? bill.cgst.toString() : "",
      sgst: bill.sgst ? bill.sgst.toString() : "",
      igst: bill.igst ? bill.igst.toString() : "",
      grandTotal: bill.grandTotal ? bill.grandTotal.toString() : ""
    });
    setShowBillDialog(true);
  };

  const handleDeleteBill = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bill?")) return;

    try {
      const response = await fetch(`/api/staff/bills/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
        },
      });

      if (response.ok) {
        setBills(bills.filter(b => b.id !== id));
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(response.status === 401 || response.status === 403
          ? "Session expired or insufficient permissions. Please log out and log back in."
          : (errData.error || `Delete failed (${response.status})`));
      }
    } catch (error) {
      console.error("Failed to delete bill:", error);
      alert("Network error while deleting. Please try again.");
    }
  };

  const getStatusBadgeVariant = (status: Booking['status']) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'submitted': return 'default';
      case 'approved': return 'default';
      case 'published': return 'default';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  // Login history UI state
  const [loginFilter, setLoginFilter] = useState<string>("");
  const [loginPage, setLoginPage] = useState<number>(1);
  const loginPageSize = 10;

  const filteredLogins = recentLogins.filter(l => !loginFilter || (l.userEmail || "").toLowerCase().includes(loginFilter.toLowerCase()));
  const loginPageCount = Math.max(1, Math.ceil(filteredLogins.length / loginPageSize));
  const loginPageItems = filteredLogins.slice((loginPage - 1) * loginPageSize, loginPage * loginPageSize);

  const formatSafe = (input: any) => {
    if (!input && input !== 0) return "";
    if (typeof input === "string") return input;
    if (typeof input === "number") return input.toString();
    try {
      return JSON.stringify(input);
    } catch {
      return "";
    }
  };

  const filteredBills = useMemo(() =>
    bills.filter(bill => {
      const query = billSearch.trim().toLowerCase();
      if (!query) return true;

      const clientName = formatSafe(bill.clientName).toLowerCase();
      const clientNumber = formatSafe(bill.clientNumber).toLowerCase();
      const createdAt = formatSafe(bill.createdAt).toLowerCase();

      return (
        clientName.includes(query) ||
        clientNumber.includes(query) ||
        createdAt.includes(query)
      );
    }),
    [bills, billSearch]
  );

  const getEditionsByNewspaper = (newspaperId: string) => {
    return editions.filter(edition => edition.newspaperId === newspaperId);
  };

  const getCitiesByState = (state: string) => {
    return cities.filter(city => city.state === state);
  };

  const getUniqueStates = () => {
    return Array.from(new Set(cities.map(city => city.state))).sort();
  };

  // Memoize parsed booking data to prevent re-computation on every render
  const processedBookings = useMemo(() => {
    console.log('Processing bookings, count:', bookings.length);
    try {
      return bookings.map(booking => {
        let pricing = null;
        let dates = [];

        try {
          pricing = (booking as any).calculatedPricing ? JSON.parse((booking as any).calculatedPricing) : null;
        } catch (e) {
          console.warn('Failed to parse calculatedPricing for booking:', booking.id, e);
          pricing = null;
        }

        try {
          dates = booking.publishDates ? (typeof booking.publishDates === 'string' ? JSON.parse(booking.publishDates) : booking.publishDates) : [];
        } catch (e) {
          console.warn('Failed to parse publishDates for booking:', booking.id, e);
          dates = [];
        }

        return {
          ...booking,
          parsedPricing: pricing,
          parsedDates: dates,
          formattedTotal: pricing ? formatCurrency(pricing.totalCost || pricing.total || pricing.estimatedTotal || 0) : 'N/A',
          formattedBaseRate: pricing ? formatCurrency(pricing.baseRate || 0) : 'N/A',
          formattedEnchantmentTotal: pricing ? formatCurrency(pricing.enchantmentTotal || 0) : 'N/A',
          formattedGst: pricing ? formatCurrency(pricing.gst || 0) : 'N/A'
        };
      });
    } catch (error) {
      console.error('Error in processedBookings:', error);
      return [];
    }
  }, [bookings]);

  const sortedBookings = useMemo(() => {
    return [...processedBookings].sort((a, b) => {
      const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [processedBookings]);

  const visibleBookings = useMemo(() => {
    const query = bookingSearch.trim().toLowerCase();
    if (!query) return sortedBookings;

    return sortedBookings.filter((booking: any) => {
      const searchText = [
        booking.id,
        booking.name,
        booking.phone,
        booking.newspaper?.name,
        booking.adMatter?.newspaper?.name,
        booking.city?.name,
        booking.adMatter?.city?.name,
        booking.adMatter?.category?.name,
        booking.adMatter?.subcategory?.name,
        booking.status
      ]
        .filter(Boolean)
        .map(item => String(item).toLowerCase())
        .join(' ');

      return searchText.includes(query);
    });
  }, [sortedBookings, bookingSearch]);

  // Memoize parsed manual RO data to prevent re-computation on every render
  const processedManualROs = useMemo(() => {
    console.log('Processing manual ROs, count:', manualROs.length);
    try {
      return manualROs.map(ro => {
        let dates = [];

        try {
          dates = ro.publishDates ? (typeof ro.publishDates === 'string' ? JSON.parse(ro.publishDates) : ro.publishDates) : [];
        } catch (e) {
          console.warn('Failed to parse publishDates for manual RO:', ro.id, e);
          dates = [];
        }

        return {
          ...ro,
          parsedDates: dates
        };
      });
    } catch (error) {
      console.error('Error in processedManualROs:', error);
      return [];
    }
  }, [manualROs]);

  if (!staff) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Dashboard</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  console.log('StaffDashboard render:', { staff: !!staff, loading, error, isAdmin, newspapers: newspapers.length });

  // Debug processedBookings
  console.log('processedBookings length:', processedBookings.length);
  if (processedBookings.length > 0) {
    console.log('First booking sample:', processedBookings[0]);
  }

  // Debug bills
  console.log('bills length:', bills.length);
  if (bills.length > 0) {
    console.log('First bill sample:', bills[0]);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Newspaper className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Staff Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Logged in as:</span> {staff?.username}
              </div>
              {recentLogins.length > 0 && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Last user login:</span> {recentLogins[0].userEmail} <span className="text-xs text-gray-500">({new Date(recentLogins[0].createdAt).toLocaleString()})</span>
                </div>
              )}
              <Badge variant={staff?.role === 'admin' ? 'default' : 'secondary'}>
                {staff?.role}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={updateTab} className="space-y-6">
          <TabsList className="flex flex-wrap w-full gap-1">
            {isAdmin && (
              <>
                <TabsTrigger value="newspapers" className="flex items-center">
                  <Newspaper className="w-4 h-4 mr-2" />
                  Newspapers
                </TabsTrigger>
                <TabsTrigger value="categories" className="flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Categories
                </TabsTrigger>
                <TabsTrigger value="subcategories" className="flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Subcategories
                </TabsTrigger>
                <TabsTrigger value="editions" className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  Editions
                </TabsTrigger>
                <TabsTrigger value="packages" className="flex items-center">
                  <Package className="w-4 h-4 mr-2" />
                  Packages
                </TabsTrigger>
                <TabsTrigger value="rates" className="flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  Rates
                </TabsTrigger>
                <TabsTrigger value="enchantments" className="flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  Enchantments
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="bills" className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Bills
            </TabsTrigger>
            <TabsTrigger value="manual-ros" className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Manual ROs
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="logins" className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Logins
              </TabsTrigger>
            )}
            <TabsTrigger value="bookings" className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Bookings
            </TabsTrigger>
          </TabsList>

          {isAdmin && (
            <TabsContent value="newspapers" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Newspapers</h2>
              <Dialog open={showNewspaperDialog || !!editingNewspaper} onOpenChange={(open) => { if (!open) closeDialog(); else setShowNewspaperDialog(true); }}>
                <DialogTrigger asChild>
                  <Button onClick={() => setShowNewspaperDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Newspaper
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingNewspaper ? "Edit Newspaper" : "Add New Newspaper"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingNewspaper ? "Update the newspaper details." : "Create a new newspaper in the system."}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="name"
                        value={newspaperForm.name}
                        onChange={(e) => setNewspaperForm({...newspaperForm, name: e.target.value})}
                        className="col-span-3"
                        placeholder="e.g., The Times of India"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label className="text-right pt-2">
                        Language
                      </Label>
                      <div className="col-span-3 flex flex-col gap-2">
                        {["English", "Hindi", "Punjabi"].map((lang) => (
                          <label key={lang} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newspaperForm.language.includes(lang)}
                              onChange={(e) => {
                                const langs = e.target.checked
                                  ? [...newspaperForm.language, lang]
                                  : newspaperForm.language.filter(l => l !== lang);
                                setNewspaperForm({ ...newspaperForm, language: langs });
                              }}
                              className="w-4 h-4 accent-primary"
                            />
                            <span className="text-sm">{lang}</span>
                          </label>
                        ))}
                        {newspaperForm.language.length > 0 && (
                          <p className="text-xs text-muted-foreground">Selected: {newspaperForm.language.join(", ")}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="type" className="text-right">
                        Type
                      </Label>
                      <Select value={newspaperForm.type} onValueChange={(value) => setNewspaperForm({...newspaperForm, type: value})}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="National">National</SelectItem>
                          <SelectItem value="Regional">Regional</SelectItem>
                          <SelectItem value="City-based">City-based</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="pricingUnit" className="text-right">
                        Pricing Unit
                      </Label>
                      <Select value={newspaperForm.pricingUnit} onValueChange={(value) => setNewspaperForm({...newspaperForm, pricingUnit: value})}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="line">Per Line</SelectItem>
                          <SelectItem value="word">Per Word</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={closeDialog}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={editingNewspaper ? handleUpdateNewspaper : handleCreateNewspaper} disabled={!newspaperForm.name || newspaperForm.language.length === 0 || !newspaperForm.type}>
                      <Save className="w-4 h-4 mr-2" />
                      {editingNewspaper ? "Update" : "Create"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Manage Newspaper Dialog */}
            <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Manage {managingNewspaper?.name}</DialogTitle>
                  <DialogDescription>
                    Manage ad types, editions, and packages for this newspaper.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Ad Types Section */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Ad Types</h3>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Ad Type
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Select Ad Type</DialogTitle>
                            <DialogDescription>Choose one of the predefined ad types for {managingNewspaper?.name}.</DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            {["Classified Text Ad", "Display Ad"].map((typeName) => (
                              <Button
                                key={typeName}
                                variant="outline"
                                className="w-full justify-start h-auto p-4"
                                onClick={() => {
                                  setAdTypeForm({ name: typeName });
                                  handleCreateAdType(managingNewspaper!.id);
                                }}
                              >
                                <div className="text-left">
                                  <div className="font-semibold">{typeName}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {typeName === "Classified Text Ad" ? "Text-based classified advertisements" : "Visual display advertisements"}
                                  </div>
                                </div>
                              </Button>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="grid gap-2 max-h-[200px] overflow-y-auto">
                      {getAdTypesForNewspaper(managingNewspaper?.id || "").map((adType) => (
                        <Card key={adType.id}>
                          <CardContent className="p-3">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{adType.name}</span>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm" onClick={() => handleDeleteAdType(adType.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Editions Section */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Editions</h3>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Edition
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Edition</DialogTitle>
                            <DialogDescription>Create a new edition for {managingNewspaper?.name}.</DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edition-name" className="text-right">Edition Name</Label>
                              <Input
                                id="edition-name"
                                placeholder="e.g., Delhi NCR"
                                className="col-span-3"
                                value={editionForm.editionName}
                                onChange={(e) => setEditionForm({...editionForm, editionName: e.target.value})}
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edition-state" className="text-right">State</Label>
                              <Input
                                id="edition-state"
                                placeholder="e.g., Delhi"
                                className="col-span-3"
                                value={editionForm.state}
                                onChange={(e) => setEditionForm({...editionForm, state: e.target.value})}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleCreateEdition}>
                              <Save className="w-4 h-4 mr-2" />
                              Create
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="grid gap-2">
                      {getEditionsForNewspaper(managingNewspaper?.id || "").map((edition) => (
                        <Card key={edition.id}>
                          <CardContent className="p-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-medium">{edition.editionName}</span>
                                <span className="text-sm text-muted-foreground ml-2">({edition.state})</span>
                              </div>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm" onClick={() => handleDeleteEdition(edition.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Packages Section */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Packages</h3>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Package
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Package</DialogTitle>
                            <DialogDescription>Create a new package for {managingNewspaper?.name}.</DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="package-name" className="text-right">Name</Label>
                              <Input
                                id="package-name"
                                placeholder="e.g., Basic Package"
                                className="col-span-3"
                                value={packageForm.name}
                                onChange={(e) => setPackageForm({...packageForm, name: e.target.value})}
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="package-category" className="text-right">Category (optional)</Label>
                              <Select value={packageForm.categoryId} onValueChange={(value) => setPackageForm({...packageForm, categoryId: value})}>
                                <SelectTrigger className="col-span-3">
                                  <SelectValue placeholder="Select a category (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                      {category.name} ({getAdTypeName(category.adTypeId)})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="package-description" className="text-right">Description</Label>
                              <Input
                                id="package-description"
                                placeholder="Optional description"
                                className="col-span-3"
                                value={packageForm.description}
                                onChange={(e) => setPackageForm({...packageForm, description: e.target.value})}
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="package-rate" className="text-right">Price</Label>
                              <Input
                                id="package-rate"
                                type="number"
                                placeholder="100"
                                className="col-span-3"
                                value={packageForm.price}
                                onChange={(e) => setPackageForm({...packageForm, price: e.target.value})}
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="package-type" className="text-right">Pricing Type</Label>
                              <Select value={packageForm.pricingType} onValueChange={(value) => setPackageForm({...packageForm, pricingType: value})}>
                                <SelectTrigger className="col-span-3">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="per_line">Per Line</SelectItem>
                                  <SelectItem value="per_word">Per Word</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="package-discount" className="text-right">Discount %</Label>
                              <Input
                                id="package-discount"
                                type="number"
                                placeholder="0"
                                className="col-span-3"
                                value={packageForm.discount}
                                onChange={(e) => setPackageForm({...packageForm, discount: e.target.value})}
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="package-package-type" className="text-right">Package Type</Label>
                              <Select value={packageForm.packageType} onValueChange={(value) => setPackageForm({...packageForm, packageType: value})}>
                                <SelectTrigger className="col-span-3">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="standard">Standard</SelectItem>
                                  <SelectItem value="buy_get">Buy & Get (e.g., 1+1, 2+2)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {packageForm.packageType === "buy_get" && (
                              <>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="package-buy-quantity" className="text-right">Buy Quantity</Label>
                                  <Input
                                    id="package-buy-quantity"
                                    type="number"
                                    placeholder="1"
                                    className="col-span-3"
                                    value={packageForm.buyQuantity}
                                    onChange={(e) => setPackageForm({...packageForm, buyQuantity: e.target.value})}
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="package-get-quantity" className="text-right">Get Quantity</Label>
                                  <Input
                                    id="package-get-quantity"
                                    type="number"
                                    placeholder="1"
                                    className="col-span-3"
                                    value={packageForm.getQuantity}
                                    onChange={(e) => setPackageForm({...packageForm, getQuantity: e.target.value})}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                          <DialogFooter>
                            <Button onClick={handleCreatePackage}>
                              <Save className="w-4 h-4 mr-2" />
                              Create
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="grid gap-2">
                      {getPackagesByNewspaper(managingNewspaper?.id || "").map((pkg) => (
                        <Card key={pkg.id}>
                          <CardContent className="p-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-medium">{pkg.name}</span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  ₹{pkg.price} {pkg.pricingType === 'per_word' ? 'per word' : 'per line'}
                                  {pkg.packageType === 'buy_get' && pkg.buyQuantity && pkg.getQuantity && (
                                    <span className="ml-1">({pkg.buyQuantity}+{pkg.getQuantity})</span>
                                  )}
                                </span>
                              </div>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm" onClick={() => handleDeletePackage(pkg.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Rates Section */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Rates</h3>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Price
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Add Price</DialogTitle>
                            <DialogDescription>Set pricing rates for {managingNewspaper?.name}.</DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="rate-name" className="text-right">Name</Label>
                              <Input
                                id="rate-name"
                                value={rateForm.name}
                                onChange={(e) => setRateForm({...rateForm, name: e.target.value})}
                                className="col-span-3"
                                placeholder="e.g., Standard Classified Rate"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="rate-ad-type" className="text-right">Ad Type</Label>
                              <Select
                                value={rateForm.adTypeId || "none"}
                                onValueChange={(value) => setRateForm({...rateForm, adTypeId: value === "none" ? "" : value, categoryId: "all"})}
                              >
                                <SelectTrigger className="col-span-3">
                                  <SelectValue placeholder="Select ad type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">Select Ad Type</SelectItem>
                                  {getAdTypesForNewspaper(managingNewspaper?.id || "").map((adType) => (
                                    <SelectItem key={adType.id} value={adType.id}>
                                      {adType.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="rate-category" className="text-right">Category</Label>
                              <Select
                                value={rateForm.categoryId || "all"}
                                onValueChange={(value) => setRateForm({...rateForm, categoryId: value})}
                                disabled={!rateForm.adTypeId}
                              >
                                <SelectTrigger className="col-span-3">
                                  <SelectValue placeholder="Select category (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Categories</SelectItem>
                                  {getCategoriesForAdType(rateForm.adTypeId).map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="rate-language" className="text-right">Language</Label>
                              <Select value={rateForm.language} onValueChange={(value) => setRateForm({...rateForm, language: value})}>
                                <SelectTrigger className="col-span-3">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="EN">English</SelectItem>
                                  <SelectItem value="HI">Hindi</SelectItem>
                                  <SelectItem value="PA">Punjabi</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="rate-size-unit" className="text-right">Size Unit</Label>
                              <Select value={rateForm.sizeUnit} onValueChange={(value) => setRateForm({...rateForm, sizeUnit: value})}>
                                <SelectTrigger className="col-span-3">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="per_line">Per Line</SelectItem>
                                  <SelectItem value="per_word">Per Word</SelectItem>
                                  <SelectItem value="per_sq_cm">Per Sq Cm</SelectItem>
                                  <SelectItem value="per_column_inch">Per Column Inch</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="rate-base-rate" className="text-right">Per Unit Rate (₹)</Label>
                              <Input
                                id="rate-base-rate"
                                type="number"
                                value={rateForm.baseRate}
                                onChange={(e) => setRateForm({...rateForm, baseRate: e.target.value})}
                                className="col-span-3"
                                placeholder="e.g., 800"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="rate-fixed-rate" className="text-right">Fixed Rate (₹)</Label>
                              <Input
                                id="rate-fixed-rate"
                                type="number"
                                value={rateForm.fixedRate}
                                onChange={(e) => setRateForm({...rateForm, fixedRate: e.target.value})}
                                className="col-span-3"
                                placeholder="e.g., 5999 (optional)"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="rate-exact-size" className="text-right">For Exact Size</Label>
                              <Input
                                id="rate-exact-size"
                                type="number"
                                value={rateForm.exactSize}
                                onChange={(e) => setRateForm({...rateForm, exactSize: e.target.value})}
                                className="col-span-3"
                                placeholder="e.g., 5 (optional)"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="rate-min-size" className="text-right">Min Size</Label>
                              <Input
                                id="rate-min-size"
                                type="number"
                                value={rateForm.minSize}
                                onChange={(e) => setRateForm({...rateForm, minSize: e.target.value})}
                                className="col-span-3"
                                placeholder="e.g., 1 (optional)"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="rate-max-size" className="text-right">Max Size</Label>
                              <Input
                                id="rate-max-size"
                                type="number"
                                value={rateForm.maxSize}
                                onChange={(e) => setRateForm({...rateForm, maxSize: e.target.value})}
                                className="col-span-3"
                                placeholder="e.g., 10 (optional)"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="rate-edition" className="text-right">Edition</Label>
                              <Select
                                value={rateForm.editionId || "all"}
                                onValueChange={(value) => setRateForm({...rateForm, editionId: value})}
                              >
                                <SelectTrigger className="col-span-3">
                                  <SelectValue placeholder="Select edition (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Editions</SelectItem>
                                  {getEditionsForNewspaper(managingNewspaper?.id || "").map((edition) => (
                                    <SelectItem key={edition.id} value={edition.id}>
                                      {edition.editionName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="rate-city" className="text-right">City</Label>
                              <Select
                                value={rateForm.cityId || "all"}
                                onValueChange={(value) => setRateForm({...rateForm, cityId: value})}
                              >
                                <SelectTrigger className="col-span-3">
                                  <SelectValue placeholder="Select city (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Cities</SelectItem>
                                  {cities.map((city) => (
                                    <SelectItem key={city.id} value={city.id}>
                                      {city.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="rate-notes" className="text-right">Notes</Label>
                              <Input
                                id="rate-notes"
                                value={rateForm.notes}
                                onChange={(e) => setRateForm({...rateForm, notes: e.target.value})}
                                className="col-span-3"
                                placeholder="Optional notes"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="rate-ro" className="text-right">RO (Read-Only)</Label>
                              <div className="col-span-3">
                                <input
                                  id="rate-ro"
                                  type="checkbox"
                                  checked={rateForm.readOnly}
                                  onChange={(e) => setRateForm({...rateForm, readOnly: e.target.checked})}
                                  className="w-4 h-4"
                                />
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={() => handleCreateRateForNewspaper(managingNewspaper!.id)}>
                              <Save className="w-4 h-4 mr-2" />
                              Create
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="grid gap-2 max-h-[300px] overflow-y-auto border rounded-md p-2">
                      {rates.filter(rate => rate.newspaperId === managingNewspaper?.id).map((rate) => {
                        const adType = adTypes.find(at => at.id === rate.adTypeId);
                        const category = rate.categoryId ? categories.find(c => c.id === rate.categoryId) : null;
                        const edition = rate.editionId ? editions.find(e => e.id === rate.editionId) : null;
                        const city = rate.cityId ? cities.find(c => c.id === rate.cityId) : null;

                        return (
                          <Card key={rate.id}>
                            <CardContent className="p-3">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="font-medium flex items-center gap-2">
                                    {adType?.name} {category ? `- ${category.name}` : '(All Categories)'}
                                    {rate.readOnly && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">RO</span>}
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    {rate.fixedRate && rate.exactSize ? (
                                      <>₹{rate.fixedRate} for {rate.exactSize} {rate.sizeUnit.replace('_', ' ')}</>
                                    ) : (
                                      <>₹{rate.baseRate} {rate.sizeUnit.replace('_', ' ')}</>
                                    )}
                                    {rate.minSize && rate.maxSize && ` (${rate.minSize}-${rate.maxSize})`}
                                    {rate.minSize && !rate.maxSize && ` (${rate.minSize}+)`}
                                    {!rate.minSize && rate.maxSize && ` (up to ${rate.maxSize})`}
                                    {' • '}{rate.language}
                                    {edition && ` • ${edition.editionName}`}
                                    {city && ` • ${city.name}`}
                                  </div>
                                  {rate.notes && <div className="text-xs text-gray-500 mt-1">{rate.notes}</div>}
                                </div>
                                <div className="flex space-x-2">
                                  <Button variant="outline" size="sm" onClick={() => handleDeleteRate(rate.id)}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  {/* Enchantment Rates Section */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Enchantment Rates</h3>
                      <Dialog open={showEnchantmentRateDialog || !!editingEnchantmentRate} onOpenChange={(open) => { if (!open) closeEnchantmentRateDialog(); else setShowEnchantmentRateDialog(true); }}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Price
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{editingEnchantmentRate ? "Edit Enchantment Rate" : "Add New Enchantment Rate"}</DialogTitle>
                            <DialogDescription>{editingEnchantmentRate ? "Update the enchantment rate for this newspaper." : "Create a newspaper-specific rate for an enchantment."}</DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="enchantment" className="text-right">Enchantment</Label>
                              <Select value={enchantmentRateForm.enchantmentId} onValueChange={(value) => setEnchantmentRateForm({...enchantmentRateForm, newspaperId: managingNewspaper?.id || "", enchantmentId: value})}>
                                <SelectTrigger className="col-span-3"><SelectValue placeholder="Select an enchantment" /></SelectTrigger>
                                <SelectContent>{adEnchantments.map((enchantment) => (<SelectItem key={enchantment.id} value={enchantment.id}>{enchantment.name}</SelectItem>))}</SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="price" className="text-right">Percentage (%)</Label>
                              <Input id="price" type="number" value={enchantmentRateForm.price} onChange={(e) => setEnchantmentRateForm({...enchantmentRateForm, price: e.target.value})} className="col-span-3" placeholder="e.g., 10" />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={closeEnchantmentRateDialog}><X className="w-4 h-4 mr-2" />Cancel</Button>
                            <Button onClick={editingEnchantmentRate ? handleUpdateEnchantmentRate : handleCreateEnchantmentRate} disabled={!enchantmentRateForm.enchantmentId || !enchantmentRateForm.price}><Save className="w-4 h-4 mr-2" />{editingEnchantmentRate ? "Update" : "Create"}</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="grid gap-2">
                      {newspaperEnchantmentRates.filter(rate => rate.newspaperId === managingNewspaper?.id).map((rate) => (
                        <div key={rate.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{getEnchantmentName(rate.enchantmentId)}</span>
                            {inlineEditingRate === rate.id ? (
                              <Input
                                type="number"
                                value={inlineEditingPrice}
                                onChange={(e) => setInlineEditingPrice(e.target.value)}
                                className="w-20 h-6 text-xs"
                                placeholder="₹"
                              />
                            ) : (
                              <span className="text-sm text-gray-600">₹{rate.price}</span>
                            )}
                          </div>
                          <div className="flex space-x-1">
                            {inlineEditingRate === rate.id ? (
                              <>
                                <Button variant="default" size="sm" onClick={() => saveInlineEditing(rate.id)} className="h-6 px-2">
                                  <Save className="w-3 h-3" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={cancelInlineEditing} className="h-6 px-2">
                                  <X className="w-3 h-3" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button variant="outline" size="sm" onClick={() => startInlineEditing(rate)} className="h-6 px-2">
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleDeleteEnchantmentRate(rate.id)} className="h-6 px-2">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {newspaperEnchantmentRates.filter(rate => rate.newspaperId === managingNewspaper?.id).length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-xs text-muted-foreground">No enchantment rates set for this newspaper</p>
                      </div>
                    )}
                  </div>

                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowManageDialog(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {newspapers.map((newspaper) => (
                <Card key={newspaper.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{newspaper.name}</CardTitle>
                        <CardDescription>
                          {newspaper.language} • {newspaper.type}
                        </CardDescription>
                      </div>
                      <Badge variant={newspaper.active ? "default" : "secondary"}>
                        {newspaper.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(newspaper)}>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteNewspaper(newspaper.id)}>
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleManageNewspaper(newspaper)}>
                        <Settings className="w-4 h-4 mr-1" />
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          )}

          {isAdmin && (
          <TabsContent value="categories" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
              <Dialog open={showCategoryDialog || !!editingCategory} onOpenChange={(open) => { if (!open) closeCategoryDialog(); else setShowCategoryDialog(true); }}>
                <DialogTrigger asChild>
                  <Button onClick={() => setShowCategoryDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingCategory ? "Edit Category" : "Add New Category"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingCategory ? "Update the category details." : "Create a new category for an ad type."}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="category-name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="category-name"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                        className="col-span-3"
                        placeholder="e.g., Real Estate, Automobiles"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="ad-type" className="text-right">
                        Ad Type
                      </Label>
                      <Select value={categoryForm.adTypeId} onValueChange={(value) => setCategoryForm({...categoryForm, adTypeId: value})}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select an ad type" />
                        </SelectTrigger>
                        <SelectContent>
                          {adTypes.map((adType) => (
                            <SelectItem key={adType.id} value={adType.id}>
                              {adType.name} ({getNewspaperName(adType.newspaperId)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={closeCategoryDialog}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={editingCategory ? handleUpdateCategory : handleCreateCategory} disabled={!categoryForm.adTypeId}>
                      <Save className="w-4 h-4 mr-2" />
                      {editingCategory ? "Update" : "Create"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-6">
              {newspapers.map((newspaper) => {
                const newspaperAdTypes = getAdTypesForNewspaper(newspaper.id);
                if (newspaperAdTypes.length === 0) return null;

                return (
                  <Card key={newspaper.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{newspaper.name}</CardTitle>
                      <CardDescription>Categories by Ad Type</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {newspaperAdTypes.map((adType) => {
                          const adTypeCategories = getCategoriesForAdType(adType.id);
                          return (
                            <div key={adType.id} className="border rounded-lg p-4">
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="font-medium">{adType.name}</h4>
                                <Badge variant={adType.active ? "default" : "secondary"}>
                                  {adType.active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              {adTypeCategories.length > 0 ? (
                                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                                  {adTypeCategories.map((category) => (
                                    <div key={category.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                      <span className="text-sm">{category.name}</span>
                                      <div className="flex space-x-1">
                                        <Button variant="ghost" size="sm" onClick={() => openEditCategoryDialog(category)}>
                                          <Edit className="w-3 h-3" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">No categories yet</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {newspapers.filter(n => getAdTypesForNewspaper(n.id).length > 0).length === 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-gray-600">No ad types available. Create ad types first to manage categories.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          )}

          {isAdmin && (
          <TabsContent value="subcategories" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Subcategories</h2>
              <Dialog open={showSubcategoryDialog || !!editingSubcategory} onOpenChange={(open) => { if (!open) closeSubcategoryDialog(); else setShowSubcategoryDialog(true); }}>
                <DialogTrigger asChild>
                  <Button onClick={() => setShowSubcategoryDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Subcategory
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingSubcategory ? "Edit Subcategory" : "Add New Subcategory"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingSubcategory ? "Update the subcategory details." : "Create a new subcategory for a category."}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="subcategory-name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="subcategory-name"
                        value={subcategoryForm.name}
                        onChange={(e) => setSubcategoryForm({...subcategoryForm, name: e.target.value})}
                        className="col-span-3"
                        placeholder="e.g., For Sale, For Rent"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="category" className="text-right">
                        Category
                      </Label>
                      <Select value={subcategoryForm.categoryId} onValueChange={(value) => setSubcategoryForm({...subcategoryForm, categoryId: value})}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name} ({getAdTypeName(category.adTypeId)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={closeSubcategoryDialog}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={editingSubcategory ? handleUpdateSubcategory : handleCreateSubcategory} disabled={!subcategoryForm.categoryId}>
                      <Save className="w-4 h-4 mr-2" />
                      {editingSubcategory ? "Update" : "Create"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-6">
              {categories.map((category) => {
                const categorySubcategories = getSubcategoriesForCategory(category.id);
                return (
                  <Card key={category.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <CardDescription>Subcategories ({getAdTypeName(category.adTypeId)})</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {categorySubcategories.length > 0 ? (
                        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                          {categorySubcategories.map((subcategory) => (
                            <div key={subcategory.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">{subcategory.name}</span>
                              <div className="flex space-x-1">
                                <Button variant="ghost" size="sm" onClick={() => openEditSubcategoryDialog(subcategory)}>
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteSubcategory(subcategory.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No subcategories yet</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              {categories.length === 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-gray-600">No categories available. Create categories first to manage subcategories.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          )}

          {isAdmin && (
          <TabsContent value="enchantments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Ad Enchantments</h2>
              <Dialog open={showEnchantmentDialog || !!editingEnchantment} onOpenChange={(open) => { if (!open) closeEnchantmentDialog(); else setShowEnchantmentDialog(true); }}>
                <DialogTrigger asChild>
                  <Button onClick={() => setShowEnchantmentDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Enchantment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingEnchantment ? "Edit Enchantment" : "Add New Enchantment"}</DialogTitle>
                    <DialogDescription>{editingEnchantment ? "Update the enchantment details." : "Create a new enchantment for advertisements."}</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">Name</Label>
                      <Input id="name" value={enchantmentForm.name} onChange={(e) => setEnchantmentForm({...enchantmentForm, name: e.target.value})} className="col-span-3" placeholder="e.g., Bold Text" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">Description</Label>
                      <Input id="description" value={enchantmentForm.description} onChange={(e) => setEnchantmentForm({...enchantmentForm, description: e.target.value})} className="col-span-3" placeholder="e.g., Makes text bold" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="icon" className="text-right">Icon</Label>
                      <Input id="icon" value={enchantmentForm.icon} onChange={(e) => setEnchantmentForm({...enchantmentForm, icon: e.target.value})} className="col-span-3" placeholder="e.g., bold" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="previewHtml" className="text-right">Preview HTML</Label>
                      <Input id="previewHtml" value={enchantmentForm.previewHtml} onChange={(e) => setEnchantmentForm({...enchantmentForm, previewHtml: e.target.value})} className="col-span-3" placeholder="e.g., <strong>text</strong>" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={closeEnchantmentDialog}><X className="w-4 h-4 mr-2" />Cancel</Button>
                    <Button onClick={editingEnchantment ? handleUpdateEnchantment : handleCreateEnchantment} disabled={!enchantmentForm.name}><Save className="w-4 h-4 mr-2" />{editingEnchantment ? "Update" : "Create"}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {adEnchantments.map((enchantment) => (
                <Card key={enchantment.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{enchantment.name}</CardTitle>
                        <CardDescription>{enchantment.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEditEnchantmentDialog(enchantment)}>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteEnchantment(enchantment.id)}>
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {adEnchantments.length === 0 && (
              <div className="text-center py-8">
                <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No enchantments available</p>
              </div>
            )}
          </TabsContent>
          )}

          {isAdmin && (
          <TabsContent value="logins" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Login History</h2>
              <div className="flex items-center space-x-2">
                <Input placeholder="Filter by email" value={loginFilter} onChange={(e) => { setLoginFilter(e.target.value); setLoginPage(1); }} />
                <Badge variant="outline">Total: {filteredLogins.length}</Badge>
              </div>
            </div>

            {loginPageItems.length > 0 ? (
              <div className="space-y-2">
                {loginPageItems.map((entry: any) => (
                  <Card key={entry.id}>
                    <CardContent className="p-3 flex justify-between items-center">
                      <div>
                        <div className="font-medium">{entry.userEmail}</div>
                        <div className="text-xs text-gray-500">{new Date(entry.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="text-sm text-gray-600">User ID: {entry.userId || 'N/A'}</div>
                    </CardContent>
                  </Card>
                ))}

                <div className="flex justify-between items-center mt-2">
                  <div className="text-sm text-gray-600">Page {loginPage} of {loginPageCount}</div>
                  <div className="flex space-x-2">
                    <Button disabled={loginPage <= 1} onClick={() => setLoginPage(p => Math.max(1, p - 1))}>Prev</Button>
                    <Button disabled={loginPage >= loginPageCount} onClick={() => setLoginPage(p => Math.min(loginPageCount, p + 1))}>Next</Button>
                  </div>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-600">No login records found.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          )}

          {isAdmin && (
          <TabsContent value="editions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Editions & Locations</h2>
              <Dialog open={showEditionDialog || !!editingEdition} onOpenChange={(open) => { if (!open) closeEditionDialog(); else setShowEditionDialog(true); }}>
                <DialogTrigger asChild>
                  <Button onClick={() => setShowEditionDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Edition
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingEdition ? "Edit Edition" : "Add New Edition"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingEdition ? "Update the edition details." : "Create a new edition for a newspaper."}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="newspaper" className="text-right">
                        Newspaper
                      </Label>
                      <Select value={editionForm.newspaperId} onValueChange={(value) => setEditionForm({...editionForm, newspaperId: value})}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select a newspaper" />
                        </SelectTrigger>
                        <SelectContent>
                          {newspapers.map((newspaper) => (
                            <SelectItem key={newspaper.id} value={newspaper.id}>
                              {newspaper.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edition-name" className="text-right">
                        Edition Name
                      </Label>
                      <Input
                        id="edition-name"
                        value={editionForm.editionName}
                        onChange={(e) => setEditionForm({...editionForm, editionName: e.target.value})}
                        className="col-span-3"
                        placeholder="e.g., Delhi NCR, Mumbai, Chennai"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="state" className="text-right">
                        State
                      </Label>
                      <Input
                        id="state"
                        value={editionForm.state}
                        onChange={(e) => setEditionForm({...editionForm, state: e.target.value})}
                        className="col-span-3"
                        placeholder="e.g., Haryana, Delhi, Maharashtra"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={closeEditionDialog}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={editingEdition ? handleUpdateEdition : handleCreateEdition} disabled={!editionForm.newspaperId}>
                      <Save className="w-4 h-4 mr-2" />
                      {editingEdition ? "Update" : "Create"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-6">
              {newspapers.map((newspaper) => {
                const newspaperEditions = getEditionsByNewspaper(newspaper.id);
                if (newspaperEditions.length === 0) return null;

                return (
                  <Card key={newspaper.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{newspaper.name}</CardTitle>
                      <CardDescription>Editions and their locations</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {newspaperEditions.map((edition) => (
                          <div key={edition.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium">{edition.editionName}</h4>
                                <p className="text-sm text-gray-600">{edition.state}</p>
                              </div>
                              <div className="flex space-x-1">
                                <Button variant="ghost" size="sm" onClick={() => openEditEditionDialog(edition)}>
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteEdition(edition.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              Cities: {getCitiesByState(edition.state).length} available
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {newspapers.filter(n => getEditionsByNewspaper(n.id).length > 0).length === 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-gray-600">No editions available. Create editions for newspapers to get started.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          )}

          {isAdmin && (
          <TabsContent value="packages" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Packages & Pricing</h2>
              <Dialog open={showPackageDialog || !!editingPackage} onOpenChange={(open) => { if (!open) closePackageDialog(); else setShowPackageDialog(true); }}>
                <DialogTrigger asChild>
                  <Button onClick={() => setShowPackageDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Package
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingPackage ? "Edit Package" : "Add New Package"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingPackage ? "Update the package details and pricing." : "Create a new advertising package for a newspaper."}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="newspaper" className="text-right">
                        Newspaper
                      </Label>
                      <Select
                        value={packageForm.newspaperId}
                        onValueChange={(value) => setPackageForm({...packageForm, newspaperId: value})}
                        disabled={!!editingPackage}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select a newspaper" />
                        </SelectTrigger>
                        <SelectContent>
                          {newspapers.map((newspaper) => (
                            <SelectItem key={newspaper.id} value={newspaper.id}>
                              {newspaper.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="package-name" className="text-right">
                        Package Name
                      </Label>
                      <Input
                        id="package-name"
                        value={packageForm.name}
                        onChange={(e) => setPackageForm({...packageForm, name: e.target.value})}
                        className="col-span-3"
                        placeholder="e.g., Basic Classified, Premium Display"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">
                        Description
                      </Label>
                      <Input
                        id="description"
                        value={packageForm.description}
                        onChange={(e) => setPackageForm({...packageForm, description: e.target.value})}
                        className="col-span-3"
                        placeholder="Optional package description"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="price" className="text-right">
                        Price (₹)
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        value={packageForm.price}
                        onChange={(e) => setPackageForm({...packageForm, price: e.target.value})}
                        className="col-span-3"
                        placeholder="e.g., 100"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="pricing-type" className="text-right">
                        Pricing Type
                      </Label>
                      <Select value={packageForm.pricingType} onValueChange={(value) => setPackageForm({...packageForm, pricingType: value})}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="per_line">Per Line</SelectItem>
                          <SelectItem value="per_word">Per Word</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="min-size" className="text-right">
                        Min Size
                      </Label>
                      <Input
                        id="min-size"
                        type="number"
                        value={packageForm.minSize}
                        onChange={(e) => setPackageForm({...packageForm, minSize: e.target.value})}
                        className="col-span-3"
                        placeholder={`Min ${packageForm.pricingType === 'per_word' ? 'words' : 'lines'}`}
                        min="1"
                        max="20"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="max-size" className="text-right">
                        Max Size
                      </Label>
                      <Input
                        id="max-size"
                        type="number"
                        value={packageForm.maxSize}
                        onChange={(e) => setPackageForm({...packageForm, maxSize: e.target.value})}
                        className="col-span-3"
                        placeholder={`Max ${packageForm.pricingType === 'per_word' ? 'words' : 'lines'}`}
                        min="1"
                        max="20"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={closePackageDialog}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={editingPackage ? handleUpdatePackage : handleCreatePackage} disabled={!packageForm.newspaperId || !packageForm.name || !packageForm.price}>
                      <Save className="w-4 h-4 mr-2" />
                      {editingPackage ? "Update" : "Create"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-6">
              {newspapers.map((newspaper) => {
                const newspaperPackages = getPackagesByNewspaper(newspaper.id);
                if (newspaperPackages.length === 0) return null;

                return (
                  <Card key={newspaper.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{newspaper.name}</CardTitle>
                      <CardDescription>Advertising packages and pricing</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {newspaperPackages.map((pkg) => (
                          <div key={pkg.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium">{pkg.name}</h4>
                                {pkg.description && (
                                  <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                                )}
                              </div>
                              <div className="flex space-x-1">
                                <Button variant="ghost" size="sm" onClick={() => openEditPackageDialog(pkg)}>
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeletePackage(pkg.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">₹{pkg.price}{pkg.categoryId ? ` • ${categories.find(c => c.id === pkg.categoryId)?.name || ''}` : ''}</span>
                                <span className="text-xs text-gray-500">
                                  {pkg.pricingType === 'per_word' ? 'per word' : 'per line'}
                                  {pkg.discount > 0 && ` (-${pkg.discount}%)`}
                                </span>
                              </div>
                              {(pkg.minSize || pkg.maxSize) && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Size: {pkg.minSize || 'N/A'} - {pkg.maxSize || 'N/A'} {pkg.pricingType === 'per_word' ? 'words' : 'lines'}
                                </div>
                              )}
                              <Badge variant={pkg.active ? "default" : "secondary"} className="mt-2">
                                {pkg.active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {newspapers.filter(n => getPackagesByNewspaper(n.id).length > 0).length === 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-gray-600">No packages available. Create packages for newspapers to set up pricing.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          )}

          {isAdmin && (
          <TabsContent value="rates" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Rate Management</h2>
              <Dialog open={showRateDialog || !!editingRate} onOpenChange={(open) => { if (!open) closeRateDialog(); else setShowRateDialog(true); }}>
                <DialogTrigger asChild>
                  <Button onClick={() => setShowRateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Price
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingRate ? "Edit Rate" : "Add New Rate"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingRate ? "Update the rate details." : "Create a new rate for newspaper pricing."}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="rate-name" className="text-right">
                        Package Name (optional)
                      </Label>
                      <Input
                        id="rate-name"
                        value={rateForm.name || ""}
                        onChange={(e) => setRateForm({...rateForm, name: e.target.value})}
                        className="col-span-3"
                        placeholder="Optional package name"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="rate-newspaper" className="text-right">
                        Newspaper
                      </Label>
                      <Select
                        value={rateForm.newspaperId || ""}
                        onValueChange={(value) => setRateForm({...rateForm, newspaperId: value, adTypeId: "", categoryId: "all", editionId: "all", cityId: "all"})}
                        disabled={!!editingRate}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select a newspaper" />
                        </SelectTrigger>
                        <SelectContent>
                          {newspapers.map((newspaper) => (
                            <SelectItem key={newspaper.id} value={newspaper.id}>
                              {newspaper.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="rate-ad-type" className="text-right">
                        Ad Type
                      </Label>
                      <Select
                        value={rateForm.adTypeId || ""}
                        onValueChange={(value) => setRateForm({...rateForm, adTypeId: value, categoryId: "all"})}
                        disabled={!rateForm.newspaperId || !!editingRate}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select an ad type" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAdTypesForNewspaper(rateForm.newspaperId).map((adType) => (
                            <SelectItem key={adType.id} value={adType.id}>
                              {adType.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="rate-category" className="text-right">
                        Category
                      </Label>
                      <Select
                        value={rateForm.categoryId || "all"}
                        onValueChange={(value) => setRateForm({...rateForm, categoryId: value})}
                        disabled={!rateForm.adTypeId}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select a category (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {getCategoriesForAdType(rateForm.adTypeId).map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="rate-language" className="text-right">
                        Language
                      </Label>
                      <Select value={rateForm.language} onValueChange={(value) => setRateForm({...rateForm, language: value})}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EN">English</SelectItem>
                          <SelectItem value="HI">Hindi</SelectItem>
                          <SelectItem value="PA">Punjabi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="rate-size-unit" className="text-right">
                        Size Unit
                      </Label>
                      <Select value={rateForm.sizeUnit} onValueChange={(value) => setRateForm({...rateForm, sizeUnit: value})}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="per_line">Per Line</SelectItem>
                          <SelectItem value="per_word">Per Word</SelectItem>
                          <SelectItem value="per_sq_cm">Per Sq Cm</SelectItem>
                          <SelectItem value="per_column_inch">Per Column Inch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="rate-base-rate" className="text-right">
                        Per Unit Rate (₹)
                      </Label>
                      <Input
                        id="rate-base-rate"
                        type="number"
                        value={rateForm.baseRate}
                        onChange={(e) => setRateForm({...rateForm, baseRate: e.target.value})}
                        className="col-span-3"
                        placeholder="e.g., 800"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="rate-fixed-rate" className="text-right">
                        Fixed Rate (₹)
                      </Label>
                      <Input
                        id="rate-fixed-rate"
                        type="number"
                        value={rateForm.fixedRate}
                        onChange={(e) => setRateForm({...rateForm, fixedRate: e.target.value})}
                        className="col-span-3"
                        placeholder="e.g., 5999 (optional)"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="rate-exact-size" className="text-right">
                        For Exact Size
                      </Label>
                      <Input
                        id="rate-exact-size"
                        type="number"
                        value={rateForm.exactSize}
                        onChange={(e) => setRateForm({...rateForm, exactSize: e.target.value})}
                        className="col-span-3"
                        placeholder="e.g., 5 (optional)"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="rate-min-size" className="text-right">
                        Min Size
                      </Label>
                      <Input
                        id="rate-min-size"
                        type="number"
                        value={rateForm.minSize}
                        onChange={(e) => setRateForm({...rateForm, minSize: e.target.value})}
                        className="col-span-3"
                        placeholder="e.g., 1 (optional)"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="rate-max-size" className="text-right">
                        Max Size
                      </Label>
                      <Input
                        id="rate-max-size"
                        type="number"
                        value={rateForm.maxSize}
                        onChange={(e) => setRateForm({...rateForm, maxSize: e.target.value})}
                        className="col-span-3"
                        placeholder="e.g., 10 (optional)"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="rate-edition" className="text-right">
                        Edition
                      </Label>
                      <Select
                        value={rateForm.editionId || "all"}
                        onValueChange={(value) => setRateForm({...rateForm, editionId: value})}
                        disabled={!rateForm.newspaperId}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select edition (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Editions</SelectItem>
                          {getEditionsForNewspaper(rateForm.newspaperId).map((edition) => (
                            <SelectItem key={edition.id} value={edition.id}>
                              {edition.editionName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="rate-city" className="text-right">
                        City
                      </Label>
                      <Select
                        value={rateForm.cityId || "all"}
                        onValueChange={(value) => setRateForm({...rateForm, cityId: value})}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select city (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Cities</SelectItem>
                          {cities.map((city) => (
                            <SelectItem key={city.id} value={city.id}>
                              {city.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="rate-notes" className="text-right">
                        Notes
                      </Label>
                      <Input
                        id="rate-notes"
                        value={rateForm.notes}
                        onChange={(e) => setRateForm({...rateForm, notes: e.target.value})}
                        className="col-span-3"
                        placeholder="Optional notes"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={closeRateDialog}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={editingRate ? handleUpdateRate : handleCreateRate} disabled={!rateForm.newspaperId || !rateForm.adTypeId || !rateForm.baseRate}>
                      <Save className="w-4 h-4 mr-2" />
                      {editingRate ? "Update" : "Create"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-6">
              {newspapers.map((newspaper) => {
                const newspaperRates = rates.filter(rate => rate.newspaperId === newspaper.id);
                if (newspaperRates.length === 0) return null;

                return (
                  <Card key={newspaper.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Newspaper className="w-5 h-5 mr-2" />
                        {newspaper.name}
                        <Badge variant="outline" className="ml-2">
                          {newspaper.pricingUnit === 'word' ? 'Per Word' : 'Per Line'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Rate configurations ({newspaperRates.length} rates)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div className="grid gap-4">
                          {newspaperRates.map((rate) => {
                            const adType = adTypes.find(at => at.id === rate.adTypeId);
                            const category = rate.categoryId ? categories.find(c => c.id === rate.categoryId) : null;
                            const edition = rate.editionId ? editions.find(e => e.id === rate.editionId) : null;
                            const city = rate.cityId ? cities.find(c => c.id === rate.cityId) : null;

                            return (
                              <div key={rate.id} className="border rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h5 className="font-medium">{adType?.name} {category ? `- ${category.name}` : '(All Categories)'}</h5>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                      {rate.fixedRate && rate.exactSize ? (
                                        <span>₹{rate.fixedRate} for {rate.exactSize} {rate.sizeUnit.replace('_', ' ')}</span>
                                      ) : (
                                        <span>₹{rate.baseRate} {rate.sizeUnit.replace('_', ' ')}</span>
                                      )}
                                      {rate.minSize && rate.maxSize && <span>({rate.minSize}-{rate.maxSize})</span>}
                                      {rate.minSize && !rate.maxSize && <span>({rate.minSize}+)</span>}
                                      {!rate.minSize && rate.maxSize && <span>(up to {rate.maxSize})</span>}
                                      <span>•</span>
                                      <span>{rate.language}</span>
                                      {edition && <><span>•</span><span>{edition.editionName}</span></>}
                                      {city && <><span>•</span><span>{city.name}</span></>}
                                    </div>
                                    {rate.notes && <p className="text-sm text-gray-500 mt-1">{rate.notes}</p>}
                                  </div>
                                  <div className="flex space-x-1">
                                    <Button variant="ghost" size="sm" onClick={() => openEditRateDialog(rate)}>
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteRate(rate.id)}>
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                                <Badge variant={rate.active ? "default" : "secondary"} className="mt-2">
                                  {rate.active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {newspapers.filter(n => rates.filter(r => r.newspaperId === n.id).length > 0).length === 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-gray-600">No rates configured. Create rates for newspapers to set up pricing.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          )}

          <TabsContent value="bills" className="space-y-6">
            <div className="flex justify-between items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-bold text-gray-900">Manage Bills</h2>
              <div className="flex items-center gap-2">
                <Button onClick={exportBillsAsExcel} disabled={excelExporting} variant="secondary">
                  <FileText className="w-4 h-4 mr-2" />
                  {excelExporting ? 'Preparing...' : 'Open Excel Sheet'}
                </Button>
                <Dialog open={showBillDialog} onOpenChange={setShowBillDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Manual Bill
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                    <DialogTitle>Create Manual Bill</DialogTitle>
                    <DialogDescription>
                      Generate a bill for offline clients with multiple advertisements.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    {/* CLIENT INFORMATION SECTION */}
                    <div className="border-b pb-4">
                      <h3 className="font-semibold text-lg mb-4">Client Information</h3>
                      <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="bill-client">Client Name</Label>
                            <div className="relative">
                              <Input
                                id="bill-client"
                                value={newBill.clientName}
                                onChange={(e) => handleClientNameChange(e.target.value)}
                                placeholder="Type to search previous clients"
                              />
                              {showClientSuggestions && clientSuggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md mt-1 z-10 shadow-lg">
                                  {clientSuggestions.map((suggestion, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => handleSelectClient(suggestion)}
                                      className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b last:border-b-0"
                                    >
                                      <div className="font-medium">{suggestion.clientName}</div>
                                      <div className="text-sm text-gray-600">{suggestion.clientNumber}</div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="bill-number">Client Number</Label>
                            <Input
                              id="bill-number"
                              value={newBill.clientNumber}
                              onChange={(e) => setNewBill({...newBill, clientNumber: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="bill-address">Client Address</Label>
                            <Input
                              id="bill-address"
                              value={newBill.clientAddress}
                              onChange={(e) => setNewBill({...newBill, clientAddress: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="bill-gst">GST Number</Label>
                            <Input
                              id="bill-gst"
                              value={newBill.clientGST}
                              onChange={(e) => setNewBill({...newBill, clientGST: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bill-state">Client State</Label>
                          <Select value={newBill.clientState} onValueChange={(value) => setNewBill({...newBill, clientState: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Punjab">Punjab</SelectItem>
                              <SelectItem value="Haryana">Haryana</SelectItem>
                              <SelectItem value="Himachal Pradesh">Himachal Pradesh</SelectItem>
                              <SelectItem value="Delhi">Delhi</SelectItem>
                              <SelectItem value="UP">UP</SelectItem>
                              <SelectItem value="Jammu">Jammu</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bill-date">Bill Date <span className="text-sm text-gray-500">(Optional)</span></Label>
                          <Input
                            id="bill-date"
                            type="date"
                            value={newBill.billDate}
                            onChange={(e) => setNewBill({...newBill, billDate: e.target.value})}
                            placeholder="Leave empty for today's date"
                          />
                        </div>
                      </div>
                    </div>

                    {/* ADD ITEMS SECTION */}
                    <div className="border-b pb-4">
                      <h3 className="font-semibold text-lg mb-4">Add Advertisement</h3>
                      <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2 relative">
                            <Label htmlFor="item-publication">Publication</Label>
                            <Input
                              id="item-publication"
                              value={currentBillItem.publication}
                              onChange={(e) => handleNewspaperNameChange(e.target.value)}
                              onKeyDown={handlePublicationKeyDown}
                              onFocus={handlePublicationFocus}
                              placeholder="Search or choose newspaper"
                            />
                            {showNewspaperSuggestions && newspaperSuggestions.length > 0 && (
                              <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                                {newspaperSuggestions.map((newspaper, index) => (
                                  <div
                                    key={index}
                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => handleSelectNewspaper(newspaper)}
                                  >
                                    {newspaper.name}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="item-size">Size</Label>
                            <Input
                              id="item-size"
                              value={currentBillItem.size}
                              onChange={(e) => setCurrentBillItem({...currentBillItem, size: e.target.value})}
                              placeholder="e.g., 5x3"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="item-words">Words</Label>
                            <Input
                              id="item-words"
                              value={currentBillItem.words}
                              onChange={(e) => setCurrentBillItem({...currentBillItem, words: e.target.value})}
                              placeholder="e.g., 18"
                            />
                          </div>
                        </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="item-space">Total Space</Label>
                            <Input
                              id="item-space"
                              value={currentBillItem.totalSpace}
                              onChange={(e) => setCurrentBillItem({...currentBillItem, totalSpace: e.target.value})}
                              placeholder="e.g., SV"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="item-rate">Rate</Label>
                            <Input
                              id="item-rate"
                              type="number"
                              value={currentBillItem.rate !== undefined ? currentBillItem.rate : ""}
                              onChange={(e) => {
                                const value = e.target.value.trim();
                                const parsed = value === "" ? undefined : parseFloat(value);
                                setCurrentBillItem({
                                  ...currentBillItem,
                                  rate: Number.isFinite(parsed) ? parsed : undefined,
                                });
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="item-package">Package Offer</Label>
                            <Input
                              id="item-package"
                              value={currentBillItem.packageOffer}
                              onChange={(e) => setCurrentBillItem({...currentBillItem, packageOffer: e.target.value})}
                              placeholder="e.g., 2+1"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="item-discount">Discount (%)</Label>
                            <Input
                              id="item-discount"
                              type="number"
                              value={newBill.discount}
                              onChange={(e) => setNewBill({...newBill, discount: (parseFloat(e.target.value) || 0).toString()})}
                              min="0"
                              max="100"
                              placeholder="0"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="item-extra">Extra for Spl Position %</Label>
                            <Input
                              id="item-extra"
                              type="number"
                              value={currentBillItem.extraPositionPercentage}
                              onChange={(e) => setCurrentBillItem({...currentBillItem, extraPositionPercentage: parseFloat(e.target.value) || 0})}
                              placeholder="e.g., 10"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-end">
                          <div className="space-y-2">
                            <Label htmlFor="item-dates">Dates of Insertion</Label>
                            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full">
                                  <CalendarIcon className="w-4 h-4 mr-2" />
                                  {(currentBillItem.publishDates?.length || 0) > 0 ? `${currentBillItem.publishDates?.length} date(s)` : "Add date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={undefined}
                                  onSelect={(date) => {
                                    if (date && !(currentBillItem.publishDates || []).some(d => d.toDateString() === date.toDateString())) {
                                      setCurrentBillItem({...currentBillItem, publishDates: [...(currentBillItem.publishDates || []), date]});
                                    }
                                    setShowCalendar(false);
                                  }}
                                  disabled={(date) => {
                                    const today = new Date();
                                    const threeMonthsFromNow = new Date();
                                    threeMonthsFromNow.setMonth(today.getMonth() + 3);
                                    return date < today || date > threeMonthsFromNow;
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(currentBillItem.publishDates || []).map((date, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {format(date, 'dd/MM')}
                                <button
                                  onClick={() => setCurrentBillItem({...currentBillItem, publishDates: (currentBillItem.publishDates || []).filter((_, i) => i !== index)})}
                                  className="ml-1"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={editingItemId ? handleUpdateBillItem : handleAddBillItem}
                              className="flex-1"
                            >
                              {editingItemId ? 'Update Item' : 'Add Item'}
                            </Button>
                            {editingItemId && (
                              <Button
                                onClick={handleCancelEdit}
                                variant="outline"
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ITEMS LIST SECTION */}
                    {billItems.length > 0 && (
                      <div className="border-b pb-4">
                        <h3 className="font-semibold text-lg mb-4">Added Advertisements</h3>
                        <div className="space-y-3">
                          {billItems.map((item) => (
                            <div key={item.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium">{item.publication} - Size: {item.size || 'N/A'} Words: {item.words || 'N/A'}</div>
                                <div className="text-sm text-gray-600">
                                  Rate: ₹{item.rate} | Package: {item.packageOffer || 'None'} | Extra: {item.extraPositionPercentage}% | Dates: {item.publishDates.length}
                                </div>
                                <div className="text-sm font-medium mt-1">Total: ₹{calculateItemAmount(item)}</div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditBillItem(item.id)}
                                  disabled={editingItemId !== null}
                                >
                                  <Edit className="w-4 h-4 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveBillItem(item.id)}
                                  disabled={editingItemId !== null}
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TOTALS SECTION */}
                    {billItems.length > 0 && (
                      <div>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">Total:</span>
                            <span>₹{newBill.totalAmount || '0.00'}</span>
                          </div>
                          <div className="flex justify-between text-orange-600">
                            <span className="font-medium">Discount Amount:</span>
                            <span>-₹{(() => {
                              const subtotal = billItems.reduce((sum, item) => {
                                const baseAmount = (parseFloat(item.size) || 0) * item.rate;
                                const extraPercentage = item.extraPositionPercentage || 0;
                                const extraAmount = (baseAmount * extraPercentage) / 100;
                                return sum + baseAmount + extraAmount;
                              }, 0);
                              const discountPercentage = parseFloat(newBill.discount) || 0;
                              const discountAmount = (subtotal * discountPercentage) / 100;
                              return discountAmount.toFixed(2);
                            })()}</span>
                          </div>
                          <div className="border-t pt-2 flex justify-between">
                            <span className="font-medium">Total Amount:</span>
                            <span className="font-semibold">₹{newBill.totalAmount}</span>
                          </div>
                          {newBill.clientState === "Haryana" ? (
                            <>
                              <div className="flex justify-between text-sm">
                                <span>CGST @ 2.5%:</span>
                                <span>₹{newBill.cgst}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>SGST @ 2.5%:</span>
                                <span>₹{newBill.sgst}</span>
                              </div>
                            </>
                          ) : (
                            <div className="flex justify-between text-sm">
                              <span>IGST @ 5%:</span>
                              <span>₹{newBill.igst}</span>
                            </div>
                          )}
                          <div className="border-t pt-2 flex justify-between font-bold text-lg">
                            <span>Grand Total:</span>
                            <span>₹{newBill.grandTotal}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {billItems.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Add at least one advertisement to create a bill</p>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowBillDialog(false)}>Cancel</Button>
                    <Button onClick={handleCreateBill} disabled={billItems.length === 0}>Create Bill</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

            {/* Search Bar */}
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search by Client Name, Bill Number, or Date..."
                value={billSearch}
                onChange={(e) => setBillSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {/* Bills List */}
            <div className="grid gap-4">
              {filteredBills.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No bills yet</h3>
                    <p className="text-gray-600">
                      Bills will appear here once created.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredBills.map((bill) => (
                  <Card key={bill.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{bill.clientName}</h3>
                          <p className="text-sm text-gray-600">Bill #{bill.id} - {formatDate(bill.createdAt)}</p>
                          <p className="text-sm text-gray-600">Amount: {formatCurrency((bill.grandTotal || bill.totalAmount) / 100)}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => {
                            setViewingBillId(bill.id);
                            setShowBillViewerDialog(true);
                          }}>
                            View Bill
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setLocation(`/bill?billId=${bill.id}`)}>
                            Open Design Bill
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleEditBill(bill)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteBill(bill.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Bill Viewer Dialog */}
            <Dialog open={showBillViewerDialog} onOpenChange={setShowBillViewerDialog}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Bill Details</DialogTitle>
                </DialogHeader>
                {viewingBillId && (
                  (() => {
                    const bill = bills.find(b => b.id === viewingBillId);
                    if (!bill) return <div>Bill not found</div>;
                    
                    let items;
                    try {
                      items = typeof bill.items === 'string' ? JSON.parse(bill.items) : bill.items || [];
                    } catch (error) {
                      console.warn('Failed to parse bill items for viewing:', error);
                      items = [];
                    }
                    
                    // Handle both old format [{"description":"","amount":""}] and new format
                    const processedItems = items.map((item: any) => {
                      if (item.publication && item.size) {
                        // New format
                        return item;
                      } else {
                        // Old format - create a compatible structure
                        return {
                          publication: item.description || 'Legacy Item',
                          publishDates: [],
                          size: '1',
                          totalSpace: '',
                          rate: parseFloat(item.amount) || 0,
                          extraPositionPercentage: 0,
                          amount: parseFloat(item.amount) || 0
                        };
                      }
                    });
                    
                    return (
                      <div className="space-y-6">
                        {/* Bill Header */}
                        <div className="border-b pb-4">
                          <h3 className="text-lg font-bold mb-3">Bill #{bill.billNumber || bill.id}</h3>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Bill Date</p>
                              <p className="font-medium">{formatDate(bill.billDate)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Created</p>
                              <p className="font-medium">{formatDate(bill.createdAt)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Client Information */}
                        <div className="border-b pb-4">
                          <h4 className="font-semibold mb-3">Client Information</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Name</p>
                              <p className="font-medium">{bill.clientName}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Phone</p>
                              <p className="font-medium">{bill.clientNumber}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-gray-600">Address</p>
                              <p className="font-medium">{bill.clientAddress}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">GST Number</p>
                              <p className="font-medium">{bill.clientGST || '-'}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">State</p>
                              <p className="font-medium">{bill.clientState}</p>
                            </div>
                          </div>
                        </div>

                        {/* Items */}
                        <div className="border-b pb-4">
                          <h4 className="font-semibold mb-3">Advertisements</h4>
                          <div className="space-y-3">
                            {processedItems.map((item: any, idx: number) => (
                              <div key={idx} className="bg-gray-50 p-3 rounded">
                                <div className="flex justify-between mb-2">
                                  <div>
                                    <p className="font-medium">{item.publication} - {item.size}</p>
                                    <p className="text-sm text-gray-600">Space: {item.totalSpace}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold">₹{(item.rate * parseInt(item.size || '0') + (item.rate * parseInt(item.size || '0') * item.extraPositionPercentage / 100)).toFixed(2)}</p>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-600">Dates: {item.publishDates?.join(', ') || 'N/A'} | Rate: ₹{item.rate} | Extra: {item.extraPositionPercentage}%</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                          <div className="flex justify-between">
                            <span>Total:</span>
                            <span className="font-medium">{formatCurrency(bill.totalAmount / 100)}</span>
                          </div>
                          {bill.discount && bill.discount > 0 && (
                            <div className="flex justify-between text-orange-600">
                              <span>Discount ({bill.discount}%):</span>
                              <span className="font-medium">-{formatCurrency((bill.totalAmount * bill.discount) / 10000)}</span>
                            </div>
                          )}
                          {bill.cgst && (
                            <div className="flex justify-between">
                              <span>CGST @ 2.5%:</span>
                              <span className="font-medium">{formatCurrency(bill.cgst / 100)}</span>
                            </div>
                          )}
                          {bill.sgst && (
                            <div className="flex justify-between">
                              <span>SGST @ 2.5%:</span>
                              <span className="font-medium">{formatCurrency(bill.sgst / 100)}</span>
                            </div>
                          )}
                          {bill.igst && (
                            <div className="flex justify-between">
                              <span>IGST @ 5%:</span>
                              <span className="font-medium">{formatCurrency(bill.igst / 100)}</span>
                            </div>
                          )}
                          <div className="border-t pt-2 flex justify-between font-bold text-lg">
                            <span>Grand Total:</span>
                            <span>{formatCurrency((bill.grandTotal || bill.totalAmount) / 100)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowBillViewerDialog(false)}>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
      </TabsContent>

      <TabsContent value="manual-ros" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Manual Recording Orders</h2>
              <Dialog open={showManualRODialog} onOpenChange={setShowManualRODialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingManualRO(null);
                    setManualROForm({
                      roNumber: "",
                      newspaperId: "",
                      clientName: "",
                      clientPhone: "",
                      clientAddress: "",
                      amount: "",
                      publishDates: [],
                      description: "",
                      roStatus: "pending",
                      edition: "",
                      city: "",
                      category: "",
                      subcategory: "",
                      classification: "",
                      adContent: "",
                      baseRate: "",
                      enchantmentTotal: "",
                      gstAmount: "",
                      grandTotal: "",
                      paymentDetails: "",
                      remarks: ""
                    });
                    setShowManualRODialog(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Manual RO
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingManualRO ? "Edit Manual RO" : "Create Manual RO"}</DialogTitle>
                    <DialogDescription>
                      {editingManualRO ? "Update the recording order details" : "Create a new manual recording order"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="roNumber">RO Number</Label>
                            <Input
                              id="roNumber"
                              value={manualROForm.roNumber}
                              onChange={(e) => setManualROForm({...manualROForm, roNumber: e.target.value})}
                              placeholder="Enter RO number"
                            />
                          </div>
                          <div>
                            <Label htmlFor="roStatus">Status</Label>
                            <Select value={manualROForm.roStatus} onValueChange={(value) => setManualROForm({...manualROForm, roStatus: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="newspaperId">Newspaper</Label>
                          <Select value={manualROForm.newspaperId} onValueChange={(value) => setManualROForm({...manualROForm, newspaperId: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select newspaper" />
                            </SelectTrigger>
                            <SelectContent>
                              {newspapers.map((newspaper) => (
                                <SelectItem key={newspaper.id} value={newspaper.id}>
                                  {newspaper.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="edition">Edition</Label>
                            <Input
                              id="edition"
                              value={manualROForm.edition}
                              onChange={(e) => setManualROForm({...manualROForm, edition: e.target.value})}
                              placeholder="Enter edition"
                            />
                          </div>
                          <div>
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              value={manualROForm.city}
                              onChange={(e) => setManualROForm({...manualROForm, city: e.target.value})}
                              placeholder="Enter city"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Category Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Category Information</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="category">Category</Label>
                            <Input
                              id="category"
                              value={manualROForm.category}
                              onChange={(e) => setManualROForm({...manualROForm, category: e.target.value})}
                              placeholder="Enter category name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="subcategory">Subcategory</Label>
                            <Input
                              id="subcategory"
                              value={manualROForm.subcategory}
                              onChange={(e) => setManualROForm({...manualROForm, subcategory: e.target.value})}
                              placeholder="Enter subcategory"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="classification">Classification</Label>
                          <Input
                            id="classification"
                            value={manualROForm.classification}
                            onChange={(e) => setManualROForm({...manualROForm, classification: e.target.value})}
                            placeholder="Enter classification"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Publication Dates */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Publication Dates</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {manualROForm.publishDates.map((date, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {format(date, 'dd/MM/yyyy')}
                              <button
                                onClick={() => setManualROForm({
                                  ...manualROForm,
                                  publishDates: manualROForm.publishDates.filter((_, i) => i !== index)
                                })}
                                className="ml-1 hover:text-red-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline">
                              <CalendarIcon className="w-4 h-4 mr-2" />
                              Add Publication Date
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={undefined}
                              onSelect={(date) => {
                                if (date && !manualROForm.publishDates.some(d => d.toDateString() === date.toDateString())) {
                                  setManualROForm({
                                    ...manualROForm,
                                    publishDates: [...manualROForm.publishDates, date]
                                  });
                                }
                              }}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </CardContent>
                    </Card>

                    {/* Pricing Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Pricing Information</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="baseRate">Base Rate</Label>
                            <Input
                              id="baseRate"
                              type="number"
                              value={manualROForm.baseRate}
                              onChange={(e) => setManualROForm({...manualROForm, baseRate: e.target.value})}
                              placeholder="Enter base rate"
                            />
                          </div>
                          <div>
                            <Label htmlFor="enchantmentTotal">Enchantment Total</Label>
                            <Input
                              id="enchantmentTotal"
                              type="number"
                              value={manualROForm.enchantmentTotal}
                              onChange={(e) => setManualROForm({...manualROForm, enchantmentTotal: e.target.value})}
                              placeholder="Enter enchantment total"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="gstAmount">GST Amount</Label>
                            <Input
                              id="gstAmount"
                              type="number"
                              value={manualROForm.gstAmount}
                              onChange={(e) => setManualROForm({...manualROForm, gstAmount: e.target.value})}
                              placeholder="Enter GST amount"
                            />
                          </div>
                          <div>
                            <Label htmlFor="grandTotal">Grand Total</Label>
                            <Input
                              id="grandTotal"
                              type="number"
                              value={manualROForm.grandTotal}
                              onChange={(e) => setManualROForm({...manualROForm, grandTotal: e.target.value})}
                              placeholder="Enter grand total"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="amount">Total Amount</Label>
                          <Input
                            id="amount"
                            type="number"
                            value={manualROForm.amount}
                            onChange={(e) => setManualROForm({...manualROForm, amount: e.target.value})}
                            placeholder="Enter total amount"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Customer Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Customer Information</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4">
                        <div>
                          <Label htmlFor="clientName">Customer Name</Label>
                          <Input
                            id="clientName"
                            value={manualROForm.clientName}
                            onChange={(e) => setManualROForm({...manualROForm, clientName: e.target.value})}
                            placeholder="Enter customer name"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="clientPhone">Phone Number</Label>
                            <Input
                              id="clientPhone"
                              value={manualROForm.clientPhone}
                              onChange={(e) => setManualROForm({...manualROForm, clientPhone: e.target.value})}
                              placeholder="Enter phone number"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="clientAddress">Address</Label>
                          <Textarea
                            id="clientAddress"
                            value={manualROForm.clientAddress}
                            onChange={(e) => setManualROForm({...manualROForm, clientAddress: e.target.value})}
                            placeholder="Enter customer address"
                            rows={3}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Advertisement Content */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Advertisement Content</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Textarea
                          id="adContent"
                          value={manualROForm.adContent}
                          onChange={(e) => setManualROForm({...manualROForm, adContent: e.target.value})}
                          placeholder="Enter advertisement content..."
                          rows={6}
                          className="font-mono text-sm"
                        />
                      </CardContent>
                    </Card>

                    {/* Additional RO Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Additional RO Information</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4">
                        <div>
                          <Label htmlFor="paymentDetails">Payment Details</Label>
                          <Textarea
                            id="paymentDetails"
                            value={manualROForm.paymentDetails}
                            onChange={(e) => setManualROForm({...manualROForm, paymentDetails: e.target.value})}
                            placeholder="Enter payment details..."
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label htmlFor="remarks">Remarks</Label>
                          <Textarea
                            id="remarks"
                            value={manualROForm.remarks}
                            onChange={(e) => setManualROForm({...manualROForm, remarks: e.target.value})}
                            placeholder="Enter remarks..."
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Input
                            id="description"
                            value={manualROForm.description}
                            onChange={(e) => setManualROForm({...manualROForm, description: e.target.value})}
                            placeholder="Enter description"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowManualRODialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={async () => {
                      if (!manualROForm.roNumber || !manualROForm.newspaperId || !manualROForm.clientName || !manualROForm.amount) {
                        alert("Please fill in all required fields: RO Number, Newspaper, Client Name, and Amount");
                        return;
                      }

                      const duplicateRO = manualROs.some(ro => ro.roNumber === manualROForm.roNumber && (!editingManualRO || ro.id !== editingManualRO.id));
                      if (duplicateRO) {
                        alert("This RO Number is already used. Please choose a different value.");
                        return;
                      }
                      try {
                        const url = editingManualRO ? `/api/staff/manual-ros/${editingManualRO.id}` : "/api/staff/manual-ros";
                        const method = editingManualRO ? "PUT" : "POST";
                        const response = await fetch(url, {
                          method,
                          headers: { 
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${localStorage.getItem("staffSessionToken")}`,
                          },
                          body: JSON.stringify({
                            roNumber: manualROForm.roNumber,
                            newspaperId: manualROForm.newspaperId,
                            clientName: manualROForm.clientName,
                            clientPhone: manualROForm.clientPhone,
                            clientAddress: manualROForm.clientAddress,
                            amount: parseFloat(manualROForm.amount),
                            publishDates: manualROForm.publishDates.map(d => d.toISOString().split('T')[0]),
                            description: manualROForm.description,
                            roStatus: manualROForm.roStatus,
                            edition: manualROForm.edition,
                            city: manualROForm.city,
                            category: manualROForm.category,
                            subcategory: manualROForm.subcategory,
                            classification: manualROForm.classification,
                            adContent: manualROForm.adContent,
                            baseRate: manualROForm.baseRate ? parseFloat(manualROForm.baseRate) : null,
                            enchantmentTotal: manualROForm.enchantmentTotal ? parseFloat(manualROForm.enchantmentTotal) : 0,
                            gstAmount: manualROForm.gstAmount ? parseFloat(manualROForm.gstAmount) : null,
                            grandTotal: manualROForm.grandTotal ? parseFloat(manualROForm.grandTotal) : null,
                            paymentDetails: manualROForm.paymentDetails,
                            remarks: manualROForm.remarks
                          })
                        });
                        if (response.ok) {
                          const updated = await response.json();
                          if (editingManualRO) {
                            setManualROs(manualROs.map(ro => ro.id === updated.id ? updated : ro));
                          } else {
                            setManualROs([...manualROs, updated]);
                          }
                          setShowManualRODialog(false);
                          if (!editingManualRO) {
                            setViewingManualRO(updated);
                            setShowManualROViewDialog(true);
                          }
                          alert(`Manual RO ${editingManualRO ? 'updated' : 'created'} successfully!`);
                        } else {
                          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
                          alert(`Failed to save manual RO: ${errorData.error || errorData.message || 'Unknown error'}`);
                        }
                      } catch (error) {
                        console.error("Error saving manual RO:", error);
                        alert(`Error saving manual RO: ${error instanceof Error ? error.message : 'Unknown error'}`);
                      }
                    }}>
                      {editingManualRO ? "Update" : "Create"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {processedManualROs.length > 0 ? (
              <div className="space-y-4">
                {processedManualROs.map((ro) => (
                  <Card key={ro.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {ro.roNumber}
                            <Badge className="ml-2" variant={ro.roStatus === 'pending' ? 'outline' : 'default'}>
                              {ro.roStatus}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-1">
                            <span>Client: {ro.clientName}</span>
                            <span>Newspaper: {newspapers.find(n => n.id === ro.newspaperId)?.name || 'Unknown'}</span>
                            <span>Phone: {ro.clientPhone}</span>
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-green-600">
                            {formatCurrency(ro.amount)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Created: {ro.createdAt ? formatDate(ro.createdAt) : 'Unknown'}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium text-sm text-gray-700 mb-1">Description</h4>
                          <p className="text-sm">{ro.description || 'N/A'}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-gray-700 mb-1">Publish Dates</h4>
                          <div className="flex flex-wrap gap-1">
                            {(ro.parsedDates || []).slice(0, 3).map((date: any, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {formatDate(date)}
                              </Badge>
                            ))}
                            {(ro.parsedDates || []).length > 3 ? (
                              <Badge variant="outline" className="text-xs">
                                +{(ro.parsedDates || []).length - 3} more
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-gray-700 mb-1">Actions</h4>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingManualRO(ro);
                                setManualROForm({
                                  roNumber: ro.roNumber,
                                  newspaperId: ro.newspaperId,
                                  clientName: ro.clientName,
                                  clientPhone: ro.clientPhone || "",
                                  clientAddress: ro.clientAddress || "",
                                  amount: ro.amount.toString(),
                                  publishDates: (ro.parsedDates || []).map((d: string) => new Date(d)),
                                  description: ro.description || "",
                                  roStatus: ro.roStatus,
                                  edition: ro.edition || "",
                                  city: ro.city || "",
                                  category: ro.category || "",
                                  subcategory: ro.subcategory || "",
                                  classification: ro.classification || "",
                                  adContent: ro.adContent || "",
                                  baseRate: ro.baseRate?.toString() || "",
                                  enchantmentTotal: ro.enchantmentTotal?.toString() || "",
                                  gstAmount: ro.gstAmount?.toString() || "",
                                  grandTotal: ro.grandTotal?.toString() || "",
                                  paymentDetails: ro.paymentDetails || "",
                                  remarks: ro.remarks || ""
                                });
                                setShowManualRODialog(true);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setViewingManualRO(ro);
                                setShowManualROViewDialog(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View RO
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={async () => {
                                if (confirm("Are you sure you want to delete this RO?")) {
                                  try {
                                    const response = await fetch(`/api/staff/manual-ros/${ro.id}`, {
                                      method: "DELETE",
                                      credentials: "include"
                                    });
                                    if (response.ok) {
                                      setManualROs(manualROs.filter(r => r.id !== ro.id));
                                    }
                                  } catch (error) {
                                    console.error("Error deleting RO:", error);
                                  }
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No manual ROs yet</h3>
                    <p className="text-gray-600">
                      Create a manual recording order to get started.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            <Dialog open={showManualROViewDialog} onOpenChange={setShowManualROViewDialog}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                {viewingManualRO ? (
                  <div className="bg-white">
                    <style>{`
                      @media print {
                        body { margin: 0 !important; }
                        .ro-print-manual { width: 100% !important; max-width: 100% !important; }
                        .ro-print-manual * { font-size: 0.85rem !important; line-height: 1.2 !important; }
                        .ro-print-manual .text-3xl { font-size: 1.25rem !important; }
                        .ro-print-manual .text-2xl { font-size: 1.05rem !important; }
                        .ro-print-manual .text-lg { font-size: 0.95rem !important; }
                      }
                    `}</style>
                    <div className="ro-print-manual bg-white border-2 border-gray-300">
                      {/* Company Header */}
                      <div className="border-b-2 border-gray-300 px-6 py-4">
                        <div className="text-center">
                          <h1 className="text-3xl font-bold text-gray-800 mb-2">AMIT ADVERTISING</h1>
                          <p className="text-lg text-gray-600">DEALS IN ALL LEADING NEWSPAPER</p>
                          <p className="text-sm text-gray-500 mt-1">
                            SCO 410, First Floor, Sector 8, Panchkula, Haryana 134109, India<br/>
                            Phone: +91 94170 80721 | Email: amitadvt1@gmail.com | Website: www.amitadvertising.com
                          </p>
                        </div>
                      </div>

                      {/* RO Header */}
                      <div className="bg-gray-100 px-6 py-3 border-b border-gray-300">
                        <div className="flex justify-between items-center">
                          <h2 className="text-2xl font-bold text-gray-800">RELEASE ORDER (RO)</h2>
                          <div className="text-right">
                            <p className="text-sm font-medium">RO No: {viewingManualRO.roNumber}</p>
                            <p className="text-sm">Date: {viewingManualRO.createdAt ? formatDate(viewingManualRO.createdAt) : 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        {/* Publication Details */}
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-300 pb-1">Publication Details</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">RO Number</p>
                              <p className="font-medium">{viewingManualRO.roNumber}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Newspaper</p>
                              <p className="font-medium">{newspapers.find(n => n.id === viewingManualRO.newspaperId)?.name || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Edition</p>
                              <p className="font-medium">{viewingManualRO.edition || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">City</p>
                              <p className="font-medium">{viewingManualRO.city || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Category</p>
                              <p className="font-medium">{viewingManualRO.category || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Subcategory</p>
                              <p className="font-medium">{viewingManualRO.subcategory || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Classification</p>
                              <p className="font-medium">{viewingManualRO.classification || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Status</p>
                              <p className="font-medium">{viewingManualRO.roStatus}</p>
                            </div>
                          </div>
                        </div>

                        {/* Publication Dates */}
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-300 pb-1">Publish Dates</h3>
                          <div className="flex flex-wrap gap-2">
                            {(viewingManualRO.parsedDates || []).map((date: any, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {formatDate(date)}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Customer Information */}
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-300 pb-1">Customer Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <p className="text-sm text-gray-600">Name</p>
                              <p className="font-medium text-lg">{viewingManualRO.clientName}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Contact</p>
                              <p className="font-medium text-lg">{viewingManualRO.clientPhone || 'N/A'}</p>
                            </div>
                            <div className="md:col-span-2">
                              <p className="text-sm text-gray-600">Address</p>
                              <p className="font-medium">{viewingManualRO.clientAddress || 'N/A'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Advertisement Content */}
                        {viewingManualRO.adContent && (
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-300 pb-1">Advertisement Content</h3>
                            <div className="bg-gray-50 p-4 border border-gray-300 rounded whitespace-pre-wrap text-sm">
                              {viewingManualRO.adContent}
                            </div>
                          </div>
                        )}

                        {/* Pricing Details */}
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-300 pb-1">Pricing Details</h3>
                          <div className="border border-gray-300 rounded p-4">
                            <div className="space-y-2">
                              {viewingManualRO.baseRate && (
                                <div className="flex justify-between">
                                  <span className="font-medium">Base Rate</span>
                                  <span className="font-bold">{formatCurrency(viewingManualRO.baseRate)}</span>
                                </div>
                              )}
                              {viewingManualRO.enchantmentTotal && viewingManualRO.enchantmentTotal > 0 && (
                                <div className="flex justify-between">
                                  <span className="font-medium">Enchantment Total</span>
                                  <span className="font-bold">{formatCurrency(viewingManualRO.enchantmentTotal)}</span>
                                </div>
                              )}
                              {viewingManualRO.gstAmount != null && (
                                <div className="flex justify-between">
                                  <span className="font-medium">GST Amount</span>
                                  <span className="font-bold">{formatCurrency(viewingManualRO.gstAmount)}</span>
                                </div>
                              )}
                              <div className="border-t border-gray-300 pt-2 flex justify-between font-bold text-lg">
                                <span>Grand Total:</span>
                                <span>{formatCurrency(viewingManualRO.grandTotal || viewingManualRO.amount)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Additional Information */}
                        {(viewingManualRO.paymentDetails || viewingManualRO.remarks) && (
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-300 pb-1">Additional Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {viewingManualRO.paymentDetails && (
                                <div>
                                  <p className="text-sm text-gray-600">Payment Details</p>
                                  <p className="font-medium whitespace-pre-wrap text-sm">{viewingManualRO.paymentDetails}</p>
                                </div>
                              )}
                              {viewingManualRO.remarks && (
                                <div>
                                  <p className="text-sm text-gray-600">Remarks</p>
                                  <p className="font-medium whitespace-pre-wrap text-sm">{viewingManualRO.remarks}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">No RO selected.</div>
                )}
                <DialogFooter className="mt-6">
                  <Button variant="outline" onClick={() => setShowManualROViewDialog(false)}>
                    Close
                  </Button>
                  <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700">
                    Print RO
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Ad Bookings</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline" className="px-3 py-1">
                    Total: {processedBookings.length}
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1">
                    Pending: {processedBookings.filter(b => b.status === 'submitted').length}
                  </Badge>
                </div>
              </div>
              <div className="w-full md:w-1/3">
                <Input
                  placeholder="Search bookings by ID, customer, newspaper, city or status"
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                />
              </div>
            </div>

            {bookingsError === "session_expired" && (
              <Card className="border-amber-300 bg-amber-50">
                <CardContent className="pt-6">
                  <div className="text-center py-4">
                    <p className="text-amber-800 font-semibold">Your session has expired.</p>
                    <p className="text-amber-700 text-sm mt-1">Please log out and log back in to view bookings.</p>
                  </div>
                </CardContent>
              </Card>
            )}
            {bookingsError === "fetch_failed" && (
              <Card className="border-red-300 bg-red-50">
                <CardContent className="pt-6">
                  <div className="text-center py-4">
                    <p className="text-red-800 font-semibold">Failed to load bookings.</p>
                    <p className="text-red-700 text-sm mt-1">Please refresh the page and try again.</p>
                  </div>
                </CardContent>
              </Card>
            )}
            {!bookingsError && visibleBookings.length > 0 ? (
              <div className="space-y-4">
                {(visibleBookings as any[]).map((booking) => (
                  <Card key={booking?.id || Math.random()} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {booking.newspaper?.name || booking.adMatter?.newspaper?.name || 'Unknown Newspaper'}
                            <Badge variant={getStatusBadgeVariant(booking?.status || 'unknown')}>
                              {(booking?.status || 'unknown').charAt(0).toUpperCase() + (booking?.status || 'unknown').slice(1)}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-1">
                            <span>{booking.city?.name || booking.adMatter?.city?.name || 'Unknown City'}</span>
                            <span>{booking.adMatter?.language || booking?.language || 'Unknown Language'}</span>
                            <span>{booking.adType?.name || booking.adMatter?.adType?.name || 'Unknown Type'}</span>
                            <span>{booking.category?.name || booking.adMatter?.category?.name || 'Unknown Category'}</span>
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-green-600">
                            {booking.formattedTotal}
                          </div>
                          <div className="text-sm text-gray-500">
                            Created: {booking?.createdAt ? formatDate(booking.createdAt) : 'Unknown'}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium text-sm text-gray-700 mb-1">Ad Details</h4>
                          <p className="text-sm">
                            Size: {booking.adMatter?.size ? `${booking.adMatter.size} ${booking.adMatter.sizeUnit || 'units'}` : 'N/A'}
                          </p>
                          <p className="text-sm">
                            Base Rate: {booking.formattedBaseRate}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-gray-700 mb-1">Publish Dates</h4>
                          <div className="flex flex-wrap gap-1">
                            {booking.parsedDates.slice(0, 3).map((date: any, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {formatDate(date)}
                              </Badge>
                            ))}
                            {booking.parsedDates.length > 3 ? (
                              <Badge variant="outline" className="text-xs">
                                +{booking.parsedDates.length - 3} more
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-gray-700 mb-1">Pricing</h4>
                          <div className="text-sm">
                            {booking.parsedPricing ? (
                              <>
                                <div>Base: {booking.formattedBaseRate}</div>
                                <div>Enchantments: {booking.formattedEnchantmentTotal}</div>
                                <div>GST: {booking.formattedGst}</div>
                                <div className="font-medium">Total: {booking.formattedTotal}</div>
                              </>
                            ) : (
                              <div className="text-gray-500">N/A</div>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-gray-700 mb-1">Actions</h4>
                          <div className="flex flex-wrap gap-2">
                            {booking.status === 'submitted' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleUpdateBookingStatus(booking.id, 'approved')}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const notes = prompt('Enter rejection reason:');
                                    if (notes) handleUpdateBookingStatus(booking.id, 'draft', notes);
                                  }}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {booking.status === 'approved' && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleUpdateBookingStatus(booking.id, 'published')}
                              >
                                Mark Published
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const notes = prompt('Add admin notes:', booking.adminNotes || '');
                                if (notes !== null) handleUpdateBookingStatus(booking.id, booking.status, notes);
                              }}
                            >
                              Add Notes
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setLocation(`/ro-edit?bookingId=${booking.id}`)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit RO
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setLocation(`/ro-page?bookingId=${booking.id}`)}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              View RO
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => booking.id && booking.id !== 'null' && setLocation(`/bill?bookingId=${booking.id}`)}
                              disabled={!booking.id || booking.id === 'null'}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              View Bill
                            </Button>
                          </div>
                        </div>
                      </div>
                      {booking.adminNotes && (
                        <div className="bg-blue-50 p-3 rounded-md">
                          <h4 className="font-medium text-sm text-blue-800 mb-1">Admin Notes</h4>
                          <p className="text-sm text-blue-700">{booking.adminNotes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !bookingsError ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                    <p className="text-gray-600">
                      Ad bookings will appear here once customers start placing orders.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}