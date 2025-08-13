import asyncio
import logging
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
import re
import json
from dataclasses import dataclass
from enum import Enum

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class RegressionType(str, Enum):
    FUNCTIONAL = "functional"
    PERFORMANCE = "performance"
    SECURITY = "security"
    TEST = "test"
    COMPATIBILITY = "compatibility"
    MEMORY_LEAK = "memory_leak"
    RACE_CONDITION = "race_condition"

@dataclass
class RegressionIssue:
    type: RegressionType
    severity: RiskLevel
    description: str
    affected_files: List[str]
    confidence: float
    line_numbers: Optional[List[int]] = None
    code_snippet: Optional[str] = None

@dataclass
class FixSuggestion:
    title: str
    description: str
    code_changes: List[Dict[str, Any]]
    confidence: float
    effort_level: str  # low, medium, high
    risk_assessment: str

class CodeReviewResult(BaseModel):
    overall_score: float
    code_quality: Dict[str, Any]
    best_practices: List[Dict[str, Any]]
    improvements: List[Dict[str, Any]]
    security_issues: List[Dict[str, Any]]
    performance_issues: List[Dict[str, Any]]
    maintainability: Dict[str, Any]
    documentation: Dict[str, Any]
    testing_coverage: Dict[str, Any]

class AnalysisResult(BaseModel):
    commit_hash: str
    timestamp: datetime
    status: str
    regressions: List[Dict[str, Any]]
    suggestions: List[Dict[str, Any]]
    confidence_score: float
    risk_level: RiskLevel
    details: Dict[str, Any]
    commit_author: Optional[str] = None
    commit_message: Optional[str] = None
    commit_date: Optional[datetime] = None
    files_changed: Optional[int] = None

