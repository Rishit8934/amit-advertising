import React from "react";
import { useSearch } from "wouter";

const BillPage = () => {
  const search = useSearch();
  const [bill, setBill] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadBill = async () => {
      const urlParams = new URLSearchParams(search);
      const billId = urlParams.get('billId');
      const bookingId = urlParams.get('bookingId');

      if (!billId && !bookingId) {
        setError('No bill ID or booking ID provided');
        setLoading(false);
        return;
      }

      try {
        let fetchUrl;
        if (billId) {
          fetchUrl = `/api/bills/${billId}`;
        } else if (bookingId) {
          fetchUrl = `/api/bills/booking/${bookingId}`;
        }

        if (!fetchUrl) {
          throw new Error('No bill ID or booking ID provided');
        }

        const res = await fetch(fetchUrl);
        if (!res.ok) {
          throw new Error(`Failed to fetch bill: ${res.status}`);
        }
        const billData = await res.json();
        setBill(billData);
      } catch (err) {
        console.error('Error loading bill:', err);
        setError('Failed to load bill');
      } finally {
        setLoading(false);
      }
    };

    loadBill();
  }, [search]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Bill...</p>
        </div>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Bill Not Found</h2>
          <p className="text-gray-600">{error || 'No bill data available'}</p>
        </div>
      </div>
    );
  }

  // Parse bill data
  const items = bill.items ? (typeof bill.items === 'string' ? JSON.parse(bill.items) : bill.items) : [];
  const totalAfterDiscount = (bill.totalAmount || 0) / 100;
  const discountPercent = bill.discount ? Number(bill.discount) : 0;
  const discountAmount = discountPercent > 0 ? totalAfterDiscount * (discountPercent / (100 - discountPercent)) : 0;
  const subtotal = totalAfterDiscount + discountAmount;
  const cgst = (bill.cgst || 0) / 100;
  const sgst = (bill.sgst || 0) / 100;
  const igstStored = (bill.igst || 0) / 100;
  const igst = igstStored > 0 ? igstStored : (cgst === 0 && sgst === 0 ? Math.round(totalAfterDiscount * 5) / 100 : 0);
  const grandTotalRaw = (bill.grandTotal || bill.totalAmount || 0) / 100;
  const grandTotal = Math.round(grandTotalRaw);
  const discount = discountAmount;

  // Determine bill date (prefer explicit billDate, then first item publish date)
  const parseBillDate = (value: any): Date | null => {
    if (!value) return null;
    if (value instanceof Date && !isNaN(value.getTime())) return value;
    if (typeof value === 'number') {
      const adjusted = value < 1e12 ? value * 1000 : value;
      const date = new Date(adjusted);
      return isNaN(date.getTime()) ? null : date;
    }
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  };

  const explicitBillDate = parseBillDate(bill.billDate);
  const itemPublishDate = items && items.length > 0 && items[0].publishDates && items[0].publishDates.length > 0
    ? parseBillDate(items[0].publishDates[0])
    : null;
  const resolvedBillDate = explicitBillDate || itemPublishDate || new Date();
  const billDate = resolvedBillDate.toLocaleDateString('en-IN');
  // Use timestamp-based cache busting for better reliability
  const cacheTimestamp = new Date().toISOString().split('T')[0]; // Cache per day
  const assetBase = import.meta.env.BASE_URL || '/';
  const signatureSrc = `${assetBase}signature.png?v=${cacheTimestamp}&t=${Date.now()}`; // actual uploaded signature image in client/public/signature.png
  const signatureFallback = "/amit-signature.svg";
  const staffLogoSrc = `${assetBase}staff-assets/staff-logo.png?v=${cacheTimestamp}`;
  const staffStampSrc = `${assetBase}staff-assets/staff-stamp.png?v=${cacheTimestamp}`;

  // Helper function to format dates array
  const formatPublishDates = (dates: any) => {
    if (!dates) return billDate;
    if (typeof dates === 'string') {
      try {
        dates = JSON.parse(dates);
      } catch {
        return dates;
      }
    }
    if (Array.isArray(dates) && dates.length > 0) {
      return dates.map((d: any) => {
        if (typeof d === 'string') {
          return new Date(d).toLocaleDateString('en-IN');
        }
        return d;
      }).join(', ');
    }
    return billDate;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 print:p-0">
      <style>{`
        @page {
          size: A4 portrait;
          margin: 5mm;
        }
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; height: auto !important; overflow: hidden !important; }
          body > * { height: auto !important; min-height: auto !important; background: none !important; padding: 0 !important; }
          .bill-print-container {
            box-shadow: none !important; border: none !important;
            width: 200mm !important; min-height: auto !important; max-height: 287mm !important;
            page-break-after: avoid !important; page-break-inside: avoid !important;
            break-after: avoid !important; break-inside: avoid !important;
            zoom: 0.88 !important;
            overflow: hidden !important;
            margin: 0 !important;
          }
          .bill-print-content { width: 100% !important; min-height: auto !important; max-height: 287mm !important; overflow: hidden !important; }
          .print-hide { display: none !important; }
          .bill-print-content { padding: 10mm !important; font-size: 14px !important; line-height: 1.45 !important; color: #000 !important; }
          .bill-print-content, .bill-print-content * { color: #000 !important; }
          .bill-print-content h1 { font-size: 2.8rem !important; font-weight: 800 !important; }
          .bill-print-content h3 { font-size: 1.3rem !important; font-weight: 700 !important; }
          .bill-print-content h4 { font-size: 1.1rem !important; font-weight: 700 !important; }
          .bill-print-content table { font-size: 13px !important; }
          .bill-print-content th, .bill-print-content td { padding: 7px 10px !important; }
          .bill-print-content img { max-height: 100px !important; }
          .bill-print-content .signature-img { max-height: 120px !important; }
          .bill-print-content .text-6xl { font-size: 2.4rem !important; }
          .bill-print-content .text-5xl { font-size: 2rem !important; }
          .bill-print-content .text-lg { font-size: 1rem !important; }
          .bill-print-content .text-sm { font-size: 0.95rem !important; }
          .bill-print-content .terms-print { font-size: 8px !important; }
          .bill-print-content .terms-print li { margin-bottom: 0.25rem !important; }
          .bill-print-content .grid-cols-2, .bill-print-content .grid-cols-3 { gap: 0.75rem !important; }
          .bill-print-content .space-y-4 > * + * { margin-top: 0.65rem !important; }
          .bill-print-content .mb-8 { margin-bottom: 0.85rem !important; }
          .bill-print-content .mb-4 { margin-bottom: 0.65rem !important; }
          .bill-print-content .text-right { text-align: right !important; }
          .bill-print-content .border { border-width: 1px !important; }
          .bill-print-content .rounded-lg { border-radius: 4px !important; }
          .bill-print-content .p-6 { padding: 0.85rem !important; }
          .bill-print-content .p-4 { padding: 0.75rem !important; }
          .bill-print-content .p-3 { padding: 0.55rem !important; }
          .bill-print-content.many-items { font-size: 12px !important; line-height: 1.35 !important; }
          .bill-print-content.many-items table { font-size: 11px !important; }
          .bill-print-content.many-items th, .bill-print-content.many-items td { padding: 5px 6px !important; }
          .bill-print-content.many-items .text-6xl { font-size: 1.8rem !important; }
          .bill-print-content.too-many-items { font-size: 11px !important; line-height: 1.25 !important; }
          .bill-print-content.too-many-items table { font-size: 10px !important; }
          .bill-print-content.too-many-items th, .bill-print-content.too-many-items td { padding: 4px 5px !important; }
          .bill-print-content.too-many-items .text-6xl { font-size: 1.6rem !important; }
        }
      `}</style>
      <div className="bill-print-container mx-auto bg-white shadow-2xl overflow-visible print:shadow-none" style={{ width: '210mm', minHeight: '297mm', maxWidth: '100%', boxSizing: 'border-box' }}>
        <div className={`bill-print-content p-8 min-h-full flex flex-col relative overflow-visible text-[clamp(0.85rem,0.95vw,1rem)] ${bill?.items?.length > 5 ? 'many-items' : bill?.items?.length > 10 ? 'too-many-items' : ''}`}>
          {/* Modern geometric header */}
          <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-2 left-4 w-16 h-16 border-2 border-white rotate-45"></div>
              <div className="absolute top-6 right-8 w-12 h-12 border border-white rounded-full"></div>
              <div className="absolute bottom-2 left-1/3 w-8 h-8 bg-white rotate-12"></div>
            </div>
          </div>

          <img
            src={staffStampSrc}
            alt="Staff Stamp"
            className="absolute top-4 left-6 h-16 w-auto object-contain"
            decoding="async"
            onError={(event) => {
              const target = event.currentTarget as HTMLImageElement;
              target.style.display = 'none';
            }}
          />

          {/* Header Section */}
          <div className="mt-12 mb-8">
            <div className="text-center mb-6">
              <h1 className="text-6xl font-bold font-serif text-slate-800 mb-2 tracking-wide">AMIT ADVERTISING</h1>
              <div className="w-32 h-1 bg-gradient-to-r from-blue-600 to-slate-600 mx-auto mb-4"></div>
            </div>

            <div className="grid grid-cols-3 gap-6 text-sm">
              {/* Left - Company Details */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="font-semibold text-slate-700">PAN:</span>
                  <span className="text-slate-600">ARQPK7526G</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="font-semibold text-slate-700">GSTIN:</span>
                  <span className="text-slate-600">06ARQPK7526G1ZH</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="font-semibold text-slate-700">SAC:</span>
                  <span className="text-slate-600">998363</span>
                </div>
              </div>

              {/* Center - Contact Info */}
              <div className="space-y-2 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-slate-600">SCO 410, Sector-8, Panchkula</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-slate-600">Ph: 0172-2583583</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-slate-600">Mobile: 9417080721</span>
                </div>
              </div>

              {/* Right - Invoice Details */}
              <div className="space-y-2 text-right">
                <div className="bg-slate-100 p-3 rounded-lg">
                  <div className="text-xs uppercase tracking-[0.35em] text-slate-500 mb-2">INVOICE</div>
                  <div className="text-lg font-bold text-slate-800">{bill.billNumber ? `Bill #${bill.billNumber}` : 'Bill'}</div>
                  <div className="text-sm text-slate-600">Date: {billDate}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4 flex justify-end print:hidden">
            <button type="button" onClick={() => window.print()} className="rounded-md bg-slate-900 text-white px-4 py-2 text-sm hover:bg-slate-700">
              Print / Save PDF
            </button>
          </div>

          {/* Client Info Section */}
          <div className="mb-8">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-300 pb-2">Bill To:</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-700">Client Name:</span>
                    <span className="text-slate-600">{bill.clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-700">Address:</span>
                    <span className="text-slate-600">{bill.clientAddress}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-700">GSTIN:</span>
                    <span className="text-slate-600">{bill.clientGST}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-700">State:</span>
                    <span className="text-slate-600">{bill.clientState}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="mb-8 flex-grow">
            <div className="border border-slate-300 rounded-lg overflow-x-auto">
              <table className="w-full min-w-full">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="px-4 py-3 text-left font-semibold">Publication</th>
                    <th className="px-4 py-3 text-left font-semibold">Date(s) of Insertion</th>
                    <th className="px-4 py-3 text-left font-semibold w-36">Size</th>
                    <th className="px-4 py-3 text-left font-semibold">Words</th>
                    <th className="px-4 py-3 text-left font-semibold">Total Space</th>
                    <th className="px-4 py-3 text-left font-semibold">Rate</th>
                    <th className="px-4 py-3 text-left font-semibold">Package</th>
                    <th className="px-4 py-3 text-left font-semibold">Extra</th>
                    <th className="px-4 py-3 text-left font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-700">{item.publication || item.publicationName || item.description || 'N/A'}</td>
                      <td className="px-4 py-3 text-slate-700">{formatPublishDates(item.publishDates)}</td>
                      <td className="px-4 py-3 text-slate-700 w-36">{item.size || '-'}</td>
                      <td className="px-4 py-3 text-slate-700">{item.words || '-'}</td>
                      <td className="px-4 py-3 text-slate-700">{item.totalSpace || '-'}</td>
                      <td className="px-4 py-3 text-slate-700">{item.rate != null ? item.rate : '-'}</td>
                      <td className="px-4 py-3 text-slate-700">{item.packageOffer || '-'}</td>
                      <td className="px-4 py-3 text-slate-700">{item.extraPositionPercentage ?? item.extraPosition ?? '-'}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{item.amount != null ? item.amount : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mt-auto">
            {/* Left side */}
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-2">Amount in Words:</h4>
                <p className="text-slate-700 text-sm">{numberToWords(grandTotal)} Only</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-2">Bank Details:</h4>
                <div className="space-y-1 text-sm text-slate-600">
                  <p><span className="font-medium">Bank:</span> State Bank of India</p>
                  <p><span className="font-medium">Branch:</span> Sector-8, Panchkula</p>
                  <p><span className="font-medium">IFSC:</span> SBIN0050387</p>
                  <p><span className="font-medium">A/C:</span> 65031909368</p>
                </div>
              </div>
            </div>

            {/* Right side - Summary */}
            <div className="bg-gradient-to-br from-slate-800 to-blue-900 text-white rounded-lg p-6">
              <h4 className="font-bold text-lg mb-4 border-b border-blue-400 pb-2">Payment Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Discount:</span>
                    <span className="font-medium">-₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Total:</span>
                  <span className="font-medium">₹{totalAfterDiscount.toFixed(2)}</span>
                </div>
                {cgst > 0 && sgst > 0 ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>CGST @ 2.5%:</span>
                      <span className="font-medium">₹{cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>SGST @ 2.5%:</span>
                      <span className="font-medium">₹{sgst.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span>IGST @ 5%:</span>
                    <span className="font-medium">₹{igst.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-blue-400 pt-3 mt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Grand Total:</span>
                    <span>₹{grandTotal}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg mt-1">
                    <span>Net Payable:</span>
                    <span>₹{grandTotal}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-8 mt-6 break-inside-avoid terms-print">
            <h3 className="font-semibold text-lg text-slate-800 mb-4">Terms & Conditions</h3>
            <ol className="list-decimal list-inside text-sm text-slate-700 space-y-2">
              <li>Payment should be made favour of Amit Advertising.</li>
              <li>Bill not paid within 15 days will be subject to 24% Interest P.A.</li>
              <li>All supporting voucher are attached. Before accepting the bill please verify carefully. Duplicate voucher copies cannot be supplied.</li>
              <li>Any dispute in respect of this bill should be reported within three days of receipt falling which bill will be regarded as accepted for payment.</li>
              <li>The dispute if any, subject to Panchkula Jurisdiction only.</li>
              <li><strong>1% TDS</strong></li>
            </ol>
          </div>

          {/* Modern geometric footer */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-2 right-4 w-12 h-12 border-2 border-white rotate-45"></div>
              <div className="absolute bottom-3 left-6 w-8 h-8 border border-white rounded-full"></div>
              <div className="absolute top-4 left-1/4 w-6 h-6 bg-white rotate-12"></div>
            </div>
            <img
              src={staffLogoSrc}
              alt="Staff Logo"
              className="absolute bottom-8 right-6 h-20 w-auto object-contain"
              decoding="async"
              onError={(event) => {
                const target = event.currentTarget as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <div className="absolute bottom-2 right-6 text-white text-xs font-medium">
              For Amit Advertising
            </div>
          </div>

          {/* Signature */}
          <div className="text-center mt-12 mb-8">
            <img
              src={signatureSrc}
              alt="Amit Advertising Signature"
              className="mx-auto h-20 object-contain signature-img"
              onError={(event) => {
                const target = event.currentTarget as HTMLImageElement;
                if (target.src !== signatureFallback) {
                  target.src = signatureFallback;
                }
              }}
            />
            <div className="border-b border-slate-400 w-48 mx-auto mt-4 mb-2"></div>
            <p className="text-sm text-slate-600 font-medium">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Function to convert number to words
const numberToWords = (num: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  const convertLessThanOneThousand = (n: number): string => {
    if (n === 0) return '';
    let result = '';

    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }

    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n >= 10) {
      result += teens[n - 10] + ' ';
      return result.trim();
    }

    if (n > 0) {
      result += ones[n] + ' ';
    }

    return result.trim();
  };

  const convert = (n: number): string => {
    if (n === 0) return 'Zero';

    let result = '';
    let num = Math.floor(n);

    // Handle crores
    if (num >= 10000000) {
      result += convertLessThanOneThousand(Math.floor(num / 10000000)) + ' Crore ';
      num %= 10000000;
    }

    // Handle lakhs
    if (num >= 100000) {
      result += convertLessThanOneThousand(Math.floor(num / 100000)) + ' Lakh ';
      num %= 100000;
    }

    // Handle thousands
    if (num >= 1000) {
      result += convertLessThanOneThousand(Math.floor(num / 1000)) + ' Thousand ';
      num %= 1000;
    }

    // Handle remaining
    result += convertLessThanOneThousand(num);

    // Handle paise
    const paise = Math.round((n - Math.floor(n)) * 100);
    if (paise > 0) {
      result += ' and ' + convertLessThanOneThousand(paise) + ' Paise';
    }

    return result.trim();
  };

  return convert(num);
};

export default BillPage;

