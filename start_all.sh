#!/bin/bash
echo "Starting Commit Regression Analyzer..."

# Start backend in background
echo "Starting backend server..."
cd backend
source venv/bin/activate
export PYTHONPATH="${PYTHONPATH}:$(pwd)/.."
python main.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend in background
echo "Starting frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "System started!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
