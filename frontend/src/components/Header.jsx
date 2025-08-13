import React from 'react';
import { 
  GitBranch, 
  Shield, 
  Brain, 
  Wifi,
  WifiOff
} from 'lucide-react';

const Header = () => {
  const [apiStatus, setApiStatus] = React.useState('connected');
  const [gitStatus, setGitStatus] = React.useState('ready');
  const [securityStatus, setSecurityStatus] = React.useState('active');
  const [aiStatus, setAiStatus] = React.useState('ready');

  React.useEffect(() => {
    // Simulate status checks
    const checkStatus = async () => {
      try {
        // In a real app, you'd make API calls here
        setApiStatus('connected');
        setGitStatus('ready');
        setSecurityStatus('active');
        setAiStatus('ready');
      } catch (error) {
        setApiStatus('disconnected');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
      case 'ready':
      case 'active':
        return 'text-green-500';
      case 'disconnected':
      case 'error':
        return 'text-red-500';
      default:
        return 'text-yellow-500';
    }
  };

  const getStatusIcon = (status, type) => {
    if (status === 'connected' || status === 'ready' || status === 'active') {
      return type === 'api' ? <Wifi className="w-4 h-4" /> : <Shield className="w-4 h-4" />;
    }
    return type === 'api' ? <WifiOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-primary-600 rounded-lg">
              <GitBranch className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Commit Regression Analyzer
              </h1>
              <p className="text-sm text-gray-500">AI-Powered Code Analysis</p>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className={`${getStatusColor(apiStatus)}`}>
                {getStatusIcon(apiStatus, 'api')}
              </div>
              <span className="text-sm text-gray-600">API Connected</span>
            </div>

            <div className="flex items-center space-x-2">
              <div className={`${getStatusColor(gitStatus)}`}>
                <GitBranch className="w-4 h-4" />
              </div>
              <span className="text-sm text-gray-600">Git Ready</span>
            </div>

            <div className="flex items-center space-x-2">
              <div className={`${getStatusColor(securityStatus)}`}>
                {getStatusIcon(securityStatus, 'security')}
              </div>
              <span className="text-sm text-gray-600">Security Active</span>
            </div>

            <div className="flex items-center space-x-2">
              <div className={`${getStatusColor(aiStatus)}`}>
                <Brain className="w-4 h-4" />
              </div>
              <span className="text-sm text-gray-600">AI Engine</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
