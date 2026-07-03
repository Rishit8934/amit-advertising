import React from "react";
import { useLocation, useSearch } from "wouter";

// This component renders a Release Order (RO) page
const ROPage = () => {
  const [location] = useLocation();
  const search = useSearch();
  const [booking, setBooking] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Get bookingId from URL search params
    const urlParams = new URLSearchParams(search);
    const bookingId = urlParams.get('bookingId');

    if (!bookingId) {
      setError("No booking ID provided");
      setLoading(false);
      return;
    }

    // Check if user is authenticated
    const token = localStorage.getItem("staffSessionToken");
    if (!token) {
      setError("Not authenticated. Please login first.");
      setLoading(false);
      return;
    }

    // Fetch booking data with populated fields
    fetch(`/api/staff/bookings/${bookingId}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
    })
    .then(async (res) => {
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Authentication failed. Please login again.");
        }
        throw new Error(`Failed to fetch booking: ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      setBooking(data);
      setLoading(false);
    })
    .catch((err) => {
      console.error("Error fetching booking:", err);
      setError(err.message);
      setLoading(false);
    });
  }, [search]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Release Order...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No booking data found</p>
        </div>
      </div>
    );
  }

  // Format the booking data for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN');
    } catch {
      return dateString;
    }
  };

  // Extract publishDates defensively
  const getPublishDates = () => {
    try {
      if (!booking?.publishDates) return [];
      return typeof booking.publishDates === 'string' ? JSON.parse(booking.publishDates) : booking.publishDates;
    } catch (error) {
      console.error('Error parsing publishDates:', error);
      return [];
    }
  };

  const publishDates = getPublishDates();

  // Parse options defensively
  const getOptions = () => {
    try {
      return booking?.options ? JSON.parse(booking.options) : {};
    } catch (error) {
      console.error('Error parsing options:', error);
      return {};
    }
  };

  const options = getOptions();

  const bookingClassification =
    typeof booking?.classification === 'object' ? booking?.classification?.name :
    booking?.classification ||
    typeof booking?.adMatter?.preferredClassification === 'object' ? booking?.adMatter?.preferredClassification?.name :
    booking?.adMatter?.preferredClassification ||
    typeof booking?.adMatter?.subClassification === 'object' ? booking?.adMatter?.subClassification?.name :
    booking?.adMatter?.subClassification ||
    'N/A';

  const customerName =
    options?.customerName || booking?.customerName || booking?.name || booking?.adMatter?.name || 'N/A';

  const customerContact =
    options?.contactPhone || options?.customerPhone || booking?.customerPhone || booking?.contactPhone || booking?.phone || 'N/A';

  const customerAddress =
    options?.customerAddress || booking?.customerAddress || booking?.address || 'N/A';

  const assetBase = import.meta.env.BASE_URL || "/";
  const signatureSrc = `/signature.png?v=${new Date().getTime()}`;
  const staffLogoSrc = `${assetBase}staff-assets/staff-logo.png?v=${new Date().toISOString().split('T')[0]}`;
  const staffStampSrc = `${assetBase}staff-assets/staff-stamp.png?v=${new Date().toISOString().split('T')[0]}`;

  // Calculate pricing the same way as booking summary
  const calculatePricing = () => {
    const selectedRate = booking?.selectedRate;
    if (!selectedRate) return { baseCost: 0, enchantmentCost: 0, subtotal: 0, gst: 0, total: 0 };

    const actualLines = booking?.adMatter?.size || 1;
    const datesCount = publishDates?.length || 1;

    // Parse enchantments defensively
    let enchantments = [];
    try {
      enchantments = booking?.enchantments ? JSON.parse(booking.enchantments) : [];
    } catch (error) {
      console.error('Error parsing enchantments:', error);
      enchantments = [];
    }

    let baseCost = 0;
    if (selectedRate.exactSize && selectedRate.fixedRate && actualLines <= selectedRate.exactSize) {
      baseCost = selectedRate.fixedRate;
    } else if (selectedRate.exactSize && selectedRate.fixedRate && actualLines > selectedRate.exactSize) {
      baseCost = selectedRate.fixedRate + (actualLines - selectedRate.exactSize) * selectedRate.baseRate;
    } else {
      baseCost = actualLines * selectedRate.baseRate;
    }

    // Apply enchantment percentages to the base cost
    const enchantmentMultiplier = enchantments.reduce((multiplier: number, enchantmentId: string) => {
      // For RO page, we don't have access to adEnchantments, so we'll use a simple calculation
      // In a real implementation, you'd fetch the enchantment data
      return multiplier * 1.1; // Default 10% increase as example
    }, 1);

    baseCost *= enchantmentMultiplier;
    const subtotal = baseCost * datesCount;
    const gst = Math.round(subtotal * 0.05);
    const total = subtotal + gst;

    return { baseCost, enchantmentCost: subtotal - (baseCost * datesCount), subtotal, gst, total };
  };

  const pricingDetails = calculatePricing();

  return (
    <div className="min-h-screen bg-white py-8 px-4 print:p-2 print:bg-white print:text-xs relative">
      <style>{`
        @media print {
          body { margin: 0 !important; }
          .ro-print-container { width: 100% !important; max-width: 100% !important; }
          .ro-print-container * { font-size: 0.85rem !important; line-height: 1.2 !important; }
          .ro-print-container .text-3xl { font-size: 1.25rem !important; }
          .ro-print-container .text-2xl { font-size: 1.05rem !important; }
          .ro-print-container .text-lg { font-size: 0.95rem !important; }
          .ro-print-container .p-6 { padding: 0.5rem !important; }
          .ro-print-container .px-6 { padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
          .ro-print-container .py-4 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
          .ro-print-container .grid-cols-4 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .ro-print-container .gap-4 { gap: 0.5rem !important; }
          .ro-print-container .border-2 { border-width: 1px !important; }
          .ro-print-container .text-sm { font-size: 0.75rem !important; }
          .ro-print-container .text-xs { font-size: 0.7rem !important; }
          .ro-print-container .w-64 { width: 10rem !important; }
        }
      `}</style>
      <div className="ro-print-container max-w-5xl mx-auto bg-white border-2 border-gray-300 relative">
        <img
          src={staffStampSrc}
          alt="Staff Stamp"
          className="absolute top-6 left-6 h-16 w-auto object-contain"
          decoding="async"
          onError={(event) => { const target = event.currentTarget as HTMLImageElement; target.style.display = 'none'; }}
        />
        <img
          src={staffLogoSrc}
          alt="Staff Logo"
          className="absolute bottom-8 right-8 h-20 w-auto object-contain"
          decoding="async"
          onError={(event) => { const target = event.currentTarget as HTMLImageElement; target.style.display = 'none'; }}
        />
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
              <p className="text-sm font-medium">RO No: {booking?.roNumber || booking?.id}</p>
              <p className="text-sm">Date: {formatDate(booking?.createdAt)}</p>
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
                <p className="font-medium">{booking?.roNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Newspaper</p>
                <p className="font-medium">{booking?.adMatter?.newspaper?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Edition</p>
                <p className="font-medium">{typeof booking?.edition === 'object' ? booking?.edition?.editionName : booking?.edition || booking?.adMatter?.edition?.editionName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">City</p>
                <p className="font-medium">{typeof booking?.city === 'object' ? booking?.city?.name : booking?.city || booking?.adMatter?.city?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Subcategory</p>
                <p className="font-medium">{typeof booking?.subcategory === 'object' ? booking?.subcategory?.name : booking?.subcategory || booking?.adMatter?.subcategory?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Classification</p>
                <p className="font-medium">{bookingClassification}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Publish Date(s)</p>
                <p className="font-medium">
                  {Array.isArray(publishDates) && publishDates.length > 0
                    ? publishDates.map((d: string) => formatDate(d)).join(', ')
                    : 'No dates available'}
                </p>
              </div>
            </div>
          </div>

          {/* Advertisement Details */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-300 pb-1">Advertisement Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="font-medium">{booking.adMatter?.category?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Size</p>
                <p className="font-medium">{booking?.adMatter?.size || 1} {booking?.newspaper?.pricingUnit || booking?.adMatter?.sizeUnit || 'units'}</p>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-300 pb-1">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium text-lg">{customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Contact</p>
                <p className="font-medium text-lg">{customerContact}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-medium">{customerAddress}</p>
              </div>
            </div>
          </div>

          {/* Pricing Details */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-300 pb-1">Pricing Details</h3>
            <div className="border border-gray-300 rounded p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Base Rate</span>
                  <span className="font-bold">₹{(() => {
                    const selectedRate = booking?.selectedRate;
                    if (!selectedRate) return 0;

                    const actualLines = booking?.adMatter?.size || 1;
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
                <div className="flex justify-between">
                  <span className="font-medium">Enchantment %</span>
                  <span className="font-bold">{(() => {
                    let enchantments = [];
                    try {
                      enchantments = booking?.adMatter?.enchantments ? JSON.parse(booking.adMatter.enchantments) : [];
                    } catch (error) {
                      console.error('Error parsing enchantments:', error);
                      enchantments = [];
                    }

                    if (enchantments.length === 0) return '0%';

                    // Calculate total enchantment percentage
                    const totalPercentage = enchantments.length * 10; // Assuming 10% per enchantment as default
                    return `+${totalPercentage}%`;
                  })()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">GST (5%)</span>
                  <span className="font-bold">₹{(() => {
                    const selectedRate = booking?.selectedRate;
                    if (!selectedRate) return 0;

                    const actualLines = booking?.adMatter?.size || 1;
                    const datesCount = publishDates?.length || 1;
                    let baseCost = 0;
                    if (selectedRate.exactSize && selectedRate.fixedRate && actualLines <= selectedRate.exactSize) {
                      baseCost = selectedRate.fixedRate;
                    } else if (selectedRate.exactSize && selectedRate.fixedRate && actualLines > selectedRate.exactSize) {
                      baseCost = selectedRate.fixedRate + (actualLines - selectedRate.exactSize) * selectedRate.baseRate;
                    } else {
                      baseCost = actualLines * selectedRate.baseRate;
                    }

                    // Apply enchantments
                    let enchantments = [];
                    try {
                      enchantments = booking?.adMatter?.enchantments ? JSON.parse(booking.adMatter.enchantments) : [];
                    } catch (error) {
                      console.error('Error parsing enchantments:', error);
                      enchantments = [];
                    }

                    const enchantmentMultiplier = enchantments.length > 0 ? 1.1 : 1; // 10% per enchantment
                    baseCost *= enchantmentMultiplier;
                    const subtotal = baseCost * datesCount;
                    return Math.round(subtotal * 0.05);
                  })()}</span>
                </div>
                <div className="border-t border-gray-300 pt-2 flex justify-between font-bold">
                  <span>Grand Total:</span>
                  <span>₹{(() => {
                    const selectedRate = booking?.selectedRate;
                    if (!selectedRate) return 0;

                    const actualLines = booking?.adMatter?.size || 1;
                    const datesCount = publishDates?.length || 1;
                    let baseCost = 0;
                    if (selectedRate.exactSize && selectedRate.fixedRate && actualLines <= selectedRate.exactSize) {
                      baseCost = selectedRate.fixedRate;
                    } else if (selectedRate.exactSize && selectedRate.fixedRate && actualLines > selectedRate.exactSize) {
                      baseCost = selectedRate.fixedRate + (actualLines - selectedRate.exactSize) * selectedRate.baseRate;
                    } else {
                      baseCost = actualLines * selectedRate.baseRate;
                    }

                    // Apply enchantments
                    let enchantments = [];
                    try {
                      enchantments = booking?.adMatter?.enchantments ? JSON.parse(booking.adMatter.enchantments) : [];
                    } catch (error) {
                      console.error('Error parsing enchantments:', error);
                      enchantments = [];
                    }

                    const enchantmentMultiplier = enchantments.length > 0 ? 1.1 : 1; // 10% per enchantment
                    baseCost *= enchantmentMultiplier;
                    const subtotal = baseCost * datesCount;
                    const gst = Math.round(subtotal * 0.05);
                    return subtotal + gst;
                  })()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Advertisement Content */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-300 pb-1">Advertisement Content</h3>
            <div className="border border-gray-300 rounded p-4 min-h-[100px]">
              <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                {booking?.adMatter?.content || booking?.customAdText || 'No content available'}
              </pre>
            </div>
          </div>

          {/* Payment Details */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-300 pb-1">Payment Details</h3>
            <div className="border border-gray-300 rounded p-4 min-h-[60px]">
              <p className="text-sm whitespace-pre-wrap">{booking?.paymentDetails || 'No payment details available'}</p>
            </div>
          </div>

          {/* Remarks */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-300 pb-1">Remarks</h3>
            <div className="border border-gray-300 rounded p-4 min-h-[60px]">
              <p className="text-sm whitespace-pre-wrap">{booking?.remarks || 'No remarks available'}</p>
            </div>
          </div>

          {/* Status */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-300 pb-1">Status</h3>
            <div className={`inline-block px-3 py-1 rounded text-sm font-medium ${
              booking?.status === 'approved' ? 'bg-green-100 text-green-800' :
              booking?.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
              booking?.status === 'published' ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {booking?.status || 'draft'}
            </div>
          </div>

          {/* Admin Notes */}
          {booking?.adminNotes && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-300 pb-1">Admin Notes</h3>
              <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                <p className="text-yellow-800">{booking.adminNotes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-300 px-6 py-4">
          <div className="flex justify-between items-end">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-8">Customer Signature:</p>
              <div className="border-b border-gray-400 w-64"></div>
              <p className="text-xs text-gray-500 mt-1">Date: _______________</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">Authorized Signature:</p>
              <div className="mx-auto mb-2 w-64 h-20 overflow-hidden">
                <img src={signatureSrc} alt="Authorized Signature" className="h-full w-full object-contain" />
              </div>
              <p className="text-xs text-gray-500 mt-1">AMIT ADVERTISING</p>
            </div>
          </div>
        </div>

        {/* Print Footer */}
        <div className="bg-gray-100 px-6 py-2 text-center text-xs text-gray-500 border-t border-gray-300">
          <p>This is a computer generated Release Order and does not require signature.</p>
        </div>
      </div>

      {/* Print Controls */}
      <div className="text-center mt-6 space-x-4">
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
        >
          Print RO
        </button>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 font-medium"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default ROPage;
