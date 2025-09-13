@echo off
echo ========================================
echo   Staff Scheduling System
echo   FastAPI Solver Service Quick Start
echo ========================================
echo.

:: Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo    Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

echo [OK] Python is available
python --version

:: Check if pip is available
pip --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] pip is not available
    echo    Please ensure pip is installed with Python
    pause
    exit /b 1
)

echo [OK] pip is available

:: Prepare environment and install dependencies
echo.
echo [INFO] Upgrading pip and setuptools
python -m pip install --upgrade pip setuptools wheel || echo [WARN] Could not upgrade pip

:: Create virtualenv if not present
if not exist .venv\Scripts\activate.bat (
    echo [INFO] Creating virtual environment in .venv
    python -m venv .venv || echo [WARN] Could not create virtualenv
)

if exist .venv\Scripts\activate.bat (
    call .venv\Scripts\activate.bat
)

echo [INSTALL] Installing/Upgrading Python dependencies (from requirements.txt if present)
if exist requirements.txt (
    python -m pip install --upgrade -r requirements.txt
) else (
    python -m pip install --upgrade fastapi uvicorn[standard] websockets python-multipart ortools openpyxl colorama
)

if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    echo    Please inspect error messages above
)

:: Sync JS dependencies if present
if exist package.json (
    where npm >nul 2>&1
    if errorlevel 1 (
        echo [WARN] npm not found; skipping JS dependency sync
    ) else (
        if exist package-lock.json (
            echo [INFO] Running npm ci to install JS deps from lockfile
            npm ci || (echo [WARN] npm ci failed & echo [INFO] falling back to npm install & npm install)
        ) else (
            echo [INFO] Running npm install to ensure JS deps are present
            npm install || echo [WARN] npm install failed
        )
    )
)

:: Check if FastAPI service file exists
if not exist "fastapi_solver_service.py" (
    echo [ERROR] fastapi_solver_service.py not found
    echo    Please ensure you're in the correct directory
    pause
    exit /b 1
)

:: Start the FastAPI service
echo.
echo [START] Starting FastAPI Solver Service...
echo    Service will be available at: http://localhost:8000
echo    API Documentation at: http://localhost:8000/docs
echo.
echo [INFO] Next steps:
echo    1. Keep this window open (solver service)
echo    2. Open new terminal for: npm run dev
echo    3. Open browser: http://localhost:3000
echo.
echo [WARNING] Press Ctrl+C to stop the service
echo.

python fastapi_solver_service.py

echo.
echo Service stopped.
pause