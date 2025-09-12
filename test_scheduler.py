#!/usr/bin/env python3
"""
Test the complete scheduler_sat.py implementation
"""
import json
import time
from local_solver import solve_scheduling_case

def test_scheduler():
    print("Testing scheduler_sat.py implementation with case_oct.json...")
    
    # Load test data
    with open('public/case_oct.json', 'r') as f:
        case_data = json.load(f)
    
    print(f"Loaded case with {len(case_data.get('shifts', []))} shifts and {len(case_data.get('providers', []))} providers")
    
    start_time = time.time()
    result = solve_scheduling_case(case_data)
    duration = time.time() - start_time
    
    print(f"\nTest completed in {duration:.2f}s")
    print(f"Status: {result.get('status', 'unknown')}")
    
    if result.get('results', {}).get('solutions'):
        solutions = result['results']['solutions']
        print(f"Solutions found: {len(solutions)}")
        
        # Check first solution
        sol = solutions[0]
        assignments = sol.get('assignments', [])
        print(f"First solution has {len(assignments)} assignments")
        print(f"Objective value: {sol.get('objective_value', 0)}")
        
        # Show solver stats
        stats = sol.get('solver_stats', {})
        if stats:
            print(f"Solver stats: {stats}")
            
        # Show some assignment examples
        print("\nFirst 5 assignments:")
        for i, assignment in enumerate(assignments[:5]):
            print(f"  {assignment}")
            
        # Summary by provider
        provider_counts = {}
        for assignment in assignments:
            provider_id = assignment['provider_id']
            provider_counts[provider_id] = provider_counts.get(provider_id, 0) + 1
            
        print(f"\nAssignments per provider:")
        for provider_id, count in sorted(provider_counts.items()):
            print(f"  Provider {provider_id}: {count} shifts")
    else:
        print("No solutions found")
        if 'error' in result:
            print(f"Error: {result['error']}")

if __name__ == "__main__":
    test_scheduler()