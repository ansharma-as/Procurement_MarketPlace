import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { proposalAPI } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Building,
  Eye,
  Edit,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp
} from 'lucide-react';

const ProposalList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('submittedAt');

  const {
    data: proposalsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['proposals', { search: searchTerm, status: statusFilter, sortBy }],
    queryFn: () => proposalAPI.getAll({
      search: searchTerm,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      sortBy,
      populate: 'marketRequest,vendor'
    }),
  });

  const proposals = Array.isArray(proposalsData?.data?.data) ? proposalsData.data.data : [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'awarded':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'withdrawn':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'awarded':
        return <Award className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'submitted':
        return <CheckCircle className="h-4 w-4" />;
      case 'under_review':
        return <Clock className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const canCreateProposal = user?.userType === 'vendor';
  const canViewAll = user?.role === 'admin' || user?.role === 'procurement_officer';

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate stats
  const stats = {
    total: proposals.length || 0,
    submitted: proposals.filter(q => q.status === 'submitted').length || 0,
    awarded: proposals.filter(q => q.status === 'awarded').length || 0,
    totalValue: proposals.reduce((sum, q) => sum + (q.proposedBudget || q.totalValue || 0), 0) || 0,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              {user?.userType === 'vendor' ? 'My Proposals' : 'Proposals'}
            </h1>
            <p className="mt-2 text-gray-600">
              {user?.userType === 'vendor'
                ? 'Manage your submitted proposals and responses'
                : 'Review and manage vendor proposals'}
            </p>
          </div>

          {canCreateProposal && (
            <Link to="/proposals/create">
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Create Proposal</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Proposals</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Submitted</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.submitted}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Awarded</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.awarded}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search proposals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="awarded">Awarded</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="submittedAt">Submission Date</option>
                <option value="totalValue">Total Value</option>
                <option value="marketRequestTitle">Market Request Title</option>
                <option value="status">Status</option>
              </select>

              {/* Advanced Filters */}
              <Button variant="outline" className="flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <span>More Filters</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              Failed to load proposals. Please try again later.
            </AlertDescription>
          </Alert>
        )}

        {/* Quotations List */}
        {proposals.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search criteria.'
                  : user?.userType === 'vendor'
                    ? 'Start by responding to a market request to create your first proposal.'
                    : 'Proposals will appear here once vendors submit them.'}
              </p>
              {canCreateProposal && (
                <div className="space-y-4">
                  <Link to="/proposals/create">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Proposal
                    </Button>
                  </Link>
                  <div className="text-sm text-gray-500">
                    or <Link to="/market-requests" className="text-blue-600 hover:text-blue-500">browse available market requests</Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <Card key={proposal._id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(proposal.status)}
                          <h3 className="text-lg font-medium text-gray-900">
                            {proposal.marketRequest?.title || 'Market Request Title'}
                          </h3>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(proposal.status)}`}>
                          {proposal.status.replace('_', ' ').charAt(0).toUpperCase() + proposal.status.replace('_', ' ').slice(1)}
                        </span>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Total Value</p>
                            <p className="font-medium">
                              {formatCurrency(proposal.proposedBudget || proposal.totalValue || 0)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">
                              {user?.userType === 'vendor' ? 'Client' : 'Vendor'}
                            </p>
                            <p className="font-medium">
                              {user?.userType === 'vendor'
                                ? proposal.marketRequest?.createdBy?.firstName + ' ' + (proposal.marketRequest?.createdBy?.lastName || '')
                                : proposal.vendor?.name || proposal.vendorName || 'Unknown Vendor'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Submitted</p>
                            <p className="font-medium">
                              {proposal.submittedAt ? formatDate(proposal.submittedAt) : 'Draft'}
                            </p>
                          </div>
                        </div>

                        {proposal.aiAnalysis?.confidenceScore && (
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-600">AI Score</p>
                              <p className="font-medium">
                                {proposal.aiAnalysis.confidenceScore}%
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Key Highlights */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {proposal.paymentTerms && (
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                            Payment: {proposal.paymentTerms}
                          </span>
                        )}
                        {proposal.deliveryTimeline && (
                          <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                            Delivery: {proposal.deliveryTimeline}
                          </span>
                        )}
                        {proposal.technicalApproach && (
                          <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">
                            Technical Approach Included
                          </span>
                        )}
                      </div>

                      {/* Risk Assessment (for procurement officers) */}
                      {proposal.aiAnalysis?.riskAssessment && canViewAll && (
                        <div className="flex items-center space-x-4 text-sm mb-4">
                          <div className={`px-2 py-1 rounded-full ${
                            proposal.aiAnalysis.riskAssessment.overallRisk === 'low' ? 'bg-green-100 text-green-800' :
                            proposal.aiAnalysis.riskAssessment.overallRisk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            Risk: {proposal.aiAnalysis.riskAssessment.overallRisk}
                          </div>
                          <div className={`px-2 py-1 rounded-full ${
                            proposal.aiAnalysis.priceAnalysis?.competitiveness === 'very_competitive' ? 'bg-green-100 text-green-800' :
                            proposal.aiAnalysis.priceAnalysis?.competitiveness === 'competitive' ? 'bg-blue-100 text-blue-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            Price: {proposal.aiAnalysis.priceAnalysis?.competitiveness?.replace('_', ' ')}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 ml-4">
                      <Link to={`/proposals/${proposal._id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </Link>

                      {user?.userType === 'vendor' && proposal.status === 'draft' && (
                        <Link to={`/proposals/${proposal._id}/edit`}>
                          <Button size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </Link>
                      )}

                      {canViewAll && proposal.status === 'submitted' && (
                        <Link to={`/proposals/${proposal._id}/evaluate`}>
                          <Button size="sm" variant="outline">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Evaluate
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Load More */}
        {proposals.length > 0 && proposals.length % 20 === 0 && (
          <div className="text-center mt-8">
            <Button variant="outline">Load More Proposals</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProposalList;