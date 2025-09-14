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
echo "Preparing environment and installing/checking dependencies..."
echo ""

# Upgrade pip and tooling first
echo "[INFO] Upgrading pip and setuptools..."
$PYTHON_CMD -m pip install --upgrade pip setuptools wheel || {
    echo "[WARN] Could not upgrade pip/setuptools; continuing with existing environment"
}

# Create and use a virtual environment if not already inside one
if [ -z "$VIRTUAL_ENV" ]; then
    if [ ! -d ".venv" ]; then
        echo "[INFO] Creating virtual environment in ./ .venv"
        $PYTHON_CMD -m venv .venv || echo "[WARN] Could not create virtualenv"
    fi
    # shellcheck disable=SC1091
    if [ -f ".venv/bin/activate" ]; then
        echo "[INFO] Activating virtual environment"
        . .venv/bin/activate
    fi
fi

# Prefer requirements.txt if present (install with --upgrade to get latest compatible versions)
if [ -f requirements.txt ]; then
    echo "[INSTALL] Installing/Upgrading from requirements.txt"
    $PYTHON_CMD -m pip install --upgrade -r requirements.txt || {
        echo "[ERROR] Failed to install/upgrade requirements"
        exit 1
    }
else
    echo "[INSTALL] Installing/Upgrading core packages (fastapi, uvicorn, websockets, python-multipart, ortools, openpyxl, colorama)"
    $PYTHON_CMD -m pip install --upgrade fastapi 'uvicorn[standard]' websockets python-multipart ortools openpyxl colorama || {
        echo "[ERROR] Failed to install core packages"
        exit 1
    }
fi

# If Node project present, ensure JS packages are synced to lockfile (prefer npm ci for reproducible installs)

if [ -f package.json ]; then
    if command -v npm >/dev/null 2>&1; then
        if [ -f package-lock.json ] || [ -f pnpm-lock.yaml ]; then
            echo "[INFO] Running 'npm ci' to install JS dependencies from lockfile (reproducible)"
            npm ci || echo "[WARN] 'npm ci' failed; falling back to 'npm install'" && npm install || echo "[WARN] npm install also failed"
        else
            echo "[INFO] Running 'npm install' to ensure JS dependencies are present"
            npm install || echo "[WARN] npm install failed"
        fi
    else
        echo "[WARN] npm not found; skipping JS dependency sync"
    fi
fi

echo ""
echo "[START] Starting Local Scheduler Optimizer (FastAPI preferred)..."
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

# Prefer FastAPI service which integrates testcase_gui.py if available
if [ -f fastapi_solver_service.py ]; then
    echo "[INFO] Launching FastAPI solver service on http://localhost:8000"
    echo "[INFO] This service will try to use testcase_gui.py if found."
    $PYTHON_CMD fastapi_solver_service.py
elif [ -f local_solver.py ]; then
    echo "[WARN] fastapi_solver_service.py not found, falling back to basic local_solver.py"
    $PYTHON_CMD local_solver.py
else
    echo "[ERROR] No solver entrypoint found (fastapi_solver_service.py or local_solver.py)"
fi

echo ""
echo "Local solver stopped. Press Enter to exit..."
read