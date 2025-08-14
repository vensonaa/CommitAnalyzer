import asyncio
import subprocess
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import re
import os
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class FileChange:
    file: str
    status: str  # modified, added, deleted, renamed
    added_lines: List[str]
    removed_lines: List[str]
    diff: str
    line_numbers: Dict[str, List[int]]

@dataclass
class CommitInfo:
    hash: str
    author: str
    date: datetime
    message: str
    changes: List[FileChange]
    parent_hashes: List[str]
    branch: str

class GitCommitAnalyzer:
    def __init__(self):
        self.git_path = "git"
    
    async def get_commit_details(self, repo_path: str, commit_hash: str) -> Optional[CommitInfo]:
        """
        Get detailed information about a specific commit
        """
        try:
            # Validate repository path
            if not os.path.exists(os.path.join(repo_path, ".git")):
                raise ValueError(f"Not a valid git repository: {repo_path}")
            
            # Get basic commit info
            commit_info = await self._get_commit_info(repo_path, commit_hash)
            if not commit_info:
                return None
            
            # Get file changes
            changes = await self._get_file_changes(repo_path, commit_hash)
            
            # Get parent commits
            parent_hashes = await self._get_parent_hashes(repo_path, commit_hash)
            
            # Get current branch
            branch = await self._get_current_branch(repo_path)
            
            return CommitInfo(
                hash=commit_hash,
                author=commit_info['author'],
                date=commit_info['date'],
                message=commit_info['message'],
                changes=changes,
                parent_hashes=parent_hashes,
                branch=branch
            )
            
        except Exception as e:
            logger.error(f"Error getting commit details: {str(e)}")
            return None
    
    async def get_commit_range(
        self,
        repo_path: str,
        start_commit: Optional[str] = None,
        end_commit: Optional[str] = None,
        max_commits: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get a range of commits for batch analysis
        """
        try:
            # Get commit list
            commits = await self._get_commit_list(
                repo_path, start_commit, end_commit, max_commits
            )
            
            # Get basic info for each commit
            commit_details = []
            for commit_hash in commits:
                commit_info = await self._get_commit_info(repo_path, commit_hash)
                if commit_info:
                    commit_details.append({
                        'hash': commit_hash,
                        'author': commit_info['author'],
                        'date': commit_info['date'],
                        'message': commit_info['message'],
                        'changes': await self._get_file_changes(repo_path, commit_hash)
                    })
            
            return commit_details
            
        except Exception as e:
            logger.error(f"Error getting commit range: {str(e)}")
            return []
    
    async def _get_commit_info(self, repo_path: str, commit_hash: str) -> Optional[Dict[str, Any]]:
        """Get basic commit information"""
        try:
            # First validate that the commit exists
            if not await self.validate_commit(repo_path, commit_hash):
                logger.warning(f"Commit {commit_hash} not found in repository {repo_path}")
                return None
            
            cmd = [
                self.git_path, "-C", repo_path, "show",
                "--format=format:%H%n%an%n%ad%n%s%n%b",
                "--date=iso",
                "--no-patch",
                commit_hash
            ]
            
            result = await self._run_git_command(cmd)
            if not result:
                return None
            
            lines = result.strip().split('\n')
            if len(lines) < 4:
                logger.warning(f"Invalid commit info format for {commit_hash}")
                return None
            
            return {
                'hash': lines[0],
                'author': lines[1],
                'date': datetime.fromisoformat(lines[2].replace(' ', 'T')),
                'message': '\n'.join(lines[3:])
            }
            
        except Exception as e:
            logger.error(f"Error getting commit info: {str(e)}")
            return None
    
    async def _get_file_changes(self, repo_path: str, commit_hash: str) -> List[FileChange]:
        """Get detailed file changes for a commit"""
        try:
            # Get list of changed files
            cmd = [
                self.git_path, "-C", repo_path, "show",
                "--name-status",
                commit_hash
            ]
            
            result = await self._run_git_command(cmd)
            if not result:
                return []
            
            changes = []
            lines = result.strip().split('\n')
            
            for line in lines:
                if not line.strip():
                    continue
                
                parts = line.split('\t')
                if len(parts) < 2:
                    continue
                
                status = parts[0]
                file_path = parts[1]
                
                # Get detailed diff for this file
                file_change = await self._get_file_diff(repo_path, commit_hash, file_path, status)
                if file_change:
                    changes.append(file_change)
            
            return changes
            
        except Exception as e:
            logger.error(f"Error getting file changes: {str(e)}")
            return []
    
    async def _get_file_diff(
        self,
        repo_path: str,
        commit_hash: str,
        file_path: str,
        status: str
    ) -> Optional[FileChange]:
        """Get detailed diff for a specific file"""
        try:
            if status == "D":  # Deleted file
                return FileChange(
                    file=file_path,
                    status="deleted",
                    added_lines=[],
                    removed_lines=[],
                    diff="",
                    line_numbers={"removed": []}
                )
            
            # Get diff for modified/added files
            cmd = [
                self.git_path, "-C", repo_path, "show",
                "--unified=0",
                commit_hash,
                "--",
                file_path
            ]
            
            result = await self._run_git_command(cmd)
            if not result:
                return None
            
            # Parse diff to extract added/removed lines
            added_lines, removed_lines, line_numbers = self._parse_diff(result)
            
            return FileChange(
                file=file_path,
                status="modified" if status == "M" else "added",
                added_lines=added_lines,
                removed_lines=removed_lines,
                diff=result,
                line_numbers=line_numbers
            )
            
        except Exception as e:
            logger.error(f"Error getting file diff: {str(e)}")
            return None
    
    def _parse_diff(self, diff_content: str) -> tuple[List[str], List[str], Dict[str, List[int]]]:
        """Parse git diff output to extract line changes"""
        added_lines = []
        removed_lines = []
        line_numbers = {"added": [], "removed": []}
        
        lines = diff_content.split('\n')
        current_line = 0
        
        for line in lines:
            if line.startswith('@@'):
                # Parse hunk header
                match = re.search(r'@@ -(\d+),?(\d+)? \+(\d+),?(\d+)? @@', line)
                if match:
                    old_start = int(match.group(1))
                    new_start = int(match.group(3))
                    current_line = new_start
            elif line.startswith('+') and not line.startswith('+++'):
                added_lines.append(line[1:])
                line_numbers["added"].append(current_line)
                current_line += 1
            elif line.startswith('-') and not line.startswith('---'):
                removed_lines.append(line[1:])
                line_numbers["removed"].append(current_line)
            elif not line.startswith('---') and not line.startswith('+++'):
                current_line += 1
        
        return added_lines, removed_lines, line_numbers
    
    async def _get_parent_hashes(self, repo_path: str, commit_hash: str) -> List[str]:
        """Get parent commit hashes"""
        try:
            cmd = [
                self.git_path, "-C", repo_path, "log",
                "--format=format:%H",
                "--max-count=1",
                f"{commit_hash}^"
            ]
            
            result = await self._run_git_command(cmd)
            if result:
                return [result.strip()]
            return []
            
        except Exception as e:
            logger.error(f"Error getting parent hashes: {str(e)}")
            return []
    
    async def _get_current_branch(self, repo_path: str) -> str:
        """Get current branch name"""
        try:
            cmd = [self.git_path, "-C", repo_path, "branch", "--show-current"]
            result = await self._run_git_command(cmd)
            return result.strip() if result else "unknown"
        except Exception as e:
            logger.error(f"Error getting current branch: {str(e)}")
            return "unknown"
    
    async def _get_commit_list(
        self,
        repo_path: str,
        start_commit: Optional[str] = None,
        end_commit: Optional[str] = None,
        max_commits: int = 10
    ) -> List[str]:
        """Get list of commits in a range"""
        try:
            cmd = [
                self.git_path, "-C", repo_path, "log",
                "--format=format:%H",
                f"--max-count={max_commits}"
            ]
            
            if start_commit and end_commit:
                cmd.extend([f"{start_commit}..{end_commit}"])
            elif start_commit:
                cmd.extend([f"{start_commit}..HEAD"])
            elif end_commit:
                cmd.extend([f"HEAD..{end_commit}"])
            
            result = await self._run_git_command(cmd)
            if result:
                return result.strip().split('\n')
            return []
            
        except Exception as e:
            logger.error(f"Error getting commit list: {str(e)}")
            return []
    
    async def _run_git_command(self, cmd: List[str]) -> Optional[str]:
        """Run a git command and return the output"""
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                try:
                    stderr_text = stderr.decode('utf-8', errors='replace')
                except UnicodeDecodeError:
                    stderr_text = stderr.decode('latin-1', errors='replace')
                logger.warning(f"Git command failed: {stderr_text}")
                return None
            
            # Try UTF-8 first, fallback to latin-1 if that fails
            try:
                return stdout.decode('utf-8')
            except UnicodeDecodeError:
                logger.warning(f"UTF-8 decode failed for git command, using latin-1: {' '.join(cmd)}")
                return stdout.decode('latin-1', errors='replace')
            
        except Exception as e:
            logger.error(f"Error running git command: {str(e)}")
            return None
    
    async def get_repository_info(self, repo_path: str) -> Dict[str, Any]:
        """Get general repository information"""
        try:
            info = {}
            
            # Get repository name
            cmd = [self.git_path, "-C", repo_path, "rev-parse", "--show-toplevel"]
            result = await self._run_git_command(cmd)
            if result:
                info['name'] = os.path.basename(result.strip())
            
            # Get current branch
            info['branch'] = await self._get_current_branch(repo_path)
            
            # Get total commits
            cmd = [self.git_path, "-C", repo_path, "rev-list", "--count", "HEAD"]
            result = await self._run_git_command(cmd)
            if result:
                info['total_commits'] = int(result.strip())
            
            # Get last commit
            cmd = [self.git_path, "-C", repo_path, "log", "--format=format:%H", "-1"]
            result = await self._run_git_command(cmd)
            if result:
                info['last_commit'] = result.strip()
            
            return info
            
        except Exception as e:
            logger.error(f"Error getting repository info: {str(e)}")
            return {}
    
    async def validate_commit(self, repo_path: str, commit_hash: str) -> bool:
        """Validate if a commit exists in the repository"""
        try:
            cmd = [self.git_path, "-C", repo_path, "rev-parse", "--verify", commit_hash]
            result = await self._run_git_command(cmd)
            return result is not None
        except Exception as e:
            logger.error(f"Error validating commit: {str(e)}")
            return False
    
    async def get_commit_stats(self, repo_path: str, commit_hash: str) -> Dict[str, Any]:
        """Get statistics for a commit"""
        try:
            stats = {}
            
            # Get number of files changed
            cmd = [
                self.git_path, "-C", repo_path, "show",
                "--stat",
                "--format=format:",
                commit_hash
            ]
            
            result = await self._run_git_command(cmd)
            if result:
                lines = result.strip().split('\n')
                stats['files_changed'] = len([l for l in lines if l.strip() and not l.startswith(' ')])
                
                # Parse insertions/deletions
                for line in lines:
                    if 'insertion' in line or 'deletion' in line:
                        match = re.search(r'(\d+) insertion', line)
                        if match:
                            stats['insertions'] = int(match.group(1))
                        
                        match = re.search(r'(\d+) deletion', line)
                        if match:
                            stats['deletions'] = int(match.group(1))
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting commit stats: {str(e)}")
            return {}
