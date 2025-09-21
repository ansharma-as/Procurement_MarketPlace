import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const VendorPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('opportunities');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check for vendor authentication on component mount
  useEffect(() => {
    const vendorToken = localStorage.getItem('vendor_token');
    if (!vendorToken) {
      alert('Please login as a vendor to access this page');
      navigate('/auth');
      return;
    }
  }, [navigate]);

  // Data states
  const [opportunities, setOpportunities] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [vendorProfile, setVendorProfile] = useState(null);

  // Form states
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [editingProposal, setEditingProposal] = useState(null);

  // Enhanced proposal form based on Postman collection
  const [proposalForm, setProposalForm] = useState({
    proposedItem: '',
    description: '',
    specifications: {},
    quantity: 1,
    unitPrice: '',
    currency: 'USD',
    deliveryTime: '',
    deliveryDate: '',
    warranty: '',
    additionalServices: [],
    complianceDocuments: [],
    vendorNotes: ''
  });

  // Profile edit form
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    specialization: [],
    location: '',
    portfolio: '',
    description: ''
  });

  // Get auth token for vendor
  const getAuthHeaders = () => {
    const token = localStorage.getItem('vendor_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch market requests (opportunities)
  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8080/api/market-requests', {
        params: {
          page: 1,
          limit: 20,
          status: 'open',
          sortBy: 'deadline',
          sortOrder: 'asc'
        }
      });
      console.log('Opportunities:', response.data);
      setOpportunities(response.data.data?.requests || []);
    } catch (err) {
      console.error('Error fetching opportunities:', err);
      setError('Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  // Fetch vendor proposals (GET /vendors/proposals)
  const fetchProposals = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8080/api/vendors/proposals', {
        headers: getAuthHeaders(),
        params: {
          page: 1,
          limit: 20,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }
      });
      console.log('Vendor Proposals API Response:', response.data);
      setProposals(response.data.data?.proposals || []);
    } catch (err) {
      console.error('Error fetching proposals:', err);
      setError('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  // Fetch dashboard data (GET /vendors/dashboard)
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8080/api/vendors/dashboard', {
        headers: getAuthHeaders()
      });
      console.log('Vendor Dashboard API Response:', response.data);
      // The API returns { success: true, data: { stats: {...} } }
      // So we set response.data.data which contains the stats object
      setDashboardData(response.data.data);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Fetch vendor profile (GET /vendors/:id or /auth/profile)
  const fetchVendorProfile = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/auth/profile', {
        headers: getAuthHeaders()
      });
      console.log('Vendor Profile API Response:', response.data);
      // The API returns { success: true, data: { vendor: {...}, userType: "vendor" } }
      // So we need to access response.data.data.vendor
      const profile = response.data.data.vendor;
      setVendorProfile(profile);

      // Pre-fill profile form
      setProfileForm({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        specialization: profile.specialization || [],
        location: profile.location || '',
        portfolio: profile.portfolio || '',
        description: profile.description || ''
      });
    } catch (err) {
      console.error('Error fetching vendor profile:', err);
      setError('Failed to load vendor profile');
    }
  };

  // Mark interest in opportunity
  const markInterest = async (opportunityId, isInterested) => {
    try {
      const response = await axios.patch(
        `http://localhost:8080/api/market-requests/${opportunityId}/interest`,
        { isInterested },
        { headers: getAuthHeaders() }
      );
      console.log('Interest marked:', response.data);
      fetchOpportunities(); // Refresh opportunities
    } catch (err) {
      console.error('Error marking interest:', err);
      setError('Failed to mark interest');
    }
  };

  // Submit proposal (POST /proposals)
  const submitProposal = async (e) => {
    e.preventDefault();
    if (!selectedOpportunity) return;

    try {
      setLoading(true);
      setError('');

      // Parse specifications if it's a string
      let specifications = proposalForm.specifications;
      if (typeof specifications === 'string') {
        try {
          specifications = JSON.parse(specifications);
        } catch {
          specifications = {};
        }
      }

      // Parse additionalServices if it's a string
      let additionalServices = proposalForm.additionalServices;
      if (typeof additionalServices === 'string') {
        additionalServices = additionalServices.split(',').map(s => s.trim()).filter(s => s);
      }

      // Parse complianceDocuments if it's a string
      let complianceDocuments = proposalForm.complianceDocuments;
      if (typeof complianceDocuments === 'string') {
        try {
          complianceDocuments = JSON.parse(complianceDocuments);
        } catch {
          complianceDocuments = [];
        }
      }

      // Build payload according to exact Postman collection format
      const payload = {
        marketRequest: selectedOpportunity._id,
        proposedItem: proposalForm.proposedItem,
        description: proposalForm.description,
        specifications: specifications,
        quantity: parseInt(proposalForm.quantity),
        unitPrice: parseFloat(proposalForm.unitPrice),
        currency: proposalForm.currency,
        deliveryTime: proposalForm.deliveryTime,
        deliveryDate: proposalForm.deliveryDate ? new Date(proposalForm.deliveryDate).toISOString() : null,
        warranty: proposalForm.warranty,
        additionalServices: additionalServices,
        complianceDocuments: complianceDocuments,
        vendorNotes: proposalForm.vendorNotes
      };

      console.log('Submitting Proposal:', payload);

      const response = await axios.post(
        'http://localhost:8080/api/proposals',
        payload,
        { headers: getAuthHeaders() }
      );
      console.log('Proposal Created API Response:', response.data);

      // Reset form and close modal
      resetProposalForm();
      setSelectedOpportunity(null);
      setSuccess('Proposal submitted successfully!');

      // Refresh data
      fetchProposals();
      setActiveTab('proposals');
    } catch (err) {
      console.error('Error submitting proposal:', err);
      setError('Failed to submit proposal: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Reset proposal form
  const resetProposalForm = () => {
    setProposalForm({
      proposedItem: '',
      description: '',
      specifications: {},
      quantity: 1,
      unitPrice: '',
      currency: 'USD',
      deliveryTime: '',
      deliveryDate: '',
      warranty: '',
      additionalServices: [],
      complianceDocuments: [],
      vendorNotes: ''
    });
  };

  // Update proposal (PUT /proposals/:id)
  const updateProposal = async (e) => {
    e.preventDefault();
    if (!editingProposal) return;

    try {
      setLoading(true);
      setError('');

      // Parse specifications if it's a string
      let specifications = proposalForm.specifications;
      if (typeof specifications === 'string') {
        try {
          specifications = JSON.parse(specifications);
        } catch {
          specifications = {};
        }
      }

      // Parse additionalServices if it's a string
      let additionalServices = proposalForm.additionalServices;
      if (typeof additionalServices === 'string') {
        additionalServices = additionalServices.split(',').map(s => s.trim()).filter(s => s);
      }

      // Parse complianceDocuments if it's a string
      let complianceDocuments = proposalForm.complianceDocuments;
      if (typeof complianceDocuments === 'string') {
        try {
          complianceDocuments = JSON.parse(complianceDocuments);
        } catch {
          complianceDocuments = [];
        }
      }

      const payload = {
        proposedItem: proposalForm.proposedItem,
        description: proposalForm.description,
        specifications: specifications,
        quantity: parseInt(proposalForm.quantity),
        unitPrice: parseFloat(proposalForm.unitPrice),
        currency: proposalForm.currency,
        deliveryTime: proposalForm.deliveryTime,
        deliveryDate: proposalForm.deliveryDate ? new Date(proposalForm.deliveryDate).toISOString() : null,
        warranty: proposalForm.warranty,
        additionalServices: additionalServices,
        complianceDocuments: complianceDocuments,
        vendorNotes: proposalForm.vendorNotes
      };

      console.log('Updating Proposal:', payload);

      const response = await axios.put(
        `http://localhost:8080/api/proposals/${editingProposal._id}`,
        payload,
        { headers: getAuthHeaders() }
      );
      console.log('Proposal Updated API Response:', response.data);

      setEditingProposal(null);
      resetProposalForm();
      setSuccess('Proposal updated successfully!');
      fetchProposals();
    } catch (err) {
      console.error('Error updating proposal:', err);
      setError('Failed to update proposal: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Submit proposal (PATCH /proposals/:id/submit)
  const submitExistingProposal = async (proposalId) => {
    try {
      setLoading(true);
      setError('');

      const authHeaders = getAuthHeaders();
      console.log('Submitting proposal ID:', proposalId);
      console.log('Auth headers:', authHeaders);
      console.log('API URL:', `http://localhost:8080/api/proposals/${proposalId}/submit`);
      console.log('Vendor token from localStorage:', localStorage.getItem('vendor_token'));

      // Add Content-Type header explicitly for PATCH requests
      const headers = {
        'Content-Type': 'application/json',
        ...authHeaders
      };

      console.log('Final headers being sent:', headers);

      const response = await axios.patch(
        `http://localhost:8080/api/proposals/${proposalId}/submit`,
        {},
        { headers }
      );
      console.log('Proposal Submitted API Response:', response.data);
      setSuccess('Proposal submitted successfully!');
      fetchProposals();
    } catch (err) {
      console.error('Error submitting proposal:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        headers: err.response?.headers,
        config: err.config
      });

      // Check specific error types
      if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
        localStorage.removeItem('vendor_token');
        navigate('/auth');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to perform this action.');
      } else if (err.response?.status === 404) {
        setError('Proposal not found or URL is incorrect.');
      } else if (err.response?.status === 405) {
        setError('Method not allowed. Server may not support PATCH requests.');
      } else {
        setError('Failed to submit proposal: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  // Withdraw proposal (PATCH /proposals/:id/withdraw)
  const withdrawProposal = async (proposalId, reason = 'Withdrawn by vendor') => {
    try {
      setLoading(true);
      setError('');

      const authHeaders = getAuthHeaders();
      console.log('Withdrawing proposal ID:', proposalId);
      console.log('Withdraw reason:', reason);
      console.log('Auth headers:', authHeaders);
      console.log('API URL:', `http://localhost:8080/api/proposals/${proposalId}/withdraw`);
      console.log('Vendor token from localStorage:', localStorage.getItem('vendor_token'));

      // Add Content-Type header explicitly for PATCH requests
      const headers = {
        'Content-Type': 'application/json',
        ...authHeaders
      };

      console.log('Final headers being sent:', headers);

      const response = await axios.patch(
        `http://localhost:8080/api/proposals/${proposalId}/withdraw`,
        { reason },
        { headers }
      );
      console.log('Proposal Withdrawn API Response:', response.data);
      setSuccess('Proposal withdrawn successfully!');
      fetchProposals();
    } catch (err) {
      console.error('Error withdrawing proposal:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        headers: err.response?.headers,
        config: err.config
      });

      // Check specific error types
      if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
        localStorage.removeItem('vendor_token');
        navigate('/auth');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to perform this action.');
      } else if (err.response?.status === 404) {
        setError('Proposal not found or URL is incorrect.');
      } else if (err.response?.status === 405) {
        setError('Method not allowed. Server may not support PATCH requests.');
      } else {
        setError('Failed to withdraw proposal: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  // Update vendor profile (PUT /vendors/:id)
  const updateVendorProfile = async (e) => {
    e.preventDefault();
    if (!vendorProfile) return;

    try {
      setLoading(true);

      const payload = {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phone: profileForm.phone,
        specialization: profileForm.specialization,
        location: profileForm.location,
        portfolio: profileForm.portfolio,
        description: profileForm.description
      };

      console.log('Updating Vendor Profile:', payload);

      const response = await axios.put(
        `http://localhost:8080/api/vendors/${vendorProfile._id}`,
        payload,
        { headers: getAuthHeaders() }
      );
      console.log('Vendor Profile Updated API Response:', response.data);

      setShowProfileEdit(false);
      setSuccess('Profile updated successfully!');
      fetchVendorProfile();
    } catch (err) {
      console.error('Error updating vendor profile:', err);
      setError('Failed to update profile: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Clear previous messages
    setError('');
    setSuccess('');

    fetchOpportunities();
    const vendorToken = localStorage.getItem('vendor_token');
    if (vendorToken) {
      fetchProposals();
      fetchDashboard();
      fetchVendorProfile();
    }
  }, []);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const formatCurrency = (amount) => {
    if (!amount) return 'Budget TBD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'No date';
    return new Date(date).toLocaleDateString();
  };

  const tabs = [
    { id: 'opportunities', label: 'Browse Opportunities' },
    { id: 'proposals', label: 'My Proposals' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'profile', label: 'My Profile' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Vendor Portal</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Home
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  navigate('/');
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {/* Opportunities Tab */}
        {activeTab === 'opportunities' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse Market Requests</h2>
            {loading ? (
              <div className="text-center py-8">Loading opportunities...</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {opportunities.map((opportunity) => (
                  <div key={opportunity._id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{opportunity.title}</h3>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {opportunity.category || 'General'}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-4">{opportunity.description}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Budget:</span>
                        <span className="font-medium">{formatCurrency(opportunity.maxBudget)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Deadline:</span>
                        <span>{formatDate(opportunity.deadline)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Proposals:</span>
                        <span>{opportunity.proposals?.length || 0}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        onClick={() => setSelectedOpportunity(opportunity)}
                      >
                        Submit Proposal
                      </button>
                      <button
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                        onClick={() => markInterest(opportunity._id, true)}
                      >
                        Mark Interest
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Proposals Tab */}
        {activeTab === 'proposals' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Proposals</h2>
            {loading ? (
              <div className="text-center py-8">Loading proposals...</div>
            ) : proposals.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No proposals yet</p>
                <button
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  onClick={() => setActiveTab('opportunities')}
                >
                  Browse Opportunities
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {proposals.map((proposal) => (
                  <div key={proposal._id} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{proposal.proposedItem}</h3>
                        <p className="text-gray-600">{proposal.description}</p>
                        {proposal.marketRequest && (
                          <div className="text-sm text-blue-600 mt-1">
                            <p>Market Request: {proposal.marketRequest.title}</p>
                            <p>Status: {proposal.marketRequest.status} | Deadline: {formatDate(proposal.marketRequest.deadline)}</p>
                            {proposal.marketRequest.daysUntilDeadline !== undefined && (
                              <p className={`${proposal.marketRequest.daysUntilDeadline < 7 ? 'text-red-600' : 'text-blue-600'}`}>
                                {proposal.marketRequest.daysUntilDeadline} days until deadline
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        proposal.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        proposal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        proposal.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {proposal.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-500">Unit Price:</span>
                        <div className="font-medium">{formatCurrency(proposal.unitPrice)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Quantity:</span>
                        <div className="font-medium">{proposal.quantity}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Price:</span>
                        <div className="font-medium">{formatCurrency(proposal.totalPrice || (proposal.unitPrice * proposal.quantity))}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Delivery:</span>
                        <div className="font-medium">{proposal.deliveryTime}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Submitted:</span>
                        <div className="font-medium">{formatDate(proposal.createdAt)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Evaluation:</span>
                        <div className="font-medium">
                          {proposal.evaluation?.percentageScore
                            ? `${proposal.evaluation.percentageScore}% (Manual)`
                            : proposal.aiEvaluation?.overallScore
                              ? `${proposal.aiEvaluation.overallScore.toFixed(1)}/100 (AI)`
                              : 'Not evaluated'
                          }
                        </div>
                      </div>
                    </div>

                    {/* AI Evaluation Display */}
                    {proposal.aiEvaluation && proposal.aiEvaluation.overallScore && (
                      <div className="bg-purple-50 p-4 rounded-lg mb-4">
                        <h4 className="font-semibold text-purple-900 mb-2">🤖 AI Evaluation Results</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                          <div className="text-center">
                            <div className="text-sm text-purple-700">Cost Score</div>
                            <div className="font-bold text-purple-900">{proposal.aiEvaluation.costScore}/100</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-purple-700">Delivery Score</div>
                            <div className="font-bold text-purple-900">{proposal.aiEvaluation.deliveryScore}/100</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-purple-700">Compliance Score</div>
                            <div className="font-bold text-purple-900">{proposal.aiEvaluation.complianceScore}/100</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-purple-700">Overall Score</div>
                            <div className="font-bold text-purple-900">{proposal.aiEvaluation.overallScore.toFixed(1)}/100</div>
                          </div>
                        </div>
                        {proposal.aiEvaluation.insights?.recommendation && (
                          <div className="bg-white p-3 rounded border">
                            <div className="text-sm text-purple-700 font-medium">AI Recommendation:</div>
                            <div className="text-sm text-gray-700 mt-1">{proposal.aiEvaluation.insights.recommendation}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Manual Evaluation Display */}
                    {proposal.evaluation?.scores && proposal.evaluation.scores.length > 0 && (
                      <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <h4 className="font-semibold text-blue-900 mb-2">📊 Manual Evaluation Results</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          {proposal.evaluation.scores.map((score, index) => (
                            <div key={index} className="bg-white p-3 rounded border">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-blue-900">{score.criterion}</span>
                                <span className="font-bold text-blue-900">{score.score}/{score.maxScore}</span>
                              </div>
                              {score.notes && (
                                <div className="text-xs text-gray-600 mt-1">{score.notes}</div>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="text-center">
                          <span className="text-sm text-blue-700">Total Score: </span>
                          <span className="font-bold text-blue-900">
                            {proposal.evaluation.totalScore}/{proposal.evaluation.maxTotalScore}
                            ({proposal.evaluation.percentageScore}%)
                          </span>
                        </div>
                        {proposal.evaluation.overallNotes && (
                          <div className="bg-white p-3 rounded border mt-3">
                            <div className="text-sm text-blue-700 font-medium">Evaluator Notes:</div>
                            <div className="text-sm text-gray-700 mt-1">{proposal.evaluation.overallNotes}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {proposal.status === 'draft' && (
                        <>
                          <button
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                            onClick={() => {
                              setEditingProposal(proposal);
                              setProposalForm({
                                proposedItem: proposal.proposedItem,
                                description: proposal.description,
                                specifications: proposal.specifications || {},
                                quantity: proposal.quantity,
                                unitPrice: proposal.unitPrice,
                                currency: proposal.currency || 'USD',
                                deliveryTime: proposal.deliveryTime,
                                deliveryDate: proposal.deliveryDate,
                                warranty: proposal.warranty || '',
                                additionalServices: proposal.additionalServices || [],
                                complianceDocuments: proposal.complianceDocuments || [],
                                vendorNotes: proposal.vendorNotes || ''
                              });
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            onClick={() => {
                              console.log('Submit button clicked for proposal:', proposal._id);
                              console.log('Proposal status:', proposal.status);
                              if (window.confirm('Are you sure you want to submit this proposal?')) {
                                submitExistingProposal(proposal._id);
                              }
                            }}
                          >
                            Submit
                          </button>
                        </>
                      )}

                      {(proposal.status === 'draft' || proposal.status === 'pending') && (
                        <button
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                          onClick={() => withdrawProposal(proposal._id, 'Withdrawn by vendor')}
                        >
                          {proposal.status === 'draft' ? 'Delete' : 'Withdraw'}
                        </button>
                      )}

                      <button
                        className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
                        onClick={() => {
                          console.log('View proposal details:', proposal);
                          // Could implement a detailed view modal here
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
            {dashboardData ? (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Proposals</h3>
                    <p className="text-3xl font-bold text-blue-600">{dashboardData.stats?.proposals?.total || 0}</p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Submitted</h3>
                    <p className="text-3xl font-bold text-yellow-600">{dashboardData.stats?.proposals?.submitted || 0}</p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Accepted</h3>
                    <p className="text-3xl font-bold text-green-600">{dashboardData.stats?.proposals?.accepted || 0}</p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Win Rate</h3>
                    <p className="text-3xl font-bold text-purple-600">{dashboardData.stats?.proposals?.winRate || 0}%</p>
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Draft Proposals</h3>
                    <p className="text-3xl font-bold text-gray-600">{dashboardData.stats?.proposals?.draft || 0}</p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Rejected</h3>
                    <p className="text-3xl font-bold text-red-600">{dashboardData.stats?.proposals?.rejected || 0}</p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Market Requests Viewed</h3>
                    <p className="text-3xl font-bold text-indigo-600">{dashboardData.stats?.marketRequests?.viewed || 0}</p>
                  </div>
                </div>

                {/* Recent Activity */}
                {dashboardData.stats?.recentActivity && dashboardData.stats.recentActivity.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                      {dashboardData.stats.recentActivity.map((activity, index) => (
                        <div key={activity.id || index} className="border-l-4 border-blue-500 pl-4 py-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-gray-900">{activity.marketRequest?.title}</h4>
                              <p className="text-sm text-gray-600">
                                Status: <span className={`font-medium ${
                                  activity.status === 'accepted' ? 'text-green-600' :
                                  activity.status === 'rejected' ? 'text-red-600' :
                                  activity.status === 'submitted' ? 'text-yellow-600' :
                                  'text-gray-600'
                                }`}>{activity.status}</span>
                              </p>
                              <p className="text-sm text-gray-600">
                                Total Price: <span className="font-medium">${activity.totalPrice?.toLocaleString()}</span>
                              </p>
                              {activity.complianceRate && (
                                <p className="text-sm text-gray-600">
                                  Compliance Rate: <span className="font-medium text-green-600">{activity.complianceRate}%</span>
                                </p>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(activity.submittedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Please log in to view dashboard</p>
                <button
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  onClick={() => navigate('/auth')}
                >
                  Login
                </button>
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
              <button
                onClick={() => setShowProfileEdit(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Edit Profile
              </button>
            </div>

            {vendorProfile ? (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-500">Name:</span>
                        <div className="font-medium">{vendorProfile.firstName} {vendorProfile.lastName}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <div className="font-medium">{vendorProfile.email}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Phone:</span>
                        <div className="font-medium">{vendorProfile.phone || 'Not provided'}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Location:</span>
                        <div className="font-medium">{vendorProfile.location || 'Not provided'}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-500">Specialization:</span>
                        <div className="font-medium">
                          {vendorProfile.specialization?.length > 0
                            ? vendorProfile.specialization.join(', ')
                            : 'Not specified'
                          }
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Portfolio:</span>
                        <div className="font-medium text-sm">
                          {vendorProfile.portfolio || 'No portfolio description'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Description:</span>
                        <div className="font-medium text-sm">
                          {vendorProfile.description || 'No description provided'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statistics Section */}
                {vendorProfile.statistics && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Statistics</h3>
                    <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
                      <div className="bg-gray-50 rounded p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{vendorProfile.statistics.totalProposals}</div>
                        <div className="text-sm text-gray-600">Total Proposals</div>
                      </div>
                      <div className="bg-gray-50 rounded p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{vendorProfile.statistics.acceptedProposals}</div>
                        <div className="text-sm text-gray-600">Accepted</div>
                      </div>
                      <div className="bg-gray-50 rounded p-4 text-center">
                        <div className="text-2xl font-bold text-red-600">{vendorProfile.statistics.rejectedProposals}</div>
                        <div className="text-sm text-gray-600">Rejected</div>
                      </div>
                      <div className="bg-gray-50 rounded p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-600">${vendorProfile.statistics.averageOrderValue}</div>
                        <div className="text-sm text-gray-600">Avg Order Value</div>
                      </div>
                      <div className="bg-gray-50 rounded p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">{vendorProfile.statistics.onTimeDeliveryRate}%</div>
                        <div className="text-sm text-gray-600">On-Time Delivery</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Profile Info */}
                <div className="mt-6 grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-500">Rating:</span>
                        <div className="font-medium">
                          {vendorProfile.rating > 0 ? `${vendorProfile.rating}/5` : 'No ratings yet'}
                          {vendorProfile.totalRatings > 0 && (
                            <span className="text-gray-500 ml-2">({vendorProfile.totalRatings} reviews)</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Completed Orders:</span>
                        <div className="font-medium">{vendorProfile.completedOrders}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Response Time:</span>
                        <div className="font-medium">{vendorProfile.responseTime} hours</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Member Since:</span>
                        <div className="font-medium">{formatDate(vendorProfile.createdAt)}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-2">Verified:</span>
                        <span className={`px-2 py-1 rounded text-sm ${vendorProfile.isVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {vendorProfile.isVerified ? 'Verified' : 'Not Verified'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-2">Email Verified:</span>
                        <span className={`px-2 py-1 rounded text-sm ${vendorProfile.isEmailVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {vendorProfile.isEmailVerified ? 'Verified' : 'Not Verified'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-2">Account Status:</span>
                        <span className={`px-2 py-1 rounded text-sm ${vendorProfile.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {vendorProfile.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {vendorProfile.certifications && vendorProfile.certifications.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Certifications</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {vendorProfile.certifications.map((cert, index) => (
                        <div key={index} className="border border-gray-200 rounded p-4">
                          <div className="font-medium">{cert.name}</div>
                          <div className="text-sm text-gray-600">Issued by: {cert.issuedBy}</div>
                          <div className="text-sm text-gray-600">
                            Valid: {formatDate(cert.issuedDate)} - {formatDate(cert.expiryDate)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Please log in to view your profile</p>
                <button
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  onClick={() => navigate('/auth')}
                >
                  Login
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Proposal Modal */}
      {selectedOpportunity && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">Submit Proposal</h3>
                <button
                  onClick={() => setSelectedOpportunity(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded">
                <h4 className="font-semibold text-gray-900">{selectedOpportunity.title}</h4>
                <p className="text-gray-600 text-sm">{selectedOpportunity.description}</p>
                <p className="text-sm mt-2">
                  <span className="font-medium">Budget:</span> {formatCurrency(selectedOpportunity.maxBudget)}
                </p>
              </div>

              <form onSubmit={submitProposal} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proposed Item/Service
                  </label>
                  <input
                    type="text"
                    required
                    value={proposalForm.proposedItem}
                    onChange={(e) => setProposalForm({...proposalForm, proposedItem: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={proposalForm.description}
                    onChange={(e) => setProposalForm({...proposalForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={proposalForm.quantity}
                      onChange={(e) => setProposalForm({...proposalForm, quantity: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit Price ($)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={proposalForm.unitPrice}
                      onChange={(e) => setProposalForm({...proposalForm, unitPrice: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={proposalForm.currency}
                      onChange={(e) => setProposalForm({...proposalForm, currency: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Time
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., 7-10 business days"
                      value={proposalForm.deliveryTime}
                      onChange={(e) => setProposalForm({...proposalForm, deliveryTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Date
                    </label>
                    <input
                      type="date"
                      value={proposalForm.deliveryDate}
                      onChange={(e) => setProposalForm({...proposalForm, deliveryDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warranty Information
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 3-year comprehensive warranty"
                    value={proposalForm.warranty}
                    onChange={(e) => setProposalForm({...proposalForm, warranty: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Services (comma-separated)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Free setup, Training, 24/7 support, Data migration"
                    value={Array.isArray(proposalForm.additionalServices) ? proposalForm.additionalServices.join(', ') : proposalForm.additionalServices}
                    onChange={(e) => setProposalForm({...proposalForm, additionalServices: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compliance Documents (JSON format)
                  </label>
                  <textarea
                    rows={4}
                    placeholder='[{"requirement": "Warranty", "documentName": "Warranty Doc", "documentUrl": "https://...", "isCompliant": true, "notes": "Details..."}]'
                    value={Array.isArray(proposalForm.complianceDocuments) ? JSON.stringify(proposalForm.complianceDocuments, null, 2) : proposalForm.complianceDocuments}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setProposalForm({...proposalForm, complianceDocuments: parsed});
                      } catch {
                        setProposalForm({...proposalForm, complianceDocuments: e.target.value});
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Technical Specifications (JSON format)
                  </label>
                  <textarea
                    rows={4}
                    placeholder='{"processor": "Intel i7", "ram": "16GB", ...}'
                    value={typeof proposalForm.specifications === 'object' ? JSON.stringify(proposalForm.specifications, null, 2) : proposalForm.specifications}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setProposalForm({...proposalForm, specifications: parsed});
                      } catch {
                        setProposalForm({...proposalForm, specifications: e.target.value});
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Additional notes, terms, or special offers..."
                    value={proposalForm.vendorNotes}
                    onChange={(e) => setProposalForm({...proposalForm, vendorNotes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Submitting...' : 'Submit Proposal'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedOpportunity(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {showProfileEdit && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">Edit Profile</h3>
                <button
                  onClick={() => setShowProfileEdit(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={updateVendorProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      required
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      required
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={profileForm.location}
                    onChange={(e) => setProfileForm({...profileForm, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={Array.isArray(profileForm.specialization) ? profileForm.specialization.join(', ') : ''}
                    onChange={(e) => setProfileForm({
                      ...profileForm,
                      specialization: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                    })}
                    placeholder="e.g., Electronics, Hardware, Software"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio</label>
                  <textarea
                    rows={4}
                    value={profileForm.portfolio}
                    onChange={(e) => setProfileForm({...profileForm, portfolio: e.target.value})}
                    placeholder="Describe your business portfolio and capabilities..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    rows={3}
                    value={profileForm.description}
                    onChange={(e) => setProfileForm({...profileForm, description: e.target.value})}
                    placeholder="Brief description of your business..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Profile'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProfileEdit(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Proposal Edit Modal */}
      {editingProposal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">Edit Proposal</h3>
                <button
                  onClick={() => {
                    setEditingProposal(null);
                    resetProposalForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded">
                <h4 className="font-semibold text-gray-900">{editingProposal.proposedItem}</h4>
                <p className="text-gray-600 text-sm">Proposal ID: {editingProposal._id}</p>
              </div>

              <form onSubmit={updateProposal} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    rows={3}
                    value={proposalForm.description}
                    onChange={(e) => setProposalForm({...proposalForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit Price ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={proposalForm.unitPrice}
                      onChange={(e) => setProposalForm({...proposalForm, unitPrice: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Time</label>
                    <input
                      type="text"
                      value={proposalForm.deliveryTime}
                      onChange={(e) => setProposalForm({...proposalForm, deliveryTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Warranty</label>
                  <input
                    type="text"
                    value={proposalForm.warranty}
                    onChange={(e) => setProposalForm({...proposalForm, warranty: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Notes</label>
                  <textarea
                    rows={3}
                    value={proposalForm.vendorNotes}
                    onChange={(e) => setProposalForm({...proposalForm, vendorNotes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Proposal'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProposal(null);
                      resetProposalForm();
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorPage;