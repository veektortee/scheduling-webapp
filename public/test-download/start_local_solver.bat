@echo off
echo.
echo ================================================================
echo  ONE-CLICK LOCAL SCHEDULER OPTIMIZER
echo ================================================================
echo.
echo Checking Python installation...

python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found! Please install Python 3.7+ from python.org
    echo    Or download from: https://python.org/downloads/
    pause
    exit /b 1
)

echo [OK] Python found
echo.
echo Installing/checking dependencies...
echo.

for /f "tokens=*" %%v in ('python -c "import sys;print(sys.executable)"') do set PY_EXE=%%v
if not defined PY_EXE set PY_EXE=python

if exist requirements.txt (
    echo [INSTALL] Using requirements.txt
    "%PY_EXE%" -m pip install -r requirements.txt
) else (
    echo [INSTALL] Installing core packages (fastapi, uvicorn, websockets, python-multipart, ortools, openpyxl, colorama)
    "%PY_EXE%" -m pip install fastapi uvicorn[standard] websockets python-multipart ortools openpyxl colorama
)

echo.
echo [START] Starting Local Scheduler Optimizer (FastAPI preferred)...
echo.
echo ================================================================
echo  INSTRUCTIONS FOR YOUR WEBAPP:
echo ================================================================
echo  1. Keep this window open while using the scheduler webapp
echo  2. The webapp will automatically use this local solver 
echo  3. Close this window to stop local solver (webapp continues with serverless)
echo ================================================================
echo.

REM Check for required solver files
if exist fastapi_solver_service.py (
    echo [INFO] ✅ Found FastAPI solver service - launching ADVANCED scheduler
    echo [INFO] 🔍 This will automatically detect and use testcase_gui.py if available
    echo [INFO] 🚀 Starting high-performance medical scheduling optimizer...
    "%PY_EXE%" fastapi_solver_service.py
) else if exist local_solver.py (
    echo [WARN] ⚠️  fastapi_solver_service.py not found, using basic solver
    echo [INFO] ⚡ OR-Tools detected - using high-performance solver
    echo [INFO] 💡 For BEST performance, download fastapi_solver_service.py too
    "%PY_EXE%" local_solver.py
) else (
    echo.
    echo ================================================================
    echo  ❌ MISSING REQUIRED FILES
    echo ================================================================
    echo You need to download these files to the SAME folder as this .bat:
    echo.
    echo  📁 REQUIRED FILES:
    echo    • fastapi_solver_service.py  ^(RECOMMENDED - Advanced solver^)
    echo    • local_solver.py           ^(Fallback - Basic solver^)
    echo    • scheduler_sat_core.py     ^(Core optimization engine^)
    echo.
    echo  📂 Download all files from your scheduling webapp:
    echo    /api/download/local-solver-package
    echo.
    echo ================================================================
    pause
    exit /b 1
)

echo.
echo Local solver stopped. Press any key to exit...
pause >nul