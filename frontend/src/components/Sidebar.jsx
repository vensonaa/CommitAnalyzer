import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Layers, 
  History, 
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const [stats, setStats] = React.useState({
    totalAnalyses: 0,
    todayAnalyses: 0,
    highRiskIssues: 0,
    avgConfidence: 0
  });

  React.useEffect(() => {
    // Simulate fetching stats
    setStats({
      totalAnalyses: 1247,
      todayAnalyses: 23,
      highRiskIssues: 8,
      avgConfidence: 87.5
    });
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Analyze Commit', href: '/analyze', icon: Search },
    { name: 'Batch Analysis', href: '/batch', icon: Layers },
    { name: 'History', href: '/history', icon: History },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <div className="p-6">
        {/* Quick Stats */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600">Total Analyses</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{stats.totalAnalyses}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Today</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{stats.todayAnalyses}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-gray-600">High Risk</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{stats.highRiskIssues}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Avg Confidence</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{stats.avgConfidence}%</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon
                  className={`mr-3 h-5 w-5 ${
                    isActive(item.href) ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Recent Activity */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="text-sm">
              <p className="text-gray-900 font-medium">Commit a1b2c3d4 analyzed</p>
              <p className="text-gray-500">2 minutes ago</p>
            </div>
            <div className="text-sm">
              <p className="text-gray-900 font-medium">Batch analysis completed</p>
              <p className="text-gray-500">15 minutes ago</p>
            </div>
            <div className="text-sm">
              <p className="text-gray-900 font-medium">High risk issue detected</p>
              <p className="text-gray-500">1 hour ago</p>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-4">System Status</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Backend API</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-xs text-green-600">Online</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">AI Engine</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-xs text-green-600">Ready</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-xs text-green-600">Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
