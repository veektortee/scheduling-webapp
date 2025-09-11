#!/usr/bin/env python3
"""
FastAPI-based Solver Service for Medical Staff Scheduling

This high-performance service runs locally and provides WebSocket + REST API
for the Vercel-hosted web application to trigger optimization solver.

Features:
- FastAPI for maximum performance
- WebSocket for real-time progress updates
- Integrated OR-Tools solver logic from testcase_gui.py
- Background task processing for long-running optimizations
- Comprehensive error handling and logging

Usage:
    pip install fastapi uvicorn websockets python-multipart
    python fastapi_solver_service.py
    
The service will run on http://localhost:8000
"""

import json
import logging
import os
import sys
import asyncio
import uuid
from datetime import datetime, date
from pathlib import Path
from typing import Dict, Any, List, Optional
import traceback
from concurrent.futures import ThreadPoolExecutor
import threading

try:
    from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import JSONResponse, FileResponse
    from pydantic import BaseModel
    import uvicorn
except ImportError:
    print("Please install required packages:")
    print("pip install fastapi uvicorn websockets python-multipart")
    sys.exit(1)

# Import the solver logic from your existing code
try:
    # Import the core solver functions from testcase_gui.py
    from ortools.sat.python import cp_model
    import collections
    
    # We'll integrate the actual solver logic here
    print("✅ OR-Tools imported successfully")
except ImportError as e:
    print(f"❌ Failed to import OR-Tools: {e}")
    print("Please install: pip install ortools")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(name)s | %(message)s'
)
logger = logging.getLogger("scheduler-fastapi")

app = FastAPI(
    title="Medical Staff Scheduling Solver API",
    description="High-performance optimization service for medical staff scheduling",
    version="2.0.0"
)

# CORS setup for Vercel integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API
class SchedulingCase(BaseModel):
    constants: Dict[str, Any]
    calendar: Dict[str, Any]
    shifts: List[Dict[str, Any]]
    providers: List[Dict[str, Any]]
    run: Optional[Dict[str, Any]] = None

class SolverStatus(BaseModel):
    status: str
    message: str
    run_id: Optional[str] = None
    progress: Optional[float] = None
    results: Optional[Dict[str, Any]] = None

# Global state management
active_runs: Dict[str, Dict[str, Any]] = {}
websocket_connections: Dict[str, WebSocket] = {}
thread_pool = ThreadPoolExecutor(max_workers=4)

