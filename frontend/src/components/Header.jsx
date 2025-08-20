import React from 'react';
import { 
  GitBranch, 
  Shield, 
  Brain, 
  Wifi,
  WifiOff,
  Menu
} from 'lucide-react';

const Header = ({ onMenuClick }) => {
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
    <header className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 shadow-lg border-b border-purple-400">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center h-auto sm:h-16 py-4 sm:py-0">
          {/* Logo and Title */}
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg border border-white/30">
                <GitBranch className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                  Commit Regression Analyzer
                </h1>
                <p className="text-sm text-white/80 font-medium">AI-Powered Code Analysis</p>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-200"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center space-x-2 sm:space-x-6 mt-4 sm:mt-0 flex-wrap justify-center">
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
              <div className={`${getStatusColor(apiStatus)} drop-shadow-lg`}>
                {getStatusIcon(apiStatus, 'api')}
              </div>
              <span className="text-sm text-white font-medium">API Connected</span>
            </div>

            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
              <div className={`${getStatusColor(gitStatus)} drop-shadow-lg`}>
                <GitBranch className="w-4 h-4" />
              </div>
              <span className="text-sm text-white font-medium">Git Ready</span>
            </div>

            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
              <div className={`${getStatusColor(securityStatus)} drop-shadow-lg`}>
                {getStatusIcon(securityStatus, 'security')}
              </div>
              <span className="text-sm text-white font-medium">Security Active</span>
            </div>

            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
              <div className={`${getStatusColor(aiStatus)} drop-shadow-lg`}>
                <Brain className="w-4 h-4" />
              </div>
              <span className="text-sm text-white font-medium">AI Engine</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
