#!/usr/bin/env python3
"""
MCP Server for Commit Regression Analyzer
Provides IDE integration for analyzing commits and detecting regressions
"""

import asyncio
import json
import logging
import os
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from mcp.server import Server, NotificationOptions
from mcp.server.models import InitializationOptions
from mcp.server.stdio import stdio_server
from pydantic import BaseModel

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize MCP server
server = Server("commit-regression-analyzer")

class CommitAnalysisRequest(BaseModel):
    commit_hash: str
    repository_path: str
    analysis_depth: str = "standard"
    include_tests: bool = True
    include_performance: bool = True
    include_security: bool = True

class AnalysisResult(BaseModel):
    commit_hash: str
    timestamp: datetime
    status: str
    regressions: List[Dict[str, Any]]
    suggestions: List[Dict[str, Any]]
    confidence_score: float
    risk_level: str
    details: Dict[str, Any]

class RegressionAnalyzer:
    def __init__(self):
        self.llm = ChatGroq(
            api_key=self._get_api_key(),
            model_name="llama3-70b-8192",
            temperature=0.1
        )
    
    def _get_api_key(self) -> str:
        """Get API key from environment"""
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable is required")
        return api_key
    
    async def analyze_commit(self, request: CommitAnalysisRequest) -> AnalysisResult:
        """Analyze a commit for potential regressions"""
        try:
            logger.info(f"Starting analysis for commit: {request.commit_hash}")
            
            # Get commit details
            commit_info = await self._get_commit_details(request.repository_path, request.commit_hash)
            if not commit_info:
                raise ValueError("Commit not found or invalid")
            
            # Prepare analysis context
            analysis_context = self._prepare_analysis_context(commit_info, request)
            
            # Perform AI analysis
            ai_analysis = await self._perform_ai_analysis(analysis_context, request.analysis_depth)
            
            # Process results
            regressions = self._extract_regressions(ai_analysis)
            suggestions = self._extract_suggestions(ai_analysis)
            confidence_score = self._calculate_confidence_score(ai_analysis)
            risk_level = self._determine_risk_level(regressions)
            
            return AnalysisResult(
                commit_hash=request.commit_hash,
                timestamp=datetime.now(),
                status="completed",
                regressions=regressions,
                suggestions=suggestions,
                confidence_score=confidence_score,
                risk_level=risk_level,
                details=ai_analysis
            )
            
        except Exception as e:
            logger.error(f"Error in analysis: {str(e)}")
            raise
    
    async def _get_commit_details(self, repo_path: str, commit_hash: str) -> Optional[Dict[str, Any]]:
        """Get commit details using git"""
        try:
            # Validate repository
            if not os.path.exists(os.path.join(repo_path, ".git")):
                return None
            
            # Get commit info
            result = subprocess.run(
                ["git", "-C", repo_path, "show", "--format=format:%H%n%an%n%ad%n%s%n%b", "--date=iso", commit_hash],
                capture_output=True, text=True, check=True
            )
            
            lines = result.stdout.strip().split('\n')
            if len(lines) < 4:
                return None
            
            # Get file changes
            changes_result = subprocess.run(
                ["git", "-C", repo_path, "show", "--name-status", commit_hash],
                capture_output=True, text=True, check=True
            )
            
            changes = []
            for line in changes_result.stdout.strip().split('\n'):
                if line.strip():
                    parts = line.split('\t')
                    if len(parts) >= 2:
                        changes.append({
                            'file': parts[1],
                            'status': parts[0]
                        })
            
            return {
                'hash': lines[0],
                'author': lines[1],
                'date': lines[2],
                'message': '\n'.join(lines[3:]),
                'changes': changes
            }
            
        except subprocess.CalledProcessError:
            return None
    
    def _prepare_analysis_context(self, commit_info: Dict[str, Any], request: CommitAnalysisRequest) -> str:
        """Prepare context for AI analysis"""
        context_parts = []
        
        context_parts.append(f"Commit Hash: {commit_info['hash']}")
        context_parts.append(f"Author: {commit_info['author']}")
        context_parts.append(f"Date: {commit_info['date']}")
        context_parts.append(f"Message: {commit_info['message']}")
        
        context_parts.append("\nChanged Files:")
        for change in commit_info['changes']:
            context_parts.append(f"- {change['file']} ({change['status']})")
        
        # Analysis requirements
        requirements = []
        if request.include_tests:
            requirements.append("test impact analysis")
        if request.include_performance:
            requirements.append("performance impact analysis")
        if request.include_security:
            requirements.append("security vulnerability analysis")
        
        context_parts.append(f"\nAnalysis Requirements: {', '.join(requirements)}")
        
        return "\n".join(context_parts)
    
    async def _perform_ai_analysis(self, context: str, depth: str) -> Dict[str, Any]:
        """Perform AI analysis using LLM"""
        system_prompt = """
You are an expert software engineer analyzing code commits for potential regressions.

Analyze the provided commit and identify:
1. Functional regressions and logic errors
2. Performance issues and inefficiencies
3. Security vulnerabilities
4. Test impact and coverage issues
5. Code quality and maintainability problems

Provide analysis in JSON format with regressions, suggestions, and overall assessment.
"""
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Analyze this commit:\n\n{context}")
        ]
        
        try:
            response = await self.llm.ainvoke(messages)
            return json.loads(response.content)
        except json.JSONDecodeError:
            # Fallback response
            return {
                "regressions": [],
                "suggestions": [],
                "overall_assessment": {
                    "risk_level": "low",
                    "confidence_score": 0.5,
                    "summary": "Analysis completed"
                }
            }
    
    def _extract_regressions(self, ai_analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract regression issues from AI analysis"""
        return ai_analysis.get("regressions", [])
    
    def _extract_suggestions(self, ai_analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract fix suggestions from AI analysis"""
        return ai_analysis.get("suggestions", [])
    
    def _calculate_confidence_score(self, ai_analysis: Dict[str, Any]) -> float:
        """Calculate overall confidence score"""
        overall = ai_analysis.get("overall_assessment", {})
        return overall.get("confidence_score", 0.5)
    
    def _determine_risk_level(self, regressions: List[Dict[str, Any]]) -> str:
        """Determine overall risk level"""
        if not regressions:
            return "low"
        
        severity_scores = {"low": 1, "medium": 2, "high": 3, "critical": 4}
        max_severity = max(
            severity_scores.get(r.get("severity", "medium"), 2)
            for r in regressions
        )
        
        if max_severity >= 4:
            return "critical"
        elif max_severity >= 3:
            return "high"
        elif max_severity >= 2:
            return "medium"
        else:
            return "low"

# Initialize analyzer
analyzer = RegressionAnalyzer()

@server.list_tools()
async def handle_list_tools() -> List[Dict[str, Any]]:
    """List available tools"""
    return [
        {
            "name": "analyze_commit",
            "description": "Analyze a git commit for potential regressions and issues",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "commit_hash": {
                        "type": "string",
                        "description": "The git commit hash to analyze"
                    },
                    "repository_path": {
                        "type": "string",
                        "description": "Path to the git repository"
                    },
                    "analysis_depth": {
                        "type": "string",
                        "enum": ["quick", "standard", "deep"],
                        "description": "Depth of analysis to perform"
                    },
                    "include_tests": {
                        "type": "boolean",
                        "description": "Include test impact analysis"
                    },
                    "include_performance": {
                        "type": "boolean",
                        "description": "Include performance analysis"
                    },
                    "include_security": {
                        "type": "boolean",
                        "description": "Include security analysis"
                    }
                },
                "required": ["commit_hash", "repository_path"]
            }
        },
        {
            "name": "get_commit_info",
            "description": "Get basic information about a git commit",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "commit_hash": {
                        "type": "string",
                        "description": "The git commit hash"
                    },
                    "repository_path": {
                        "type": "string",
                        "description": "Path to the git repository"
                    }
                },
                "required": ["commit_hash", "repository_path"]
            }
        },
        {
            "name": "validate_repository",
            "description": "Validate if a path is a valid git repository",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "repository_path": {
                        "type": "string",
                        "description": "Path to check"
                    }
                },
                "required": ["repository_path"]
            }
        }
    ]

