import json
import uuid
from pathlib import Path
import sys

# Import the service class
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'public' / 'local-solver-package'))
try:
    from fastapi_solver_service import AdvancedSchedulingSolver
except Exception as e:
    print('Failed to import AdvancedSchedulingSolver:', e)
    raise

# Load raw payload
raw_path = Path('run_tmp') / 'pre_bridge_payload.json'
if not raw_path.exists():
    print('No payload at', raw_path)
    raise SystemExit(1)

with open(raw_path, 'r', encoding='utf-8') as f:
    case = json.load(f)

solver = AdvancedSchedulingSolver()

print('Before sanitize calendar.days =', case.get('calendar', {}).get('days'))

# Run sanitizer
san = solver._sanitize_calendar(case.get('calendar', {}))
case['calendar'] = san

# Ensure shifts present
case['calendar'] = solver._ensure_shifts_in_calendar(case.get('calendar', {}), case.get('shifts', []))

run_id = str(uuid.uuid4())
run_dir = Path('public') / 'local-solver-package' / 'solver_output' / run_id
run_dir.mkdir(parents=True, exist_ok=True)

out_file = run_dir / 'input_case.json'
with open(out_file, 'w', encoding='utf-8') as f:
    json.dump(case, f, indent=2)

print('Wrote sanitized input_case.json to', out_file)
print('After sanitize calendar.days =', case.get('calendar', {}).get('days'))
