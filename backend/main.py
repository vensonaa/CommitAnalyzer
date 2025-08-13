from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import asyncio
import logging
from datetime import datetime
import os
from dotenv import load_dotenv

from ai_engine.regression_analyzer import RegressionAnalyzer
from git_analyzer.commit_analyzer import GitCommitAnalyzer
from database.models import AnalysisResult, CommitAnalysis
from database.database import get_db, init_db

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Commit Regression Analyzer",
    description="AI-powered system for detecting code regressions and suggesting fixes",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
regression_analyzer = RegressionAnalyzer()
git_analyzer = GitCommitAnalyzer()

# Pydantic models
class CommitAnalysisRequest(BaseModel):
    commit_hash: str
    repository_path: str
    include_tests: bool = True
    include_performance: bool = True
    include_security: bool = True
    analysis_depth: str = "standard"  # quick, standard, deep

class BatchAnalysisRequest(BaseModel):
    repository_path: str
    start_commit: Optional[str] = None
    end_commit: Optional[str] = None
    max_commits: int = 10
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

@app.on_event("startup")
async def startup_event():
    """Initialize database and components on startup"""
    await init_db()
    logger.info("Commit Regression Analyzer started successfully")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Commit Regression Analyzer API", "status": "healthy"}

@app.post("/analyze/commit", response_model=AnalysisResult)
async def analyze_commit(
    request: CommitAnalysisRequest,
    background_tasks: BackgroundTasks,
    db = Depends(get_db)
):
    """
    Analyze a specific commit for potential regressions
    """
    try:
        logger.info(f"Starting analysis for commit: {request.commit_hash}")
        
        # Get commit details
        commit_info = await git_analyzer.get_commit_details(
            request.repository_path, 
            request.commit_hash
        )
        
        if not commit_info:
            raise HTTPException(status_code=404, detail="Commit not found")
        
        # Analyze for regressions
        analysis_result = await regression_analyzer.analyze_commit(
            commit_info=commit_info,
            include_tests=request.include_tests,
            include_performance=request.include_performance,
            include_security=request.include_security,
            analysis_depth=request.analysis_depth
        )
        
        # Add repository path to the analysis result
        if hasattr(analysis_result, 'model_dump'):
            # It's a Pydantic model (v2+)
            result_dict = analysis_result.model_dump()
        elif hasattr(analysis_result, 'dict'):
            # It's a Pydantic model (v1)
            result_dict = analysis_result.dict()
        elif hasattr(analysis_result, '__dict__'):
            # It's a regular object
            result_dict = analysis_result.__dict__
        else:
            # It's already a dict
            result_dict = analysis_result
        
        result_dict['repository_path'] = request.repository_path
        
        # Store result in database
        background_tasks.add_task(
            store_analysis_result,
            db,
            request.commit_hash,
            result_dict
        )
        
        return analysis_result
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Error analyzing commit: {str(e)}")
        # Provide a more user-friendly error message
        if "Commit not found" in str(e) or "404" in str(e):
            raise HTTPException(status_code=404, detail="Commit not found in the specified repository")
        elif "Not a valid git repository" in str(e):
            raise HTTPException(status_code=400, detail="Invalid repository path")
        else:
            raise HTTPException(status_code=500, detail="Internal server error during analysis")

@app.post("/analyze/batch")
async def analyze_batch_commits(
    request: BatchAnalysisRequest,
    background_tasks: BackgroundTasks,
    db = Depends(get_db)
):
    """
    Analyze multiple commits in a batch
    """
    try:
        logger.info(f"Starting batch analysis for repository: {request.repository_path}")
        
        # Get commit range
        commits = await git_analyzer.get_commit_range(
            request.repository_path,
            start_commit=request.start_commit,
            end_commit=request.end_commit,
            max_commits=request.max_commits
        )
        
        if not commits:
            raise HTTPException(status_code=404, detail="No commits found")
        
        # Start batch analysis in background
        task_id = f"batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        background_tasks.add_task(
            run_batch_analysis,
            task_id,
            commits,
            request,
            db
        )
        
        return {
            "task_id": task_id,
            "status": "started",
            "total_commits": len(commits),
            "message": "Batch analysis started in background"
        }
        
    except Exception as e:
        logger.error(f"Error starting batch analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analysis/history")
