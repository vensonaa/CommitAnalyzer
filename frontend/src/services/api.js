import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API Functions
export const analyzeCommit = async (data) => {
  const response = await api.post('/analyze/commit', data);
  return response.data;
};

export const startBatchAnalysis = async (data) => {
  const response = await api.post('/analyze/batch', data);
  return response.data;
};

export const getBatchStatus = async (taskId) => {
  const response = await api.get(`/analysis/batch/${taskId}`);
  return response.data;
};

export const getAnalysisResult = async (commitHash) => {
  const response = await api.get(`/analysis/${commitHash}`);
  return response.data;
};

export const getFixSuggestions = async (commitHash) => {
  const response = await api.get(`/analysis/${commitHash}/fixes`);
  return response.data;
};

export const getRevertRecommendation = async (commitHash) => {
  const response = await api.get(`/analysis/${commitHash}/revert`);
  return response.data;
};

export const getAnalysisHistory = async (limit = 20, offset = 0) => {
  const response = await api.get(`/analysis/history?limit=${limit}&offset=${offset}`);
  return response.data;
};

export const getSystemStats = async () => {
  const response = await api.get('/system/stats');
  return response.data;
};

// Utility Functions
export const pollBatchStatus = async (taskId, onProgress, onComplete, onError) => {
  const maxAttempts = 60; // 5 minutes with 5-second intervals
  let attempts = 0;

  const poll = async () => {
    try {
      const status = await getBatchStatus(taskId);
      
      if (status.status === 'completed') {
        onComplete(status);
        return;
      }
      
      if (status.status === 'failed') {
        onError(new Error(status.error || 'Batch analysis failed'));
        return;
      }
      
      onProgress(status);
      
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(poll, 5000);
      } else {
        onError(new Error('Batch analysis timeout'));
      }
    } catch (error) {
      onError(error);
    }
  };

  poll();
};

export const formatCommitHash = (hash) => {
  return hash ? hash.substring(0, 8) : 'N/A';
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString();
};

export const getRiskLevelColor = (level) => {
  switch (level?.toLowerCase()) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getRiskLevelIcon = (level) => {
  switch (level?.toLowerCase()) {
    case 'critical':
    case 'high':
      return '🔴';
    case 'medium':
      return '🟡';
    case 'low':
      return '🟢';
    default:
      return '⚪';
  }
};

export default api;

