import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  GitBranch,
  Brain,
  Shield
} from 'lucide-react';
import { getSystemStats, getAnalysisHistory } from '../services/api';

const Dashboard = () => {
  // Fetch system stats
  const { data: systemStats, isLoading: statsLoading } = useQuery({
    queryKey: ['systemStats'],
    queryFn: getSystemStats
  });
  
  // Fetch recent analysis history
  const { data: recentHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['recentHistory'],
    queryFn: () => getAnalysisHistory(5, 0)
  });
  
  const stats = [
    {
      name: 'Total Analyses',
      value: systemStats?.total_analyses?.toString() || '0',
      change: '+0%',
      changeType: 'positive',
      icon: TrendingUp,
    },
    {
      name: 'Today\'s Analyses',
      value: systemStats?.today_analyses?.toString() || '0',
      change: '+0',
      changeType: 'positive',
      icon: Clock,
    },
    {
      name: 'High Risk Issues',
      value: systemStats?.risk_distribution?.high?.toString() || '0',
      change: '+0',
      changeType: 'negative',
      icon: AlertTriangle,
    },
    {
      name: 'Average Confidence',
      value: systemStats?.average_confidence ? `${(systemStats.average_confidence * 100).toFixed(1)}%` : '0%',
      change: '+0%',
      changeType: 'positive',
      icon: CheckCircle,
    },
  ];

  const recentActivity = recentHistory?.map((item, index) => ({
    id: index + 1,
    commit: item.commit_hash?.substring(0, 8) || 'N/A',
    message: item.commit_message || 'No message',
    author: item.commit_author?.split('@')[0] || 'Unknown',
    risk: item.risk_level || 'unknown',
    time: new Date(item.timestamp).toLocaleString(),
  })) || [];

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (statsLoading || historyLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Welcome to the Commit Regression Analyzer. Monitor your code quality and detect potential issues.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Icon className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <GitBranch className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.commit} - {activity.message}
                    </p>
                    <p className="text-sm text-gray-500">
                      by {activity.author} • {activity.time}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(activity.risk)}`}>
                  {activity.risk} risk
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Brain className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">AI Engine</h3>
              <p className="text-sm text-gray-500">Ready for analysis</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Security</h3>
              <p className="text-sm text-gray-500">All systems secure</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <GitBranch className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Git Integration</h3>
              <p className="text-sm text-gray-500">Connected and ready</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
