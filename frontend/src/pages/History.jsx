import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  History as HistoryIcon, 
  Search, 
  Filter, 
  Download, 
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Calendar,
  User,
  GitBranch,
  TrendingUp,
  RefreshCw,
  Wrench,
  FileText,
  Code,
  Star
} from 'lucide-react';
import { getAnalysisHistory, getAnalysisResult, getFixSuggestions, getCodeReview } from '../services/api';

const History = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportFiltered, setExportFiltered] = useState(true);
  const [selectedFixes, setSelectedFixes] = useState(null);
  const [showFixesModal, setShowFixesModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const limit = 20;

  const { data: history, isLoading, error, refetch } = useQuery({
    queryKey: ['analysisHistory', page, limit],
    queryFn: () => getAnalysisHistory(limit, page * limit),
    keepPreviousData: true,
  });

  const filteredHistory = history?.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.commit_hash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.commit_message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.commit_author?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRisk = riskFilter === 'all' || item.risk_level === riskFilter;
    
    return matchesSearch && matchesRisk;
  }) || [];

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
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const truncateHash = (hash) => {
    return hash ? `${hash.substring(0, 8)}...` : 'N/A';
  };

  const truncateMessage = (message) => {
    return message && message.length > 50 ? `${message.substring(0, 50)}...` : message;
  };

  const handleViewDetails = async (commitHash) => {
    try {
      const result = await getAnalysisResult(commitHash);
      setSelectedAnalysis(result);
    } catch (error) {
      console.error('Error fetching analysis details:', error);
    }
  };

  const handleViewFixes = async (commitHash) => {
    try {
      const fixes = await getFixSuggestions(commitHash);
      setSelectedFixes({ commitHash, fixes });
      setShowFixesModal(true);
    } catch (error) {
      console.error('Error fetching fixes:', error);
      alert('Failed to load fixes. Please try again.');
    }
  };

  const handleDownloadReport = async (commitHash) => {
    try {
      const result = await getAnalysisResult(commitHash);
      
      // Create report content
      const reportData = {
        commit_hash: result.commit_hash,
        commit_author: result.commit_author,
        commit_message: result.commit_message,
        risk_level: result.risk_level,
        confidence_score: result.confidence_score,
        timestamp: result.timestamp,
        regressions: result.regressions || [],
        suggestions: result.suggestions || [],
        details: result.details || {}
      };

      // Create JSON report
      const reportContent = JSON.stringify(reportData, null, 2);
      const blob = new Blob([reportContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `analysis-report-${commitHash.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report. Please try again.');
    }
  };

  const handleCodeReview = async (commitHash) => {
    try {
      const review = await getCodeReview(commitHash);
      setSelectedReview({ commitHash, review });
      setShowReviewModal(true);
    } catch (error) {
      console.error('Error fetching code review:', error);
      alert('Failed to load code review. Please try again.');
    }
  };

  const handleExport = () => {
    const dataToExport = exportFiltered ? filteredHistory : history;
    
    if (!dataToExport || dataToExport.length === 0) {
      alert('No data to export');
      return;
    }

    // Prepare data for export
    const exportData = dataToExport.map(item => ({
      'Commit Hash': item.commit_hash || 'N/A',
      'Author': item.commit_author || 'N/A',
      'Message': item.commit_message || 'N/A',
      'Risk Level': item.risk_level || 'N/A',
      'Confidence Score': item.confidence_score ? `${(item.confidence_score * 100).toFixed(1)}%` : 'N/A',
      'Status': item.status || 'N/A',
      'Files Changed': item.files_changed || 'N/A',
      'Timestamp': item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A',
      'Regressions Count': item.regressions ? item.regressions.length : 0,
      'Suggestions Count': item.suggestions ? item.suggestions.length : 0
    }));

    let content, mimeType, extension;

    if (exportFormat === 'csv') {
      // Create CSV content
      const headers = Object.keys(exportData[0]);
      content = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header];
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');
      mimeType = 'text/csv;charset=utf-8;';
      extension = 'csv';
    } else {
      // Create JSON content
      content = JSON.stringify(exportData, null, 2);
      mimeType = 'application/json;charset=utf-8;';
      extension = 'json';
    }

    // Create and download file
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `commit-analysis-history-${new Date().toISOString().split('T')[0]}.${extension}`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setShowExportModal(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading History</h3>
        <p className="text-gray-600">{error.message}</p>
        <button 
          onClick={() => refetch()}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analysis History</h1>
        <p className="text-gray-600">
          View and manage your commit analysis history with detailed insights and filtering options.
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search commits, messages, or authors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Risk Levels</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            
            <button
              onClick={() => setShowExportModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <HistoryIcon className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Analyses</p>
              <p className="text-2xl font-bold text-gray-900">{history?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">High Risk Issues</p>
              <p className="text-2xl font-bold text-gray-900">
                {history?.filter(item => ['critical', 'high'].includes(item.risk_level?.toLowerCase())).length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Safe Commits</p>
              <p className="text-2xl font-bold text-gray-900">
                {history?.filter(item => item.risk_level?.toLowerCase() === 'low').length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Avg Confidence</p>
              <p className="text-2xl font-bold text-gray-900">
                {history?.length > 0 
                  ? Math.round(history.reduce((sum, item) => sum + (item.confidence || 0), 0) / history.length * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Analyses</h2>
        </div>
        
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <HistoryIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No analysis history found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confidence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHistory.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <GitBranch className="w-4 h-4 text-gray-400 mr-2" />
                        <code className="text-sm font-mono text-gray-900">
                          {truncateHash(item.commit_hash)}
                        </code>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {truncateMessage(item.commit_message)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{item.commit_author}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskLevelColor(item.risk_level)}`}>
                        {getRiskLevelIcon(item.risk_level)}
                        <span className="ml-1">{item.risk_level}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {Math.round((item.confidence || 0) * 100)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {formatDate(item.timestamp)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDetails(item.commit_hash)}
                          className="text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewFixes(item.commit_hash)}
                          className="text-green-600 hover:text-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                          title="View Fixes"
                        >
                          <Wrench className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadReport(item.commit_hash)}
                          className="text-purple-600 hover:text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                          title="Download Report"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCodeReview(item.commit_hash)}
                          className="text-indigo-600 hover:text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                          title="Code Review"
                        >
                          <Code className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {history && history.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {page * limit + 1} to {Math.min((page + 1) * limit, history.length)} of {history.length} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={(page + 1) * limit >= history.length}
              className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Export Analysis History</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Export Format
                  </label>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                  </select>
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportFiltered}
                      onChange={(e) => setExportFiltered(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Export filtered results only
                    </span>
                  </label>
                </div>
                
                <div className="text-sm text-gray-600">
                  {exportFiltered 
                    ? `Exporting ${filteredHistory.length} filtered results`
                    : `Exporting all ${history?.length || 0} results`
                  }
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixes Modal */}
      {showFixesModal && selectedFixes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Fix Suggestions</h3>
                <button
                  onClick={() => setShowFixesModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Commit: {selectedFixes.commitHash.substring(0, 8)}...
              </p>
            </div>
            <div className="p-6">
              {selectedFixes.fixes && selectedFixes.fixes.length > 0 ? (
                <div className="space-y-6">
                  {selectedFixes.fixes.map((fix, index) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <Wrench className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-blue-800 mb-2">{fix.title || 'Fix Suggestion'}</h4>
                          <p className="text-sm text-blue-700 mb-3">{fix.description}</p>
                          
                          {fix.code_changes && fix.code_changes.length > 0 && (
                            <div className="mb-3">
                              <h5 className="text-sm font-medium text-blue-800 mb-2">Code Changes:</h5>
                              <div className="space-y-2">
                                {fix.code_changes.map((change, changeIndex) => (
                                  <div key={changeIndex} className="bg-white rounded border border-blue-200 p-3">
                                    <div className="text-sm text-blue-700 mb-1">
                                      <strong>File:</strong> {change.file}
                                      {change.line && <span className="ml-2">Line: {change.line}</span>}
                                    </div>
                                    {change.old_code && (
                                      <div className="mb-2">
                                        <div className="text-xs text-red-600 font-medium">Old Code:</div>
                                        <pre className="text-xs bg-red-50 p-2 rounded border text-red-800 overflow-x-auto">
                                          {change.old_code}
                                        </pre>
                                      </div>
                                    )}
                                    {change.new_code && (
                                      <div>
                                        <div className="text-xs text-green-600 font-medium">New Code:</div>
                                        <pre className="text-xs bg-green-50 p-2 rounded border text-green-800 overflow-x-auto">
                                          {change.new_code}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-blue-600">
                              <strong>Confidence:</strong> {Math.round((fix.confidence || 0) * 100)}%
                            </span>
                            <span className="text-blue-600">
                              <strong>Effort:</strong> {fix.effort_level || 'medium'}
                            </span>
                            {fix.risk_assessment && (
                              <span className="text-blue-600">
                                <strong>Risk:</strong> {fix.risk_assessment}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No fix suggestions available for this commit.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Code Review Modal */}
      {showReviewModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Code Review</h3>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Commit: {selectedReview.commitHash.substring(0, 8)}...
              </p>
            </div>
            <div className="p-6">
              {selectedReview.review ? (
                <div className="space-y-6">
                  {/* Overall Score */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-medium text-gray-900">Overall Score</h4>
                      <div className="flex items-center space-x-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <span className="text-2xl font-bold text-gray-900">
                          {Math.round(selectedReview.review.overall_score || 0)}/100
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Code Quality */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Code Quality</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Score:</span>
                          <span className="text-sm font-medium">{Math.round(selectedReview.review.code_quality?.score || 0)}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Complexity:</span>
                          <span className="text-sm font-medium capitalize">{selectedReview.review.code_quality?.complexity || 'unknown'}</span>
                        </div>
                      </div>
                      {selectedReview.review.code_quality?.strengths && selectedReview.review.code_quality.strengths.length > 0 && (
                        <div className="mt-3">
                          <h5 className="text-sm font-medium text-green-700 mb-1">Strengths:</h5>
                          <ul className="text-xs text-green-600 space-y-1">
                            {selectedReview.review.code_quality.strengths.map((strength, index) => (
                              <li key={index}>• {strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Maintainability */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Maintainability</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Score:</span>
                          <span className="text-sm font-medium">{Math.round(selectedReview.review.maintainability?.score || 0)}/100</span>
                        </div>
                      </div>
                      {selectedReview.review.maintainability?.suggestions && selectedReview.review.maintainability.suggestions.length > 0 && (
                        <div className="mt-3">
                          <h5 className="text-sm font-medium text-blue-700 mb-1">Suggestions:</h5>
                          <ul className="text-xs text-blue-600 space-y-1">
                            {selectedReview.review.maintainability.suggestions.slice(0, 3).map((suggestion, index) => (
                              <li key={index}>• {suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Security Issues */}
                  {selectedReview.review.security_issues && selectedReview.review.security_issues.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-medium text-red-800 mb-3">Security Issues</h4>
                      <div className="space-y-3">
                        {selectedReview.review.security_issues.map((issue, index) => (
                          <div key={index} className="bg-white rounded border border-red-200 p-3">
                            <div className="flex items-start">
                              <AlertTriangle className="w-4 h-4 text-red-500 mr-2 mt-0.5" />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-sm font-medium text-red-800">{issue.type}</span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    issue.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                    issue.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                    issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {issue.severity}
                                  </span>
                                </div>
                                <p className="text-sm text-red-700 mb-2">{issue.description}</p>
                                <div className="text-xs text-red-600">
                                  <strong>File:</strong> {issue.file} {issue.line && `(Line ${issue.line})`}
                                </div>
                                {issue.mitigation && (
                                  <div className="text-xs text-red-600 mt-1">
                                    <strong>Mitigation:</strong> {issue.mitigation}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Best Practices */}
                  {selectedReview.review.best_practices && selectedReview.review.best_practices.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-800 mb-3">Best Practices</h4>
                      <div className="space-y-3">
                        {selectedReview.review.best_practices.map((practice, index) => (
                          <div key={index} className="bg-white rounded border border-yellow-200 p-3">
                            <div className="flex items-start">
                              <CheckCircle className="w-4 h-4 text-yellow-500 mr-2 mt-0.5" />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-sm font-medium text-yellow-800">{practice.category}</span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    practice.severity === 'high' ? 'bg-red-100 text-red-800' :
                                    practice.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {practice.severity}
                                  </span>
                                </div>
                                <p className="text-sm text-yellow-700 mb-2">{practice.issue}</p>
                                <p className="text-sm text-yellow-600">{practice.suggestion}</p>
                                <div className="text-xs text-yellow-600 mt-1">
                                  <strong>File:</strong> {practice.file} {practice.line && `(Line ${practice.line})`}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Improvements */}
                  {selectedReview.review.improvements && selectedReview.review.improvements.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-3">Suggested Improvements</h4>
                      <div className="space-y-3">
                        {selectedReview.review.improvements.map((improvement, index) => (
                          <div key={index} className="bg-white rounded border border-blue-200 p-3">
                            <div className="flex items-start">
                              <Code className="w-4 h-4 text-blue-500 mr-2 mt-0.5" />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-sm font-medium text-blue-800">{improvement.type}</span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    improvement.priority === 'high' ? 'bg-red-100 text-red-800' :
                                    improvement.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {improvement.priority} priority
                                  </span>
                                  <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    {improvement.effort} effort
                                  </span>
                                </div>
                                <p className="text-sm text-blue-700 mb-2">{improvement.description}</p>
                                <p className="text-sm text-blue-600">{improvement.impact}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Code className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No code review available for this commit.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Analysis Details Modal */}
      {selectedAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Analysis Details</h3>
                <button
                  onClick={() => setSelectedAnalysis(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Commit Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Commit Hash</p>
                      <p className="font-mono text-sm">{selectedAnalysis.commit_hash}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Author</p>
                      <p className="text-sm">{selectedAnalysis.commit_author || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Message</p>
                      <p className="text-sm">{selectedAnalysis.commit_message || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Risk Assessment</h4>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRiskLevelColor(selectedAnalysis.risk_level)}`}>
                      {getRiskLevelIcon(selectedAnalysis.risk_level)}
                      <span className="ml-1">{selectedAnalysis.risk_level} Risk</span>
                    </span>
                    <span className="text-sm text-gray-500">
                      Confidence: {Math.round((selectedAnalysis.confidence_score || 0) * 100)}%
                    </span>
                  </div>
                </div>

                {selectedAnalysis.details && Object.keys(selectedAnalysis.details).length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Analysis Details</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(selectedAnalysis.details, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {selectedAnalysis.regressions && selectedAnalysis.regressions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Regressions Found</h4>
                    <div className="space-y-3">
                      {selectedAnalysis.regressions.map((regression, index) => (
                        <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex items-start">
                            <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                            <div>
                              <p className="font-medium text-red-800">{regression.title || 'Regression'}</p>
                              <p className="text-sm text-red-700 mt-1">{regression.description || JSON.stringify(regression)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAnalysis.suggestions && selectedAnalysis.suggestions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Suggestions</h4>
                    <div className="space-y-3">
                      {selectedAnalysis.suggestions.map((suggestion, index) => (
                        <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-start">
                            <CheckCircle className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
                            <div>
                              <p className="font-medium text-blue-800">{suggestion.title || 'Suggestion'}</p>
                              <p className="text-sm text-blue-700 mt-1">{suggestion.description || JSON.stringify(suggestion)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
