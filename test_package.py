#!/usr/bin/env python3
"""
Test script to verify the local solver download package works correctly.
This simulates what happens when a user downloads and extracts the ZIP.
"""

import os
import sys
import zipfile
import tempfile
import shutil
import subprocess
from pathlib import Path

def test_zip_package():
    """Test the complete ZIP package functionality."""
    
    print("🧪 Testing Local Solver Package")
    print("=" * 50)
    
    # Get the ZIP file path
    script_dir = Path(__file__).parent
    zip_path = script_dir / "public" / "local-solver-package.zip"
    
    if not zip_path.exists():
        print("[Error] ZIP package not found. Run create_zip_package.bat first!")
        return False
    
    print(f"[Package] Found ZIP package: {zip_path}")
    print(f"📊 Size: {zip_path.stat().st_size:,} bytes")
    
    # Create temporary directory for extraction
    with tempfile.TemporaryDirectory() as temp_dir:
        extract_dir = Path(temp_dir) / "extracted"
        extract_dir.mkdir()
        
        print(f"\n📂 Extracting to: {extract_dir}")
        
        # Extract ZIP
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
        
        # Check extracted files
        expected_files = [
            "start_local_solver.bat",
            "start_local_solver.sh", 
            "fastapi_solver_service.py",
            "local_solver.py",
            "scheduler_sat_core.py",
            "README.txt",
            "requirements.txt",
            "LOCAL_SOLVER_DOWNLOAD_GUIDE.md"
        ]
        
        print("\n[Info] Checking extracted files:")
        all_files_present = True
        
        for filename in expected_files:
            file_path = extract_dir / filename
            if file_path.exists():
                size = file_path.stat().st_size
                print(f"  [Done] {filename} ({size:,} bytes)")
            else:
                print(f"  [Error] {filename} (MISSING)")
                all_files_present = False
        
        if not all_files_present:
            print("\n[Error] Some files are missing from the package!")
            return False
        
        # Test Python file syntax
        print("\n🐍 Testing Python file syntax:")
        
        for py_file in ["fastapi_solver_service.py", "local_solver.py", "scheduler_sat_core.py"]:
            try:
                file_path = extract_dir / py_file
                with open(file_path, 'r', encoding='utf-8') as f:
                    compile(f.read(), py_file, 'exec')
                print(f"  [Done] {py_file} syntax OK")
            except SyntaxError as e:
                print(f"  [Error] {py_file} syntax error: {e}")
                return False
            except Exception as e:
                print(f"  [Warning]  {py_file} warning: {e}")
        
        # Test script permissions (on Unix-like systems)
        if sys.platform != 'win32':
            sh_script = extract_dir / "start_local_solver.sh"
            if sh_script.exists():
                # Make executable
                os.chmod(sh_script, 0o755)
                print("  [Done] start_local_solver.sh made executable")
        
        print("\n[Info] Testing README content:")
        readme_path = extract_dir / "README.txt"
        if readme_path.exists():
            content = readme_path.read_text(encoding='utf-8')
            if "Quick Start Guide" in content and "Windows Users" in content:
                print("  [Done] README contains setup instructions")
            else:
                print("  [Warning]  README may be incomplete")
        
        print("\n[Info] Testing requirements.txt:")
        req_path = extract_dir / "requirements.txt"
        if req_path.exists():
            content = req_path.read_text(encoding='utf-8')
            required_packages = ["fastapi", "uvicorn", "ortools", "websockets"]
            missing_packages = []
            
            for pkg in required_packages:
                if pkg not in content.lower():
                    missing_packages.append(pkg)
            
            if missing_packages:
                print(f"  [Warning]  Missing packages in requirements.txt: {missing_packages}")
            else:
                print("  [Done] All required packages listed")
        
        print("\n" + "=" * 50)
        print("[Done] Package test completed successfully!")
        print(f"[Package] Total files: {len(expected_files)}")
        print(f"💾 Package size: {zip_path.stat().st_size:,} bytes")
        
        # Show download URL info
        print("\n🌐 Download URL: /api/download/local-solver")
        print("[Goal] Settings page: Navigate to Settings → Local Solver section")
        
        return True

def test_api_endpoint():
    """Test the API endpoint (if server is running)."""
    try:
        import requests
        
        print("\n🌐 Testing API endpoint...")
        
        # Test if the endpoint exists
        response = requests.head("http://localhost:3001/api/download/local-solver", timeout=5)
        
        if response.status_code == 200:
            print("  [Done] Download API endpoint responding")
            size = response.headers.get('Content-Length', 'unknown')
            print(f"  📊 Reported size: {size} bytes")
            
            # Test actual download
            response = requests.get("http://localhost:3001/api/download/local-solver", timeout=10)
            if response.status_code == 200:
                print(f"  [Done] Download successful ({len(response.content):,} bytes)")
            else:
                print(f"  [Error] Download failed: {response.status_code}")
                
        elif response.status_code == 404:
            print("  [Error] API endpoint not found (check if server is running)")
        else:
            print(f"  [Warning]  API endpoint status: {response.status_code}")
            
    except ImportError:
        print("  [Warning]  Requests library not available - skipping API test")
    except Exception as e:
        print(f"  [Warning]  API test failed: {e}")

if __name__ == "__main__":
    print("[Feature] Local Solver Package Test Suite")
    print(f"🐍 Python: {sys.version}")
    print(f"💻 Platform: {sys.platform}")
    print()
    
    success = test_zip_package()
    
    if success:
        test_api_endpoint()
        print("\n[Done] All tests completed!")
    else:
        print("\n💥 Tests failed - check package creation")
        sys.exit(1)