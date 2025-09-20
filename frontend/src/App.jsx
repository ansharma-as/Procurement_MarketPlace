import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from './store/store';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VendorRegister from './pages/auth/VendorRegister';
import Dashboard from './pages/Dashboard';
import MarketRequestList from './pages/market-requests/MarketRequestList';
import CreateMarketRequest from './pages/market-requests/CreateMarketRequest';
import MarketRequestDetails from './pages/market-requests/MarketRequestDetails';
import ProposalList from './pages/proposals/ProposalList';
import ProposalDetails from './pages/proposals/ProposalDetails';
import ProposalComparison from './pages/proposals/ProposalComparison';
import ContractAuditDashboard from './pages/audit/ContractAuditDashboard';
import ContractAuditDetails from './pages/audit/ContractAuditDetails';
import RFPRequestList from './pages/rfp-requests/RFPRequestList';
import CreateRFPRequest from './pages/rfp-requests/CreateRFPRequest';
import RFPRequestDetails from './pages/rfp-requests/RFPRequestDetails';
import VendorList from './pages/vendors/VendorList';
import VendorDetails from './pages/vendors/VendorDetails';
import ContractList from './pages/contracts/ContractList';
import Settings from './pages/settings/Settings';
import Profile from './pages/profile/Profile';

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
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register/vendor" element={<VendorRegister />} />

            {/* Protected routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* RFP Request Routes */}
              <Route
                path="/rfp-requests"
                element={
                  <ProtectedRoute>
                    <RFPRequestList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rfp-requests/create"
                element={
                  <ProtectedRoute>
                    <CreateRFPRequest />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rfp-requests/:id"
                element={
                  <ProtectedRoute>
                    <RFPRequestDetails />
                  </ProtectedRoute>
                }
              />

              {/* Market Request Routes */}
              <Route
                path="/market-requests"
                element={
                   <ProtectedRoute>
                    <MarketRequestList />
                   </ProtectedRoute>
                }
              />
              <Route
                path="/market-requests/create"
                element={
                   <ProtectedRoute>
                    <CreateMarketRequest />
                   </ProtectedRoute>
                }
              />
              <Route
                path="/market-requests/:id"
                element={
                  <ProtectedRoute>
                    <MarketRequestDetails />
                  </ProtectedRoute>
                }
              />

              {/* Proposal Routes */}
              <Route
                path="/proposals"
                element={
                   <ProtectedRoute>
                    <ProposalList />
                   </ProtectedRoute>
                }
              />
              <Route
                path="/proposals/:id"
                element={
                   <ProtectedRoute>
                    <ProposalDetails />
                   </ProtectedRoute>
                }
              />
              <Route
                path="/proposals/compare/:rfpId"
                element={
                  <ProtectedRoute>
                    <ProposalComparison />
                  </ProtectedRoute>
                }
              />

              {/* Vendor Management Routes */}
              <Route
                path="/vendors"
                element={
                  <ProtectedRoute>
                    <VendorList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vendors/:id"
                element={
                  <ProtectedRoute>
                    <VendorDetails />
                  </ProtectedRoute>
                }
              />

              {/* Contract Management Routes */}
              <Route
                path="/contracts"
                element={
                  <ProtectedRoute>
                    <ContractList />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/audit"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <ContractAuditDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/audit/contracts/:id"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <ContractAuditDetails />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/users"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <div className="p-8">
                      <h1 className="text-2xl font-bold">User Management</h1>
                      <p className="text-gray-600 mt-2">Coming soon...</p>
                    </div>
                  </ProtectedRoute>
                }
              />

              {/* Profile and Settings */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />

              {/* Analytics */}
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <div className="p-8">
                      <h1 className="text-2xl font-bold">Analytics</h1>
                      <p className="text-gray-600 mt-2">Coming soon...</p>
                    </div>
                  </ProtectedRoute>
                }
              />

              {/* Catch all route */}
              <Route
                path="*"
                element={
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                      <p className="text-gray-600 mb-8">Page not found</p>
                      <Navigate to="/dashboard" replace />
                    </div>
                  </div>
                }
              />
            </Route>
          </Routes>
        </Router>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
