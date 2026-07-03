import { useState, useEffect, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, Star, CalendarIcon, Plus, X, Search } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

// Steps: 1=Newspaper+Editions, 2=Category, 3=Ad Heading, 4=Rate, 5=Create Ad, 6=Dates
const STEP_LABELS = ["Newspaper", "Category", "Ad Heading", "Rate", "Create Ad", "Dates"];
const TOTAL_STEPS = 6;

export default function Booking() {
  const [, setLocation] = useLocation();
  useSearch();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [newspapers, setNewspapers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [, setLoadingSubcategories] = useState(false);
  const [preferredClassifications, setPreferredClassifications] = useState<any[]>([]);
  const [subClassifications, setSubClassifications] = useState<any[]>([]);
  const [adEnchantments, setAdEnchantments] = useState<any[]>([]);
  const [rates, setRates] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [, setAdMatters] = useState<any[]>([]);

  const [selectedNewspaperId, setSelectedNewspaperId] = useState<string>("");
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [selectedRateId, setSelectedRateId] = useState<string>("");
  const [selectedEnchantments, setSelectedEnchantments] = useState<string[]>([]);
  const [selectedBackgroundColor, setSelectedBackgroundColor] = useState<string>("#FFF8DC");
  const [publishDates, setPublishDates] = useState<Date[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [newspaperSearch, setNewspaperSearch] = useState<string>("");
  const [editions, setEditions] = useState<any[]>([]);
  const [selectedEditionIds, setSelectedEditionIds] = useState<string[]>([]);
  const [editionCombos, setEditionCombos] = useState<any[]>([]);
  const [selectedComboId, setSelectedComboId] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    description: "",
    content: "",
    newspaperId: "",
    adTypeId: "",
    categoryId: "",
    categoryName: "",
    subcategoryId: "",
    subcategoryName: "",
    preferredClassificationId: "",
    subClassificationId: "",
    packageId: "",
    rateId: "",
    size: 5,
    language: "EN",
    tags: [] as string[],
    enchantments: [] as string[],
  });

  // ── Derived lists ──────────────────────────────────────────────────────────

  const uniqueCategories = useMemo(() => {
    const seen = new Set<string>();
    return categories.filter(cat => {
      if (seen.has(cat.name)) return false;
      seen.add(cat.name);
      return true;
    });
  }, [categories]);

  // Edition-rate map: editionId → baseRate
  const editionRateMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const rate of rates) {
      if (rate.editionId && !map.has(rate.editionId)) {
        map.set(rate.editionId, rate.baseRate || 0);
      }
    }
    return map;
  }, [rates]);

  // Categories are universal across editions — editions only affect pricing, not which categories exist
  const filteredCategories = uniqueCategories;

  // Filter displayed rates by selected editions only, and remove Standard-tier rates (baseRate 50–99)
  const displayedRates = useMemo(() => {
    const isBasic = (r: any) => !(r.baseRate >= 50 && r.baseRate < 100);

    if (selectedEditionIds.length === 0) {
      return rates.filter(isBasic);
    }
    const allEditionsEdition = editions.find(e =>
      e.editionName?.toLowerCase() === "all editions"
    );
    if (allEditionsEdition && selectedEditionIds.includes(allEditionsEdition.id)) {
      return rates.filter(isBasic);
    }
    return rates.filter(r => isBasic(r) && (!r.editionId || selectedEditionIds.includes(r.editionId)));
  }, [rates, selectedEditionIds, editions]);

  // ── Data loading ───────────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      try {
        const [npRes, catRes, enchRes] = await Promise.all([
          fetch("/api/newspapers"),
          fetch("/api/categories"),
          fetch("/api/ad-enchantments"),
        ]);
        if (npRes.ok) setNewspapers(await npRes.json());
        if (catRes.ok) setCategories(await catRes.json());
        if (enchRes.ok) setAdEnchantments(await enchRes.json());
      } catch (e) {
        console.error("Initial load error", e);
      }
    };
    load();
  }, []);

  // Editions + combos + adTypes when newspaper selected
  useEffect(() => {
    if (!selectedNewspaperId) {
      setEditions([]);
      setEditionCombos([]);
      setSelectedEditionIds([]);
      setSelectedComboId("");
      return;
    }
    const load = async () => {
      try {
        const [edRes, comboRes] = await Promise.all([
          fetch(`/api/newspapers/${selectedNewspaperId}/editions`),
          fetch(`/api/newspapers/${selectedNewspaperId}/edition-combos`),
        ]);
        setEditions(edRes.ok ? await edRes.json() : []);
        setEditionCombos(comboRes.ok ? await comboRes.json() : []);
      } catch { setEditions([]); setEditionCombos([]); }
    };
    load();
  }, [selectedNewspaperId]);

  // Load newspaper-specific categories from its ad types and merge with global categories
  useEffect(() => {
    if (!selectedNewspaperId) return;
    const load = async () => {
      setLoadingCategories(true);
      try {
        const adTypesRes = await fetch(`/api/newspapers/${selectedNewspaperId}/ad-types`);
        if (!adTypesRes.ok) return;
        const adTypes = await adTypesRes.json();
        const catArrays = await Promise.all(
          adTypes.map((at: any) =>
            fetch(`/api/ad-types/${at.id}/categories`).then(r => r.ok ? r.json() : [])
          )
        );
        const newCats: any[] = catArrays.flat().filter((c: any) => c.active !== false);
        if (newCats.length === 0) return;
        setCategories(prev => {
          const existingIds = new Set(prev.map((c: any) => c.id));
          const toAdd = newCats.filter((c: any) => !existingIds.has(c.id));
          return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
        });
      } catch { /* silently ignore */ }
      finally { setLoadingCategories(false); }
    };
    load();
  }, [selectedNewspaperId]);

  // Rates + packages when newspaper or category changes
  useEffect(() => {
    if (!selectedNewspaperId) { setRates([]); setPackages([]); return; }
    const catParam = formData.categoryId ? `&categoryId=${formData.categoryId}` : "";
    const load = async () => {
      try {
        const [rateRes, pkgRes] = await Promise.all([
          fetch(`/api/rates?newspaperId=${selectedNewspaperId}${catParam}`),
          fetch(`/api/newspapers/${selectedNewspaperId}/packages`),
        ]);
        setRates(rateRes.ok ? await rateRes.json() : []);
        setPackages(pkgRes.ok ? (await pkgRes.json() ?? []) : []);
      } catch { setRates([]); setPackages([]); }
    };
    load();
  }, [selectedNewspaperId, formData.categoryId]);

  // Ad matters when rate selected
  useEffect(() => {
    if (!selectedRateId) { setAdMatters([]); return; }
    const load = async () => {
      try {
        const token = localStorage.getItem("sessionToken");
        const res = await fetch(`/api/ad-matters?rateId=${selectedRateId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) setAdMatters(await res.json());
      } catch { }
    };
    load();
  }, [selectedRateId]);

  // Subcategories when category changes
  useEffect(() => {
    if (!formData.categoryId) { setSubcategories([]); return; }
    setLoadingSubcategories(true);
    const load = async () => {
      try {
        const res = await fetch(`/api/categories/${formData.categoryId}/subcategories`);
        setSubcategories(res.ok ? await res.json() : []);
      } catch { setSubcategories([]); }
      finally { setLoadingSubcategories(false); }
    };
    load();
  }, [formData.categoryId]);

  // Preferred classifications when subcategory changes
  useEffect(() => {
    if (!formData.subcategoryId) { setPreferredClassifications([]); return; }
    const load = async () => {
      try {
        const res = await fetch(`/api/subcategories/${formData.subcategoryId}/preferred-classifications`);
        setPreferredClassifications(res.ok ? await res.json() : []);
      } catch { setPreferredClassifications([]); }
    };
    load();
  }, [formData.subcategoryId]);

  // Sub-classifications when preferred classification changes
  useEffect(() => {
    if (!formData.preferredClassificationId) { setSubClassifications([]); return; }
    const load = async () => {
      try {
        const res = await fetch(`/api/preferred-classifications/${formData.preferredClassificationId}/sub-classifications`);
        setSubClassifications(res.ok ? await res.json() : []);
      } catch { setSubClassifications([]); }
    };
    load();
  }, [formData.preferredClassificationId]);

  // Sync formData when rate is selected
  useEffect(() => {
    if (!selectedRateId || rates.length === 0) return;
    const rate = rates.find(r => r.id === selectedRateId);
    if (rate) {
      setFormData(prev => ({
        ...prev,
        newspaperId: rate.newspaperId,
        adTypeId: rate.adTypeId,
        categoryId: rate.categoryId || prev.categoryId,
        rateId: rate.id,
        size: rate.exactSize || rate.minSize || 1,
      }));
    }
  }, [selectedRateId, rates]);

  // Sync when package is selected and rates load
  useEffect(() => {
    if (!selectedPackageId || rates.length === 0) return;
    const pkg = packages.find(p => p.id === selectedPackageId);
    if (!pkg) return;
    const matchingRate = rates.find(r =>
      r.newspaperId === pkg.newspaperId && (!pkg.categoryId || r.categoryId === pkg.categoryId)
    );
    if (matchingRate && selectedRateId !== matchingRate.id) {
      setSelectedRateId(matchingRate.id);
      setFormData(prev => ({
        ...prev,
        rateId: matchingRate.id,
        packageId: pkg.id,
        newspaperId: matchingRate.newspaperId,
        categoryId: pkg.categoryId || prev.categoryId,
        adTypeId: matchingRate.adTypeId,
        size: matchingRate.exactSize || matchingRate.minSize || 1,
      }));
    }
  }, [selectedPackageId, rates, packages, selectedRateId]);

  // ── Navigation ─────────────────────────────────────────────────────────────

  const handleNext = () => {
    if (step === 1) {
      if (!selectedNewspaperId) { setError("Please select a newspaper"); return; }
      setError(""); setStep(2); return;
    }
    if (step === 2) {
      if (!formData.categoryId) { setError("Please select a category"); return; }
      setError(""); setStep(3); return;
    }
    if (step === 3) {
      // Ad heading optional — advance to rate if rates exist
      setError("");
      if (displayedRates.length > 0 || packages.length > 0) {
        setStep(4);
      } else {
        setSelectedRateId("none");
        setFormData(prev => ({ ...prev, rateId: "none", packageId: "" }));
        setStep(5);
      }
      return;
    }
    if (step === 4) {
      if (!selectedRateId && (packages.length > 0 || displayedRates.length > 0)) {
        setError("Please select a package, rate, or choose 'Skip'");
        return;
      }
      setError(""); setStep(5); return;
    }
    if (step === 5) {
      const resolvedNewspaperId = formData.newspaperId || selectedNewspaperId;
      const resolvedAdTypeId = formData.adTypeId || categories.find(c => c.id === formData.categoryId)?.adTypeId || "";
      const missing: string[] = [];
      if (!formData.name) missing.push("Client Name");
      if (!formData.phone) missing.push("Phone Number");
      if (!formData.content) missing.push("Ad Content");
      if (!resolvedNewspaperId) missing.push("Newspaper");
      if (missing.length > 0) { setError(`Please fill required fields: ${missing.join(", ")}`); return; }
      setFormData(prev => ({ ...prev, newspaperId: resolvedNewspaperId, adTypeId: resolvedAdTypeId }));
      setError(""); setStep(6); return;
    }
    if (step === 6) {
      if (publishDates.length === 0) { setError("Please select at least one publication date"); return; }
      handleSubmit(); return;
    }
    setError(""); setStep(s => s + 1);
  };

  const handlePrev = () => { setError(""); if (step > 1) setStep(step - 1); };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const getLineCount = (text: string) => {
        const words = text.split(/\s+/);
        const lines: string[] = [];
        let cur = "";
        for (const w of words) {
          if (cur.length > 0 && (cur + " " + w).length > 28) { lines.push(cur); cur = w; }
          else if (cur.length === 0) cur = w;
          else cur += " " + w;
        }
        if (cur.length > 0) lines.push(cur);
        return Math.max(lines.length, 1);
      };

      const actualLines = getLineCount(formData.content);
      const datesCount = Math.max(publishDates.length, 1);
      let calculatedCost = 0;
      let selectedPackage: any = null;
      let selectedRate: any = null;

      if (selectedPackageId) {
        selectedPackage = packages.find(p => p.id === selectedPackageId);
        if (selectedPackage) {
          if (selectedPackage.packageType === "buy_get" && selectedPackage.buyQuantity && selectedPackage.getQuantity) {
            const groupSize = selectedPackage.buyQuantity + selectedPackage.getQuantity;
            const fullGroups = Math.floor(datesCount / groupSize);
            const rem = datesCount % groupSize;
            const paidDates = fullGroups * selectedPackage.buyQuantity + Math.min(rem, selectedPackage.buyQuantity);
            calculatedCost = selectedPackage.price * paidDates;
          } else {
            calculatedCost = selectedPackage.price * datesCount;
          }
        }
      } else {
        if (selectedRateId === "none" && rates.length > 0) selectedRate = rates[0];
        selectedRate = selectedRate || rates.find(r => r.id === selectedRateId);
        if (selectedRate) {
          let single = 0;
          if (selectedRate.exactSize && selectedRate.fixedRate && actualLines <= selectedRate.exactSize)
            single = selectedRate.fixedRate;
          else if (selectedRate.exactSize && selectedRate.fixedRate && actualLines > selectedRate.exactSize)
            single = selectedRate.fixedRate + (actualLines - selectedRate.exactSize) * selectedRate.baseRate;
          else
            single = actualLines * selectedRate.baseRate;
          calculatedCost = single * datesCount;
        }
      }

      const enchMult = selectedEnchantments.reduce((m, id) => {
        const e = adEnchantments.find(en => en.id === id);
        return m * (e?.price ? 1 + e.price / 100 : 1);
      }, 1);
      calculatedCost *= enchMult;

      const selectedCategory = categories.find(c => c.id === formData.categoryId);
      const selectedNewspaper = newspapers.find(n => n.id === selectedNewspaperId);
      const finalAdTypeId = formData.adTypeId || selectedCategory?.adTypeId || "";

      const summaryData = {
        ...formData,
        newspaperId: selectedNewspaper?.id || selectedNewspaperId,
        editionId: selectedRate?.editionId,
        editionIds: selectedEditionIds,
        editionNames: editions.filter(e => selectedEditionIds.includes(e.id)).map(e => e.editionName),
        newspaperName: selectedNewspaper?.name || "",
        categoryName: formData.categoryName || selectedCategory?.name || "",
        subcategoryName: formData.subcategoryName || subcategories.find(s => s.id === formData.subcategoryId)?.name || "",
        preferredClassificationName: preferredClassifications.find(p => p.id === formData.preferredClassificationId)?.name || "",
        subClassificationName: subClassifications.find(s => s.id === formData.subClassificationId)?.name || "",
        adTypeId: finalAdTypeId,
        selectedRateId,
        selectedRate,
        selectedPackageName: selectedPackage?.name || "",
        selectedRateName: selectedRateId === "none" ? "No Rate Selected" : selectedRate?.name || "",
        calculatedCost,
        gst: Math.round(calculatedCost * 0.05),
        totalCost: Math.round(calculatedCost * 1.05),
        enchantments: selectedEnchantments,
        options: {
          enchantments: selectedEnchantments,
          backgroundColor: selectedBackgroundColor,
          customerName: formData.name,
          contactPhone: formData.phone,
          customerPhone: formData.phone,
        },
        backgroundColor: selectedBackgroundColor,
        publishDates: publishDates.map(d => d.toISOString().split("T")[0]),
        calculatedPricing: {
          selectedRateId,
          packageId: selectedPackage?.id || formData.packageId,
          publishDates: publishDates.map(d => d.toISOString().split("T")[0]),
          totalCost: Math.round(calculatedCost),
          gst: Math.round(calculatedCost * 0.05),
          finalCost: Math.round(calculatedCost * 1.05),
          actualLines,
        },
      };

      sessionStorage.setItem("lastBooking", JSON.stringify(summaryData));
      setLocation("/booking-summary");
    } catch {
      setError("Failed to prepare booking data");
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getRateTier = (_rate: any) => {
    return { name: "Basic", icon: FileText, color: "text-blue-600", bgColor: "bg-blue-50" };
  };

  const getLineCount = (text: string) => {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      if (cur.length > 0 && (cur + " " + w).length > 28) { lines.push(cur); cur = w; }
      else if (cur.length === 0) cur = w;
      else cur += " " + w;
    }
    if (cur.length > 0) lines.push(cur);
    return Math.max(lines.length, 1);
  };

  const formatForNewspaper = (text: string) => {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      if (cur.length > 0 && (cur + " " + w).length > 28) { lines.push(cur); cur = w; }
      else if (cur.length === 0) cur = w;
      else cur += " " + w;
    }
    if (cur.length > 0) lines.push(cur);
    return lines.join("\n");
  };

  const selectedNewspaperName = newspapers.find(n => n.id === selectedNewspaperId)?.name || "";
  const selectedCategoryName = categories.find(c => c.id === formData.categoryId)?.name || "";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  step >= s ? "bg-primary text-white" : "bg-neutral-200 text-neutral-400"
                }`}>
                  {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
                </div>
                {s < TOTAL_STEPS && <div className={`flex-1 h-1 mx-1 ${step > s ? "bg-primary" : "bg-neutral-200"}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs font-medium text-neutral-600">
            {STEP_LABELS.map(l => <span key={l}>{l}</span>)}
          </div>
        </div>

        <Card className="shadow-lg border-neutral-100">
          <CardHeader className="bg-neutral-50 border-b border-neutral-100">
            <CardTitle>
              {step === 1 && "Choose Your Newspaper"}
              {step === 2 && "Select Category"}
              {step === 3 && "Ad Heading"}
              {step === 4 && "Rate"}
              {step === 5 && "Create Your Ad"}
              {step === 6 && "Select Publication Dates"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Select the newspaper (and edition) where you want to advertise"}
              {step === 2 && "Choose the main category for your advertisement"}
              {step === 3 && "Select subcategory and classifications (optional)"}
              {step === 4 && "Choose a package or rate for your advertisement"}
              {step === 5 && "Enter your advertisement details and contact information"}
              {step === 6 && "Choose the dates when your advertisement should be published"}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

              {/* ── Step 1: Newspaper + Edition Selection ─────────────────── */}
              {step === 1 && (
                <div className="space-y-6">
                  {/* Search bar — shows all 68+ newspapers in scrollable dropdown */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search all 68+ newspapers…"
                      value={newspaperSearch}
                      onChange={e => { setNewspaperSearch(e.target.value); setDropdownOpen(true); }}
                      onFocus={() => setDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
                      className="pl-9"
                    />
                    {dropdownOpen && newspapers.length > 0 && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-xl max-h-72 overflow-y-auto">
                        {newspapers
                          .filter(n => !newspaperSearch || n.name.toLowerCase().includes(newspaperSearch.toLowerCase()))
                          .map(n => (
                            <button
                              key={n.id}
                              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-primary/5 flex items-center justify-between ${selectedNewspaperId === n.id ? "bg-primary/10 font-semibold text-primary" : ""}`}
                              onMouseDown={e => {
                                e.preventDefault();
                                setSelectedNewspaperId(n.id);
                                setSelectedEditionIds([]);
                                setSelectedComboId("");
                                setFormData(prev => ({ ...prev, newspaperId: n.id }));
                                setNewspaperSearch("");
                                setDropdownOpen(false);
                              }}
                            >
                              <span>{n.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">{n.language}</span>
                            </button>
                          ))}
                        {newspaperSearch && newspapers.filter(n => n.name.toLowerCase().includes(newspaperSearch.toLowerCase())).length === 0 && (
                          <p className="px-4 py-3 text-sm text-muted-foreground">No newspapers found</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected newspaper display */}
                  {selectedNewspaperId && (() => {
                    const np = newspapers.find(n => n.id === selectedNewspaperId);
                    return np ? (
                      <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{np.name}</p>
                          <p className="text-xs text-muted-foreground">{np.language} • {np.type}</p>
                        </div>
                        <button
                          className="text-xs text-muted-foreground hover:text-red-500"
                          onClick={() => { setSelectedNewspaperId(""); setSelectedEditionIds([]); setFormData(prev => ({ ...prev, newspaperId: "" })); }}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : null;
                  })()}

                  {/* Edition grid */}
                  {selectedNewspaperId && editions.length > 0 && (
                    <div className="mt-6 space-y-6 border-t pt-6">
                      <div>
                        <h3 className="text-base font-semibold mb-1">Select Edition(s)</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Choose specific city editions, or select "All Editions" to see all rates.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {editions.map((edition: any) => {
                            const baseRate = editionRateMap.get(edition.id);
                            const isSelected = selectedEditionIds.includes(edition.id);
                            return (
                              <div
                                key={edition.id}
                                className={`border rounded-lg p-3 text-center cursor-pointer transition-all ${
                                  isSelected
                                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                                    : "border-neutral-200 hover:border-primary/50"
                                }`}
                                onClick={() => {
                                  setSelectedComboId("");
                                  setSelectedEditionIds(prev =>
                                    isSelected ? prev.filter(id => id !== edition.id) : [...prev, edition.id]
                                  );
                                }}
                              >
                                <p className="font-medium text-sm">{edition.editionName}</p>
                                {baseRate !== undefined ? (
                                  <p className="text-xs text-muted-foreground mt-1">₹{baseRate * 5}/5 lines</p>
                                ) : edition.editionName?.toLowerCase().includes("all") ? (
                                  <p className="text-xs text-muted-foreground mt-1">All city editions</p>
                                ) : (
                                  <p className="text-xs text-muted-foreground mt-1">—</p>
                                )}
                                <Button
                                  variant={isSelected ? "default" : "outline"}
                                  size="sm"
                                  className="mt-2 h-7 text-xs w-full"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedComboId("");
                                    setSelectedEditionIds(prev =>
                                      isSelected ? prev.filter(id => id !== edition.id) : [...prev, edition.id]
                                    );
                                  }}
                                >
                                  {isSelected ? <><X className="w-3 h-3 mr-1" />Remove</> : <><Plus className="w-3 h-3 mr-1" />Add</>}
                                </Button>
                              </div>
                            );
                          })}
                        </div>

                        {selectedEditionIds.length > 0 && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm font-medium text-blue-800">
                              Selected editions: {editions.filter(e => selectedEditionIds.includes(e.id)).map(e => e.editionName).join(", ")}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Combo packages */}
                      {editionCombos.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-base font-semibold">Edition Combo Packages</h3>
                          <p className="text-sm text-muted-foreground">Pre-defined multi-city packages at special prices</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {editionCombos.map((combo: any) => (
                              <Card
                                key={combo.id}
                                className={`cursor-pointer transition-all hover:shadow-md ${
                                  selectedComboId === combo.id ? "ring-2 ring-primary bg-primary/5" : "hover:border-primary/50"
                                }`}
                                onClick={() => {
                                  if (selectedComboId === combo.id) {
                                    setSelectedComboId(""); setSelectedEditionIds([]);
                                  } else {
                                    setSelectedComboId(combo.id);
                                    setSelectedEditionIds((combo.editions || []).map((e: any) => e.id));
                                  }
                                }}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-semibold text-sm">{combo.name}</h4>
                                    <span className="text-sm font-bold text-primary">₹{combo.totalPrice}</span>
                                  </div>
                                  {combo.description && (
                                    <p className="text-xs text-muted-foreground mb-3">{combo.description}</p>
                                  )}
                                  <div className="flex flex-wrap gap-1 mb-3">
                                    {(combo.editions || []).map((ed: any) => (
                                      <Badge key={ed.id} variant="secondary" className="text-xs">{ed.editionName}</Badge>
                                    ))}
                                  </div>
                                  <Button
                                    variant={selectedComboId === combo.id ? "default" : "outline"}
                                    size="sm"
                                    className="w-full h-8 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (selectedComboId === combo.id) {
                                        setSelectedComboId(""); setSelectedEditionIds([]);
                                      } else {
                                        setSelectedComboId(combo.id);
                                        setSelectedEditionIds((combo.editions || []).map((e: any) => e.id));
                                      }
                                    }}
                                  >
                                    {selectedComboId === combo.id ? "Selected" : "Book This Package"}
                                  </Button>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 2: Category Selection ────────────────────────────── */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                    <span className="text-sm font-medium text-blue-800">
                      {selectedNewspaperName}
                      {selectedEditionIds.length > 0 && ` — ${editions.filter(e => selectedEditionIds.includes(e.id)).map(e => e.editionName).join(", ")}`}
                    </span>
                  </div>

                  {selectedEditionIds.length > 0 && filteredCategories.length < uniqueCategories.length && (
                    <div className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded p-2">
                      Showing {filteredCategories.length} categories available for the selected edition(s).
                      <button className="ml-2 underline" onClick={() => setSelectedEditionIds([])}>Show all</button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCategories.map((category) => (
                      <Card
                        key={category.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          formData.categoryId === category.id ? "ring-2 ring-primary bg-primary/5" : "hover:border-primary/50"
                        }`}
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          categoryId: category.id,
                          categoryName: category.name,
                          adTypeId: category.adTypeId || prev.adTypeId,
                        }))}
                      >
                        <CardContent className="p-6">
                          <div className="text-center">
                            <h4 className="font-semibold text-lg mb-2">{category.name}</h4>
                            {category.description && (
                              <p className="text-sm text-muted-foreground">{category.description}</p>
                            )}
                            {formData.categoryId === category.id && (
                              <div className="mt-4 flex items-center justify-center text-primary">
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                <span className="text-sm font-medium">Selected</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {filteredCategories.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {loadingCategories ? "Loading categories…" : "No categories available. Please add categories for this newspaper in the admin panel."}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 3: Ad Heading ────────────────────────────────────── */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                    <span className="text-sm font-medium text-blue-800">Category: {selectedCategoryName}</span>
                  </div>

                  <p className="text-sm text-muted-foreground">Select a subcategory and classifications for your ad (optional).</p>

                  {subcategories.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold">Subcategory</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subcategories.map((sub) => (
                          <Card
                            key={sub.id}
                            className={`cursor-pointer transition-all hover:shadow-md ${
                              formData.subcategoryId === sub.id ? "ring-2 ring-primary bg-primary/5" : "hover:border-primary/50"
                            }`}
                            onClick={() => setFormData(prev => ({ ...prev, subcategoryId: sub.id, subcategoryName: sub.name }))}
                          >
                            <CardContent className="p-6 text-center">
                              <h4 className="font-semibold text-lg mb-2">{sub.name}</h4>
                              {sub.description && <p className="text-sm text-muted-foreground">{sub.description}</p>}
                              {formData.subcategoryId === sub.id && (
                                <div className="mt-4 flex items-center justify-center text-primary">
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  <span className="text-sm font-medium">Selected</span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {formData.subcategoryId && preferredClassifications.length > 0 && (
                    <div className="space-y-2">
                      <Label>Preferred Classification</Label>
                      <Select
                        value={formData.preferredClassificationId}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, preferredClassificationId: v, subClassificationId: "" }))}
                      >
                        <SelectTrigger><SelectValue placeholder="Select preferred classification" /></SelectTrigger>
                        <SelectContent>
                          {preferredClassifications.map((pc) => (
                            <SelectItem key={pc.id} value={pc.id}>{pc.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formData.preferredClassificationId && subClassifications.length > 0 && (
                    <div className="space-y-2">
                      <Label>Sub Classification</Label>
                      <Select
                        value={formData.subClassificationId}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, subClassificationId: v }))}
                      >
                        <SelectTrigger><SelectValue placeholder="Select sub classification" /></SelectTrigger>
                        <SelectContent>
                          {subClassifications.map((sc) => (
                            <SelectItem key={sc.id} value={sc.id}>{sc.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 4: Package & Rate Selection ─────────────────────── */}
              {step === 4 && (
                <div className="space-y-6">
                  {/* Context banner */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-sm font-medium text-blue-800">{selectedNewspaperName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-sm text-blue-700">
                        Editions: {selectedEditionIds.length > 0
                          ? editions.filter(e => selectedEditionIds.includes(e.id)).map(e => e.editionName).join(", ")
                          : "All Editions"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-sm text-blue-700">Category: {selectedCategoryName}</span>
                    </div>
                  </div>
                  {selectedEditionIds.length === 0 && editions.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Showing all edition rates. Go back to step 1 to narrow down to specific edition(s).
                    </p>
                  )}


                  {/* Packages */}
                  {packages.filter(pkg => !pkg.categoryId || pkg.categoryId === formData.categoryId).length > 0 && (
                    <>
                      <div>
                        <h3 className="text-lg font-semibold mb-1">Promotional Packages</h3>
                        <p className="text-sm text-muted-foreground mb-4">Special offers like Buy 1 Get 1 Free, etc.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        {packages.filter(pkg => !pkg.categoryId || pkg.categoryId === formData.categoryId).map((pkg) => {
                          const pkgCat = categories.find(c => c.id === pkg.categoryId);
                          const pkgRate = rates.find(r => r.newspaperId === pkg.newspaperId && (!pkg.categoryId || r.categoryId === pkg.categoryId));
                          return (
                            <Card
                              key={pkg.id}
                              className={`cursor-pointer transition-all hover:shadow-md ${
                                selectedPackageId === pkg.id ? "ring-2 ring-primary bg-primary/5" : "hover:border-primary/50"
                              }`}
                              onClick={() => {
                                setSelectedPackageId(pkg.id);
                                setSelectedNewspaperId(pkg.newspaperId);
                                setFormData(prev => ({
                                  ...prev,
                                  packageId: pkg.id,
                                  newspaperId: pkg.newspaperId,
                                  categoryId: pkg.categoryId || "",
                                  adTypeId: pkgCat?.adTypeId || prev.adTypeId,
                                  rateId: pkgRate?.id || "",
                                  size: pkgRate?.exactSize || pkgRate?.minSize || 1,
                                }));
                                setSelectedRateId(pkgRate ? pkgRate.id : "");
                              }}
                            >
                              <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="p-2 rounded-full bg-green-100"><Star className="w-5 h-5 text-green-600" /></div>
                                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">Package</span>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-sm">{pkg.name}</h4>
                                  <p className="text-xs text-muted-foreground">
                                    ₹{pkg.price} {pkg.pricingType === "per_word" ? "per word" : "per line"}
                                    {pkg.packageType === "buy_get" && pkg.buyQuantity && pkg.getQuantity && (
                                      <span className="ml-1 font-medium">({pkg.buyQuantity}+{pkg.getQuantity})</span>
                                    )}
                                  </p>
                                  {pkg.description && <p className="text-xs text-muted-foreground">{pkg.description}</p>}
                                </div>
                                {selectedPackageId === pkg.id && (
                                  <div className="mt-4 flex items-center text-primary">
                                    <CheckCircle2 className="w-4 h-4 mr-2" /><span className="text-sm font-medium">Selected</span>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* Rates */}
                  {displayedRates.length > 0 && (
                    <>
                      <div>
                        <h3 className="text-lg font-semibold mb-1">Rate Packages</h3>
                        <p className="text-sm text-muted-foreground mb-4">Choose the rate that best suits your goals</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {displayedRates.map((rate) => {
                          const tier = getRateTier(rate);
                          const Icon = tier.icon;
                          return (
                            <Card
                              key={rate.id}
                              className={`cursor-pointer transition-all hover:shadow-md ${
                                selectedRateId === rate.id ? "ring-2 ring-primary bg-primary/5" : "hover:border-primary/50"
                              }`}
                              onClick={() => {
                                setSelectedPackageId("");
                                setSelectedRateId(rate.id);
                                setSelectedNewspaperId(rate.newspaperId);
                                setFormData(prev => ({
                                  ...prev,
                                  newspaperId: rate.newspaperId,
                                  adTypeId: rate.adTypeId,
                                  categoryId: rate.categoryId || "",
                                  rateId: rate.id,
                                  size: rate.exactSize || rate.minSize || 1,
                                }));
                              }}
                            >
                              <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                  <div className={`p-2 rounded-full ${tier.bgColor}`}><Icon className={`w-5 h-5 ${tier.color}`} /></div>
                                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${tier.bgColor} ${tier.color}`}>{tier.name}</span>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-base">
                                    {rate.exactSize && rate.fixedRate
                                      ? `₹${rate.fixedRate} for ${rate.exactSize} ${rate.sizeUnit.replace("per_", "")}s`
                                      : `₹${rate.baseRate} / ${rate.sizeUnit.replace("per_", "")}`
                                    }
                                  </h4>
                                  {rate.editionId && (
                                    <p className="text-xs font-medium text-blue-600">
                                      {editions.find(e => e.id === rate.editionId)?.editionName || ""} Edition
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground">{rate.language} • {rate.sizeUnit.replace("per_", "per ")}</p>
                                  {rate.notes && <p className="text-xs text-muted-foreground">{rate.notes}</p>}
                                </div>
                                {selectedRateId === rate.id && (
                                  <div className="mt-4 flex items-center text-primary">
                                    <CheckCircle2 className="w-4 h-4 mr-2" /><span className="text-sm font-medium">Selected</span>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </>
                  )}

                  <Button
                    variant={selectedRateId === "none" ? "secondary" : "outline"}
                    onClick={() => { setSelectedPackageId(""); setSelectedRateId("none"); setFormData(prev => ({ ...prev, rateId: "none", packageId: "" })); }}
                    className="w-full mt-4"
                  >
                    Skip rate / package
                  </Button>
                  {selectedRateId === "none" && (
                    <p className="text-sm text-muted-foreground text-center">You can continue without selecting a rate.</p>
                  )}

                  {packages.length === 0 && displayedRates.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No packages or rates available for this selection</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 5: Create Ad ─────────────────────────────────────── */}
              {step === 5 && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-sm font-medium text-blue-800">Newspaper: {selectedNewspaperName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-sm text-blue-700">
                        Package/Rate: {(() => {
                          if (selectedPackageId) {
                            const p = packages.find(p => p.id === selectedPackageId);
                            if (p) return `${p.name} - ₹${p.price} ${p.pricingType === "per_word" ? "per word" : "per line"}`;
                          }
                          const r = rates.find(r => r.id === selectedRateId);
                          if (r) return r.name || `₹${r.baseRate}/${r.sizeUnit.replace("_", " ")}`;
                          return "N/A";
                        })()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold">Client Name *</label>
                        <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., John Doe" className="mt-1" />
                      </div>
                      <div>
                        <label className="text-sm font-semibold">Phone Number *</label>
                        <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="e.g., +91 9876543210" className="mt-1" />
                      </div>
                      <div>
                        <label className="text-sm font-semibold">Description</label>
                        <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description of the ad" className="mt-1" rows={3} />
                      </div>
                      <div>
                        <label className="text-sm font-semibold">Language</label>
                        <Select value={formData.language} onValueChange={v => setFormData({ ...formData, language: v })}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EN">English</SelectItem>
                            <SelectItem value="HI">Hindi</SelectItem>
                            <SelectItem value="PA">Punjabi</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold">Ad Content *</label>
                        <Textarea value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} placeholder="Enter your advertisement text here..." className="mt-1" rows={8} />
                      </div>

                      {formData.content && (
                        <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-semibold">Newspaper Preview</h4>
                            <span className="text-xs text-neutral-500">28 chars/line</span>
                          </div>
                          <div className="bg-white border border-neutral-300 rounded p-3 text-sm">
                            <div className="font-serif text-neutral-800 whitespace-pre-wrap break-words">
                              {(() => {
                                const formatted = formatForNewspaper(formData.content);
                                let enhanced = formatted;
                                selectedEnchantments.forEach(id => {
                                  const ench = adEnchantments.find(e => e.id === id);
                                  if (ench?.previewHtml) enhanced = ench.previewHtml.replace(/\{text\}/g, enhanced);
                                });
                                if (enhanced === formatted) {
                                  let style = "";
                                  if (selectedEnchantments.some(id => adEnchantments.find(e => e.id === id)?.name === "Bold Text")) style += "font-weight:bold;";
                                  if (selectedEnchantments.some(id => adEnchantments.find(e => e.id === id)?.name === "Border Frame")) style += "border:2px solid #9ca3af;padding:8px;";
                                  const bg = selectedEnchantments.some(id => adEnchantments.find(e => e.id === id)?.name === "Color Background") ? selectedBackgroundColor : "white";
                                  if (style || bg !== "white") enhanced = `<div style="background-color:${bg};${style}">${formatted.replace(/\n/g, "<br>")}</div>`;
                                }
                                return <div dangerouslySetInnerHTML={{ __html: enhanced }} />;
                              })()}
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedRateId && rates.length > 0 && selectedRateId !== "none" && (() => {
                        const r = rates.find(rt => rt.id === selectedRateId);
                        if (!r) return null;
                        const lines = getLineCount(formData.content);
                        let cost = 0;
                        if (r.exactSize && r.fixedRate && lines <= r.exactSize) cost = r.fixedRate;
                        else if (r.exactSize && r.fixedRate) cost = r.fixedRate + (lines - r.exactSize) * r.baseRate;
                        else cost = lines * r.baseRate;
                        const enchMult = selectedEnchantments.reduce((m, id) => {
                          const e = adEnchantments.find(en => en.id === id);
                          return m * (e?.price ? 1 + e.price / 100 : 1);
                        }, 1);
                        const total = Math.round(cost * enchMult);
                        return (
                          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                            <h4 className="text-sm font-semibold mb-2 text-green-800">Estimated Cost</h4>
                            <div className="text-sm text-green-700 space-y-1">
                              <p>Lines: {lines} {r.sizeUnit.replace("_", " ")}</p>
                              <p className="font-semibold">Total: ₹{total}</p>
                              {selectedEnchantments.length > 0 && selectedEnchantments.map(id => {
                                const e = adEnchantments.find(en => en.id === id);
                                return e ? <p key={id} className="text-xs">+ {e.name}: +{e.price}%</p> : null;
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      <div>
                        <label className="text-sm font-semibold">Subcategory/Tags</label>
                        <Input
                          value={formData.tags.join(", ")}
                          onChange={e => setFormData({ ...formData, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                          placeholder="e.g., Wedding, Announcement"
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Separate multiple tags with commas</p>
                      </div>

                      {adEnchantments.length > 0 && (
                        <div>
                          <label className="text-sm font-semibold mb-2 block">Ad Enchantments</label>
                          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                            {adEnchantments.map((ench) => (
                              <div key={ench.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`ench-${ench.id}`}
                                  checked={selectedEnchantments.includes(ench.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedEnchantments(prev => [...new Set([...prev, ench.id])]);
                                      setFormData(prev => ({ ...prev, enchantments: [...new Set([...prev.enchantments, ench.id])] }));
                                    } else {
                                      setSelectedEnchantments(prev => prev.filter(id => id !== ench.id));
                                      setFormData(prev => ({ ...prev, enchantments: prev.enchantments.filter(id => id !== ench.id) }));
                                    }
                                  }}
                                  className="rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor={`ench-${ench.id}`} className="text-sm text-gray-700 cursor-pointer">{ench.name}</label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedEnchantments.some(id => adEnchantments.find(e => e.id === id)?.name === "Color Background") && (
                        <div>
                          <label className="text-sm font-semibold mb-2 block">Background Color</label>
                          <div className="flex gap-2">
                            {[{ name: "Light Yellow", color: "#fef3c7" }, { name: "Light Blue", color: "#dbeafe" }, { name: "Light Green", color: "#d1fae5" }].map(opt => (
                              <button
                                key={opt.color}
                                type="button"
                                onClick={() => setSelectedBackgroundColor(opt.color)}
                                className={`w-8 h-8 rounded-full border-2 ${selectedBackgroundColor === opt.color ? "border-gray-800" : "border-gray-300"}`}
                                style={{ backgroundColor: opt.color }}
                                title={opt.name}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 6: Publication Dates ─────────────────────────────── */}
              {step === 6 && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-sm font-medium text-blue-800">Client: {formData.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-sm text-blue-700">Content: {formData.content.substring(0, 60)}{formData.content.length > 60 ? "…" : ""}</span>
                    </div>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5" />Publication Dates
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2 mb-4">
                          {publishDates.map((date, i) => (
                            <Badge key={i} variant="secondary" className="flex items-center gap-1">
                              {format(date, "dd/MM/yyyy")}
                              <button onClick={() => setPublishDates(publishDates.filter((_, j) => j !== i))} className="ml-1 hover:text-red-600">
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>

                        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                          <PopoverTrigger asChild>
                            <Button type="button" variant="outline" className="w-full">
                              <CalendarIcon className="w-4 h-4 mr-2" />Add Publication Date
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="multiple"
                              selected={publishDates}
                              onSelect={(dates) => {
                                if (!dates) return;
                                const arr = Array.isArray(dates) ? dates : [dates];
                                const next = [...publishDates];
                                arr.forEach(d => {
                                  if (!next.some(x => x.toDateString() === d.toDateString())) next.push(d);
                                });
                                setPublishDates(next);
                                setCalendarOpen(false);
                              }}
                              disabled={(d) => {
                                const today = new Date();
                                const max = new Date();
                                max.setMonth(today.getMonth() + 3);
                                return d < today || d > max;
                              }}
                            />
                          </PopoverContent>
                        </Popover>

                        <p className="text-sm text-muted-foreground">
                          You can select multiple dates. Cost is calculated per publication date.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </motion.div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex justify-between mt-8">
              {step > 1 && (
                <Button variant="outline" onClick={handlePrev}>
                  <ArrowLeft className="w-4 h-4 mr-2" />Previous
                </Button>
              )}
              <div className="flex-1" />
              {step < 5 ? (
                <Button
                  onClick={handleNext}
                  disabled={
                    (step === 1 && !selectedNewspaperId) ||
                    (step === 2 && !formData.categoryId) ||
                    (step === 4 && !selectedRateId && (packages.length > 0 || displayedRates.length > 0))
                  }
                >
                  Next<ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : step === 5 ? (
                <Button onClick={handleNext} disabled={loading || !formData.name || !formData.content}>
                  Next<ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={loading || publishDates.length === 0}>
                  {loading ? "Creating..." : "Submit"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
