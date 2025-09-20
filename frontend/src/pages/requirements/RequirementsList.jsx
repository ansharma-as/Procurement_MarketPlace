import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { marketRequestAPI } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
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
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  RotateCcw
} from 'lucide-react';

const RequirementsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const {
    data: requirementsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['requirements', { search: searchTerm, status: statusFilter }],
    queryFn: () => marketRequestAPI.getAll({
      search: searchTerm,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      createdBy: user?.role !== 'admin' && user?.role !== 'manager' ? user._id : undefined, // Show only own requirements for regular employees
    }),
    enabled: !!user,
  });

  const deleteRequirementMutation = useMutation({
    mutationFn: (id) => marketRequestAPI.delete ? marketRequestAPI.delete(id) : Promise.reject('Delete not available'),
    onSuccess: () => {
      queryClient.invalidateQueries(['requirements']);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, reason }) => marketRequestAPI.updateStatus ?
      marketRequestAPI.updateStatus(id, { status, reason }) :
      marketRequestAPI.update(id, { status, rejectionReason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['requirements']);
    },
  });

  const requirements = Array.isArray(requirementsData?.data?.data) ? requirementsData.data.data : [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'pending':
        return 'default';
      case 'approved':
        return 'success';
      case 'published':
        return 'success';
      case 'rejected':
        return 'destructive';
      case 'closed':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
      case 'published':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Budget TBD';
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

  const handleDelete = async (requirementId) => {
    if (window.confirm('Are you sure you want to delete this requirement? This action cannot be undone.')) {
      deleteRequirementMutation.mutate(requirementId);
    }
  };

  const handleApprove = (requirementId) => {
    updateStatusMutation.mutate({
      id: requirementId,
      status: 'approved'
    });
  };

  const handleReject = (requirementId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      updateStatusMutation.mutate({
        id: requirementId,
        status: 'rejected',
        reason
      });
    }
  };

  const handlePublish = (requirementId) => {
    if (window.confirm('Are you sure you want to publish this requirement to the marketplace?')) {
      updateStatusMutation.mutate({
        id: requirementId,
        status: 'published'
      });
    }
  };

  const handleSubmitForApproval = (requirementId) => {
    if (window.confirm('Submit this requirement for manager approval?')) {
      updateStatusMutation.mutate({
        id: requirementId,
        status: 'pending'
      });
    }
  };

  // Calculate stats
  const stats = {
    total: requirements.length || 0,
    draft: requirements.filter(r => r.status === 'draft').length || 0,
    pending: requirements.filter(r => r.status === 'pending').length || 0,
    approved: requirements.filter(r => r.status === 'approved').length || 0,
    published: requirements.filter(r => r.status === 'published').length || 0,
  };

  const canManageAll = user?.role === 'admin' || user?.role === 'manager';
  const canCreate = user?.role !== 'vendor'; // All internal users can create requirements

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading requirements...</p>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Requirements</h2>
            <p className="text-gray-600">{error.message || 'Failed to load requirements'}</p>
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
              <h1 className="text-3xl font-bold text-gray-900">
                {canManageAll ? 'All Requirements' : 'My Requirements'}
              </h1>
              <p className="mt-2 text-gray-600">
                {canManageAll
                  ? 'Review and manage all procurement requirements'
                  : 'Create and manage your procurement requirements'}
              </p>
            </div>

            {canCreate && (
              <Button
                onClick={() => navigate('/requirements/create')}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Create Requirement</span>
              </Button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Draft</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
                  </div>
                  <FileText className="h-8 w-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Approved</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Published</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.published}</p>
                  </div>
                  <Send className="h-8 w-8 text-purple-600" />
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
                  placeholder="Search requirements..."
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
                  <option value="pending">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="published">Published</option>
                  <option value="rejected">Rejected</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requirements List */}
        {requirements.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Requirements Found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== 'all'
                  ? 'No requirements match your current filters.'
                  : canCreate
                    ? 'Get started by creating your first requirement.'
                    : 'No requirements have been created yet.'}
              </p>
              {canCreate && (!searchTerm && statusFilter === 'all') && (
                <Button onClick={() => navigate('/requirements/create')}>
                  Create Your First Requirement
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requirements.map((requirement) => (
              <Card key={requirement._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(requirement.status)}
                        <h3 className="text-lg font-semibold text-gray-900">
                          {requirement.title}
                        </h3>
                        <Badge variant={getStatusColor(requirement.status)}>
                          {requirement.status}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {requirement.description}
                      </p>
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Building className="h-4 w-4" />
                          <span>By: {requirement.createdBy?.firstName} {requirement.createdBy?.lastName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4" />
                          <span>Budget: {formatCurrency(requirement.budget)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Created: {formatDate(requirement.createdAt)}</span>
                        </div>
                        {requirement.deadline && (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>Deadline: {formatDate(requirement.deadline)}</span>
                          </div>
                        )}
                      </div>

                      {requirement.rejectionReason && (
                        <Alert variant="destructive" className="mt-3">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Rejection Reason:</strong> {requirement.rejectionReason}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/requirements/${requirement._id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* Employee actions for own requirements */}
                      {requirement.createdBy?._id === user._id && (
                        <>
                          {(requirement.status === 'draft' || requirement.status === 'rejected') && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/requirements/${requirement._id}/edit`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSubmitForApproval(requirement._id)}
                                disabled={updateStatusMutation.isLoading}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </>
                          )}

                          {requirement.status === 'draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(requirement._id)}
                              disabled={deleteRequirementMutation.isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}

                      {/* Manager/Admin actions */}
                      {canManageAll && (
                        <>
                          {requirement.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(requirement._id)}
                                disabled={updateStatusMutation.isLoading}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleReject(requirement._id)}
                                disabled={updateStatusMutation.isLoading}
                              >
                                Reject
                              </Button>
                            </>
                          )}

                          {requirement.status === 'approved' && (
                            <Button
                              size="sm"
                              onClick={() => handlePublish(requirement._id)}
                              disabled={updateStatusMutation.isLoading}
                            >
                              Publish
                            </Button>
                          )}
                        </>
                      )}

                      {requirement.status === 'published' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/marketplace/${requirement._id}`)}
                        >
                          View in Marketplace
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

export default RequirementsList;