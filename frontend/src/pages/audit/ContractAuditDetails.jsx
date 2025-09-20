import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { auditAPI } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import {
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  User,
  Calendar,
  FileText,
  Target,
  Edit,
  Save,
  Download
} from 'lucide-react';

const ContractAuditDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('latest');
  const [editingFinding, setEditingFinding] = useState(null);
  const [findingUpdates, setFindingUpdates] = useState({});

  const {
    data: auditHistoryData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['contract-audit-history', id],
    queryFn: () => auditAPI.getContractAuditHistory(id),
    enabled: !!id,
  });

  const {
    data: latestAuditData,
  } = useQuery({
    queryKey: ['latest-audit', id],
    queryFn: () => auditAPI.getLatestAuditResult(id),
    enabled: !!id,
  });

  const updateFindingMutation = useMutation({
    mutationFn: ({ auditIndex, findingIndex, updates }) =>
      auditAPI.updateAuditFinding(id, auditIndex, findingIndex, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['contract-audit-history', id]);
      queryClient.invalidateQueries(['latest-audit', id]);
      setEditingFinding(null);
      setFindingUpdates({});
    },
  });

  const runAuditMutation = useMutation({
    mutationFn: () => auditAPI.auditContract(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['contract-audit-history', id]);
      queryClient.invalidateQueries(['latest-audit', id]);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !auditHistoryData?.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Audit History Not Found</h2>
          <p className="text-gray-600 mb-4">Unable to load audit history for this contract.</p>
          <Button onClick={() => navigate('/audit')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const { contractTitle, auditHistory } = auditHistoryData.data;
  const latestAudit = latestAuditData?.data?.latestAudit;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'text-red-700 bg-red-100 border-red-200';
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved':
        return 'text-green-600 bg-green-100';
      case 'acknowledged':
        return 'text-blue-600 bg-blue-100';
      case 'closed':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-orange-600 bg-orange-100';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'critical':
        return 'text-red-700 bg-red-200';
      default:
        return 'text-gray-600 bg-gray-100';
    }
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

  const handleUpdateFinding = async (auditIndex, findingIndex, finding) => {
    const updates = findingUpdates[`${auditIndex}-${findingIndex}`] || {};
    if (Object.keys(updates).length === 0) {
      setEditingFinding(null);
      return;
    }

    await updateFindingMutation.mutateAsync({ auditIndex, findingIndex, updates });
  };

  const handleFieldChange = (auditIndex, findingIndex, field, value) => {
    const key = `${auditIndex}-${findingIndex}`;
    setFindingUpdates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const tabs = [
    { id: 'latest', label: 'Latest Audit' },
    { id: 'history', label: 'Audit History' },
    { id: 'trends', label: 'Trends & Analytics' },
  ];

  const canEdit = user?.role === 'admin' || user?.role === 'procurement_officer';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/audit')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <ShieldCheck className="h-8 w-8 text-blue-600 mr-3" />
                Contract Audit Details
              </h1>
              <p className="text-gray-600 mt-1">{contractTitle}</p>
              <p className="text-sm text-gray-500 mt-1">
                {auditHistory.length} audit{auditHistory.length !== 1 ? 's' : ''} performed
              </p>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={() => runAuditMutation.mutate()}
                disabled={runAuditMutation.isPending}
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                {runAuditMutation.isPending ? 'Running...' : 'Run New Audit'}
              </Button>

              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* Latest Audit Summary */}
        {latestAudit && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Overall Score</p>
                      <p className="text-2xl font-bold text-gray-900">{latestAudit.overallScore}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Compliance Score</p>
                      <p className="text-2xl font-bold text-gray-900">{latestAudit.complianceScore}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <AlertTriangle className="h-8 w-8 text-orange-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Risk Level</p>
                      <span className={`px-2 py-1 rounded-full text-sm font-medium ${getRiskColor(latestAudit.riskLevel)}`}>
                        {latestAudit.riskLevel}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-purple-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Findings</p>
                      <p className="text-2xl font-bold text-gray-900">{latestAudit.findings?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
        {activeTab === 'latest' && latestAudit && (
          <div className="space-y-6">
            {/* Audit Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Latest Audit Overview</CardTitle>
                <CardDescription>
                  Audit performed on {formatDate(latestAudit.auditDate)} by {latestAudit.auditedBy}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Audit Type</h4>
                    <p className="text-gray-600 capitalize">{latestAudit.auditType}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Audit Date</h4>
                    <p className="text-gray-600">{formatDate(latestAudit.auditDate)}</p>
                  </div>
                </div>

                {/* Recommendations */}
                {latestAudit.recommendations && latestAudit.recommendations.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Key Recommendations</h4>
                    <div className="space-y-2">
                      {latestAudit.recommendations.map((rec, index) => (
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

            {/* Findings */}
            <Card>
              <CardHeader>
                <CardTitle>Audit Findings</CardTitle>
                <CardDescription>
                  Detailed findings from the latest audit
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {latestAudit.findings && latestAudit.findings.length > 0 ? (
                    latestAudit.findings.map((finding, findingIndex) => (
                      <div
                        key={findingIndex}
                        className={`border-l-4 p-4 bg-white rounded-lg border ${getSeverityColor(finding.severity)}`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-medium text-gray-900">{finding.title}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(finding.severity)}`}>
                                {finding.severity}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(finding.status || 'open')}`}>
                                {finding.status || 'open'}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-3">{finding.description}</p>

                            {/* Recommendation */}
                            {finding.recommendation && (
                              <div className="mb-3">
                                <h5 className="font-medium text-gray-900 mb-1">Recommendation:</h5>
                                <p className="text-sm text-gray-600">{finding.recommendation}</p>
                              </div>
                            )}

                            {/* Editable Fields */}
                            {editingFinding === `${auditHistory.length - 1}-${findingIndex}` ? (
                              <div className="space-y-3 mt-4 p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                  </label>
                                  <select
                                    value={findingUpdates[`${auditHistory.length - 1}-${findingIndex}`]?.status || finding.status || 'open'}
                                    onChange={(e) => handleFieldChange(auditHistory.length - 1, findingIndex, 'status', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                  >
                                    <option value="open">Open</option>
                                    <option value="acknowledged">Acknowledged</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Resolution Notes
                                  </label>
                                  <textarea
                                    value={findingUpdates[`${auditHistory.length - 1}-${findingIndex}`]?.resolution || finding.resolution || ''}
                                    onChange={(e) => handleFieldChange(auditHistory.length - 1, findingIndex, 'resolution', e.target.value)}
                                    placeholder="Add resolution notes..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Assigned To
                                  </label>
                                  <input
                                    type="text"
                                    value={findingUpdates[`${auditHistory.length - 1}-${findingIndex}`]?.assignedTo || finding.assignedTo || ''}
                                    onChange={(e) => handleFieldChange(auditHistory.length - 1, findingIndex, 'assignedTo', e.target.value)}
                                    placeholder="User ID or email"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                  />
                                </div>

                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateFinding(auditHistory.length - 1, findingIndex, finding)}
                                    disabled={updateFindingMutation.isPending}
                                  >
                                    <Save className="h-4 w-4 mr-2" />
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingFinding(null);
                                      setFindingUpdates({});
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                {/* Resolution Info */}
                                {finding.resolution && (
                                  <div className="mb-2">
                                    <h5 className="font-medium text-gray-900 mb-1">Resolution:</h5>
                                    <p className="text-sm text-gray-600">{finding.resolution}</p>
                                  </div>
                                )}

                                {/* Assignment Info */}
                                {finding.assignedTo && (
                                  <div className="mb-2 flex items-center space-x-2 text-sm text-gray-600">
                                    <User className="h-4 w-4" />
                                    <span>Assigned to: {finding.assignedTo}</span>
                                  </div>
                                )}

                                {/* Resolved Date */}
                                {finding.resolvedAt && (
                                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <Calendar className="h-4 w-4" />
                                    <span>Resolved: {formatDate(finding.resolvedAt)}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          {canEdit && (
                            <div className="flex space-x-1">
                              {editingFinding === `${auditHistory.length - 1}-${findingIndex}` ? null : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingFinding(`${auditHistory.length - 1}-${findingIndex}`)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Issues Found</h3>
                      <p className="text-gray-600">This contract audit found no compliance or risk issues.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            {auditHistory.map((audit, auditIndex) => (
              <Card key={auditIndex}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <ShieldCheck className="h-5 w-5" />
                        <span>Audit #{auditHistory.length - auditIndex}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(audit.riskLevel)}`}>
                          {audit.riskLevel} risk
                        </span>
                      </CardTitle>
                      <CardDescription>
                        {formatDate(audit.auditDate)} • {audit.auditType} • {audit.auditedBy}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{audit.overallScore}%</div>
                      <div className="text-sm text-gray-600">Overall Score</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{audit.complianceScore}%</div>
                      <div className="text-sm text-gray-600">Compliance</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">{audit.findings?.length || 0}</div>
                      <div className="text-sm text-gray-600">Findings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {audit.findings?.filter(f => f.status === 'resolved').length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Resolved</div>
                    </div>
                  </div>

                  {/* Findings Summary */}
                  {audit.findings && audit.findings.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Findings Summary</h4>
                      <div className="space-y-2">
                        {audit.findings.map((finding, findingIndex) => (
                          <div key={findingIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center space-x-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(finding.severity)}`}>
                                {finding.severity}
                              </span>
                              <span className="text-sm">{finding.title}</span>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(finding.status || 'open')}`}>
                              {finding.status || 'open'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Audit Trends & Analytics</CardTitle>
                <CardDescription>
                  Performance trends over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Coming Soon</h3>
                  <p className="text-gray-600">
                    Detailed trend analysis and performance metrics will be available here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractAuditDetails;