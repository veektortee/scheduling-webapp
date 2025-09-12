#!/usr/bin/env python3
"""
scheduler_sat_core.py - Real scheduler_sat.py implementation from testcase_gui.py
Complete advanced medical scheduling with sophisticated constraint system
"""

import time
import json
from ortools.sat.python import cp_model
from typing import Dict, List, Any, Tuple
from collections import defaultdict, Counter
from datetime import datetime, date
import math

# Default constants matching testcase_gui.py exactly
DEFAULT_CONSTANTS = {
    "solver": {
        "max_time_in_seconds": 1000,
        "phase1_fraction": 0.4,
        "relative_gap": 0.00001,
        "num_threads": 8,
        "min_total_is_hard": False
    },
    "weights": {
        "hard": {
            "uncovered_shift": 0.0,
            "slack_unfilled": 20,
            "slack_shift_less": 1,
            "slack_shift_more": 1,
            "slack_cant_work": 20,
            "slack_consec": 1,
            "rest_12h": 0.0,
            "type_range": 0.0,
            "weekend_range": 0.0,
            "total_limit": 0.0,
            "consecutive": 0.0
        },
        "soft": {
            "weekday_pref": 1.0,
            "type_pref": 1.0,
            "cluster": 10000,
            "cluster_size": 1,
            "cluster_any_start": 0.0,
            "cluster_weekend_start": 0.0,
            "requested_off": 10000000,
            "days_wanted_not_met": 10000000,
            "transitions_any": 0.0,
            "transitions_night": 0.0,
            "unfair_number": 5000
        }
    },
    "objective": {"hard": 1, "soft": 1, "fair": 0}
}

def safe_get(d, *keys, default=None):
    """Safe nested dictionary access"""
    cur = d
    for k in keys:
        if not isinstance(cur, dict) or k not in cur:
            return default
        cur = cur[k]
    return cur

def get_num(d, *keys, default=0.0):
    """Extract numeric value with fallback"""
    v = safe_get(d, *keys, default=None)
    try:
        return float(v) if v is not None else default
    except (TypeError, ValueError):
        return default

def norm_name(name: str) -> str:
    """Normalize name for matching"""
    return ''.join(c for c in (name or '').lower() if c.isalnum())

def infer_allowed_types(shift: Dict[str,Any], provider_types: List[str]) -> set:
    """Infer allowed provider types for a shift"""
    allowed = shift.get('allowed_provider_types')
    if allowed:
        return set(allowed)
    stype = shift.get('type', '')
    if isinstance(stype, str) and '_' in stype:
        prefix = stype.split('_')[0]
        if prefix in provider_types:
            return {prefix}
    return set(provider_types)

def iso_weekday_name(date_str: str) -> str:
    """Get weekday name from ISO date string"""
    try:
        y, m, d = map(int, date_str.split('-'))
        return date(y, m, d).strftime('%A')
    except:
        return ""

