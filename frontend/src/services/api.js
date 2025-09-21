import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Global logout handler - can be set by the app to handle navigation
let globalLogoutHandler = null;

export const setLogoutHandler = (handler) => {
  globalLogoutHandler = handler;
};

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          });

          if (response.data.success) {
            const { accessToken } = response.data.data;
            localStorage.setItem('token', accessToken);
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userType');

          // Use the global logout handler if available
          if (globalLogoutHandler) {
            globalLogoutHandler();
          }

          return Promise.reject(refreshError);
        }
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userType');

        // Use the global logout handler if available
        if (globalLogoutHandler) {
          globalLogoutHandler();
        }
      }
    }

    return Promise.reject(error);
  }
);

// API service functions
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  registerOrganization: (orgData) => api.post('/auth/organization/register', orgData),
  registerVendor: (vendorData) => api.post('/auth/vendor/register', vendorData),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
};

// RFP Requests (Internal Requests)
export const rfpAPI = {
  getAll: (params) => api.get('/rfp-requests', { params }),
  getById: (id) => api.get(`/rfp-requests/${id}`),
  create: (data) => api.post('/rfp-requests', data),
  update: (id, data) => api.put(`/rfp-requests/${id}`, data),
  delete: (id) => api.delete(`/rfp-requests/${id}`),
  review: (id, reviewData) => api.patch(`/rfp-requests/${id}/review`, reviewData),
};

// Market Requests (Public Procurement)
export const marketRequestAPI = {
  getAll: (params) => api.get('/market-requests', { params }),
  getById: (id) => api.get(`/market-requests/${id}`),
  create: (data) => api.post('/market-requests', data),
  update: (id, data) => api.put(`/market-requests/${id}`, data),
  close: (id, reason) => api.patch(`/market-requests/${id}/close`, { reason }),
  award: (id, proposalId, managerNotes) => api.patch(`/market-requests/${id}/award`, { proposalId, managerNotes }),
  markInterest: (id, isInterested) => api.patch(`/market-requests/${id}/interest`, { isInterested }),
};

// Proposals
export const proposalAPI = {
  getAll: (params) => api.get('/proposals', { params }),
  getById: (id) => api.get(`/proposals/${id}`),
  create: (data) => api.post('/proposals', data),
  update: (id, data) => api.put(`/proposals/${id}`, data),
  submit: (id) => api.patch(`/proposals/${id}/submit`),
  withdraw: (id, reason) => api.patch(`/proposals/${id}/withdraw`, { reason }),
  evaluate: (id, scores, overallNotes) => api.patch(`/proposals/${id}/evaluate`, { scores, overallNotes }),
  accept: (id, managerNotes) => api.patch(`/proposals/${id}/accept`, { managerNotes }),
  reject: (id, rejectionReason, managerNotes) => api.patch(`/proposals/${id}/reject`, { rejectionReason, managerNotes }),
  delete: (id) => api.delete(`/proposals/${id}`),
};

// Vendor Management
export const vendorAPI = {
  getAll: (params) => api.get('/vendors', { params }),
  getById: (id) => api.get(`/vendors/${id}`),
  getDashboard: () => api.get('/vendors/dashboard'),
  getProposals: (params) => api.get('/vendors/proposals', { params }),
  updateProfile: (id, data) => api.put(`/vendors/${id}`, data),
  getProfile: () => api.get('/vendors/profile'),
};

// User Management
export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  updateRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  assignManager: (id, managerId) => api.patch(`/users/${id}/manager`, { managerId }),
  deactivate: (id) => api.patch(`/users/${id}/deactivate`),
};

// AI-Driven Vendor Evaluation
export const aiAPI = {
  evaluateProposal: (proposalId) => api.post(`/ai/proposals/${proposalId}/evaluate`),
  getEvaluation: (proposalId) => api.get(`/ai/proposals/${proposalId}/evaluation`),
  compareProposals: (marketRequestId) => api.post(`/ai/market-requests/${marketRequestId}/compare-proposals`),
  getVendorInsights: (vendorId) => api.get(`/ai/vendor-insights/${vendorId}`),
  analyzeMarketRequest: (marketRequestId) => api.post('/ai/market-analysis', { marketRequestId }),
  getExecutiveSummary: (marketRequestId) => api.get(`/ai/evaluation-summary/${marketRequestId}`),
  batchEvaluate: (marketRequestId) => api.post('/ai/batch-evaluate', { marketRequestId }),
};

// Contract Management
export const contractAPI = {
  getAll: (params) => api.get('/contracts', { params }),
  getById: (id) => api.get(`/contracts/${id}`),
  create: (data) => api.post('/contracts', data),
  update: (id, data) => api.put(`/contracts/${id}`, data),
  delete: (id) => api.delete(`/contracts/${id}`),
  execute: (id) => api.patch(`/contracts/${id}/execute`),
  terminate: (id, reason) => api.patch(`/contracts/${id}/terminate`, { reason }),
  renew: (id, data) => api.patch(`/contracts/${id}/renew`, data),
  addAmendment: (id, amendment) => api.post(`/contracts/${id}/amendments`, amendment),
  uploadDocument: (id, file) => {
    const formData = new FormData();
    formData.append('document', file);
    return api.post(`/contracts/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const auditAPI = {
  auditContract: (id) => api.post(`/audit/contracts/${id}`),
  batchAuditContracts: (contractIds) => api.post('/audit/contracts/batch', { contractIds }),
  getContractAuditHistory: (id) => api.get(`/audit/contracts/${id}/history`),
  getLatestAuditResult: (id) => api.get(`/audit/contracts/${id}/latest`),
  updateAuditFinding: (contractId, auditIndex, findingIndex, data) =>
    api.put(`/audit/contracts/${contractId}/audits/${auditIndex}/findings/${findingIndex}`, data),
  getContractHealthDashboard: (companyId) => api.get(`/audit/dashboard/${companyId}`),
  getAuditStatistics: () => api.get('/audit/statistics'),
};