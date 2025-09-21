import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { marketRequestAPI, proposalAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import {
  Plus,
  TrendingUp,
  DollarSign,
  Clock,
  FileText,
  Users,
  Eye,
  Search,
  Calendar,
  Building,
  AlertCircle,
  CheckCircle,
  XCircle,
  Award,
  BarChart3,
  Target,
  Briefcase
} from 'lucide-react';

const BuyerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch buyer's market requests
  const { data: marketRequestsData, isLoading: marketRequestsLoading } = useQuery({
    queryKey: ['buyer-market-requests'],
    queryFn: () => marketRequestAPI.getAll(),
    enabled: !!user && (user.role === 'procurement_officer' || user.role === 'manager' || user.role === 'admin'),
  });

  // Fetch proposals for buyer's requests
  const { data: proposalsData, isLoading: proposalsLoading } = useQuery({
    queryKey: ['buyer-proposals'],
    queryFn: () => proposalAPI.getAll(),
    enabled: !!user && (user.role === 'procurement_officer' || user.role === 'manager' || user.role === 'admin'),
  });

  const marketRequests = Array.isArray(marketRequestsData?.data?.data) ? marketRequestsData.data.data : [];
  const proposals = Array.isArray(proposalsData?.data?.data) ? proposalsData.data.data : [];

  // Calculate stats
  const stats = {
    totalRequests: marketRequests.length,
    activeRequests: marketRequests.filter(r => r.status === 'published' || r.status === 'open').length,
    totalProposals: proposals.length,
    avgProposalsPerRequest: marketRequests.length > 0 ? Math.round(proposals.length / marketRequests.length) : 0,
    totalValue: marketRequests.reduce((sum, r) => sum + (r.budget || 0), 0),
    completedRequests: marketRequests.filter(r => r.status === 'closed' || r.status === 'awarded').length
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
      case 'draft':
        return <FileText className="h-4 w-4 text-gray-500" />;
      case 'published':
      case 'open':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'closed':
      case 'awarded':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'published':
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
      case 'awarded':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
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
    { id: 'requests', label: 'My Requests', icon: Briefcase },
    { id: 'proposals', label: 'Received Proposals', icon: FileText },
  ];

  if (!user || !['procurement_officer', 'manager', 'admin'].includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">This dashboard is only available for buyers and procurement officers.</p>
            <Button onClick={() => navigate('/register')}>
              Register as Buyer
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
                Buyer Dashboard
              </h1>
              <p className="mt-1 text-gray-600">
                Welcome back, {user?.firstName}! Manage your procurement requests and vendor proposals.
              </p>
            </div>
            <div className="mt-4 lg:mt-0">
              <Button onClick={() => navigate('/market-requests/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Request
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
                  <p className="text-sm font-medium text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
                </div>
                <Briefcase className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeRequests}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Proposals</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProposals}</p>
                </div>
                <FileText className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Budget</p>
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
                  <CardTitle>Recent Requests</CardTitle>
                  <CardDescription>Your latest procurement requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {marketRequestsLoading ? (
                      <p>Loading requests...</p>
                    ) : marketRequests.slice(0, 5).length === 0 ? (
                      <div className="text-center py-8">
                        <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No requests yet</p>
                        <Button
                          className="mt-4"
                          onClick={() => navigate('/market-requests/create')}
                        >
                          Create Your First Request
                        </Button>
                      </div>
                    ) : (
                      marketRequests.slice(0, 5).map((request) => (
                        <div key={request._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{request.title}</h4>
                            <p className="text-sm text-gray-600">{formatCurrency(request.budget)}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                              {request.status}
                            </span>
                            <span className="text-sm text-gray-500">
                              {request.proposals?.length || 0} proposals
                            </span>
                            {getStatusIcon(request.status)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {marketRequests.length > 5 && (
                    <div className="mt-4 pt-4 border-t">
                      <Button variant="outline" onClick={() => setActiveTab('requests')}>
                        View All Requests
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
                        <span>Completion Rate</span>
                        <span className="font-medium">
                          {stats.totalRequests > 0 ? Math.round((stats.completedRequests / stats.totalRequests) * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${stats.totalRequests > 0 ? Math.min((stats.completedRequests / stats.totalRequests) * 100, 100) : 0}%`
                          }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Avg Proposals per Request</span>
                        <span className="font-medium">{stats.avgProposalsPerRequest}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Active Requests</span>
                        <span className="font-medium">{stats.activeRequests}</span>
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
                    <Button className="w-full" onClick={() => navigate('/market-requests/create')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Request
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => setActiveTab('requests')}>
                      <Briefcase className="h-4 w-4 mr-2" />
                      View My Requests
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => navigate('/marketplace/vendors')}>
                      <Users className="h-4 w-4 mr-2" />
                      Browse Vendors
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => navigate('/analytics')}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <Card>
            <CardHeader>
              <CardTitle>My Procurement Requests</CardTitle>
              <CardDescription>Manage all your procurement requests</CardDescription>
            </CardHeader>
            <CardContent>
              {marketRequestsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading requests...</p>
                </div>
              ) : marketRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No Requests Yet</h3>
                  <p className="text-gray-600 mb-6">Create your first procurement request to start receiving proposals from vendors.</p>
                  <Button onClick={() => navigate('/market-requests/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Request
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {marketRequests.map((request) => (
                    <div key={request._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {request.title}
                          </h3>
                          <p className="text-gray-600 mb-4 line-clamp-2">
                            {request.description}
                          </p>
                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-4 w-4" />
                              <span>{formatCurrency(request.budget)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>Created {formatDate(request.createdAt)}</span>
                            </div>
                            {request.deadline && (
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>Deadline: {formatDate(request.deadline)}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <Users className="h-4 w-4" />
                              <span>{request.proposals?.length || 0} proposals</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/market-requests/${request._id}`)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {(request.proposals?.length || 0) > 0 && (
                              <Button
                                size="sm"
                                onClick={() => navigate(`/proposals/compare/${request._id}`)}
                              >
                                <Award className="h-4 w-4 mr-1" />
                                Compare Proposals
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'proposals' && (
          <div>
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      placeholder="Search proposals..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={() => navigate('/proposals')}>
                    View All
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {proposalsLoading ? (
                <div className="col-span-2 text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading proposals...</p>
                </div>
              ) : proposals.length === 0 ? (
                <div className="col-span-2 text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No Proposals Yet</h3>
                  <p className="text-gray-600 mb-6">Once you create procurement requests, vendor proposals will appear here.</p>
                  <Button onClick={() => navigate('/market-requests/create')}>
                    Create Your First Request
                  </Button>
                </div>
              ) : (
                proposals.slice(0, 10).map((proposal) => (
                  <Card key={proposal._id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                          {proposal.proposedItem}
                        </h3>
                        <Badge variant="outline">
                          {proposal.status}
                        </Badge>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {proposal.description}
                      </p>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-medium">{formatCurrency(proposal.totalPrice)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Building className="h-4 w-4 text-gray-400" />
                            <span>{proposal.vendor?.firstName} {proposal.vendor?.lastName}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>Delivery: {proposal.deliveryTime}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>Submitted {formatDate(proposal.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => navigate(`/proposals/${proposal._id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                        {proposal.aiEvaluation && (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => navigate(`/proposals/${proposal._id}#ai-evaluation`)}
                          >
                            <Award className="h-4 w-4 mr-1" />
                            AI Score: {proposal.aiEvaluation.overallScore}%
                          </Button>
                        )}
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

export default BuyerDashboard;