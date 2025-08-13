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
  RefreshCw
} from 'lucide-react';
import { getAnalysisHistory, getAnalysisResult } from '../services/api';

const History = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportFiltered, setExportFiltered] = useState(true);
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
    <div className="max-w-7xl mx-auto">
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
                      <button
                        onClick={() => handleViewDetails(item.commit_hash)}
                        className="text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
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
