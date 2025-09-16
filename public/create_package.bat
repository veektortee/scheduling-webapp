@echo off
echo ================================================================
echo  LOCAL SOLVER PACKAGE CREATOR
echo ================================================================
echo.
echo Creating complete local solver package...
echo.

REM Create package directory
if not exist "local-solver-package" mkdir "local-solver-package"

REM Copy all required files
echo [COPY] start_local_solver.bat
copy "start_local_solver.bat" "local-solver-package\"

echo [COPY] start_local_solver.sh  
copy "start_local_solver.sh" "local-solver-package\"

echo [COPY] fastapi_solver_service.py
copy "fastapi_solver_service.py" "local-solver-package\"

echo [COPY] local_solver.py
copy "local_solver.py" "local-solver-package\"

echo [COPY] scheduler_sat_core.py
copy "scheduler_sat_core.py" "local-solver-package\"

REM Create README
echo [CREATE] README.txt
echo # Local Scheduler Optimizer Package > "local-solver-package\README.txt"
echo. >> "local-solver-package\README.txt"
echo ## Quick Start: >> "local-solver-package\README.txt"
echo 1. Extract all files to a folder >> "local-solver-package\README.txt"
echo 2. Run: start_local_solver.bat ^(Windows^) or start_local_solver.sh ^(Mac/Linux^) >> "local-solver-package\README.txt"
echo 3. Keep the window open while using your webapp >> "local-solver-package\README.txt"
echo. >> "local-solver-package\README.txt"
echo ## Files included: >> "local-solver-package\README.txt"
echo - start_local_solver.bat/sh: One-click launcher >> "local-solver-package\README.txt"
echo - fastapi_solver_service.py: Advanced solver ^(RECOMMENDED^) >> "local-solver-package\README.txt"
echo - local_solver.py: Basic fallback solver >> "local-solver-package\README.txt"
echo - scheduler_sat_core.py: Core optimization engine >> "local-solver-package\README.txt"
echo. >> "local-solver-package\README.txt"
echo The advanced solver will automatically detect and use >> "local-solver-package\README.txt"
echo testcase_gui.py if you place it in the parent folder. >> "local-solver-package\README.txt"

echo.
echo ================================================================
echo [Done] Package created: local-solver-package\
echo ================================================================
echo.
echo Contents:
dir "local-solver-package"
echo.
echo Users should download this entire folder!
pause