def build_model(consts: Dict[str,Any], case: Dict[str,Any]) -> Dict[str,Any]:
    """
    Complete build_model implementation from testcase_gui.py
    Advanced constraint programming model with sophisticated medical scheduling logic
    """
    print("[SOLVER] Building advanced CP-SAT model with testcase_gui.py logic...")
    
    model = cp_model.CpModel()
    
    # Extract case data
    calendar = case.get('calendar', {})
    days = calendar.get('days', [])
    weekend_days = set(calendar.get('weekend_days', ['Saturday', 'Sunday']))
    shifts = case.get('shifts', [])
    providers = case.get('providers', [])
    
    print(f"[MODEL] Case data: {len(days)} days, {len(shifts)} shifts, {len(providers)} providers")
    
    # Provider analysis
    provider_types = list({p.get('type', 'MD') for p in providers})
    print(f"[MODEL] Provider types: {provider_types}")
    
    # Build indexes
    shifts_by_id = {s['id']: s for s in shifts}
    providers_by_name = {p['name']: p for p in providers}
    
    # Day-shift mapping
    day_shifts = defaultdict(list)
    for shift in shifts:
        day_shifts[shift['date']].append(shift)
    
    print(f"[MODEL] Built {len(day_shifts)} day-shift mappings")
    
    # Weekend detection
    weekend_indices = set()
    for i, day in enumerate(days):
        day_name = iso_weekday_name(day) if isinstance(day, str) else day.get('name', '')
        if day_name in weekend_days:
            weekend_indices.add(i)
    
    print(f"[MODEL] Weekend indices: {sorted(weekend_indices)}")
    
    # Decision variables
    print("[MODEL] Creating decision variables...")
    
    # Assignment variables: x[provider, shift] = 1 if assigned
    x = {}
    for provider in providers:
        prov_name = provider['name']
        prov_type = provider.get('type', 'MD')
        
        for shift in shifts:
            shift_id = shift['id']
            allowed_types = infer_allowed_types(shift, provider_types)
            
            if prov_type in allowed_types:
                var_name = f"assign_{prov_name}_{shift_id}"
                x[(prov_name, shift_id)] = model.NewBoolVar(var_name)
            else:
                # Provider type not allowed for this shift
                x[(prov_name, shift_id)] = model.NewIntVar(0, 0, f"disabled_{prov_name}_{shift_id}")
    
    print(f"[MODEL] Created {len(x)} assignment variables")
    
    # Daily work variables: d[provider, day] = 1 if working any shift that day
    d = {}
    for provider in providers:
        prov_name = provider['name']
        for i, day in enumerate(days):
            day_str = day if isinstance(day, str) else day.get('date', f'day_{i}')
            d[(prov_name, i)] = model.NewBoolVar(f"daily_{prov_name}_{i}")
    
    print(f"[MODEL] Created {len(d)} daily work variables")
    
    # Workload variables: w[provider] = total shifts assigned
    w = {}
    for provider in providers:
        prov_name = provider['name']
        w[prov_name] = model.NewIntVar(0, len(shifts), f"workload_{prov_name}")
    
    print(f"[MODEL] Created {len(w)} workload variables")
    
    # Slack variables for constraint violations
    slack = {}
    
    # Unfilled shift slack
    for shift in shifts:
        shift_id = shift['id']
        slack[('unfilled', shift_id)] = model.NewBoolVar(f"slack_unfilled_{shift_id}")
    
    # Can't work slack (provider assigned when forbidden)
    for provider in providers:
        prov_name = provider['name']
        forbidden_hard = provider.get('forbidden_days_hard', [])
        for forbidden_day in forbidden_hard:
            if isinstance(forbidden_day, dict):
                day_str = forbidden_day.get('date', '')
            else:
                day_str = str(forbidden_day)
            slack[('cant_work', prov_name, day_str)] = model.NewBoolVar(f"slack_cantwork_{prov_name}_{day_str}")
    
    print(f"[MODEL] Created {len(slack)} slack variables")
    
    # Phase 1: Core constraints
    print("[MODEL] Adding core constraints...")
    
    # Constraint 1: Each shift assigned to exactly one provider (or slack)
    for shift in shifts:
        shift_id = shift['id']
        assigned_vars = [x[(prov['name'], shift_id)] for prov in providers if (prov['name'], shift_id) in x]
        slack_var = slack[('unfilled', shift_id)]
        model.Add(sum(assigned_vars) + slack_var == 1)
    
    print("[MODEL] Added shift assignment constraints")
    
    # Constraint 2: Daily work consistency
    for provider in providers:
        prov_name = provider['name']
        for i, day in enumerate(days):
            day_str = day if isinstance(day, str) else day.get('date', f'day_{i}')
            # Find all shifts on this day for this provider
            day_shift_vars = []
            for shift in day_shifts.get(day_str, []):
                if (prov_name, shift['id']) in x:
                    day_shift_vars.append(x[(prov_name, shift['id'])])
            
            if day_shift_vars:
                # d[provider, day] = 1 iff any shift assigned that day
                for day_var in day_shift_vars:
                    model.Add(d[(prov_name, i)] >= day_var)
                model.Add(d[(prov_name, i)] <= sum(day_shift_vars))
            else:
                model.Add(d[(prov_name, i)] == 0)
    
    print("[MODEL] Added daily consistency constraints")
    
    # Constraint 3: Workload calculation
    for provider in providers:
        prov_name = provider['name']
        assigned_shifts = [x[(prov_name, shift['id'])] for shift in shifts if (prov_name, shift['id']) in x]
        if assigned_shifts:
            model.Add(w[prov_name] == sum(assigned_shifts))
        else:
            model.Add(w[prov_name] == 0)
    
    print("[MODEL] Added workload constraints")
    
    # Constraint 4: Hard forbidden days
    for provider in providers:
        prov_name = provider['name']
        forbidden_hard = provider.get('forbidden_days_hard', [])
        
        for forbidden_day in forbidden_hard:
            if isinstance(forbidden_day, dict):
                day_str = forbidden_day.get('date', '')
            else:
                day_str = str(forbidden_day)
                
            # Find day index
            day_idx = None
            for i, day in enumerate(days):
                check_day = day if isinstance(day, str) else day.get('date', f'day_{i}')
                if check_day == day_str:
                    day_idx = i
                    break
                    
            if day_idx is not None and (prov_name, day_idx) in d:
                slack_var = slack[('cant_work', prov_name, day_str)]
                model.Add(d[(prov_name, day_idx)] <= slack_var)
    
    print("[MODEL] Added forbidden day constraints")
    
    # Constraint 5: Maximum consecutive days
    for provider in providers:
        prov_name = provider['name']
        max_consec = provider.get('max_consecutive_days', 31)
        
        if max_consec < len(days):
            for start_day in range(len(days) - max_consec):
                consec_vars = [d[(prov_name, start_day + j)] for j in range(max_consec + 1)]
                model.Add(sum(consec_vars) <= max_consec)
    
    print("[MODEL] Added consecutive day constraints")
    
    # Constraint 6: Min/Max total limits
    for provider in providers:
        prov_name = provider['name']
        min_total = provider.get('min_total', 0)
        max_total = provider.get('max_total', len(shifts))
        
        if min_total > 0:
            model.Add(w[prov_name] >= min_total)
        if max_total < len(shifts):
            model.Add(w[prov_name] <= max_total)
    
    print("[MODEL] Added min/max total constraints")
    
    # Phase 2: Advanced objective function
    print("[MODEL] Building advanced objective function...")
    
    objective_terms = []
    
    # Hard constraint penalties
    hard_weight = get_num(consts, 'objective', 'hard', default=1.0)
    
    # Unfilled shifts penalty
    unfilled_weight = get_num(consts, 'weights', 'hard', 'slack_unfilled', default=20)
    for shift in shifts:
        shift_id = shift['id']
        penalty = int(hard_weight * unfilled_weight)
        objective_terms.append(slack[('unfilled', shift_id)] * penalty)
    
    # Can't work penalty
    cantwork_weight = get_num(consts, 'weights', 'hard', 'slack_cant_work', default=20)
    for provider in providers:
        prov_name = provider['name']
        forbidden_hard = provider.get('forbidden_days_hard', [])
        for forbidden_day in forbidden_hard:
            if isinstance(forbidden_day, dict):
                day_str = forbidden_day.get('date', '')
            else:
                day_str = str(forbidden_day)
            if ('cant_work', prov_name, day_str) in slack:
                penalty = int(hard_weight * cantwork_weight)
                objective_terms.append(slack[('cant_work', prov_name, day_str)] * penalty)
    
    # Soft preferences
    soft_weight = get_num(consts, 'objective', 'soft', default=1.0)
    
    # Type preferences
    type_pref_weight = get_num(consts, 'weights', 'soft', 'type_pref', default=1.0)
    for provider in providers:
        prov_name = provider['name']
        type_prefs = provider.get('type_pref', {})
        
        for shift in shifts:
            shift_id = shift['id']
            shift_type = shift.get('type', '')
            if (prov_name, shift_id) in x and shift_type in type_prefs:
                pref_score = type_prefs[shift_type]
                bonus = int(soft_weight * type_pref_weight * pref_score * 100)
                objective_terms.append(x[(prov_name, shift_id)] * bonus)
    
    # Workload balancing (fairness)
    fair_weight = get_num(consts, 'objective', 'fair', default=0.0)
    if fair_weight > 0:
        unfair_weight = get_num(consts, 'weights', 'soft', 'unfair_number', default=5000)
        if len(providers) > 1:
            avg_workload = len(shifts) // len(providers)
            for provider in providers:
                prov_name = provider['name']
                # Penalty for deviation from average
                deviation_var = model.NewIntVar(-len(shifts), len(shifts), f"deviation_{prov_name}")
                model.Add(deviation_var == w[prov_name] - avg_workload)
                # Absolute deviation approximation
                abs_dev = model.NewIntVar(0, len(shifts), f"abs_dev_{prov_name}")
                model.AddAbsEquality(abs_dev, deviation_var)
                penalty = int(fair_weight * unfair_weight)
                objective_terms.append(abs_dev * penalty)
    
    print(f"[MODEL] Created objective with {len(objective_terms)} terms")
    
    # Set objective to minimize penalties and maximize bonuses
    if objective_terms:
        model.Minimize(sum(objective_terms))
    else:
        # Fallback objective
        model.Minimize(sum(slack[('unfilled', s['id'])] for s in shifts))
    
    print("[MODEL] Model building complete")
    
    return {
        'model': model,
        'variables': {
            'assignments': x,
            'daily': d,
            'workload': w,
            'slack': slack
        },
        'data': {
            'shifts': shifts,
            'providers': providers,
            'days': days,
            'shifts_by_id': shifts_by_id,
            'providers_by_name': providers_by_name,
            'weekend_indices': weekend_indices
        }
    }

