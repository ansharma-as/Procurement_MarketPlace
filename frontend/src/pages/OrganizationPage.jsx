import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const OrganizationPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('rfp-requests');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check for organization user authentication on component mount
  useEffect(() => {
    const userToken = localStorage.getItem('user_token');
    if (!userToken) {
      alert('Please login as an organization user to access this page');
      navigate('/auth');
      return;
    }
  }, [navigate]);

  // Data states
  const [rfpRequests, setRfpRequests] = useState([]);
  const [marketRequests, setMarketRequests] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [vendors, setVendors] = useState([]);

  // Form states
  const [showCreateRFP, setShowCreateRFP] = useState(false);
  const [showCreateMarket, setShowCreateMarket] = useState(false);
  const [showEditRFP, setShowEditRFP] = useState(false);
  const [showEditMarket, setShowEditMarket] = useState(false);
  const [showReviewRFP, setShowReviewRFP] = useState(false);
  const [showProposalEvaluation, setShowProposalEvaluation] = useState(false);
  const [selectedRFP, setSelectedRFP] = useState(null);
  const [selectedMarketRequest, setSelectedMarketRequest] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [success, setSuccess] = useState('');

  // Enhanced RFP form based on Postman collection
  const [rfpForm, setRfpForm] = useState({
    title: '',
    description: '',
    category: '',
    urgency: 'medium',
    specifications: {},
    quantity: 1,
    budgetEstimate: '',
    currency: 'USD',
    justification: '',
    expectedDeliveryDate: ''
  });

  // Enhanced Market Request form
  const [marketForm, setMarketForm] = useState({
    title: '',
    description: '',
    category: '',
    maxBudget: '',
    currency: 'USD',
    deadline: '',
    specifications: {},
    quantity: 1,
    evaluationCriteria: {},
    rfpRequestId: ''
  });

  // Review form for RFP approval
  const [reviewForm, setReviewForm] = useState({
    status: 'approved',
    reviewNotes: '',
    managerApproval: true
  });

  // Proposal evaluation form
  const [evaluationForm, setEvaluationForm] = useState({
    technicalScore: 0,
    priceScore: 0,
    deliveryScore: 0,
    overallScore: 0,
    evaluationNotes: '',
    recommendation: 'pending'
  });

  // Get auth token for organization user
  const getAuthHeaders = () => {
    const token = localStorage.getItem('user_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch RFP requests
  const fetchRFPRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8080/api/rfp-requests', {
        headers: getAuthHeaders(),
        params: { page: 1, limit: 20 }
      });
      console.log('RFP Requests:', response.data);
      // API returns { success: true, data: { requests: [...] } }
      setRfpRequests(response.data.data?.requests || []);
    } catch (err) {
      console.error('Error fetching RFP requests:', err);
      setError('Failed to load RFP requests');
    } finally {
      setLoading(false);
    }
  };

  // Fetch market requests
  const fetchMarketRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8080/api/market-requests', {
        headers: getAuthHeaders(),
        params: { page: 1, limit: 20 }
      });
      console.log('Market Requests:', response.data);
      setMarketRequests(response.data.data?.requests || []);
    } catch (err) {
      console.error('Error fetching market requests:', err);
      setError('Failed to load market requests');
    } finally {
      setLoading(false);
    }
  };

  // Fetch proposals
  const fetchProposals = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8080/api/proposals', {
        headers: getAuthHeaders(),
        params: { page: 1, limit: 20 }
      });
      console.log('Proposals:', response.data);
      // API returns { success: true, data: { proposals: [...] } }
      setProposals(response.data.data?.proposals || []);
    } catch (err) {
      console.error('Error fetching proposals:', err);
      setError('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  // Fetch vendors
  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8080/api/vendors', {
        headers: getAuthHeaders(),
        params: { page: 1, limit: 20 }
      });
      console.log('Vendors:', response.data);
      // API returns { success: true, data: { vendors: [...] } }
      setVendors(response.data.data?.vendors || []);
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  // Create RFP request (POST /rfp-requests)
  const createRFPRequest = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      // Parse specifications if it's a string
      let specifications = rfpForm.specifications;
      if (typeof specifications === 'string') {
        try {
          specifications = JSON.parse(specifications);
        } catch {
          specifications = {};
        }
      }

      const payload = {
        title: rfpForm.title,
        description: rfpForm.description,
        category: rfpForm.category,
        urgency: rfpForm.urgency,
        specifications: specifications,
        quantity: parseInt(rfpForm.quantity),
        budgetEstimate: parseFloat(rfpForm.budgetEstimate),
        currency: rfpForm.currency,
        justification: rfpForm.justification,
        expectedDeliveryDate: rfpForm.expectedDeliveryDate ? new Date(rfpForm.expectedDeliveryDate).toISOString() : null
      };

      console.log('Creating RFP Request:', payload);
      const response = await axios.post('http://localhost:8080/api/rfp-requests', payload, {
        headers: getAuthHeaders()
      });
      console.log('RFP Created:', response.data);

      resetRFPForm();
      setShowCreateRFP(false);
      setSuccess('RFP request created successfully!');
      fetchRFPRequests();
    } catch (err) {
      console.error('Error creating RFP:', err);
      setError('Failed to create RFP request: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Update RFP request (PUT /rfp-requests/:id)
  const updateRFPRequest = async (e) => {
    e.preventDefault();
    if (!selectedRFP) return;

    try {
      setLoading(true);
      setError('');

      let specifications = rfpForm.specifications;
      if (typeof specifications === 'string') {
        try {
          specifications = JSON.parse(specifications);
        } catch {
          specifications = {};
        }
      }

      const payload = {
        title: rfpForm.title,
        description: rfpForm.description,
        category: rfpForm.category,
        urgency: rfpForm.urgency,
        specifications: specifications,
        quantity: parseInt(rfpForm.quantity),
        budgetEstimate: parseFloat(rfpForm.budgetEstimate),
        currency: rfpForm.currency,
        justification: rfpForm.justification,
        expectedDeliveryDate: rfpForm.expectedDeliveryDate ? new Date(rfpForm.expectedDeliveryDate).toISOString() : null
      };

      console.log('Updating RFP Request:', payload);
      const response = await axios.put(`http://localhost:8080/api/rfp-requests/${selectedRFP._id}`, payload, {
        headers: getAuthHeaders()
      });
      console.log('RFP Updated:', response.data);

      setShowEditRFP(false);
      setSelectedRFP(null);
      resetRFPForm();
      setSuccess('RFP request updated successfully!');
      fetchRFPRequests();
    } catch (err) {
      console.error('Error updating RFP:', err);
      setError('Failed to update RFP request: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Review RFP request (PATCH /rfp-requests/:id/review)
  const reviewRFPRequest = async (e) => {
    e.preventDefault();
    if (!selectedRFP) return;

    try {
      setLoading(true);
      setError('');

      const payload = {
        status: reviewForm.status,
        reviewNotes: reviewForm.reviewNotes,
        managerApproval: reviewForm.managerApproval
      };

      console.log('Reviewing RFP Request:', payload);
      const response = await axios.patch(`http://localhost:8080/api/rfp-requests/${selectedRFP._id}/review`, payload, {
        headers: getAuthHeaders()
      });
      console.log('RFP Reviewed:', response.data);

      setShowReviewRFP(false);
      setSelectedRFP(null);
      setReviewForm({ status: 'approved', reviewNotes: '', managerApproval: true });
      setSuccess('RFP request reviewed successfully!');
      fetchRFPRequests();
    } catch (err) {
      console.error('Error reviewing RFP:', err);
      setError('Failed to review RFP request: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Delete RFP request (DELETE /rfp-requests/:id)
  const deleteRFPRequest = async (id) => {
    if (!window.confirm('Are you sure you want to delete this RFP request?')) return;

    try {
      setLoading(true);
      const response = await axios.delete(`http://localhost:8080/api/rfp-requests/${id}`, {
        headers: getAuthHeaders()
      });
      console.log('RFP Deleted:', response.data);
      setSuccess('RFP request deleted successfully!');
      fetchRFPRequests();
    } catch (err) {
      console.error('Error deleting RFP:', err);
      setError('Failed to delete RFP request: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Reset RFP form
  const resetRFPForm = () => {
    setRfpForm({
      title: '',
      description: '',
      category: '',
      urgency: 'medium',
      specifications: {},
      quantity: 1,
      budgetEstimate: '',
      currency: 'USD',
      justification: '',
      expectedDeliveryDate: ''
    });
  };

  // Create market request (POST /market-requests)
  const createMarketRequest = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      // Parse specifications and evaluation criteria if they're strings
      let specifications = marketForm.specifications;
      if (typeof specifications === 'string') {
        try {
          specifications = JSON.parse(specifications);
        } catch {
          specifications = {};
        }
      }

      let evaluationCriteria = marketForm.evaluationCriteria;
      if (typeof evaluationCriteria === 'string') {
        try {
          evaluationCriteria = JSON.parse(evaluationCriteria);
        } catch {
          evaluationCriteria = {};
        }
      }

      const payload = {
        title: marketForm.title,
        description: marketForm.description,
        category: marketForm.category,
        maxBudget: parseFloat(marketForm.maxBudget),
        currency: marketForm.currency,
        deadline: marketForm.deadline ? new Date(marketForm.deadline).toISOString() : null,
        specifications: specifications,
        quantity: parseInt(marketForm.quantity),
        evaluationCriteria: evaluationCriteria,
        rfpRequestId: marketForm.rfpRequestId || null
      };

      console.log('Creating Market Request:', payload);
      const response = await axios.post('http://localhost:8080/api/market-requests', payload, {
        headers: getAuthHeaders()
      });
      console.log('Market Request Created:', response.data);

      resetMarketForm();
      setShowCreateMarket(false);
      setSuccess('Market request created successfully!');
      fetchMarketRequests();
    } catch (err) {
      console.error('Error creating market request:', err);
      setError('Failed to create market request: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Update market request (PUT /market-requests/:id)
  const updateMarketRequest = async (e) => {
    e.preventDefault();
    if (!selectedMarketRequest) return;

    try {
      setLoading(true);
      setError('');

      let specifications = marketForm.specifications;
      if (typeof specifications === 'string') {
        try {
          specifications = JSON.parse(specifications);
        } catch {
          specifications = {};
        }
      }

      let evaluationCriteria = marketForm.evaluationCriteria;
      if (typeof evaluationCriteria === 'string') {
        try {
          evaluationCriteria = JSON.parse(evaluationCriteria);
        } catch {
          evaluationCriteria = {};
        }
      }

      const payload = {
        title: marketForm.title,
        description: marketForm.description,
        category: marketForm.category,
        maxBudget: parseFloat(marketForm.maxBudget),
        currency: marketForm.currency,
        deadline: marketForm.deadline ? new Date(marketForm.deadline).toISOString() : null,
        specifications: specifications,
        quantity: parseInt(marketForm.quantity),
        evaluationCriteria: evaluationCriteria
      };

      console.log('Updating Market Request:', payload);
      const response = await axios.put(`http://localhost:8080/api/market-requests/${selectedMarketRequest._id}`, payload, {
        headers: getAuthHeaders()
      });
      console.log('Market Request Updated:', response.data);

      setShowEditMarket(false);
      setSelectedMarketRequest(null);
      resetMarketForm();
      setSuccess('Market request updated successfully!');
      fetchMarketRequests();
    } catch (err) {
      console.error('Error updating market request:', err);
      setError('Failed to update market request: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Reset Market form
  const resetMarketForm = () => {
    setMarketForm({
      title: '',
      description: '',
      category: '',
      maxBudget: '',
      currency: 'USD',
      deadline: '',
      specifications: {},
      quantity: 1,
      evaluationCriteria: {},
      rfpRequestId: ''
    });
  };

  // Close market request (PATCH /market-requests/:id/close)
  const closeMarketRequest = async (id, reason) => {
    if (!window.confirm('Are you sure you want to close this market request?')) return;

    try {
      setLoading(true);
      const response = await axios.patch(
        `http://localhost:8080/api/market-requests/${id}/close`,
        { reason: reason || 'Closed through organization portal' },
        { headers: getAuthHeaders() }
      );
      console.log('Market request closed:', response.data);
      setSuccess('Market request closed successfully!');
      fetchMarketRequests();
    } catch (err) {
      console.error('Error closing market request:', err);
      setError('Failed to close market request: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Award market request (PATCH /market-requests/:id/award)
  const awardMarketRequest = async (marketRequestId, proposalId, managerNotes = '') => {
    if (!window.confirm('Are you sure you want to award this contract?')) return;

    try {
      setLoading(true);
      const response = await axios.patch(
        `http://localhost:8080/api/market-requests/${marketRequestId}/award`,
        {
          proposalId,
          managerNotes: managerNotes || 'Awarded through organization portal'
        },
        { headers: getAuthHeaders() }
      );
      console.log('Market request awarded:', response.data);
      setSuccess('Contract awarded successfully!');
      fetchMarketRequests();
      fetchProposals();
    } catch (err) {
      console.error('Error awarding market request:', err);
      setError('Failed to award market request: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Evaluate proposal (PATCH /proposals/:id/evaluate)
  const evaluateProposal = async (e) => {
    e.preventDefault();
    if (!selectedProposal) return;

    try {
      setLoading(true);
      setError('');

      const payload = {
        scores: {
          technical: parseFloat(evaluationForm.technicalScore),
          price: parseFloat(evaluationForm.priceScore),
          delivery: parseFloat(evaluationForm.deliveryScore),
          overall: parseFloat(evaluationForm.overallScore)
        },
        evaluationNotes: evaluationForm.evaluationNotes,
        recommendation: evaluationForm.recommendation
      };

      console.log('Evaluating Proposal:', payload);
      const response = await axios.patch(
        `http://localhost:8080/api/proposals/${selectedProposal._id}/evaluate`,
        payload,
        { headers: getAuthHeaders() }
      );
      console.log('Proposal evaluated:', response.data);

      setShowProposalEvaluation(false);
      setSelectedProposal(null);
      setEvaluationForm({
        technicalScore: 0,
        priceScore: 0,
        deliveryScore: 0,
        overallScore: 0,
        evaluationNotes: '',
        recommendation: 'pending'
      });
      setSuccess('Proposal evaluated successfully!');
      fetchProposals();
    } catch (err) {
      console.error('Error evaluating proposal:', err);
      setError('Failed to evaluate proposal: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Accept proposal (PATCH /proposals/:id/accept)
  const acceptProposal = async (proposalId, managerNotes = '') => {
    if (!window.confirm('Are you sure you want to accept this proposal?')) return;

    try {
      setLoading(true);
      const response = await axios.patch(
        `http://localhost:8080/api/proposals/${proposalId}/accept`,
        { managerNotes: managerNotes || 'Accepted through organization portal' },
        { headers: getAuthHeaders() }
      );
      console.log('Proposal accepted:', response.data);
      setSuccess('Proposal accepted successfully!');
      fetchProposals();
    } catch (err) {
      console.error('Error accepting proposal:', err);
      setError('Failed to accept proposal: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Reject proposal (PATCH /proposals/:id/reject)
  const rejectProposal = async (proposalId, rejectionReason = '', managerNotes = '') => {
    const reason = rejectionReason || prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      setLoading(true);
      const response = await axios.patch(
        `http://localhost:8080/api/proposals/${proposalId}/reject`,
        {
          rejectionReason: reason,
          managerNotes: managerNotes || 'Rejected through organization portal'
        },
        { headers: getAuthHeaders() }
      );
      console.log('Proposal rejected:', response.data);
      setSuccess('Proposal rejected successfully!');
      fetchProposals();
    } catch (err) {
      console.error('Error rejecting proposal:', err);
      setError('Failed to reject proposal: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('user_token');
    if (!token) {
      navigate('/auth');
      return;
    }

    if (activeTab === 'rfp-requests') fetchRFPRequests();
    else if (activeTab === 'market-requests') fetchMarketRequests();
    else if (activeTab === 'proposals') fetchProposals();
    else if (activeTab === 'vendors') fetchVendors();
  }, [activeTab]);

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
    { id: 'rfp-requests', label: 'RFP Requests' },
    { id: 'market-requests', label: 'Market Requests' },
    { id: 'proposals', label: 'Proposals' },
    { id: 'vendors', label: 'Vendors' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Organization Portal</h1>
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

        {/* RFP Requests Tab */}
        {activeTab === 'rfp-requests' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">RFP Requests</h2>
              <button
                onClick={() => setShowCreateRFP(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create RFP Request
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading RFP requests...</div>
            ) : (
              <div className="space-y-4">
                {rfpRequests.map((rfp) => (
                  <div key={rfp._id} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{rfp.title}</h3>
                        <p className="text-gray-600">{rfp.description}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        rfp.status === 'approved' ? 'bg-green-100 text-green-800' :
                        rfp.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {rfp.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-500">Budget:</span>
                        <div className="font-medium">{formatCurrency(rfp.budgetEstimate)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Category:</span>
                        <div className="font-medium">{rfp.category || 'General'}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Quantity:</span>
                        <div className="font-medium">{rfp.quantity}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Created:</span>
                        <div className="font-medium">{formatDate(rfp.createdAt)}</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedRFP(rfp);
                          setRfpForm({
                            title: rfp.title || '',
                            description: rfp.description || '',
                            category: rfp.category || '',
                            urgency: rfp.urgency || 'medium',
                            specifications: rfp.specifications || {},
                            quantity: rfp.quantity || 1,
                            budgetEstimate: rfp.budgetEstimate || '',
                            currency: rfp.currency || 'USD',
                            justification: rfp.justification || '',
                            expectedDeliveryDate: rfp.expectedDeliveryDate ? new Date(rfp.expectedDeliveryDate).toISOString().split('T')[0] : ''
                          });
                          setShowEditRFP(true);
                        }}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      {rfp.status === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedRFP(rfp);
                            setShowReviewRFP(true);
                          }}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Review
                        </button>
                      )}
                      <button
                        onClick={() => deleteRFPRequest(rfp._id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Market Requests Tab */}
        {activeTab === 'market-requests' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Market Requests</h2>
              <button
                onClick={() => setShowCreateMarket(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Market Request
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading market requests...</div>
            ) : (
              <div className="space-y-4">
                {marketRequests.map((request) => (
                  <div key={request._id} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                        <p className="text-gray-600">{request.description}</p>
                      </div>
                      <div className="flex space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          request.status === 'open' ? 'bg-green-100 text-green-800' :
                          request.status === 'closed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {request.status}
                        </span>
                        {request.status === 'open' && (
                          <button
                            onClick={() => closeMarketRequest(request._id, 'Closed by organization')}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                          >
                            Close
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Budget:</span>
                        <div className="font-medium">{formatCurrency(request.maxBudget)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Deadline:</span>
                        <div className="font-medium">{formatDate(request.deadline)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Proposals:</span>
                        <div className="font-medium">{request.proposals?.length || 0}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Views:</span>
                        <div className="font-medium">{request.viewsCount || 0}</div>
                      </div>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Received Proposals</h2>
            {loading ? (
              <div className="text-center py-8">Loading proposals...</div>
            ) : (
              <div className="space-y-4">
                {proposals.map((proposal) => (
                  <div key={proposal._id} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{proposal.proposedItem}</h3>
                        <p className="text-gray-600">{proposal.description}</p>
                        <p className="text-sm text-gray-500">
                          Vendor: {proposal.submittedBy?.companyName || 'Unknown'}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          proposal.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          proposal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          proposal.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {proposal.status}
                        </span>
                        {proposal.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleProposal(proposal._id, 'accept', 'Accepted')}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleProposal(proposal._id, 'reject', 'Rejected')}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Price:</span>
                        <div className="font-medium">{formatCurrency(proposal.totalPrice)}</div>
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
                        <span className="text-gray-500">Score:</span>
                        <div className="font-medium">{proposal.evaluationScore || 'Not scored'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vendors Tab */}
        {activeTab === 'vendors' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse Vendors</h2>
            {loading ? (
              <div className="text-center py-8">Loading vendors...</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vendors.map((vendor) => (
                  <div key={vendor._id} className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {vendor.companyName}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">{vendor.businessType}</p>

                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Contact:</span>
                        <div>{vendor.firstName} {vendor.lastName}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <div>{vendor.email}</div>
                      </div>
                      {vendor.phone && (
                        <div>
                          <span className="text-gray-500">Phone:</span>
                          <div>{vendor.phone}</div>
                        </div>
                      )}
                      {vendor.website && (
                        <div>
                          <span className="text-gray-500">Website:</span>
                          <div>
                            <a
                              href={vendor.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {vendor.website}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create RFP Modal */}
      {showCreateRFP && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">Create RFP Request</h3>
                <button
                  onClick={() => setShowCreateRFP(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={createRFPRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    required
                    value={rfpForm.title}
                    onChange={(e) => setRfpForm({...rfpForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    required
                    rows={4}
                    value={rfpForm.description}
                    onChange={(e) => setRfpForm({...rfpForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <input
                      type="text"
                      value={rfpForm.category}
                      onChange={(e) => setRfpForm({...rfpForm, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Budget Estimate ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={rfpForm.budgetEstimate}
                      onChange={(e) => setRfpForm({...rfpForm, budgetEstimate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expected Delivery Date</label>
                    <input
                      type="date"
                      value={rfpForm.expectedDeliveryDate}
                      onChange={(e) => setRfpForm({...rfpForm, expectedDeliveryDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={rfpForm.quantity}
                      onChange={(e) => setRfpForm({...rfpForm, quantity: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specifications</label>
                  <textarea
                    rows={3}
                    value={rfpForm.specifications}
                    onChange={(e) => setRfpForm({...rfpForm, specifications: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create RFP Request'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateRFP(false)}
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

      {/* Create Market Request Modal */}
      {showCreateMarket && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">Create Market Request</h3>
                <button
                  onClick={() => setShowCreateMarket(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={createMarketRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    required
                    value={marketForm.title}
                    onChange={(e) => setMarketForm({...marketForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    required
                    rows={4}
                    value={marketForm.description}
                    onChange={(e) => setMarketForm({...marketForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <input
                      type="text"
                      value={marketForm.category}
                      onChange={(e) => setMarketForm({...marketForm, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Budget ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={marketForm.maxBudget}
                      onChange={(e) => setMarketForm({...marketForm, maxBudget: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
                    <input
                      type="date"
                      value={marketForm.deadline}
                      onChange={(e) => setMarketForm({...marketForm, deadline: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={marketForm.quantity}
                      onChange={(e) => setMarketForm({...marketForm, quantity: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specifications</label>
                  <textarea
                    rows={3}
                    value={marketForm.specifications}
                    onChange={(e) => setMarketForm({...marketForm, specifications: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Market Request'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateMarket(false)}
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

export default OrganizationPage;