import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { aiAPI } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Alert, AlertDescription } from '../ui/Alert';
import {
  Brain,
  TrendingUp,
  Award,
  Target,
  BarChart3,
  Users,
  CheckCircle,
  AlertTriangle,
  Crown,
  Medal,
  Trophy,
  RefreshCw,
  XCircle
} from 'lucide-react';

const ProposalComparison = ({ marketRequestId, proposals = [] }) => {
  const [showComparison, setShowComparison] = useState(false);

  const {
    data: comparisonData,
    isLoading: comparisonLoading,
    error: comparisonError
  } = useQuery({
    queryKey: ['ai-comparison', marketRequestId],
    queryFn: () => aiAPI.compareProposals(marketRequestId),
    enabled: !!marketRequestId && showComparison,
  });

  const compareMutation = useMutation({
    mutationFn: () => aiAPI.compareProposals(marketRequestId),
    onSuccess: () => {
      setShowComparison(true);
    },
  });

  const comparison = comparisonData?.data?.comparison;

  const getRankColor = (rank) => {
    switch (rank) {
      case 1:
        return 'text-yellow-600 bg-yellow-100';
      case 2:
        return 'text-gray-600 bg-gray-100';
      case 3:
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5" />;
      case 2:
        return <Medal className="h-5 w-5" />;
      case 3:
        return <Trophy className="h-5 w-5" />;
      default:
        return <Target className="h-5 w-5" />;
    }
  };

  const handleRunComparison = async () => {
    await compareMutation.mutateAsync();
  };

  if (proposals.length < 2) {
    return (
      <Alert>
        <Users className="h-4 w-4" />
        <AlertDescription>
          AI comparison requires at least 2 proposals. Currently {proposals.length} proposal(s) available.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comparison Controls */}
      <Alert>
        <Brain className="h-4 w-4" />
        <AlertDescription>
          <div className="flex justify-between items-center">
            <span>
              {comparison
                ? `AI comparison completed for ${proposals.length} proposals.`
                : `Run AI-powered comparison to analyze and rank all ${proposals.length} proposals.`
              }
            </span>
            <div className="flex space-x-2">
              {comparison && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowComparison(!showComparison)}
                >
                  {showComparison ? 'Hide' : 'Show'} Comparison
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRunComparison}
                disabled={compareMutation.isPending}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {compareMutation.isPending ? 'Comparing...' : comparison ? 'Re-compare' : 'Compare Proposals'}
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Comparison Results */}
      {showComparison && comparison && (
        <div className="space-y-6">
          {/* Executive Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2 text-purple-600" />
                AI Comparison Summary
              </CardTitle>
              <CardDescription>
                Intelligent analysis and ranking of all submitted proposals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-blue-800">{comparison.summary}</p>
              </div>

              {/* Top Recommendation */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2 flex items-center">
                  <Award className="h-4 w-4 mr-2" />
                  Top Recommendation
                </h4>
                <div className="mb-2">
                  <span className="font-semibold text-green-800">
                    {comparison.recommendation.topChoice}
                  </span>
                </div>
                <p className="text-green-700 text-sm mb-3">
                  {comparison.recommendation.reasoning}
                </p>
                {comparison.recommendation.alternatives && comparison.recommendation.alternatives.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-green-800 mb-1">Alternative Options:</div>
                    <div className="flex flex-wrap gap-2">
                      {comparison.recommendation.alternatives.map((alt, index) => (
                        <span key={index} className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          {alt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ranked Proposals */}
          <Card>
            <CardHeader>
              <CardTitle>Proposal Rankings</CardTitle>
              <CardDescription>
                Proposals ranked by AI analysis based on cost, delivery, and compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {comparison.rankedProposals.map((proposal, index) => (
                  <div key={proposal.proposalId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${getRankColor(proposal.rank)}`}>
                          {getRankIcon(proposal.rank)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            #{proposal.rank} - {proposal.vendorName}
                          </h4>
                          <div className="text-sm text-gray-500">
                            Overall Score: {proposal.overallScore}/100
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          proposal.overallScore >= 80 ? 'text-green-600' :
                          proposal.overallScore >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {proposal.overallScore}
                        </div>
                        <div className="text-xs text-gray-500">Score</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Strengths */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                          Strengths
                        </h5>
                        <div className="space-y-1">
                          {proposal.strengths.map((strength, sIndex) => (
                            <div key={sIndex} className="flex items-start">
                              <div className="w-2 h-2 bg-green-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                              <span className="text-sm text-gray-600">{strength}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Weaknesses */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-2 text-orange-600" />
                          Areas for Improvement
                        </h5>
                        <div className="space-y-1">
                          {proposal.weaknesses.map((weakness, wIndex) => (
                            <div key={wIndex} className="flex items-start">
                              <div className="w-2 h-2 bg-orange-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                              <span className="text-sm text-gray-600">{weakness}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading State */}
      {comparisonLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Comparing proposals with AI...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {comparisonError && (
        <Alert>
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load proposal comparison. Please try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ProposalComparison;