class RegressionAnalyzer:
    def __init__(self):
        self.llm = None
        self.output_parser = JsonOutputParser()
        
    def _get_api_key(self) -> str:
        """Get API key from environment"""
        import os
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable is required")
        return api_key
    
    def _get_llm(self):
        """Get LLM instance, initializing if needed"""
        if self.llm is None:
            try:
                self.llm = ChatGroq(
                    api_key=self._get_api_key(),
                    model_name="openai/gpt-oss-120b",
                    temperature=0.1
                )
            except ValueError as e:
                logger.error(f"Failed to initialize LLM: {str(e)}")
                raise
        return self.llm
    
    async def analyze_commit(
        self,
        commit_info: Union[Dict[str, Any], 'CommitInfo'],
        include_tests: bool = True,
        include_performance: bool = True,
        include_security: bool = True,
        analysis_depth: str = "standard"
    ) -> AnalysisResult:
        """
        Analyze a commit for potential regressions using AI
        """
        try:
            # Convert CommitInfo to dict if needed
            if hasattr(commit_info, 'hash'):
                # It's a CommitInfo object
                commit_dict = {
                    'hash': commit_info.hash,
                    'author': commit_info.author,
                    'date': commit_info.date,
                    'message': commit_info.message,
                    'changes': commit_info.changes,
                    'parent_hashes': commit_info.parent_hashes,
                    'branch': commit_info.branch
                }
            else:
                # It's already a dict
                commit_dict = commit_info
            
            logger.info(f"Starting AI analysis for commit: {commit_dict['hash']}")
            
            # Prepare analysis context
            analysis_context = self._prepare_analysis_context(
                commit_dict, include_tests, include_performance, include_security
            )
            
            # Perform AI analysis
            ai_analysis = await self._perform_ai_analysis(analysis_context, analysis_depth)
            
            # Process and structure results
            regressions = self._extract_regressions(ai_analysis)
            suggestions = self._extract_suggestions(ai_analysis)
            
            # Calculate overall metrics
            confidence_score = self._calculate_confidence_score(ai_analysis)
            risk_level = self._determine_risk_level(regressions)
            
            return AnalysisResult(
                commit_hash=commit_dict['hash'],
                timestamp=datetime.now(),
                status="completed",
                regressions=regressions,
                suggestions=suggestions,
                confidence_score=confidence_score,
                risk_level=risk_level,
                details=ai_analysis,
                commit_author=commit_dict.get('author'),
                commit_message=commit_dict.get('message'),
                commit_date=commit_dict.get('date'),
                files_changed=len(commit_dict.get('changes', []))
            )
            
        except Exception as e:
            logger.error(f"Error in AI analysis: {str(e)}")
            raise
    
    def _prepare_analysis_context(
        self,
        commit_info: Dict[str, Any],
        include_tests: bool,
        include_performance: bool,
        include_security: bool
    ) -> str:
        """Prepare context for AI analysis"""
        context_parts = []
        
        # Commit metadata
        context_parts.append(f"Commit Hash: {commit_info['hash']}")
        context_parts.append(f"Author: {commit_info['author']}")
        context_parts.append(f"Date: {commit_info['date']}")
        context_parts.append(f"Message: {commit_info['message']}")
        
        # Changed files
        context_parts.append("\nChanged Files:")
        for file_change in commit_info['changes']:
            # Handle both dict and FileChange objects
            if hasattr(file_change, 'file'):
                # It's a FileChange object
                file_name = file_change.file
                status = file_change.status
                added_lines = file_change.added_lines
                removed_lines = file_change.removed_lines
                diff = file_change.diff
            else:
                # It's a dict
                file_name = file_change['file']
                status = file_change['status']
                added_lines = file_change.get('added_lines', [])
                removed_lines = file_change.get('removed_lines', [])
                diff = file_change.get('diff', '')
            
            context_parts.append(f"- {file_name} ({status})")
            
            if status in ['modified', 'added']:
                context_parts.append(f"  Added lines: {len(added_lines)}")
                context_parts.append(f"  Removed lines: {len(removed_lines)}")
                
                # Include code changes for analysis
                if diff:
                    context_parts.append(f"  Diff:\n{diff}")
        
        # Analysis requirements
        analysis_requirements = []
        if include_tests:
            analysis_requirements.append("test impact analysis")
        if include_performance:
            analysis_requirements.append("performance impact analysis")
        if include_security:
            analysis_requirements.append("security vulnerability analysis")
        
        context_parts.append(f"\nAnalysis Requirements: {', '.join(analysis_requirements)}")
        
        return "\n".join(context_parts)
    
    async def _perform_ai_analysis(self, context: str, depth: str) -> Dict[str, Any]:
        """Perform AI analysis using LLM"""
        
        # Create analysis prompt based on depth
        if depth == "quick":
            system_prompt = self._get_quick_analysis_prompt()
        elif depth == "deep":
            system_prompt = self._get_deep_analysis_prompt()
        else:
            system_prompt = self._get_standard_analysis_prompt()
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Please analyze the following commit:\n\n{context}")
        ]
        
        try:
            response = await self._get_llm().ainvoke(messages)
            analysis_result = json.loads(response.content)
            return analysis_result
        except json.JSONDecodeError:
            # Fallback to text parsing if JSON parsing fails
            logger.warning("Failed to parse JSON response, using text parsing")
            return self._parse_text_response(response.content)
    
    def _get_standard_analysis_prompt(self) -> str:
        return """
You are an expert software engineer and code reviewer specializing in detecting regressions and potential issues in code changes.

Analyze the provided commit and identify potential regressions, issues, and improvements. Focus on:

1. **Functional Regressions**: Logic errors, broken functionality, incorrect behavior
2. **Performance Issues**: Performance degradation, inefficient algorithms, memory leaks
3. **Security Vulnerabilities**: Security flaws, injection attacks, authentication issues
4. **Test Impact**: Breaking changes to tests, missing test coverage
5. **Code Quality**: Maintainability issues, code smells, technical debt

For each issue found, provide:
- Type of regression/issue
- Severity (low/medium/high/critical)
- Description of the problem
- Affected files and line numbers
- Confidence level (0-1)
- Suggested fixes

Return your analysis as a JSON object with the following structure:
{
    "regressions": [
        {
            "type": "functional|performance|security|test|compatibility|memory_leak|race_condition",
            "severity": "low|medium|high|critical",
            "description": "Detailed description of the issue",
            "affected_files": ["file1.py", "file2.py"],
            "line_numbers": [10, 15, 20],
            "confidence": 0.85,
            "code_snippet": "relevant code snippet"
        }
    ],
    "suggestions": [
        {
            "title": "Fix title",
            "description": "Detailed fix description",
            "code_changes": [
                {
                    "file": "file.py",
                    "line": 10,
                    "old_code": "old code",
                    "new_code": "new code"
                }
            ],
            "confidence": 0.9,
            "effort_level": "low|medium|high",
            "risk_assessment": "Assessment of fix risk"
        }
    ],
    "overall_assessment": {
        "risk_level": "low|medium|high|critical",
        "confidence_score": 0.8,
        "summary": "Overall assessment summary"
    }
}
"""
    
    def _get_quick_analysis_prompt(self) -> str:
        return """
You are a code reviewer performing a quick analysis of a commit for potential regressions.

Perform a rapid assessment focusing on obvious issues:
- Critical bugs and errors
- Security vulnerabilities
- Performance problems
- Test failures

Provide a concise analysis in JSON format with high-confidence issues only.
"""
    
    def _get_deep_analysis_prompt(self) -> str:
        return """
You are an expert software engineer performing a comprehensive deep analysis of code changes.

Perform an exhaustive analysis including:
- All potential regressions and edge cases
- Performance implications and optimizations
- Security vulnerabilities and attack vectors
- Code quality and maintainability
- Architectural implications
- Dependency and compatibility issues
- Memory management and resource leaks
- Concurrency and threading issues
- Error handling and edge cases

Provide detailed analysis with specific code examples and comprehensive fix suggestions.
"""
    
    def _parse_text_response(self, response_text: str) -> Dict[str, Any]:
        """Parse text response when JSON parsing fails"""
        # Extract JSON-like structure from text
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError:
                pass
        
        # Fallback to structured text parsing
        return {
            "regressions": [],
            "suggestions": [],
            "overall_assessment": {
                "risk_level": "medium",
                "confidence_score": 0.5,
                "summary": "Analysis completed with limited confidence"
            }
        }
    
    def _extract_regressions(self, ai_analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract regression issues from AI analysis"""
        regressions = []
        
        for regression in ai_analysis.get("regressions", []):
            regressions.append({
                "type": regression.get("type", "functional"),
                "severity": regression.get("severity", "medium"),
                "description": regression.get("description", ""),
                "affected_files": regression.get("affected_files", []),
                "line_numbers": regression.get("line_numbers", []),
                "confidence": regression.get("confidence", 0.5),
                "code_snippet": regression.get("code_snippet", "")
            })
        
        return regressions
    
    def _extract_suggestions(self, ai_analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract fix suggestions from AI analysis"""
        suggestions = []
        
        for suggestion in ai_analysis.get("suggestions", []):
            suggestions.append({
                "title": suggestion.get("title", ""),
                "description": suggestion.get("description", ""),
                "code_changes": suggestion.get("code_changes", []),
                "confidence": suggestion.get("confidence", 0.5),
                "effort_level": suggestion.get("effort_level", "medium"),
                "risk_assessment": suggestion.get("risk_assessment", "")
            })
        
        return suggestions
    
    def _calculate_confidence_score(self, ai_analysis: Dict[str, Any]) -> float:
        """Calculate overall confidence score"""
        overall = ai_analysis.get("overall_assessment", {})
        return overall.get("confidence_score", 0.5)
    
    def _determine_risk_level(self, regressions: List[Dict[str, Any]]) -> RiskLevel:
        """Determine overall risk level based on regressions"""
        if not regressions:
            return RiskLevel.LOW
        
        # Find highest severity
        severity_scores = {
            "low": 1,
            "medium": 2,
            "high": 3,
            "critical": 4
        }
        
        max_severity = max(
            severity_scores.get(r.get("severity", "medium"), 2)
            for r in regressions
        )
        
        if max_severity >= 4:
            return RiskLevel.CRITICAL
        elif max_severity >= 3:
            return RiskLevel.HIGH
        elif max_severity >= 2:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.LOW
    
    async def generate_fix_suggestions(self, analysis: AnalysisResult) -> List[Dict[str, Any]]:
        """Generate detailed fix suggestions for detected issues"""
        try:
            context = self._prepare_fix_context(analysis)
            
            system_prompt = """
You are an expert software engineer providing detailed fix suggestions for code issues.

For each regression identified, provide:
1. Specific code changes needed
2. Step-by-step implementation guide
3. Testing recommendations
4. Risk assessment of the fix
5. Alternative approaches if applicable

Provide practical, actionable suggestions that can be implemented immediately.
"""
            
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"Generate fix suggestions for:\n\n{context}")
            ]
            
            response = await self._get_llm().ainvoke(messages)
            suggestions = json.loads(response.content)
            
            return suggestions.get("fixes", [])
            
        except Exception as e:
            logger.error(f"Error generating fix suggestions: {str(e)}")
            return []
    
    def _prepare_fix_context(self, analysis: AnalysisResult) -> str:
        """Prepare context for fix generation"""
        context_parts = []
        
        context_parts.append(f"Commit: {analysis.commit_hash}")
        context_parts.append(f"Risk Level: {analysis.risk_level}")
        context_parts.append(f"Confidence: {analysis.confidence_score}")
        
        context_parts.append("\nDetected Regressions:")
        for regression in analysis.regressions:
            context_parts.append(f"- {regression['type']}: {regression['description']}")
            context_parts.append(f"  Severity: {regression['severity']}")
            context_parts.append(f"  Files: {', '.join(regression['affected_files'])}")
            if regression.get('code_snippet'):
                context_parts.append(f"  Code: {regression['code_snippet']}")
        
        return "\n".join(context_parts)
    
    async def analyze_revert_recommendation(self, analysis: AnalysisResult) -> Dict[str, Any]:
        """Analyze whether a commit should be reverted"""
        try:
            context = self._prepare_revert_context(analysis)
            
            system_prompt = """
You are an expert software engineer advising on whether to revert a commit.

Consider:
1. Severity of regressions
2. Impact on users/customers
3. Difficulty of fixing vs reverting
4. Risk of introducing new issues
5. Timeline constraints

Provide a clear recommendation with reasoning and alternative approaches.
"""
            
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"Should this commit be reverted?\n\n{context}")
            ]
            
            response = await self._get_llm().ainvoke(messages)
            recommendation = json.loads(response.content)
            
            return recommendation
            
        except Exception as e:
            logger.error(f"Error analyzing revert recommendation: {str(e)}")
            return {
                "recommendation": "unknown",
                "reasoning": "Unable to analyze",
                "confidence": 0.0
            }
    
    def _prepare_revert_context(self, analysis: AnalysisResult) -> str:
        """Prepare context for revert analysis"""
        context_parts = []
        
        context_parts.append(f"Commit: {analysis.commit_hash}")
        context_parts.append(f"Risk Level: {analysis.risk_level}")
        context_parts.append(f"Confidence: {analysis.confidence_score}")
        
        context_parts.append(f"\nRegressions Found: {len(analysis.regressions)}")
        for regression in analysis.regressions:
            context_parts.append(f"- {regression['severity']} {regression['type']}: {regression['description']}")
        
        context_parts.append(f"\nFix Suggestions: {len(analysis.suggestions)}")
        for suggestion in analysis.suggestions:
            context_parts.append(f"- {suggestion['effort_level']} effort: {suggestion['title']}")
        
        return "\n".join(context_parts)

    async def perform_code_review(self, commit_info: Union[Dict[str, Any], 'CommitInfo']) -> Dict[str, Any]:
        """
        Perform a comprehensive code review of the commit
        """
        try:
            # Convert CommitInfo to dict if needed
            if hasattr(commit_info, 'hash'):
                commit_dict = {
                    'hash': commit_info.hash,
                    'author': commit_info.author,
                    'date': commit_info.date,
                    'message': commit_info.message,
                    'changes': commit_info.changes,
                    'parent_hashes': commit_info.parent_hashes,
                    'branch': commit_info.branch
                }
            else:
                commit_dict = commit_info

            # Prepare analysis context
            analysis_context = self._prepare_analysis_context(
                commit_dict, include_tests=True, include_performance=True, include_security=True
            )

            prompt = f"""
            Perform a comprehensive code review for the following commit. Analyze code quality, best practices, security, performance, and maintainability.

            Commit Information:
            {analysis_context}

            Provide a detailed code review in JSON format with the following structure:
            {{
                "overall_score": float (0-100),
                "code_quality": {{
                    "score": float (0-100),
                    "issues": [string],
                    "strengths": [string],
                    "complexity": "low|medium|high"
                }},
                "best_practices": [
                    {{
                        "category": string,
                        "issue": string,
                        "severity": "low|medium|high",
                        "suggestion": string,
                        "file": string,
                        "line": int
                    }}
                ],
                "improvements": [
                    {{
                        "type": "refactoring|optimization|security|documentation",
                        "description": string,
                        "priority": "low|medium|high",
                        "effort": "low|medium|high",
                        "impact": string
                    }}
                ],
                "security_issues": [
                    {{
                        "type": string,
                        "severity": "low|medium|high|critical",
                        "description": string,
                        "file": string,
                        "line": int,
                        "mitigation": string
                    }}
                ],
                "performance_issues": [
                    {{
                        "type": string,
                        "severity": "low|medium|high",
                        "description": string,
                        "file": string,
                        "line": int,
                        "optimization": string
                    }}
                ],
                "maintainability": {{
                    "score": float (0-100),
                    "issues": [string],
                    "suggestions": [string]
                }},
                "documentation": {{
                    "score": float (0-100),
                    "missing_docs": [string],
                    "improvements": [string]
                }},
                "testing_coverage": {{
                    "score": float (0-100),
                    "missing_tests": [string],
                    "suggestions": [string]
                }}
            }}

            Focus on:
            1. Code readability and structure
            2. Security vulnerabilities
            3. Performance bottlenecks
            4. Best practices adherence
            5. Documentation quality
            6. Test coverage
            7. Maintainability concerns
            """

            response = await self._get_llm().ainvoke([HumanMessage(content=prompt)])
            result = json.loads(response.content)
            
            return result
            
        except Exception as e:
            logger.error(f"Error performing code review: {str(e)}")
            # Return a more informative result on error
            error_message = "API key not configured" if ("GROQ_API_KEY" in str(e) or "Expecting value" in str(e)) else f"Error performing review: {str(e)}"
            return {
                "overall_score": 0.0,
                "code_quality": {"score": 0.0, "issues": [error_message], "strengths": [], "complexity": "unknown"},
                "best_practices": [],
                "improvements": [],
                "security_issues": [],
                "performance_issues": [],
                "maintainability": {"score": 0.0, "issues": [error_message], "suggestions": []},
                "documentation": {"score": 0.0, "missing_docs": [], "improvements": []},
                "testing_coverage": {"score": 0.0, "missing_tests": [], "suggestions": []}
            }
