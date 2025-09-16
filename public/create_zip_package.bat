@echo off
echo ================================================================
echo  CREATING LOCAL SOLVER ZIP PACKAGE
echo ================================================================
echo.

REM Clean up any existing package
if exist "local-solver-package.zip" del "local-solver-package.zip"
if exist "temp-package" rmdir /s /q "temp-package"

REM Create temporary directory for packaging
mkdir "temp-package"

echo [COPY] Copying solver files...
copy "start_local_solver.bat" "temp-package\"
copy "start_local_solver.sh" "temp-package\"  
copy "fastapi_solver_service.py" "temp-package\"
copy "local_solver.py" "temp-package\"
copy "scheduler_sat_core.py" "temp-package\"

REM Create comprehensive README
echo [CREATE] Creating README.txt...
(
echo # Local Staff Scheduling Optimizer
echo.
echo ## [Feature] Quick Start Guide
echo.
echo ### Windows Users:
echo 1. Extract this ZIP file to any folder
echo 2. Double-click: start_local_solver.bat
echo 3. Keep the window open while using your webapp
echo 4. Your webapp will automatically use this high-performance local solver!
echo.
echo ### Mac/Linux Users:
echo 1. Extract this ZIP file to any folder  
echo 2. Open terminal in the extracted folder
echo 3. Run: chmod +x start_local_solver.sh
echo 4. Run: ./start_local_solver.sh
echo 5. Keep the terminal open while using your webapp
echo.
echo ## [Files] Files Included
echo.
echo ### Main Launchers:
echo - start_local_solver.bat    ^(Windows launcher^)
echo - start_local_solver.sh     ^(Mac/Linux launcher^)
echo.
echo ### Solver Components:
echo - fastapi_solver_service.py ^(RECOMMENDED - Advanced solver^)
echo - local_solver.py          ^(Fallback solver^)
echo - scheduler_sat_core.py     ^(Core optimization engine^)
echo.
echo ## [Feature] Performance Features
echo.
echo The advanced solver ^(fastapi_solver_service.py^) provides:
echo - Multi-threaded OR-Tools optimization
echo - WebSocket real-time progress updates
echo - Advanced constraint handling
echo - Automatic testcase_gui.py detection ^(if available^)
echo - REST API endpoints for integration
echo.
echo ## [Maintenance] Advanced Usage
echo.
echo ### For Maximum Performance:
echo If you have testcase_gui.py, place it in the PARENT folder
echo of where you extracted these files. The advanced solver will
echo automatically detect and use it for even better optimization!
echo.
echo ### API Endpoints ^(when running^):
echo - http://localhost:8000/health   ^(Check if running^)
echo - http://localhost:8000/docs     ^(API documentation^)
echo - http://localhost:8000/solve    ^(Optimization endpoint^)
echo.
echo ## [Maintenance] Troubleshooting
echo.
echo ### Dependencies:
echo The launcher automatically installs required Python packages:
echo - fastapi, uvicorn, websockets, python-multipart
echo - ortools ^(Google OR-Tools for optimization^)
echo - openpyxl, colorama ^(for Excel export and colored output^)
echo.
echo ### System Requirements:
echo - Python 3.8+ ^(download from python.org if needed^)
echo - Internet connection ^(for initial package installation^)
echo - 2GB+ RAM recommended for large schedules
echo.
echo ### Common Issues:
echo - If you see "Python not found": Install Python from python.org
echo - If packages fail to install: Try running as administrator
echo - If webapp can't connect: Check firewall allows localhost:8000
echo.
echo ## 📞 Support
echo.
echo This is a high-performance local solver for staff scheduling.
echo It uses Google OR-Tools constraint programming for optimal solutions.
echo.
echo Generated: %DATE% %TIME%
) > "temp-package\README.txt"

echo [CREATE] Creating requirements.txt for easy installation...
(
echo # Local Staff Scheduling Solver - Python Dependencies
echo # Auto-installed by start scripts, but available for manual installation
echo.
echo fastapi^>=0.104.0
echo uvicorn[standard]^>=0.24.0  
echo websockets^>=12.0
echo python-multipart^>=0.0.6
echo.
echo # Optimization Engine
echo ortools^>=9.8
echo.
echo # Utilities
echo openpyxl^>=3.1.2
echo python-dateutil^>=2.8.2
echo.
echo # Console Output
echo colorama^>=0.4.6
echo.
echo # Production WSGI Server ^(optional^)
echo waitress==2.1.2
) > "temp-package\requirements.txt"

echo [ZIP] Creating ZIP package...
REM Use PowerShell to create ZIP (works on Windows 10+)
powershell -Command "Compress-Archive -Path 'temp-package\*' -DestinationPath 'local-solver-package.zip' -Force"

if exist "local-solver-package.zip" (
    echo.
    echo ================================================================
    echo [Done] SUCCESS! Created: local-solver-package.zip
    echo ================================================================
    echo.
    echo [Note] Package Contents:
    powershell -Command "Get-ChildItem -Path 'temp-package' | Format-Table Name, Length -AutoSize"
    echo.
    echo 📊 ZIP Size:
    dir "local-solver-package.zip"
    echo.
    echo [Feature] Users can now download local-solver-package.zip
    echo    and extract it anywhere to get the complete solver!
    echo.
) else (
    echo [Error] Failed to create ZIP package
)

REM Clean up temporary directory
rmdir /s /q "temp-package"

echo ================================================================
pause