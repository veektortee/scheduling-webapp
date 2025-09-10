#!/usr/bin/env python3
"""
Local Python Solver Service for Medical Staff Scheduling

This service runs locally on the admin's machine and provides an API endpoint
for the web application to trigger the optimization solver.

Usage:
    python solver_service.py

The service will run on http://localhost:8000/solve
"""

import json
import logging
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List
import subprocess
import traceback

try:
    from flask import Flask, request, jsonify
    from flask_cors import CORS
except ImportError:
    print("Please install required packages: pip install flask flask-cors")
    sys.exit(1)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Allow requests from the web app

class SchedulingSolver:
    def __init__(self):
        self.output_dir = Path("solver_output")
        self.output_dir.mkdir(exist_ok=True)
        
    def solve(self, case_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main solver function. This is where you'd integrate your existing
        Python optimization logic from testcase_gui.py
        """
        try:
            # Generate unique run ID
            run_id = f"run_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            run_output_dir = self.output_dir / run_id
            run_output_dir.mkdir(exist_ok=True)
            
            # Save input case
            case_file = run_output_dir / "input_case.json"
            with open(case_file, 'w') as f:
                json.dump(case_data, f, indent=2)
            
            logger.info(f"Starting optimization run: {run_id}")
            
            # TODO: Replace this section with your actual solver logic
            # For now, we'll simulate the solver process
            result = self._run_simulation(case_data, run_output_dir)
            
            # Save results
            result_file = run_output_dir / "results.json"
            with open(result_file, 'w') as f:
                json.dump(result, f, indent=2)
                
            logger.info(f"Optimization completed: {run_id}")
            
            return {
                "status": "success",
                "run_id": run_id,
                "output_directory": str(run_output_dir),
                "result": result
            }
            
        except Exception as e:
            logger.error(f"Solver error: {str(e)}")
            logger.error(traceback.format_exc())
            return {
                "status": "error",
                "message": str(e),
                "traceback": traceback.format_exc()
            }
    
    def _run_simulation(self, case_data: Dict[str, Any], output_dir: Path) -> Dict[str, Any]:
        """
        Simulation of the solver. Replace this with your actual OR-Tools logic.
        """
        shifts = case_data.get('shifts', [])
        providers = case_data.get('providers', [])
        calendar_days = case_data.get('calendar', {}).get('days', [])
        
        # Create mock assignments (replace with real optimization)
        assignments = []
        for shift in shifts:
            # Simple assignment logic (replace with your complex constraints)
            eligible_providers = [p for p in providers if not shift.get('allowed_provider_types') or 
                                p.get('type', 'MD') in shift.get('allowed_provider_types', [])]
            
            if eligible_providers:
                assigned_provider = eligible_providers[0]  # Simple assignment
                assignments.append({
                    "shift_id": shift['id'],
                    "provider_id": assigned_provider.get('id', assigned_provider.get('name', 'unknown')),
                    "provider_name": assigned_provider.get('name', assigned_provider.get('id', 'Unknown')),
                    "date": shift['date'],
                    "shift_type": shift['type'],
                    "start_time": shift['start'],
                    "end_time": shift['end']
                })
        
        # Generate summary statistics
        provider_workload = {}
        for assignment in assignments:
            provider_name = assignment['provider_name']
            provider_workload[provider_name] = provider_workload.get(provider_name, 0) + 1
        
        shift_coverage = {}
        for assignment in assignments:
            shift_type = assignment['shift_type']
            shift_coverage[shift_type] = shift_coverage.get(shift_type, 0) + 1
        
        return {
            "assignments": assignments,
            "summary": {
                "total_assignments": len(assignments),
                "provider_workload": provider_workload,
                "shift_coverage": shift_coverage,
                "total_providers": len(providers),
                "total_shifts": len(shifts),
                "total_days": len(calendar_days)
            },
            "optimization_info": {
                "solver_runtime": "2.5 seconds (simulated)",
                "objective_value": 1250.75,
                "constraints_satisfied": 95.5,
                "algorithm": "CP-SAT (Google OR-Tools)"
            }
        }

# Initialize solver
solver = SchedulingSolver()

@app.route('/solve', methods=['POST'])
def solve_schedule():
    """API endpoint for solving scheduling problems"""
    try:
        case_data = request.get_json()
        
        if not case_data:
            return jsonify({"status": "error", "message": "No case data provided"}), 400
        
        result = solver.solve(case_data)
        
        if result["status"] == "error":
            return jsonify(result), 500
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"API error: {str(e)}")
        return jsonify({
            "status": "error", 
            "message": str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "message": "Scheduling solver service is running",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/output/<run_id>', methods=['GET'])
def get_output(run_id: str):
    """Get output files for a specific run"""
    try:
        run_dir = solver.output_dir / run_id
        if not run_dir.exists():
            return jsonify({"status": "error", "message": "Run not found"}), 404
        
        files = list(run_dir.glob("*"))
        return jsonify({
            "status": "ok",
            "run_id": run_id,
            "output_directory": str(run_dir),
            "files": [f.name for f in files]
        })
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    print("Starting Medical Staff Scheduling Solver Service...")
    print("Service will be available at: http://localhost:8000")
    print("Endpoints:")
    print("  POST /solve    - Submit scheduling case for optimization")
    print("  GET  /health   - Health check")
    print("  GET  /output/<run_id> - Get output files")
    print("\nPress Ctrl+C to stop the service")
    
    app.run(
        host='0.0.0.0',  # Allow connections from web app
        port=8000,
        debug=True
    )
