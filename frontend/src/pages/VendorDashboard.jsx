import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { proposalAPI, marketRequestAPI, vendorAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import {
  Search,
  TrendingUp,
  DollarSign,
  Clock,
  FileText,
  Award,
  Eye,
  Plus,
  Calendar,
  Users,
  Building,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Target,
  BarChart3
} from 'lucide-react';

const VendorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch vendor dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['vendor-dashboard'],
    queryFn: () => vendorAPI.getDashboard(),
    enabled: !!user && user?.userType === 'vendor',
  });

  // Fetch vendor's proposals
  const { data: proposalsData, isLoading: proposalsLoading } = useQuery({
    queryKey: ['vendor-proposals'],
    queryFn: () => vendorAPI.getProposals(),
    enabled: !!user && user?.userType === 'vendor',
  });

  // Fetch available market requests
  const { data: marketRequestsData, isLoading: marketRequestsLoading } = useQuery({
    queryKey: ['vendor-market-requests', searchTerm],
    queryFn: () => marketRequestAPI.getAll({
      page: 1,
      limit: 10,
      status: 'open',
      sortBy: 'deadline',
      sortOrder: 'asc',
      ...(searchTerm && { search: searchTerm })
    }),
    enabled: !!user && user?.userType === 'vendor',
  });

  const proposals = Array.isArray(proposalsData?.data?.data) ? proposalsData.data.data : [];
  const marketRequests = Array.isArray(marketRequestsData?.data?.requests) ? marketRequestsData.data.requests : [];
  const dashboard = dashboardData?.data || {};

  // Use dashboard data if available, otherwise calculate from proposals
  const stats = dashboard.stats || {
    totalProposals: proposals.length,
    activeProposals: proposals.filter(p => ['submitted', 'under_review'].includes(p.status)).length,
    wonProposals: proposals.filter(p => p.status === 'accepted').length,
    winRate: proposals.length > 0 ? Math.round((proposals.filter(p => p.status === 'accepted').length / proposals.length) * 100) : 0,
    totalValue: proposals.reduce((sum, p) => sum + (p.totalPrice || 0), 0),
    avgBidAmount: proposals.length > 0 ? proposals.reduce((sum, p) => sum + (p.totalPrice || 0), 0) / proposals.length : 0
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'No date';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'under_review':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysLeft = (deadline) => {
    if (!deadline) return null;
    const today = new Date();
    const endDate = new Date(deadline);
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'proposals', label: 'My Proposals', icon: FileText },
    { id: 'opportunities', label: 'New Market Requests', icon: Target },
  ];

  if (!user || user?.userType !== 'vendor') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">This dashboard is only available for vendors.</p>
            <Button onClick={() => navigate('/register/vendor')}>
              Register as Vendor
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Vendor Dashboard
              </h1>
              <p className="mt-1 text-gray-600">
                Welcome back, {user?.firstName}! Manage your proposals and find new opportunities.
              </p>
            </div>
            <div className="mt-4 lg:mt-0">
              <Button onClick={() => navigate('/opportunities')}>
                <Search className="h-4 w-4 mr-2" />
                Browse Market Requests
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Proposals</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProposals}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Bids</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeProposals}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Win Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.winRate}%</p>
                </div>
                <Award className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Proposals</CardTitle>
                  <CardDescription>Your latest proposal submissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {proposalsLoading ? (
                      <p>Loading proposals...</p>
                    ) : proposals.slice(0, 5).length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No proposals yet</p>
                        <Button
                          className="mt-4"
                          onClick={() => navigate('/opportunities')}
                        >
                          Find Market Requests
                        </Button>
                      </div>
                    ) : (
                      proposals.slice(0, 5).map((proposal) => (
                        <div key={proposal._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{proposal.proposedItem}</h4>
                            <p className="text-sm text-gray-600">{formatCurrency(proposal.totalPrice)}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                              {proposal.status}
                            </span>
                            {getStatusIcon(proposal.status)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {proposals.length > 5 && (
                    <div className="mt-4 pt-4 border-t">
                      <Button variant="outline" onClick={() => setActiveTab('proposals')}>
                        View All Proposals
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Win Rate</span>
                        <span className="font-medium">{stats.winRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${Math.min(stats.winRate, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Avg Bid Amount</span>
                        <span className="font-medium">{formatCurrency(stats.avgBidAmount)}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Contracts Won</span>
                        <span className="font-medium">{stats.wonProposals}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button className="w-full" onClick={() => navigate('/opportunities')}>
                      <Search className="h-4 w-4 mr-2" />
                      Find New Market Requests
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => setActiveTab('proposals')}>
                      <FileText className="h-4 w-4 mr-2" />
                      View My Proposals
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => navigate('/profile')}>
                      <Users className="h-4 w-4 mr-2" />
                      Update Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'proposals' && (
          <Card>
            <CardHeader>
              <CardTitle>My Proposals</CardTitle>
              <CardDescription>Track all your submitted proposals</CardDescription>
            </CardHeader>
            <CardContent>
              {proposalsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading proposals...</p>
                </div>
              ) : proposals.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No Proposals Yet</h3>
                  <p className="text-gray-600 mb-6">Start by browsing market requests and submitting your first proposal.</p>
                  <Button onClick={() => navigate('/opportunities')}>
                    <Search className="h-4 w-4 mr-2" />
                    Browse Market Requests
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {proposals.map((proposal) => (
                    <div key={proposal._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {proposal.proposedItem}
                          </h3>
                          <p className="text-gray-600 mb-4 line-clamp-2">
                            {proposal.description}
                          </p>
                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-4 w-4" />
                              <span>{formatCurrency(proposal.totalPrice)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>Submitted {formatDate(proposal.createdAt)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>Delivery: {proposal.deliveryTime}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(proposal.status)}`}>
                            {proposal.status}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/proposals/${proposal._id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'opportunities' && (
          <div>
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      placeholder="Search opportunities..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={() => navigate('/opportunities')}>
                    View All
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {marketRequestsLoading ? (
                <div className="col-span-2 text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading market requests...</p>
                </div>
              ) : marketRequests.length === 0 ? (
                <div className="col-span-2 text-center py-12">
                  <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No Market Requests Found</h3>
                  <p className="text-gray-600 mb-6">Try adjusting your search or check back later for new requests.</p>
                  <Button onClick={() => navigate('/opportunities')}>
                    Browse All Market Requests
                  </Button>
                </div>
              ) : (
                marketRequests.map((request) => (
                  <Card key={request._id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                          {request.title}
                        </h3>
                        <Badge variant="outline">
                          {request.category || 'General'}
                        </Badge>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {request.description}
                      </p>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-medium">{formatCurrency(request.maxBudget)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span>Qty: {request.quantity}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <Building className="h-4 w-4 text-gray-400" />
                            <span>{request.createdBy?.firstName} {request.createdBy?.lastName}</span>
                          </div>
                          {request.deadline && (
                            <div className="flex items-center space-x-1 text-orange-600">
                              <Clock className="h-4 w-4" />
                              <span className="font-medium">
                                Deadline: {formatDate(request.deadline)}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span>{request.proposals?.length || 0} proposals</span>
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
                          onClick={() => navigate(`/proposals/create?marketRequest=${request._id}`)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Submit Proposal
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDashboard;