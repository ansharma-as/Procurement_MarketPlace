import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { auditAPI } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import {
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  BarChart3,
  Search,
  Filter,
  Download,
  Play,
  RefreshCw,
  Eye,
  Target
} from 'lucide-react';

const ContractAuditDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [selectedContracts, setSelectedContracts] = useState([]);

  // Fetch audit statistics for admin
  const {
    data: auditStats,
    isLoading: statsLoading
  } = useQuery({
    queryKey: ['audit-statistics'],
    queryFn: () => auditAPI.getAuditStatistics(),
    enabled: user?.role === 'admin',
  });

  // Fetch contract health dashboard for company
  const {
    data: healthDashboard,
    isLoading: dashboardLoading,
    refetch: refetchDashboard
  } = useQuery({
    queryKey: ['contract-health', user?.companyId],
    queryFn: () => auditAPI.getContractHealthDashboard(user?.companyId),
    enabled: !!user?.companyId,
  });

  // Batch audit mutation
  const batchAuditMutation = useMutation({
    mutationFn: (contractIds) => auditAPI.batchAuditContracts(contractIds),
    onSuccess: () => {
      queryClient.invalidateQueries(['contract-health']);
      queryClient.invalidateQueries(['audit-statistics']);
      setSelectedContracts([]);
    },
  });

  const isLoading = statsLoading || dashboardLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = auditStats?.data || {};
  const dashboard = healthDashboard?.data?.dashboard || {};

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

  const getComplianceColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 75) return 'text-yellow-600 bg-yellow-100';
    if (score >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const handleBatchAudit = async () => {
    if (selectedContracts.length === 0) {
      alert('Please select contracts to audit');
      return;
    }

    if (window.confirm(`Run audit on ${selectedContracts.length} selected contracts?`)) {
      await batchAuditMutation.mutateAsync(selectedContracts);
    }
  };

  const filteredContracts = dashboard.contracts?.filter(contract => {
    const matchesSearch = !searchTerm ||
      contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.vendor?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRisk = riskFilter === 'all' || contract.riskLevel === riskFilter;

    return matchesSearch && matchesRisk;
  }) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <ShieldCheck className="h-8 w-8 text-blue-600 mr-3" />
                Contract Audit Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                {user?.role === 'admin'
                  ? 'System-wide contract audit overview and management'
                  : 'Monitor and audit your company contracts for compliance and risk'
                }
              </p>
            </div>

            <div className="flex space-x-2">
              <Button onClick={refetchDashboard} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>

              {selectedContracts.length > 0 && (
                <Button
                  onClick={handleBatchAudit}
                  disabled={batchAuditMutation.isPending}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Audit Selected ({selectedContracts.length})
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* System-wide Statistics (Admin only) */}
        {user?.role === 'admin' && stats && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  System-wide Audit Statistics
                </CardTitle>
                <CardDescription>
                  Overview of audit coverage and performance across all companies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{stats.totalContracts}</div>
                    <div className="text-sm text-gray-600">Total Contracts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{stats.auditedContracts}</div>
                    <div className="text-sm text-gray-600">Audited</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{stats.auditCoverage}%</div>
                    <div className="text-sm text-gray-600">Coverage</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">{stats.avgOverallScore}%</div>
                    <div className="text-sm text-gray-600">Avg Score</div>
                  </div>
                </div>

                {/* Risk Distribution */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Risk Distribution</h4>
                  <div className="grid grid-cols-4 gap-4">
                    {Object.entries(stats.riskDistribution || {}).map(([risk, count]) => (
                      <div key={risk} className="text-center">
                        <div className={`p-3 rounded-lg ${getRiskColor(risk)}`}>
                          <div className="font-bold text-lg">{count}</div>
                          <div className="text-xs capitalize">{risk} Risk</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Company Dashboard Overview */}
        {dashboard && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Contracts</p>
                      <p className="text-2xl font-bold text-gray-900">{dashboard.totalContracts || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Audited</p>
                      <p className="text-2xl font-bold text-gray-900">{dashboard.auditedContracts || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Compliance</p>
                      <p className="text-2xl font-bold text-gray-900">{dashboard.avgComplianceScore || 0}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">High Risk</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {dashboard.riskDistribution?.high || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Key Findings Summary */}
        {dashboard.keyFindings && dashboard.keyFindings.length > 0 && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Key Audit Findings
                </CardTitle>
                <CardDescription>
                  Most critical issues requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard.keyFindings.slice(0, 5).map((finding, index) => (
                    <div key={index} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg">
                      <div className={`p-1 rounded-full ${
                        finding.severity === 'critical' ? 'bg-red-100' :
                        finding.severity === 'high' ? 'bg-orange-100' :
                        finding.severity === 'medium' ? 'bg-yellow-100' :
                        'bg-blue-100'
                      }`}>
                        <AlertTriangle className={`h-4 w-4 ${
                          finding.severity === 'critical' ? 'text-red-600' :
                          finding.severity === 'high' ? 'text-orange-600' :
                          finding.severity === 'medium' ? 'text-yellow-600' :
                          'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{finding.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{finding.description}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                            finding.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            finding.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            finding.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {finding.severity}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search contracts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Risk Filter */}
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
                <option value="critical">Critical Risk</option>
              </select>

              {/* Actions */}
              <div className="flex space-x-2">
                <Button variant="outline" className="flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <span>More Filters</span>
                </Button>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </Button>
              </div>

              {/* Bulk Actions */}
              <div className="flex justify-end">
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedContracts(filteredContracts.map(c => c._id));
                      } else {
                        setSelectedContracts([]);
                      }
                    }}
                    checked={selectedContracts.length === filteredContracts.length && filteredContracts.length > 0}
                    className="rounded border-gray-300"
                  />
                  <span>Select All</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contracts List */}
        {filteredContracts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ShieldCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No contracts found</h3>
              <p className="text-gray-600">
                {searchTerm || riskFilter !== 'all'
                  ? 'Try adjusting your search criteria.'
                  : 'No contracts available for audit.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredContracts.map((contract) => (
              <Card key={contract._id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Selection Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedContracts.includes(contract._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedContracts(prev => [...prev, contract._id]);
                          } else {
                            setSelectedContracts(prev => prev.filter(id => id !== contract._id));
                          }
                        }}
                        className="rounded border-gray-300"
                      />

                      {/* Contract Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{contract.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(contract.riskLevel)}`}>
                            {contract.riskLevel} risk
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Vendor:</span>
                            <span className="ml-2 font-medium">{contract.vendor?.name || 'Unknown'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Value:</span>
                            <span className="ml-2 font-medium">
                              ${contract.contractValue?.toLocaleString() || 'TBD'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Compliance:</span>
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getComplianceColor(contract.complianceScore || 0)}`}>
                              {contract.complianceScore || 0}%
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Last Audit:</span>
                            <span className="ml-2 font-medium">
                              {contract.lastAuditDate
                                ? new Date(contract.lastAuditDate).toLocaleDateString()
                                : 'Never'
                              }
                            </span>
                          </div>
                        </div>

                        {/* Key Issues */}
                        {contract.keyIssues && contract.keyIssues.length > 0 && (
                          <div className="mt-3">
                            <div className="flex flex-wrap gap-2">
                              {contract.keyIssues.slice(0, 3).map((issue, index) => (
                                <span key={index} className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full">
                                  {issue}
                                </span>
                              ))}
                              {contract.keyIssues.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                  +{contract.keyIssues.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>

                      {(!contract.lastAuditDate ||
                        (new Date() - new Date(contract.lastAuditDate)) > 30 * 24 * 60 * 60 * 1000) && (
                        <Button
                          size="sm"
                          onClick={() => batchAuditMutation.mutate([contract._id])}
                          disabled={batchAuditMutation.isPending}
                        >
                          <ShieldCheck className="h-4 w-4 mr-2" />
                          Audit Now
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Load More */}
        {filteredContracts.length > 0 && filteredContracts.length % 20 === 0 && (
          <div className="text-center mt-8">
            <Button variant="outline">Load More Contracts</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractAuditDashboard;