#!/bin/bash
cd backend
source venv/bin/activate
export PYTHONPATH="${PYTHONPATH}:$(pwd)/.."
python main.py
