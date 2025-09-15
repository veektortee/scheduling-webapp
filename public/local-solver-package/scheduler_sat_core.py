#!/usr/bin/env python3
"""
scheduler_sat_core.py - The definitive, high-performance scheduling engine.
This version correctly implements the advanced logic from testcase_gui.py, including
robust data handling, advanced constraints, solution pooling, and diversity selection.
"""
import time
import json
from ortools.sat.python import cp_model
from typing import Dict, List, Any
from collections import defaultdict
from datetime import date, datetime
import logging


HARD_INF_WEIGHT = 1_000_000_000
# --- Helper Functions ---

def get_num(d, *keys, default=0.0):
    """Safely extracts a numeric value from a nested dictionary."""
    cur = d
    for k in keys:
        if not isinstance(cur, dict) or k not in cur:
            return float(default)
        cur = cur[k]
    try:
        return float(cur) if cur is not None else float(default)
    except (TypeError, ValueError):
        return float(default)

def day_name(iso_date: str) -> str:
    """Gets the full weekday name from an ISO date string."""
    try:
        y, m, d = map(int, iso_date.split('-'))
        return date(y, m, d).strftime('%A')
    except:
        return ""

def _hamming(a: tuple, b: tuple) -> int:
    """Calculates the Hamming distance between two solution vectors."""
    return sum(1 for u, v in zip(a, b) if u != v)

def _select_diverse_k(pool, K: int, L: int, *, sense='min', relax_to: int = 0):
    """
    Greedily selects K diverse solutions from a pool.
    It prioritizes solutions with better objective values while ensuring they are at least
    L Hamming distance apart from already selected solutions.
    """
    if not pool:
        return []

    # Sort candidates by objective value
    if sense == 'min':
        pool.sort(key=lambda item: item['objective'])
    else:
        pool.sort(key=lambda item: item['objective'], reverse=True)

    selected_solutions = []
    
    # Always pick the absolute best solution first
    if pool:
        selected_solutions.append(pool.pop(0))

    # Iteratively add diverse solutions
    threshold = int(L or 0)
    while len(selected_solutions) < K and pool:
        found_one = False
        for i in range(len(pool)):
            candidate_sol = pool[i]
            is_diverse_enough = all(
                _hamming(candidate_sol['vector'], sel['vector']) >= threshold
                for sel in selected_solutions
            )
            if is_diverse_enough:
                selected_solutions.append(pool.pop(i))
                found_one = True
                break
        
        if not found_one:
            if threshold > relax_to:
                threshold -= 1  # Relax diversity constraint
            else:
                # If we can't find any more diverse solutions, fill with the best remaining
                needed = K - len(selected_solutions)
                selected_solutions.extend(pool[:needed])
                break
    
    return selected_solutions

# --- Main Solver Classes and Functions ---

class AssignmentPoolCollector(cp_model.CpSolverSolutionCallback):
    """Callback to collect a large pool of high-quality, unique solutions."""
    def __init__(self, variables, data, K=20000):
        super().__init__()
        self.variables = variables
        self.data = data
        self.solutions = []
        self._seen_vectors = set()
        self.pool_limit = K

    def on_solution_callback(self):
        if len(self.solutions) >= self.pool_limit:
            self.StopSearch()
            return
            
        vector = []
        # Create a dense vector for quick diversity checking
        for shift in self.data['shifts']:
            shift_id = shift['id']
            for provider in self.data['providers']:
                prov_name = provider['name']
                var = self.variables['assignments'].get((prov_name, shift_id))
                if var is not None and self.Value(var) > 0:
                    vector.append(1)
                else:
                    vector.append(0)
        
        vector_tuple = tuple(vector)
        if vector_tuple in self._seen_vectors:
            return # Skip duplicate solution
        
        self._seen_vectors.add(vector_tuple)
        
        # Store the full solution details
        assignments = {}
        for (prov, shift_id), var in self.variables['assignments'].items():
            if self.Value(var) > 0:
                assignments[(prov, shift_id)] = 1
                
        self.solutions.append({
            'objective': self.ObjectiveValue(),
            'assignments': assignments,
            'vector': vector_tuple
        })

