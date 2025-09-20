import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { vendorAPI, proposalAPI } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import {
  Building,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Globe,
  Star,
  Award,
  Calendar,
  DollarSign,
  FileText,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Edit,
  MessageSquare
} from 'lucide-react';

const VendorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const {
    data: vendorData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['vendor', id],
    queryFn: () => vendorAPI.getById(id),
    enabled: !!id,
  });

  const {
    data: proposalsData,
  } = useQuery({
    queryKey: ['vendor-proposals', id],
    queryFn: () => proposalAPI.getAll({ vendor: id }),
    enabled: !!id,
  });

  const vendor = vendorData?.data?.data;
  const proposals = Array.isArray(proposalsData?.data?.data) ? proposalsData.data.data : [];

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

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'Not available';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const canManageVendor = user?.role === 'admin' || user?.role === 'procurement_officer';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading vendor details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Vendor Not Found</h2>
            <p className="text-gray-600 mb-4">The requested vendor could not be found.</p>
            <Button onClick={() => navigate('/vendors')}>Back to Vendors</Button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'proposals', label: `Proposals (${proposals.length || 0})` },
    { id: 'performance', label: 'Performance' },
    { id: 'documents', label: 'Documents' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Button
              variant="outline"
              onClick={() => navigate('/vendors')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Vendors</span>
            </Button>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {vendor.name || vendor.companyName || 'Vendor Name'}
                  </h1>
                  <Badge variant={getStatusColor(vendor.status)}>
                    {vendor.status || 'pending'}
                  </Badge>
                </div>
                <p className="text-gray-600">{vendor.category || 'General Services'}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="flex items-center space-x-1">
                    {getRatingStars(vendor.rating)}
                  </div>
                  <span className="text-sm text-gray-600">
                    {vendor.rating ? `${vendor.rating.toFixed(1)} (${vendor.reviewCount || 0} reviews)` : 'No ratings yet'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {canManageVendor && (
                <>
                  <Button variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact
                  </Button>
                  <Button variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Proposals</p>
                  <p className="text-2xl font-bold text-gray-900">{vendor.totalProposals || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Awarded</p>
                  <p className="text-2xl font-bold text-gray-900">{vendor.awardedContracts || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {vendor.totalProposals > 0
                      ? `${Math.round((vendor.awardedContracts / vendor.totalProposals) * 100)}%`
                      : '0%'}
                  </p>
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
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(vendor.totalContractValue || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Company Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-1">Company Type</h5>
                        <p className="text-gray-600">{vendor.companyType || 'Not specified'}</p>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 mb-1">Founded</h5>
                        <p className="text-gray-600">{vendor.foundedYear || 'Not specified'}</p>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 mb-1">Employees</h5>
                        <p className="text-gray-600">{vendor.employeeCount || 'Not specified'}</p>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 mb-1">Registration</h5>
                        <p className="text-gray-600">{vendor.registrationNumber || 'Not specified'}</p>
                      </div>
                    </div>

                    {vendor.description && (
                      <div className="mt-6">
                        <h5 className="font-medium text-gray-900 mb-2">About</h5>
                        <p className="text-gray-600">{vendor.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Capabilities & Services</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {vendor.capabilities && vendor.capabilities.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {vendor.capabilities.map((capability, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                            {capability}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No capabilities listed</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Certifications & Compliance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {vendor.certifications && vendor.certifications.length > 0 ? (
                      <div className="space-y-3">
                        {vendor.certifications.map((cert, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="font-medium text-gray-900">{cert.name}</p>
                                <p className="text-sm text-gray-500">
                                  Expires: {cert.expiryDate ? formatDate(cert.expiryDate) : 'No expiry'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No certifications listed</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'proposals' && (
              <div className="space-y-4">
                {proposals.length > 0 ? (
                  proposals.map((proposal) => (
                    <Card key={proposal._id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-2">
                              {proposal.marketRequest?.title || 'Market Request'}
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                              <div>Value: {formatCurrency(proposal.proposedBudget || 0)}</div>
                              <div>Status: {proposal.status}</div>
                              <div>Submitted: {formatDate(proposal.submittedAt)}</div>
                              <div>Response Time: {proposal.responseTime || 'N/A'}</div>
                            </div>
                          </div>
                          <Badge variant={proposal.status === 'awarded' ? 'success' : 'default'}>
                            {proposal.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals yet</h3>
                      <p className="text-gray-600">
                        This vendor hasn't submitted any proposals yet.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'performance' && (
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">Quality Metrics</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">On-time Delivery</span>
                          <span className="text-sm font-medium">{vendor.onTimeDeliveryRate || 0}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Quality Score</span>
                          <span className="text-sm font-medium">{vendor.qualityScore || 0}/10</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Communication</span>
                          <span className="text-sm font-medium">{vendor.communicationScore || 0}/10</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">Business Metrics</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Response Time</span>
                          <span className="text-sm font-medium">{vendor.avgResponseTime || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Repeat Business</span>
                          <span className="text-sm font-medium">{vendor.repeatBusinessRate || 0}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Cost Competitiveness</span>
                          <span className="text-sm font-medium">{vendor.costCompetitiveness || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'documents' && (
              <Card>
                <CardHeader>
                  <CardTitle>Documents & Attachments</CardTitle>
                </CardHeader>
                <CardContent>
                  {vendor.documents && vendor.documents.length > 0 ? (
                    <div className="space-y-3">
                      {vendor.documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">{doc.name}</p>
                              <p className="text-sm text-gray-500">{doc.type} • {doc.size}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No documents uploaded.</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vendor.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-gray-600">{vendor.email}</p>
                      </div>
                    </div>
                  )}
                  {vendor.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm text-gray-600">{vendor.phone}</p>
                      </div>
                    </div>
                  )}
                  {vendor.address && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Address</p>
                        <p className="text-sm text-gray-600">{vendor.address}</p>
                      </div>
                    </div>
                  )}
                  {vendor.website && (
                    <div className="flex items-center space-x-3">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Website</p>
                        <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-500">
                          {vendor.website}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Registered</p>
                      <p className="text-xs text-gray-500">{formatDate(vendor.createdAt)}</p>
                    </div>
                  </div>
                  {vendor.lastActivity && (
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">Last Activity</p>
                        <p className="text-xs text-gray-500">{formatDate(vendor.lastActivity)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDetails;