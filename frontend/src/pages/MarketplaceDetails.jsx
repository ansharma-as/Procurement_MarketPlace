import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { marketRequestAPI, proposalAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert, AlertDescription } from '../components/ui/Alert';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Building,
  MapPin,
  Clock,
  Users,
  FileText,
  Send,
  Star,
  Award,
  AlertTriangle,
  CheckCircle,
  Eye
} from 'lucide-react';

const MarketplaceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    data: opportunityData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['marketplace-opportunity', id],
    queryFn: () => marketRequestAPI.getById(id),
    enabled: !!id,
  });

  const {
    data: proposalsData,
  } = useQuery({
    queryKey: ['opportunity-proposals', id],
    queryFn: () => proposalAPI.getAll({ marketRequest: id }),
    enabled: !!id && user?.userType === 'vendor',
  });

  const opportunity = opportunityData?.data?.data;
  const proposals = Array.isArray(proposalsData?.data?.data) ? proposalsData.data.data : [];
  const userProposal = proposals.find(p => p.vendorId === user?._id || p.vendor?._id === user?._id);

  const formatCurrency = (amount) => {
    if (!amount) return 'Budget TBD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'No deadline';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDaysLeft = (deadline) => {
    if (!deadline) return null;
    const today = new Date();
    const endDate = new Date(deadline);
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleSubmitProposal = () => {
    if (!user) {
      navigate(`/login?redirect=/marketplace/${id}`);
      return;
    }

    if (user.userType !== 'vendor') {
      alert('Only vendors can submit proposals. Please register as a vendor.');
      navigate('/register/vendor');
      return;
    }

    navigate(`/proposals/create?marketRequest=${id}`);
  };

  const handleViewProposal = () => {
    if (userProposal) {
      navigate(`/proposals/${userProposal._id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading opportunity...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Opportunity Not Found</h2>
            <p className="text-gray-600 mb-4">The requested opportunity could not be found or is no longer available.</p>
            <Button onClick={() => navigate('/marketplace')}>Back to Marketplace</Button>
          </div>
        </div>
      </div>
    );
  }

  const daysLeft = getDaysLeft(opportunity.deadline);
  const isExpired = daysLeft === 0;
  const isClosingSoon = daysLeft && daysLeft <= 7;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Button
              variant="outline"
              onClick={() => navigate('/marketplace')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Marketplace</span>
            </Button>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {opportunity.title}
              </h1>
              <p className="text-gray-600 mb-4">{opportunity.description}</p>

              <div className="flex items-center space-x-4">
                <Badge variant="outline">
                  {opportunity.category || 'General'}
                </Badge>
                <Badge variant={isExpired ? 'destructive' : isClosingSoon ? 'default' : 'success'}>
                  {isExpired ? 'Expired' : isClosingSoon ? `${daysLeft} days left` : 'Open'}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col space-y-2 ml-4">
              {user?.userType === 'vendor' && (
                <>
                  {userProposal ? (
                    <Button
                      onClick={handleViewProposal}
                      className="flex items-center space-x-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View My Proposal</span>
                    </Button>
                  ) : !isExpired ? (
                    <Button
                      onClick={handleSubmitProposal}
                      className="flex items-center space-x-2"
                    >
                      <Send className="h-4 w-4" />
                      <span>Submit Proposal</span>
                    </Button>
                  ) : (
                    <Button disabled>
                      Opportunity Expired
                    </Button>
                  )}
                </>
              )}

              {!user && (
                <Button onClick={() => navigate('/register/vendor')}>
                  Register to Submit Proposal
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Alert for deadline */}
        {daysLeft !== null && isClosingSoon && !isExpired && (
          <Alert className="mb-6">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>Deadline approaching!</strong> Only {daysLeft} day{daysLeft !== 1 ? 's' : ''} left to submit proposals.
            </AlertDescription>
          </Alert>
        )}

        {userProposal && (
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>You have already submitted a proposal for this opportunity.</strong> Status: {userProposal.status}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Opportunity Details */}
            <Card>
              <CardHeader>
                <CardTitle>Opportunity Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700">{opportunity.description}</p>
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
                  {opportunity.requirements || 'No specific requirements listed.'}
                </div>
              </CardContent>
            </Card>

            {/* Technical Specifications */}
            {opportunity.specifications && (
              <Card>
                <CardHeader>
                  <CardTitle>Technical Specifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap text-gray-700">
                    {opportunity.specifications}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Business Justification */}
            {opportunity.justification && (
              <Card>
                <CardHeader>
                  <CardTitle>Business Justification</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap text-gray-700">
                    {opportunity.justification}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Key Information */}
            <Card>
              <CardHeader>
                <CardTitle>Key Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Budget</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(opportunity.budget)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Deadline</p>
                    <p className="text-sm text-gray-700">
                      {formatDate(opportunity.deadline)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium">Proposals</p>
                    <p className="text-sm text-gray-700">
                      {opportunity.proposals?.length || 0} submitted
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium">Urgency</p>
                    <p className="text-sm text-gray-700 capitalize">
                      {opportunity.urgency || 'Medium'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Building className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Requesting Organization</p>
                      <p className="text-sm text-gray-600">
                        {opportunity.createdBy?.company || 'Internal Request'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Contact Person</p>
                      <p className="text-sm text-gray-600">
                        {opportunity.createdBy?.firstName} {opportunity.createdBy?.lastName}
                      </p>
                    </div>
                  </div>

                  {opportunity.createdBy?.email && (
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-gray-600">
                          {opportunity.createdBy.email}
                        </p>
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
                      <p className="text-sm font-medium">Published</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(opportunity.createdAt)}
                      </p>
                    </div>
                  </div>

                  {opportunity.deadline && (
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${isExpired ? 'bg-red-500' : isClosingSoon ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                      <div>
                        <p className="text-sm font-medium">
                          {isExpired ? 'Deadline Passed' : 'Proposal Deadline'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(opportunity.deadline)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Call to Action */}
            {!user && (
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-6 text-center">
                  <Award className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Interested in this opportunity?
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Register as a vendor to submit your proposal
                  </p>
                  <Button onClick={() => navigate('/register/vendor')} className="w-full">
                    Register Now
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceDetails;