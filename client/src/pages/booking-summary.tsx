import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, Home, FileText, ArrowLeft, Edit } from "lucide-react";
import { motion } from "framer-motion";

export default function BookingSummary() {
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  const [bookingData, setBookingData] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [preferredClassifications, setPreferredClassifications] = useState<any[]>([]);
  const [subClassifications, setSubClassifications] = useState<any[]>([]);
  const [adEnchantments, setAdEnchantments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [billExists, setBillExists] = useState(false);

  // Check if bill exists for this booking
  const checkBillExists = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bills/booking/${bookingId}`);
      if (response.ok) {
        const bill = await response.json();
        setBillExists(!!bill);
      }
    } catch (error) {
      console.error("Failed to check bill existence:", error);
      setBillExists(false);
    }
  };

  useEffect(() => {
    // Check if we're in view mode from URL parameters
    const urlParams = new URLSearchParams(location.split('?')[1]);
    const viewMode = urlParams.get('view') === 'true';
    setIsViewMode(viewMode);

    const bookingIdFromUrl = urlParams.get('id');

    // Get booking data from session storage or URL params
    const storedBooking = sessionStorage.getItem("lastBooking");
    if (storedBooking) {
      const parsedBooking = JSON.parse(storedBooking);
      setBookingData(parsedBooking);
      
      // Check if bill exists for this booking
      if (parsedBooking.id) {
        checkBillExists(parsedBooking.id);
      }
    } else if (viewMode && bookingIdFromUrl) {
      // Fetch booking by ID for view mode
      const fetchBooking = async () => {
        try {
          const token = localStorage.getItem("staffSessionToken");
          if (token) {
            const response = await fetch(`/api/staff/bookings/${bookingIdFromUrl}`, {
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
              },
            });
            if (response.ok) {
              const booking = await response.json();
              setBookingData(booking);
              checkBillExists(booking.id);
            } else {
              console.error('Failed to fetch booking');
            }
          }
        } catch (error) {
          console.error('Error fetching booking:', error);
        }
      };
      fetchBooking();
    } else {
      // If no booking data, redirect to booking
      setLocation("/booking");
    }
  }, [setLocation, location]);

  // Fetch category data when booking data is loaded
  useEffect(() => {
    if (bookingData) {
      const fetchCategoryData = async () => {
        try {
          // Fetch categories
          const categoriesResponse = await fetch("/api/categories");
          if (categoriesResponse.ok) {
            const categoriesData = await categoriesResponse.json();
            setCategories(categoriesData);
          }

          // Fetch subcategories if categoryId exists
          if (bookingData.categoryId) {
            const subcategoriesResponse = await fetch(`/api/categories/${bookingData.categoryId}/subcategories`);
            if (subcategoriesResponse.ok) {
              const subcategoriesData = await subcategoriesResponse.json();
              setSubcategories(subcategoriesData);
            }
          }

          // Fetch preferred classifications if subcategoryId exists
          if (bookingData.subcategoryId) {
            const preferredResponse = await fetch(`/api/subcategories/${bookingData.subcategoryId}/preferred-classifications`);
            if (preferredResponse.ok) {
              const preferredData = await preferredResponse.json();
              setPreferredClassifications(preferredData);
            }
          }

          // Fetch sub-classifications if preferredClassificationId exists
          if (bookingData.preferredClassificationId) {
            const subClassResponse = await fetch(`/api/preferred-classifications/${bookingData.preferredClassificationId}/sub-classifications`);
            if (subClassResponse.ok) {
              const subClassData = await subClassResponse.json();
              setSubClassifications(subClassData);
            }
          }

          // Fetch ad enchantments
          const enchantmentsResponse = await fetch("/api/ad-enchantments");
          if (enchantmentsResponse.ok) {
            const enchantmentsData = await enchantmentsResponse.json();
            setAdEnchantments(enchantmentsData);
          }
        } catch (error) {
          console.error("Failed to fetch category data:", error);
        }
      };

      fetchCategoryData();
    }
  }, [bookingData]);

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading booking summary...</p>
        </div>
      </div>
    );
  }

  const formatForNewspaper = (text: string): string => {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length > 0 && (currentLine + ' ' + word).length > 28) {
        lines.push(currentLine);
        currentLine = word;
      } else if (currentLine.length === 0) {
        currentLine = word;
      } else {
        currentLine += ' ' + word;
      }
    }

    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    return lines.join('\n');
  };

  const getActualLineCount = (text: string): number => {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length > 0 && (currentLine + ' ' + word).length > 28) {
        lines.push(currentLine);
        currentLine = word;
      } else if (currentLine.length === 0) {
        currentLine = word;
      } else {
        currentLine += ' ' + word;
      }
    }

    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    return Math.max(lines.length, 1);
  };

  const handleConfirmBooking = async () => {
    setLoading(true);
    try {
      // Build payload with only defined values
      const payload: any = {
        name: bookingData.name,
        content: bookingData.content,
        newspaperId: bookingData.newspaperId,
        adTypeId: bookingData.adTypeId,
        size: bookingData.size || 1,
        language: bookingData.language || "EN",
        enchantments: bookingData.enchantments || [],
      };

      // Add optional fields only if they exist
      if (bookingData.description) payload.description = bookingData.description;
      if (bookingData.categoryId) payload.categoryId = bookingData.categoryId;
      if (bookingData.subcategoryId) payload.subcategoryId = bookingData.subcategoryId;
      if (bookingData.preferredClassificationId) payload.preferredClassificationId = bookingData.preferredClassificationId;
      if (bookingData.subClassificationId) payload.subClassificationId = bookingData.subClassificationId;

      // Handle rate/package selection
      if (bookingData.selectedRateId?.startsWith('package_')) {
        payload.packageId = bookingData.packageId;
        // Don't set rateId when packageId is set
      } else if (bookingData.selectedRateId && bookingData.selectedRateId !== 'none') {
        payload.rateId = bookingData.selectedRateId;
      } else {
        // Skip rate case - send 'none' explicitly
        payload.rateId = 'none';
      }

      console.log('Sending ad-matter payload:', payload, 'selectedRateId:', bookingData.selectedRateId);

      const adMatterResponse = await fetch("/api/ad-matters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("sessionToken") ? { Authorization: `Bearer ${localStorage.getItem("sessionToken")}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!adMatterResponse.ok) {
        const responseText = await adMatterResponse.text();
        let errorData = null;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { error: responseText };
        }
        console.error('Ad-matter creation error:', errorData);
        alert('Failed to create ad matter: ' + (errorData?.error || responseText || adMatterResponse.statusText));
        return;
      }

      const adMatterResult = await adMatterResponse.json();
      console.log('Ad matter created:', adMatterResult);

      // Ad matter created successfully, navigate to see it
      try {
        const cityValue = bookingData.cityId || bookingData.city || bookingData.selectedCity || bookingData.cityName || '';
        const editionValue = bookingData.editionId || bookingData.edition || bookingData.editionName || '';
        const publishDatesValue = Array.isArray(bookingData.publishDates) && bookingData.publishDates.length > 0
          ? bookingData.publishDates
          : [bookingData.date || new Date().toISOString()];
        const packageValue = bookingData.packageId || bookingData.selectedPackageId || bookingData.package;
        const optionsValue = bookingData.options || {
          enchantments: bookingData.enchantments || [],
          backgroundColor: bookingData.backgroundColor || '#FFF8DC',
        };
        const calculatedPricingValue = bookingData.calculatedPricing || {
          totalCost: bookingData.totalCost || 0,
          gst: bookingData.gst || 0,
        };

        const bookingPayload = {
          adMatterId: adMatterResult.id,
          rateId: bookingData.selectedRateId === 'none' ? undefined : bookingData.selectedRateId,
          edition: editionValue,
          editionName: bookingData.editionName || bookingData.edition || '',
          city: cityValue,
          cityName: bookingData.cityName || bookingData.city || '',
          newspaperId: bookingData.newspaperId,
          package: bookingData.selectedRateId?.startsWith('package_') ? packageValue : undefined,
          options: optionsValue,
          publishDates: publishDatesValue,
          calculatedPricing: calculatedPricingValue,
        };

        console.log('Sending booking payload:', bookingPayload);

        const bookingRes = await fetch('/api/bookings/public', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('sessionToken') ? { Authorization: `Bearer ${localStorage.getItem('sessionToken')}` } : {}),
          },
          body: JSON.stringify(bookingPayload),
        });

        let bookingResult = null;
        if (bookingRes.ok) {
          bookingResult = await bookingRes.json();
          console.log('Booking created:', bookingResult);

          // Automatically generate bill for the booking
          try {
            const billRes = await fetch('/api/bills/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bookingId: bookingResult.id }),
            });

            if (billRes.ok) {
              const billResult = await billRes.json();
              console.log('Bill automatically generated:', billResult);
            } else {
              console.error('Failed to generate bill automatically');
            }
          } catch (billError) {
            console.error('Error generating bill:', billError);
          }
        } else {
          const bookingText = await bookingRes.text().catch(() => '');
          console.error('Failed to create booking record', bookingText);
          console.log('Continuing despite booking persist failure...');
        }

        // Navigate to dashboard after ad matter is created (regardless of booking persist)
        sessionStorage.setItem("lastCompletedBooking", JSON.stringify({
          ...bookingData,
          bookingId: bookingResult?.id || null,
          adMatterId: adMatterResult.id,
        }));
        sessionStorage.removeItem('lastBooking');
        setLocation('/dashboard');
        return;
      } catch (err) {
        console.error('Booking persist error:', err);
        // Still navigate to dashboard even if booking persist fails
        sessionStorage.setItem("lastCompletedBooking", JSON.stringify({
          ...bookingData,
          bookingId: null,
          adMatterId: adMatterResult.id,
        }));
        sessionStorage.removeItem('lastBooking');
        setLocation('/dashboard');
        return;
      }
    } catch (err) {
      console.error('Confirm booking error:', err);
      alert("Network error occurred: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const actualLines = getActualLineCount(bookingData.content);
  const hasBoldText = bookingData.enchantments?.some((id: string) => adEnchantments.find(e => e.id === id)?.name === 'Bold Text');
  const hasBorderFrame = bookingData.enchantments?.some((id: string) => adEnchantments.find(e => e.id === id)?.name === 'Border Frame');
  const hasColorBackground = bookingData.enchantments?.some((id: string) => adEnchantments.find(e => e.id === id)?.name === 'Color Background');

  const displayedCost = typeof bookingData.calculatedCost === 'number' ? bookingData.calculatedCost : 0;
  const displayedGst = typeof bookingData.gst === 'number' ? bookingData.gst : Math.round(displayedCost * 0.05);
  const displayedTotal = typeof bookingData.totalCost === 'number' ? bookingData.totalCost : displayedCost + displayedGst;

  console.log('Booking Data:', bookingData);

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Your Booking</h1>
          <p className="text-lg text-gray-600">Please review your advertisement details before confirming</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Details */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Booking Details
                </CardTitle>
                <CardDescription>
                  Your advertisement booking information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Booking ID</label>
                  <p className="text-lg font-mono">{bookingData.id || 'AD-' + Date.now()}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Client Name</label>
                  <p>{bookingData.name}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Phone</label>
                  <p>{bookingData.phone}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Newspaper</label>
                  <p>{bookingData.newspaperName || bookingData.newspaper?.name || 'Selected Newspaper'}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Category</label>
                  <p>{(() => {
                    // Try to find by categoryId first (most reliable)
                    if (bookingData.categoryId && categories.length > 0) {
                      const category = categories.find(c => c.id === bookingData.categoryId);
                      if (category) {
                        return category.name;
                      }
                    }

                    // Fallback to stored categoryName if it's not an ID
                    if (bookingData.categoryName && !bookingData.categoryName.match(/^[a-f0-9-]{36}$/)) {
                      return bookingData.categoryName;
                    }

                    // If categories is still loading, show loading
                    if (categories.length === 0) {
                      return 'Loading...';
                    }

                    return 'Category Name Not Found';
                  })()}</p>
                </div>

                {bookingData.subcategoryId && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Subcategory</label>
                    <p>{(() => {
                      // Try to find by subcategoryId first (most reliable)
                      if (bookingData.subcategoryId && subcategories.length > 0) {
                        const subcategory = subcategories.find(s => s.id === bookingData.subcategoryId);
                        if (subcategory) {
                          return subcategory.name;
                        }
                      }

                      // Fallback to stored subcategoryName if it's not an ID
                      if (bookingData.subcategoryName && !bookingData.subcategoryName.match(/^[a-f0-9-]{36}$/)) {
                        return bookingData.subcategoryName;
                      }

                      // If subcategories is still loading, show loading
                      if (subcategories.length === 0) {
                        return 'Loading...';
                      }

                      return 'Subcategory Name Not Found';
                    })()}</p>
                  </div>
                )}

                {bookingData.preferredClassificationId && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Classification</label>
                    <p>{(() => {
                      const preferred = preferredClassifications.find(p => p.id === bookingData.preferredClassificationId);
                      return preferred?.name || bookingData.preferredClassificationId;
                    })()}</p>
                  </div>
                )}

                {bookingData.subClassificationId && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Sub-Classification</label>
                    <p>{(() => {
                      const subClass = subClassifications.find(s => s.id === bookingData.subClassificationId);
                      return subClass?.name || bookingData.subClassificationId;
                    })()}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold text-gray-600">Ad Size</label>
                  <p>{actualLines} lines ({bookingData.size} units)</p>
                </div>

                {bookingData.publishDates && bookingData.publishDates.length > 0 && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Publication Dates</label>
                    <div className="mt-1 space-y-1">
                      {bookingData.publishDates.map((date: string, index: number) => (
                        <div key={index} className="text-sm">
                          • {new Date(date).toLocaleDateString('en-IN', { 
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {bookingData.enchantments && bookingData.enchantments.length > 0 && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Enhancements</label>
                    <div className="mt-1 space-y-1">
                      {bookingData.enchantments.map((enchantmentId: string) => {
                        const enchantment = adEnchantments.find(e => e.id === enchantmentId);
                        return (
                          <div key={enchantmentId} className="text-sm">
                            • {enchantment ? enchantment.name : enchantmentId}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Base Rate ({actualLines} lines)</span>
                      <span>₹{(() => {
                        const selectedRate = bookingData.selectedRate;
                        if (!selectedRate) return 0;

                        let baseCost = 0;
                        if (selectedRate.exactSize && selectedRate.fixedRate && actualLines <= selectedRate.exactSize) {
                          baseCost = selectedRate.fixedRate;
                        } else if (selectedRate.exactSize && selectedRate.fixedRate && actualLines > selectedRate.exactSize) {
                          baseCost = selectedRate.fixedRate + (actualLines - selectedRate.exactSize) * selectedRate.baseRate;
                        } else {
                          baseCost = actualLines * selectedRate.baseRate;
                        }
                        return baseCost;
                      })()}</span>
                    </div>

                    {bookingData.enchantments && bookingData.enchantments.length > 0 && (
                      <div className="space-y-1">
                        {bookingData.enchantments.map((enchantmentId: string) => {
                          const enchantment = adEnchantments.find(e => e.id === enchantmentId);
                          return enchantment ? (
                            <div key={enchantmentId} className="flex justify-between text-sm">
                              <span>{enchantment.name}</span>
                              <span>{enchantment.price}%</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>₹{(() => {
                        const selectedRate = bookingData.selectedRate;
                        if (!selectedRate) return 0;

                        let baseCost = 0;
                        if (selectedRate.exactSize && selectedRate.fixedRate && actualLines <= selectedRate.exactSize) {
                          baseCost = selectedRate.fixedRate;
                        } else if (selectedRate.exactSize && selectedRate.fixedRate && actualLines > selectedRate.exactSize) {
                          baseCost = selectedRate.fixedRate + (actualLines - selectedRate.exactSize) * selectedRate.baseRate;
                        } else {
                          baseCost = actualLines * selectedRate.baseRate;
                        }

                        // Apply enchantment percentages to the base cost
                        const enchantmentMultiplier = bookingData.enchantments?.reduce((multiplier: number, enchantmentId: string) => {
                          const enchantment = adEnchantments.find(e => e.id === enchantmentId);
                          if (enchantment && enchantment.price) {
                            return multiplier * (1 + enchantment.price / 100); // Convert percentage to multiplier
                          }
                          return multiplier;
                        }, 1) || 1;

                        baseCost *= enchantmentMultiplier;

                        // Multiply by number of publication dates
                        const datesCount = bookingData.publishDates?.length || 1;
                        return baseCost * datesCount;
                      })()}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>GST (5%)</span>
                      <span>₹{(() => {
                        const selectedRate = bookingData.selectedRate;
                        if (!selectedRate) return 0;

                        let baseCost = 0;
                        if (selectedRate.exactSize && selectedRate.fixedRate && actualLines <= selectedRate.exactSize) {
                          baseCost = selectedRate.fixedRate;
                        } else if (selectedRate.exactSize && selectedRate.fixedRate && actualLines > selectedRate.exactSize) {
                          baseCost = selectedRate.fixedRate + (actualLines - selectedRate.exactSize) * selectedRate.baseRate;
                        } else {
                          baseCost = actualLines * selectedRate.baseRate;
                        }

                        // Apply enchantment percentages to the base cost
                        const enchantmentMultiplier = bookingData.enchantments?.reduce((multiplier: number, enchantmentId: string) => {
                          const enchantment = adEnchantments.find(e => e.id === enchantmentId);
                          if (enchantment && enchantment.price) {
                            return multiplier * (1 + enchantment.price / 100); // Convert percentage to multiplier
                          }
                          return multiplier;
                        }, 1) || 1;

                        baseCost *= enchantmentMultiplier;

                        // Multiply by number of publication dates
                        const datesCount = bookingData.publishDates?.length || 1;
                        const subtotal = baseCost * datesCount;
                        return Math.round(subtotal * 0.05);
                      })()}</span>
                    </div>

                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total Cost (incl. GST)</span>
                        <span className="text-2xl font-bold text-green-600">
                          ₹{(() => {
                            const selectedRate = bookingData.selectedRate;
                            if (!selectedRate) return 0;

                            let baseCost = 0;
                            if (selectedRate.exactSize && selectedRate.fixedRate && actualLines <= selectedRate.exactSize) {
                              baseCost = selectedRate.fixedRate;
                            } else if (selectedRate.exactSize && selectedRate.fixedRate && actualLines > selectedRate.exactSize) {
                              baseCost = selectedRate.fixedRate + (actualLines - selectedRate.exactSize) * selectedRate.baseRate;
                            } else {
                              baseCost = actualLines * selectedRate.baseRate;
                            }

                            // Apply enchantment percentages to the base cost
                            const enchantmentMultiplier = bookingData.enchantments?.reduce((multiplier: number, enchantmentId: string) => {
                              const enchantment = adEnchantments.find(e => e.id === enchantmentId);
                              if (enchantment && enchantment.price) {
                                return multiplier * (1 + enchantment.price / 100); // Convert percentage to multiplier
                              }
                              return multiplier;
                            }, 1) || 1;

                            baseCost *= enchantmentMultiplier;

                            // Multiply by number of publication dates
                            const datesCount = bookingData.publishDates?.length || 1;
                            const subtotal = baseCost * datesCount;
                            const gst = Math.round(subtotal * 0.05);
                            return subtotal + gst;
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Newspaper Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Advertisement Preview</CardTitle>
                <CardDescription>
                  How your ad will appear in the newspaper
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-white border border-neutral-300 rounded p-4">
                  <div className="text-xs text-gray-500 mb-2">NEWSPAPER PREVIEW</div>
                  <div className="font-serif text-neutral-800 text-sm">
                    {(() => {
                      const formattedText = formatForNewspaper(bookingData.content);
                      
                      // Apply enchantments using previewHtml
                      let enhancedText = formattedText;
                      bookingData.enchantments?.forEach((id: string) => {
                        const enchantment = adEnchantments.find(e => e.id === id);
                        if (enchantment && enchantment.previewHtml) {
                          // Replace {text} placeholder in previewHtml with the formatted text
                          enhancedText = enchantment.previewHtml.replace(/\{text\}/g, enhancedText);
                        }
                      });
                      
                      // If no previewHtml, apply basic styling
                      if (enhancedText === formattedText) {
                        let style = '';
                        if (hasBoldText) {
                          style += 'font-weight: bold; ';
                        }
                        if (hasBorderFrame) {
                          style += 'border: 2px solid #9ca3af; padding: 8px; ';
                        }
                        
                        const bgColor = hasColorBackground ? (bookingData.backgroundColor || '#fef3c7') : 'white';
                        
                        if (style || bgColor !== 'white') {
                          enhancedText = `<div style="background-color: ${bgColor}; ${style}">${formattedText.replace(/\n/g, '<br>')}</div>`;
                        } else {
                          enhancedText = formattedText;
                        }
                      }
                      
                      return <div dangerouslySetInnerHTML={{ __html: enhancedText }} />;
                    })()}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {actualLines} lines • {bookingData.content.length} characters
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex justify-center gap-4 mt-8"
        >
          <Button
            variant="outline"
            onClick={() => setLocation("/booking")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>
          {!isViewMode && (
            <Button
              onClick={handleConfirmBooking}
              disabled={loading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Booking
                </>
              )}
            </Button>
          )}
          {isViewMode && billExists && bookingData?.id ? (
            <Button
              variant="outline"
              onClick={() => setLocation(`/bill?bookingId=${bookingData.id}`)}
              className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              <FileText className="w-4 h-4" />
              Download Bill
            </Button>
          ) : isViewMode && billExists ? (
            <span className="text-gray-400 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Processing ID...
            </span>
          ) : null}
          {isViewMode && !billExists && (
            <Button
              variant="outline"
              disabled
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Bill Not Available
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setLocation("/dashboard")}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Cancel
          </Button>
        </motion.div>
      </div>
    </div>
  );
}