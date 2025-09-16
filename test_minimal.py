import json
import requests
import time

# Create a minimal test case
minimal_case = {
    "calendar": {
        "days": ["2025-09-12", "2025-09-13"],
        "weekend_days": ["Saturday", "Sunday"]
    },
    "shifts": [
        {
            "id": "test_shift_1",
            "date": "2025-09-12",
            "type": "MD_D",
            "start": "2025-09-12T08:00:00",
            "end": "2025-09-12T16:00:00",
            "allowed_provider_types": ["MD"]
        },
        {
            "id": "test_shift_2", 
            "date": "2025-09-13",
            "type": "MD_D",
            "start": "2025-09-13T08:00:00",
            "end": "2025-09-13T16:00:00",
            "allowed_provider_types": ["MD"]
        }
    ],
    "providers": [
        {
            "id": "provider_1",
            "name": "Dr. Smith",
            "type": "MD",
            "forbidden_days_hard": [],
            "preferred_days_soft": [],
            "limits": {"shifts_per_month": 10},
            "max_consecutive_days": 5
        },
        {
            "id": "provider_2",
            "name": "Dr. Jones", 
            "type": "MD",
            "forbidden_days_hard": [],
            "preferred_days_soft": [],
            "limits": {"shifts_per_month": 10},
            "max_consecutive_days": 5
        }
    ],
    "run": {
        "k": 2,
        "time": 10
    }
}

print("Testing with minimal case...")
print("Health check...")
try:
    health = requests.get("http://localhost:8000/health", timeout=5)
    if health.ok:
        print("[Done] Health check OK")
    else:
        print(f"[Error] Health check failed: {health.status_code}")
        exit(1)
except Exception as e:
    print(f"[Error] Cannot connect: {e}")
    exit(1)

print("Testing optimization...")
try:
    response = requests.post("http://localhost:8000/solve", 
                           json=minimal_case, 
                           timeout=30)
    
    if response.ok:
        result = response.json()
        print("[Done] Optimization completed!")
        print(f"Status: {result.get('status')}")
        print(f"Message: {result.get('message')}")
        
        solutions = result.get('results', {}).get('solutions', [])
        print(f"Solutions found: {len(solutions)}")
        
        if solutions:
            print("First solution assignments:")
            for assignment in solutions[0].get('assignments', [])[:3]:
                print(f"  - {assignment.get('provider_name')} -> {assignment.get('shift_id')} on {assignment.get('date')}")
        
    else:
        print(f"[Error] Request failed: {response.status_code}")
        print(response.text)
        
except Exception as e:
    print(f"[Error] Error: {e}")