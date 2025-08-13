import asyncio
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, update, delete
import os
from dotenv import load_dotenv

from .models import Base, AnalysisResult, BatchTask, CommitAnalysis

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self):
        self.engine = None
        self.async_session_maker = None
        self.database_url = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///commit_analyzer.db")
    
    async def init_database(self):
        """Initialize database connection and create tables"""
        try:
            # Create async engine
            self.engine = create_async_engine(
                self.database_url,
                echo=False,
                future=True
            )
            
            # Create async session maker
            self.async_session_maker = async_sessionmaker(
                self.engine,
                class_=AsyncSession,
                expire_on_commit=False
            )
            
            # Create tables
            async with self.engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            
            logger.info("Database initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing database: {str(e)}")
            raise
    
    async def close_database(self):
        """Close database connection"""
        if self.engine:
            await self.engine.dispose()
            logger.info("Database connection closed")
    
    async def get_session(self) -> AsyncSession:
        """Get database session"""
        if not self.async_session_maker:
            await self.init_database()
        return self.async_session_maker()
    
    # Analysis Results
    async def store_analysis_result(self, commit_hash: str, result_data: Dict[str, Any]) -> bool:
        """Store analysis result in database"""
        try:
            async with await self.get_session() as session:
                # Check if result already exists
                existing = await session.execute(
                    select(AnalysisResult).where(AnalysisResult.commit_hash == commit_hash)
                )
                existing_result = existing.scalar_one_or_none()
                
                if existing_result:
                    # Update existing result
                    existing_result.status = result_data.get("status", "completed")
                    existing_result.confidence_score = result_data.get("confidence_score", 0.0)
                    existing_result.risk_level = result_data.get("risk_level", "low")
                    existing_result.regressions = result_data.get("regressions", [])
                    existing_result.suggestions = result_data.get("suggestions", [])
                    existing_result.details = result_data.get("details", {})
                    existing_result.commit_author = result_data.get("commit_author")
                    existing_result.commit_message = result_data.get("commit_message")
                    existing_result.commit_date = result_data.get("commit_date")
                    existing_result.files_changed = result_data.get("files_changed")
                    existing_result.timestamp = result_data.get("timestamp", datetime.utcnow())
                    existing_result.updated_at = datetime.utcnow()
                else:
                    # Create new result
                    new_result = AnalysisResult(
                        commit_hash=commit_hash,
                        status=result_data.get("status", "completed"),
                        confidence_score=result_data.get("confidence_score", 0.0),
                        risk_level=result_data.get("risk_level", "low"),
                        regressions=result_data.get("regressions", []),
                        suggestions=result_data.get("suggestions", []),
                        details=result_data.get("details", {}),
                        timestamp=result_data.get("timestamp", datetime.utcnow()),
                        repository_path=result_data.get("repository_path"),
                        analysis_depth=result_data.get("analysis_depth"),
                        processing_time=result_data.get("processing_time"),
                        commit_author=result_data.get("commit_author"),
                        commit_message=result_data.get("commit_message"),
                        commit_date=result_data.get("commit_date"),
                        files_changed=result_data.get("files_changed")
                    )
                    session.add(new_result)
                
                await session.commit()
                logger.info(f"Stored analysis result for commit: {commit_hash}")
                return True
                
        except Exception as e:
            logger.error(f"Error storing analysis result: {str(e)}")
            return False
    
    async def get_analysis_result(self, commit_hash: str) -> Optional[Dict[str, Any]]:
        """Get analysis result by commit hash"""
        try:
            async with await self.get_session() as session:
                result = await session.execute(
                    select(AnalysisResult).where(AnalysisResult.commit_hash == commit_hash)
                )
                analysis_result = result.scalar_one_or_none()
                
                if analysis_result:
                    return {
                        "commit_hash": analysis_result.commit_hash,
                        "timestamp": analysis_result.timestamp,
                        "status": analysis_result.status,
                        "confidence_score": analysis_result.confidence_score,
                        "risk_level": analysis_result.risk_level,
                        "regressions": analysis_result.regressions or [],
                        "suggestions": analysis_result.suggestions or [],
                        "details": analysis_result.details or {},
                        "repository_path": analysis_result.repository_path,
                        "analysis_depth": analysis_result.analysis_depth,
                        "processing_time": analysis_result.processing_time,
                        "commit_author": analysis_result.commit_author,
                        "commit_message": analysis_result.commit_message,
                        "commit_date": analysis_result.commit_date,
                        "files_changed": analysis_result.files_changed
                    }
                return None
                
        except Exception as e:
            logger.error(f"Error getting analysis result: {str(e)}")
            return None
    
    async def get_analysis_history(self, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """Get analysis history with pagination"""
        try:
            async with await self.get_session() as session:
                result = await session.execute(
                    select(AnalysisResult)
                    .order_by(AnalysisResult.timestamp.desc())
                    .limit(limit)
                    .offset(offset)
                )
                analysis_results = result.scalars().all()
                
                return [
                    {
                        "commit_hash": ar.commit_hash,
                        "timestamp": ar.timestamp,
                        "status": ar.status,
                        "confidence_score": ar.confidence_score,
                        "risk_level": ar.risk_level,
                        "commit_author": ar.commit_author,
                        "commit_message": ar.commit_message,
                        "files_changed": ar.files_changed,
                        "regressions": ar.regressions or [],
                        "suggestions": ar.suggestions or [],
                        "details": ar.details or {}
                    }
                    for ar in analysis_results
                ]
                
        except Exception as e:
            logger.error(f"Error getting analysis history: {str(e)}")
            return []
    
    # Batch Tasks
    async def create_batch_task(self, task_id: str, total_commits: int) -> bool:
        """Create a new batch task"""
        try:
            async with await self.get_session() as session:
                batch_task = BatchTask(
                    task_id=task_id,
                    status="running",
                    total_commits=total_commits,
                    started_at=datetime.utcnow()
                )
                session.add(batch_task)
                await session.commit()
                logger.info(f"Created batch task: {task_id}")
                return True
                
        except Exception as e:
            logger.error(f"Error creating batch task: {str(e)}")
            return False
    
    async def update_batch_task_progress(self, task_id: str, completed: int, failed: int) -> bool:
        """Update batch task progress"""
        try:
            async with await self.get_session() as session:
                await session.execute(
                    update(BatchTask)
                    .where(BatchTask.task_id == task_id)
                    .values(
                        completed_commits=completed,
                        failed_commits=failed
                    )
                )
                await session.commit()
                return True
                
        except Exception as e:
            logger.error(f"Error updating batch task progress: {str(e)}")
            return False
    
    async def complete_batch_task(self, task_id: str) -> bool:
        """Mark batch task as completed"""
        try:
            async with await self.get_session() as session:
                await session.execute(
                    update(BatchTask)
                    .where(BatchTask.task_id == task_id)
                    .values(
                        status="completed",
                        completed_at=datetime.utcnow()
                    )
                )
                await session.commit()
                logger.info(f"Completed batch task: {task_id}")
                return True
                
        except Exception as e:
            logger.error(f"Error completing batch task: {str(e)}")
            return False
    
    async def fail_batch_task(self, task_id: str, error_message: str) -> bool:
        """Mark batch task as failed"""
        try:
            async with await self.get_session() as session:
                await session.execute(
                    update(BatchTask)
                    .where(BatchTask.task_id == task_id)
                    .values(
                        status="failed",
                        error_message=error_message,
                        completed_at=datetime.utcnow()
                    )
                )
                await session.commit()
                logger.error(f"Failed batch task: {task_id} - {error_message}")
                return True
                
        except Exception as e:
            logger.error(f"Error failing batch task: {str(e)}")
            return False
    
    async def get_batch_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get batch task status"""
        try:
            async with await self.get_session() as session:
                result = await session.execute(
                    select(BatchTask).where(BatchTask.task_id == task_id)
                )
                batch_task = result.scalar_one_or_none()
                
                if batch_task:
                    progress_percentage = (batch_task.completed_commits / batch_task.total_commits * 100) if batch_task.total_commits > 0 else 0
                    
                    return {
                        "task_id": batch_task.task_id,
                        "status": batch_task.status,
                        "total_commits": batch_task.total_commits,
                        "completed_commits": batch_task.completed_commits,
                        "failed_commits": batch_task.failed_commits,
                        "progress_percentage": progress_percentage,
                        "created_at": batch_task.created_at,
                        "started_at": batch_task.started_at,
                        "completed_at": batch_task.completed_at,
                        "error_message": batch_task.error_message
                    }
                return None
                
        except Exception as e:
            logger.error(f"Error getting batch task status: {str(e)}")
            return None
    
    # Commit Analysis Details
    async def store_commit_analysis(self, commit_hash: str, analysis_result_id: int, analysis_data: Dict[str, Any]) -> bool:
        """Store detailed commit analysis"""
        try:
            async with await self.get_session() as session:
                commit_analysis = CommitAnalysis(
                    commit_hash=commit_hash,
                    analysis_result_id=analysis_result_id,
                    analysis_type=analysis_data.get("type", "functional"),
                    severity=analysis_data.get("severity", "medium"),
                    confidence=analysis_data.get("confidence", 0.5),
                    description=analysis_data.get("description", ""),
                    affected_files=analysis_data.get("affected_files", []),
                    line_numbers=analysis_data.get("line_numbers", []),
                    code_snippet=analysis_data.get("code_snippet", ""),
                    fix_suggestions=analysis_data.get("fix_suggestions", []),
                    effort_level=analysis_data.get("effort_level", "medium"),
                    risk_assessment=analysis_data.get("risk_assessment", "")
                )
                session.add(commit_analysis)
                await session.commit()
                return True
                
        except Exception as e:
            logger.error(f"Error storing commit analysis: {str(e)}")
            return False
    
    async def get_commit_analyses(self, commit_hash: str) -> List[Dict[str, Any]]:
        """Get all analyses for a commit"""
        try:
            async with await self.get_session() as session:
                result = await session.execute(
                    select(CommitAnalysis).where(CommitAnalysis.commit_hash == commit_hash)
                )
                analyses = result.scalars().all()
                
                return [
                    {
                        "analysis_type": ca.analysis_type,
                        "severity": ca.severity,
                        "confidence": ca.confidence,
                        "description": ca.description,
                        "affected_files": ca.affected_files or [],
                        "line_numbers": ca.line_numbers or [],
                        "code_snippet": ca.code_snippet,
                        "fix_suggestions": ca.fix_suggestions or [],
                        "effort_level": ca.effort_level,
                        "risk_assessment": ca.risk_assessment
                    }
                    for ca in analyses
                ]
                
        except Exception as e:
            logger.error(f"Error getting commit analyses: {str(e)}")
            return []
    
    # Statistics and Analytics
    async def get_statistics(self) -> Dict[str, Any]:
        """Get system statistics"""
        try:
            async with await self.get_session() as session:
                # Total analyses
                total_result = await session.execute(select(AnalysisResult))
                total_analyses = len(total_result.scalars().all())
                
                # Risk level distribution
                risk_levels = await session.execute(
                    select(AnalysisResult.risk_level)
                )
                risk_distribution = {}
                for risk in risk_levels.scalars().all():
                    risk_distribution[risk] = risk_distribution.get(risk, 0) + 1
                
                # Average confidence score
                confidence_result = await session.execute(
                    select(AnalysisResult.confidence_score)
                )
                confidence_scores = [score for score in confidence_result.scalars().all() if score is not None]
                avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
                
                # Recent activity
                recent_result = await session.execute(
                    select(AnalysisResult)
                    .where(AnalysisResult.timestamp >= datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0))
                )
                today_analyses = len(recent_result.scalars().all())
                
                return {
                    "total_analyses": total_analyses,
                    "risk_distribution": risk_distribution,
                    "average_confidence": avg_confidence,
                    "today_analyses": today_analyses
                }
                
        except Exception as e:
            logger.error(f"Error getting statistics: {str(e)}")
            return {}

# Global database manager instance
db_manager = DatabaseManager()

# Dependency functions for FastAPI
async def init_db():
    """Initialize database"""
    await db_manager.init_database()

async def get_db():
    """Get database session"""
    return db_manager

async def close_db():
    """Close database connection"""
    await db_manager.close_database()
