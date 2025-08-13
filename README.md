# Commit Regression Analyzer

An AI-powered system for detecting code regressions in developer commits and suggesting fixes or reverts. This comprehensive solution helps development teams identify potential issues before they reach production.

## 🚀 Features

### Core Analysis
- **Automated Regression Detection**: Analyzes git commits to identify potential regressions
- **AI-Powered Analysis**: Uses advanced LLMs (GROQ/OpenAI) to understand code changes and their impact
- **Multiple Analysis Types**: Functional, performance, security, test impact, and compatibility analysis
- **Confidence Scoring**: Provides confidence levels for each detected issue
- **Risk Assessment**: Categorizes issues by severity (low, medium, high, critical)

### Fix Suggestions
- **Intelligent Fix Recommendations**: AI-generated suggestions for resolving detected issues
- **Code-Level Fixes**: Specific code changes with before/after examples
- **Effort Assessment**: Estimates the effort required to implement fixes
- **Risk Assessment**: Evaluates the risk of implementing suggested fixes

### Revert Recommendations
- **Smart Revert Analysis**: Determines when reverting a commit might be the best solution
- **Impact Analysis**: Considers user impact, timeline constraints, and fix complexity
- **Alternative Approaches**: Suggests alternatives to reverting when possible

### Batch Processing
- **Batch Analysis**: Analyze multiple commits simultaneously
- **Progress Tracking**: Real-time progress monitoring for batch operations
- **Pattern Detection**: Identify recurring issues across multiple commits

### Integration Options
- **Web Interface**: Modern React-based dashboard for easy interaction
- **REST API**: Full-featured API for integration with CI/CD pipelines
- **MCP Server**: IDE integration for real-time analysis during development
- **CLI Support**: Command-line interface for automation

## 🏗️ Architecture

```
commit_analyzer/
├── backend/                 # FastAPI backend service
│   ├── main.py             # Main API server
│   ├── ai_engine/          # AI analysis engine
│   ├── git_analyzer/       # Git integration
│   ├── database/           # Data persistence layer
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend interface
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── services/       # API integration
│   │   └── App.js          # Main application
│   └── package.json        # Node.js dependencies
├── mcp_server/            # MCP server for IDE integration
│   ├── server.py          # MCP server implementation
│   └── requirements.txt   # MCP dependencies
└── setup.sh               # Automated setup script
```

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **SQLAlchemy**: SQL toolkit and ORM for database operations
- **LangChain**: Framework for building LLM applications
- **GROQ/OpenAI**: AI models for code analysis
- **SQLite**: Lightweight database for storing analysis results

### Frontend
- **React**: Modern JavaScript library for building user interfaces
- **Tailwind CSS**: Utility-first CSS framework
- **React Query**: Data fetching and caching library
- **React Hook Form**: Form handling and validation
- **Lucide React**: Beautiful icon library

### DevOps
- **Docker**: Containerization support
- **Git**: Version control integration
- **MCP**: Model Context Protocol for IDE integration

## 📋 Prerequisites

Before setting up the Commit Regression Analyzer, ensure you have:

- **Python 3.8+**: For backend services
- **Node.js 16+**: For frontend development
- **Git**: For repository analysis
- **GROQ API Key**: For AI-powered analysis 

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd commit_analyzer

# Run the automated setup script
./setup.sh
```

### 2. Configure API Keys

Edit the backend environment file:

```bash
cd backend
cp env.example .env
# Edit .env and add your GROQ_API_KEY
```

### 3. Start the System

```bash
# Start all services
./start_all.sh

# Or start individually:
./start_backend.sh   # Backend API server
./start_frontend.sh  # Frontend web interface
./start_mcp.sh       # MCP server for IDE integration
```

### 4. Access the Application

- **Web Interface**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **API Health Check**: http://localhost:8000/

## 📖 Usage Guide

### Web Interface

1. **Dashboard**: Overview of system status and recent analyses
2. **Analyze Commit**: Single commit analysis with detailed results
3. **Batch Analysis**: Analyze multiple commits simultaneously
4. **History**: View and search through analysis history
5. **Settings**: Configure system parameters and API keys

### API Usage

#### Analyze a Single Commit

```bash
curl -X POST "http://localhost:8000/analyze/commit" \
  -H "Content-Type: application/json" \
  -d '{
    "commit_hash": "abc123def456",
    "repository_path": "/path/to/your/repo",
    "analysis_depth": "standard",
    "include_tests": true,
    "include_performance": true,
    "include_security": true
  }'
