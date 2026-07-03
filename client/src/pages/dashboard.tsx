import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LogOut, Plus, FileText } from "lucide-react";

interface AdMatter {
  id: string;
  name: string;
  description: string;
  content: string;
  newspaperId: string;
  adTypeId: string;
  categoryId: string;
  rateId: string;
  size: number;
  language: string;
  tags: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  newspaper?: {
    name: string;
  };
  adType?: {
    name: string;
  };
  category?: {
    name: string;
  };
  rate?: {
    baseRate: number;
    sizeUnit: string;
    fixedRate?: number;
    exactSize?: number;
  };
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [adMatters, setAdMatters] = useState<AdMatter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      setLocation("/login");
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userStr);
      setUser(parsedUser);
      setLoading(false);
      
      // Fetch ad matters for this user
      const fetchAdMatters = async () => {
        try {
          const token = localStorage.getItem("sessionToken");
          if (!token) {
            localStorage.removeItem("user");
            setLocation("/login");
            return;
          }

          const response = await fetch("/api/user/ad-matters", {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("sessionToken");
            localStorage.removeItem("user");
            setLocation("/login");
            return;
          }

          if (response.ok) {
            const data = await response.json();
            setAdMatters(Array.isArray(data) ? data : []);
          } else {
            console.error("Failed to fetch ad matters");
            setAdMatters([]);
          }
        } catch (error) {
          console.error("Error fetching ad matters:", error);
          setAdMatters([]);
        }
      };
      
      fetchAdMatters();
    } catch (e) {
      console.error("Failed to parse user:", e);
      setLocation("/login");
    }
  }, [setLocation]);

  const handleLogout = () => {
    const token = localStorage.getItem("sessionToken");
    fetch("/api/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).finally(() => {
      localStorage.removeItem("sessionToken");
      localStorage.removeItem("user");
      setLocation("/login");
    });
  };

  const activeAdMatters = adMatters.filter((am) => am.active);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  const AdMatterCard = ({ adMatter }: { adMatter: AdMatter }) => (
    <Card className="hover:shadow-md transition-shadow border-neutral-100">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="font-bold text-neutral-900">{adMatter.name}</h4>
            <p className="text-sm text-neutral-500">{adMatter.newspaper?.name || 'Unknown Newspaper'}</p>
          </div>
          <Badge className="bg-green-100 text-green-800">
            Active
          </Badge>
        </div>
        <div className="flex justify-between text-sm text-neutral-600 mb-4">
          <span>{adMatter.adType?.name || 'Unknown Type'}</span>
          <span className="font-semibold text-primary">
            {adMatter.rate?.exactSize && adMatter.rate?.fixedRate
              ? `${adMatter.rate.exactSize} ${adMatter.rate.sizeUnit.replace('_', ' ')} ₹${adMatter.rate.fixedRate}, Extra ${adMatter.rate.sizeUnit.replace('_', ' ')} ₹${adMatter.rate.baseRate}`
              : `₹${adMatter.rate?.baseRate || 0}/${adMatter.rate?.sizeUnit?.replace('_', ' ') || 'unit'}`
            }
          </span>
        </div>
        <p className="text-xs text-neutral-400 mb-4">
          Size: {adMatter.size} • Language: {adMatter.language}
        </p>
        <p className="text-sm text-neutral-700 mb-4 line-clamp-2">
          {adMatter.description || adMatter.content.substring(0, 100) + '...'}
        </p>
        <Button 
          size="sm" 
          variant="outline" 
          className="w-full text-primary border-primary hover:bg-primary hover:text-white"
          onClick={() => {
            // Transform ad matter data to booking summary format
            const bookingData = {
              name: adMatter.name,
              phone: '', // Not available in ad matter data
              description: adMatter.description,
              content: adMatter.content,
              language: adMatter.language,
              categoryId: adMatter.categoryId,
              subcategoryId: '', // Not available
              preferredClassificationId: '', // Not available
              subClassificationId: '', // Not available
              tags: adMatter.tags ? adMatter.tags.split(',').map((tag: string) => tag.trim()) : [],
              size: adMatter.size,
              newspaperId: adMatter.newspaperId,
              rateId: adMatter.rateId,
              enchantments: [], // Not available
              backgroundColor: '#ffffff', // Default
              publishDates: [], // Not available
              categoryName: adMatter.category?.name,
              newspaperName: adMatter.newspaper?.name,
              ratePackage: adMatter.rate ? {
                baseRate: adMatter.rate.baseRate,
                sizeUnit: adMatter.rate.sizeUnit,
                fixedRate: adMatter.rate.fixedRate,
                exactSize: adMatter.rate.exactSize
              } : null
            };
            
            sessionStorage.setItem("lastBooking", JSON.stringify(bookingData));
            setLocation("/booking-summary?view=true");
          }}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">My Ad Matters</h1>
            <p className="text-neutral-600 mt-1">Welcome back, {user?.email}</p>
          </div>
          <div className="flex gap-4">
            <Button onClick={() => setLocation("/booking")} className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2">
              <Plus className="h-4 w-4" /> Create Ad Matter
            </Button>
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </div>

        {loading ? (
          <Card className="text-center py-12">
            <p className="text-neutral-500">Loading ad matters...</p>
          </Card>
        ) : (
          <div className="w-full">
            {adMatters.length === 0 ? (
              <Card className="text-center py-12">
                <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-500 mb-6">No ad matters yet. Start by creating a new ad matter.</p>
                <Button onClick={() => setLocation("/booking")} className="bg-primary hover:bg-primary/90 text-white">
                  Create Ad Matter
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adMatters.map((am) => (
                  <AdMatterCard key={am.id} adMatter={am} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
