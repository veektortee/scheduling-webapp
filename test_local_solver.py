#!/usr/bin/env python3
"""
Test script for the improved local solver
"""
import json
import requests
import time

# Load the test case data
with open('public/case_oct.json', 'r') as f:
    case_data = json.load(f)

print("Testing improved local solver...")
print(f"Case data: {len(case_data.get('shifts', []))} shifts, {len(case_data.get('providers', []))} providers")

# Test health endpoint first
try:
    health_response = requests.get('http://localhost:8000/health')
    if health_response.ok:
        print("[Done] Local solver health check: OK")
        print(json.dumps(health_response.json(), indent=2))
    else:
        print("[Error] Health check failed")
        exit(1)
except Exception as e:
    print(f"[Error] Cannot connect to local solver: {e}")
    exit(1)

# Test optimization
print("\n" + "="*60)
print("TESTING OPTIMIZATION")
print("="*60)

start_time = time.time()
try:
    solve_response = requests.post('http://localhost:8000/solve', 
                                  json=case_data,
                                  timeout=60)
    
    if solve_response.ok:
        result = solve_response.json()
        execution_time = time.time() - start_time
        
        print(f"[Done] Optimization completed in {execution_time:.2f}s")
        print(f"Status: {result.get('status', 'unknown')}")
        print(f"Message: {result.get('message', '')}")
        
        results = result.get('results', {})
        solutions = results.get('solutions', [])
        solver_stats = results.get('solver_stats', {})
        
        print(f"Solutions found: {len(solutions)}")
        print(f"Solver status: {solver_stats.get('status', 'unknown')}")
        print(f"Solver type: {solver_stats.get('solver_type', 'unknown')}")
        print(f"Algorithm: {solver_stats.get('algorithm', 'unknown')}")
        
        if solutions:
            print(f"\nFirst solution preview:")
            first_solution = solutions[0]
            assignments = first_solution.get('assignments', [])
            print(f"  - Solution ID: {first_solution.get('solution_id', 'N/A')}")
            print(f"  - Assignments: {len(assignments)}")
            print(f"  - Objective value: {first_solution.get('objective_value', 'N/A')}")
            print(f"  - Feasible: {first_solution.get('feasible', 'N/A')}")
            
            if assignments:
                print(f"  - Sample assignments:")
                for i, assignment in enumerate(assignments[:3]):
                    print(f"    {i+1}. {assignment.get('provider_name', 'N/A')} -> {assignment.get('shift_name', 'N/A')} on {assignment.get('date', 'N/A')}")
        
        print("\n" + "="*60)
        print("TEST COMPLETED SUCCESSFULLY!")
        print("="*60)
        
    else:
        print(f"[Error] Optimization failed: {solve_response.status_code}")
        print(solve_response.text)
        
except Exception as e:
    print(f"[Error] Optimization error: {e}")