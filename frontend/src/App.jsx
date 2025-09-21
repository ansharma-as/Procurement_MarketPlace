import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MarketplaceLanding from './pages/MarketplaceLanding';
import AuthPage from './pages/AuthPage';
import VendorPage from './pages/VendorPage';
import OrganizationPage from './pages/OrganizationPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Main Pages */}
          <Route path="/" element={<MarketplaceLanding />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/vendors" element={<VendorPage />} />
          <Route path="/organizations" element={<OrganizationPage />} />

          {/* Legacy redirects */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/register/vendor" element={<AuthPage />} />
          <Route path="/opportunities" element={<VendorPage />} />

          {/* Catch all route */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                  <p className="text-gray-600 mb-8">Page not found</p>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Go to Marketplace
                  </button>
                </div>
              </div>
            }
          />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
