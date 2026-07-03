import React from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Save, X, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

const ROEditPage = () => {
  const [location, setLocation] = useLocation();
  const search = useSearch();
  const [booking, setBooking] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [bookingId, setBookingId] = React.useState<string | null>(null);
  const [customerName, setCustomerName] = React.useState('');
  const [customerPhone, setCustomerPhone] = React.useState('');
  const [customerAddress, setCustomerAddress] = React.useState('');
  const [adContent, setAdContent] = React.useState('');
  const [publishDates, setPublishDates] = React.useState<Date[]>([]);
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [newspaperName, setNewspaperName] = React.useState('');
  const [categoryName, setCategoryName] = React.useState('');
  const [baseRate, setBaseRate] = React.useState('');
  const [enchantmentTotal, setEnchantmentTotal] = React.useState('');
  const [gstAmount, setGstAmount] = React.useState('');
  const [grandTotal, setGrandTotal] = React.useState('');
  const [roNumber, setRoNumber] = React.useState('');
  const [edition, setEdition] = React.useState('');
  const [city, setCity] = React.useState('');
  const [subcategory, setSubcategory] = React.useState('');
  const [classification, setClassification] = React.useState('');
  const [paymentDetails, setPaymentDetails] = React.useState('');
  const [remarks, setRemarks] = React.useState('');

  React.useEffect(() => {
    const urlParams = new URLSearchParams(search);
    const id = urlParams.get('bookingId');
    setBookingId(id);

    if (id) {
      fetchBookingData(id);
    } else {
      setLoading(false);
    }
  }, [search]);

  const fetchBookingData = async (bookingId: string) => {
    try {
      const token = localStorage.getItem("staffSessionToken");
      if (!token) {
        setError("Not authenticated. Please login first.");
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/staff/bookings/${bookingId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });
      if (!res.ok) throw new Error('Failed to fetch booking');
      const bookingData = await res.json();

      // Parse data defensively
      let pricing = {};
      try {
        pricing = bookingData.calculatedPricing ? JSON.parse(bookingData.calculatedPricing) : {};
      } catch (error) {
        console.error('Error parsing calculatedPricing:', error);
      }

      let options = {};
      try {
        options = bookingData.options ? JSON.parse(bookingData.options) : {};
      } catch (error) {
        console.error('Error parsing options:', error);
      }

      let publishDatesArray = [];
      try {
        publishDatesArray = bookingData.publishDates ? JSON.parse(bookingData.publishDates) : [];
      } catch (error) {
        console.error('Error parsing publishDates:', error);
      }

      setBooking({
        id: bookingData.id,
        roNumber: bookingData.roNumber,
        adMatter: bookingData.adMatter,
        newspaper: bookingData.adMatter?.newspaper,
        category: bookingData.adMatter?.category,
        subcategory: bookingData.adMatter?.subcategory,
        preferredClassification: bookingData.adMatter?.preferredClassification,
        subClassification: bookingData.adMatter?.subClassification,
        edition: bookingData.edition,
        city: bookingData.city,
        pricing,
        options,
        publishDates: publishDatesArray,
        adminNotes: bookingData.adminNotes || '',
        status: bookingData.status
      });

      // Initialize customer information
      setCustomerName((options as any)?.customerName || bookingData.customerName || '');
      setCustomerPhone((options as any)?.contactPhone || (options as any)?.customerPhone || bookingData.customerPhone || '');
      setCustomerAddress((options as any)?.customerAddress || bookingData.customerAddress || '');
      setAdContent(bookingData.adMatter?.content || bookingData.customAdText || '');

      // Initialize editable fields
      setNewspaperName(bookingData.adMatter?.newspaper?.name || '');
      setCategoryName(bookingData.adMatter?.category?.name || '');

      // Initialize pricing fields
      setBaseRate((pricing as any)?.baseRate?.toString() || '');
      setEnchantmentTotal((pricing as any)?.enchantmentTotal?.toString() || '0');
      setGstAmount((pricing as any)?.gst?.toString() || '');
      setGrandTotal((pricing as any)?.totalWithGst?.toString() || '');

      // Initialize RO fields
      setRoNumber(bookingData.roNumber || '');
      setEdition(typeof bookingData.edition === 'object' ? bookingData.edition?.editionName : bookingData.edition || '');
      setCity(typeof bookingData.city === 'object' ? bookingData.city?.name : bookingData.city || '');
      setSubcategory(typeof bookingData.adMatter?.subcategory === 'object' ? bookingData.adMatter?.subcategory?.name : bookingData.adMatter?.subcategory || '');
      setClassification(typeof bookingData.adMatter?.preferredClassification === 'object' ? bookingData.adMatter?.preferredClassification?.name : bookingData.adMatter?.preferredClassification || '');
      setPaymentDetails(bookingData.paymentDetails || '');
      setRemarks(bookingData.remarks || '');

      // Convert publish dates to Date objects
      setPublishDates(publishDatesArray.map((d: string) => new Date(d)));
    } catch (error) {
      console.error('Failed to fetch booking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!booking) return;

    setSaving(true);
    try {
      const updates = {
        adminNotes: booking?.adminNotes || '',
        status: booking?.status || 'draft',
        publishDates: JSON.stringify(publishDates.map(d => d.toISOString().split('T')[0])),
        roNumber,
        edition,
        city,
        subcategory,
        classification,
        paymentDetails,
        remarks,
      };

      const res = await fetch(`/api/staff/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem("staffSessionToken")}`
        },
        body: JSON.stringify(updates)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update booking');
      }

      alert('RO updated successfully!');
      setLocation(`/ro-page?bookingId=${bookingId}`);
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save changes: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const addPublishDate = (date: Date | undefined) => {
    if (date && !publishDates.some(d => d.toDateString() === date.toDateString())) {
      setPublishDates([...publishDates, date]);
    }
    setCalendarOpen(false);
  };

  const removePublishDate = (index: number) => {
    setPublishDates(publishDates.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading RO details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">RO Not Found</h1>
          <Button onClick={() => setLocation('/staff-dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Release Order</h1>
            <p className="text-gray-600">RO #{booking?.roNumber}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLocation('/staff-dashboard')}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>RO Number</Label>
                  <Input
                    value={roNumber}
                    onChange={(e) => setRoNumber(e.target.value)}
                    placeholder="Enter RO number"
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={booking?.status || 'draft'} onValueChange={(value) => setBooking({...booking, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Newspaper</Label>
                <Input
                  value={newspaperName}
                  onChange={(e) => setNewspaperName(e.target.value)}
                  placeholder="Enter newspaper name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Edition</Label>
                  <Input
                    value={edition}
                    onChange={(e) => setEdition(e.target.value)}
                    placeholder="Enter edition"
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
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
                  <Label>Category</Label>
                  <Input
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="Enter category name"
                  />
                </div>
                <div>
                  <Label>Subcategory</Label>
                  <Input
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    placeholder="Enter subcategory"
                  />
                </div>
              </div>
              <div>
                <Label>Classification</Label>
                <Input
                  value={classification}
                  onChange={(e) => setClassification(e.target.value)}
                  placeholder="Enter classification"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Preferred Classification</Label>
                  <Input value={booking.preferredClassification?.name || 'N/A'} disabled />
                </div>
                <div>
                  <Label>Sub Classification</Label>
                  <Input value={booking.subClassification?.name || 'N/A'} disabled />
                </div>
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
                {publishDates.map((date, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {format(date, 'dd/MM/yyyy')}
                    <button
                      onClick={() => removePublishDate(index)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
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
                    onSelect={addPublishDate}
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
                  <Label>Base Rate</Label>
                  <Input
                    value={baseRate}
                    onChange={(e) => setBaseRate(e.target.value)}
                    placeholder="Enter base rate"
                  />
                </div>
                <div>
                  <Label>Enchantment Total</Label>
                  <Input
                    value={enchantmentTotal}
                    onChange={(e) => setEnchantmentTotal(e.target.value)}
                    placeholder="Enter enchantment total"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>GST Amount</Label>
                  <Input
                    value={gstAmount}
                    onChange={(e) => setGstAmount(e.target.value)}
                    placeholder="Enter GST amount"
                  />
                </div>
                <div>
                  <Label>Grand Total</Label>
                  <Input
                    value={grandTotal}
                    onChange={(e) => setGrandTotal(e.target.value)}
                    placeholder="Enter grand total"
                  />
                </div>
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
                <Label>Customer Name</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phone Number</Label>
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label>Size</Label>
                  <Input value={`${booking.adMatter?.size || 1} ${booking.adMatter?.sizeUnit || 'units'}`} disabled />
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <Textarea
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
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
                value={adContent}
                onChange={(e) => setAdContent(e.target.value)}
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
                <Label>Payment Details</Label>
                <Textarea
                  value={paymentDetails}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                  placeholder="Enter payment details..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Remarks</Label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter remarks..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ROEditPage;