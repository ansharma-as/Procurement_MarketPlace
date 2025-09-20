import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { marketRequestAPI, proposalAPI } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import {
  FileText,
  Calendar,
  DollarSign,
  Users,
  Clock,
  MapPin,
  Building,
  Eye,
  Edit,
  Share2,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Plus
} from 'lucide-react';

const MarketRequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  const {
    data: marketRequestData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['market-request', id],
    queryFn: () => marketRequestAPI.getById(id),
  });

  const {
    data: proposalsData,
  } = useQuery({
    queryKey: ['market-request-proposals', id],
    queryFn: () => proposalAPI.getByMarketRequest(id),
    enabled: !!id,
  });

  const publishMutation = useMutation({
    mutationFn: () => marketRequestAPI.updateStatus(id, { status: 'published' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['market-request', id]);
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => marketRequestAPI.updateStatus(id, { status: 'closed' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['market-request', id]);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !marketRequestData?.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Market Request Not Found</h2>
          <p className="text-gray-600 mb-4">The requested market request could not be found.</p>
          <Button onClick={() => navigate('/market-requests')}>Back to Market Requests</Button>
        </div>
      </div>
    );
  }

  const marketRequest = marketRequestData.data.data;
  const proposals = Array.isArray(proposalsData?.data?.data) ? proposalsData.data.data : [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'published':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canEdit = user?.role === 'admin' || marketRequest.createdBy === user?._id;

  const canSubmitProposal = user?.userType === 'vendor' && (marketRequest.status === 'published' || marketRequest.status === 'active');

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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePublish = async () => {
    if (window.confirm('Are you sure you want to publish this market request? This will make it visible to vendors.')) {
      publishMutation.mutate();
    }
  };

  const handleClose = async () => {
    if (window.confirm('Are you sure you want to close this market request? No more proposals will be accepted.')) {
      closeMutation.mutate();
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'requirements', label: 'Requirements' },
    { id: 'proposals', label: `Proposals (${proposals.length || 0})` },
    { id: 'documents', label: 'Documents' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/market-requests')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Market Requests
            </Button>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{marketRequest.title}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(marketRequest.status)}`}>
                  {marketRequest.status.charAt(0).toUpperCase() + marketRequest.status.slice(1)}
                </span>
              </div>
              <p className="text-gray-600">{marketRequest.description}</p>
            </div>

            <div className="flex space-x-2">
              {canSubmitProposal && (
                <Link to={`/proposals/create?marketRequest=${marketRequest._id}`}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Submit Proposal
                  </Button>
                </Link>
              )}

              {canEdit && (
                <>
                  {marketRequest.status === 'draft' && (
                    <Button onClick={handlePublish} disabled={publishMutation.isPending}>
                      Publish Market Request
                    </Button>
                  )}

                  {(marketRequest.status === 'published' || marketRequest.status === 'active') && (
                    <Button variant="outline" onClick={handleClose} disabled={closeMutation.isPending}>
                      Close Market Request
                    </Button>
                  )}

                  <Link to={`/market-requests/${marketRequest._id}/edit`}>
                    <Button variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                </>
              )}

              <Button variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Estimated Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {marketRequest.budget ? formatCurrency(marketRequest.budget) : 'TBD'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Proposals</p>
                  <p className="text-2xl font-bold text-gray-900">{proposals.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Days Remaining</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {marketRequest.deadline ? Math.max(0, Math.ceil((new Date(marketRequest.deadline) - new Date()) / (1000 * 60 * 60 * 24))) : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Deadline</p>
                  <p className="text-sm font-bold text-gray-900">
                    {marketRequest.deadline ? formatDate(marketRequest.deadline) : 'No deadline set'}
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
                    <CardTitle>Project Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <p>{marketRequest.description}</p>
                      {marketRequest.requirements && (
                        <div className="mt-4">
                          <h4 className="font-medium">Requirements</h4>
                          <pre className="whitespace-pre-wrap">{marketRequest.requirements}</pre>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Key Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-1">Category</h5>
                        <p className="text-gray-600">{marketRequest.category || 'Not specified'}</p>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 mb-1">Status</h5>
                        <p className="text-gray-600">{marketRequest.status || 'Unknown'}</p>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 mb-1">Created By</h5>
                        <p className="text-gray-600">{marketRequest.createdBy?.firstName} {marketRequest.createdBy?.lastName || 'Unknown'}</p>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 mb-1">Proposals Count</h5>
                        <p className="text-gray-600">{proposals.length || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'requirements' && (
              <Card>
                <CardHeader>
                  <CardTitle>Requirements & Specifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {marketRequest.requirements ? (
                      <div className="whitespace-pre-wrap text-gray-700">
                        {marketRequest.requirements}
                      </div>
                    ) : (
                      <p className="text-gray-500">No specific requirements listed.</p>
                    )}

                    {marketRequest.specifications && (
                      <div className="mt-6">
                        <h4 className="font-medium text-gray-900 mb-2">Technical Specifications</h4>
                        <div className="whitespace-pre-wrap text-gray-700">
                          {marketRequest.specifications}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'proposals' && (
              <div className="space-y-4">
                {proposals.length > 0 ? (
                  proposals.map((proposal) => (
                    <Card key={proposal._id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-medium text-gray-900">
                                {proposal.vendor?.name || proposal.vendorName || 'Vendor Name'}
                              </h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                proposal.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                                proposal.status === 'awarded' ? 'bg-green-100 text-green-800' :
                                proposal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {proposal.status}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                              <div>Total Value: {formatCurrency(proposal.proposedBudget || proposal.totalValue || 0)}</div>
                              <div>Submitted: {formatDate(proposal.submittedAt || proposal.createdAt)}</div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Link to={`/proposals/${proposal._id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals yet</h3>
                      <p className="text-gray-600">
                        Proposals will appear here once vendors submit them.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'documents' && (
              <Card>
                <CardHeader>
                  <CardTitle>Documents & Attachments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {marketRequest.attachments && marketRequest.attachments.length > 0 ? (
                      marketRequest.attachments.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">{doc.filename}</p>
                              <p className="text-sm text-gray-500">{doc.filesize}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No documents attached.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle>Issuing Company</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{marketRequest.createdBy?.firstName} {marketRequest.createdBy?.lastName}</h4>
                    <p className="text-sm text-gray-500">{marketRequest.createdBy?.email || 'No email provided'}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{marketRequest.createdBy?.company || 'Company not provided'}</span>
                  </div>
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
                      <p className="text-sm font-medium">Published</p>
                      <p className="text-xs text-gray-500">{formatDate(marketRequest.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Submission Deadline</p>
                      <p className="text-xs text-gray-500">{marketRequest.deadline ? formatDate(marketRequest.deadline) : 'No deadline set'}</p>
                    </div>
                  </div>
                  {marketRequest.status === 'closed' && (
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">Closed</p>
                        <p className="text-xs text-gray-500">{formatDate(marketRequest.updatedAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Download Market Request
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Market Request
                  </Button>
                  {canEdit && (
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="h-4 w-4 mr-2" />
                      Invite Vendors
                    </Button>
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

export default MarketRequestDetails;