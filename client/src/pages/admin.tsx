import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, Search } from "lucide-react";

interface Booking {
  id: string;
  userId: string;
  newspaper: string;
  city: string;
  adType: string;
  estimatedTotal: number;
  status: "draft" | "submitted" | "approved" | "published";
  adminNotes?: string;
  createdAt: string;
}

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [newNotes, setNewNotes] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("sessionToken");
    fetch("/api/admin/bookings", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setBookings(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleUpdateBooking = async () => {
    if (!selectedBooking) return;

    const token = localStorage.getItem("sessionToken");
    try {
      const res = await fetch(`/api/admin/bookings/${selectedBooking.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: newNotes,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setBookings(bookings.map((b) => (b.id === updated.id ? updated : b)));
        setSelectedBooking(null);
        setNewStatus("");
        setNewNotes("");
      }
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

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

  const statusColors = {
    draft: "bg-neutral-100 text-neutral-800",
    submitted: "bg-blue-100 text-blue-800",
    approved: "bg-green-100 text-green-800",
    published: "bg-purple-100 text-purple-800",
  };

  const filtered = bookings.filter((b) =>
    b.newspaper.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.userId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-neutral-400" />
          <Input
            placeholder="Search by newspaper, city, or user ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <Card className="text-center py-12">
            <p className="text-neutral-500">Loading bookings...</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bookings Table */}
            <div className="lg:col-span-2">
              <Card className="border-neutral-100">
                <CardHeader className="bg-neutral-50 border-b border-neutral-100">
                  <CardTitle>All Bookings ({filtered.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-neutral-200 bg-neutral-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Newspaper</th>
                          <th className="px-4 py-3 text-left font-semibold">City</th>
                          <th className="px-4 py-3 text-left font-semibold">User</th>
                          <th className="px-4 py-3 text-left font-semibold">Status</th>
                          <th className="px-4 py-3 text-right font-semibold">Cost</th>
                          <th className="px-4 py-3 text-center font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((booking) => (
                          <tr
                            key={booking.id}
                            className="border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setNewStatus(booking.status);
                              setNewNotes(booking.adminNotes || "");
                            }}
                          >
                            <td className="px-4 py-3">{booking.newspaper}</td>
                            <td className="px-4 py-3">{booking.city}</td>
                            <td className="px-4 py-3 text-xs text-neutral-500">{booking.userId.slice(0, 8)}...</td>
                            <td className="px-4 py-3">
                              <Badge className={statusColors[booking.status]}>
                                {booking.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-primary">
                              ₹ {booking.estimatedTotal}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button className="text-primary hover:text-primary/80 font-semibold">→</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Details Panel */}
            {selectedBooking && (
              <Card className="border-neutral-100 h-fit sticky top-12">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b border-neutral-100">
                  <CardTitle className="text-lg">Booking Details</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-neutral-500 mb-1">ID</p>
                    <p className="text-sm break-all">{selectedBooking.id}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-neutral-500 mb-1">User ID</p>
                    <p className="text-sm break-all">{selectedBooking.userId}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-neutral-500 mb-1">Publication</p>
                    <p className="text-sm font-medium">{selectedBooking.newspaper}, {selectedBooking.city}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-neutral-500 mb-1">Ad Type</p>
                    <p className="text-sm">{selectedBooking.adType}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-neutral-500 mb-1">Cost</p>
                    <p className="text-2xl font-bold text-primary">₹ {selectedBooking.estimatedTotal}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-neutral-500 mb-1">Update Status</p>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-neutral-500 mb-1">Admin Notes</p>
                    <textarea
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      className="w-full p-2 border border-neutral-200 rounded text-sm"
                      rows={4}
                      placeholder="Add internal notes..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleUpdateBooking}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white"
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedBooking(null)}
                      className="flex-1"
                    >
                      Close
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
