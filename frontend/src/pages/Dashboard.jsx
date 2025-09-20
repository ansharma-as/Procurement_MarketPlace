import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { rfpAPI, proposalAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  FileText,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  ShieldCheck,
  Award
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: rfpsData, isLoading: rfpsLoading } = useQuery({
    queryKey: ['dashboard-rfps'],
    queryFn: () => rfpAPI.getAll({ limit: 1000 }), // Fetch a large number to get a count
    enabled: !!user, // Only fetch if user is logged in
  });

  const { data: proposalsData, isLoading: proposalsLoading } = useQuery({
    queryKey: ['dashboard-proposals'],
    queryFn: () => proposalAPI.getAll({ limit: 1000 }), // Fetch a large number to get a count
    enabled: !!user, // Only fetch if user is logged in
  });

  const { data: recentRfpsData, isLoading: recentRfpsLoading } = useQuery({
    queryKey: ['dashboard-recent-rfps'],
    queryFn: () => rfpAPI.getAll({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
    enabled: !!user,
  });

  const { data: recentProposalsData, isLoading: recentProposalsLoading } = useQuery({
    queryKey: ['dashboard-recent-proposals'],
    queryFn: () => proposalAPI.getAll({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
    enabled: !!user,
  });

  const recentRfpsArray = Array.isArray(recentRfpsData?.data?.data) ? recentRfpsData.data.data : [];
  const recentProposalsArray = Array.isArray(recentProposalsData?.data?.data) ? recentProposalsData.data.data : [];

  const recentActivity = recentRfpsArray.map(rfp => ({ ...rfp, type: 'rfp_created' }))
    .concat(recentProposalsArray.map(q => ({ ...q, type: 'proposal_received' })))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // Mock data for stats that don't have API endpoints yet
  const stats = {
    totalValue: 2400000,
    averageScore: 87,
    pendingApprovals: 5,
  };

  const getStatCards = () => {
    const rfpsArray = Array.isArray(rfpsData?.data?.data) ? rfpsData.data.data : [];
    const proposalsArray = Array.isArray(proposalsData?.data?.data) ? proposalsData.data.data : [];

    const activeRFPs = rfpsArray.filter(rfp => rfp.status === 'published').length;
    const totalProposals = proposalsArray.length;

    const baseStats = [
      {
        title: 'Active RFPs',
        value: rfpsLoading ? 'Loading...' : activeRFPs,
        icon: FileText,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
      },
      {
        title: 'Total Proposals',
        value: proposalsLoading ? 'Loading...' : totalProposals,
        icon: Users,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
      },
      {
        title: 'Total Value',
        value: `${(stats.totalValue / 1000000).toFixed(1)}M`,
        icon: DollarSign,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
      },
      {
        title: 'Average Score',
        value: `${stats.averageScore}%`,
        icon: TrendingUp,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
      },
    ];

    // Add role-specific stats
    if (user?.role === 'admin') {
      baseStats.push({
        title: 'Pending Approvals',
        value: stats.pendingApprovals,
        icon: AlertTriangle,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
      });
    }

    return baseStats;
  };

  const getQuickActions = () => {
    const actions = [];

    if (user?.role === 'procurement_officer' || user?.role === 'admin') {
      actions.push(
        { title: 'Create Market Request', description: 'Start a new procurement process', path: '/market-requests/create', icon: FileText },
        { title: 'View Analytics', description: 'Check procurement insights', path: '/analytics', icon: BarChart3 },
      );
    }

    if (user?.role === 'vendor') {
      actions.push(
        { title: 'Browse Market Requests', description: 'Find new opportunities', path: '/market-requests', icon: FileText },
        { title: 'Submit Proposal', description: 'Respond to a request', path: '/proposals/create', icon: Award },
      );
    }

    if (user?.role === 'admin') {
      actions.push(
        { title: 'Contract Audit', description: 'Review contract compliance', path: '/audit', icon: ShieldCheck },
        { title: 'User Management', description: 'Manage system users', path: '/users', icon: Users },
      );
    }

    return actions;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'rfp_created':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'proposal_received':
        return <Award className="h-4 w-4 text-green-600" />;
      case 'contract_signed':
        return <CheckCircle className="h-4 w-4 text-purple-600" />;
      case 'audit_completed':
        return <ShieldCheck className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="mt-2 text-gray-600">
            Here's what's happening with your procurement activities today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {getStatCards().map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks based on your role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getQuickActions().map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <div
                        key={index}
                        className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                        onClick={() => navigate(action.path)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Icon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{action.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest updates from your procurement processes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(recentRfpsLoading || recentProposalsLoading) && <p>Loading recent activity...</p>}
                  {(!recentRfpsLoading && !recentProposalsLoading && recentActivity.length === 0) && <p>No recent activity.</p>}
                  {recentActivity.map((activity) => (
                    <div key={activity._id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-xs text-gray-500">{new Date(activity.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button variant="outline" className="w-full">
                    View All Activity
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Notifications and Alerts */}
          <div className="space-y-6">
            {/* Pending Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <span>Pending Items</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">RFP Reviews</p>
                      <p className="text-xs text-gray-600">3 items</p>
                    </div>
                    <Button size="sm" variant="outline">View</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Contract Approvals</p>
                      <p className="text-xs text-gray-600">2 items</p>
                    </div>
                    <Button size="sm" variant="outline">View</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Cost Savings</span>
                      <span className="font-medium text-green-600">+12.5%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Compliance Score</span>
                      <span className="font-medium text-blue-600">87%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '87%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Process Efficiency</span>
                      <span className="font-medium text-purple-600">92%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;