async def get_analysis_history_alt(
    limit: int = 50,
    offset: int = 0,
    db = Depends(get_db)
):
    """
    Get analysis history (alternative endpoint for frontend compatibility)
    """
    try:
        history = await db.get_analysis_history(limit, offset)
        return history
    except Exception as e:
        logger.error(f"Error retrieving history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analysis/{commit_hash}")
async def get_analysis_result(commit_hash: str, db = Depends(get_db)):
    """
    Retrieve analysis result for a specific commit
    """
    try:
        result = await db.get_analysis_result(commit_hash)
        if not result:
            raise HTTPException(status_code=404, detail="Analysis result not found")
        return result
    except Exception as e:
        logger.error(f"Error retrieving analysis result: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analysis/batch/{task_id}")
async def get_batch_analysis_status(task_id: str, db = Depends(get_db)):
    """
    Get status of batch analysis task
    """
    try:
        status = await db.get_batch_task_status(task_id)
        if not status:
            raise HTTPException(status_code=404, detail="Batch task not found")
        return status
    except Exception as e:
        logger.error(f"Error retrieving batch status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/suggestions/{commit_hash}")
async def get_fix_suggestions(commit_hash: str, db = Depends(get_db)):
    """
    Get detailed fix suggestions for a commit
    """
    try:
        analysis = await db.get_analysis_result(commit_hash)
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        suggestions = await regression_analyzer.generate_fix_suggestions(analysis)
        return suggestions
    except Exception as e:
        logger.error(f"Error generating suggestions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analysis/{commit_hash}/fixes")
async def get_fix_suggestions_alt(commit_hash: str, db = Depends(get_db)):
    """
    Get detailed fix suggestions for a commit (alternative endpoint for frontend compatibility)
    """
    try:
        analysis = await db.get_analysis_result(commit_hash)
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        suggestions = await regression_analyzer.generate_fix_suggestions(analysis)
        return suggestions
    except Exception as e:
        logger.error(f"Error generating suggestions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/revert/recommendation/{commit_hash}")
async def get_revert_recommendation(commit_hash: str, db = Depends(get_db)):
    """
    Get recommendation on whether to revert a commit
    """
    try:
        analysis = await db.get_analysis_result(commit_hash)
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        recommendation = await regression_analyzer.analyze_revert_recommendation(analysis)
        return recommendation
    except Exception as e:
        logger.error(f"Error generating revert recommendation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analysis/{commit_hash}/revert")
async def get_revert_recommendation_alt(commit_hash: str, db = Depends(get_db)):
    """
    Get recommendation on whether to revert a commit (alternative endpoint for frontend compatibility)
    """
    try:
        analysis = await db.get_analysis_result(commit_hash)
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        recommendation = await regression_analyzer.analyze_revert_recommendation(analysis)
        return recommendation
    except Exception as e:
        logger.error(f"Error generating revert recommendation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analysis/{commit_hash}/review")
