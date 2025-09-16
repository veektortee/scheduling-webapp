#!/usr/bin/env python3
"""
Simple test to check if basic constraints work
"""
import json
import requests

# Create a very simple test case with minimal constraints
simple_case = {
    "calendar": {
        "days": ["2025-10-01", "2025-10-02"],
        "weekend_days": ["Saturday", "Sunday"]
    },
    "shifts": [
        {
            "id": "test_shift_1",
            "date": "2025-10-01",
            "type": "MD_D",
            "start": "2025-10-01T08:00:00",
            "end": "2025-10-01T16:00:00",
            "allowed_provider_types": ["MD", "MD2"]
        },
        {
            "id": "test_shift_2", 
            "date": "2025-10-02",
            "type": "MD_D",
            "start": "2025-10-02T08:00:00",
            "end": "2025-10-02T16:00:00",
            "allowed_provider_types": ["MD", "MD2"]
        }
    ],
    "providers": [
        {
            "id": "provider_1",
            "name": "Dr. Smith",
            "type": "MD",
            "forbidden_days_hard": [],
            "forbidden_days_soft": [],
            "preferred_days_soft": [],
            "limits": {
                "shifts_per_month": 20
            },
            "max_consecutive_days": 10
        },
        {
            "id": "provider_2", 
            "name": "Dr. Jones",
            "type": "MD2",
            "forbidden_days_hard": [],
            "forbidden_days_soft": [],
            "preferred_days_soft": [],
            "limits": {
                "shifts_per_month": 20
            },
            "max_consecutive_days": 10
        }
    ],
    "run": {
        "k": 3,
        "time": 30
    }
}

print("Testing with simple case...")
print(f"Shifts: {len(simple_case['shifts'])}")
print(f"Providers: {len(simple_case['providers'])}")

try:
    response = requests.post('http://localhost:8000/solve', json=simple_case, timeout=30)
    if response.ok:
        result = response.json()
        print(f"[Done] Status: {result.get('status')}")
        print(f"Solutions: {len(result.get('results', {}).get('solutions', []))}")
        solver_stats = result.get('results', {}).get('solver_stats', {})
        print(f"Solver status: {solver_stats.get('status')}")
        
        solutions = result.get('results', {}).get('solutions', [])
        if solutions:
            print("[Done] SUCCESS! Found solutions:")
            for i, sol in enumerate(solutions):
                assignments = sol.get('assignments', [])
                print(f"  Solution {i+1}: {len(assignments)} assignments")
                for assignment in assignments[:2]:  # Show first 2
                    print(f"    - {assignment['provider_name']} -> {assignment['shift_name']}")
        else:
            print("[Error] No solutions found")
    else:
        print(f"[Error] Request failed: {response.status_code}")
        print(response.text)
        
except Exception as e:
    print(f"[Error] Error: {e}")