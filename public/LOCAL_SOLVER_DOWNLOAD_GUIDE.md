# [Feature] Local Staff Scheduling Solver Package

## Overview
This ZIP package contains a complete high-performance local solver for staff scheduling optimization. It runs on your computer to provide faster, more advanced scheduling compared to the basic online solver.

## [Package] Package Contents
- **start_local_solver.bat** - Windows one-click launcher
- **start_local_solver.sh** - Mac/Linux launcher  
- **fastapi_solver_service.py** - Advanced FastAPI solver with OR-Tools
- **local_solver.py** - Fallback solver (basic functionality)
- **scheduler_sat_core.py** - Core optimization engine
- **requirements.txt** - Python dependencies list
- **README.txt** - Detailed setup instructions

## [Info] Quick Start

### Windows Users:
1. **Download**: Get `local-solver-package.zip` from your webapp settings
2. **Extract**: Unzip to any folder (e.g., `C:\staff-scheduler\`)
3. **Launch**: Double-click `start_local_solver.bat`
4. **Wait**: Let it install dependencies automatically
5. **Use**: Keep the window open while using your webapp!

### Mac/Linux Users:
1. **Download**: Get `local-solver-package.zip` from your webapp settings  
2. **Extract**: Unzip to any folder
3. **Terminal**: Open terminal in the extracted folder
4. **Permissions**: Run `chmod +x start_local_solver.sh`
5. **Launch**: Run `./start_local_solver.sh`
6. **Use**: Keep the terminal open while using your webapp!

## [Goal] Features

### Advanced Performance:
- **OR-Tools Integration**: Uses Google's constraint programming solver
- **Multi-threading**: Parallel processing for faster optimization
- **WebSocket Updates**: Real-time progress tracking
- **Smart Detection**: Automatically finds testcase_gui.py if available
- **REST API**: Full HTTP API at http://localhost:8000

### Automatic Setup:
- **Dependency Management**: Auto-installs Python packages
- **Cross-platform**: Works on Windows, Mac, and Linux
- **One-click Launch**: No manual configuration needed
- **Fallback Support**: Graceful degradation if components fail

## [Maintenance] Advanced Usage

### Maximum Performance:
If you have a custom `testcase_gui.py` file:
1. Place it in the **parent folder** of where you extracted the ZIP
2. The solver will automatically detect and use it
3. This provides the highest performance optimization

### API Endpoints:
When running, the local solver provides:
- **http://localhost:8000/health** - Check if running
- **http://localhost:8000/docs** - Interactive API documentation  
- **http://localhost:8000/solve** - Direct optimization endpoint

### Manual Installation:
If automatic dependency installation fails:
```bash
pip install fastapi uvicorn websockets python-multipart ortools openpyxl colorama
```

## [Maintenance] System Requirements

### Minimum:
- **Python**: 3.8+ (download from python.org)
- **RAM**: 1GB available memory
- **Storage**: 500MB for dependencies
- **Network**: Internet connection for initial setup

### Recommended:
- **Python**: 3.10+ for best performance
- **RAM**: 2GB+ for large schedules (50+ staff, complex constraints)
- **CPU**: Multi-core processor for parallel optimization
- **Storage**: 1GB+ available space

## 🚨 Troubleshooting

### Common Issues:

**"Python not found"**:
- Install Python from https://python.org
- Make sure to check "Add Python to PATH" during installation

**"Package installation failed"**:
- Try running as administrator/sudo
- Check internet connection
- Manual installation: `pip install -r requirements.txt`

**"Webapp can't connect to local solver"**:
- Verify solver window shows "Server running on http://localhost:8000"
- Check Windows firewall allows localhost connections
- Try accessing http://localhost:8000/health in browser

**"Optimization is slow"**:
- Place testcase_gui.py in parent folder for maximum performance
- Ensure 2GB+ RAM available
- Close other resource-intensive applications

### Performance Comparison:
- **Basic online solver**: Simple heuristics, limited constraints
- **Local solver**: OR-Tools CP-SAT, advanced constraint handling
- **Local + testcase_gui.py**: Maximum performance, custom optimization

## 📞 Support

This solver uses state-of-the-art optimization technology:
- **Google OR-Tools**: Industry-standard constraint programming
- **FastAPI**: High-performance async web framework
- **CP-SAT**: Conflict-driven clause learning SAT solver

Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

---
*For technical support or custom optimization needs, consult your system administrator.*