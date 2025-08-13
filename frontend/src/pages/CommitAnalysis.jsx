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
      setAnalysisResult(data);
      setIsAnalyzing(false);
      toast.success('Analysis completed successfully!');
    },
    onError: (error) => {
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
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskLevelIcon = (level) => {
    switch (level?.toLowerCase()) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'medium':
        return <Clock className="w-4 h-4" />;
      case 'low':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analyze Commit</h1>
        <p className="text-gray-600">
          Analyze a specific commit for potential regressions and issues using AI-powered analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Analysis Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <Search className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Analysis Configuration</h2>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.repository_path && (
                <p className="mt-1 text-sm text-red-600">{errors.repository_path.message}</p>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.commit_hash && (
                <p className="mt-1 text-sm text-red-600">{errors.commit_hash.message}</p>
              )}
            </div>

            {/* Analysis Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Settings className="w-4 h-4 inline mr-2" />
                Analysis Options
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('include_tests')}
                    defaultChecked
                    className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Include test impact analysis</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('include_performance')}
                    defaultChecked
                    className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Include performance analysis</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('include_security')}
                    defaultChecked
                    className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Include security analysis</span>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Analysis Results */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <FileText className="w-6 h-6 text-green-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Analysis Results</h2>
          </div>

          {!analysisResult && !isAnalyzing && (
            <div className="text-center py-12">
              <Code className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No analysis results yet. Configure and run an analysis to see results here.</p>
            </div>
          )}

          {isAnalyzing && (
            <div className="text-center py-12">
              <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
              <p className="text-gray-600">Analyzing commit...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
            </div>
          )}

          {analysisResult && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Summary</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{analysisResult.summary}</p>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Risk Assessment</h3>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRiskLevelColor(analysisResult.risk_level)}`}>
                    {getRiskLevelIcon(analysisResult.risk_level)}
                    <span className="ml-1">{analysisResult.risk_level} Risk</span>
                  </span>
                  <span className="text-sm text-gray-500">
                    Confidence: {Math.round(analysisResult.confidence * 100)}%
                  </span>
                </div>
              </div>

              {/* Issues Found */}
              {analysisResult.issues && analysisResult.issues.length > 0 && (
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Issues Found</h3>
                  <div className="space-y-3">
                    {analysisResult.issues.map((issue, index) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-start">
                          <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                          <div>
                            <p className="font-medium text-red-800">{issue.title}</p>
                            <p className="text-sm text-red-700 mt-1">{issue.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Recommendations</h3>
                  <div className="space-y-3">
                    {analysisResult.recommendations.map((rec, index) => (
                      <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
                          <div>
                            <p className="font-medium text-blue-800">{rec.title}</p>
                            <p className="text-sm text-blue-700 mt-1">{rec.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </button>
                <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
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
