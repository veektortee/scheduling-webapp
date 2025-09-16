#!/usr/bin/env python3
"""Test import of scheduler_sat_core from public directory"""
import sys
import os

# Add current directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

print("Testing scheduler_sat_core import...")
print(f"Current directory: {current_dir}")
print(f"Python path includes: {sys.path[:3]}...")

try:
    from scheduler_sat_core import solve_two_phase, DEFAULT_CONSTANTS
    print("[Done] SUCCESS: Successfully imported scheduler_sat_core!")
    print(f"DEFAULT_CONSTANTS keys: {list(DEFAULT_CONSTANTS.keys())}")
    print(f"solve_two_phase function: {solve_two_phase}")
except ImportError as e:
    print(f"[Error] IMPORT ERROR: {e}")
    print("Available files in current directory:")
    for f in os.listdir(current_dir):
        if f.endswith('.py'):
            print(f"  - {f}")
except Exception as e:
    print(f"[Error] OTHER ERROR: {e}")