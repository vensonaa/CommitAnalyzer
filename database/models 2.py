from sqlalchemy import Column, Integer, String, DateTime, Float, Text, JSON, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel

Base = declarative_base()

class AnalysisResult(Base):
    """Database model for storing analysis results"""
    __tablename__ = "analysis_results"
    
    id = Column(Integer, primary_key=True, index=True)
    commit_hash = Column(String(40), unique=True, index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    confidence_score = Column(Float, nullable=False, default=0.0)
    risk_level = Column(String(20), nullable=False, default="low")
    
    # Analysis details
    regressions = Column(JSON, nullable=True)
    suggestions = Column(JSON, nullable=True)
    details = Column(JSON, nullable=True)
    
    # Metadata
    repository_path = Column(String(500), nullable=True)
    analysis_depth = Column(String(20), nullable=True)
    processing_time = Column(Float, nullable=True)
    
    # Commit information
    commit_author = Column(String(200), nullable=True)
    commit_message = Column(Text, nullable=True)
    commit_date = Column(DateTime, nullable=True)
    files_changed = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class BatchTask(Base):
    """Database model for storing batch analysis tasks"""
    __tablename__ = "batch_tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String(50), unique=True, index=True, nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    total_commits = Column(Integer, nullable=False, default=0)
    completed_commits = Column(Integer, nullable=False, default=0)
    failed_commits = Column(Integer, nullable=False, default=0)
    
    # Task configuration
    repository_path = Column(String(500), nullable=True)
    start_commit = Column(String(40), nullable=True)
    end_commit = Column(String(40), nullable=True)
    max_commits = Column(Integer, nullable=True)
    
    # Analysis settings
    include_tests = Column(Boolean, default=True)
    include_performance = Column(Boolean, default=True)
    include_security = Column(Boolean, default=True)
    
    # Results
    results = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

class CommitAnalysis(Base):
    """Database model for storing detailed commit analysis"""
    __tablename__ = "commit_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    commit_hash = Column(String(40), index=True, nullable=False)
    analysis_result_id = Column(Integer, nullable=False)
    
    # Analysis metadata
    analysis_type = Column(String(50), nullable=False)  # functional, performance, security, etc.
    severity = Column(String(20), nullable=False)
    confidence = Column(Float, nullable=False)
    
    # Analysis details
    description = Column(Text, nullable=True)
    affected_files = Column(JSON, nullable=True)
    line_numbers = Column(JSON, nullable=True)
    code_snippet = Column(Text, nullable=True)
    
    # Fix suggestions
    fix_suggestions = Column(JSON, nullable=True)
    effort_level = Column(String(20), nullable=True)
    risk_assessment = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

# Pydantic models for API responses
class AnalysisResultResponse(BaseModel):
    commit_hash: str
    timestamp: datetime
    status: str
    confidence_score: float
    risk_level: str
    regressions: List[Dict[str, Any]]
    suggestions: List[Dict[str, Any]]
    details: Dict[str, Any]
    
    class Config:
        from_attributes = True

class BatchTaskResponse(BaseModel):
    task_id: str
    status: str
    total_commits: int
    completed_commits: int
    failed_commits: int
    progress_percentage: float
    created_at: datetime
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class CommitAnalysisResponse(BaseModel):
    commit_hash: str
    analysis_type: str
    severity: str
    confidence: float
    description: str
    affected_files: List[str]
    fix_suggestions: List[Dict[str, Any]]
    
    class Config:
        from_attributes = True

# Utility functions
def calculate_progress_percentage(completed: int, total: int) -> float:
    """Calculate progress percentage for batch tasks"""
    if total == 0:
        return 0.0
    return (completed / total) * 100.0

def format_risk_level(level: str) -> str:
    """Format risk level for display"""
    return level.upper() if level else "UNKNOWN"

def format_confidence_score(score: float) -> str:
    """Format confidence score for display"""
    return f"{score * 100:.1f}%" if score is not None else "N/A"
