#!/usr/bin/env python3
"""
Test script to verify webapp local solver uses real scheduler_sat_core
"""
import json
import requests
import time

def test_webapp_solver():
    print("Testing webapp local solver...")
    
    # Load test case
    with open('public/case_oct.json', 'r', encoding='utf-8') as f:
        case_data = json.load(f)
    
    print(f"Loaded case: {len(case_data['shifts'])} shifts, {len(case_data['providers'])} providers")
    
    # Send request to local solver
    url = "http://localhost:8000/solve"
    
    payload = {
        **case_data,
        "run": {"k": 3, "time": 60}  # Short test
    }
    
    print("Sending request to webapp local solver...")
    start_time = time.time()
    
    try:
        response = requests.post(url, json=payload, timeout=120)
        execution_time = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            print(f"\nSUCCESS! Response received in {execution_time:.2f}s")
            print(f"Status: {result.get('status')}")
            print(f"Solutions found: {len(result.get('results', {}).get('solutions', []))}")
            
            # Check solver type
            solver_stats = result.get('results', {}).get('solver_stats', {})
            algorithm = solver_stats.get('algorithm', 'unknown')
            solver_type = solver_stats.get('solver_type', 'unknown')
            
            print(f"Solver type: {solver_type}")
            print(f"Algorithm: {algorithm}")
            
            # Check if it's using real scheduler_sat_core
            if 'real_scheduler_sat_core' in solver_type or 'testcase_gui.py' in algorithm:
                print("\n✅ SUCCESS: Webapp is using REAL scheduler_sat_core implementation!")
            else:
                print("\n❌ FAILED: Webapp is still using fallback solver")
                
            # Show first solution stats if available
            solutions = result.get('results', {}).get('solutions', [])
            if solutions:
                first_sol = solutions[0]
                print(f"First solution objective: {first_sol.get('objective_value', 'N/A')}")
                print(f"Assignments: {len(first_sol.get('assignments', []))}")
        else:
            print(f"ERROR: HTTP {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_webapp_solver()