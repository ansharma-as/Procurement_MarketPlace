import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { marketRequestAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import {
  Search,
  Filter,
  Calendar,
  DollarSign,
  Building,
  Clock,
  Users,
  ArrowRight,
  FileText,
  Eye,
  Grid,
  List,
  ChevronDown,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

const OpportunitiesBrowse = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid');
  const [budgetRange, setBudgetRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const search = searchParams.get('search');
    if (search) {
      setSearchTerm(search);
    }
  }, [searchParams]);

  // Fetch market requests
  const {
    data: marketRequestsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['market-requests', {
      search: searchTerm,
      category: categoryFilter,
      urgency: urgencyFilter,
      sortBy,
      sortOrder,
      page: currentPage,
      budgetMin: budgetRange.min,
      budgetMax: budgetRange.max
    }],
    queryFn: () => marketRequestAPI.getAll({
      page: currentPage,
      limit: 10,
      status: 'open',
      sortBy: 'deadline',
      sortOrder: 'asc',
      ...(searchTerm && { search: searchTerm }),
      ...(categoryFilter !== 'all' && { category: categoryFilter }),
      ...(urgencyFilter !== 'all' && { urgency: urgencyFilter }),
      ...(budgetRange.min && { budgetMin: budgetRange.min }),
      ...(budgetRange.max && { budgetMax: budgetRange.max })
    }),
  });

  const marketRequests = Array.isArray(marketRequestsData?.data?.requests) ? marketRequestsData.data.requests : [];
  const totalPages = marketRequestsData?.data?.pagination?.pages || 1;
  const totalCount = marketRequestsData?.data?.pagination?.total || 0;

  console.log('Market Requests:', marketRequests);

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
    if (!date) return 'No deadline';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <TrendingUp className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleSubmitProposal = (marketRequestId) => {
    if (!user) {
      navigate(`/login?redirect=/opportunities/${marketRequestId}/propose`);
      return;
    }

    if (user?.userType !== 'vendor') {
      alert('Only vendors can submit proposals. Please register as a vendor.');
      navigate('/register/vendor');
      return;
    }

    navigate(`/proposals/create?marketRequest=${marketRequestId}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setUrgencyFilter('all');
    setBudgetRange({ min: '', max: '' });
    setCurrentPage(1);
    setSearchParams({});
  };

  // Calculate stats
  const stats = {
    totalRequests: totalCount,
    avgBudget: marketRequests.length > 0 ?
      marketRequests.reduce((sum, req) => sum + (req.maxBudget || 0), 0) / marketRequests.length : 0,
    urgentCount: marketRequests.filter(req => req.urgency === 'urgent' || req.urgency === 'high').length,
    categories: new Set(marketRequests.map(req => req.category).filter(Boolean)).size
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Browse Market Requests
              </h1>
              <p className="mt-1 text-gray-600">
                {totalCount} market requests available from verified organizations
              </p>
            </div>

            <div className="mt-4 lg:mt-0 flex items-center space-x-4">
              {!user && (
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => navigate('/login')}>
                    Sign In
                  </Button>
                  <Button onClick={() => navigate('/register/vendor')}>
                    Join as Vendor
                  </Button>
                </div>
              )}

              {user && user?.userType === 'vendor' && (
                <Button onClick={() => navigate('/app/vendor/dashboard')}>
                  My Dashboard
                </Button>
              )}

              {user && user?.userType !== 'vendor' && (
                <Button onClick={() => navigate('/app/market-requests/create')}>
                  Create Market Request
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
              <p className="text-sm text-gray-600">Total Requests</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.avgBudget)}</p>
              <p className="text-sm text-gray-600">Avg Budget</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.urgentCount}</p>
              <p className="text-sm text-gray-600">High Priority</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Building className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.categories}</p>
              <p className="text-sm text-gray-600">Categories</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4">
              {/* Main Search Bar */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Search market requests by title, description, or organization..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 text-lg"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-12 px-4"
                >
                  <Filter className="h-5 w-5 mr-2" />
                  Filters
                  <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </Button>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                  >
                    <Grid className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                  >
                    <List className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Filter Panel */}
              {showFilters && (
                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="all">All Categories</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Software">Software</option>
                        <option value="Hardware">Hardware</option>
                        <option value="Services">Services</option>
                        <option value="Equipment">Equipment</option>
                        <option value="Construction">Construction</option>
                        <option value="Consulting">Consulting</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
                      <select
                        value={urgencyFilter}
                        onChange={(e) => setUrgencyFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="all">All Urgency</option>
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                      <select
                        value={`${sortBy}-${sortOrder}`}
                        onChange={(e) => {
                          const [field, order] = e.target.value.split('-');
                          setSortBy(field);
                          setSortOrder(order);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="createdAt-desc">Newest First</option>
                        <option value="createdAt-asc">Oldest First</option>
                        <option value="expectedDeliveryDate-asc">Deadline Soon</option>
                        <option value="budgetEstimate-desc">Highest Budget</option>
                        <option value="budgetEstimate-asc">Lowest Budget</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Min Budget</label>
                      <Input
                        type="number"
                        placeholder="Min amount"
                        value={budgetRange.min}
                        onChange={(e) => setBudgetRange(prev => ({ ...prev, min: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Budget</label>
                      <Input
                        type="number"
                        placeholder="Max amount"
                        value={budgetRange.max}
                        onChange={(e) => setBudgetRange(prev => ({ ...prev, max: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" onClick={clearFilters}>
                      Clear All Filters
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Market Requests Grid/List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading market requests...</p>
          </div>
        ) : marketRequests.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Market Requests Found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || categoryFilter !== 'all'
                  ? 'Try adjusting your search criteria.'
                  : 'New market requests will appear here when organizations post them.'}
              </p>
              {searchTerm || categoryFilter !== 'all' ? (
                <Button onClick={clearFilters}>
                  Clear Filters
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'} mb-8`}>
              {marketRequests.map((request) => (
                <Card key={request._id} className={`hover:shadow-lg transition-shadow cursor-pointer ${viewMode === 'list' ? 'p-0' : ''}`}>
                  <CardContent className={`${viewMode === 'grid' ? 'p-6' : 'p-0'}`}>
                    {viewMode === 'grid' ? (
                      // Grid View
                      <>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                                {request.title}
                              </h3>
                              {getUrgencyIcon(request.urgency)}
                            </div>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                              {request.description}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-sm">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="font-medium">{formatCurrency(request.maxBudget)}</span>
                            </div>
                            <Badge variant="outline">
                              {request.status || 'Open'}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <Building className="h-4 w-4 text-gray-400" />
                              <span>{request.createdBy?.firstName} {request.createdBy?.lastName}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span>Qty: {request.quantity}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span>Deadline: {formatDate(request.deadline)}</span>
                            </div>
                            <div className="text-gray-500">
                              {request.proposals?.length || 0} proposals
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => navigate(`/opportunities/${request._id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handleSubmitProposal(request._id)}
                          >
                            <ArrowRight className="h-4 w-4 mr-1" />
                            Submit Proposal
                          </Button>
                        </div>
                      </>
                    ) : (
                      // List View
                      <div className="flex items-center justify-between p-6 hover:bg-gray-50">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0 mr-4">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold text-gray-900 truncate">
                                  {request.title}
                                </h3>
                                {getUrgencyIcon(request.urgency)}
                              </div>
                              <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                {request.description}
                              </p>
                              <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Building className="h-4 w-4" />
                                  <span>{request.createdBy?.firstName} {request.createdBy?.lastName}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Users className="h-4 w-4" />
                                  <span>Qty: {request.quantity}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{formatDate(request.deadline)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              <Badge variant="outline">
                                {request.status || 'Open'}
                              </Badge>
                              <div className="text-lg font-semibold text-green-600">
                                {formatCurrency(request.maxBudget)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.proposals?.length || 0} proposals
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/opportunities/${request._id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSubmitProposal(request._id)}
                          >
                            Submit Proposal
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {(currentPage - 1) * 12 + 1} to {Math.min(currentPage * 12, totalCount)} of {totalCount} results
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                    if (pageNum > totalPages) return null;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Call to Action for Non-Vendors */}
        {(!user || user?.userType !== 'vendor') && marketRequests.length > 0 && (
          <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-8 text-center">
              <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Ready to Start Winning Contracts?
              </h3>
              <p className="text-gray-600 mb-6">
                Join our marketplace as a vendor and start submitting proposals to grow your business.
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => navigate('/register/vendor')}>
                  Register as Vendor
                </Button>
                <Button variant="outline" onClick={() => navigate('/login')}>
                  Login
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OpportunitiesBrowse;