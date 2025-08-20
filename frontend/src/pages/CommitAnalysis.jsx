import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  Search, 
  GitBranch, 
  Hash, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  FileText,
  Code,
  Shield,
  Zap,
  Download,
  RotateCcw
} from 'lucide-react';
import { analyzeCommit } from '../services/api';

const CommitAnalysis = () => {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const analysisMutation = useMutation({
    mutationFn: analyzeCommit,
    onSuccess: (data) => {
      console.log('Analysis result received:', data);
      setAnalysisResult(data);
      setIsAnalyzing(false);
      toast.success('Analysis completed successfully!');
    },
    onError: (error) => {
      console.error('Analysis error:', error);
      setIsAnalyzing(false);
      toast.error(error.message || 'Analysis failed. Please try again.');
    },
  });

  const onSubmit = (data) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    analysisMutation.mutate(data);
  };

  const handleReset = () => {
    reset();
    setAnalysisResult(null);
  };

  const getRiskLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'critical': return 'bg-gradient-to-r from-red-500 to-pink-600 text-white border-red-400 shadow-lg';
      case 'high': return 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-400 shadow-lg';
      case 'medium': return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-yellow-400 shadow-lg';
      case 'low': return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-400 shadow-lg';
      default: return 'bg-gradient-to-r from-gray-500 to-slate-600 text-white border-gray-400 shadow-lg';
    }
  };

  const getRiskLevelIcon = (level) => {
    switch (level?.toLowerCase()) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-white" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-white" />;
      case 'medium':
        return <Clock className="w-4 h-4 text-white" />;
      case 'low':
        return <CheckCircle className="w-4 h-4 text-white" />;
      default:
        return <FileText className="w-4 h-4 text-white" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
          50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8); }
        }
        .pulse-glow {
          animation: pulse-glow 2s infinite;
        }
      `}</style>
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-2">
          Analyze Commit
        </h1>
        <p className="text-gray-600 text-lg">
          Analyze a specific commit for potential regressions and issues using AI-powered analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Analysis Form */}
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg border border-blue-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg mr-3">
              <Search className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Analysis Configuration
            </h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Repository Path */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <GitBranch className="w-4 h-4 inline mr-2" />
                Repository Path
              </label>
              <input
                type="text"
                {...register('repository_path', { required: 'Repository path is required' })}
                placeholder="/path/to/your/repository"
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-200 bg-white/80 backdrop-blur-sm"
              />
              {errors.repository_path && (
                <p className="mt-1 text-sm text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                  ⚠️ {errors.repository_path.message}
                </p>
              )}
            </div>

            {/* Commit Hash */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Hash className="w-4 h-4 inline mr-2" />
                Commit Hash
              </label>
              <input
                type="text"
                {...register('commit_hash', { required: 'Commit hash is required' })}
                placeholder="a1b2c3d4e5f6..."
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all duration-200 bg-white/80 backdrop-blur-sm"
              />
              {errors.commit_hash && (
                <p className="mt-1 text-sm text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                  ⚠️ {errors.commit_hash.message}
                </p>
              )}
            </div>

            {/* Analysis Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Settings className="w-4 h-4 inline mr-2" />
                Analysis Options
              </label>
              <div className="space-y-3">
                              <label className="flex items-center p-2 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200">
                <input
                  type="checkbox"
                  {...register('include_tests')}
                  defaultChecked
                  className="mr-3 rounded border-2 border-green-300 text-green-600 focus:ring-green-500 focus:ring-offset-2"
                />
                <span className="text-sm font-medium text-gray-700">Include test impact analysis</span>
              </label>
              <label className="flex items-center p-2 rounded-lg hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-all duration-200">
                <input
                  type="checkbox"
                  {...register('include_performance')}
                  defaultChecked
                  className="mr-3 rounded border-2 border-orange-300 text-orange-600 focus:ring-orange-500 focus:ring-offset-2"
                />
                <span className="text-sm font-medium text-gray-700">Include performance analysis</span>
              </label>
              <label className="flex items-center p-2 rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200">
                <input
                  type="checkbox"
                  {...register('include_security')}
                  defaultChecked
                  className="mr-3 rounded border-2 border-purple-300 text-purple-600 focus:ring-purple-500 focus:ring-offset-2"
                />
                <span className="text-sm font-medium text-gray-700">Include security analysis</span>
              </label>
              </div>
            </div>

            {/* Analysis Depth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Analysis Depth
              </label>
              <select
                {...register('analysis_depth')}
                defaultValue="standard"
                className="w-full px-4 py-3 border-2 border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-400 transition-all duration-200 bg-white/80 backdrop-blur-sm"
              >
                <option value="quick">Quick Analysis</option>
                <option value="standard">Standard Analysis</option>
                <option value="comprehensive">Comprehensive Analysis</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isAnalyzing}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                {isAnalyzing ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Analyze Commit
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-3 border-2 border-pink-300 text-pink-600 rounded-lg hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-200"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Analysis Results */}
        <div className="bg-gradient-to-br from-white to-green-50 rounded-xl shadow-lg border border-green-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg mr-3">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Analysis Results
            </h2>
          </div>

          {!analysisResult && !isAnalyzing && (
            <div className="text-center py-12">
              <div className="p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Code className="w-10 h-10 text-blue-600" />
              </div>
              <p className="text-gray-600 text-lg">No analysis results yet.</p>
              <p className="text-gray-500">Configure and run an analysis to see results here.</p>
            </div>
          )}

          {isAnalyzing && (
            <div className="text-center py-12">
              <div className="p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <div className="loading-spinner w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-700 text-lg font-medium">Analyzing commit...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
            </div>
          )}

          {analysisResult && (
            <div className="space-y-6">
              {/* Debug Info */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg p-4 mb-4 shadow-md">
                <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                  Debug Info
                </h4>
                <pre className="text-xs text-yellow-700 overflow-auto bg-white/50 rounded p-2">
                  {JSON.stringify(analysisResult, null, 2)}
                </pre>
              </div>
              {/* Risk Assessment */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-medium bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-3 flex items-center">
                  <Shield className="w-5 h-5 text-red-500 mr-2" />
                  Risk Assessment
                </h3>
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold border-2 shadow-lg transform hover:scale-105 transition-all duration-200 ${getRiskLevelColor(analysisResult.risk_level)}`}>
                    {getRiskLevelIcon(analysisResult.risk_level)}
                    <span className="ml-2">{analysisResult.risk_level.toUpperCase()} Risk</span>
                  </span>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-lg border border-blue-200">
                    <span className="text-sm font-bold text-blue-700">
                      Confidence: {Math.round(analysisResult.confidence_score * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Regressions Found */}
              {analysisResult.regressions && analysisResult.regressions.length > 0 && (
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-medium bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-3 flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                    Regressions Found
                  </h3>
                  <div className="space-y-3">
                    {analysisResult.regressions.map((regression, index) => (
                      <div key={index} className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-start">
                          <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg mr-3">
                            <AlertTriangle className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-red-800">{regression.type || 'Regression'}</p>
                            <p className="text-sm text-red-700 mt-1">{regression.description}</p>
                            {regression.affected_files && (
                              <p className="text-xs text-red-600 mt-1 bg-red-100 px-2 py-1 rounded">
                                Files: {regression.affected_files.join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {analysisResult.suggestions && analysisResult.suggestions.length > 0 && (
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-medium bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-3 flex items-center">
                    <CheckCircle className="w-5 h-5 text-blue-500 mr-2" />
                    Suggestions
                  </h3>
                  <div className="space-y-3">
                    {analysisResult.suggestions.map((suggestion, index) => (
                      <div key={index} className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-start">
                          <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg mr-3">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-blue-800">{suggestion.title}</p>
                            <p className="text-sm text-blue-700 mt-1">{suggestion.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Code Review Details */}
              {analysisResult.details && (
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-medium bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3 flex items-center">
                    <Code className="w-5 h-5 text-purple-500 mr-2" />
                    Code Review Details
                  </h3>
                  
                                     {/* Overall Score */}
                   {analysisResult.details.overall_score && (
                     <div className="mb-4">
                       <h4 className="text-md font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">Overall Score</h4>
                       <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                         <div className="flex items-center">
                           <div className="flex-1 bg-gray-200 rounded-full h-3 mr-3 shadow-inner">
                             <div 
                               className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full shadow-sm transition-all duration-500" 
                               style={{width: `${analysisResult.details.overall_score}%`}}
                             ></div>
                           </div>
                           <span className="text-sm font-bold text-gray-700 bg-white px-3 py-1 rounded-full shadow-sm">
                             {analysisResult.details.overall_score}/100
                           </span>
                         </div>
                       </div>
                     </div>
                   )}

                                     {/* Code Quality */}
                   {analysisResult.details.code_quality && (
                     <div className="mb-4">
                       <h4 className="text-md font-medium bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2 flex items-center">
                         <Code className="w-4 h-4 text-emerald-500 mr-2" />
                         Code Quality
                       </h4>
                       <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
                         <div className="flex items-center mb-3">
                           <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                             Score: {analysisResult.details.code_quality.score}/100
                           </div>
                         </div>
                         {analysisResult.details.code_quality.issues && analysisResult.details.code_quality.issues.length > 0 && (
                           <div className="mt-3">
                             <p className="text-sm font-bold text-emerald-800 mb-2">Issues Found:</p>
                             <ul className="text-sm text-emerald-700 space-y-2">
                               {analysisResult.details.code_quality.issues.map((issue, idx) => (
                                 <li key={idx} className="flex items-start bg-white/60 p-2 rounded border border-emerald-200">
                                   <span className="text-red-500 mr-2 font-bold">⚠️</span>
                                   {issue}
                                 </li>
                               ))}
                             </ul>
                           </div>
                         )}
                       </div>
                     </div>
                   )}

                  {/* Security Issues */}
                  {analysisResult.details.security_issues && analysisResult.details.security_issues.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-md font-medium bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-2 flex items-center">
                        <Shield className="w-4 h-4 text-red-500 mr-2" />
                        Security Issues
                      </h4>
                      <div className="space-y-3">
                        {analysisResult.details.security_issues.map((issue, index) => (
                          <div key={index} className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200">
                            <div className="flex items-start">
                              <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg mr-3">
                                <Shield className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-bold text-red-800">{issue.type}</p>
                                <p className="text-xs text-red-700 mt-1">{issue.description}</p>
                                {issue.file && (
                                  <p className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded mt-2 inline-block">
                                    📁 {issue.file}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Performance Issues */}
                  {analysisResult.details.performance_issues && analysisResult.details.performance_issues.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-md font-medium bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-2 flex items-center">
                        <Zap className="w-4 h-4 text-yellow-500 mr-2" />
                        Performance Issues
                      </h4>
                      <div className="space-y-3">
                        {analysisResult.details.performance_issues.map((issue, index) => (
                          <div key={index} className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200">
                            <div className="flex items-start">
                              <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg mr-3">
                                <Zap className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-bold text-yellow-800">{issue.type}</p>
                                <p className="text-xs text-yellow-700 mt-1">{issue.description}</p>
                                {issue.file && (
                                  <p className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded mt-2 inline-block">
                                    📁 {issue.file}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-200 shadow-lg">
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </button>
                <button className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-3 rounded-lg hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transform hover:scale-105 transition-all duration-200 shadow-lg">
                  <Shield className="w-4 h-4 mr-2" />
                  View Fixes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommitAnalysis;
