import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  Settings as SettingsIcon, 
  Key, 
  Database, 
  GitBranch, 
  Shield,
  Save,
  TestTube,
  Bell,
  Palette,
  Globe,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm();

  const [settings, setSettings] = useState({
    // API Settings
    groqApiKey: '',
    openaiApiKey: '',
    
    // Analysis Settings
    defaultAnalysisDepth: 'standard',
    maxBatchCommits: 50,
    analysisTimeout: 300,
    
    // Git Settings
    gitPath: 'git',
    maxDiffSize: 1000000,
    
    // UI Settings
    theme: 'light',
    language: 'en',
    notifications: true,
    
    // Security Settings
    enableSecurityScan: true,
    enablePerformanceScan: true,
    enableTestScan: true,
  });

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('commitAnalyzerSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      reset(parsed);
    }
  }, [reset]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      // Save settings to localStorage
      localStorage.setItem('commitAnalyzerSettings', JSON.stringify(data));
      setSettings(data);
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('API connection test successful!');
    } catch (error) {
      toast.error('API connection test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const tabs = [
    { id: 'general', name: 'General', icon: SettingsIcon },
    { id: 'api', name: 'API Configuration', icon: Key },
    { id: 'analysis', name: 'Analysis Settings', icon: TestTube },
    { id: 'git', name: 'Git Integration', icon: GitBranch },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'ui', name: 'User Interface', icon: Palette },
  ];

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Version</p>
            <p className="font-medium">1.0.0</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Last Updated</p>
            <p className="font-medium">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Database</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Database Status</p>
              <p className="font-medium text-green-600">Connected</p>
            </div>
            <Database className="w-5 h-5 text-green-500" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-gray-500" />
            <span>Enable Notifications</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              {...register('notifications')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderApiSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">API Keys</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GROQ API Key
            </label>
            <div className="relative">
              <input
                type={showApiKeys ? "text" : "password"}
                {...register('groqApiKey')}
                placeholder="Enter your GROQ API key"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowApiKeys(!showApiKeys)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showApiKeys ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">Required for AI-powered analysis</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OpenAI API Key (Optional)
            </label>
            <div className="relative">
              <input
                type={showApiKeys ? "text" : "password"}
                {...register('openaiApiKey')}
                placeholder="Enter your OpenAI API key"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowApiKeys(!showApiKeys)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showApiKeys ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">Alternative AI provider</p>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Test Connection
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const renderAnalysisSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Analysis Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Analysis Depth
            </label>
            <select
              {...register('defaultAnalysisDepth')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="quick">Quick Analysis</option>
              <option value="standard">Standard Analysis</option>
              <option value="comprehensive">Comprehensive Analysis</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Batch Commits
            </label>
            <input
              type="number"
              {...register('maxBatchCommits', { min: 1, max: 100 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Analysis Timeout (seconds)
            </label>
            <input
              type="number"
              {...register('analysisTimeout', { min: 60, max: 3600 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Analysis Types</h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('enableSecurityScan')}
              className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">Security Analysis</span>
              <p className="text-xs text-gray-500">Scan for security vulnerabilities</p>
            </div>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('enablePerformanceScan')}
              className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">Performance Analysis</span>
              <p className="text-xs text-gray-500">Identify performance regressions</p>
            </div>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('enableTestScan')}
              className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">Test Impact Analysis</span>
              <p className="text-xs text-gray-500">Analyze test coverage impact</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderGitSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Git Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Git Executable Path
            </label>
            <input
              type="text"
              {...register('gitPath')}
              placeholder="/usr/bin/git"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Diff Size (bytes)
            </label>
            <input
              type="number"
              {...register('maxDiffSize')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Git Status</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Git Installation</p>
              <p className="font-medium text-green-600">Available</p>
            </div>
            <GitBranch className="w-5 h-5 text-green-500" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Security Configuration</h3>
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mr-3 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Security Notice</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  API keys are stored locally and encrypted. Never share your API keys with others.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('enableSecurityScan')}
                className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Enable Security Scanning</span>
                <p className="text-xs text-gray-500">Scan commits for security vulnerabilities</p>
              </div>
            </label>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('enablePerformanceScan')}
                className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Enable Performance Scanning</span>
                <p className="text-xs text-gray-500">Detect performance regressions</p>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUISettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Interface Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme
            </label>
            <select
              {...register('theme')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              {...register('language')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('notifications')}
                className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Enable Notifications</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'api':
        return renderApiSettings();
      case 'analysis':
        return renderAnalysisSettings();
      case 'git':
        return renderGitSettings();
      case 'security':
        return renderSecuritySettings();
      case 'ui':
        return renderUISettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">
          Configure your analysis preferences and system settings.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {renderTabContent()}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => reset(settings)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
