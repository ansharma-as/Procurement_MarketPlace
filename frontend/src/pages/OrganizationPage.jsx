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

  // AI-related state
  const [marketAnalysisData, setMarketAnalysisData] = useState(null);
  const [showMarketAnalysis, setShowMarketAnalysis] = useState(false);
  const [vendorInsightsData, setVendorInsightsData] = useState(null);
  const [showVendorInsights, setShowVendorInsights] = useState(false);
  const [selectedMarketRequestForAI, setSelectedMarketRequestForAI] = useState('');

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
    currency: 'INR',
    deadline: '',
    specifications: {},
    quantity: 1,
    evaluationCriteria: [],
    rfpRequestId: '',
    requirements: [],
    deliveryLocation: {},
    deliveryAddress: '',
    deliveryCity: '',
    deliveryState: '',
    deliveryZipCode: '',
    deliveryCountry: 'USA',
    deliveryContactPerson: '',
    deliveryContactPhone: ''
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

      // Parse specifications if it's a string
      let specifications = marketForm.specifications;
      if (typeof specifications === 'string') {
        try {
          specifications = JSON.parse(specifications);
        } catch {
          specifications = {};
        }
      }

      // Parse requirements if it's a string
      let requirements = marketForm.requirements;
      if (typeof requirements === 'string') {
        try {
          requirements = JSON.parse(requirements);
        } catch {
          requirements = [];
        }
      }

      // Parse evaluationCriteria if it's a string - MUST be array
      let evaluationCriteria = marketForm.evaluationCriteria;
      if (typeof evaluationCriteria === 'string') {
        try {
          evaluationCriteria = JSON.parse(evaluationCriteria);
        } catch {
          evaluationCriteria = [];
        }
      }
      // Ensure evaluationCriteria is always an array
      if (!Array.isArray(evaluationCriteria)) {
        evaluationCriteria = [];
      }

      // If no evaluation criteria provided, add default ones
      if (evaluationCriteria.length === 0) {
        evaluationCriteria = [
          {
            criterion: "Price Competitiveness",
            description: "Total cost including taxes and delivery",
            weight: 40,
            maxScore: 100
          },
          {
            criterion: "Technical Specifications",
            description: "Meeting or exceeding technical requirements",
            weight: 35,
            maxScore: 100
          },
          {
            criterion: "Delivery Timeline",
            description: "Proposed delivery schedule",
            weight: 25,
            maxScore: 100
          }
        ];
      }

      // Parse deliveryLocation if it's a string
      let deliveryLocation = marketForm.deliveryLocation;
      if (typeof deliveryLocation === 'string') {
        try {
          deliveryLocation = JSON.parse(deliveryLocation);
        } catch {
          deliveryLocation = {};
        }
      }

      const payload = {
        title: marketForm.title,
        description: marketForm.description,
        rfpRequest: marketForm.rfpRequestId || null,
        specifications: specifications,
        quantity: parseInt(marketForm.quantity) || 1,
        maxBudget: parseFloat(marketForm.maxBudget) || 0,
        currency: marketForm.currency || 'INR',
        deadline: marketForm.deadline ? new Date(marketForm.deadline).toISOString() : null,
        deliveryLocation: {
          address: String(marketForm.deliveryAddress || ''),
          city: String(marketForm.deliveryCity || ''),
          state: String(marketForm.deliveryState || ''),
          zipCode: String(marketForm.deliveryZipCode || ''),
          country: String(marketForm.deliveryCountry || 'USA'),
          contactPerson: String(marketForm.deliveryContactPerson || ''),
          contactPhone: String(marketForm.deliveryContactPhone || '')
        },
        requirements: requirements || [],
        evaluationCriteria: evaluationCriteria
      };

      console.log('Market Form State:', marketForm);
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
      currency: 'INR',
      deadline: '',
      specifications: {},
      quantity: 1,
      evaluationCriteria: [],
      rfpRequestId: '',
      requirements: [],
      deliveryLocation: {},
      deliveryAddress: '',
      deliveryCity: '',
      deliveryState: '',
      deliveryZipCode: '',
      deliveryCountry: 'USA',
      deliveryContactPerson: '',
      deliveryContactPhone: ''
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
      setError('');

      const authHeaders = getAuthHeaders();
      console.log('Accepting proposal ID:', proposalId);
      console.log('Auth headers:', authHeaders);
      console.log('Manager notes:', managerNotes);

      // Add Content-Type header explicitly for PATCH requests
      const headers = {
        'Content-Type': 'application/json',
        ...authHeaders
      };

      console.log('Final headers being sent:', headers);
      console.log('API URL:', `http://localhost:8080/api/proposals/${proposalId}/accept`);

      const response = await axios.patch(
        `http://localhost:8080/api/proposals/${proposalId}/accept`,
        { managerNotes: managerNotes || 'Accepted through organization portal' },
        { headers }
      );
      console.log('Proposal accepted:', response.data);
      setSuccess('Proposal accepted successfully!');
      fetchProposals();
    } catch (err) {
      console.error('Error accepting proposal:', err);
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
        localStorage.removeItem('user_token');
        navigate('/auth');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to perform this action.');
      } else if (err.response?.status === 404) {
        setError('Proposal not found or URL is incorrect.');
      } else if (err.response?.status === 405) {
        setError('Method not allowed. Server may not support PATCH requests.');
      } else {
        setError('Failed to accept proposal: ' + (err.response?.data?.message || err.message));
      }
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

  // ================ AI ENDPOINTS IMPLEMENTATION ================

  // Trigger AI evaluation for a single proposal (POST /ai/proposals/:id/evaluate)
  const triggerAIEvaluation = async (proposalId) => {
    try {
      setLoading(true);
      const response = await axios.post(
        `http://localhost:8080/api/ai/proposals/${proposalId}/evaluate`,
        {},
        { headers: getAuthHeaders() }
      );
      console.log('AI Evaluation triggered:', response.data);
      setSuccess('AI evaluation completed successfully!');
      fetchProposals(); // Refresh to get updated AI scores
    } catch (err) {
      console.error('Error triggering AI evaluation:', err);
      setError('Failed to trigger AI evaluation: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };


  // 2. Vendor performance insights (GET /ai/vendor-insights/:vendorId)
  const getVendorInsights = async (vendorId) => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/ai/vendor-insights/${vendorId}`,
        { headers: getAuthHeaders() }
      );
      return response.data.data.insights;
    } catch (err) {
      console.error('Error fetching vendor insights:', err);
      setError('Failed to fetch vendor insights: ' + (err.response?.data?.message || err.message));
      return null;
    }
  };

  // 3. Market request analysis (POST /ai/market-analysis)
  const analyzeMarketRequest = async (marketRequestId) => {
    try {
      setLoading(true);
      const response = await axios.post(
        'http://localhost:8080/api/ai/market-analysis',
        { marketRequestId },
        { headers: getAuthHeaders() }
      );
      console.log('Market analysis completed:', response.data);
      setSuccess('Market analysis completed!');
      return response.data.data.analysis;
    } catch (err) {
      console.error('Error analyzing market request:', err);
      setError('Failed to analyze market request: ' + (err.response?.data?.message || err.message));
      return null;
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
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Received Proposals</h2>

              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Market Request for AI Analysis:
                  </label>
                  <select
                    value={selectedMarketRequestForAI}
                    onChange={(e) => setSelectedMarketRequestForAI(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a market request...</option>
                    {marketRequests.map((request) => (
                      <option key={request._id} value={request._id}>
                        {request.title} ({request.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={async () => {
                      if (selectedMarketRequestForAI) {
                        console.log('Analyzing market request:', selectedMarketRequestForAI);
                        const analysis = await analyzeMarketRequest(selectedMarketRequestForAI);
                        if (analysis) {
                          setMarketAnalysisData(analysis);
                          setShowMarketAnalysis(true);
                        }
                      } else {
                        setError('Please select a market request first');
                      }
                    }}
                    disabled={!selectedMarketRequestForAI || loading}
                    className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50"
                  >
                    📈 AI Market Analysis
                  </button>
                </div>
              </div>
            </div>

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
                          Vendor: {proposal.vendor?.fullName || 'Unknown'} ({proposal.vendor?.email})
                        </p>
                        <p className="text-sm text-gray-500">
                          Market Request: {proposal.marketRequest?.title}
                        </p>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          proposal.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          proposal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          proposal.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                          proposal.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {proposal.status}
                        </span>

                        {/* AI Evaluation Score */}
                        {proposal.aiEvaluation?.overallScore && (
                          <div className="text-sm">
                            <span className="text-gray-500">AI Score:</span>
                            <span className="font-bold text-purple-600 ml-1">
                              {proposal.aiEvaluation.overallScore.toFixed(1)}/100
                            </span>
                            <span className={`ml-2 px-2 py-1 rounded text-xs ${
                              proposal.aiEvaluation.confidence >= 80 ? 'bg-green-100 text-green-800' :
                              proposal.aiEvaluation.confidence >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {proposal.aiEvaluation.confidence}% confidence
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-500">Quantity:</span>
                        <div className="font-medium">{proposal.quantity}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Unit Price:</span>
                        <div className="font-medium">${proposal.unitPrice}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Price:</span>
                        <div className="font-medium text-green-600 font-bold">${proposal.totalPrice?.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Delivery:</span>
                        <div className="font-medium">{proposal.deliveryTime}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Compliance:</span>
                        <div className="font-medium text-green-600">{proposal.complianceRate}%</div>
                      </div>
                    </div>

                    {/* AI Evaluation Details */}
                    {proposal.aiEvaluation && (
                      <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <h4 className="font-medium text-purple-900 mb-2">🤖 AI Evaluation</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div className="text-sm">
                            <span className="text-purple-700">Cost Score:</span>
                            <span className="font-bold ml-1">{proposal.aiEvaluation.costScore}/100</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-purple-700">Delivery Score:</span>
                            <span className="font-bold ml-1">{proposal.aiEvaluation.deliveryScore}/100</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-purple-700">Compliance Score:</span>
                            <span className="font-bold ml-1">{proposal.aiEvaluation.complianceScore}/100</span>
                          </div>
                        </div>
                        {proposal.aiEvaluation.insights && (
                          <div className="text-sm text-purple-800">
                            <p><strong>Recommendation:</strong> {proposal.aiEvaluation.insights.recommendation}</p>
                            {proposal.aiEvaluation.insights.riskFactors?.length > 0 && (
                              <p><strong>Risk Factors:</strong> {proposal.aiEvaluation.insights.riskFactors.join(', ')}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Additional Services */}
                    {proposal.additionalServices && proposal.additionalServices.length > 0 && (
                      <div className="mb-4">
                        <span className="text-gray-500 text-sm">Additional Services:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {proposal.additionalServices.map((service, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Evaluation Scores */}
                    {proposal.evaluation?.scores && proposal.evaluation.scores.length > 0 && (
                      <div className="mb-4 p-3 bg-gray-50 rounded">
                        <h4 className="font-medium text-gray-900 mb-2">Manual Evaluation Scores</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {proposal.evaluation.scores.map((score, index) => (
                            <div key={index} className="text-sm">
                              <span className="text-gray-600">{score.criterion}:</span>
                              <span className="font-medium ml-1">{score.score}/{score.maxScore}</span>
                            </div>
                          ))}
                        </div>
                        {proposal.evaluation.overallNotes && (
                          <p className="text-sm text-gray-600 mt-2">{proposal.evaluation.overallNotes}</p>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {!proposal.aiEvaluation && (proposal.status === 'submitted' || proposal.status === 'draft') && (
                        <button
                          onClick={() => triggerAIEvaluation(proposal._id)}
                          className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                          🤖 AI Evaluate
                        </button>
                      )}
                      {(proposal.status === 'submitted' || proposal.status === 'draft') && (
                        <>
                          {/* <button
                            onClick={() => {
                              setSelectedProposal(proposal);
                              setShowProposalEvaluation(true);
                            }}
                            className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                          >
                            Manual Evaluate
                          </button> */}
                          <button
                            onClick={() => acceptProposal(proposal._id)}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => rejectProposal(proposal._id)}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {proposal.status === 'accepted' && proposal.marketRequest?._id && (
                        <button
                          onClick={() => awardMarketRequest(proposal.marketRequest._id, proposal._id)}
                          className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                          Award Contract
                        </button>
                      )}
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

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={async () => {
                          const insights = await getVendorInsights(vendor._id);
                          if (insights) {
                            setVendorInsightsData(insights);
                            setShowVendorInsights(true);
                          }
                        }}
                        className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Evaluate Vend Insights with AI
                      </button>
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

                <div className="grid grid-cols-3 gap-4">
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
                    <select
                      value={rfpForm.urgency}
                      onChange={(e) => setRfpForm({...rfpForm, urgency: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specifications (JSON format)
                  </label>
                  <textarea
                    rows={3}
                    placeholder='{"processor": "Intel i7", "ram": "16GB", "storage": "512GB SSD"}'
                    value={typeof rfpForm.specifications === 'object' ? JSON.stringify(rfpForm.specifications, null, 2) : rfpForm.specifications}
                    onChange={(e) => setRfpForm({...rfpForm, specifications: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Justification (Required)
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Explain why this procurement is necessary and how it aligns with business objectives..."
                    value={rfpForm.justification}
                    onChange={(e) => setRfpForm({...rfpForm, justification: e.target.value})}
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

                <div className="grid grid-cols-3 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Budget</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={marketForm.maxBudget}
                      onChange={(e) => setMarketForm({...marketForm, maxBudget: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                    <select
                      value={marketForm.currency}
                      onChange={(e) => setMarketForm({...marketForm, currency: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specifications (JSON format)
                  </label>
                  <textarea
                    rows={3}
                    placeholder='{"processor": "Intel i7", "ram": "16GB", "storage": "512GB SSD"}'
                    value={typeof marketForm.specifications === 'object' ? JSON.stringify(marketForm.specifications, null, 2) : marketForm.specifications}
                    onChange={(e) => setMarketForm({...marketForm, specifications: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link to RFP Request (Optional)
                  </label>
                  <select
                    value={marketForm.rfpRequestId}
                    onChange={(e) => setMarketForm({...marketForm, rfpRequestId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select an approved RFP request...</option>
                    {rfpRequests.filter(rfp => rfp.status === 'approved').map((rfp) => (
                      <option key={rfp._id} value={rfp._id}>
                        {rfp.title} - {formatCurrency(rfp.budgetEstimate)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Delivery Location Section */}
                <div className="border-t pt-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Delivery Location</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                      <input
                        type="text"
                        value={marketForm.deliveryAddress}
                        onChange={(e) => setMarketForm({...marketForm, deliveryAddress: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        value={marketForm.deliveryCity}
                        onChange={(e) => setMarketForm({...marketForm, deliveryCity: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                      <input
                        type="text"
                        value={marketForm.deliveryState}
                        onChange={(e) => setMarketForm({...marketForm, deliveryState: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
                      <input
                        type="text"
                        value={marketForm.deliveryZipCode}
                        onChange={(e) => setMarketForm({...marketForm, deliveryZipCode: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
                      <input
                        type="text"
                        value={marketForm.deliveryContactPerson}
                        onChange={(e) => setMarketForm({...marketForm, deliveryContactPerson: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                      <input
                        type="tel"
                        value={marketForm.deliveryContactPhone}
                        onChange={(e) => setMarketForm({...marketForm, deliveryContactPhone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Requirements (JSON Array)
                  </label>
                  <textarea
                    rows={4}
                    placeholder='[{"title": "Warranty Documentation", "description": "Provide warranty documentation", "isMandatory": true, "weight": 20}]'
                    value={Array.isArray(marketForm.requirements) ? JSON.stringify(marketForm.requirements, null, 2) : marketForm.requirements}
                    onChange={(e) => setMarketForm({...marketForm, requirements: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Evaluation Criteria (Optional - defaults will be used if empty)
                  </label>
                  <textarea
                    rows={4}
                    placeholder='Leave empty for default criteria, or provide custom: [{"criterion": "Price Competitiveness", "description": "Total cost including taxes", "weight": 40, "maxScore": 100}]'
                    value={Array.isArray(marketForm.evaluationCriteria) ? JSON.stringify(marketForm.evaluationCriteria, null, 2) : marketForm.evaluationCriteria}
                    onChange={(e) => setMarketForm({...marketForm, evaluationCriteria: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Default criteria: Price Competitiveness (40%), Technical Specifications (35%), Delivery Timeline (25%)
                  </p>
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


      {/* Market Analysis Modal */}
      {showMarketAnalysis && marketAnalysisData && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">AI Market Analysis</h3>
                <button
                  onClick={() => setShowMarketAnalysis(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Complexity Score</h4>
                  <p className="text-2xl font-bold text-blue-800">{marketAnalysisData.complexityScore}/100</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Expected Price Range</h4>
                  <p className="text-green-800">
                    ${marketAnalysisData.marketInsights?.expectedPriceRange?.min?.toLocaleString()} -
                    ${marketAnalysisData.marketInsights?.expectedPriceRange?.max?.toLocaleString()}
                  </p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-2">Expected Delivery Time</h4>
                  <p className="text-yellow-800">{marketAnalysisData.marketInsights?.expectedDeliveryTime}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Suggested Evaluation Criteria</h4>
                  <div className="space-y-3">
                    {marketAnalysisData.suggestedCriteria?.map((criteria, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-gray-900">{criteria.criterion}</h5>
                          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Weight: {criteria.suggestedWeight}%
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{criteria.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {marketAnalysisData.marketInsights?.riskFactors && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-900 mb-2">Risk Factors</h4>
                    <ul className="list-disc list-inside text-red-800 space-y-1">
                      {marketAnalysisData.marketInsights.riskFactors.map((risk, index) => (
                        <li key={index}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowMarketAnalysis(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vendor Insights Modal */}
      {showVendorInsights && vendorInsightsData && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">AI Vendor Insights</h3>
                <button
                  onClick={() => setShowVendorInsights(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Performance Score</h4>
                    <p className="text-2xl font-bold text-blue-800">{vendorInsightsData.performanceScore}/100</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Delivery Reliability</h4>
                    <p className="text-2xl font-bold text-green-800">{vendorInsightsData.deliveryReliability}/100</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-yellow-900 mb-2">Cost Competitiveness</h4>
                    <p className="text-2xl font-bold text-yellow-800">{vendorInsightsData.costCompetitiveness}/100</p>
                  </div>
                  <div className={`p-4 rounded-lg ${
                    vendorInsightsData.riskLevel === 'low' ? 'bg-green-50' :
                    vendorInsightsData.riskLevel === 'medium' ? 'bg-yellow-50' : 'bg-red-50'
                  }`}>
                    <h4 className={`font-semibold mb-2 ${
                      vendorInsightsData.riskLevel === 'low' ? 'text-green-900' :
                      vendorInsightsData.riskLevel === 'medium' ? 'text-yellow-900' : 'text-red-900'
                    }`}>Risk Level</h4>
                    <p className={`text-lg font-bold uppercase ${
                      vendorInsightsData.riskLevel === 'low' ? 'text-green-800' :
                      vendorInsightsData.riskLevel === 'medium' ? 'text-yellow-800' : 'text-red-800'
                    }`}>{vendorInsightsData.riskLevel}</p>
                  </div>
                </div>

                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-indigo-900 mb-3">AI Predictions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-indigo-700">Expected Delivery Accuracy:</span>
                      <div className="text-lg font-semibold text-indigo-800">
                        {vendorInsightsData.predictions?.expectedDeliveryAccuracy}%
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-indigo-700">Price Competitiveness:</span>
                      <div className="text-lg font-semibold text-indigo-800 capitalize">
                        {vendorInsightsData.predictions?.priceCompetitiveness}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">AI Recommendations</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    {vendorInsightsData.recommendations?.map((recommendation, index) => (
                      <li key={index}>{recommendation}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowVendorInsights(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationPage;