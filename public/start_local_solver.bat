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

REM Prefer FastAPI solver service which will use testcase_gui.py if present
if exist fastapi_solver_service.py (
    echo [INFO] Launching FastAPI solver service on http://localhost:8000
    echo [INFO] This service will try to use testcase_gui.py if found.
    "%PY_EXE%" fastapi_solver_service.py
) else (
    echo [WARN] fastapi_solver_service.py not found, falling back to basic local_solver.py
    "%PY_EXE%" local_solver.py
)

echo.
echo Local solver stopped. Press any key to exit...
pause >nul