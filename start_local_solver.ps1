<#
PowerShell helper to start the local solver service on Windows.
- Ensures Python is present
- Creates/activates a .venv virtual environment (best-effort)
- Upgrades pip/setuptools/wheel
- Installs/Upgrades Python packages from requirements.txt (or core set)
- Runs `npm ci` when package-lock.json exists (or `npm install` otherwise)
- Starts the FastAPI service if available
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host ""
Write-Host "================================================================"
Write-Host " ONE-CLICK LOCAL SCHEDULER OPTIMIZER (PowerShell)"
Write-Host "================================================================"
Write-Host ""

function ExitWithError([string]$msg){
    Write-Host "[ERROR] $msg" -ForegroundColor Red
    exit 1
}

# Locate Python
$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
    ExitWithError "Python not found. Please install Python 3.8+ from https://python.org"
}
$pythonPath = $python.Path
Write-Host "[OK] Python found: $pythonPath"

# Upgrade pip and tooling
Write-Host "[INFO] Upgrading pip, setuptools and wheel..."
& $pythonPath -m pip install --upgrade pip setuptools wheel || Write-Warning "Could not upgrade pip"

# Create venv if missing
$venvActivate = Join-Path -Path $PSScriptRoot -ChildPath ".venv\Scripts\Activate.ps1"
if (-not (Test-Path $venvActivate)) {
    Write-Host "[INFO] Creating virtualenv in .venv"
    & $pythonPath -m venv .venv
}

# Activate venv (in this script only)
if (Test-Path $venvActivate) {
    Write-Host "[INFO] Activating virtualenv"
    . $venvActivate
}

# Install/upgrade packages
if (Test-Path (Join-Path $PSScriptRoot 'requirements.txt')) {
    Write-Host "[INSTALL] Installing/Upgrading from requirements.txt"
    & $pythonPath -m pip install --upgrade -r requirements.txt
} else {
    Write-Host "[INSTALL] Installing/Upgrading core packages"
    & $pythonPath -m pip install --upgrade fastapi 'uvicorn[standard]' websockets python-multipart ortools openpyxl colorama
}

# Sync JS dependencies if present
if (Test-Path (Join-Path $PSScriptRoot 'package.json')) {
    $npm = Get-Command npm -ErrorAction SilentlyContinue
    if ($npm) {
        if (Test-Path (Join-Path $PSScriptRoot 'package-lock.json')) {
            Write-Host "[INFO] Running 'npm ci' to install JS deps from lockfile"
            npm ci || Write-Warning "npm ci failed; falling back to npm install"; npm install
        } else {
            Write-Host "[INFO] Running 'npm install' to ensure JS deps are present"
            npm install
        }
    } else {
        Write-Warning "npm not found; skipping JS dependency sync"
    }
}

# Start solver
if (Test-Path (Join-Path $PSScriptRoot 'fastapi_solver_service.py')) {
    Write-Host "[INFO] Launching FastAPI solver service on http://localhost:8000"
    & $pythonPath (Join-Path $PSScriptRoot 'fastapi_solver_service.py')
} elseif (Test-Path (Join-Path $PSScriptRoot 'local_solver.py')) {
    Write-Host "[WARN] fastapi_solver_service.py not found, falling back to local_solver.py"
    & $pythonPath (Join-Path $PSScriptRoot 'local_solver.py')
} else {
    Write-Warning "No solver entrypoint found (fastapi_solver_service.py or local_solver.py)"
}

Write-Host "\nLocal solver stopped. Press Enter to exit..."
[void][System.Console]::ReadLine()
