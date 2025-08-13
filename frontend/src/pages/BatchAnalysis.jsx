import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  Layers, 
  GitBranch, 
  Hash, 
  Settings, 
  Play, 
  Pause, 
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  Download,
  BarChart3,
  Users,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { startBatchAnalysis, pollBatchStatus } from '../services/api';

const BatchAnalysis = () => {
  const [batchTask, setBatchTask] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const batchMutation = useMutation({
    mutationFn: startBatchAnalysis,
    onSuccess: (data) => {
      setBatchTask(data);
      setIsRunning(true);
      startPolling(data.task_id);
      toast.success('Batch analysis started successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to start batch analysis.');
    },
  });

  const startPolling = (taskId) => {
    pollBatchStatus(
      taskId,
      (status) => {
        setProgress(status.progress || 0);
        setBatchTask(status);
      },
      (result) => {
        setIsRunning(false);
        setProgress(100);
        setBatchTask(result);
        toast.success('Batch analysis completed!');
      },
      (error) => {
        setIsRunning(false);
        toast.error(error.message || 'Batch analysis failed.');
      }
    );
  };

  const onSubmit = (data) => {
    setBatchTask(null);
    setProgress(0);
    setIsRunning(false);
    batchMutation.mutate(data);
  };

  const handleReset = () => {
    reset();
    setBatchTask(null);
    setProgress(0);
    setIsRunning(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'running': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5" />;
      case 'failed': return <AlertTriangle className="w-5 h-5" />;
      case 'running': return <Clock className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Batch Analysis</h1>
        <p className="text-gray-600">
          Analyze multiple commits in a batch for comprehensive regression detection across your codebase.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Batch Configuration */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <Layers className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Batch Configuration</h2>
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

            {/* Commit Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Hash className="w-4 h-4 inline mr-2" />
                  Start Commit
                </label>
                <input
                  type="text"
                  {...register('start_commit', { required: 'Start commit is required' })}
                  placeholder="a1b2c3d4..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.start_commit && (
                  <p className="mt-1 text-sm text-red-600">{errors.start_commit.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Hash className="w-4 h-4 inline mr-2" />
                  End Commit
                </label>
                <input
                  type="text"
                  {...register('end_commit', { required: 'End commit is required' })}
                  placeholder="e5f6g7h8..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.end_commit && (
                  <p className="mt-1 text-sm text-red-600">{errors.end_commit.message}</p>
                )}
              </div>
            </div>

            {/* Max Commits */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Commits to Analyze
              </label>
              <input
                type="number"
                {...register('max_commits', { 
                  required: 'Max commits is required',
                  min: { value: 1, message: 'Must be at least 1' },
                  max: { value: 100, message: 'Maximum 100 commits' }
                })}
                defaultValue={20}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.max_commits && (
                <p className="mt-1 text-sm text-red-600">{errors.max_commits.message}</p>
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

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isRunning || batchMutation.isPending}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Running...
                  </>
                ) : batchMutation.isPending ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Batch Analysis
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={isRunning}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Batch Progress & Results */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <BarChart3 className="w-6 h-6 text-green-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Progress & Results</h2>
          </div>

          {!batchTask && !isRunning && (
            <div className="text-center py-12">
              <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No batch analysis running. Configure and start a batch analysis to see progress here.</p>
            </div>
          )}

          {batchTask && (
            <div className="space-y-6">
              {/* Task Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">Task ID: {batchTask.task_id}</h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(batchTask.status)}`}>
                    {getStatusIcon(batchTask.status)}
                    <span className="ml-1">{batchTask.status}</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Total Commits:</span>
                    <span className="ml-2 font-medium">{batchTask.total_commits || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Analyzed:</span>
                    <span className="ml-2 font-medium">{batchTask.analyzed_commits || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Issues Found:</span>
                    <span className="ml-2 font-medium text-red-600">{batchTask.issues_found || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Started:</span>
                    <span className="ml-2 font-medium">{new Date(batchTask.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {isRunning && (
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Current Activity */}
              {batchTask.current_commit && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Currently Analyzing</h4>
                  <div className="flex items-center space-x-3">
                    <Hash className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        {batchTask.current_commit.hash}
                      </p>
                      <p className="text-xs text-blue-600">
                        {batchTask.current_commit.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Results Summary */}
              {batchTask.status === 'completed' && batchTask.results && (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Analysis Summary</h3>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-green-800">Safe Commits</p>
                          <p className="text-lg font-bold text-green-900">{batchTask.results.safe_commits || 0}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-red-800">Risky Commits</p>
                          <p className="text-lg font-bold text-red-900">{batchTask.results.risky_commits || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Issues */}
                  {batchTask.results.top_issues && batchTask.results.top_issues.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Top Issues Found</h4>
                      <div className="space-y-2">
                        {batchTask.results.top_issues.slice(0, 3).map((issue, index) => (
                          <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-start">
                              <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                              <div>
                                <p className="font-medium text-red-800">{issue.title}</p>
                                <p className="text-sm text-red-700 mt-1">Found in {issue.affected_commits} commits</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                      <Download className="w-4 h-4 mr-2" />
                      Download Report
                    </button>
                    <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      View Details
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchAnalysis;
