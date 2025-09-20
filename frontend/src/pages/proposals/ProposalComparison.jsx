import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { proposalAPI, aiAPI } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import {
  ArrowLeft,
  Award,
  XCircle,
  TrendingUp,
  DollarSign,
  Calendar,
  Shield,
  CheckCircle,
  BarChart3,
  FileText,
  Brain,
  Target,
  AlertTriangle
} from 'lucide-react';

const ProposalComparison = () => {
  const { rfpId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedQuotations, setSelectedQuotations] = useState([]);
  const [comparisonCriteria, setComparisonCriteria] = useState('overall');
  const [showAIAnalysis, setShowAIAnalysis] = useState(true);

  const {
    data: comparisonData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['quotation-comparison', rfpId],
    queryFn: () => aiAPI.compareProposals(rfpId),
    enabled: !!rfpId,
  });

  const {
    data: aiInsights,
  } = useQuery({
    queryKey: ['rfp-insights', rfpId],
    queryFn: () => aiAPI.analyzeMarketRequest(rfpId),
    enabled: !!rfpId,
  });

  const {
    data: vendorRanking,
  } = useQuery({
    queryKey: ['vendor-ranking', rfpId],
    queryFn: () => aiAPI.compareProposals(rfpId),
    enabled: !!rfpId,
  });

  const awardMutation = useMutation({
    mutationFn: ({ proposalId, data }) => proposalAPI.accept(proposalId, data.managerNotes),
    onSuccess: () => {
      queryClient.invalidateQueries(['quotation-comparison', rfpId]);
      queryClient.invalidateQueries(['quotations']);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ proposalId, data }) => proposalAPI.reject(proposalId, data.rejectionReason, data.managerNotes),
    onSuccess: () => {
      queryClient.invalidateQueries(['quotation-comparison', rfpId]);
      queryClient.invalidateQueries(['quotations']);
    },
  });

  useEffect(() => {
    if (comparisonData?.data?.quotations) {
      // Select top 3 quotations by default
      const topQuotations = comparisonData.data.quotations
        .slice(0, 3)
        .map(q => q._id);
      setSelectedQuotations(topQuotations);
    }
  }, [comparisonData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !comparisonData?.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Comparison Not Available</h2>
          <p className="text-gray-600 mb-4">Unable to load quotation comparison data.</p>
          <Button onClick={() => navigate('/rfps')}>Back to RFPs</Button>
        </div>
      </div>
    );
  }

  const { rfp, quotations, summary } = comparisonData.data;
  const selectedQuotationData = quotations.filter(q => selectedQuotations.includes(q._id));

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handleAward = async (quotationId, vendorName) => {
    if (window.confirm(`Are you sure you want to award this contract to ${vendorName}?`)) {
      await awardMutation.mutateAsync({
        quotationId,
        data: {
          awardReason: 'Selected based on evaluation criteria and comparison analysis',
          awardDate: new Date().toISOString(),
        }
      });
    }
  };

  const handleReject = async (quotationId, vendorName) => {
    const reason = window.prompt(`Please provide a reason for rejecting ${vendorName}'s proposal:`);
    if (reason) {
      await rejectMutation.mutateAsync({
        quotationId,
        data: {
          rejectionReason: reason,
          rejectionDate: new Date().toISOString(),
        }
      });
    }
  };

  const canManageAwards = user?.role === 'admin' || user?.role === 'procurement_officer';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate(`/rfps/${rfpId}`)}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to RFP
            </Button>
          </div>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
                Quotation Comparison
              </h1>
              <p className="text-gray-600 mt-1">{rfp.title}</p>
              <p className="text-sm text-gray-500 mt-1">
                {quotations.length} quotations received • {summary.totalValue ? formatCurrency(summary.totalValue) : 'Various values'}
              </p>
            </div>

            <div className="flex space-x-2">
              <Button
                variant={showAIAnalysis ? 'default' : 'outline'}
                onClick={() => setShowAIAnalysis(!showAIAnalysis)}
              >
                <Brain className="h-4 w-4 mr-2" />
                AI Analysis
              </Button>
            </div>
          </div>
        </div>

        {/* AI Insights Panel */}
        {showAIAnalysis && aiInsights?.data && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  AI-Powered Insights
                </CardTitle>
                <CardDescription>
                  Intelligent analysis of all received quotations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {aiInsights.data.insights.averageConfidenceScore}%
                    </div>
                    <div className="text-sm text-gray-600">Avg Confidence</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {aiInsights.data.insights.recommendedVendors}
                    </div>
                    <div className="text-sm text-gray-600">Recommended</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(aiInsights.data.insights.averageQuotationValue)}
                    </div>
                    <div className="text-sm text-gray-600">Avg Value</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {aiInsights.data.insights.averageComplianceScore}%
                    </div>
                    <div className="text-sm text-gray-600">Avg Compliance</div>
                  </div>
                </div>

                {/* Recommendations */}
                {aiInsights.data.recommendations && aiInsights.data.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Key Recommendations</h4>
                    <div className="space-y-2">
                      {aiInsights.data.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                          <Target className="h-4 w-4 text-blue-600 mt-0.5" />
                          <p className="text-sm text-blue-800">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quotation Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select Quotations to Compare</CardTitle>
            <CardDescription>
              Choose up to 4 quotations for detailed comparison
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quotations.map((quotation) => (
                <div
                  key={quotation._id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedQuotations.includes(quotation._id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    if (selectedQuotations.includes(quotation._id)) {
                      setSelectedQuotations(prev => prev.filter(id => id !== quotation._id));
                    } else if (selectedQuotations.length < 4) {
                      setSelectedQuotations(prev => [...prev, quotation._id]);
                    }
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{quotation.vendor.name}</h4>
                    <div className="flex items-center">
                      {selectedQuotations.includes(quotation._id) && (
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Value: {formatCurrency(quotation.commercialProposal.totalValue)}</div>
                    {quotation.aiAnalysis?.confidenceScore && (
                      <div>AI Score: {quotation.aiAnalysis.confidenceScore}%</div>
                    )}
                    <div className={`inline-block px-2 py-1 rounded-full text-xs ${
                      quotation.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                      quotation.status === 'awarded' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {quotation.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Comparison Table */}
        {selectedQuotationData.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Detailed Comparison</CardTitle>
              <CardDescription>
                Side-by-side analysis of selected quotations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Criteria</th>
                      {selectedQuotationData.map((quotation) => (
                        <th key={quotation._id} className="text-left py-3 px-4 font-medium text-gray-900">
                          {quotation.vendor.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {/* Total Value */}
                    <tr>
                      <td className="py-3 px-4 font-medium text-gray-900 flex items-center">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Total Value
                      </td>
                      {selectedQuotationData.map((quotation) => (
                        <td key={quotation._id} className="py-3 px-4">
                          <div className="font-medium">
                            {formatCurrency(quotation.commercialProposal.totalValue)}
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Delivery Timeline */}
                    <tr>
                      <td className="py-3 px-4 font-medium text-gray-900 flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Delivery Timeline
                      </td>
                      {selectedQuotationData.map((quotation) => (
                        <td key={quotation._id} className="py-3 px-4">
                          {quotation.commercialProposal.deliveryTimeline || 'Not specified'}
                        </td>
                      ))}
                    </tr>

                    {/* Payment Terms */}
                    <tr>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        Payment Terms
                      </td>
                      {selectedQuotationData.map((quotation) => (
                        <td key={quotation._id} className="py-3 px-4">
                          {quotation.commercialProposal.paymentTerms || 'Not specified'}
                        </td>
                      ))}
                    </tr>

                    {/* AI Confidence Score */}
                    {showAIAnalysis && (
                      <tr>
                        <td className="py-3 px-4 font-medium text-gray-900 flex items-center">
                          <Brain className="h-4 w-4 mr-2" />
                          AI Confidence Score
                        </td>
                        {selectedQuotationData.map((quotation) => (
                          <td key={quotation._id} className="py-3 px-4">
                            {quotation.aiAnalysis?.confidenceScore ? (
                              <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                                getScoreColor(quotation.aiAnalysis.confidenceScore)
                              }`}>
                                {quotation.aiAnalysis.confidenceScore}%
                              </span>
                            ) : (
                              <span className="text-gray-500">Not analyzed</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    )}

                    {/* Risk Assessment */}
                    {showAIAnalysis && (
                      <tr>
                        <td className="py-3 px-4 font-medium text-gray-900 flex items-center">
                          <Shield className="h-4 w-4 mr-2" />
                          Risk Level
                        </td>
                        {selectedQuotationData.map((quotation) => (
                          <td key={quotation._id} className="py-3 px-4">
                            {quotation.aiAnalysis?.riskAssessment?.overallRisk ? (
                              <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                                getRiskColor(quotation.aiAnalysis.riskAssessment.overallRisk)
                              }`}>
                                {quotation.aiAnalysis.riskAssessment.overallRisk}
                              </span>
                            ) : (
                              <span className="text-gray-500">Not assessed</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    )}

                    {/* Compliance Score */}
                    {showAIAnalysis && (
                      <tr>
                        <td className="py-3 px-4 font-medium text-gray-900 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Compliance Score
                        </td>
                        {selectedQuotationData.map((quotation) => (
                          <td key={quotation._id} className="py-3 px-4">
                            {quotation.aiAnalysis?.complianceAnalysis?.overallCompliance ? (
                              <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                                getScoreColor(quotation.aiAnalysis.complianceAnalysis.overallCompliance)
                              }`}>
                                {quotation.aiAnalysis.complianceAnalysis.overallCompliance}%
                              </span>
                            ) : (
                              <span className="text-gray-500">Not analyzed</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    )}

                    {/* Actions */}
                    {canManageAwards && (
                      <tr>
                        <td className="py-3 px-4 font-medium text-gray-900">
                          Actions
                        </td>
                        {selectedQuotationData.map((quotation) => (
                          <td key={quotation._id} className="py-3 px-4">
                            <div className="flex space-x-2">
                              {quotation.status === 'submitted' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleAward(quotation._id, quotation.vendor.name)}
                                    disabled={awardMutation.isPending}
                                  >
                                    <Award className="h-4 w-4 mr-1" />
                                    Award
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleReject(quotation._id, quotation.vendor.name)}
                                    disabled={rejectMutation.isPending}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                              {quotation.status === 'awarded' && (
                                <span className="text-green-600 font-medium flex items-center">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Awarded
                                </span>
                              )}
                              {quotation.status === 'rejected' && (
                                <span className="text-red-600 font-medium flex items-center">
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Rejected
                                </span>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vendor Ranking */}
        {vendorRanking?.data && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                AI-Generated Vendor Ranking
              </CardTitle>
              <CardDescription>
                Comprehensive ranking based on all evaluation criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vendorRanking.data.ranking.map((vendor, index) => (
                  <div key={vendor.quotationId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium">{vendor.vendorName}</h4>
                        <p className="text-sm text-gray-600">
                          Overall Score: {vendor.overallScore}% • Value: {formatCurrency(vendor.totalValue)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                        vendor.recommendation === 'highly_recommended' ? 'bg-green-100 text-green-800' :
                        vendor.recommendation === 'recommended' ? 'bg-blue-100 text-blue-800' :
                        vendor.recommendation === 'consider' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {vendor.recommendation.replace('_', ' ')}
                      </span>
                      {index === 0 && (
                        <Award className="h-5 w-5 text-yellow-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProposalComparison;