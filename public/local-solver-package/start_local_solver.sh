#!/bin/bash

echo ""
echo "================================================================"
echo " ONE-CLICK LOCAL SCHEDULER OPTIMIZER"
echo "================================================================"
echo ""
echo "Checking Python installation..."

if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        echo "[ERROR] Python not found! Please install Python 3.7+"
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

echo "[OK] Python found ($PYTHON_CMD)"
echo ""
echo "Installing/checking dependencies..."
echo ""

if [ -f requirements.txt ]; then
    echo "[INSTALL] Using requirements.txt"
    $PYTHON_CMD -m pip install -r requirements.txt || {
        echo "[ERROR] Failed to install requirements"
        exit 1
    }
else
    echo "[INSTALL] Installing core packages (fastapi, uvicorn, websockets, python-multipart, ortools, openpyxl, colorama)"
    $PYTHON_CMD -m pip install fastapi 'uvicorn[standard]' websockets python-multipart ortools openpyxl colorama || {
        echo "[ERROR] Failed to install core packages"
        exit 1
    }
fi

echo ""
echo "[START] Starting Local Scheduler Optimizer..."
echo ""
echo "================================================================"
echo " INSTRUCTIONS FOR YOUR WEBAPP:"
echo "================================================================"
echo " 1. Keep this terminal open while using the scheduler webapp"
echo " 2. The webapp will automatically use this local solver"
echo " 3. Close this terminal to stop local solver (webapp continues with serverless)"
echo "================================================================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

if [ -f fastapi_solver_service.py ]; then
    echo "[INFO] ✅ Found FastAPI solver service - launching ADVANCED scheduler"
    echo "[INFO] 🔍 This will automatically detect and use testcase_gui.py if available"
    echo "[INFO] 🚀 Starting high-performance medical scheduling optimizer..."
    $PYTHON_CMD fastapi_solver_service.py
elif [ -f local_solver.py ]; then
    echo "[WARN] ⚠️  fastapi_solver_service.py not found, using basic solver"
    echo "[INFO] ⚡ OR-Tools detected - using high-performance solver"
    echo "[INFO] 💡 For BEST performance, download fastapi_solver_service.py too"
    $PYTHON_CMD local_solver.py
else
    echo ""
    echo "================================================================"
    echo " ❌ MISSING REQUIRED FILES"
    echo "================================================================"
    echo "You need to download these files to the SAME folder as this script:"
    echo ""
    echo " 📁 REQUIRED FILES:"
    echo "   • fastapi_solver_service.py  (RECOMMENDED - Advanced solver)"
    echo "   • local_solver.py           (Fallback - Basic solver)"
    echo "   • scheduler_sat_core.py     (Core optimization engine)"
    echo ""
    echo " 📂 Download all files from your scheduling webapp:"
    echo "   /api/download/local-solver-package"
    echo ""
    echo "================================================================"
    read -p "Press Enter to exit..."
    exit 1
fi

echo ""
echo "Local solver stopped. Press Enter to exit..."
read