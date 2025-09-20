import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { contractAPI } from '../../services/api';
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
  Download,
  RefreshCw
} from 'lucide-react';

const ContractList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const {
    data: contractsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['contracts', { search: searchTerm, status: statusFilter, type: typeFilter }],
    queryFn: () => contractAPI.getAll({
      search: searchTerm,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
    }),
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => contractAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['contracts']);
    },
  });

  const contracts = Array.isArray(contractsData?.data?.data) ? contractsData.data.data : [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'pending':
        return 'default';
      case 'active':
        return 'success';
      case 'expired':
        return 'destructive';
      case 'terminated':
        return 'destructive';
      case 'completed':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'expired':
      case 'terminated':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
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

  const getDaysUntilExpiry = (endDate) => {
    if (!endDate) return null;
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleDelete = async (contractId) => {
    if (window.confirm('Are you sure you want to delete this contract? This action cannot be undone.')) {
      deleteMutation.mutate(contractId);
    }
  };

  // Calculate stats
  const stats = {
    total: contracts.length || 0,
    active: contracts.filter(c => c.status === 'active').length || 0,
    pending: contracts.filter(c => c.status === 'pending').length || 0,
    totalValue: contracts.reduce((sum, c) => sum + (c.value || 0), 0) || 0,
  };

  const canManageContracts = user?.role === 'admin' || user?.role === 'procurement_officer';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading contracts...</p>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Contracts</h2>
            <p className="text-gray-600">{error.message || 'Failed to load contracts'}</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Contract Management</h1>
              <p className="mt-2 text-gray-600">
                Manage contracts, track performance, and ensure compliance
              </p>
            </div>

            {canManageContracts && (
              <Button
                onClick={() => navigate('/contracts/create')}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Create Contract</span>
              </Button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Contracts</p>
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
                    <p className="text-sm font-medium text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
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
                    <p className="text-sm font-medium text-gray-600">Total Value</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-600" />
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
                  placeholder="Search contracts..."
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
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="terminated">Terminated</option>
                  <option value="completed">Completed</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="service">Service</option>
                  <option value="goods">Goods</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="consulting">Consulting</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contracts List */}
        {contracts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Contracts Found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'No contracts match your current filters.'
                  : 'Get started by creating your first contract.'}
              </p>
              {canManageContracts && (!searchTerm && statusFilter === 'all' && typeFilter === 'all') && (
                <Button onClick={() => navigate('/contracts/create')}>
                  Create Your First Contract
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {contracts.map((contract) => (
              <Card key={contract._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(contract.status)}
                        <h3 className="text-lg font-semibold text-gray-900">
                          {contract.title || contract.name || 'Contract Title'}
                        </h3>
                        <Badge variant={getStatusColor(contract.status)}>
                          {contract.status}
                        </Badge>
                        {contract.status === 'active' && contract.endDate && (
                          (() => {
                            const days = getDaysUntilExpiry(contract.endDate);
                            if (days !== null && days <= 30) {
                              return (
                                <Badge variant={days <= 7 ? 'destructive' : 'default'}>
                                  {days <= 0 ? 'Expired' : `${days} days left`}
                                </Badge>
                              );
                            }
                            return null;
                          })()
                        )}
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {contract.description || 'No description provided'}
                      </p>
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Building className="h-4 w-4" />
                          <span>Vendor: {contract.vendor?.name || contract.vendorName || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4" />
                          <span>Value: {formatCurrency(contract.value)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Start: {formatDate(contract.startDate)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>End: {formatDate(contract.endDate)}</span>
                        </div>
                      </div>

                      {/* Contract Type and Category */}
                      <div className="flex items-center space-x-2 mt-3">
                        {contract.type && (
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                            {contract.type}
                          </span>
                        )}
                        {contract.category && (
                          <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                            {contract.category}
                          </span>
                        )}
                        {contract.autoRenewal && (
                          <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">
                            Auto-Renewal
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/contracts/${contract._id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canManageContracts && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/contracts/${contract._id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {contract.status === 'draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(contract._id)}
                              disabled={deleteMutation.isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}

                      {/* Action buttons based on status */}
                      {contract.status === 'pending' && canManageContracts && (
                        <Button
                          size="sm"
                          onClick={() => navigate(`/contracts/${contract._id}/execute`)}
                        >
                          Execute
                        </Button>
                      )}

                      {contract.status === 'active' && canManageContracts && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/contracts/${contract._id}/renew`)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}

                      {contract.documents && contract.documents.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          title="Download Documents"
                        >
                          <Download className="h-4 w-4" />
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

export default ContractList;