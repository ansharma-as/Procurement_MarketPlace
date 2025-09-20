import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { vendorAPI } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import {
  Building,
  Users,
  Search,
  Filter,
  MapPin,
  Mail,
  Phone,
  Star,
  Award,
  TrendingUp,
  Calendar,
  AlertTriangle,
  Eye,
  UserPlus
} from 'lucide-react';

const VendorList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const {
    data: vendorsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['vendors', { search: searchTerm, status: statusFilter, category: categoryFilter }],
    queryFn: () => vendorAPI.getAll({
      search: searchTerm,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
    }),
    enabled: !!user,
  });

  const vendors = Array.isArray(vendorsData?.data?.data) ? vendorsData.data.data : [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'default';
      case 'suspended':
        return 'destructive';
      case 'inactive':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} className="h-4 w-4 text-yellow-400" />);
      } else {
        stars.push(<Star key={i} className="h-4 w-4 text-gray-300" />);
      }
    }
    return stars;
  };

  const formatDate = (date) => {
    if (!date) return 'Not available';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate stats
  const stats = {
    total: vendors.length || 0,
    active: vendors.filter(v => v.status === 'active').length || 0,
    pending: vendors.filter(v => v.status === 'pending').length || 0,
    avgRating: vendors.length > 0 ? (vendors.reduce((sum, v) => sum + (v.rating || 0), 0) / vendors.length).toFixed(1) : 0,
  };

  const canManageVendors = user?.role === 'admin' || user?.role === 'procurement_officer';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading vendors...</p>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Vendors</h2>
            <p className="text-gray-600">{error.message || 'Failed to load vendors'}</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Vendor Directory</h1>
              <p className="mt-2 text-gray-600">
                Browse and manage vendor relationships and partnerships
              </p>
            </div>

            {canManageVendors && (
              <Button
                onClick={() => navigate('/vendors/invite')}
                className="flex items-center space-x-2"
              >
                <UserPlus className="h-4 w-4" />
                <span>Invite Vendor</span>
              </Button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Vendors</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <Building className="h-8 w-8 text-blue-600" />
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
                  <Users className="h-8 w-8 text-green-600" />
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
                  <Calendar className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.avgRating}</p>
                  </div>
                  <Star className="h-8 w-8 text-purple-600" />
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
                  placeholder="Search vendors..."
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
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </select>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="IT">IT Services</option>
                  <option value="Construction">Construction</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Supplies">Supplies</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vendors List */}
        {vendors.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Vendors Found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'No vendors match your current filters.'
                  : 'Start building your vendor network by inviting vendors.'}
              </p>
              {canManageVendors && (!searchTerm && statusFilter === 'all' && categoryFilter === 'all') && (
                <Button onClick={() => navigate('/vendors/invite')}>
                  Invite Your First Vendor
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {vendors.map((vendor) => (
              <Card key={vendor._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {vendor.name || vendor.companyName || 'Vendor Name'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {vendor.category || 'General Services'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={getStatusColor(vendor.status)}>
                      {vendor.status || 'pending'}
                    </Badge>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="flex items-center space-x-1">
                      {getRatingStars(vendor.rating)}
                    </div>
                    <span className="text-sm text-gray-600">
                      {vendor.rating ? `${vendor.rating.toFixed(1)} (${vendor.reviewCount || 0} reviews)` : 'No ratings yet'}
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    {vendor.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>{vendor.email}</span>
                      </div>
                    )}
                    {vendor.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4" />
                        <span>{vendor.phone}</span>
                      </div>
                    )}
                    {vendor.location && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span>{vendor.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Proposals</p>
                      <p className="font-semibold">{vendor.totalProposals || 0}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Awarded</p>
                      <p className="font-semibold">{vendor.awardedContracts || 0}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Success Rate</p>
                      <p className="font-semibold">
                        {vendor.totalProposals > 0
                          ? `${Math.round((vendor.awardedContracts / vendor.totalProposals) * 100)}%`
                          : '0%'}
                      </p>
                    </div>
                  </div>

                  {/* Capabilities */}
                  {vendor.capabilities && vendor.capabilities.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">Capabilities</p>
                      <div className="flex flex-wrap gap-1">
                        {vendor.capabilities.slice(0, 3).map((capability, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                            {capability}
                          </span>
                        ))}
                        {vendor.capabilities.length > 3 && (
                          <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full">
                            +{vendor.capabilities.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-xs text-gray-500">
                      Joined: {formatDate(vendor.createdAt)}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/vendors/${vendor._id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Profile
                      </Button>
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

export default VendorList;