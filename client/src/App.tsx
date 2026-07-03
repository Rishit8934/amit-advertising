import { Router, Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/toaster";
import { Component, ReactNode } from "react";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import BookAdType from "@/pages/book-ad-type";
import Booking from "@/pages/booking";
import BookingSummary from "@/pages/booking-summary";
import Dashboard from "@/pages/dashboard";
import AdminPanel from "@/pages/admin";
import StaffLogin from "@/pages/staff-login";
import StaffDashboard from "@/pages/staff-dashboard";
import RateCard from "@/pages/rate-card";
import ROPage from "@/pages/ro-page";
import ROEditPage from "@/pages/ro-edit";
import BillPage from "@/pages/bill";

// Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">
              The staff dashboard encountered an error and couldn't load properly.
            </p>
            <details className="text-left mb-4">
              <summary className="cursor-pointer text-sm text-gray-500">Error details</summary>
              <pre className="text-xs bg-gray-100 p-2 mt-2 rounded overflow-auto">
                {this.state.error?.message}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/book" component={BookAdType} />
      <Route path="/booking" component={Booking} />
      <Route path="/booking-summary" component={BookingSummary} />
      <Route path="/bill" component={BillPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/rate-card" component={RateCard} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/stafflogin" component={StaffLogin} />
      <Route path="/staff">
        {() => (
          <ErrorBoundary>
            <StaffDashboard />
          </ErrorBoundary>
        )}
      </Route>
      <Route path="/ro-page" component={ROPage} />
      <Route path="/ro-edit" component={ROEditPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <Router>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <AppRoutes />
        </QueryClientProvider>
      </SessionProvider>
    </Router>
  );
}

export default App;
