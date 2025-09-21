import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
  MapPin,
  Clock,
  Users,
  ArrowRight,
  Star,
  TrendingUp,
  FileText,
  Eye,
  Grid,
  List,
  SortAsc,
  ChevronDown
} from 'lucide-react';

const MarketplaceBrowse = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [budgetRange, setBudgetRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const search = searchParams.get('search');
    if (search) {
      setSearchTerm(search);
    }
  }, [searchParams]);

  // Fetch public marketplace opportunities (only approved/published requirements)
  const {
    data: opportunitiesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['marketplace-opportunities', { search: searchTerm, category: categoryFilter, sortBy }],
    queryFn: () => marketRequestAPI.getAll({
      search: searchTerm,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      status: 'published', // Only show published opportunities
      sortBy,
      public: true, // Public marketplace view
    }),
  });

  const opportunities = Array.isArray(opportunitiesData?.data?.data) ? opportunitiesData.data.data : [];

  const formatCurrency = (amount) => {
    if (!amount) return 'Budget TBD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
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

  const getDaysLeft = (deadline) => {
    if (!deadline) return null;
    const today = new Date();
    const endDate = new Date(deadline);
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleSubmitProposal = (opportunityId) => {
    if (!user) {
      // Redirect to login/register with return path
      navigate(`/login?redirect=/marketplace/${opportunityId}/propose`);
      return;
    }

    if (user.userType !== 'vendor') {
      alert('Only vendors can submit proposals. Please register as a vendor.');
      navigate('/register/vendor');
      return;
    }

    navigate(`/proposals/create?marketRequest=${opportunityId}`);
  };

  // Calculate marketplace stats
  const stats = {
    totalOpportunities: opportunities.length || 0,
    totalValue: opportunities.reduce((sum, opp) => sum + (opp.budget || 0), 0) || 0,
    avgDeadline: opportunities.length > 0 ?
      Math.round(opportunities.reduce((sum, opp) => {
        const days = getDaysLeft(opp.deadline);
        return sum + (days || 0);
      }, 0) / opportunities.length) : 0,
    activeVendors: new Set(opportunities.flatMap(opp => opp.proposals?.map(p => p.vendorId) || [])).size || 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Browse Opportunities
              </h1>
              <p className="mt-1 text-gray-600">
                Discover procurement opportunities from verified buyers
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

              {user && user.userType === 'vendor' && (
                <Button onClick={() => navigate('/vendor/dashboard')}>
                  My Dashboard
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Marketplace Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.totalOpportunities}</p>
              <p className="text-sm text-gray-600">Active Opportunities</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
              <p className="text-sm text-gray-600">Total Value</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.avgDeadline}</p>
              <p className="text-sm text-gray-600">Avg Days Left</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.activeVendors}</p>
              <p className="text-sm text-gray-600">Active Vendors</p>
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
                    placeholder="Search opportunities by title, description, or keywords..."
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
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="all">All Categories</option>
                        <option value="IT">Information Technology</option>
                        <option value="Construction">Construction</option>
                        <option value="Consulting">Consulting</option>
                        <option value="Equipment">Equipment</option>
                        <option value="Services">Professional Services</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="newest">Newest First</option>
                        <option value="deadline">Deadline Soon</option>
                        <option value="budget-high">Highest Budget</option>
                        <option value="budget-low">Lowest Budget</option>
                        <option value="relevance">Most Relevant</option>
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
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Opportunities Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading opportunities...</p>
          </div>
        ) : opportunities.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Opportunities Found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || categoryFilter !== 'all'
                  ? 'Try adjusting your search criteria.'
                  : 'New opportunities will appear here when they are published.'}
              </p>
              {user && user.userType !== 'vendor' && (
                <Button onClick={() => navigate('/requirements/create')}>
                  Post a Requirement
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}`}>
            {opportunities.map((opportunity) => (
              <Card key={opportunity._id} className={`hover:shadow-lg transition-shadow cursor-pointer ${viewMode === 'list' ? 'p-0' : ''}`}>
                <CardContent className={`${viewMode === 'grid' ? 'p-6' : 'p-0'}`}>
                  {viewMode === 'grid' ? (
                    // Grid View (existing design)
                    <>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                            {opportunity.title}
                          </h3>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                            {opportunity.description}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-medium">{formatCurrency(opportunity.budget)}</span>
                          </div>
                          <Badge variant="outline">
                            {opportunity.category || 'General'}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <Building className="h-4 w-4 text-gray-400" />
                            <span>{opportunity.createdBy?.firstName} {opportunity.createdBy?.lastName}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span>{opportunity.proposals?.length || 0} proposals</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>Deadline: {formatDate(opportunity.deadline)}</span>
                          </div>
                          {opportunity.deadline && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4 text-orange-500" />
                              <span className="text-orange-600 font-medium">
                                {getDaysLeft(opportunity.deadline)} days left
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => navigate(`/marketplace/opportunity/${opportunity._id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleSubmitProposal(opportunity._id)}
                        >
                          <ArrowRight className="h-4 w-4 mr-1" />
                          Submit Proposal
                        </Button>
                      </div>
                    </>
                  ) : (
                    // List View (compact horizontal layout)
                    <div className="flex items-center justify-between p-6 hover:bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 mr-4">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {opportunity.title}
                            </h3>
                            <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                              {opportunity.description}
                            </p>
                            <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Building className="h-4 w-4" />
                                <span>{opportunity.createdBy?.firstName} {opportunity.createdBy?.lastName}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Users className="h-4 w-4" />
                                <span>{opportunity.proposals?.length || 0} proposals</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(opportunity.deadline)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <Badge variant="outline">
                              {opportunity.category || 'General'}
                            </Badge>
                            <div className="text-lg font-semibold text-green-600">
                              {formatCurrency(opportunity.budget)}
                            </div>
                            {opportunity.deadline && (
                              <div className="flex items-center space-x-1 text-orange-600">
                                <Clock className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                  {getDaysLeft(opportunity.deadline)} days left
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/marketplace/opportunity/${opportunity._id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSubmitProposal(opportunity._id)}
                        >
                          Bid Now
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Call to Action for Non-Vendors */}
        {(!user || user.userType !== 'vendor') && opportunities.length > 0 && (
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

export default MarketplaceBrowse;