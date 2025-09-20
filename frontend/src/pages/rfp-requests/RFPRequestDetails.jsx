import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { rfpAPI, marketRequestAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import {
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  DollarSign,
  Calendar,
  User,
  Building,
  Send,
  Download
} from 'lucide-react';

const RFPRequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isConverting, setIsConverting] = useState(false);

  const { data: rfpData, isLoading, error } = useQuery({
    queryKey: ['rfp-request', id],
    queryFn: () => rfpAPI.getById(id),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: rfpAPI.delete,
    onSuccess: () => {
      navigate('/rfp-requests');
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, reviewData }) => rfpAPI.review(id, reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries(['rfp-request', id]);
    },
  });

  const convertToMarketRequestMutation = useMutation({
    mutationFn: marketRequestAPI.create,
    onSuccess: (response) => {
      const marketRequestId = response.data.data._id;
      navigate(`/market-requests/${marketRequestId}`);
    },
  });

  const rfpRequest = rfpData?.data?.data;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'review':
        return <AlertTriangle className="h-5 w-5 text-blue-600" />;
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      draft: 'secondary',
      review: 'default',
      approved: 'success',
      rejected: 'destructive',
    };
    return variants[status] || 'secondary';
  };

  const handleApprove = () => {
    reviewMutation.mutate({
      id,
      reviewData: {
        status: 'approved',
        reviewNotes: 'Approved for market publication',
      },
    });
  };

  const handleReject = () => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      reviewMutation.mutate({
        id,
        reviewData: {
          status: 'rejected',
          reviewNotes: reason,
        },
      });
    }
  };

  const handleConvertToMarketRequest = () => {
    if (!rfpRequest) return;

    const marketRequestData = {
      title: rfpRequest.title,
      description: rfpRequest.description,
      category: rfpRequest.category,
      budget: rfpRequest.budget,
      deadline: rfpRequest.expectedDeliveryDate,
      requirements: rfpRequest.requirements,
      specifications: rfpRequest.specifications,
      sourceRFPRequest: rfpRequest._id,
      status: 'draft',
    };

    setIsConverting(true);
    convertToMarketRequestMutation.mutate(marketRequestData);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this RFP request? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading RFP request...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !rfpRequest) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">RFP Request Not Found</h2>
            <p className="text-gray-600 mb-4">The requested RFP could not be found.</p>
            <Button onClick={() => navigate('/rfp-requests')}>Back to RFP Requests</Button>
          </div>
        </div>
      </div>
    );
  }

  const canEdit = user?.role === 'admin' || rfpRequest.createdBy === user?._id;
  const canReview = user?.role === 'admin' || user?.role === 'manager';
  const canConvert = rfpRequest.status === 'approved' && canReview;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Button
              variant="outline"
              onClick={() => navigate('/rfp-requests')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to RFP Requests</span>
            </Button>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                {getStatusIcon(rfpRequest.status)}
                <h1 className="text-3xl font-bold text-gray-900">{rfpRequest.title}</h1>
                <Badge variant={getStatusBadge(rfpRequest.status)}>
                  {rfpRequest.status}
                </Badge>
              </div>
              <p className="text-gray-600">{rfpRequest.description}</p>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              {canConvert && (
                <Button
                  onClick={handleConvertToMarketRequest}
                  disabled={isConverting || convertToMarketRequestMutation.isLoading}
                  className="flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Convert to Market Request</span>
                </Button>
              )}

              {canEdit && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/rfp-requests/${id}/edit`)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    disabled={deleteMutation.isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Review Actions */}
        {rfpRequest.status === 'review' && canReview && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>This RFP request is pending review</span>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={handleApprove}
                  disabled={reviewMutation.isLoading}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReject}
                  disabled={reviewMutation.isLoading}
                >
                  Reject
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Category</h4>
                    <p className="text-gray-600">{rfpRequest.category}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Priority</h4>
                    <p className="text-gray-600 capitalize">{rfpRequest.priority}</p>
                  </div>
                  {rfpRequest.budget && (
                    <div>
                      <h4 className="font-medium text-gray-900">Budget</h4>
                      <p className="text-gray-600">${rfpRequest.budget.toLocaleString()}</p>
                    </div>
                  )}
                  {rfpRequest.expectedDeliveryDate && (
                    <div>
                      <h4 className="font-medium text-gray-900">Expected Delivery</h4>
                      <p className="text-gray-600">
                        {new Date(rfpRequest.expectedDeliveryDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-gray-700">
                  {rfpRequest.requirements}
                </div>
              </CardContent>
            </Card>

            {/* Technical Specifications */}
            {rfpRequest.specifications && (
              <Card>
                <CardHeader>
                  <CardTitle>Technical Specifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap text-gray-700">
                    {rfpRequest.specifications}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Notes */}
            {rfpRequest.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap text-gray-700">
                    {rfpRequest.notes}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status and Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Status & Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-sm text-gray-600">
                      {new Date(rfpRequest.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-sm text-gray-600">
                      {new Date(rfpRequest.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Request Details */}
            <Card>
              <CardHeader>
                <CardTitle>Request Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Requested By</p>
                    <p className="text-sm text-gray-600">
                      {rfpRequest.createdBy?.firstName} {rfpRequest.createdBy?.lastName}
                    </p>
                  </div>
                </div>
                {rfpRequest.department && (
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Department</p>
                      <p className="text-sm text-gray-600">{rfpRequest.department}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Review Information */}
            {rfpRequest.reviewNotes && (
              <Card>
                <CardHeader>
                  <CardTitle>Review Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap text-gray-700 text-sm">
                    {rfpRequest.reviewNotes}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RFPRequestDetails;