```

#### Start Batch Analysis

```bash
curl -X POST "http://localhost:8000/analyze/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "repository_path": "/path/to/your/repo",
    "max_commits": 10,
    "include_tests": true,
    "include_performance": true,
    "include_security": true
  }'
```

#### Get Analysis Results

```bash
curl -X GET "http://localhost:8000/analysis/abc123def456"
```

### MCP Integration

Configure your IDE to use the MCP server:

```json
{
  "mcpServers": {
    "commit-analyzer": {
      "command": "python",
      "args": ["/path/to/commit_analyzer/mcp_server/server.py"],
      "env": {
        "GROQ_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
# API Keys
GROQ_API_KEY=your_groq_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Database
DATABASE_URL=sqlite+aiosqlite:///commit_analyzer.db

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=false

# Analysis
DEFAULT_ANALYSIS_DEPTH=standard
MAX_BATCH_COMMITS=50
ANALYSIS_TIMEOUT=300
```

#### Frontend (.env)
```bash
REACT_APP_API_URL=http://localhost:8000
```

### Analysis Types

The system supports multiple types of analysis:

1. **Functional Analysis**: Logic errors, broken functionality
2. **Performance Analysis**: Performance degradation, inefficient algorithms
3. **Security Analysis**: Security vulnerabilities, injection attacks
4. **Test Impact**: Breaking changes to tests, missing coverage
5. **Compatibility Analysis**: Breaking changes, API compatibility
6. **Memory Leak Detection**: Resource leaks, memory issues
7. **Race Condition Detection**: Concurrency issues, threading problems

### Analysis Depth Levels

- **Quick**: Rapid assessment focusing on obvious issues
- **Standard**: Balanced analysis with good coverage
- **Deep**: Comprehensive analysis including edge cases

## 📊 Understanding Results

### Risk Levels

- **Critical**: Immediate action required, severe impact
- **High**: Significant issues that need prompt attention
- **Medium**: Issues that should be addressed soon
- **Low**: Minor issues or suggestions for improvement

### Confidence Scores

- **90-100%**: Very high confidence in the analysis
- **70-89%**: High confidence with some uncertainty
- **50-69%**: Moderate confidence, review recommended
- **Below 50%**: Low confidence, manual review required

### Fix Suggestions

Each suggestion includes:
- **Title**: Brief description of the fix
- **Description**: Detailed explanation
- **Code Changes**: Specific code modifications
- **Effort Level**: Estimated implementation effort
- **Risk Assessment**: Potential risks of the fix

## 🔒 Security Considerations

- **API Key Security**: Keys are stored securely and never logged
- **Local Processing**: Code analysis is performed locally
- **Data Privacy**: Analysis data is not shared with third parties
- **Access Control**: Implement proper authentication for production use

## 🚀 Production Deployment

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Environment Setup

1. **Database**: Use PostgreSQL or MySQL for production
2. **Authentication**: Implement proper user authentication
3. **HTTPS**: Use SSL/TLS for secure communication
4. **Monitoring**: Add logging and monitoring
5. **Backup**: Implement regular database backups

### Scaling Considerations

- **Load Balancing**: Use multiple backend instances
- **Caching**: Implement Redis for caching
- **Queue System**: Use Celery for background tasks
- **CDN**: Serve static assets via CDN

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Development Setup

```bash
# Backend development
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Frontend development
cd frontend
npm install
npm run dev
```

## 📝 API Documentation

Full API documentation is available at `http://localhost:8000/docs` when the backend is running.

### Key Endpoints

- `POST /analyze/commit` - Analyze a single commit
- `POST /analyze/batch` - Start batch analysis
- `GET /analysis/{commit_hash}` - Get analysis results
- `GET /suggestions/{commit_hash}` - Get fix suggestions
- `POST /revert/recommendation/{commit_hash}` - Get revert recommendation
- `GET /history` - Get analysis history

## 🐛 Troubleshooting

### Common Issues

1. **API Key Issues**: Ensure GROQ_API_KEY is set correctly
2. **Git Integration**: Verify git is installed and accessible
3. **Database Issues**: Check database permissions and connections
4. **Port Conflicts**: Ensure ports 3000 and 8000 are available

### Logs

- **Backend**: Check `backend/logs/` directory
- **Frontend**: Check browser console
- **MCP Server**: Check terminal output

### Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Open an issue on GitHub

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **GROQ**: For providing fast AI inference
- **LangChain**: For the LLM framework
- **FastAPI**: For the excellent web framework
- **React**: For the frontend framework
- **Tailwind CSS**: For the styling framework

---

**Built with ❤️ for better code quality and developer productivity**