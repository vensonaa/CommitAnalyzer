#!/bin/bash
cd mcp_server
source venv/bin/activate
export PYTHONPATH="${PYTHONPATH}:$(pwd)/.."
python server.py
