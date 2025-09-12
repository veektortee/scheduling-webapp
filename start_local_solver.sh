#!/bin/bash

echo ""
echo "================================================================"
echo " ONE-CLICK LOCAL SCHEDULER OPTIMIZER"
echo "================================================================"
echo ""
echo "Checking Python installation..."

if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        echo "❌ Python not found! Please install Python 3.7+"
        echo "   macOS: brew install python3"
        echo "   Ubuntu: sudo apt install python3 python3-pip"
        echo "   Or download from: https://python.org/downloads/"
        exit 1
    else
        PYTHON_CMD="python"
    fi
else
    PYTHON_CMD="python3"
fi

echo "✅ Python found ($PYTHON_CMD)"
echo ""
echo "Installing/checking dependencies..."
echo ""

# Install required packages
$PYTHON_CMD -m pip install ortools 2>/dev/null || {
    echo "💡 Installing OR-Tools for high performance..."
    $PYTHON_CMD -m pip install ortools
}

echo ""
echo "🚀 Starting Local Scheduler Optimizer..."
echo ""
echo "================================================================"
echo " INSTRUCTIONS FOR YOUR WEBAPP:"
echo "================================================================"
echo " 1. Keep this terminal open while using the scheduler webapp"
echo " 2. The webapp will automatically use this local solver"
echo " 3. Close this terminal to stop local solver (webapp continues with serverless)"
echo "================================================================"
echo ""

# Start the local solver
$PYTHON_CMD local_solver.py

echo ""
echo "Local solver stopped. Press Enter to exit..."
read