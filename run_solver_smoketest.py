import traceback
from fastapi_solver_service import AdvancedSchedulingSolver

try:
    solver = AdvancedSchedulingSolver()

    # Minimal synthetic case matching the logs: 30 days, 5 shifts, 2 providers
    shifts = []
    for i in range(5):
        shifts.append({
            'id': f's{i}',
            'date': f'2025-09-{10+i:02d}',
            'type': 'A',
            'start': '08:00',
            'end': '16:00'
        })

    providers = [
        {'name': 'Prov1', 'type': 'MD', 'max_consecutive_days':12},
        {'name': 'Prov2', 'type': 'Staff', 'max_consecutive_days':1000}
    ]

    case = {'constants': {}, 'calendar': {'days': [f'2025-09-{10+i:02d}' for i in range(30)]}, 'shifts': shifts, 'providers': providers, 'run': {'k':1, 'seed':1}}

    res = solver._build_and_solve_model(case['constants'], case['calendar'], case['shifts'], case['providers'], case['run'], 'test-run')

    print('Status:', res.get('solver_status'))
    print('Solutions found:', res.get('solutions_found'))
    print('Statistics keys:', list(res.get('statistics', {}).keys()))

except Exception as e:
    print('Exception during smoke test:')
    traceback.print_exc()
