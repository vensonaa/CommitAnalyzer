#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Change to the backend directory
cd "$SCRIPT_DIR/backend"

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "Warning: Virtual environment not found. Please run setup.sh first."
fi

# Set PYTHONPATH to include the parent directory (project root)
export PYTHONPATH="${PYTHONPATH}:$(pwd)/.."

echo "Starting backend server..."
echo "PYTHONPATH: $PYTHONPATH"
python main.py