def build_model(consts: Dict[str,Any], case: Dict[str,Any]) -> Dict[str,Any]:
    """Builds the complete CP-SAT model with all constraints and the objective function."""
    print("[SOLVER] Building advanced CP-SAT model...")
    model = cp_model.CpModel()
    
    days = case['calendar']['days']
    shifts = case['shifts']
    providers = case['providers']
    
    # --- Decision Variables ---
    x = {} # (provider_name, shift_id) -> BoolVar
    for p in providers:
        for s in shifts:
            # Create variable only if provider type is allowed for the shift
            if p.get('type') in s.get('allowed_provider_types', []):
                 x[(p['name'], s['id'])] = model.NewBoolVar(f"x_{p['name']}_{s['id']}")

    # --- Constraints ---
    # Each shift is covered exactly once (or is unfilled)
    for s in shifts:
        model.Add(sum(x.get((p['name'], s['id']), 0) for p in providers) <= 1)

    # Provider cannot work on a hard forbidden day
    for p in providers:
        for day_str in p.get('forbidden_days_hard', []):
            for s in shifts:
                if s['date'] == day_str:
                    model.Add(x.get((p['name'], s['id']), 0) == 0)

    # Provider can work at most one shift per day
    for p in providers:
        for day_str in days:
            shifts_on_day = [s['id'] for s in shifts if s['date'] == day_str]
            model.Add(sum(x.get((p['name'], s_id), 0) for s_id in shifts_on_day) <= 1)
    
    # Min/Max total shifts per provider
    for p in providers:
        limits = p.get('limits', {})
        min_total = limits.get('min_total', 0)
        max_total = limits.get('max_total')
        
        total_shifts_for_provider = sum(x.get((p['name'], s['id']), 0) for s in shifts)
        if min_total > 0:
            model.Add(total_shifts_for_provider >= min_total)
        if max_total is not None:
            model.Add(total_shifts_for_provider <= max_total)
            
    # Max consecutive days
    for p in providers:
        max_consec = p.get('max_consecutive_days')
        if not isinstance(max_consec, int) or max_consec <= 0:
            continue # No limit
        
        # Create daily work variables for this provider
        works_day = {i: model.NewBoolVar(f"works_{p['name']}_{i}") for i, day in enumerate(days)}
        for i, day in enumerate(days):
            shifts_on_day = [s['id'] for s in shifts if s['date'] == day]
            model.Add(works_day[i] == sum(x.get((p['name'], s_id), 0) for s_id in shifts_on_day))

        for i in range(len(days) - max_consec):
            model.Add(sum(works_day[j] for j in range(i, i + max_consec + 1)) <= max_consec)

    # --- Objective Function ---
    objective_terms = []
    
    # Penalty for not covering a shift
    uncovered_shift_penalty = int(get_num(consts, 'weights', 'hard', 'uncovered_shift', default=HARD_INF_WEIGHT))
    for s in shifts:
        is_covered = sum(x.get((p['name'], s['id']), 0) for p in providers)
        objective_terms.append((1 - is_covered) * uncovered_shift_penalty)
        
    # Penalty for working on a "prefer off" day
    prefer_off_penalty = int(get_num(consts, 'weights', 'soft', 'requested_off', default=10000))
    for p in providers:
        for day_str in p.get('forbidden_days_soft', []):
            shifts_on_day = [s['id'] for s in shifts if s['date'] == day_str]
            works_on_prefer_off = model.NewBoolVar(f"works_prefer_off_{p['name']}_{day_str}")
            model.Add(works_on_prefer_off == sum(x.get((p['name'], s_id), 0) for s_id in shifts_on_day))
            objective_terms.append(works_on_prefer_off * prefer_off_penalty)

    model.Minimize(sum(objective_terms))
    print("[MODEL] Model building complete.")

    return {
        'model': model,
        'variables': {'assignments': x},
        'data': {
            'shifts': shifts,
            'providers': providers,
            'days': days,
            'shifts_by_id': {s['id']: s for s in shifts}
        }
    }


def solve_two_phase(consts, case, ctx_placeholder, K, seed=None):
    """
    The definitive two-phase solver. It builds the model, collects a large pool of
    solutions, and then selects K diverse ones.
    """
    logging.getLogger("scheduler").info("Starting advanced two-phase optimization...")
    start_time = time.time()
    
    # The context is now built fresh inside this function
    ctx = build_model(consts, case)
    model = ctx['model']
    variables = ctx['variables']
    data = ctx['data']
    
    solver = cp_model.CpSolver()

    # Configure solver parameters from the case file
    solver_cfg = consts.get('solver', {})
    run_cfg = case.get('run', {})
    
    solver.parameters.max_time_in_seconds = float(solver_cfg.get('max_time_in_seconds', 120.0))
    solver.parameters.num_search_workers = int(solver_cfg.get('num_threads', 8))
    solver.parameters.log_search_progress = True
    if seed:
        solver.parameters.random_seed = int(seed)

    # Use the advanced collector to find a large pool of solutions
    collector = AssignmentPoolCollector(variables, data, K=20000)
    status = solver.Solve(model, collector)
    
    logging.info(f"Solver finished with status: {solver.StatusName(status)}")
    logging.info(f"Collected {len(collector.solutions)} raw solutions.")

    # Select K diverse solutions from the pool
    L = int(run_cfg.get("L", 0))
    diverse_solutions = _select_diverse_k(collector.solutions, K, L)
    logging.info(f"Selected {len(diverse_solutions)} diverse solutions (K={K}, L={L}).")
    
    # Format the final solutions for output
    output_solutions = []
    for sol_data in diverse_solutions:
        assignments = []
        for (prov_name, shift_id), val in sol_data['assignments'].items():
            if val == 1:
                shift = data['shifts_by_id'][shift_id]
                assignments.append({
                    "shift_id": shift_id,
                    "provider_name": prov_name,
                    "date": shift['date'],
                    "shift_type": shift.get('type', ''),
                    "start_time": shift.get('start', ''),
                    "end_time": shift.get('end', ''),
                })
        output_solutions.append({
            "assignments": assignments,
            "objective_value": sol_data['objective']
        })

    return {
        'status': 'completed',
        'solutions': output_solutions,
        'solver_stats': {
            'status': solver.StatusName(status),
            'objective': solver.ObjectiveValue(),
            'best_bound': solver.BestObjectiveBound(),
            'wall_time': solver.WallTime(),
            'solutions_collected': len(collector.solutions),
            'solutions_selected': len(output_solutions),
        }
    }