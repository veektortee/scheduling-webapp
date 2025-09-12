@echo off
echo.
echo ================================================================
echo  ONE-CLICK LOCAL SCHEDULER OPTIMIZER
echo ================================================================
echo.
echo Checking Python installation...

python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found! Please install Python 3.7+ from python.org
    echo    Or download from: https://python.org/downloads/
    pause
    exit /b 1
)

echo ✅ Python found
echo.
echo Installing/checking dependencies...
echo.

REM Install required packages
pip install ortools 2>nul || (
    echo 💡 Installing OR-Tools for high performance...
    pip install ortools
)

echo.
echo 🚀 Starting Local Scheduler Optimizer...
echo.
echo ================================================================
echo  INSTRUCTIONS FOR YOUR WEBAPP:
echo ================================================================
echo  1. Keep this window open while using the scheduler webapp
echo  2. The webapp will automatically use this local solver 
echo  3. Close this window to stop local solver (webapp continues with serverless)
echo ================================================================
echo.

REM Start the local solver
python local_solver.py

echo.
echo Local solver stopped. Press any key to exit...
pause >nul