import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { marketRequestAPI } from '../../services/api';
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
  Users,
  Clock,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const MarketRequestList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const {
    data: marketRequestsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['market-requests', { search: searchTerm, status: statusFilter }],
    queryFn: () => marketRequestAPI.getAll({
      search: searchTerm,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => marketRequestAPI.delete ? marketRequestAPI.delete(id) : Promise.reject('Delete not available'),
    onSuccess: () => {
      queryClient.invalidateQueries(['market-requests']);
    },
  });

  const marketRequests = Array.isArray(marketRequestsData?.data?.data) ? marketRequestsData.data.data : [];

  const filteredRequests = marketRequests.filter(request => {
    const matchesSearch = !searchTerm ||
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'published':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      case 'awarded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft':
        return <Clock className="h-4 w-4" />;
      case 'published':
        return <Eye className="h-4 w-4" />;
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'closed':
        return <AlertTriangle className="h-4 w-4" />;
      case 'awarded':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const canCreateRequest = user?.role === 'procurement_officer' || user?.role === 'admin';
  const canEditRequest = (request) => {
    return user?.role === 'admin' || request.createdBy === user?._id;
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'TBD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDeleteRequest = async (requestId) => {
    if (window.confirm('Are you sure you want to delete this market request?')) {
      deleteMutation.mutate(requestId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading market requests...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Market Requests</h2>
            <p className="text-gray-600">{error.message || 'Failed to load market requests'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Market Requests</h1>
              <p className="mt-2 text-gray-600">
                Browse and manage public procurement opportunities
              </p>
            </div>

            {canCreateRequest && (
              <Button
                onClick={() => navigate('/market-requests/create')}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Create Market Request</span>
              </Button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Requests</p>
                    <p className="text-2xl font-bold text-gray-900">{marketRequests.length || 0}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {marketRequests.filter(r => r.status === 'active').length || 0}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Draft</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {marketRequests.filter(r => r.status === 'draft').length || 0}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Awarded</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {marketRequests.filter(r => r.status === 'awarded').length || 0}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search market requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                  <option value="awarded">Awarded</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Market Requests List */}
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Market Requests Found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== 'all'
                  ? 'No requests match your current filters.'
                  : 'Get started by creating your first market request.'}
              </p>
              {(!searchTerm && statusFilter === 'all' && canCreateRequest) && (
                <Button onClick={() => navigate('/market-requests/create')}>
                  Create Your First Market Request
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <Card key={request._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(request.status)}
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {request.description}
                      </p>
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Created: {formatDate(request.createdAt)}</span>
                        </div>
                        {request.deadline && (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>Deadline: {formatDate(request.deadline)}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4" />
                          <span>Budget: {formatCurrency(request.budget)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{request.proposals?.length || 0} proposals</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/market-requests/${request._id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canEditRequest(request) && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/market-requests/${request._id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRequest(request._id)}
                            disabled={deleteMutation.isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {user?.userType === 'vendor' && (request.status === 'published' || request.status === 'active') && (
                        <Button
                          size="sm"
                          onClick={() => navigate(`/proposals/create?marketRequest=${request._id}`)}
                        >
                          Submit Proposal
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketRequestList;