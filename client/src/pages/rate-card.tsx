import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FileText, Calculator, Filter } from "lucide-react";

export default function RateCard() {
  const [, setLocation] = useLocation();
  const [newspapers, setNewspapers] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [adTypes, setAdTypes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [rates, setRates] = useState<any[]>([]);
  const [editions, setEditions] = useState<any[]>([]);
  const [error, setError] = useState<string>("");

  // Filter states
  const [selectedNewspaper, setSelectedNewspaper] = useState("");
  const [selectedAdType, setSelectedAdType] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [newspapersRes, citiesRes] = await Promise.all([
          fetch("/api/newspapers"),
          fetch("/api/cities")
        ]);
        const newspapersData = await newspapersRes.json();
        const citiesData = await citiesRes.json();
        setNewspapers(Array.isArray(newspapersData) ? newspapersData : []);
        setCities(Array.isArray(citiesData) ? citiesData : []);
      } catch (error) {
        console.error("Failed to load initial data:", error);
      }
    };
    loadInitialData();
  }, []);

  // Load ad types when newspaper changes
  useEffect(() => {
    setError("");
    if (selectedNewspaper) {
      fetch(`/api/newspapers/${selectedNewspaper}/ad-types`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => setAdTypes(Array.isArray(data) ? data : []))
        .catch(err => {
          console.error("Failed to load ad types:", err);
          setAdTypes([]);
        });
    } else {
      setAdTypes([]);
    }
    setSelectedAdType("");
    setSelectedCategory("");
  }, [selectedNewspaper]);

  // Load categories when ad type changes
  useEffect(() => {
    if (selectedAdType) {
      fetch(`/api/ad-types/${selectedAdType}/categories`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => setCategories(Array.isArray(data) ? data : []))
        .catch(err => {
          console.error("Failed to load categories:", err);
          setCategories([]);
        });
    } else {
      setCategories([]);
    }
    setSelectedCategory("");
  }, [selectedAdType]);

  // Load packages and rates when filters change
  useEffect(() => {
    setError("");
    if (selectedNewspaper) {
      // Load packages
      fetch(`/api/newspapers/${selectedNewspaper}/packages`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => setPackages(Array.isArray(data) ? data : []))
        .catch(err => {
          console.error("Failed to load packages:", err);
          setPackages([]);
        });

      // Load editions
      fetch(`/api/newspapers/${selectedNewspaper}/editions`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => setEditions(Array.isArray(data) ? data : []))
        .catch(err => {
          console.error("Failed to load editions:", err);
          setEditions([]);
        });

      // Load rates based on filters
      const loadRates = async () => {
        try {
          const params = new URLSearchParams();
          if (selectedNewspaper) params.append('newspaperId', selectedNewspaper);
          if (selectedAdType) params.append('adTypeId', selectedAdType);
          if (selectedCategory) params.append('categoryId', selectedCategory);
          if (selectedCity) params.append('cityId', selectedCity);

          const res = await fetch(`/api/rates?${params}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          setRates(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error("Failed to load rates:", error);
          setRates([]);
        }
      };

      loadRates();
    }
  }, [selectedNewspaper, selectedAdType, selectedCategory, selectedCity]);

  // Filter packages based on selected filters
  const filteredPackages = packages.filter(pkg => {
    if (selectedAdType && pkg.adTypeId !== selectedAdType) return false;
    return true;
  });

  // Filter rates based on selected filters
  const filteredRates = rates.filter(rate => {
    if (selectedAdType && rate.adTypeId !== selectedAdType) return false;
    if (selectedCategory && rate.categoryId !== selectedCategory) return false;
    if (selectedCity && rate.cityId !== selectedCity) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => setLocation("/")} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rate Card</h1>
            <p className="text-gray-600">Browse newspaper rates and packages by category, newspaper, and location</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter Rates & Packages
            </CardTitle>
            <CardDescription>Select your preferences to view relevant rates and packages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Newspaper Filter */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Newspaper</label>
                <Select value={selectedNewspaper} onValueChange={setSelectedNewspaper}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Newspaper" />
                  </SelectTrigger>
                  <SelectContent>
                    {newspapers.map((paper) => (
                      <SelectItem key={paper.id} value={paper.id}>{paper.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ad Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Ad Category</label>
                <Select value={selectedAdType} onValueChange={setSelectedAdType} disabled={!selectedNewspaper}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Ad Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {adTypes.map((adType) => (
                      <SelectItem key={adType.id} value={adType.id}>{adType.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Sub-Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={!selectedAdType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Sub-Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location Filter */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Location</label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Location" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {selectedNewspaper && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Packages Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Available Packages
                  </CardTitle>
                  <CardDescription>
                    {filteredPackages.length > 0
                      ? `Found ${filteredPackages.length} package${filteredPackages.length !== 1 ? 's' : ''}`
                      : "No packages available for selected filters"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredPackages.length > 0 ? (
                      filteredPackages.map((pkg) => (
                        <Card key={pkg.id} className="border-2">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold">{pkg.name}</h3>
                              <Badge variant={pkg.pricingType === 'per_word' ? 'default' : 'secondary'}>
                                {pkg.pricingType === 'per_word' ? 'Per Word' : 'Per Line'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-2xl font-bold text-primary">₹{pkg.price}</p>
                                {pkg.discount > 0 && (
                                  <p className="text-sm text-green-600">
                                    {pkg.discount}% discount available
                                  </p>
                                )}
                              </div>
                              <div className="text-right text-xs text-gray-500">
                                <p>Valid until: {pkg.expiryDate ? new Date(pkg.expiryDate * 1000).toLocaleDateString() : 'No expiry'}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No packages found for the selected filters.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Editions */}
              <Card>
                <CardHeader>
                  <CardTitle>Available Editions</CardTitle>
                  <CardDescription>Publication locations for this newspaper</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3">
                    {editions.map((edition) => (
                      <Card key={edition.id} className="border">
                        <CardContent className="p-3">
                          <h4 className="font-medium">{edition.editionName}</h4>
                          <p className="text-sm text-gray-600">{edition.state}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Rates Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Rate Details
                  </CardTitle>
                  <CardDescription>
                    {filteredRates.length > 0
                      ? `Found ${filteredRates.length} rate${filteredRates.length !== 1 ? 's' : ''} for selected criteria`
                      : "No specific rates found for selected filters"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredRates.length > 0 ? (
                      filteredRates.map((rate) => (
                        <Card key={rate.id} className="border">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-semibold">{rate.sizeUnit.replace('_', ' ').toUpperCase()}</h4>
                                <p className="text-sm text-gray-600">
                                  {rate.language} • {rate.notes || 'Standard rate'}
                                </p>
                              </div>
                              <Badge variant="outline">
                                ₹{rate.baseRate} per {rate.sizeUnit.replace('per_', '')}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500">
                              {rate.editionId && <span>Edition: {editions.find(e => e.id === rate.editionId)?.editionName || rate.editionId}</span>}
                              {rate.cityId && <span> • City: {cities.find(c => c.id === rate.cityId)?.name || rate.cityId}</span>}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">No specific rates found for the selected filters.</p>
                        <p className="text-sm text-gray-400">Try selecting different combinations or contact us for custom rates.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Calculator */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Quick Cost Calculator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Use our booking page for detailed cost calculations with dates and locations.
                  </p>
                  <Button onClick={() => setLocation("/booking")} className="w-full">
                    Start Booking Now
                  </Button>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p><strong>Phone:</strong> +91-94170 80721</p>
                    <p><strong>Email:</strong> amitadvt1@gmail.com</p>
                    <p><strong>Address:</strong> SCO 410, First Floor, Sector 8, Panchkula, Haryana 134109, India</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {!selectedNewspaper && (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Select a Newspaper</h3>
              <p className="text-gray-500">Choose a newspaper from the filters above to view available rates and packages.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}