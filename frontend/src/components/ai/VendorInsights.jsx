import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { aiAPI } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Alert, AlertDescription } from '../ui/Alert';
import {
  Brain,
  User,
  TrendingUp,
  DollarSign,
  Truck,
  Shield,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Lightbulb,
  RefreshCw,
  XCircle,
  Star
} from 'lucide-react';

const VendorInsights = ({ vendorId, vendorName }) => {
  const [showInsights, setShowInsights] = useState(false);

  const {
    data: insightsData,
    isLoading: insightsLoading,
    error: insightsError
  } = useQuery({
    queryKey: ['vendor-insights', vendorId],
    queryFn: () => aiAPI.getVendorInsights(vendorId),
    enabled: !!vendorId && showInsights,
  });

  const insights = insightsData?.data?.insights;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
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

  const getCompetitivenessColor = (competitiveness) => {
    switch (competitiveness) {
      case 'competitive':
        return 'text-green-600 bg-green-100';
      case 'average':
        return 'text-yellow-600 bg-yellow-100';
      case 'expensive':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Insights Controls */}
      <Alert>
        <Brain className="h-4 w-4" />
        <AlertDescription>
          <div className="flex justify-between items-center">
            <span>
              {insights
                ? `AI insights available for vendor performance and reliability.`
                : `Generate AI-powered insights for ${vendorName}'s performance and predictions.`
              }
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInsights(!showInsights)}
            >
              {showInsights ? 'Hide' : 'Show'} Insights
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {/* Vendor Insights */}
      {showInsights && insights && (
        <div className="space-y-6">
          {/* Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Vendor Performance Overview
              </CardTitle>
              <CardDescription>
                AI-powered analysis of {vendorName}'s historical performance and reliability
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Star className={`h-8 w-8 mx-auto mb-2 ${getScoreColor(insights.performanceScore)}`} />
                  <div className={`text-2xl font-bold ${getScoreColor(insights.performanceScore)}`}>
                    {insights.performanceScore}
                  </div>
                  <div className="text-sm text-gray-600">Performance Score</div>
                </div>

                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Truck className={`h-8 w-8 mx-auto mb-2 ${getScoreColor(insights.deliveryReliability)}`} />
                  <div className={`text-2xl font-bold ${getScoreColor(insights.deliveryReliability)}`}>
                    {insights.deliveryReliability}
                  </div>
                  <div className="text-sm text-gray-600">Delivery Reliability</div>
                </div>

                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <DollarSign className={`h-8 w-8 mx-auto mb-2 ${getScoreColor(insights.costCompetitiveness)}`} />
                  <div className={`text-2xl font-bold ${getScoreColor(insights.costCompetitiveness)}`}>
                    {insights.costCompetitiveness}
                  </div>
                  <div className="text-sm text-gray-600">Cost Competitiveness</div>
                </div>

                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                  <div className={`text-lg font-bold capitalize px-2 py-1 rounded-full ${getRiskColor(insights.riskLevel)}`}>
                    {insights.riskLevel}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Risk Level</div>
                </div>
              </div>

              {/* Overall Assessment */}
              <div className={`p-4 rounded-lg border ${
                insights.performanceScore >= 80
                  ? 'bg-green-50 border-green-200'
                  : insights.performanceScore >= 60
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <h4 className={`font-medium mb-2 ${
                  insights.performanceScore >= 80
                    ? 'text-green-900'
                    : insights.performanceScore >= 60
                    ? 'text-yellow-900'
                    : 'text-red-900'
                }`}>
                  Overall Assessment
                </h4>
                <p className={`text-sm ${
                  insights.performanceScore >= 80
                    ? 'text-green-800'
                    : insights.performanceScore >= 60
                    ? 'text-yellow-800'
                    : 'text-red-800'
                }`}>
                  {insights.performanceScore >= 80
                    ? 'This vendor demonstrates excellent performance with high reliability and competitive pricing.'
                    : insights.performanceScore >= 60
                    ? 'This vendor shows good performance with some areas for improvement.'
                    : 'This vendor has concerning performance metrics that require careful evaluation.'
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Predictions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-purple-600" />
                Performance Predictions
              </CardTitle>
              <CardDescription>
                AI-generated predictions for future vendor performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Truck className="h-4 w-4 mr-2" />
                    Delivery Accuracy Prediction
                  </h4>
                  <div className="flex items-center space-x-3">
                    <div className={`text-2xl font-bold ${getScoreColor(insights.predictions.expectedDeliveryAccuracy)}`}>
                      {insights.predictions.expectedDeliveryAccuracy}%
                    </div>
                    <div className="text-sm text-gray-600">
                      Expected delivery accuracy for future orders
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Price Competitiveness
                  </h4>
                  <div className="flex items-center space-x-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getCompetitivenessColor(insights.predictions.priceCompetitiveness)}`}>
                      {insights.predictions.priceCompetitiveness}
                    </div>
                    <div className="text-sm text-gray-600">
                      Expected pricing relative to market
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {insights.recommendations && insights.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2 text-orange-600" />
                  AI Recommendations
                </CardTitle>
                <CardDescription>
                  Strategic recommendations for working with this vendor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg">
                      <Lightbulb className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Loading State */}
      {insightsLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Generating vendor insights...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {insightsError && (
        <Alert>
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load vendor insights. Please try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default VendorInsights;