import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { aiAPI } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Alert, AlertDescription } from '../ui/Alert';
import {
  Brain,
  FileText,
  Award,
  Target,
  BarChart3,
  Users,
  CheckCircle,
  AlertTriangle,
  Crown,
  TrendingUp,
  Eye,
  Lightbulb,
  RefreshCw,
  XCircle,
  ArrowRight,
  Star,
  Shield
} from 'lucide-react';

const ExecutiveSummary = ({ marketRequestId, canView = false }) => {
  const [showSummary, setShowSummary] = useState(false);

  const {
    data: summaryData,
    isLoading: summaryLoading,
    error: summaryError
  } = useQuery({
    queryKey: ['executive-summary', marketRequestId],
    queryFn: () => aiAPI.getExecutiveSummary(marketRequestId),
    enabled: !!marketRequestId && showSummary && canView,
  });

  const summary = summaryData?.data?.summary;

  if (!canView) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Executive summary is only available to managers and administrators.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Controls */}
      <Alert>
        <Brain className="h-4 w-4" />
        <AlertDescription>
          <div className="flex justify-between items-center">
            <span>
              {summary
                ? 'Executive summary available with AI-powered insights and recommendations.'
                : 'Generate comprehensive executive summary with AI analysis and strategic recommendations.'
              }
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSummary(!showSummary)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {showSummary ? 'Hide' : 'Show'} Executive Summary
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {/* Executive Summary */}
      {showSummary && summary && (
        <div className="space-y-6">
          {/* Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Executive Summary
              </CardTitle>
              <CardDescription>
                Comprehensive analysis and strategic recommendations for procurement decision
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Users className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="font-medium text-blue-900">Proposals Received</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-700">
                    {summary.totalProposals}
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Crown className="h-5 w-5 text-green-600 mr-2" />
                    <span className="font-medium text-green-900">Top Recommendation</span>
                  </div>
                  <div className="text-lg font-bold text-green-700">
                    {summary.topRecommendation.vendorName}
                  </div>
                  <div className="text-sm text-green-600">
                    Score: {summary.topRecommendation.score}/100
                  </div>
                </div>
              </div>

              {/* Executive Summary Text */}
              <div className="bg-gray-50 border-l-4 border-blue-500 p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                <p className="text-gray-700">{summary.executiveSummary}</p>
              </div>

              {/* Top Recommendation Details */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2 flex items-center">
                  <Award className="h-4 w-4 mr-2" />
                  Recommended Vendor
                </h4>
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-green-800">
                      {summary.topRecommendation.vendorName}
                    </span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="font-bold text-green-700">
                        {summary.topRecommendation.score}/100
                      </span>
                    </div>
                  </div>
                  <p className="text-green-700 text-sm">
                    {summary.topRecommendation.reasoning}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Insights */}
          {summary.keyInsights && summary.keyInsights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2 text-orange-600" />
                  Key Insights
                </CardTitle>
                <CardDescription>
                  Important findings from the proposal analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary.keyInsights.map((insight, index) => (
                    <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800">{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risk Analysis */}
          {summary.riskAnalysis && summary.riskAnalysis.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                  Risk Analysis
                </CardTitle>
                <CardDescription>
                  Potential risks and mitigation considerations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary.riskAnalysis.map((risk, index) => (
                    <div key={index} className="flex items-start p-3 bg-red-50 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-800">{risk}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          {summary.nextSteps && summary.nextSteps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ArrowRight className="h-5 w-5 mr-2 text-green-600" />
                  Recommended Next Steps
                </CardTitle>
                <CardDescription>
                  Strategic actions to move forward with the procurement process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary.nextSteps.map((step, index) => (
                    <div key={index} className="flex items-start p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-center w-6 h-6 bg-green-600 text-white rounded-full text-xs font-bold mr-3 mt-0.5 flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-sm text-green-800">{step}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Export Summary
                </Button>
                <Button variant="outline" className="flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Detailed Analysis
                </Button>
                <Button variant="outline" className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Compare All Proposals
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading State */}
      {summaryLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Generating executive summary...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {summaryError && (
        <Alert>
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load executive summary. Please try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ExecutiveSummary;