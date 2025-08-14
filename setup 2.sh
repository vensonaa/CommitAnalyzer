#!/bin/bash

# Commit Regression Analyzer Setup Script
# This script sets up the complete system for analyzing code commits and detecting regressions

set -e

echo "🚀 Setting up Commit Regression Analyzer..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is required but not installed."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is required but not installed."
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is required but not installed."
        exit 1
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        print_error "Git is required but not installed."
        exit 1
    fi
    
    print_success "All system requirements are met!"
}

# Setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    print_status "Activating virtual environment..."
    source venv/bin/activate
    
    # Upgrade pip
    print_status "Upgrading pip..."
    pip install --upgrade pip
    
    # Install dependencies
    print_status "Installing Python dependencies..."
    pip install -r requirements.txt
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        print_status "Creating environment configuration..."
        cp env.example .env
        print_warning "Please edit .env file and add your API keys!"
    fi
    
    cd ..
    print_success "Backend setup completed!"
}

# Setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    cd frontend
    
    # Install dependencies
    print_status "Installing Node.js dependencies..."
    npm install
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        print_status "Creating frontend environment configuration..."
        echo "REACT_APP_API_URL=http://localhost:8000" > .env
    fi
    
    cd ..
    print_success "Frontend setup completed!"
}

# Setup MCP server
setup_mcp_server() {
    print_status "Setting up MCP server..."
    
    cd mcp_server
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment for MCP server..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    print_status "Activating MCP virtual environment..."
    source venv/bin/activate
    
    # Install dependencies
    print_status "Installing MCP server dependencies..."
    pip install -r requirements.txt
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        print_status "Creating MCP environment configuration..."
        cp env.example .env
    fi
    
    cd ..
    print_success "MCP server setup completed!"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p backend/logs
    mkdir -p backend/uploads
    mkdir -p frontend/build
    
    print_success "Directories created!"
}

# Initialize database
init_database() {
    print_status "Initializing database..."
    
    cd backend
    source venv/bin/activate
    
    # Run database initialization
    python3 -c "
import asyncio
from database.database import init_db

async def main():
    await init_db()
    print('Database initialized successfully!')

asyncio.run(main())
"
    
    cd ..
    print_success "Database initialized!"
}

# Create start scripts
create_start_scripts() {
    print_status "Creating start scripts..."
    
    # Backend start script
    cat > start_backend.sh << 'EOF'
#!/bin/bash
cd backend
source venv/bin/activate
python main.py
EOF
    chmod +x start_backend.sh
    
    # Frontend start script
    cat > start_frontend.sh << 'EOF'
#!/bin/bash
cd frontend
npm start
EOF
    chmod +x start_frontend.sh
    
    # MCP server start script
    cat > start_mcp.sh << 'EOF'
#!/bin/bash
cd mcp_server
source venv/bin/activate
python server.py
EOF
    chmod +x start_mcp.sh
    
    # Combined start script
    cat > start_all.sh << 'EOF'
#!/bin/bash
echo "Starting Commit Regression Analyzer..."

# Start backend in background
echo "Starting backend server..."
cd backend
source venv/bin/activate
python main.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend in background
echo "Starting frontend..."
cd frontend
npm start &
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
EOF
    chmod +x start_all.sh
    
    print_success "Start scripts created!"
}

# Display setup completion message
show_completion_message() {
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Edit backend/.env and add your API keys:"
    echo "   - GROQ_API_KEY (required)"
    echo "   - OPENAI_API_KEY (optional)"
    echo ""
    echo "2. Start the system:"
    echo "   ./start_all.sh"
    echo ""
    echo "3. Or start services individually:"
    echo "   ./start_backend.sh  # Backend API server"
    echo "   ./start_frontend.sh # Frontend web interface"
    echo "   ./start_mcp.sh      # MCP server for IDE integration"
    echo ""
    echo "4. Access the application:"
    echo "   - Web Interface: http://localhost:3000"
    echo "   - API Documentation: http://localhost:8000/docs"
    echo ""
    echo "For more information, see the README.md file."
}

# Main setup process
main() {
    echo "=========================================="
    echo "  Commit Regression Analyzer Setup"
    echo "=========================================="
    echo ""
    
    check_requirements
    create_directories
    setup_backend
    setup_frontend
    setup_mcp_server
    init_database
    create_start_scripts
    show_completion_message
}

# Run main function
main "$@"