async def get_code_review(commit_hash: str, db = Depends(get_db)):
    """
    Get comprehensive code review for a commit
    """
    try:
        # First get the analysis result to ensure the commit exists
        analysis = await db.get_analysis_result(commit_hash)
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        # Create commit info from the analysis data
        commit_info = {
            'hash': commit_hash,
            'author': analysis.get('commit_author', 'Unknown'),
            'date': analysis.get('commit_date', 'Unknown'),
            'message': analysis.get('commit_message', 'No message'),
            'changes': [],  # We don't have the actual changes, but we can still do a review
            'parent_hashes': [],
            'branch': 'unknown'
        }
        
        # Try to get additional commit details from git if available
        repo_path = analysis.get('repository_path')
        if repo_path:
            try:
                git_commit_info = await git_analyzer.get_commit_details(repo_path, commit_hash)
                if git_commit_info:
                    # Convert CommitInfo object to dict and merge with analysis info
                    git_info_dict = {
                        'hash': git_commit_info.hash,
                        'author': git_commit_info.author,
                        'date': git_commit_info.date,
                        'message': git_commit_info.message,
                        'changes': git_commit_info.changes,
                        'parent_hashes': git_commit_info.parent_hashes,
                        'branch': git_commit_info.branch
                    }
                    commit_info.update(git_info_dict)
            except Exception as git_error:
                logger.warning(f"Could not get git details for commit {commit_hash}: {str(git_error)}")
                # Continue with analysis-based commit info
        else:
            logger.warning("No repository path available, using analysis-based commit info only")
        
        # Perform code review
        review_result = await regression_analyzer.perform_code_review(commit_info)
        return review_result
    except Exception as e:
        logger.error(f"Error performing code review: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history")
async def get_analysis_history(
    limit: int = 50,
    offset: int = 0,
    db = Depends(get_db)
):
    """
    Get analysis history
    """
    try:
        history = await db.get_analysis_history(limit, offset)
        return history
    except Exception as e:
        logger.error(f"Error retrieving history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/system/stats")
async def get_system_stats(db = Depends(get_db)):
    """
    Get system statistics
    """
    try:
        stats = await db.get_statistics()
        return stats
    except Exception as e:
        logger.error(f"Error retrieving system stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Background task functions
async def store_analysis_result(db, commit_hash: str, result):
    """Store analysis result in database"""
    try:
        # Convert AnalysisResult object to dict if needed
        if hasattr(result, 'model_dump'):
            # It's a Pydantic model (v2+)
            result_dict = result.model_dump()
        elif hasattr(result, 'dict'):
            # It's a Pydantic model (v1)
            result_dict = result.dict()
        elif hasattr(result, '__dict__'):
            # It's a regular object
            result_dict = result.__dict__
        else:
            # It's already a dict
            result_dict = result
        
        await db.store_analysis_result(commit_hash, result_dict)
        logger.info(f"Stored analysis result for commit: {commit_hash}")
    except Exception as e:
        logger.error(f"Error storing analysis result: {str(e)}")

async def run_batch_analysis(
    task_id: str,
    commits: List[Dict[str, Any]],
    request: BatchAnalysisRequest,
    db
):
    """Run batch analysis in background"""
    try:
        total_commits = len(commits)
        completed = 0
        failed = 0
        
        await db.create_batch_task(task_id, total_commits)
        
        for commit in commits:
            try:
                analysis_result = await regression_analyzer.analyze_commit(
                    commit_info=commit,
                    include_tests=request.include_tests,
                    include_performance=request.include_performance,
                    include_security=request.include_security
                )
                
                # Convert AnalysisResult object to dict if needed
                if hasattr(analysis_result, 'model_dump'):
                    # It's a Pydantic model (v2+)
                    result_dict = analysis_result.model_dump()
                elif hasattr(analysis_result, 'dict'):
                    # It's a Pydantic model (v1)
                    result_dict = analysis_result.dict()
                elif hasattr(analysis_result, '__dict__'):
                    # It's a regular object
                    result_dict = analysis_result.__dict__
                else:
                    # It's already a dict
                    result_dict = analysis_result
                
                # Add repository path to the analysis result
                result_dict['repository_path'] = request.repository_path
                
                await db.store_analysis_result(commit['hash'], result_dict)
                completed += 1
                
            except Exception as e:
                logger.error(f"Error analyzing commit {commit['hash']}: {str(e)}")
                failed += 1
            
            # Update progress
            await db.update_batch_task_progress(task_id, completed, failed)
            
            # Small delay to prevent overwhelming the system
            await asyncio.sleep(1)
        
        await db.complete_batch_task(task_id)
        logger.info(f"Batch analysis completed: {task_id}")
        
    except Exception as e:
        logger.error(f"Error in batch analysis: {str(e)}")
        await db.fail_batch_task(task_id, str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