class AdvancedSchedulingSolver:
    def __init__(self):
        self.output_dir = Path("solver_output")
        self.output_dir.mkdir(exist_ok=True)
        
    async def solve_async(self, case_data: Dict[str, Any], run_id: str) -> Dict[str, Any]:
        """
        Asynchronous wrapper for the solver that integrates your OR-Tools logic
        """
        loop = asyncio.get_event_loop()
        
        # Run the CPU-intensive solver in a thread pool
        result = await loop.run_in_executor(
            thread_pool, 
            self._solve_with_ortools, 
            case_data, 
            run_id
        )
        
        return result
    
    def _solve_with_ortools(self, case_data: Dict[str, Any], run_id: str) -> Dict[str, Any]:
        """
        Integrated OR-Tools solver logic adapted from your testcase_gui.py
        """
        try:
            run_output_dir = self.output_dir / run_id
            run_output_dir.mkdir(exist_ok=True)
            
            # Save input case
            case_file = run_output_dir / "input_case.json"
            with open(case_file, 'w') as f:
                json.dump(case_data, f, indent=2)
            
            # Update progress
            self._update_progress(run_id, 10, "Initializing solver...")
            
            # Extract case components
            constants = case_data.get('constants', {})
            calendar_data = case_data.get('calendar', {})
            shifts = case_data.get('shifts', [])
            providers = case_data.get('providers', [])
            run_config = case_data.get('run', {})
            
            self._update_progress(run_id, 20, "Building optimization model...")
            
            # Build the OR-Tools model (simplified version)
            model_result = self._build_and_solve_model(
                constants, calendar_data, shifts, providers, run_config, run_id
            )
            
            self._update_progress(run_id, 90, "Generating output files...")
            
            # Save results
            result_file = run_output_dir / "results.json"
            with open(result_file, 'w') as f:
                json.dump(model_result, f, indent=2)
            
            # Generate Excel outputs (optional)
            try:
                self._generate_excel_outputs(model_result, run_output_dir)
            except Exception as e:
                logger.warning(f"Failed to generate Excel outputs: {e}")
            
            self._update_progress(run_id, 100, "Optimization completed successfully!")
            
            return {
                "status": "success",
                "run_id": run_id,
                "output_directory": str(run_output_dir),
                "result": model_result
            }
            
        except Exception as e:
            logger.error(f"Solver error for run {run_id}: {str(e)}")
            logger.error(traceback.format_exc())
            
            self._update_progress(run_id, -1, f"Error: {str(e)}")
            
            return {
                "status": "error",
                "run_id": run_id,
                "message": str(e),
                "traceback": traceback.format_exc()
            }
    
    def _build_and_solve_model(self, constants: Dict, calendar: Dict, 
                             shifts: List, providers: List, run_config: Dict, run_id: str) -> Dict[str, Any]:
        """
        Core OR-Tools optimization logic adapted from your existing solver
        """
        logger.info(f"Building CP-SAT model for run {run_id}")
        
        # Initialize CP model
        model = cp_model.CpModel()
        
        # Extract configuration
        max_time = constants.get('solver', {}).get('max_time_in_seconds', 300)
        num_threads = constants.get('solver', {}).get('num_threads', 8)
        k_solutions = run_config.get('k', 5)
        
        self._update_progress(run_id, 30, f"Creating variables for {len(shifts)} shifts and {len(providers)} providers...")
        
        # Create decision variables
        shift_assignments = {}
        for shift in shifts:
            shift_id = shift['id']
            for provider in providers:
                provider_name = provider['name']
                # Binary variable: 1 if provider is assigned to shift, 0 otherwise
                var_name = f"assign_{provider_name}_{shift_id}"
                shift_assignments[(provider_name, shift_id)] = model.NewBoolVar(var_name)
        
        self._update_progress(run_id, 40, "Adding constraints...")
        
        # Constraint 1: Each shift must be assigned to exactly one provider
        for shift in shifts:
            shift_id = shift['id']
            model.Add(
                sum(shift_assignments[(provider['name'], shift_id)] for provider in providers) == 1
            )
        
        # Constraint 2: Provider availability and forbidden days
        shifts_by_date = collections.defaultdict(list)
        for shift in shifts:
            shifts_by_date[shift['date']].append(shift)
            
        for provider in providers:
            provider_name = provider['name']
            
            # Hard OFF days (forbidden)
            for off_day in provider.get('days_off', []):
                if off_day.get('type') == 'fixed':
                    date_str = off_day['date']
                    if date_str in shifts_by_date:
                        for shift in shifts_by_date[date_str]:
                            model.Add(shift_assignments[(provider_name, shift['id'])] == 0)
        
        # Constraint 3: At most one shift per provider per day
        for provider in providers:
            provider_name = provider['name']
            for date_str, day_shifts in shifts_by_date.items():
                if len(day_shifts) > 1:
                    model.Add(
                        sum(shift_assignments[(provider_name, shift['id'])] for shift in day_shifts) <= 1
                    )
        
        self._update_progress(run_id, 60, "Setting up objective function...")
        
        # Objective: Minimize violations and maximize preferences
        objective_terms = []
        
        # Soft constraints: Preferred days
        for provider in providers:
            provider_name = provider['name']
            for pref_day in provider.get('days_on', []):
                if pref_day.get('type') == 'prefer':
                    date_str = pref_day['date']
                    if date_str in shifts_by_date:
                        # Bonus for working on preferred days
                        for shift in shifts_by_date[date_str]:
                            objective_terms.append(
                                shift_assignments[(provider_name, shift['id'])] * 100
                            )
        
        # Fairness: Try to balance workload
        provider_workloads = []
        for provider in providers:
            provider_name = provider['name']
            workload = sum(
                shift_assignments[(provider_name, shift['id'])] 
                for shift in shifts
            )
            provider_workloads.append(workload)
        
        # Add workload balancing terms (simplified)
        if provider_workloads:
            avg_workload = sum(provider_workloads) // len(provider_workloads)
            for workload in provider_workloads:
                # Penalty for being too far from average
                deviation = model.NewIntVar(-1000, 1000, 'deviation')
                model.Add(deviation == workload - avg_workload)
                abs_deviation = model.NewIntVar(0, 1000, 'abs_deviation')
                model.AddAbsEquality(abs_deviation, deviation)
                objective_terms.append(-abs_deviation)  # Minimize deviation
        
        if objective_terms:
            model.Maximize(sum(objective_terms))
        
        self._update_progress(run_id, 70, "Solving optimization model...")
        
        # Solve the model
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = max_time
        solver.parameters.num_search_workers = num_threads
        
        # Collect multiple solutions if requested
        if k_solutions > 1:
            solution_collector = SolutionCollector(shift_assignments, shifts, providers, k_solutions)
            status = solver.solve_with_solution_callback(model, solution_collector)
            solutions = solution_collector.get_solutions()
        else:
            status = solver.Solve(model)
            solutions = []
            
            if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
                # Extract single solution
                assignments = []
                for shift in shifts:
                    shift_id = shift['id']
                    for provider in providers:
                        provider_name = provider['name']
                        if solver.Value(shift_assignments[(provider_name, shift_id)]):
                            assignments.append({
                                "shift_id": shift_id,
                                "provider_name": provider_name,
                                "date": shift['date'],
                                "shift_type": shift.get('type', ''),
                                "start_time": shift.get('start', ''),
                                "end_time": shift.get('end', '')
                            })
                
                solutions.append({
                    "assignments": assignments,
                    "objective_value": solver.ObjectiveValue() if solver.ObjectiveValue() else 0
                })
        
        self._update_progress(run_id, 85, "Processing results...")
        
        # Generate statistics
        total_assignments = sum(len(sol.get('assignments', [])) for sol in solutions)
        provider_stats = collections.Counter()
        shift_type_stats = collections.Counter()
        
        for solution in solutions:
            for assignment in solution.get('assignments', []):
                provider_stats[assignment['provider_name']] += 1
                shift_type_stats[assignment['shift_type']] += 1
        
        result = {
            "solver_status": self._get_status_name(status),
            "solutions_found": len(solutions),
            "solutions": solutions,
            "statistics": {
                "total_shifts": len(shifts),
                "total_providers": len(providers),
                "total_assignments": total_assignments,
                "provider_workload": dict(provider_stats),
                "shift_type_coverage": dict(shift_type_stats),
                "runtime_seconds": solver.WallTime(),
                "objective_value": solver.ObjectiveValue() if solutions else 0
            },
            "solver_info": {
                "status": self._get_status_name(status),
                "runtime": f"{solver.WallTime():.2f} seconds",
                "num_conflicts": solver.NumConflicts(),
                "num_branches": solver.NumBranches()
            }
        }
        
        return result
    
    def _get_status_name(self, status) -> str:
        """Convert CP solver status to readable string"""
        status_names = {
            cp_model.OPTIMAL: "OPTIMAL",
            cp_model.FEASIBLE: "FEASIBLE", 
            cp_model.INFEASIBLE: "INFEASIBLE",
            cp_model.UNKNOWN: "UNKNOWN",
            cp_model.MODEL_INVALID: "MODEL_INVALID"
        }
        return status_names.get(status, f"UNKNOWN_STATUS_{status}")
    
    def _generate_excel_outputs(self, result: Dict[str, Any], output_dir: Path):
        """Generate Excel files for the solution (optional feature)"""
        try:
            from openpyxl import Workbook
            
            wb = Workbook()
            ws = wb.active
            ws.title = "Schedule"
            
            # Headers
            ws.append(["Date", "Shift Type", "Provider", "Start Time", "End Time"])
            
            # Add assignments from first solution
            if result['solutions']:
                assignments = result['solutions'][0].get('assignments', [])
                for assignment in assignments:
                    ws.append([
                        assignment['date'],
                        assignment['shift_type'],
                        assignment['provider_name'],
                        assignment['start_time'],
                        assignment['end_time']
                    ])
            
            excel_file = output_dir / "schedule.xlsx"
            wb.save(excel_file)
            logger.info(f"Generated Excel output: {excel_file}")
            
        except Exception as e:
            logger.warning(f"Failed to generate Excel: {e}")
    
    def _update_progress(self, run_id: str, progress: float, message: str):
        """Update progress and notify WebSocket clients"""
        if run_id in active_runs:
            active_runs[run_id]['progress'] = progress
            active_runs[run_id]['message'] = message
            active_runs[run_id]['updated_at'] = datetime.now().isoformat()
        
        # Notify WebSocket clients
        if run_id in websocket_connections:
            try:
                asyncio.create_task(self._send_progress_update(run_id, progress, message))
            except Exception as e:
                logger.warning(f"Failed to send WebSocket update: {e}")
        
        logger.info(f"Run {run_id}: {progress}% - {message}")
    
    async def _send_progress_update(self, run_id: str, progress: float, message: str):
        """Send progress update via WebSocket"""
        if run_id in websocket_connections:
            try:
                await websocket_connections[run_id].send_text(json.dumps({
                    "type": "progress",
                    "run_id": run_id,
                    "progress": progress,
                    "message": message,
                    "timestamp": datetime.now().isoformat()
                }))
            except Exception as e:
                logger.warning(f"WebSocket send failed: {e}")

