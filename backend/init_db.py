#!/usr/bin/env python3
"""
Database initialization script for Commit Regression Analyzer
"""

import sys
import os
import asyncio

# Add the parent directory to the Python path to import from root database directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import DatabaseManager

async def init_database():
    """Initialize the database"""
    try:
        db_manager = DatabaseManager()
        await db_manager.init_database()
        print("Database initialized successfully!")
        await db_manager.close_database()
    except Exception as e:
        print(f"Error initializing database: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(init_database())
