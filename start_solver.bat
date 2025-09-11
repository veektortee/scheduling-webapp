@echo off
echo ========================================
echo   Medical Staff Scheduling System
echo   FastAPI Solver Service Quick Start
echo ========================================
echo.

:: Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo    Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

echo ✅ Python is available
python --version

:: Check if pip is available
pip --version >nul 2>&1
if errorlevel 1 (
    echo ❌ pip is not available
    echo    Please ensure pip is installed with Python
    pause
    exit /b 1
)

echo ✅ pip is available

:: Install dependencies
echo.
echo 📦 Installing Python dependencies...
pip install -r requirements.txt

if errorlevel 1 (
    echo ❌ Failed to install dependencies
    echo    Trying individual installation...
    pip install fastapi uvicorn websockets python-multipart ortools openpyxl colorama
)

:: Check if FastAPI service file exists
if not exist "fastapi_solver_service.py" (
    echo ❌ fastapi_solver_service.py not found
    echo    Please ensure you're in the correct directory
    pause
    exit /b 1
)

:: Start the FastAPI service
echo.
echo 🚀 Starting FastAPI Solver Service...
echo    Service will be available at: http://localhost:8000
echo    API Documentation at: http://localhost:8000/docs
echo.
echo 💡 Next steps:
echo    1. Keep this window open (solver service)
echo    2. Open new terminal for: npm run dev
echo    3. Open browser: http://localhost:3000
echo.
echo ⚠️  Press Ctrl+C to stop the service
echo.

python fastapi_solver_service.py

echo.
echo Service stopped.
pause