class SolutionCollector(cp_model.CpSolverSolutionCallback):
    """Collect multiple solutions from the CP solver"""
    
    def __init__(self, shift_assignments: Dict, shifts: List, providers: List, max_solutions: int):
        cp_model.CpSolverSolutionCallback.__init__(self)
        self._shift_assignments = shift_assignments
        self._shifts = shifts
        self._providers = providers
        self._solutions = []
        self._max_solutions = max_solutions
    
    def on_solution_callback(self):
        if len(self._solutions) >= self._max_solutions:
            self.StopSearch()
            return
        
        # Extract current solution
        assignments = []
        for shift in self._shifts:
            shift_id = shift['id']
            for provider in self._providers:
                provider_name = provider['name']
                if self.Value(self._shift_assignments[(provider_name, shift_id)]):
                    assignments.append({
                        "shift_id": shift_id,
                        "provider_name": provider_name,
                        "date": shift['date'],
                        "shift_type": shift.get('type', ''),
                        "start_time": shift.get('start', ''),
                        "end_time": shift.get('end', '')
                    })
        
        self._solutions.append({
            "assignments": assignments,
            "objective_value": self.ObjectiveValue()
        })
    
    def get_solutions(self) -> List[Dict[str, Any]]:
        return self._solutions

# Initialize solver
solver = AdvancedSchedulingSolver()

