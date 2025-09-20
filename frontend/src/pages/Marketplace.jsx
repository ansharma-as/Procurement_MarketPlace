import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Eye
} from 'lucide-react';

const Marketplace = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

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
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Procurement Marketplace
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Discover opportunities, submit proposals, win contracts
            </p>

            {!user && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white text-blue-600 hover:bg-gray-100"
                  onClick={() => navigate('/register/vendor')}
                >
                  Join as Vendor
                </Button>
                <Button
                  size="lg"
                  className="bg-blue-700 hover:bg-blue-800"
                  onClick={() => navigate('/login')}
                >
                  Employee Login
                </Button>
              </div>
            )}

            {user && user.userType === 'vendor' && (
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => navigate('/proposals')}
              >
                View My Proposals
              </Button>
            )}
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
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search opportunities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 text-lg"
                />
              </div>
              <div className="flex gap-4">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="newest">Newest First</option>
                  <option value="deadline">Deadline Soon</option>
                  <option value="budget-high">Highest Budget</option>
                  <option value="budget-low">Lowest Budget</option>
                </select>
              </div>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {opportunities.map((opportunity) => (
              <Card key={opportunity._id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
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

                  {/* Key Details */}
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

                  {/* Requirements Preview */}
                  {opportunity.requirements && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Requirements:</p>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {opportunity.requirements}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/marketplace/${opportunity._id}`)}
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

export default Marketplace;