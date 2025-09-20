import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiAPI } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Alert, AlertDescription } from '../ui/Alert';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Award,
  Clock,
  DollarSign,
  Truck,
  Shield,
  Target,
  BarChart3,
  RefreshCw
} from 'lucide-react';

const AIEvaluationPanel = ({ proposalId, canEvaluate = false }) => {
  const queryClient = useQueryClient();
  const [showEvaluation, setShowEvaluation] = useState(false);

  const {
    data: evaluationData,
    isLoading: evaluationLoading,
    error: evaluationError
  } = useQuery({
    queryKey: ['ai-evaluation', proposalId],
    queryFn: () => aiAPI.getEvaluation(proposalId),
    enabled: !!proposalId && showEvaluation,
  });

  const evaluateMutation = useMutation({
    mutationFn: () => aiAPI.evaluateProposal(proposalId),
    onSuccess: () => {
      queryClient.invalidateQueries(['proposal', proposalId]);
      queryClient.invalidateQueries(['ai-evaluation', proposalId]);
      setShowEvaluation(true);
    },
  });

  const evaluation = evaluationData?.data?.aiEvaluation;

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

  const handleRunEvaluation = async () => {
    await evaluateMutation.mutateAsync();
  };

  if (!canEvaluate && !evaluation) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* AI Evaluation Controls */}
      {canEvaluate && (
        <Alert>
          <Brain className="h-4 w-4" />
          <AlertDescription>
            <div className="flex justify-between items-center">
              <span>
                {evaluation
                  ? 'AI evaluation completed. Click "Show Analysis" to view results.'
                  : 'Run AI-powered evaluation to analyze this proposal automatically.'
                }
              </span>
              <div className="flex space-x-2">
                {evaluation && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEvaluation(!showEvaluation)}
                  >
                    {showEvaluation ? 'Hide' : 'Show'} Analysis
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRunEvaluation}
                  disabled={evaluateMutation.isPending}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  {evaluateMutation.isPending ? 'Analyzing...' : evaluation ? 'Re-evaluate' : 'Run AI Analysis'}
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* AI Evaluation Results */}
      {showEvaluation && evaluation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="h-5 w-5 mr-2 text-purple-600" />
              AI Evaluation Results
            </CardTitle>
            <CardDescription>
              Intelligent analysis of proposal quality, cost, delivery, and compliance
              <div className="mt-2 text-xs text-gray-500">
                Analyzed on {new Date(evaluation.evaluatedAt).toLocaleDateString()} •
                Confidence: {evaluation.confidence}% •
                Model: {evaluation.modelVersion}
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Overall Score */}
            <div className="mb-6">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(evaluation.overallScore)}`}>
                  {evaluation.overallScore}/100
                </div>
                <div className="text-sm text-gray-600 mt-1">Overall Score</div>
                <div className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreBg(evaluation.overallScore)} ${getScoreColor(evaluation.overallScore)}`}>
                  {evaluation.overallScore >= 80 ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Excellent
                    </>
                  ) : evaluation.overallScore >= 60 ? (
                    <>
                      <Target className="h-4 w-4 mr-1" />
                      Good
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Needs Review
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <DollarSign className={`h-8 w-8 mx-auto mb-2 ${getScoreColor(evaluation.costScore)}`} />
                <div className={`text-2xl font-bold ${getScoreColor(evaluation.costScore)}`}>
                  {evaluation.costScore}
                </div>
                <div className="text-sm text-gray-600">Cost Score</div>
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Truck className={`h-8 w-8 mx-auto mb-2 ${getScoreColor(evaluation.deliveryScore)}`} />
                <div className={`text-2xl font-bold ${getScoreColor(evaluation.deliveryScore)}`}>
                  {evaluation.deliveryScore}
                </div>
                <div className="text-sm text-gray-600">Delivery Score</div>
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Shield className={`h-8 w-8 mx-auto mb-2 ${getScoreColor(evaluation.complianceScore)}`} />
                <div className={`text-2xl font-bold ${getScoreColor(evaluation.complianceScore)}`}>
                  {evaluation.complianceScore}
                </div>
                <div className="text-sm text-gray-600">Compliance Score</div>
              </div>
            </div>

            {/* Detailed Insights */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Cost Analysis
                </h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {evaluation.insights.costAnalysis}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Delivery Prediction
                </h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {evaluation.insights.deliveryPrediction}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Compliance Notes
                </h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {evaluation.insights.complianceNotes}
                </p>
              </div>

              {/* Risk Factors */}
              {evaluation.insights.riskFactors && evaluation.insights.riskFactors.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Risk Factors
                  </h4>
                  <div className="space-y-2">
                    {evaluation.insights.riskFactors.map((risk, index) => (
                      <div key={index} className="flex items-center p-2 bg-orange-50 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-orange-600 mr-2" />
                        <span className="text-sm text-orange-800">{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Recommendation */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Award className="h-4 w-4 mr-2" />
                  AI Recommendation
                </h4>
                <div className={`p-3 rounded-lg ${
                  evaluation.overallScore >= 80
                    ? 'bg-green-50 border border-green-200'
                    : evaluation.overallScore >= 60
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={`text-sm font-medium ${
                    evaluation.overallScore >= 80
                      ? 'text-green-800'
                      : evaluation.overallScore >= 60
                      ? 'text-yellow-800'
                      : 'text-red-800'
                  }`}>
                    {evaluation.insights.recommendation}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {evaluationLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading AI evaluation...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {evaluationError && (
        <Alert>
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load AI evaluation. Please try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default AIEvaluationPanel;