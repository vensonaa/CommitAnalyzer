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
    <div className="w-full lg:w-64 bg-gradient-to-b from-purple-50 via-pink-50 to-blue-50 shadow-lg border-r border-purple-200 min-h-screen lg:min-h-0">
      <div className="p-6">
        {/* Quick Stats */}
        <div className="mb-8">
          <h3 className="text-sm font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-purple-500 mr-2" />
            Quick Stats
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border border-blue-200 hover:shadow-md transition-all duration-200">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded">
                  <TrendingUp className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">Total Analyses</span>
              </div>
              <span className="text-sm font-bold text-blue-600 bg-white px-2 py-1 rounded-full shadow-sm">{stats.totalAnalyses}</span>
            </div>
            
            <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200 hover:shadow-md transition-all duration-200">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded">
                  <Clock className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">Today</span>
              </div>
              <span className="text-sm font-bold text-green-600 bg-white px-2 py-1 rounded-full shadow-sm">{stats.todayAnalyses}</span>
            </div>
            
            <div className="flex items-center justify-between bg-gradient-to-r from-red-50 to-pink-50 p-3 rounded-lg border border-red-200 hover:shadow-md transition-all duration-200">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-gradient-to-r from-red-500 to-pink-600 rounded">
                  <AlertTriangle className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">High Risk</span>
              </div>
              <span className="text-sm font-bold text-red-600 bg-white px-2 py-1 rounded-full shadow-sm">{stats.highRiskIssues}</span>
            </div>
            
            <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50 p-3 rounded-lg border border-emerald-200 hover:shadow-md transition-all duration-200">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">Avg Confidence</span>
              </div>
              <span className="text-sm font-bold text-emerald-600 bg-white px-2 py-1 rounded-full shadow-sm">{stats.avgConfidence}%</span>
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
