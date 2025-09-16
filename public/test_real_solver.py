#!/usr/bin/env python3
"""
Test script to verify the real scheduler_sat_core.py is working
"""

import requests
import json

def test_real_solver():
    """Test if the real scheduler_sat_core is being used"""
    
    # Minimal test case with required fields
    test_data = {
        "constants": {
            "solver": {
                "max_time_in_seconds": 300,
                "num_threads": 8
            }
        },
        "calendar": {},
        "shifts": [
            {"name": "MD_D", "day": 0, "type": "MD"},
            {"name": "MD_S1", "day": 0, "type": "MD"},
            {"name": "MD_N", "day": 0, "type": "MD"}
        ],
        "providers": [
            {"name": "Test Provider 1", "type": "MD", "forbidden_days": [], "max_consecutive_days": 5},
            {"name": "Test Provider 2", "type": "MD", "forbidden_days": [], "max_consecutive_days": 5},
            {"name": "Test Provider 3", "type": "MD", "forbidden_days": [], "max_consecutive_days": 5}
        ],
        "days": ["2025-10-01"],
        "run_config": {"out": "Test", "k": 1, "L": 10, "seed": 1234, "time": 300}
    }
    
    try:
        # Send request to local solver
        response = requests.post("http://localhost:8000/solve", json=test_data, timeout=60)
        
        if response.status_code == 200:
            print("[Done] Local solver responded successfully!")
            result = response.json()
            
            # Print full response for debugging
            print(f"Full response: {json.dumps(result, indent=2)}")
            
            # Check if it's using the real scheduler_sat_core
            print(f"Status: {result.get('status', 'unknown')}")
            print(f"Solutions found: {result.get('solutions_found', 'unknown')}")
            
            if 'solver_info' in result:
                solver_info = result['solver_info']
                print(f"Variables: {solver_info.get('variables', 'unknown')}")
                print(f"Constraints: {solver_info.get('constraints', 'unknown')}")
                
                # Real scheduler should have many more variables than fallback
                variables = solver_info.get('variables', 0)
                if isinstance(variables, int) and variables > 8000:
                    print("[Done] Using REAL scheduler_sat_core.py (high variable count)")
                    print("[Done] Advanced medical scheduling solver is active!")
                else:
                    print(f"[Warning]  Variable count ({variables}) suggests fallback solver")
                    
        else:
            print(f"[Error] Request failed with status: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"[Error] Request failed: {e}")
    except Exception as e:
        print(f"[Error] Unexpected error: {e}")

if __name__ == "__main__":
    print("Testing Real Scheduler Implementation...")
    print("=" * 50)
    test_real_solver()