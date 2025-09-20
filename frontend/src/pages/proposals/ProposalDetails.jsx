import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { proposalAPI, aiAPI } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import {
  ArrowLeft,
  FileText,
  DollarSign,
  Calendar,
  Building,
  User,
  Award,
  XCircle,
  Edit,
  Download,
  Brain,
  Shield,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye
} from 'lucide-react';

const ProposalDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);

  const {
    data: proposalData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['proposal', id],
    queryFn: () => proposalAPI.getById(id),
  });

  const {
    data: aiEvaluationData,
  } = useQuery({
    queryKey: ['ai-evaluation', id],
    queryFn: () => aiAPI.getEvaluation(id),
    enabled: showAIAnalysis && !!id,
  });

  const evaluateMutation = useMutation({
    mutationFn: () => aiAPI.evaluateProposal(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['proposal', id]);
      queryClient.invalidateQueries(['ai-evaluation', id]);
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (data) => proposalAPI.accept(id, data.managerNotes),
    onSuccess: () => {
      queryClient.invalidateQueries(['proposal', id]);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (data) => proposalAPI.reject(id, data.rejectionReason, data.managerNotes),
    onSuccess: () => {
      queryClient.invalidateQueries(['proposal', id]);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !proposalData?.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Proposal Not Found</h2>
          <p className="text-gray-600 mb-4">The requested proposal could not be found.</p>
          <Button onClick={() => navigate('/proposals')}>Back to Proposals</Button>
        </div>
      </div>
    );
  }

  const proposal = proposalData.data;

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'withdrawn':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canEdit = user?.userType === 'vendor' && proposal.vendor._id === user.userId && proposal.status === 'draft';
  const canManage = user?.userType === 'organization' && ['admin', 'manager'].includes(user?.role);
  const canEvaluate = canManage && proposal.status === 'submitted';

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

  const handleAccept = async () => {
    const reason = window.prompt('Please provide notes for accepting this proposal:');
    if (reason) {
      await acceptMutation.mutateAsync({
        managerNotes: reason,
      });
    }
  };

  const handleReject = async () => {
    const reason = window.prompt('Please provide a reason for rejecting this proposal:');
    if (reason) {
      await rejectMutation.mutateAsync({
        rejectionReason: reason,
        rejectionDate: new Date().toISOString(),
      });
    }
  };

  const handleRunAIEvaluation = async () => {
    await evaluateMutation.mutateAsync();
    setShowAIAnalysis(true);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'technical', label: 'Technical Proposal' },
    { id: 'commercial', label: 'Commercial Proposal' },
    { id: 'compliance', label: 'Compliance' },
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
              onClick={() => navigate('/quotations')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quotations
            </Button>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  Quotation from {quotation.vendor.name}
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(quotation.status)}`}>
                  {quotation.status.replace('_', ' ').charAt(0).toUpperCase() + quotation.status.replace('_', ' ').slice(1)}
                </span>
              </div>
              <p className="text-gray-600">For: {quotation.rfp.title}</p>
            </div>

            <div className="flex space-x-2">
              {canEvaluate && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleRunAIEvaluation}
                    disabled={evaluateMutation.isPending}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    {evaluateMutation.isPending ? 'Analyzing...' : 'Run AI Analysis'}
                  </Button>

                  <Button onClick={handleAward} disabled={awardMutation.isPending}>
                    <Award className="h-4 w-4 mr-2" />
                    Award Contract
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleReject}
                    disabled={rejectMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </>
              )}

              {canEdit && (
                <Link to={`/quotations/${quotation._id}/edit`}>
                  <Button>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </Link>
              )}

              <Link to={`/rfps/${quotation.rfp._id}`}>
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  View RFP
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(quotation.commercialProposal?.totalValue || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Delivery Timeline</p>
                  <p className="text-lg font-bold text-gray-900">
                    {quotation.commercialProposal?.deliveryTimeline || 'TBD'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {quotation.aiAnalysis?.confidenceScore && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Brain className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">AI Confidence</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {quotation.aiAnalysis.confidenceScore}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Submitted</p>
                  <p className="text-sm font-bold text-gray-900">
                    {quotation.submittedAt ? formatDate(quotation.submittedAt) : 'Draft'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Analysis Alert */}
        {quotation.aiAnalysis && (
          <Alert className="mb-6">
            <Brain className="h-4 w-4" />
            <AlertDescription>
              <div className="flex justify-between items-center">
                <span>AI analysis is available for this quotation.</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAIAnalysis(!showAIAnalysis)}
                >
                  {showAIAnalysis ? 'Hide' : 'Show'} Analysis
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* AI Analysis Panel */}
        {showAIAnalysis && (quotation.aiAnalysis || aiAnalysisData?.data) && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  AI Analysis Results
                </CardTitle>
                <CardDescription>
                  Intelligent evaluation of this quotation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {quotation.aiAnalysis?.confidenceScore && (
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${
                        quotation.aiAnalysis.confidenceScore >= 80 ? 'text-green-600' :
                        quotation.aiAnalysis.confidenceScore >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {quotation.aiAnalysis.confidenceScore}%
                      </div>
                      <div className="text-sm text-gray-600">Overall Confidence</div>
                    </div>
                  )}

                  {quotation.aiAnalysis?.riskAssessment && (
                    <div className="text-center">
                      <div className={`text-lg font-bold capitalize ${
                        quotation.aiAnalysis.riskAssessment.overallRisk === 'low' ? 'text-green-600' :
                        quotation.aiAnalysis.riskAssessment.overallRisk === 'medium' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {quotation.aiAnalysis.riskAssessment.overallRisk} Risk
                      </div>
                      <div className="text-sm text-gray-600">Risk Assessment</div>
                    </div>
                  )}

                  {quotation.aiAnalysis?.complianceAnalysis && (
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${
                        quotation.aiAnalysis.complianceAnalysis.overallCompliance >= 80 ? 'text-green-600' :
                        quotation.aiAnalysis.complianceAnalysis.overallCompliance >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {quotation.aiAnalysis.complianceAnalysis.overallCompliance}%
                      </div>
                      <div className="text-sm text-gray-600">Compliance Score</div>
                    </div>
                  )}
                </div>

                {/* Detailed Analysis */}
                {quotation.aiAnalysis?.priceAnalysis && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Price Analysis</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-600">Competitiveness:</span>
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                            quotation.aiAnalysis.priceAnalysis.competitiveness === 'very_competitive' ? 'bg-green-100 text-green-800' :
                            quotation.aiAnalysis.priceAnalysis.competitiveness === 'competitive' ? 'bg-blue-100 text-blue-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {quotation.aiAnalysis.priceAnalysis.competitiveness?.replace('_', ' ')}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Market Position:</span>
                          <span className="ml-2 font-medium">{quotation.aiAnalysis.priceAnalysis.marketPosition}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Risk Factors */}
                {quotation.aiAnalysis?.riskAssessment?.riskFactors && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Risk Factors</h4>
                    <div className="space-y-2">
                      {Object.entries(quotation.aiAnalysis.riskAssessment.riskFactors).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            value === 'low' ? 'bg-green-100 text-green-800' :
                            value === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

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
                    <CardTitle>Quotation Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <p>{quotation.executiveSummary || 'No executive summary provided.'}</p>
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
                        <h5 className="font-medium text-gray-900 mb-1">Validity Period</h5>
                        <p className="text-gray-600">{quotation.validityPeriod || 'Not specified'}</p>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 mb-1">Currency</h5>
                        <p className="text-gray-600">{quotation.commercialProposal?.currency || 'USD'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'technical' && (
              <Card>
                <CardHeader>
                  <CardTitle>Technical Proposal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {quotation.technicalProposal?.methodology && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Methodology</h4>
                        <p className="text-gray-600">{quotation.technicalProposal.methodology}</p>
                      </div>
                    )}

                    {quotation.technicalProposal?.timeline && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Implementation Timeline</h4>
                        <p className="text-gray-600">{quotation.technicalProposal.timeline}</p>
                      </div>
                    )}

                    {quotation.technicalProposal?.resources && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Resources & Team</h4>
                        <p className="text-gray-600">{quotation.technicalProposal.resources}</p>
                      </div>
                    )}

                    {quotation.technicalProposal?.qualityAssurance && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Quality Assurance</h4>
                        <p className="text-gray-600">{quotation.technicalProposal.qualityAssurance}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'commercial' && (
              <Card>
                <CardHeader>
                  <CardTitle>Commercial Proposal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Total Value</h4>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(quotation.commercialProposal?.totalValue || 0)}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Payment Terms</h4>
                        <p className="text-gray-600">{quotation.commercialProposal?.paymentTerms || 'Not specified'}</p>
                      </div>
                    </div>

                    {quotation.commercialProposal?.breakdown && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Cost Breakdown</h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                            {quotation.commercialProposal.breakdown}
                          </pre>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Delivery Timeline</h4>
                        <p className="text-gray-600">{quotation.commercialProposal?.deliveryTimeline || 'Not specified'}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Warranty</h4>
                        <p className="text-gray-600">{quotation.commercialProposal?.warranty || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'compliance' && (
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Matrix</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {quotation.complianceMatrix && quotation.complianceMatrix.length > 0 ? (
                      quotation.complianceMatrix.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <h5 className="font-medium text-gray-900">{item.requirement}</h5>
                            <p className="text-sm text-gray-600">{item.response}</p>
                          </div>
                          <div className="flex items-center">
                            {item.compliant ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No compliance matrix provided.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'documents' && (
              <Card>
                <CardHeader>
                  <CardTitle>Supporting Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {quotation.attachments && quotation.attachments.length > 0 ? (
                      quotation.attachments.map((doc, index) => (
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
            {/* Vendor Information */}
            <Card>
              <CardHeader>
                <CardTitle>Vendor Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{quotation.vendor.name}</h4>
                    <p className="text-sm text-gray-500">{quotation.vendor.type}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{quotation.vendor.email || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{quotation.vendor.phone || 'Not provided'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RFP Information */}
            <Card>
              <CardHeader>
                <CardTitle>Related RFP</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{quotation.rfp.title}</h4>
                    <p className="text-sm text-gray-600">{quotation.rfp.description}</p>
                  </div>
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estimated Value:</span>
                      <span className="font-medium">
                        {quotation.rfp.estimatedValue ? formatCurrency(quotation.rfp.estimatedValue) : 'TBD'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Deadline:</span>
                      <span className="font-medium">
                        {formatDate(quotation.rfp.submissionDeadline)}
                      </span>
                    </div>
                  </div>
                  <Link to={`/rfps/${quotation.rfp._id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      View RFP Details
                    </Button>
                  </Link>
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
                    Download PDF
                  </Button>

                  {canManage && (
                    <Link to={`/quotations/compare/${quotation.rfp._id}`}>
                      <Button variant="outline" className="w-full justify-start">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Compare with Others
                      </Button>
                    </Link>
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

export default ProposalDetails;