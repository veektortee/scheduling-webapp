#!/usr/bin/env python3
"""
Test script with realistic data to verify testcase_gui.py is being used
"""

import requests
import json

def test_realistic_solver():
    """Test with realistic data to ensure testcase_gui.py is called"""
    
    # More realistic test case based on case_oct.json
    test_data = {
        "constants": {
            "solver": {
                "max_time_in_seconds": 300,
                "phase1_fraction": 0.4,
                "relative_gap": 1e-05,
                "num_threads": 8
            },
            "weights": {
                "hard": {
                    "slack_unfilled": 20,
                    "slack_shift_less": 1,
                    "slack_shift_more": 1,
                    "slack_cant_work": 20,
                    "slack_consec": 1
                },
                "soft": {
                    "cluster": 10000,
                    "requested_off": 10000000,
                    "days_wanted_not_met": 10000000,
                    "cluster_weekend_start": 10000000,
                    "unfair_number": 5000,
                    "cluster_size": 10
                }
            },
            "objective": {
                "hard": 1,
                "soft": 1,
                "fair": 0
            }
        },
        "calendar": {
            "days": [
                "2025-10-01", "2025-10-02", "2025-10-03", "2025-10-04", "2025-10-05",
                "2025-10-06", "2025-10-07", "2025-10-08", "2025-10-09", "2025-10-10"
            ]
        },
        "shifts": [
            {"name": "MD_D", "day": 0, "type": "MD"},
            {"name": "MD_S1", "day": 0, "type": "MD"},
            {"name": "MD_N", "day": 0, "type": "MD"},
            {"name": "MD_D", "day": 1, "type": "MD"},
            {"name": "MD_S1", "day": 1, "type": "MD"},
            {"name": "MD_N", "day": 1, "type": "MD"},
            {"name": "MD_D", "day": 2, "type": "MD"},
            {"name": "MD_S1", "day": 2, "type": "MD"},
            {"name": "MD_N", "day": 2, "type": "MD"},
            {"name": "MD_D", "day": 3, "type": "MD"},
            {"name": "MD_S1", "day": 3, "type": "MD"},
            {"name": "MD_N", "day": 3, "type": "MD"}
        ],
        "providers": [
            {
                "name": "Dr. Smith",
                "type": "MD",
                "forbidden_days": [],
                "max_consecutive_days": 5,
                "requested_off": [],
                "shift_requirements": {"min": 0, "max": 10}
            },
            {
                "name": "Dr. Johnson", 
                "type": "MD",
                "forbidden_days": [1, 2],
                "max_consecutive_days": 4,
                "requested_off": [],
                "shift_requirements": {"min": 0, "max": 8}
            },
            {
                "name": "Dr. Williams",
                "type": "MD", 
                "forbidden_days": [],
                "max_consecutive_days": 6,
                "requested_off": [0],
                "shift_requirements": {"min": 0, "max": 12}
            },
            {
                "name": "Dr. Brown",
                "type": "MD",
                "forbidden_days": [],
                "max_consecutive_days": 5,
                "requested_off": [],
                "shift_requirements": {"min": 0, "max": 10}
            }
        ],
        "days": [
            "2025-10-01", "2025-10-02", "2025-10-03", "2025-10-04", "2025-10-05",
            "2025-10-06", "2025-10-07", "2025-10-08", "2025-10-09", "2025-10-10"
        ],
        "run_config": {
            "out": "RealisticTest",
            "k": 4,
            "L": 50,
            "seed": 1234,
            "time": 300
        }
    }
    
    try:
        print("🚀 Testing with realistic scheduling data...")
        print(f"📊 Shifts: {len(test_data['shifts'])}")
        print(f"👥 Providers: {len(test_data['providers'])}")  
        print(f"📅 Days: {len(test_data['days'])}")
        print()
        
        # Send request to local solver
        response = requests.post("http://localhost:8000/solve", json=test_data, timeout=120)
        
        if response.status_code == 200:
            print("✅ Local solver responded successfully!")
            result = response.json()
            
            # Check solver information
            print(f"Status: {result.get('status', 'unknown')}")
            
            if 'results' in result and 'solver_stats' in result['results']:
                stats = result['results']['solver_stats']
                print(f"Solutions found: {stats.get('total_solutions', 0)}")
                print(f"Execution time: {stats.get('execution_time_ms', 0)}ms")
                print(f"Solver status: {stats.get('status', 'unknown')}")
                print(f"Solver type: {stats.get('solver_type', 'unknown')}")
            
            # Look for signs of real solver usage
            if 'statistics' in result:
                print("\n🔍 Solver Statistics:")
                print(json.dumps(result['statistics'], indent=2))
            
            # Check if we have detailed results structure
            if 'results' in result and result['results'].get('solutions'):
                solutions = result['results']['solutions'] 
                print(f"\n📋 Solutions structure: {len(solutions)} solutions")
                
                # Real testcase_gui.py should produce complex solution data
                if solutions:
                    print("✅ Solutions found - likely using REAL testcase_gui.py!")
                    print(f"First solution keys: {list(solutions[0].keys()) if solutions else 'None'}")
                else:
                    print("⚠️  No solutions in response")
            
            print(f"\n📝 Full response structure: {list(result.keys())}")
                
        else:
            print(f"❌ Request failed with status: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    print("Testing Real Scheduler with Realistic Data...")
    print("=" * 60)
    test_realistic_solver()