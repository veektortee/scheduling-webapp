@echo off
setlocal ENABLEDELAYEDEXPANSION
pushd "%~dp0"

echo.
echo ================================================================
echo  ONE-CLICK LOCAL SCHEDULER OPTIMIZER
echo ================================================================
echo.
echo Checking Python installation...

python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found! Please install Python 3.8+ from python.org
    echo    Or download from: https://python.org/downloads/
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('python -c "import sys;print(sys.executable)"') do set PY_EXE=%%v
echo [OK] Python found: %PY_EXE%

echo.
echo Installing/checking dependencies...
echo.

REM Prefer requirements.txt if present
if exist requirements.txt (
    echo [INSTALL] Using requirements.txt
    "%PY_EXE%" -m pip install -r requirements.txt
) else (
    echo [INSTALL] Installing core packages (fastapi, uvicorn, websockets, python-multipart, ortools, openpyxl, colorama)
    "%PY_EXE%" -m pip install fastapi uvicorn[standard] websockets python-multipart ortools openpyxl colorama
)

if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    popd
    exit /b 1
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
    echo [INFO] The service will try to use testcase_gui.py if found in parent folder.
    "%PY_EXE%" fastapi_solver_service.py
) else if exist local_solver.py (
    echo [WARN] fastapi_solver_service.py not found, falling back to basic local_solver.py
    "%PY_EXE%" local_solver.py
) else (
    echo [ERROR] No solver entrypoint found (fastapi_solver_service.py or local_solver.py)
)

echo.
echo Local solver stopped. Press any key to exit...
pause >nul
popd