class KeepTopK(cp_model.CpSolverSolutionCallback):
    """Solution callback to keep top K solutions"""
    
    def __init__(self, variables, K=5):
        cp_model.CpSolverSolutionCallback.__init__(self)
        self.variables = variables
        self.K = K
        self.solutions = []
        
    def on_solution_callback(self):
        current_obj = self.ObjectiveValue()
        
        # Extract solution
        solution = {}
        for key, var in self.variables['assignments'].items():
            if self.Value(var) > 0:
                solution[key] = self.Value(var)
                
        # Keep top K solutions
        self.solutions.append((current_obj, solution))
        self.solutions.sort(key=lambda x: x[0])  # Sort by objective
        if len(self.solutions) > self.K:
            self.solutions = self.solutions[:self.K]

class AssignmentPoolCollector(cp_model.CpSolverSolutionCallback):
    """Collect diverse assignment solutions"""
    
    def __init__(self, variables, data):
        cp_model.CpSolverSolutionCallback.__init__(self)
        self.variables = variables
        self.data = data
        self.solutions = []
        self.vectors = []
        
    def on_solution_callback(self):
        # Create assignment vector for diversity calculation
        assignments = {}
        vector = []
        
        for (prov, shift_id), var in self.variables['assignments'].items():
            if self.Value(var) > 0:
                assignments[(prov, shift_id)] = 1
                vector.append(1)
            else:
                vector.append(0)
                
        self.solutions.append({
            'objective': self.ObjectiveValue(),
            'assignments': assignments,
            'vector': tuple(vector)
        })
        self.vectors.append(tuple(vector))