# REST API Endpoints
@app.post("/solve", response_model=SolverStatus)
async def solve_schedule(case: SchedulingCase, background_tasks: BackgroundTasks):
    """Submit a scheduling case for optimization"""
    try:
        run_id = str(uuid.uuid4())
        case_dict = case.dict()
        
        # Initialize run tracking
        active_runs[run_id] = {
            "status": "started",
            "progress": 0,
            "message": "Optimization queued",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        # Start background optimization
        background_tasks.add_task(run_optimization, case_dict, run_id)
        
        return SolverStatus(
            status="started",
            message="Optimization started in background",
            run_id=run_id,
            progress=0
        )
        
    except Exception as e:
        logger.error(f"API error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def run_optimization(case_data: Dict[str, Any], run_id: str):
    """Background task for running optimization"""
    try:
        active_runs[run_id]["status"] = "running"
        result = await solver.solve_async(case_data, run_id)
        
        # Update final status
        active_runs[run_id].update({
            "status": result["status"],
            "progress": 100 if result["status"] == "success" else -1,
            "message": "Completed" if result["status"] == "success" else result.get("message", "Failed"),
            "result": result,
            "completed_at": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Background optimization failed: {e}")
        active_runs[run_id].update({
            "status": "error",
            "progress": -1,
            "message": str(e),
            "completed_at": datetime.now().isoformat()
        })

@app.get("/status/{run_id}", response_model=SolverStatus)
async def get_status(run_id: str):
    """Get status of a specific optimization run"""
    if run_id not in active_runs:
        raise HTTPException(status_code=404, detail="Run not found")
    
    run_data = active_runs[run_id]
    return SolverStatus(
        status=run_data["status"],
        message=run_data["message"],
        run_id=run_id,
        progress=run_data.get("progress", 0),
        results=run_data.get("result")
    )

@app.get("/runs")
async def list_runs():
    """List all optimization runs"""
    return {
        "runs": [
            {
                "run_id": run_id,
                "status": data["status"],
                "progress": data.get("progress", 0),
                "message": data["message"],
                "created_at": data["created_at"],
                "updated_at": data["updated_at"]
            }
            for run_id, data in active_runs.items()
        ]
    }

@app.websocket("/ws/{run_id}")
async def websocket_endpoint(websocket: WebSocket, run_id: str):
    """WebSocket for real-time progress updates"""
    await websocket.accept()
    websocket_connections[run_id] = websocket
    
    try:
        # Send initial status if run exists
        if run_id in active_runs:
            run_data = active_runs[run_id]
            await websocket.send_text(json.dumps({
                "type": "status",
                "run_id": run_id,
                "status": run_data["status"],
                "progress": run_data.get("progress", 0),
                "message": run_data["message"]
            }))
        
        # Keep connection alive and listen for client messages
        while True:
            data = await websocket.receive_text()
            # Echo back for keep-alive
            await websocket.send_text(json.dumps({
                "type": "ping",
                "message": "Connection alive"
            }))
            
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for run {run_id}")
    finally:
        if run_id in websocket_connections:
            del websocket_connections[run_id]

@app.get("/output/{run_id}")
async def get_output_files(run_id: str):
    """Get list of output files for a specific run"""
    if run_id not in active_runs:
        raise HTTPException(status_code=404, detail="Run not found")
    
    run_dir = solver.output_dir / run_id
    if not run_dir.exists():
        raise HTTPException(status_code=404, detail="Output directory not found")
    
    files = list(run_dir.glob("*"))
    return {
        "run_id": run_id,
        "output_directory": str(run_dir),
        "files": [
            {
                "name": f.name,
                "size": f.stat().st_size,
                "modified": datetime.fromtimestamp(f.stat().st_mtime).isoformat()
            }
            for f in files if f.is_file()
        ]
    }

@app.get("/download/{run_id}/{filename}")
async def download_file(run_id: str, filename: str):
    """Download a specific output file"""
    if run_id not in active_runs:
        raise HTTPException(status_code=404, detail="Run not found")
    
    file_path = solver.output_dir / run_id / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(path=file_path, filename=filename)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "FastAPI Scheduling Solver Service is running",
        "timestamp": datetime.now().isoformat(),
        "active_runs": len(active_runs),
        "websocket_connections": len(websocket_connections)
    }

@app.get("/")
async def root():
    """API information"""
    return {
        "title": "Medical Staff Scheduling Solver API",
        "version": "2.0.0",
        "description": "High-performance optimization service using FastAPI and OR-Tools",
        "endpoints": {
            "POST /solve": "Submit scheduling case for optimization",
            "GET /status/{run_id}": "Get optimization status",
            "GET /runs": "List all runs",
            "WebSocket /ws/{run_id}": "Real-time progress updates",
            "GET /output/{run_id}": "List output files",
            "GET /download/{run_id}/{filename}": "Download output file",
            "GET /health": "Health check"
        },
        "documentation": "/docs"
    }

if __name__ == "__main__":
    print("🚀 Starting Medical Staff Scheduling Solver Service (FastAPI)")
    print("📊 Service URL: http://localhost:8000")
    print("📚 API Documentation: http://localhost:8000/docs")
    print("🔌 WebSocket: ws://localhost:8000/ws/{run_id}")
    print("\n🎯 Endpoints:")
    print("  POST /solve              - Submit optimization case")
    print("  GET  /status/{run_id}    - Get run status") 
    print("  GET  /runs               - List all runs")
    print("  WebSocket /ws/{run_id}   - Real-time updates")
    print("  GET  /health             - Health check")
    print("\n⚡ Press Ctrl+C to stop the service")
    
    uvicorn.run(
        "fastapi_solver_service:app",
        host="0.0.0.0",
        port=8000,
        reload=False,  # Disable in production
        log_level="info"
    )