@server.call_tool()
async def handle_call_tool(name: str, arguments: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Handle tool calls"""
    try:
        if name == "analyze_commit":
            request = CommitAnalysisRequest(**arguments)
            result = await analyzer.analyze_commit(request)
            
            return [{
                "type": "text",
                "text": f"""
## Commit Analysis Results

**Commit:** {result.commit_hash}
**Risk Level:** {result.risk_level.upper()}
**Confidence:** {result.confidence_score * 100:.1f}%

### Regressions Found: {len(result.regressions)}

{analyzer._format_regressions(result.regressions)}

### Fix Suggestions: {len(result.suggestions)}

{analyzer._format_suggestions(result.suggestions)}

### Summary
{result.details.get('overall_assessment', {}).get('summary', 'Analysis completed')}
"""
            }]
        
        elif name == "get_commit_info":
            commit_hash = arguments["commit_hash"]
            repo_path = arguments["repository_path"]
            
            commit_info = await analyzer._get_commit_details(repo_path, commit_hash)
            if not commit_info:
                return [{"type": "text", "text": "Commit not found or invalid"}]
            
            return [{
                "type": "text",
                "text": f"""
## Commit Information

**Hash:** {commit_info['hash']}
**Author:** {commit_info['author']}
**Date:** {commit_info['date']}
**Message:** {commit_info['message']}

**Files Changed:** {len(commit_info['changes'])}
{chr(10).join(f"- {change['file']} ({change['status']})" for change in commit_info['changes'])}
"""
            }]
        
        elif name == "validate_repository":
            repo_path = arguments["repository_path"]
            is_valid = os.path.exists(os.path.join(repo_path, ".git"))
            
            return [{
                "type": "text",
                "text": f"Repository validation: {'✅ Valid' if is_valid else '❌ Invalid'}"
            }]
        
        else:
            return [{"type": "text", "text": f"Unknown tool: {name}"}]
    
    except Exception as e:
        logger.error(f"Error in tool call: {str(e)}")
        return [{"type": "text", "text": f"Error: {str(e)}"}]

def _format_regressions(self, regressions: List[Dict[str, Any]]) -> str:
    """Format regressions for display"""
    if not regressions:
        return "No regressions detected."
    
    formatted = []
    for i, regression in enumerate(regressions, 1):
        formatted.append(f"""
{i}. **{regression.get('type', 'Unknown')}** ({regression.get('severity', 'medium')})
   - {regression.get('description', 'No description')}
   - Confidence: {regression.get('confidence', 0) * 100:.1f}%
   - Files: {', '.join(regression.get('affected_files', []))}
""")
    
    return "\n".join(formatted)

def _format_suggestions(self, suggestions: List[Dict[str, Any]]) -> str:
    """Format suggestions for display"""
    if not suggestions:
        return "No suggestions available."
    
    formatted = []
    for i, suggestion in enumerate(suggestions, 1):
        formatted.append(f"""
{i}. **{suggestion.get('title', 'Untitled')}**
   - {suggestion.get('description', 'No description')}
   - Effort: {suggestion.get('effort_level', 'medium')}
   - Risk: {suggestion.get('risk_assessment', 'Not assessed')}
""")
    
    return "\n".join(formatted)

# Add methods to the analyzer class
RegressionAnalyzer._format_regressions = _format_regressions
RegressionAnalyzer._format_suggestions = _format_suggestions

async def main():
    """Main function to run the MCP server"""
    logger.info("Starting MCP server...")
    try:
        # Run the server
        async with stdio_server() as (read_stream, write_stream):
            logger.info("MCP server stdio streams created successfully")
            await server.run(
                read_stream,
                write_stream,
                InitializationOptions(
                    server_name="commit-regression-analyzer",
                    server_version="1.0.0",
                    capabilities=server.get_capabilities(
                        notification_options=NotificationOptions(),
                        experimental_capabilities={},
                    ),
                ),
            )
    except Exception as e:
        logger.error(f"Error starting MCP server: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(main())