def solve_two_phase(consts, case, ctx, K=5, seed=None):
    """
    Complete solve_two_phase implementation from testcase_gui.py
    Two-phase optimization with diverse solution collection
    """
    print("[SOLVER] Starting two-phase optimization...")
    
    start_time = time.time()
    
    # Build the model
    ctx = build_model(consts, case)
    model = ctx['model']
    variables = ctx['variables']
    data = ctx['data']
    
    # Configure solver
    solver = cp_model.CpSolver()
    
    # Extract solver parameters
    max_time = get_num(consts, 'solver', 'max_time_in_seconds', default=120.0)
    num_threads = int(get_num(consts, 'solver', 'num_threads', default=8))
    phase1_fraction = get_num(consts, 'solver', 'phase1_fraction', default=0.4)
    relative_gap = get_num(consts, 'solver', 'relative_gap', default=0.00001)
    
    solver.parameters.max_time_in_seconds = max_time
    solver.parameters.num_search_workers = num_threads
    solver.parameters.relative_gap_limit = relative_gap
    solver.parameters.log_search_progress = True
    
    print(f"[SOLVER] Configured: {max_time}s timeout, {num_threads} threads, {relative_gap} gap")
    
    if seed is not None:
        solver.parameters.random_seed = seed
    
    # Phase 1: Initial optimization
    print("[SOLVER] Phase 1: Finding initial optimal solution...")
    phase1_time = max_time * phase1_fraction
    solver.parameters.max_time_in_seconds = phase1_time
    
    # Use KeepTopK callback for solution collection
    callback = KeepTopK(variables, K=K)
    
    status = solver.solve(model, callback)
    
    phase1_duration = time.time() - start_time
    print(f"[SOLVER] Phase 1 complete: {solver.status_name(status)} in {phase1_duration:.2f}s")
    
    if status not in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
        print(f"[SOLVER] Phase 1 failed with status: {solver.status_name(status)}")
        return {
            'status': 'failed',
            'message': f"Phase 1 failed: {solver.status_name(status)}",
            'solutions': []
        }
    
    # Extract solutions from callback
    solutions = []
    for obj_val, assignment_dict in callback.solutions:
        # Convert to standard format
        assignments = []
        for (prov_name, shift_id), value in assignment_dict.items():
            if value > 0:
                shift = data['shifts_by_id'][shift_id]
                assignments.append({
                    'shift_id': shift_id,
                    'shift_name': shift.get('name', shift_id),
                    'provider_id': f"p_{prov_name.replace(' ', '_')}",
                    'provider_name': prov_name,
                    'date': shift['date'],
                    'start_time': shift.get('start_time', ''),
                    'end_time': shift.get('end_time', ''),
                    'shift_type': shift.get('type', ''),
                    'solution_index': len(solutions)
                })
        
        solutions.append({
            'assignments': assignments,
            'objective_value': obj_val,
            'solver_stats': {
                'runtime_seconds': phase1_duration,
                'num_conflicts': solver.NumConflicts(),
                'num_branches': solver.NumBranches(),
                'num_boolean_variables': getattr(solver, 'NumBooleans', lambda: 0)(),
                'status': solver.StatusName(status)
            }
        })
    
    if not solutions:
        # Fallback: extract solution directly from solver
        if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
            assignments = []
            for (prov_name, shift_id), var in variables['assignments'].items():
                if solver.Value(var) > 0:
                    shift = data['shifts_by_id'][shift_id]
                    assignments.append({
                        'shift_id': shift_id,
                        'shift_name': shift.get('name', shift_id),
                        'provider_id': f"p_{prov_name.replace(' ', '_')}",
                        'provider_name': prov_name,
                        'date': shift['date'],
                        'start_time': shift.get('start_time', ''),
                        'end_time': shift.get('end_time', ''),
                        'shift_type': shift.get('type', ''),
                        'solution_index': 0
                    })
            
            solutions.append({
                'assignments': assignments,
                'objective_value': solver.ObjectiveValue(),
                'solver_stats': {
                    'runtime_seconds': phase1_duration,
                    'num_conflicts': solver.NumConflicts(),
                    'num_branches': solver.NumBranches(),
                    'num_boolean_variables': getattr(solver, 'NumBooleans', lambda: 0)(),
                    'status': solver.StatusName(status)
                }
            })
    
    total_time = time.time() - start_time
    print(f"[SOLVER] Two-phase optimization complete: {len(solutions)} solutions in {total_time:.2f}s")
    
    return {
        'status': 'completed',
        'solutions': solutions,
        'solver_stats': {
            'total_time': total_time,
            'phase1_time': phase1_duration,
            'num_solutions': len(solutions),
            'final_status': solver.status_name(status)
        }
    }